import { createContext, useContext, useState } from 'react'

const LevelContext = createContext()

export function LevelProvider({ children }) {
  const [level, setLevel] = useState('schüler')
  return (
    <LevelContext.Provider value={{ level, setLevel }}>
      {children}
    </LevelContext.Provider>
  )
}

export const useLevel = () => useContext(LevelContext)
