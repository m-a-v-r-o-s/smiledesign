// Persistence: Supabase Postgres when DATABASE_URL is set (schema.sql), otherwise in memory with the invented seed.
// The server keeps every row except signatures in memory and writes through to the database before answering.
// ponytail: single instance only, move reads to SQL if this ever runs on replicas or outgrows memory.
import postgres from 'postgres'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { seed } from './seed.js'

const URL_ = process.env.DATABASE_URL
const sql = URL_ ? postgres(URL_, { ssl: /sslmode=disable/.test(URL_) ? false : 'require', max: 5, prepare: false }) : null
export const persistent = !!sql

// Medical answers and signatures are encrypted before they reach the database (AES-256-GCM, iv | tag | ciphertext).
const KEY = Buffer.from(process.env.DATA_KEY || '', 'base64')
if (sql && KEY.length !== 32) throw new Error('DATA_KEY must be 32 random bytes, base64')
export function enc(text, key = KEY) {
  const iv = randomBytes(12), c = createCipheriv('aes-256-gcm', key, iv)
  const ct = Buffer.concat([c.update(text, 'utf8'), c.final()])
  return Buffer.concat([iv, c.getAuthTag(), ct]).toString('base64')
}
export function dec(b64, key = KEY) {
  const b = Buffer.from(b64, 'base64'), d = createDecipheriv('aes-256-gcm', key, b.subarray(0, 12))
  d.setAuthTag(b.subarray(12, 28))
  return Buffer.concat([d.update(b.subarray(28)), d.final()]).toString('utf8')
}

const iso = d => d && d.toISOString()

export async function load() {
  if (!sql) return { ...seed(), admin: null }
  const patients = await sql`select id, first_name, last_name, dob::text, phone, email, created_at from patients order by created_at`
  const subs = await sql`select id, ref, patient_id, form_id, lang, answers, submitted_at, reviewed_at from submissions order by submitted_at`
  const [admin] = await sql`select value from settings where key = 'admin'`
  return {
    patients: patients.map(p => ({
      id: p.id, firstName: p.first_name, lastName: p.last_name, dob: p.dob, phone: p.phone, email: p.email, createdAt: iso(p.created_at),
    })),
    submissions: subs.map(s => ({
      id: s.id, ref: s.ref, patientId: s.patient_id, formId: s.form_id, lang: s.lang,
      answers: JSON.parse(dec(s.answers)), submittedAt: iso(s.submitted_at), reviewedAt: iso(s.reviewed_at),
    })),
    admin: admin?.value ?? null,
  }
}

// One kiosk submission: the patient (new or with updated contact details) and their signed forms, all or nothing.
export async function saveSubmission(patient, isNew, subs) {
  if (!sql) return
  await sql.begin(async tx => {
    if (isNew) {
      await tx`insert into patients (id, first_name, last_name, dob, phone, email, created_at)
        values (${patient.id}, ${patient.firstName}, ${patient.lastName}, ${patient.dob}, ${patient.phone}, ${patient.email}, ${patient.createdAt})`
    } else {
      await tx`update patients set phone = ${patient.phone}, email = ${patient.email} where id = ${patient.id}`
    }
    for (const s of subs) {
      await tx`insert into submissions (id, ref, patient_id, form_id, lang, answers, signature, submitted_at)
        values (${s.id}, ${s.ref}, ${s.patientId}, ${s.formId}, ${s.lang}, ${enc(JSON.stringify(s.answers))}, ${enc(s.signature)}, ${s.submittedAt})`
    }
  })
}

export async function setReviewed(id, reviewedAt) {
  if (sql) await sql`update submissions set reviewed_at = ${reviewedAt} where id = ${id}`
}

export async function signatureOf(id) {
  const [row] = await sql`select signature from submissions where id = ${id}`
  return row && dec(row.signature)
}

// Returns false if a password was already set (first one wins).
export async function setAdmin(admin) {
  if (!sql) return true
  const rows = await sql`insert into settings (key, value) values ('admin', ${sql.json(admin)}) on conflict do nothing returning key`
  return rows.length === 1
}

export const ping = () => sql ? sql`select 1` : Promise.resolve()
