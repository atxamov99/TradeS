import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Bell, CheckCheck, CheckCircle2, Info, Trash2, X, XCircle } from 'lucide-react';
import useNotificationStore from '../../store/notificationStore';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

const TYPE_STYLE = {
  error: { Icon: XCircle, ring: 'bg-red-500/15 text-red-500', bar: 'bg-red-500' },
  warning: { Icon: AlertTriangle, ring: 'bg-amber-500/15 text-amber-500', bar: 'bg-amber-500' },
  success: { Icon: CheckCircle2, ring: 'bg-green-500/15 text-green-500', bar: 'bg-green-500' },
  info: { Icon: Info, ring: 'bg-blue-500/15 text-blue-500', bar: 'bg-blue-500' },
};

function useTimeAgo() {
  const { t } = useTranslation();
  return (ts) => {
    const sec = Math.max(0, (Date.now() - ts) / 1000);
    if (sec < 45) return t('notif_just_now');
    const min = Math.round(sec / 60);
    if (min < 60) return t('notif_min_ago', { n: min });
    const h = Math.round(min / 60);
    if (h < 24) return t('notif_hour_ago', { n: h });
    return t('notif_day_ago', { n: Math.round(h / 24) });
  };
}

/* ───────────── Floating pop-up: auto-hides, swipe left/right (or drag with the mouse) to dismiss ───────────── */
const SWIPE_DISTANCE = 90;
const AUTO_HIDE_MS = 8000;

function SwipeToast({ item, onClose, onOpen }) {
  const { t } = useTranslation();
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [entered, setEntered] = useState(false);
  const [run, setRun] = useState(false);
  const startX = useRef(0);
  const moved = useRef(false);
  const style = TYPE_STYLE[item.type] || TYPE_STYLE.info;
  const { Icon } = style;

  useEffect(() => {
    const raf = requestAnimationFrame(() => { setEntered(true); setRun(true); });
    const timer = setTimeout(onClose, AUTO_HIDE_MS);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [onClose]);

  const onPointerDown = (e) => {
    if (e.target.closest('button')) return;
    startX.current = e.clientX;
    moved.current = false;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const d = e.clientX - startX.current;
    if (Math.abs(d) > 4) moved.current = true;
    setDx(d);
  };
  const onPointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    if (Math.abs(dx) > SWIPE_DISTANCE) {
      setDx(dx > 0 ? 520 : -520); // fly out
      setTimeout(onClose, 180);
    } else {
      setDx(0);
      if (!moved.current) onOpen?.();
    }
  };

  return (
    <div
      role="status"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      style={{
        transform: `translateX(${entered ? dx : 40}px)`,
        opacity: entered ? Math.max(0.15, 1 - Math.abs(dx) / 280) : 0,
        transition: dragging ? 'none' : 'transform .22s ease, opacity .22s ease',
        touchAction: 'pan-y',
      }}
      className="relative w-[340px] max-w-[calc(100vw-24px)] cursor-grab select-none overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-xl backdrop-blur active:cursor-grabbing dark:border-slate-700 dark:bg-slate-800/95"
    >
      <div className="flex items-start gap-3 p-3.5 pr-9">
        <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${style.ring}`}>
          <Icon size={19} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-snug text-slate-900 dark:text-white">{item.title}</p>
          {item.message && <p className="mt-0.5 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{item.message}</p>}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label={t('notif_close')}
        className="absolute right-2 top-2 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        <X size={15} />
      </button>
      <div className="h-[3px] w-full bg-slate-100 dark:bg-slate-700">
        <div className={`h-full ${style.bar}`} style={{ width: run ? '0%' : '100%', transition: `width ${AUTO_HIDE_MS}ms linear` }} />
      </div>
    </div>
  );
}

export function ToastStack() {
  const navigate = useNavigate();
  const items = useNotificationStore((s) => s.items);
  const toasts = useNotificationStore((s) => s.toasts);
  const dismissToast = useNotificationStore((s) => s.dismissToast);
  const markRead = useNotificationStore((s) => s.markRead);
  const visible = toasts.map((id) => items.find((n) => n.id === id)).filter(Boolean);
  if (!visible.length) return null;
  return (
    <div className="pointer-events-none fixed bottom-20 right-3 z-[90] flex flex-col items-end gap-2 md:bottom-5 md:right-5">
      {visible.map((n) => (
        <div key={n.id} className="pointer-events-auto">
          <SwipeToast
            item={n}
            onClose={() => dismissToast(n.id)}
            onOpen={() => { markRead(n.id); dismissToast(n.id); if (n.link) navigate(n.link); }}
          />
        </div>
      ))}
    </div>
  );
}

/* ───────────── Bell + history panel ───────────── */
export function NotificationBell({ variant = 'floating' }) {
  const sidebar = variant === 'sidebar';
  const { t } = useTranslation();
  const navigate = useNavigate();
  const timeAgo = useTimeAgo();
  const items = useNotificationStore((s) => s.items);
  const open = useNotificationStore((s) => s.panelOpen);
  const setOpen = useNotificationStore((s) => s.setPanelOpen);
  const markRead = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const remove = useNotificationStore((s) => s.remove);
  const clear = useNotificationStore((s) => s.clear);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);
  const [panelPos, setPanelPos] = useState(null);
  const unread = items.filter((n) => !n.read).length;

  // In the sidebar the panel is position:fixed (so the sidebar never clips it) and opens to its right.
  useLayoutEffect(() => {
    if (!open || !sidebar || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPanelPos({ left: r.right + 12, top: Math.max(8, r.top - 6) });
  }, [open, sidebar]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open, setOpen]);

  return (
    <div ref={wrapRef} className={sidebar ? 'relative ml-auto shrink-0' : 'fixed right-3 top-3 z-50 md:hidden'}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label={t('notif_title')}
        className={`relative flex ${sidebar ? 'h-8 w-8' : 'h-10 w-10'} items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:border-green-400 hover:text-green-600 active:scale-95 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-green-400`}
      >
        <Bell size={sidebar ? 17 : 19} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          style={sidebar && panelPos ? { left: panelPos.left, top: panelPos.top } : undefined}
          className={`${sidebar ? 'fixed z-[120]' : 'absolute right-0 mt-2'} w-[360px] max-w-[calc(100vw-24px)] origin-top-right overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900`}
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('notif_title')}</h3>
            <div className="flex items-center gap-1">
              <button type="button" onClick={markAllRead} disabled={!unread} title={t('notif_mark_all')} aria-label={t('notif_mark_all')}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-green-600 disabled:opacity-30 dark:hover:bg-slate-800">
                <CheckCheck size={17} />
              </button>
              <button type="button" onClick={clear} disabled={!items.length} title={t('notif_clear')} aria-label={t('notif_clear')}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-red-500 disabled:opacity-30 dark:hover:bg-slate-800">
                <Trash2 size={17} />
              </button>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800"><Bell size={22} /></div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('notif_empty')}</p>
              </div>
            ) : (
              items.map((n) => {
                const st = TYPE_STYLE[n.type] || TYPE_STYLE.info;
                const { Icon } = st;
                return (
                  <div
                    key={n.id}
                    onClick={() => { markRead(n.id); if (n.link) { setOpen(false); navigate(n.link); } }}
                    className={`group relative flex cursor-pointer items-start gap-3 border-b border-slate-50 px-4 py-3 transition-colors last:border-0 hover:bg-slate-50 dark:border-slate-800/60 dark:hover:bg-slate-800/60 ${n.read ? '' : 'bg-green-50/40 dark:bg-green-500/5'}`}
                  >
                    <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${st.ring}`}><Icon size={17} /></div>
                    <div className="min-w-0 flex-1 pr-5">
                      <p className={`text-sm leading-snug ${n.read ? 'font-medium text-slate-600 dark:text-slate-300' : 'font-bold text-slate-900 dark:text-white'}`}>{n.title}</p>
                      {n.message && <p className="mt-0.5 text-[13px] leading-snug text-slate-500 dark:text-slate-400">{n.message}</p>}
                      <p className="mt-1 text-[11px] text-slate-400">{timeAgo(n.ts)}</p>
                    </div>
                    {!n.read && <span className="absolute right-4 top-4 h-2 w-2 rounded-full bg-green-500" />}
                    <button type="button" aria-label={t('notif_close')}
                      onClick={(e) => { e.stopPropagation(); remove(n.id); }}
                      className="absolute bottom-2 right-2 rounded-md p-1 text-slate-300 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100">
                      <X size={14} />
                    </button>
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

/* ───────────── Watches stock and raises alerts (low / out of stock) ───────────── */
const LOW_STOCK_POLL_MS = 5 * 60 * 1000;

export function useStockAlerts() {
  const { t, i18n } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const notify = useNotificationStore((s) => s.notify);
  const removeByKey = useNotificationStore((s) => s.removeByKey);
  const knownKeys = useRef(new Set());

  const unitLabel = useCallback((unit) => {
    const lang = (i18n.language || 'uz').slice(0, 2);
    const map = { pcs: { uz: 'dona', ru: 'шт.', en: 'pcs' }, kg: { uz: 'kg', ru: 'кг', en: 'kg' }, l: { uz: 'l', ru: 'л', en: 'l' } };
    return map[unit]?.[lang] || unit || '';
  }, [i18n.language]);

  useEffect(() => {
    if (!user) return undefined;
    let cancelled = false;
    const run = async () => {
      try {
        const res = await api.get('/reports/summary');
        const data = res.data?.data;
        const low = (data?.summary || data)?.lowStock || [];
        if (cancelled) return;
        const present = new Set();
        low.forEach((p, i) => {
          const key = `low:${p.id}`;
          present.add(key);
          const out = Number(p.stock) <= 0;
          notify({
            key,
            type: out ? 'error' : 'warning',
            title: `${out ? t('notif_out_of_stock') : t('notif_low_stock')}: ${p.name}`,
            message: out ? '' : t('notif_left', { count: p.stock, unit: unitLabel(p.unit) }),
            link: '/dashboard/products',
            toast: i < 2, // never flood the screen on the first load
          });
        });
        // Products that are no longer low (restocked) disappear from the list.
        knownKeys.current.forEach((k) => { if (!present.has(k)) removeByKey(k); });
        knownKeys.current = present;
      } catch {
        /* network/server problems are reported by the axios interceptor */
      }
    };
    run();
    const timer = setInterval(run, LOW_STOCK_POLL_MS);
    const onFocus = () => run();
    window.addEventListener('focus', onFocus);
    return () => { cancelled = true; clearInterval(timer); window.removeEventListener('focus', onFocus); };
  }, [user?.id, i18n.language]); // eslint-disable-line react-hooks/exhaustive-deps
}
