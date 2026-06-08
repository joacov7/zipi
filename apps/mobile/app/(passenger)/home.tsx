import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

export default function PassengerHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: tripsData } = useQuery({
    queryKey: ['my-trips-mobile'],
    queryFn: () => api.get('/users/me/trips?limit=3').then((r) => r.data),
  });

  const recentTrips = tripsData?.data?.slice(0, 3) || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Hero header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]}</Text>
        <Text style={styles.subGreeting}>¿Qué necesitás hoy?</Text>
      </View>

      {/* Hero CTA */}
      <TouchableOpacity
        style={styles.heroCta}
        onPress={() => router.push('/(passenger)/request-trip')}
        activeOpacity={0.88}
      >
        <Text style={styles.heroLabel}>VIAJÁ AHORA</Text>
        <Text style={styles.heroTitle}>¿A dónde vamos?</Text>
        <View style={styles.heroSearch}>
          <Ionicons name="search" size={18} color="#1A1714" />
          <Text style={styles.heroSearchText}>Buscar destino</Text>
        </View>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />
      </TouchableOpacity>

      {/* Service grid */}
      <View style={styles.serviceRow}>
        <TouchableOpacity
          style={[styles.serviceCard, { backgroundColor: '#f0fdf4' }]}
          onPress={() => router.push('/(passenger)/request-delivery')}
        >
          <Ionicons name="cube" size={30} color="#16a34a" />
          <Text style={styles.serviceTitle}>Motomandado</Text>
          <Text style={[styles.serviceSubtitle, { color: '#16a34a' }]}>Desde $1.500</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, { backgroundColor: '#fef9ec' }]}
          onPress={() => router.push('/(passenger)/request-freight')}
        >
          <Ionicons name="construct" size={30} color="#EF9008" />
          <Text style={styles.serviceTitle}>Fletes</Text>
          <Text style={styles.serviceSubtitle}>Desde $8.000</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.listCard}
        onPress={() => router.push('/(passenger)/shared-trips')}
      >
        <View style={styles.listCardLeft}>
          <View style={[styles.listCardIcon, { backgroundColor: '#f5f3ff' }]}>
            <Ionicons name="people" size={22} color="#7c3aed" />
          </View>
          <View>
            <Text style={styles.listCardTitle}>Viajes compartidos</Text>
            <Text style={styles.listCardSubtitle}>Viajá con otros y dividí el costo</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
      </TouchableOpacity>

      {recentTrips.length > 0 && (
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Viajes recientes</Text>
          {recentTrips.map((trip: any) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripDot} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.tripDest} numberOfLines={1}>{trip.destAddress}</Text>
                <Text style={styles.tripDate}>
                  {new Date(trip.createdAt).toLocaleDateString('es-AR')}
                </Text>
              </View>
              <Text style={styles.tripPrice}>
                ${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#1A1714', padding: 24, paddingTop: 60, paddingBottom: 20 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.6)', marginTop: 4 },
  heroCta: {
    backgroundColor: '#1A1714',
    marginHorizontal: 16,
    marginTop: -1,
    marginBottom: 16,
    borderRadius: 22,
    padding: 22,
    overflow: 'hidden',
  },
  heroLabel: { fontSize: 11, fontWeight: '700', color: '#EF9008', letterSpacing: 2, marginBottom: 6 },
  heroTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 16 },
  heroSearch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignSelf: 'flex-start',
  },
  heroSearchText: { fontSize: 15, fontWeight: '700', color: '#1A1714' },
  heroCircle1: {
    position: 'absolute', width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.04)', right: -30, top: -30,
  },
  heroCircle2: {
    position: 'absolute', width: 90, height: 90, borderRadius: 45,
    backgroundColor: 'rgba(239,144,8,0.12)', right: 20, bottom: -20,
  },
  serviceRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginBottom: 12 },
  serviceCard: {
    flex: 1, borderRadius: 20, padding: 18, gap: 8,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  serviceTitle: { fontSize: 14, fontWeight: '700', color: '#1A1714' },
  serviceSubtitle: { fontSize: 12, color: '#EF9008', fontWeight: '600' },
  listCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#fff', borderRadius: 20, marginHorizontal: 16, marginBottom: 16,
    padding: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  listCardLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  listCardIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  listCardTitle: { fontSize: 15, fontWeight: '700', color: '#1A1714' },
  listCardSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1A1714', marginBottom: 10, marginTop: 4 },
  tripCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 16, marginBottom: 8, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  tripDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF9008' },
  tripDest: { fontSize: 14, fontWeight: '600', color: '#1A1714' },
  tripDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  tripPrice: { fontSize: 14, fontWeight: '700', color: '#EF9008' },
});
