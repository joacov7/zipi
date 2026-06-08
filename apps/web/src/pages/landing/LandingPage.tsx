import { Link } from 'react-router-dom';

const STATS = [
  { value: '2.400+', label: 'Viajes completados' },
  { value: '180+', label: 'Conductores activos' },
  { value: '4.8★', label: 'Calificación promedio' },
];

const SERVICES = [
  {
    icon: '🚗',
    title: 'Remis',
    subtitle: 'Viajes seguros y cómodos',
    desc: 'Pedí tu remis en segundos. Conductores verificados, precio fijo antes de salir.',
    bg: '#1A1714',
    color: '#EF9008',
  },
  {
    icon: '🏍',
    title: 'Moto mandados',
    subtitle: 'Envíos rápidos en moto',
    desc: 'Documentos, paquetes y encomiendas. Tu entrega llega en minutos.',
    bg: '#0E4D2D',
    color: '#22c55e',
  },
  {
    icon: '🚛',
    title: 'Fletes y carga',
    subtitle: 'Transporte de volúmen',
    desc: 'Mudanzas, materiales y maquinaria pesada. Cotización instantánea.',
    bg: '#1e3a5f',
    color: '#60a5fa',
  },
];

const STEPS = [
  { n: '1', title: 'Pedí el servicio', desc: 'Ingresá origen, destino y tipo de servicio. Ves el precio antes de confirmar.' },
  { n: '2', title: 'El conductor confirma', desc: 'Te conectamos con el conductor más cercano. Seguí su ubicación en tiempo real.' },
  { n: '3', title: 'Llegá a destino', desc: 'Pagá digital, calificá el servicio y llevá el historial en tu bolsillo.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans" style={{ fontFamily: "'Hanken Grotesk', system-ui, sans-serif" }}>
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(26,23,20,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}>
            <span className="text-white font-extrabold text-[17px]">Z</span>
          </div>
          <span className="text-white font-extrabold text-[18px]">Zipi</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-2 text-[14px] font-semibold rounded-xl transition-colors"
            style={{ color: 'rgba(255,255,255,0.7)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}>
            Ingresar
          </Link>
          <Link to="/register"
            className="px-4 py-2 text-[14px] font-bold rounded-xl transition-colors"
            style={{ background: '#EF9008', color: '#fff' }}>
            Registrarse
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-6 pt-36 pb-24"
        style={{ background: '#1A1714', minHeight: '100vh' }}>
        {/* Decorative circles */}
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 600, height: 600, background: 'radial-gradient(circle,rgba(239,144,8,0.12) 0%,transparent 70%)', top: -120, right: -120 }} />
        <div className="absolute rounded-full pointer-events-none"
          style={{ width: 400, height: 400, background: 'radial-gradient(circle,rgba(239,144,8,0.07) 0%,transparent 70%)', bottom: -60, left: -60 }} />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[13px] font-semibold mb-8"
            style={{ background: 'rgba(239,144,8,0.15)', color: '#EF9008', border: '1px solid rgba(239,144,8,0.3)' }}>
            🇦🇷 Buenos Aires · Disponible ahora
          </div>

          <h1 className="font-extrabold leading-none mb-6"
            style={{ fontSize: 'clamp(48px, 8vw, 80px)', color: '#fff', letterSpacing: '-2px' }}>
            Tu ciudad,<br />
            <span style={{ color: '#EF9008' }}>en movimiento</span>
          </h1>

          <p className="text-[18px] leading-relaxed mb-10 max-w-xl mx-auto"
            style={{ color: 'rgba(255,255,255,0.6)' }}>
            Remis, moto mandados y transporte de carga en Buenos Aires.
            Rápido, seguro y todo desde tu celular.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/register"
              className="px-8 py-4 rounded-2xl text-[16px] font-bold transition-all"
              style={{ background: '#EF9008', color: '#fff', boxShadow: '0 8px 24px rgba(239,144,8,0.35)' }}>
              Empezar gratis
            </Link>
            <Link to="/login"
              className="px-8 py-4 rounded-2xl text-[16px] font-bold transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.15)' }}>
              Ya tengo cuenta
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-extrabold text-[28px] leading-none" style={{ color: '#fff' }}>{s.value}</p>
                <p className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom,rgba(255,255,255,0.3),transparent)' }} />
        </div>
      </section>

      {/* Services */}
      <section className="py-24 px-6" style={{ background: '#f4f2ee' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-extrabold text-[40px] leading-tight mb-4" style={{ color: '#1A1714', letterSpacing: '-1px' }}>
              Tres servicios,<br />una sola app
            </h2>
            <p className="text-[17px]" style={{ color: '#6b6760' }}>
              Todo lo que necesitás para moverte y enviar en Buenos Aires.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {SERVICES.map((s) => (
              <div key={s.title}
                className="rounded-3xl p-8 flex flex-col gap-4"
                style={{ background: s.bg }}>
                <div className="text-[48px]">{s.icon}</div>
                <div>
                  <p className="font-extrabold text-[22px] leading-none mb-1" style={{ color: '#fff' }}>{s.title}</p>
                  <p className="font-semibold text-[13px]" style={{ color: s.color }}>{s.subtitle}</p>
                </div>
                <p className="text-[15px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.6)' }}>{s.desc}</p>
                <Link to="/register"
                  className="mt-auto inline-flex items-center gap-2 font-bold text-[14px] transition-opacity hover:opacity-80"
                  style={{ color: s.color }}>
                  Probar ahora →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6" style={{ background: '#fff' }}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-extrabold text-[40px] leading-tight mb-4" style={{ color: '#1A1714', letterSpacing: '-1px' }}>
              Tres pasos y listo
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step) => (
              <div key={step.n} className="flex flex-col items-center text-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-extrabold text-[24px]"
                  style={{ background: '#1A1714', color: '#EF9008' }}>
                  {step.n}
                </div>
                <h3 className="font-bold text-[18px]" style={{ color: '#1A1714' }}>{step.title}</h3>
                <p className="text-[15px] leading-relaxed" style={{ color: '#6b6760' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Driver CTA */}
      <section className="py-20 px-6" style={{ background: '#1A1714' }}>
        <div className="max-w-3xl mx-auto text-center">
          <p className="font-semibold text-[13px] mb-4 tracking-widest uppercase" style={{ color: '#EF9008' }}>
            Para conductores
          </p>
          <h2 className="font-extrabold text-[38px] leading-tight mb-6" style={{ color: '#fff', letterSpacing: '-1px' }}>
            ¿Tenés vehículo?<br />Generá ingresos con Zipi
          </h2>
          <p className="text-[17px] mb-10" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Registrate, cargá tus documentos y empezá a recibir viajes.
            Vos elegís cuándo y cuánto trabajar.
          </p>
          <Link to="/register"
            className="inline-block px-10 py-4 rounded-2xl text-[16px] font-bold transition-all"
            style={{ background: '#EF9008', color: '#fff', boxShadow: '0 8px 24px rgba(239,144,8,0.35)' }}>
            Registrarme como conductor
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        style={{ background: '#111', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}>
            <span className="text-white font-extrabold text-[13px]">Z</span>
          </div>
          <span className="text-white font-bold text-[15px]">Zipi</span>
        </div>
        <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © {new Date().getFullYear()} Zipi · Buenos Aires, Argentina
        </p>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-[13px] transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Ingresar
          </Link>
          <Link to="/register" className="text-[13px] transition-colors" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Registrarse
          </Link>
        </div>
      </footer>
    </div>
  );
}
