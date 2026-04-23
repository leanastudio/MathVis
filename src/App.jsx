import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import Plot2DPage from './pages/Plot2DPage'
import Plot3DPage from './pages/Plot3DPage'
import VectorPage from './pages/VectorPage'
import { LevelProvider } from './context/LevelContext'

const pages = {
  home: HomePage,
  plot2d: Plot2DPage,
  plot3d: Plot3DPage,
  vector: VectorPage,
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const PageComponent = pages[currentPage] || HomePage

  return (
    <LevelProvider>
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0a0f' }}>
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />
      <main className="flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="h-full"
          >
            <PageComponent onNavigate={setCurrentPage} />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
    </LevelProvider>
  )
}
