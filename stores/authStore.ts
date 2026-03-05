import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setGuest: (isGuest: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isGuest: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session, user: session?.user ?? null }),
      setGuest: (isGuest) => set({ isGuest }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () => set({ user: null, session: null, isGuest: false }),
    }),
    {
      name: 'menu-auth-guest',
      // Only persist isGuest — session/user come from Supabase on every load
      partialize: (state) => ({ isGuest: state.isGuest }),
    }
  )
);
