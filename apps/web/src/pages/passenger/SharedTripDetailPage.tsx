import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Calendar, Users, Phone, Check, X, ArrowLeft, Trash2 } from 'lucide-react';

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      className="rounded-full bg-zipi-500/15 flex items-center justify-center font-bold text-zipi-500 shrink-0"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function Stars({ value }: { value?: number }) {
  const full = Math.round(value ?? 0);
  return (
    <span className="flex gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 12, color: i <= full ? '#EF9008' : '#d4cfc9' }}>
          ★
        </span>
      ))}
    </span>
  );
}

export default function SharedTripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: trip, isLoading } = useQuery({
    queryKey: ['shared-trip', id],
    queryFn: () => api.get(`/shared-trips/${id}`).then((r) => r.data),
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/shared-trips/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trip', id] }),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/shared-trips/${id}/leave`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trip', id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/shared-trips/${id}`),
    onSuccess: () => navigate('/shared-trips'),
  });

  const respondMutation = useMutation({
    mutationFn: ({
      participantUserId,
      accept,
    }: {
      participantUserId: string;
      accept: boolean;
    }) =>
      api.patch(
        `/shared-trips/${id}/participants/${participantUserId}/${accept ? 'accept' : 'reject'}`,
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trip', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zipi-ink" />
      </div>
    );
  }
  if (!trip) return null;

  const isPublisher = trip.publisher.id === user?.id;
  const myParticipant = trip.participants.find((p: any) => p.userId === user?.id);
  const confirmed = trip.participants.filter((p: any) => p.status === 'CONFIRMED');
  const pending = trip.participants.filter((p: any) => p.status === 'PENDING');
  const seatsLeft = trip.totalSeats - confirmed.length;
  const isCancelled = trip.status === 'CANCELLED';

  const role = isPublisher
    ? 'publisher'
    : myParticipant?.status === 'CONFIRMED'
    ? 'confirmed'
    : myParticipant?.status === 'PENDING'
    ? 'pending'
    : 'none';

  const statusMap: Record<string, { label: string; bg: string; fg: string }> = {
    OPEN: { label: 'Abierto', bg: 'rgba(14,158,110,0.14)', fg: '#0E9E6E' },
    FULL: { label: 'Completo', bg: 'rgba(47,107,236,0.14)', fg: '#2F6BEC' },
    DEPARTED: { label: 'Partió', bg: 'rgba(107,103,96,0.14)', fg: '#6b6760' },
    CANCELLED: { label: 'Cancelado', bg: 'rgba(224,62,99,0.12)', fg: '#E03E63' },
  };
  const st = statusMap[trip.status] || statusMap.OPEN;

  const whenFull = new Date(trip.departureTime).toLocaleString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-2xl mx-auto pb-32">
      {/* Back */}
      <button
        onClick={() => navigate('/shared-trips')}
        className="flex items-center gap-2 text-zipi-muted hover:text-zipi-ink text-[14px] font-medium mb-5 -ml-0.5"
      >
        <ArrowLeft size={18} />
        Volver
      </button>

      {/* Route card */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] mb-3.5 shadow-zipi">
        <div className="flex items-start justify-between mb-4">
          <span
            className="text-[11.5px] font-bold rounded-full px-3 py-[5px]"
            style={{ background: st.bg, color: st.fg }}
          >
            {st.label}
          </span>
          {!isCancelled && isPublisher && (
            <button
              onClick={() =>
                window.confirm('¿Cancelar el viaje?') && cancelMutation.mutate()
              }
              className="flex items-center gap-1.5 text-[13px] text-red-500 hover:text-red-700"
            >
              <Trash2 size={14} />
              Cancelar viaje
            </button>
          )}
        </div>

        {/* Route connector */}
        <div className="flex gap-3.5">
          <div className="flex flex-col items-center pt-[5px] shrink-0">
            <span className="w-[11px] h-[11px] rounded-full border-[2.5px] border-zipi-ink" />
            <span className="w-0.5 bg-zipi-rim flex-1 my-[5px] min-h-7" />
            <span className="w-[11px] h-[11px] rounded-[2px] bg-zipi-500" />
          </div>
          <div className="flex-1">
            <div className="mb-4">
              <p className="text-[11.5px] font-semibold text-zipi-faint mb-0.5">Desde</p>
              <p className="text-[15px] font-bold text-zipi-ink">{trip.originAddress}</p>
            </div>
            <div>
              <p className="text-[11.5px] font-semibold text-zipi-faint mb-0.5">Hasta</p>
              <p className="text-[15px] font-bold text-zipi-ink">{trip.destAddress}</p>
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-[18px] mt-4 pt-3.5 border-t border-zipi-rim text-[13px] text-zipi-muted">
          <span className="flex items-center gap-1.5">
            <Calendar size={16} className="opacity-60" />
            {whenFull}
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            <Users size={16} className="opacity-60" />
            {seatsLeft} libre{seatsLeft !== 1 ? 's' : ''}
          </span>
        </div>

        {trip.description && (
          <div className="mt-3.5 text-[13.5px] text-zipi-muted bg-zipi-surface2 rounded-xl px-3.5 py-3 leading-relaxed">
            {trip.description}
          </div>
        )}
      </div>

      {/* Price */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] mb-3.5 shadow-zipi flex items-center justify-between">
        <div>
          <p className="text-[12.5px] text-zipi-muted mb-1">Costo por asiento</p>
          <p className="text-[30px] font-extrabold text-zipi-500 leading-none tracking-tight">
            ${trip.costPerSeat.toLocaleString('es-AR')}
          </p>
        </div>
        <div className="text-right text-[12.5px] text-zipi-faint">
          <p>{trip.totalSeats} asientos</p>
          <p>${(trip.costPerSeat * trip.totalSeats).toLocaleString('es-AR')} total</p>
        </div>
      </div>

      {/* Publisher */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-4 mb-3.5 shadow-zipi">
        <p className="text-[11px] font-bold text-zipi-faint uppercase tracking-widest mb-3">
          Publicado por
        </p>
        <div className="flex items-center gap-3">
          <Avatar name={trip.publisher.name} size={46} />
          <div className="flex-1">
            <p className="text-[15px] font-bold text-zipi-ink">{trip.publisher.name}</p>
            {trip.publisher.rating != null && (
              <div className="flex items-center gap-1.5 mt-1">
                <Stars value={trip.publisher.rating} />
                <span className="text-[12.5px] text-zipi-muted">{trip.publisher.rating}</span>
              </div>
            )}
          </div>
          {trip.publisher.phone && (
            <a
              href={`tel:${trip.publisher.phone}`}
              className="w-11 h-11 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
              style={{ background: 'rgba(239,144,8,0.12)', color: '#ef9008' }}
            >
              <Phone size={19} />
            </a>
          )}
        </div>
      </div>

      {/* Confirmed passengers */}
      {confirmed.length > 0 && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-4 mb-3.5 shadow-zipi">
          <p className="text-[11px] font-bold text-zipi-faint uppercase tracking-widest mb-3">
            Pasajeros confirmados ({confirmed.length}/{trip.totalSeats})
          </p>
          <div className="flex flex-col gap-2.5">
            {confirmed.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <Avatar name={p.user.name} size={32} />
                <span className="flex-1 text-[14px] font-semibold text-zipi-ink">
                  {p.user.name}
                </span>
                <Check size={17} strokeWidth={2.6} style={{ color: '#0E9E6E' }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending requests (publisher only) */}
      {isPublisher && pending.length > 0 && (
        <div
          className="bg-white rounded-[22px] p-4 mb-3.5 shadow-zipi"
          style={{ border: '1px solid rgba(245,166,35,0.4)' }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-widest mb-3"
            style={{ color: '#C77A00' }}
          >
            Solicitudes pendientes ({pending.length})
          </p>
          <div className="flex flex-col gap-3">
            {pending.map((p: any) => (
              <div key={p.id} className="flex items-center gap-2.5">
                <Avatar name={p.user.name} size={32} />
                <span className="flex-1 text-[14px] font-semibold text-zipi-ink">
                  {p.user.name}
                </span>
                <button
                  onClick={() =>
                    respondMutation.mutate({ participantUserId: p.userId, accept: true })
                  }
                  disabled={seatsLeft === 0 || respondMutation.isPending}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-40"
                  style={{ background: 'rgba(14,158,110,0.14)', color: '#0E9E6E' }}
                >
                  <Check size={17} strokeWidth={2.6} />
                </button>
                <button
                  onClick={() =>
                    respondMutation.mutate({ participantUserId: p.userId, accept: false })
                  }
                  disabled={respondMutation.isPending}
                  className="w-9 h-9 rounded-full flex items-center justify-center hover:opacity-80 transition-opacity"
                  style={{ background: 'rgba(224,62,99,0.12)', color: '#E03E63' }}
                >
                  <X size={16} strokeWidth={2.4} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sticky CTA */}
      {!isCancelled && (
        <div className="sticky bottom-0 bg-white border-t border-zipi-rim pt-4 pb-6 mt-4">
          {role === 'none' && trip.status === 'OPEN' && (
            <button
              onClick={() => joinMutation.mutate()}
              disabled={joinMutation.isPending}
              className="h-[54px] w-full rounded-2xl font-bold text-white bg-zipi-ink hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {joinMutation.isPending
                ? 'Enviando solicitud...'
                : `Solicitar lugar · $${trip.costPerSeat.toLocaleString('es-AR')}`}
            </button>
          )}
          {role === 'none' && trip.status === 'FULL' && (
            <div className="text-center text-[13.5px] font-semibold text-zipi-muted bg-zipi-surface2 rounded-[14px] py-4">
              Viaje completo — sin asientos disponibles
            </div>
          )}
          {role === 'pending' && (
            <div className="flex flex-col gap-2.5">
              <div
                className="text-center text-[13px] font-semibold rounded-[13px] py-3"
                style={{ color: '#C77A00', background: 'rgba(245,166,35,0.14)' }}
              >
                Solicitud enviada — esperando confirmación
              </div>
              <button
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
                className="h-[54px] w-full rounded-2xl font-bold text-zipi-muted border border-zipi-rim hover:bg-zipi-surface2 transition-colors"
              >
                Cancelar solicitud
              </button>
            </div>
          )}
          {role === 'confirmed' && (
            <div className="flex flex-col gap-2.5">
              <div
                className="flex items-center justify-center gap-2 text-[13.5px] font-bold rounded-[13px] py-3.5"
                style={{ color: '#0E9E6E', background: 'rgba(14,158,110,0.12)' }}
              >
                <Check size={17} strokeWidth={2.6} />
                Tu lugar está confirmado
              </div>
              <button
                onClick={() =>
                  window.confirm('¿Abandonar este viaje?') && leaveMutation.mutate()
                }
                className="h-[54px] w-full rounded-2xl font-bold text-zipi-muted border border-zipi-rim hover:bg-zipi-surface2 transition-colors"
              >
                Abandonar viaje
              </button>
            </div>
          )}
          {role === 'publisher' && (
            <button className="h-[54px] w-full rounded-2xl font-bold text-zipi-600 bg-zipi-500/10 hover:bg-zipi-500/20 transition-colors">
              Gestionar mi viaje
            </button>
          )}
        </div>
      )}
    </div>
  );
}
