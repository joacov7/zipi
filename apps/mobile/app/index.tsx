import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { UserRole } from '@zipi/shared';

export default function Index() {
  const router = useRouter();
  const { isLoaded, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isAuthenticated()) {
      router.replace('/(auth)/login');
      return;
    }
    if (user?.role === UserRole.DRIVER) {
      router.replace('/(driver)/home');
    } else {
      router.replace('/(passenger)/home');
    }
  }, [isLoaded, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
      <ActivityIndicator size="large" color="#ef9008" />
    </View>
  );
}
