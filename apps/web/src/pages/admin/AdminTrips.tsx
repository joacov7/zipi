import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Car, MapPin } from 'lucide-react';

type StatusFilter = 'ALL' | 'PENDING' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptado',
  IN_PROGRESS: 'En viaje',
  COMPLETED: 'Completado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  ACCEPTED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-green-100 text-green-700',
  COMPLETED: 'bg-gray-100 text-gray-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export default function AdminTrips() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const statusParam = statusFilter !== 'ALL' ? `?status=${statusFilter}` : '';

  const { data } = useQuery({
    queryKey: ['admin-trips', statusFilter],
    queryFn: () => api.get(`/admin/trips${statusParam}`).then((r) => r.data),
    refetchInterval: 10000,
  });

  const trips = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Viajes</h1>
        <p className="text-gray-500 mt-1">{data?.total ?? 0} viajes</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as StatusFilter[]).map(
          (s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-zipi-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-600'
              }`}
            >
              {s === 'ALL' ? 'Todos' : STATUS_LABELS[s]}
            </button>
          ),
        )}
      </div>

      <div className="space-y-3">
        {trips.map((trip: any) => (
          <div key={trip.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Car size={16} className="text-gray-400" />
                  <span className={`badge ${STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-700'}`}>
                    {STATUS_LABELS[trip.status] || trip.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(trip.createdAt).toLocaleString('es-AR', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Pasajero</p>
                    <p className="font-medium">{trip.passenger?.name}</p>
                    <p className="text-gray-500">{trip.passenger?.phone}</p>
                  </div>
                  {trip.driver && (
                    <div>
                      <p className="text-xs text-gray-500">Conductor</p>
                      <p className="font-medium">{trip.driver?.user?.name}</p>
                      <p className="text-gray-500">{trip.driver?.user?.phone}</p>
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  <p className="flex items-center gap-1">
                    <MapPin size={11} className="text-green-500" />
                    {trip.originAddress}
                  </p>
                  <p className="flex items-center gap-1">
                    <MapPin size={11} className="text-red-500" />
                    {trip.destAddress}
                  </p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-gray-900">
                  ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
                </p>
                <p className="text-xs text-gray-500 mt-1">{trip.distanceKm} km</p>
              </div>
            </div>
          </div>
        ))}
        {trips.length === 0 && (
          <div className="card text-center py-12 text-gray-500">No hay viajes con ese filtro</div>
        )}
      </div>
    </div>
  );
}
