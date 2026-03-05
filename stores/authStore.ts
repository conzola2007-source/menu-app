import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, Session } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isGuest: boolean;
  isLoading: boolean;
  activeHouseholdId: string | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setGuest: (isGuest: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setActiveHousehold: (id: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isGuest: false,
      isLoading: true,
      activeHouseholdId: null,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session, user: session?.user ?? null }),
      setGuest: (isGuest) => set({ isGuest }),
      setLoading: (isLoading) => set({ isLoading }),
      setActiveHousehold: (activeHouseholdId) => set({ activeHouseholdId }),
      signOut: () => set({ user: null, session: null, isGuest: false, activeHouseholdId: null }),
    }),
    {
      name: 'menu-auth-guest',
      // Persist isGuest and activeHouseholdId; session/user come from Supabase on every load
      partialize: (state) => ({ isGuest: state.isGuest, activeHouseholdId: state.activeHouseholdId }),
    }
  )
);
