import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

const TX_ICON: Record<string, { name: string; color: string }> = {
  CREDIT:   { name: 'arrow-down-circle', color: '#16a34a' },
  DEBIT:    { name: 'arrow-up-circle',   color: '#dc2626' },
  BONUS:    { name: 'gift',              color: '#7c3aed' },
  REFUND:   { name: 'refresh-circle',    color: '#2563eb' },
  ADJUSTMENT: { name: 'swap-horizontal', color: '#d97706' },
};

function TxItem({ tx }: { tx: any }) {
  const icon = TX_ICON[tx.type] ?? { name: 'ellipse', color: '#9ca3af' };
  const isCredit = ['CREDIT', 'BONUS', 'REFUND'].includes(tx.type);
  return (
    <View style={styles.txCard}>
      <View style={styles.txIcon}>
        <Ionicons name={icon.name as any} size={22} color={icon.color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.type}</Text>
        <Text style={styles.txDate}>
          {new Date(tx.createdAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
        </Text>
      </View>
      <Text style={[styles.txAmount, { color: isCredit ? '#16a34a' : '#dc2626' }]}>
        {isCredit ? '+' : '-'}${Math.abs(tx.amount).toLocaleString('es-AR')}
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ['wallet-mobile'],
    queryFn: () => api.get('/wallet').then((r) => r.data),
  });

  const balance = data?.balance ?? 0;
  const transactions: any[] = data?.transactions ?? [];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Billetera</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponible</Text>
          {isLoading ? (
            <ActivityIndicator color="#fff" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={styles.balanceAmount}>${balance.toLocaleString('es-AR')}</Text>
          )}
          <View style={styles.balanceBadge}>
            <Ionicons name="shield-checkmark" size={13} color="#EF9008" />
            <Text style={styles.balanceBadgeText}>Saldo seguro</Text>
          </View>
        </View>
      </View>

      {transactions.length === 0 && !isLoading ? (
        <View style={styles.center}>
          <Ionicons name="wallet-outline" size={48} color="#d1d5db" />
          <Text style={styles.empty}>Sin movimientos todavía</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TxItem tx={item} />}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Movimientos</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#1A1714', padding: 24, paddingTop: 60, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, padding: 20,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  balanceLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', fontWeight: '500' },
  balanceAmount: { fontSize: 38, fontWeight: '800', color: '#fff', marginVertical: 6, letterSpacing: -1 },
  balanceBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  balanceBadgeText: { fontSize: 12, color: '#EF9008', fontWeight: '600' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  empty: { fontSize: 15, color: '#9ca3af' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1A1714', marginBottom: 4 },
  txCard: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  txIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#f9fafb', alignItems: 'center', justifyContent: 'center',
  },
  txDesc: { fontSize: 14, fontWeight: '600', color: '#1A1714' },
  txDate: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: '700' },
});
