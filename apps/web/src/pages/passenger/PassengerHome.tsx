import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Car, Package, Truck, Wrench, Users, Gift, Search, ChevronRight, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

const SERVICES = [
  {
    id: 'remis',
    name: 'Pedir Remis',
    tagline: 'Viajá cómodo con conductores verificados',
    from: 2500,
    icon: Car,
    accent: '#EF9008',
    tint: 'rgba(239,144,8,0.12)',
    to: '/request-trip',
  },
  {
    id: 'moto',
    name: 'Motomandado',
    tagline: 'Enviá paquetes y documentos en moto',
    from: 1500,
    icon: Package,
    accent: '#2F6BEC',
    tint: 'rgba(47,107,236,0.12)',
    to: '/request-delivery',
  },
  {
    id: 'flete',
    name: 'Fletes y Maquinaria',
    tagline: 'Camiones, excavadoras, grúas y más',
    from: 8000,
    icon: Truck,
    accent: '#0E9E6E',
    tint: 'rgba(14,158,110,0.12)',
    to: '/request-freight',
  },
  {
    id: 'servicios',
    name: 'Servicios del Hogar',
    tagline: 'Plomeros, electricistas, pintores y más',
    from: null,
    icon: Wrench,
    accent: '#6D5AE0',
    tint: 'rgba(109,90,224,0.12)',
    to: '/services',
  },
];

const STATUS_COLORS: Record<string, string> = {
  COMPLETED: 'text-[#0E9E6E]',
  CANCELLED: 'text-red-500',
  IN_PROGRESS: 'text-[#2F6BEC]',
};
const STATUS_LABELS: Record<string, string> = {
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  IN_PROGRESS: 'En curso',
};

export default function PassengerHome() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const firstName = user?.name?.split(' ')[0] ?? 'Hola';

  const { data: tripsData } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => api.get('/users/me/trips?limit=3').then((r) => r.data),
  });

  const recentTrips = tripsData?.data?.slice(0, 3) || [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight leading-tight">
          Hola, {firstName}
        </h1>
        <p className="text-[15px] text-zipi-muted mt-1">¿Qué necesitás hoy?</p>
      </div>

      {/* Hero CTA */}
      <Link
        to="/request-trip"
        className="block relative rounded-[22px] overflow-hidden p-5"
        style={{
          background:
            'linear-gradient(140deg, rgba(255,255,255,0.14), rgba(0,0,0,0.05) 42%, rgba(0,0,0,0.30)), #1A1714',
          boxShadow: '0 16px 34px -18px rgba(26,23,20,0.6)',
        }}
      >
        <div className="relative z-10">
          <p className="text-[11.5px] font-bold text-white/80 tracking-widest uppercase mb-1.5">
            Viajá ahora
          </p>
          <p className="text-[23px] font-extrabold text-white tracking-tight leading-tight mb-4">
            ¿A dónde vamos?
          </p>
          <div className="inline-flex items-center gap-2.5 bg-white rounded-[13px] px-4 py-3 text-[15px] font-bold text-zipi-ink shadow-lg">
            <Search size={19} className="text-zipi-500" strokeWidth={2.2} />
            Buscar destino
          </div>
        </div>
        <div className="absolute right-[-16px] bottom-[-20px] text-white/[0.1] pointer-events-none">
          <Car size={142} strokeWidth={1.5} />
        </div>
      </Link>

      {/* Services 2x2 */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[17px] font-bold text-zipi-ink tracking-tight">Nuestros servicios</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <Link
                key={s.id}
                to={s.to}
                className="bg-white border border-zipi-rim rounded-[22px] p-[15px] shadow-zipi hover:shadow-md transition-shadow block"
              >
                <div
                  className="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center mb-3"
                  style={{ background: s.tint, color: s.accent }}
                >
                  <Icon size={26} strokeWidth={2} />
                </div>
                <p
                  className="text-[15.5px] font-bold text-zipi-ink leading-tight mb-1"
                  style={{ letterSpacing: '-0.01em' }}
                >
                  {s.name}
                </p>
                <p className="text-[12.5px] text-zipi-muted leading-snug mb-2">{s.tagline}</p>
                {s.from ? (
                  <p className="text-[12.5px] font-bold" style={{ color: s.accent }}>
                    Desde ${s.from.toLocaleString('es-AR')}
                  </p>
                ) : (
                  <p
                    className="text-[12.5px] font-bold flex items-center gap-1"
                    style={{ color: s.accent }}
                  >
                    Pedí presupuesto <ChevronRight size={13} strokeWidth={2.4} />
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Viajes compartidos entry */}
      <Link
        to="/shared-trips"
        className="flex items-center gap-3 bg-white border border-zipi-rim rounded-[22px] p-4 shadow-zipi hover:shadow-md transition-shadow"
      >
        <div
          className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(26,23,20,0.08)', color: '#1A1714' }}
        >
          <Users size={24} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-bold text-zipi-ink">Viajes compartidos</p>
          <p className="text-[12.5px] text-zipi-muted">Compartí el viaje y dividí el costo</p>
        </div>
        <span
          className="text-[11px] font-bold rounded-full px-2.5 py-1 shrink-0"
          style={{ background: 'rgba(26,23,20,0.08)', color: '#1A1714' }}
        >
          Nuevo
        </span>
      </Link>

      {/* Wallet / referral promo */}
      <button
        onClick={() => navigate('/referral')}
        className="w-full flex items-center gap-3 rounded-[22px] p-4 text-left hover:opacity-90 transition-opacity"
        style={{
          background: '#FDF6E8',
          border: '1px solid #F7E4BC',
        }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#EF9008', color: '#fff' }}
        >
          <Gift size={23} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[14.5px] font-bold text-zipi-ink">Invitá y ganá $3.000</p>
          <p className="text-[12.5px] text-zipi-muted">Por cada amigo que haga su primer viaje</p>
        </div>
        <ChevronRight size={20} className="text-zipi-faint shrink-0" />
      </button>

      {/* Recent activity */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-[17px] font-bold text-zipi-ink tracking-tight">Actividad reciente</h2>
          <Link to="/history" className="text-[13.5px] font-semibold text-zipi-500">
            Ver todo
          </Link>
        </div>

        {recentTrips.length === 0 ? (
          <div className="text-center py-10">
            <Clock size={40} className="text-zipi-faint mx-auto mb-3 opacity-60" strokeWidth={1.6} />
            <p className="text-[15px] font-bold text-zipi-muted">Aún no tenés viajes</p>
            <p className="text-[13px] text-zipi-faint mt-1">¡Pedí tu primer remis o mandado!</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {recentTrips.map((trip: any) => {
              const price = trip.finalPrice ?? trip.estimatedPrice;
              const statusColor = STATUS_COLORS[trip.status] || 'text-zipi-faint';
              const statusLabel = STATUS_LABELS[trip.status] || trip.status;
              return (
                <div
                  key={trip.id}
                  className="flex items-center gap-3 bg-white border border-zipi-rim rounded-[16px] p-3.5 shadow-zipi"
                >
                  <div
                    className="w-11 h-11 rounded-[13px] flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(239,144,8,0.1)', color: '#EF9008' }}
                  >
                    <Car size={21} strokeWidth={2} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14.5px] font-bold text-zipi-ink truncate">
                      {trip.destAddress}
                    </p>
                    <p className="text-[12.5px] text-zipi-muted">
                      {new Date(trip.createdAt).toLocaleDateString('es-AR', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[14.5px] font-bold text-zipi-ink">
                      ${price?.toLocaleString('es-AR')}
                    </p>
                    <p className={`text-[11px] font-bold ${statusColor}`}>{statusLabel}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
