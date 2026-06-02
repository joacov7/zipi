import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { MapPin, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AdminZones() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', centerLat: '-34.6037', centerLng: '-58.3816', radiusKm: '10' });

  const { data: zones = [] } = useQuery({
    queryKey: ['admin-zones'],
    queryFn: () => api.get('/zones').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/zones', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-zones'] });
      setShowForm(false);
      setForm({ name: '', centerLat: '-34.6037', centerLng: '-58.3816', radiusKm: '10' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/zones/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-zones'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/zones/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-zones'] }),
  });

  const handleCreate = () => {
    createMutation.mutate({
      name: form.name,
      centerLat: parseFloat(form.centerLat),
      centerLng: parseFloat(form.centerLng),
      radiusKm: parseFloat(form.radiusKm),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Zonas de cobertura</h1>
          <p className="text-gray-500 mt-1">
            {zones.length === 0
              ? 'Sin zonas configuradas — cobertura abierta en todo el territorio'
              : `${zones.filter((z: any) => z.isActive).length} zona(s) activa(s)`}
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nueva zona
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Nueva zona de cobertura</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ej: Gran Buenos Aires" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Latitud centro</label>
              <input className="input" value={form.centerLat} onChange={(e) => setForm({ ...form, centerLat: e.target.value })} placeholder="-34.6037" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Longitud centro</label>
              <input className="input" value={form.centerLng} onChange={(e) => setForm({ ...form, centerLng: e.target.value })} placeholder="-58.3816" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Radio (km)</label>
              <input className="input" type="number" value={form.radiusKm} onChange={(e) => setForm({ ...form, radiusKm: e.target.value })} placeholder="10" />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCreate} disabled={!form.name || createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Creando...' : 'Crear zona'}
            </button>
          </div>
        </div>
      )}

      {zones.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <MapPin size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Sin zonas configuradas</p>
          <p className="text-sm text-gray-400 mt-1">
            Mientras no haya zonas activas, el servicio acepta solicitudes desde cualquier ubicación.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {zones.map((zone: any) => (
          <div key={zone.id} className={`card flex items-start justify-between gap-4 ${!zone.isActive ? 'opacity-60' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${zone.isActive ? 'bg-green-100' : 'bg-gray-100'}`}>
                <MapPin size={18} className={zone.isActive ? 'text-green-600' : 'text-gray-400'} />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{zone.name}</p>
                <p className="text-sm text-gray-500">
                  {zone.centerLat.toFixed(4)}, {zone.centerLng.toFixed(4)} · Radio: {zone.radiusKm} km
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Creada: {new Date(zone.createdAt).toLocaleDateString('es-AR')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateMutation.mutate({ id: zone.id, data: { isActive: !zone.isActive } })}
                className="p-1"
                title={zone.isActive ? 'Desactivar' : 'Activar'}
              >
                {zone.isActive
                  ? <ToggleRight size={28} className="text-green-500" />
                  : <ToggleLeft size={28} className="text-gray-400" />
                }
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Eliminar esta zona?')) deleteMutation.mutate(zone.id);
                }}
                className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
