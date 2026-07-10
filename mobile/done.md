# DONE — Mobileda qilingan narsalar

## Ekranlar (19 ta)

### Auth
- [x] `(auth)/login.tsx` — demo mode, istalgan raqam bilan kirish
- [x] `(auth)/verify.tsx` — OTP ekrani (backend ulanganda ishlaydi)

### Bosh ekran
- [x] `(app)/index.tsx` — bugungi daromad, foyda, sotuv soni, margin
- [x] Quick actions: sotuv yozish, mahsulot qo'shish
- [x] Business tools: ta'minotchilar, mijozlar
- [x] Oxirgi 8 sotuv ro'yxati
- [x] SyncStatus komponenti header da

### Mahsulotlar
- [x] `products/index.tsx` — ro'yxat, qidiruv, kam qolgan ogohlantirish
- [x] `products/add.tsx` — qo'shish (nomi, olish narxi, sotish narxi, miqdor, birlik)
- [x] `products/[id].tsx` — tahrirlash, o'chirish

### Sotuvlar
- [x] `sales/index.tsx` — ro'yxat, bugun/hafta/oy filter
- [x] `sales/add.tsx` — sotuv yozish, barcode scanner, chek ulashish
- [x] Sotuv yozganda stok avtomatik kamayadi
- [x] Sotuv natijasi ekrani (foyda ko'rinishi)

### Hisobotlar
- [x] `reports/index.tsx` — daromad, foyda, margin, top-5 tovar
- [x] Bugun/hafta/oy filter
- [x] CSV eksport va ulashish

### Mijozlar
- [x] `customers/index.tsx` — ro'yxat, qidiruv, umumiy qarz summasi
- [x] `customers/add.tsx` — mijoz qo'shish (ism, telefon)
- [x] `customers/[id].tsx` — qarz qo'shish, to'lov qabul qilish, tarix

### Ta'minotchilar
- [x] `suppliers/index.tsx` — ro'yxat, umumiy qarz
- [x] `suppliers/add.tsx` — ta'minotchi qo'shish
- [x] `suppliers/[id].tsx` — qarz qo'shish, to'lov, tarix, o'chirish

### Sozlamalar
- [x] `settings/index.tsx` — til, dark/light tema, obuna, xodimlar, chiqish
- [x] `settings/employees/index.tsx` — xodimlar ro'yxati
- [x] `settings/employees/add.tsx` — xodim qo'shish
- [x] `settings/subscription.tsx` — tarif ekrani (UI)

---

## Database (WatermelonDB — oflayn SQLite)

- [x] `Product` — nomi, olish/sotish narxi, stok, birlik, barcode
- [x] `Sale` — tovar, miqdor, narx, foyda, sana
- [x] `Customer` — ism, telefon, qarz
- [x] `CustomerTransaction` — qarz/to'lov tarixi
- [x] `Supplier` — ism, telefon, qarz
- [x] `SupplierTransaction` — qarz/to'lov tarixi
- [x] `Employee` — ism, telefon, rol
- [x] `Category` — tovar kategoriyalari

---

## Store (Zustand + MMKV)

- [x] `authStore` — token saqlash, login/logout
- [x] `langStore` — til (uz/ru/en), MMKV da saqlanadi
- [x] `themeStore` — dark/light, MMKV da saqlanadi
- [x] `syncStore` — sync holati
- [x] `roleStore` — admin/cashier roli
- [x] `subscriptionStore` — tarif holati
- [x] `dataStore` — umumiy ma'lumotlar
- [x] `storage` — MMKV wrapper

---

## Hooks

- [x] `useProducts` — qidiruv bilan mahsulotlar
- [x] `useSales` / `useTodayStats` — bugungi statistika
- [x] `useCustomers` / `useCustomer` / `useCustomerTransactions`
- [x] `useSuppliers` / `useSupplier` / `useSupplierTransactions`
- [x] `useEmployees`
- [x] `useCategories`
- [x] `useT` — tarjima hook
- [x] `useTheme` — ranglar

---

## Komponentlar

- [x] `SyncStatus` — yuqori burchakdagi sync holati
- [x] `BarcodeScanner` — kamera orqali shtrix-kod o'qish
- [x] `SaleCard` — sotuv kartasi komponenti

---

## Xizmatlar

- [x] `syncEngine.ts` — oflayn-to-online sync (backend ulanganda)
- [x] `api.ts` — Axios API client (demo mode)
- [x] `notifications.ts` — push notification setup

---

## i18n (3 til)

- [x] O'zbek (`uz.ts`)
- [x] Rus (`ru.ts`)
- [x] Ingliz (`en.ts`)

---

## Infratuzilma

- [x] Expo SDK 55 + Expo Router (fayl-asosidagi navigatsiya)
- [x] NativeWind (Tailwind) styling
- [x] Dark/Light tema tizimi (`theme/colors.ts`)
- [x] Root layout: auth flash bug tuzatilgan
- [x] Tab navigatsiya: Bosh, Mahsulotlar, Sotuvlar, Hisobotlar, Sozlamalar
- [x] AppState "active" bo'lganda sync ishga tushadi
