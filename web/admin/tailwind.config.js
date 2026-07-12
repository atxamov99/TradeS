/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // ── TradeS Stitch design tokens (light) ──────────────
        primary: {
          DEFAULT: "#006c49",
          dark: "#005236",
          light: "#dbeafe"
        },
        "primary-container": "#10b981",
        "on-primary": "#ffffff",
        "on-primary-container": "#00422b",
        "inverse-primary": "#4edea3",
        "surface-tint": "#006c49",
        secondary: "#4648d4",
        "secondary-container": "#6063ee",
        "on-secondary": "#ffffff",
        "on-secondary-container": "#fffbff",
        "secondary-fixed": "#e1e0ff",
        "on-secondary-fixed": "#07006c",
        tertiary: "#a43a3a",
        "tertiary-container": "#fc7c78",
        "tertiary-fixed": "#ffdad7",
        "on-tertiary": "#ffffff",
        "on-tertiary-container": "#711419",
        "on-tertiary-fixed": "#410005",
        error: "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        background: "#f9f9ff",
        "on-background": "#151c27",
        surface: "#f9f9ff",
        "surface-dim": "#d3daea",
        "surface-bright": "#f9f9ff",
        "surface-container-lowest": "#ffffff",
        "surface-container-low": "#f0f3ff",
        "surface-container": "#e7eefe",
        "surface-container-high": "#e2e8f8",
        "surface-container-highest": "#dce2f3",
        "surface-variant": "#dce2f3",
        "on-surface": "#151c27",
        "on-surface-variant": "#3c4a42",
        "inverse-surface": "#2a313d",
        "inverse-on-surface": "#ebf1ff",
        outline: "#6c7a71",
        "outline-variant": "#bbcabf",

        // ── Legacy semantic tokens (kept for toasts/charts) ──
        success: { DEFAULT: "#1f9d67", light: "#dcfce7" },
        warning: { DEFAULT: "#d28b16", light: "#fef9c3" },
        danger: { DEFAULT: "#cc425b", light: "#fee2e2" },
        info: { DEFAULT: "#2c76e2", light: "#dbeafe" },
        "bg-app": "#f9f9ff"
      },
      fontFamily: {
        sans: ["Inter", "Segoe UI", "Tahoma", "sans-serif"]
      },
      fontSize: {
        "display-lg": ["36px", { lineHeight: "44px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-lg-mobile": ["28px", { lineHeight: "34px", letterSpacing: "-0.02em", fontWeight: "700" }],
        "headline-md": ["24px", { lineHeight: "32px", letterSpacing: "-0.01em", fontWeight: "600" }],
        "title-sm": ["18px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "body-sm": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.05em", fontWeight: "600" }]
      },
      spacing: {
        "element-gap": "12px",
        "margin-mobile": "16px",
        "section-gap": "32px",
        "padding-card": "20px",
        gutter: "24px"
      },
      maxWidth: {
        "container-max": "1440px"
      },
      boxShadow: {
        card: "0 4px 24px rgba(16,32,51,0.06)",
        modal: "0 24px 64px rgba(16,32,51,0.18)"
      },
      borderRadius: {
        card: "14px",
        modal: "18px"
      }
    }
  },
  plugins: []
};
