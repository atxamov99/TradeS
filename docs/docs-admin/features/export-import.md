                                                        # Ma'lumotlarni Eksport / Import

## Maqsad

Admin paneldan ma'lumotlarni CSV/Excel formatida yuklab olish va tashqaridan yuklash imkonini berish.

## Nima uchun kerak?

- **Buxgalteriya hisoboti** — moliya bo'limi buyurtmalar va daromad ma'lumotini Excel'da talab qiladi
- **Ma'lumot migratsiyasi** — boshqa tizimdan mahsulot yoki foydalanuvchilarni import qilish
- **Zaxira nusxa** — muhim ma'lumotlarni CSV ko'rinishida saqlash
- **Tahlil** — tashqi Business Intelligence (BI) dasturlari bilan ishlash uchun

---

## Eksport funksiyalari

### Qaysi sahifalardan eksport

| Sahifa | Format | Filtr bilan |
|--------|--------|-------------|
| Foydalanuvchilar | CSV, Excel | Holat, sana |
| Buyurtmalar | CSV, Excel, PDF | Holat, sana, narx |
| Mahsulotlar | CSV, Excel | Kategoriya, holat |
| Mijozlar | CSV | Toifa, holat |
| Audit Logs | CSV | Amal, sana, foydalanuvchi |
| Hisobotlar | PDF, Excel | Sana oralig'i |

### Eksport UI

```
Jadval sarlavhasida:
[+ Yangi]  [🔍 Qidirish]  [Filter ▼]  [⬇ Eksport ▼]
                                        ├── CSV yuklab olish
                                        ├── Excel yuklab olish
                                        └── PDF (hisobotlar uchun)
```

### Katta ma'lumotlar uchun fon eksporti

Agar 10,000+ yozuv bo'lsa:

```
1. "Eksport" tugmasini bosish
2. [Bildirishnoma] "Eksport tayyorlanmoqda..."
3. Tayyor bo'lganda: [🔔] "Eksport tayyor — yuklab olish"
4. Yuklash havolasi 24 soat amal qiladi
```

---

## Import funksiyalari

### Import oqimi

```
1. Sahifada [⬆ Import] tugmasini bosish
2. CSV namuna faylini yuklab olish
3. Faylni to'ldirish
4. Faylni tanlash (drag & drop yoki browse)
5. Validatsiya:
   ✅ 245 ta yozuv topildi
   ⚠ 3 ta xato (12, 45, 78-qatorlar)
   [Xatolarni ko'rish]  [To'g'rilangan qatorlarni import qilish]
6. Import tugallandi: 242 ta qo'shildi, 3 ta o'tkazib yuborildi
```

### Import qilinadigan ma'lumotlar

**Mahsulotlar import:**
```csv
nom,narx,kategoriya,miqdor,sku,holat
iPhone 15 Pro,12999000,Telefonlar,15,APL-IP15P,aktiv
Samsung S24,10500000,Telefonlar,8,SAM-S24,aktiv
```

**Foydalanuvchilar import:**
```csv
ism,email,telefon,rol,holat
Alisher Toshmatov,alisher@example.com,+998901234567,admin,aktiv
```

### Validatsiya qoidalari

- Majburiy ustunlar tekshiriladi
- Email format validatsiyasi
- Telefon raqam formati tekshiruvi
- Takrorlangan yozuvlar ogohlantiriladi
- Narx va miqdor musbat son bo'lishi kerak
- Kategoriya mavjud bo'lishi kerak

---

## Texnik amalga oshirish

### Kutubxonalar

```bash
npm install xlsx          # Excel o'qish va yozish
npm install papaparse     # CSV parsing
npm install file-saver    # Fayl yuklash
```

### Eksport funksiyasi

```javascript
// utils/export.js
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

export function exportToExcel(data, filename, sheetName = 'Ma\'lumot') {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  saveAs(new Blob([buf]), `${filename}.xlsx`)
}

export function exportToCSV(data, filename) {
  const ws = XLSX.utils.json_to_sheet(data)
  const csv = XLSX.utils.sheet_to_csv(ws)
  saveAs(new Blob([csv], { type: 'text/csv' }), `${filename}.csv`)
}
```

### Import komponenti

```javascript
// components/shared/ImportModal.jsx
import Papa from 'papaparse'

function ImportModal({ onImport, template }) {
  const handleFile = (file) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const { valid, errors } = validate(results.data)
        setValidationResult({ valid, errors })
      }
    })
  }
  // ...
}
```

### Komponent strukturasi

```
src/
  components/
    shared/
      ExportButton.jsx           (yangi — dropdown bilan)
      ImportModal.jsx            (yangi — drag & drop)
      ImportValidationTable.jsx  (yangi — xatolar ko'rsatish)
  utils/
    export.js                    (yangi)
    import.js                    (yangi — validatsiya)
```

---

## Eksport tarixi

Admin qaysi ma'lumotlar eksport qilinganligini ko'rishi mumkin (Audit Logs bilan integratsiya):

```
Sana          Kim              Nima           Yozuvlar
─────────────────────────────────────────────────────
01.04.2024    Otabek admin     Buyurtmalar    1,234
31.03.2024    Malika admin     Foydalanuvchi    567
30.03.2024    Otabek admin     Mahsulotlar      890
```

---

## Amalga oshirish vaqti (taxminiy)

| Qism | Vaqt |
|------|------|
| Eksport utility funksiyalari | 3 soat |
| ExportButton komponenti | 2 soat |
| Har bir sahifaga eksport qo'shish (5 sahifa) | 5 soat |
| ImportModal komponenti | 5 soat |
| Validatsiya tizimi | 4 soat |
| Import funktsiyasi (mahsulotlar) | 4 soat |
| **Jami** | **~23 soat** |

## Ustuvorlik: O'rta

Buxgalteriya va biznes hisobotlari uchun muhim, lekin asosiy funksiyalar (mahsulotlar, buyurtmalar) tayyor bo'lgandan keyin qo'shilishi mumkin.
