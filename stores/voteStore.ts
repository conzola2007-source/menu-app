import { create } from 'zustand';
import type { VoteType } from '@/lib/supabase/types';

// Tracks votes submitted in the current session before they're confirmed by the server.
// Used to animate the card away immediately while the mutation is in-flight.

interface PendingVote {
  recipeId: string;
  vote: VoteType;
}

interface VoteStore {
  pendingVotes: PendingVote[];
  addPendingVote: (recipeId: string, vote: VoteType) => void;
  clearPendingVotes: () => void;
}

export const useVoteStore = create<VoteStore>((set) => ({
  pendingVotes: [],

  addPendingVote: (recipeId, vote) =>
    set((state) => ({
      pendingVotes: [...state.pendingVotes.filter((v) => v.recipeId !== recipeId), { recipeId, vote }],
    })),

  clearPendingVotes: () => set({ pendingVotes: [] }),
}));
