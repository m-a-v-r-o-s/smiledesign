// npm run demo: records the iPad kiosk and the clinic dashboard (invented data, own server on :3005)
// and builds three MP4s in demo/out/: the iPad, the clinic side, and a combined walkthrough with title cards.
// Frames come from Chromium's screencast (sharper than Playwright's built-in recorder) and are cut with ffmpeg.
import { chromium } from 'playwright-core'
import { spawn, execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const OUT = join(ROOT, 'demo/out')
const TMP = mkdtempSync(join(tmpdir(), 'sd-demo-')) // frames, left for the OS to clear
const PORT = 3005
const BASE = `http://localhost:${PORT}`
const SPEED = 1.6 // playback speed-up of the recorded parts
const CHROME = process.env.CHROME || `${process.env.HOME}/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome`
const now = () => Date.now() / 1000
const wait = ms => new Promise(r => setTimeout(r, ms))
mkdirSync(OUT, { recursive: true })

// ---------- recording ----------

function record(page, name, [maxWidth, maxHeight]) {
  const dir = join(TMP, name)
  mkdirSync(dir)
  const frames = []
  return page.context().newCDPSession(page).then(async cdp => {
    cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
      const file = join(dir, String(frames.length).padStart(6, '0') + '.jpg')
      writeFileSync(file, Buffer.from(data, 'base64'))
      frames.push({ file, t: metadata.timestamp })
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {})
    })
    await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth, maxHeight })
    return frames
  })
}

// Visible touch ripple (kiosk) or cursor plus ripple (desktop), since headless capture shows no pointer.
function overlay(cursor) {
  addEventListener('DOMContentLoaded', () => {
    if (cursor) {
      const dot = document.createElement('div')
      Object.assign(dot.style, { position: 'fixed', left: '-40px', top: '-40px', width: '18px', height: '18px', borderRadius: '50%', background: 'rgb(25 25 25 / 55%)', border: '2px solid #fff', boxShadow: '0 1px 6px rgb(0 0 0 / 30%)', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 99999 })
      document.body.appendChild(dot)
      addEventListener('mousemove', e => { dot.style.left = e.clientX + 'px'; dot.style.top = e.clientY + 'px' }, true)
    }
    addEventListener('mousedown', e => {
      if (e.target.tagName === 'CANVAS') return // no ripple while signing
      const r = document.createElement('div')
      Object.assign(r.style, { position: 'fixed', left: e.clientX + 'px', top: e.clientY + 'px', width: '44px', height: '44px', borderRadius: '50%', background: 'rgb(177 132 53 / 35%)', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 99998 })
      document.body.appendChild(r)
      r.animate([{ transform: 'translate(-50%, -50%) scale(.4)', opacity: 1 }, { transform: 'translate(-50%, -50%) scale(1.6)', opacity: 0 }], { duration: 550, easing: 'ease-out' }).onfinish = () => r.remove()
    }, true)
  })
}

// Moves the pointer to the element (scrolling smoothly if it is off screen) and clicks it.
async function tap(page, selector) {
  const loc = page.locator(selector).first()
  await loc.waitFor()
  const scrolled = await loc.evaluate(el => {
    const r = el.getBoundingClientRect()
    if (r.top > 110 && r.bottom < innerHeight - 110) return false
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return true
  })
  if (scrolled) await wait(650)
  const b = await loc.boundingBox()
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 12 })
  await page.mouse.down(); await wait(60); await page.mouse.up()
  await wait(250)
}

async function type(page, selector, text) {
  await tap(page, selector)
  await page.keyboard.type(text, { delay: 45 })
  await wait(150)
}

const scrollBy = async (page, top) => { await page.evaluate(top => scrollBy({ top, behavior: 'smooth' }), top); await wait(800) }

// A looped, slanted handwriting-like stroke drawn into the signature pad.
async function sign(page) {
  await page.locator('.sig canvas').evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  await wait(700)
  const b = await page.locator('.sig canvas').boundingBox()
  const x0 = b.x + 70, y0 = b.y + b.height * 0.55
  await page.mouse.move(x0, y0)
  await page.mouse.down()
  for (let t = 0; t <= Math.PI * 9; t += 0.18) {
    const x = x0 + t * 13 + Math.sin(t) * 14
    const y = y0 - Math.cos(t) * (22 + 10 * Math.sin(t / 2.5)) - t * 1.5
    await page.mouse.move(x, y)
  }
  await page.mouse.up()
  await page.mouse.move(x0 - 10, y0 + 34)
  await page.mouse.down()
  await page.mouse.move(x0 + 300, y0 + 26, { steps: 18 })
  await page.mouse.up()
  await wait(500)
}

// ---------- encoding ----------

const ffmpeg = args => execFileSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
const X264 = ['-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']

// Frames inside the given wall-clock ranges, each held until the next one, sped up, at 30 fps.
function encode(frames, ranges, out, scale) {
  const lines = ['ffconcat version 1.0']
  for (const [from, to] of ranges) {
    const first = Math.max(0, frames.findLastIndex(f => f.t <= from))
    for (let i = first; i < frames.length && frames[i].t < to; i++) {
      const start = Math.max(frames[i].t, from)
      const end = Math.min(frames[i + 1]?.t ?? to, to)
      if (end - start > 0.001) lines.push(`file '${frames[i].file}'`, `duration ${(end - start).toFixed(4)}`)
    }
  }
  lines.push(lines.at(-2)) // the concat demuxer drops the last entry's duration unless the file is repeated
  const list = join(TMP, out.split('/').pop() + '.txt')
  writeFileSync(list, lines.join('\n'))
  ffmpeg(['-f', 'concat', '-safe', '0', '-i', list, '-vf', `setpts=PTS/${SPEED},fps=30,scale=${scale}:flags=lanczos,setsar=1`, ...X264, out])
}

// ---------- run ----------

const server = spawn(process.execPath, ['server.js'], { cwd: ROOT, env: { ...process.env, PORT }, stdio: 'ignore' })
const browser = await chromium.launch({ executablePath: CHROME })
try {
  for (let i = 0; i < 50 && !(await fetch(BASE + '/healthz').then(r => r.ok, () => false)); i++) await wait(100)

  const desk = await browser.newContext({ viewport: { width: 1440, height: 810 }, deviceScaleFactor: 4 / 3 })
  await desk.addInitScript(overlay, true)
  const admin = await desk.newPage()
  const ipad = await browser.newContext({ viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, hasTouch: true })
  await ipad.addInitScript(overlay, false)
  const kiosk = await ipad.newPage()
  const adminFrames = await record(admin, 'admin', [1920, 1080])
  const kioskFrames = await record(kiosk, 'kiosk', [1640, 2360])

  // A: reception signs in and sees the inbox
  await admin.goto(BASE + '/admin')
  await admin.waitForSelector('.demo-hint button')
  const aStart = now()
  await wait(900)
  await tap(admin, '.demo-hint button')
  await tap(admin, 'button:has-text("Sign in")')
  await admin.waitForSelector('h1:has-text("Inbox")')
  await wait(2200)
  const aEnd = now()

  // B: the patient on the iPad, in Greek
  await kiosk.goto(BASE + '/kiosk')
  await kiosk.waitForSelector('.welcome-logo')
  const bStart = now()
  await wait(1600)
  await tap(kiosk, '.lang-btn:has-text("Ελληνικά")')
  await wait(700)
  for (const l of ['English', 'Русский', 'Ελληνικά']) { await tap(kiosk, `.lang-switch [aria-label="${l}"]`); await wait(550) }
  await tap(kiosk, 'label.form-card >> nth=0')
  await tap(kiosk, 'label.form-card >> nth=1')
  await wait(300)
  await tap(kiosk, '.k-foot .btn.primary')

  await type(kiosk, '#firstName', 'Μαρία')
  await type(kiosk, '#lastName', 'Αντωνίου')
  await tap(kiosk, '#dob'); await kiosk.fill('#dob', '1988-05-14'); await wait(200)
  await type(kiosk, '#phone', '+357 99 555014')
  await type(kiosk, '#email', 'maria.antoniou@example.com')
  await wait(300)
  await tap(kiosk, '.k-foot .btn.primary')

  const option = (name, text) => `fieldset:has(input[name="${name}"]) label.option:has-text("${text}")`
  await tap(kiosk, option('gender', 'Θήλυ'))
  await type(kiosk, '#address', 'Μακαρίου Γ΄ 120')
  await type(kiosk, '#city', 'Λεμεσός')
  await type(kiosk, '#postcode', '3036')
  await tap(kiosk, option('conditions', 'Υπέρταση'))
  await tap(kiosk, option('conditions', 'Αλλεργία στην πενικιλίνη'))
  await tap(kiosk, option('allergies', 'Ναι'))
  await type(kiosk, '#allergiesDetails', 'Γύρη')
  await tap(kiosk, option('medications', 'Όχι'))
  await type(kiosk, '#referral', 'Instagram')
  await sign(kiosk)
  await tap(kiosk, '.k-foot .btn.primary')

  await kiosk.waitForSelector('.legal')
  await wait(900)
  for (let i = 0; i < 3; i++) await scrollBy(kiosk, 650)
  await tap(kiosk, 'label.consent')
  await sign(kiosk)
  await tap(kiosk, '.k-foot .btn.primary')
  const sent = now()
  await kiosk.waitForSelector('.done-check')
  await wait(2600)
  const bEnd = now()

  // C: the forms have arrived at reception
  await admin.waitForSelector('.toast')
  await wait(1800)
  await tap(admin, 'tbody tr:has-text("Μαρία"):has-text("Medical form")')
  await admin.waitForSelector('.sheet')
  await wait(1400)
  for (let i = 0; i < 3; i++) await scrollBy(admin, 420)
  await wait(500)
  await admin.evaluate(() => scrollTo({ top: 0, behavior: 'smooth' })); await wait(800)
  await tap(admin, 'button:has-text("As signed")')
  await wait(900)
  await scrollBy(admin, 520)
  await wait(700)
  await tap(admin, '.sheet a:has-text("Μαρία")')
  await admin.waitForSelector('.alert-box')
  await wait(2400)
  await tap(admin, 'nav a:has-text("Patients")')
  await admin.waitForSelector('input[type=search]')
  await wait(900)
  await type(admin, 'input[type=search]', 'Μαρ')
  await wait(2000)
  const cEnd = now()

  await wait(300) // let the last frames land
  console.log(`frames: kiosk ${kioskFrames.length}, admin ${adminFrames.length}`)

  // ---------- cards and videos ----------
  const cardPage = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage()
  for (const n of [1, 2, 3, 4]) {
    await cardPage.goto(`file://${ROOT}demo/cards.html?b=${n}`)
    await cardPage.screenshot({ path: join(TMP, `card${n}.png`) })
  }

  const ipadMp4 = join(OUT, 'smiledesign-ipad.mp4')
  const clinicMp4 = join(OUT, 'smiledesign-clinic.mp4')
  encode(kioskFrames, [[bStart, bEnd]], ipadMp4, '1080:1554')
  encode(adminFrames, [[aStart, aEnd], [sent - 0.4, cEnd]], clinicMp4, '1920:1080')

  const still = (png, secs, out, fade) => ffmpeg(['-loop', '1', '-t', String(secs), '-i', png,
    '-vf', `fps=30,setsar=1${fade || ''}`, ...X264, out])
  const p1 = join(TMP, 'p1.mp4'), p2 = join(TMP, 'p2.mp4'), p3 = join(TMP, 'p3.mp4'), p5 = join(TMP, 'p5.mp4')
  still(join(TMP, 'card1.png'), 2.4, p1, ',fade=t=in:d=0.5')
  ffmpeg(['-loop', '1', '-i', join(TMP, 'card2.png'), '-i', ipadMp4, '-filter_complex',
    '[1:v]scale=694:1000:flags=lanczos[k];[0:v][k]overlay=1086:40:shortest=1,fps=30,setsar=1', ...X264, p2])
  still(join(TMP, 'card3.png'), 2.2, p3)
  still(join(TMP, 'card4.png'), 2.6, p5, ',fade=t=out:st=2.0:d=0.6')
  ffmpeg(['-i', p1, '-i', p2, '-i', p3, '-i', clinicMp4, '-i', p5, '-filter_complex',
    '[0:v][1:v][2:v][3:v][4:v]concat=n=5:v=1:a=0', ...X264, join(OUT, 'smiledesign-walkthrough.mp4')])
  console.log(`done: ${OUT}`)
} finally {
  await browser.close()
  server.kill()
}
