// npm test: schema validation, seed integrity, and an end-to-end pass against a real server process.
import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { FORMS, validateSubmission, validateAnswers, alertsFor } from './shared/forms.js'
import { seed } from './seed.js'

const PNG = 'data:image/png;base64,iVBORw0KGgo='
const medical = {
  gender: 'female', address: 'Amathountos 54', city: 'Лимассол',
  conditions: ['diabetes'], allergies: 'no', medications: 'yes', medicationsDetails: 'Метформин',
}
const body = (over = {}) => ({
  lang: 'ru',
  patient: { firstName: 'Ольга', lastName: 'Смирнова', dob: '1983-08-07', phone: '+357 96 115902', email: 'olga.smirnova@example.com' },
  forms: [{ formId: 'medical-history', answers: medical, signature: PNG }],
  ...over,
})

// --- validation ---
assert.ok(validateSubmission(body()).value, 'valid body passes')
assert.match(validateSubmission(body({ lang: 'de' })).error, /lang/)
assert.match(validateSubmission(body({ patient: { ...body().patient, email: '' } })).error, /email/, 'email is required')
assert.match(validateSubmission(body({ forms: [{ formId: 'medical-history', answers: { ...medical, gender: undefined }, signature: PNG }] })).error, /gender: required/)
assert.match(validateSubmission(body({ forms: [{ formId: 'medical-history', answers: medical, signature: 'data:text/html,x' }] })).error, /signature/)
assert.match(validateSubmission(body({ forms: [{ formId: 'nope', answers: {}, signature: PNG }] })).error, /unknown form/)
assert.match(validateSubmission(body({ forms: [{ formId: 'medical-history', answers: { ...medical, conditions: ['none', 'heart'] }, signature: PNG }] })).error, /conditions/)
assert.match(validateSubmission(body({ patient: { ...body().patient, dob: '2999-01-01' } })).error, /dob/)
const cleaned = validateSubmission(body({ forms: [{ formId: 'medical-history', answers: { ...medical, isAdmin: true, allergiesDetails: 'ignored, allergies is no' }, signature: PNG }] }))
assert.equal(cleaned.value.forms[0].answers.isAdmin, undefined, 'unknown keys dropped')
assert.equal(cleaned.value.forms[0].answers.allergiesDetails, undefined, 'details only kept on yes')
assert.deepEqual(alertsFor('medical-history', medical), ['Diabetes mellitus', 'Medication: Метформин'])
assert.deepEqual(alertsFor('media-consent', { noFace: true }), ['NO FACE in media'])
assert.ok(validateSubmission(body({ forms: [{ formId: 'media-consent', answers: {}, signature: PNG }] })).value, 'media consent without NO FACE is valid')
assert.equal(validateSubmission(body({ forms: [{ formId: 'media-consent', answers: { terms: 'x' }, signature: PNG }] })).value.forms[0].answers.terms, undefined, 'info fields take no answer')

// --- seed data is schema-valid ---
const db = seed()
for (const s of db.submissions) {
  const r = validateAnswers(FORMS.find(f => f.id === s.formId), s.answers)
  assert.ok(r.value, `seed ${s.ref} ${s.formId}: ${r.error}`)
}

// --- end to end ---
const PORT = 3099
const server = spawn(process.execPath, ['server.js'], { env: { ...process.env, PORT, DEMO_PASSCODE: 'test-pass' }, stdio: 'ignore' })
const url = p => `http://localhost:${PORT}${p}`
try {
  for (let i = 0; i < 50; i++) {
    if (await fetch(url('/healthz')).then(r => r.ok, () => false)) break
    await new Promise(r => setTimeout(r, 100))
  }
  assert.equal((await fetch(url('/api/submissions'))).status, 401, 'admin API needs a session')
  assert.equal((await fetch(url('/api/login'), { method: 'POST', body: '{"passcode":"wrong"}' })).status, 401)
  const login = await fetch(url('/api/login'), { method: 'POST', body: '{"passcode":"test-pass"}' })
  const cookie = login.headers.get('set-cookie').split(';')[0]
  const get = p => fetch(url(p), { headers: { cookie } }).then(r => r.json())

  const before = await get('/api/patients')
  const events = await fetch(url('/api/events'), { headers: { cookie } })
  const reader = events.body.getReader()

  // Same person, typed in Latin script with different phone formatting: must match the seeded Cyrillic record by phone + DOB.
  const res = await fetch(url('/api/submissions'), {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body({ patient: { firstName: 'Olga', lastName: 'Smirnova', dob: '1983-08-07', phone: '96115902', email: 'olga.smirnova@example.com' } })),
  })
  assert.equal(res.status, 201)
  let streamed = ''
  while (!streamed.includes('event: submission')) streamed += new TextDecoder().decode((await reader.read()).value)
  reader.cancel()

  const after = await get('/api/patients')
  assert.equal(after.length, before.length, 'returning patient matched, no duplicate record')
  const list = await get('/api/submissions')
  assert.equal(list[0].patient.lastName, 'Смирнова')
  assert.deepEqual(list[0].alerts, ['Diabetes mellitus', 'Medication: Метформин'])
  assert.equal(list[0].reviewedAt, null)
  assert.equal(list[0].signature, undefined, 'list responses are trimmed')

  const bad = await fetch(url('/api/submissions'), { method: 'POST', body: JSON.stringify(body({ lang: 'xx' })) })
  assert.equal(bad.status, 400)
  const huge = await fetch(url('/api/submissions'), { method: 'POST', body: 'x'.repeat(3_100_000) })
  assert.equal(huge.status, 413)
  console.log('ok')
} finally {
  server.kill()
}
