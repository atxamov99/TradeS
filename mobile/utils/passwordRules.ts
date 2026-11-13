/** Same password rules as the website registration form (web/src/pages/Register.jsx). */
export const PASSWORD_RULES: { label: string; test: (p: string) => boolean }[] = [
  { label: "Kamida 8 ta belgi", test: (p) => p.length >= 8 },
  { label: "Katta harf (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "Kichik harf (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "Raqam (0-9)", test: (p) => /\d/.test(p) },
];

export const isPasswordValid = (p: string) => PASSWORD_RULES.every((r) => r.test(p));
