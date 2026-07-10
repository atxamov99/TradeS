import uz from "./uz";
import ru from "./ru";
import en from "./en";

export type Lang = "uz" | "ru" | "en";
export type { Translations } from "./uz";

export const translations = { uz, ru, en };

export default translations;
