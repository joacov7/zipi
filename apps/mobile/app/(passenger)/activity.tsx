import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  COMPLETED:   { label: 'Completado',  color: '#16a34a' },
  CANCELLED:   { label: 'Cancelado',   color: '#dc2626' },
  IN_PROGRESS: { label: 'En curso',    color: '#2563eb' },
  ACCEPTED:    { label: 'Aceptado',    color: '#7c3aed' },
  PENDING:     { label: 'Pendiente',   color: '#d97706' },
};

function TripItem({ trip }: { trip: any }) {
  const s = STATUS_LABEL[trip.status] ?? { label: trip.status, color: '#6b7280' };
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        <View style={styles.iconWrap}>
          <Ionicons name="car" size={18} color="#EF9008" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.dest} numberOfLines={1}>{trip.destAddress}</Text>
          <Text style={styles.origin} numberOfLines={1}>{trip.originAddress}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>${(trip.finalPrice ?? trip.estimatedPrice)?.toLocaleString('es-AR')}</Text>
          <Text style={[styles.status, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>
      <Text style={styles.date}>{new Date(trip.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
    </View>
  );
}

export default function ActivityScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-trips-activity'],
    queryFn: () => api.get('/users/me/trips?limit=50').then((r) => r.data),
  });

  const trips = data?.data ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Actividad</Text>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EF9008" />
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="car-outline" size={48} color="#d1d5db" />
          <Text style={styles.empty}>Sin viajes todavía</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TripItem trip={item} />}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#1A1714', padding: 24, paddingTop: 60 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  empty: { fontSize: 15, color: '#9ca3af' },
  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#fef9ec', alignItems: 'center', justifyContent: 'center',
  },
  dest: { fontSize: 14, fontWeight: '700', color: '#1A1714' },
  origin: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  price: { fontSize: 14, fontWeight: '700', color: '#EF9008' },
  status: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  date: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
});
