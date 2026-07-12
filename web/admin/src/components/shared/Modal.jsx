import { useEffect } from "react";
import { useI18n } from "../../i18n";
import { Icon } from "./Icon";

export function Modal({ open, title, description, onClose, children, footer, size = "md" }) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;

    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const maxW = size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className={`bg-surface-container-lowest rounded-xl shadow-modal border border-outline-variant w-full ${maxW} max-h-[90vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-outline-variant bg-surface-bright rounded-t-xl">
          <div>
            <h3 className="font-title-sm text-title-sm text-on-surface">{title}</h3>
            {description && <p className="text-body-sm text-on-surface-variant mt-0.5">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-error transition-colors mt-0.5"
            aria-label={t("common.close", {}, "Yopish")}
          >
            <Icon name="close" />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-6 py-4 border-t border-outline-variant bg-surface-bright rounded-b-xl flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
