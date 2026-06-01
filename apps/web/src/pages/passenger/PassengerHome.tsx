import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { Car, Package, History, Star, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function PassengerHome() {
  const { user } = useAuthStore();

  const { data: tripsData } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => api.get('/users/me/trips?limit=3').then((r) => r.data),
  });

  const recentTrips = tripsData?.data?.slice(0, 3) || [];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-gray-500 mt-1">¿Qué necesitás hoy?</p>
      </div>

      {/* Service cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/request-trip"
          className="group card hover:shadow-md hover:border-zipi-200 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-zipi-100 group-hover:bg-zipi-200 rounded-2xl flex items-center justify-center transition-colors">
              <Car size={28} className="text-zipi-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Pedir Remis</h3>
              <p className="text-gray-500 text-sm mt-1">
                Viajá cómodo con nuestros conductores verificados
              </p>
              <p className="text-zipi-600 font-medium text-sm mt-2">Desde $2.500 →</p>
            </div>
          </div>
        </Link>

        <Link
          to="/request-delivery"
          className="group card hover:shadow-md hover:border-blue-200 transition-all cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-blue-100 group-hover:bg-blue-200 rounded-2xl flex items-center justify-center transition-colors">
              <Package size={28} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">Motomandado</h3>
              <p className="text-gray-500 text-sm mt-1">
                Enviá paquetes y documentos en moto
              </p>
              <p className="text-blue-600 font-medium text-sm mt-2">Desde $1.500 →</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent activity */}
      {recentTrips.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-900">Viajes recientes</h2>
            <Link to="/history" className="text-sm text-zipi-600 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="space-y-3">
            {recentTrips.map((trip: any) => (
              <div key={trip.id} className="card flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Car size={18} className="text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{trip.destAddress}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(trip.createdAt).toLocaleDateString('es-AR')}
                    </span>
                    {trip.passengerRating && (
                      <span className="flex items-center gap-1">
                        <Star size={12} className="text-amber-400" />
                        {trip.passengerRating}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${trip.finalPrice?.toLocaleString('es-AR') ?? trip.estimatedPrice?.toLocaleString('es-AR')}
                  </p>
                  <span
                    className={`badge text-xs ${
                      trip.status === 'COMPLETED'
                        ? 'bg-green-100 text-green-700'
                        : trip.status === 'CANCELLED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {trip.status === 'COMPLETED'
                      ? 'Completado'
                      : trip.status === 'CANCELLED'
                        ? 'Cancelado'
                        : 'En curso'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {recentTrips.length === 0 && (
        <div className="card text-center py-12">
          <History size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aún no tenés viajes</p>
          <p className="text-sm text-gray-400 mt-1">¡Pedí tu primer remis o mandado!</p>
        </div>
      )}
    </div>
  );
}
