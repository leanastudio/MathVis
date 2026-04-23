import { useState, useRef, useMemo, Suspense, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Grid } from '@react-three/drei'
import * as math from 'mathjs'
import * as THREE from 'three'
import ExplanationBox from '../components/ExplanationBox'
import CoordAxes from '../components/CoordAxes'
import { useLevel } from '../context/LevelContext'

const PRESETS = [
  { label: 'Paraboloid', expr: 'x^2 + y^2' },
  { label: 'Sattel', expr: 'x^2 - y^2' },
  { label: 'Wellen', expr: 'sin(x) * cos(y)' },
  { label: 'Gauß', expr: 'e^(-(x^2+y^2))' },
  { label: 'Trichter', expr: 'sqrt(x^2 + y^2)' },
  { label: 'Ripple', expr: 'sin(sqrt(x^2+y^2)) / sqrt(x^2+y^2+0.1)' },
]

function buildExplanation(expr, level) {
  const lines = []

  if (level === 'schüler') lines.push(`Du schaust auf eine **3D-Fläche**: z = ${expr}. Die Höhe z hängt davon ab, wo du auf der x-y-Ebene stehst.`)
  else if (level === 'student') lines.push(`Fläche **z = f(x, y) = ${expr}** im dreidimensionalen Koordinatensystem.`)
  else lines.push(`**f : ℝ² → ℝ,  f(x,y) = ${expr}**`)

  if (expr.includes('x^2 + y^2')) {
    if (level === 'schüler') lines.push('Das ist eine **Schüssel** — je weiter du vom Mittelpunkt weggehst, desto höher wird die Fläche.')
    else if (level === 'student') lines.push('Elliptischer Paraboloid: rotationssymmetrisch, Minimum bei (0,0,0).')
    else lines.push('Paraboloid of revolution: z = r², r = √(x²+y²). Krümmung κ = const > 0.')
  }
  if (expr.includes('x^2 - y^2')) {
    if (level === 'schüler') lines.push('Das ist ein **Sattel** — in eine Richtung geht es bergauf, in die andere bergab, wie auf einem Pferdesattel.')
    else if (level === 'student') lines.push('Hyperbolischer Paraboloid (Sattel): kein lokales Extremum, aber ein Sattelpunkt bei (0,0,0).')
    else lines.push('Hyperbolisches Paraboloid: indefinite Hesse-Matrix H = diag(2,−2). Sattelpunkt.')
  }
  if (expr.includes('sin') && expr.includes('cos')) {
    if (level === 'schüler') lines.push('Eine **Wellenlandschaft** — wie Wellen auf einem Teich, aber in alle Richtungen gleichzeitig.')
    else if (level === 'student') lines.push('Produkt zweier periodischer Funktionen — doppelt periodisch in x und y.')
    else lines.push('f(x,y) = sin(x)cos(y): separable, Periode 2π in x und y. Kritische Punkte bei x = π/2+nπ, y = mπ.')
  }
  if (expr.includes('e^')) {
    if (level === 'schüler') lines.push('Eine **Glockenform** — in der Mitte am höchsten, nach außen hin fällt sie sehr schnell ab.')
    else if (level === 'student') lines.push('Gaußsches Glockenprofil: Maximum bei (0,0), fällt exponentiell mit dem Abstand ab.')
    else lines.push('Gauß-Funktion: e^{-(x²+y²)} ∈ L²(ℝ²). Fouriertransformierte ist wieder eine Gauß-Funktion.')
  }
  if (expr.includes('sqrt') && !expr.includes('sin')) {
    if (level === 'schüler') lines.push('Eine **Kegelform** — vom Ursprung aus steigt sie gleichmäßig in alle Richtungen an.')
    else if (level === 'student') lines.push('Kegelförmig: z = r = √(x²+y²). Nicht differenzierbar im Ursprung.')
    else lines.push('z = ‖(x,y)‖₂: konisch, C^∞(ℝ²∖{0}), aber nicht differenzierbar in 0 (Kegelspitze).')
  }

  if (level === 'schüler') lines.push('Drehe die Fläche mit der Maus — schau sie von allen Seiten an!')
  else if (level === 'student') lines.push('Orbit Controls: Linksklick = drehen, Scrollrad = Zoom, Rechtsklick = verschieben.')
  else lines.push('Orbit Controls aktiv. Farbkodierung: niedrige z → Farbe A, hohe z → Farbe B (linear interpoliert).')

  return lines
}

function Surface({ compiled, range, colorA, colorB }) {
  const meshRef = useRef()
  const N = 60
  const step = (2 * range) / N

  const { geometry, colorsArr } = useMemo(() => {
    const positions = []
    const indices = []
    const colorsArr = []

    let zMin = Infinity, zMax = -Infinity
    const zGrid = []

    for (let i = 0; i <= N; i++) {
      zGrid.push([])
      for (let j = 0; j <= N; j++) {
        const x = -range + i * step
        const y = -range + j * step
        let z = 0
        try {
          z = compiled.evaluate({ x, y })
          if (!isFinite(z)) z = 0
        } catch { z = 0 }
        z = Math.max(-range * 2, Math.min(range * 2, z))
        zGrid[i].push(z)
        if (z < zMin) zMin = z
        if (z > zMax) zMax = z
      }
    }

    for (let i = 0; i <= N; i++) {
      for (let j = 0; j <= N; j++) {
        const x = -range + i * step
        const y = -range + j * step
        const z = zGrid[i][j]
        positions.push(x, z, y)
        const t = zMax === zMin ? 0.5 : (z - zMin) / (zMax - zMin)
        const ca = new THREE.Color(colorA)
        const cb = new THREE.Color(colorB)
        const c = ca.clone().lerp(cb, t)
        colorsArr.push(c.r, c.g, c.b)
      }
    }

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        const a = i * (N + 1) + j
        const b = a + 1
        const c = (i + 1) * (N + 1) + j
        const d = c + 1
        indices.push(a, b, c, b, d, c)
      }
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colorsArr, 3))
    geo.setIndex(indices)
    geo.computeVertexNormals()
    return { geometry: geo, colorsArr }
  }, [compiled, range, colorA, colorB, step])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.1
  })

  return (
    <mesh ref={meshRef} geometry={geometry}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.4} metalness={0.1} />
    </mesh>
  )
}

export default function Plot3DPage() {
  const { level } = useLevel()
  const [input, setInput] = useState('x^2 + y^2')
  const [expr, setExpr] = useState('x^2 + y^2')
  const [compiled, setCompiled] = useState(() => math.compile('x^2 + y^2'))
  const [error, setError] = useState(null)
  const [range, setRange] = useState(3)
  const [explanation, setExplanation] = useState(() => buildExplanation('x^2 + y^2', 'schüler'))
  const [colorA, setColorA] = useState('#7c6fff')
  const [colorB, setColorB] = useState('#ff6f91')
  const [rotate, setRotate] = useState(true)
  const [showAxes, setShowAxes] = useState(true)

  useEffect(() => {
    setExplanation(buildExplanation(expr, level))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level])

  const handlePlot = () => {
    try {
      const c = math.compile(input)
      c.evaluate({ x: 0, y: 0 })
      setCompiled(c)
      setExpr(input)
      setError(null)
      setExplanation(buildExplanation(input, level))
    } catch {
      setError('Ungültige Funktion. Beispiel: sin(x) * cos(y)')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-text mb-8"
      >
        <span className="text-accent2">◈</span> 3D-Flächenplotter
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          <div className="card">
            <label className="block text-sm font-medium text-muted mb-2">z = f(x, y) =</label>
            <input
              className="input-field mb-3"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePlot()}
              placeholder="z.B. sin(x)*cos(y)"
              spellCheck={false}
            />
            {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
            <button className="btn-primary w-full" onClick={handlePlot}>Plotten ↵</button>
          </div>

          <div className="card">
            <p className="text-sm font-medium text-muted mb-3">Schnellauswahl</p>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  className="btn-secondary text-xs text-left px-3 py-2"
                  onClick={() => { setInput(p.expr); setTimeout(handlePlot, 0) }}
                >
                  {p.label}
                  <span className="block font-mono text-accent2/70 text-[10px] truncate">{p.expr}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card space-y-4">
            <div>
              <label className="text-sm text-muted block mb-1">Bereich: ±{range}</label>
              <input type="range" min={1} max={6} step={0.5} value={range} onChange={(e) => setRange(Number(e.target.value))} className="w-full accent-pink-400" />
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Farbe tief</label>
                <input type="color" value={colorA} onChange={(e) => setColorA(e.target.value)} className="w-full h-9 rounded-lg cursor-pointer border-0 bg-transparent" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Farbe hoch</label>
                <input type="color" value={colorB} onChange={(e) => setColorB(e.target.value)} className="w-full h-9 rounded-lg cursor-pointer border-0 bg-transparent" />
              </div>
            </div>
            <button className="btn-secondary w-full text-sm" onClick={() => setRotate((r) => !r)}>
              {rotate ? '⏸ Rotation stoppen' : '▶ Rotation starten'}
            </button>
            <button className="btn-secondary w-full text-sm" onClick={() => setShowAxes((a) => !a)}>
              {showAxes ? '➖ Koordinatenkreuz ausblenden' : '➕ Koordinatenkreuz anzeigen'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-0 overflow-hidden" style={{ height: '460px' }}>
            <Canvas camera={{ position: [5, 5, 5], fov: 50 }} style={{ background: '#12121a' }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 10, 5]} intensity={1.2} />
              <Suspense fallback={null}>
                <Surface compiled={compiled} range={range} colorA={colorA} colorB={colorB} key={expr + range + colorA + colorB} />
              </Suspense>
              {showAxes && <CoordAxes size={range + 0.5} />}
              <Grid infiniteGrid sectionColor="#2a2a3d" cellColor="#1e1e2e" fadeDistance={20} />
              <OrbitControls enablePan autoRotate={rotate} autoRotateSpeed={1} />
            </Canvas>
          </div>
          {explanation.length > 0 && (
            <ExplanationBox lines={explanation} color="#ff6f91" title={`z = ${expr}`} />
          )}
        </div>
      </div>
    </div>
  )
}
