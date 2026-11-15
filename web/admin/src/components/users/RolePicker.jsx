import { tx } from "../../i18n";
import { Select } from "../shared/Select";
// Picks what an account IS: user / business director / cashier / admin. A cashier also needs the shop he works in.
const LABEL_KEY = { USER: "msg.foydalanuvchi", DIRECTOR: "msg.kind_director", CASHIER: "msg.kind_cashier", ADMIN: "msg.kind_admin" };
const HINT_KEY = { USER: "msg.hint_user", DIRECTOR: "msg.hint_director", CASHIER: "msg.hint_cashier", ADMIN: "msg.hint_admin" };
// functions (not constants): the text must follow the language that is on screen
export const kindLabel = (k) => tx(LABEL_KEY[k] || LABEL_KEY.USER);
const kindHint = (k) => tx(HINT_KEY[k] || HINT_KEY.USER);

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
        <label className="text-body-sm font-medium text-on-surface">{tx("msg.rol")}</label>
        <Select
          value={kind}
          onChange={(e) => onChange({ kind: e.target.value, shopId: "" })}
          className={selectCls}
        >
          {kinds.map((k) => (
            <option key={k} value={k}>{kindLabel(k)}</option>
          ))}
        </Select>
        <p className="text-xs text-on-surface-variant">{kindHint(kind)}</p>
      </div>

      {kind === "CASHIER" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-body-sm font-medium text-on-surface">{tx("msg.qaysi_do_konda_kassir_req")}</label>
          <Select
            value={shopId || ""}
            onChange={(e) => onChange({ kind, shopId: e.target.value })}
            className={selectCls}
          >
            <option value="">{loadingShops ? tx("msg.yuklanmoqda_dots") : tx("msg.do_konni_tanlang")}</option>
            {(shops || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.ownerName ? ` — ${s.ownerName}` : ""}
              </option>
            ))}
          </Select>
          {!loadingShops && (shops || []).length === 0 && (
            <p className="text-xs text-error">{tx("msg.noBizShops")}</p>
          )}
        </div>
      )}
    </div>
  );
}
