// Server: serves the built app (dist/), the kiosk submit endpoint and the admin API.
// Data: Supabase Postgres via store.js when DATABASE_URL is set, otherwise in memory with the invented seed.
import http from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { randomUUID, randomBytes, timingSafeEqual, createHash, scrypt } from 'node:crypto'
import { promisify } from 'node:util'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateSubmission, alertsFor, norm } from './shared/forms.js'
import * as store from './store.js'
import { sendConfirmation } from './email.js'

const PORT = Number(process.env.PORT) || 3001
const DIST = fileURLToPath(new URL('./dist/', import.meta.url))
const db = await store.load()
let refSeq = Math.max(0, ...db.submissions.map(s => Number(s.ref.slice(3))))

// Admin password: the clinic chooses it on first sign-in, proving it with the one-time setup code from the server log.
// Stored as a salted scrypt hash in the settings table, so it survives restarts.
const SETUP_CODE = process.env.SETUP_CODE || randomBytes(5).toString('hex')
let admin = db.admin
const scryptAsync = promisify(scrypt)
const hashPassword = async (pw, salt) => scryptAsync(pw, Buffer.from(salt, 'hex'), 64)
const sessions = new Set()
const listeners = new Set()

// ---------- data ----------

const digits = s => s.replace(/\D/g, '').slice(-8)

// Same date of birth plus the same name or the same phone number = the same patient.
function findPatient(p) {
  const name = norm(p.firstName + ' ' + p.lastName)
  return db.patients.find(x => x.dob === p.dob &&
    (norm(x.firstName + ' ' + x.lastName) === name || digits(x.phone) === digits(p.phone)))
}

const patientOf = s => db.patients.find(p => p.id === s.patientId)
const brief = p => ({ id: p.id, firstName: p.firstName, lastName: p.lastName, dob: p.dob })
const listItem = s => ({
  id: s.id, ref: s.ref, formId: s.formId, lang: s.lang, submittedAt: s.submittedAt,
  reviewedAt: s.reviewedAt, alerts: alertsFor(s.formId, s.answers), patient: brief(patientOf(s)),
})

function patientSummary(p) {
  const subs = db.submissions.filter(s => s.patientId === p.id)
  const latest = {} // latest signed copy of each form
  for (const s of subs) latest[s.formId] = s
  return {
    ...p, formCount: subs.length, lastAt: subs.at(-1)?.submittedAt ?? null,
    alerts: Object.values(latest).flatMap(s => alertsFor(s.formId, s.answers)),
  }
}

// ---------- http helpers ----------

const SECURITY_HEADERS = {
  'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'X-Frame-Options': 'DENY',
}

function send(res, status, body, headers = {}) {
  const json = typeof body !== 'string'
  res.writeHead(status, {
    ...SECURITY_HEADERS, 'Cache-Control': 'no-store',
    'Content-Type': json ? 'application/json' : 'text/plain; charset=utf-8', ...headers,
  })
  res.end(json ? JSON.stringify(body) : body)
}

async function readJson(req, max) {
  let size = 0
  const chunks = []
  for await (const c of req) {
    size += c.length
    if (size > max) throw Object.assign(new Error('too large'), { status: 413 })
    chunks.push(c)
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')) }
  catch { throw Object.assign(new Error('bad json'), { status: 400 }) }
}

// ponytail: per-process fixed-window limiter, move to shared storage if this ever runs on replicas.
const hits = new Map()
setInterval(() => hits.clear(), 10 * 60_000).unref()
function limited(req, bucket, max) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress
  const key = bucket + ip, now = Date.now(), h = hits.get(key)
  if (!h || now - h.t > 60_000) { hits.set(key, { t: now, n: 1 }); return false }
  return ++h.n > max
}

const sha = s => createHash('sha256').update(s).digest()
const authed = req => sessions.has(/(?:^|;\s*)sd_session=([a-f0-9]{64})/.exec(req.headers.cookie || '')?.[1])
const secure = req => req.headers['x-forwarded-proto'] === 'https'

// One admin account: after 5 wrong attempts in a row it locks for 30s, doubling each time, at most 15 minutes.
let fails = 0, lockedUntil = 0
function failed(res, error) {
  if (++fails >= 5) lockedUntil = Date.now() + Math.min(30_000 * 2 ** (fails - 5), 15 * 60_000)
  console.warn(`security: failed sign-in (${fails} in a row)`)
  return send(res, 403, { error })
}

function broadcast(event, data) {
  for (const res of listeners) res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
}

// ---------- api ----------

async function api(req, res, path) {
  const m = req.method

  if (m === 'POST' && path === '/api/submissions') {
    if (limited(req, 'submit', 20)) return send(res, 429, { error: 'Too many requests' })
    const v = validateSubmission(await readJson(req, 3_000_000))
    if (v.error) return send(res, 400, { error: v.error })
    const p = v.value.patient, found = findPatient(p)
    const patient = found ? { ...found, phone: p.phone, email: p.email } : { id: randomUUID(), ...p, createdAt: new Date().toISOString() }
    const now = Date.now()
    const created = v.value.forms.map((f, i) => ({
      id: randomUUID(), ref: 'SD-' + String(++refSeq).padStart(5, '0'),
      patientId: patient.id, formId: f.formId, lang: v.value.lang, answers: f.answers,
      signature: f.signature, submittedAt: new Date(now + i).toISOString(), reviewedAt: null,
    }))
    await store.saveSubmission(patient, !found, created) // saved before we answer the iPad
    if (found) Object.assign(found, patient)
    else db.patients.push(patient)
    db.submissions.push(...created.map(({ signature, ...s }) => store.persistent ? s : { ...s, signature }))
    broadcast('submission', created.map(listItem))
    sendConfirmation(v.value.patient, v.value.lang, created).catch(e => console.error('email:', e.message))
    return send(res, 201, { ok: true, count: created.length })
  }

  if (m === 'GET' && path === '/api/auth') return send(res, 200, { setup: !admin })

  // First sign-in (no password yet): { code, password } sets the password. After that: { password }.
  if (m === 'POST' && path === '/api/login') {
    if (limited(req, 'login', 8) || Date.now() < lockedUntil) return send(res, 429, { error: 'Too many attempts, try again in a few minutes' })
    const { code, password } = await readJson(req, 1000)
    if (typeof password !== 'string' || password.length > 128) return send(res, 400, { error: 'Password required' })
    if (!admin) {
      if (typeof code !== 'string' || !timingSafeEqual(sha(code.trim()), sha(SETUP_CODE))) return failed(res, 'Wrong setup code')
      if (password.length < 12) return send(res, 400, { error: 'Choose a password of at least 12 characters' })
      const salt = randomBytes(16).toString('hex')
      const hash = (await hashPassword(password, salt)).toString('hex')
      const next = { salt, hash, setAt: new Date().toISOString() }
      if (admin || !await store.setAdmin(next)) return send(res, 409, { error: 'Password already set' })
      admin = next
      sessions.clear()
      console.log('security: admin password set')
    } else if (!timingSafeEqual(await hashPassword(password, admin.salt), Buffer.from(admin.hash, 'hex'))) {
      return failed(res, 'Wrong password')
    }
    fails = 0
    const token = randomBytes(32).toString('hex')
    sessions.add(token)
    const cookie = `sd_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200${secure(req) ? '; Secure' : ''}`
    return send(res, 200, { ok: true }, { 'Set-Cookie': cookie })
  }

  // Everything below is staff-only.
  if (!authed(req)) return send(res, 401, { error: 'Sign in required' })

  if (m === 'POST' && path === '/api/logout') {
    sessions.delete(/sd_session=([a-f0-9]{64})/.exec(req.headers.cookie)?.[1])
    return send(res, 200, { ok: true }, { 'Set-Cookie': 'sd_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' })
  }

  if (m === 'GET' && path === '/api/events') {
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive' })
    res.write(': hi\n\n')
    const ping = setInterval(() => res.write(': ping\n\n'), 25_000)
    listeners.add(res)
    req.on('close', () => { clearInterval(ping); listeners.delete(res) })
    return
  }

  if (m === 'GET' && path === '/api/submissions') {
    return send(res, 200, db.submissions.map(listItem).reverse())
  }

  const sub = /^\/api\/submissions\/([\w-]+)$/.exec(path)
  if (sub) {
    const s = db.submissions.find(x => x.id === sub[1])
    if (!s) return send(res, 404, { error: 'Not found' })
    if (m === 'GET') {
      const signature = s.signature ?? await store.signatureOf(s.id)
      return send(res, 200, { ...s, signature, alerts: alertsFor(s.formId, s.answers), patient: patientOf(s) })
    }
    if (m === 'PATCH') {
      const { reviewed } = await readJson(req, 1000)
      if (typeof reviewed !== 'boolean') return send(res, 400, { error: 'reviewed must be boolean' })
      const reviewedAt = reviewed ? new Date().toISOString() : null
      await store.setReviewed(s.id, reviewedAt)
      s.reviewedAt = reviewedAt
      broadcast('review', { id: s.id, reviewedAt: s.reviewedAt })
      return send(res, 200, { reviewedAt: s.reviewedAt })
    }
  }

  if (m === 'GET' && path === '/api/patients') {
    return send(res, 200, db.patients.map(patientSummary).sort((a, b) => (b.lastAt || '').localeCompare(a.lastAt || '')))
  }

  const pat = /^\/api\/patients\/([\w-]+)$/.exec(path)
  if (m === 'GET' && pat) {
    const p = db.patients.find(x => x.id === pat[1])
    if (!p) return send(res, 404, { error: 'Not found' })
    const subs = db.submissions.filter(s => s.patientId === p.id).map(listItem).reverse()
    return send(res, 200, { ...patientSummary(p), submissions: subs })
  }

  send(res, 404, { error: 'Not found' })
}

// ---------- static ----------

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.webmanifest': 'application/manifest+json',
}

async function serveStatic(req, res, path) {
  let file = normalize(join(DIST, decodeURIComponent(path)))
  if (!file.startsWith(DIST)) return send(res, 404, 'Not found')
  const st = await stat(file).catch(() => null)
  if (!st?.isFile()) {
    if (extname(path)) return send(res, 404, 'Not found')
    file = join(DIST, 'index.html') // client-side routes: /kiosk, /admin
  }
  const hashed = path.startsWith('/assets/')
  res.writeHead(200, {
    ...SECURITY_HEADERS,
    'Content-Type': TYPES[extname(file)] || 'application/octet-stream',
    'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'no-cache',
    ...(secure(req) && { 'Strict-Transport-Security': 'max-age=31536000; includeSubDomains' }),
  })
  createReadStream(file).pipe(res)
}

http.createServer(async (req, res) => {
  const path = new URL(req.url, 'http://x').pathname
  try {
    if (path === '/healthz') return await store.ping().then(() => send(res, 200, 'ok'), () => send(res, 503, 'database unreachable'))
    if (path.startsWith('/api/')) return await api(req, res, path)
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed')
    await serveStatic(req, res, path)
  } catch (e) {
    if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Server error' })
    if (!e.status) console.error(e)
  }
}).listen(PORT, () => {
  console.log(`Smile Design forms on http://localhost:${PORT}  (kiosk: /kiosk, admin: /admin), data: ${store.persistent ? 'Postgres' : 'in memory, demo seed'}`)
  if (!admin) console.log(`Admin setup code (first sign-in only, to choose the password): ${SETUP_CODE}`)
})
