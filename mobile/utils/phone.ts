/**
 * Telefon raqami / identifikator formatlash — eski (ishlaydigan) ilovadan ko'chirilgan.
 */

/** UI uchun telefonni formatlaydi (+998 XX XXX XX XX). Email bo'lsa tegmaydi. */
export function formatPhone(text: string): string {
  if (!text) return "";

  // Harf yoki @ bo'lsa — email/username, formatlanmaydi
  if (/[a-zA-Z@]/.test(text)) return text;

  if (!text.startsWith("+998")) {
    if (text.startsWith("+")) return text;
    if (text.length > 0) {
      const digits = text.replace(/[^\d]/g, "");
      return digits ? `+998 ${digits}` : text;
    }
    return "";
  }

  const cleaned = text.replace(/[^\d]/g, "");
  let formatted = "+";
  if (cleaned.length > 0) formatted += cleaned.substring(0, 3);
  if (cleaned.length > 3) formatted += " " + cleaned.substring(3, 5);
  if (cleaned.length > 5) formatted += " " + cleaned.substring(5, 8);
  if (cleaned.length > 8) formatted += " " + cleaned.substring(8, 10);
  if (cleaned.length > 10) formatted += " " + cleaned.substring(10, 12);
  return formatted;
}

/** API uchun tozalaydi: email → lowercase, telefon → faqat raqam va '+'. */
export function cleanIdentifier(text: string): string {
  if (!text) return "";
  const trimmed = text.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();
  return trimmed.replace(/[^\d+]/g, "");
}
