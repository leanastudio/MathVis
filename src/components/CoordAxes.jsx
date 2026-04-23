import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line, Text } from '@react-three/drei'

const AXES = [
  { dir: [1, 0, 0], neg: [-1, 0, 0], color: '#ff4f4f', label: 'x', textOffset: [0, 0.22, 0] },
  { dir: [0, 1, 0], neg: [0, -1, 0], color: '#4fff7c', label: 'y', textOffset: [0.22, 0, 0] },
  { dir: [0, 0, 1], neg: [0, 0, -1], color: '#4fbfff', label: 'z', textOffset: [0, 0.22, 0] },
]

function TickLabels({ dir, color, textOffset, size }) {
  const sparseRef = useRef()   // every 2  — far
  const normalRef = useRef()   // every 1  — medium
  const denseRef = useRef()    // every 0.5 — close

  useFrame(({ camera }) => {
    const dist = camera.position.length()
    if (sparseRef.current) sparseRef.current.visible = dist >= 9
    if (normalRef.current) normalRef.current.visible = dist >= 4 && dist < 9
    if (denseRef.current)  denseRef.current.visible  = dist < 4
  })

  const maxN = Math.floor(size)

  const mkLabel = (n, key) => {
    const pos = [
      dir[0] * n + textOffset[0],
      dir[1] * n + textOffset[1],
      dir[2] * n + textOffset[2],
    ]
    const str = Number.isInteger(n) ? String(n) : n.toFixed(1)
    return (
      <Text
        key={key}
        position={pos}
        fontSize={0.16}
        color={color}
        anchorX="center"
        anchorY="middle"
        fillOpacity={0.55}
        renderOrder={1}
      >
        {str}
      </Text>
    )
  }

  // sparse: every 2
  const sparse = []
  for (let i = -maxN; i <= maxN; i++) {
    if (i !== 0 && i % 2 === 0) sparse.push(mkLabel(i, `s${i}`))
  }

  // normal: every 1
  const normal = []
  for (let i = -maxN; i <= maxN; i++) {
    if (i !== 0) normal.push(mkLabel(i, `n${i}`))
  }

  // dense: every 0.5
  const dense = []
  for (let i = -maxN * 2; i <= maxN * 2; i++) {
    if (i !== 0) dense.push(mkLabel(i * 0.5, `d${i}`))
  }

  return (
    <>
      <group ref={sparseRef}>{sparse}</group>
      <group ref={normalRef}>{normal}</group>
      <group ref={denseRef}>{dense}</group>
    </>
  )
}

export default function CoordAxes({ size = 3 }) {
  return (
    <group>
      {AXES.map(({ dir, neg, color, label, textOffset }) => {
        const tip = dir.map((v) => v * size)
        const tail = neg.map((v) => v * size * 0.5)
        const labelPos = dir.map((v) => v * (size + 0.4))

        return (
          <group key={label}>
            {/* axis line */}
            <Line points={[tail, tip]} color={color} lineWidth={1.5} />

            {/* axis label at tip */}
            <Text
              position={labelPos}
              fontSize={0.24}
              color={color}
              anchorX="center"
              anchorY="middle"
              fontWeight="bold"
            >
              {label}
            </Text>

            {/* adaptive tick numbers */}
            <TickLabels dir={dir} color={color} textOffset={textOffset} size={size} />
          </group>
        )
      })}
    </group>
  )
}
