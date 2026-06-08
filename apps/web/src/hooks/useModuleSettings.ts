import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { AppModule } from '@zipi/shared';

export type ModuleMap = Record<AppModule, boolean>;

export function useModuleSettings() {
  return useQuery<ModuleMap>({
    queryKey: ['module-settings'],
    queryFn: () => api.get('/settings/modules').then((r) => r.data),
    staleTime: 30_000,
  });
}
