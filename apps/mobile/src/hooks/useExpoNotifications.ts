import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { api } from '../services/api';
import { useAuthStore } from '../stores/auth.store';

const isExpoGo = Constants.appOwnership === 'expo';

if (!isExpoGo) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export function useExpoNotifications() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user || isExpoGo) return;

    async function registerPushToken() {
      const { status: existing } = await Notifications.getPermissionsAsync();
      let finalStatus = existing;

      if (existing !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
        });
      }

      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        await api.post('/notifications/token', {
          token: tokenData.data,
          platform: 'expo',
        });
      } catch {
        // Push token unavailable — skip silently
      }
    }

    registerPushToken();
  }, [user]);
}
