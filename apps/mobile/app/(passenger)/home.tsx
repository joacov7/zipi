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
      <View style={styles.header}>
        <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]} 👋</Text>
        <Text style={styles.subGreeting}>¿Qué necesitás hoy?</Text>
      </View>

      <View style={styles.serviceRow}>
        <TouchableOpacity
          style={[styles.serviceCard, { backgroundColor: '#fef9ec' }]}
          onPress={() => router.push('/(passenger)/request-trip')}
        >
          <Ionicons name="car" size={32} color="#ef9008" />
          <Text style={styles.serviceTitle}>Pedir Remis</Text>
          <Text style={styles.serviceSubtitle}>Desde $2.500</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.serviceCard, { backgroundColor: '#eff6ff' }]}
          onPress={() => router.push('/(passenger)/request-delivery')}
        >
          <Ionicons name="cube" size={32} color="#3b82f6" />
          <Text style={styles.serviceTitle}>Motomandado</Text>
          <Text style={[styles.serviceSubtitle, { color: '#2563eb' }]}>Desde $1.500</Text>
        </TouchableOpacity>
      </View>

      {recentTrips.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>Viajes recientes</Text>
          {recentTrips.map((trip: any) => (
            <View key={trip.id} style={styles.tripCard}>
              <Ionicons name="car-outline" size={20} color="#9ca3af" />
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
  header: { backgroundColor: '#ef9008', padding: 24, paddingTop: 60 },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subGreeting: { fontSize: 14, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  serviceRow: { flexDirection: 'row', gap: 12, padding: 16 },
  serviceCard: {
    flex: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  serviceSubtitle: { fontSize: 12, color: '#d46a04', fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', paddingHorizontal: 16, marginTop: 8, marginBottom: 8 },
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  tripDest: { fontSize: 14, fontWeight: '600', color: '#111827' },
  tripDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  tripPrice: { fontSize: 14, fontWeight: '700', color: '#111827' },
});
