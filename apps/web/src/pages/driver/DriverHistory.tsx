import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Car, MapPin, Star, Navigation } from 'lucide-react';

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:     { label: 'Pendiente',  bg: 'rgba(239,144,8,0.1)',    fg: '#C77A00' },
  ACCEPTED:    { label: 'Aceptado',   bg: 'rgba(47,107,236,0.1)',   fg: '#2F6BEC' },
  IN_PROGRESS: { label: 'En viaje',   bg: 'rgba(14,158,110,0.1)',   fg: '#0E9E6E' },
  COMPLETED:   { label: 'Completado', bg: 'rgba(14,158,110,0.1)',   fg: '#0E9E6E' },
  CANCELLED:   { label: 'Cancelado',  bg: 'rgba(224,62,99,0.1)',    fg: '#E03E63' },
};

export default function DriverHistory() {
  const { data } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: () => api.get('/drivers/me/trips').then((r) => r.data),
  });

  const trips = data?.data || [];

  const totalEarned = trips
    .filter((t: any) => t.status === 'COMPLETED')
    .reduce((sum: number, t: any) => sum + (t.finalPrice ?? t.estimatedPrice ?? 0), 0);

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-1">Mi historial</h1>
      <p className="text-[13.5px] text-zipi-muted mb-5">{data?.total ?? 0} viajes en total</p>

      {/* Earnings summary */}
      {trips.length > 0 && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-5 flex items-center justify-between">
          <div>
            <p className="text-[12.5px] text-zipi-muted mb-1">Total ganado</p>
            <p className="text-[28px] font-extrabold text-zipi-ink tracking-tight">
              ${totalEarned.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-extrabold text-zipi-ink">
              {trips.filter((t: any) => t.status === 'COMPLETED').length}
            </p>
            <p className="text-[11.5px] text-zipi-muted">completados</p>
          </div>
        </div>
      )}

      {/* Trips list */}
      <div className="space-y-3">
        {trips.length === 0 && (
          <div className="bg-white border border-zipi-rim rounded-[22px] p-10 shadow-zipi text-center">
            <Car size={44} className="text-zipi-faint mx-auto mb-3" strokeWidth={1.6} />
            <p className="text-[15px] font-bold text-zipi-muted">Sin viajes realizados aún</p>
          </div>
        )}
        {trips.map((trip: any) => {
          const meta = STATUS_META[trip.status] ?? STATUS_META.PENDING;
          const isCancelled = trip.status === 'CANCELLED';
          const price = trip.finalPrice ?? trip.estimatedPrice;
          return (
            <div key={trip.id} className="bg-white border border-zipi-rim rounded-[16px] p-4 shadow-zipi">
              <div className="flex items-start gap-3">
                <div
                  className="w-[42px] h-[42px] rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(239,144,8,0.1)' }}
                >
                  <Car size={20} style={{ color: '#EF9008' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span
                      className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: meta.bg, color: meta.fg }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[11.5px] text-zipi-faint">
                      {new Date(trip.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[13px] text-zipi-muted truncate flex items-center gap-1">
                      <Navigation size={11} style={{ color: '#0E9E6E' }} className="shrink-0" />
                      {trip.originAddress}
                    </p>
                    <p className="text-[13.5px] font-semibold text-zipi-ink truncate flex items-center gap-1">
                      <MapPin size={11} className="text-zipi-500 shrink-0" />
                      {trip.destAddress}
                    </p>
                  </div>
                  {trip.passenger && (
                    <p className="text-[12px] text-zipi-faint mt-1">Pasajero: {trip.passenger.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p
                    className="text-[15px] font-extrabold"
                    style={{ color: isCancelled ? '#a39e95' : '#1a1714', textDecoration: isCancelled ? 'line-through' : 'none' }}
                  >
                    ${price?.toLocaleString('es-AR')}
                  </p>
                  {trip.driverRating && (
                    <div className="flex items-center gap-0.5 justify-end mt-0.5">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-[12px] font-semibold text-zipi-ink">{trip.driverRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
