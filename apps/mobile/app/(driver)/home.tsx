import { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { getSocket } from '../../src/services/socket';
import { useAuthStore } from '../../src/stores/auth.store';
import { VehicleType, SocketEvent } from '@zipi/shared';
import { Ionicons } from '@expo/vector-icons';

export default function DriverHomeScreen() {
  const router = useRouter();
  const { logout } = useAuthStore();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'trips' | 'deliveries' | 'freight'>('trips');

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['driver-profile-mobile'],
    queryFn: () => api.get('/drivers/me').then((r) => r.data),
  });

  const { data: pendingTrips } = useQuery({
    queryKey: ['pending-trips-mobile'],
    queryFn: () => api.get('/trips/pending').then((r) => r.data),
    enabled: tab === 'trips' && !!profile?.isAvailable,
    refetchInterval: 8000,
  });

  const { data: pendingDeliveries } = useQuery({
    queryKey: ['pending-deliveries-mobile'],
    queryFn: () => api.get('/deliveries/pending').then((r) => r.data),
    enabled: tab === 'deliveries' && !!profile?.isAvailable,
    refetchInterval: 8000,
  });

  const toggleAvailability = useMutation({
    mutationFn: (isAvailable: boolean) => api.patch('/drivers/availability', { isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['driver-profile-mobile'] }),
  });

  const acceptTrip = useMutation({
    mutationFn: (tripId: string) => api.post(`/trips/${tripId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-trips-mobile'] });
      Alert.alert('¡Viaje aceptado!', 'Dirigite al pasajero.');
    },
  });

  const acceptDelivery = useMutation({
    mutationFn: (id: string) => api.post(`/deliveries/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-deliveries-mobile'] });
      Alert.alert('¡Envío aceptado!', 'Dirigite al punto de recogida.');
    },
  });

  const { data: pendingFreights } = useQuery({
    queryKey: ['pending-freights-mobile'],
    queryFn: () => api.get('/freight/pending').then((r) => r.data),
    enabled: tab === 'freight' && !!profile?.isAvailable,
    refetchInterval: 8000,
  });

  const acceptFreight = useMutation({
    mutationFn: (id: string) => api.post(`/freight/${id}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending-freights-mobile'] });
      Alert.alert('¡Solicitud aceptada!', 'Contactá al cliente para coordinar.');
    },
  });

  const isTruckDriver =
    profile?.vehicleType === VehicleType.TRUCK ||
    profile?.vehicleType === VehicleType.HEAVY_MACHINERY;

  // GPS tracking while available
  useEffect(() => {
    if (!profile?.isAvailable || !profile?.id) return;

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso de ubicación requerido', 'Para recibir viajes necesitás activar el GPS.');
        return;
      }
      const socket = getSocket();
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
        (loc) => {
          socket.emit(SocketEvent.DRIVER_LOCATION_UPDATE, {
            driverId: profile.id,
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            heading: loc.coords.heading ?? undefined,
          });
        },
      );
    })();

    return () => { subscription?.remove(); };
  }, [profile?.isAvailable, profile?.id]);

  if (profileLoading) {
    return <View style={styles.loading}><ActivityIndicator size="large" color="#ef9008" /></View>;
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Configurá tu perfil</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/(driver)/profile')}>
          <Text style={styles.btnText}>Ir a perfil</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { logout(); router.replace('/(auth)/login'); }}>
          <Text style={{ textAlign: 'center', color: '#ef4444', marginTop: 12 }}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Panel Conductor</Text>
          <Text style={styles.headerSubtitle}>{profile.vehicleModel} · {profile.vehiclePlate}</Text>
        </View>
        <TouchableOpacity onPress={() => { logout(); router.replace('/(auth)/login'); }}>
          <Ionicons name="log-out-outline" size={24} color="rgba(255,255,255,0.8)" />
        </TouchableOpacity>
      </View>

      {/* Status toggle */}
      <View style={styles.statusCard}>
        <View>
          <Text style={styles.statusLabel}>
            {profile.isAvailable ? '🟢 Disponible' : '🔴 No disponible'}
          </Text>
          <Text style={styles.statsRow}>⭐ {profile.rating?.toFixed(1)} · {profile.totalTrips} viajes</Text>
        </View>
        <Switch
          value={profile.isAvailable}
          onValueChange={(v) => {
            if (!profile.isVerified) {
              Alert.alert('Cuenta no verificada', 'Tu cuenta está pendiente de verificación por el admin.');
              return;
            }
            toggleAvailability.mutate(v);
          }}
          trackColor={{ false: '#d1d5db', true: '#86efac' }}
          thumbColor={profile.isAvailable ? '#22c55e' : '#9ca3af'}
        />
      </View>

      {profile.isAvailable && (
        <>
          {/* Tab selector */}
          <View style={styles.tabRow}>
            {!isTruckDriver && (
              <TouchableOpacity
                style={[styles.tab, tab === 'trips' && styles.tabActive]}
                onPress={() => setTab('trips')}
              >
                <Ionicons name="car" size={16} color={tab === 'trips' ? '#fff' : '#6b7280'} />
                <Text style={[styles.tabText, tab === 'trips' && styles.tabTextActive]}>
                  Remises ({pendingTrips?.length ?? 0})
                </Text>
              </TouchableOpacity>
            )}
            {profile?.vehicleType === VehicleType.MOTORCYCLE && (
              <TouchableOpacity
                style={[styles.tab, tab === 'deliveries' && { backgroundColor: '#3b82f6' }]}
                onPress={() => setTab('deliveries')}
              >
                <Ionicons name="cube" size={16} color={tab === 'deliveries' ? '#fff' : '#6b7280'} />
                <Text style={[styles.tabText, tab === 'deliveries' && styles.tabTextActive]}>
                  Mandados ({pendingDeliveries?.length ?? 0})
                </Text>
              </TouchableOpacity>
            )}
            {isTruckDriver && (
              <TouchableOpacity
                style={[styles.tab, tab === 'freight' && { backgroundColor: '#f59e0b' }]}
                onPress={() => setTab('freight')}
              >
                <Ionicons name="construct" size={16} color={tab === 'freight' ? '#fff' : '#6b7280'} />
                <Text style={[styles.tabText, tab === 'freight' && styles.tabTextActive]}>
                  Fletes ({pendingFreights?.length ?? 0})
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {tab === 'freight' && (
            <View style={styles.listContainer}>
              {(!pendingFreights || pendingFreights.length === 0) && (
                <Text style={styles.emptyText}>Sin solicitudes de flete disponibles</Text>
              )}
              {(pendingFreights || []).map((freight: any) => (
                <View key={freight.id} style={styles.requestCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Ionicons name="construct" size={16} color="#f59e0b" />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#f59e0b' }}>
                      {freight.serviceType === 'FLETE' ? 'Flete' : 'Maquinaria'}
                    </Text>
                  </View>
                  <Text style={styles.requestDest}>{freight.cargoDescription}</Text>
                  <Text style={styles.requestOrigin} numberOfLines={2}>
                    {freight.pickupAddress}
                    {freight.serviceType === 'FLETE' ? ` → ${freight.dropoffAddress}` : ''}
                  </Text>
                  {freight.estimatedWeightTons && (
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>⚖️ {freight.estimatedWeightTons} ton</Text>
                  )}
                  {freight.estimatedHours && (
                    <Text style={{ fontSize: 12, color: '#9ca3af' }}>⏱ {freight.estimatedHours}h estimadas</Text>
                  )}
                  {freight.requiresRefrigeration && (
                    <Text style={{ fontSize: 12, color: '#3b82f6' }}>🧊 Requiere refrigeración</Text>
                  )}
                  <View style={[styles.requestFooter, { marginTop: 10 }]}>
                    <Text style={styles.requestPrice}>${freight.estimatedPrice?.toLocaleString('es-AR')}</Text>
                    <TouchableOpacity
                      style={[styles.acceptBtn, { backgroundColor: '#f59e0b' }]}
                      onPress={() => acceptFreight.mutate(freight.id)}
                      disabled={acceptFreight.isPending}
                    >
                      <Text style={styles.acceptBtnText}>Aceptar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === 'trips' && (
            <View style={styles.listContainer}>
              {(!pendingTrips || pendingTrips.length === 0) && (
                <Text style={styles.emptyText}>Sin viajes disponibles ahora</Text>
              )}
              {(pendingTrips || []).map((trip: any) => (
                <View key={trip.id} style={styles.requestCard}>
                  <Text style={styles.requestDest} numberOfLines={1}>→ {trip.destAddress}</Text>
                  <Text style={styles.requestOrigin} numberOfLines={1}>Desde: {trip.originAddress}</Text>
                  <View style={styles.requestFooter}>
                    <Text style={styles.requestPrice}>
                      ${trip.estimatedPrice?.toLocaleString('es-AR')} · {trip.estimatedMinutes} min
                    </Text>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      onPress={() => acceptTrip.mutate(trip.id)}
                      disabled={acceptTrip.isPending}
                    >
                      <Text style={styles.acceptBtnText}>Aceptar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {tab === 'deliveries' && (
            <View style={styles.listContainer}>
              {(!pendingDeliveries || pendingDeliveries.length === 0) && (
                <Text style={styles.emptyText}>Sin envíos disponibles ahora</Text>
              )}
              {(pendingDeliveries || []).map((d: any) => (
                <View key={d.id} style={styles.requestCard}>
                  <Text style={styles.requestDest}>📦 {d.packageDescription}</Text>
                  <Text style={styles.requestOrigin} numberOfLines={1}>{d.pickupAddress} → {d.dropoffAddress}</Text>
                  <View style={styles.requestFooter}>
                    <Text style={styles.requestPrice}>${d.estimatedPrice?.toLocaleString('es-AR')}</Text>
                    <TouchableOpacity
                      style={[styles.acceptBtn, { backgroundColor: '#3b82f6' }]}
                      onPress={() => acceptDelivery.mutate(d.id)}
                      disabled={acceptDelivery.isPending}
                    >
                      <Text style={styles.acceptBtnText}>Aceptar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {!profile.isAvailable && (
        <Text style={styles.offlineText}>Activá tu disponibilidad para recibir viajes</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: '#f9fafb' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#f9fafb' },
  header: {
    backgroundColor: '#ef9008', padding: 20, paddingTop: 60,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statusCard: {
    backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1,
  },
  statusLabel: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statsRow: { fontSize: 13, color: '#6b7280', marginTop: 4 },
  tabRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 12 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb',
  },
  tabActive: { backgroundColor: '#ef9008', borderColor: '#ef9008' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  tabTextActive: { color: '#fff' },
  listContainer: { paddingHorizontal: 16, gap: 10 },
  emptyText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 20 },
  requestCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16, elevation: 1,
  },
  requestDest: { fontSize: 15, fontWeight: '700', color: '#111827', marginBottom: 4 },
  requestOrigin: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  requestFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  requestPrice: { fontSize: 14, fontWeight: '600', color: '#374151' },
  acceptBtn: {
    backgroundColor: '#ef9008', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10,
  },
  acceptBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  offlineText: { textAlign: 'center', color: '#9ca3af', fontSize: 14, marginTop: 32, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20, textAlign: 'center' },
  btn: { backgroundColor: '#ef9008', borderRadius: 16, padding: 16, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
