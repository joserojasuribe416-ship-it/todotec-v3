import { createContext, useContext, useEffect, useState } from 'react'
import { getConfig } from '../api/client'

const ThemeContext = createContext({
  primary: '#1E1A1A',
  secondary: '#EEC5C5',
  companyName: 'Glowi Skin',
  logoUrl: '',
  updateTheme: () => {},
  updateBrand: () => {},
})

export function ThemeProvider({ children }) {
  const [primary, setPrimary] = useState('#1E1A1A')
  const [secondary, setSecondary] = useState('#EEC5C5')
  const [companyName, setCompanyName] = useState('Glowi Skin')
  const [logoUrl, setLogoUrl] = useState('')

  const applyVars = (p, s) => {
    document.documentElement.style.setProperty('--brand-primary', p)
    document.documentElement.style.setProperty('--brand-secondary', s)
  }

  useEffect(() => {
    getConfig().then(cfg => {
      const p = cfg.primary_color || '#1E1A1A'
      const s = cfg.secondary_color || '#EEC5C5'
      setPrimary(p)
      setSecondary(s)
      setCompanyName(cfg.company_name || 'Glowi Skin')
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
