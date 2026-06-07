import { createContext, useContext, useEffect, useState } from 'react'
import { getConfig } from '../api/client'

const ThemeContext = createContext({
  primary: '#1E3A8A',
  secondary: '#FFD100',
  updateTheme: () => {},
})

export function ThemeProvider({ children }) {
  const [primary, setPrimary] = useState('#1E3A8A')
  const [secondary, setSecondary] = useState('#FFD100')

  const applyVars = (p, s) => {
    document.documentElement.style.setProperty('--brand-primary', p)
    document.documentElement.style.setProperty('--brand-secondary', s)
  }

  useEffect(() => {
    getConfig().then(cfg => {
      const p = cfg.primary_color || '#1E3A8A'
      const s = cfg.secondary_color || '#FFD100'
      setPrimary(p)
      setSecondary(s)
      applyVars(p, s)
    }).catch(() => {})
  }, [])

  const updateTheme = (p, s) => {
    setPrimary(p)
    setSecondary(s)
    applyVars(p, s)
  }

  return (
    <ThemeContext.Provider value={{ primary, secondary, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
