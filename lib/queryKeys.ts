// Query key factory — single source of truth for all TanStack Query keys
// Per PRD Section 15.1

export const queryKeys = {
  household: {
    current: (activeId?: string | null) => ['household', 'current', activeId ?? 'none'] as const,
    all: () => ['household', 'all'] as const,
    members: (householdId: string) => ['household', householdId, 'members'] as const,
  },
  recipes: {
    all: (householdId: string) => ['recipes', householdId] as const,
    detail: (recipeId: string) => ['recipes', 'detail', recipeId] as const,
  },
  votes: {
    week: (householdId: string, weekStart: string) =>
      ['votes', householdId, weekStart] as const,
    myVotes: (userId: string, weekStart: string) =>
      ['votes', 'my', userId, weekStart] as const,
  },
  mealPlan: {
    week: (householdId: string, weekStart: string) =>
      ['mealPlan', householdId, weekStart] as const,
  },
  grocery: {
    week: (householdId: string, weekStart: string) =>
      ['grocery', householdId, weekStart] as const,
  },
  ingredients: {
    all: (householdId: string) => ['ingredients', householdId] as const,
  },
  joinRequests: {
    list: (householdId: string) => ['joinRequests', householdId] as const,
  },
} as const;
