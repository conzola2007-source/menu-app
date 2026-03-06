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
  householdPool: {
    list: (householdId: string) => ['householdPool', householdId] as const,
  },
  recipeAddRequests: {
    list: (householdId: string) => ['recipeAddRequests', householdId] as const,
    mine: (householdId: string) => ['recipeAddRequests', householdId, 'mine'] as const,
  },
  recipeCooks: {
    list: (recipeId: string, householdId: string) => ['recipeCooks', recipeId, householdId] as const,
  },
  ingredientLibrary: {
    list: () => ['ingredientLibrary'] as const,
  },
  householdSettings: {
    get: (householdId: string) => ['householdSettings', householdId] as const,
  },
  storageCategories: {
    list: (householdId: string) => ['storageCategories', householdId] as const,
  },
  packs: {
    list: (householdId: string) => ['packs', householdId] as const,
    detail: (packId: string) => ['packs', 'detail', packId] as const,
  },
  planPacks: {
    list: (planId: string) => ['planPacks', planId] as const,
  },
  shoppingAttendance: {
    list: (listId: string) => ['shoppingAttendance', listId] as const,
  },
  recipeRatings: {
    list: (recipeId: string, householdId: string) => ['recipeRatings', recipeId, householdId] as const,
  },
  recipeFavourites: {
    list: (householdId: string) => ['recipeFavourites', householdId] as const,
  },
  mealHistory: {
    list: (householdId: string) => ['mealHistory', householdId] as const,
  },
  analytics: {
    get: (householdId: string) => ['analytics', householdId] as const,
  },
  recipeNotes: {
    list: (recipeId: string, householdId: string) => ['recipeNotes', recipeId, householdId] as const,
  },
  templates: {
    list: (householdId: string) => ['templates', householdId] as const,
  },
  pushSubscription: {
    get: (userId: string) => ['pushSubscription', userId] as const,
  },
  notificationPreferences: {
    get: (userId: string) => ['notificationPreferences', userId] as const,
  },
} as const;
