import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { clsx } from 'clsx';

// Animated, searchable replacement for native <select>/<option>. Searches
// automatically once there are enough options that scanning them by eye
// stops being practical.
export default function Dropdown({
  options,
  value,
  onChange,
  placeholder = 'Tanlang...',
  searchPlaceholder = 'Qidirish...',
  error,
  disabled,
  className,
  searchThreshold = 6,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const searchRef = useRef(null);

  const selected = options.find((o) => o.value === value) || null;
  const searchable = options.length > searchThreshold;

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query, searchable]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable) searchRef.current?.focus();
    if (!open) setQuery('');
  }, [open, searchable]);

  return (
    <div ref={rootRef} className={clsx('relative', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={clsx(
          'w-full h-12 rounded-xl border px-4 text-base text-left flex items-center justify-between gap-2 transition',
          'text-[#0F172A] bg-white dark:text-slate-100 dark:bg-[#0F172A]',
          disabled && 'opacity-60 cursor-not-allowed',
          error ? 'border-red-400 bg-red-50 dark:bg-red-500/10' : 'border-[#E2E8F0] dark:border-[#334155]',
          open && 'ring-2 ring-green-500 border-green-500'
        )}
      >
        <span className={clsx(!selected && 'text-[#94A3B8] dark:text-slate-500')}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          size={18}
          className={clsx('text-[#94A3B8] dark:text-slate-500 transition-transform duration-200 shrink-0', open && 'rotate-180')}
        />
      </button>

      <div
        className={clsx(
          'absolute z-30 mt-2 w-full origin-top rounded-xl border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#1E293B] shadow-lg overflow-hidden transition-all duration-150',
          open ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none absolute'
        )}
      >
        {searchable && (
          <div className="p-2 border-b border-[#E2E8F0] dark:border-[#334155]">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] dark:text-slate-500" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full h-9 rounded-lg border border-[#E2E8F0] dark:border-[#334155] bg-white dark:bg-[#0F172A] pl-8 pr-3 text-sm text-[#0F172A] dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
          </div>
        )}
        <div className="max-h-56 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="px-4 py-3 text-sm text-[#94A3B8] dark:text-slate-500">Topilmadi</p>
          ) : (
            filtered.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => {
                  onChange(o.value);
                  setOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center justify-between gap-2 px-4 py-2.5 text-left text-sm transition',
                  o.value === value
                    ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-300 font-semibold'
                    : 'text-[#0F172A] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
              >
                {o.label}
                {o.value === value && <Check size={15} />}
              </button>
            ))
          )}
        </div>
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
