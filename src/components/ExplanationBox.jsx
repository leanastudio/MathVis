import { motion } from 'framer-motion'

function parseLine(line) {
  const parts = []
  const regex = /\*\*(.+?)\*\*/g
  let last = 0
  let match
  while ((match = regex.exec(line)) !== null) {
    if (match.index > last) parts.push({ text: line.slice(last, match.index), bold: false })
    parts.push({ text: match[1], bold: true })
    last = match.index + match[0].length
  }
  if (last < line.length) parts.push({ text: line.slice(last), bold: false })
  return parts
}

export default function ExplanationBox({ lines, color, title }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass rounded-2xl p-5"
      style={{ borderColor: `${color}30`, borderWidth: 1 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <span className="text-base">💡</span>
        <span className="text-sm font-semibold" style={{ color }}>
          {title}
        </span>
      </div>
      <ul className="space-y-2">
        {lines.map((line, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, duration: 0.3 }}
            className="flex gap-2 text-sm leading-relaxed"
          >
            <span style={{ color, opacity: 0.6 }}>▸</span>
            <span className="text-muted">
              {parseLine(line).map((part, j) =>
                part.bold ? (
                  <strong key={j} className="text-text font-semibold">
                    {part.text}
                  </strong>
                ) : (
                  <span key={j}>{part.text}</span>
                )
              )}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}
