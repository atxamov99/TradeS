import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n";
import { formatRelativeTime, getRoleLabel, getStatusLabel } from "../../i18n/labels";
import { useAdminData } from "../../store/adminData";
import { Icon } from "../../components/shared/Icon";

const statusStyle = {
  active: "bg-primary-container/20 text-on-primary-container",
  pending: "bg-[#fef3c7] text-[#92400e]",
  blocked: "bg-error-container text-on-error-container"
};

export function UserDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const { users, admins, auditLogs } = useAdminData();
  const user = useMemo(() => [...users, ...admins].find((item) => item.id === id), [id, users, admins]);
  const userActivity = useMemo(
    () => auditLogs.filter((item) => item.target === id).slice(0, 6),
    [auditLogs, id]
  );

  usePageTitle(user ? `${user.name} - ${t("navigation.pageMeta.userDetail.title", {}, "Foydalanuvchi")}` : "Foydalanuvchi");

  if (!user) {
    return (
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 text-center max-w-lg mx-auto">
        <h2 className="font-title-sm text-title-sm text-on-surface mb-2">Foydalanuvchi topilmadi</h2>
        <p className="text-body-sm text-on-surface-variant mb-4">ID: {id}</p>
        <Link to="/users" className="text-primary hover:underline text-body-sm inline-flex items-center gap-1">
          <Icon name="arrow_back" className="text-[18px]" /> Foydalanuvchilarga qaytish
        </Link>
      </div>
    );
  }

  const rows = [
    { label: "ID", value: user.id },
    { label: "Telefon", value: user.phone || "—" },
    { label: "Rol", value: getRoleLabel(t, user.role) },
    { label: "Ro'yxatdan o'tgan", value: user.createdAt || "—" },
    { label: "Oxirgi kirish", value: formatRelativeTime(t, user.lastLogin) }
  ];

  return (
    <div className="space-y-section-gap">
      <Link to="/users" className="text-body-sm text-on-surface-variant hover:text-primary inline-flex items-center gap-1">
        <Icon name="arrow_back" className="text-[18px]" /> Foydalanuvchilar
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="lg:col-span-2 bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <div className="flex items-start justify-between gap-4 pb-4 border-b border-outline-variant mb-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-16 h-16 rounded-full bg-primary-container/20 text-on-primary-container flex items-center justify-center font-bold text-xl shrink-0">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h2 className="font-title-sm text-title-sm text-on-surface truncate">{user.name}</h2>
                <p className="text-body-sm text-on-surface-variant truncate">{user.email || "—"}</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${statusStyle[user.status] || "bg-surface-variant text-on-surface"}`}>
              {getStatusLabel(t, user.status)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between items-center py-2 border-b border-outline-variant/50">
                <span className="text-body-sm text-on-surface-variant">{r.label}</span>
                <span className="text-body-sm font-medium text-on-surface text-right">{r.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Activity */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6">
          <h3 className="font-title-sm text-title-sm text-on-surface mb-4">Faoliyat tarixi</h3>
          <div className="space-y-4">
            {userActivity.length ? (
              userActivity.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-container shrink-0" />
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-on-surface">{item.action || "Amal"}</p>
                    <p className="text-xs text-on-surface-variant">
                      {item.actor || "—"} · {item.timestamp || (item.createdAt ? new Date(item.createdAt).toLocaleString("uz-UZ") : "—")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-body-sm text-on-surface-variant">Faoliyat tarixi hozircha yo'q.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
