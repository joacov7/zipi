import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { VehicleType } from '@zipi/shared';
import { Ionicons } from '@expo/vector-icons';

export default function DriverProfileScreen() {
  const router = useRouter();
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
  });

  const { data: profile } = useQuery({
    queryKey: ['driver-profile-mobile'],
    queryFn: () => api.get('/drivers/me').then((r) => r.data).catch(() => null),
  });

  const createProfile = useMutation({
    mutationFn: () => api.post('/drivers/profile', form),
    onSuccess: () => {
      Alert.alert('¡Perfil creado!', 'El admin revisará y verificará tu cuenta.');
      queryClient.invalidateQueries({ queryKey: ['driver-profile-mobile'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message;
      Alert.alert('Error', Array.isArray(msg) ? msg.join('\n') : (msg || 'Error al guardar'));
    },
  });

  if (profile) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.title}>Mi perfil</Text>

        <View style={styles.card}>
          <Text style={styles.row}>🚗 {profile.vehicleModel} ({profile.vehicleYear})</Text>
          <Text style={styles.row}>🔤 Patente: {profile.vehiclePlate}</Text>
          <Text style={styles.row}>🎨 Color: {profile.vehicleColor}</Text>
          <Text style={styles.row}>📄 Licencia: {profile.licenseNumber}</Text>
          <Text style={styles.row}>🪪 Habilitación: {profile.habilitacion}</Text>
          <Text style={styles.row}>🛡 Seguro: {profile.seguro}</Text>
          <Text style={styles.row}>
            ✅ Estado: {profile.isVerified ? 'Verificado' : 'Pendiente de verificación'}
          </Text>
          <Text style={styles.row}>⭐ Calificación: {profile.rating?.toFixed(1)}</Text>
          <Text style={styles.row}>🛣 Viajes: {profile.totalTrips}</Text>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 24, paddingTop: 60 }}>
      <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 20 }}>
        <Ionicons name="arrow-back" size={24} color="#111827" />
      </TouchableOpacity>
      <Text style={styles.title}>Crear perfil de conductor</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Tipo de vehículo</Text>
        <View style={styles.typeRow}>
          {[
            { value: VehicleType.CAR, icon: 'car', label: 'Auto' },
            { value: VehicleType.MOTORCYCLE, icon: 'bicycle', label: 'Moto' },
          ].map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.typeBtn, form.vehicleType === opt.value && styles.typeBtnActive]}
              onPress={() => setForm({ ...form, vehicleType: opt.value })}
            >
              <Ionicons name={opt.icon as any} size={28} color={form.vehicleType === opt.value ? '#ef9008' : '#9ca3af'} />
              <Text style={[styles.typeBtnText, form.vehicleType === opt.value && { color: '#ef9008' }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {[
          { key: 'vehiclePlate', label: 'Patente', placeholder: 'AB123CD' },
          { key: 'vehicleModel', label: 'Modelo', placeholder: 'Toyota Corolla / Honda CB 190' },
          { key: 'vehicleColor', label: 'Color', placeholder: 'Blanco, Negro...' },
          { key: 'licenseNumber', label: 'Número de licencia', placeholder: 'LIC-XXXXXX' },
          { key: 'habilitacion', label: 'Habilitación', placeholder: 'HAB-2024-001' },
          { key: 'seguro', label: 'Póliza de seguro', placeholder: 'POL-2024-001' },
        ].map((field) => (
          <View key={field.key} style={{ marginTop: 14 }}>
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
      </View>

      <TouchableOpacity
        style={[styles.btn, createProfile.isPending && { opacity: 0.6 }]}
        onPress={() => createProfile.mutate()}
        disabled={createProfile.isPending}
      >
        {createProfile.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Guardar perfil</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 16, elevation: 1 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  row: { fontSize: 15, color: '#374151', marginBottom: 10 },
  typeRow: { flexDirection: 'row', gap: 12 },
  typeBtn: {
    flex: 1, borderWidth: 2, borderColor: '#e5e7eb', borderRadius: 14, padding: 16,
    alignItems: 'center', gap: 8,
  },
  typeBtnActive: { borderColor: '#ef9008', backgroundColor: '#fef9ec' },
  typeBtnText: { fontSize: 14, fontWeight: '600', color: '#9ca3af' },
  input: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14,
    fontSize: 15, color: '#111827', backgroundColor: '#f9fafb',
  },
  btn: { backgroundColor: '#1A1714', borderRadius: 16, padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
