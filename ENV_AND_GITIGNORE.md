# Env and Gitignore Inventory

Generated from this project workspace.

> Note: Real secret values from `.env` files are intentionally redacted. Keep actual credentials only in local environment files or deployment secret storage, not in Markdown.

## Files Covered

- `.gitignore`
- `backend/.gitignore`
- `mobile/.gitignore`
- `web/.gitignore`
- `backend/.env`
- `backend/.env.example`
- `mobile/.env`
- `mobile_backup/.env`

## `.gitignore`

```gitignore
# Node.js
node_modules/
dist/
build/
.npm
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Expo
.expo/
*.jks
*.p8
*.apk
*.aab
*.ipa
*.plist
*.json
!app.json
!package.json
!package-lock.json
!mobile/src/i18n/locales/*.json
!web/src/i18n/locales/*.json

# IDE
.vscode/
.idea/
*.swp
*.swo
*.DS_Store

# Logs
logs/
*.log

# Coverage
coverage/
```

## `backend/.gitignore`

```gitignore
node_modules
# Keep environment variables out of version control
.env

/src/generated/prisma
.vercel
```

## `mobile/.gitignore`

```gitignore
node_modules/
.expo/
dist/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.env
```

## `web/.gitignore`

```gitignore
.vercel
```

## `backend/.env` Sanitized

```dotenv
# Application
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL="***REDACTED***"

# Dev-only: agar localda mongod yo'q bo'lsa, in-memory mongo ishlatadi
USE_MEMORY_DB=false

# Authentication
JWT_SECRET=***REDACTED***
JWT_ACCESS_SECRET=***REDACTED***
JWT_EXPIRES_IN=24h
JWT_ACCESS_EXPIRES_IN=24h
JWT_REFRESH_SECRET=***REDACTED***
JWT_REFRESH_EXPIRES_IN=7d

# Security
BCRYPT_SALT_ROUNDS=10

# Admin Setup (CHANGE IN PRODUCTION!)
ADMIN_SETUP_KEY=***REDACTED***

# Google OAuth - Set in production environment
GOOGLE_CLIENT_ID=383407420441-4lv3sggmt5m54jh0bqmouqub136967hs.apps.googleusercontent.com
# CORS — allowed origins (localhost + 127.0.0.1 variants — vite ba'zan 127.0.0.1 sifatida proxy qiladi)
CORS_ORIGIN=http://localhost:5173,http://localhost:5174,http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:8081,http://127.0.0.1:8081,http://192.168.0.161:8081,http://192.168.0.161:5173

# Client URL (for password reset links)
CLIENT_URL=http://localhost:5173

# SMS OTP — dev rejimda OTP kodlari log'ga chiqadi (real SMS yuborilmaydi).
# Production'da SMS_DEMO=false va ESKIZ_TOKEN=... qo'yiladi.
SMS_DEMO=true
# ESKIZ_TOKEN=***REDACTED_IF_SET***


# MailDev — локальный SMTP, письма видны на http://localhost:1080
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=noreply@savdo.local
SMTP_PASS=***REDACTED***


# This was inserted by `prisma init`:
# Environment variables declared in this file are NOT automatically loaded by Prisma.
# Please add `import "dotenv/config";` to your `prisma.config.ts` file, or use the Prisma CLI with Bun
# to load environment variables from .env files: https://pris.ly/prisma-config-env-vars.MONGO_URI=mongodb://localhost:27017/savdo_db
```

### `backend/.env` Keys

```text
PORT
NODE_ENV
DATABASE_URL
USE_MEMORY_DB
JWT_SECRET
JWT_ACCESS_SECRET
JWT_EXPIRES_IN
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_SECRET
JWT_REFRESH_EXPIRES_IN
BCRYPT_SALT_ROUNDS
ADMIN_SETUP_KEY
GOOGLE_CLIENT_ID
CORS_ORIGIN
CLIENT_URL
SMS_DEMO
ESKIZ_TOKEN
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
```

## `backend/.env.example`

```dotenv
# ── Application ──
PORT=5000
NODE_ENV=development

# ── Database ──
DATABASE_URL="postgresql://user:password@host:port/db?sslmode=require"

# ── JWT ──
JWT_ACCESS_SECRET=change_me_to_random_64hex
JWT_REFRESH_SECRET=change_me_to_random_64hex
JWT_ACCESS_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
JWT_EXPIRES_IN=24h

# ── Security ──
BCRYPT_SALT_ROUNDS=10
ADMIN_SETUP_KEY=change_me_to_random_64hex

# ── CORS ──
CORS_ORIGIN=http://localhost:5173,http://localhost:5174
CLIENT_URL=http://localhost:5173

# ── SMS (dev) ──
SMS_DEMO=true
# ESKIZ_TOKEN=

# ── SMTP (MailDev) ──
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
SMTP_USER=noreply@savdo.local
SMTP_PASS=irrelevant
```

### `backend/.env.example` Keys

```text
PORT
NODE_ENV
DATABASE_URL
JWT_ACCESS_SECRET
JWT_REFRESH_SECRET
JWT_ACCESS_EXPIRES_IN
JWT_REFRESH_EXPIRES_IN
JWT_EXPIRES_IN
BCRYPT_SALT_ROUNDS
ADMIN_SETUP_KEY
CORS_ORIGIN
CLIENT_URL
SMS_DEMO
ESKIZ_TOKEN
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASS
```

## `mobile/.env`

```dotenv
# Backend API (Expo public env — EXPO_PUBLIC_ prefiks bilan)
# Variantlar:
#   - Android emulator:  http://10.0.2.2:5000/api/v1
#   - iOS simulator:     http://localhost:5000/api/v1
#   - Fizik telefon:     http://<PC LAN IP>:5000/api/v1  (telefon va PC bir Wi-Fi'da bo'lsin)
# PC LAN IP'ni topish:   ip -4 addr | grep -oP 'inet \K[\d.]+' | grep -v '127.0.0.1' | head -1
# Current LAN IP: 192.168.0.161 (run `ip -4 addr | grep -oP 'inet \K[\d.]+' | grep -v '127.0.0.1'` to check)
# Web (localhost): http://localhost:5000/api/v1
# Phone (LAN):     http://192.168.0.161:5000/api/v1
EXPO_PUBLIC_API_BASE=https://savdo-backend-nine.vercel.app/api/v1
```

### `mobile/.env` Keys

```text
EXPO_PUBLIC_API_BASE
```

## `mobile_backup/.env`

```dotenv
# Backend API (Expo public env — EXPO_PUBLIC_ prefiks bilan)
# Variantlar:
#   - Android emulator:  http://10.0.2.2:5000/api/v1
#   - iOS simulator:     http://localhost:5000/api/v1
#   - Fizik telefon:     http://<PC LAN IP>:5000/api/v1  (telefon va PC bir Wi-Fi'da bo'lsin)
# PC LAN IP'ni topish:   ip -4 addr | grep -oP 'inet \K[\d.]+' | grep -v '127.0.0.1' | head -1
# Current LAN IP: 192.168.80.110 (run `ip -4 addr | grep -oP 'inet \K[\d.]+' | grep -v '127.0.0.1'` to check)
# Web (localhost): http://localhost:5000/api/v1
# Phone (LAN):     http://192.168.80.110:5000/api/v1
EXPO_PUBLIC_API_BASE=http://localhost:5000/api/v1
```

### `mobile_backup/.env` Keys

```text
EXPO_PUBLIC_API_BASE
```

## Notes

- Root `.gitignore` ignores `.env` variants, build artifacts, Expo build outputs, IDE folders, logs, and coverage.
- Root `.gitignore` ignores all `*.json` files except selected app/package/i18n JSON files.
- `backend/.gitignore` ignores generated Prisma output and `.vercel`.
- `web/.gitignore` only ignores `.vercel`.
- `backend/.env` contains production-like secrets and should stay untracked.
- The last Prisma comment line in `backend/.env` appears to include `MONGO_URI=...` inside the comment URL line rather than as a separate active environment variable.
