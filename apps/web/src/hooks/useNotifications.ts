import { useEffect } from 'react';
import { getSocket } from '../lib/socket';
import { SocketEvent } from '@zipi/shared';
import { useAuthStore } from '../stores/auth.store';

export function useNotifications() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    function notify(title: string, body: string) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body, icon: '/favicon.svg' });
      }
    }

    const socket = getSocket();

    socket.on(SocketEvent.TRIP_ACCEPTED, () => {
      notify('¡Conductor en camino!', 'Un conductor aceptó tu viaje');
    });
    socket.on(SocketEvent.TRIP_STARTED, () => {
      notify('¡Viaje iniciado!', 'Tu viaje ha comenzado');
    });
    socket.on(SocketEvent.TRIP_COMPLETED, () => {
      notify('¡Llegaste!', 'Tu viaje finalizó');
    });

    return () => {
      socket.off(SocketEvent.TRIP_ACCEPTED);
      socket.off(SocketEvent.TRIP_STARTED);
      socket.off(SocketEvent.TRIP_COMPLETED);
    };
  }, [user]);
}
