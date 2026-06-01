import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { SocketEvent } from '@zipi/shared';
import { Car, Package, ToggleLeft, ToggleRight, MapPin, Clock, Truck, Hammer } from 'lucide-react';
import { VehicleType } from '@zipi/shared';

type Tab = 'trips' | 'deliveries' | 'freight';

export default function DriverHome() {
  const [tab, setTab] = useState<Tab>('trips');
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => api.get('/drivers/me').then((r) => r.data),
  });

  const { data: pendingTrips } = useQuery({
    queryKey: ['pending-trips'],
    queryFn: () => api.get('/trips/pending').then((r) => r.data),
    enabled: tab === 'trips',
    refetchInterval: 10000,
  });

  const { data: pendingDeliveries } = useQuery({
    queryKey: ['pending-deliveries'],
    queryFn: () => api.get('/deliveries/pending').then((r) => r.data),
    enabled: tab === 'deliveries',
    refetchInterval: 10000,
  });

  const { data: pendingFreights } = useQuery({
    queryKey: ['pending-freights'],
    queryFn: () => api.get('/freight/pending').then((r) => r.data),
    enabled: tab === 'freight',
    refetchInterval: 10000,
  });

  const toggleAvailability = useMutation({
    mutationFn: (isAvailable: boolean) => api.patch('/drivers/availability', { isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver-profile'] }),
  });

  const acceptTrip = useMutation({
    mutationFn: (tripId: string) => api.post(`/trips/${tripId}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-trips'] }),
  });

  const acceptDelivery = useMutation({
    mutationFn: (deliveryId: string) => api.post(`/deliveries/${deliveryId}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] }),
  });

  const acceptFreight = useMutation({
    mutationFn: (freightId: string) => api.post(`/freight/${freightId}/accept`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-freights'] }),
  });

  const isTruckDriver = profile?.vehicleType === VehicleType.TRUCK || profile?.vehicleType === VehicleType.HEAVY_MACHINERY;

  useEffect(() => {
    const socket = getSocket();
    socket.on(SocketEvent.TRIP_REQUEST, () => {
      queryClient.invalidateQueries({ queryKey: ['pending-trips'] });
    });
    socket.on(SocketEvent.DELIVERY_REQUEST, () => {
      queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] });
    });
    return () => {
      socket.off(SocketEvent.TRIP_REQUEST);
      socket.off(SocketEvent.DELIVERY_REQUEST);
    };
  }, [queryClient]);

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto card text-center py-12">
        <Car size={48} className="text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-900">Completá tu perfil de conductor</p>
        <p className="text-sm text-gray-500 mt-1">Para comenzar a recibir viajes necesitás completar tu perfil</p>
        <a href="/driver/profile" className="btn-primary inline-block mt-4">
          Completar perfil
        </a>
      </div>
    );
  }

  if (!profile.isVerified) {
    return (
      <div className="max-w-lg mx-auto card text-center py-12">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Clock size={32} className="text-amber-500" />
        </div>
        <p className="font-semibold text-gray-900">Cuenta en revisión</p>
        <p className="text-sm text-gray-500 mt-1">
          Estamos verificando tus datos. Te notificaremos cuando esté listo.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status card */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">
              {profile.isAvailable ? '🟢 Disponible' : '🔴 No disponible'}
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {profile.vehicleModel} · {profile.vehiclePlate}
            </p>
          </div>
          <button
            onClick={() => toggleAvailability.mutate(!profile.isAvailable)}
            disabled={toggleAvailability.isPending}
            className="p-1"
          >
            {profile.isAvailable ? (
              <ToggleRight size={48} className="text-green-500" />
            ) : (
              <ToggleLeft size={48} className="text-gray-400" />
            )}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">{profile.totalTrips}</p>
            <p className="text-xs text-gray-500">Viajes</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">⭐ {profile.rating?.toFixed(1)}</p>
            <p className="text-xs text-gray-500">Calificación</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">✓</p>
            <p className="text-xs text-gray-500">Verificado</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      {profile.isAvailable && (
        <>
          <div className="flex gap-2 flex-wrap">
            {!isTruckDriver && (
              <button
                onClick={() => setTab('trips')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === 'trips' ? 'bg-zipi-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                <Car size={16} />
                Remises ({pendingTrips?.length ?? 0})
              </button>
            )}
            {profile?.vehicleType === VehicleType.MOTORCYCLE && (
              <button
                onClick={() => setTab('deliveries')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === 'deliveries' ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                <Package size={16} />
                Mandados ({pendingDeliveries?.length ?? 0})
              </button>
            )}
            {isTruckDriver && (
              <button
                onClick={() => setTab('freight')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  tab === 'freight' ? 'bg-amber-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
                }`}
              >
                <Truck size={16} />
                Fletes / Maquinaria ({pendingFreights?.length ?? 0})
              </button>
            )}
          </div>

          {tab === 'freight' && (
            <div className="space-y-3">
              {(pendingFreights || []).length === 0 && (
                <div className="card text-center py-10">
                  <p className="text-gray-500">No hay solicitudes de flete disponibles</p>
                </div>
              )}
              {(pendingFreights || []).map((freight: any) => (
                <div key={freight.id} className="card">
                  <div className="flex items-center gap-2 mb-3">
                    {freight.serviceType === 'FLETE' ? (
                      <Truck size={18} className="text-amber-500" />
                    ) : (
                      <Hammer size={18} className="text-orange-500" />
                    )}
                    <span className={`badge text-xs ${freight.serviceType === 'FLETE' ? 'bg-amber-100 text-amber-700' : 'bg-orange-100 text-orange-700'}`}>
                      {freight.serviceType === 'FLETE' ? 'Flete' : 'Maquinaria'}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 mb-1">{freight.cargoDescription}</p>
                  <div className="text-sm text-gray-500 space-y-1 mb-3">
                    <p className="flex items-center gap-1">
                      <MapPin size={13} className="text-green-500" />
                      {freight.pickupAddress}
                    </p>
                    {freight.serviceType === 'FLETE' && (
                      <p className="flex items-center gap-1">
                        <MapPin size={13} className="text-red-500" />
                        {freight.dropoffAddress}
                      </p>
                    )}
                    {freight.estimatedWeightTons && (
                      <p>⚖️ {freight.estimatedWeightTons} toneladas</p>
                    )}
                    {freight.estimatedHours && (
                      <p className="flex items-center gap-1">
                        <Clock size={13} />
                        {freight.estimatedHours}h estimadas
                      </p>
                    )}
                    {freight.requiresRefrigeration && <p>🧊 Requiere refrigeración</p>}
                    {freight.specialRequirements && (
                      <p className="text-xs italic">"{freight.specialRequirements}"</p>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-amber-700">
                      ${freight.estimatedPrice?.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => acceptFreight.mutate(freight.id)}
                      disabled={acceptFreight.isPending}
                      className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors disabled:opacity-50"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'trips' && (
            <div className="space-y-3">
              {(pendingTrips || []).length === 0 && (
                <div className="card text-center py-10">
                  <p className="text-gray-500">No hay viajes disponibles en este momento</p>
                  <p className="text-sm text-gray-400 mt-1">Los nuevos viajes aparecerán acá automáticamente</p>
                </div>
              )}
              {(pendingTrips || []).map((trip: any) => (
                <div key={trip.id} className="card">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Origen</p>
                      <p className="font-medium text-sm truncate">{trip.originAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin size={16} className="text-red-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-500">Destino</p>
                      <p className="font-medium text-sm truncate">{trip.destAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {trip.estimatedMinutes} min
                      </span>
                      <span className="font-semibold text-gray-900">
                        ${trip.estimatedPrice?.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <button
                      onClick={() => acceptTrip.mutate(trip.id)}
                      disabled={acceptTrip.isPending}
                      className="btn-primary py-2 px-4 text-sm"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'deliveries' && (
            <div className="space-y-3">
              {(pendingDeliveries || []).length === 0 && (
                <div className="card text-center py-10">
                  <p className="text-gray-500">No hay envíos disponibles</p>
                </div>
              )}
              {(pendingDeliveries || []).map((delivery: any) => (
                <div key={delivery.id} className="card">
                  <div className="flex items-start gap-3 mb-3">
                    <Package size={18} className="text-blue-500 mt-0.5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{delivery.packageDescription}</p>
                      <p className="text-xs text-gray-500">{delivery.pickupAddress} → {delivery.dropoffAddress}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-gray-900">
                      ${delivery.estimatedPrice?.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => acceptDelivery.mutate(delivery.id)}
                      disabled={acceptDelivery.isPending}
                      className="btn-primary py-2 px-4 text-sm"
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!profile.isAvailable && (
        <div className="card text-center py-10">
          <p className="text-gray-500">Estás desconectado</p>
          <p className="text-sm text-gray-400 mt-1">
            Activá tu disponibilidad para empezar a recibir viajes
          </p>
        </div>
      )}
    </div>
  );
}
