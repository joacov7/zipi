import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const INK = '#1A1714';
const MUTED = '#9ca3af';

export default function PassengerLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: INK,
        tabBarInactiveTintColor: MUTED,
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f3f4f6',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Actividad',
          tabBarIcon: ({ color }) => <Ionicons name="time-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="wallet"
        options={{
          title: 'Billetera',
          tabBarIcon: ({ color }) => <Ionicons name="wallet-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
      {/* Screens ocultas del tab bar */}
      <Tabs.Screen name="request-trip" options={{ href: null }} />
      <Tabs.Screen name="request-delivery" options={{ href: null }} />
      <Tabs.Screen name="request-freight" options={{ href: null }} />
      <Tabs.Screen name="trip-tracking" options={{ href: null }} />
      <Tabs.Screen name="shared-trips" options={{ href: null }} />
      <Tabs.Screen name="shared-trip-detail" options={{ href: null }} />
    </Tabs>
  );
}
