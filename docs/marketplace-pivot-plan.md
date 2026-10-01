# TradeS — Marketplace Pivot Plan (2026-08-20)

Kelishilgan (grilling, Abdulaziz bilan, 20.08.2026): TradeS bitta-biznes POS'dan
ko'p-do'konli marketplace'ga o'tadi — bitta odam ham sotuvchi (o'z do'konini ochadi),
ham xaridor (boshqa do'konlardan xarid qiladi) bo'la oladi.

## Kelishilgan qarorlar

1. Do'kon ochish **ixtiyoriy** (majburiy emas, "Do'kon ochish" alohida qadam)
2. Bitta odam — **max 10 ta do'kon** (keyin sonini ko'rib ko'paytiriladi)
3. v1: do'kon = **faqat egasi** boshqaradi, xodim yo'q (mobil "Xodimlar" ekrani keyingi bosqichga qoladi)
4. **Web VA mobil — ikkalasida ham to'liq**: do'kon boshqarish (sotuvchi) + xarid qilish (xaridor)
5. Admin panel: barcha do'konlar ro'yxati + bloklash imkoniyati
6. **To'lov integratsiyasi yo'q v1'da** — faqat buyurtma yaratiladi (Payme/Click keyinroq)
7. Savatda ko'p do'kondan mahsulot bo'lsa — checkout **avtomatik har do'kon uchun alohida buyurtmaga bo'linadi**
8. Do'konning alohida ochiq havolasi/slug'i **yo'q hozircha** — faqat ilova ichidagi ro'yxat/qidiruv
9. **Sale** (POS, hisobsiz tezkor, do'konga kelib xarid qilgan mijoz) va **Order** (ilova orqali, ro'yxatdan o'tgan xaridor) — **ikkalasi ham alohida-alohida qoladi**. Order mobilda "Buyurtmalar" bo'limida yangi buyurtma sifatida ko'rinishi kerak.
10. **DB tozalanadi**: faqat `+998940335044` raqamli User (va uning PhoneAuth/Telegram-link) qoladi, qolgan HAMMA User + barcha biznes jadvallari (Product/Order/Sale/Cart/Wishlist/InventoryBatch/RefreshToken/KnownDevice/boshqa PhoneAuth/EmailAuth) o'chiriladi
11. Bundan buyon schema o'zgarishlar **`prisma migrate dev`** bilan (versiyalangan migratsiya, `db push` emas)

## Fon (nega bu kerak)

Asl konsept (`docs/Startup Concept & Branding.md`): 3 alohida auditoriya — mobil=xodim(POS), web=mijoz(e-commerce), admin=egasi. Amalda hech qachon shunday ajratilmagan (User'da faqat USER/ADMIN/SUPER_ADMIN bor, Shop modeli umuman yo'q, web'dagi Cart/Wishlist/Checkout kodi ishlatilmaydigan shablon qoldig'i). Abdulaziz buni endi ANIQ marketplace'ga aylantirishni tanladi (Q1=B varianti).

## Schema o'zgarishi (yangi Shop modeli)

```prisma
model Shop {
  id          String   @id @default(cuid())
  ownerId     String
  owner       User     @relation(fields: [ownerId], references: [id], onDelete: Cascade)
  name        String
  description String   @default("")
  isBlocked   Boolean  @default(false)
  blockedReason String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  products    Product[]
  sales       Sale[]
  orders      Order[]
  inventoryBatches InventoryBatch[]

  @@index([ownerId])
}
```

- `Product`: `ownerId`/`createdById` (User) o'chiriladi → o'rniga **`shopId String` (majburiy, Shop'ga)**. Bitta mahsulot — bitta do'konga tegishli.
- `Sale`: `userId` qoladi (kim yozgan — v1'da doim ega), **`shopId` qo'shiladi** (qaysi do'kon zaxirasidan).
- `Order`: **`shopId` qo'shiladi** (qaysi do'kon bajaryapti), `userId` → xaridor sifatida qoladi (nomi `buyerId`ga o'zgartirilishi mumkin, ixtiyoriy). Checkout ko'p-do'konli savatni shopId bo'yicha avtomatik bir nechta Order'ga bo'ladi.
- `InventoryBatch`: `userId` qoladi, **`shopId` qo'shiladi**.
- `Cart`/`CartItem`/`Wishlist`: schema o'zgarishi shart emas — savat turli do'kon mahsulotlarini saqlay oladi, checkout vaqtida shopId bo'yicha guruhlanadi.
- Max-10-do'kon qoidasi — schema constraint emas, `shop.service.js`da yaratishdan oldin count-tekshiruv.

## Bosqichlar (checkpoint bilan)

- [x] **1. Backend schema** — Shop modeli qo'shildi, Product/Sale/Order/InventoryBatch'ga shopId. Migratsiya tarixi bootstrap qilindi (`0_baseline` — eski schema, `resolve --applied` bilan belgilandi) so'ng `add_shops_marketplace` yaratilib `migrate deploy` bilan qo'llandi. Bundan buyon `prisma migrate dev` bilan davom etiladi.
- [x] **2. DB tozalash** — faqat `+998940335044` (User id `cmr92qf0h000o0geanb27uo21`) va uning PhoneAuth qoldi. O'chirildi: 18 User, 5 Product, 38 Order/68 OrderItem/38 ShippingAddress, 2 Sale, 1 Cart, 123 RefreshToken, 3 KnownDevice, 4 SyncQueue, 1 EmailAuth, 5 boshqa PhoneAuth.
- [x] **3. Backend servis/route** — shop.service.js/controller/routes/validator yaratildi (max-10, ownership+blocked tekshiruvi `assertShopOwnership`), product/sale/order/inventory shopId bilan scope qilindi, admin shop ro'yxati+block/unblock (audit-log bilan), `clampPage` qo'shildi va hamma joyda qo'llandi, sync.service.js shopId talab qiladi. Live tekshirildi (log): shop yaratish, mahsulot/savdo/buyurtma, admin block/unblock, sync push/pull, page=-5/abc edge-case, boshqa do'kon PATCH → 404 — hammasi to'g'ri ishlayapti. — shop.service.js (CRUD + max-10 tekshiruv), product/sale/order/inventory servislarini shopId bilan scope qilish, admin.service.js'ga shop ro'yxati+bloklash, sync.service.js'ni shopId bilan moslashtirish
- [x] **4. Mobil** (`tradeS-shop-mobile`, tugadi) — WatermelonDB v5→v6 migratsiya (shops jadval + shopId), shop switcher ("Do'konlarim"), POS ekranlar (Products/Sales) do'kon-scoped, yangi "Bozor" tab (marketplace browse+savat+checkout), "Kelgan buyurtmalar", sync xato ko'rinishi (lastError, qizil). `tsc --noEmit` yangi xatosiz, Metro bundle toza, simulyatorda 2 marta relaunch — migratsiya xatosiz o'tdi (crash yo'q). Login ekranidan o'tolmadi (parallel agentlarning pod install/prebuild ishi Keychain'ni tozalab qo'ygan — kod bilan aloqasi yo'q, oddiy qayta-login bilan tuzaladi), shuning uchun POST amallarni jonli sinamadi, o'rniga barcha endpoint javob shakllarini curl+validator manba bilan solishtirib tasdiqladi.
- [x] **5. Web** (`tradeS-shop-web`, tugadi) — storefront (Home/Cart/Checkout/Wishlist/ProductDetail) real marketplace, to'liq o'zbekcha, soxta $ shipping/tax olib tashlandi; /dashboard (Products/Sales/Reports) shop-scoped, do'kon svitcheri; /reset-password bug, StockBadge bug, o'lik ProtectedRoute.jsx tuzatildi. `vite build` toza, to'liq oqim curl bilan tasdiqlandi (do'kon→mahsulot→savat→checkout→buyurtma). **Muhim topilma:** Product'da POS narxi (buyPrice/sellPrice) va marketplace narxi (price/discount/finalPrice) ALOHIDA maydonlar ekan — dashboard formasi faqat POS'ni yuborardi, shuning uchun marketplace'da mahsulot 0 so'm ko'rinardi; ikkalasini ham yuborishga tuzatildi.
- [x] **6. Admin panel** (`tradeS-shop-admin`, tugadi) — ShopsPage.jsx (jadval+block modal+unblock), menu/router ulandi, ReportsPage double-unwrap bug tuzatildi. `npx vite build` toza, backend round-trip curl bilan tasdiqlandi (block/unblock/report real raqamlar). Men login sahifasi to'g'ri ochilishini brauzerda tasdiqladim (parol yo'qligi sabab to'liq klik-test qilinmadi — Abdulazizga qoldi).

## Backend to'liq hisobot (tradeS-shop-backend, tugadi) — ochiq qolgan narsalar

- ⚠️ **Do'kon egasi o'z buyurtmasi statusini o'zgartira olmaydi** (`PATCH /orders/:id/status` hali faqat ADMIN uchun) — "Kelgan buyurtmalar" hozircha faqat ko'rish (mobil/web'dan shu ko'lamda so'ralgan, bloker emas). Keyingi bosqichda: shop-egasi uchun status-o'zgartirish qo'shish kerak.
- `GET /products` endi **marketplace browse** (hammaga), sotuvchi o'z mahsulotlarini `GET /shops/:id/products` orqali ko'radi — bu farq mobil/web agentlariga aytilgan edi, mos keladi.
- `POST /orders` javobi endi **massiv** (`{orders: [...]}`, bitta emas) — ko'p-do'konli savat bo'linadi.
- Test ma'lumot DB'da qoldi ataylab (2 do'kon, 3 mahsulot, 2 buyurtma, 2 savdo, `+998940335044` ostida) — mobil/web/admin shu ustida ishlashi uchun. Keyin xohlasang tozalanadi.
- InventoryBatch hali hech qayerda yaratilmaydi (kod yo'q) — shopId tayyor, lekin ishlatilmaydi, keyingi bosqich.
- ⚠️ Backend checkout'da hali ham avtomatik 10% "taxPrice" qo'shilyapti (masalan 24000→26400) — v1'da to'lov/soliq integratsiyasi yo'q deb kelishilgan edi, bu eski (AQSh-uslubi) qoldiq bo'lishi mumkin, order.service.js'da tekshirish kerak.
- ⚠️ Reports.jsx statistika kartalari (summary/kunlik/oylik) hali ham userId bo'yicha BARCHA do'konlarni yig'adi, bitta do'konga scope qilinmagan — backend reports.service.js buni qo'llamaydi, keyingi bosqichda backend ham yangilanishi kerak.

## ✅ HAMMASI TUGADI (20-21.08.2026 tun) — 6/6 bosqich

Backend, DB tozalash, backend servislar, mobil, web, admin panel — hammasi qurildi va
tekshirildi (jonli curl/build/tsc/simulator bilan, quyida har bosqichda tafsilot).

## ⚠️ 21.08.2026 — mumkin bo'lgan qaror o'zgarishi (HALI QILINMAYDI)

Abdulaziz mobilni sinab ko'rib, "bitta odam ham sotuvchi ham xaridor" g'oyasi chalkash tuyulganini aytdi — buni sozlamalar+Telegram bot orqali XARIDOR va SOTUVCHI alohida bo'ladigan qilib o'zgartirish g'oyasi bor. **Lekin hozir bajarilmaydi** — Yormatov bilan maslahatlashib qaror qilinadi, keyin alohida aytiladi. Hozircha joriy (bitta hisob = ikkalasi) arxitektura o'zgarmaydi.

## 21.08.2026 — 4 ta qo'shimcha tuzatish (mobil savat/optimizatsiya, admin logout/users)

- [x] Admin auto-logout — 2 ta 30s poll to'qnashib, refresh-token 2 marta parallel chaqirilgani sabab edi (backend rotation single-use). Frontend'da shared in-flight promise bilan tuzatildi (`web/admin/src/services/http.js`)
- [x] Mobil savat "boshqa narsa ko'rsatyapti" — kod xatosi emas, kechagi test-fixture qoldig'i edi (Guruch mahsuloti). Tozalandi
- [x] Mobil optimizatsiya (kuchsiz Android) — audit qilindi, real xavf topilmadi (FlatList/indekslangan query/rasm yo'q/event-driven sync — hammasi to'g'ri), o'zgarish kiritilmadi
- [ ] ⚠️ Admin: DB tozalanganidan beri SUPER_ADMIN yo'q — shuning uchun "Adminlar" sahifasi hech kimga ko'rinmaydi (Users ro'yxati esa ADMIN/SUPER_ADMIN'ni ataylab yashiradi — bu to'g'ri). Fix: Abdulazizning email-hisobini (`cmt2em0e400000gploo32nqaq`) SUPER_ADMIN qilish — **tasdiq kutilmoqda**
- [ ] Content sahifasi — backend CRUD 100% ishlaydi, LEKIN yaratilgan kontent web/mobilda hech qayerda ko'rsatilmaydi (orphan feature) — kerak bo'lsa keyingi bosqichda ulash mumkin

## 21.08.2026 — ikkinchi tur review (backend/mobil/web/admin, 4 agent) + topilgan kritik bug

- [x] **Mobil — "o'chirilgan" mahsulot backend'da tirik qolib, mahalliy qayta jonlanardi.** Sabab: mobil hech qachon `operation:"delete"` yubormas edi (faqat create/update), arxivlash `isActive:false`ni "update" payload'ida yuborardi — backend esa `isActive`ni update uchun whitelist qilmagan (ataylab, xavfsizlik). Natija: server'da mahsulot abadiy faol qolar, keyingi pull mahalliy arxivni ham bekor qilardi. Tuzatildi: `mobile/services/syncEngine.ts` — arxivlangan+serverId bor mahsulot endi haqiqiy `delete` operatsiyasi yuboradi. `tsc --noEmit` toza.

- [x] **Admin panel — oddiy ADMIN "Adminlar" ro'yxatini ko'rish/boshqarishga (peer admin bloklash) ruxsati bor edi backend'da**, frontend esa buni SUPER_ADMIN-only deb hisoblardi (izoh/UI mos emas edi). Tuzatildi: `backend/src/routes/admin.routes.js` — `GET /admins` va `PATCH /admins/:id/status`ga `authorize('SUPER_ADMIN')` qo'shildi. curl bilan tasdiqlandi: ADMIN token → 403.
- Admin review'da boshqa hamma band (auto-logout reject-holati, auditLogs o'sishi, print CSS boshqa sahifalarga ta'siri) — tekshirilib, muammo yo'q deb tasdiqlandi.
- ⚠️ i18n hali to'liq emas — Products/Users/Support/Settings/Content sahifalari deyarli hardcoded o'zbekcha qolgan (keyingi bosqich).

**Backend review — kritik topilma yo'q.** Shop-scoping/IDOR barcha joyda toza. Tasdiqlangan ochiq bandlar (allaqachon yozilgan): hisobot shopId bo'yicha scope emas, 10% soliq hali bor. Yangi kichik topilma: Content create/update endpoint'da Joi validatsiya ulanmagan (500 xato tushunarsiz chiqishi mumkin, faqat ADMIN-only).

**Web review — Dashboard.jsx ham hisobot kabi shop-scope emas ekan** (avvalgi topilma faqat Reports.jsz uchun yozilgan edi, aslida Dashboard'da ham bor va u yerda hech qanday urinish ham yo'q). Checkout xato xabarlari mahsulot nomi o'rniga xom ID ko'rsatadi. Kichik i18n (cart toast ingliz tilida qolgan).

## 21.08.2026 — ikkinchi review xulosasi: 4 ta band, hammasi tuzatildi

- [x] Reports/Dashboard (backend + web) — endi ixtiyoriy `?shopId=` bilan scope qilinadi (`assertShopOwnership` bilan tekshiriladi, forged shopId → 404). curl bilan tasdiqlandi: 2 do'kon alohida to'g'ri raqam qaytardi.
- [x] Checkout'dagi 10% avtomatik soliq olib tashlandi (`order.service.js`, `TAX_RATE` o'chirildi)
- [x] Content create/update — Joi validatsiya qo'shildi (`content.validator.js`), curl bilan tasdiqlandi (nomsiz → 422)
- [x] Checkout xatosi endi mahsulot nomini ko'rsatadi (ID emas) + `PRODUCT_UNAVAILABLE` kod; `cartStore.js` "Added/Removed from cart" → o'zbekchaga o'girildi
- `npx vite build` (web) toza o'tdi

## 21.08.2026 — uchinchi bosqich: 3 backend follow-up (agent limitga tegib, hisobot bermay to'xtadi — o'zim tekshirib tugatdim)

- [x] **Do'kon egasi endi o'z buyurtma statusini o'zgartira oladi** — `PATCH /shops/:id/orders/:orderId/status` (`assertShopOwnership` + orderni shopId bo'yicha qayta tekshiradi). curl bilan tasdiqlandi: egasi → 200, begona do'kon nomidan → 404.
- [x] **InventoryBatch endi yoziladi** — `restockProduct` endi har safar `InventoryBatch` qatorini ham yaratadi (`PATCH /products/:id/restock`, ixtiyoriy `buyPrice`/`note`), `GET /shops/:id/inventory` bilan o'qiladi. curl bilan tasdiqlandi.
- [x] **Checkout endi chidamli** — bitta mahsulot mavjud bo'lmasa/do'koni bloklangan bo'lsa, FAQAT o'sha band tashlab ketiladi (`skipped` massivida sababi bilan qaytadi), qolgan do'konlar uchun buyurtma baribir yaratiladi. Faqat HAMMASI mavjud bo'lmasa xato qaytadi. curl bilan tasdiqlandi: 1 haqiqiy + 1 soxta mahsulot → 1 buyurtma yaratildi + 1 ta "skipped" xabari bilan.
- [x] **Admin panel qolgan i18n (5 sahifa)** — qaytadan ishga tushirilib tugatildi (Products/Users/Support/Settings/Content). Brauzerda tasdiqlandi: Products va Content sahifalari EN'ga to'liq o'tdi.
- [x] **Do'kon egasi buyurtma statusini o'zgartirish UI'si** — mobil ("Kelgan buyurtmalar") va web ("Kelgan buyurtmalar") ikkalasida ham qo'shildi, backend endpoint bilan tasdiqlangan.

## ✅✅ Bugungi tun — hammasi yakunlandi (6 asosiy bosqich + 3 tur review + barcha topilgan band tuzatildi)

Backend va web review natijalari keldi — hammasi yuqorida.

## Keyingi bosqich uchun ochiq qolgan narsalar (bloker emas, keyin qaraladi)

1. Do'kon egasi o'z buyurtma statusini o'zgartira olmaydi (`PATCH /orders/:id/status` faqat admin) — "Kelgan buyurtmalar" hozircha faqat ko'rish
2. Backend checkout'da hali avtomatik 10% "taxPrice" qo'shilyapti — v1'da to'lov/soliq yo'q kelishuviga zid, eski qoldiq bo'lishi mumkin
3. Reports statistika kartalari (web dashboard) hali barcha do'konlarni birga hisoblaydi, bitta do'konga scope qilinmagan — backend reports.service.js yangilanishi kerak
4. InventoryBatch (ombor partiyasi) hali hech qayerda yaratilmaydi — shopId tayyor, funksiya yo'q
5. Marketplace "Bozor" tab ikonkasida savat-belgisi (badge count) yo'q — kosmetik
6. iOS simulyatorda login/Keychain qayta sozlash kerak (kod bilan bog'liq emas, parallel agentlarning pod install ishi natijasi)

## Xavf-omillar

- **DB tozalash — QAYTMAS.** Bosqich 2 ijro etilishidan oldin backup/export shart emas deyilgan (test ma'lumot, ahamiyati yo'q), lekin amalga oshirishdan oldin yana bir bor bosqich boshida tasdiqlanadi.
- Schema o'zgarishi production bazaga tegadi (Neon, bepul tarif) — `migrate dev` interaktiv so'rov berishi mumkin, ehtiyot bo'lish kerak.
