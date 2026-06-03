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
  Wrench,
  HardHat,
  Tag,
  Wallet,
  Gift,
  UsersRound,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

function getNavItems(role: string): NavItem[] {
  if (role === UserRole.ADMIN) {
    return [
      { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { to: '/admin/users', label: 'Usuarios', icon: <Users size={18} /> },
      { to: '/admin/drivers', label: 'Conductores', icon: <Truck size={18} /> },
      { to: '/admin/trips', label: 'Viajes', icon: <MapPin size={18} /> },
      { to: '/admin/zones', label: 'Zonas', icon: <MapPin size={18} /> },
      { to: '/admin/discounts', label: 'Descuentos', icon: <Tag size={18} /> },
    ];
  }
  if (role === UserRole.DRIVER) {
    return [
      { to: '/driver', label: 'Inicio', icon: <Home size={18} /> },
      { to: '/driver/history', label: 'Historial', icon: <History size={18} /> },
      { to: '/driver/profile', label: 'Perfil', icon: <User size={18} /> },
    ];
  }
  if (role === UserRole.CONTRACTOR) {
    return [
      { to: '/contractor', label: 'Inicio', icon: <Home size={18} /> },
      { to: '/contractor/jobs', label: 'Mis trabajos', icon: <HardHat size={18} /> },
      { to: '/contractor/profile', label: 'Perfil', icon: <User size={18} /> },
    ];
  }
  return [
    { to: '/home', label: 'Inicio', icon: <Home size={18} /> },
    { to: '/request-trip', label: 'Pedir Remis', icon: <Car size={18} /> },
    { to: '/request-delivery', label: 'Motomandado', icon: <Package size={18} /> },
    { to: '/request-freight', label: 'Fletes / Maquinaria', icon: <Truck size={18} /> },
    { to: '/services', label: 'Servicios', icon: <Wrench size={18} /> },
    { to: '/history', label: 'Actividad', icon: <History size={18} /> },
    { to: '/shared-trips', label: 'Viajes compartidos', icon: <UsersRound size={18} /> },
    { to: '/wallet', label: 'Billetera', icon: <Wallet size={18} /> },
    { to: '/referral', label: 'Referir amigos', icon: <Gift size={18} /> },
    { to: '/profile', label: 'Mi perfil', icon: <User size={18} /> },
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

  const initial = user?.name?.charAt(0)?.toUpperCase() ?? 'U';

  return (
    <div className="flex h-screen bg-zipi-bg">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-zipi-rim flex flex-col shrink-0">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-zipi-rim">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
            >
              <span className="text-white font-extrabold text-[17px]">Z</span>
            </div>
            <div>
              <p className="font-extrabold text-zipi-ink text-[15px] leading-none">Zipi</p>
              <p className="text-[11px] text-zipi-faint mt-0.5">
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

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[11px] text-[13.5px] font-semibold transition-colors ${
                  active
                    ? 'bg-zipi-ink text-white'
                    : 'text-zipi-muted hover:bg-zipi-surface2 hover:text-zipi-ink'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-zipi-rim pt-3">
          {/* User info */}
          <div className="flex items-center gap-3 px-2 mb-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-[13px] shrink-0"
              style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
            >
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-zipi-ink truncate">{user?.name}</p>
              <p className="text-[11px] text-zipi-faint truncate">{user?.email}</p>
            </div>
            <Link to="/profile" className="text-zipi-faint hover:text-zipi-muted">
              <ChevronRight size={15} />
            </Link>
          </div>
          {user?.role === 'PASSENGER' && (user?.walletBalance ?? 0) > 0 && (
            <Link
              to="/wallet"
              className="flex items-center justify-between mx-2 mb-2 px-3 py-2 rounded-[10px]"
              style={{ background: 'rgba(14,158,110,0.1)', color: '#0E9E6E' }}
            >
              <span className="text-[12px] font-semibold">Saldo</span>
              <span className="text-[13px] font-extrabold">
                ${(user.walletBalance ?? 0).toLocaleString('es-AR')}
              </span>
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] text-red-500 hover:bg-red-50 rounded-[10px] transition-colors font-medium"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto p-8">{children}</div>
      </main>
    </div>
  );
}
