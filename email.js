// Confirmation email to the patient after signing, in their kiosk language, sent through Resend.
// Deliberately no answers in the email: health data is GDPR special-category and email is not a safe channel.
import { formById, tr } from './shared/forms.js'

const FROM = process.env.MAIL_FROM || 'Smile Design Dental Clinic <forms@akosds.com>'
const REPLY_TO = 'info@smiledesign.com.cy'
const LOCALES = { en: 'en-GB', el: 'el-GR', ru: 'ru-RU' }

// RU is our translation, same native-speaker check as the forms.
const T = {
  subject: { en: 'Your signed forms, Smile Design Dental Clinic', el: 'Τα υπογεγραμμένα έντυπά σας, Smile Design Dental Clinic', ru: 'Ваши подписанные документы, Smile Design Dental Clinic' },
  hello: { en: 'Hello {name},', el: 'Γεια σας, {name},', ru: 'Здравствуйте, {name}!' },
  received: { en: 'Thank you, we have received your signed forms:', el: 'Σας ευχαριστούμε, λάβαμε τα υπογεγραμμένα έντυπά σας:', ru: 'Спасибо, мы получили ваши подписанные документы:' },
  privacy: {
    en: 'For your privacy this email does not include your answers. If you would like a copy, ask us at reception or reply to this email.',
    el: 'Για την προστασία των προσωπικών σας δεδομένων, το email αυτό δεν περιέχει τις απαντήσεις σας. Αν θέλετε αντίγραφο, ζητήστε το στη ρεσεψιόν ή απαντήστε σε αυτό το email.',
    ru: 'В целях защиты ваших данных это письмо не содержит ваших ответов. Если вам нужна копия, обратитесь в регистратуру или ответьте на это письмо.',
  },
}

const esc = s => String(s).replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

export function renderEmail(patient, lang, submissions) {
  const when = iso => new Date(iso).toLocaleString(LOCALES[lang], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Nicosia' })
  const forms = submissions.map(s => ({ title: tr(formById(s.formId).title, lang), ref: s.ref, at: when(s.submittedAt) }))
  const hello = tr(T.hello, lang).replace('{name}', patient.firstName)
  const text = [
    hello, '', tr(T.received, lang), ...forms.map(f => `- ${f.title} (${f.ref}), ${f.at}`), '', tr(T.privacy, lang), '',
    'Smile Design Dental Clinic', '12 Achaion, Limassol 3022, Cyprus', 'Tel. 25 376147',
  ].join('\n')
  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;padding:24px;background:#f6f3ee;font-family:'Open Sans',Arial,sans-serif;color:#191919">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px">
<tr><td style="padding:28px 32px 8px;font-size:20px;font-weight:700;color:#8c6421">Smile Design Dental Clinic</td></tr>
<tr><td style="padding:8px 32px;font-size:16px;line-height:1.5">
<p>${esc(hello)}</p><p>${esc(tr(T.received, lang))}</p>
<ul style="padding-left:20px">${forms.map(f => `<li><strong>${esc(f.title)}</strong> (${esc(f.ref)}), ${esc(f.at)}</li>`).join('')}</ul>
<p style="color:#555">${esc(tr(T.privacy, lang))}</p></td></tr>
<tr><td style="padding:16px 32px 28px;font-size:13px;color:#555;border-top:1px solid #eee">12 Achaion, Limassol 3022, Cyprus<br>Tel. 25 376147 · info@smiledesign.com.cy</td></tr>
</table></body></html>`
  return { subject: tr(T.subject, lang), text, html }
}

// ponytail: per-process hourly cap, the public kiosk endpoint could otherwise be used to mail anyone.
// The MVP's iPad pairing token is the real fix.
const CAP = 60
let sent = 0
setInterval(() => { sent = 0 }, 60 * 60_000).unref()

// Fire and forget: a mail failure must never fail the submission.
export async function sendConfirmation(patient, lang, submissions) {
  const key = process.env.RESEND_API_KEY
  if (!key) return
  if (++sent > CAP) return console.error('email: hourly cap reached, confirmation skipped')
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: patient.email, reply_to: REPLY_TO, ...renderEmail(patient, lang, submissions) }),
    signal: AbortSignal.timeout(10_000),
  })
  if (!res.ok) console.error('email: resend', res.status, (await res.text()).slice(0, 200))
}
