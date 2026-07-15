// Format a number as a localized price. Currency and locale are parametrized so
// callers can pass the active i18n currency (e.g. t('currency')) and language.
// Defaults keep the historical "so'm" (uz-UZ) behaviour for existing call sites.
export default function formatPrice(n, currency = "so'm", locale = 'uz-UZ') {
  const amount = Number(n || 0).toLocaleString(locale, { maximumFractionDigits: 2 });
  return `${amount} ${currency}`;
}
