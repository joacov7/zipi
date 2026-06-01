import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Search, UserX, UserCheck } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  PASSENGER: 'Pasajero',
  DRIVER: 'Conductor',
  ADMIN: 'Admin',
};

export default function AdminUsers() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => api.get(`/admin/users?search=${search}`).then((r) => r.data),
  });

  const toggleStatus = useMutation({
    mutationFn: (userId: string) => api.patch(`/admin/users/${userId}/toggle-status`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-500 mt-1">{data?.total ?? 0} usuarios registrados</p>
        </div>
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10"
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-6 py-4 font-medium text-gray-500">Usuario</th>
              <th className="text-left px-6 py-4 font-medium text-gray-500">Teléfono</th>
              <th className="text-left px-6 py-4 font-medium text-gray-500">Rol</th>
              <th className="text-left px-6 py-4 font-medium text-gray-500">Estado</th>
              <th className="text-left px-6 py-4 font-medium text-gray-500">Registrado</th>
              <th className="px-6 py-4" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-gray-500">{user.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{user.phone}</td>
                <td className="px-6 py-4">
                  <span
                    className={`badge ${
                      user.role === 'ADMIN'
                        ? 'bg-purple-100 text-purple-700'
                        : user.role === 'DRIVER'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`badge ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                  >
                    {user.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-500">
                  {new Date(user.createdAt).toLocaleDateString('es-AR')}
                </td>
                <td className="px-6 py-4">
                  {user.role !== 'ADMIN' && (
                    <button
                      onClick={() => toggleStatus.mutate(user.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        user.isActive
                          ? 'text-red-600 hover:bg-red-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                    >
                      {user.isActive ? (
                        <>
                          <UserX size={14} /> Desactivar
                        </>
                      ) : (
                        <>
                          <UserCheck size={14} /> Activar
                        </>
                      )}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="text-center py-12 text-gray-500">No se encontraron usuarios</div>
        )}
      </div>
    </div>
  );
}
