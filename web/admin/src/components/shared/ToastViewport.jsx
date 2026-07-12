import { useAdminData } from "../../store/adminData";
import { Icon } from "./Icon";

const toneConfig = {
  success: { icon: "check_circle", ring: "bg-primary-container/15 text-primary-container", bar: "bg-primary-container" },
  danger:  { icon: "error",        ring: "bg-error-container text-error",                  bar: "bg-error" },
  warning: { icon: "warning",      ring: "bg-[#fef3c7] text-[#92400e]",                    bar: "bg-[#d28b16]" },
  info:    { icon: "info",         ring: "bg-secondary-container/15 text-secondary",       bar: "bg-secondary" }
};

export function ToastViewport() {
  const { toasts, dismissToast } = useAdminData();

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-80" aria-live="polite">
      {toasts.map((toast) => {
        const cfg = toneConfig[toast.tone] || toneConfig.success;
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 bg-surface-container-lowest border border-outline-variant rounded-xl p-4 shadow-modal animate-in fade-in slide-in-from-bottom-2"
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${cfg.ring}`}>
              <Icon name={cfg.icon} className="text-[18px]" />
            </div>
            <p className="flex-1 text-body-sm font-medium text-on-surface">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-on-surface-variant hover:text-on-surface transition-colors shrink-0"
              aria-label="Yopish"
            >
              <Icon name="close" className="text-[18px]" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
