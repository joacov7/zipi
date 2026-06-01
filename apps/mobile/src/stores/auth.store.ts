import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserPublic } from '@zipi/shared';

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoaded: boolean;
  setAuth: (user: UserPublic, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  loadFromStorage: () => Promise<void>;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoaded: false,

  setAuth: async (user, accessToken, refreshToken) => {
    set({ user, accessToken, refreshToken });
    await AsyncStorage.multiSet([
      ['user', JSON.stringify(user)],
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);
  },

  setTokens: async (accessToken, refreshToken) => {
    set({ accessToken, refreshToken });
    await AsyncStorage.multiSet([
      ['accessToken', accessToken],
      ['refreshToken', refreshToken],
    ]);
  },

  logout: async () => {
    set({ user: null, accessToken: null, refreshToken: null });
    await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
  },

  loadFromStorage: async () => {
    const [[, userStr], [, accessToken], [, refreshToken]] = await AsyncStorage.multiGet([
      'user',
      'accessToken',
      'refreshToken',
    ]);
    const user = userStr ? JSON.parse(userStr) : null;
    set({ user, accessToken, refreshToken, isLoaded: true });
  },

  isAuthenticated: () => !!get().accessToken && !!get().user,
}));
