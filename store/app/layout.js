import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchConfig } from '../lib/api'

export default async function RootLayout({ children }) {
  const config = await fetchConfig().catch(() => null)
  const primary   = config?.primary_color   || '#1E3A8A'
  const secondary = config?.secondary_color || '#FFD100'
  const companyName = config?.company_name  || 'TodoTec'
  const logoUrl     = config?.logo_url      || ''

  return (
    <html lang="es">
      <head>
        <title>{companyName}</title>
        <meta name="description" content={`Tienda oficial de ${companyName}`} />
        <style>{`:root { --brand-primary: ${primary}; --brand-secondary: ${secondary}; }`}</style>
      </head>
      <body>
        <Navbar companyName={companyName} logoUrl={logoUrl} />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer companyName={companyName} />
      </body>
    </html>
  )
}
