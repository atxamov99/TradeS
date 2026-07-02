# 📢 Savdo-E — Marketing Broşyura

> **Bir vaqtda Savdo, POS va Ombor Boshqaruvi — MDH (Markaziy Osiyo) tadbirkorlari uchun yaratilgan platforma.**

---

## 🎯 1. Biz kimmiz?

**Savdo-E** — bu kichik va o'rta tadbirkorlar (do'konlar, chakana savdo nuqtalari, xizmat ko'rsatish shoxobchalari) uchun mo'ljallangan **savdo, POS (Point of Sale) va ombor boshqaruvi platformasi**. AI-texnologiyalar bilan qurollangan bo'lib, 830,000+ MDH (Markaziy Osiyo) tadbirkorlariga xizmat ko'rsatishga qaratilgan.

### 🌟 Nima uchun bizni tanlashadi?

✅ **Offline-First POS** — Internet o'chsa ham, sotuv to'xtamaydi. Ma'lumotlar mahalliy bazada saqlanadi, internet tiklanganda bulut bilan sinxronlashadi.
✅ **AI Analytics (Gemini AI)** — Tizim oddiy hisobot emas, balki *"Qaysi mahsulotni ko'proq sotib olish kerak?"* yoki *"Haftaning qaysi kunida savdo sust?"* kabi aqlli tavsiyalar beradi.
✅ **Ko'p platformali** — Veb (xaridorlar), Admin Panel (tadbirkor) va Mobil ilova (POS/sotuvchilar) — bitta orqa tomon (backend) bilan bog'langan.
✅ **5 tilda** — UZ (Lotin/Kirill), RU, EN, KZ, TJ, KG.
✅ **4 valyutada** — UZS, KZT, TJS, KGS (+ RUB, USD).
✅ **Tez va sodda** — Sotuvni 3 soniyada qayd eting!

---

## 🚀 2. Biz qanday muammoni hal qilamiz?

### ❌ Muammolar:

| Muammo | Yechim (Savdo-E) |
|--------|------------------|
| Tadbirkorlar savdoni daftarga yoki Telegram guruhlarga yozadi — tartibsizlik, yo'qotishlar | Bulutli platforma — barcha ma'lumot bir joyda, xavfsiz |
| Mavjud tizimlar (1C, Jowi) juda qimmat va murakkab | Bepul boshlang'ich tarif, sodda interfeys, 1 daqiqada tushuniladi |
| Internet past bo'lgan joylarda bulutli dasturlar qotib qoladi | Offline-First — internet kerak emas, keyin sinxronlashadi |
| Savdo-POS integratsiyasi yo'q | Bitta tizimda savdo, ombor va moliyaviy hisobot |

### ✅ Afzalliklar:

- 💰 **Bepul boshlang'ich tarif** — kichik biznes uchun
- 📱 **Istalgan qurilmada ishlaydi** — telefon, planshet, noutbuk
- 🧠 **AI yordamchi** — savdolarni tahlil qiladi, maslahat beradi
- 🌍 **MDH bozori uchun maxsus** — valyuta, til, mahalliy to'lov tizimlari (Payme, Click)
- 🔒 **Xavfsiz** — JWT autentifikatsiya, RBAC, audit logging

---

## 🏗 3. Platformalar

### 📱 Mobil ilova (Expo/React Native)
- Tezkor savdo qayd etish
- To'liq offline rejimda ishlash
- Avtomatik sinxronlash
- **Muddat:** 10 kun ichida tayyor

### 🌐 Veb platforma (React/Vite)
- To'liq savdo boshqaruvi
- Multi-country qo'llab-quvvatlash
- Dashboard, mahsulotlar, sotuvlar, hisobotlar
- **Muddat:** 8 hafta ichida tayyor

### 🖥️ Admin Panel (React)
- Platforma adminstratsiyasi
- Foydalanuvchilar, adminlar, rollar boshqaruvi
- Audit loglar, hisobotlar, sozlamalar
- **Muddat:** 5-6 hafta

---

## 💎 4. Asosiy funksiyalar

### A. AI Yordamchi (Gemini 1.5)
- 🤖 **Inventar tahlili:** *"Omborda nima bor?"* — bir zumda javob
- 📈 **Savdo tendensiyalari:** O'sish yoki tushish aniqlanadi
- 💡 **Tavsiyalar:** Qaysi mahsulotga e'tibor berish kerak?
- 🗣 **Tabiiy tilda so'rash:** O'zbek, Rus yoki Ingliz tilida

### B. Lokalizatsiya (i18n)
- **5+ til:** UZ (Lotin/Kirill), RU, EN, KZ, TJ, KG
- **4+ valyuta:** UZS, KZT, TJS, KGS (+ RUB, USD)
- **4 davlat:** O'zbekiston, Qozog'iston, Tojikiston, Qirg'iziston
- **Avto-detektsiya:** IP orqali til va valyuta tanlanadi

### C. Real-Time Analitika
- 📊 Dashboard ko'rsatkichlari (daromad, foyda, inventar)
- 🏆 Top mahsulotlar tahlili
- 📅 Kunlik/haftalik/oylik tendensiyalar
- 📤 Eksport: CSV, Excel, PDF

### D. Role-Based Access (RBAC)
- 👑 **Super Admin:** 1 ta (tizim uchun)
- 🛡️ **Admin:** Cheksiz (foydalanuvchi va kontent boshqaruvi)
- ⚙️ **Custom Rollar:** Har bir rol uchun ruxsatlar matritsasi
- 📜 **Audit Log:** Barcha harakatlar vaqt belgisi bilan saqlanadi

---

## 🔧 5. Texnologiya Steki

### Backend (Node.js/Express/MongoDB)
- **Runtime:** Node.js v18+ (asinxron, masshtablanadigan)
- **Server:** Express.js (yengil API)
- **Database:** MongoDB + Mongoose (moslashuvchan, kengaytiriladigan)
- **Auth:** JWT + Bcrypt (xavfsiz, stateless)
- **AI:** Google Gemini API (ilg'or tahlil)
- **Validatsiya:** Joi/Zod (tur xavfsizligi)
- **Logging:** Winston/Morgan (production darajasida)
- **Fayl saqlash:** Cloudinary (rasm boshqaruvi)
- **To'lov:** Payme + Click (MDH to'lov shlyuzlari)

### Web (React 18 + Vite)
- **Framework:** React 18 (zamonaviy, tez)
- **Build:** Vite (tezkor development va production)
- **UI:** Tailwind CSS (utility-first dizayn)
- **State:** Zustand (yengil state management)
- **HTTP:** Axios (API so'rovlar)
- **i18n:** 5 til qo'llab-quvvatlash
- **Diagrammalar:** Recharts (analitika)

### Mobile (Expo/React Native)
- **Framework:** Expo + React Native (cross-platform)
- **Navigation:** Expo Router (fayl-asosida routing)
- **UI:** NativeWind (Tailwind React Native uchun)
- **Offline DB:** WatermelonDB (mahalliy saqlash + sinxronlash)
- **State:** Zustand
- **Tokenlar:** MMKV (shifrlangan saqlash)

### Admin Panel (React 18)
- **Framework:** React 18
- **UI:** Tailwind CSS
- **Tables:** TanStack Table v8 (ma'lumot jadvallari)
- **Forms:** React Hook Form
- **State:** React Query + Zustand
- **Charts:** Recharts

---

## 🛡️ 6. Xavfsizlik

| Qatlam | Mexanizm |
|--------|----------|
| **Transport** | HTTPS (production) |
| **Headers** | Helmet.js (CSP, HSTS) |
| **CORS** | Faqat ruxsat berilgan domenlar |
| **Rate Limiting** | 100 so'rov/15 daqiqa global, 10 ta auth uchun |
| **Input Validatsiya** | Joi — barcha mutatsiyalarda |
| **NoSQL Injection** | express-mongo-sanitize |
| **Parollar** | bcrypt (10 rounds) |
| **Tokenlar** | Qisqa muddatli JWT (15 min) + aylanuvchi refresh (7 kun) |
| **RBAC** | Har bir himoyalangan route'da rol tekshiruvi |

### ✅ Xavfsizlik auditi natijalari:
- **Backend:** Production-Ready ✓
- **JWT Rotation:** Tokenlar aylanishi ishlatilgan
- **Rate Limiting:** Brute-force va DoS ga qarshi
- **Prompt Injection himoyasi:** AI controller xavfsiz
- **IDOR himoyasi:** Obyekt darajasida avtorizatsiya

---

## 📊 7. Ruxsatlar Matritsasi

| Resurs | Foydalanuvchi | Admin | Super Admin |
|--------|:-------------:|:-----:|:-----------:|
| Mahsulotlarni ko'rish | ✓ | ✓ | ✓ |
| Savat/wishlist | ✓ | ✓ | ✓ |
| Buyurtma berish | ✓ | ✓ | ✓ |
| O'z buyurtmalarini ko'rish | ✓ | ✓ | ✓ |
| Mahsulot yaratish/tahrirlash | ✗ | ✓ | ✓ |
| Barcha buyurtmalarni ko'rish | ✗ | ✓ | ✓ |
| Buyurtma holatini o'zgartirish | ✗ | ✓ | ✓ |
| Foydalanuvchini bloklash | ✗ | ✓ | ✓ |
| Foydalanuvchini o'chirish | ✗ | ✗ | ✓ |
| Dashboard statistikasi | ✗ | ✓ | ✓ |

---

## 🎯 8. Kim uchun?

### 🎯 Maqsadli auditoriya:

1. **Kichik do'kon egalari** (bitta nuqta, 1-5 xodim)
2. **O'rta biznes** (5-50 xodim, bir nechta filiallar)
3. **Chakana savdo** (supermarket, mini-market)
4. **Xizmat ko'rsatish** (tibbiyot, go'zallik, avtoulov)
5. **Onlayn-do'konlar** (e-commerce + oflayn)

### 📈 Bozor:

- **MDH:** 830,000+ faol tadbirkor
- **O'zbekiston:** 350,000+ kichik biznes
- **Qozog'iston:** 200,000+ chakana savdo
- **Boshqa davlatlar:** 280,000+

---

## 💰 9. Narxlar (taxminiy)

| Tarif | Narx | Imkoniyatlar |
|-------|------|--------------|
| **FREE** | 0 so'm/oy | 1 do'kon, 100 ta mahsulotgacha, asosiy hisobot |
| **STANDARD** | 99,000 so'm/oy | 5 do'kongacha, 1000 mahsulot, AI tahlil, eksport |
| **PRO** | 299,000 so'm/oy | Cheksiz do'kon, AI tavsiyalar, API, integratsiyalar |

> *Aniq narxlar bozorga qarab sozlash mumkin.*

---

## 📅 10. Loyihaning holati

### ✅ Tugatilgan (MVP):
- [x] Autentifikatsiya (email/phone)
- [x] Dashboard va analitika
- [x] Mahsulot boshqaruvi (CRUD)
- [x] Sotuv qayd etish
- [x] Offline rejim
- [x] Ko'p tillilik (UZ, RU, EN)
- [x] Admin panel (asosiy)
- [x] JWT Rotation + xavfsizlik
- [x] AI integratsiya (Gemini)
- [x] RBAC + audit logging

### 🚧 Rejada (V1.1):
- [ ] Kengaytirilgan analitika (interaktiv grafiklar)
- [ ] Excel/PDF eksport
- [ ] To'liq 5 til qo'llab-quvvatlash (KZ, TJ, KG)
- [ ] To'lov integratsiyasi (Payme, Click)
- [ ] Bildirishnoma markazi
- [ ] Real-time notifications (WebSocket)
- [ ] 2FA autentifikatsiya

### 🔮 Kelajak (V2):
- [ ] AI tavsiyalar va talab prognozi
- [ ] Yetkazib beruvchilar boshqaruvi
- [ ] Xarajat kuzatuvi
- [ ] Inventar ogohlantirishlari
- [ ] Telegram bot integratsiyasi
- [ ] QR kod generator
- [ ] Multi-store qo'llab-quvvatlash

---

## 💵 11. Oylik xarajatlar

| Xizmat | Narxi | Izoh |
|--------|-------|------|
| Web Hosting (Vercel) | Bepul | Bepul tarif |
| Backend + DB (Railway) | $10-20 | Masshtablanadigan |
| Rasm saqlash (Cloudinary) | Bepul | 25 GB bepul |
| SMS (Eskiz) | ~50-100 | Har tranzaksiya uchun |
| Monitoring (Sentry) | Bepul | 5K xato/oy |
| Domen | ~$15 | Yillik |
| **Jami** | **~$35-50** | Oylik |

> Xarajatlar minimal — bu erkin narx orqali foyda olish imkonini beradi.

---

## 🏆 12. Nima uchun Savdo-E?

| Xususiyat | Savdo-E | Boshqa tizimlar |
|-----------|---------|-----------------|
| **Narxi** | Bepul boshlang'ich | Qimmat ($100+/oy) |
| **O'rnatish** | 1 daqiqada | Bir necha kun |
| **Offline** | ✓ To'liq | ✗ Internet kerak |
| **AI** | ✓ Gemini integratsiya | ✗ Yo'q |
| **Tillar** | 5+ | 1-2 |
| **MDH to'lov** | Payme, Click | Yo'q |
| **Texnologiya** | Zamonaviy (React, Node.js) | Eskirgan |
| **Ochiq manba** | Tez orada | Yopiq |

---

## 🌍 13. Brend va Logotip

### Ism variantlari:
1. **Savdo-E** — E-Commerce va Elektron savdoni anglatadi
2. **SavdoFlow** — Savdoning uzluksiz oqimi
3. **POSim** — "Mening POS tizimim"
4. **SmartSavdo** — Aqlli savdo tizimi
5. **BozorApp** — Tanish va sodda
6. **Tijorat.ai** — Professional, AI yo'naltirilgan
7. **Daftar.uz** — "Savdo daftari" → raqamli daftar

### Logotip konsepsiyalari:
- **A: "Aqlli Savdo"** — Savdo sumkasi + AI chaqmoqlari
- **B: "Cheksiz O'sish"** — S + Infinity belgisi
- **C: "Tezkor POS"** — Chaqmoq + savdo aravachasi

### Ranglar:
- 🟢 **Neon Yashil** (`#2ECC71`) — Asosiy
- ⚫ **To'q Yashil/Fon** (`#0E150F`) — Premium ko'rinish
- 🔵 **To'q Ko'k** (`#1ABC9C`) — Ikkinchi accent
- **Uslub:** Cyber Organic — zamonaviy va jozibali

---

## 🤝 14. Hissa qo'shish va Hamkorlik

### Biz izlayotgan hamkorlar:
- 💼 **Investorlar** — Seriya A moliyalashtirish
- 🏪 **Tadbirkorlar** — Beta-test va fikr-mulohaza
- 🌍 **Distribyutorlar** — MDH davlatlarida tarqatish
- 👨‍💻 **Dasturchilar** — Ochiq manbali hamkorlik

### Hissa qo'shish sohalari:
- 🐛 Xato tuzatish
- 🌐 Til tarjimalari (KZ, TJ, KG)
- ⚡ Performance optimallashtirish
- 🔒 Xavfsizlik yaxshilanishi
- 📚 Hujjatlashtirish

---

## 📞 15. Bog'lanish

- 🌐 **Veb-sayt:** [savdo-e.uz](https://savdo-e.uz)
- 📧 **Email:** info@savdo-e.uz
- 💬 **Telegram:** @savdo_e_support
- 📱 **Telefon:** +998 71 200-XX-XX
- 🏢 **Manzil:** Toshkent, O'zbekiston

---

## 🎬 16. Xulosa

**Savdo-E** — bu oddiy daftardan to'liq raqamli ekosistema o'tish uchun yagona platforma. Biz MDH tadbirkorlariga:
- 💰 Pulni tejash
- ⏱ Vaqtni tejash
- 📊 Biznesni yaxshiroq tushunish
- 🌍 Xalqaro bozorga chiqish

imkonini beramiz.

> **"Savdo-E — Savdo boshqaruvi sodda qilindi."**

---

## 📜 Litsenziya

MIT Litsenziya — erkin foydalanish, tijorat loyihalari uchun ham.

---

**Savdo-E — MDH Tadbirkorlari Uchun Savdo Boshqaruvi Tizimi 🚀**

*Yaratilgan: 2026 • Hozir: Faol rivojlanishda*