# Savdo-(E) Backend API

This is the Node.js/Express RESTful API for the Savdo-(E) e-commerce platform.

## Features
- **Express Server**: High-performance routing and middleware.
- **MVC Architecture**: Clearly separated controllers, models, and routes.
- **MongoDB**: Flexible NoSQL data storage (using Mongoose).
- **JWT Auth**: Secure user authentication and role-based access control.

## Folder Structure
- **config**: Database connection and environment configurations.
- **controllers**: Request handlers for different API entities.
- **middleware**: Authentication and request validation logic.
- **models**: Database schema definitions.
- **routes**: API endpoint definitions.
- **services**: Business logic and external API integrations.
- **utils**: Reusable utility functions and constants.

## Installation
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up the environment variables:
   ```bash
   cp .env.example .env
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Telegram OTP bot setup

Registration, login and password reset codes are delivered via Telegram (free, no SMS provider needed). To enable it:

1. Open Telegram, message **[@BotFather](https://t.me/BotFather)**, send `/newbot` (or reuse an existing bot) and copy the token it gives you — looks like `123456789:AAAA...`.
2. Add it to `backend/.env`:
   ```
   TELEGRAM_BOT_TOKEN=123456789:AAAA...
   ```
3. Start the backend (`npm run dev`). That's it — **no ngrok, no webhook setup needed locally.** The backend automatically long-polls Telegram for updates in every non-production environment (see `telegramService.startPolling()` in `src/server.js`).
4. To actually receive a code: open your bot in Telegram, send `/start`, then tap **"📱 Raqamni ulashish"** to share your contact. That links your Telegram chat to that exact phone number — codes are only ever sent to the Telegram account that shared that number (nobody else can receive them).

In production (Render), the backend instead registers a webhook against its stable public URL — no polling there.

## API Endpoints
See the [docs/api.md](../docs/api.md) for full endpoint specifications.
