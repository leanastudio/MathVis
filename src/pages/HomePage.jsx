import { motion } from 'framer-motion'

const tools = [
  {
    id: 'plot2d',
    title: '2D-Funktionsplotter',
    description: 'Zeichne beliebige Funktionen f(x) — mit interaktivem Zoom, Farbverlauf und Schritt-für-Schritt-Erklärung.',
    icon: '∿',
    color: '#7c6fff',
    example: 'sin(x) · e^(-x²)',
  },
  {
    id: 'plot3d',
    title: '3D-Flächenplotter',
    description: 'Visualisiere Funktionen z = f(x, y) als interaktive 3D-Fläche — rotierbar, zoombar, bunt.',
    icon: '◈',
    color: '#ff6f91',
    example: 'z = x² + y²',
  },
  {
    id: 'vector',
    title: 'Vektorrechnung',
    description: 'Stelle Vektoren im Raum dar — Betrag, Addition, Kreuzprodukt und Skalarprodukt visuell erklärt.',
    icon: '→',
    color: '#6fffd4',
    example: 'v = (2, 1, 3)',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

export default function HomePage({ onNavigate }) {
  return (
    <div className="max-w-7xl mx-auto px-6 py-16">
      {/* Hero */}
      <div className="text-center mb-20">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="inline-block mb-6"
        >
          <span className="text-7xl font-bold text-accent glow-text">∑</span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="text-5xl font-bold text-text mb-4"
        >
          Mathematik,{' '}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(135deg, #7c6fff, #ff6f91)' }}
          >
            sichtbar gemacht
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="text-xl text-muted max-w-2xl mx-auto leading-relaxed"
        >
          Keine trockenen Formeln — sondern interaktive Visualisierungen mit echten Erklärungen.
          Tippe eine Funktion ein und sieh sofort, was passiert.
        </motion.p>
      </div>

      {/* Tool Cards */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {tools.map((tool) => (
          <motion.button
            key={tool.id}
            variants={cardVariants}
            onClick={() => onNavigate(tool.id)}
            className="card text-left group hover:border-accent/30 transition-all duration-300 hover:-translate-y-1"
            style={{ border: '1px solid rgba(42,42,61,0.6)' }}
            whileHover={{ boxShadow: `0 0 40px ${tool.color}22` }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 transition-all duration-300 group-hover:scale-110"
              style={{ background: `${tool.color}18`, color: tool.color }}
            >
              {tool.icon}
            </div>
            <h3 className="text-lg font-semibold text-text mb-2 group-hover:text-white transition-colors">
              {tool.title}
            </h3>
            <p className="text-muted text-sm leading-relaxed mb-4">{tool.description}</p>
            <div
              className="font-mono text-xs px-3 py-1.5 rounded-lg inline-block"
              style={{ background: `${tool.color}14`, color: tool.color }}
            >
              Beispiel: {tool.example}
            </div>
          </motion.button>
        ))}
      </motion.div>

      {/* Bottom hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center text-muted text-sm mt-16"
      >
        Wähle ein Tool oben — oder klick einfach auf eine der Karten.
      </motion.p>
    </div>
  )
}
