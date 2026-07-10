export default function formatPrice(n) {
  return Number(n || 0).toLocaleString('uz-UZ', { maximumFractionDigits: 2 }) + " so'm";
}
