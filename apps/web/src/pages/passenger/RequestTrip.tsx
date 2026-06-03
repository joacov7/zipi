import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { MapPin, Navigation, Clock, Tag, Zap, X, Wallet, Locate, ChevronLeft, Check } from 'lucide-react';
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
  const [locating, setLocating] = useState(false);
  const [form, setForm] = useState({
    originAddress: '',
    originLat: DEFAULT_MAP_CENTER.lat,
    originLng: DEFAULT_MAP_CENTER.lng,
    destAddress: '',
    destLat: 0,
    destLng: 0,
  });

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((f) => ({
          ...f,
          originLat: pos.coords.latitude,
          originLng: pos.coords.longitude,
          originAddress: f.originAddress || 'Mi ubicación actual',
        }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

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
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setStep('form')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zipi-rim hover:bg-zipi-surface2 text-zipi-muted transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight">Confirmar viaje</h1>
        </div>

        {/* Route card */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <div className="flex items-start gap-3 mb-3">
            <div className="flex flex-col items-center shrink-0 pt-1">
              <span className="w-[9px] h-[9px] rounded-full border-2 border-zipi-ink bg-white" />
              <span className="w-px flex-1 min-h-[28px] bg-zipi-rim my-1" />
              <span className="w-[9px] h-[9px] rounded-[3px] bg-zipi-500" />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[11px] text-zipi-faint mb-0.5">Origen</p>
                <p className="text-[14px] font-semibold text-zipi-ink leading-tight">
                  {form.originAddress || 'Mi ubicación actual'}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-zipi-faint mb-0.5">Destino</p>
                <p className="text-[14px] font-semibold text-zipi-ink leading-tight">{form.destAddress}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[12.5px] text-zipi-muted pt-2 border-t border-zipi-rim">
            <Clock size={12} />
            <span>~{estimate.estimatedMinutes} min · {estimate.distanceKm} km</span>
          </div>
        </div>

        {/* Surge alert */}
        {estimate.surgeMultiplier > 1 && (
          <div
            className="flex items-center gap-3 rounded-[16px] p-3.5 mb-4"
            style={{ background: 'rgba(239,144,8,0.1)', borderLeft: '3px solid #EF9008' }}
          >
            <Zap size={18} style={{ color: '#EF9008' }} className="shrink-0" />
            <div>
              <p className="text-[13px] font-bold" style={{ color: '#C77A00' }}>{estimate.surgeLabel}</p>
              <p className="text-[12px]" style={{ color: '#C77A00' }}>Tarifa ×{estimate.surgeMultiplier} por alta demanda</p>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <p className="text-[13px] font-bold text-zipi-ink mb-3">Desglose del precio</p>
          <div className="space-y-2">
            {[
              { label: 'Tarifa base', val: `$${estimate.breakdown.baseFare.toLocaleString('es-AR')}` },
              { label: `Distancia (${estimate.distanceKm} km)`, val: `$${estimate.breakdown.distanceFare.toLocaleString('es-AR')}` },
              { label: `Tiempo (${estimate.estimatedMinutes} min)`, val: `$${estimate.breakdown.timeFare.toLocaleString('es-AR')}` },
            ].map(({ label, val }) => (
              <div key={label} className="flex justify-between text-[13.5px] text-zipi-muted">
                <span>{label}</span><span>{val}</span>
              </div>
            ))}
            {estimate.surgeMultiplier > 1 && (
              <div className="flex justify-between text-[13.5px]" style={{ color: '#C77A00' }}>
                <span>Tarifa dinámica ×{estimate.surgeMultiplier}</span><span>incluida</span>
              </div>
            )}
            {discount && (
              <div className="flex justify-between text-[13.5px]" style={{ color: '#0E9E6E' }}>
                <span>Descuento ({discount.discountPercent}%)</span>
                <span>-${discount.discountAmount.toLocaleString('es-AR')}</span>
              </div>
            )}
            {creditsToApply > 0 && (
              <div className="flex justify-between text-[13.5px] text-zipi-500">
                <span>Créditos billetera</span>
                <span>-${creditsToApply.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between font-extrabold text-zipi-ink text-[16px] pt-2 border-t border-dashed border-zipi-rim">
              <span>Total estimado</span>
              <span className="text-zipi-500">${finalPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>
          {creditsToApply > 0 && finalPrice === 0 && (
            <p className="text-[12px] font-semibold text-center mt-2" style={{ color: '#0E9E6E' }}>
              ¡Viaje cubierto completamente con créditos!
            </p>
          )}
        </div>

        {/* Wallet credits toggle */}
        {walletBalance > 0 && (
          <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
            <button
              onClick={() => setUseCredits((v) => !v)}
              className="w-full flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
                  style={{ background: useCredits ? 'rgba(239,144,8,0.12)' : 'rgba(163,158,149,0.12)' }}
                >
                  <Wallet size={19} style={{ color: useCredits ? '#EF9008' : '#a39e95' }} />
                </div>
                <div className="text-left">
                  <p className="text-[14px] font-bold text-zipi-ink">Usar créditos de billetera</p>
                  <p className="text-[12px] text-zipi-muted">${walletBalance.toLocaleString('es-AR')} disponibles</p>
                </div>
              </div>
              <div
                className="w-10 h-6 rounded-full relative transition-colors shrink-0"
                style={{ background: useCredits ? '#EF9008' : '#d4cfc9' }}
              >
                <span
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform"
                  style={{ transform: useCredits ? 'translateX(20px)' : 'translateX(4px)' }}
                />
              </div>
            </button>
            {useCredits && (
              <div className="mt-3 pt-3 border-t border-zipi-rim flex justify-between text-[13.5px]">
                <span className="text-zipi-500 font-semibold">Créditos a descontar</span>
                <span className="font-bold text-zipi-500">-${creditsToApply.toLocaleString('es-AR')}</span>
              </div>
            )}
          </div>
        )}

        {/* Discount code */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <p className="text-[13px] font-bold text-zipi-ink mb-2.5">Código de descuento</p>
          {discount ? (
            <div
              className="flex items-center justify-between rounded-[13px] px-3 py-2.5"
              style={{ background: 'rgba(14,158,110,0.1)', border: '1px solid rgba(14,158,110,0.25)' }}
            >
              <div className="flex items-center gap-2">
                <Tag size={13} style={{ color: '#0E9E6E' }} />
                <span className="text-[13px] font-bold" style={{ color: '#0E9E6E' }}>
                  {discountCode.toUpperCase()} — {discount.discountPercent}% off
                </span>
              </div>
              <button onClick={() => { setDiscount(null); setDiscountCode(''); }} style={{ color: '#0E9E6E' }}>
                <X size={15} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                className="input flex-1 text-[13.5px]"
                placeholder="Ej: ZIPI10"
                value={discountCode}
                onChange={(e) => { setDiscountCode(e.target.value); setDiscountError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
              />
              <button
                onClick={applyDiscount}
                disabled={!discountCode.trim() || discountLoading}
                className="h-[46px] px-4 rounded-[13px] bg-zipi-surface2 hover:bg-zipi-rim text-[13.5px] font-bold text-zipi-ink transition-colors disabled:opacity-50"
              >
                {discountLoading ? '...' : 'Aplicar'}
              </button>
            </div>
          )}
          {discountError && <p className="text-[12px] mt-1.5" style={{ color: '#E03E63' }}>{discountError}</p>}
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: '#1A1714' }}
        >
          {loading ? 'Buscando conductor...' : 'Confirmar viaje'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-5">Pedir un remis</h1>

      {/* Address inputs card */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4 space-y-4">
        <div>
          <label className="flex items-center gap-1.5 text-[12.5px] font-bold text-zipi-ink mb-1.5">
            <Navigation size={13} style={{ color: '#0E9E6E' }} />
            Desde
            {locating && (
              <span className="flex items-center gap-1 text-[11px] font-normal text-zipi-muted ml-1">
                <Locate size={11} className="animate-pulse" /> Obteniendo GPS...
              </span>
            )}
          </label>
          <AddressInput
            value={form.originAddress}
            onChange={(val) => setForm((f) => ({ ...f, originAddress: val }))}
            onSelect={(r) => setForm((f) => ({ ...f, originAddress: r.address, originLat: r.lat, originLng: r.lng }))}
            placeholder={locating ? 'Obteniendo tu ubicación...' : 'Tu dirección actual'}
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-[12.5px] font-bold text-zipi-ink mb-1.5">
            <MapPin size={13} className="text-zipi-500" />
            Hasta
          </label>
          <AddressInput
            value={form.destAddress}
            onChange={(val) => setForm((f) => ({ ...f, destAddress: val }))}
            onSelect={(r) => setForm((f) => ({ ...f, destAddress: r.address, destLat: r.lat, destLng: r.lng }))}
            placeholder="¿A dónde vas?"
          />
        </div>
      </div>

      {/* Quick destinations */}
      <div className="mb-5">
        <p className="text-[12.5px] font-bold text-zipi-faint uppercase tracking-[0.05em] mb-2.5">Destinos frecuentes</p>
        <div className="flex gap-2 flex-wrap">
          {QUICK_DESTINATIONS.map((dest) => (
            <button
              key={dest.label}
              onClick={() => handleEstimate(dest)}
              className="px-4 py-2 bg-white border border-zipi-rim rounded-full text-[13.5px] font-semibold text-zipi-ink hover:bg-zipi-surface2 transition-colors"
            >
              {dest.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => handleEstimate()}
        disabled={loading || !form.destAddress}
        className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50"
        style={{ background: '#1A1714' }}
      >
        {loading ? 'Calculando precio...' : 'Ver precio y confirmar'}
      </button>
    </div>
  );
}
