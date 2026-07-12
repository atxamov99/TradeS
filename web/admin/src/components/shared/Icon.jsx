// Material Symbols (Outlined) wrapper. `name` is the ligature (e.g. "dashboard").
// Fonts are loaded in index.html; base styling is in global.css.
export function Icon({ name, className = "", fill = false, style }) {
  return (
    <span
      className={`material-symbols-outlined${fill ? " fill" : ""} ${className}`.trim()}
      style={style}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
