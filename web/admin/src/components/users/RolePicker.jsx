import { Select } from "../shared/Select";
// Picks what an account IS: user / business director / cashier / admin. A cashier also needs the shop he works in.
export const KIND_LABEL = {
  USER: "Foydalanuvchi",
  DIRECTOR: "Biznes direktori",
  CASHIER: "Kassir",
  ADMIN: "Admin"
};

const KIND_HINT = {
  USER: "O'zi uchun ishlaydi (shaxsiy do'kon). Kassirlik bog'lanishi olib tashlanadi.",
  DIRECTOR: "Biznes do'koni egasi: xodimlar (kassirlar), xarajatlar va hisobotlar ochiladi.",
  CASHIER: "Tanlangan biznes do'konida kassir: faqat sotadi, narx va tovarlarni o'zgartira olmaydi.",
  ADMIN: "To'liq admin huquqi: barcha foydalanuvchilar va sozlamalarni boshqaradi. Faqat asosiy admin bera oladi."
};

export const kindBadgeStyle = {
  USER: "bg-[#E5E7EB] text-[#4B5563]",
  DIRECTOR: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  CASHIER: "bg-sky-100 text-sky-800 dark:bg-sky-500/15 dark:text-sky-300",
  ADMIN: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300"
};

const selectCls =
  "w-full px-4 py-2.5 bg-surface border border-outline-variant rounded-lg text-on-surface font-body-md focus:outline-none focus:border-primary cursor-pointer";

export function RolePicker({ kind, shopId, onChange, canAdmin, shops, loadingShops }) {
  const kinds = canAdmin ? ["USER", "DIRECTOR", "CASHIER", "ADMIN"] : ["USER", "DIRECTOR", "CASHIER"];
  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <label className="text-body-sm font-medium text-on-surface">Rol</label>
        <Select
          value={kind}
          onChange={(e) => onChange({ kind: e.target.value, shopId: "" })}
          className={selectCls}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>{KIND_LABEL[k]}</option>
          ))}
        </Select>
        <p className="text-xs text-on-surface-variant">{KIND_HINT[kind]}</p>
      </div>

      {kind === "CASHIER" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-on-surface">Qaysi do'konda kassir *</label>
          <Select
            value={shopId || ""}
            onChange={(e) => onChange({ kind, shopId: e.target.value })}
            className={selectCls}
          >
            <option value="">{loadingShops ? "Yuklanmoqda..." : "Do'konni tanlang"}</option>
            {(shops || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.ownerName ? ` — ${s.ownerName}` : ""}
              </option>
            ))}
          </Select>
          {!loadingShops && (shops || []).length === 0 && (
            <p className="text-xs text-error">Hozircha biznes do'konlari yo'q. Avval kimnidir "Biznes direktori" qiling.</p>
          )}
        </div>
      )}
    </div>
  );
}
