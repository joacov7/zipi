import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { MapPin, Navigation, Package, Clock, ChevronLeft } from 'lucide-react';
import { DEFAULT_MAP_CENTER } from '@zipi/shared';
import AddressInput from '../../components/ui/AddressInput';

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
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setStep('form')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zipi-rim hover:bg-zipi-surface2 text-zipi-muted transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight">Confirmar envío</h1>
        </div>

        {/* Route + package */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4 space-y-4">
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(14,158,110,0.12)' }}
            >
              <Navigation size={14} style={{ color: '#0E9E6E' }} />
            </div>
            <div>
              <p className="text-[11px] text-zipi-faint mb-0.5">Recogida</p>
              <p className="text-[14px] font-semibold text-zipi-ink">{form.pickupAddress || 'Mi ubicación'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(47,107,236,0.12)' }}
            >
              <MapPin size={14} style={{ color: '#2F6BEC' }} />
            </div>
            <div>
              <p className="text-[11px] text-zipi-faint mb-0.5">Entrega</p>
              <p className="text-[14px] font-semibold text-zipi-ink">{form.dropoffAddress}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: 'rgba(109,90,224,0.1)' }}
            >
              <Package size={14} style={{ color: '#6D5AE0' }} />
            </div>
            <div>
              <p className="text-[11px] text-zipi-faint mb-0.5">Paquete</p>
              <p className="text-[14px] font-semibold text-zipi-ink">{form.packageDescription}</p>
              <p className="text-[12.5px] text-zipi-muted">Para: {form.recipientName} · {form.recipientPhone}</p>
            </div>
          </div>
        </div>

        {/* Price */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4 flex items-center justify-between">
          <div>
            <p className="text-[12.5px] text-zipi-muted mb-1">Precio estimado</p>
            <p className="text-[30px] font-extrabold tracking-tight" style={{ color: '#2F6BEC' }}>
              ${estimate.estimatedPrice.toLocaleString('es-AR')}
            </p>
          </div>
          <div className="text-right text-[12.5px] text-zipi-faint">
            <p>{estimate.distanceKm} km</p>
            <p className="flex items-center gap-1 justify-end">
              <Clock size={11} /> ~{estimate.estimatedMinutes} min
            </p>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: '#1A1714' }}
        >
          {loading ? 'Enviando...' : 'Confirmar envío'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-1">Pedir motomandado</h1>
      <p className="text-[13.5px] text-zipi-muted mb-5">Enviá paquetes en moto de forma rápida</p>

      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi space-y-4 mb-5">
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Dirección de recogida</label>
          <AddressInput
            placeholder="¿Desde dónde recogemos?"
            value={form.pickupAddress}
            onChange={(v) => setForm((f) => ({ ...f, pickupAddress: v }))}
            onSelect={(r) => setForm((f) => ({ ...f, pickupAddress: r.address, pickupLat: r.lat, pickupLng: r.lng }))}
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Dirección de entrega</label>
          <AddressInput
            placeholder="¿Dónde entregamos?"
            value={form.dropoffAddress}
            onChange={(v) => setForm((f) => ({ ...f, dropoffAddress: v }))}
            onSelect={(r) => setForm((f) => ({ ...f, dropoffAddress: r.address, dropoffLat: r.lat, dropoffLng: r.lng }))}
          />
        </div>
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Descripción del paquete</label>
          <input
            className="input"
            placeholder="Ej: Documentos, medicamento, comida..."
            value={form.packageDescription}
            onChange={(e) => setForm({ ...form, packageDescription: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Nombre del destinatario</label>
            <input
              className="input"
              placeholder="Nombre"
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Teléfono</label>
            <input
              className="input"
              placeholder="+5411..."
              value={form.recipientPhone}
              onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleEstimate}
        disabled={loading || !form.dropoffAddress || !form.packageDescription || !form.recipientName || !form.recipientPhone}
        className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50"
        style={{ background: '#1A1714' }}
      >
        {loading ? 'Calculando...' : 'Ver precio y confirmar'}
      </button>
    </div>
  );
}
