import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { MapPin, Clock, Users, Phone, Check, X, ArrowLeft, Trash2 } from 'lucide-react';

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
    mutationFn: ({ participantUserId, accept }: { participantUserId: string; accept: boolean }) =>
      api.patch(`/shared-trips/${id}/participants/${participantUserId}/${accept ? 'accept' : 'reject'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trip', id] }),
  });

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zipi-500" /></div>;
  if (!trip) return null;

  const isPublisher = trip.publisher.id === user?.id;
  const myParticipant = trip.participants.find((p: any) => p.userId === user?.id);
  const confirmed = trip.participants.filter((p: any) => p.status === 'CONFIRMED');
  const pending = trip.participants.filter((p: any) => p.status === 'PENDING');
  const seatsLeft = trip.totalSeats - confirmed.length;
  const isCancelled = trip.status === 'CANCELLED';

  const statusColors: Record<string, string> = {
    OPEN: 'bg-green-100 text-green-700',
    FULL: 'bg-blue-100 text-blue-700',
    DEPARTED: 'bg-gray-100 text-gray-700',
    CANCELLED: 'bg-red-100 text-red-700',
  };
  const statusLabels: Record<string, string> = {
    OPEN: 'Abierto', FULL: 'Completo', DEPARTED: 'Partió', CANCELLED: 'Cancelado',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button onClick={() => navigate('/shared-trips')} className="flex items-center gap-2 text-gray-500 hover:text-gray-800">
        <ArrowLeft size={18} /> Volver
      </button>

      <div className="card space-y-4">
        <div className="flex items-start justify-between">
          <span className={`badge ${statusColors[trip.status]}`}>{statusLabels[trip.status]}</span>
          {!isCancelled && isPublisher && (
            <button onClick={() => confirm('¿Cancelar el viaje?') && cancelMutation.mutate()} className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm">
              <Trash2 size={14} /> Cancelar viaje
            </button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={13} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Desde</p>
              <p className="font-medium text-gray-900">{trip.originAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
              <MapPin size={13} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Hasta</p>
              <p className="font-medium text-gray-900">{trip.destAddress}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 pt-2 border-t border-gray-100 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Clock size={14} />
            <span>{new Date(trip.departureTime).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users size={14} />
            <span>{seatsLeft} asiento{seatsLeft !== 1 ? 's' : ''} libre{seatsLeft !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {trip.description && (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-xl px-4 py-3">{trip.description}</p>
        )}
      </div>

      {/* Price */}
      <div className="card flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">Costo por asiento</p>
          <p className="text-3xl font-bold text-zipi-600 mt-1">${trip.costPerSeat.toLocaleString('es-AR')}</p>
        </div>
        <div className="text-right text-sm text-gray-400">
          <p>{trip.totalSeats} asientos</p>
          <p>${(trip.costPerSeat * trip.totalSeats).toLocaleString('es-AR')} total</p>
        </div>
      </div>

      {/* Publisher */}
      <div className="card">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Publicado por</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-zipi-100 rounded-full flex items-center justify-center">
            <span className="text-lg font-bold text-zipi-600">{trip.publisher.name.charAt(0)}</span>
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900">{trip.publisher.name}</p>
          </div>
          <a href={`tel:${trip.publisher.phone}`} className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200">
            <Phone size={16} className="text-green-600" />
          </a>
        </div>
      </div>

      {/* Participants (confirmed) */}
      {confirmed.length > 0 && (
        <div className="card">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Pasajeros confirmados ({confirmed.length}/{trip.totalSeats})
          </p>
          <div className="space-y-2">
            {confirmed.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-xs font-bold text-green-700">
                  {p.user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-900">{p.user.name}</span>
                <Check size={14} className="text-green-500 ml-auto" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pending requests (only publisher sees) */}
      {isPublisher && pending.length > 0 && (
        <div className="card border-amber-200">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide mb-3">
            Solicitudes pendientes ({pending.length})
          </p>
          <div className="space-y-3">
            {pending.map((p: any) => (
              <div key={p.id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                  {p.user.name.charAt(0)}
                </div>
                <span className="text-sm font-medium text-gray-900 flex-1">{p.user.name}</span>
                <button
                  onClick={() => respondMutation.mutate({ participantUserId: p.userId, accept: true })}
                  disabled={seatsLeft === 0 || respondMutation.isPending}
                  className="w-8 h-8 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center disabled:opacity-40"
                >
                  <Check size={14} className="text-green-600" />
                </button>
                <button
                  onClick={() => respondMutation.mutate({ participantUserId: p.userId, accept: false })}
                  disabled={respondMutation.isPending}
                  className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center"
                >
                  <X size={14} className="text-red-600" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!isCancelled && !isPublisher && (
        <div>
          {!myParticipant && seatsLeft > 0 && (
            <button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="btn-primary w-full">
              {joinMutation.isPending ? 'Enviando solicitud...' : 'Solicitar lugar — $' + trip.costPerSeat.toLocaleString('es-AR')}
            </button>
          )}
          {myParticipant?.status === 'PENDING' && (
            <div className="space-y-2">
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-3 text-sm text-center">
                Solicitud enviada — esperando confirmación del conductor
              </div>
              <button onClick={() => leaveMutation.mutate()} className="btn-secondary w-full text-sm">
                Cancelar solicitud
              </button>
            </div>
          )}
          {myParticipant?.status === 'CONFIRMED' && (
            <div className="space-y-2">
              <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm text-center font-medium">
                ✓ Tu lugar está confirmado
              </div>
              <button onClick={() => confirm('¿Abandonar este viaje?') && leaveMutation.mutate()} className="btn-secondary w-full text-sm text-red-600">
                Abandonar viaje
              </button>
            </div>
          )}
          {trip.status === 'FULL' && !myParticipant && (
            <div className="bg-gray-100 text-gray-500 rounded-xl px-4 py-3 text-sm text-center">
              Viaje completo — no hay asientos disponibles
            </div>
          )}
        </div>
      )}
    </div>
  );
}
