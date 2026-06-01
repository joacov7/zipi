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
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_MAP_CENTER } from '@zipi/shared';

const QUICK_DESTINATIONS = [
  { label: 'Centro', lat: -34.6083, lng: -58.3712 },
  { label: 'Aeropuerto', lat: -34.5592, lng: -58.4156 },
  { label: 'Hospital', lat: -34.5999, lng: -58.3853 },
];

export default function RequestTripScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [estimate, setEstimate] = useState<any>(null);
  const [destAddress, setDestAddress] = useState('');
  const [selectedDest, setSelectedDest] = useState<(typeof QUICK_DESTINATIONS)[0] | null>(null);

  const handleEstimate = async (dest?: (typeof QUICK_DESTINATIONS)[0]) => {
    const address = dest?.label ?? destAddress;
    if (!address) { Alert.alert('Error', 'Ingresá un destino'); return; }

    setLoading(true);
    try {
      const destLat = dest?.lat ?? DEFAULT_MAP_CENTER.lat - 0.05;
      const destLng = dest?.lng ?? DEFAULT_MAP_CENTER.lng - 0.05;
      const { data } = await api.post('/trips/estimate', {
        originLat: DEFAULT_MAP_CENTER.lat,
        originLng: DEFAULT_MAP_CENTER.lng,
        destLat,
        destLng,
      });
      setEstimate({ ...data, destAddress: address, destLat, destLng });
      if (dest) setSelectedDest(dest);
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
      const { data } = await api.post('/trips', {
        originLat: DEFAULT_MAP_CENTER.lat,
        originLng: DEFAULT_MAP_CENTER.lng,
        originAddress: 'Mi ubicación',
        destLat: estimate.destLat,
        destLng: estimate.destLng,
        destAddress: estimate.destAddress,
      });
      router.replace(`/(passenger)/trip-tracking?id=${data.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al solicitar');
    } finally {
      setLoading(false);
    }
  };

  if (step === 'confirm' && estimate) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => setStep('form')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Confirmar viaje</Text>

        <View style={styles.card}>
          <View style={styles.routeRow}>
            <Ionicons name="navigate" size={20} color="#22c55e" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.routeLabel}>Origen</Text>
              <Text style={styles.routeValue}>Mi ubicación</Text>
            </View>
          </View>
          <View style={[styles.routeRow, { marginTop: 12 }]}>
            <Ionicons name="location" size={20} color="#ef4444" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.routeLabel}>Destino</Text>
              <Text style={styles.routeValue}>{estimate.destAddress}</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Resumen</Text>
          {[
            ['Tarifa base', `$${estimate.breakdown.baseFare.toLocaleString('es-AR')}`],
            ['Distancia', `$${estimate.breakdown.distanceFare.toLocaleString('es-AR')}`],
            ['Tiempo', `$${estimate.breakdown.timeFare.toLocaleString('es-AR')}`],
          ].map(([label, value]) => (
            <View key={label} style={styles.priceRow}>
              <Text style={styles.priceLabel}>{label}</Text>
              <Text style={styles.priceValue}>{value}</Text>
            </View>
          ))}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total estimado</Text>
            <Text style={styles.totalValue}>${estimate.estimatedPrice.toLocaleString('es-AR')}</Text>
          </View>
          <Text style={styles.etaText}>⏱ {estimate.estimatedMinutes} min · {estimate.distanceKm} km</Text>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleConfirm}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Confirmar viaje</Text>}
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.title}>Pedir un remis</Text>

      <View style={styles.card}>
        <Text style={styles.inputLabel}>¿A dónde vas?</Text>
        <TextInput
          style={styles.input}
          placeholder="Ingresá el destino"
          placeholderTextColor="#9ca3af"
          value={destAddress}
          onChangeText={setDestAddress}
        />
      </View>

      <Text style={styles.quickTitle}>Destinos frecuentes</Text>
      <View style={styles.quickRow}>
        {QUICK_DESTINATIONS.map((dest) => (
          <TouchableOpacity
            key={dest.label}
            style={styles.quickBtn}
            onPress={() => handleEstimate(dest)}
          >
            <Text style={styles.quickBtnText}>{dest.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.btn, (!destAddress || loading) && { opacity: 0.5 }]}
        onPress={() => handleEstimate()}
        disabled={!destAddress || loading}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Ver precio</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  backBtn: { marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1, shadowOpacity: 0.04 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  routeLabel: { fontSize: 11, color: '#9ca3af' },
  routeValue: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  quickTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  quickRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 20 },
  quickBtn: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  quickBtnText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { color: '#6b7280', fontSize: 14 },
  priceValue: { color: '#374151', fontSize: 14 },
  totalRow: { borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 12, marginTop: 4 },
  totalLabel: { fontWeight: '700', fontSize: 16, color: '#111827' },
  totalValue: { fontWeight: '700', fontSize: 18, color: '#ef9008' },
  etaText: { color: '#9ca3af', fontSize: 13, marginTop: 8 },
  btn: { backgroundColor: '#ef9008', borderRadius: 16, padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
