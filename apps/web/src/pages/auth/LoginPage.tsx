import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      setAuth(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zipi-bg px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-[68px] h-[68px] rounded-[20px] mb-4"
            style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
          >
            <span className="text-white font-extrabold text-[28px]">Z</span>
          </div>
          <h1 className="text-[28px] font-extrabold text-zipi-ink tracking-tight">Zipi</h1>
          <p className="text-[14px] text-zipi-muted mt-1">Remisería y Motomandado</p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zipi-rim rounded-[26px] p-6 shadow-zipi">
          <h2 className="text-[19px] font-extrabold text-zipi-ink mb-5">Iniciar sesión</h2>

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
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Contraseña</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50 mt-1"
              style={{ background: '#1A1714' }}
            >
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-[13.5px] text-zipi-muted mt-4">
            ¿No tenés cuenta?{' '}
            <Link to="/register" className="text-zipi-500 font-bold hover:underline">
              Registrate
            </Link>
          </p>
        </div>

        <p className="text-center text-[11.5px] text-zipi-faint mt-4">
          Demo: admin@zipi.ar / juan@example.com — Password123!
        </p>
      </div>
    </div>
  );
}
