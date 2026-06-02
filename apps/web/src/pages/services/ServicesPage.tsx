import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { UserRole } from '@zipi/shared';

export default function ServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['service-categories'],
    queryFn: () => api.get('/services/categories').then((r) => r.data),
  });

  const { data: myRequests = [] } = useQuery({
    queryKey: ['my-service-requests'],
    queryFn: () => api.get('/services/requests/me').then((r) => r.data),
  });

  const activeRequest = myRequests.find((r: any) =>
    ['OPEN', 'QUOTED', 'ACCEPTED', 'IN_PROGRESS'].includes(r.status)
  );

  if (isLoading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Servicios del hogar</h1>
        <p className="text-gray-500 mt-1">Encontrá el profesional que necesitás</p>
      </div>

      {activeRequest && (
        <div
          className="bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer hover:bg-amber-100 transition-colors"
          onClick={() => navigate('/services/my-requests')}
        >
          <p className="text-sm font-semibold text-amber-800">Tenés una solicitud activa</p>
          <p className="text-sm text-amber-700 mt-1">{activeRequest.title} · {activeRequest.category.name}</p>
          <p className="text-xs text-amber-600 mt-1">Ver cotizaciones →</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => navigate(`/services/request?categoryId=${cat.id}`)}
            className="card flex flex-col items-center gap-3 p-6 hover:border-zipi-300 hover:bg-zipi-50 transition-colors border-2 border-transparent cursor-pointer"
          >
            <span className="text-4xl">{cat.icon}</span>
            <span className="font-semibold text-gray-900 text-sm text-center">{cat.name}</span>
            {cat.description && (
              <span className="text-xs text-gray-400 text-center">{cat.description}</span>
            )}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate('/services/my-requests')}
          className="btn-secondary flex-1"
        >
          Mis solicitudes
        </button>
        {user?.role === UserRole.CONTRACTOR && (
          <button
            onClick={() => navigate('/contractor')}
            className="btn-primary flex-1"
          >
            Panel contratista
          </button>
        )}
      </div>
    </div>
  );
}
