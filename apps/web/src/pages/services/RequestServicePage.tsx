import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ServiceUrgency } from '@zipi/shared';

const URGENCY_OPTIONS = [
  { value: ServiceUrgency.URGENT,   label: '🚨 Urgente',   desc: 'Lo necesito hoy' },
  { value: ServiceUrgency.NORMAL,   label: '📅 Normal',    desc: 'En los próximos días' },
  { value: ServiceUrgency.FLEXIBLE, label: '🗓 Flexible',  desc: 'Sin apuro' },
];

export default function RequestServicePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const preselectedCategoryId = params.get('categoryId') || '';

  const [form, setForm] = useState({
    categoryId: preselectedCategoryId,
    title: '',
    description: '',
    address: '',
    urgency: ServiceUrgency.NORMAL,
  });
  const [error, setError] = useState('');

  const { data: categories = [] } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => api.get('/services/categories').then((r) => r.data),
  });

  const createRequest = useMutation({
    mutationFn: () => api.post('/services/requests', form),
    onSuccess: () => navigate('/services/my-requests'),
    onError: (err: any) => setError(err.response?.data?.message || 'Error al crear solicitud'),
  });

  const selectedCategory = categories.find((c: any) => c.id === form.categoryId);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <button onClick={() => navigate('/services')} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
          ← Volver
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Nueva solicitud de servicio</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de servicio</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm({ ...form, categoryId: cat.id })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                  form.categoryId === cat.id
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Título del trabajo</label>
          <input
            className="input"
            placeholder={selectedCategory ? `Ej: ${selectedCategory.name} en cocina` : 'Describí brevemente'}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción detallada</label>
          <textarea
            className="input min-h-[100px] resize-none"
            placeholder="Contá qué pasó, qué hace falta arreglar, medidas, etc."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
          <input
            className="input"
            placeholder="Calle, número, piso, localidad"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Urgencia</label>
          <div className="grid grid-cols-3 gap-2">
            {URGENCY_OPTIONS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setForm({ ...form, urgency: u.value })}
                className={`flex flex-col items-center p-3 rounded-xl border-2 transition-colors ${
                  form.urgency === u.value
                    ? 'border-zipi-500 bg-zipi-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-sm font-medium">{u.label}</span>
                <span className="text-xs text-gray-500 mt-0.5 text-center">{u.desc}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => createRequest.mutate()}
          disabled={
            createRequest.isPending ||
            !form.categoryId ||
            !form.title ||
            !form.description ||
            !form.address
          }
          className="btn-primary w-full"
        >
          {createRequest.isPending ? 'Publicando...' : 'Publicar solicitud'}
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-semibold mb-1">¿Cómo funciona?</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600">
          <li>Publicás tu solicitud</li>
          <li>Los profesionales envían cotizaciones</li>
          <li>Aceptás la mejor oferta y confirmás el pago</li>
          <li>El profesional realiza el trabajo</li>
          <li>Confirmás la finalización y el pago se libera</li>
        </ol>
      </div>
    </div>
  );
}
