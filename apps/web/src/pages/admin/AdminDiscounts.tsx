import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Tag, Plus, ToggleLeft, ToggleRight, Copy } from 'lucide-react';

export default function AdminDiscounts() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discountPercent: '10',
    maxUses: '100', minOrderAmount: '', expiresAt: '',
  });

  const { data: codes = [] } = useQuery({
    queryKey: ['admin-discounts'],
    queryFn: () => api.get('/discounts').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/discounts', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-discounts'] });
      setShowForm(false);
      setForm({ code: '', description: '', discountPercent: '10', maxUses: '100', minOrderAmount: '', expiresAt: '' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/discounts/${id}`, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-discounts'] }),
  });

  const handleCreate = () => {
    createMutation.mutate({
      code: form.code.toUpperCase(),
      description: form.description || undefined,
      discountPercent: parseInt(form.discountPercent),
      maxUses: parseInt(form.maxUses),
      minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : undefined,
      expiresAt: form.expiresAt || undefined,
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const isExpired = (code: any) =>
    code.expiresAt && new Date(code.expiresAt) < new Date();
  const isExhausted = (code: any) =>
    code.maxUses > 0 && code.usedCount >= code.maxUses;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Códigos de descuento</h1>
          <p className="text-gray-500 mt-1">
            {codes.filter((c: any) => c.isActive && !isExpired(c) && !isExhausted(c)).length} código(s) activo(s)
          </p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Nuevo código
        </button>
      </div>

      {showForm && (
        <div className="card space-y-4">
          <h2 className="font-semibold text-gray-900">Nuevo código de descuento</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
              <input
                className="input uppercase"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="ZIPI10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
              <input className="input" type="number" min="1" max="100" value={form.discountPercent} onChange={(e) => setForm({ ...form, discountPercent: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Ej: Promo lanzamiento" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Máx. usos</label>
              <input className="input" type="number" value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto mínimo (ARS)</label>
              <input className="input" type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} placeholder="0" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Vencimiento (opcional)</label>
              <input className="input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancelar</button>
            <button onClick={handleCreate} disabled={!form.code || createMutation.isPending} className="btn-primary flex-1">
              {createMutation.isPending ? 'Creando...' : 'Crear código'}
            </button>
          </div>
        </div>
      )}

      {codes.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <Tag size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Sin códigos de descuento</p>
        </div>
      )}

      <div className="space-y-3">
        {codes.map((code: any) => {
          const expired = isExpired(code);
          const exhausted = isExhausted(code);
          const inactive = !code.isActive || expired || exhausted;

          return (
            <div key={code.id} className={`card ${inactive ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${inactive ? 'bg-gray-100 text-gray-400' : 'bg-zipi-100 text-zipi-600'}`}>
                    {code.discountPercent}%
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-gray-900">{code.code}</span>
                      <button onClick={() => copyCode(code.code)} className="text-gray-400 hover:text-gray-600">
                        <Copy size={14} />
                      </button>
                      {expired && <span className="badge bg-red-100 text-red-600 text-xs">Vencido</span>}
                      {exhausted && <span className="badge bg-gray-100 text-gray-600 text-xs">Agotado</span>}
                    </div>
                    {code.description && <p className="text-sm text-gray-500">{code.description}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      Usos: {code.usedCount}/{code.maxUses || '∞'}
                      {code.minOrderAmount ? ` · Mínimo: $${code.minOrderAmount.toLocaleString('es-AR')}` : ''}
                      {code.expiresAt ? ` · Vence: ${new Date(code.expiresAt).toLocaleDateString('es-AR')}` : ''}
                    </p>
                  </div>
                </div>
                {!expired && !exhausted && (
                  <button
                    onClick={() => toggleMutation.mutate({ id: code.id, isActive: !code.isActive })}
                    className="p-1"
                    title={code.isActive ? 'Desactivar' : 'Activar'}
                  >
                    {code.isActive
                      ? <ToggleRight size={28} className="text-green-500" />
                      : <ToggleLeft size={28} className="text-gray-400" />
                    }
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
