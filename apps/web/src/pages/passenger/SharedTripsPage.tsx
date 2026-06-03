import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Link } from 'react-router-dom';
import { MapPin, Clock, Users, Plus, X, Car } from 'lucide-react';

interface SharedTrip {
  id: string;
  originAddress: string;
  destAddress: string;
  departureTime: string;
  totalSeats: number;
  costPerSeat: number;
  description?: string;
  status: string;
  publisher: { id: string; name: string; avatarUrl?: string };
  participants: { id: string; userId: string; status: string; user: { name: string } }[];
}

function TripCard({ trip, userId }: { trip: SharedTrip; userId: string }) {
  const queryClient = useQueryClient();
  const confirmed = trip.participants.filter((p) => p.status === 'CONFIRMED').length;
  const myParticipant = trip.participants.find((p) => p.userId === userId);
  const isPublisher = trip.publisher.id === userId;
  const seatsLeft = trip.totalSeats - confirmed;

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/shared-trips/${trip.id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trips'] }),
  });

  const statusBadge = () => {
    if (myParticipant?.status === 'CONFIRMED') return <span className="badge bg-green-100 text-green-700">Confirmado</span>;
    if (myParticipant?.status === 'PENDING') return <span className="badge bg-amber-100 text-amber-700">Pendiente</span>;
    if (isPublisher) return <span className="badge bg-zipi-100 text-zipi-700">Tu viaje</span>;
    return null;
  };

  return (
    <Link to={`/shared-trips/${trip.id}`} className="card block hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <MapPin size={13} className="text-green-500 shrink-0" />
            <span className="truncate">{trip.originAddress}</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <MapPin size={13} className="text-red-500 shrink-0" />
            <span className="truncate">{trip.destAddress}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="text-xl font-bold text-zipi-600">${trip.costPerSeat.toLocaleString('es-AR')}</p>
          <p className="text-xs text-gray-400">por asiento</p>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-50 pt-3">
        <div className="flex items-center gap-1.5">
          <Clock size={13} />
          <span>{new Date(trip.departureTime).toLocaleString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={13} />
          <span>{seatsLeft} lugar{seatsLeft !== 1 ? 'es' : ''} libre{seatsLeft !== 1 ? 's' : ''}</span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
            {trip.publisher.name.charAt(0)}
          </div>
          <span className="text-xs text-gray-500">{trip.publisher.name}</span>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge()}
          {!myParticipant && !isPublisher && trip.status === 'OPEN' && seatsLeft > 0 && (
            <button
              onClick={(e) => { e.preventDefault(); joinMutation.mutate(); }}
              disabled={joinMutation.isPending}
              className="btn-primary text-xs py-1.5 px-3"
            >
              {joinMutation.isPending ? '...' : 'Solicitar lugar'}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

function PublishModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    originAddress: '',
    destAddress: '',
    departureTime: '',
    totalSeats: 3,
    totalCost: 0,
    description: '',
  });

  const mutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/shared-trips', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-trips'] });
      onClose();
    },
  });

  const costPerSeat = form.totalSeats > 0 ? Math.ceil(form.totalCost / form.totalSeats) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Publicar viaje compartido</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Desde</label>
            <input className="input" placeholder="Ej: Villa del Parque, CABA" value={form.originAddress}
              onChange={(e) => setForm({ ...form, originAddress: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hasta</label>
            <input className="input" placeholder="Ej: UBA Exactas" value={form.destAddress}
              onChange={(e) => setForm({ ...form, destAddress: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha y hora de salida</label>
            <input type="datetime-local" className="input" value={form.departureTime}
              onChange={(e) => setForm({ ...form, departureTime: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Asientos disponibles</label>
              <input type="number" className="input" min={1} max={6} value={form.totalSeats}
                onChange={(e) => setForm({ ...form, totalSeats: +e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Costo total del viaje $</label>
              <input type="number" className="input" placeholder="0" value={form.totalCost || ''}
                onChange={(e) => setForm({ ...form, totalCost: +e.target.value })} />
            </div>
          </div>
          {costPerSeat > 0 && (
            <div className="bg-zipi-50 border border-zipi-200 rounded-xl px-4 py-3 text-sm">
              <span className="text-zipi-700">Cada pasajero paga: </span>
              <span className="font-bold text-zipi-600">${costPerSeat.toLocaleString('es-AR')}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comentario <span className="text-gray-400 font-normal">(opcional)</span>
            </label>
            <input className="input" placeholder="Ej: Salgo puntual, traé monedas para el peaje"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.originAddress || !form.destAddress || !form.departureTime || form.totalCost <= 0}
            className="btn-primary flex-1"
          >
            {mutation.isPending ? 'Publicando...' : 'Publicar viaje'}
          </button>
        </div>
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

  const { data: mine } = useQuery<{ published: SharedTrip[]; joined: SharedTrip[] }>({
    queryKey: ['shared-trips-mine'],
    queryFn: () => api.get('/shared-trips/mine').then((r) => r.data),
    enabled: tab === 'mine',
  });

  const displayTrips = tab === 'all' ? allTrips : [...(mine?.published ?? []), ...(mine?.joined ?? [])];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viajes compartidos</h1>
          <p className="text-sm text-gray-500 mt-1">Viajá con otros y dividí el costo</p>
        </div>
        <button onClick={() => setShowPublish(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Publicar
        </button>
      </div>

      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {(['all', 'mine'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'all' ? 'Disponibles' : 'Mis viajes'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zipi-500" />
        </div>
      ) : displayTrips.length === 0 ? (
        <div className="card text-center py-12">
          <Car size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="font-medium text-gray-500">
            {tab === 'all' ? 'No hay viajes disponibles' : 'No tenés viajes todavía'}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {tab === 'all' ? '¡Sé el primero en publicar uno!' : 'Publicá un viaje o sumarte a uno disponible'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} userId={user?.id ?? ''} />
          ))}
        </div>
      )}

      {showPublish && <PublishModal onClose={() => setShowPublish(false)} />}
    </div>
  );
}
