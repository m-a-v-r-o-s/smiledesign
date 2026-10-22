// Form definitions, shared by the kiosk, the admin and the server (validation).
// Source: the clinic's paper forms (photos received 2026-10-22), English and Greek as printed.
// Russian is our translation and needs a native-speaker check before real use.
// Deliberate fixes against the paper: Greek "Atrial fibrillation" was printed as «Αρτηριακή Υπέρταση»
// (a duplicate of hypertension), English "Lever Cirrhosis" typo, Greek media consent says «θα γράψω»
// (I will write) where the iPad has a checkbox, so «θα επιλέξω».
//
// Field types: text, textarea, date, yesno (optional `details` follow-up on "yes"),
// choice (one option), multi (several, an option with `none: true` is exclusive), consent (checkbox),
// info (read-only text: `body` per language, a list of paragraphs, { h } headings and { ul } lists).
// `alert: '<English label>'` surfaces a "yes"/ticked answer as an alert in the admin.

export const LANGS = ['en', 'el', 'ru']

const opt = (id, en, el, ru) => ({ id, label: { en, el, ru } })

export const FORMS = [
  {
    id: 'medical-history',
    minutes: 5,
    title: { en: 'Medical form', el: 'Έντυπο Καταγραφής Ασθενούς', ru: 'Медицинская анкета' },
    description: {
      en: 'Your details and medical history.',
      el: 'Τα στοιχεία σας και το ιατρικό σας ιστορικό.',
      ru: 'Ваши данные и медицинский анамнез.',
    },
    sections: [
      {
        title: { en: 'Personal details', el: 'Προσωπικά στοιχεία', ru: 'Личные данные' },
        fields: [
          {
            id: 'gender', type: 'choice', required: true,
            label: { en: 'Gender', el: 'Φύλο', ru: 'Пол' },
            options: [opt('male', 'Male', 'Άρρεν', 'Мужской'), opt('female', 'Female', 'Θήλυ', 'Женский')],
          },
          { id: 'address', type: 'text', required: true, label: { en: 'Address', el: 'Διεύθυνση', ru: 'Адрес' } },
          { id: 'city', type: 'text', required: true, label: { en: 'City', el: 'Πόλη', ru: 'Город' } },
          { id: 'postcode', type: 'text', inputMode: 'numeric', label: { en: 'Postcode', el: 'Τ.Κ.', ru: 'Почтовый индекс' } },
          { id: 'phone2', type: 'text', inputMode: 'tel', label: { en: 'Other phone', el: 'Άλλο τηλέφωνο', ru: 'Другой телефон' } },
          {
            id: 'emergency', type: 'text',
            label: { en: 'Emergency contact (name and phone)', el: 'Επαφή έκτακτης ανάγκης (όνομα και τηλέφωνο)', ru: 'Контакт на экстренный случай (имя и телефон)' },
          },
          { id: 'occupation', type: 'text', label: { en: 'Occupation', el: 'Επάγγελμα', ru: 'Профессия' } },
        ],
      },
      {
        title: { en: 'Medical history', el: 'Ιατρικό ιστορικό', ru: 'Медицинский анамнез' },
        fields: [
          {
            id: 'conditions', type: 'multi', required: true, alert: 'Condition',
            label: { en: 'Please tick everything that applies to you', el: 'Παρακαλώ σημειώστε όσα ισχύουν για εσάς', ru: 'Отметьте всё, что относится к вам' },
            options: [
              opt('anestheticAllergy', 'Anesthetic allergy', 'Αλλεργία σε αναισθητικά', 'Аллергия на анестетики'),
              opt('smoking', 'Smoking', 'Κάπνισμα', 'Курение'),
              opt('myocardialInfarction', 'History of myocardial infarction', 'Ιστορικό εμφράγματος μυοκαρδίου', 'Инфаркт миокарда в анамнезе'),
              opt('hypertension', 'Hypertension', 'Υπέρταση', 'Гипертония'),
              opt('atrialFibrillation', 'Atrial fibrillation', 'Κολπική μαρμαρυγή', 'Мерцательная аритмия'),
              opt('arrhythmias', 'Arrhythmias', 'Αρρυθμίες', 'Аритмия'),
              opt('aspirin', 'Aspirin intake', 'Λήψη ασπιρίνης', 'Приём аспирина'),
              opt('endocarditis', 'Infective endocarditis', 'Ιστορικό λοιμώδους ενδοκαρδίτιδας', 'Инфекционный эндокардит'),
              opt('cholesterol', 'High cholesterol', 'Χοληστερόλη', 'Повышенный холестерин'),
              opt('stroke', 'Stroke', 'Εγκεφαλικό', 'Инсульт'),
              opt('kidney', 'Kidney disease', 'Νοσήματα νεφρών', 'Заболевания почек'),
              opt('penicillinAllergy', 'Penicillin allergy', 'Αλλεργία στην πενικιλίνη', 'Аллергия на пенициллин'),
              opt('cancer', 'History of cancer', 'Ιστορικό καρκίνου', 'Онкологические заболевания в анамнезе'),
              opt('hiv', 'HIV', 'HIV', 'ВИЧ'),
              opt('anemia', 'Anemia', 'Αναιμία', 'Анемия'),
              opt('diabetes', 'Diabetes mellitus', 'Σακχαρώδης διαβήτης', 'Сахарный диабет'),
              opt('thyroid', 'Hyper/hypo thyroidism', 'Υπέρ/υπό θυρεοειδισμός', 'Гипер-/гипотиреоз'),
              opt('epilepsy', 'Epilepsy', 'Επιληψία', 'Эпилепсия'),
              opt('reflux', 'Gastroesophageal reflux', 'Γαστροοισοφαγική παλινδρόμηση', 'Гастроэзофагеальный рефлюкс'),
              opt('anxiolytics', 'Intake of anxiolytics/antidepressants', 'Λήψη αγχολυτικών/αντικαταθλιπτικών', 'Приём успокоительных/антидепрессантов'),
              opt('asthma', 'Asthma', 'Άσθμα', 'Астма'),
              opt('osteoporosis', 'Osteoporosis', 'Οστεοπόρωση', 'Остеопороз'),
              opt('cirrhosis', 'Liver cirrhosis', 'Κίρρωση ήπατος', 'Цирроз печени'),
              opt('pregnancy', 'Pregnancy', 'Εγκυμοσύνη', 'Беременность'),
              opt('latexAllergy', 'Latex allergy', 'Αλλεργία στο latex', 'Аллергия на латекс'),
              opt('radiation', 'Radiation therapy', 'Ακτινοθεραπεία', 'Лучевая терапия'),
              opt('hepatitis', 'Hepatitis', 'Ηπατίτιδα', 'Гепатит'),
              opt('pulmonary', 'Chronic pulmonary insufficiency', 'Χρόνια πνευμονική ανεπάρκεια', 'Хроническая лёгочная недостаточность'),
              { ...opt('none', 'None of the above', 'Κανένα από τα παραπάνω', 'Ничего из перечисленного'), none: true },
            ],
          },
          {
            id: 'allergies', type: 'yesno', required: true, alert: 'Allergy',
            label: { en: 'Do you have any other known allergies?', el: 'Έχετε άλλες γνωστές αλλεργίες;', ru: 'Есть ли у вас другие известные аллергии?' },
            details: { en: 'Please list them', el: 'Παρακαλώ σημειώστε τες', ru: 'Перечислите их' },
          },
          {
            id: 'medications', type: 'yesno', required: true, alert: 'Medication',
            label: { en: 'Are you taking any medication?', el: 'Λαμβάνετε φάρμακα;', ru: 'Принимаете ли вы лекарства?' },
            details: { en: 'Which ones?', el: 'Ποια;', ru: 'Какие?' },
          },
          {
            id: 'other', type: 'textarea',
            label: { en: 'Anything else about your health we should know?', el: 'Κάτι άλλο για την υγεία σας που πρέπει να γνωρίζουμε;', ru: 'Что-то ещё о вашем здоровье, что нам следует знать?' },
          },
        ],
      },
      {
        title: { en: 'Other information', el: 'Άλλες πληροφορίες', ru: 'Другая информация' },
        fields: [
          { id: 'doctors', type: 'text', label: { en: 'Your medical doctors', el: 'Θεράποντες ιατροί', ru: 'Ваши лечащие врачи' } },
          { id: 'orthodontist', type: 'text', label: { en: 'Orthodontist', el: 'Ορθοδοντικός', ru: 'Ортодонт' } },
          { id: 'referral', type: 'text', label: { en: 'How did you hear about our clinic?', el: 'Πώς μάθατε για την κλινική μας;', ru: 'Как вы узнали о нашей клинике?' } },
        ],
      },
    ],
  },
  {
    id: 'media-consent',
    minutes: 3,
    title: {
      en: 'Consent to processing and publishing media',
      el: 'Συγκατάθεση επεξεργασίας και δημοσίευσης πολυμέσων',
      ru: 'Согласие на обработку и публикацию медиаматериалов',
    },
    description: {
      en: 'Photos and video of your treatment, with Kaimakki Studio.',
      el: 'Φωτογραφίες και βίντεο της θεραπείας σας, με την Kaimakki Studio.',
      ru: 'Фото и видео вашего лечения, совместно с Kaimakki Studio.',
    },
    sections: [
      {
        title: { en: 'What you agree to', el: 'Με τι συμφωνείτε', ru: 'С чем вы соглашаетесь' },
        fields: [
          {
            id: 'terms', type: 'info',
            body: {
              en: [
                'I grant Smile Design and its appointed media partner, Kaimakki Studio (kaimakki.com), permission to record, photograph, and film my consultation, treatment process, and treatment results, including my voice, mouth, teeth, and any related clinical material, such as intraoral photographs, scans, and before-and-after comparisons.',
                'My full face will not be filmed or photographed during treatment. Full-face footage will only be taken outside the treatment context, when I am standing and showing my natural smile.',
                "I consent to this material being used on Smile Design's social media accounts, website, marketing materials, and paid advertising campaigns, in Cyprus and internationally, in any format and without any time limit.",
                'Smile Design will not publish my full name, contact details, date of birth, address, medical history, or any other information that directly identifies me, beyond what is visible in the material itself, without my separate written consent.',
                { h: 'I understand that:' },
                { ul: [
                  'I will not receive payment, royalties, or any other compensation for the use of this material.',
                  'Once the material is published, it may be reshared, screenshotted, downloaded, or republished by third parties. Smile Design and Kaimakki Studio may not be able to retrieve these copies.',
                  'If I do not wish my face to appear in any of the material, I will check "NO FACE" below. In this case, Smile Design will only use footage that does not show my face, such as intraoral shots, footage of hands, side angles, or close-ups of the treatment work.',
                ] },
                { h: 'Withdrawal of consent' },
                'I have the right to withdraw my consent at any time and for any reason by sending a written request to gdrive@smiledesign.com.cy.',
                'Within thirty (30) days of receiving my request, Smile Design will stop publishing new material featuring me and will remove existing material from channels under its direct control, including its own social media accounts, website, and active paid advertising campaigns. Smile Design will also notify Kaimakki Studio to take the corresponding action.',
                'Material that has been reshared by third parties or downloaded by others may no longer be retrievable or removable, and I understand this limitation.',
                'Withdrawal of my consent will not affect my ongoing or future treatment at Smile Design in any way.',
              ],
              el: [
                'Παρέχω στη Smile Design και στον συνεργάτη της για θέματα επικοινωνίας και προβολής, Kaimakki Studio (kaimakki.com), την άδεια να καταγράφουν, να φωτογραφίζουν και να βιντεοσκοπούν τη συμβουλευτική μου συνεδρία, τη διαδικασία της θεραπείας μου και τα αποτελέσματα της θεραπείας, συμπεριλαμβανομένης της φωνής μου, του στόματός μου, των δοντιών μου και κάθε σχετικού κλινικού υλικού, όπως ενδοστοματικές φωτογραφίες, σαρώσεις και συγκριτικές εικόνες πριν και μετά τη θεραπεία.',
                'Το πρόσωπό μου στο σύνολό του δεν θα καταγράφεται κατά τη διάρκεια της θεραπείας. Πλάνα που εμφανίζουν ολόκληρο το πρόσωπό μου θα λαμβάνονται μόνο εκτός του θεραπευτικού πλαισίου, όταν στέκομαι όρθιος/όρθια και παρουσιάζω το φυσικό μου χαμόγελο.',
                'Συναινώ στη χρήση αυτού του υλικού στους λογαριασμούς κοινωνικών δικτύων της Smile Design, στον ιστότοπό της, σε υλικό μάρκετινγκ και σε πληρωμένες διαφημιστικές καμπάνιες, στην Κύπρο και διεθνώς, σε οποιαδήποτε μορφή και χωρίς χρονικό περιορισμό.',
                'Η Smile Design δεν θα δημοσιεύει το πλήρες ονοματεπώνυμό μου, τα στοιχεία επικοινωνίας μου, την ημερομηνία γέννησής μου, τη διεύθυνσή μου, το ιατρικό ιστορικό μου ή οποιαδήποτε άλλη πληροφορία που με ταυτοποιεί άμεσα, πέραν όσων είναι ορατά στο ίδιο το υλικό, χωρίς τη γραπτή συγκατάθεσή μου.',
                { h: 'Κατανοώ ότι:' },
                { ul: [
                  'Δεν θα λάβω αμοιβή, δικαιώματα εκμετάλλευσης ή οποιαδήποτε άλλη αποζημίωση για τη συγκεκριμένη χρήση του υλικού.',
                  'Μόλις το υλικό δημοσιευθεί, ενδέχεται να αναδημοσιευθεί, να ληφθούν στιγμιότυπα οθόνης, να μεταφορτωθεί ή να αναδημοσιευθεί από τρίτους. Η Smile Design και η Kaimakki Studio ενδέχεται να μην είναι σε θέση να ανακτήσουν αυτά τα αντίγραφα.',
                  'Εάν δεν επιθυμώ να εμφανίζεται το πρόσωπό μου σε οποιοδήποτε από το υλικό, θα επιλέξω «ΟΧΙ ΠΡΟΣΩΠΟ» παρακάτω. Σε αυτή την περίπτωση, η Smile Design θα χρησιμοποιεί μόνο πλάνα στα οποία δεν εμφανίζεται το πρόσωπό μου, όπως ενδοστοματικές λήψεις, πλάνα των χεριών, πλάγιες λήψεις ή κοντινά πλάνα της θεραπευτικής εργασίας.',
                ] },
                { h: 'Ανάκληση της συγκατάθεσης' },
                'Έχω το δικαίωμα να ανακαλέσω τη συγκατάθεσή μου οποτεδήποτε και για οποιονδήποτε λόγο, αποστέλλοντας γραπτό αίτημα στη διεύθυνση gdrive@smiledesign.com.cy.',
                'Εντός τριάντα (30) ημερών από την παραλαβή του αιτήματός μου, η Smile Design θα σταματήσει να δημοσιεύει νέο υλικό στο οποίο εμφανίζομαι και θα αφαιρέσει το υφιστάμενο υλικό από τα κανάλια που ελέγχει άμεσα, συμπεριλαμβανομένων των δικών της λογαριασμών στα μέσα κοινωνικής δικτύωσης, του ιστότοπού της και των ενεργών πληρωμένων διαφημιστικών προγραμμάτων. Η Smile Design θα ενημερώσει επίσης την Kaimakki Studio ώστε να προβεί στις αντίστοιχες ενέργειες.',
                'Υλικό που έχει αναδημοσιευθεί από τρίτους ή έχει μεταφορτωθεί από άλλους ενδέχεται να μην είναι πλέον δυνατό να ανακτηθεί ή να διαγραφεί, και κατανοώ αυτόν τον περιορισμό.',
                'Η ανάκληση της συγκατάθεσής μου δεν θα επηρεάσει τη θεραπεία μου στη Smile Design.',
              ],
              ru: [
                'Я предоставляю Smile Design и её медиапартнёру Kaimakki Studio (kaimakki.com) разрешение записывать, фотографировать и снимать на видео мою консультацию, процесс лечения и его результаты, включая мой голос, рот, зубы и любые связанные клинические материалы, такие как внутриротовые фотографии, сканы и сравнения «до и после».',
                'Моё лицо целиком не будет сниматься во время лечения. Съёмка всего лица проводится только вне лечебного процесса, когда я стою и показываю свою естественную улыбку.',
                'Я соглашаюсь на использование этих материалов в аккаунтах Smile Design в социальных сетях, на её сайте, в маркетинговых материалах и платных рекламных кампаниях, на Кипре и за рубежом, в любом формате и без ограничения срока.',
                'Smile Design не будет публиковать моё полное имя, контактные данные, дату рождения, адрес, медицинский анамнез или любую другую информацию, прямо идентифицирующую меня, помимо того, что видно в самих материалах, без моего отдельного письменного согласия.',
                { h: 'Я понимаю, что:' },
                { ul: [
                  'Я не получу оплату, роялти или иное вознаграждение за использование этих материалов.',
                  'После публикации материалы могут быть распространены, сохранены в виде скриншотов, скачаны или опубликованы повторно третьими лицами. Smile Design и Kaimakki Studio могут не иметь возможности вернуть такие копии.',
                  'Если я не хочу, чтобы моё лицо появлялось в каких-либо материалах, я отмечу пункт «БЕЗ ЛИЦА» ниже. В этом случае Smile Design будет использовать только кадры, на которых не видно моего лица, например внутриротовые снимки, кадры рук, съёмку сбоку или крупные планы лечебной работы.',
                ] },
                { h: 'Отзыв согласия' },
                'Я имею право отозвать своё согласие в любое время и по любой причине, направив письменный запрос на адрес gdrive@smiledesign.com.cy.',
                'В течение тридцати (30) дней после получения моего запроса Smile Design прекратит публиковать новые материалы с моим участием и удалит существующие материалы из каналов, находящихся под её непосредственным контролем, включая её аккаунты в социальных сетях, сайт и действующие платные рекламные кампании. Smile Design также уведомит Kaimakki Studio о необходимости принять соответствующие меры.',
                'Материалы, которые были распространены третьими лицами или скачаны другими, могут оказаться невозможными для возврата или удаления, и я понимаю это ограничение.',
                'Отзыв моего согласия никак не повлияет на моё текущее или будущее лечение в Smile Design.',
              ],
            },
          },
          {
            id: 'noFace', type: 'consent', alert: 'NO FACE in media',
            label: {
              en: 'NO FACE: I do not wish my face to appear in any material used.',
              el: 'ΟΧΙ ΠΡΟΣΩΠΟ: Δεν επιθυμώ να εμφανίζεται το πρόσωπό μου σε κανένα από το υλικό που θα χρησιμοποιηθεί.',
              ru: 'БЕЗ ЛИЦА: я не хочу, чтобы моё лицо появлялось в каких-либо используемых материалах.',
            },
          },
        ],
      },
    ],
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
    if (f.type === 'consent' && v === true) out.push(f.alert)
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
    if (f.type === 'info') continue
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
  if (typeof p.email !== 'string' || p.email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) return { error: 'email' }
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
        phone: p.phone.trim(), email: p.email.trim(),
      },
      forms: out,
    },
  }
}
