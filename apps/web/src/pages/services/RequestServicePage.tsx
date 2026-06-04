import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { ServiceUrgency } from '@zipi/shared';
import { ChevronLeft, Info } from 'lucide-react';
import { DuoIcon } from '../../components/ui/DuoIcon';

function getCategoryIcon(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('plom')) return 'wrench';
  if (lower.includes('electric')) return 'bolt';
  if (lower.includes('pintu') || lower.includes('pintor')) return 'roller';
  if (lower.includes('cerr')) return 'key';
  if (lower.includes('gas') || lower.includes('gasist')) return 'flame';
  if (lower.includes('aire') || lower.includes('climat')) return 'wind';
  if (lower.includes('carpint')) return 'hammer';
  if (lower.includes('jardin') || lower.includes('paisaj')) return 'leaf';
  return null;
}

const URGENCY_OPTIONS = [
  { value: ServiceUrgency.URGENT,   label: 'Urgente',   sub: 'Lo necesito hoy',       bg: 'rgba(224,62,99,0.1)',   border: '#E03E63',  fg: '#E03E63' },
  { value: ServiceUrgency.NORMAL,   label: 'Normal',    sub: 'En los próximos días',   bg: 'rgba(239,144,8,0.1)',   border: '#EF9008',  fg: '#C77A00' },
  { value: ServiceUrgency.FLEXIBLE, label: 'Flexible',  sub: 'Sin apuro',              bg: 'rgba(14,158,110,0.1)', border: '#0E9E6E',  fg: '#0E9E6E' },
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
    <div className="max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={() => navigate('/services')}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zipi-rim hover:bg-zipi-surface2 text-zipi-muted transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight">Nueva solicitud</h1>
      </div>

      {error && (
        <div
          className="rounded-[13px] px-4 py-3 mb-4 text-[13.5px] font-medium"
          style={{ background: 'rgba(224,62,99,0.1)', color: '#E03E63' }}
        >
          {error}
        </div>
      )}

      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi space-y-5">
        {/* Category picker */}
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-2">Tipo de servicio</label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat: any) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setForm({ ...form, categoryId: cat.id })}
                className="flex items-center gap-2 p-3 rounded-[14px] border-2 text-[13.5px] font-semibold transition-colors text-left"
                style={
                  form.categoryId === cat.id
                    ? { borderColor: '#EF9008', background: 'rgba(239,144,8,0.08)', color: '#C77A00' }
                    : { borderColor: '#ebe7df', color: '#6b6760' }
                }
              >
                {getCategoryIcon(cat.name) ? (
                  <DuoIcon name={getCategoryIcon(cat.name)!} size={18} stroke={2} />
                ) : (
                  <span className="text-[18px]">{cat.icon}</span>
                )}
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Título del trabajo</label>
          <input
            className="input"
            placeholder={selectedCategory ? `Ej: ${selectedCategory.name} en cocina` : 'Describí brevemente'}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Descripción detallada</label>
          <textarea
            className="input min-h-[90px] resize-none"
            placeholder="Contá qué pasó, qué hace falta arreglar, medidas, etc."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>

        {/* Address */}
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Dirección</label>
          <input
            className="input"
            placeholder="Calle, número, piso, localidad"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>

        {/* Urgency */}
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-2">Urgencia</label>
          <div className="grid grid-cols-3 gap-2">
            {URGENCY_OPTIONS.map((u) => (
              <button
                key={u.value}
                type="button"
                onClick={() => setForm({ ...form, urgency: u.value })}
                className="flex flex-col items-center p-3 rounded-[14px] border-2 transition-colors"
                style={
                  form.urgency === u.value
                    ? { borderColor: u.border, background: u.bg }
                    : { borderColor: '#ebe7df' }
                }
              >
                <span
                  className="text-[13px] font-bold"
                  style={{ color: form.urgency === u.value ? u.fg : '#1a1714' }}
                >
                  {u.label}
                </span>
                <span className="text-[11px] text-zipi-faint mt-0.5 text-center">{u.sub}</span>
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
          className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: '#6D5AE0' }}
        >
          {createRequest.isPending ? 'Publicando...' : 'Publicar solicitud'}
        </button>
      </div>

      {/* How it works info */}
      <div
        className="rounded-[18px] p-4 mt-4 flex items-start gap-3"
        style={{ background: 'rgba(109,90,224,0.07)', border: '1px solid rgba(109,90,224,0.18)' }}
      >
        <Info size={16} style={{ color: '#6D5AE0' }} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold mb-1" style={{ color: '#6D5AE0' }}>¿Cómo funciona?</p>
          <ol className="text-[12.5px] space-y-0.5 list-decimal list-inside" style={{ color: '#6D5AE0', opacity: 0.8 }}>
            <li>Publicás tu solicitud</li>
            <li>Los profesionales envían cotizaciones</li>
            <li>Aceptás la mejor oferta y confirmás el pago</li>
            <li>El profesional realiza el trabajo</li>
            <li>Confirmás la finalización y el pago se libera</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
