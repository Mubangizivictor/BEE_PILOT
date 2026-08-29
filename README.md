# BeePilot - Production-Ready Booking System

BeePilot is a premium airport transfer and intercity transport booking application optimized for the Ugandan market. It features a backend-driven fare engine, secure admin dashboard, and WhatsApp-integrated payment workflow.

## 🚀 Architecture

- **Frontend**: Single Page Application (HTML/Tailwind/Vanilla JS) hosted on GitHub Pages.
- **Backend**: Cloudflare Workers (Serverless) providing a secure REST API.
- **Database**: Cloudflare D1 (SQL) for persistent storage of bookings and settings.
- **Routing**: Google Maps JavaScript API (v3) & Routes API for distance/time calculation.

## 🛠️ Tech Stack

- **UI/UX**: Tailwind CSS, Lucide Icons, Responsive Design (390px to 1440px).
- **Security**: PIN-based Admin Auth, Server-side API Secrets, Unguessable Booking Tokens.
- **Integration**: WhatsApp Deep-linking for manual payment verification.

## 📦 Deployment Instructions

### 1. Frontend Setup
- Update `js/config.js` with your production API URL and contact details.
- Deploy the root directory to GitHub Pages or any static host.

### 2. Backend (Cloudflare Worker)
- Navigate to the `backend/` or `worker/` directory.
- Initialize the D1 Database:
  ```bash
  npx wrangler d1 create beepilot-db
  npx wrangler d1 execute beepilot-db --remote --file=schema.sql
  ```
- Configure Secrets:
  ```bash
  npx wrangler secret put GOOGLE_MAPS_API_KEY # Your Google Cloud API Key
  npx wrangler secret put ADMIN_PIN           # 4-6 digit login PIN
  ```
- Deploy:
  ```bash
  npx wrangler deploy
  ```

## 💰 Fare Logic & Business Rules
- **Standard**: Base 1,250 | 850/km | 130/min | Min 6,000 UGX.
- **Intercity**: Applied for trips >25km (customizable in D1).
- **Deposit**: 30% commitment fee required for booking confirmation.

## 👨‍💼 Admin Features
- **Dashboard**: Real-time revenue tracking and booking overview.
- **Manual Verification**: Verify MoMo/Airtel/Bank transfers via WhatsApp confirmation.
- **Exports**: CSV export for accounting and audit purposes.

---
© 2024 BeePilot Uganda. Managed by Victor Bee.
