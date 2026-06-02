import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useEffect, useState, lazy, Suspense } from 'react';
import { getSocket } from '../../lib/socket';
import { SocketEvent } from '@zipi/shared';
import { Phone, Star, MapPin, Car, Clock } from 'lucide-react';

const TripMap = lazy(() => import('../../components/map/TripMap'));

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Buscando conductor...',
  ACCEPTED: 'Conductor en camino',
  IN_PROGRESS: 'En viaje',
  COMPLETED: 'Viaje completado',
  CANCELLED: 'Viaje cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function TripTracking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

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
    socket.on(SocketEvent.TRIP_ACCEPTED, () => {
      queryClient.invalidateQueries({ queryKey: ['trip', id] });
    });
    socket.on(SocketEvent.TRIP_STARTED, () => {
      queryClient.invalidateQueries({ queryKey: ['trip', id] });
    });
    socket.on(SocketEvent.TRIP_COMPLETED, () => {
      queryClient.invalidateQueries({ queryKey: ['trip', id] });
    });
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

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tu viaje</h1>
        <span className={`badge mt-2 ${STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-700'}`}>
          {STATUS_LABELS[trip.status] || trip.status}
        </span>
      </div>

      {trip.originLat && trip.destLat && (
        <Suspense fallback={<div className="h-64 bg-gray-100 rounded-xl animate-pulse" />}>
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
      )}

      {trip.status === 'PENDING' && (
        <div className="card text-center py-8">
          <div className="animate-bounce w-16 h-16 bg-zipi-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Car size={32} className="text-zipi-500" />
          </div>
          <p className="font-semibold text-gray-900">Buscando tu conductor...</p>
          <p className="text-sm text-gray-500 mt-1">En unos momentos un conductor aceptará tu viaje</p>
        </div>
      )}

      {trip.driver && (
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Tu conductor</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-xl font-bold text-gray-500">
                {trip.driver.user.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">{trip.driver.user.name}</p>
              <p className="text-sm text-gray-500">
                {trip.driver.vehicleModel} · {trip.driver.vehiclePlate}
              </p>
              <div className="flex items-center gap-1 mt-1">
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{trip.driver.rating?.toFixed(1)}</span>
              </div>
            </div>
            <a
              href={`tel:${trip.driver.user.phone}`}
              className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center hover:bg-green-200 transition-colors"
            >
              <Phone size={20} className="text-green-600" />
            </a>
          </div>
        </div>
      )}

      <div className="card space-y-3">
        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-green-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Origen</p>
            <p className="font-medium text-gray-900">{trip.originAddress}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <MapPin size={18} className="text-red-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-gray-500">Destino</p>
            <p className="font-medium text-gray-900">{trip.destAddress}</p>
          </div>
        </div>
        {trip.estimatedMinutes && (
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <Clock size={16} />
            <span>~{trip.estimatedMinutes} minutos · {trip.distanceKm} km</span>
          </div>
        )}
      </div>

      <div className="card flex justify-between items-center">
        <span className="text-gray-600">Precio estimado</span>
        <span className="text-2xl font-bold text-zipi-600">
          ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
        </span>
      </div>

      {['PENDING', 'ACCEPTED'].includes(trip.status) && (
        <button
          onClick={() => {
            if (confirm('¿Cancelar el viaje?')) cancelMutation.mutate();
          }}
          className="btn-danger w-full"
          disabled={cancelMutation.isPending}
        >
          {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar viaje'}
        </button>
      )}

      {trip.status === 'COMPLETED' && (
        <div className="card space-y-4">
          <div className="text-center">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-bold text-gray-900 text-lg">¡Llegaste!</p>
            <p className="text-sm text-gray-500 mt-1">
              Precio final: <span className="font-bold text-zipi-600">${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}</span>
            </p>
          </div>

          {!trip.passengerRating ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700 text-center">¿Cómo fue el viaje?</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      size={36}
                      className={`transition-colors ${
                        star <= (hoverRating || selectedRating)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {selectedRating > 0 && (
                <button
                  onClick={() => rateMutation.mutate(selectedRating)}
                  disabled={rateMutation.isPending}
                  className="btn-primary w-full"
                >
                  {rateMutation.isPending ? 'Enviando...' : `Calificar con ${selectedRating} ⭐`}
                </button>
              )}
              <button onClick={() => navigate('/home')} className="btn-secondary w-full text-sm">
                Saltar y volver al inicio
              </button>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-500">Ya calificaste este viaje con {trip.passengerRating} ⭐</p>
              <button onClick={() => navigate('/home')} className="btn-primary w-full">
                Volver al inicio
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
