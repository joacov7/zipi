import { useState } from 'react';
import { useAuthStore } from '../../stores/auth.store';
import { Copy, Check, Users, Gift, Share2 } from 'lucide-react';
import { REFERRAL_BONUS } from '../../lib/constants';

const STEPS = [
  { num: '1', text: 'Compartís tu código único con amigos' },
  { num: '2', text: 'Tu amigo se registra usando tu código' },
  { num: '3', text: `Recibís $${REFERRAL_BONUS.toLocaleString('es-AR')} en créditos automáticamente` },
  { num: '4', text: 'Los créditos se descuentan en tu próximo viaje' },
];

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
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-1">Referí amigos</h1>
      <p className="text-[13.5px] text-zipi-muted mb-5">Ganás créditos cada vez que alguien se registra con tu código</p>

      {/* Code card */}
      <div
        className="rounded-[22px] p-6 mb-4 text-center"
        style={{
          background: 'linear-gradient(140deg, rgba(255,255,255,0.14), rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.32)), #EF9008',
          boxShadow: '0 16px 34px -18px rgba(239,144,8,0.55)',
        }}
      >
        <p className="text-[13px] font-semibold text-white opacity-90 mb-1.5">Tu código personal</p>
        <p className="font-mono font-extrabold text-[34px] text-white tracking-[0.14em] leading-none mb-5">{code}</p>
        <div className="flex gap-2.5">
          <button
            onClick={copyCode}
            className="flex-1 h-[46px] bg-white bg-opacity-20 hover:bg-opacity-30 rounded-[14px] font-bold text-white text-[14px] flex items-center justify-center gap-2 transition-all"
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? '¡Copiado!' : 'Copiar'}
          </button>
          <button
            onClick={shareWhatsApp}
            className="flex-1 h-[46px] bg-white bg-opacity-20 hover:bg-opacity-30 rounded-[14px] font-bold text-white text-[14px] flex items-center justify-center gap-2 transition-all"
          >
            <Share2 size={16} />
            WhatsApp
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white border border-zipi-rim rounded-[22px] p-4 shadow-zipi text-center">
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center mx-auto mb-2"
            style={{ background: 'rgba(109,90,224,0.12)' }}
          >
            <Users size={19} style={{ color: '#6D5AE0' }} />
          </div>
          <p className="text-[24px] font-extrabold text-zipi-ink">—</p>
          <p className="text-[12px] text-zipi-muted">Amigos referidos</p>
        </div>
        <div className="bg-white border border-zipi-rim rounded-[22px] p-4 shadow-zipi text-center">
          <div
            className="w-10 h-10 rounded-[12px] flex items-center justify-center mx-auto mb-2"
            style={{ background: 'rgba(239,144,8,0.12)' }}
          >
            <Gift size={19} className="text-zipi-500" />
          </div>
          <p className="text-[24px] font-extrabold text-zipi-ink">
            ${(user?.walletBalance ?? 0).toLocaleString('es-AR')}
          </p>
          <p className="text-[12px] text-zipi-muted">Créditos ganados</p>
        </div>
      </div>

      {/* How it works */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi">
        <p className="text-[14px] font-bold text-zipi-ink mb-4">¿Cómo funciona?</p>
        <div className="space-y-3.5">
          {STEPS.map(({ num, text }) => (
            <div key={num} className="flex items-start gap-3.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-extrabold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
              >
                {num}
              </div>
              <p className="text-[13.5px] text-zipi-muted leading-snug pt-0.5">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
