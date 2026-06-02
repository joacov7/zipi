import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { MapPin, Navigation, Clock, DollarSign } from 'lucide-react';
import { DEFAULT_MAP_CENTER } from '@zipi/shared';
import AddressInput from '../../components/ui/AddressInput';

interface Estimate {
  estimatedPrice: number;
  estimatedMinutes: number;
  distanceKm: number;
  breakdown: { baseFare: number; distanceFare: number; timeFare: number };
}

const QUICK_DESTINATIONS = [
  { label: 'Centro', lat: -34.6083, lng: -58.3712 },
  { label: 'Aeropuerto', lat: -34.5592, lng: -58.4156 },
  { label: 'Hospital', lat: -34.5999, lng: -58.3853 },
];

export default function RequestTrip() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
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
      if (dest) {
        setForm((f) => ({ ...f, ...destData, destLat: dest.lat, destLng: dest.lng }));
      }
      setStep('confirm');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al estimar');
    } finally {
      setLoading(false);
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
      });
      navigate(`/trip/${data.id}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al solicitar viaje');
    } finally {
      setLoading(false);
    }
  };

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
              <span>Tiempo est. ({estimate.estimatedMinutes} min)</span>
              <span>${estimate.breakdown.timeFare.toLocaleString('es-AR')}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
              <span>Total estimado</span>
              <span className="text-zipi-600">${estimate.estimatedPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
            <Clock size={14} />
            <span>Tiempo estimado: {estimate.estimatedMinutes} minutos</span>
          </div>
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
            onSelect={(r) =>
              setForm((f) => ({
                ...f,
                originAddress: r.address,
                originLat: r.lat,
                originLng: r.lng,
              }))
            }
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
            onSelect={(r) =>
              setForm((f) => ({
                ...f,
                destAddress: r.address,
                destLat: r.lat,
                destLng: r.lng,
              }))
            }
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
