import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '../../lib/api';

interface FareConfig {
  id: string;
  serviceType: string;
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  nightMultiplier: number;
  isActive: boolean;
}

interface CommissionConfig {
  id: string;
  serviceType: string;
  percentage: number;
  isActive: boolean;
}

const SERVICE_LABELS: Record<string, string> = { REMIS: 'Remis / Auto', MOTO: 'Motomandado' };

export default function AdminPricing() {
  const qc = useQueryClient();
  const [editFare, setEditFare] = useState<FareConfig | null>(null);
  const [editCommission, setEditCommission] = useState<CommissionConfig | null>(null);

  const { data: fares = [] } = useQuery<FareConfig[]>({
    queryKey: ['admin', 'fares'],
    queryFn: () => api.get('/admin/pricing/fares').then((r) => r.data),
  });

  const { data: commissions = [] } = useQuery<CommissionConfig[]>({
    queryKey: ['admin', 'commissions'],
    queryFn: () => api.get('/admin/pricing/commissions').then((r) => r.data),
  });

  const updateFare = useMutation({
    mutationFn: ({ serviceType, data }: { serviceType: string; data: Partial<FareConfig> }) =>
      api.patch(`/admin/pricing/fares/${serviceType}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'fares'] }); setEditFare(null); },
  });

  const updateCommission = useMutation({
    mutationFn: ({ serviceType, data }: { serviceType: string; data: Partial<CommissionConfig> }) =>
      api.patch(`/admin/pricing/commissions/${serviceType}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'commissions'] }); setEditCommission(null); },
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-zipi-ink">Tarifas y Comisiones</h1>
        <p className="text-zipi-muted text-sm mt-1">Configuración de precios por tipo de servicio</p>
      </div>

      {/* Fare configs */}
      <section>
        <h2 className="text-lg font-bold text-zipi-ink mb-3">Tarifas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fares.map((fare) => (
            <div key={fare.id} className="bg-white border border-zipi-rim rounded-2xl p-5 shadow-zipi">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-zipi-ink">{SERVICE_LABELS[fare.serviceType] ?? fare.serviceType}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${fare.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {fare.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="space-y-1 text-sm text-zipi-muted">
                <p>Base: <span className="font-semibold text-zipi-ink">${fare.baseFare}</span></p>
                <p>Por km: <span className="font-semibold text-zipi-ink">${fare.perKm}</span></p>
                <p>Por minuto: <span className="font-semibold text-zipi-ink">${fare.perMinute}</span></p>
                <p>Mínimo: <span className="font-semibold text-zipi-ink">${fare.minimumFare}</span></p>
                <p>Mult. nocturno: <span className="font-semibold text-zipi-ink">×{fare.nightMultiplier}</span></p>
              </div>
              <button
                onClick={() => setEditFare({ ...fare })}
                className="mt-3 text-sm font-semibold text-zipi-500 hover:underline"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Commission configs */}
      <section>
        <h2 className="text-lg font-bold text-zipi-ink mb-3">Comisiones de plataforma</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {commissions.map((c) => (
            <div key={c.id} className="bg-white border border-zipi-rim rounded-2xl p-5 shadow-zipi">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-zipi-ink">{SERVICE_LABELS[c.serviceType] ?? c.serviceType}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {c.isActive ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <p className="text-sm text-zipi-muted">
                Comisión: <span className="font-extrabold text-zipi-ink text-lg">{c.percentage}%</span>
              </p>
              <button
                onClick={() => setEditCommission({ ...c })}
                className="mt-3 text-sm font-semibold text-zipi-500 hover:underline"
              >
                Editar
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Edit fare modal */}
      {editFare && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-zipi-ink mb-4">Editar tarifa — {SERVICE_LABELS[editFare.serviceType] ?? editFare.serviceType}</h3>
            {(['baseFare', 'perKm', 'perMinute', 'minimumFare', 'nightMultiplier'] as const).map((field) => (
              <div key={field} className="mb-3">
                <label className="block text-xs font-bold text-zipi-ink mb-1">
                  {field === 'baseFare' ? 'Tarifa base ($)' : field === 'perKm' ? 'Por km ($)' : field === 'perMinute' ? 'Por minuto ($)' : field === 'minimumFare' ? 'Mínimo ($)' : 'Mult. nocturno'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input"
                  value={editFare[field]}
                  onChange={(e) => setEditFare({ ...editFare, [field]: parseFloat(e.target.value) })}
                />
              </div>
            ))}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => updateFare.mutate({ serviceType: editFare.serviceType, data: editFare })}
                disabled={updateFare.isPending}
                className="flex-1 h-10 rounded-xl bg-zipi-ink text-white font-bold text-sm disabled:opacity-50"
              >
                {updateFare.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditFare(null)} className="flex-1 h-10 rounded-xl border border-zipi-rim text-zipi-muted font-bold text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit commission modal */}
      {editCommission && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-zipi-ink mb-4">Editar comisión — {SERVICE_LABELS[editCommission.serviceType] ?? editCommission.serviceType}</h3>
            <div className="mb-3">
              <label className="block text-xs font-bold text-zipi-ink mb-1">Porcentaje (%)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="50"
                className="input"
                value={editCommission.percentage}
                onChange={(e) => setEditCommission({ ...editCommission, percentage: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => updateCommission.mutate({ serviceType: editCommission.serviceType, data: editCommission })}
                disabled={updateCommission.isPending}
                className="flex-1 h-10 rounded-xl bg-zipi-ink text-white font-bold text-sm disabled:opacity-50"
              >
                {updateCommission.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button onClick={() => setEditCommission(null)} className="flex-1 h-10 rounded-xl border border-zipi-rim text-zipi-muted font-bold text-sm">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
