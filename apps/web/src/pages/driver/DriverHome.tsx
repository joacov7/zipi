import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { getSocket } from '../../lib/socket';
import { SocketEvent } from '@zipi/shared';
import { Car, Package, MapPin, Clock, Truck, Hammer, Star, CheckCircle } from 'lucide-react';
import TripChat from '../../components/chat/TripChat';
import { VehicleType } from '@zipi/shared';

type Tab = 'trips' | 'deliveries' | 'freight';

const TABS: { id: Tab; label: string; color: string }[] = [
  { id: 'trips',      label: 'Remises',         color: '#EF9008' },
  { id: 'deliveries', label: 'Mandados',         color: '#2F6BEC' },
  { id: 'freight',    label: 'Fletes',           color: '#0E9E6E' },
];

export default function DriverHome() {
  const [tab, setTab] = useState<Tab>('trips');
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => api.get('/drivers/me').then((r) => r.data),
  });

  const { data: activeTrip } = useQuery({
    queryKey: ['active-trip'],
    queryFn: () => api.get('/trips/my-active').then((r) => r.data).catch(() => null),
    refetchInterval: 8000,
  });

  const { data: pendingTrips } = useQuery({
    queryKey: ['pending-trips'],
    queryFn: () => api.get('/trips/pending').then((r) => r.data),
    enabled: tab === 'trips' && !activeTrip,
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

  const updateTripStatus = useMutation({
    mutationFn: ({ tripId, status }: { tripId: string; status: string }) =>
      api.patch(`/trips/${tripId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-trip'] });
      queryClient.invalidateQueries({ queryKey: ['pending-trips'] });
    },
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
    socket.on(SocketEvent.TRIP_REQUEST, () => queryClient.invalidateQueries({ queryKey: ['pending-trips'] }));
    socket.on(SocketEvent.DELIVERY_REQUEST, () => queryClient.invalidateQueries({ queryKey: ['pending-deliveries'] }));
    return () => {
      socket.off(SocketEvent.TRIP_REQUEST);
      socket.off(SocketEvent.DELIVERY_REQUEST);
    };
  }, [queryClient]);

  useEffect(() => {
    if (!profile?.isAvailable || !profile?.id || !navigator.geolocation) return;
    const socket = getSocket();
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        socket.emit(SocketEvent.DRIVER_LOCATION_UPDATE, {
          driverId: profile.id,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
        });
      },
      null,
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [profile?.isAvailable, profile?.id]);

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-zipi-rim rounded-[22px] p-8 shadow-zipi text-center">
          <div
            className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,144,8,0.12)' }}
          >
            <Car size={30} style={{ color: '#EF9008' }} strokeWidth={1.6} />
          </div>
          <p className="text-[16px] font-bold text-zipi-ink">Completá tu perfil de conductor</p>
          <p className="text-[13.5px] text-zipi-muted mt-1 mb-5">Para comenzar a recibir viajes necesitás completar tu perfil</p>
          <a
            href="/driver/profile"
            className="inline-flex items-center justify-center h-[50px] px-6 rounded-2xl font-bold text-white"
            style={{ background: '#1A1714' }}
          >
            Completar perfil
          </a>
        </div>
      </div>
    );
  }

  if (!profile.isVerified) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white border border-zipi-rim rounded-[22px] p-8 shadow-zipi text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(239,144,8,0.12)' }}
          >
            <Clock size={30} style={{ color: '#C77A00' }} />
          </div>
          <p className="text-[16px] font-bold text-zipi-ink">Cuenta en revisión</p>
          <p className="text-[13.5px] text-zipi-muted mt-1">
            Estamos verificando tus datos. Te notificaremos cuando esté listo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Active trip banner */}
      {activeTrip && (
        <div
          className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi space-y-3"
          style={{ borderLeft: `4px solid ${activeTrip.status === 'IN_PROGRESS' ? '#0E9E6E' : '#2F6BEC'}` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <span
                className="text-[11.5px] font-bold px-2.5 py-1 rounded-full"
                style={
                  activeTrip.status === 'IN_PROGRESS'
                    ? { background: 'rgba(14,158,110,0.12)', color: '#0E9E6E' }
                    : { background: 'rgba(47,107,236,0.12)', color: '#2F6BEC' }
                }
              >
                {activeTrip.status === 'IN_PROGRESS' ? 'En viaje' : 'Viaje aceptado'}
              </span>
              <p className="font-bold text-[15px] text-zipi-ink mt-1.5">Viaje activo</p>
            </div>
            <span className="text-[22px] font-extrabold text-zipi-500">
              ${activeTrip.estimatedPrice?.toLocaleString('es-AR')}
            </span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Origen', val: activeTrip.originAddress, color: '#0E9E6E' },
              { label: 'Destino', val: activeTrip.destAddress, color: '#EF9008' },
            ].map(({ label, val, color }) => (
              <div key={label} className="flex items-start gap-2">
                <MapPin size={13} style={{ color }} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-zipi-faint">{label}</p>
                  <p className="text-[13.5px] text-zipi-ink">{val}</p>
                </div>
              </div>
            ))}
          </div>
          {activeTrip.passenger && (
            <div className="flex items-center gap-2.5 bg-zipi-surface2 rounded-[13px] p-2.5">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
              >
                {activeTrip.passenger.name?.charAt(0)}
              </div>
              <p className="flex-1 text-[13.5px] font-semibold text-zipi-ink">{activeTrip.passenger.name}</p>
              <a
                href={`tel:${activeTrip.passenger.phone}`}
                className="text-[12.5px] font-bold"
                style={{ color: '#0E9E6E' }}
              >
                Llamar
              </a>
            </div>
          )}
          <TripChat tripId={activeTrip.id} />
          <div className="flex gap-2">
            {activeTrip.status === 'ACCEPTED' && (
              <button
                onClick={() => updateTripStatus.mutate({ tripId: activeTrip.id, status: 'IN_PROGRESS' })}
                disabled={updateTripStatus.isPending}
                className="flex-1 h-[46px] rounded-[14px] font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ background: '#2F6BEC' }}
              >
                Iniciar viaje
              </button>
            )}
            {activeTrip.status === 'IN_PROGRESS' && (
              <button
                onClick={() => updateTripStatus.mutate({ tripId: activeTrip.id, status: 'COMPLETED' })}
                disabled={updateTripStatus.isPending}
                className="flex-1 h-[46px] rounded-[14px] font-bold text-white disabled:opacity-50 transition-opacity"
                style={{ background: '#0E9E6E' }}
              >
                Completar viaje
              </button>
            )}
          </div>
        </div>
      )}

      {/* Status card */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[16px] font-extrabold text-zipi-ink">
              {profile.isAvailable ? 'Disponible' : 'No disponible'}
            </p>
            <p className="text-[12.5px] text-zipi-muted mt-0.5">{profile.vehicleModel} · {profile.vehiclePlate}</p>
          </div>
          <button
            onClick={() => toggleAvailability.mutate(!profile.isAvailable)}
            disabled={toggleAvailability.isPending}
            className="w-14 h-8 rounded-full transition-colors relative shrink-0"
            style={{ background: profile.isAvailable ? '#0E9E6E' : '#d4cfc9' }}
          >
            <span
              className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-transform"
              style={{ transform: profile.isAvailable ? 'translateX(24px)' : 'translateX(4px)' }}
            />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-zipi-rim">
          <div className="text-center">
            <p className="text-[22px] font-extrabold text-zipi-ink">{profile.totalTrips}</p>
            <p className="text-[11.5px] text-zipi-faint">Viajes</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              <Star size={14} className="text-amber-400 fill-amber-400" />
              <p className="text-[22px] font-extrabold text-zipi-ink">{profile.rating?.toFixed(1)}</p>
            </div>
            <p className="text-[11.5px] text-zipi-faint">Calificación</p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center">
              <CheckCircle size={22} style={{ color: '#0E9E6E' }} />
            </div>
            <p className="text-[11.5px] text-zipi-faint">Verificado</p>
          </div>
        </div>
      </div>

      {profile.isAvailable && (
        <>
          {/* Tabs */}
          <div className="bg-zipi-surface2 rounded-[18px] p-1.5 flex gap-1">
            {TABS.filter(({ id }) => {
              if (id === 'trips') return !isTruckDriver;
              if (id === 'deliveries') return profile?.vehicleType === VehicleType.MOTORCYCLE;
              if (id === 'freight') return isTruckDriver;
              return false;
            }).map(({ id, label, color }) => {
              const count =
                id === 'trips' ? pendingTrips?.length ?? 0
                : id === 'deliveries' ? pendingDeliveries?.length ?? 0
                : pendingFreights?.length ?? 0;
              return (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-[13px] text-[13px] font-bold transition-colors"
                  style={
                    tab === id
                      ? { background: '#fff', color, boxShadow: '0 1px 4px rgba(20,16,10,0.08)' }
                      : { color: '#a39e95' }
                  }
                >
                  {label}
                  {count > 0 && (
                    <span
                      className="w-5 h-5 rounded-full text-white text-[10px] font-extrabold flex items-center justify-center"
                      style={{ background: color }}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Trips list */}
          {tab === 'trips' && (
            <div className="space-y-3">
              {(pendingTrips || []).length === 0 && (
                <div className="bg-white border border-zipi-rim rounded-[22px] p-8 shadow-zipi text-center">
                  <Car size={36} className="text-zipi-faint mx-auto mb-2" strokeWidth={1.6} />
                  <p className="text-[14px] font-semibold text-zipi-muted">No hay viajes disponibles</p>
                  <p className="text-[12.5px] text-zipi-faint mt-1">Los nuevos viajes aparecerán acá automáticamente</p>
                </div>
              )}
              {(pendingTrips || []).map((trip: any) => (
                <div key={trip.id} className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex flex-col items-center shrink-0 pt-1">
                      <span className="w-[8px] h-[8px] rounded-full border-2 border-zipi-ink bg-white" />
                      <span className="w-px flex-1 min-h-[22px] bg-zipi-rim my-1" />
                      <span className="w-[8px] h-[8px] rounded-[2px] bg-zipi-500" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div>
                        <p className="text-[11px] text-zipi-faint">Origen</p>
                        <p className="text-[13.5px] font-semibold text-zipi-ink truncate">{trip.originAddress}</p>
                      </div>
                      <div>
                        <p className="text-[11px] text-zipi-faint">Destino</p>
                        <p className="text-[13.5px] font-semibold text-zipi-ink truncate">{trip.destAddress}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zipi-rim">
                    <div className="flex items-center gap-3 text-[12.5px] text-zipi-muted">
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {trip.estimatedMinutes} min
                      </span>
                      <span className="font-extrabold text-[16px] text-zipi-ink">
                        ${trip.estimatedPrice?.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <button
                      onClick={() => acceptTrip.mutate(trip.id)}
                      disabled={acceptTrip.isPending}
                      className="h-10 px-5 rounded-[12px] font-bold text-white text-[13px] disabled:opacity-50"
                      style={{ background: '#EF9008' }}
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Deliveries list */}
          {tab === 'deliveries' && (
            <div className="space-y-3">
              {(pendingDeliveries || []).length === 0 && (
                <div className="bg-white border border-zipi-rim rounded-[22px] p-8 shadow-zipi text-center">
                  <Package size={36} className="text-zipi-faint mx-auto mb-2" strokeWidth={1.6} />
                  <p className="text-[14px] font-semibold text-zipi-muted">No hay envíos disponibles</p>
                </div>
              )}
              {(pendingDeliveries || []).map((delivery: any) => (
                <div key={delivery.id} className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi">
                  <div className="flex items-start gap-3 mb-3">
                    <div
                      className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(47,107,236,0.1)' }}
                    >
                      <Package size={18} style={{ color: '#2F6BEC' }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-zipi-ink">{delivery.packageDescription}</p>
                      <p className="text-[12.5px] text-zipi-muted mt-0.5">
                        {delivery.pickupAddress} → {delivery.dropoffAddress}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zipi-rim">
                    <span className="text-[18px] font-extrabold text-zipi-ink">
                      ${delivery.estimatedPrice?.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => acceptDelivery.mutate(delivery.id)}
                      disabled={acceptDelivery.isPending}
                      className="h-10 px-5 rounded-[12px] font-bold text-white text-[13px] disabled:opacity-50"
                      style={{ background: '#2F6BEC' }}
                    >
                      Aceptar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Freight list */}
          {tab === 'freight' && (
            <div className="space-y-3">
              {(pendingFreights || []).length === 0 && (
                <div className="bg-white border border-zipi-rim rounded-[22px] p-8 shadow-zipi text-center">
                  <Truck size={36} className="text-zipi-faint mx-auto mb-2" strokeWidth={1.6} />
                  <p className="text-[14px] font-semibold text-zipi-muted">No hay solicitudes de flete disponibles</p>
                </div>
              )}
              {(pendingFreights || []).map((freight: any) => (
                <div key={freight.id} className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi">
                  <div className="flex items-center gap-2 mb-3">
                    {freight.serviceType === 'FLETE' ? (
                      <Truck size={16} style={{ color: '#0E9E6E' }} />
                    ) : (
                      <Hammer size={16} style={{ color: '#C77A00' }} />
                    )}
                    <span
                      className="text-[11.5px] font-bold px-2.5 py-0.5 rounded-full"
                      style={
                        freight.serviceType === 'FLETE'
                          ? { background: 'rgba(14,158,110,0.1)', color: '#0E9E6E' }
                          : { background: 'rgba(239,144,8,0.1)', color: '#C77A00' }
                      }
                    >
                      {freight.serviceType === 'FLETE' ? 'Flete' : 'Maquinaria'}
                    </span>
                  </div>
                  <p className="text-[14.5px] font-bold text-zipi-ink mb-2">{freight.cargoDescription}</p>
                  <div className="text-[12.5px] text-zipi-muted space-y-1 mb-3">
                    <p className="flex items-center gap-1">
                      <MapPin size={12} style={{ color: '#0E9E6E' }} />
                      {freight.pickupAddress}
                    </p>
                    {freight.serviceType === 'FLETE' && (
                      <p className="flex items-center gap-1">
                        <MapPin size={12} className="text-zipi-500" />
                        {freight.dropoffAddress}
                      </p>
                    )}
                    {freight.estimatedWeightTons && (
                      <p>{freight.estimatedWeightTons} toneladas</p>
                    )}
                    {freight.estimatedHours && (
                      <p className="flex items-center gap-1">
                        <Clock size={12} />
                        {freight.estimatedHours}h estimadas
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-zipi-rim">
                    <span className="text-[18px] font-extrabold" style={{ color: '#0E9E6E' }}>
                      ${freight.estimatedPrice?.toLocaleString('es-AR')}
                    </span>
                    <button
                      onClick={() => acceptFreight.mutate(freight.id)}
                      disabled={acceptFreight.isPending}
                      className="h-10 px-5 rounded-[12px] font-bold text-white text-[13px] disabled:opacity-50"
                      style={{ background: '#0E9E6E' }}
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
        <div className="bg-white border border-zipi-rim rounded-[22px] p-8 shadow-zipi text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ background: 'rgba(163,158,149,0.12)' }}
          >
            <Car size={26} className="text-zipi-faint" strokeWidth={1.6} />
          </div>
          <p className="text-[15px] font-bold text-zipi-muted">Estás desconectado</p>
          <p className="text-[13px] text-zipi-faint mt-1">
            Activá tu disponibilidad para empezar a recibir viajes
          </p>
        </div>
      )}
    </div>
  );
}
