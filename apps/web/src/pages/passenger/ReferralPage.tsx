import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { Copy, Check, Users, Gift } from 'lucide-react';
import { REFERRAL_BONUS } from '../../lib/constants';

export default function ReferralPage() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const code = user?.referralCode ?? '—';
  const shareText = `¡Sumate a Zipi y pedí tu primer remis! Usá mi código ${code} al registrarte y ambos ganamos créditos. Descargá la app en zipi.app`;

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Referí amigos</h1>
        <p className="text-gray-500 mt-1">Ganás créditos cada vez que alguien se registra con tu código</p>
      </div>

      {/* How it works */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-gray-900">¿Cómo funciona?</h2>
        <div className="space-y-3">
          {[
            { icon: '📤', text: 'Compartís tu código único con amigos' },
            { icon: '📝', text: 'Tu amigo se registra usando tu código' },
            { icon: '🎁', text: `Recibís $${REFERRAL_BONUS.toLocaleString('es-AR')} en créditos automáticamente` },
            { icon: '🚗', text: 'Los créditos se descuentan en tu próximo viaje' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-2xl">{step.icon}</span>
              <p className="text-sm text-gray-700">{step.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Referral code */}
      <div className="card text-center space-y-4">
        <p className="text-sm text-gray-500 font-medium">Tu código personal</p>
        <div className="bg-gray-50 rounded-xl py-4 px-6 flex items-center justify-center gap-3">
          <span className="font-mono text-3xl font-bold text-zipi-600 tracking-widest">{code}</span>
          <button
            onClick={copyCode}
            className="w-10 h-10 bg-white border border-gray-200 rounded-xl flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} className="text-gray-500" />}
          </button>
        </div>

        <div className="flex gap-3">
          <button onClick={copyCode} className="btn-secondary flex-1 flex items-center justify-center gap-2">
            <Copy size={16} />
            {copied ? '¡Copiado!' : 'Copiar código'}
          </button>
          <button onClick={shareWhatsApp} className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-xl transition-colors flex items-center justify-center gap-2">
            <span>📱</span>
            WhatsApp
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <Users size={24} className="text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">—</p>
          <p className="text-xs text-gray-500">Amigos referidos</p>
        </div>
        <div className="card text-center">
          <Gift size={24} className="text-zipi-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-gray-900">${(user?.walletBalance ?? 0).toLocaleString('es-AR')}</p>
          <p className="text-xs text-gray-500">Créditos ganados</p>
        </div>
      </div>
    </div>
  );
}
