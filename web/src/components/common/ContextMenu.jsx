import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ArrowLeft, ArrowRight, Bell, Calculator, Copy, ExternalLink, LifeBuoy, Link2, Maximize, Minimize, Moon, Package, Printer, RotateCw, ShoppingCart, Sun, ZoomIn, ZoomOut } from 'lucide-react';
import useThemeStore from '../../store/themeStore';
import useNotificationStore from '../../store/notificationStore';
import useAuthStore from '../../store/authStore';
import MiniCalculator from './MiniCalculator';

const SUPPORT_URL = 'https://t.me/trades_uz_bot?start=support';
const LANGS = [
  { code: 'uz', label: 'UZ' },
  { code: 'ru', label: 'RU' },
  { code: 'en', label: 'EN' },
];
const MENU_WIDTH = 252;
const ZOOM_KEY = 'savdo-zoom';
const ZOOM_MIN = 85;
const ZOOM_MAX = 130;

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

function Item({ icon: Icon, label, hint, onClick, badge }) {
  return (
    <button
      type="button"
      role="menuitem"
      data-ctx-item
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13.5px] font-medium text-slate-700 transition-colors hover:bg-green-500/10 hover:text-green-600 focus-visible:bg-green-500/10 focus-visible:text-green-600 focus-visible:outline-none dark:text-slate-200 dark:hover:text-green-400 dark:focus-visible:text-green-400"
    >
      <Icon size={16} className="shrink-0 opacity-80" />
      <span className="flex-1 truncate">{label}</span>
      {badge > 0 && <span className="flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{badge > 9 ? '9+' : badge}</span>}
      {hint && <span className="text-[11px] font-normal text-slate-400">{hint}</span>}
    </button>
  );
}

const Sep = () => <div className="my-1 h-px bg-slate-100 dark:bg-slate-800" />;

/**
 * App-wide custom right-click menu in the TradeS design.
 * Never hijacks: text fields / editable areas, Shift+right-click (native menu on demand),
 * elements marked data-native-menu, and touch devices (long-press keeps native selection).
 */
export default function ContextMenu() {
  const { t, i18n } = useTranslation();
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const setPanelOpen = useNotificationStore((s) => s.setPanelOpen);
  const unread = useNotificationStore((s) => s.items.filter((n) => !n.read).length);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [calc, setCalc] = useState(false);
  const [isFull, setIsFull] = useState(() => !!document.fullscreenElement);
  const [zoom, setZoom] = useState(() => {
    const saved = Number(localStorage.getItem(ZOOM_KEY));
    return saved >= ZOOM_MIN && saved <= ZOOM_MAX ? saved : 100;
  });
  const [menu, setMenu] = useState(null); // { x, y, link, selection }
  const [pos, setPos] = useState({ left: 0, top: 0, origin: 'top left' });
  const ref = useRef(null);

  const close = useCallback(() => setMenu(null), []);

  // Text size (accessibility / small screens): scales every rem-based size, remembered between visits.
  useEffect(() => {
    document.documentElement.style.fontSize = zoom === 100 ? '' : `${zoom}%`;
    try { localStorage.setItem(ZOOM_KEY, String(zoom)); } catch { /* storage blocked */ }
  }, [zoom]);
  const changeZoom = (delta) => setZoom((z) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z + delta)));

  useEffect(() => {
    const onFs = () => setIsFull(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  // open
  useEffect(() => {
    const onContext = (e) => {
      if (e.shiftKey) return; // power-user escape hatch -> native browser menu
      if (window.matchMedia?.('(pointer: coarse)').matches) return;
      const el = e.target;
      if (!(el instanceof Element)) return;
      if (el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"], [data-native-menu]')) return;
      e.preventDefault();
      const anchor = el.closest('a[href]');
      setMenu({
        x: e.clientX,
        y: e.clientY,
        link: anchor ? anchor.href : null,
        selection: (window.getSelection?.()?.toString() || '').trim(),
      });
    };
    document.addEventListener('contextmenu', onContext);
    return () => document.removeEventListener('contextmenu', onContext);
  }, []);

  // close on outside click / Escape / scroll / resize / blur; arrow-key navigation
  useEffect(() => {
    if (!menu) return undefined;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) close(); };
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const items = [...(ref.current?.querySelectorAll('[data-ctx-item]') || [])];
      if (!items.length) return;
      const i = items.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? (i + 1) % items.length : (i <= 0 ? items.length - 1 : i - 1);
      items[next].focus();
    };
    document.addEventListener('mousedown', onDown, true);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    window.addEventListener('blur', close);
    return () => {
      document.removeEventListener('mousedown', onDown, true);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
      window.removeEventListener('blur', close);
    };
  }, [menu, close]);

  // keep the menu inside the viewport (flip when there is no room)
  useLayoutEffect(() => {
    if (!menu || !ref.current) return;
    const { width, height } = ref.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const flipX = menu.x + width + 8 > vw;
    const flipY = menu.y + height + 8 > vh;
    setPos({
      left: Math.max(8, flipX ? menu.x - width : menu.x),
      top: Math.max(8, flipY ? Math.max(8, vh - height - 8) : menu.y),
      origin: `${flipY ? 'bottom' : 'top'} ${flipX ? 'right' : 'left'}`,
    });
  }, [menu]);

  if (!menu) return calc ? <MiniCalculator onClose={() => setCalc(false)} /> : null;

  const run = (fn) => () => { close(); fn(); };
  const copy = (text) => async () => { if (await copyText(text)) toast.success(t('ctx_copied'), { duration: 1500 }); };
  const isDark = theme === 'dark';

  return (
    <>
    {calc && <MiniCalculator onClose={() => setCalc(false)} />}
    <div
      ref={ref}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
      style={{ left: pos.left, top: pos.top, width: MENU_WIDTH, transformOrigin: pos.origin, animation: 'ctxIn .12s ease-out' }}
      className="fixed z-[200] max-h-[calc(100vh-16px)] overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-1.5 shadow-2xl backdrop-blur-md dark:border-[#223027] dark:bg-[#0E150F]/95"
    >
      {/* brand strip */}
      <div className="flex items-center gap-2 px-3 pb-1.5 pt-1">
        <img src="/logo.png" alt="" className="h-5 w-5 rounded object-contain" />
        <span className="text-xs font-extrabold tracking-wide text-green-500">TradeS</span>
      </div>

      {/* navigation row */}
      <div className="grid grid-cols-3 gap-1 px-1 pb-1">
        {[
          { icon: ArrowLeft, label: t('ctx_back'), hint: 'Alt+←', onClick: run(() => window.history.back()) },
          { icon: ArrowRight, label: t('ctx_forward'), hint: 'Alt+→', onClick: run(() => window.history.forward()) },
          { icon: RotateCw, label: t('ctx_reload'), hint: 'Ctrl+R', onClick: run(() => window.location.reload()) },
        ].map(({ icon: Icon, label, hint, onClick }) => (
          <button
            key={label}
            type="button"
            role="menuitem"
            data-ctx-item
            title={`${label} (${hint})`}
            aria-label={label}
            onClick={onClick}
            className="flex h-9 items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-green-500/10 hover:text-green-600 focus-visible:bg-green-500/10 focus-visible:outline-none dark:text-slate-300 dark:hover:text-green-400"
          >
            <Icon size={17} />
          </button>
        ))}
      </div>
      <Sep />

      {menu.link && (
        <>
          <Item icon={ExternalLink} label={t('ctx_open_new_tab')} onClick={run(() => window.open(menu.link, '_blank', 'noopener'))} />
          <Item icon={Link2} label={t('ctx_copy_link')} onClick={run(copy(menu.link))} />
          <Sep />
        </>
      )}
      {menu.selection && (
        <>
          <Item icon={Copy} label={t('ctx_copy')} hint="Ctrl+C" onClick={run(copy(menu.selection))} />
          <Sep />
        </>
      )}

      {user && (
        <>
          <Item icon={ShoppingCart} label={t('ctx_new_sale')} onClick={run(() => navigate('/dashboard/sales'))} />
          <Item icon={Package} label={t('ctx_products')} onClick={run(() => navigate('/dashboard/products'))} />
          <Sep />
        </>
      )}

      <Item icon={Link2} label={t('ctx_share_page')} onClick={run(copy(window.location.href))} />
      <Item icon={Printer} label={t('ctx_print')} hint="Ctrl+P" onClick={run(() => window.print())} />
      <Item icon={Calculator} label={t('ctx_calculator')} onClick={run(() => setCalc(true))} />
      <Item
        icon={isFull ? Minimize : Maximize}
        label={isFull ? t('ctx_exit_fullscreen') : t('ctx_fullscreen')}
        hint="F11"
        onClick={run(() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.()))}
      />
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="flex-1 text-[13.5px] font-medium text-slate-700 dark:text-slate-200">{t('ctx_text_size')}</span>
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-[#121B14]">
          <button type="button" data-ctx-item aria-label="-" onClick={() => changeZoom(-5)} disabled={zoom <= ZOOM_MIN} className="rounded-lg p-1 text-slate-500 hover:text-green-600 focus-visible:outline-none disabled:opacity-30 dark:text-slate-400"><ZoomOut size={14} /></button>
          <span className="w-10 text-center text-[11px] font-bold text-slate-700 dark:text-slate-200">{zoom}%</span>
          <button type="button" data-ctx-item aria-label="+" onClick={() => changeZoom(5)} disabled={zoom >= ZOOM_MAX} className="rounded-lg p-1 text-slate-500 hover:text-green-600 focus-visible:outline-none disabled:opacity-30 dark:text-slate-400"><ZoomIn size={14} /></button>
        </div>
      </div>
      <Sep />

      {/* language chips */}
      <div className="flex items-center gap-2 px-3 py-1.5">
        <span className="flex-1 text-[13.5px] font-medium text-slate-700 dark:text-slate-200">{t('ctx_language')}</span>
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {LANGS.map(({ code, label }) => {
            const active = (i18n.language || 'uz').slice(0, 2) === code;
            return (
              <button
                key={code}
                type="button"
                data-ctx-item
                onClick={() => i18n.changeLanguage(code)}
                className={`rounded-lg px-2 py-1 text-[11px] font-bold transition-colors focus-visible:outline-none ${active ? 'bg-green-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <Item icon={isDark ? Sun : Moon} label={isDark ? t('ctx_theme_light') : t('ctx_theme_dark')} onClick={run(toggleTheme)} />
      <Item icon={Bell} label={t('ctx_notifications')} badge={unread} onClick={run(() => setPanelOpen(true))} />
      <Item icon={LifeBuoy} label={t('ctx_support')} onClick={run(() => window.open(SUPPORT_URL, '_blank', 'noopener'))} />

      <p className="px-3 pb-1 pt-2 text-[10.5px] leading-snug text-slate-400">{t('ctx_native_hint')}</p>
    </div>
    </>
  );
}
