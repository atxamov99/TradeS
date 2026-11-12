import { en as enBase } from "./translations.en";
import { ru as ruBase } from "./translations.ru";
import { uz as uzBase } from "./translations.uz";
import { enPages, ruPages, uzPages } from "./translations.pages";

function isObject(v) {
  return v && typeof v === "object" && !Array.isArray(v);
}

// Deep merge: values from "extra" are used only where the base has no value of its own,
// so hand-written base translations are never overwritten by generated ones.
function mergeMissing(base, extra) {
  const out = { ...base };
  for (const [k, v] of Object.entries(extra)) {
    if (isObject(v)) out[k] = mergeMissing(isObject(base[k]) ? base[k] : {}, v);
    else if (out[k] === undefined) out[k] = v;
  }
  return out;
}

export const uz = mergeMissing(uzBase, uzPages);
export const ru = mergeMissing(ruBase, ruPages);
export const en = mergeMissing(enBase, enPages);

export const translations = { uz, en, ru };
