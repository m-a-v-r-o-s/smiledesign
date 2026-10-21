// Invented demo data: fake patients around Limassol, no real person or clinic record.
// Deterministic (seeded PRNG) so every restart shows the same demo.
import { randomUUID } from 'node:crypto'

function rng(seed) {
  return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32)
}
const r = rng(357)
const pick = a => a[Math.floor(r() * a.length)]
const chance = p => r() < p

const PATIENTS = [
  ['Andreas', 'Georgiou', '1979-03-14', '+357 99 412387', 'en'],
  ['Ελένη', 'Κωνσταντίνου', '1986-11-02', '+357 96 238415', 'el'],
  ['Μάριος', 'Χαραλάμπους', '1971-06-25', '+357 99 873120', 'el'],
  ['Christina', 'Michael', '1992-01-19', '+357 97 640233', 'el'],
  ['Ольга', 'Смирнова', '1983-08-07', '+357 96 115902', 'ru'],
  ['Дмитрий', 'Волков', '1975-12-30', '+357 99 507648', 'ru'],
  ['Anna', 'Kuznetsova', '1995-04-11', '+357 97 321904', 'ru'],
  ['Σοφία', 'Νεοφύτου', '1968-09-23', '+357 99 284716', 'el'],
  ['James', 'Whitfield', '1958-02-05', '+44 7700 900417', 'en'],
  ['Katerina', 'Ioannou', '2001-07-16', '+357 96 902351', 'en'],
  ['Николай', 'Петров', '1964-10-28', '+357 97 188420', 'ru'],
  ['Παναγιώτα', 'Ευαγγέλου', '1989-05-03', '+357 99 731058', 'el'],
]

const TEXT = {
  meds: { en: ['Metformin 500mg', 'Ramipril', 'Levothyroxine'], el: ['Μετφορμίνη', 'Θυροξίνη', 'Αντιυπερτασικό'], ru: ['Метформин', 'Эутирокс', 'Лозартан'] },
  allergy: { en: ['Penicillin', 'Latex'], el: ['Πενικιλίνη', 'Λάτεξ'], ru: ['Пенициллин', 'Лидокаин'] },
  doctor: { en: ['GP, blood pressure check-ups'], el: ['Καρδιολόγος, έλεγχος πίεσης'], ru: ['Эндокринолог, щитовидная железа'] },
  reason: {
    en: ['Check-up and cleaning', 'Chipped front tooth', 'Interested in veneers', 'Bleeding gums when brushing'],
    el: ['Τσεκάπ και καθαρισμός', 'Πόνος σε πίσω δόντι', 'Ενδιαφέρομαι για λεύκανση'],
    ru: ['Хочу отбелить зубы', 'Консультация по имплантам', 'Болит зуб справа внизу'],
  },
  treatment: {
    en: ['Porcelain veneers, upper front teeth', 'Implant, lower left molar', 'Root canal treatment'],
    el: ['Εμφύτευμα, κάτω γνάθος', 'Στεφάνη ζιρκονίου', 'Λεύκανση στο ιατρείο'],
    ru: ['Коронка на зуб 36', 'Имплант за один день', 'Виниры, 6 зубов'],
  },
}

function medicalAnswers(lang) {
  const a = {}
  a.doctorCare = chance(0.25) ? 'yes' : 'no'
  if (a.doctorCare === 'yes') a.doctorCareDetails = pick(TEXT.doctor[lang])
  a.medications = chance(0.35) ? 'yes' : 'no'
  if (a.medications === 'yes') a.medicationsDetails = pick(TEXT.meds[lang])
  a.anticoagulants = chance(0.12) ? 'yes' : 'no'
  a.allergies = chance(0.25) ? 'yes' : 'no'
  if (a.allergies === 'yes') a.allergiesDetails = pick(TEXT.allergy[lang])
  const cond = ['bp', 'diabetes', 'asthma', 'heart'].filter(() => chance(0.12))
  a.conditions = cond.length ? cond : ['none']
  if (chance(0.5)) a.pregnant = 'no'
  a.smoker = chance(0.2) ? 'yes' : 'no'
  a.lastVisit = pick(['lt6', '6to12', '1to2', 'gt2'])
  if (chance(0.8)) a.reason = pick(TEXT.reason[lang])
  a.anxiety = pick(['calm', 'calm', 'little', 'very'])
  return a
}

const consentAnswers = lang => ({ treatment: pick(TEXT.treatment[lang]), explained: true, questions: true, cost: true, anaesthesia: true })
const privacyAnswers = () => {
  const a = { processing: true, contact: pick(['phone', 'sms', 'viber', 'viber', 'email']) }
  if (chance(0.8)) a.reminders = true
  if (chance(0.3)) a.photos = true
  return a
}
const ANSWERS = { 'medical-history': medicalAnswers, 'treatment-consent': consentAnswers, privacy: privacyAnswers }

// A hand-drawn looking squiggle, as an SVG data URL.
function signature() {
  let x = 24, y = 70, d = `M${x} ${y}`
  const n = 5 + Math.floor(r() * 4)
  for (let i = 0; i < n; i++) {
    const w = 24 + r() * 26, h = 18 + r() * 34
    d += ` C${x + w * 0.2} ${y - h} ${x + w * 0.8} ${y - h} ${x + w * 0.5} ${y + 6} S${x + w} ${y + 10 * (r() - 0.5)} ${x + w} ${y}`
    x += w
  }
  d += ` M30 ${y + 22} Q${x / 2} ${y + 8} ${x + 10} ${y + 16}`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${x + 40} 120"><path d="${d}" fill="none" stroke="#1d2433" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`
  return 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
}

const DAY = 86_400_000

export function seed(now = Date.now()) {
  const patients = [], submissions = []
  const add = (patient, lang, formIds, at, reviewed) => {
    formIds.forEach((formId, i) => submissions.push({
      id: randomUUID(), patientId: patient.id, formId, lang,
      answers: ANSWERS[formId](lang), signature: signature(),
      submittedAt: new Date(at + i * 95_000).toISOString(),
      reviewedAt: reviewed ? new Date(at + DAY / 24).toISOString() : null,
    }))
  }
  PATIENTS.forEach(([firstName, lastName, dob, phone, lang], i) => {
    const first = now - (40 + r() * 500) * DAY
    const p = { id: randomUUID(), firstName, lastName, dob, phone, email: i % 3 ? '' : `${lastName.toLowerCase()}@example.com`, createdAt: new Date(first).toISOString() }
    patients.push(p)
    add(p, lang, ['medical-history', 'privacy'], first, true)
    if (chance(0.7)) add(p, lang, ['treatment-consent'], first + (3 + r() * 30) * DAY, true)
    if (chance(0.4)) add(p, lang, ['medical-history'], now - (5 + r() * 30) * DAY, true)
  })
  // Today's queue, still to be reviewed by reception.
  const byName = n => patients.find(p => p.firstName === n)
  add(byName('James'), 'en', ['medical-history'], now - 140 * 60_000, false)
  add(byName('Μάριος'), 'el', ['treatment-consent'], now - 70 * 60_000, false)
  add(byName('Ольга'), 'ru', ['medical-history', 'treatment-consent'], now - 25 * 60_000, false)

  submissions.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  submissions.forEach((s, i) => { s.ref = 'SD-' + String(i + 1).padStart(5, '0') })
  return { patients, submissions }
}
