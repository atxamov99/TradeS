import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Copy, Delete, GripHorizontal, X } from 'lucide-react';

const KEYS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '='],
];

// Safe evaluation of "12+3×4" style input without eval(): tokenize, then two precedence passes.
function evaluate(expr) {
  const tokens = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').match(/\d*\.?\d+|[+\-*/]/g);
  if (!tokens) return null;
  const nums = [];
  const ops = [];
  for (let i = 0; i < tokens.length; i++) {
    const tk = tokens[i];
    if (/[+\-*/]/.test(tk)) {
      if ((i === 0 || /[+\-*/]/.test(tokens[i - 1])) && tk === '-') { // unary minus
        if (i + 1 < tokens.length) tokens[i + 1] = '-' + tokens[i + 1];
        continue;
      }
      ops.push(tk);
    } else nums.push(parseFloat(tk));
  }
  if (nums.length !== ops.length + 1) return null;
  // first pass: * and /
  const n2 = [nums[0]];
  const o2 = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i] === '*' || ops[i] === '/') {
      const a = n2.pop();
      const b = nums[i + 1];
      if (ops[i] === '/' && b === 0) return null;
      n2.push(ops[i] === '*' ? a * b : a / b);
    } else { o2.push(ops[i]); n2.push(nums[i + 1]); }
  }
  let r = n2[0];
  for (let i = 0; i < o2.length; i++) r = o2[i] === '+' ? r + n2[i + 1] : r - n2[i + 1];
  return Number.isFinite(r) ? r : null;
}
const fmt = (n) => (n === null ? '—' : String(Math.round(n * 1e8) / 1e8));

/** Small draggable calculator for the cashier desk (opened from the context menu). */
export default function MiniCalculator({ onClose }) {
  const { t } = useTranslation();
  const [expr, setExpr] = useState('');
  const [result, setResult] = useState('');
  const [pos, setPos] = useState({ x: Math.max(16, window.innerWidth - 320), y: 90 });
  const drag = useRef(null);

  const press = useCallback((k) => {
    if (k === 'C') { setExpr(''); setResult(''); return; }
    if (k === '⌫') { setExpr((e) => e.slice(0, -1)); return; }
    if (k === '=') { setExpr((e) => { const r = evaluate(e); return r === null ? e : fmt(r); }); return; }
    if (k === '%') { setExpr((e) => { const r = evaluate(e); return r === null ? e : fmt(r / 100); }); return; }
    setExpr((e) => {
      const isOp = /[+−×÷]/.test(k);
      if (isOp && /[+−×÷]$/.test(e)) return e.slice(0, -1) + k; // replace the operator
      if (isOp && e === '') return k === '−' ? '−' : e;
      if (k === '.' && /\.\d*$/.test(e.split(/[+−×÷]/).pop())) return e; // one dot per number
      return e + k;
    });
  }, []);

  // live preview of the running result
  useEffect(() => {
    const r = evaluate(expr);
    setResult(r !== null && /[+−×÷]/.test(expr.slice(1)) ? fmt(r) : '');
  }, [expr]);

  // keyboard
  useEffect(() => {
    const onKey = (e) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'Escape') { onClose(); return; }
      const map = { '*': '×', '/': '÷', '-': '−', Enter: '=', Backspace: '⌫', Delete: 'C' };
      const k = map[e.key] || e.key;
      if (/^[0-9.+−×÷%=C⌫]$/.test(k)) { e.preventDefault(); press(k); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [press, onClose]);

  const onDragStart = (e) => { drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const onDragMove = (e) => {
    if (!drag.current) return;
    setPos({
      x: Math.min(window.innerWidth - 80, Math.max(0, e.clientX - drag.current.dx)),
      y: Math.min(window.innerHeight - 60, Math.max(0, e.clientY - drag.current.dy)),
    });
  };
  const onDragEnd = () => { drag.current = null; };

  const copy = async () => {
    const value = result || expr;
    if (!value) return;
    try { await navigator.clipboard.writeText(value); toast.success(t('ctx_copied'), { duration: 1200 }); } catch { /* clipboard blocked */ }
  };

  return (
    <div
      role="dialog"
      aria-label={t('ctx_calculator')}
      style={{ left: pos.x, top: pos.y }}
      className="fixed z-[210] w-[272px] select-none rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur-md dark:border-[#223027] dark:bg-[#0E150F]/95"
    >
      <div className="mb-2 flex items-center justify-between">
        <div onPointerDown={onDragStart} onPointerMove={onDragMove} onPointerUp={onDragEnd} className="flex flex-1 cursor-grab items-center gap-1.5 text-xs font-bold text-slate-500 active:cursor-grabbing dark:text-slate-400">
          <GripHorizontal size={15} /> {t('ctx_calculator')}
        </div>
        <button type="button" onClick={copy} aria-label={t('ctx_copy')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-green-600 dark:hover:bg-[#121B14]"><Copy size={15} /></button>
        <button type="button" onClick={onClose} aria-label={t('notif_close')} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:hover:bg-[#121B14]"><X size={15} /></button>
      </div>

      <div className="mb-2 rounded-xl bg-slate-100 px-3 py-2 text-right dark:bg-[#121B14]">
        <div className="min-h-[18px] truncate text-xs text-slate-400">{result ? expr : ''}</div>
        <div className="truncate text-2xl font-extrabold text-slate-900 dark:text-white">{result || expr || '0'}</div>
      </div>

      <div className="grid grid-cols-4 gap-1.5">
        {KEYS.flat().map((k, i) => {
          const op = /[+−×÷]/.test(k);
          const eq = k === '=';
          return (
            <button
              key={i}
              type="button"
              onClick={() => press(k)}
              className={`${eq ? 'col-span-2' : ''} h-11 rounded-xl text-base font-bold transition-all active:scale-95 ${eq ? 'bg-green-500 text-white hover:bg-green-600' : op ? 'bg-green-500/15 text-green-600 hover:bg-green-500/25 dark:text-green-400' : k === 'C' ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-[#121B14] dark:text-slate-100 dark:hover:bg-[#1a2a1f]'}`}
            >
              {k === '⌫' ? <Delete size={18} className="mx-auto" /> : k}
            </button>
          );
        })}
      </div>
    </div>
  );
}
