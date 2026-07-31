# Tasks (в работе / ожидают)

## Сейчас
- [x] Получить TELEGRAM_BOT_TOKEN от @BotFather для `trades_uz_bot` и добавить в `backend/.env` — готово, бот `@trades_uz_bot`, токен рабочий (подтверждено через `getMe`)
- [x] Проверить регистрацию end-to-end вживую — 2026-07-30: `/start` боту `@trades_uz_bot` + шаринг контакта → лог `Telegram linked phone 998940335044 -> chat 5921238772`; т.к. номер уже был зарегистрирован (тест 2026-07-03), прогнали через `forgot-password` (тот же Telegram-OTP механизм) — код пришёл, пароль обновлён, логин → `/dashboard` открылся с реальными данными. Полный цикл подтверждён рабочим.
- [x] Решить, как сделать бота "постоянным" в проде — 2026-07-30: вызван `setWebhook` вручную на `https://trades-backend-m2a6.onrender.com/api/v1/telegram/webhook/<TELEGRAM_BOT_TOKEN>` (путь берёт токен из `TELEGRAM_BOT_TOKEN` — см. `src/routes/telegram.routes.js:7`). `getWebhookInfo` подтвердил: `ok:true`, `pending_update_count:0`, `ip_address` резолвится, `max_connections:40`. Локальные dev-серверы (backend/web) остановлены, чтобы long-polling не конфликтовал с вебхуком. **Проверено вживую 2026-07-30:** Абдулазиз написал `/start` боту — сработало, `getWebhookInfo` после этого показал `last_error_message: null`, `pending_update_count: 0`. Прод-вебхук подтверждён рабочим.

## Безопасность — многоустройственные сессии — РЕАЛИЗОВАНО 2026-07-31
- [x] Список активных устройств/сессий — `GET /auth/sessions`, UI в `web/src/pages/Settings.jsx` ("Faol qurilmalar"). Один активный `RefreshToken` (не revoked, не истёк) = одно устройство, благодаря инварианту ротации: в любой момент на семью (`familyId`) есть ровно одна живая запись.
- [x] Только "исходное" устройство может revoke другие — новая модель `KnownDevice` (`userId`+`deviceId`, `isPrimary`). Первое устройство, с которого пользователь когда-либо логинился — `isPrimary: true`, остальные — `false`. `POST /auth/sessions/:id/revoke` проверяет: `isSelf` (всегда можно) ИЛИ `isPrimary` вызывающего устройства (иначе 403 "Faqat asosiy qurilma..."). Проверено вживую (curl): primary → 200, non-primary → 403, self-revoke с non-primary → 200.
- [x] Вход с НОВОГО устройства требует Telegram-код — `deviceId` генерируется клиентом (`web/src/utils/deviceId.js`, localStorage) и шлётся заголовком `X-Device-Id` на каждый запрос (`api/axios.js` interceptor). Если у аккаунта уже ЕСТЬ известные устройства И этот `deviceId` не входит в их число → `login()` не выдаёт токены, а шлёт код через `telegramService` (переиспользует `PhoneAuth.otpCode`) и возвращает `{requiresDeviceConfirmation: true}`. Фронтенд (`Login.jsx`) показывает шаг ввода кода → `POST /auth/verify-new-device` (пере-проверяет пароль + код) → токены. **Проверено вживую через реальный UI** — сработало, код пришёл в Telegram, вход завершён.
- [x] Подтверждено дизайном уже сейчас: Telegram-бот шлёт код только в тот чат, что подтверждён шарингом контакта на этот номер (нельзя получить чужой код) — не менялось, уже было так.
- Схема: `RefreshToken.familyId` (переносится через ротацию) + новая модель `KnownDevice`. Первый логин аккаунта НИКОГДА не гейтится (первое устройство просто становится primary) — иначе никто не смог бы зарегистрироваться.

## После бота
- [x] Логотип: вписать в навбар/футер Login/Register/ForgotPassword/ResetPassword вместо иконки ShoppingBag — 2026-07-31: заменена на `<img src="/logo-dark.png">` (корневой, уже чистый/прозрачный — тот же файл, что уже используют Landing.jsx и Header.jsx, для консистентности). Проверено вживую (Chrome) на всех 3 страницах.
  - dark-версия лого в `web/public/brand/logo-dark.png` тоже почищена (rembg не справился с плоской графикой — обрезал общий фон вместе со словом "TradeS"; сработал ручной chroma-key: обрезка белой полосы-артефакта сверху + порог по цвету фона с альфа-деконтаминацией краёв) — сохранена как `logo-dark-transparent.png` про запас, если понадобится вариант с полным лого+текстом одним файлом
- [x] Landing: смягчить переход hero → features — добавлен scroll-mt-20 на секции-якоря + scroll-reveal анимации (whileInView) на Features/Stats/FAQ + плавные transition на dropdown (язык) и раскрытие FAQ
- [ ] Ручной клик-тест реального сценария: регистрация с телефона (mobile) → логин с тем же номером/паролем на сайте (web)
- [ ] Запустить mobile (Expo) и web одновременно для ручной проверки пользователем

## Найдено при тестировании 2026-07-30 (требует внимания)
- [ ] `Prisma: Timed out fetching a new connection from the connection pool` — вылетело один раз на `POST /auth/forgot-password` (pool limit 21, timeout 10s) во время ручного e2e-теста, второй запрос сразу после отработал нормально. Похоже на временный затор (возможно, nodemon-рестарт оставил висящий клиент), но стоит последить — если повторится под реальной нагрузкой, это узкое место.
- [ ] `docs/README.md`, `docs/architecture.md`, `docs/MARKETING.md` — всё ещё называют проект "Savdo-E" и описывают MongoDB-стек; реальный код (`backend/prisma/schema.prisma`) — Postgres+Prisma, бренд — TradeS. Доки не переименованы после ребрендинга, вводят в заблуждение.

## Старый фидбек из корневого файла `savdo-mobile@1.0.0` (2026-07-02, спасён перед удалением файла 2026-07-31)
⚠️ Дата ДО mobile-rewrite (mobile_old_20260709) — возможно уже неактуально, нужно перепроверить на текущем `mobile/`, не предполагать вслепую.
- [ ] Register: убрать кнопку "Demo rejimda davom etish (Offline)"
- [ ] Profile edit не работает по-настоящему — жмёшь и просто выскакивает "profil yangilandi", без реального изменения. Нужно: редактирование имени, добавление/изменение email, кнопка смены пароля должна быть ВНУТРИ экрана редактирования профиля (не отдельно), плюс поля Telegram/Instagram (username или ссылка) — для будущего in-app чата
- [ ] Register выдаёт "Xatolik --- Ro'yhatdan o'tishda xatolik. Qayta urinib ko'ring" — по словам автора, тогда и sign-in тоже не работал (нужно перепроверить, актуально ли до сих пор)
- [ ] Мелочь: анимация при сохранении профиля (не баг, просто просьба сделать приятнее)

## Возможно позже
- [x] Убрать неиспользуемый второй i18n (I18nProvider/useI18n в `web/src/i18n/index.jsx`) — 2026-07-31: удалён целиком (`i18n/index.jsx`, `labels.js`, `translations.*.js`), вместе с 9 мёртвыми страницами, которые его использовали и никуда не были подключены (`RolesPage`, `PermissionsPage`, `AuditLogsPage`, `ContentPage`, `ReportsPage`, `AdminsPage`, `UsersPage`, `UserDetailPage`, `ProfilePage`, `Modal.jsx` — ни одна не встречалась в `App.jsx`, `Modal.jsx` тоже нигде не импортировался). `<I18nProvider>` убран из `main.jsx`. `npx vite build` прошёл чисто.
- [x] `SMS_DEMO=true` в backend/.env — мёртвая настройка, нигде не используется в коде (старый SMS-OTP флоу, заменён на Telegram-OTP) — убрана из `.env.example` и `docs/ENV_AND_GITIGNORE.md`, в реальном `backend/.env` её и не было
- [x] `forgot_password` — 2026-07-31 проверено: ключ уже есть в реальном (активном) i18n-конфиге, который использует `Login.jsx` (`useTranslation` из `react-i18next` → `src/i18n.js`, там `forgot_password` присутствует для uz/ru/en). Баг был про ВТОРОЙ (уже удалённый) i18n — уже неактуален.
- [x] Мусорные файлы в корне репо — удалены: `expo` (пустой файл), `package-lock.json` (пустышка, реальные лок-файлы в подпапках), `savdo-mobile@1.0.0` (см. секцию выше — фидбек спасён перед удалением), папка `«.../vercel.json»` (сломанный путь от случайной команды). `nul` уже отсутствовал.
