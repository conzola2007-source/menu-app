// Recipe-related constants shared across components and seed scripts

export const CUISINE_TYPES = [
  'italian', 'mexican', 'chinese', 'japanese', 'indian',
  'american', 'mediterranean', 'thai', 'french', 'middle-eastern', 'korean', 'other',
] as const;

export const CUISINE_LABELS: Record<string, string> = {
  italian: 'Italian',
  mexican: 'Mexican',
  chinese: 'Chinese',
  japanese: 'Japanese',
  indian: 'Indian',
  american: 'American',
  mediterranean: 'Mediterranean',
  thai: 'Thai',
  french: 'French',
  'middle-eastern': 'Middle Eastern',
  korean: 'Korean',
  other: 'Other',
};

export const CARB_TYPES = [
  'rice', 'pasta', 'bread', 'potato', 'noodles', 'none', 'other',
] as const;

export const CARB_LABELS: Record<string, string> = {
  rice: 'Rice',
  pasta: 'Pasta',
  bread: 'Bread',
  potato: 'Potato',
  noodles: 'Noodles',
  none: 'No carb',
  other: 'Other',
};

export const PROTEIN_TYPES = [
  'chicken', 'beef', 'pork', 'fish', 'shrimp', 'tofu', 'lamb', 'eggs', 'none', 'other',
] as const;

export const PROTEIN_LABELS: Record<string, string> = {
  chicken: 'Chicken',
  beef: 'Beef',
  pork: 'Pork',
  fish: 'Fish',
  shrimp: 'Shrimp',
  tofu: 'Tofu',
  lamb: 'Lamb',
  eggs: 'Eggs',
  none: 'No protein',
  other: 'Other',
};

export const INGREDIENT_UNITS = [
  'g', 'ml', 'kg', 'l', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'qty', 'piece', 'pack', 'bag', 'bottle',
] as const;

export const STORAGE_LOCATIONS = ['pantry', 'fridge', 'freezer', 'other'] as const;

export const STORAGE_LABELS: Record<string, string> = {
  pantry: 'Pantry',
  fridge: 'Fridge',
  freezer: 'Freezer',
  other: 'Other',
};

// 64 food emojis for the emoji picker
export const FOOD_EMOJIS = [
  '🍕', '🍝', '🍜', '🍛', '🍲', '🥘', '🫕', '🥗',
  '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥞', '🧇',
  '🥓', '🥩', '🍗', '🍖', '🌭', '🍔', '🍟', '🍣',
  '🍱', '🥟', '🦪', '🍤', '🍙', '🍚', '🍘', '🥮',
  '🍢', '🥡', '🦞', '🦐', '🦑', '🦀', '🐟', '🍥',
  '🥦', '🥕', '🧅', '🧄', '🥔', '🍠', '🥬', '🫑',
  '🍆', '🥑', '🌽', '🍅', '🥒', '🫒', '🧀', '🥜',
  '🍋', '🍊', '🍎', '🍓', '🫐', '🍰', '🎂', '🫙',
] as const;

// 16 card background color presets
export const BG_COLORS = [
  '#22c55e', '#3b82f6', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#14b8a6', '#f97316',
  '#06b6d4', '#84cc16', '#6366f1', '#e11d48',
  '#0891b2', '#65a30d', '#d97706', '#7c3aed',
] as const;
