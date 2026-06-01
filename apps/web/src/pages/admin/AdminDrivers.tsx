import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { CheckCircle, Car, Bike, Star } from 'lucide-react';

export default function AdminDrivers() {
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const queryClient = useQueryClient();

  const verifiedParam = filter === 'all' ? '' : filter === 'verified' ? '?verified=true' : '?verified=false';

  const { data } = useQuery({
    queryKey: ['admin-drivers', filter],
    queryFn: () => api.get(`/admin/drivers${verifiedParam}`).then((r) => r.data),
  });

  const verifyDriver = useMutation({
    mutationFn: (driverId: string) => api.post(`/admin/drivers/${driverId}/verify`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-drivers'] }),
  });

  const drivers = data?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Conductores</h1>
        <p className="text-gray-500 mt-1">{data?.total ?? 0} conductores registrados</p>
      </div>

      <div className="flex gap-2">
        {(['all', 'verified', 'pending'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === f ? 'bg-zipi-500 text-white' : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            {f === 'all' ? 'Todos' : f === 'verified' ? 'Verificados' : 'Pendientes'}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {drivers.map((driver: any) => (
          <div key={driver.id} className="card">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                  {driver.vehicleType === 'CAR' ? (
                    <Car size={24} className="text-gray-500" />
                  ) : (
                    <Bike size={24} className="text-gray-500" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{driver.user.name}</p>
                  <p className="text-sm text-gray-500">{driver.user.email}</p>
                  <p className="text-sm text-gray-600 mt-1">
                    {driver.vehicleModel} · {driver.vehiclePlate} · {driver.vehicleColor}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>LIC: {driver.licenseNumber}</span>
                    <span className="flex items-center gap-1">
                      <Star size={13} className="text-amber-400" />
                      {driver.rating?.toFixed(1)}
                    </span>
                    <span>{driver.totalTrips} viajes</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`badge ${
                    driver.isAvailable ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {driver.isAvailable ? 'Disponible' : 'Offline'}
                </span>
                {!driver.isVerified ? (
                  <button
                    onClick={() => verifyDriver.mutate(driver.id)}
                    disabled={verifyDriver.isPending}
                    className="flex items-center gap-1.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <CheckCircle size={14} />
                    Verificar
                  </button>
                ) : (
                  <span className="badge bg-green-100 text-green-700">
                    <CheckCircle size={12} className="mr-1" /> Verificado
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
        {drivers.length === 0 && (
          <div className="card text-center py-12 text-gray-500">No hay conductores</div>
        )}
      </div>
    </div>
  );
}
