import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AppModule } from '@zipi/shared';
import { useModuleSettings } from '../../hooks/useModuleSettings';

const MODULE_INFO: Record<AppModule, { label: string; desc: string; icon: string }> = {
  [AppModule.REMIS]: {
    label: 'Remis',
    desc: 'Viajes en auto con conductor. Los pasajeros pueden solicitar remis desde la app.',
    icon: '🚗',
  },
  [AppModule.MOTO_DELIVERY]: {
    label: 'Moto mandados',
    desc: 'Envíos y entregas en moto. Disponible para pasajeros y conductores en moto.',
    icon: '🏍',
  },
  [AppModule.FREIGHT]: {
    label: 'Fletes y maquinaria',
    desc: 'Transporte de carga, mudanzas y alquiler de maquinaria pesada.',
    icon: '🚛',
  },
  [AppModule.SHARED_TRIPS]: {
    label: 'Viajes compartidos',
    desc: 'Carpooling entre usuarios. Los pasajeros publican y se unen a viajes compartidos.',
    icon: '👥',
  },
  [AppModule.SERVICES]: {
    label: 'Marketplace de servicios',
    desc: 'Plomería, electricidad, albañilería y más. Contratistas y clientes se conectan.',
    icon: '🔧',
  },
};

export default function AdminModules() {
  const queryClient = useQueryClient();
  const { data: modules, isLoading } = useModuleSettings();

  const toggleMutation = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      api.patch(`/settings/modules/${key}`, { enabled }).then((r) => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['module-settings'], data);
    },
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-extrabold text-zipi-ink">Módulos</h1>
        <p className="text-zipi-muted text-sm mt-1">
          Activá o desactivá funcionalidades para todos los usuarios de la plataforma.
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-zipi-faint text-sm">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {(Object.keys(MODULE_INFO) as AppModule[]).map((key) => {
            const info = MODULE_INFO[key];
            const enabled = modules?.[key] ?? true;
            const isPending = toggleMutation.isPending && toggleMutation.variables?.key === key;

            return (
              <div key={key}
                className="bg-white rounded-2xl p-6 flex items-center gap-6 border border-zipi-rim shadow-zipi">
                <div className="text-[36px] shrink-0">{info.icon}</div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[16px] text-zipi-ink">{info.label}</p>
                  <p className="text-[13px] text-zipi-muted mt-1">{info.desc}</p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <button
                    onClick={() => toggleMutation.mutate({ key, enabled: !enabled })}
                    disabled={isPending}
                    className="relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50"
                    style={{ background: enabled ? '#1A1714' : '#e5e7eb' }}
                    aria-label={enabled ? 'Desactivar' : 'Activar'}
                  >
                    <span
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200"
                      style={{ transform: enabled ? 'translateX(24px)' : 'translateX(2px)' }}
                    />
                  </button>
                  <span className="text-[12px] font-semibold"
                    style={{ color: enabled ? '#1A1714' : '#9ca3af' }}>
                    {isPending ? '...' : enabled ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 p-4 rounded-xl text-[13px]" style={{ background: '#fffbeb', color: '#92400e', border: '1px solid #fde68a' }}>
        Los cambios se aplican de inmediato. Los usuarios verán las secciones habilitadas al recargar la app.
      </div>
    </div>
  );
}
