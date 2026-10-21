// Form definitions, shared by the kiosk, the admin and the server (validation).
// PLACEHOLDER CONTENT: realistic drafts until the clinic sends the real forms.
// Replacing a form = editing its entry here; nothing else needs to change.
//
// Field types: text, textarea, date, yesno (optional `details` follow-up on "yes"),
// choice (one option), multi (several, an option with `none: true` is exclusive), consent (checkbox).
// `alert: '<English label>'` surfaces a "yes"/selected answer as a medical alert in the admin.

export const LANGS = ['en', 'el', 'ru']

export const FORMS = [
  {
    id: 'medical-history',
    minutes: 4,
    title: { en: 'Medical history', el: 'Ιατρικό ιστορικό', ru: 'Медицинская анкета' },
    description: {
      en: 'Your general health and dental history.',
      el: 'Η γενική σας υγεία και το οδοντιατρικό σας ιστορικό.',
      ru: 'Ваше общее здоровье и стоматологический анамнез.',
    },
    sections: [
      {
        title: { en: 'General health', el: 'Γενική υγεία', ru: 'Общее здоровье' },
        fields: [
          {
            id: 'doctorCare', type: 'yesno', required: true,
            label: { en: "Are you currently under a doctor's care?", el: 'Βρίσκεστε αυτή τη στιγμή υπό ιατρική παρακολούθηση;', ru: 'Наблюдаетесь ли вы сейчас у врача?' },
            details: { en: 'Please give details', el: 'Παρακαλούμε δώστε λεπτομέρειες', ru: 'Пожалуйста, уточните' },
          },
          {
            id: 'medications', type: 'yesno', required: true, alert: 'Medication',
            label: { en: 'Are you taking any medication?', el: 'Παίρνετε κάποια φάρμακα;', ru: 'Принимаете ли вы какие-либо лекарства?' },
            details: { en: 'Which ones?', el: 'Ποια;', ru: 'Какие?' },
          },
          {
            id: 'anticoagulants', type: 'yesno', required: true, alert: 'Blood thinners',
            label: { en: 'Are you taking blood thinners (e.g. aspirin, warfarin)?', el: 'Παίρνετε αντιπηκτικά (π.χ. ασπιρίνη, βαρφαρίνη);', ru: 'Принимаете ли вы препараты, разжижающие кровь (например, аспирин, варфарин)?' },
          },
          {
            id: 'allergies', type: 'yesno', required: true, alert: 'Allergy',
            label: { en: 'Do you have any allergies (medicines, latex, anaesthetics)?', el: 'Έχετε κάποια αλλεργία (φάρμακα, λάτεξ, αναισθητικά);', ru: 'Есть ли у вас аллергия (на лекарства, латекс, анестетики)?' },
            details: { en: 'What are you allergic to?', el: 'Σε τι είστε αλλεργικός/ή;', ru: 'На что именно?' },
          },
          {
            id: 'conditions', type: 'multi', required: true, alert: 'Condition',
            label: { en: 'Do you have, or have you had, any of the following?', el: 'Έχετε ή είχατε ποτέ κάποιο από τα παρακάτω;', ru: 'Есть ли или были ли у вас следующие заболевания?' },
            options: [
              { id: 'heart', label: { en: 'Heart condition', el: 'Καρδιοπάθεια', ru: 'Заболевание сердца' } },
              { id: 'bp', label: { en: 'High blood pressure', el: 'Υψηλή αρτηριακή πίεση', ru: 'Повышенное давление' } },
              { id: 'diabetes', label: { en: 'Diabetes', el: 'Διαβήτης', ru: 'Диабет' } },
              { id: 'asthma', label: { en: 'Asthma', el: 'Άσθμα', ru: 'Астма' } },
              { id: 'epilepsy', label: { en: 'Epilepsy', el: 'Επιληψία', ru: 'Эпилепсия' } },
              { id: 'hepatitis', label: { en: 'Hepatitis', el: 'Ηπατίτιδα', ru: 'Гепатит' } },
              { id: 'bleeding', label: { en: 'Bleeding disorder', el: 'Διαταραχή πηκτικότητας', ru: 'Нарушение свёртываемости крови' } },
              { id: 'none', none: true, label: { en: 'None of these', el: 'Κανένα από αυτά', ru: 'Ничего из перечисленного' } },
            ],
          },
          {
            id: 'pregnant', type: 'yesno', alert: 'Pregnant or breastfeeding',
            label: { en: 'Are you pregnant or breastfeeding?', el: 'Είστε έγκυος ή θηλάζετε;', ru: 'Вы беременны или кормите грудью?' },
          },
          {
            id: 'smoker', type: 'yesno', required: true,
            label: { en: 'Do you smoke?', el: 'Καπνίζετε;', ru: 'Вы курите?' },
          },
        ],
      },
      {
        title: { en: 'Dental history', el: 'Οδοντιατρικό ιστορικό', ru: 'Стоматологический анамнез' },
        fields: [
          {
            id: 'lastVisit', type: 'choice', required: true,
            label: { en: 'When was your last dental visit?', el: 'Πότε ήταν η τελευταία σας επίσκεψη σε οδοντίατρο;', ru: 'Когда вы последний раз были у стоматолога?' },
            options: [
              { id: 'lt6', label: { en: 'Less than 6 months ago', el: 'Πριν από λιγότερο από 6 μήνες', ru: 'Менее 6 месяцев назад' } },
              { id: '6to12', label: { en: '6 to 12 months ago', el: 'Πριν από 6 έως 12 μήνες', ru: '6–12 месяцев назад' } },
              { id: '1to2', label: { en: '1 to 2 years ago', el: 'Πριν από 1 έως 2 χρόνια', ru: '1–2 года назад' } },
              { id: 'gt2', label: { en: 'More than 2 years ago', el: 'Πριν από περισσότερα από 2 χρόνια', ru: 'Более 2 лет назад' } },
            ],
          },
          {
            id: 'reason', type: 'textarea',
            label: { en: 'What brings you in today?', el: 'Ποιος είναι ο λόγος της επίσκεψής σας σήμερα;', ru: 'Что привело вас к нам сегодня?' },
          },
          {
            id: 'anxiety', type: 'choice', required: true,
            label: { en: 'How do you feel about dental treatment?', el: 'Πώς νιώθετε για την οδοντιατρική θεραπεία;', ru: 'Как вы относитесь к стоматологическому лечению?' },
            options: [
              { id: 'calm', label: { en: 'Relaxed', el: 'Ήρεμα', ru: 'Спокойно' } },
              { id: 'little', label: { en: 'A little nervous', el: 'Λίγο αγχωμένος/η', ru: 'Немного волнуюсь' } },
              { id: 'very', label: { en: 'Very anxious', el: 'Πολύ αγχωμένος/η', ru: 'Очень боюсь' } },
            ],
          },
        ],
      },
    ],
    declaration: {
      en: 'I confirm that the information above is accurate to the best of my knowledge, and I will tell the clinic about any changes to my health.',
      el: 'Βεβαιώνω ότι οι παραπάνω πληροφορίες είναι ακριβείς εξ όσων γνωρίζω και θα ενημερώσω την κλινική για οποιαδήποτε αλλαγή στην υγεία μου.',
      ru: 'Я подтверждаю, что приведённые выше сведения верны, насколько мне известно, и обязуюсь сообщать клинике обо всех изменениях в состоянии моего здоровья.',
    },
  },
  {
    id: 'treatment-consent',
    minutes: 2,
    title: { en: 'Consent to treatment', el: 'Συναίνεση για θεραπεία', ru: 'Согласие на лечение' },
    description: {
      en: 'Confirms your dentist has explained the planned treatment.',
      el: 'Επιβεβαιώνει ότι ο οδοντίατρός σας σάς εξήγησε την προγραμματισμένη θεραπεία.',
      ru: 'Подтверждает, что врач объяснил вам планируемое лечение.',
    },
    sections: [
      {
        title: { en: 'Your treatment', el: 'Η θεραπεία σας', ru: 'Ваше лечение' },
        fields: [
          {
            id: 'treatment', type: 'text', required: true,
            label: { en: 'Treatment discussed with your dentist', el: 'Θεραπεία που συζητήσατε με τον οδοντίατρό σας', ru: 'Лечение, которое вы обсудили с врачом' },
          },
          {
            id: 'explained', type: 'consent', required: true,
            label: { en: 'The treatment, its alternatives and possible risks have been explained to me.', el: 'Μου εξηγήθηκαν η θεραπεία, οι εναλλακτικές της και οι πιθανοί κίνδυνοι.', ru: 'Мне объяснили суть лечения, альтернативные варианты и возможные риски.' },
          },
          {
            id: 'questions', type: 'consent', required: true,
            label: { en: 'I have had the chance to ask questions and they were answered.', el: 'Είχα την ευκαιρία να κάνω ερωτήσεις και πήρα απαντήσεις.', ru: 'У меня была возможность задать вопросы, и я получил(а) ответы.' },
          },
          {
            id: 'cost', type: 'consent', required: true,
            label: { en: 'I understand the estimated cost and that it may change if the treatment plan changes.', el: 'Κατανοώ το εκτιμώμενο κόστος και ότι μπορεί να αλλάξει αν αλλάξει το σχέδιο θεραπείας.', ru: 'Я понимаю ориентировочную стоимость и то, что она может измениться при изменении плана лечения.' },
          },
          {
            id: 'anaesthesia', type: 'consent', required: true,
            label: { en: 'I agree to local anaesthesia where needed.', el: 'Συμφωνώ με τη χρήση τοπικής αναισθησίας όπου χρειάζεται.', ru: 'Я согласен(на) на местную анестезию при необходимости.' },
          },
        ],
      },
    ],
    declaration: {
      en: 'I give my consent to the treatment described above.',
      el: 'Δίνω τη συναίνεσή μου για την παραπάνω θεραπεία.',
      ru: 'Я даю согласие на описанное выше лечение.',
    },
  },
  {
    id: 'privacy',
    minutes: 1,
    title: { en: 'Privacy and data consent', el: 'Προστασία προσωπικών δεδομένων', ru: 'Согласие на обработку данных' },
    description: {
      en: 'How we store and use your information.',
      el: 'Πώς φυλάσσουμε και χρησιμοποιούμε τα στοιχεία σας.',
      ru: 'Как мы храним и используем ваши данные.',
    },
    sections: [
      {
        title: { en: 'Your data', el: 'Τα δεδομένα σας', ru: 'Ваши данные' },
        fields: [
          {
            id: 'processing', type: 'consent', required: true,
            label: { en: 'I agree that Smile Design may keep and process my personal and health data to provide my dental care.', el: 'Συμφωνώ η Smile Design να διατηρεί και να επεξεργάζεται τα προσωπικά δεδομένα και τα δεδομένα υγείας μου για την παροχή οδοντιατρικής φροντίδας.', ru: 'Я согласен(на), что Smile Design хранит и обрабатывает мои персональные и медицинские данные для оказания стоматологической помощи.' },
          },
          {
            id: 'contact', type: 'choice', required: true,
            label: { en: 'How should we contact you about appointments?', el: 'Πώς προτιμάτε να επικοινωνούμε μαζί σας για τα ραντεβού;', ru: 'Как нам связываться с вами по поводу приёмов?' },
            options: [
              { id: 'phone', label: { en: 'Phone call', el: 'Τηλεφωνικά', ru: 'Звонок' } },
              { id: 'sms', label: { en: 'SMS', el: 'SMS', ru: 'SMS' } },
              { id: 'viber', label: { en: 'Viber', el: 'Viber', ru: 'Viber' } },
              { id: 'email', label: { en: 'Email', el: 'Email', ru: 'Эл. почта' } },
            ],
          },
          {
            id: 'reminders', type: 'consent',
            label: { en: 'Send me appointment reminders.', el: 'Θέλω να λαμβάνω υπενθυμίσεις για τα ραντεβού μου.', ru: 'Присылайте мне напоминания о приёмах.' },
          },
          {
            id: 'photos', type: 'consent',
            label: { en: "Clinical photos of my smile may be used anonymously for teaching or on the clinic's website.", el: 'Κλινικές φωτογραφίες του χαμόγελού μου μπορούν να χρησιμοποιηθούν ανώνυμα για εκπαιδευτικούς σκοπούς ή στην ιστοσελίδα της κλινικής.', ru: 'Клинические фото моей улыбки могут анонимно использоваться в учебных целях или на сайте клиники.' },
          },
        ],
      },
    ],
    declaration: {
      en: "I have read and understood the clinic's privacy notice.",
      el: 'Διάβασα και κατανόησα την ενημέρωση απορρήτου της κλινικής.',
      ru: 'Я прочитал(а) и понял(а) уведомление клиники о конфиденциальности.',
    },
  },
]

export const formById = id => FORMS.find(f => f.id === id)
export const fieldsOf = form => form.sections.flatMap(s => s.fields)
export const tr = (obj, lang) => obj?.[lang] ?? obj?.en ?? ''
// Accent/case-insensitive key for matching names across Latin, Greek and Cyrillic input.
export const norm = s => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().replace(/ς/g, 'σ').replace(/\s+/g, ' ').trim()

// English alert labels for the admin, e.g. ['Allergy: penicillin', 'Diabetes'].
export function alertsFor(formId, answers) {
  const form = formById(formId)
  if (!form) return []
  const out = []
  for (const f of fieldsOf(form)) {
    if (!f.alert) continue
    const v = answers[f.id]
    if (f.type === 'yesno' && v === 'yes') {
      const d = answers[f.id + 'Details']
      out.push(d ? `${f.alert}: ${d}` : f.alert)
    }
    if (f.type === 'multi' && Array.isArray(v)) {
      for (const o of f.options) if (!o.none && v.includes(o.id)) out.push(o.label.en)
    }
  }
  return out
}

const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + 'T00:00:00Z'))
const str = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max
const LIMIT = { text: 200, textarea: 2000 }

// Validates one form's answers against its schema. Returns { error } or { value } with only known keys.
export function validateAnswers(form, answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) return { error: 'answers' }
  const value = {}
  for (const f of fieldsOf(form)) {
    const v = answers[f.id]
    const empty = v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0)
    if (empty) {
      if (f.required) return { error: `${f.id}: required` }
      continue
    }
    const ok =
      f.type === 'text' || f.type === 'textarea' ? str(v, LIMIT[f.type]) :
      f.type === 'date' ? isDate(v) :
      f.type === 'yesno' ? v === 'yes' || v === 'no' :
      f.type === 'choice' ? f.options.some(o => o.id === v) :
      f.type === 'multi' ? Array.isArray(v) && v.length <= f.options.length && new Set(v).size === v.length &&
        v.every(id => f.options.some(o => o.id === id)) && (v.length === 1 || !v.some(id => f.options.find(o => o.id === id).none)) :
      f.type === 'consent' ? v === true : false
    if (!ok) return { error: `${f.id}: invalid` }
    value[f.id] = typeof v === 'string' ? v.trim() : v
    if (f.details && v === 'yes' && answers[f.id + 'Details'] != null && answers[f.id + 'Details'] !== '') {
      if (!str(answers[f.id + 'Details'], LIMIT.textarea)) return { error: `${f.id}Details: invalid` }
      value[f.id + 'Details'] = answers[f.id + 'Details'].trim()
    }
  }
  return { value }
}

const SIG_MAX = 500_000 // chars of base64 PNG, a signature is typically 20 to 80k

// Validates a kiosk submission body. Returns { error } or { value } (whitelisted, trimmed).
export function validateSubmission(body) {
  if (!body || typeof body !== 'object') return { error: 'body' }
  const { lang, patient: p, forms } = body
  if (!LANGS.includes(lang)) return { error: 'lang' }
  if (!p || typeof p !== 'object') return { error: 'patient' }
  if (!str(p.firstName, 80) || !str(p.lastName, 80)) return { error: 'name' }
  if (!isDate(p.dob) || p.dob < '1900-01-01' || Date.parse(p.dob) > Date.now()) return { error: 'dob' }
  if (typeof p.phone !== 'string' || !/^\+?[\d\s()-]{6,20}$/.test(p.phone.trim())) return { error: 'phone' }
  if (p.email && (typeof p.email !== 'string' || p.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim()))) return { error: 'email' }
  if (!Array.isArray(forms) || forms.length < 1 || forms.length > FORMS.length) return { error: 'forms' }
  if (new Set(forms.map(f => f?.formId)).size !== forms.length) return { error: 'forms: duplicate' }
  const out = []
  for (const f of forms) {
    const form = formById(f?.formId)
    if (!form) return { error: 'forms: unknown form' }
    const a = validateAnswers(form, f.answers)
    if (a.error) return { error: `${form.id}.${a.error}` }
    if (typeof f.signature !== 'string' || !f.signature.startsWith('data:image/png;base64,') || f.signature.length > SIG_MAX) {
      return { error: `${form.id}.signature` }
    }
    out.push({ formId: form.id, answers: a.value, signature: f.signature })
  }
  return {
    value: {
      lang,
      patient: {
        firstName: p.firstName.trim(), lastName: p.lastName.trim(), dob: p.dob,
        phone: p.phone.trim(), email: p.email ? p.email.trim() : '',
      },
      forms: out,
    },
  }
}
