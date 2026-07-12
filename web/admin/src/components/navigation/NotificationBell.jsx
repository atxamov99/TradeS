import { useEffect, useMemo, useRef, useState } from "react";
import { useAdminData } from "../../store/adminData";
import { useI18n } from "../../i18n";
import { Icon } from "../shared/Icon";

const priorityStyle = {
  high:   { cls: "bg-error-container text-on-error-container", icon: "priority_high" },
  medium: { cls: "bg-[#fef3c7] text-[#92400e]", icon: "warning" },
  low:    { cls: "bg-surface-variant text-on-surface-variant", icon: "info" }
};

const toneIcon = {
  success: { cls: "bg-primary-container/15 text-primary-container", icon: "check_circle" },
  danger:  { cls: "bg-error-container text-error", icon: "error" },
  warning: { cls: "bg-[#fef3c7] text-[#92400e]", icon: "warning" },
  info:    { cls: "bg-secondary-container/15 text-secondary", icon: "notifications" }
};

export function NotificationBell() {
  const { notificationFeed, recentActivity } = useAdminData();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [seenCount, setSeenCount] = useState(0);
  const ref = useRef(null);

  const items = useMemo(() => {
    const alerts = (notificationFeed || []).map((n) => ({
      key: `alert-${n.id}`,
      kind: "alert",
      title: n.titleKey ? t(n.titleKey, {}, n.title || "Bildirishnoma") : (n.title || "Bildirishnoma"),
      detail: n.detail || (n.detailKey ? t(n.detailKey, {}, "") : ""),
      priority: n.priority || "low"
    }));
    const activity = (recentActivity || []).slice(0, 8).map((a, i) => ({
      key: `act-${i}`,
      kind: "activity",
      title: a.title || "Amal",
      detail: a.detail || "",
      time: a.time || "",
      tone: a.tone || "info"
    }));
    return [...alerts, ...activity];
  }, [notificationFeed, recentActivity, t]);

  const unread = Math.max(0, items.length - seenCount);

  // Close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next) setSeenCount(items.length); // mark all as seen when opening
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        className="relative text-on-surface-variant hover:text-primary transition-colors"
        aria-label="Bildirishnomalar"
        aria-expanded={open}
      >
        <Icon name="notifications" fill={open} />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-error text-on-error text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] bg-surface-container-lowest border border-outline-variant rounded-xl shadow-modal overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-surface-bright">
            <h3 className="font-title-sm text-title-sm text-on-surface">Bildirishnomalar</h3>
            {items.length > 0 && (
              <span className="text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-full">{items.length}</span>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-outline-variant/60">
            {items.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Icon name="notifications_off" className="text-on-surface-variant text-[28px]" />
                <p className="text-body-sm text-on-surface-variant mt-2">Hozircha bildirishnoma yo'q</p>
              </div>
            ) : (
              items.map((it) => {
                const style = it.kind === "alert"
                  ? (priorityStyle[it.priority] || priorityStyle.low)
                  : (toneIcon[it.tone] || toneIcon.info);
                return (
                  <div key={it.key} className="px-4 py-3 flex items-start gap-3 hover:bg-surface-container-low transition-colors">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${style.cls}`}>
                      <Icon name={style.icon} className="text-[18px]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-body-sm font-medium text-on-surface">{it.title}</p>
                      {it.detail && <p className="text-xs text-on-surface-variant mt-0.5 break-words">{it.detail}</p>}
                      {it.time && <p className="text-xs text-on-surface-variant/70 mt-0.5">{it.time}</p>}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
