import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { fetchConfig } from '../lib/api'

export default async function RootLayout({ children }) {
  const config = await fetchConfig().catch(() => null)
  const primary   = config?.primary_color   || '#1E1A1A'
  const secondary = config?.secondary_color || '#EEC5C5'
  const companyName = config?.company_name  || 'Glowi Skin'
  const logoUrl     = config?.logo_url      || ''

  return (
    <html lang="es">
      <head>
        <title>{companyName}</title>
        <meta name="description" content={`Tienda oficial de ${companyName}`} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@100;300;400;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
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
