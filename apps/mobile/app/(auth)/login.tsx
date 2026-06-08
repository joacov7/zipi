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
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../../src/services/api';
import { useAuthStore } from '../../src/stores/auth.store';
import { UserRole } from '@zipi/shared';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setAuth(data.user, data.accessToken, data.refreshToken);
      if (data.user.role === UserRole.DRIVER) {
        router.replace('/(driver)/home');
      } else {
        router.replace('/(passenger)/home');
      }
    } catch (err: any) {
      Alert.alert('Debug', `URL: ${process.env.EXPO_PUBLIC_API_URL}\nMsg: ${err.message}\nResp: ${JSON.stringify(err.response?.data)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={styles.title}>Zipi</Text>
        <Text style={styles.subtitle}>Remisería y Motomandado</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#9ca3af"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#9ca3af"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Ingresar</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.link}>
            ¿No tenés cuenta? <Text style={styles.linkBold}>Registrate</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: {
    width: 72,
    height: 72,
    backgroundColor: '#ef9008',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  form: { gap: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
  },
  button: {
    backgroundColor: '#ef9008',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  link: { textAlign: 'center', color: '#6b7280', marginTop: 8 },
  linkBold: { color: '#ef9008', fontWeight: '600' },
});
