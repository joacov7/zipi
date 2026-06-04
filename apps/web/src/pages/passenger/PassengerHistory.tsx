import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Star, MapPin, Navigation, Receipt, X } from 'lucide-react';
import { DuoIcon } from '../../components/ui/DuoIcon';

type Filter = 'all' | 'trips' | 'deliveries';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptado',
  IN_PROGRESS: 'En viaje',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
  PICKED_UP: 'Recogido',
  IN_TRANSIT: 'En tránsito',
  DELIVERED: 'Entregado',
};

function groupByDate(items: any[]) {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const map = new Map<string, any[]>();
  items.forEach((item) => {
    const d = new Date(item.createdAt);
    let label: string;
    if (d.toDateString() === today.toDateString()) label = 'Hoy';
    else if (d.toDateString() === yesterday.toDateString()) label = 'Ayer';
    else
      label = d.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    if (!map.has(label)) map.set(label, []);
    map.get(label)!.push(item);
  });
  return Array.from(map.entries()).map(([label, items]) => ({ label, items }));
}

function TripReceiptModal({ trip, onClose }: { trip: any; onClose: () => void }) {
  const price = trip.finalPrice ?? trip.estimatedPrice;
  const paid = price - (trip.discountAmount ?? 0);
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[26px] w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zipi-rim">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-zipi-500" />
            <h2 className="font-bold text-zipi-ink text-[15px]">Recibo del viaje</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zipi-surface2 text-zipi-muted"
          >
            <X size={17} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span
              className="text-[11.5px] font-bold rounded-full px-3 py-1"
              style={
                trip.status === 'COMPLETED'
                  ? { background: 'rgba(14,158,110,0.14)', color: '#0E9E6E' }
                  : trip.status === 'CANCELLED'
                    ? { background: 'rgba(224,62,99,0.12)', color: '#E03E63' }
                    : { background: 'rgba(239,144,8,0.12)', color: '#C77A00' }
              }
            >
              {STATUS_LABELS[trip.status] ?? trip.status}
            </span>
            <span className="text-[11.5px] text-zipi-faint">
              {new Date(trip.createdAt).toLocaleString('es-AR', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <div className="bg-zipi-surface2 rounded-[13px] p-3.5 space-y-2.5">
            <div className="flex items-start gap-2.5">
              <Navigation size={13} className="text-[#0E9E6E] mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-zipi-faint">Origen</p>
                <p className="text-[13.5px] font-semibold text-zipi-ink">{trip.originAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <MapPin size={13} className="text-zipi-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-zipi-faint">Destino</p>
                <p className="text-[13.5px] font-semibold text-zipi-ink">{trip.destAddress}</p>
              </div>
            </div>
            {trip.distanceKm && (
              <p className="text-[11.5px] text-zipi-faint flex items-center gap-1 pt-1">
                <DuoIcon name="clock" size={11} />
                {trip.distanceKm} km · {trip.estimatedMinutes} min
              </p>
            )}
          </div>
          {trip.driver && (
            <div className="flex items-center gap-3 border border-zipi-rim rounded-[13px] p-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-[14px] shrink-0"
                style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
              >
                {trip.driver.user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="text-[13.5px] font-semibold text-zipi-ink">{trip.driver.user.name}</p>
                <p className="text-[12px] text-zipi-muted">
                  {trip.driver.vehicleModel} · {trip.driver.vehiclePlate}
                </p>
              </div>
              {trip.passengerRating && (
                <div className="flex items-center gap-1">
                  <Star size={13} className="text-amber-400 fill-amber-400" />
                  <span className="text-[13px] font-semibold">{trip.passengerRating}</span>
                </div>
              )}
            </div>
          )}
          <div className="border-t border-dashed border-zipi-rim pt-3 space-y-2">
            <div className="flex justify-between text-[13.5px] text-zipi-muted">
              <span>Precio base</span>
              <span>${price?.toLocaleString('es-AR')}</span>
            </div>
            {trip.surgeMultiplier > 1 && (
              <div className="flex justify-between text-[13.5px] text-amber-600">
                <span>Tarifa dinámica (×{trip.surgeMultiplier})</span>
                <span>incluida</span>
              </div>
            )}
            {trip.discountAmount > 0 && (
              <div className="flex justify-between text-[13.5px]" style={{ color: '#0E9E6E' }}>
                <span>Descuento ({trip.discountCode})</span>
                <span>-${trip.discountAmount?.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-zipi-ink text-[15px] border-t border-zipi-rim pt-2">
              <span>Total</span>
              <span className="text-zipi-500">
                ${(paid + (trip.cancellationFee ?? 0)).toLocaleString('es-AR')}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassengerHistory() {
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  const { data: tripsData } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => api.get('/users/me/trips').then((r) => r.data),
  });

  const { data: deliveriesData } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => api.get('/users/me/deliveries').then((r) => r.data),
  });

  const trips: any[] = tripsData?.data ?? [];
  const deliveries: any[] = deliveriesData?.data ?? [];

  const allItems = [
    ...trips.map((t: any) => ({ ...t, _kind: 'trip' })),
    ...deliveries.map((d: any) => ({ ...d, _kind: 'delivery' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const displayed =
    filter === 'all'
      ? allItems
      : filter === 'trips'
        ? allItems.filter((i) => i._kind === 'trip')
        : allItems.filter((i) => i._kind === 'delivery');

  const groups = groupByDate(displayed);

  const totalSpent = trips
    .filter((t: any) => t.status === 'COMPLETED')
    .reduce((sum: number, t: any) => sum + (t.finalPrice ?? t.estimatedPrice ?? 0), 0);

  const FILTERS: { id: Filter; label: string }[] = [
    { id: 'all', label: 'Todos' },
    { id: 'trips', label: 'Viajes' },
    { id: 'deliveries', label: 'Envíos' },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {selectedTrip && (
        <TripReceiptModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      )}

      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-5">Actividad</h1>

      {/* Spend summary */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-4 shadow-zipi flex items-center gap-3.5 mb-5">
        <div
          className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
          style={{ background: 'rgba(239,144,8,0.12)', color: '#EF9008' }}
        >
          <Receipt size={23} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[12.5px] text-zipi-muted font-semibold">Total gastado</p>
          <p
            className="text-[22px] font-extrabold text-zipi-ink tracking-tight"
            style={{ letterSpacing: '-0.02em' }}
          >
            ${totalSpent.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[18px] font-extrabold text-zipi-ink">{trips.length}</p>
          <p className="text-[11.5px] text-zipi-muted">servicios</p>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-4 py-[9px] rounded-full text-[13.5px] font-bold transition-colors border"
            style={
              filter === f.id
                ? { background: '#1A1714', color: '#f4f2ee', borderColor: '#1A1714' }
                : { background: '#fff', color: '#6b6760', borderColor: '#ebe7df' }
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Grouped list */}
      {groups.length === 0 ? (
        <div className="text-center py-14">
          <div className="mx-auto mb-3 w-fit opacity-60" style={{ color: '#a39e95' }}>
              <DuoIcon name="clock" size={44} stroke={1.6} fillOpacity={0.1} />
            </div>
          <p className="text-[15px] font-bold text-zipi-muted">Sin actividad todavía</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map(({ label, items }) => (
            <div key={label}>
              <p className="text-[12px] font-bold text-zipi-faint uppercase tracking-[0.05em] mb-2.5">
                {label}
              </p>
              <div className="flex flex-col gap-2.5">
                {items.map((item: any) => {
                  const isTrip = item._kind === 'trip';
                  const price = item.finalPrice ?? item.estimatedPrice ?? item.price;
                  const isCompleted = item.status === 'COMPLETED' || item.status === 'DELIVERED';
                  const isCancelled = item.status === 'CANCELLED';
                  return (
                    <button
                      key={item.id}
                      onClick={() => isTrip && setSelectedTrip(item)}
                      className="flex items-center gap-3 bg-white border border-zipi-rim rounded-[16px] p-3.5 shadow-zipi hover:shadow-md transition-shadow text-left w-full"
                    >
                      <div
                        className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
                        style={
                          isTrip
                            ? { background: 'rgba(239,144,8,0.1)', color: '#EF9008' }
                            : { background: 'rgba(47,107,236,0.1)', color: '#2F6BEC' }
                        }
                      >
                        {isTrip ? (
                          <DuoIcon name="car" size={22} stroke={2} />
                        ) : (
                          <DuoIcon name="package" size={22} stroke={2} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14.5px] font-bold text-zipi-ink truncate">
                          {isTrip ? item.destAddress : item.dropoffAddress}
                        </p>
                        <p className="text-[12.5px] text-zipi-muted">
                          {isTrip ? 'Remis' : 'Envío'}
                          {item.driver?.user?.name ? ` · ${item.driver.user.name}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className="text-[14.5px] font-bold"
                          style={{
                            color: isCancelled ? '#a39e95' : '#1a1714',
                            textDecoration: isCancelled ? 'line-through' : 'none',
                          }}
                        >
                          ${price?.toLocaleString('es-AR')}
                        </p>
                        <p
                          className="text-[11px] font-bold"
                          style={{ color: isCancelled ? '#E03E63' : isCompleted ? '#0E9E6E' : '#C77A00' }}
                        >
                          {STATUS_LABELS[item.status] ?? item.status}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
