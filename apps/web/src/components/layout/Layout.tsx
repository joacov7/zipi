import { ReactNode } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { UserRole } from '@zipi/shared';
import {
  Home,
  Car,
  Package,
  History,
  User,
  LogOut,
  LayoutDashboard,
  Users,
  Truck,
  MapPin,
  Hammer,
  Wrench,
  HardHat,
  Tag,
  Wallet,
  Gift,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

function getNavItems(role: string): NavItem[] {
  if (role === UserRole.ADMIN) {
    return [
      { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { to: '/admin/users', label: 'Usuarios', icon: <Users size={20} /> },
      { to: '/admin/drivers', label: 'Conductores', icon: <Truck size={20} /> },
      { to: '/admin/trips', label: 'Viajes', icon: <MapPin size={20} /> },
      { to: '/admin/zones', label: 'Zonas', icon: <MapPin size={20} /> },
      { to: '/admin/discounts', label: 'Descuentos', icon: <Tag size={20} /> },
    ];
  }
  if (role === UserRole.DRIVER) {
    return [
      { to: '/driver', label: 'Inicio', icon: <Home size={20} /> },
      { to: '/driver/history', label: 'Historial', icon: <History size={20} /> },
      { to: '/driver/profile', label: 'Perfil', icon: <User size={20} /> },
    ];
  }
  if (role === UserRole.CONTRACTOR) {
    return [
      { to: '/contractor', label: 'Inicio', icon: <Home size={20} /> },
      { to: '/contractor/jobs', label: 'Mis trabajos', icon: <HardHat size={20} /> },
      { to: '/contractor/profile', label: 'Perfil', icon: <User size={20} /> },
    ];
  }
  return [
    { to: '/home', label: 'Inicio', icon: <Home size={20} /> },
    { to: '/request-trip', label: 'Pedir Remis', icon: <Car size={20} /> },
    { to: '/request-delivery', label: 'Motomandado', icon: <Package size={20} /> },
    { to: '/request-freight', label: 'Fletes / Maquinaria', icon: <Truck size={20} /> },
    { to: '/services', label: 'Servicios', icon: <Wrench size={20} /> },
    { to: '/history', label: 'Historial', icon: <History size={20} /> },
    { to: '/wallet', label: 'Billetera', icon: <Wallet size={20} /> },
    { to: '/referral', label: 'Referir amigos', icon: <Gift size={20} /> },
    { to: '/profile', label: 'Mi perfil', icon: <User size={20} /> },
  ];
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  useNotifications();

  const navItems = getNavItems(user?.role || '');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zipi-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">Z</span>
            </div>
            <div>
              <h1 className="font-bold text-gray-900">Zipi</h1>
              <p className="text-xs text-gray-500">
                {user?.role === UserRole.ADMIN
                  ? 'Administrador'
                  : user?.role === UserRole.DRIVER
                    ? 'Conductor'
                    : user?.role === UserRole.CONTRACTOR
                      ? 'Contratista'
                      : 'Pasajero'}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === item.to
                  ? 'bg-zipi-50 text-zipi-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <User size={16} className="text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              {user?.role === 'PASSENGER' && (user?.walletBalance ?? 0) > 0 && (
                <p className="text-xs text-green-600 font-medium mt-0.5">
                  💰 ${(user.walletBalance ?? 0).toLocaleString('es-AR')} en créditos
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
