import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { apiError } from '../../src/utils/error';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/auth.store';

export default function SharedTripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: trip, isLoading } = useQuery({
    queryKey: ['shared-trip-mobile', id],
    queryFn: () => api.get(`/shared-trips/${id}`).then((r) => r.data),
  });

  const joinMutation = useMutation({
    mutationFn: () => api.post(`/shared-trips/${id}/join`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trip-mobile', id] }),
    onError: (err: any) => Alert.alert('Error', ((_m = err?.response?.data?.message), Array.isArray(_m) ? _m.join('\n') : (_m || 'No se pudo solicitar el lugar'),
  });

  const leaveMutation = useMutation({
    mutationFn: () => api.delete(`/shared-trips/${id}/leave`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trip-mobile', id] }),
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.delete(`/shared-trips/${id}`),
    onSuccess: () => router.back(),
  });

  const respondMutation = useMutation({
    mutationFn: ({ participantUserId, accept }: { participantUserId: string; accept: boolean }) =>
      api.patch(`/shared-trips/${id}/participants/${participantUserId}/${accept ? 'accept' : 'reject'}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['shared-trip-mobile', id] }),
  });

  if (isLoading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#ef9008" />;
  if (!trip) return null;

  const isPublisher = trip.publisher.id === user?.id;
  const myParticipant = trip.participants.find((p: any) => p.userId === user?.id);
  const confirmed = trip.participants.filter((p: any) => p.status === 'CONFIRMED');
  const pending = trip.participants.filter((p: any) => p.status === 'PENDING');
  const seatsLeft = trip.totalSeats - confirmed.length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Viaje compartido</Text>
        {isPublisher && trip.status !== 'CANCELLED' && (
          <TouchableOpacity onPress={() => Alert.alert('Cancelar viaje', '¿Estás seguro?', [
            { text: 'No' },
            { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelMutation.mutate() },
          ])}>
            <Ionicons name="trash-outline" size={22} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        {/* Route */}
        <View style={styles.card}>
          <View style={styles.routeRow}>
            <Ionicons name="navigate" size={18} color="#22c55e" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.routeLabel}>Desde</Text>
              <Text style={styles.routeValue}>{trip.originAddress}</Text>
            </View>
          </View>
          <View style={[styles.routeRow, { marginTop: 14 }]}>
            <Ionicons name="location" size={18} color="#ef4444" />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.routeLabel}>Hasta</Text>
              <Text style={styles.routeValue}>{trip.destAddress}</Text>
            </View>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={14} color="#9ca3af" />
            <Text style={styles.metaText}>
              {new Date(trip.departureTime).toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="people-outline" size={14} color="#9ca3af" />
            <Text style={styles.metaText}>{seatsLeft} asiento{seatsLeft !== 1 ? 's' : ''} libre{seatsLeft !== 1 ? 's' : ''}</Text>
          </View>
          {trip.description && <Text style={styles.description}>{trip.description}</Text>}
        </View>

        {/* Price */}
        <View style={[styles.card, styles.priceCard]}>
          <View>
            <Text style={styles.priceLabel}>Por asiento</Text>
            <Text style={styles.priceAmount}>${trip.costPerSeat.toLocaleString('es-AR')}</Text>
          </View>
          <Text style={styles.priceTotal}>{trip.totalSeats} asientos · ${(trip.costPerSeat * trip.totalSeats).toLocaleString('es-AR')} total</Text>
        </View>

        {/* Publisher */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Publicado por</Text>
          <View style={styles.publisherRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{trip.publisher.name.charAt(0)}</Text>
            </View>
            <Text style={styles.publisherName}>{trip.publisher.name}</Text>
            {trip.publisher.phone && (
              <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${trip.publisher.phone}`)}>
                <Ionicons name="call" size={16} color="#16a34a" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Confirmed participants */}
        {confirmed.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Confirmados ({confirmed.length}/{trip.totalSeats})</Text>
            {confirmed.map((p: any) => (
              <View key={p.id} style={styles.participantRow}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>{p.user.name.charAt(0)}</Text>
                </View>
                <Text style={styles.participantName}>{p.user.name}</Text>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              </View>
            ))}
          </View>
        )}

        {/* Pending requests (publisher only) */}
        {isPublisher && pending.length > 0 && (
          <View style={styles.card}>
            <Text style={[styles.sectionTitle, { color: '#d97706' }]}>Solicitudes pendientes ({pending.length})</Text>
            {pending.map((p: any) => (
              <View key={p.id} style={styles.participantRow}>
                <View style={styles.participantAvatar}>
                  <Text style={styles.participantAvatarText}>{p.user.name.charAt(0)}</Text>
                </View>
                <Text style={[styles.participantName, { flex: 1 }]}>{p.user.name}</Text>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  onPress={() => respondMutation.mutate({ participantUserId: p.userId, accept: true })}
                  disabled={seatsLeft === 0}
                >
                  <Ionicons name="checkmark" size={16} color="#16a34a" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  onPress={() => respondMutation.mutate({ participantUserId: p.userId, accept: false })}
                >
                  <Ionicons name="close" size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Action */}
        {!isPublisher && trip.status !== 'CANCELLED' && (
          <View style={{ marginTop: 8 }}>
            {!myParticipant && seatsLeft > 0 && (
              <TouchableOpacity style={styles.btn} onPress={() => joinMutation.mutate()} disabled={joinMutation.isPending}>
                {joinMutation.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Solicitar lugar — ${trip.costPerSeat.toLocaleString('es-AR')}</Text>}
              </TouchableOpacity>
            )}
            {myParticipant?.status === 'PENDING' && (
              <>
                <View style={styles.statusBox}><Text style={styles.statusPending}>Solicitud enviada — esperando confirmación</Text></View>
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#6b7280', marginTop: 10 }]} onPress={() => leaveMutation.mutate()}>
                  <Text style={styles.btnText}>Cancelar solicitud</Text>
                </TouchableOpacity>
              </>
            )}
            {myParticipant?.status === 'CONFIRMED' && (
              <>
                <View style={[styles.statusBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Text style={[styles.statusPending, { color: '#16a34a' }]}>✓ Tu lugar está confirmado</Text>
                </View>
                <TouchableOpacity style={[styles.btn, { backgroundColor: '#ef4444', marginTop: 10 }]}
                  onPress={() => Alert.alert('Abandonar viaje', '¿Estás seguro?', [{ text: 'No' }, { text: 'Sí', style: 'destructive', onPress: () => leaveMutation.mutate() }])}>
                  <Text style={styles.btnText}>Abandonar viaje</Text>
                </TouchableOpacity>
              </>
            )}
            {trip.status === 'FULL' && !myParticipant && (
              <View style={[styles.statusBox, { backgroundColor: '#f3f4f6', borderColor: '#e5e7eb' }]}>
                <Text style={{ color: '#9ca3af', textAlign: 'center', fontSize: 14 }}>Viaje completo</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#ef9008', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 56 },
  backBtn: {},
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  body: { padding: 16, gap: 12 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1 },
  routeRow: { flexDirection: 'row', alignItems: 'flex-start' },
  routeLabel: { fontSize: 11, color: '#9ca3af' },
  routeValue: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  metaText: { fontSize: 13, color: '#6b7280' },
  description: { marginTop: 12, fontSize: 13, color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: 10, padding: 10 },
  priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  priceLabel: { fontSize: 13, color: '#9ca3af' },
  priceAmount: { fontSize: 32, fontWeight: 'bold', color: '#ef9008' },
  priceTotal: { fontSize: 13, color: '#9ca3af', textAlign: 'right' },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 14 },
  publisherRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#fef3c7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#d97706' },
  publisherName: { fontSize: 16, fontWeight: '600', color: '#111827', flex: 1 },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  participantRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  participantAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  participantAvatarText: { fontSize: 13, fontWeight: 'bold', color: '#6b7280' },
  participantName: { fontSize: 14, color: '#374151' },
  acceptBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  rejectBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  btn: { backgroundColor: '#ef9008', borderRadius: 16, padding: 18, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  statusBox: { backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', borderRadius: 14, padding: 14 },
  statusPending: { color: '#d97706', textAlign: 'center', fontSize: 14, fontWeight: '500' },
});
