# Smile Design patient forms (pitch demo)

Prospective client: Smile Design Dental Clinic, 12 Achaion, Limassol (smiledesign.com.cy).
Patients fill in and sign forms on an iPad, and the clinic sees every signed form live on a desktop dashboard.
Started 2026-10-21 as a pitch demo; on 2026-10-26 it got a Postgres backend for a live test deployment.

## Run

- `npm run build && npm start`: build, then serve everything on :3001 (`/kiosk`, `/admin`, `/` launcher).
- `npm run dev`: Vite with HMR (proxies `/api` to the `npm start` server on :3001).
- `npm test`: schema validation, seed integrity, end-to-end API pass (spawns its own server on :3099).
- Data: with `DATABASE_URL` + `DATA_KEY` set it uses Postgres (`store.js`, `schema.sql`); without them it runs
  in memory on the invented seed (local demo, `npm test`). `.env` is loaded by `npm start` and holds the local values.
- Hosting (test): Railway project `smiledesign`, Amsterdam (europe-west4): service `Postgres` (no public endpoint,
  only reachable on the private network) and service `web` (this repo, branch `master`, deploys on push, health check `/healthz`),
  live at https://web-production-be3737.up.railway.app. `web` connects as
  the least-privilege `smiledesign_app` role over `postgres.railway.internal`. To run SQL as the owner, add a TCP proxy
  to `Postgres` for the session and delete it afterwards.
- Supabase later (the free org was full on 2026-10-26): apply `schema.sql` (it also locks out the anon/authenticated
  API roles there), set the app role password, connect via the session pooler as `smiledesign_app.<ref>`, and move the
  data with pg_dump/restore. The app never uses the anon or service-role key. Answers and signatures are AES-256-GCM encrypted with `DATA_KEY`
  (32 bytes, base64): **lose that key and every signed form is unreadable**, keep a copy outside Railway.
- Admin password: chosen by the clinic on first sign-in at `/admin`, which needs the one-time setup code the server
  prints to its log at startup (random per boot, or set `SETUP_CODE`). Stored as a scrypt hash in the `settings` table.
  To reset it: `delete from settings where key = 'admin'` as postgres, restart. 5 wrong attempts in a row lock sign-in
  for 30s, doubling, max 15 min.
- Patient confirmation email (`email.js`): set `RESEND_API_KEY` (in `.env` locally, `npm start` loads it). Without it
  no mail is sent. Sender defaults to `forms@akosds.com` (verified in Resend, EU); `MAIL_FROM` overrides it once the
  clinic's own domain is set up. The email lists form titles and refs only, never answers.
- iPad: open `/kiosk` in Safari, Share, Add to Home Screen (full screen), then lock with Guided Access.

## Layout

- `shared/forms.js`: **the only place forms are defined** (3 languages: en, el, ru). It also holds the server-side
  validation and the alert extraction. Two real forms from the clinic's paper originals (2026-10-22): the medical
  form and the media consent (Kaimakki Studio). EN/EL are as printed (with three noted fixes in the file header),
  RU is our translation and needs a native-speaker and legal check before real use.
- `server.js`: dependency-free Node: static `dist/`, kiosk submit, password-gated admin API, live updates over SSE.
  Keeps all rows except signatures in memory and writes through to the database before answering (single instance).
- `seed.js`: invented patients (Greek, Russian, English names), deterministic. Never put real patient data here.
- `src/Kiosk.jsx` (iPad), `src/Admin.jsx` (desktop), `src/SignaturePad.jsx`, `src/styles.css` (brand tokens on `:root`).

## Brand

Gold `#b18435` (decorative only, 3.4:1), text/buttons gold `#8c6421` (5.3:1), charcoal `#191919`, Open Sans
(self-hosted). `public/logo.svg` was traced from their 243px PNG: ask the clinic for the original vector.

## Before this becomes a real product (MVP)

- Staff auth with email OTP, per-user accounts, audit log of who opened/printed which form (today: one shared password).
- Server-generated PDF stored at signing time (the browser print is fine for the demo).
- iPad pairing token so only the clinic's iPad can submit.
- Ops health check (`/healthz` exists; add `/api/health/ops` once there is a database).
- Open question: their existing practice-management software. If it has an API, keep the kiosk and push into it
  instead of running our own dashboard.
