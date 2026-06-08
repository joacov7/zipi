import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { UserRole } from '@zipi/shared';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.PASSENGER,
    referralCode: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { role, ...rest } = form;
      const payload = { ...rest, referralCode: rest.referralCode.trim() || undefined };
      const { data } = await api.post('/auth/register', payload);
      setAuth(data.user, data.accessToken, data.refreshToken);
      if (role === 'DRIVER') navigate('/driver');
      else navigate('/home');
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join('\n') : (msg || 'Error al registrarse'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zipi-bg px-4 py-8">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-[20px] mb-4"
            style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
          >
            <span className="text-white font-extrabold text-[28px]">Z</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-zipi-ink tracking-tight">Creá tu cuenta</h1>
          <p className="text-[14px] text-zipi-muted mt-1">Gratis y en menos de 1 minuto</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zipi-rim rounded-[26px] p-6 shadow-zipi">
          {error && (
            <div
              className="rounded-[13px] px-4 py-3 mb-4 text-[13.5px] font-medium"
              style={{ background: 'rgba(224,62,99,0.1)', color: '#E03E63' }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Nombre completo</label>
              <input
                className="input"
                placeholder="Juan Pérez"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Email</label>
              <input
                type="email"
                className="input"
                placeholder="tu@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Teléfono</label>
              <input
                className="input"
                placeholder="+541111111111"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="Mínimo 8 caracteres"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={8}
                required
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Tipo de cuenta</label>
              <select
                className="input"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              >
                <option value={UserRole.PASSENGER}>Pasajero / Cliente</option>
                <option value={UserRole.DRIVER}>Conductor</option>
              </select>
            </div>
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">
                Código de referido{' '}
                <span className="text-zipi-faint font-normal">(opcional)</span>
              </label>
              <input
                className="input"
                placeholder="Ej: JUAN4X2F"
                value={form.referralCode}
                onChange={(e) => setForm({ ...form, referralCode: e.target.value.toUpperCase() })}
              />
              {form.referralCode && (
                <p className="text-[12px] mt-1.5 font-medium" style={{ color: '#0E9E6E' }}>
                  Ambos recibirán créditos al completar el registro
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50 mt-1"
              style={{ background: '#1A1714' }}
            >
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-[13.5px] text-zipi-muted mt-4">
            ¿Ya tenés cuenta?{' '}
            <Link to="/login" className="text-zipi-500 font-bold hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
