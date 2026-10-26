# Smile Design patient forms (pitch demo)

Prospective client: Smile Design Dental Clinic, 12 Achaion, Limassol (smiledesign.com.cy).
Patients fill in and sign forms on an iPad, and the clinic sees every signed form live on a desktop dashboard.
This is a **clickable pitch demo with invented data**, not production. Started 2026-10-21.

## Run

- `npm run build && npm start`: build, then serve everything on :3001 (`/kiosk`, `/admin`, `/` launcher).
- `npm run dev`: Vite with HMR (proxies `/api` to the `npm start` server on :3001).
- `npm test`: schema validation, seed integrity, end-to-end API pass (spawns its own server on :3099).
- Admin passcode: `DEMO_PASSCODE` env var, default `smile2026`.
- Patient confirmation email (`email.js`): set `RESEND_API_KEY` (in `.env` locally, `npm start` loads it). Without it
  no mail is sent. Sender defaults to `forms@akosds.com` (verified in Resend, EU); `MAIL_FROM` overrides it once the
  clinic's own domain is set up. The email lists form titles and refs only, never answers.
- iPad: open `/kiosk` in Safari, Share, Add to Home Screen (full screen), then lock with Guided Access.

## Layout

- `shared/forms.js`: **the only place forms are defined** (3 languages: en, el, ru). It also holds the server-side
  validation and the alert extraction. Two real forms from the clinic's paper originals (2026-10-22): the medical
  form and the media consent (Kaimakki Studio). EN/EL are as printed (with three noted fixes in the file header),
  RU is our translation and needs a native-speaker and legal check before real use.
- `server.js`: dependency-free Node: static `dist/`, kiosk submit, passcode-gated admin API, live updates over SSE.
  Data is **in memory** and resets to `seed.js` on restart.
- `seed.js`: invented patients (Greek, Russian, English names), deterministic. Never put real patient data here.
- `src/Kiosk.jsx` (iPad), `src/Admin.jsx` (desktop), `src/SignaturePad.jsx`, `src/styles.css` (brand tokens on `:root`).

## Brand

Gold `#b18435` (decorative only, 3.4:1), text/buttons gold `#8c6421` (5.3:1), charcoal `#191919`, Open Sans
(self-hosted). `public/logo.svg` was traced from their 243px PNG: ask the clinic for the original vector.

## Before this becomes a real product (MVP)

- Supabase in an EU region (health data is GDPR special-category), RLS on every table, signatures in a private bucket.
- Staff auth with email OTP, per-user accounts, audit log of who opened/printed which form.
  Delete `/api/demo-passcode` and the login-screen hint: they publish the demo passcode.
- Server-generated PDF stored at signing time (the browser print is fine for the demo).
- iPad pairing token so only the clinic's iPad can submit.
- Ops health check (`/healthz` exists; add `/api/health/ops` once there is a database).
- Open question: their existing practice-management software. If it has an API, keep the kiosk and push into it
  instead of running our own dashboard.
