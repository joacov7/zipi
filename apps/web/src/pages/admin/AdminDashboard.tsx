import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Users, Truck, Car, Package, DollarSign, Activity } from 'lucide-react';

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
          title="Ingresos (envíos)"
          value={`$${(stats?.revenue?.deliveries ?? 0).toLocaleString('es-AR')}`}
          icon={<Activity size={24} className="text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      <div className="card">
        <h2 className="font-bold text-gray-900 mb-2">Ingresos totales</h2>
        <p className="text-4xl font-bold text-zipi-600">
          ${(stats?.revenue?.total ?? 0).toLocaleString('es-AR')}
        </p>
        <p className="text-sm text-gray-500 mt-1">Suma de viajes + envíos completados</p>
      </div>
    </div>
  );
}
