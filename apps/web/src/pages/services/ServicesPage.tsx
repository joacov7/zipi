import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { UserRole } from '@zipi/shared';
import { DuoIcon } from '../../components/ui/DuoIcon';

function getCategoryIcon(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('plom')) return 'wrench';
  if (lower.includes('electric')) return 'bolt';
  if (lower.includes('pintu') || lower.includes('pintor')) return 'roller';
  if (lower.includes('cerr')) return 'key';
  if (lower.includes('gas') || lower.includes('gasist')) return 'flame';
  if (lower.includes('aire') || lower.includes('climat')) return 'wind';
  if (lower.includes('carpint')) return 'hammer';
  if (lower.includes('jardin') || lower.includes('paisaj')) return 'leaf';
  return null;
}

export default function ServicesPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [search, setSearch] = useState('');

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

  const filtered = (categories as any[]).filter(
    (c) => search === '' || c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="h-8 w-48 bg-zipi-surface2 rounded-[10px] animate-pulse mb-5" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-zipi-surface2 rounded-[22px] animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-1">
        Servicios del hogar
      </h1>
      <p className="text-[13.5px] text-zipi-muted mb-5">Encontrá el profesional que necesitás</p>

      {/* Search bar */}
      <div className="flex items-center gap-3 bg-white border border-zipi-rim rounded-[16px] px-4 py-3 shadow-zipi mb-5">
        <span style={{ color: '#a39e95' }}>
          <DuoIcon name="search" size={18} stroke={2} />
        </span>
        <input
          type="text"
          className="flex-1 text-[14.5px] font-medium text-zipi-ink placeholder:text-zipi-faint outline-none bg-transparent"
          placeholder="Buscar servicio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Active request banner */}
      {activeRequest && (
        <button
          onClick={() => navigate('/services/my-requests')}
          className="w-full flex items-center gap-3 rounded-[18px] p-4 mb-5 text-left transition-opacity hover:opacity-90"
          style={{ background: 'rgba(239,144,8,0.1)', border: '1px solid rgba(239,144,8,0.3)' }}
        >
          <div
            className="w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0"
            style={{ background: 'rgba(239,144,8,0.2)', color: '#C77A00' }}
          >
            <DuoIcon name="wrench" size={17} stroke={2} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold" style={{ color: '#C77A00' }}>
              Tenés una solicitud activa
            </p>
            <p className="text-[12.5px] truncate" style={{ color: '#C77A00', opacity: 0.8 }}>
              {activeRequest.title} · {activeRequest.category.name}
            </p>
          </div>
          <span style={{ color: '#C77A00', opacity: 0.7 }}>
            <DuoIcon name="chevronRight" size={16} />
          </span>
        </button>
      )}

      {/* Category grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
        {filtered.map((cat: any) => {
          const iconName = getCategoryIcon(cat.name);
          return (
            <button
              key={cat.id}
              onClick={() => navigate(`/services/request?categoryId=${cat.id}`)}
              className="bg-white border border-zipi-rim rounded-[22px] p-5 shadow-zipi flex flex-col items-center gap-2.5 hover:shadow-md hover:border-zipi-faint transition-all cursor-pointer"
            >
              <div
                className="w-[52px] h-[52px] rounded-[15px] flex items-center justify-center"
                style={{ background: 'rgba(109,90,224,0.12)', color: '#6D5AE0' }}
              >
                {iconName ? (
                  <DuoIcon name={iconName} size={26} stroke={2} />
                ) : (
                  <span className="text-2xl leading-none">{cat.icon}</span>
                )}
              </div>
              <span className="font-bold text-[14px] text-zipi-ink text-center leading-tight">
                {cat.name}
              </span>
              {cat.description && (
                <span className="text-[11.5px] text-zipi-faint text-center leading-tight">
                  {cat.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/services/my-requests')}
          className="flex-1 h-[50px] rounded-[16px] font-bold text-[14px] bg-white border border-zipi-rim text-zipi-ink hover:bg-zipi-surface2 transition-colors shadow-zipi"
        >
          Mis solicitudes
        </button>
        {user?.role === UserRole.CONTRACTOR && (
          <button
            onClick={() => navigate('/contractor')}
            className="flex-1 h-[50px] rounded-[16px] font-bold text-[14px] text-white transition-opacity hover:opacity-90"
            style={{ background: '#6D5AE0' }}
          >
            Panel contratista
          </button>
        )}
      </div>
    </div>
  );
}
