import { create } from "zustand";

/**
 * Drop-in replacement for react-native's `Alert` — same call shape (`Alert.alert(title, message, buttons)`),
 * but rendered by <AppAlertHost /> in the app's own style (theme colours, rounded card, icon) instead of the
 * grey system dialog. Also exposes `Alert.toast()` for short non-blocking notices.
 */
export type AlertButton = {
  text?: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
};
export type AlertKind = "info" | "error" | "success" | "warning";

type AlertItem = { id: number; title: string; message?: string; buttons: AlertButton[]; kind: AlertKind };
type ToastItem = { id: number; text: string; kind: AlertKind };

type AlertStore = {
  queue: AlertItem[];
  toasts: ToastItem[];
  push: (a: AlertItem) => void;
  shift: () => void;
  pushToast: (t: ToastItem) => void;
  dropToast: (id: number) => void;
};

export const useAlertStore = create<AlertStore>((set) => ({
  queue: [],
  toasts: [],
  push: (a) => set((s) => ({ queue: [...s.queue, a] })),
  shift: () => set((s) => ({ queue: s.queue.slice(1) })),
  pushToast: (t) => set((s) => ({ toasts: [...s.toasts.slice(-2), t] })),
  dropToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

let seq = 1;

/** Guess the tone from the title so existing `Alert.alert("Xatolik", ...)` calls get a red icon for free. */
function guessKind(title: string): AlertKind {
  const t = (title || "").toLowerCase();
  if (/xato|ошибк|error|fail|noto/.test(t)) return "error";
  if (/muvaffaq|успе|success|tayyor|saqlandi|готово/.test(t)) return "success";
  if (/ogohlan|diqqat|внимани|warning|o'chir|удал|delete/.test(t)) return "warning";
  return "info";
}

export const Alert = {
  alert(title: string, message?: string, buttons?: AlertButton[], kind?: AlertKind) {
    useAlertStore.getState().push({
      id: seq++,
      title,
      message,
      buttons: buttons && buttons.length ? buttons : [{ text: "OK" }],
      kind: kind ?? guessKind(title),
    });
  },
  toast(text: string, kind: AlertKind = "info") {
    const id = seq++;
    useAlertStore.getState().pushToast({ id, text, kind });
    setTimeout(() => useAlertStore.getState().dropToast(id), 3500);
  },
};
