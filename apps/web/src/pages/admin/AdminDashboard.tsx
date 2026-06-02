import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Users, Truck, Car, Package, DollarSign, Activity, Hammer } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, subtitle, icon, color }: StatCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function MiniBarChart({ data }: { data: { date: string; trips: number; revenue: number }[] }) {
  const maxTrips = Math.max(...data.map((d) => d.trips), 1);
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Viajes últimos 7 días</p>
        <div className="flex items-end gap-1 h-20">
          {data.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{d.trips}</span>
              <div
                className="w-full bg-zipi-400 rounded-t-sm transition-all"
                style={{ height: `${Math.max((d.trips / maxTrips) * 56, d.trips > 0 ? 4 : 0)}px` }}
              />
              <span className="text-xs text-gray-400 truncate w-full text-center">{d.date}</span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Ingresos últimos 7 días (ARS)</p>
        <div className="flex items-end gap-1 h-20">
          {data.map((d) => (
            <div key={d.date} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">
                {d.revenue > 0 ? `$${Math.round(d.revenue / 1000)}k` : '0'}
              </span>
              <div
                className="w-full bg-emerald-400 rounded-t-sm transition-all"
                style={{ height: `${Math.max((d.revenue / maxRev) * 56, d.revenue > 0 ? 4 : 0)}px` }}
              />
              <span className="text-xs text-gray-400 truncate w-full text-center">{d.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zipi-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">Estadísticas en tiempo real</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Usuarios registrados"
          value={stats?.users?.total ?? 0}
          icon={<Users size={24} className="text-purple-600" />}
          color="bg-purple-100"
        />
        <StatCard
          title="Conductores"
          value={stats?.drivers?.total ?? 0}
          subtitle={`${stats?.drivers?.active ?? 0} disponibles ahora`}
          icon={<Truck size={24} className="text-blue-600" />}
          color="bg-blue-100"
        />
        <StatCard
          title="Viajes activos"
          value={stats?.trips?.active ?? 0}
          subtitle={`${stats?.trips?.total ?? 0} totales`}
          icon={<Car size={24} className="text-zipi-600" />}
          color="bg-zipi-100"
        />
        <StatCard
          title="Envíos activos"
          value={stats?.deliveries?.active ?? 0}
          subtitle={`${stats?.deliveries?.total ?? 0} totales`}
          icon={<Package size={24} className="text-green-600" />}
          color="bg-green-100"
        />
        <StatCard
          title="Ingresos (viajes)"
          value={`$${(stats?.revenue?.trips ?? 0).toLocaleString('es-AR')}`}
          icon={<DollarSign size={24} className="text-emerald-600" />}
          color="bg-emerald-100"
        />
        <StatCard
          title="Fletes / Maquinaria"
          value={stats?.freights?.active ?? 0}
          subtitle={`${stats?.freights?.total ?? 0} totales`}
          icon={<Truck size={24} className="text-amber-600" />}
          color="bg-amber-100"
        />
        <StatCard
          title="Camioneros"
          value={stats?.drivers?.trucks ?? 0}
          subtitle={`${stats?.drivers?.machinery ?? 0} maquinistas`}
          icon={<Hammer size={24} className="text-orange-600" />}
          color="bg-orange-100"
        />
        <StatCard
          title="Ingresos (fletes)"
          value={`$${(stats?.revenue?.freights ?? 0).toLocaleString('es-AR')}`}
          icon={<Activity size={24} className="text-amber-600" />}
          color="bg-amber-100"
        />
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 mb-1">Ingresos totales</h2>
        <p className="text-4xl font-bold text-zipi-600">
          ${(stats?.revenue?.total ?? 0).toLocaleString('es-AR')}
        </p>
        <p className="text-sm text-gray-500 mt-1">Suma de viajes + envíos completados</p>
      </div>

      {stats?.chart && stats.chart.length > 0 && (
        <div className="card">
          <h2 className="font-bold text-gray-900 mb-4">Actividad reciente</h2>
          <MiniBarChart data={stats.chart} />
        </div>
      )}
    </div>
  );
}
