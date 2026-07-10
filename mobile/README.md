# Savdo — Mobile Ilova

Savdogarlar uchun oflayn-birinchi mobil ilova. Expo + React Native.

## Texnologiyalar

| Texnologiya | Maqsad |
|---|---|
| **Expo Router** | Fayl-asosidagi navigatsiya |
| **WatermelonDB** | Oflayn ma'lumotlar bazasi (SQLite) |
| **expo-secure-store** | Token saqlash |
| **MMKV** | Tez sozlamalar saqlash |
| **Zustand** | Global state (auth, data, lang, sync) |
| **NativeWind** | Tailwind-style dizayn |
| **Axios** | Backend API so'rovlari |
| **expo-linking** | Deep link va URL handling |

## Papka strukturasi

```
mobile/
├── app/
│   ├── _layout.tsx              ← Root layout (auth yo'naltirish)
│   ├── (auth)/                  ← Kirish ekranlari
│   │   ├── _layout.tsx
│   │   ├── login.tsx            ← Telefon raqam kiritish
│   │   └── verify.tsx           ← SMS OTP tasdiqlash
│   └── (app)/                   ← Asosiy ilova (tab navigation)
│       ├── _layout.tsx
│       ├── index.tsx            ← Bosh ekran (bugungi statistika)
│       ├── products/
│       │   ├── index.tsx        ← Tovarlar ro'yxati
│       │   ├── add.tsx          ← Tovar qo'shish
│       │   └── [id].tsx         ← Tovar tahrirlash
│       ├── sales/
│       │   ├── index.tsx        ← Sotuvlar ro'yxati
│       │   └── add.tsx          ← Sotuv yozish
│       ├── reports/
│       │   └── index.tsx        ← Hisobotlar (bugun/hafta/oy)
│       └── settings/
│           ├── index.tsx        ← Sozlamalar (til, tarif, chiqish)
│           └── subscription.tsx ← Obuna ekrani
├── db/                          ← WatermelonDB
│   ├── index.ts                 ← DB instance
│   ├── schema.ts                ← Jadval sxemasi
│   └── models/
│       ├── Product.ts
│       └── Sale.ts
├── store/                       ← Zustand stores
│   ├── authStore.ts
│   ├── dataStore.ts
│   ├── langStore.ts
│   ├── storage.ts
│   └── syncStore.ts
├── services/
│   ├── api.ts                   ← Axios instance + endpoints
│   ├── syncEngine.ts            ← Oflayn sync logic
│   └── notifications.ts        ← Push bildirishnomalar
├── hooks/
│   ├── useProducts.ts
│   ├── useSales.ts
│   └── useT.ts                  ← i18n hook
├── components/
│   ├── SaleCard.tsx
│   └── SyncStatus.tsx
├── i18n/                        ← Tarjimalar
│   ├── index.ts
│   ├── uz.ts
│   ├── ru.ts
│   └── en.ts
├── assets/                      ← Rasmlar, ikonlar
├── android/                     ← Native Android (eas build)
├── app.json
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
└── tsconfig.json```

## Ishga tushirish

```bash
cd mobile
npm install
npx expo start
```

Telefonga **Expo Go** o'rnatib, QR kod skanlang.

## APK yasash

```bash
# Test uchun (tez)
eas build --profile preview --platform android

# Play Store uchun
eas build --profile production --platform android
eas submit --platform android
```

## Oflayn ishlash

Barcha sotuv va tovarlar avval **telefonga** (WatermelonDB) yoziladi.
Backend ulanganda `syncEngine` o'zi yuboradi — foydalanuvchi buni ko'rmaydi.
