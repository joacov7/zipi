import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { Wallet, ArrowUpCircle, ArrowDownCircle, Gift, Settings } from 'lucide-react';

const TYPE_LABELS: Record<string, { label: string; color: string; icon: any }> = {
  CREDIT:           { label: 'Crédito',       color: 'text-green-600', icon: ArrowUpCircle },
  DEBIT:            { label: 'Débito',         color: 'text-red-600',   icon: ArrowDownCircle },
  REFERRAL_BONUS:   { label: 'Bono referido',  color: 'text-purple-600', icon: Gift },
  ADMIN_ADJUSTMENT: { label: 'Ajuste admin',   color: 'text-blue-600',  icon: Settings },
};

export default function WalletPage() {
  const { user } = useAuthStore();

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: () => api.get('/wallet').then((r) => r.data),
  });

  const { data: txs = [] } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: () => api.get('/wallet/transactions').then((r) => r.data),
  });

  const balance = wallet?.balance ?? user?.walletBalance ?? 0;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mi billetera</h1>

      <div className="card bg-gradient-to-br from-zipi-500 to-zipi-700 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Wallet size={24} />
          <p className="font-medium opacity-90">Saldo disponible</p>
        </div>
        <p className="text-5xl font-bold">${balance.toLocaleString('es-AR')}</p>
        <p className="text-sm opacity-75 mt-2">ARS · Se aplica automáticamente al pagar viajes</p>
      </div>

      <div className="card space-y-1">
        <h2 className="font-semibold text-gray-900 mb-3">Movimientos</h2>
        {txs.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">Sin movimientos aún</p>
        )}
        {txs.map((tx: any) => {
          const meta = TYPE_LABELS[tx.type] || { label: tx.type, color: 'text-gray-600', icon: ArrowUpCircle };
          const Icon = meta.icon;
          return (
            <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center bg-gray-50`}>
                  <Icon size={18} className={meta.color} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' · '}{meta.label}
                  </p>
                </div>
              </div>
              <span className={`font-bold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString('es-AR')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
