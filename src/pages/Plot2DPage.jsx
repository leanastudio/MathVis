import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as math from 'mathjs'
import ExplanationBox from '../components/ExplanationBox'
import { useLevel } from '../context/LevelContext'

const PRESETS = [
  { label: 'Sinus', expr: 'sin(x)' },
  { label: 'Parabel', expr: 'x^2' },
  { label: 'Gauß', expr: 'e^(-x^2)' },
  { label: 'Gedämpft', expr: 'sin(x) * e^(-x^2/4)' },
  { label: 'Absolut', expr: 'abs(x)' },
  { label: 'Tangens', expr: 'tan(x)' },
  { label: 'Parameter ↗', expr: 'a * sin(b * x + c)' },
  { label: 'Kubisch', expr: 'x^3 - 3*x' },
]

const RESERVED = new Set([
  'x','e','pi','i','Infinity','true','false',
  'sin','cos','tan','exp','log','log2','log10','sqrt','cbrt','abs',
  'asin','acos','atan','atan2','sinh','cosh','tanh','asinh','acosh','atanh',
  'sign','floor','ceil','round','max','min','pow','mod','factorial',
])

function detectParams(expr) {
  try {
    const node = math.parse(expr)
    const symbols = new Set()
    node.traverse((n) => {
      if (n.isSymbolNode && !RESERVED.has(n.name)) symbols.add(n.name)
    })
    return [...symbols].sort()
  } catch {
    return []
  }
}

function buildExplanation(expr, compiled, params, level) {
  if (!compiled) return []
  const lines = []
  const scope = { x: 0, ...params }

  try {
    const at0 = compiled.evaluate(scope)
    const at0str = isFinite(at0) ? Math.round(at0 * 1000) / 1000 : '∞'

    if (level === 'schüler') {
      lines.push(`Du zeichnest die Funktion **f(x) = ${expr}**.`)
      if (isFinite(at0)) lines.push(`Wenn x = 0 ist, ergibt die Funktion **${at0str}** — das ist der Punkt, wo die Kurve die y-Achse kreuzt.`)
    } else if (level === 'student') {
      lines.push(`**f(x) = ${expr}**`)
      if (isFinite(at0)) lines.push(`y-Achsenabschnitt: f(0) = **${at0str}**`)
    } else {
      lines.push(`**f : ℝ → ℝ,  f(x) = ${expr}**`)
      if (isFinite(at0)) lines.push(`f(0) = ${at0str}`)
    }

    if (expr.includes('sin') || expr.includes('cos')) {
      if (level === 'schüler') lines.push('Das ist eine **Schwingung** — die Kurve geht auf und ab wie eine Welle. Ändere b, um die Frequenz zu verändern!')
      else if (level === 'student') lines.push('Trigonometrische Funktion — periodisch. Periode: T = 2π/b, Amplitude = a.')
      else lines.push('T = 2π/b, Amplitude = |a|, Phasenverschiebung φ = c/b. Fourier-zerlegbar.')
    }
    if (expr.includes('e^') || expr.includes('exp')) {
      if (level === 'schüler') lines.push('**e** ist eine besondere Zahl (≈ 2,718). Sie lässt Kurven sehr schnell wachsen oder abfallen — wie ein Zoom-Effekt.')
      else if (level === 'student') lines.push('Exponentialterm: wächst/fällt unbeschränkt. Eigenschaft: d/dx e^x = e^x.')
      else lines.push('e^x: gesamte ℝ analytisch, d^n/dx^n e^x = e^x. Gaußterm e^{-x²} ∈ L²(ℝ).')
    }
    if (/x\^2|x²/.test(expr) && !/x\^3|x\^4/.test(expr)) {
      if (level === 'schüler') lines.push('Eine **Parabel**: symmetrisch und nach außen immer steiler. Das Minimum (oder Maximum) liegt im Scheitelpunkt.')
      else if (level === 'student') lines.push('Quadratische Funktion, konvex. Scheitelpunkt via f\'(x) = 0.')
      else lines.push('Konvex: f\'\'(x) > 0 global. Scheitelpunkt: x₀ = -b/(2a) (Standardform ax²+bx+c).')
    }
    if (/x\^3/.test(expr)) {
      if (level === 'schüler') lines.push('Eine **kubische Kurve** — sie hat eine S-Form und kann Hoch- und Tiefpunkte haben.')
      else if (level === 'student') lines.push('Kubische Funktion: hat Wendepunkt, kann lokale Extrema besitzen.')
      else lines.push('Grad-3-Polynom: bis zu 2 kritische Punkte (f\'=0), 1 Wendepunkt (f\'\'=0).')
    }
    if (expr.includes('tan')) {
      if (level === 'schüler') lines.push('Der **Tangens** hat Stellen, an denen er auf ±Unendlich springt — das nennt man Polstellen.')
      else if (level === 'student') lines.push('tan(x) ist nicht definiert bei x = π/2 + nπ (Polstellen).')
      else lines.push('Meromorphe Funktion: Polstellen bei x_n = π/2 + nπ, n ∈ ℤ. Periode π.')
    }
    if (expr.includes('abs')) {
      if (level === 'schüler') lines.push('**|x|** macht alles positiv — negative Zahlen werden "umgeklappt". Daher die V-Form.')
      else if (level === 'student') lines.push('Betragsfunktion: nicht differenzierbar bei x = 0 (Knick).')
      else lines.push('|x| ∈ C⁰(ℝ) \\ C¹(ℝ): Lipschitz-stetig, aber nicht differenzierbar in x = 0.')
    }

    const paramKeys = Object.keys(params)
    if (paramKeys.length > 0) {
      if (level === 'schüler') lines.push('Beweg die **Schieberegler** und schau, wie die Kurve sich verändert — das ist Mathematik zum Anfassen!')
      else if (level === 'student') lines.push(`Freie Parameter: ${paramKeys.map((k) => `${k} = ${params[k]}`).join(', ')} — per Slider variierbar.`)
      else lines.push(`Parametrisierung: (${paramKeys.join(', ')}) ∈ ℝ^${paramKeys.length}. Aktuell: ${paramKeys.map((k) => `${k} = ${params[k]}`).join(', ')}.`)
    }

    // Hover hint
    if (level === 'schüler') lines.push('Fahre mit der Maus über den Plot — du siehst den genauen Wert und die **gelbe Tangente** zeigt die Steigung.')
    else if (level === 'student') lines.push('Hover über den Plot: zeigt f(x) und f′(x) (numerische Ableitung) an der Cursorposition.')
    else lines.push('Hover: numerische Ableitung via zentralem Differenzenquotienten h = 10⁻⁴.')

  } catch {}

  return lines
}

export default function Plot2DPage() {
  const canvasRef = useRef(null)
  const hoverXRef = useRef(null)
  const { level } = useLevel()

  const [input, setInput] = useState('sin(x)')
  const [expr, setExpr] = useState('sin(x)')
  const [error, setError] = useState(null)
  const [compiled, setCompiled] = useState(null)
  const [paramKeys, setParamKeys] = useState([])
  const [params, setParams] = useState({})
  const [xMin, setXMin] = useState(-6)
  const [xMax, setXMax] = useState(6)
  const [hoverInfo, setHoverInfo] = useState(null)
  const [explanation, setExplanation] = useState([])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !compiled) return
    const ctx = canvas.getContext('2d')
    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.fillStyle = '#12121a'
    ctx.fillRect(0, 0, W, H)

    const evalAt = (x) => compiled.evaluate({ x, ...params })
    const toCanvasX = (x) => ((x - xMin) / (xMax - xMin)) * W
    const toCanvasY = (y, yLo, yHi) => H - ((y - yLo) / (yHi - yLo)) * H

    // Sample curve
    const steps = W * 2
    const xs = Array.from({ length: steps }, (_, i) => xMin + (i / steps) * (xMax - xMin))
    const ys = xs.map((x) => {
      try { const v = evalAt(x); return isFinite(v) ? v : null } catch { return null }
    })
    const validYs = ys.filter((y) => y !== null)
    if (validYs.length === 0) return

    const raw_yMin = Math.min(...validYs)
    const raw_yMax = Math.max(...validYs)
    const yPad = Math.max((raw_yMax - raw_yMin) * 0.12, 0.5)
    const yLo = raw_yMin - yPad
    const yHi = raw_yMax + yPad

    const cx0 = toCanvasX(0)
    const cy0 = toCanvasY(0, yLo, yHi)

    // Grid
    ctx.strokeStyle = '#1e1e2e'
    ctx.lineWidth = 1
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      const cx = toCanvasX(gx)
      ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke()
    }
    const gridStep = (yHi - yLo) / 8
    for (let i = 0; i <= 8; i++) {
      const cy = toCanvasY(yLo + i * gridStep, yLo, yHi)
      ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.stroke()
    }

    // Axes
    ctx.strokeStyle = '#2a2a3d'
    ctx.lineWidth = 1.5
    if (cx0 >= 0 && cx0 <= W) { ctx.beginPath(); ctx.moveTo(cx0, 0); ctx.lineTo(cx0, H); ctx.stroke() }
    if (cy0 >= 0 && cy0 <= H) { ctx.beginPath(); ctx.moveTo(0, cy0); ctx.lineTo(W, cy0); ctx.stroke() }

    // Labels
    ctx.fillStyle = '#7a7a9a'
    ctx.font = '11px JetBrains Mono, monospace'
    ctx.textAlign = 'center'
    for (let gx = Math.ceil(xMin); gx <= Math.floor(xMax); gx++) {
      if (gx === 0) continue
      ctx.fillText(gx, toCanvasX(gx), Math.min(Math.max(cy0 + 16, 16), H - 6))
    }
    ctx.textAlign = 'right'
    for (let i = 0; i <= 8; i++) {
      const gy = yLo + i * gridStep
      if (Math.abs(gy) < 0.05) continue
      ctx.fillText(
        Math.round(gy * 10) / 10,
        Math.min(Math.max(cx0 - 6, 30), W - 6),
        toCanvasY(gy, yLo, yHi) + 4,
      )
    }

    // Curve with gradient
    const grad = ctx.createLinearGradient(0, 0, W, 0)
    grad.addColorStop(0, '#7c6fff')
    grad.addColorStop(0.5, '#ff6f91')
    grad.addColorStop(1, '#6fffd4')
    ctx.strokeStyle = grad
    ctx.lineWidth = 2.5
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.shadowColor = '#7c6fff'
    ctx.shadowBlur = 8
    ctx.beginPath()
    let drawing = false
    for (let i = 0; i < xs.length; i++) {
      if (ys[i] === null) { drawing = false; continue }
      const px = toCanvasX(xs[i])
      const py = toCanvasY(ys[i], yLo, yHi)
      if (!drawing) { ctx.moveTo(px, py); drawing = true } else { ctx.lineTo(px, py) }
    }
    ctx.stroke()
    ctx.shadowBlur = 0

    // Hover point + tangent
    const hoverX = hoverXRef.current
    if (hoverX !== null) {
      try {
        const hy = evalAt(hoverX)
        if (!isFinite(hy)) { setHoverInfo(null); return }

        const h = 1e-4
        const dy = (evalAt(hoverX + h) - evalAt(hoverX - h)) / (2 * h)
        const px = toCanvasX(hoverX)
        const py = toCanvasY(hy, yLo, yHi)

        // Vertical dashed drop line
        ctx.strokeStyle = 'rgba(255,209,102,0.25)'
        ctx.lineWidth = 1
        ctx.setLineDash([4, 4])
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px, cy0); ctx.stroke()
        ctx.setLineDash([])

        // Tangent line
        if (isFinite(dy)) {
          const span = (xMax - xMin) * 0.15
          const tx1 = toCanvasX(hoverX - span)
          const ty1 = toCanvasY(hy - dy * span, yLo, yHi)
          const tx2 = toCanvasX(hoverX + span)
          const ty2 = toCanvasY(hy + dy * span, yLo, yHi)
          ctx.strokeStyle = '#ffd166'
          ctx.lineWidth = 1.5
          ctx.shadowColor = '#ffd166'
          ctx.shadowBlur = 6
          ctx.beginPath(); ctx.moveTo(tx1, ty1); ctx.lineTo(tx2, ty2); ctx.stroke()
          ctx.shadowBlur = 0
        }

        // Glowing dot
        ctx.fillStyle = '#ffd166'
        ctx.shadowColor = '#ffd166'
        ctx.shadowBlur = 18
        ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill()
        ctx.shadowBlur = 0

        setHoverInfo({ x: hoverX, y: hy, dy: isFinite(dy) ? dy : null })
      } catch {
        setHoverInfo(null)
      }
    } else {
      setHoverInfo(null)
    }
  }, [compiled, xMin, xMax, params])

  useEffect(() => { draw() }, [draw])

  const handleMouseMove = useCallback((e) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const pixelX = (e.clientX - rect.left) * (canvas.width / rect.width)
    hoverXRef.current = xMin + (pixelX / canvas.width) * (xMax - xMin)
    draw()
  }, [draw, xMin, xMax])

  const handleMouseLeave = useCallback(() => {
    hoverXRef.current = null
    draw()
  }, [draw])

  const handlePlot = useCallback((exprArg, paramsArg) => {
    const e = exprArg ?? input
    const existing = paramsArg ?? params
    try {
      const c = math.compile(e)
      const keys = detectParams(e)
      const newParams = {}
      keys.forEach((k) => { newParams[k] = existing[k] ?? 1 })
      c.evaluate({ x: 0, ...newParams })
      setCompiled(c)
      setExpr(e)
      setParamKeys(keys)
      setParams(newParams)
      setError(null)
      setExplanation(buildExplanation(e, c, newParams, level))
    } catch {
      setError('Ungültige Funktion — Beispiel: sin(x) oder a * x^2 + b')
    }
  }, [input, params, level])

  // Re-run explanation when level changes
  useEffect(() => {
    if (compiled) setExplanation(buildExplanation(expr, compiled, params, level))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  // Initial plot
  useEffect(() => { handlePlot('sin(x)', {}) }, []) // eslint-disable-line

  const updateParam = (key, val) => {
    const newParams = { ...params, [key]: val }
    setParams(newParams)
    if (compiled) setExplanation(buildExplanation(expr, compiled, newParams, level))
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-text mb-8"
      >
        <span className="text-accent">∿</span> 2D-Funktionsplotter
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="space-y-4">
          <div className="card">
            <label className="block text-sm font-medium text-muted mb-2">Funktion f(x) =</label>
            <input
              className="input-field mb-3"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlot()}
              placeholder="z.B. a * sin(b * x + c)"
              spellCheck={false}
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button className="btn-primary w-full" onClick={() => handlePlot()}>
              Plotten ↵
            </button>
          </div>

          {/* Parameter sliders */}
          <AnimatePresence>
            {paramKeys.length > 0 && (
              <motion.div
                key="params"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="card overflow-hidden"
              >
                <p className="text-sm font-semibold mb-4" style={{ color: '#7c6fff' }}>
                  Parameter-Slider
                </p>
                {paramKeys.map((k) => (
                  <div key={k} className="mb-4 last:mb-0">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-mono text-sm font-semibold text-text">{k} =</span>
                      <span className="font-mono text-sm text-accent">{(params[k] ?? 1).toFixed(2)}</span>
                    </div>
                    <input
                      type="range"
                      min="-5"
                      max="5"
                      step="0.05"
                      value={params[k] ?? 1}
                      onChange={(e) => updateParam(k, Number(e.target.value))}
                      className="w-full"
                      style={{ accentColor: '#7c6fff' }}
                    />
                    <div className="flex justify-between text-[10px] text-muted mt-0.5">
                      <span>-5</span><span>0</span><span>5</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="card">
            <p className="text-sm font-medium text-muted mb-3">Schnellauswahl</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  className="btn-secondary text-xs text-left px-3 py-2"
                  onClick={() => { setInput(p.expr); handlePlot(p.expr, {}) }}
                >
                  {p.label}
                  <span className="block font-mono text-accent/70 text-[10px] truncate mt-0.5">{p.expr}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <p className="text-sm font-medium text-muted mb-3">x-Bereich</p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted">von</label>
                <input type="number" className="input-field mt-1" value={xMin}
                  onChange={(e) => setXMin(Number(e.target.value))} />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted">bis</label>
                <input type="number" className="input-field mt-1" value={xMax}
                  onChange={(e) => setXMax(Number(e.target.value))} />
              </div>
            </div>
          </div>
        </div>

        {/* Canvas + explanation */}
        <div className="lg:col-span-2 space-y-5">
          <div className="card p-0 overflow-hidden relative">
            <canvas
              ref={canvasRef}
              width={800}
              height={420}
              className="w-full rounded-2xl cursor-crosshair"
              style={{ display: 'block' }}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
            <AnimatePresence>
              {hoverInfo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.1 }}
                  className="absolute bottom-4 right-4 glass-strong rounded-xl px-4 py-3 pointer-events-none"
                  style={{ border: '1px solid rgba(255,209,102,0.3)' }}
                >
                  <div className="text-xs font-mono space-y-1">
                    <div className="text-muted">x = <span className="text-text font-semibold">{hoverInfo.x.toFixed(3)}</span></div>
                    <div className="text-muted">f(x) = <span className="text-accent font-semibold">{hoverInfo.y.toFixed(4)}</span></div>
                    {hoverInfo.dy !== null && (
                      <div className="text-muted">
                        {level === 'schüler' ? 'Steigung' : 'f′(x)'} = <span className="font-semibold" style={{ color: '#ffd166' }}>{hoverInfo.dy.toFixed(4)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {explanation.length > 0 && (
            <ExplanationBox lines={explanation} color="#7c6fff" title={`f(x) = ${expr}`} />
          )}
        </div>
      </div>
    </div>
  )
}
