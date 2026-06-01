import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Buscando conductor...',
  ACCEPTED: 'Conductor en camino',
  IN_PROGRESS: 'En viaje',
  COMPLETED: '¡Viaje completado!',
  CANCELLED: 'Viaje cancelado',
};

export default function TripTrackingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: trip, isLoading } = useQuery({
    queryKey: ['trip-mobile', id],
    queryFn: () => api.get(`/trips/${id}`).then((r) => r.data),
    refetchInterval: 5000,
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.patch(`/trips/${id}/status`, { status: 'CANCELLED', cancelReason: 'Cancelado por pasajero' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['trip-mobile', id] }),
  });

  if (isLoading || !trip) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#ef9008" />
      </View>
    );
  }

  const isPending = trip.status === 'PENDING';
  const isCompleted = trip.status === 'COMPLETED';
  const isCancelled = trip.status === 'CANCELLED';
  const canCancel = ['PENDING', 'ACCEPTED'].includes(trip.status);

  return (
    <View style={styles.container}>
      <View style={styles.statusBanner}>
        <Text style={styles.statusText}>{STATUS_LABELS[trip.status] || trip.status}</Text>
        {isPending && <ActivityIndicator color="#fff" style={{ marginLeft: 8 }} />}
      </View>

      {trip.driver && (
        <View style={styles.driverCard}>
          <View style={styles.driverAvatar}>
            <Text style={styles.driverAvatarText}>{trip.driver.user.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.driverName}>{trip.driver.user.name}</Text>
            <Text style={styles.driverVehicle}>
              {trip.driver.vehicleModel} · {trip.driver.vehiclePlate}
            </Text>
            <Text style={styles.driverRating}>⭐ {trip.driver.rating?.toFixed(1)}</Text>
          </View>
          <TouchableOpacity
            style={styles.callBtn}
            onPress={() => Linking.openURL(`tel:${trip.driver.user.phone}`)}
          >
            <Ionicons name="call" size={20} color="#22c55e" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.routeCard}>
        <View style={styles.routeRow}>
          <Ionicons name="navigate" size={18} color="#22c55e" />
          <Text style={styles.routeText} numberOfLines={2}>{trip.originAddress}</Text>
        </View>
        <View style={[styles.routeRow, { marginTop: 12 }]}>
          <Ionicons name="location" size={18} color="#ef4444" />
          <Text style={styles.routeText} numberOfLines={2}>{trip.destAddress}</Text>
        </View>
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Precio estimado</Text>
        <Text style={styles.price}>
          ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
        </Text>
        {trip.estimatedMinutes && (
          <Text style={styles.eta}>⏱ ~{trip.estimatedMinutes} min · {trip.distanceKm} km</Text>
        )}
      </View>

      {canCancel && (
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() =>
            Alert.alert('¿Cancelar viaje?', 'Esta acción no se puede deshacer.', [
              { text: 'No', style: 'cancel' },
              { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate() },
            ])
          }
          disabled={cancelMutation.isPending}
        >
          <Text style={styles.cancelBtnText}>Cancelar viaje</Text>
        </TouchableOpacity>
      )}

      {(isCompleted || isCancelled) && (
        <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(passenger)/home')}>
          <Text style={styles.homeBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', padding: 20, paddingTop: 60 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  statusBanner: {
    backgroundColor: '#ef9008', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  statusText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  driverCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    flexDirection: 'row', alignItems: 'center', marginBottom: 12, elevation: 1,
  },
  driverAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#ef9008',
    alignItems: 'center', justifyContent: 'center',
  },
  driverAvatarText: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  driverName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  driverVehicle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  driverRating: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  callBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#f0fdf4',
    alignItems: 'center', justifyContent: 'center',
  },
  routeCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, marginBottom: 12, elevation: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  routeText: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '500' },
  priceCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, alignItems: 'center', marginBottom: 20, elevation: 1,
  },
  priceLabel: { color: '#9ca3af', fontSize: 14 },
  price: { fontSize: 32, fontWeight: 'bold', color: '#ef9008', marginTop: 4 },
  eta: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  cancelBtn: {
    borderWidth: 2, borderColor: '#ef4444', borderRadius: 16, padding: 16, alignItems: 'center',
  },
  cancelBtnText: { color: '#ef4444', fontSize: 16, fontWeight: '700' },
  homeBtn: { backgroundColor: '#ef9008', borderRadius: 16, padding: 16, alignItems: 'center' },
  homeBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
