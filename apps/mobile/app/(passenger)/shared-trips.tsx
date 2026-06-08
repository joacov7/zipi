import { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Modal, Alert, ActivityIndicator, FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiError } from '../../src/utils/error';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/auth.store';

interface SharedTrip {
  id: string;
  originAddress: string;
  destAddress: string;
  departureTime: string;
  totalSeats: number;
  costPerSeat: number;
  description?: string;
  status: string;
  publisher: { id: string; name: string };
  participants: { userId: string; status: string }[];
}

function TripCard({ trip, userId }: { trip: SharedTrip; userId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const confirmed = trip.participants.filter((p) => p.status === 'CONFIRMED').length;
  const seatsLeft = trip.totalSeats - confirmed;
  const myParticipant = trip.participants.find((p) => p.userId === userId);
  const isPublisher = trip.publisher.id === userId;

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/shared-trips/${trip.id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trips-mobile'] }),
    onError: (err: any) => Alert.alert('Error', apiError(err, 'No se pudo solicitar el lugar')),
  });

  return (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(passenger)/shared-trip-detail?id=${trip.id}`)}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <View style={styles.routeRow}>
            <Ionicons name="navigate" size={13} color="#22c55e" />
            <Text style={styles.routeText} numberOfLines={1}>{trip.originAddress}</Text>
          </View>
          <View style={[styles.routeRow, { marginTop: 4 }]}>
            <Ionicons name="location" size={13} color="#ef4444" />
            <Text style={[styles.routeText, { fontWeight: '600', color: '#111827' }]} numberOfLines={1}>{trip.destAddress}</Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={styles.price}>${trip.costPerSeat.toLocaleString('es-AR')}</Text>
          <Text style={styles.priceLabel}>por asiento</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.metaItem}>
          <Ionicons name="time-outline" size={13} color="#9ca3af" />
          <Text style={styles.metaText}>
            {new Date(trip.departureTime).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
            {' '}
            {new Date(trip.departureTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="people-outline" size={13} color="#9ca3af" />
          <Text style={styles.metaText}>{seatsLeft} libre{seatsLeft !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.publisherRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{trip.publisher.name.charAt(0)}</Text>
          </View>
          <Text style={styles.publisherName}>{trip.publisher.name}</Text>
        </View>

        {!myParticipant && !isPublisher && trip.status === 'OPEN' && seatsLeft > 0 && (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
          >
            {joinMutation.isPending
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.joinBtnText}>Solicitar</Text>
            }
          </TouchableOpacity>
        )}
        {myParticipant?.status === 'PENDING' && (
          <View style={styles.badge}><Text style={styles.badgePending}>Pendiente</Text></View>
        )}
        {myParticipant?.status === 'CONFIRMED' && (
          <View style={styles.badge}><Text style={styles.badgeConfirmed}>Confirmado</Text></View>
        )}
        {isPublisher && (
          <View style={styles.badge}><Text style={styles.badgeMine}>Mi viaje</Text></View>
        )}
      </View>
    </TouchableOpacity>
  );
}

function PublishModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ originAddress: '', destAddress: '', departureTime: '', totalSeats: '3', totalCost: '' });

  const mutation = useMutation({
    mutationFn: () => api.post('/shared-trips', {
      ...form,
      totalSeats: parseInt(form.totalSeats),
      totalCost: parseFloat(form.totalCost),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-trips-mobile'] });
      onClose();
    },
    onError: (err: any) => Alert.alert('Error', apiError(err, 'No se pudo publicar')),
  });

  const seats = parseInt(form.totalSeats) || 1;
  const cost = parseFloat(form.totalCost) || 0;
  const costPerSeat = cost > 0 ? Math.ceil(cost / seats) : 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <ScrollView style={styles.modal} contentContainerStyle={{ padding: 24 }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Publicar viaje</Text>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#6b7280" /></TouchableOpacity>
        </View>

        {[
          { label: 'Desde', key: 'originAddress', placeholder: 'Ej: Villa del Parque' },
          { label: 'Hasta', key: 'destAddress', placeholder: 'Ej: UBA Exactas' },
          { label: 'Fecha y hora (YYYY-MM-DDTHH:MM)', key: 'departureTime', placeholder: '2025-06-15T08:00' },
          { label: 'Asientos disponibles', key: 'totalSeats', placeholder: '3' },
          { label: 'Costo total del viaje $', key: 'totalCost', placeholder: '5000' },
        ].map(({ label, key, placeholder }) => (
          <View key={key} style={{ marginBottom: 16 }}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              style={styles.input}
              placeholder={placeholder}
              placeholderTextColor="#9ca3af"
              value={(form as any)[key]}
              onChangeText={(v) => setForm({ ...form, [key]: v })}
              keyboardType={key === 'totalSeats' || key === 'totalCost' ? 'numeric' : 'default'}
            />
          </View>
        ))}

        {costPerSeat > 0 && (
          <View style={styles.costPreview}>
            <Text style={styles.costPreviewText}>Cada pasajero pagaría: </Text>
            <Text style={styles.costPreviewAmount}>${costPerSeat.toLocaleString('es-AR')}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, mutation.isPending && { opacity: 0.6 }]}
          onPress={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Publicar viaje</Text>
          }
        </TouchableOpacity>
      </ScrollView>
    </Modal>
  );
}

export default function SharedTripsScreen() {
  const { user } = useAuthStore();
  const [showPublish, setShowPublish] = useState(false);
  const [tab, setTab] = useState<'all' | 'mine'>('all');

  const { data: trips = [], isLoading, refetch } = useQuery<SharedTrip[]>({
    queryKey: ['shared-trips-mobile'],
    queryFn: () => api.get('/shared-trips').then((r) => r.data),
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Viajes compartidos</Text>
          <Text style={styles.headerSub}>Viajá con otros y dividí el costo</Text>
        </View>
        <TouchableOpacity style={styles.publishBtn} onPress={() => setShowPublish(true)}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.publishBtnText}>Publicar</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#ef9008" />
      ) : trips.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="car-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No hay viajes disponibles</Text>
          <Text style={styles.emptySubText}>¡Sé el primero en publicar uno!</Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(t) => t.id}
          renderItem={({ item }) => <TripCard trip={item} userId={user?.id ?? ''} />}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}

      <PublishModal visible={showPublish} onClose={() => setShowPublish(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#ef9008', padding: 20, paddingTop: 56, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  publishBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8 },
  publishBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  routeText: { fontSize: 13, color: '#6b7280', flex: 1 },
  price: { fontSize: 20, fontWeight: 'bold', color: '#ef9008' },
  priceLabel: { fontSize: 11, color: '#9ca3af' },
  cardMeta: { flexDirection: 'row', gap: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f3f4f6', marginBottom: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: '#9ca3af' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  publisherRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 12, fontWeight: 'bold', color: '#d97706' },
  publisherName: { fontSize: 13, color: '#6b7280' },
  joinBtn: { backgroundColor: '#ef9008', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
  joinBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  badge: {},
  badgePending: { fontSize: 12, color: '#d97706', fontWeight: '600' },
  badgeConfirmed: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  badgeMine: { fontSize: 12, color: '#ef9008', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#9ca3af' },
  emptySubText: { fontSize: 13, color: '#d1d5db' },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 14, fontSize: 15, color: '#111827', backgroundColor: '#f9fafb' },
  costPreview: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef9ec', borderRadius: 12, padding: 14, marginBottom: 20 },
  costPreviewText: { color: '#92400e', fontSize: 14 },
  costPreviewAmount: { color: '#d97706', fontSize: 16, fontWeight: 'bold' },
  btn: { backgroundColor: '#ef9008', borderRadius: 16, padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
