import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/stores/auth.store';
import { Ionicons } from '@expo/vector-icons';

function MenuItem({ icon, label, onPress, danger }: { icon: string; label: string; onPress: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.menuIcon, danger && styles.menuIconDanger]}>
        <Ionicons name={icon as any} size={20} color={danger ? '#dc2626' : '#1A1714'} />
      </View>
      <Text style={[styles.menuLabel, danger && { color: '#dc2626' }]}>{label}</Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color="#d1d5db" />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() ?? '?';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Perfil</Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cuenta</Text>
        <View style={styles.card}>
          <MenuItem
            icon="person-outline"
            label="Mis datos"
            onPress={() => Alert.alert('Próximamente', 'Edición de perfil disponible pronto')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="call-outline"
            label={user?.phone ?? 'Sin teléfono'}
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="mail-outline"
            label={user?.email ?? ''}
            onPress={() => {}}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Más</Text>
        <View style={styles.card}>
          <MenuItem
            icon="help-circle-outline"
            label="Ayuda y soporte"
            onPress={() => Alert.alert('Soporte', 'Contactanos en soporte@zipi.ar')}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="log-out-outline"
            label="Cerrar sesión"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <Text style={styles.version}>Zipi v1.0</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { backgroundColor: '#1A1714', padding: 24, paddingTop: 60, paddingBottom: 28 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 20 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#EF9008', alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontWeight: '800', color: '#fff' },
  name: { fontSize: 18, fontWeight: '700', color: '#fff' },
  email: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#9ca3af', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    backgroundColor: '#fff', borderRadius: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
  },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16 },
  menuIcon: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: '#f5f4f2', alignItems: 'center', justifyContent: 'center',
  },
  menuIconDanger: { backgroundColor: '#fef2f2' },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1A1714' },
  divider: { height: 1, backgroundColor: '#f3f4f6', marginLeft: 68 },
  version: { textAlign: 'center', color: '#d1d5db', fontSize: 12, marginTop: 32 },
});
