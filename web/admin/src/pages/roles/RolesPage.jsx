import { tx } from "../../i18n";
import { useState } from "react";
import { Modal } from "../../components/shared/Modal";
import { usePageTitle } from "../../hooks/usePageTitle";
import { useI18n } from "../../i18n";
import { getRoleLabel } from "../../i18n/labels";
import { useAdminData } from "../../store/adminData";

const emptyRole = {
  name: "",
  scope: "",
  note: ""
};

export function RolesPage() {
  const { t } = useI18n();
  usePageTitle(t("roles.pageTitle"));
  const { roles, createRole } = useAdminData();
  const [modalOpen, setModalOpen] = useState(false);
  const [formState, setFormState] = useState(emptyRole);

  function closeModal() {
    setModalOpen(false);
    setFormState(emptyRole);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setFormState((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    createRole(formState);
    closeModal();
  }

  return (
    <section className="stack">
      <div className="section-card">
        <div className="section-heading">
          <div>
            <h2>{t("roles.title")}</h2>
            <p className="muted-text">{t("roles.description")}</p>
          </div>
          <button type="button" onClick={() => setModalOpen(true)}>
            {t("roles.createRole")}
          </button>
        </div>

        <div className="feature-grid">
          {roles.map((role) => (
            <article className="feature-card" key={role.name}>
              <div className="section-heading">
                <strong>{getRoleLabel(t, role.name) || role.name}</strong>
                <span className="section-chip">
                  {t("roles.members", { count: role.members })}
                </span>
              </div>
              <p className="muted-text">
                {role.scopeKey ? t(role.scopeKey) : role.scope}
              </p>
              <p className="muted-text">
                {role.noteKey ? t(role.noteKey) : role.note}
              </p>
            </article>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={t("roles.createRole")}
        description={t("roles.createRoleDescription")}
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="secondary-button" onClick={closeModal}>
              {t("common.cancel")}
            </button>
            <button type="submit" form="role-form">
              {t("roles.createRole")}
            </button>
          </>
        }
      >
        <form id="role-form" className="settings-form" onSubmit={handleSubmit}>
          <label>
            {t("roles.roleName")}
            <input
              name="name"
              value={formState.name}
              onChange={handleChange}
              placeholder="support_manager"
              required
            />
          </label>
          <label>
            {t("roles.scope")}
            <input
              name="scope"
              value={formState.scope}
              onChange={handleChange}
              placeholder={tx("msg.ph_perms")}
              required
            />
          </label>
          <label>
            {t("roles.note")}
            <textarea
              rows="4"
              name="note"
              value={formState.note}
              onChange={handleChange}
              placeholder={tx("msg.ph_rules")}
              required
            />
          </label>
        </form>
      </Modal>
    </section>
  );
}
