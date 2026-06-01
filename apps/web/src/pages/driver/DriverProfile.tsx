import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { VehicleType, TruckType, MachineryType } from '@zipi/shared';
import { Car, Bike, Truck, Hammer } from 'lucide-react';

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

export default function DriverProfile() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    vehicleType: VehicleType.CAR,
    vehiclePlate: '',
    vehicleModel: '',
    vehicleYear: new Date().getFullYear(),
    vehicleColor: '',
    licenseNumber: '',
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
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Mi perfil de conductor</h1>

        <div className="card space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-zipi-100 rounded-xl flex items-center justify-center">
              {profile.vehicleType === VehicleType.CAR ? (
                <Car size={24} className="text-zipi-600" />
              ) : (
                <Bike size={24} className="text-zipi-600" />
              )}
            </div>
            <div>
              <p className="font-bold text-gray-900">{profile.vehicleModel}</p>
              <p className="text-sm text-gray-500">
                {profile.vehiclePlate} · {profile.vehicleColor} · {profile.vehicleYear}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Licencia</p>
              <p className="font-medium">{profile.licenseNumber}</p>
            </div>
            <div>
              <p className="text-gray-500">Estado</p>
              <span className={`badge ${profile.isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                {profile.isVerified ? 'Verificado' : 'Pendiente de verificación'}
              </span>
            </div>
            <div>
              <p className="text-gray-500">Calificación</p>
              <p className="font-medium">⭐ {profile.rating?.toFixed(1)}</p>
            </div>
            <div>
              <p className="text-gray-500">Viajes totales</p>
              <p className="font-medium">{profile.totalTrips}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configurar perfil de conductor</h1>
        <p className="text-gray-500 mt-1">Completá tus datos para empezar a trabajar</p>
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de vehículo</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { type: VehicleType.CAR,            icon: <Car size={22} />,    label: 'Auto' },
              { type: VehicleType.MOTORCYCLE,     icon: <Bike size={22} />,   label: 'Moto' },
              { type: VehicleType.TRUCK,          icon: <Truck size={22} />,  label: 'Camión' },
              { type: VehicleType.HEAVY_MACHINERY,icon: <Hammer size={22} />, label: 'Maquinaria' },
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                onClick={() => setForm({ ...form, vehicleType: type })}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-colors ${
                  form.vehicleType === type
                    ? 'border-zipi-500 bg-zipi-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {icon}
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Extra fields for trucks */}
        {form.vehicleType === VehicleType.TRUCK && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de camión</label>
              <div className="grid grid-cols-2 gap-2">
                {TRUCK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => setForm({ ...form, truckType: t.value })}
                    className={`flex items-center justify-between p-3 rounded-xl border-2 transition-colors ${
                      form.truckType === t.value ? 'border-amber-400 bg-amber-50' : 'border-gray-200'
                    }`}
                  >
                    <span className="text-sm font-medium">{t.label}</span>
                    <span className="text-xs text-gray-500">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad (toneladas)</label>
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
                    className="w-4 h-4 accent-blue-500"
                    checked={form.hasRefrigeration}
                    onChange={(e) => setForm({ ...form, hasRefrigeration: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">🧊 Tiene refrigeración</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Extra fields for machinery */}
        {form.vehicleType === VehicleType.HEAVY_MACHINERY && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de maquinaria</label>
            <div className="grid grid-cols-2 gap-2">
              {MACHINERY_TYPES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setForm({ ...form, machineryType: m.value })}
                  className={`p-3 rounded-xl border-2 text-sm font-medium transition-colors ${
                    form.machineryType === m.value ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-700'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patente</label>
            <input
              className="input"
              placeholder="AB123CD"
              value={form.vehiclePlate}
              onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value.toUpperCase() })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
          <input
            className="input"
            placeholder="Ej: Toyota Corolla / Honda CB 190"
            value={form.vehicleModel}
            onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
          <input
            className="input"
            placeholder="Blanco, Negro, Rojo..."
            value={form.vehicleColor}
            onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Número de licencia</label>
          <input
            className="input"
            placeholder="LIC-XXXXXX"
            value={form.licenseNumber}
            onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
          />
        </div>

        <button
          onClick={() => createProfile.mutate()}
          disabled={createProfile.isPending || !form.vehiclePlate || !form.vehicleModel || !form.licenseNumber}
          className="btn-primary w-full"
        >
          {createProfile.isPending ? 'Guardando...' : 'Guardar perfil'}
        </button>
      </div>
    </div>
  );
}
