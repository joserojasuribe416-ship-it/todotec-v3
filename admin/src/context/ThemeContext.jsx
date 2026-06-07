import { createContext, useContext, useEffect, useState } from 'react'
import { getConfig } from '../api/client'

const ThemeContext = createContext({
  primary: '#1E3A8A',
  secondary: '#FFD100',
  companyName: 'TodoTec',
  logoUrl: '',
  updateTheme: () => {},
  updateBrand: () => {},
})

export function ThemeProvider({ children }) {
  const [primary, setPrimary] = useState('#1E3A8A')
  const [secondary, setSecondary] = useState('#FFD100')
  const [companyName, setCompanyName] = useState('TodoTec')
  const [logoUrl, setLogoUrl] = useState('')

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
      setCompanyName(cfg.company_name || 'TodoTec')
      setLogoUrl(cfg.logo_url || '')
      applyVars(p, s)
    }).catch(() => {})
  }, [])

  const updateTheme = (p, s) => {
    setPrimary(p)
    setSecondary(s)
    applyVars(p, s)
  }

  const updateBrand = (name, url) => {
    if (name !== undefined) setCompanyName(name)
    if (url !== undefined) setLogoUrl(url)
  }

  return (
    <ThemeContext.Provider value={{ primary, secondary, companyName, logoUrl, updateTheme, updateBrand }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
