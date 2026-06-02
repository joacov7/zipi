import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Car, Package, Clock, Star, MapPin, X, Navigation, Receipt } from 'lucide-react';

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

function TripReceipt({ trip, onClose }: { trip: any; onClose: () => void }) {
  const price = trip.finalPrice ?? trip.estimatedPrice;
  const paid = price - (trip.discountAmount ?? 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Receipt size={20} className="text-zipi-500" />
            <h2 className="font-bold text-gray-900">Recibo del viaje</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Status + date */}
          <div className="flex items-center justify-between">
            <span className={`badge ${STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-700'}`}>
              {STATUS_LABELS[trip.status] || trip.status}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(trip.createdAt).toLocaleString('es-AR', {
                day: '2-digit', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </span>
          </div>

          {/* Route */}
          <div className="space-y-2 bg-gray-50 rounded-xl p-3">
            <div className="flex items-start gap-2">
              <Navigation size={14} className="text-green-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Origen</p>
                <p className="text-sm font-medium text-gray-800">{trip.originAddress}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Destino</p>
                <p className="text-sm font-medium text-gray-800">{trip.destAddress}</p>
              </div>
            </div>
            {trip.distanceKm && (
              <p className="text-xs text-gray-400 flex items-center gap-1 pt-1">
                <Clock size={12} />
                {trip.distanceKm} km · {trip.estimatedMinutes} min
              </p>
            )}
          </div>

          {/* Driver */}
          {trip.driver && (
            <div className="flex items-center gap-3 border border-gray-100 rounded-xl p-3">
              <div className="w-10 h-10 bg-zipi-100 rounded-full flex items-center justify-center font-bold text-zipi-600">
                {trip.driver.user.name.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-gray-900">{trip.driver.user.name}</p>
                <p className="text-xs text-gray-500">{trip.driver.vehicleModel} · {trip.driver.vehiclePlate}</p>
              </div>
              {trip.passengerRating && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="text-amber-400 fill-amber-400" />
                  <span className="text-sm font-medium">{trip.passengerRating}</span>
                </div>
              )}
            </div>
          )}

          {/* Price breakdown */}
          <div className="border-t border-dashed border-gray-200 pt-3 space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Precio base</span>
              <span>${price?.toLocaleString('es-AR')}</span>
            </div>
            {trip.surgeMultiplier > 1 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>Tarifa dinámica (×{trip.surgeMultiplier})</span>
                <span>incluida</span>
              </div>
            )}
            {trip.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Descuento ({trip.discountCode})</span>
                <span>-${trip.discountAmount?.toLocaleString('es-AR')}</span>
              </div>
            )}
            {trip.cancellationFee > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Cargo por cancelación</span>
                <span>${trip.cancellationFee?.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
              <span>Total</span>
              <span className="text-zipi-600">${(paid + (trip.cancellationFee ?? 0)).toLocaleString('es-AR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PassengerHistory() {
  const [tab, setTab] = useState<Tab>('trips');
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

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
      {selectedTrip && <TripReceipt trip={selectedTrip} onClose={() => setSelectedTrip(null)} />}

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
            <button
              key={trip.id}
              onClick={() => setSelectedTrip(trip)}
              className="card w-full text-left hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${STATUS_COLORS[trip.status] || 'bg-gray-100 text-gray-700'}`}>
                      {STATUS_LABELS[trip.status] || trip.status}
                    </span>
                    {trip.surgeMultiplier > 1 && (
                      <span className="badge bg-amber-100 text-amber-700">⚡ ×{trip.surgeMultiplier}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      {new Date(trip.createdAt).toLocaleDateString('es-AR', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 truncate">→ {trip.destAddress}</p>
                  {trip.driver && (
                    <p className="text-sm text-gray-500 mt-1">Conductor: {trip.driver.user.name}</p>
                  )}
                  {trip.discountCode && (
                    <p className="text-xs text-green-600 mt-0.5">🏷 {trip.discountCode} aplicado</p>
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
                  <p className="text-xs text-zipi-400 mt-1">Ver recibo →</p>
                </div>
              </div>
            </button>
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
