import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { MapPin, Navigation, Package } from 'lucide-react';
import { DEFAULT_MAP_CENTER } from '@zipi/shared';

interface Estimate {
  estimatedPrice: number;
  estimatedMinutes: number;
  distanceKm: number;
}

export default function RequestDelivery() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [form, setForm] = useState({
    pickupAddress: '',
    pickupLat: DEFAULT_MAP_CENTER.lat,
    pickupLng: DEFAULT_MAP_CENTER.lng,
    dropoffAddress: '',
    dropoffLat: DEFAULT_MAP_CENTER.lat - 0.05,
    dropoffLng: DEFAULT_MAP_CENTER.lng - 0.05,
    packageDescription: '',
    recipientName: '',
    recipientPhone: '',
  });

  const handleEstimate = async () => {
    if (!form.dropoffAddress || !form.packageDescription) return;
    setLoading(true);
    try {
      const { data } = await api.post('/deliveries/estimate', {
        pickupLat: form.pickupLat,
        pickupLng: form.pickupLng,
        dropoffLat: form.dropoffLat,
        dropoffLng: form.dropoffLng,
      });
      setEstimate(data);
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
      await api.post('/deliveries', {
        pickupLat: form.pickupLat,
        pickupLng: form.pickupLng,
        pickupAddress: form.pickupAddress || 'Mi ubicación',
        dropoffLat: form.dropoffLat,
        dropoffLng: form.dropoffLng,
        dropoffAddress: form.dropoffAddress,
        packageDescription: form.packageDescription,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
      });
      navigate('/history');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al solicitar envío');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm' && estimate) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmar envío</h1>
        </div>

        <div className="card space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-0.5">
              <Navigation size={16} className="text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Recogida</p>
              <p className="font-medium">{form.pickupAddress || 'Mi ubicación'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mt-0.5">
              <MapPin size={16} className="text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Entrega a</p>
              <p className="font-medium">{form.dropoffAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mt-0.5">
              <Package size={16} className="text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Paquete</p>
              <p className="font-medium">{form.packageDescription}</p>
              <p className="text-sm text-gray-500">Para: {form.recipientName} ({form.recipientPhone})</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Precio estimado</span>
            <span className="text-2xl font-bold text-blue-600">
              ${estimate.estimatedPrice.toLocaleString('es-AR')}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {estimate.distanceKm} km · {estimate.estimatedMinutes} min aprox.
          </p>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="btn-secondary flex-1">
            Atrás
          </button>
          <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Enviando...' : 'Confirmar envío'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pedir motomandado</h1>
        <p className="text-gray-500 mt-1">Enviá paquetes en moto de forma rápida</p>
      </div>

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de recogida</label>
          <input
            className="input"
            placeholder="¿Desde dónde recogemos?"
            value={form.pickupAddress}
            onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega</label>
          <input
            className="input"
            placeholder="¿Dónde entregamos?"
            value={form.dropoffAddress}
            onChange={(e) => setForm({ ...form, dropoffAddress: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del paquete</label>
          <input
            className="input"
            placeholder="Ej: Documentos, medicamento, comida..."
            value={form.packageDescription}
            onChange={(e) => setForm({ ...form, packageDescription: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del destinatario</label>
            <input
              className="input"
              placeholder="Nombre"
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              className="input"
              placeholder="+5411..."
              value={form.recipientPhone}
              onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
              required
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleEstimate}
        disabled={loading || !form.dropoffAddress || !form.packageDescription || !form.recipientName || !form.recipientPhone}
        className="btn-primary w-full"
      >
        {loading ? 'Calculando...' : 'Ver precio y confirmar'}
      </button>
    </div>
  );
}
