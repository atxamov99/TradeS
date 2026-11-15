import { useLangStore } from "@/store/langStore";

// Texts of the ADMIN part of the app (same functions as the website's admin panel). Kept in one file, 3 languages.
const uz = {
  tabDash: "Bosh sahifa", tabUsers: "Foydalanuvchilar", tabOrders: "Buyurtmalar", tabSupport: "Murojaatlar", tabMore: "Yana",
  moreTitle: "Boshqaruv", products: "Mahsulotlar", reports: "Hisobotlar", admins: "Adminlar", content: "Kontent", notifications: "Bildirishnomalar", settings: "Sozlamalar",
  search: "Qidirish...", save: "Saqlash", cancel: "Bekor qilish", delete: "O'chirish", edit: "Tahrirlash", add: "Qo'shish", create: "Yaratish", confirm: "Tasdiqlash",
  loading: "Yuklanmoqda...", empty: "Hozircha bo'sh", error: "Xatolik", retry: "Qayta urinish", saved: "Saqlandi", deleted: "O'chirildi", back: "Orqaga", role: "Rol", total: "Jami", yes: "Ha", no: "Yo'q",
  // dashboard
  dashTitle: "Boshqaruv paneli", totalUsers: "Foydalanuvchilar", totalProducts: "Mahsulotlar", totalOrders: "Buyurtmalar", revenue: "Tushum", weeklyUsers: "Haftalik faollik", monthlyOrders: "Oylik buyurtmalar", recentOrders: "So'nggi buyurtmalar", currency: "so'm",
  // users
  usersTitle: "Foydalanuvchilar", newUser: "Yangi foydalanuvchi", block: "Bloklash", unblock: "Blokdan chiqarish", changeRole: "Rolni o'zgartirish", blocked: "Bloklangan", active: "Faol",
  kindUSER: "Foydalanuvchi", kindDIRECTOR: "Biznes direktori", kindCASHIER: "Kassir", kindADMIN: "Admin",
  hintUSER: "O'zi uchun ishlaydi. Kassirlik bog'lanishi olib tashlanadi.", hintDIRECTOR: "Biznes do'koni egasi: xodimlar, xarajatlar va hisobotlar ochiladi.", hintCASHIER: "Tanlangan biznes do'konida kassir: faqat sotadi.", hintADMIN: "To'liq admin huquqi. Faqat asosiy admin bera oladi.",
  pickShop: "Qaysi do'konda kassir", noShops: "Biznes do'konlari yo'q. Avval kimnidir direktor qiling.", name: "Ism", email: "Email", phone: "Telefon", password: "Parol", passwordKeep: "Parol (bo'sh — o'zgarmaydi)",
  editUser: "Foydalanuvchini tahrirlash", roleSaved: "Rol o'zgartirildi", confirmDelete: "O'chirishni tasdiqlaysizmi?", contactNeeded: "Email yoki telefon kerak",
  // admins
  adminsTitle: "Adminlar", mainAdmin: "Asosiy", you: "Siz", newAdmin: "Yangi admin", revoke: "Adminlikdan olish", revokeHint: "Bu odamdan admin huquqi olib tashlanadi va u oddiy foydalanuvchiga aylanadi.", protectedAdmin: "Himoyalangan", onlyMain: "Adminlarni faqat asosiy admin boshqaradi",
  // orders
  ordersTitle: "Buyurtmalar", noOrders: "Buyurtmalar yo'q", orderStatus: "Holat", payment: "To'lov",
  st_pending: "Kutilmoqda", st_paid: "To'langan", st_processing: "Jarayonda", st_shipped: "Yo'lda", st_delivered: "Yetkazildi", st_cancelled: "Bekor qilindi", pay_pending: "Kutilmoqda", pay_paid: "To'langan", pay_failed: "Muvaffaqiyatsiz", pay_refunded: "Qaytarilgan",
  // products
  productsTitle: "Mahsulotlar", newProduct: "Yangi mahsulot", editProduct: "Mahsulotni tahrirlash", category: "Kategoriya", buyPrice: "Xarid narxi", sellPrice: "Sotuv narxi", stock: "Ombor qoldig'i", activate: "Yoqish", deactivate: "Nofaol qilish", inactive: "Nofaol",
  // reports
  reportsTitle: "Hisobotlar", dau: "Kunlik faol", weekRegs: "Haftalik ro'yxatdan o'tish", failedLogins: "Xato kirishlar", activity: "Admin faoliyati",
  // support
  supportTitle: "Murojaatlar", tabAll: "Hammasi", tabOpen: "Ochiq", tabAnswered: "Javob berilgan", reply: "Javob yozing...", send: "Yuborish", srcBot: "Telegram bot", srcApp: "Ilova", replied: "Javob berilgan", open: "Ochiq", sent: "Javob yuborildi",
  // content
  contentTitle: "Kontent", newContent: "Yangi kontent", contentType: "Turi", contentStatus: "Holat", owner: "Muallif", body: "Matn", draft: "Qoralama", published: "E'lon qilingan", archived: "Arxiv",
  // notifications
  notifTitle: "Bildirishnomalar", notifSub: "Tizimdagi ogohlantirishlar va so'nggi harakatlar",
  // settings
  settingsTitle: "Sozlamalar", profile: "Profil", language: "Til", theme: "Qorong'u rejim", changePassword: "Parolni o'zgartirish", currentPassword: "Joriy parol", newPassword: "Yangi parol", passwordChanged: "Parol yangilandi", logout: "Chiqish", signInMethods: "Kirish usullari", linkEmail: "Email", linkPhone: "Telefon", notLinked: "Ulanmagan", roleAdmin: "Administrator",
};

const ru: typeof uz = {
  tabDash: "Главная", tabUsers: "Пользователи", tabOrders: "Заказы", tabSupport: "Обращения", tabMore: "Ещё",
  moreTitle: "Управление", products: "Товары", reports: "Отчёты", admins: "Админы", content: "Контент", notifications: "Уведомления", settings: "Настройки",
  search: "Поиск...", save: "Сохранить", cancel: "Отмена", delete: "Удалить", edit: "Редактировать", add: "Добавить", create: "Создать", confirm: "Подтвердить",
  loading: "Загрузка...", empty: "Пока пусто", error: "Ошибка", retry: "Повторить", saved: "Сохранено", deleted: "Удалено", back: "Назад", role: "Роль", total: "Всего", yes: "Да", no: "Нет",
  dashTitle: "Панель управления", totalUsers: "Пользователи", totalProducts: "Товары", totalOrders: "Заказы", revenue: "Выручка", weeklyUsers: "Активность за неделю", monthlyOrders: "Заказы по месяцам", recentOrders: "Последние заказы", currency: "сум",
  usersTitle: "Пользователи", newUser: "Новый пользователь", block: "Заблокировать", unblock: "Разблокировать", changeRole: "Изменить роль", blocked: "Заблокирован", active: "Активен",
  kindUSER: "Пользователь", kindDIRECTOR: "Директор бизнеса", kindCASHIER: "Кассир", kindADMIN: "Админ",
  hintUSER: "Работает на себя. Привязка кассиром снимается.", hintDIRECTOR: "Владелец бизнес-магазина: открываются сотрудники, расходы и отчёты.", hintCASHIER: "Кассир выбранного бизнес-магазина: только продаёт.", hintADMIN: "Полные права админа. Выдать может только главный админ.",
  pickShop: "В каком магазине кассир", noShops: "Бизнес-магазинов нет. Сначала сделайте кого-нибудь директором.", name: "Имя", email: "Почта", phone: "Телефон", password: "Пароль", passwordKeep: "Пароль (пусто — без изменений)",
  editUser: "Редактировать пользователя", roleSaved: "Роль изменена", confirmDelete: "Подтвердить удаление?", contactNeeded: "Нужна почта или телефон",
  adminsTitle: "Админы", mainAdmin: "Главный", you: "Вы", newAdmin: "Новый админ", revoke: "Убрать админа", revokeHint: "У этого человека снимут права админа, он станет обычным пользователем.", protectedAdmin: "Защищён", onlyMain: "Админами управляет только главный админ",
  ordersTitle: "Заказы", noOrders: "Заказов нет", orderStatus: "Статус", payment: "Оплата",
  st_pending: "Ожидает", st_paid: "Оплачен", st_processing: "В работе", st_shipped: "В пути", st_delivered: "Доставлен", st_cancelled: "Отменён", pay_pending: "Ожидает", pay_paid: "Оплачено", pay_failed: "Не удалась", pay_refunded: "Возврат",
  productsTitle: "Товары", newProduct: "Новый товар", editProduct: "Редактировать товар", category: "Категория", buyPrice: "Закупочная цена", sellPrice: "Цена продажи", stock: "Остаток", activate: "Включить", deactivate: "Отключить", inactive: "Отключён",
  reportsTitle: "Отчёты", dau: "Активных за день", weekRegs: "Регистраций за неделю", failedLogins: "Неудачные входы", activity: "Действия админов",
  supportTitle: "Обращения", tabAll: "Все", tabOpen: "Открытые", tabAnswered: "С ответом", reply: "Напишите ответ...", send: "Отправить", srcBot: "Telegram-бот", srcApp: "Приложение", replied: "Отвечено", open: "Открыто", sent: "Ответ отправлен",
  contentTitle: "Контент", newContent: "Новый контент", contentType: "Тип", contentStatus: "Статус", owner: "Автор", body: "Текст", draft: "Черновик", published: "Опубликован", archived: "Архив",
  notifTitle: "Уведомления", notifSub: "Предупреждения системы и последние действия",
  settingsTitle: "Настройки", profile: "Профиль", language: "Язык", theme: "Тёмная тема", changePassword: "Сменить пароль", currentPassword: "Текущий пароль", newPassword: "Новый пароль", passwordChanged: "Пароль обновлён", logout: "Выйти", signInMethods: "Способы входа", linkEmail: "Почта", linkPhone: "Телефон", notLinked: "Не привязан", roleAdmin: "Администратор",
};

const en: typeof uz = {
  tabDash: "Home", tabUsers: "Users", tabOrders: "Orders", tabSupport: "Requests", tabMore: "More",
  moreTitle: "Manage", products: "Products", reports: "Reports", admins: "Admins", content: "Content", notifications: "Notifications", settings: "Settings",
  search: "Search...", save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit", add: "Add", create: "Create", confirm: "Confirm",
  loading: "Loading...", empty: "Nothing here yet", error: "Error", retry: "Retry", saved: "Saved", deleted: "Deleted", back: "Back", role: "Role", total: "Total", yes: "Yes", no: "No",
  dashTitle: "Dashboard", totalUsers: "Users", totalProducts: "Products", totalOrders: "Orders", revenue: "Revenue", weeklyUsers: "Weekly activity", monthlyOrders: "Orders by month", recentOrders: "Recent orders", currency: "UZS",
  usersTitle: "Users", newUser: "New user", block: "Block", unblock: "Unblock", changeRole: "Change role", blocked: "Blocked", active: "Active",
  kindUSER: "User", kindDIRECTOR: "Business director", kindCASHIER: "Cashier", kindADMIN: "Admin",
  hintUSER: "Works for themselves. The cashier link is removed.", hintDIRECTOR: "Owner of a business shop: employees, expenses and reports are unlocked.", hintCASHIER: "Cashier of the chosen business shop: only sells.", hintADMIN: "Full admin rights. Only the main admin can grant them.",
  pickShop: "Which shop is the cashier in", noShops: "No business shops yet. First make somebody a director.", name: "Name", email: "Email", phone: "Phone", password: "Password", passwordKeep: "Password (empty — unchanged)",
  editUser: "Edit user", roleSaved: "Role changed", confirmDelete: "Confirm deletion?", contactNeeded: "Email or phone is required",
  adminsTitle: "Admins", mainAdmin: "Main", you: "You", newAdmin: "New admin", revoke: "Remove admin", revokeHint: "This person loses admin rights and becomes a normal user.", protectedAdmin: "Protected", onlyMain: "Only the main admin manages admins",
  ordersTitle: "Orders", noOrders: "No orders", orderStatus: "Status", payment: "Payment",
  st_pending: "Pending", st_paid: "Paid", st_processing: "Processing", st_shipped: "Shipped", st_delivered: "Delivered", st_cancelled: "Cancelled", pay_pending: "Pending", pay_paid: "Paid", pay_failed: "Failed", pay_refunded: "Refunded",
  productsTitle: "Products", newProduct: "New product", editProduct: "Edit product", category: "Category", buyPrice: "Buy price", sellPrice: "Sell price", stock: "Stock", activate: "Activate", deactivate: "Deactivate", inactive: "Inactive",
  reportsTitle: "Reports", dau: "Daily active", weekRegs: "Sign-ups this week", failedLogins: "Failed logins", activity: "Admin activity",
  supportTitle: "Requests", tabAll: "All", tabOpen: "Open", tabAnswered: "Answered", reply: "Write a reply...", send: "Send", srcBot: "Telegram bot", srcApp: "App", replied: "Answered", open: "Open", sent: "Reply sent",
  contentTitle: "Content", newContent: "New content", contentType: "Type", contentStatus: "Status", owner: "Author", body: "Text", draft: "Draft", published: "Published", archived: "Archived",
  notifTitle: "Notifications", notifSub: "System alerts and recent actions",
  settingsTitle: "Settings", profile: "Profile", language: "Language", theme: "Dark mode", changePassword: "Change password", currentPassword: "Current password", newPassword: "New password", passwordChanged: "Password updated", logout: "Log out", signInMethods: "Sign-in methods", linkEmail: "Email", linkPhone: "Phone", notLinked: "Not linked", roleAdmin: "Administrator",
};

const all = { uz, ru, en };
export type AdminT = typeof uz;

// the admin texts in the language that is on screen
export function useAT(): AdminT {
  const lang = useLangStore((s) => s.lang);
  return all[lang] || all.uz;
}
