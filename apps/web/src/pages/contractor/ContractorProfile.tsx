import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

export default function ContractorProfile() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [form, setForm] = useState({ bio: '', cuit: '', coverageKm: 20 });
  const [error, setError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: () => api.get('/services/contractor/me').then((r) => r.data),
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => api.get('/services/categories').then((r) => r.data),
  });

  const createProfile = useMutation({
    mutationFn: () =>
      api.post('/services/contractor/profile', {
        ...form,
        categoryIds: selectedCategories,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractor-profile'] });
      navigate('/contractor');
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Error'),
  });

  const toggleCategory = (id: string) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  if (profile) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil de contratista</h1>
        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <span className={`badge ${profile.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {profile.isVerified ? '✅ Verificado' : '⏳ Pendiente de verificación'}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Especialidades</p>
            <div className="flex flex-wrap gap-2 mt-1">
              {profile.services.map((s: any) => (
                <span key={s.categoryId} className="badge bg-zipi-100 text-zipi-700">
                  {s.category.icon} {s.category.name}
                </span>
              ))}
            </div>
          </div>
          {profile.bio && (
            <div>
              <p className="text-sm text-gray-500">Bio</p>
              <p className="text-sm text-gray-800">{profile.bio}</p>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4 text-sm text-center">
            <div>
              <p className="font-bold text-gray-900">⭐ {profile.rating.toFixed(1)}</p>
              <p className="text-gray-500 text-xs">Calificación</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile.totalJobs}</p>
              <p className="text-gray-500 text-xs">Trabajos</p>
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile.coverageKm} km</p>
              <p className="text-gray-500 text-xs">Cobertura</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Registrarte como contratista</h1>
        <p className="text-gray-500 mt-1">Completá tu perfil para empezar a recibir trabajos</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Especialidades (seleccioná al menos una)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  selectedCategories.includes(cat.id)
                    ? 'border-zipi-500 bg-zipi-50 text-zipi-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{cat.icon}</span>
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Presentación</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Contá tu experiencia, certificaciones, años en el rubro..."
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CUIT (opcional)</label>
            <input
              className="input"
              placeholder="20-12345678-9"
              value={form.cuit}
              onChange={(e) => setForm({ ...form, cuit: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Radio de cobertura (km)</label>
            <input
              type="number"
              className="input"
              min={1}
              max={200}
              value={form.coverageKm}
              onChange={(e) => setForm({ ...form, coverageKm: Number(e.target.value) })}
            />
          </div>
        </div>

        <button
          onClick={() => createProfile.mutate()}
          disabled={createProfile.isPending || selectedCategories.length === 0}
          className="btn-primary w-full"
        >
          {createProfile.isPending ? 'Guardando...' : 'Crear perfil'}
        </button>
      </div>
    </div>
  );
}
