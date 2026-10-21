import { useEffect, useRef } from 'react'

// Finger or Apple Pencil signature. Reports a PNG data URL after every stroke, null when cleared.
export default function SignaturePad({ value, onChange, label, clearLabel, invalid, describedBy }) {
  const canvas = useRef(null)
  const last = useRef(null)

  useEffect(() => {
    const c = canvas.current
    const dpr = window.devicePixelRatio || 1
    const { width, height } = c.getBoundingClientRect()
    c.width = width * dpr
    c.height = height * dpr
    const ctx = c.getContext('2d')
    ctx.scale(dpr, dpr)
    ctx.lineCap = ctx.lineJoin = 'round'
    ctx.strokeStyle = '#1d2433'
    if (value) { // coming back to an already signed form
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0, width, height)
      img.src = value
    }
  }, [])

  const point = e => {
    const r = canvas.current.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const down = e => {
    canvas.current.setPointerCapture(e.pointerId)
    last.current = point(e)
  }

  const move = e => {
    if (!last.current) return
    const ctx = canvas.current.getContext('2d')
    const p = point(e)
    // Pencil reports real pressure; fingers report 0 or 0.5, which gives a steady medium line.
    ctx.lineWidth = e.pointerType === 'pen' ? 1.2 + e.pressure * 3 : 2.6
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    last.current = p
  }

  const up = () => {
    if (!last.current) return
    last.current = null
    onChange(canvas.current.toDataURL('image/png'))
  }

  const clear = () => {
    const c = canvas.current
    c.getContext('2d').clearRect(0, 0, c.width, c.height)
    onChange(null)
  }

  return (
    <div className={'sig' + (invalid ? ' invalid' : '')}>
      <canvas
        ref={canvas}
        role="img"
        aria-label={label}
        aria-describedby={describedBy}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
      />
      <span className="sig-hint" aria-hidden="true">{label}</span>
      <button type="button" className="btn ghost sm sig-clear" onClick={clear}>{clearLabel}</button>
    </div>
  )
}
