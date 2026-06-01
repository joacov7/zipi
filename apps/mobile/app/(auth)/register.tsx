import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/auth.store';
import { UserRole } from '@zipi/shared';

export default function RegisterScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: UserRole.PASSENGER,
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.phone || !form.password) {
      Alert.alert('Error', 'Completá todos los campos');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      await setAuth(data.user, data.accessToken, data.refreshToken);
      if (data.user.role === UserRole.DRIVER) {
        router.replace('/(driver)/home');
      } else {
        router.replace('/(passenger)/home');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#fff' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Crear cuenta</Text>

        {[
          { placeholder: 'Nombre completo', key: 'name', type: 'default' },
          { placeholder: 'Email', key: 'email', type: 'email-address' },
          { placeholder: 'Teléfono (+541111111111)', key: 'phone', type: 'phone-pad' },
          { placeholder: 'Contraseña (mín. 8 caracteres)', key: 'password', type: 'default', secure: true },
        ].map((field) => (
          <TextInput
            key={field.key}
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor="#9ca3af"
            value={form[field.key as keyof typeof form] as string}
            onChangeText={(v) => setForm({ ...form, [field.key]: v })}
            autoCapitalize={field.key === 'email' ? 'none' : 'words'}
            keyboardType={field.type as any}
            secureTextEntry={field.secure}
          />
        ))}

        <Text style={styles.label}>Tipo de cuenta</Text>
        <View style={styles.roleRow}>
          {[
            { value: UserRole.PASSENGER, label: 'Pasajero / Cliente' },
            { value: UserRole.DRIVER, label: 'Conductor' },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.roleBtn, form.role === option.value && styles.roleBtnActive]}
              onPress={() => setForm({ ...form, role: option.value })}
            >
              <Text
                style={[styles.roleBtnText, form.role === option.value && styles.roleBtnTextActive]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Crear cuenta</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>
            ¿Ya tenés cuenta? <Text style={styles.linkBold}>Iniciá sesión</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, paddingTop: 60, gap: 12 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  roleRow: { flexDirection: 'row', gap: 10 },
  roleBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  roleBtnActive: { borderColor: '#ef9008', backgroundColor: '#fef9ec' },
  roleBtnText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  roleBtnTextActive: { color: '#d46a04' },
  button: {
    backgroundColor: '#ef9008',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#6b7280' },
  linkBold: { color: '#ef9008', fontWeight: '600' },
});
