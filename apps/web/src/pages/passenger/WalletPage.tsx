import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Send } from 'lucide-react';
import { DuoIcon } from '../../components/ui/DuoIcon';

const TX_ICON_NAME: Record<string, string> = {
  CREDIT:           'plus',
  DEBIT:            'activity',
  REFERRAL_BONUS:   'gift',
  ADMIN_ADJUSTMENT: 'sliders',
};

export default function WalletPage() {
  const { user } = useAuthStore();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then((r) => r.data),
  });

  const { data: txs = [] } = useQuery<any[]>({
    queryKey: ['wallet-transactions'],
    queryFn: () => api.get('/wallet/transactions').then((r) => r.data),
  });

  const balance = wallet?.balance ?? user?.walletBalance ?? 0;

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-5">Billetera</h1>

      {/* Balance card */}
      <div
        className="relative rounded-[22px] p-6 overflow-hidden mb-4"
        style={{
          background:
            'linear-gradient(140deg, rgba(255,255,255,0.10), rgba(0,0,0,0.06) 45%, rgba(0,0,0,0.34)), #1A1714',
          boxShadow: '0 16px 34px -18px rgba(26,23,20,0.6)',
          color: '#fff',
        }}
      >
        <p className="text-[13px] font-semibold opacity-90 mb-1">Saldo disponible</p>
        <p
          className="font-extrabold mb-5 tracking-tight"
          style={{ fontSize: 36, letterSpacing: '-0.02em' }}
        >
          ${balance.toLocaleString('es-AR')}
        </p>
        <div className="flex items-end justify-between">
          <span className="text-[13.5px] font-semibold tracking-[0.1em] opacity-90">ARS</span>
          <span className="text-[14px] font-extrabold tracking-[0.06em]">ZIPI</span>
        </div>
        <div className="absolute right-[-24px] top-[-24px] pointer-events-none" style={{ color: 'rgba(255,255,255,0.12)' }}>
          <DuoIcon name="wallet" size={120} stroke={1.4} fillOpacity={0.18} />
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex gap-3 mb-6">
        {[
          { label: 'Cargar saldo', duo: 'plus' as const },
          { label: 'Enviar', lucide: Send },
        ].map(({ label, duo, lucide: Icon }) => (
          <button
            key={label}
            className="flex-1 flex items-center justify-center gap-2 h-[50px] rounded-[14px] bg-white border border-zipi-rim text-[14.5px] font-bold text-zipi-ink shadow-zipi hover:shadow-md transition-shadow"
          >
            <span style={{ color: '#EF9008' }}>
              {duo ? <DuoIcon name={duo} size={19} stroke={2.2} /> : Icon ? <Icon size={19} strokeWidth={2.2} /> : null}
            </span>
            {label}
          </button>
        ))}
      </div>

      {/* Payment methods */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[17px] font-bold text-zipi-ink tracking-tight">Medios de pago</h2>
        <button className="text-[13.5px] font-semibold text-zipi-500">Administrar</button>
      </div>
      <div className="flex flex-col gap-2.5 mb-6">
        {[
          { iconName: 'card', name: 'Visa ···· 4821', tag: 'Predeterminada' },
          { iconName: 'wallet', name: 'Efectivo', tag: '' },
          { iconName: 'card', name: 'Mastercard ···· 1190', tag: '' },
        ].map(({ iconName, name, tag }, i) => (
          <div
            key={i}
            className="flex items-center gap-3 bg-white border border-zipi-rim rounded-[16px] p-3.5"
          >
            <div className="w-[42px] h-[42px] rounded-[11px] bg-zipi-surface2 flex items-center justify-center text-zipi-ink">
              <DuoIcon name={iconName} size={21} />
            </div>
            <p className="flex-1 text-[14.5px] font-bold text-zipi-ink">{name}</p>
            {tag && (
              <span
                className="text-[11.5px] font-bold rounded-[7px] px-2.5 py-1"
                style={{ background: 'rgba(239,144,8,0.12)', color: '#d46a04' }}
              >
                {tag}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Transactions */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[17px] font-bold text-zipi-ink tracking-tight">Movimientos</h2>
        {txs.length > 5 && (
          <button className="text-[13.5px] font-semibold text-zipi-500">Ver todo</button>
        )}
      </div>
      <div className="bg-white border border-zipi-rim rounded-[22px] shadow-zipi overflow-hidden">
        {txs.length === 0 && (
          <p className="text-[14px] text-zipi-muted text-center py-8">Sin movimientos aún</p>
        )}
        {txs.map((tx: any, i: number) => {
          const pos = tx.amount > 0;
          const iconName = TX_ICON_NAME[tx.type] ?? 'activity';
          return (
            <div
              key={tx.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${i < txs.length - 1 ? 'border-b border-zipi-rim' : ''}`}
            >
              <div
                className="w-10 h-10 rounded-[11px] flex items-center justify-center shrink-0"
                style={{
                  background: pos ? 'rgba(14,158,110,0.12)' : 'rgba(239,144,8,0.08)',
                  color: pos ? '#0E9E6E' : '#6b6760',
                }}
              >
                <DuoIcon name={iconName} size={19} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-zipi-ink truncate">{tx.description}</p>
                <p className="text-[12px] text-zipi-muted">
                  {new Date(tx.createdAt).toLocaleDateString('es-AR', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <p
                className="text-[14.5px] font-extrabold shrink-0"
                style={{ color: pos ? '#0E9E6E' : '#1a1714' }}
              >
                {pos ? '+' : '−'}${Math.abs(tx.amount).toLocaleString('es-AR')}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
