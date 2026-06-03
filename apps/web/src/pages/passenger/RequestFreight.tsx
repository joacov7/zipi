import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { FreightService, TruckType, MachineryType } from '@zipi/shared';
import { Truck, Hammer, MapPin, Package, Clock, ChevronLeft } from 'lucide-react';

interface Estimate {
  estimatedPrice: number;
  distanceKm: number;
  estimatedHours?: number;
  breakdown: { baseFare: number; distanceFare?: number; hourlyFare?: number };
  notes?: string;
}

const TRUCK_TYPES = [
  { value: TruckType.PICKUP,       label: 'Pickup',         desc: 'Hasta 1 ton',  icon: '🛻' },
  { value: TruckType.SMALL_TRUCK,  label: 'Camión pequeño', desc: 'Hasta 3 ton',  icon: '🚚' },
  { value: TruckType.LARGE_TRUCK,  label: 'Camión grande',  desc: 'Hasta 8 ton',  icon: '🚛' },
  { value: TruckType.SEMI,         label: 'Semi-remolque',  desc: 'Más de 8 ton', icon: '🚜' },
];

const MACHINERY_TYPES = [
  { value: MachineryType.EXCAVATOR,      label: 'Excavadora',    icon: '⛏️' },
  { value: MachineryType.CRANE,          label: 'Grúa',          icon: '🏗️' },
  { value: MachineryType.BULLDOZER,      label: 'Topadora',      icon: '🚧' },
  { value: MachineryType.FORKLIFT,       label: 'Autoelevador',  icon: '🏭' },
  { value: MachineryType.CONCRETE_MIXER, label: 'Hormigonera',   icon: '🔩' },
  { value: MachineryType.COMPACTOR,      label: 'Compactadora',  icon: '🔨' },
];

const FREIGHT_COLOR = '#0E9E6E';
const FREIGHT_BG = 'rgba(14,158,110,0.1)';

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
      <div className="max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => setStep('form')}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-zipi-rim hover:bg-zipi-surface2 text-zipi-muted transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight leading-none">Confirmar solicitud</h1>
            <p className="text-[13px] text-zipi-muted mt-0.5">
              {serviceType === FreightService.FLETE ? 'Flete' : 'Maquinaria'} ·{' '}
              {serviceType === FreightService.FLETE
                ? TRUCK_TYPES.find((t) => t.value === form.truckType)?.label
                : MACHINERY_TYPES.find((m) => m.value === form.machineryType)?.label}
            </p>
          </div>
        </div>

        {/* Details card */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4 space-y-3.5">
          <div className="flex items-start gap-3">
            <MapPin size={15} style={{ color: FREIGHT_COLOR }} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-zipi-faint">Retiro / Obra</p>
              <p className="text-[14px] font-semibold text-zipi-ink">{form.pickupAddress || 'Mi ubicación'}</p>
            </div>
          </div>
          {serviceType === FreightService.FLETE && (
            <div className="flex items-start gap-3">
              <MapPin size={15} className="text-zipi-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-zipi-faint">Destino de entrega</p>
                <p className="text-[14px] font-semibold text-zipi-ink">{form.dropoffAddress}</p>
              </div>
            </div>
          )}
          <div className="flex items-start gap-3">
            <Package size={15} className="text-zipi-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-zipi-faint">Descripción</p>
              <p className="text-[14px] font-semibold text-zipi-ink">{form.cargoDescription}</p>
              {form.estimatedWeightTons && (
                <p className="text-[12.5px] text-zipi-muted">{form.estimatedWeightTons} ton estimadas</p>
              )}
              {form.requiresRefrigeration && (
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block"
                  style={{ background: 'rgba(47,107,236,0.1)', color: '#2F6BEC' }}
                >
                  Requiere refrigeración
                </span>
              )}
            </div>
          </div>
          {serviceType === FreightService.MACHINERY && (
            <div className="flex items-center gap-3">
              <Clock size={15} style={{ color: '#C77A00' }} className="shrink-0" />
              <p className="text-[14px] font-semibold text-zipi-ink">{form.estimatedHours} horas estimadas</p>
            </div>
          )}
        </div>

        {/* Price breakdown */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <p className="text-[13px] font-bold text-zipi-ink mb-3">Desglose del precio</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[13.5px] text-zipi-muted">
              <span>Tarifa base</span>
              <span>${estimate.breakdown.baseFare.toLocaleString('es-AR')}</span>
            </div>
            {estimate.breakdown.distanceFare !== undefined && (
              <div className="flex justify-between text-[13.5px] text-zipi-muted">
                <span>Distancia ({estimate.distanceKm} km)</span>
                <span>${estimate.breakdown.distanceFare.toLocaleString('es-AR')}</span>
              </div>
            )}
            {estimate.breakdown.hourlyFare !== undefined && (
              <div className="flex justify-between text-[13.5px] text-zipi-muted">
                <span>Horas ({estimate.estimatedHours}h)</span>
                <span>${estimate.breakdown.hourlyFare.toLocaleString('es-AR')}</span>
              </div>
            )}
            <div
              className="flex justify-between font-extrabold text-[16px] pt-2 border-t border-dashed border-zipi-rim"
            >
              <span className="text-zipi-ink">Total estimado</span>
              <span style={{ color: FREIGHT_COLOR }}>${estimate.estimatedPrice.toLocaleString('es-AR')}</span>
            </div>
          </div>
          {estimate.notes && (
            <p className="text-[12px] text-zipi-faint mt-3">{estimate.notes}</p>
          )}
        </div>

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: '#1A1714' }}
        >
          {loading ? 'Enviando solicitud...' : 'Confirmar solicitud'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-1">Camiones y Maquinaria</h1>
      <p className="text-[13.5px] text-zipi-muted mb-5">Solicitá un flete o alquilá maquinaria pesada</p>

      {/* Service type */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={() => setServiceType(FreightService.FLETE)}
          className="flex flex-col items-center gap-3 p-5 rounded-[20px] border-2 transition-all"
          style={
            serviceType === FreightService.FLETE
              ? { borderColor: FREIGHT_COLOR, background: FREIGHT_BG }
              : { borderColor: '#ebe7df', background: '#fff' }
          }
        >
          <Truck size={30} style={{ color: serviceType === FreightService.FLETE ? FREIGHT_COLOR : '#a39e95' }} />
          <div className="text-center">
            <p className="font-bold text-[14px] text-zipi-ink">Flete</p>
            <p className="text-[12px] text-zipi-faint mt-0.5">Transporte de carga</p>
          </div>
        </button>
        <button
          onClick={() => setServiceType(FreightService.MACHINERY)}
          className="flex flex-col items-center gap-3 p-5 rounded-[20px] border-2 transition-all"
          style={
            serviceType === FreightService.MACHINERY
              ? { borderColor: '#C77A00', background: 'rgba(239,144,8,0.1)' }
              : { borderColor: '#ebe7df', background: '#fff' }
          }
        >
          <Hammer size={30} style={{ color: serviceType === FreightService.MACHINERY ? '#C77A00' : '#a39e95' }} />
          <div className="text-center">
            <p className="font-bold text-[14px] text-zipi-ink">Maquinaria</p>
            <p className="text-[12px] text-zipi-faint mt-0.5">Alquiler por hora</p>
          </div>
        </button>
      </div>

      {/* Truck type picker */}
      {serviceType === FreightService.FLETE && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <p className="text-[12.5px] font-bold text-zipi-ink mb-3">Tipo de camión</p>
          <div className="grid grid-cols-2 gap-2">
            {TRUCK_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setForm({ ...form, truckType: t.value })}
                className="flex items-center gap-2 p-3 rounded-[13px] border-2 transition-colors text-left"
                style={
                  form.truckType === t.value
                    ? { borderColor: FREIGHT_COLOR, background: FREIGHT_BG }
                    : { borderColor: '#ebe7df' }
                }
              >
                <span className="text-[20px]">{t.icon}</span>
                <div>
                  <p className="text-[13px] font-bold text-zipi-ink">{t.label}</p>
                  <p className="text-[11px] text-zipi-faint">{t.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {serviceType === FreightService.MACHINERY && (
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <p className="text-[12.5px] font-bold text-zipi-ink mb-3">Tipo de maquinaria</p>
          <div className="grid grid-cols-2 gap-2">
            {MACHINERY_TYPES.map((m) => (
              <button
                key={m.value}
                onClick={() => setForm({ ...form, machineryType: m.value })}
                className="flex items-center gap-2 p-3 rounded-[13px] border-2 transition-colors"
                style={
                  form.machineryType === m.value
                    ? { borderColor: '#C77A00', background: 'rgba(239,144,8,0.1)' }
                    : { borderColor: '#ebe7df' }
                }
              >
                <span className="text-[20px]">{m.icon}</span>
                <p className="text-[13px] font-bold text-zipi-ink">{m.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Common form */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-5 space-y-4">
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">
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
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Dirección de entrega</label>
            <input
              className="input"
              placeholder="¿Hasta dónde?"
              value={form.dropoffAddress}
              onChange={(e) => setForm({ ...form, dropoffAddress: e.target.value })}
            />
          </div>
        )}

        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">
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
          />
        </div>

        {serviceType === FreightService.FLETE ? (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Peso est. (toneladas)</label>
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
                  className="w-4 h-4"
                  style={{ accentColor: '#2F6BEC' }}
                  checked={form.requiresRefrigeration}
                  onChange={(e) => setForm({ ...form, requiresRefrigeration: e.target.checked })}
                />
                <span className="text-[13.5px] text-zipi-ink font-semibold">Refrigeración</span>
              </label>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Horas estimadas</label>
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
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Requerimientos especiales</label>
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
        className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50"
        style={{ background: '#1A1714' }}
      >
        {loading ? 'Calculando...' : 'Ver precio y confirmar'}
      </button>
    </div>
  );
}
