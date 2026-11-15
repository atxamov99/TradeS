import { Children, isValidElement, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

// Drop-in replacement for a native <select>: same props (value, onChange(event-like), name, disabled, className)
// and the same <option> children, but with a styled button and list that follow the panel theme (light/dark)
// instead of the browser's ugly default menu.
function readOptions(children) {
  const out = [];
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    if (child.type === "option") {
      const label = Children.toArray(child.props.children).join("");
      out.push({ value: String(child.props.value ?? label), label, disabled: Boolean(child.props.disabled) });
    } else if (child.props && child.props.children) {
      out.push(...readOptions(child.props.children));
    }
  });
  return out;
}

export function Select({ value, onChange, name, disabled, className = "", children, placeholder }) {
  const options = useMemo(() => readOptions(children), [children]);
  // callers pass the old native-select classes (borders, colours...): keep only the sizing ones, the look is ours
  const sizing = String(className)
    .split(" ")
    .filter((tok) => /^((sm|md|lg|xl):)?(w-|min-w-|max-w-|flex-|grow|shrink)/.test(tok))
    .join(" ") || "w-full";
  const current = options.find((o) => o.value === String(value ?? ""));
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState(null);
  const [active, setActive] = useState(-1);
  const btnRef = useRef(null);
  const listRef = useRef(null);

  const close = useCallback(() => setOpen(false), []);

  const place = useCallback(() => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const below = window.innerHeight - r.bottom;
    const openUp = below < 240 && r.top > below;
    setRect({ left: r.left, width: r.width, top: r.bottom + 6, bottom: window.innerHeight - r.top + 6, up: openUp });
  }, []);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target) || listRef.current?.contains(e.target)) return;
      close();
    };
    const onScroll = (e) => {
      if (listRef.current?.contains(e.target)) return; // scrolling inside the list is fine
      close();
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, close]);

  useEffect(() => {
    if (open) setActive(Math.max(0, options.findIndex((o) => o.value === String(value ?? ""))));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (opt) => {
    if (opt.disabled) return;
    onChange?.({ target: { value: opt.value, name } });
    close();
    btnRef.current?.focus();
  };

  const onKeyDown = (e) => {
    if (disabled) return;
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      setOpen(true);
      return;
    }
    if (!open) return;
    if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(options.length - 1, i + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (options[active]) choose(options[active]); }
  };

  useEffect(() => {
    if (open && listRef.current) listRef.current.querySelector("[data-active=true]")?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onKeyDown}
        className={`flex items-center justify-between gap-2 text-left rounded-lg border bg-surface-container-lowest text-on-surface px-4 py-2.5 text-body-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          open ? "border-primary" : "border-outline-variant hover:border-primary/60"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${sizing}`}
      >
        <span className={`truncate ${current ? "" : "text-on-surface-variant"}`}>{current ? current.label : placeholder || options[0]?.label || ""}</span>
        <Icon name="expand_more" className={`text-[20px] text-on-surface-variant shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && rect && createPortal(
        <ul
          ref={listRef}
          role="listbox"
          style={{ position: "fixed", left: rect.left, width: rect.width, zIndex: 100000, ...(rect.up ? { bottom: rect.bottom } : { top: rect.top }) }}
          className="max-h-60 overflow-y-auto rounded-xl border border-outline-variant bg-surface-container-lowest p-1 shadow-xl shadow-black/30"
        >
          {options.map((opt, i) => {
            const selected = opt.value === String(value ?? "");
            return (
              <li
                key={opt.value + i}
                role="option"
                aria-selected={selected}
                data-active={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(opt)}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-body-sm ${
                  opt.disabled ? "opacity-40 cursor-not-allowed" : "cursor-pointer"
                } ${i === active ? "bg-primary-container/25" : ""} ${selected ? "text-primary font-semibold" : "text-on-surface"}`}
              >
                <span className="truncate">{opt.label}</span>
                {selected && <Icon name="check" className="text-[18px] shrink-0" />}
              </li>
            );
          })}
        </ul>,
        document.body
      )}
    </>
  );
}
