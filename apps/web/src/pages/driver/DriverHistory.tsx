import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Car, MapPin, DollarSign, Star } from 'lucide-react';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptado',
  IN_PROGRESS: 'En viaje',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

export default function DriverHistory() {
  const { data } = useQuery({
    queryKey: ['driver-trips'],
    queryFn: () => api.get('/drivers/me/trips').then((r) => r.data),
  });

  const trips = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mi historial</h1>
        <p className="text-gray-500 mt-1">{data?.total ?? 0} viajes en total</p>
      </div>

      <div className="space-y-3">
        {trips.length === 0 && (
          <div className="card text-center py-12">
            <Car size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Sin viajes realizados aún</p>
          </div>
        )}
        {trips.map((trip: any) => (
          <div key={trip.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`badge text-xs ${
                      trip.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : trip.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {STATUS_LABELS[trip.status] || trip.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(trip.createdAt).toLocaleDateString('es-AR')}
                  </span>
                </div>
                <p className="text-sm text-gray-600 truncate">
                  <MapPin size={12} className="inline mr-1 text-gray-400" />
                  {trip.originAddress}
                </p>
                <p className="text-sm font-medium text-gray-900 truncate mt-0.5">
                  <MapPin size={12} className="inline mr-1 text-red-400" />
                  {trip.destAddress}
                </p>
                {trip.passenger && (
                  <p className="text-xs text-gray-500 mt-1">Pasajero: {trip.passenger.name}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">
                  ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
                </p>
                {trip.driverRating && (
                  <div className="flex items-center gap-1 justify-end mt-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs">{trip.driverRating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
