import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useEffect, useState, lazy, Suspense } from 'react';
import { getSocket } from '../../lib/socket';
import { SocketEvent } from '@zipi/shared';
import { Phone, Star, MapPin, Car, Clock, AlertTriangle, ShieldAlert, Receipt, Navigation } from 'lucide-react';
import TripChat from '../../components/chat/TripChat';
import { CANCELLATION_FEE_AFTER_ACCEPT } from '@zipi/shared';

const TripMap = lazy(() => import('../../components/map/TripMap'));

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:   { label: 'Buscando conductor...',  bg: 'rgba(239,144,8,0.12)',   fg: '#C77A00' },
  ACCEPTED:  { label: 'Conductor en camino',    bg: 'rgba(47,107,236,0.12)',  fg: '#2F6BEC' },
  IN_PROGRESS: { label: 'En viaje',             bg: 'rgba(14,158,110,0.12)',  fg: '#0E9E6E' },
  COMPLETED: { label: 'Viaje completado',       bg: 'rgba(163,158,149,0.12)', fg: '#6b6760' },
  CANCELLED: { label: 'Viaje cancelado',        bg: 'rgba(224,62,99,0.12)',   fg: '#E03E63' },
};

function Stars({ value, hover, onSelect, onHover }: { value: number; hover: number; onSelect: (n: number) => void; onHover: (n: number) => void }) {
  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          onMouseEnter={() => onHover(s)}
          onMouseLeave={() => onHover(0)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            size={36}
            className={`transition-colors ${s <= (hover || value) ? 'text-amber-400 fill-amber-400' : 'text-zipi-rim'}`}
          />
        </button>
      ))}
    </div>
  );
}

export default function TripTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosContacts, setSosContacts] = useState<any[] | null>(null);

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip', id],
    queryFn: () => api.get(`/trips/${id}`).then((r) => r.data),
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: () =>
      api.patch(`/trips/${id}/status`, { status: 'CANCELLED', cancelReason: 'Cancelado por pasajero' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
  });

  const rateMutation = useMutation({
    mutationFn: (rating: number) => api.post(`/trips/${id}/rate`, { rating }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip', id] }),
  });

  useEffect(() => {
    const socket = getSocket();
    socket.on(SocketEvent.TRIP_ACCEPTED, () => queryClient.invalidateQueries({ queryKey: ['trip', id] }));
    socket.on(SocketEvent.TRIP_STARTED, () => queryClient.invalidateQueries({ queryKey: ['trip', id] }));
    socket.on(SocketEvent.TRIP_COMPLETED, () => queryClient.invalidateQueries({ queryKey: ['trip', id] }));
    return () => {
      socket.off(SocketEvent.TRIP_ACCEPTED);
      socket.off(SocketEvent.TRIP_STARTED);
      socket.off(SocketEvent.TRIP_COMPLETED);
    };
  }, [id, queryClient]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zipi-500" />
      </div>
    );
  }

  if (!trip) return null;

  const statusMeta = STATUS_META[trip.status] ?? STATUS_META.PENDING;

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight">Tu viaje</h1>
        <span
          className="text-[12px] font-bold px-3 py-1.5 rounded-full"
          style={{ background: statusMeta.bg, color: statusMeta.fg }}
        >
          {statusMeta.label}
        </span>
      </div>

      {/* Map */}
      {trip.originLat && trip.destLat && (
        <div className="rounded-[22px] overflow-hidden mb-4 shadow-zipi border border-zipi-rim">
          <Suspense fallback={<div className="h-52 bg-zipi-surface2 animate-pulse" />}>
            <TripMap
              originLat={trip.originLat}
              originLng={trip.originLng}
              originAddress={trip.originAddress}
              destLat={trip.destLat}
              destLng={trip.destLng}
              destAddress={trip.destAddress}
              driverId={trip.driver?.id}
              driverInitialLat={trip.driver?.currentLat}
              driverInitialLng={trip.driver?.currentLng}
              driverName={trip.driver?.user?.name}
              tripStatus={trip.status}
            />
          </Suspense>
        </div>
      )}

      {/* Pending bounce */}
      {trip.status === 'PENDING' && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-6 shadow-zipi text-center mb-4">
          <div
            className="animate-bounce w-[60px] h-[60px] rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(239,144,8,0.12)' }}
          >
            <Car size={30} style={{ color: '#EF9008' }} />
          </div>
          <p className="text-[15px] font-bold text-zipi-ink">Buscando tu conductor...</p>
          <p className="text-[13px] text-zipi-muted mt-1">En unos momentos alguien aceptará tu viaje</p>
        </div>
      )}

      {/* Driver card */}
      {trip.driver && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <p className="text-[12.5px] font-bold text-zipi-faint uppercase tracking-[0.05em] mb-3">Tu conductor</p>
          <div className="flex items-center gap-3.5">
            <div
              className="w-[52px] h-[52px] rounded-full flex items-center justify-center font-bold text-white text-[20px] shrink-0"
              style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
            >
              {trip.driver.user.name.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-[16px] font-bold text-zipi-ink">{trip.driver.user.name}</p>
              <p className="text-[12.5px] text-zipi-muted">{trip.driver.vehicleModel} · {trip.driver.vehiclePlate}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Star size={12} className="text-amber-400 fill-amber-400" />
                <span className="text-[12px] font-semibold text-zipi-ink">{trip.driver.rating?.toFixed(1)}</span>
              </div>
            </div>
            <a
              href={`tel:${trip.driver.user.phone}`}
              className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
              style={{ background: 'rgba(14,158,110,0.12)' }}
            >
              <Phone size={19} style={{ color: '#0E9E6E' }} />
            </a>
          </div>
        </div>
      )}

      {/* Route */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="flex flex-col items-center shrink-0 pt-1">
            <span className="w-[9px] h-[9px] rounded-full border-2 border-zipi-ink bg-white" />
            <span className="w-px flex-1 min-h-[28px] bg-zipi-rim my-1" />
            <span className="w-[9px] h-[9px] rounded-[3px] bg-zipi-500" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <p className="text-[11px] text-zipi-faint mb-0.5">Origen</p>
              <p className="text-[14px] font-semibold text-zipi-ink">{trip.originAddress}</p>
            </div>
            <div>
              <p className="text-[11px] text-zipi-faint mb-0.5">Destino</p>
              <p className="text-[14px] font-semibold text-zipi-ink">{trip.destAddress}</p>
            </div>
          </div>
        </div>
        {trip.estimatedMinutes && (
          <div className="flex items-center gap-1.5 text-[12.5px] text-zipi-muted pt-2 border-t border-zipi-rim">
            <Clock size={12} />
            <span>~{trip.estimatedMinutes} min · {trip.distanceKm} km</span>
          </div>
        )}
      </div>

      {/* Price */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi flex items-center justify-between mb-4">
        <p className="text-[13.5px] text-zipi-muted font-semibold">Precio estimado</p>
        <p className="text-[28px] font-extrabold text-zipi-500 tracking-tight">
          ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
        </p>
      </div>

      {/* Chat */}
      {['ACCEPTED', 'IN_PROGRESS'].includes(trip.status) && trip.driver && (
        <div className="mb-4">
          <TripChat tripId={trip.id} />
        </div>
      )}

      {/* SOS */}
      {['ACCEPTED', 'IN_PROGRESS'].includes(trip.status) && (
        <div className="mb-4">
          {sosContacts ? (
            <div
              className="rounded-[22px] p-[18px] space-y-3"
              style={{ background: 'rgba(224,62,99,0.08)', border: '1px solid rgba(224,62,99,0.25)' }}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} style={{ color: '#E03E63' }} />
                <p className="font-bold text-[14px]" style={{ color: '#C03053' }}>SOS activado — Contactos de emergencia</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {sosContacts.map((c: any) => (
                  <a
                    key={c.phone}
                    href={`tel:${c.phone}`}
                    className="bg-white border rounded-[13px] py-2.5 px-3 text-center hover:bg-zipi-surface2"
                    style={{ borderColor: 'rgba(224,62,99,0.25)' }}
                  >
                    <p className="font-bold text-[15px]" style={{ color: '#E03E63' }}>{c.phone}</p>
                    <p className="text-[11px] text-zipi-muted">{c.label}</p>
                  </a>
                ))}
              </div>
              <button onClick={() => setSosContacts(null)} className="text-[12px] text-zipi-faint hover:text-zipi-muted">
                Cerrar
              </button>
            </div>
          ) : (
            <button
              onClick={async () => {
                if (!confirm('¿Activar SOS? Se alertará a nuestro equipo de seguridad.')) return;
                setSosLoading(true);
                try {
                  const { data } = await api.post(`/trips/${trip.id}/sos`);
                  setSosContacts(data.emergencyContacts);
                } finally {
                  setSosLoading(false);
                }
              }}
              disabled={sosLoading}
              className="w-full h-[50px] rounded-[16px] font-bold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
              style={{ background: '#E03E63' }}
            >
              <ShieldAlert size={18} />
              {sosLoading ? 'Activando...' : 'SOS — Emergencia'}
            </button>
          )}
        </div>
      )}

      {/* Invoice */}
      {trip.status === 'COMPLETED' && (
        <button
          onClick={() => window.open(`/invoice/${trip.id}`, '_blank')}
          className="w-full h-[46px] flex items-center justify-center gap-2 text-[13.5px] font-semibold text-zipi-muted hover:text-zipi-ink bg-white border border-zipi-rim rounded-[16px] mb-4 transition-colors"
        >
          <Receipt size={15} />
          Ver recibo
        </button>
      )}

      {/* Cancel */}
      {['PENDING', 'ACCEPTED'].includes(trip.status) && (
        <div className="space-y-2 mb-4">
          {trip.status === 'ACCEPTED' && (
            <div
              className="flex items-center gap-2.5 rounded-[13px] p-3 text-[13px]"
              style={{ background: 'rgba(239,144,8,0.1)', border: '1px solid rgba(239,144,8,0.3)' }}
            >
              <AlertTriangle size={15} style={{ color: '#C77A00' }} className="shrink-0" />
              <span style={{ color: '#C77A00' }}>
                Cancelar ahora tiene un cargo de <strong>${CANCELLATION_FEE_AFTER_ACCEPT.toLocaleString('es-AR')}</strong>
              </span>
            </div>
          )}
          <button
            onClick={() => {
              const msg = trip.status === 'ACCEPTED'
                ? `¿Cancelar el viaje? Se aplicará un cargo de $${CANCELLATION_FEE_AFTER_ACCEPT.toLocaleString('es-AR')}`
                : '¿Cancelar el viaje?';
              if (confirm(msg)) cancelMutation.mutate();
            }}
            disabled={cancelMutation.isPending}
            className="w-full h-[50px] rounded-[16px] font-bold text-[14px] border-2 transition-colors disabled:opacity-50"
            style={{ borderColor: '#E03E63', color: '#E03E63', background: 'transparent' }}
          >
            {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar viaje'}
          </button>
        </div>
      )}

      {/* Completed / Rating */}
      {trip.status === 'COMPLETED' && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-6 shadow-zipi text-center space-y-4">
          <div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ background: 'rgba(14,158,110,0.12)' }}
            >
              <span className="text-[28px]">🎉</span>
            </div>
            <p className="text-[18px] font-extrabold text-zipi-ink">¡Llegaste!</p>
            <p className="text-[13.5px] text-zipi-muted mt-1">
              Precio final:{' '}
              <span className="font-bold text-zipi-500">
                ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
              </span>
            </p>
          </div>

          {!trip.passengerRating ? (
            <div className="space-y-3">
              <p className="text-[13.5px] font-bold text-zipi-ink">¿Cómo fue el viaje?</p>
              <Stars value={selectedRating} hover={hoverRating} onSelect={setSelectedRating} onHover={setHoverRating} />
              {selectedRating > 0 && (
                <button
                  onClick={() => rateMutation.mutate(selectedRating)}
                  disabled={rateMutation.isPending}
                  className="h-[50px] w-full rounded-2xl font-bold text-white disabled:opacity-50"
                  style={{ background: '#1A1714' }}
                >
                  {rateMutation.isPending ? 'Enviando...' : `Calificar con ${selectedRating} ⭐`}
                </button>
              )}
              <button
                onClick={() => navigate('/home')}
                className="w-full h-[46px] rounded-[16px] font-semibold text-[13.5px] text-zipi-muted bg-zipi-surface2 hover:bg-zipi-rim transition-colors"
              >
                Saltar y volver al inicio
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[13px] text-zipi-muted">Ya calificaste este viaje con {trip.passengerRating} ⭐</p>
              <button
                onClick={() => navigate('/home')}
                className="h-[50px] w-full rounded-2xl font-bold text-white"
                style={{ background: '#1A1714' }}
              >
                Volver al inicio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
