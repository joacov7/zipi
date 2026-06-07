import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { VehicleType, TruckType, MachineryType } from '@zipi/shared';
import { Car, Bike, Truck, Hammer, Star, CheckCircle, Clock } from 'lucide-react';

const TRUCK_TYPES = [
  { value: TruckType.PICKUP,      label: 'Pickup',         desc: '≤1 ton' },
  { value: TruckType.SMALL_TRUCK, label: 'Camión pequeño', desc: '≤3 ton' },
  { value: TruckType.LARGE_TRUCK, label: 'Camión grande',  desc: '≤8 ton' },
  { value: TruckType.SEMI,        label: 'Semi-remolque',  desc: '>8 ton' },
];

const MACHINERY_TYPES = [
  { value: MachineryType.EXCAVATOR,      label: 'Excavadora' },
  { value: MachineryType.CRANE,          label: 'Grúa' },
  { value: MachineryType.BULLDOZER,      label: 'Topadora' },
  { value: MachineryType.FORKLIFT,       label: 'Autoelevador' },
  { value: MachineryType.CONCRETE_MIXER, label: 'Hormigonera' },
  { value: MachineryType.COMPACTOR,      label: 'Compactadora' },
];

const VEHICLE_OPTS = [
  { type: VehicleType.CAR,             icon: Car,    label: 'Auto' },
  { type: VehicleType.MOTORCYCLE,      icon: Bike,   label: 'Moto' },
  { type: VehicleType.TRUCK,           icon: Truck,  label: 'Camión' },
  { type: VehicleType.HEAVY_MACHINERY, icon: Hammer, label: 'Maquinaria' },
];

export default function DriverProfile() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    vehicleType: VehicleType.CAR,
    vehiclePlate: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehicleColor: '',
    licenseNumber: '',
    habilitacion: '',
    seguro: '',
    truckType: TruckType.SMALL_TRUCK,
    machineryType: MachineryType.EXCAVATOR,
    capacityTons: '',
    hasRefrigeration: false,
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const { data: profile } = useQuery({
    queryKey: ['driver-profile'],
    queryFn: () => api.get('/drivers/me').then((r) => r.data),
  });

  const createProfile = useMutation({
    mutationFn: () => {
      const payload: any = { ...form };
      if (form.vehicleType !== VehicleType.TRUCK) { delete payload.truckType; delete payload.capacityTons; delete payload.hasRefrigeration; }
      if (form.vehicleType !== VehicleType.HEAVY_MACHINERY) delete payload.machineryType;
      if (form.capacityTons) payload.capacityTons = Number(form.capacityTons);
      return api.post('/drivers/profile', payload);
    },
    onSuccess: () => {
      setSuccess('Perfil creado. Esperá la verificación del admin.');
      queryClient.invalidateQueries({ queryKey: ['driver-profile'] });
    },
    onError: (err: any) => setError(err.response?.data?.message || 'Error'),
  });

  if (profile) {
    const VehicleIcon = profile.vehicleType === VehicleType.CAR ? Car : profile.vehicleType === VehicleType.MOTORCYCLE ? Bike : profile.vehicleType === VehicleType.TRUCK ? Truck : Hammer;
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-5">Mi perfil de conductor</h1>

        {/* Vehicle hero card */}
        <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4">
          <div className="flex items-center gap-3.5 mb-4">
            <div
              className="w-[52px] h-[52px] rounded-[14px] flex items-center justify-center shrink-0"
              style={{ background: 'rgba(239,144,8,0.12)' }}
            >
              <VehicleIcon size={24} style={{ color: '#EF9008' }} />
            </div>
            <div>
              <p className="text-[17px] font-extrabold text-zipi-ink">{profile.vehicleModel}</p>
              <p className="text-[13px] text-zipi-muted">
                {profile.vehiclePlate} · {profile.vehicleColor} · {profile.vehicleYear}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13.5px]">
            <div className="bg-zipi-surface2 rounded-[13px] p-3">
              <p className="text-[11px] text-zipi-faint mb-0.5">Licencia</p>
              <p className="font-bold text-zipi-ink">{profile.licenseNumber}</p>
            </div>
            <div className="bg-zipi-surface2 rounded-[13px] p-3">
              <p className="text-[11px] text-zipi-faint mb-0.5">Habilitación</p>
              <p className="font-bold text-zipi-ink">{profile.habilitacion}</p>
            </div>
            <div className="bg-zipi-surface2 rounded-[13px] p-3">
              <p className="text-[11px] text-zipi-faint mb-0.5">Seguro</p>
              <p className="font-bold text-zipi-ink">{profile.seguro}</p>
            </div>
            <div className="bg-zipi-surface2 rounded-[13px] p-3">
              <p className="text-[11px] text-zipi-faint mb-1">Estado</p>
              <div className="flex items-center gap-1">
                {profile.isVerified ? (
                  <><CheckCircle size={13} style={{ color: '#0E9E6E' }} /><span className="font-bold" style={{ color: '#0E9E6E' }}>Verificado</span></>
                ) : (
                  <><Clock size={13} style={{ color: '#C77A00' }} /><span className="font-bold" style={{ color: '#C77A00' }}>Pendiente</span></>
                )}
              </div>
            </div>
            <div className="bg-zipi-surface2 rounded-[13px] p-3">
              <p className="text-[11px] text-zipi-faint mb-0.5">Calificación</p>
              <div className="flex items-center gap-1">
                <Star size={13} className="text-amber-400 fill-amber-400" />
                <span className="font-bold text-zipi-ink">{profile.rating?.toFixed(1)}</span>
              </div>
            </div>
            <div className="bg-zipi-surface2 rounded-[13px] p-3">
              <p className="text-[11px] text-zipi-faint mb-0.5">Viajes totales</p>
              <p className="font-bold text-zipi-ink">{profile.totalTrips}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight mb-1">Configurar perfil</h1>
      <p className="text-[13.5px] text-zipi-muted mb-5">Completá tus datos para empezar a trabajar</p>

      {success && (
        <div
          className="rounded-[13px] px-4 py-3 mb-4 text-[13.5px] font-medium"
          style={{ background: 'rgba(14,158,110,0.1)', color: '#0E9E6E' }}
        >
          {success}
        </div>
      )}
      {error && (
        <div
          className="rounded-[13px] px-4 py-3 mb-4 text-[13.5px] font-medium"
          style={{ background: 'rgba(224,62,99,0.1)', color: '#E03E63' }}
        >
          {error}
        </div>
      )}

      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi space-y-5">
        {/* Vehicle type */}
        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-2">Tipo de vehículo</label>
          <div className="grid grid-cols-2 gap-2.5">
            {VEHICLE_OPTS.map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setForm({ ...form, vehicleType: type })}
                className="flex items-center gap-3 p-4 rounded-[16px] border-2 transition-colors"
                style={
                  form.vehicleType === type
                    ? { borderColor: '#EF9008', background: 'rgba(239,144,8,0.08)' }
                    : { borderColor: '#ebe7df' }
                }
              >
                <Icon size={20} style={{ color: form.vehicleType === type ? '#EF9008' : '#a39e95' }} />
                <span
                  className="font-bold text-[13.5px]"
                  style={{ color: form.vehicleType === type ? '#C77A00' : '#1a1714' }}
                >
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Truck type */}
        {form.vehicleType === VehicleType.TRUCK && (
          <div className="space-y-3">
            <div>
              <label className="block text-[12.5px] font-bold text-zipi-ink mb-2">Tipo de camión</label>
              <div className="grid grid-cols-2 gap-2">
                {TRUCK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, truckType: t.value })}
                    className="flex items-center justify-between p-3 rounded-[13px] border-2 transition-colors"
                    style={
                      form.truckType === t.value
                        ? { borderColor: '#0E9E6E', background: 'rgba(14,158,110,0.08)' }
                        : { borderColor: '#ebe7df' }
                    }
                  >
                    <span className="text-[13px] font-bold text-zipi-ink">{t.label}</span>
                    <span className="text-[11px] text-zipi-faint">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Capacidad (ton)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ej: 3.5"
                  value={form.capacityTons}
                  onChange={(e) => setForm({ ...form, capacityTons: e.target.value })}
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
                    checked={form.hasRefrigeration}
                    onChange={(e) => setForm({ ...form, hasRefrigeration: e.target.checked })}
                  />
                  <span className="text-[13.5px] font-semibold text-zipi-ink">Refrigeración</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Machinery type */}
        {form.vehicleType === VehicleType.HEAVY_MACHINERY && (
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-2">Tipo de maquinaria</label>
            <div className="grid grid-cols-2 gap-2">
              {MACHINERY_TYPES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setForm({ ...form, machineryType: m.value })}
                  className="p-3 rounded-[13px] border-2 text-[13px] font-bold transition-colors text-left"
                  style={
                    form.machineryType === m.value
                      ? { borderColor: '#C77A00', background: 'rgba(239,144,8,0.08)', color: '#C77A00' }
                      : { borderColor: '#ebe7df', color: '#1a1714' }
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vehicle details */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Patente</label>
            <input
              className="input"
              placeholder="AB123CD"
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Año</label>
            <input
              type="number"
              className="input"
              value={form.vehicleYear}
              onChange={(e) => setForm({ ...form, vehicleYear: +e.target.value })}
              min={2000}
              max={2030}
            />
          </div>
        </div>

        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Modelo</label>
          <input
            className="input"
            placeholder="Ej: Toyota Corolla / Honda CB 190"
            value={form.vehicleModel}
            onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Color</label>
          <input
            className="input"
            placeholder="Blanco, Negro, Rojo..."
            value={form.vehicleColor}
            onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Número de licencia</label>
          <input
            className="input"
            placeholder="LIC-XXXXXX"
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Habilitación</label>
          <input
            className="input"
            placeholder="HAB-2024-001"
            value={form.habilitacion}
            onChange={(e) => setForm({ ...form, habilitacion: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-[12.5px] font-bold text-zipi-ink mb-1.5">Póliza de seguro</label>
          <input
            className="input"
            placeholder="POL-2024-001"
            value={form.seguro}
            onChange={(e) => setForm({ ...form, seguro: e.target.value })}
          />
        </div>

        <button
          onClick={() => createProfile.mutate()}
          disabled={createProfile.isPending || !form.vehiclePlate || !form.vehicleModel || !form.licenseNumber || !form.habilitacion || !form.seguro}
          className="h-[54px] w-full rounded-2xl font-bold text-white transition-opacity disabled:opacity-50"
          style={{ background: '#1A1714' }}
        >
          {createProfile.isPending ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  );
}
