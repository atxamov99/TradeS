import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import api from '../api/axios';

function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

export default function Profile() {
  const { t } = useTranslation();
  const { user, updateUser } = useAuthStore();

  const [editing, setEditing] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPassword, setSavingPassword] = useState(false);

  const inputCls = "w-full h-12 rounded-xl border border-[#E2E8F0] bg-white px-4 text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition";
  const labelCls = "block text-sm font-semibold text-[#0F172A] mb-2";

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.patch('/users/profile', profileForm);
      updateUser(res.data.data.user);
      toast.success(t('profile_updated'));
      setEditing(false);
    } catch {
      // the axios interceptor already toasts the error (e.g. 409 email taken)
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      await api.patch('/users/change-password', pwForm);
      toast.success(t('password_updated'));
      setPwForm({ currentPassword: '', newPassword: '' });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="bg-white border-b border-[#E2E8F0] px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold text-[#0F172A]">{t('profile')}</h1>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-3xl mx-auto flex flex-col gap-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0] flex items-center justify-between">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t('profile')}</p>
            {!editing && (
              <button
                onClick={() => {
                  setProfileForm({ name: user?.name || '', phone: user?.phone || '', email: user?.email || '' });
                  setEditing(true);
                }}
                className="flex items-center gap-1.5 text-sm font-semibold text-green-600 hover:text-green-700"
              >
                <Pencil size={14} /> {t('edit')}
              </button>
            )}
          </div>

          {editing ? (
            <form onSubmit={handleProfileSave} className="p-5 flex flex-col gap-4">
              <div>
                <label className={labelCls}>{t('full_name')}</label>
                <input className={inputCls} value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>{t('phone')}</label>
                <input className={inputCls} value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder={t('enter_phone')} />
              </div>
              <div>
                <label className={labelCls}>
                  {t('email')} <span className="font-normal text-[#94A3B8]">({t('optional')})</span>
                </label>
                <input type="email" className={inputCls} value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} placeholder={t('enter_email')} />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditing(false)} className="flex-1 h-12 rounded-xl border border-[#E2E8F0] text-[#64748B] font-semibold hover:bg-slate-50 transition">
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="flex-1 h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {savingProfile ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('save')}
                </button>
              </div>
            </form>
          ) : (
            <div className="px-5 py-5 flex items-center gap-4">
              <div className="w-[60px] h-[60px] rounded-2xl bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center flex-shrink-0 shadow-sm">
                <span className="text-white text-xl font-bold leading-none">{getInitials(user?.name)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-[#0F172A] truncate">{user?.name || '—'}</p>
                <p className="text-sm text-[#64748B] truncate mt-0.5">{user?.phone || '—'}</p>
                {user?.email && <p className="text-sm text-[#64748B] truncate mt-0.5">{user.email}</p>}
              </div>
            </div>
          )}
        </div>

        {/* Change password card */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E2E8F0]">
            <p className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">{t('change_password')}</p>
          </div>
          <form onSubmit={handlePasswordSave} className="p-5 flex flex-col gap-4">
            <div>
              <label className={labelCls}>{t('current_password')}</label>
              <input type="password" className={inputCls} value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} required />
            </div>
            <div>
              <label className={labelCls}>{t('new_password')}</label>
              <input type="password" className={inputCls} value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} required />
            </div>
            <button
              type="submit"
              disabled={savingPassword}
              className="h-12 rounded-xl bg-green-500 hover:bg-green-600 text-white font-bold transition flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {savingPassword ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('update_password')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
