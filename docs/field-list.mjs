// npm run fields: the PDF of every field the iPad collects, for the clinic to review (Greek, A4).
// Built from shared/forms.js, so it always matches what the app actually asks.
import { chromium } from 'playwright-core'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FORMS, tr } from '../shared/forms.js'

const DIR = fileURLToPath(new URL('.', import.meta.url))
const OUT = join(DIR, 'out')
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`
const DATE = '22 Οκτωβρίου 2026'
const logo = 'data:image/png;base64,' + readFileSync(join(DIR, 'akosds-logo.png')).toString('base64')

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

// Asked once on the iPad before the first form (labels as in src/Kiosk.jsx).
const PATIENT = [
  { en: 'First name', el: 'Όνομα', ru: 'Имя', type: 'Κείμενο' },
  { en: 'Last name', el: 'Επώνυμο', ru: 'Фамилия', type: 'Κείμενο' },
  { en: 'Date of birth', el: 'Ημερομηνία γέννησης', ru: 'Дата рождения', type: 'Ημερομηνία' },
  { en: 'Mobile phone', el: 'Κινητό τηλέφωνο', ru: 'Мобильный телефон', type: 'Τηλέφωνο' },
  { en: 'Email', el: 'Email', ru: 'Эл. почта', type: 'Email' },
]

function typeOf(f) {
  if (f.type === 'yesno') return f.details ? 'Ναι / Όχι, με «Ναι» γράφει ποια' : 'Ναι / Όχι'
  if (f.type === 'choice') return 'Μία επιλογή: ' + f.options.map(o => o.label.el).join(' / ')
  if (f.type === 'multi') return `Λίστα με τικ (${f.options.length} επιλογές, παρακάτω)`
  if (f.type === 'consent') return 'Τικ'
  if (f.type === 'textarea') return 'Κείμενο, πολλές γραμμές'
  if (f.inputMode === 'tel') return 'Τηλέφωνο'
  if (f.inputMode === 'numeric') return 'Αριθμός'
  return 'Κείμενο'
}

const row = (el, en, ru, type, required, alert) => `
  <tr>
    <td class="el">${esc(el)}</td><td>${esc(en)}</td><td lang="ru">${esc(ru)}</td>
    <td class="type">${esc(type)}${alert ? '<span class="alert">ειδοποίηση</span>' : ''}</td>
    <td class="req">${required ? 'Ναι' : 'Όχι'}</td>
  </tr>`

const HEAD = '<thead><tr><th>Ελληνικά</th><th>English</th><th>Русский</th><th>Τύπος</th><th>Υποχρ.</th></tr></thead>'

function formSection(form, n) {
  let html = `<h2><span class="num">${n}</span>${esc(form.title.el)}</h2><p class="muted">${esc(form.title.en)} · ${esc(form.title.ru)}</p>`
  for (const sec of form.sections) {
    html += `<h3>${esc(sec.title.el)}</h3><table>${HEAD}<tbody>`
    for (const f of sec.fields) {
      if (f.type === 'info') {
        html += `<tr><td colspan="5" class="info">Το πλήρες κείμενο του εντύπου σας εμφανίζεται για ανάγνωση: ελληνικά και αγγλικά όπως είναι τυπωμένα, ρωσικά σε δική μου μετάφραση (Παράρτημα).</td></tr>`
        continue
      }
      html += row(f.label.el, f.label.en, f.label.ru, typeOf(f), f.required, f.alert)
    }
    if (sec === form.sections.at(-1)) html += row('Υπογραφή', 'Signature', 'Подпись', 'Υπογραφή με το δάχτυλο ή γραφίδα', true)
    html += '</tbody></table>'
    const multi = sec.fields.find(f => f.type === 'multi')
    if (multi) {
      html += `<h4>${esc(multi.label.el)}: οι ${multi.options.length} επιλογές</h4><table class="opts"><thead><tr><th>Ελληνικά</th><th>English</th><th>Русский</th></tr></thead><tbody>`
      for (const o of multi.options) {
        html += `<tr><td class="el">${esc(o.label.el)}</td><td>${esc(o.label.en)}</td><td lang="ru">${esc(o.label.ru)}</td></tr>`
      }
      html += '</tbody></table>'
    }
  }
  return html + '<p class="small">Η ημερομηνία και η ώρα υπογραφής καταγράφονται αυτόματα.</p>'
}

const media = FORMS.find(f => f.id === 'media-consent')
const ruText = media.sections[0].fields.find(f => f.type === 'info').body.ru
const ruHtml = ruText.map(b => typeof b === 'string' ? `<p>${esc(b)}</p>` : b.h ? `<h4>${esc(b.h)}</h4>` : `<ul>${b.ul.map(li => `<li>${esc(li)}</li>`).join('')}</ul>`).join('')

const html = `<!doctype html>
<html lang="el"><head><meta charset="utf-8"><title>Smile Design: πεδία ψηφιακών εντύπων</title>
<style>
  @page { size: A4; margin: 16mm 15mm 18mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: 'Open Sans', Arial, sans-serif; font-size: 9.6pt; color: #1e2142; line-height: 1.45; }
  header { background: #12132b; color: #fff; display: flex; align-items: center; gap: 14px; padding: 14px 18px; border-radius: 10px; }
  header img { width: 46px; height: 46px; border-radius: 50%; border: 2px solid #c9a877; background: #12132b; object-fit: contain; }
  header strong { letter-spacing: .14em; font-size: 10.5pt; }
  header span { margin-left: auto; font-size: 8.5pt; color: #c9c6d8; }
  h1 { font-size: 19pt; font-weight: 600; margin: 22px 0 4px; color: #12132b; }
  h2 { font-size: 13.5pt; margin: 20px 0 2px; color: #12132b; display: flex; align-items: center; gap: 10px; break-after: avoid; }
  h2 .num { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 50%; background: #5b5fc7; color: #fff; font-size: 10pt; }
  h3 { font-size: 10pt; text-transform: uppercase; letter-spacing: .08em; color: #6366a1; margin: 16px 0 6px; break-after: avoid; }
  h4 { font-size: 9.6pt; margin: 14px 0 6px; break-after: avoid; }
  p { margin: 0 0 8px; }
  .muted { color: #6b6e8a; }
  .small { font-size: 8.5pt; color: #6b6e8a; margin-top: 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; }
  th { text-align: left; font-size: 7.6pt; text-transform: uppercase; letter-spacing: .06em; color: #6366a1; background: #eef0fc; padding: 5px 7px; border-bottom: 1px solid #d8dcf5; }
  td { padding: 4px 7px; border-bottom: 1px solid #e7e8f3; vertical-align: top; }
  td.el { font-weight: 600; }
  td.type { color: #444766; width: 24%; }
  td.req { width: 7%; text-align: center; }
  td.info { font-style: italic; color: #444766; background: #fafafe; }
  table.opts td { padding: 3px 7px; font-size: 8.8pt; }
  .alert { display: inline-block; margin-left: 6px; padding: 0 6px; border-radius: 4px; background: #fbeeec; color: #a3261d; font-size: 7.4pt; font-weight: 700; }
  sup { color: #5b5fc7; font-weight: 700; }
  .box { background: #eef0fc; border: 1px solid #d8dcf5; border-radius: 10px; padding: 9px 14px 6px; margin: 10px 0; break-inside: avoid; }
  .box h3 { margin-top: 0; }
  ol, ul { margin: 0; padding-left: 20px; }
  li { margin-bottom: 5px; }
  .appendix { break-before: page; }
  .appendix p, .appendix li { font-size: 9.2pt; }
  .sign { margin-top: 14px; break-inside: avoid; }
  .sign strong { color: #12132b; }
  a { color: #5b5fc7; text-decoration: none; }
</style></head><body>
<header><img src="${logo}" alt=""><strong>AKOS DIGITAL SERVICES</strong><span>${DATE}</span></header>

<h1>Πεδία των ψηφιακών εντύπων ασθενών</h1>
<p class="muted">Smile Design Dental Clinic · Δρ. Κυριακή Γεωργιάδου, DDS</p>

<h2><span class="num">1</span>Στοιχεία ασθενούς</h2>
<p class="muted">Συμπληρώνονται μία φορά, πριν από το πρώτο έντυπο, και ενώνουν όλα τα έντυπα του ίδιου ασθενούς σε μία καρτέλα.</p>
<table>${HEAD}<tbody>${PATIENT.map(p => row(p.el, p.en, p.ru, p.type, true)).join('')}</tbody></table>

${FORMS.map((f, i) => formSection(f, i + 2)).join('')}

<div class="box">
  <h3>Μια παρατήρηση</h3>
  <p>Στη λίστα παθήσεων του ελληνικού εντύπου, εκεί που το αγγλικό γράφει «Atrial Fibrillation», είναι τυπωμένο «Αρτηριακή Υπέρταση», ενώ η «Υπέρταση» υπάρχει ήδη μία γραμμή πιο πάνω. Δεν ξέρω αν είναι σκόπιμο, αλλά υποψιάζομαι ότι εννοείται η «Κολπική μαρμαρυγή», και έτσι το έχω βάλει προς το παρόν στην εφαρμογή. Πείτε μου αν θέλετε να το αλλάξω.</p>
</div>

<div class="box">
  <h3>Μια ερώτηση</h3>
  <p>Πόσοι ασθενείς συμπληρώνουν αυτά τα έντυπα, κατά μέσο όρο, τον μήνα; Μου χρειάζεται για να οργανώσω σωστά την αυτόματη αποστολή email που συζητήσαμε.</p>
</div>

<div class="sign">
  <strong>Θεόδωρος Μαύρος</strong><br>Akos Digital Services<br>
  <a href="mailto:info@akosds.com">info@akosds.com</a> · <a href="https://www.akosds.com">akosds.com</a>
</div>

<section class="appendix" lang="ru">
  <h2 lang="el"><span class="num">Π</span>Παράρτημα: ρωσική μετάφραση της συγκατάθεσης πολυμέσων</h2>
  <p class="muted" lang="el">Για έλεγχο από ρωσόφωνο. Ακολουθεί πιστά το ελληνικό και το αγγλικό κείμενο του εντύπου σας.</p>
  <h3>${esc(media.title.ru)}</h3>
  ${ruHtml}
  <p><strong>${esc(media.sections[0].fields.find(f => f.id === 'noFace').label.ru)}</strong></p>
</section>
</body></html>`

mkdirSync(OUT, { recursive: true })
const htmlPath = join(OUT, 'smiledesign-pedia-entypon.html')
writeFileSync(htmlPath, html)
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto('file://' + htmlPath)
await page.pdf({
  path: join(OUT, 'smiledesign-pedia-entypon.pdf'), format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true, headerTemplate: '<span></span>',
  footerTemplate: '<div style="width:100%;font:7.5pt Open Sans,Arial,sans-serif;color:#8a8ca3;padding:0 15mm;display:flex;justify-content:space-between"><span>Akos Digital Services · Πεδία εντύπων Smile Design</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
})
await browser.close()
console.log(join(OUT, 'smiledesign-pedia-entypon.pdf'))
