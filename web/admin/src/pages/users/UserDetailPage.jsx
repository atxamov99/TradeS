import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n";
import { formatRelativeTime, getRoleLabel, getStatusLabel } from "../../i18n/labels";
import { useAdminData } from "../../store/adminData";

export function UserDetailPage() {
  const { t } = useI18n();
  const { id } = useParams();
  const { users, auditLogs } = useAdminData();
  const user = useMemo(() => users.find((item) => item.id === id), [id, users]);
  const userActivity = useMemo(
    () => auditLogs.filter((item) => item.target === id).slice(0, 4),
    [auditLogs, id]
  );

  usePageTitle(user ? `${user.name} - ${t("navigation.pageMeta.userDetail.title")}` : t("navigation.pageMeta.userDetail.title"));

  if (!user) {
    return (
      <section className="stack">
        <div className="section-card">
          <h2>{t("users.userNotFound")}</h2>
          <p className="muted-text">{t("users.userNotFoundDescription", { id })}</p>
          <Link className="inline-link" to="/users">
            {t("users.backToUsers")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-grid">
      <article className="section-card">
        <div className="section-heading">
          <div>
            <h2>{user.name}</h2>
            <p className="muted-text">{user.email}</p>
          </div>
          <span className={`table-badge ${user.status}`}>
            {getStatusLabel(t, user.status)}
          </span>
        </div>

        <div className="key-value-grid">
          <div>
            <span>{t("common.id")}</span>
            <strong>{user.id}</strong>
          </div>
          <div>
            <span>{t("common.phone")}</span>
            <strong>{user.phone}</strong>
          </div>
          <div>
            <span>{t("common.role")}</span>
            <strong>{getRoleLabel(t, user.role)}</strong>
          </div>
          <div>
            <span>{t("common.createdAt")}</span>
            <strong>{user.createdAt}</strong>
          </div>
          <div>
            <span>{t("common.lastLogin")}</span>
            <strong>{formatRelativeTime(t, user.lastLogin)}</strong>
          </div>
          <div>
            <span>{t("common.notes")}</span>
            <strong>{t("users.notesReady")}</strong>
          </div>
        </div>
      </article>

      <article className="section-card">
        <div className="section-heading">
          <h2>{t("users.activityHistory")}</h2>
          <span className="section-chip">{t("users.plannedDetailBlock")}</span>
        </div>

        <div className="timeline">
          {userActivity.length ? (
            userActivity.map((item) => (
              <div className="timeline-item" key={`${item.id || item.action}-${item.timestamp || item.createdAt}`}>
                <span className="timeline-dot info" />
                <div>
                  <strong>{item.action || t("audit.title")}</strong>
                  <p className="muted-text">
                    {item.actor || "—"} | {item.timestamp || (item.createdAt ? new Date(item.createdAt).toLocaleString("uz-UZ") : "—")}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <>
              <div className="timeline-item">
                <span className="timeline-dot info" />
                <div>
                  <strong>{t("users.passwordResetPrepared")}</strong>
                  <p className="muted-text">
                    {t("users.passwordResetPreparedDescription")}
                  </p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot success" />
                <div>
                  <strong>{t("users.roleAssignmentVisible")}</strong>
                  <p className="muted-text">
                    {t("users.roleAssignmentVisibleDescription")}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </article>
    </section>
  );
}
