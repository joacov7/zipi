import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_MAP_CENTER } from '@zipi/shared';

export default function RequestDeliveryScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [estimate, setEstimate] = useState<any>(null);
  const [form, setForm] = useState({
    pickupAddress: '',
    dropoffAddress: '',
    packageDescription: '',
    recipientName: '',
    recipientPhone: '',
  });

  const handleEstimate = async () => {
    if (!form.dropoffAddress || !form.packageDescription || !form.recipientName || !form.recipientPhone) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/deliveries/estimate', {
        pickupLat: DEFAULT_MAP_CENTER.lat,
        pickupLng: DEFAULT_MAP_CENTER.lng,
        dropoffLat: DEFAULT_MAP_CENTER.lat - 0.05,
        dropoffLng: DEFAULT_MAP_CENTER.lng - 0.05,
      });
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
      await api.post('/deliveries', {
        pickupLat: DEFAULT_MAP_CENTER.lat,
        pickupLng: DEFAULT_MAP_CENTER.lng,
        pickupAddress: form.pickupAddress || 'Mi ubicación',
        dropoffLat: DEFAULT_MAP_CENTER.lat - 0.05,
        dropoffLng: DEFAULT_MAP_CENTER.lng - 0.05,
        dropoffAddress: form.dropoffAddress,
        packageDescription: form.packageDescription,
        recipientName: form.recipientName,
        recipientPhone: form.recipientPhone,
      });
      Alert.alert('¡Listo!', 'Tu envío fue solicitado. Un motociclista lo tomará pronto.', [
        { text: 'OK', onPress: () => router.replace('/(passenger)/home') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al enviar');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm' && estimate) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => setStep('form')} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirmar envío</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalles del envío</Text>
          <Text style={styles.detail}>📦 {form.packageDescription}</Text>
          <Text style={styles.detail}>📍 Para: {form.recipientName}</Text>
          <Text style={styles.detail}>📞 {form.recipientPhone}</Text>
          <Text style={styles.detail}>🗺 {form.dropoffAddress}</Text>
        </View>

        <View style={styles.card}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.cardTitle}>Precio estimado</Text>
            <Text style={styles.bigPrice}>${estimate.estimatedPrice.toLocaleString('es-AR')}</Text>
          </View>
          <Text style={styles.eta}>{estimate.distanceKm} km · ~{estimate.estimatedMinutes} min</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar envío</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const fields = [
    { key: 'pickupAddress', label: 'Dirección de recogida', placeholder: '¿Desde dónde recogemos?' },
    { key: 'dropoffAddress', label: 'Dirección de entrega', placeholder: '¿Dónde entregamos?', required: true },
    { key: 'packageDescription', label: 'Descripción del paquete', placeholder: 'Documentos, medicamento...', required: true },
    { key: 'recipientName', label: 'Nombre del destinatario', placeholder: 'Nombre completo', required: true },
    { key: 'recipientPhone', label: 'Teléfono del destinatario', placeholder: '+5411...', phone: true, required: true },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.title}>Motomandado</Text>

      <View style={styles.card}>
        {fields.map((field) => (
          <View key={field.key} style={{ marginBottom: 14 }}>
            <Text style={styles.inputLabel}>{field.label}{field.required ? ' *' : ''}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor="#9ca3af"
              value={form[field.key as keyof typeof form]}
              onChangeText={(v) => setForm({ ...form, [field.key]: v })}
              keyboardType={field.phone ? 'phone-pad' : 'default'}
            />
          </View>
        ))}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
  detail: { fontSize: 14, color: '#374151', marginBottom: 6 },
  bigPrice: { fontSize: 28, fontWeight: 'bold', color: '#EF9008' },
  eta: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  btn: { backgroundColor: '#1A1714', borderRadius: 16, padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
