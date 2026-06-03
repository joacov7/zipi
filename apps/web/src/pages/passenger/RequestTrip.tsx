import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { MapPin, Navigation, Clock, Tag, Zap, X, Wallet } from 'lucide-react';
import { DEFAULT_MAP_CENTER } from '@zipi/shared';
import AddressInput from '../../components/ui/AddressInput';
import { useAuthStore } from '../../stores/auth.store';

interface Estimate {
  estimatedPrice: number;
  estimatedMinutes: number;
  distanceKm: number;
  breakdown: { baseFare: number; distanceFare: number; timeFare: number };
  surgeMultiplier: number;
  surgeLabel: string | null;
}

interface DiscountResult {
  discountPercent: number;
  discountAmount: number;
}

const QUICK_DESTINATIONS = [
  { label: 'Centro', lat: -34.6083, lng: -58.3712 },
  { label: 'Aeropuerto', lat: -34.5592, lng: -58.4156 },
  { label: 'Hospital', lat: -34.5999, lng: -58.3853 },
];

export default function RequestTrip() {
  const navigate = useNavigate();
  const { user, setAuth, accessToken, refreshToken } = useAuthStore();
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [discountCode, setDiscountCode] = useState('');
  const [discount, setDiscount] = useState<DiscountResult | null>(null);
  const [discountError, setDiscountError] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [useCredits, setUseCredits] = useState(false);
  const [form, setForm] = useState({
    originAddress: '',
    originLat: DEFAULT_MAP_CENTER.lat,
    originLng: DEFAULT_MAP_CENTER.lng,
    destAddress: '',
    destLat: 0,
    destLng: 0,
  });

  const handleEstimate = async (dest?: (typeof QUICK_DESTINATIONS)[0]) => {
    const destData = dest
      ? { destLat: dest.lat, destLng: dest.lng, destAddress: dest.label }
      : { destLat: form.destLat, destLng: form.destLng, destAddress: form.destAddress };

    if (!destData.destAddress) return;

    setLoading(true);
    try {
      const { data } = await api.post('/trips/estimate', {
        originLat: form.originLat,
        originLng: form.originLng,
        destLat: destData.destLat || DEFAULT_MAP_CENTER.lat - 0.05,
        destLng: destData.destLng || DEFAULT_MAP_CENTER.lng - 0.05,
      });
      setEstimate(data);
      if (dest) setForm((f) => ({ ...f, ...destData, destLat: dest.lat, destLng: dest.lng }));
      setStep('confirm');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al estimar');
    } finally {
      setLoading(false);
    }
  };

  const applyDiscount = async () => {
    if (!discountCode.trim() || !estimate) return;
    setDiscountLoading(true);
    setDiscountError('');
    try {
      const { data } = await api.post('/discounts/validate', {
        code: discountCode.trim().toUpperCase(),
        orderAmount: estimate.estimatedPrice,
      });
      setDiscount(data);
    } catch (err: any) {
      setDiscountError(err.response?.data?.message || 'Código inválido');
      setDiscount(null);
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/trips', {
        originLat: form.originLat,
        originLng: form.originLng,
        originAddress: form.originAddress || 'Mi ubicación',
        destLat: form.destLat || DEFAULT_MAP_CENTER.lat - 0.05,
        destLng: form.destLng || DEFAULT_MAP_CENTER.lng - 0.05,
        destAddress: form.destAddress,
        discountCode: discount ? discountCode.trim().toUpperCase() : undefined,
        useWalletCredits: useCredits,
      });
      // Update wallet balance optimistically in store
      if (useCredits && user && creditsToApply > 0 && accessToken && refreshToken) {
        setAuth({ ...user, walletBalance: (user.walletBalance ?? 0) - creditsToApply }, accessToken, refreshToken);
      }
      navigate(`/trip/${data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al solicitar viaje');
    } finally {
      setLoading(false);
    }
  };

  const afterDiscount = (estimate?.estimatedPrice ?? 0) - (discount?.discountAmount ?? 0);
  const walletBalance = user?.walletBalance ?? 0;
  const creditsToApply = useCredits ? Math.min(walletBalance, afterDiscount) : 0;
  const finalPrice = Math.max(0, afterDiscount - creditsToApply);

  if (step === 'confirm' && estimate) {

    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmar viaje</h1>
          <p className="text-gray-500 mt-1">Revisá los detalles antes de confirmar</p>
        </div>

        <div className="card space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <Navigation size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Origen</p>
              <p className="font-medium">{form.originAddress || 'Mi ubicación actual'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
              <MapPin size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Destino</p>
              <p className="font-medium">{form.destAddress}</p>
            </div>
          </div>
        </div>

        {/* Surge alert */}
        {estimate.surgeMultiplier > 1 && (
          <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <Zap size={18} className="text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-amber-800">{estimate.surgeLabel}</p>
              <p className="text-xs text-amber-600">Tarifa ×{estimate.surgeMultiplier} activa por alta demanda</p>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Estimación de precio</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tarifa base</span>
              <span>${estimate.breakdown.baseFare.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Distancia ({estimate.distanceKm} km)</span>
              <span>${estimate.breakdown.distanceFare.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tiempo ({estimate.estimatedMinutes} min)</span>
              <span>${estimate.breakdown.timeFare.toLocaleString('es-AR')}</span>
            </div>
            {estimate.surgeMultiplier > 1 && (
              <div className="flex justify-between text-amber-600">
                <span>Tarifa dinámica ×{estimate.surgeMultiplier}</span>
                <span>incluida</span>
              </div>
            )}
            {discount && (
              <div className="flex justify-between text-green-600">
                <span>Descuento ({discount.discountPercent}%)</span>
                <span>-${discount.discountAmount.toLocaleString('es-AR')}</span>
              </div>
            )}
            {creditsToApply > 0 && (
              <div className="flex justify-between text-zipi-600">
                <span>Créditos billetera</span>
                <span>-${creditsToApply.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
              <span>Total estimado</span>
              <span className="text-zipi-600">${finalPrice.toLocaleString('es-AR')}</span>
            </div>
            {creditsToApply > 0 && finalPrice === 0 && (
              <p className="text-xs text-zipi-500 text-center mt-1">¡Viaje cubierto completamente con créditos!</p>
            )}
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <Clock size={14} />
            <span>Tiempo estimado: {estimate.estimatedMinutes} minutos</span>
          </div>
        </div>

        {/* Wallet credits */}
        {walletBalance > 0 && (
          <div className="card">
            <button
              onClick={() => setUseCredits((v) => !v)}
              className={`w-full flex items-center justify-between gap-3 transition-colors ${useCredits ? 'text-zipi-700' : 'text-gray-700'}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${useCredits ? 'bg-zipi-100' : 'bg-gray-100'}`}>
                  <Wallet size={18} className={useCredits ? 'text-zipi-600' : 'text-gray-500'} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold">Usar créditos de billetera</p>
                  <p className="text-xs text-gray-500">Tenés ${walletBalance.toLocaleString('es-AR')} disponibles</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors relative ${useCredits ? 'bg-zipi-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${useCredits ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </button>
            {useCredits && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-sm">
                <span className="text-zipi-600 font-medium">Créditos a usar</span>
                <span className="font-semibold text-zipi-600">-${creditsToApply.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>
        )}

        {/* Discount code */}
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-2">Código de descuento</p>
          {discount ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag size={14} className="text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {discountCode.toUpperCase()} — {discount.discountPercent}% off
                </span>
              </div>
              <button onClick={() => { setDiscount(null); setDiscountCode(''); }} className="text-green-500 hover:text-green-700">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="input flex-1 text-sm"
                placeholder="Ej: ZIPI10"
                value={discountCode}
                onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
              />
              <button
                onClick={applyDiscount}
                disabled={!discountCode.trim() || discountLoading}
                className="btn-secondary text-sm px-4"
              >
                {discountLoading ? '...' : 'Aplicar'}
              </button>
            </div>
          )}
          {discountError && <p className="text-xs text-red-600 mt-1">{discountError}</p>}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="btn-secondary flex-1">
            Atrás
          </button>
          <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Buscando conductor...' : 'Confirmar viaje'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedir un remis</h1>
        <p className="text-gray-500 mt-1">Ingresá tu destino para ver el precio</p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Navigation size={14} className="inline mr-1 text-green-500" />
            Desde (tu ubicación)
          </label>
          <AddressInput
            value={form.originAddress}
            onChange={(val) => setForm((f) => ({ ...f, originAddress: val }))}
            onSelect={(r) => setForm((f) => ({ ...f, originAddress: r.address, originLat: r.lat, originLng: r.lng }))}
            placeholder="Tu dirección actual"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin size={14} className="inline mr-1 text-red-500" />
            Hasta (destino)
          </label>
          <AddressInput
            value={form.destAddress}
            onChange={(val) => setForm((f) => ({ ...f, destAddress: val }))}
            onSelect={(r) => setForm((f) => ({ ...f, destAddress: r.address, destLat: r.lat, destLng: r.lng }))}
            placeholder="¿A dónde vas?"
          />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-700 mb-3">Destinos frecuentes</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_DESTINATIONS.map((dest) => (
            <button
              key={dest.label}
              onClick={() => handleEstimate(dest)}
              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:border-zipi-300 hover:bg-zipi-50 transition-colors"
            >
              {dest.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => handleEstimate()}
        disabled={loading || !form.destAddress}
        className="btn-primary w-full"
      >
        {loading ? 'Calculando...' : 'Ver precio y confirmar'}
      </button>
    </div>
  );
}
