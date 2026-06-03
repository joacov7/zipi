import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { User, Save, Copy, Check } from 'lucide-react';

export default function ProfilePage() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone: user?.phone ?? '',
    cuit: user?.cuit ?? '',
  });
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (data: typeof form) => api.patch('/users/me', data).then((r) => r.data),
    onSuccess: (updatedUser) => {
      if (accessToken && refreshToken) {
        setAuth({ ...user!, ...updatedUser }, accessToken, refreshToken);
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const copyReferral = () => {
    navigator.clipboard.writeText(user?.referralCode ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi perfil</h1>

      <div className="card space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
          <div className="w-16 h-16 bg-zipi-100 rounded-full flex items-center justify-center">
            <span className="text-2xl font-bold text-zipi-600">{user?.name.charAt(0)}</span>
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Miembro desde {new Date(user?.createdAt ?? '').toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
          <input
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CUIT <span className="text-gray-400 font-normal">(para facturas)</span>
          </label>
          <input
            className="input"
            placeholder="20-12345678-9"
            value={form.cuit}
            onChange={(e) => setForm({ ...form, cuit: e.target.value })}
          />
        </div>

        <button
          onClick={() => updateMutation.mutate(form)}
          disabled={updateMutation.isPending}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {saved ? (
            <><Check size={16} /> Guardado</>
          ) : updateMutation.isPending ? (
            'Guardando...'
          ) : (
            <><Save size={16} /> Guardar cambios</>
          )}
        </button>
      </div>

      {/* Wallet summary */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Saldo en billetera</p>
            <p className="text-3xl font-bold text-zipi-600 mt-1">
              ${(user?.walletBalance ?? 0).toLocaleString('es-AR')}
            </p>
          </div>
          <a href="/wallet" className="btn-secondary text-sm">Ver historial</a>
        </div>
      </div>

      {/* Referral code */}
      {user?.referralCode && (
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-3">Tu código de referido</p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <span className="font-mono font-bold text-xl text-zipi-600 tracking-widest flex-1">
              {user.referralCode}
            </span>
            <button onClick={copyReferral} className="flex items-center gap-1 text-sm text-gray-500 hover:text-zipi-600">
              {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <a href="/referral" className="block text-xs text-zipi-500 hover:underline mt-2">
            Ver programa de referidos →
          </a>
        </div>
      )}
    </div>
  );
}
