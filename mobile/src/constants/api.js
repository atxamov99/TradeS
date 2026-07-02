// .env faylidagi EXPO_PUBLIC_API_BASE ni o'zgartiring.
// Fallback — global Render backend (Neon), shuning uchun .env bo'lmasa ham ishlaydi.
export const API_BASE =
  process.env.EXPO_PUBLIC_API_BASE || 'https://trades-backend-m2a6.onrender.com/api/v1';

export const SYNC_INTERVAL = 30000; // 30 seconds
