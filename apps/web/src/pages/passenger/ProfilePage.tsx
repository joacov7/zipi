import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Check, Copy, ChevronRight, Car, User, MapPin, CreditCard, Shield, Bell, MessageCircle, Gift } from 'lucide-react';

function Stars({ value }: { value?: number }) {
  const full = Math.round(value ?? 0);
  return (
    <span className="flex gap-px">
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} style={{ fontSize: 12, color: i <= full ? '#EF9008' : '#d4cfc9' }}>★</span>
      ))}
    </span>
  );
}

const MENU_GROUPS = [
  [
    { icon: User, label: 'Datos personales' },
    { icon: MapPin, label: 'Mis direcciones' },
    { icon: CreditCard, label: 'Medios de pago' },
  ],
  [
    { icon: Shield, label: 'Seguridad y privacidad' },
    { icon: Bell, label: 'Notificaciones' },
    { icon: MessageCircle, label: 'Ayuda y soporte' },
  ],
];

export default function ProfilePage() {
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [showForm, setShowForm] = useState(false);
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
      setShowForm(false);
      setTimeout(() => setSaved(false), 2000);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });

  const copyReferral = () => {
    navigator.clipboard.writeText(user?.referralCode ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-5">Perfil</h1>

      {/* User hero card */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi flex items-center gap-4 mb-4">
        <div
          className="w-[60px] h-[60px] rounded-full flex items-center justify-center text-white font-extrabold text-[24px] shrink-0"
          style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
        >
          {initial}
        </div>
        <div className="flex-1">
          <p className="text-[18px] font-extrabold text-zipi-ink">{user?.name}</p>
          <p className="text-[13px] text-zipi-muted">{user?.phone || user?.email}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <Stars value={5} />
            <span className="text-[12.5px] font-bold text-zipi-ink">5.0</span>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="text-zipi-faint hover:text-zipi-muted">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Edit form (expandable) */}
      {showForm && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4 space-y-3.5">
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Nombre completo</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Teléfono</label>
            <input
              className="input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">
              CUIT <span className="text-zipi-faint font-normal">(para facturas)</span>
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
            className="h-[54px] w-full rounded-2xl font-bold text-white bg-zipi-ink hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saved ? (
              <><Check size={16} /> Guardado</>
            ) : updateMutation.isPending ? (
              'Guardando...'
            ) : (
              'Guardar cambios'
            )}
          </button>
        </div>
      )}

      {/* Driver mode CTA */}
      <div
        className="flex items-center gap-3.5 rounded-[22px] p-[17px] mb-4 cursor-pointer hover:opacity-90 transition-opacity"
        style={{ background: '#1A1714' }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}
        >
          <Car size={23} strokeWidth={2} />
        </div>
        <div className="flex-1">
          <p className="text-[15px] font-extrabold" style={{ color: '#f4f2ee' }}>
            Modo conductor
          </p>
          <p className="text-[12.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
            Generá ingresos manejando con Zipi
          </p>
        </div>
        <ChevronRight size={20} style={{ color: 'rgba(255,255,255,0.5)' }} />
      </div>

      {/* Wallet summary */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4 flex items-center justify-between">
        <div>
          <p className="text-[12.5px] text-zipi-muted mb-1">Saldo en billetera</p>
          <p className="text-[30px] font-extrabold text-zipi-500 leading-none tracking-tight">
            ${(user?.walletBalance ?? 0).toLocaleString('es-AR')}
          </p>
        </div>
        <a
          href="/wallet"
          className="h-10 px-4 rounded-[12px] bg-zipi-surface2 hover:bg-zipi-rim flex items-center text-[13.5px] font-bold text-zipi-ink transition-colors"
        >
          Ver historial
        </a>
      </div>

      {/* Menu groups */}
      {MENU_GROUPS.map((rows, gi) => (
        <div
          key={gi}
          className="bg-white border border-zipi-rim rounded-[22px] overflow-hidden shadow-zipi mb-3.5"
        >
          {rows.map(({ icon: Icon, label }, i) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-4 py-[15px] hover:bg-zipi-surface2 transition-colors ${
                i < rows.length - 1 ? 'border-b border-zipi-rim' : ''
              }`}
            >
              <span className="text-zipi-muted">
                <Icon size={21} />
              </span>
              <span className="flex-1 text-left text-[14.5px] font-semibold text-zipi-ink">
                {label}
              </span>
              <ChevronRight size={18} className="text-zipi-faint" />
            </button>
          ))}
        </div>
      ))}

      {/* Referral */}
      {user?.referralCode && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-3.5">
          <div className="flex items-center gap-2.5 mb-3">
            <Gift size={18} className="text-zipi-500" />
            <p className="text-[14px] font-bold text-zipi-ink">Tu código de referido</p>
          </div>
          <div className="flex items-center gap-3 bg-zipi-surface2 rounded-[13px] p-3">
            <span className="font-mono font-extrabold text-[20px] text-zipi-500 tracking-widest flex-1">
              {user.referralCode}
            </span>
            <button
              onClick={copyReferral}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-zipi-muted hover:text-zipi-ink transition-colors"
            >
              {copied ? (
                <Check size={15} className="text-[#0E9E6E]" />
              ) : (
                <Copy size={15} />
              )}
              {copied ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <a href="/referral" className="block text-[12px] font-semibold text-zipi-500 mt-2.5 hover:underline">
            Ver programa de referidos →
          </a>
        </div>
      )}

      <p className="text-center text-[12.5px] text-zipi-faint mt-2 mb-4">Zipi · versión 2.4.0</p>
    </div>
  );
}
