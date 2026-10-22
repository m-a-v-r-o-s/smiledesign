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
  ['Andreas', 'Georgiou', '1979-03-14', '+357 99 412387', 'en', 'm', 'andreas.georgiou@example.com'],
  ['Ελένη', 'Κωνσταντίνου', '1986-11-02', '+357 96 238415', 'el', 'f', 'eleni.konst@example.com'],
  ['Μάριος', 'Χαραλάμπους', '1971-06-25', '+357 99 873120', 'el', 'm', 'marios.ch@example.com'],
  ['Christina', 'Michael', '1992-01-19', '+357 97 640233', 'el', 'f', 'christina.michael@example.com'],
  ['Ольга', 'Смирнова', '1983-08-07', '+357 96 115902', 'ru', 'f', 'olga.smirnova@example.com'],
  ['Дмитрий', 'Волков', '1975-12-30', '+357 99 507648', 'ru', 'm', 'd.volkov@example.com'],
  ['Anna', 'Kuznetsova', '1995-04-11', '+357 97 321904', 'ru', 'f', 'anna.kuznetsova@example.com'],
  ['Σοφία', 'Νεοφύτου', '1968-09-23', '+357 99 284716', 'el', 'f', 'sofia.neophytou@example.com'],
  ['James', 'Whitfield', '1958-02-05', '+44 7700 900417', 'en', 'm', 'j.whitfield@example.com'],
  ['Katerina', 'Ioannou', '2001-07-16', '+357 96 902351', 'en', 'f', 'katerina.ioannou@example.com'],
  ['Николай', 'Петров', '1964-10-28', '+357 97 188420', 'ru', 'm', 'n.petrov@example.com'],
  ['Παναγιώτα', 'Ευαγγέλου', '1989-05-03', '+357 99 731058', 'el', 'f', 'p.evangelou@example.com'],
]

const TEXT = {
  meds: { en: ['Metformin 500mg', 'Ramipril', 'Levothyroxine'], el: ['Μετφορμίνη', 'Θυροξίνη', 'Αντιυπερτασικό'], ru: ['Метформин', 'Эутирокс', 'Лозартан'] },
  allergy: { en: ['Ibuprofen', 'Pollen'], el: ['Ιβουπροφαίνη', 'Γύρη'], ru: ['Ибупрофен', 'Пыльца'] },
  street: {
    en: ['Agiou Andreou 112', 'Griva Digeni 45', 'Makariou III 201', 'Anexartisias 18'],
    el: ['Αγίου Ανδρέου 112', 'Γρίβα Διγενή 45', 'Μακαρίου Γ΄ 201', 'Ανεξαρτησίας 18'],
    ru: ['Amathountos 54', 'Spyrou Kyprianou 30', 'Georgiou A 87'],
  },
  city: { en: ['Limassol'], el: ['Λεμεσός'], ru: ['Лимассол', 'Limassol'] },
  job: { en: ['Teacher', 'Accountant', 'Retired', 'Engineer'], el: ['Εκπαιδευτικός', 'Λογιστής', 'Συνταξιούχος'], ru: ['Программист', 'Дизайнер', 'Бухгалтер'] },
  emergency: { en: ['Spouse, +357 99 315620'], el: ['Σύζυγος, +357 99 418265'], ru: ['Супруг(а), +357 96 772014'] },
  doctors: { en: ['Dr. A. Pavlou, GP'], el: ['Δρ. Παύλου, καρδιολόγος'], ru: ['Д-р Павлу, терапевт'] },
  referral: { en: ['Google', 'Instagram', 'A friend recommended you'], el: ['Από φίλη', 'Google', 'Facebook'], ru: ['Посоветовали друзья', 'Instagram', 'Google'] },
}

const CONDITIONS = ['hypertension', 'cholesterol', 'diabetes', 'asthma', 'thyroid', 'smoking', 'reflux', 'penicillinAllergy', 'aspirin']

function medicalAnswers(lang, gender) {
  const a = { gender, address: pick(TEXT.street[lang]), city: pick(TEXT.city[lang]) }
  if (chance(0.8)) a.postcode = pick(['3036', '3025', '4532', '3106', '4046'])
  if (chance(0.5)) a.emergency = pick(TEXT.emergency[lang])
  if (chance(0.7)) a.occupation = pick(TEXT.job[lang])
  const cond = CONDITIONS.filter(() => chance(0.1))
  if (gender === 'female' && chance(0.1)) cond.push('pregnancy')
  a.conditions = cond.length ? cond : ['none']
  a.allergies = chance(0.15) ? 'yes' : 'no'
  if (a.allergies === 'yes') a.allergiesDetails = pick(TEXT.allergy[lang])
  a.medications = chance(0.35) ? 'yes' : 'no'
  if (a.medications === 'yes') a.medicationsDetails = pick(TEXT.meds[lang])
  if (chance(0.3)) a.doctors = pick(TEXT.doctors[lang])
  if (chance(0.6)) a.referral = pick(TEXT.referral[lang])
  return a
}

const mediaAnswers = () => (chance(0.35) ? { noFace: true } : {})
const ANSWERS = { 'medical-history': medicalAnswers, 'media-consent': mediaAnswers }

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
  const gender = {}
  const add = (patient, lang, formIds, at, reviewed) => {
    formIds.forEach((formId, i) => submissions.push({
      id: randomUUID(), patientId: patient.id, formId, lang,
      answers: ANSWERS[formId](lang, gender[patient.id]), signature: signature(),
      submittedAt: new Date(at + i * 95_000).toISOString(),
      reviewedAt: reviewed ? new Date(at + DAY / 24).toISOString() : null,
    }))
  }
  PATIENTS.forEach(([firstName, lastName, dob, phone, lang, g, email]) => {
    const first = now - (40 + r() * 500) * DAY
    const p = { id: randomUUID(), firstName, lastName, dob, phone, email, createdAt: new Date(first).toISOString() }
    patients.push(p)
    gender[p.id] = g === 'f' ? 'female' : 'male'
    add(p, lang, chance(0.5) ? ['medical-history', 'media-consent'] : ['medical-history'], first, true)
    if (chance(0.4)) add(p, lang, ['medical-history'], now - (5 + r() * 30) * DAY, true)
  })
  // Today's queue, still to be reviewed by reception.
  const byName = n => patients.find(p => p.firstName === n)
  add(byName('James'), 'en', ['medical-history'], now - 140 * 60_000, false)
  add(byName('Μάριος'), 'el', ['media-consent'], now - 70 * 60_000, false)
  add(byName('Ольга'), 'ru', ['medical-history', 'media-consent'], now - 25 * 60_000, false)

  submissions.sort((a, b) => a.submittedAt.localeCompare(b.submittedAt))
  submissions.forEach((s, i) => { s.ref = 'SD-' + String(i + 1).padStart(5, '0') })
  return { patients, submissions }
}
