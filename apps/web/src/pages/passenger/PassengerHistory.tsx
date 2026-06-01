import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Car, Package, Clock, Star } from 'lucide-react';

type Tab = 'trips' | 'deliveries';

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

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
  PICKED_UP: 'bg-blue-100 text-blue-700',
  IN_TRANSIT: 'bg-indigo-100 text-indigo-700',
  DELIVERED: 'bg-gray-100 text-gray-700',
};

export default function PassengerHistory() {
  const [tab, setTab] = useState<Tab>('trips');

  const { data: tripsData } = useQuery({
    queryKey: ['my-trips'],
    queryFn: () => api.get('/users/me/trips').then((r) => r.data),
    enabled: tab === 'trips',
  });

  const { data: deliveriesData } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: () => api.get('/users/me/deliveries').then((r) => r.data),
    enabled: tab === 'deliveries',
  });

  const trips = tripsData?.data || [];
  const deliveries = deliveriesData?.data || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi historial</h1>

      <div className="flex gap-2">
        <button
          onClick={() => setTab('trips')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'trips' ? 'bg-zipi-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Car size={16} />
          Viajes ({tripsData?.total ?? 0})
        </button>
        <button
          onClick={() => setTab('deliveries')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === 'deliveries' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Package size={16} />
          Envíos ({deliveriesData?.total ?? 0})
        </button>
      </div>

      {tab === 'trips' && (
        <div className="space-y-3">
          {trips.length === 0 && (
            <div className="card text-center py-12">
              <Car size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sin viajes registrados</p>
            </div>
          )}
          {trips.map((trip: any) => (
            <div key={trip.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[trip.status] || trip.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(trip.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">→ {trip.destAddress}</p>
                  {trip.driver && (
                    <p className="text-sm text-gray-500 mt-1">Conductor: {trip.driver.user.name}</p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">
                    ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
                  </p>
                  {trip.passengerRating && (
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Star size={12} className="text-amber-400 fill-amber-400" />
                      <span className="text-xs text-gray-500">{trip.passengerRating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'deliveries' && (
        <div className="space-y-3">
          {deliveries.length === 0 && (
            <div className="card text-center py-12">
              <Package size={48} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Sin envíos registrados</p>
            </div>
          )}
          {deliveries.map((delivery: any) => (
            <div key={delivery.id} className="card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${STATUS_COLORS[delivery.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[delivery.status] || delivery.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(delivery.createdAt).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">→ {delivery.dropoffAddress}</p>
                  <p className="text-sm text-gray-500">{delivery.packageDescription}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-gray-900">
                    ${(delivery.finalPrice ?? delivery.estimatedPrice)?.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
