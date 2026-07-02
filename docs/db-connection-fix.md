# 🔌 Database Connection Troubleshooting — Savdo-E
**Error:** `Can't reach database server at ep-curly-sun-ap4bvxh9.c-7.us-east-1.aws.neon.tech:5432`

## 🔍 Muammoning sababi
Ushbu xatolik backend serveri PostgreSQL ma'lumotlar bazasiga ulanishga harakat qilganida, tarmoq darajasida rad etilganini anglatadi. Bu ko'pincha Neon-ning IP-filtri yoki noto'g'ri sozlamalar tufayli sodir bo'ladi.

## 🛠 Yechim yo'llari (Step-by-Step)

### 1. IP-manzilni ruxsatnomaga qo'shish (Eng ko'p uchraydigan sabab)
Neon bazasi xavfsizlik uchun faqat ma'lum IP-manzilga ruxsat beradi.
- **Qadam 1:** [Neon Console](https://neon.tech) ga kiring.
- **Qadam 2:** Loyihangizni tanlang $\rightarrow$ **Settings** $\rightarrow$ **IP Allowlist**.
- **Qadam 3:** `Add IP Address` tugmasini bosib, hozirgi internet IP-manzilingizni qo'shing. 
  *(Maslahat: Agar doimiy ravishda IP o'zgarib tursa, barcha IP-larga ruxsat beruvchi qoidani o'rnating, ammo bu xavfsizlikni kamaytiradi).*

### 2. `.env` faylini tekshirish
Ulanish manzili (Connection String) noto'g'ri bo'lishi mumkin.
- `.env` faylini oching va `DATABASE_URL` o'zgaruvchisini tekshiring.
- Format quyidagicha bo'lishi shart:
  ```env
  DATABASE_URL="postgresql://[USER]:[PASSWORD]@[HOST]/[DB_NAME]?sslmode=require"
  ```
- Agar parolingizda maxsus belgilar bo'lsa, ular URL-encoded bo'lishi kerak.

### 3. SSL Sozlamalari
Neon bazasi SSL ulanishini talab qiladi. 
- URL oxirida `?sslmode=require` borligiga ishonch hosil qiling.

### 4. Tarmoq va Portlar
Agar yuqoridagilar yordam bermasa:
- Kompyuteringizda 5432-port ochiqligini tekshiring.
- VPN ishlatayotgan bo'lsangiz, uni o'chirib ko'ring yoki VPN orqali ulanish imkoniyatini tekshiring.

---

## 📌 Xulosa
Agar xatolik takrorlansa, birinchi navbatda **Neon Console $\rightarrow$ IP Allowlist** bo'limini tekshiring. Bu 90% holatlarda muammoni hal qiladi.

*Documented by Claude Code for the Savdo-E project.*
