# DONE — Savdo Mobile

> Yangilangan: 2026-05-03

---

## ✅ Bajarilgan tasklar (2026-05-03 sessiya)

### Task 10 — Chek havola (base64, backend siz)
- `generateReceiptLink()` → `btoa(unescape(encodeURIComponent(...)))` bilan `savdo.uz/r/{base64}`
- Natija ekranida "Havolani ulashish" tugma (Share.share)
- **Fayl**: `mobile/app/(app)/sales/add.tsx`

### Task 13 — Xodim PIN login flow
- `roleStore` ga `setPIN()`, `verifyPIN()`, `hasPIN()` qo'shildi
- `mobile/app/(auth)/pin.tsx` — 4 raqam numpad, xato bo'lganda qizil shake
- `(auth)/_layout.tsx` ga `pin` screen qo'shildi
- Settings: Kassir rejimiga o'tish = to'g'ri; Admin rejimiga qaytish = PIN ekrani
- Settings: "PIN o'rnatish" → inline modal (4 raqam); default PIN: 0000
- **Fayl**: `mobile/store/roleStore.ts`, `mobile/app/(auth)/pin.tsx`, `mobile/app/(app)/settings/index.tsx`

### Task 15 — Barcode skaner to'liq integratsiya
- DB schema v3 → v4: `barcode` ustuni `products` jadvaliga qo'shildi
- Migration v4 qo'shildi (`addColumns` → barcode isOptional string)
- `Product` modeli: `@field("barcode") declare barcode: string | null`
- `products/add.tsx`: scan → `barcode` state ga (avval `name` ga yozardi), UI field + scan tugma + clear tugma
- `products/[id].tsx`: barcode ko'rsatish, tahrirlash, saqlash
- `sales/add.tsx`: `p.barcode === code` bo'yicha qidiradi (avval `p.serverId`)
- **Fayl**: `db/schema.ts`, `db/migrations.ts`, `db/models/Product.ts`, `products/add.tsx`, `products/[id].tsx`, `sales/add.tsx`

---

## ✅ Bajarilgan tasklar (2026-05-02 sessiya)

### Task 1 — Mahsulot o'chirish
- `destroyPermanently()` bilan haqiqiy o'chirish, tasdiqlash dialog
- Mahsulot detail da pastda qizil "O'chirish" tugma
- **Fayl**: `mobile/app/(app)/products/[id].tsx`

### Task 2 — CSV / JSON export
- CSV export tuzatildi (BOM, escape, UTI, null cacheDirectory check)
- JSON export qo'shildi, format tanlash dialog
- **Fayl**: `mobile/app/(app)/reports/index.tsx`

### Task 3 — Chek ulashish
- `Share.share()` API — universal, fayl yo'q
- **Fayl**: `mobile/app/(app)/sales/add.tsx`

### Task 4 — Stok overflow ogohlantirish
- Qizil border + ogohlantirish satri + tasdiqlash dialog
- **Fayl**: `mobile/app/(app)/sales/add.tsx`

### Task 5 — Mahsulotlar ro'yxatida stok indikator
- Rangli badge: 🔴 0 ta / 🟡 1–5 ta / 🟢 6+ ta
- **Fayl**: `mobile/app/(app)/products/index.tsx`

### Task 6 — Mahsulot detail statistika
- Jami sotuvlar, tushum, foyda, oxirgi sotilgan sana
- Stok holati badge
- **Fayl**: `mobile/app/(app)/products/[id].tsx`

### Task 7 — Subscription tariflari UI
- Karta dizayn, "TAVSIYA ETILADI" badge, theme colors
- **Fayl**: `mobile/app/(app)/settings/subscription.tsx`

### Task 8 — Draggable FAB
- `PanResponder`, edge snap, press vs drag ajratilgan, AsyncStorage pozitsiya
- **Fayl**: `mobile/components/DraggableFAB.tsx`

### Task 9 — Inline Edit/Delete (mahsulotlar ro'yxati)
- ⋯ tugma + long-press → Edit / Delete menu, tasdiqlash dialog
- **Fayl**: `mobile/app/(app)/products/index.tsx`

### Task 11 — Sotuv o'chirish
- Long-press / ⋯ menu, stok avtomatik qaytariladi
- **Fayl**: `mobile/app/(app)/sales/index.tsx`

### Task 14 — Kategoriya filter
- Products ekranida horizontal chip list
- `useProducts` ga `categoryId` parametr
- **Fayl**: `mobile/app/(app)/products/index.tsx`, `mobile/hooks/useProducts.ts`

---

## Infratuzilma (sessiyadan oldin)

- Dark/Light mode color redesign
- Footer tablar 5 → 4
- Email auth (online + offline)
- Demo mode (parol "demo", OTP "000000")
- Auth navigation tuzatildi
- Push notifications Expo Go skip
- Stack `_layout.tsx` (20 broken tab bug)
- Web fayllar main dan pull (228 fayl)
- i18n uz/ru/en email auth
- Settings da Reports havolasi
- Xodimlar Settings da comment out

---

# Loyiha holati (arxiv)

## Ekranlar (19 ta) — hammasi demo rejimda ishlaydi

### Auth
- Login ekrani (`(auth)/login.tsx`) — telefon raqam kiritiladi, istalgan raqam ishlaydi, til tanlash (uz/ru/en) bor
- OTP ekrani (`(auth)/verify.tsx`) — har qanday 4 raqam kiritsa kiradi (real SMS yo'q, demo)

### Bosh ekran (`(app)/index.tsx`)
- Bugungi daromad, foyda, sotuv soni, margin — real WatermelonDB dan o'qiydi
- Quick actions: sotuv yozish va mahsulot qo'shish tugmalari
- Business tools: ta'minotchilar va mijozlar tugmalari
- Oxirgi 8 sotuv ro'yxati (SaleCard komponenti)
- SyncStatus — headerda, hozir "pending" ko'rsatadi (backend yo'q)

### Mahsulotlar
- Ro'yxat (`products/index.tsx`) — qidiruv bilan, kam qolgan (isLowStock) ogohlantirish
- Qo'shish (`products/add.tsx`) — nomi, olish narxi, sotish narxi, miqdor, birlik (ta/kg/l/m), barcode
- Tahrirlash/o'chirish (`products/[id].tsx`) — to'liq tahrirlash, o'chirish

### Sotuvlar
- Ro'yxat (`sales/index.tsx`) — bugun/hafta/oy filter
- Sotuv yozish (`sales/add.tsx`):
  - Mahsulot qidiruv + tanlov
  - Barcode scanner kamera orqali
  - Miqdor +/- tugmalari bilan
  - Stok tekshiradi (yetarli bo'lmasa xato beradi)
  - Yozganda stok avtomatik kamayadi (WatermelonDB)
  - Natija ekrani — daromad + foyda ko'rinadi
  - Chek ulashish (text fayl share qiladi)

### Hisobotlar (`reports/index.tsx`)
- Daromad, foyda, sotuv soni, margin foizi
- Bugun/hafta/oy filter
- Top-5 mahsulot (foydaga ko'ra), progress bar bilan
- Margin yaxshi/past indikatori (20% chegara)
- CSV eksport va ulashish

### Mijozlar
- Ro'yxat (`customers/index.tsx`) — qidiruv, umumiy qarz summasi header da
- Qo'shish (`customers/add.tsx`) — ism, telefon
- Detail (`customers/[id].tsx`):
  - Qarz qo'shish va to'lov qabul qilish (modal)
  - Qarz rangini o'zgartiradi (qizil = qarz bor, yashil = qarzdan xoli)
  - Tranzaksiya tarixi ro'yxati
  - Mijozni o'chirish

### Ta'minotchilar
- Ro'yxat (`suppliers/index.tsx`) — umumiy qarz summasi
- Qo'shish (`suppliers/add.tsx`)
- Detail (`suppliers/[id].tsx`) — qarz/to'lov, tarix, o'chirish

### Sozlamalar
- Asosiy (`settings/index.tsx`) — til, dark/light tema, obuna, xodimlar, chiqish
- Xodimlar ro'yxati (`settings/employees/index.tsx`)
- Xodim qo'shish (`settings/employees/add.tsx`)
- Tarif ekrani (`settings/subscription.tsx`) — Free/Pro/Biznes kartalar, demo rejimda 30 kun faollashtirish

---

## Database — WatermelonDB (oflayn SQLite)

8 ta model, hammasi to'liq ishlaydi:
- `Product` — nomi, olish/sotish narxi, stok, birlik, barcode, isSynced, serverId
- `Sale` — mahsulot, miqdor, narx, foyda, sana, isSynced, serverId
- `Customer` — ism, telefon, qarz (avtomatik hisoblanadi)
- `CustomerTransaction` — qarz/to'lov tarixi
- `Supplier` — ism, telefon, qarz
- `SupplierTransaction` — qarz/to'lov tarixi
- `Employee` — ism, telefon, rol
- `Category` — tovar kategoriyalari

---

## Store (Zustand + MMKV)

- `authStore` — token saqlash/yuklash/tozalash (MMKV)
- `langStore` — til (uz/ru/en), MMKV da saqlanadi, qayta ochganda eslab qoladi
- `themeStore` — dark/light mode, MMKV da saqlanadi
- `syncStore` — sync holati (isSyncing, pendingCount, lastSynced)
- `roleStore` — admin/cashier roli
- `subscriptionStore` — Free/Pro/Biznes tarif, muddati (hozir AsyncStorage, demo)
- `dataStore` — umumiy ma'lumotlar
- `storage` — MMKV wrapper (sync get/set/delete)

---

## Hooks

- `useProducts` — qidiruv bilan mahsulotlar, `isLowStock` computed property
- `useSales(period)` — bugun/hafta/oy bo'yicha filter
- `useTodayStats` — bugungi daromad, foyda, sotuv soni
- `useCustomers` / `useCustomer(id)` / `useCustomerTransactions(id)`
- `useSuppliers` / `useSupplier(id)` / `useSupplierTransactions(id)`
- `useEmployees`
- `useCategories`
- `useT` — tarjima hook (til o'zgarsa avto qayta render)
- `useTheme` — rang tizimi (dark/light avtomatik)

---

## Komponentlar

- `SyncStatus` — yuqori burchakda sync holati (pending count, loading indicator)
- `BarcodeScanner` — kamera orqali shtrix-kod o'qish (expo-camera)
- `SaleCard` — sotuv kartasi (mahsulot, miqdor, summa, foyda)

---

## Xizmatlar

- `syncEngine.ts` — oflayn sync: `isSynced=false` yozuvlarni serverga yuboradi, "Last Write Wins" conflict resolution, Products va Sales sync qiladi
- `api.ts` — Axios client: JWT token interceptor, 401 da refresh token bilan yangilash
- `notifications.ts` — push notification setup (Expo Notifications)

---

## i18n — 3 til to'liq

- O'zbek (`uz.ts`) — barcha kalitlar
- Rus (`ru.ts`) — barcha kalitlar
- Ingliz (`en.ts`) — barcha kalitlar

---

## Infratuzilma

- Expo SDK 55 + Expo Router (fayl-asosidagi navigatsiya)
- NativeWind (Tailwind CSS) styling
- Dark/Light tema tizimi — `theme/colors.ts`
- Tab navigatsiya: Bosh / Mahsulotlar / Sotuvlar / Hisobotlar / Sozlamalar
- AppState "active" bo'lganda sync ishga tushadi
- Root layout: auth flash bug tuzatilgan (token yuklangandan keyin yo'naltiradi)
- Subscription limit: Free=30 mahsulot, Pro=250, Biznes=cheksiz

---

## Nima ishlamaydi (demo rejim sababi)

- OTP SMS — real SMS kelmaydi, har qanday 4 raqam ishlaydi
- Sync — backend yo'q, syncEngine tayyor lekin `/sync/products` va `/sync/sales` endpointlarga ulanmaydi
- Obuna to'lovi — Payme/Click real emas, demo rejimda local 30 kun faollashtiradi
- Push notification — setup bor, lekin real xabar kelmaydi (backend yo'q)
