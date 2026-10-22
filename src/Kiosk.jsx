import { useEffect, useRef, useState } from 'react'
import { FORMS, LANGS, formById, fieldsOf, tr } from '../shared/forms.js'
import SignaturePad from './SignaturePad.jsx'
import Legal from './Legal.jsx'

const IDLE_SECONDS = 120 // no touch for this long → "are you still there?"
const IDLE_GRACE = 30 // then this long before everything is cleared
const DONE_SECONDS = 20 // thank-you screen clears itself

const LANG_NAMES = { en: 'English', el: 'Ελληνικά', ru: 'Русский' }
const LANG_SHORT = { en: 'EN', el: 'ΕΛ', ru: 'РУ' }

const S = {
  welcome: { en: 'Welcome', el: 'Καλώς ήρθατε', ru: 'Добро пожаловать' },
  chooseLang: { en: 'Please choose your language', el: 'Επιλέξτε γλώσσα', ru: 'Выберите язык' },
  pickTitle: { en: 'Which forms are you filling in today?', el: 'Ποια έντυπα θα συμπληρώσετε σήμερα;', ru: 'Какие формы вы заполняете сегодня?' },
  pickHint: { en: 'Not sure? Ask at reception.', el: 'Δεν είστε σίγουροι; Ρωτήστε στη ρεσεψιόν.', ru: 'Не уверены? Спросите на ресепшене.' },
  minutes: { en: 'about {n} min', el: 'περίπου {n} λεπτά', ru: 'около {n} мин' },
  continue: { en: 'Continue', el: 'Συνέχεια', ru: 'Далее' },
  back: { en: 'Back', el: 'Πίσω', ru: 'Назад' },
  startOver: { en: 'Start over', el: 'Από την αρχή', ru: 'Начать заново' },
  confirmStartOver: { en: 'Start over? Your answers will be cleared.', el: 'Να ξεκινήσουμε από την αρχή; Οι απαντήσεις σας θα διαγραφούν.', ru: 'Начать заново? Ваши ответы будут удалены.' },
  yes: { en: 'Yes', el: 'Ναι', ru: 'Да' },
  no: { en: 'No', el: 'Όχι', ru: 'Нет' },
  details: { en: 'Your details', el: 'Τα στοιχεία σας', ru: 'Ваши данные' },
  detailsNote: { en: 'Your information is sent securely to Smile Design and is only seen by the clinic team.', el: 'Τα στοιχεία σας αποστέλλονται με ασφάλεια στη Smile Design και τα βλέπει μόνο η ομάδα της κλινικής.', ru: 'Ваши данные надёжно передаются в Smile Design и доступны только сотрудникам клиники.' },
  firstName: { en: 'First name', el: 'Όνομα', ru: 'Имя' },
  lastName: { en: 'Last name', el: 'Επώνυμο', ru: 'Фамилия' },
  dob: { en: 'Date of birth', el: 'Ημερομηνία γέννησης', ru: 'Дата рождения' },
  phone: { en: 'Mobile phone', el: 'Κινητό τηλέφωνο', ru: 'Мобильный телефон' },
  email: { en: 'Email', el: 'Email', ru: 'Эл. почта' },
  optional: { en: 'optional', el: 'προαιρετικό', ru: 'необязательно' },
  stepOf: { en: 'Step {a} of {b}', el: 'Βήμα {a} από {b}', ru: 'Шаг {a} из {b}' },
  signHere: { en: 'Sign here with your finger or the pen', el: 'Υπογράψτε εδώ με το δάχτυλο ή τη γραφίδα', ru: 'Распишитесь здесь пальцем или стилусом' },
  signature: { en: 'Signature', el: 'Υπογραφή', ru: 'Подпись' },
  clear: { en: 'Clear', el: 'Καθαρισμός', ru: 'Очистить' },
  signNext: { en: 'Sign and continue', el: 'Υπογραφή και συνέχεια', ru: 'Подписать и продолжить' },
  signSubmit: { en: 'Sign and send', el: 'Υπογραφή και αποστολή', ru: 'Подписать и отправить' },
  sending: { en: 'Sending…', el: 'Αποστολή…', ru: 'Отправка…' },
  sendFailed: { en: 'Could not send. Please try again, or ask reception for help.', el: 'Η αποστολή απέτυχε. Δοκιμάστε ξανά ή ζητήστε βοήθεια από τη ρεσεψιόν.', ru: 'Не удалось отправить. Попробуйте снова или обратитесь на ресепшен.' },
  thanks: { en: 'Thank you, {name}', el: 'Ευχαριστούμε, {name}', ru: 'Спасибо, {name}' },
  returnIpad: { en: 'Your forms are with the clinic now. Please hand the iPad back to reception.', el: 'Τα έντυπά σας στάλθηκαν στην κλινική. Παρακαλούμε επιστρέψτε το iPad στη ρεσεψιόν.', ru: 'Ваши формы отправлены в клинику. Пожалуйста, верните iPad на ресепшен.' },
  finish: { en: 'Finish', el: 'Τέλος', ru: 'Готово' },
  resetIn: { en: 'This screen clears in {s} s', el: 'Η οθόνη καθαρίζει σε {s} δευτ.', ru: 'Экран очистится через {s} с' },
  idleTitle: { en: 'Are you still there?', el: 'Είστε ακόμα εδώ;', ru: 'Вы ещё здесь?' },
  idleBody: { en: 'For your privacy, this form will be cleared in {s} seconds.', el: 'Για την προστασία σας, το έντυπο θα διαγραφεί σε {s} δευτερόλεπτα.', ru: 'Для вашей конфиденциальности форма будет очищена через {s} с.' },
  stillHere: { en: "I'm still here", el: 'Είμαι εδώ', ru: 'Я здесь' },
  missing: { en: 'Some answers are missing. They are marked below.', el: 'Λείπουν κάποιες απαντήσεις. Είναι σημειωμένες παρακάτω.', ru: 'Некоторые ответы не заполнены. Они отмечены ниже.' },
  required: { en: 'Please answer this question', el: 'Παρακαλούμε απαντήστε σε αυτή την ερώτηση', ru: 'Пожалуйста, ответьте на этот вопрос' },
  requiredField: { en: 'Please fill this in', el: 'Παρακαλούμε συμπληρώστε το', ru: 'Пожалуйста, заполните' },
  requiredConsent: { en: 'Please tick to agree', el: 'Παρακαλούμε επιλέξτε για να συμφωνήσετε', ru: 'Пожалуйста, отметьте согласие' },
  requiredSig: { en: 'Please sign in the box', el: 'Παρακαλούμε υπογράψτε στο πλαίσιο', ru: 'Пожалуйста, распишитесь в поле' },
  badPhone: { en: 'Please check the phone number', el: 'Ελέγξτε τον αριθμό τηλεφώνου', ru: 'Проверьте номер телефона' },
  badEmail: { en: 'Please check the email address', el: 'Ελέγξτε τη διεύθυνση email', ru: 'Проверьте адрес эл. почты' },
  badDate: { en: 'Please check the date', el: 'Ελέγξτε την ημερομηνία', ru: 'Проверьте дату' },
}

const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k])
const isEmpty = v => v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && v.length === 0)
const today = () => new Date().toISOString().slice(0, 10)
const EMPTY_PATIENT = { firstName: '', lastName: '', dob: '', phone: '', email: '' }

function detailErrors(p) {
  const e = {}
  for (const k of ['firstName', 'lastName', 'dob', 'phone', 'email']) if (!p[k].trim()) e[k] = 'requiredField'
  if (p.dob && (p.dob < '1900-01-01' || p.dob > today())) e.dob = 'badDate'
  if (p.phone.trim() && !/^\+?[\d\s()-]{6,20}$/.test(p.phone.trim())) e.phone = 'badPhone'
  if (p.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email.trim())) e.email = 'badEmail'
  return e
}

function formErrors(form, answers, signature) {
  const e = {}
  for (const f of fieldsOf(form)) {
    if (f.required && isEmpty(answers[f.id])) e[f.id] = f.type === 'consent' ? 'requiredConsent' : f.type === 'text' || f.type === 'textarea' ? 'requiredField' : 'required'
  }
  if (!signature) e.signature = 'requiredSig'
  return e
}

export default function Kiosk() {
  const [lang, setLang] = useState('en')
  const [step, setStep] = useState(0)
  const [selected, setSelected] = useState([])
  const [patient, setPatient] = useState(EMPTY_PATIENT)
  const [answers, setAnswers] = useState({})
  const [signatures, setSignatures] = useState({})
  const [errors, setErrors] = useState({})
  const [sending, setSending] = useState(false)
  const [sendFailed, setSendFailed] = useState(false)
  const heading = useRef(null)
  const t = (key, vars) => fill(tr(S[key], lang), vars || {})

  // welcome, pick, details, one step per chosen form, done
  const steps = ['welcome', 'pick', 'details', ...selected.map(id => 'form:' + id), 'done']
  const current = steps[step]
  const form = current.startsWith('form:') ? formById(current.slice(5)) : null

  const reset = () => {
    setStep(0); setSelected([]); setPatient(EMPTY_PATIENT); setAnswers({}); setSignatures({})
    setErrors({}); setSending(false); setSendFailed(false); setLang('en')
  }

  useEffect(() => {
    window.scrollTo(0, 0)
    if (step > 0) heading.current?.focus()
  }, [step])

  const idle = useIdle(current !== 'welcome' && current !== 'done', reset)

  const go = n => { setErrors({}); setStep(n) }

  const showErrors = e => {
    setErrors(e)
    requestAnimationFrame(() => document.querySelector('[aria-invalid="true"], .sig.invalid canvas')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
  }

  async function next() {
    if (current === 'details') {
      const e = detailErrors(patient)
      if (Object.keys(e).length) return showErrors(e)
    }
    if (form) {
      const e = formErrors(form, answers[form.id] || {}, signatures[form.id])
      if (Object.keys(e).length) return showErrors(e)
      if (steps[step + 1] === 'done') return submit()
    }
    go(step + 1)
  }

  async function submit() {
    setSending(true); setSendFailed(false)
    try {
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lang, patient,
          forms: selected.map(id => ({ formId: id, answers: answers[id] || {}, signature: signatures[id] })),
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      go(step + 1)
    } catch (err) {
      console.error(err)
      setSendFailed(true)
    } finally {
      setSending(false)
    }
  }

  const setAnswer = (id, v) => {
    setAnswers(a => ({ ...a, [form.id]: { ...a[form.id], [id]: v } }))
    if (errors[id]) setErrors(e => ({ ...e, [id]: undefined }))
  }

  if (current === 'welcome') {
    return (
      <div className="kiosk welcome" lang={lang}>
        <img src="/logo.svg" alt="Smile Design Dental Clinic" className="welcome-logo" width="340" height="168" />
        <h1 className="welcome-title">
          {LANGS.map(l => <span key={l} lang={l}>{S.welcome[l]}</span>)}
        </h1>
        <p className="welcome-sub">{LANGS.map(l => <span key={l} lang={l}>{S.chooseLang[l]}</span>)}</p>
        <div className="lang-buttons">
          {LANGS.map(l => (
            <button key={l} lang={l} className="btn lang-btn" onClick={() => { setLang(l); go(1) }}>{LANG_NAMES[l]}</button>
          ))}
        </div>
      </div>
    )
  }

  if (current === 'done') return <Done name={patient.firstName} t={t} lang={lang} onFinish={reset} />

  // Counting starts at "details": on "pick" the number of forms (and so the total) is still changing.
  const stepNo = step - 1 // pick = 0, details = 1
  const total = steps.length - 3 // details + one per form
  const errorCount = Object.values(errors).filter(Boolean).length
  const isLastForm = form && steps[step + 1] === 'done'

  return (
    <div className="kiosk" lang={lang}>
      <header className="k-top">
        <img src="/logo.svg" alt="Smile Design Dental Clinic" width="105" height="52" />
        <div className="k-top-right">
          <div className="lang-switch" role="group" aria-label="Language">
            {LANGS.map(l => (
              <button key={l} lang={l} aria-pressed={l === lang} aria-label={LANG_NAMES[l]} onClick={() => setLang(l)}>{LANG_SHORT[l]}</button>
            ))}
          </div>
          <button className="btn ghost sm" onClick={() => confirm(t('confirmStartOver')) && reset()}>{t('startOver')}</button>
        </div>
      </header>

      <div className="progress" aria-hidden="true"><span style={{ transform: `scaleX(${stepNo / total})` }} /></div>

      <main className="k-main" key={current}>
        {stepNo > 0 && <p className="eyebrow">{t('stepOf', { a: stepNo, b: total })}</p>}

        {current === 'pick' && (
          <>
            <h1 ref={heading} tabIndex={-1}>{t('pickTitle')}</h1>
            <p className="muted">{t('pickHint')}</p>
            <div className="form-cards">
              {FORMS.map(f => {
                const on = selected.includes(f.id)
                return (
                  <label key={f.id} className={'form-card' + (on ? ' on' : '')}>
                    <input
                      type="checkbox" checked={on}
                      onChange={() => setSelected(s => on ? s.filter(x => x !== f.id) : FORMS.map(x => x.id).filter(id => id === f.id || s.includes(id)))}
                    />
                    <span className="check" aria-hidden="true" />
                    <span className="form-card-text">
                      <strong>{tr(f.title, lang)}</strong>
                      <span>{tr(f.description, lang)}</span>
                      <small>{fill(tr(S.minutes, lang), { n: f.minutes })}</small>
                    </span>
                  </label>
                )
              })}
            </div>
          </>
        )}

        {current === 'details' && (
          <>
            <h1 ref={heading} tabIndex={-1}>{t('details')}</h1>
            <p className="muted">{t('detailsNote')}</p>
            {errorCount > 0 && <p className="error-summary" role="alert">{t('missing')}</p>}
            <div className="grid-2">
              {['firstName', 'lastName'].map(k => (
                <TextInput key={k} id={k} label={t(k)} value={patient[k]} error={errors[k] && t(errors[k])} maxLength={80} autoCapitalize="words"
                  onChange={v => { setPatient(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: undefined })) }} />
              ))}
              <TextInput id="dob" type="date" label={t('dob')} value={patient.dob} error={errors.dob && t(errors.dob)} max={today()} min="1900-01-01"
                onChange={v => { setPatient(p => ({ ...p, dob: v })); setErrors(e => ({ ...e, dob: undefined })) }} />
              <TextInput id="phone" type="tel" inputMode="tel" label={t('phone')} value={patient.phone} error={errors.phone && t(errors.phone)} maxLength={20} placeholder="+357"
                onChange={v => { setPatient(p => ({ ...p, phone: v })); setErrors(e => ({ ...e, phone: undefined })) }} />
            </div>
            <TextInput id="email" type="email" inputMode="email" label={t('email')} value={patient.email} error={errors.email && t(errors.email)} maxLength={120}
              onChange={v => { setPatient(p => ({ ...p, email: v })); setErrors(e => ({ ...e, email: undefined })) }} />
          </>
        )}

        {form && (
          <>
            <h1 ref={heading} tabIndex={-1}>{tr(form.title, lang)}</h1>
            {errorCount > 0 && <p className="error-summary" role="alert">{t('missing')}</p>}
            {form.sections.map((s, i) => (
              <section key={i} className="k-section">
                <h2>{tr(s.title, lang)}</h2>
                {s.fields.map(f => (
                  <Field key={f.id} field={f} lang={lang} t={t} answers={answers[form.id] || {}} error={errors[f.id] && t(errors[f.id])} onChange={setAnswer} />
                ))}
              </section>
            ))}
            <section className="k-section k-sign">
              <h2>{t('signature')}</h2>
              {form.declaration && <p>{tr(form.declaration, lang)}</p>}
              <SignaturePad
                key={form.id}
                value={signatures[form.id]}
                label={t('signHere')}
                clearLabel={t('clear')}
                invalid={!!errors.signature}
                describedBy={errors.signature ? 'sig-error' : undefined}
                onChange={v => { setSignatures(s => ({ ...s, [form.id]: v })); setErrors(e => ({ ...e, signature: undefined })) }}
              />
              {errors.signature && <p className="field-error" id="sig-error">{t(errors.signature)}</p>}
            </section>
            {sendFailed && <p className="error-summary" role="alert">{t('sendFailed')}</p>}
          </>
        )}
      </main>

      <footer className="k-foot">
        <button className="btn ghost" onClick={() => go(step - 1)} disabled={sending}>{t('back')}</button>
        <button className="btn primary" onClick={next} disabled={sending || (current === 'pick' && selected.length === 0)} aria-busy={sending}>
          {sending ? t('sending') : form ? t(isLastForm ? 'signSubmit' : 'signNext') : t('continue')}
        </button>
      </footer>

      {idle !== null && (
        <div className="overlay" role="alertdialog" aria-modal="true" aria-labelledby="idle-title">
          <div className="dialog">
            <h2 id="idle-title">{t('idleTitle')}</h2>
            <p>{t('idleBody', { s: idle })}</p>
            <button className="btn primary" autoFocus>{t('stillHere')}</button>
          </div>
        </div>
      )}
    </div>
  )
}

// Returns null while the patient is active, else seconds left before `onExpire`. Any touch resets it.
function useIdle(active, onExpire) {
  const [left, setLeft] = useState(null)
  const lastTouch = useRef(Date.now())
  useEffect(() => {
    if (!active) return setLeft(null)
    lastTouch.current = Date.now()
    const touch = () => { lastTouch.current = Date.now(); setLeft(null) }
    const events = ['pointerdown', 'keydown', 'input', 'scroll']
    events.forEach(e => window.addEventListener(e, touch, { passive: true }))
    const timer = setInterval(() => {
      const idle = (Date.now() - lastTouch.current) / 1000
      if (idle >= IDLE_SECONDS + IDLE_GRACE) onExpire()
      else setLeft(idle >= IDLE_SECONDS ? Math.ceil(IDLE_SECONDS + IDLE_GRACE - idle) : null)
    }, 1000)
    return () => { clearInterval(timer); events.forEach(e => window.removeEventListener(e, touch)) }
  }, [active])
  return left
}

function Done({ name, t, lang, onFinish }) {
  const [left, setLeft] = useState(DONE_SECONDS)
  const heading = useRef(null)
  useEffect(() => {
    heading.current?.focus()
    const timer = setInterval(() => setLeft(s => s - 1), 1000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => { if (left <= 0) onFinish() }, [left])
  return (
    <div className="kiosk welcome done" lang={lang}>
      <svg className="done-check" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="30" /><path d="M19 33l9 9 17-19" /></svg>
      <h1 ref={heading} tabIndex={-1}>{t('thanks', { name })}</h1>
      <p className="welcome-sub">{t('returnIpad')}</p>
      <button className="btn primary" onClick={onFinish}>{t('finish')}</button>
      <p className="muted small" aria-live="off">{t('resetIn', { s: left })}</p>
    </div>
  )
}

function TextInput({ id, label, value, onChange, error, type = 'text', ...rest }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id} type={type} value={value} onChange={e => onChange(e.target.value)}
        autoComplete="off" autoCorrect="off" spellCheck={false}
        aria-invalid={!!error} aria-describedby={error ? id + '-err' : undefined} {...rest}
      />
      {error && <p className="field-error" id={id + '-err'}>{error}</p>}
    </div>
  )
}

function Field({ field: f, lang, t, answers, error, onChange }) {
  const v = answers[f.id]
  const label = tr(f.label, lang)
  const errId = error ? f.id + '-err' : undefined
  const err = error && <p className="field-error" id={errId}>{error}</p>
  const opt = !f.required ? <span className="opt-tag"> ({t('optional')})</span> : null

  if (f.type === 'info') return <Legal blocks={tr(f.body, lang)} />

  if (f.type === 'text' || f.type === 'textarea' || f.type === 'date') {
    const Tag = f.type === 'textarea' ? 'textarea' : 'input'
    return (
      <div className="field">
        <label htmlFor={f.id}>{label}{opt}</label>
        <Tag
          id={f.id} type={f.type === 'textarea' ? undefined : f.type} rows={f.type === 'textarea' ? 3 : undefined}
          value={v || ''} maxLength={f.type === 'textarea' ? 2000 : 200} onChange={e => onChange(f.id, e.target.value)}
          autoComplete="off" inputMode={f.inputMode} aria-invalid={!!error} aria-describedby={errId}
        />
        {err}
      </div>
    )
  }

  if (f.type === 'consent') {
    return (
      <div className="field">
        <label className={'consent' + (v ? ' on' : '')}>
          <input type="checkbox" checked={!!v} onChange={e => onChange(f.id, e.target.checked)} aria-invalid={!!error} aria-describedby={errId} />
          <span className="check" aria-hidden="true" />
          <span>{label}{opt}</span>
        </label>
        {err}
      </div>
    )
  }

  const options = f.type === 'yesno'
    ? [{ id: 'yes', label: S.yes }, { id: 'no', label: S.no }]
    : f.options
  const multi = f.type === 'multi'
  const toggle = id => {
    if (!multi) return onChange(f.id, id)
    const cur = Array.isArray(v) ? v : []
    const none = f.options.find(o => o.none)?.id
    if (cur.includes(id)) return onChange(f.id, cur.filter(x => x !== id))
    onChange(f.id, id === none ? [id] : [...cur.filter(x => x !== none), id])
  }

  return (
    <fieldset className="field" aria-invalid={!!error} aria-describedby={errId}>
      <legend>{label}{opt}</legend>
      <div className={'options' + (f.type === 'yesno' ? ' yesno' : '') + (options.length > 8 ? ' many' : '')}>
        {options.map(o => {
          const on = multi ? (v || []).includes(o.id) : v === o.id
          return (
            <label key={o.id} className={'option' + (on ? ' on' : '')}>
              <input type={multi ? 'checkbox' : 'radio'} name={f.id} checked={on} onChange={() => toggle(o.id)} />
              <span>{tr(o.label, lang)}</span>
            </label>
          )
        })}
      </div>
      {f.details && v === 'yes' && (
        <div className="field details">
          <label htmlFor={f.id + 'Details'}>{tr(f.details, lang)}</label>
          <input id={f.id + 'Details'} value={answers[f.id + 'Details'] || ''} maxLength={2000} autoComplete="off"
            onChange={e => onChange(f.id + 'Details', e.target.value)} />
        </div>
      )}
      {err}
    </fieldset>
  )
}
