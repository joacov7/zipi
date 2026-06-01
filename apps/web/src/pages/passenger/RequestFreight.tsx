import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { FreightService, TruckType, MachineryType } from '@zipi/shared';
import { Truck, Hammer, MapPin, Navigation, Package, Clock, DollarSign, ChevronDown } from 'lucide-react';

interface Estimate {
  estimatedPrice: number;
  distanceKm: number;
  estimatedHours?: number;
  breakdown: { baseFare: number; distanceFare?: number; hourlyFare?: number };
  notes?: string;
}

const TRUCK_TYPES = [
  { value: TruckType.PICKUP,       label: 'Pickup',              desc: 'Hasta 1 ton',   icon: '🛻' },
  { value: TruckType.SMALL_TRUCK,  label: 'Camión pequeño',      desc: 'Hasta 3 ton',   icon: '🚚' },
  { value: TruckType.LARGE_TRUCK,  label: 'Camión grande',       desc: 'Hasta 8 ton',   icon: '🚛' },
  { value: TruckType.SEMI,         label: 'Semi-remolque',        desc: 'Más de 8 ton',  icon: '🚜' },
];

const MACHINERY_TYPES = [
  { value: MachineryType.EXCAVATOR,      label: 'Excavadora',      icon: '⛏️' },
  { value: MachineryType.CRANE,          label: 'Grúa',            icon: '🏗️' },
  { value: MachineryType.BULLDOZER,      label: 'Topadora',        icon: '🚧' },
  { value: MachineryType.FORKLIFT,       label: 'Autoelevador',    icon: '🏭' },
  { value: MachineryType.CONCRETE_MIXER, label: 'Hormigonera',     icon: '🔩' },
  { value: MachineryType.COMPACTOR,      label: 'Compactadora',    icon: '🔨' },
];

export default function RequestFreight() {
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState<FreightService>(FreightService.FLETE);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  const [form, setForm] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    cargoDescription: '',
    estimatedWeightTons: '',
    estimatedHours: '4',
    requiresRefrigeration: false,
    specialRequirements: '',
    truckType: TruckType.SMALL_TRUCK,
    machineryType: MachineryType.EXCAVATOR,
  });

  const handleEstimate = async () => {
    setLoading(true);
    try {
      const payload: any = {
        pickupLat: -34.6037,
        pickupLng: -58.3816,
        dropoffLat: -34.6037 - 0.07,
        dropoffLng: -58.3816 - 0.07,
        serviceType,
      };
      if (serviceType === FreightService.FLETE) {
        payload.truckType = form.truckType;
      } else {
        payload.machineryType = form.machineryType;
        payload.estimatedHours = Number(form.estimatedHours);
      }
      const { data } = await api.post('/freight/estimate', payload);
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
      const payload: any = {
        serviceType,
        pickupLat: -34.6037,
        pickupLng: -58.3816,
        pickupAddress: form.pickupAddress || 'Mi ubicación',
        dropoffLat: -34.6037 - 0.07,
        dropoffLng: -58.3816 - 0.07,
        dropoffAddress: form.dropoffAddress,
        cargoDescription: form.cargoDescription,
        requiresRefrigeration: form.requiresRefrigeration,
        specialRequirements: form.specialRequirements || undefined,
      };
      if (form.estimatedWeightTons) payload.estimatedWeightTons = Number(form.estimatedWeightTons);
      if (serviceType === FreightService.MACHINERY) payload.estimatedHours = Number(form.estimatedHours);

      await api.post('/freight', payload);
      navigate('/history');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al solicitar');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm' && estimate) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Confirmar solicitud</h1>
          <p className="text-gray-500 mt-1">
            {serviceType === FreightService.FLETE ? 'Flete' : 'Maquinaria'} ·{' '}
            {serviceType === FreightService.FLETE
              ? TRUCK_TYPES.find((t) => t.value === form.truckType)?.label
              : MACHINERY_TYPES.find((m) => m.value === form.machineryType)?.label}
          </p>
        </div>

        <div className="card space-y-4">
          <div className="flex items-start gap-3">
            <MapPin size={18} className="text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Retiro / Obra</p>
              <p className="font-medium">{form.pickupAddress || 'Mi ubicación'}</p>
            </div>
          </div>
          {serviceType === FreightService.FLETE && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Destino de entrega</p>
                <p className="font-medium">{form.dropoffAddress}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Package size={18} className="text-purple-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Descripción</p>
              <p className="font-medium">{form.cargoDescription}</p>
              {form.estimatedWeightTons && (
                <p className="text-sm text-gray-500">{form.estimatedWeightTons} ton estimadas</p>
              )}
              {form.requiresRefrigeration && (
                <span className="badge bg-blue-100 text-blue-700 mt-1">🧊 Requiere refrigeración</span>
              )}
            </div>
          </div>
          {serviceType === FreightService.MACHINERY && (
            <div className="flex items-center gap-3">
              <Clock size={18} className="text-amber-500 shrink-0" />
              <p className="font-medium">{form.estimatedHours} horas estimadas</p>
            </div>
          )}
        </div>

        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Desglose del precio</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Tarifa base</span>
              <span>${estimate.breakdown.baseFare.toLocaleString('es-AR')}</span>
            </div>
            {estimate.breakdown.distanceFare !== undefined && (
              <div className="flex justify-between text-gray-600">
                <span>Distancia ({estimate.distanceKm} km)</span>
                <span>${estimate.breakdown.distanceFare.toLocaleString('es-AR')}</span>
              </div>
            )}
            {estimate.breakdown.hourlyFare !== undefined && (
              <div className="flex justify-between text-gray-600">
                <span>Horas ({estimate.estimatedHours}h)</span>
                <span>${estimate.breakdown.hourlyFare.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 pt-2 border-t border-gray-100 text-base">
              <span>Total estimado</span>
              <span className="text-amber-600">${estimate.estimatedPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>
          {estimate.notes && (
            <p className="text-xs text-gray-500 mt-3">{estimate.notes}</p>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep('form')} className="btn-secondary flex-1">Atrás</button>
          <button onClick={handleConfirm} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Enviando solicitud...' : 'Confirmar solicitud'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Camiones y Maquinaria</h1>
        <p className="text-gray-500 mt-1">Solicitá un flete o alquilá maquinaria pesada</p>
      </div>

      {/* Service type selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setServiceType(FreightService.FLETE)}
          className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
            serviceType === FreightService.FLETE
              ? 'border-amber-500 bg-amber-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <Truck size={32} className={serviceType === FreightService.FLETE ? 'text-amber-600' : 'text-gray-400'} />
          <div className="text-center">
            <p className="font-bold text-gray-900">Flete</p>
            <p className="text-xs text-gray-500 mt-0.5">Transporte de carga</p>
          </div>
        </button>
        <button
          onClick={() => setServiceType(FreightService.MACHINERY)}
          className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
            serviceType === FreightService.MACHINERY
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-200 hover:border-gray-300 bg-white'
          }`}
        >
          <Hammer size={32} className={serviceType === FreightService.MACHINERY ? 'text-orange-600' : 'text-gray-400'} />
          <div className="text-center">
            <p className="font-bold text-gray-900">Maquinaria</p>
            <p className="text-xs text-gray-500 mt-0.5">Alquiler por hora</p>
          </div>
        </button>
      </div>

      {/* Vehicle subtype */}
      {serviceType === FreightService.FLETE && (
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-3">Tipo de camión</p>
          <div className="grid grid-cols-2 gap-2">
            {TRUCK_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, truckType: t.value })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors text-left ${
                  form.truckType === t.value
                    ? 'border-amber-400 bg-amber-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{t.icon}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{t.label}</p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {serviceType === FreightService.MACHINERY && (
        <div className="card">
          <p className="text-sm font-medium text-gray-700 mb-3">Tipo de maquinaria</p>
          <div className="grid grid-cols-2 gap-2">
            {MACHINERY_TYPES.map((m) => (
              <button
                key={m.value}
                onClick={() => setForm({ ...form, machineryType: m.value })}
                className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-colors ${
                  form.machineryType === m.value
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-xl">{m.icon}</span>
                <p className="text-sm font-medium text-gray-900">{m.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common form fields */}
      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {serviceType === FreightService.FLETE ? 'Dirección de retiro' : 'Dirección de la obra / lugar'}
          </label>
          <input
            className="input"
            placeholder="¿Desde dónde?"
            value={form.pickupAddress}
            onChange={(e) => setForm({ ...form, pickupAddress: e.target.value })}
          />
        </div>

        {serviceType === FreightService.FLETE && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección de entrega</label>
            <input
              className="input"
              placeholder="¿Hasta dónde?"
              value={form.dropoffAddress}
              onChange={(e) => setForm({ ...form, dropoffAddress: e.target.value })}
              required
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {serviceType === FreightService.FLETE ? 'Descripción de la carga' : 'Trabajo a realizar'}
          </label>
          <input
            className="input"
            placeholder={
              serviceType === FreightService.FLETE
                ? 'Ej: Mudanza de oficina, materiales de construcción...'
                : 'Ej: Excavación de zanja de 20m para cañería...'
            }
            value={form.cargoDescription}
            onChange={(e) => setForm({ ...form, cargoDescription: e.target.value })}
            required
          />
        </div>

        {serviceType === FreightService.FLETE ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Peso est. (toneladas)</label>
              <input
                type="number"
                className="input"
                placeholder="Opcional"
                value={form.estimatedWeightTons}
                onChange={(e) => setForm({ ...form, estimatedWeightTons: e.target.value })}
                step="0.5"
                min="0"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-amber-500"
                  checked={form.requiresRefrigeration}
                  onChange={(e) => setForm({ ...form, requiresRefrigeration: e.target.checked })}
                />
                <span className="text-sm text-gray-700">🧊 Refrigeración</span>
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horas estimadas</label>
            <select
              className="input"
              value={form.estimatedHours}
              onChange={(e) => setForm({ ...form, estimatedHours: e.target.value })}
            >
              {[2, 4, 6, 8, 10, 12, 16, 24].map((h) => (
                <option key={h} value={h}>{h} horas</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requerimientos especiales</label>
          <input
            className="input"
            placeholder="Opcional: acceso restringido, horario específico..."
            value={form.specialRequirements}
            onChange={(e) => setForm({ ...form, specialRequirements: e.target.value })}
          />
        </div>
      </div>

      <button
        onClick={handleEstimate}
        disabled={loading || !form.cargoDescription || (serviceType === FreightService.FLETE && !form.dropoffAddress)}
        className="btn-primary w-full"
      >
        {loading ? 'Calculando...' : 'Ver precio y confirmar'}
      </button>
    </div>
  );
}
