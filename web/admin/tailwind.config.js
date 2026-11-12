/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Every colour is a CSS variable (RGB channels) defined in styles/global.css for
        // :root (light) and .dark, so the whole panel switches theme without touching pages.
        primary: { DEFAULT: v("primary"), dark: v("primary-dark"), light: v("primary-light") },
        "primary-container": v("primary-container"),
        "on-primary": v("on-primary"),
        "on-primary-container": v("on-primary-container"),
        "inverse-primary": v("inverse-primary"),
        "surface-tint": v("surface-tint"),
        secondary: v("secondary"),
        "secondary-container": v("secondary-container"),
        "on-secondary": v("on-secondary"),
        "on-secondary-container": v("on-secondary-container"),
        "secondary-fixed": v("secondary-fixed"),
        "on-secondary-fixed": v("on-secondary-fixed"),
        tertiary: v("tertiary"),
        "tertiary-container": v("tertiary-container"),
        "tertiary-fixed": v("tertiary-fixed"),
        "on-tertiary": v("on-tertiary"),
        "on-tertiary-container": v("on-tertiary-container"),
        "on-tertiary-fixed": v("on-tertiary-fixed"),
        error: v("error"),
        "on-error": v("on-error"),
        "error-container": v("error-container"),
        "on-error-container": v("on-error-container"),
        background: v("background"),
        "on-background": v("on-background"),
        surface: v("surface"),
        "surface-dim": v("surface-dim"),
        "surface-bright": v("surface-bright"),
        "surface-container-lowest": v("surface-container-lowest"),
        "surface-container-low": v("surface-container-low"),
        "surface-container": v("surface-container"),
        "surface-container-high": v("surface-container-high"),
        "surface-container-highest": v("surface-container-highest"),
        "surface-variant": v("surface-variant"),
        "on-surface": v("on-surface"),
        "on-surface-variant": v("on-surface-variant"),
        "inverse-surface": v("inverse-surface"),
        "inverse-on-surface": v("inverse-on-surface"),
        outline: v("outline"),
        "outline-variant": v("outline-variant"),
        success: { DEFAULT: v("success"), light: v("success-light") },
        warning: { DEFAULT: v("warning"), light: v("warning-light") },
        danger: { DEFAULT: v("danger"), light: v("danger-light") },
        info: { DEFAULT: v("info"), light: v("info-light") },
        "bg-app": v("background")
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
