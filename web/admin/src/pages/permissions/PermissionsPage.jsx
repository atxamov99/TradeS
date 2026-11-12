import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n";
import { getActionLabel, getModuleLabel, getRoleLabel } from "../../i18n/labels";
import { useAdminData } from "../../store/adminData";

const roleKeys = ["admin", "editor", "viewer"];
const permissionOptions = ["view", "create", "update", "delete", "export", "manage"];

export function PermissionsPage() {
  const { t } = useI18n();
  usePageTitle(t("permissions.pageTitle"));
  const { permissionMatrix, togglePermission, savePermissions } = useAdminData();

  return (
    <section className="stack">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <h2>{t("permissions.title")}</h2>
            <p className="muted-text">{t("permissions.description")}</p>
          </div>
          <button type="button" onClick={savePermissions}>
            {t("common.saveChanges")}
          </button>
        </div>

        <div className="permission-grid">
          {permissionMatrix.map((row) => (
            <article className="permission-card" key={row.module}>
              <strong>{getModuleLabel(t, row.module)}</strong>
              <div className="permission-roles">
                {roleKeys.map((roleKey) => (
                  <div className="permission-role" key={`${row.module}-${roleKey}`}>
                    <span className="permission-role-title">
                      {getRoleLabel(t, roleKey)}
                    </span>
                    <div className="permission-checks">
                      {permissionOptions.map((action) => (
                        <label key={`${roleKey}-${action}`} className="check-row">
                          <input
                            type="checkbox"
                            checked={row[roleKey].includes(action)}
                            onChange={() =>
                              togglePermission(row.module, roleKey, action)
                            }
                          />
                          <span>{getActionLabel(t, action)}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
