import { motion } from 'framer-motion'
import { useLevel } from '../context/LevelContext'

const navItems = [
  { id: 'home', label: 'Start', icon: '⌂' },
  { id: 'plot2d', label: '2D-Plot', icon: '∿' },
  { id: 'plot3d', label: '3D-Fläche', icon: '◈' },
  { id: 'vector', label: 'Vektoren', icon: '→' },
]

const LEVELS = [
  { id: 'schüler', label: 'Schüler', short: 'S' },
  { id: 'student', label: 'Student', short: 'Uni' },
  { id: 'profi',  label: 'Profi',   short: 'Pro' },
]

export default function Navbar({ currentPage, onNavigate }) {
  const { level, setLevel } = useLevel()

  return (
    <header className="glass-strong sticky top-0 z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-1 group shrink-0"
        >
          <span className="text-xl font-bold group-hover:text-accent transition-colors duration-200">
            <span className="text-accent glow-text">∑</span>
            <span className="text-text">athVis</span>
          </span>
        </button>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{ color: currentPage === item.id ? '#e8e8f0' : '#7a7a9a' }}
            >
              {currentPage === item.id && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'rgba(124, 111, 255, 0.15)', border: '1px solid rgba(124, 111, 255, 0.3)' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
            </button>
          ))}
        </nav>

        {/* Niveau switcher */}
        <div className="flex items-center gap-1 shrink-0 rounded-xl p-1" style={{ background: 'rgba(18,18,26,0.8)', border: '1px solid #2a2a3d' }}>
          {LEVELS.map((l) => (
            <button
              key={l.id}
              onClick={() => setLevel(l.id)}
              title={l.label}
              className="relative px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-200"
              style={{ color: level === l.id ? '#e8e8f0' : '#7a7a9a' }}
            >
              {level === l.id && (
                <motion.div
                  layoutId="level-pill"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: l.id === 'schüler' ? 'rgba(124,111,255,0.2)' : l.id === 'student' ? 'rgba(255,111,145,0.2)' : 'rgba(111,255,212,0.2)',
                    border: `1px solid ${l.id === 'schüler' ? 'rgba(124,111,255,0.4)' : l.id === 'student' ? 'rgba(255,111,145,0.4)' : 'rgba(111,255,212,0.4)'}`,
                  }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                />
              )}
              <span className="relative">{l.short}</span>
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
