import './globals.css'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <title>Glowi Skin</title>
        <meta name="description" content="Korean skincare importado directamente desde Corea del Sur. Rutinas reales, resultados visibles." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@100;300;400;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
