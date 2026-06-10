export const metadata = { title: 'Política de Privacidad — Glowi Skin' }

export default function PrivacidadPage() {
  const p = { fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#4B5563', lineHeight: 1.8, fontWeight: 300, marginBottom: 16 }
  const h = { fontFamily: "'Josefin Sans', sans-serif", fontWeight: 300, fontSize: 15, color: '#1E1A1A', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '28px 0 10px' }
  return (
    <div style={{ background: '#FAF7F4', minHeight: '100vh' }}>
      <div style={{ background: '#1E1A1A', padding: '40px 24px 36px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontWeight: 100, fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', color: '#FAF7F4', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1.1 }}>
            Política de Privacidad
          </h1>
        </div>
      </div>
      <div className="page-pad" style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <p style={p}>
          En Glowi Skin respetamos tu privacidad. Esta política describe qué datos personales recolectamos,
          para qué los usamos y cuáles son tus derechos, conforme a la Ley N° 29733 — Ley de Protección de
          Datos Personales del Perú y su reglamento.
        </p>
        <h2 style={h}>Qué datos recolectamos</h2>
        <p style={p}>
          Cuando creas una cuenta o realizas una compra recolectamos: nombre y apellido, correo electrónico,
          DNI, número de celular y dirección de entrega. Si compras como invitado, estos datos se usan
          únicamente para procesar y entregar tu pedido.
        </p>
        <h2 style={h}>Para qué los usamos</h2>
        <p style={p}>
          Procesar tus pedidos y coordinar la entrega; gestionar tu cuenta, tus cupones y tu historial de
          compras; y contactarte por WhatsApp o correo sobre el estado de tu pedido. No vendemos ni
          compartimos tus datos con terceros con fines publicitarios.
        </p>
        <h2 style={h}>Pagos</h2>
        <p style={p}>
          Los pagos con tarjeta se procesan directamente en MercadoPago. Glowi Skin nunca ve ni almacena los
          datos de tu tarjeta.
        </p>
        <h2 style={h}>Analítica</h2>
        <p style={p}>
          Usamos métricas anónimas y sin cookies de rastreo (conteo de visitas y productos vistos) para
          mejorar la tienda. No creamos perfiles publicitarios de los visitantes.
        </p>
        <h2 style={h}>Tus derechos</h2>
        <p style={p}>
          Puedes acceder, rectificar o eliminar tus datos en cualquier momento desde la sección Mi Perfil, o
          escribiéndonos por los canales de la página de contacto. Atenderemos tu solicitud en los plazos que
          establece la ley.
        </p>
        <p style={{ ...p, fontSize: 11, color: '#9CA3AF' }}>Última actualización: junio 2026.</p>
      </div>
    </div>
  )
}
