import { useEffect, useMemo, useRef, useState } from 'react'
import { FORMS, formById, tr, norm } from '../shared/forms.js'
import Legal from './Legal.jsx'

const TZ = 'Asia/Nicosia'
const LANG = { en: 'English', el: 'Greek', ru: 'Russian' }
const CLINIC = { doctor: 'Dr. Kyriaki Georgiadou, DDS', address: '12 Achaion, Limassol 3022, Cyprus', phone: '25 376147', email: 'info@smiledesign.com.cy' }
// Answer words in the patient's language, for "view as the patient saw it".
const WORDS = {
  yes: { en: 'Yes', el: 'Ναι', ru: 'Да' },
  no: { en: 'No', el: 'Όχι', ru: 'Нет' },
  agreed: { en: 'Agreed', el: 'Συμφωνώ', ru: 'Согласен(на)' },
  notAgreed: { en: 'Not agreed', el: 'Δεν συμφωνώ', ru: 'Не согласен(на)' },
  noAnswer: { en: 'No answer', el: 'Χωρίς απάντηση', ru: 'Нет ответа' },
}

const fmtDate = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric' })
const fmtDateTime = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const fmtTime = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit' })
const dayKey = d => fmtDate.format(d)

function when(iso) {
  const d = new Date(iso), mins = Math.round((Date.now() - d) / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  if (dayKey(d) === dayKey(new Date())) return `Today ${fmtTime.format(d)}`
  return fmtDate.format(d)
}

function dob(iso) {
  const d = new Date(iso + 'T12:00:00Z'), now = new Date()
  let age = now.getFullYear() - d.getUTCFullYear()
  if (now < new Date(now.getFullYear(), d.getUTCMonth(), d.getUTCDate())) age--
  return `${fmtDate.format(d)} (${age})`
}

const fullName = p => `${p.firstName} ${p.lastName}`

class Unauthorized extends Error {}
async function api(path, opts = {}) {
  const res = await fetch(path, { ...opts, headers: { 'Content-Type': 'application/json' } })
  if (res.status === 401) throw new Unauthorized()
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || res.statusText)
  return res.json()
}

function useHash() {
  const [hash, setHash] = useState(location.hash)
  useEffect(() => {
    const on = () => { setHash(location.hash); window.scrollTo(0, 0) }
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return hash.replace(/^#\/?/, '').split('/')
}

// Fetches `path` and refetches whenever `version` changes (a live event arrived).
function useData(path, version, onUnauthorized) {
  const [state, setState] = useState({ data: null, error: null })
  useEffect(() => {
    if (!path) return
    let live = true
    api(path)
      .then(data => live && setState({ data, error: null }))
      .catch(e => e instanceof Unauthorized ? onUnauthorized() : live && setState(s => ({ ...s, error: e.message })))
    return () => { live = false }
  }, [path, version])
  return state
}

export default function Admin() {
  const [authed, setAuthed] = useState(null) // null = checking
  const [version, setVersion] = useState(0)
  const [fresh, setFresh] = useState(() => new Set())
  const [toasts, setToasts] = useState([])
  const route = useHash()
  const signOut = () => setAuthed(false)

  useEffect(() => {
    api('/api/submissions').then(() => setAuthed(true)).catch(() => setAuthed(false))
  }, [])

  useEffect(() => {
    if (!authed) return
    const es = new EventSource('/api/events')
    es.addEventListener('submission', e => {
      const items = JSON.parse(e.data)
      setFresh(f => new Set([...f, ...items.map(i => i.id)]))
      setToasts(t => [...t, ...items.map(i => ({ id: i.id, text: `${fullName(i.patient)} signed ${formById(i.formId).title.en}` }))])
      items.forEach(i => setTimeout(() => setToasts(t => t.filter(x => x.id !== i.id)), 9000))
      setVersion(v => v + 1)
    })
    es.addEventListener('review', () => setVersion(v => v + 1))
    return () => es.close()
  }, [authed])

  const inbox = useData(authed ? '/api/submissions' : null, version, signOut)
  const toReview = inbox.data?.filter(s => !s.reviewedAt).length ?? 0
  useEffect(() => { document.title = `${toReview ? `(${toReview}) ` : ''}Smile Design · Clinic` }, [toReview])

  if (authed === null) return null
  if (!authed) return <Login onDone={() => setAuthed(true)} />

  const [page, id] = route
  const props = { version, onUnauthorized: signOut, bump: () => setVersion(v => v + 1) }

  return (
    <div className="admin">
      <aside className="sidebar">
        <a href="#/" className="sidebar-logo"><img src="/logo.svg" alt="Smile Design Dental Clinic, dashboard home" width="150" height="74" /></a>
        <nav aria-label="Main">
          <a href="#/" aria-current={!page || page === 's' ? 'page' : undefined}>
            Inbox {toReview > 0 && <span className="count" aria-label={`${toReview} to review`}>{toReview}</span>}
          </a>
          <a href="#/patients" aria-current={page === 'patients' ? 'page' : undefined}>Patients</a>
          <a href="/kiosk" target="_blank" rel="noopener">Open iPad kiosk ↗</a>
        </nav>
        <div className="sidebar-foot">
          <button className="link" onClick={() => api('/api/logout', { method: 'POST' }).finally(signOut)}>Sign out</button>
          <p>Built by <a href="https://www.akosds.com">Akos Digital Services</a></p>
        </div>
      </aside>

      <main className="admin-main">
        {!page && <Inbox list={inbox.data} error={inbox.error} fresh={fresh} />}
        {page === 'patients' && !id && <Patients {...props} />}
        {page === 'patients' && id && <PatientPage id={id} fresh={fresh} {...props} />}
        {page === 's' && id && <SubmissionPage id={id} {...props} />}
      </main>

      <div className="toasts" aria-live="polite">
        {toasts.map(t => (
          <a key={t.id} href={`#/s/${t.id}`} className="toast"><strong>New form</strong> {t.text}</a>
        ))}
      </div>
    </div>
  )
}

function Login({ onDone }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState('')
  useEffect(() => { api('/api/demo-passcode').then(d => setHint(d.passcode)).catch(() => {}) }, [])
  async function submit(e) {
    e.preventDefault()
    setBusy(true); setError('')
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify({ passcode: code }) })
      onDone()
    } catch (err) {
      setError(err instanceof Unauthorized ? 'Wrong passcode' : err.message)
    } finally { setBusy(false) }
  }
  return (
    <main className="login">
      <form onSubmit={submit} className="login-card">
        <img src="/logo.svg" alt="Smile Design Dental Clinic" width="200" height="99" />
        <h1>Clinic sign in</h1>
        <div className="field">
          <label htmlFor="passcode">Passcode</label>
          <input id="passcode" type="password" value={code} onChange={e => setCode(e.target.value)} autoFocus required
            aria-invalid={!!error} aria-describedby={error ? 'login-err' : undefined} />
          {error && <p className="field-error" id="login-err" role="alert">{error}</p>}
        </div>
        <button className="btn primary block" disabled={busy || !code} aria-busy={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        {hint && (
          <p className="demo-hint">
            Demo passcode: <button type="button" className="link mono" onClick={() => setCode(hint)} aria-label={`Fill in demo passcode ${hint}`}>{hint}</button>
          </p>
        )}
      </form>
    </main>
  )
}

function Alerts({ alerts, compact }) {
  if (!alerts?.length) return compact ? <span className="muted">None</span> : null
  return (
    <ul className={'alerts' + (compact ? ' compact' : '')} aria-label="Alerts">
      {alerts.map(a => <li key={a}>{a}</li>)}
    </ul>
  )
}

function Status({ reviewed }) {
  return reviewed
    ? <span className="status done">Reviewed</span>
    : <span className="status new">To review</span>
}

function SubmissionTable({ items, fresh, showPatient = true }) {
  if (!items.length) return <p className="empty">No forms match.</p>
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th scope="col">Status</th>
            {showPatient && <th scope="col">Patient</th>}
            <th scope="col">Form</th>
            <th scope="col">Language</th>
            <th scope="col">Alerts</th>
            <th scope="col">Signed</th>
            <th scope="col">Ref</th>
          </tr>
        </thead>
        <tbody>
          {items.map(s => (
            <tr key={s.id} className={(s.reviewedAt ? '' : 'unread ') + (fresh?.has(s.id) ? 'fresh' : '')} onClick={() => { location.hash = `/s/${s.id}` }}>
              <td><Status reviewed={s.reviewedAt} /></td>
              {showPatient && (
                <td>
                  <a href={`#/s/${s.id}`} onClick={e => e.stopPropagation()} className="strong">{fullName(s.patient)}</a>
                  <div className="muted small">{dob(s.patient.dob)}</div>
                </td>
              )}
              <td>{showPatient ? formById(s.formId).title.en : <a href={`#/s/${s.id}`} onClick={e => e.stopPropagation()} className="strong">{formById(s.formId).title.en}</a>}</td>
              <td>{LANG[s.lang]}</td>
              <td><Alerts alerts={s.alerts} compact /></td>
              <td title={fmtDateTime.format(new Date(s.submittedAt))}>{when(s.submittedAt)}</td>
              <td className="mono muted">{s.ref}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Inbox({ list, error, fresh }) {
  const [q, setQ] = useState('')
  const [form, setForm] = useState('')
  const [onlyNew, setOnlyNew] = useState(false)
  const items = useMemo(() => (list || []).filter(s =>
    (!q || norm(fullName(s.patient)).includes(norm(q)) || s.ref.toLowerCase().includes(q.toLowerCase())) &&
    (!form || s.formId === form) && (!onlyNew || !s.reviewedAt)), [list, q, form, onlyNew])

  if (error) return <p className="error-summary">{error}</p>
  if (!list) return <p className="muted">Loading…</p>
  const todayKey = dayKey(new Date())
  const today = list.filter(s => dayKey(new Date(s.submittedAt)) === todayKey)

  return (
    <>
      <header className="page-head">
        <h1>Inbox</h1>
        <p className="muted">Forms signed on the iPad arrive here the moment the patient taps send.</p>
      </header>
      <dl className="stats">
        <div><dt>Signed today</dt><dd>{today.length}</dd></div>
        <div><dt>To review</dt><dd>{list.filter(s => !s.reviewedAt).length}</dd></div>
        <div><dt>Alerts today</dt><dd>{today.filter(s => s.alerts.length).length}</dd></div>
        <div><dt>All forms</dt><dd>{list.length}</dd></div>
      </dl>
      <div className="filters">
        <input type="search" placeholder="Search patient or ref" aria-label="Search patient or reference" value={q} onChange={e => setQ(e.target.value)} />
        <select aria-label="Form" value={form} onChange={e => setForm(e.target.value)}>
          <option value="">All forms</option>
          {FORMS.map(f => <option key={f.id} value={f.id}>{f.title.en}</option>)}
        </select>
        <label className="toggle"><input type="checkbox" checked={onlyNew} onChange={e => setOnlyNew(e.target.checked)} /> To review only</label>
      </div>
      <SubmissionTable items={items} fresh={fresh} />
    </>
  )
}

function Patients({ version, onUnauthorized }) {
  const { data, error } = useData('/api/patients', version, onUnauthorized)
  const [q, setQ] = useState('')
  if (error) return <p className="error-summary">{error}</p>
  if (!data) return <p className="muted">Loading…</p>
  const items = data.filter(p => !q || norm(fullName(p)).includes(norm(q)) || p.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '¬'))
  return (
    <>
      <header className="page-head">
        <h1>Patients</h1>
        <p className="muted">A patient is matched by date of birth plus name or phone, so returning patients keep one history.</p>
      </header>
      <div className="filters">
        <input type="search" placeholder="Search name or phone" aria-label="Search name or phone" value={q} onChange={e => setQ(e.target.value)} />
      </div>
      {!items.length ? <p className="empty">No patients match.</p> : (
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Name</th><th scope="col">Date of birth</th><th scope="col">Phone</th><th scope="col">Forms</th><th scope="col">Last form</th><th scope="col">Alerts</th></tr></thead>
            <tbody>
              {items.map(p => (
                <tr key={p.id} onClick={() => { location.hash = `/patients/${p.id}` }}>
                  <td><a href={`#/patients/${p.id}`} onClick={e => e.stopPropagation()} className="strong">{fullName(p)}</a></td>
                  <td>{dob(p.dob)}</td>
                  <td className="nowrap">{p.phone}</td>
                  <td>{p.formCount}</td>
                  <td>{p.lastAt ? when(p.lastAt) : 'Never'}</td>
                  <td><Alerts alerts={p.alerts} compact /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}

function PatientPage({ id, version, onUnauthorized, fresh }) {
  const { data: p, error } = useData(`/api/patients/${id}`, version, onUnauthorized)
  if (error) return <p className="error-summary">{error}</p>
  if (!p) return <p className="muted">Loading…</p>
  return (
    <>
      <a href="#/patients" className="back">← Patients</a>
      <header className="page-head">
        <h1>{fullName(p)}</h1>
      </header>
      <dl className="facts">
        <div><dt>Date of birth</dt><dd>{dob(p.dob)}</dd></div>
        <div><dt>Phone</dt><dd>{p.phone}</dd></div>
        <div><dt>Email</dt><dd>{p.email || 'Not given'}</dd></div>
        <div><dt>Patient since</dt><dd>{fmtDate.format(new Date(p.createdAt))}</dd></div>
      </dl>
      {p.alerts.length > 0 && (
        <div className="alert-box">
          <h2>Alerts</h2>
          <p className="muted small">From the latest signed copy of each form.</p>
          <Alerts alerts={p.alerts} />
        </div>
      )}
      <h2 className="section-title">All forms ({p.submissions.length})</h2>
      <SubmissionTable items={p.submissions} fresh={fresh} showPatient={false} />
    </>
  )
}

function answerText(f, answers, lang) {
  const v = answers[f.id]
  const w = k => tr(WORDS[k], lang)
  if (f.type === 'consent') return v ? w('agreed') : w('notAgreed')
  if (v === undefined || v === '' || (Array.isArray(v) && !v.length)) return w('noAnswer')
  if (f.type === 'yesno') {
    const d = answers[f.id + 'Details']
    return w(v) + (d ? `: ${d}` : '')
  }
  if (f.type === 'choice') return tr(f.options.find(o => o.id === v)?.label, lang)
  if (f.type === 'multi') return v.map(id => tr(f.options.find(o => o.id === id)?.label, lang)).join(', ')
  return v
}

const flagged = (f, answers) => f.alert && (
  (f.type === 'yesno' && answers[f.id] === 'yes') ||
  (f.type === 'consent' && answers[f.id] === true) ||
  (f.type === 'multi' && answers[f.id]?.some(id => !f.options.find(o => o.id === id)?.none)))

function SubmissionPage({ id, version, onUnauthorized, bump }) {
  const { data: s, error } = useData(`/api/submissions/${id}`, version, onUnauthorized)
  const [view, setView] = useState('en')
  const [busy, setBusy] = useState(false)
  if (error) return <p className="error-summary">{error}</p>
  if (!s) return <p className="muted">Loading…</p>
  const form = formById(s.formId)
  const lang = view === 'en' ? 'en' : s.lang

  async function toggleReviewed() {
    setBusy(true)
    try {
      await api(`/api/submissions/${s.id}`, { method: 'PATCH', body: JSON.stringify({ reviewed: !s.reviewedAt }) })
      bump()
    } catch (e) {
      if (e instanceof Unauthorized) onUnauthorized()
    } finally { setBusy(false) }
  }

  return (
    <>
      <div className="toolbar no-print">
        <a href="#/" className="back">← Inbox</a>
        <div className="toolbar-actions">
          {s.lang !== 'en' && (
            <div className="seg" role="group" aria-label="Show answers in">
              <button aria-pressed={view === 'en'} onClick={() => setView('en')}>English</button>
              <button aria-pressed={view !== 'en'} onClick={() => setView(s.lang)}>As signed ({LANG[s.lang]})</button>
            </div>
          )}
          <button className="btn ghost" onClick={() => print()}>Print / save PDF</button>
          <button className={'btn ' + (s.reviewedAt ? 'ghost' : 'primary')} onClick={toggleReviewed} disabled={busy}>
            {s.reviewedAt ? 'Mark as not reviewed' : 'Mark as reviewed'}
          </button>
        </div>
      </div>

      <article className="sheet" lang={lang}>
        <header className="letterhead">
          <img src="/logo.svg" alt="Smile Design Dental Clinic" width="170" height="84" />
          <address lang="en"><strong>{CLINIC.doctor}</strong><br />{CLINIC.address}<br />Tel. {CLINIC.phone} · {CLINIC.email}</address>
        </header>

        <div className="sheet-title">
          <h1>{tr(form.title, lang)}</h1>
          <Status reviewed={s.reviewedAt} />
        </div>

        <dl className="facts" lang="en">
          <div><dt>Patient</dt><dd><a href={`#/patients/${s.patient.id}`}>{fullName(s.patient)}</a></dd></div>
          <div><dt>Date of birth</dt><dd>{dob(s.patient.dob)}</dd></div>
          <div><dt>Phone</dt><dd>{s.patient.phone}</dd></div>
          <div><dt>Signed</dt><dd>{fmtDateTime.format(new Date(s.submittedAt))}</dd></div>
          <div><dt>Completed in</dt><dd>{LANG[s.lang]}</dd></div>
          <div><dt>Reference</dt><dd className="mono">{s.ref}</dd></div>
        </dl>

        {s.alerts.length > 0 && (
          <div className="alert-box" lang="en">
            <h2>Alerts</h2>
            <Alerts alerts={s.alerts} />
          </div>
        )}

        {lang === 'en' && s.lang !== 'en' && (
          <p className="note no-print" lang="en">Questions shown in English. Typed answers are exactly as the patient wrote them in {LANG[s.lang]}.</p>
        )}

        {form.sections.map((sec, i) => (
          <section key={i} className="qa">
            <h2>{tr(sec.title, lang)}</h2>
            {sec.fields.filter(f => f.type === 'info').map(f => <Legal key={f.id} blocks={tr(f.body, lang)} />)}
            <dl>
              {sec.fields.filter(f => f.type !== 'info').map(f => (
                <div key={f.id} className={flagged(f, s.answers) ? 'flag' : undefined}>
                  <dt>{tr(f.label, lang)}</dt>
                  <dd>{answerText(f, s.answers, lang)}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}

        <section className="qa signed">
          {form.declaration && <p className="declaration">{tr(form.declaration, lang)}</p>}
          <img src={s.signature} alt={`Signature of ${fullName(s.patient)}`} className="signature" />
          <p className="small muted" lang="en">Signed by {fullName(s.patient)} on the clinic iPad, {fmtDateTime.format(new Date(s.submittedAt))} (Cyprus time). Ref {s.ref}.</p>
        </section>
      </article>
    </>
  )
}
