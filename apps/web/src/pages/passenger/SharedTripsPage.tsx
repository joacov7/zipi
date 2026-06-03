import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Link } from 'react-router-dom';
import { Clock, Users, Plus, X, Check } from 'lucide-react';

interface Participant {
  id: string;
  userId: string;
  status: string;
  user: { name: string };
}

interface SharedTrip {
  id: string;
  originAddress: string;
  destAddress: string;
  departureTime: string;
  totalSeats: number;
  costPerSeat: number;
  description?: string;
  status: 'OPEN' | 'FULL' | 'DEPARTED' | 'CANCELLED';
  publisher: { id: string; name: string };
  participants: Participant[];
}

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

function RoleBadge({ role }: { role: string }) {
  if (role === 'none') return null;
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    publisher: { bg: 'rgba(239,144,8,0.12)', fg: '#d46a04', label: 'Tu viaje' },
    confirmed: { bg: 'rgba(14,158,110,0.14)', fg: '#0E9E6E', label: 'Confirmado' },
    pending: { bg: 'rgba(245,166,35,0.16)', fg: '#C77A00', label: 'Pendiente' },
  };
  const m = map[role];
  if (!m) return null;
  return (
    <span
      className="text-[11px] font-bold rounded-full px-2.5 py-1"
      style={{ background: m.bg, color: m.fg }}
    >
      {m.label}
    </span>
  );
}

function TripCard({ trip, userId }: { trip: SharedTrip; userId: string }) {
  const queryClient = useQueryClient();
  const confirmed = trip.participants.filter((p) => p.status === 'CONFIRMED').length;
  const myParticipant = trip.participants.find((p) => p.userId === userId);
  const isPublisher = trip.publisher.id === userId;
  const seatsLeft = trip.totalSeats - confirmed;
  const role = isPublisher
    ? 'publisher'
    : myParticipant?.status === 'CONFIRMED'
    ? 'confirmed'
    : myParticipant?.status === 'PENDING'
    ? 'pending'
    : 'none';
  const canJoin = role === 'none' && trip.status === 'OPEN' && seatsLeft > 0;

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/shared-trips/${trip.id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trips'] }),
  });

  const when = new Date(trip.departureTime).toLocaleString('es-AR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Link
      to={`/shared-trips/${trip.id}`}
      className="block bg-white border border-zipi-rim rounded-[22px] p-4 shadow-zipi hover:shadow-md transition-shadow"
    >
      {/* Route + price */}
      <div className="flex justify-between gap-3 mb-3.5">
        <div className="flex gap-2.5 flex-1 min-w-0">
          {/* Connector */}
          <div className="flex flex-col items-center pt-1 shrink-0">
            <span className="w-[9px] h-[9px] rounded-full border-2 border-zipi-ink" />
            <span className="w-0.5 bg-zipi-rim flex-1 my-[3px] min-h-4" />
            <span className="w-[9px] h-[9px] rounded-[2px] bg-zipi-500" />
          </div>
          {/* Addresses */}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] text-zipi-muted truncate mb-2">{trip.originAddress}</p>
            <p className="text-[14.5px] font-bold text-zipi-ink truncate">{trip.destAddress}</p>
          </div>
        </div>
        {/* Price */}
        <div className="text-right shrink-0">
          <p className="text-[19px] font-extrabold text-zipi-500 leading-none tracking-tight">
            ${trip.costPerSeat.toLocaleString('es-AR')}
          </p>
          <p className="text-[11px] text-zipi-faint mt-1">por asiento</p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 pt-3 border-t border-zipi-rim text-[12.5px] text-zipi-muted">
        <span className="flex items-center gap-1.5">
          <Clock size={14} className="opacity-60" />
          {when}
        </span>
        <span className="flex items-center gap-1.5">
          <Users size={14} className="opacity-60" />
          {seatsLeft} libre{seatsLeft !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Publisher row */}
      <div className="flex items-center justify-between mt-3.5">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar name={trip.publisher.name} size={26} />
          <span className="text-[12.5px] text-zipi-muted truncate">{trip.publisher.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <RoleBadge role={role} />
          {canJoin && (
            <button
              onClick={(e) => {
                e.preventDefault();
                joinMutation.mutate();
              }}
              disabled={joinMutation.isPending}
              className="text-[12.5px] font-bold text-white bg-zipi-ink rounded-full px-3.5 py-[7px] hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              {joinMutation.isPending ? '...' : 'Solicitar lugar'}
            </button>
          )}
          {trip.status === 'FULL' && role === 'none' && (
            <span className="text-[11.5px] font-bold text-zipi-faint">Completo</span>
          )}
        </div>
      </div>
    </Link>
  );
}

function PublishSheet({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    originAddress: '',
    destAddress: '',
    departureTime: '',
    totalSeats: 3,
    totalCost: 0,
    description: '',
  });
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/shared-trips', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-trips'] });
      setDone(true);
    },
  });

  const costPerSeat = form.totalSeats > 0 ? Math.ceil(form.totalCost / form.totalSeats) : 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 flex items-end backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-h-[90dvh] overflow-y-auto bg-white rounded-t-[26px] px-5 pb-8 pt-3"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-[5px] rounded-full bg-zipi-rim mx-auto mb-4" />

        {done ? (
          <div className="text-center py-4 pb-2">
            <div className="w-16 h-16 rounded-full bg-zipi-500/10 text-zipi-500 flex items-center justify-center mx-auto mb-4">
              <Check size={34} strokeWidth={2.6} />
            </div>
            <h3 className="text-[19px] font-extrabold text-zipi-ink mb-1.5">¡Viaje publicado!</h3>
            <p className="text-[14px] text-zipi-muted leading-relaxed mb-6">
              Ya aparece en Disponibles. Te avisamos cuando alguien pida un lugar.
            </p>
            <button
              onClick={onClose}
              className="h-[54px] w-full rounded-2xl font-bold text-white bg-zipi-ink hover:opacity-90 transition-opacity"
            >
              Listo
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-[19px] font-extrabold text-zipi-ink mb-4">
              Publicar viaje compartido
            </h3>
            <div className="space-y-3.5">
              <div>
                <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Desde</label>
                <input
                  className="w-full h-12 border border-zipi-rim rounded-[13px] px-3.5 text-[14px] text-zipi-ink placeholder:text-zipi-faint focus:outline-none focus:border-zipi-500 transition-colors bg-white"
                  placeholder="Ej: Villa del Parque, CABA"
                  value={form.originAddress}
                  onChange={(e) => setForm({ ...form, originAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Hasta</label>
                <input
                  className="w-full h-12 border border-zipi-rim rounded-[13px] px-3.5 text-[14px] text-zipi-ink placeholder:text-zipi-faint focus:outline-none focus:border-zipi-500 transition-colors bg-white"
                  placeholder="Ej: UBA Ciudad Universitaria"
                  value={form.destAddress}
                  onChange={(e) => setForm({ ...form, destAddress: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">
                  Fecha y hora de salida
                </label>
                <input
                  type="datetime-local"
                  className="w-full h-12 border border-zipi-rim rounded-[13px] px-3.5 text-[14px] text-zipi-ink focus:outline-none focus:border-zipi-500 transition-colors bg-white"
                  value={form.departureTime}
                  onChange={(e) => setForm({ ...form, departureTime: e.target.value })}
                />
              </div>

              {/* Seats + Cost */}
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="text-[12.5px] font-bold text-zipi-ink mb-1.5">Asientos</div>
                  <div className="flex items-center justify-between h-12 border border-zipi-rim rounded-[13px] px-1.5 bg-white">
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, totalSeats: Math.max(1, form.totalSeats - 1) })
                      }
                      className="w-9 h-9 rounded-[10px] bg-zipi-surface2 flex items-center justify-center text-[18px] font-bold text-zipi-ink hover:bg-zipi-rim transition-colors"
                    >
                      −
                    </button>
                    <span className="text-[16px] font-extrabold text-zipi-ink">
                      {form.totalSeats}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, totalSeats: Math.min(6, form.totalSeats + 1) })
                      }
                      className="w-9 h-9 rounded-[10px] bg-zipi-surface2 flex items-center justify-center hover:bg-zipi-rim transition-colors text-zipi-ink"
                    >
                      <Plus size={17} strokeWidth={2.4} />
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-bold text-zipi-ink mb-1.5">Costo total $</div>
                  <input
                    type="number"
                    placeholder="0"
                    className="w-full h-12 border border-zipi-rim rounded-[13px] px-3.5 text-[15px] font-bold text-zipi-ink placeholder:text-zipi-faint focus:outline-none focus:border-zipi-500 transition-colors bg-white"
                    value={form.totalCost || ''}
                    onChange={(e) => setForm({ ...form, totalCost: +e.target.value })}
                  />
                </div>
              </div>

              {/* Per-seat calc */}
              {costPerSeat > 0 && (
                <div
                  className="flex items-center gap-2.5 rounded-[13px] px-4 py-3.5"
                  style={{
                    background: 'rgba(239,144,8,0.09)',
                    border: '1px solid rgba(239,144,8,0.25)',
                  }}
                >
                  <Users size={20} className="text-zipi-500 shrink-0 opacity-70" />
                  <span className="flex-1 text-[13.5px] text-zipi-muted">Cada pasajero paga</span>
                  <span className="text-[17px] font-extrabold text-zipi-500">
                    ${costPerSeat.toLocaleString('es-AR')}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">
                  Comentario{' '}
                  <span className="text-zipi-faint font-normal">(opcional)</span>
                </label>
                <input
                  className="w-full h-12 border border-zipi-rim rounded-[13px] px-3.5 text-[14px] text-zipi-ink placeholder:text-zipi-faint focus:outline-none focus:border-zipi-500 transition-colors bg-white"
                  placeholder="Ej: Salgo puntual, equipaje liviano"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={onClose}
                className="h-[54px] flex-1 rounded-2xl font-bold text-zipi-muted bg-zipi-surface2 hover:bg-zipi-rim transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => mutation.mutate(form)}
                disabled={
                  mutation.isPending ||
                  !form.originAddress ||
                  !form.destAddress ||
                  !form.departureTime ||
                  form.totalCost <= 0
                }
                className="h-[54px] flex-1 rounded-2xl font-bold text-white bg-zipi-ink hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                {mutation.isPending ? 'Publicando...' : 'Publicar viaje'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SharedTripsPage() {
  const { user } = useAuthStore();
  const [showPublish, setShowPublish] = useState(false);
  const [tab, setTab] = useState<'all' | 'mine'>('all');

  const { data: allTrips = [], isLoading } = useQuery<SharedTrip[]>({
    queryKey: ['shared-trips'],
    queryFn: () => api.get('/shared-trips').then((r) => r.data),
    enabled: tab === 'all',
  });

  const { data: mine, isLoading: mineLoading } = useQuery<{
    published: SharedTrip[];
    joined: SharedTrip[];
  }>({
    queryKey: ['shared-trips-mine'],
    queryFn: () => api.get('/shared-trips/mine').then((r) => r.data),
    enabled: tab === 'mine',
  });

  const displayTrips =
    tab === 'all' ? allTrips : [...(mine?.published ?? []), ...(mine?.joined ?? [])];
  const loading = tab === 'all' ? isLoading : mineLoading;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight leading-tight">
          Viajes compartidos
        </h1>
        <button
          onClick={() => setShowPublish(true)}
          className="flex items-center gap-1.5 h-10 px-3.5 rounded-xl bg-zipi-ink text-white text-[13.5px] font-bold hover:opacity-90 transition-opacity shrink-0 mt-1"
        >
          <Plus size={17} strokeWidth={2.4} />
          Publicar
        </button>
      </div>
      <p className="text-[13.5px] text-zipi-muted mb-5">
        Viajá con otros y dividí el costo del viaje.
      </p>

      {/* Tabs */}
      <div className="flex gap-1 bg-zipi-surface2 rounded-xl p-1 mb-5">
        {(['all', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-[9px] text-[13.5px] font-bold rounded-[9px] transition-all ${
              tab === t
                ? 'bg-white text-zipi-ink shadow-sm'
                : 'text-zipi-muted hover:text-zipi-ink'
            }`}
          >
            {t === 'all' ? 'Disponibles' : 'Mis viajes'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zipi-ink" />
        </div>
      ) : displayTrips.length === 0 ? (
        <div className="text-center py-14">
          <div className="flex justify-center mb-3 text-zipi-faint opacity-60">
            <Users size={44} strokeWidth={1.6} />
          </div>
          <p className="text-[15px] font-bold text-zipi-muted">
            {tab === 'all' ? 'No hay viajes disponibles' : 'No tenés viajes todavía'}
          </p>
          <p className="text-[13px] text-zipi-faint mt-1">
            {tab === 'all'
              ? '¡Sé el primero en publicar uno!'
              : 'Publicá uno o sumate a uno disponible.'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {displayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} userId={user?.id ?? ''} />
          ))}
        </div>
      )}

      {showPublish && <PublishSheet onClose={() => setShowPublish(false)} />}
    </div>
  );
}
