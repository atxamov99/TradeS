# TASKS — Savdo Mobile
 
> Yangilangan: 2026-05-03
> Legend: 🔴 Kritik · 🟡 Muhim · 🟢 Low · ⚙️ Backend kerak

---

## 🔴 KRITIK — Hozir hal qilish kerak

### K1. "+" (FAB) tugmalar ishlamayapti — barcha sahifalarda
**Muammo:** Mahsulot, Mijoz, Yetkazuvchi qo'shish sahifalarida "+" tugma bosilganda navigatsiya ishlamayapti.

**Sabab (tekshirilishi kerak):**
- `router.push("/(app)/customers/add")` to'liq yo'l sifatida ishlamasligi mumkin Tab ichidagi Stack da
- `href: null` bo'lgan Tab.Screen larni stack orqali push qilishda Expo Router bug bor
- `DraggableFAB` componentida `useNativeDriver: false` bilan bog'liq rendering muammo

**Fix yo'llari:**
1. `router.push("/(app)/customers/add")` → `router.push("/customers/add")` ko'rinishida o'zgartirish
2. Yoki `router.navigate` ishlatish `router.push` o'rniga
3. DraggableFAB ni oddiy `TouchableOpacity FAB` bilan almashtirish (oddiyroq, ishonchli)

**Fayllar:**
- `mobile/app/(app)/customers/index.tsx` (line 96: `router.push("/(app)/customers/add")`)
- `mobile/app/(app)/suppliers/index.tsx` (line 96: `router.push("/(app)/suppliers/add")`)
- `mobile/app/(app)/products/index.tsx` (line 167: `DraggableFAB`)
- `mobile/app/(app)/index.tsx` (line 64: `router.push("/(app)/sales/add")`, line 71: `router.push("/(app)/products/add")`)
- `mobile/components/DraggableFAB.tsx`

---

### K2. Login / Register to'liq ishlamayapti — API yo'llari noto'g'ri
**Muammo:** Mobile backend bilan ulanolmayapti, chunki API endpointlar mos kelmayapti.

**Noto'g'ri yo'llar (mobile → backend haqiqiy yo'l):**
| Mobile chaqiruvi | Backend haqiqiy endpoint |
|---|---|
| `POST /auth/send-otp` | ❌ Bu endpoint yo'q |
| `POST /auth/login/email` | ✅ `POST /auth/login` |
| `POST /auth/register/email` | ✅ `POST /auth/register` |

**Boshqa mismatch lar:**
- Mobile: parol min `4` belgi; Backend: parol min `8` belgi (User.model.js)
- Backend `register` foydalanuvchi yaratadi lekin email tasdiqlash **yuborilmaydi** (`isEmailVerified: false` qoladi)
- Phone OTP uchun backend endpoint umuman yo'q

**Fix kerak:**
1. `mobile/app/(auth)/login.tsx` → `/auth/login/email` → `/auth/login` qilish
2. `mobile/app/(auth)/login.tsx` → `/auth/register/email` → `/auth/register` qilish
3. Mobile da parol minimum ni 8 belgiga ko'tarish
4. Backend `auth.service.js register()` → yangi foydalanuvchi yaratilganda tasdiqlash emaili yuborish
5. Backend `auth.routes.js` → `/send-otp` yo'li qo'shish (hozircha mock) yoki mobile phone tab ni o'chirish
6. Mobile verify-email screen backend token bilan ishlashini ta'minlash

**Fayllar:**
- `mobile/app/(auth)/login.tsx` (line 101, 129)
- `mobile/app/(auth)/verify-email.tsx`
- `backend/src/services/auth.service.js` (`register` function)
- `backend/src/routes/auth.routes.js`

---

### K3. Admin panel va rollar — to'liq tekshirish
**Muammo:** Web da admin panel bor (`/admin/*` routes), backend da `ADMIN/SUPER_ADMIN` rollari bor, lekin:
- Backend `admin.controller.js` va `admin.routes.js` bor — tekshirilmagan
- Web `AdminDashboard, AdminUsers, AdminProducts, AdminOrders` — backend bilan ulanishi noma'lum
- RBAC middleware (`rbac.middleware.js`) ishlaydimi?

**Fix kerak:**
1. Backend admin endpointlarini test qilish (Postman yoki curl)
2. Web admin sahifalarini test qilish real backend bilan
3. `seedAdmin.js` ni ishga tushirib admin hisob yaratish
4. RBAC middleware `protect + rbac` chain to'g'ri ekanligini tekshirish

**Fayllar:**
- `backend/src/routes/admin.routes.js`
- `backend/src/controllers/admin.controller.js`
- `backend/src/services/admin.service.js`
- `backend/src/middlewares/rbac.middleware.js`
- `web/src/pages/admin/*`

---

### K4. Backend ↔ Mobile schema mismatch — sync ishlamaydi
**Muammo:** WatermelonDB modellari va MongoDB modellari bir-biriga mos kelmaydi.

**Farqlar:**
| WatermelonDB (mobile) | MongoDB (backend) |
|---|---|
| `sell_price` | `price` / `salePrice` |
| `buy_price` | `costPrice` |
| `stock_qty` | `stock` |
| `sold_at` | `createdAt` |
| `product_name` | `productName` / populate |

**Fix kerak:**
1. Backend `sync.controller.js` va `sync.service.js` ni tekshirish
2. Sync endpointlari (`GET /sync/products`, `POST /sync/sales`) ni test qilish
3. Mobile `syncEngine.ts` da field mapping to'g'ri ekanligini tekshirish
4. Backend mahsulotlar uchun WatermelonDB format bilan compatible response qaytarish

**Fayllar:**
- `backend/src/controllers/sync.controller.js`
- `backend/src/services/sync.service.js`
- `mobile/services/syncEngine.ts` (mavjudmi?)

---

## 🟡 MUHIM — Web va Mobile bir xil dizayn

### D1. Ranglar va tema moslashtirish
**Muammo:** Web (oq + yashil `#22c55e`) va Mobile (qora + indigo `#6366f1`) — butunlay boshqa ko'rinish.

**Qaror kerak:** Qaysi rang sxema standart bo'lsin?
- **Variant A:** Mobilni ham yashil (web bilan bir xil brend: `#22c55e`)
- **Variant B:** Webni ham qoraroq (mobil bilan bir xil)
- **Tavsiya:** Mobile → yashil primary rangga o'tish, chunki web landing page to'liq yashil ustiga qurilgan

**Fayllar:**
- `mobile/theme/colors.ts` → `primary` rangni `#22c55e` ga o'zgartirish
- `web/src/index.css` → rang sxemasini tekshirish

---

### D2. Web da yo'q, mobile da bor — qo'shish kerak
**Web ga qo'shilishi kerak bo'lgan narsalar (mobile dan olish):**
- Customers (qarzdorlar) moduli
- Suppliers (yetkazuvchilar) moduli
- Barcode scanner support (web kameradan)

---

### D3. Mobile da yo'q, web da bor — qo'shish kerak
**Mobile ga qo'shilishi kerak bo'lgan narsalar (web dan olish):**
- POS rejim (kassa) — web da `pages/pos/` bor, mobile da yo'q
- Hisobot grafiklar — web da `StatsChart.jsx` bor
- Forgot password flow — web da bor, mobile da yo'q
- Low stock warning — web dashboardda bor, mobile da yo'q (faqat badge)

**Fayllar:**
- `web/src/pages/pos/` → mobile da yangi tab sifatida qo'shish
- `web/src/pages/dashboard/components/StatsChart.jsx` → `mobile/components/StatsChart.tsx`

---

### D4. Web Login — Google Login butun sahifa uchun yagona usul
**Muammo:** Web da faqat Google Login va email/parol. Mobile da phone OTP ham bor (lekin backend yo'q).

**Qaror:** 
- Phone OTP ni vaqtincha olib tashlab, email/parol + Google Login bilan unify qilish
- Keyinchalik Firebase Phone Auth qo'shish

**Fayllar:**
- `mobile/app/(auth)/login.tsx` → phone tab ni disable qilish yoki olib tashlash
- `mobile/app/(auth)/verify.tsx` → vaqtincha foydalanilmasin

---

## 🟡 MUHIM — Backend to'liq tekshirish

### B1. Backend `.env` sozlamalari
**Tekshirish kerak:**
- `MONGODB_URI` ulangan va ishlaydi
- `JWT_SECRET` va `JWT_REFRESH_SECRET` o'rnatilgan
- `GOOGLE_CLIENT_ID` Google Cloud Console dan olindi
- `EMAIL_USER` va `EMAIL_PASS` (Gmail App Password) o'rnatilgan
- `CLIENT_URL` frontend URL bilan mos

---

### B2. Google OAuth — to'liq sozlash
**Muammo:** Backend `auth.service.js` da `googleAuth()` bor lekin sozlamalar noma'lum.

**Kerak bo'lgan:**
1. Google Cloud Console → OAuth 2.0 Client ID yaratish
2. Authorized origins va redirect URIs qo'shish
3. `GOOGLE_CLIENT_ID` env variable o'rnatish
4. Web da `VITE_GOOGLE_CLIENT_ID` env variable o'rnatish
5. Mobile da Google Sign-In `@react-native-google-signin/google-signin` package qo'shish

---

### B3. Email service sozlash
**Muammo:** `backend/src/utils/sendEmail.js` bor, lekin transport sozlanganmi?

**Kerak bo'lgan:**
1. `sendEmail.js` ni tekshirish — nodemailer transport to'g'ri
2. Gmail App Password yoki SendGrid key o'rnatish
3. Register da email tasdiqlash jo'natish (K2 bilan bog'liq)

---

### B4. Refresh Token va Token interceptor
**Muammo:** Mobile `api.ts` da token refresh interceptor bormi?

**Kerak bo'lgan:**
- Mobile `services/api.ts` → 401 response bo'lganda `/auth/refresh-token` chaqirish
- Yangi token bilan request ni qayta yuborish

**Fayl:** `mobile/services/api.ts`

---

### B5. Rate Limiter — mobile uchun muammo
**Muammo:** Backend `authLimiter` middleware bor — bu mobile da ko'p urinishlarni bloklashi mumkin.

**Tekshirish:** `rateLimiter.middleware.js` chegaralari qanday? Mobile test paytida bloklanib qolishi mumkin.

---

## 🟢 LOW — Keyinroq

### 12. App icon va splash screen
- Hozir default Expo icon
- `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png` almashtirish
- Real Savdo logotipi kerak

### L1. Web — POS sahifalarini tartibga solish
- `web/src/pages/pos/` sahifalari mavjud lekin backend bilan ulanishi noma'lum
- POS layout (`PosLayout.jsx`) ni test qilish

### L2. Mobile — LokiJSAdapter → SQLiteAdapter
**Muammo:** `mobile/db/index.ts` da `LokiJSAdapter` ishlatilgan. Bu React Native da ma'lumotlarni `AsyncStorage` ga yozadi va slow. Production uchun `SQLiteAdapter` kerak.

**Fayl:** `mobile/db/index.ts`

---

## ✅ BAJARILDI (2026-05-03)

### 10. ✅ Chek uchun ulashiluvchi link (base64 variant)
- `generateReceiptLink()` → base64 encode, `savdo.uz/r/{base64}`
- Natija ekranida "Havolani ulashish" tugma qo'shildi
- **Fayl**: `mobile/app/(app)/sales/add.tsx`

### 13. ✅ Xodim PIN login flow
- `roleStore` → `setPIN()`, `verifyPIN()`, `hasPIN()` qo'shildi
- `mobile/app/(auth)/pin.tsx` — 4 raqam numpad ekrani
- Settings → Kassir rejimiga o'tish → to'g'ridan; Admin rejimiga qaytish → PIN ekrani
- Admin PIN sozlash modal → Settings da "PIN o'rnatish" qatori
- **Fayl**: `mobile/store/roleStore.ts`, `mobile/app/(auth)/pin.tsx`, `mobile/app/(app)/settings/index.tsx`

### 15. ✅ Barcode skaner to'liq integratsiya
- DB schema v4 → `barcode` ustuni products da
- `Product` modeliga `barcode` field qo'shildi
- `products/add.tsx` → scan → barcode field ga yozadi
- `products/[id].tsx` → barcode ko'rsatish va tahrirlash
- `sales/add.tsx` → `p.barcode === code` bo'yicha qidiradi
- **Fayl**: `schema.ts`, `migrations.ts`, `Product.ts`, `products/add.tsx`, `products/[id].tsx`, `sales/add.tsx`

---

## 🚫 VAQTINCHA YASHIRILGAN

- **Xodimlar (Employees) bo'limi** — Settings da comment out
  - **Sabab**: PIN flow + backend kerak (B8 + Task 13)
  - **Fayl**: `mobile/app/(app)/settings/index.tsx`
