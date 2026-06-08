import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { AppModule } from '@zipi/shared';

export type ModuleMap = Partial<Record<AppModule, boolean>>;

export function useModuleSettings() {
  return useQuery<ModuleMap>({
    queryKey: ['module-settings'],
    queryFn: () => api.get('/settings/modules').then((r) => r.data),
    staleTime: 60_000,
  });
}

export function useModule(key: AppModule, fallback = true): boolean {
  const { data } = useModuleSettings();
  return data ? (data[key] ?? fallback) : fallback;
}
