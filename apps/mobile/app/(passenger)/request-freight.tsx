import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { FreightService, TruckType, MachineryType, DEFAULT_MAP_CENTER } from '@zipi/shared';
import { Ionicons } from '@expo/vector-icons';

const TRUCK_TYPES = [
  { value: TruckType.PICKUP,      label: 'Pickup',         desc: 'Hasta 1 ton', icon: '🛻' },
  { value: TruckType.SMALL_TRUCK, label: 'Camión peq.',    desc: 'Hasta 3 ton', icon: '🚚' },
  { value: TruckType.LARGE_TRUCK, label: 'Camión grande',  desc: 'Hasta 8 ton', icon: '🚛' },
  { value: TruckType.SEMI,        label: 'Semi-remolque',  desc: '+8 ton',      icon: '🚜' },
];

const MACHINERY_TYPES = [
  { value: MachineryType.EXCAVATOR,      label: 'Excavadora',   icon: '⛏️' },
  { value: MachineryType.CRANE,          label: 'Grúa',         icon: '🏗️' },
  { value: MachineryType.BULLDOZER,      label: 'Topadora',     icon: '🚧' },
  { value: MachineryType.FORKLIFT,       label: 'Autoelevador', icon: '🏭' },
  { value: MachineryType.CONCRETE_MIXER, label: 'Hormigonera',  icon: '🔩' },
  { value: MachineryType.COMPACTOR,      label: 'Compactadora', icon: '🔨' },
];

const HOURS_OPTIONS = [2, 4, 6, 8, 10, 12];

export default function RequestFreightScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'type' | 'form' | 'confirm'>('type');
  const [serviceType, setServiceType] = useState<FreightService>(FreightService.FLETE);
  const [estimate, setEstimate] = useState<any>(null);
  const [form, setForm] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    cargoDescription: '',
    estimatedWeightTons: '',
    estimatedHours: 4,
    requiresRefrigeration: false,
    specialRequirements: '',
    truckType: TruckType.SMALL_TRUCK,
    machineryType: MachineryType.EXCAVATOR,
  });

  const handleEstimate = async () => {
    if (!form.cargoDescription) { Alert.alert('Error', 'Describí el trabajo'); return; }
    if (serviceType === FreightService.FLETE && !form.dropoffAddress) {
      Alert.alert('Error', 'Ingresá la dirección de entrega');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        pickupLat: DEFAULT_MAP_CENTER.lat,
        pickupLng: DEFAULT_MAP_CENTER.lng,
        dropoffLat: DEFAULT_MAP_CENTER.lat - 0.07,
        dropoffLng: DEFAULT_MAP_CENTER.lng - 0.07,
        serviceType,
      };
      if (serviceType === FreightService.FLETE) {
        payload.truckType = form.truckType;
      } else {
        payload.machineryType = form.machineryType;
        payload.estimatedHours = form.estimatedHours;
      }
      const { data } = await api.post('/freight/estimate', payload);
      setEstimate(data);
      setStep('confirm');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al estimar');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const payload: any = {
        serviceType,
        pickupLat: DEFAULT_MAP_CENTER.lat,
        pickupLng: DEFAULT_MAP_CENTER.lng,
        pickupAddress: form.pickupAddress || 'Mi ubicación',
        dropoffLat: DEFAULT_MAP_CENTER.lat - 0.07,
        dropoffLng: DEFAULT_MAP_CENTER.lng - 0.07,
        dropoffAddress: form.dropoffAddress || form.pickupAddress || 'Mi ubicación',
        cargoDescription: form.cargoDescription,
        requiresRefrigeration: form.requiresRefrigeration,
      };
      if (form.estimatedWeightTons) payload.estimatedWeightTons = Number(form.estimatedWeightTons);
      if (form.specialRequirements) payload.specialRequirements = form.specialRequirements;
      if (serviceType === FreightService.MACHINERY) payload.estimatedHours = form.estimatedHours;

      await api.post('/freight', payload);
      Alert.alert('¡Listo!', 'Tu solicitud fue enviada. Un conductor la tomará pronto.', [
        { text: 'OK', onPress: () => router.replace('/(passenger)/home') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  // Step: confirm
  if (step === 'confirm' && estimate) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => setStep('form')} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirmar solicitud</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {serviceType === FreightService.FLETE ? '🚛 Flete' : '⛏️ Maquinaria'}
          </Text>
          <Text style={styles.detail}>📦 {form.cargoDescription}</Text>
          <Text style={styles.detail}>📍 Retiro: {form.pickupAddress || 'Mi ubicación'}</Text>
          {serviceType === FreightService.FLETE && (
            <Text style={styles.detail}>🏁 Entrega: {form.dropoffAddress}</Text>
          )}
          {serviceType === FreightService.MACHINERY && (
            <Text style={styles.detail}>⏱ {form.estimatedHours}h estimadas</Text>
          )}
          {form.estimatedWeightTons !== '' && (
            <Text style={styles.detail}>⚖️ {form.estimatedWeightTons} toneladas</Text>
          )}
          {form.requiresRefrigeration && <Text style={styles.detail}>🧊 Requiere refrigeración</Text>}
          {estimate.notes && <Text style={[styles.detail, { color: '#9ca3af', fontSize: 12 }]}>{estimate.notes}</Text>}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Desglose del precio</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Tarifa base</Text>
            <Text style={styles.priceValue}>${estimate.breakdown.baseFare.toLocaleString('es-AR')}</Text>
          </View>
          {estimate.breakdown.distanceFare !== undefined && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Distancia ({estimate.distanceKm} km)</Text>
              <Text style={styles.priceValue}>${estimate.breakdown.distanceFare.toLocaleString('es-AR')}</Text>
            </View>
          )}
          {estimate.breakdown.hourlyFare !== undefined && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Horas ({estimate.estimatedHours}h)</Text>
              <Text style={styles.priceValue}>${estimate.breakdown.hourlyFare.toLocaleString('es-AR')}</Text>
            </View>
          )}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalValue}>${estimate.estimatedPrice.toLocaleString('es-AR')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar solicitud</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step: form
  if (step === 'form') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => setStep('type')} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {serviceType === FreightService.FLETE ? '🚛 Flete' : '⛏️ Maquinaria'}
        </Text>

        {/* Subtype */}
        <View style={styles.card}>
          <Text style={styles.label}>
            {serviceType === FreightService.FLETE ? 'Tipo de camión' : 'Tipo de maquinaria'}
          </Text>
          <View style={styles.typeGrid}>
            {(serviceType === FreightService.FLETE ? TRUCK_TYPES : MACHINERY_TYPES).map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.typeBtn,
                  (serviceType === FreightService.FLETE
                    ? form.truckType === item.value
                    : form.machineryType === item.value) && styles.typeBtnActive,
                ]}
                onPress={() =>
                  setForm({
                    ...form,
                    ...(serviceType === FreightService.FLETE
                      ? { truckType: item.value as TruckType }
                      : { machineryType: item.value as MachineryType }),
                  })
                }
              >
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                <Text style={styles.typeBtnText}>{item.label}</Text>
                {'desc' in item && <Text style={styles.typeBtnDesc}>{item.desc}</Text>}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.card}>
          {[
            { key: 'pickupAddress', label: serviceType === FreightService.FLETE ? 'Dirección de retiro' : 'Dirección de la obra', placeholder: '¿Desde dónde?' },
            ...(serviceType === FreightService.FLETE ? [{ key: 'dropoffAddress', label: 'Dirección de entrega', placeholder: '¿Hasta dónde?', required: true }] : []),
          ].map((field) => (
            <View key={field.key} style={{ marginBottom: 14 }}>
              <Text style={styles.label}>{field.label}</Text>
              <TextInput
                style={styles.input}
                placeholder={field.placeholder}
                placeholderTextColor="#9ca3af"
                value={form[field.key as keyof typeof form] as string}
                onChangeText={(v) => setForm({ ...form, [field.key]: v })}
              />
            </View>
          ))}

          <Text style={styles.label}>
            {serviceType === FreightService.FLETE ? 'Descripción de la carga' : 'Trabajo a realizar'}
          </Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder={serviceType === FreightService.FLETE ? 'Mudanza, materiales, etc.' : 'Excavación de zanja, demolición...'}
            placeholderTextColor="#9ca3af"
            value={form.cargoDescription}
            onChangeText={(v) => setForm({ ...form, cargoDescription: v })}
            multiline
          />

          {serviceType === FreightService.FLETE ? (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.label}>Peso estimado (toneladas)</Text>
              <TextInput
                style={styles.input}
                placeholder="Opcional"
                placeholderTextColor="#9ca3af"
                value={form.estimatedWeightTons}
                onChangeText={(v) => setForm({ ...form, estimatedWeightTons: v })}
                keyboardType="numeric"
              />
              <View style={styles.switchRow}>
                <Text style={styles.label}>🧊 Requiere refrigeración</Text>
                <Switch
                  value={form.requiresRefrigeration}
                  onValueChange={(v) => setForm({ ...form, requiresRefrigeration: v })}
                  trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                />
              </View>
            </View>
          ) : (
            <View style={{ marginTop: 14 }}>
              <Text style={styles.label}>Horas estimadas</Text>
              <View style={styles.hoursRow}>
                {HOURS_OPTIONS.map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourBtn, form.estimatedHours === h && styles.hourBtnActive]}
                    onPress={() => setForm({ ...form, estimatedHours: h })}
                  >
                    <Text style={[styles.hourBtnText, form.estimatedHours === h && { color: '#fff' }]}>
                      {h}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          <View style={{ marginTop: 14 }}>
            <Text style={styles.label}>Requerimientos especiales (opcional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Acceso restringido, horario, etc."
              placeholderTextColor="#9ca3af"
              value={form.specialRequirements}
              onChangeText={(v) => setForm({ ...form, specialRequirements: v })}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleEstimate}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ver precio</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Step: type selection
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.title}>Camiones y Maquinaria</Text>
      <Text style={{ color: '#6b7280', marginBottom: 24 }}>¿Qué tipo de servicio necesitás?</Text>

      <TouchableOpacity
        style={[styles.bigTypeBtn, { backgroundColor: '#fffbeb', borderColor: serviceType === FreightService.FLETE ? '#f59e0b' : '#e5e7eb' }]}
        onPress={() => { setServiceType(FreightService.FLETE); setStep('form'); }}
      >
        <Text style={{ fontSize: 40, marginBottom: 8 }}>🚛</Text>
        <Text style={styles.bigTypeBtnTitle}>Flete</Text>
        <Text style={styles.bigTypeBtnDesc}>Transporte de carga con pickup, camión o semi-remolque</Text>
        <Text style={styles.bigTypeBtnPrice}>Desde $8.000</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.bigTypeBtn, { backgroundColor: '#fff7ed', borderColor: serviceType === FreightService.MACHINERY ? '#f97316' : '#e5e7eb', marginTop: 12 }]}
        onPress={() => { setServiceType(FreightService.MACHINERY); setStep('form'); }}
      >
        <Text style={{ fontSize: 40, marginBottom: 8 }}>⛏️</Text>
        <Text style={styles.bigTypeBtnTitle}>Maquinaria Pesada</Text>
        <Text style={styles.bigTypeBtnDesc}>Excavadoras, grúas, topadoras, autoelevadores y más</Text>
        <Text style={[styles.bigTypeBtnPrice, { color: '#f97316' }]}>Desde $60.000 + $18.000/h</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1, shadowOpacity: 0.04 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  detail: { fontSize: 14, color: '#374151', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: {
    width: '47%', borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, padding: 12,
    alignItems: 'center', gap: 4,
  },
  typeBtnActive: { borderColor: '#f59e0b', backgroundColor: '#fffbeb' },
  typeBtnText: { fontSize: 13, fontWeight: '600', color: '#374151' },
  typeBtnDesc: { fontSize: 11, color: '#9ca3af' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  hoursRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 6 },
  hourBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#fff',
  },
  hourBtnActive: { backgroundColor: '#f59e0b', borderColor: '#f59e0b' },
  hourBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { color: '#6b7280', fontSize: 14 },
  priceValue: { color: '#374151', fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontWeight: '700', fontSize: 16, color: '#111827' },
  totalValue: { fontWeight: '700', fontSize: 20, color: '#f59e0b' },
  btn: { backgroundColor: '#f59e0b', borderRadius: 16, padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  bigTypeBtn: {
    borderWidth: 2, borderRadius: 20, padding: 24, alignItems: 'center',
  },
  bigTypeBtnTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  bigTypeBtnDesc: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginBottom: 8 },
  bigTypeBtnPrice: { fontSize: 14, fontWeight: '700', color: '#f59e0b' },
});
