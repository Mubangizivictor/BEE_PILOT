# BeePilot API

This is the secure shared backend for BeePilot. It replaces browser-only localStorage bookings.

## What it does

- Calculates distance/time through Google Routes API without exposing the Google key.
- Saves customer bookings in Cloudflare D1.
- Gives public booking status through an unguessable token.
- Lets the owner manually record MTN MoMo, Airtel Money, or bank payments.
- Creates an immutable receipt record after payment confirmation.

## Deployment

Cloudflare Workers Builds is connected to this repository with `backend` as its root directory. Every push to `main` triggers the Worker deployment.

## Never commit secrets

Run these only in your own terminal after creating a Cloudflare Worker project:

```bash
cd backend
npm install
npx wrangler d1 execute beepilot-db --remote --file=schema.sql
npx wrangler secret put GOOGLE_MAPS_API_KEY
npx wrangler secret put ADMIN_TOKEN
npx wrangler deploy
```

Restrict the replacement Google key to the Routes API and the Worker server/IP or service restrictions available in Google Cloud. Do not put it in frontend JavaScript or GitHub Pages.

## Current limitations

This worker deliberately does not send WhatsApp messages or PDFs. The next phase adds secure PDF storage plus WhatsApp Cloud API after those accounts are configured.
