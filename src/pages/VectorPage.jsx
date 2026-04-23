import { useState, useRef, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, Line, Text } from '@react-three/drei'
import * as THREE from 'three'
import ExplanationBox from '../components/ExplanationBox'
import CoordAxes from '../components/CoordAxes'
import { useLevel } from '../context/LevelContext'

function Arrow({ from, to, color, label }) {
  const dir = new THREE.Vector3(to[0] - from[0], to[1] - from[1], to[2] - from[2])
  const len = dir.length()
  if (len < 0.001) return null

  const points = [
    new THREE.Vector3(...from),
    new THREE.Vector3(...to),
  ]

  const tipLen = Math.min(0.25, len * 0.2)
  const tipDir = dir.clone().normalize()
  const tipBase = new THREE.Vector3(...to).sub(tipDir.clone().multiplyScalar(tipLen))

  const perp1 = new THREE.Vector3(1, 0, 0)
  if (Math.abs(tipDir.dot(perp1)) > 0.9) perp1.set(0, 1, 0)
  const side1 = new THREE.Vector3().crossVectors(tipDir, perp1).normalize().multiplyScalar(tipLen * 0.35)
  const side2 = side1.clone().negate()

  const conePoints = [
    tipBase.clone().add(side1),
    new THREE.Vector3(...to),
    tipBase.clone().add(side2),
  ]

  const midPt = new THREE.Vector3(
    (from[0] + to[0]) / 2 + 0.2,
    (from[1] + to[1]) / 2 + 0.2,
    (from[2] + to[2]) / 2,
  )

  return (
    <group>
      <Line points={points} color={color} lineWidth={3} />
      <Line points={conePoints} color={color} lineWidth={3} />
      {label && (
        <Text position={[midPt.x, midPt.y, midPt.z]} fontSize={0.25} color={color} anchorX="center" anchorY="middle">
          {label}
        </Text>
      )}
    </group>
  )
}

function buildExplanation(v1, v2, level) {
  const lines = []
  const [ax, ay, az] = v1
  const lenA = Math.sqrt(ax ** 2 + ay ** 2 + az ** 2)

  const dirText = [
    ax !== 0 ? `${Math.abs(ax)} nach ${ax > 0 ? 'rechts' : 'links'}` : '',
    ay !== 0 ? `${Math.abs(ay)} nach ${ay > 0 ? 'oben' : 'unten'}` : '',
    az !== 0 ? `${Math.abs(az)} nach ${az > 0 ? 'vorne' : 'hinten'}` : '',
  ].filter(Boolean).join(', ')

  if (level === 'schüler') {
    lines.push(`**Vektor a** zeigt: ${dirText || 'Nullvektor'}.`)
    lines.push(`Seine Länge (Betrag) ist **|a| = ${Math.round(lenA * 100) / 100}** — das ist, wie weit der Pfeil reicht.`)
  } else if (level === 'student') {
    lines.push(`**a** = (${v1.join(', ')}),  |a| = **${Math.round(lenA * 100) / 100}**`)
  } else {
    lines.push(`**a** = (${v1.join(', ')})ᵀ ∈ ℝ³,  ‖a‖₂ = ${Math.round(lenA * 100) / 100}`)
  }

  if (v2) {
    const [bx, by, bz] = v2
    const lenB = Math.sqrt(bx ** 2 + by ** 2 + bz ** 2)
    const dot = ax * bx + ay * by + az * bz
    const angle = Math.acos(Math.max(-1, Math.min(1, dot / (lenA * lenB)))) * (180 / Math.PI)
    const angleRnd = Math.round(angle * 10) / 10
    const cross = [ay * bz - az * by, az * bx - ax * bz, ax * by - ay * bx]
    const crossStr = `(${cross.map((v) => Math.round(v * 100) / 100).join(', ')})`
    const perpendicular = Math.abs(angle - 90) < 0.5

    if (level === 'schüler') {
      lines.push(`**Skalarprodukt a · b = ${dot}** — ${perpendicular ? '🎯 Die Vektoren stehen genau senkrecht aufeinander!' : dot > 0 ? 'Sie zeigen in eine ähnliche Richtung (spitzer Winkel).' : 'Sie zeigen in entgegengesetzte Richtungen (stumpfer Winkel).'}`)
      lines.push(`Der **Winkel** zwischen den beiden Pfeilen beträgt **${angleRnd}°**.`)
      lines.push(`Das **Kreuzprodukt** a × b = **${crossStr}** ist ein neuer Vektor, der senkrecht auf beiden steht — probier es aus!`)
    } else if (level === 'student') {
      lines.push(`a · b = **${dot}** → Winkel = **${angleRnd}°**${perpendicular ? ' (orthogonal)' : ''}`)
      lines.push(`a × b = **${crossStr}**,  |a × b| = ${Math.round(cross.reduce((s, v) => s + v * v, 0) ** 0.5 * 100) / 100} (Fläche des Parallelogramms)`)
    } else {
      lines.push(`⟨a,b⟩ = ${dot},  cos θ = ${Math.round((dot / (lenA * lenB)) * 1000) / 1000},  θ = ${angleRnd}°${perpendicular ? ' (a ⊥ b)' : ''}`)
      lines.push(`a × b = ${crossStr},  ‖a×b‖ = ${Math.round(cross.reduce((s, v) => s + v * v, 0) ** 0.5 * 100) / 100} = ‖a‖‖b‖sin θ`)
    }
  }

  return lines
}

function VectorScene({ v1, v2, show }) {
  const sum  = [v1[0]+v2[0], v1[1]+v2[1], v1[2]+v2[2]]
  const diff = [v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]
  const cross = [
    v1[1]*v2[2] - v1[2]*v2[1],
    v1[2]*v2[0] - v1[0]*v2[2],
    v1[0]*v2[1] - v1[1]*v2[0],
  ]
  const dot = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2]
  const lenASq = v1.reduce((s, c) => s + c*c, 0)
  // projection of b onto a
  const proj = lenASq > 0 ? v1.map(c => c * dot / lenASq) : [0,0,0]

  const allVecs = [...v1.map(Math.abs), ...v2.map(Math.abs), 1]
  if (show.sum)   allVecs.push(...sum.map(Math.abs))
  if (show.diff)  allVecs.push(...diff.map(Math.abs))
  if (show.cross) allVecs.push(...cross.map(Math.abs))
  const maxLen = Math.max(...allVecs)

  return (
    <>
      {show.axes && <CoordAxes size={Math.ceil(maxLen) + 1} />}
      <Arrow from={[0,0,0]} to={v1} color="#7c6fff" label="a" />
      <Arrow from={[0,0,0]} to={v2} color="#ff6f91" label="b" />

      {show.sum && <Arrow from={[0,0,0]} to={sum}   color="#6fffd4" label="a+b" />}
      {show.sum && <Arrow from={v1} to={sum} color="#6fffd433" />}
      {show.sum && <Arrow from={v2} to={sum} color="#6fffd433" />}

      {show.diff && <Arrow from={[0,0,0]} to={diff}  color="#ff9f4f" label="a−b" />}
      {show.diff && <Arrow from={v2} to={v1} color="#ff9f4f44" />}

      {show.cross && <Arrow from={[0,0,0]} to={cross} color="#ffd166" label="a×b" />}

      {show.dot && <Arrow from={[0,0,0]} to={proj}  color="#c084fc" label="proj" />}
      {show.dot && <Arrow from={proj} to={v2} color="#c084fc33" />}
    </>
  )
}

function NumInput({ label, value, onChange }) {
  return (
    <div className="flex-1">
      <label className="text-[10px] text-muted block mb-0.5">{label}</label>
      <input
        type="number"
        step="0.5"
        className="input-field py-2 text-center"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  )
}

export default function VectorPage() {
  const { level } = useLevel()
  const [v1, setV1] = useState([2, 1, 1])
  const [v2, setV2] = useState([1, 2, 0])
  const [show, setShow] = useState({ sum: true, diff: false, cross: false, dot: false, axes: true })
  const toggle = (key) => setShow((s) => ({ ...s, [key]: !s[key] }))
  const explanation = buildExplanation(v1, v2, level)

  const setV1i = (i, val) => setV1((v) => v.map((c, j) => (j === i ? val : c)))
  const setV2i = (i, val) => setV2((v) => v.map((c, j) => (j === i ? val : c)))

  const dot = v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
  const lenA = Math.sqrt(v1.reduce((s, c) => s + c ** 2, 0))
  const lenB = Math.sqrt(v2.reduce((s, c) => s + c ** 2, 0))
  const angle = Math.round(Math.acos(Math.max(-1, Math.min(1, dot / (lenA * lenB)))) * (180 / Math.PI) * 10) / 10
  const cross = [v1[1] * v2[2] - v1[2] * v2[1], v1[2] * v2[0] - v1[0] * v2[2], v1[0] * v2[1] - v1[1] * v2[0]]

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold text-text mb-8"
      >
        <span className="text-accent3">→</span> Vektorrechnung
      </motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-5">
          {/* Vector A */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ background: '#7c6fff' }} />
              <p className="text-sm font-semibold text-text">Vektor a</p>
            </div>
            <div className="flex gap-2">
              <NumInput label="x" value={v1[0]} onChange={(v) => setV1i(0, v)} />
              <NumInput label="y" value={v1[1]} onChange={(v) => setV1i(1, v)} />
              <NumInput label="z" value={v1[2]} onChange={(v) => setV1i(2, v)} />
            </div>
            <p className="text-xs text-muted mt-2">|a| = <span className="text-accent font-mono">{Math.round(lenA * 100) / 100}</span></p>
          </div>

          {/* Vector B */}
          <div className="card">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-3 h-3 rounded-full" style={{ background: '#ff6f91' }} />
              <p className="text-sm font-semibold text-text">Vektor b</p>
            </div>
            <div className="flex gap-2">
              <NumInput label="x" value={v2[0]} onChange={(v) => setV2i(0, v)} />
              <NumInput label="y" value={v2[1]} onChange={(v) => setV2i(1, v)} />
              <NumInput label="z" value={v2[2]} onChange={(v) => setV2i(2, v)} />
            </div>
            <p className="text-xs text-muted mt-2">|b| = <span className="text-accent2 font-mono">{Math.round(lenB * 100) / 100}</span></p>
          </div>

          {/* Operations checkboxes + results */}
          <div className="card space-y-2">
            <p className="text-sm font-semibold text-muted mb-3">Anzeigen</p>
            {[
              { key: 'sum',   label: 'a + b', value: `(${v1.map((c,i)=>c+v2[i]).join(', ')})`,                                          color: '#6fffd4' },
              { key: 'diff',  label: 'a − b', value: `(${v1.map((c,i)=>c-v2[i]).join(', ')})`,                                          color: '#ff9f4f' },
              { key: 'cross', label: 'a × b', value: `(${cross.map((v) => Math.round(v*10)/10).join(', ')})`,                            color: '#ffd166' },
              { key: 'dot',   label: 'a · b', value: `${dot}  (Proj: ${lenA>0 ? Math.round(dot/lenA*100)/100 : 0})`,                     color: '#c084fc' },
            ].map(({ key, label, value, color }) => (
              <label key={key} className="flex items-center justify-between gap-3 cursor-pointer group py-1.5 px-2 rounded-lg hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      checked={show[key]}
                      onChange={() => toggle(key)}
                      className="sr-only"
                    />
                    <div
                      className="w-4 h-4 rounded flex items-center justify-center transition-all duration-150"
                      style={{
                        background: show[key] ? color : 'transparent',
                        border: `2px solid ${show[key] ? color : '#2a2a3d'}`,
                      }}
                    >
                      {show[key] && <span className="text-[10px] text-black font-bold leading-none">✓</span>}
                    </div>
                  </div>
                  <span className="font-mono text-sm font-semibold" style={{ color: show[key] ? color : '#7a7a9a' }}>{label}</span>
                </div>
                <span className="font-mono text-xs text-muted truncate max-w-[120px]">{value}</span>
              </label>
            ))}
            <div className="border-t border-border mt-2 pt-3">
              <div className="flex justify-between text-xs text-muted">
                <span>Winkel</span>
                <span className="font-mono text-accent2">{angle}°</span>
              </div>
            </div>
          </div>

          <button className="btn-secondary w-full text-sm" onClick={() => toggle('axes')}>
            {show.axes ? '➖ Koordinatenkreuz ausblenden' : '➕ Koordinatenkreuz anzeigen'}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-5">
          <div className="card p-0 overflow-hidden" style={{ height: '460px' }}>
            <Canvas camera={{ position: [4, 4, 6], fov: 50 }} style={{ background: '#12121a' }}>
              <ambientLight intensity={0.8} />
              <directionalLight position={[5, 10, 5]} intensity={1} />
              <Suspense fallback={null}>
                <VectorScene v1={v1} v2={v2} show={show} />
              </Suspense>
              <Grid infiniteGrid sectionColor="#2a2a3d" cellColor="#1e1e2e" fadeDistance={20} />
              <OrbitControls enablePan />
            </Canvas>
          </div>
          <ExplanationBox lines={explanation} color="#6fffd4" title="Vektoranalyse" />
        </div>
      </div>
    </div>
  )
}
