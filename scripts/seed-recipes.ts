/**
 * Seed script — inserts 30 global recipes into Supabase.
 *
 * Usage (from menu-web/):
 *   npx tsx scripts/seed-recipes.ts
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * to be set in .env.local (or the environment).
 *
 * NOTE: The anon key can only INSERT if the RLS policy on `recipes` allows
 * inserts with is_global = true (e.g. authenticated service role, or a
 * seed-only policy). For a one-time seed, use the Supabase service role key
 * via SUPABASE_SERVICE_ROLE_KEY instead.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ─── Recipe data ─────────────────────────────────────────────────────────────

interface SeedIngredient {
  name: string;
  amount: number;
  unit: string;
  storage_location: string;
  sort_order: number;
}

interface SeedStep {
  instruction: string;
  step_order: number;
}

interface SeedRecipe {
  title: string;
  description: string;
  cuisine: string;
  carb_type: string;
  protein_type: string;
  prep_time_min: number;
  cook_time_min: number;
  servings: number;
  emoji: string;
  bg_color: string;
  advance_prep_days: number;
  advance_prep_note: string | null;
  is_global: true;
  household_id: null;
  created_by: null;
  ingredients: SeedIngredient[];
  steps: SeedStep[];
}

const RECIPES: SeedRecipe[] = [
  // ── ITALIAN ────────────────────────────────────────────────────────────────
  {
    title: 'Spaghetti Carbonara',
    description: 'Classic Roman pasta with eggs, guanciale, pecorino, and black pepper. No cream — ever.',
    cuisine: 'italian', carb_type: 'pasta', protein_type: 'pork',
    prep_time_min: 10, cook_time_min: 20, servings: 4,
    emoji: '🍝', bg_color: '#f59e0b',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Spaghetti', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Guanciale or pancetta', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Eggs', amount: 4, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Pecorino Romano', amount: 100, unit: 'g', storage_location: 'fridge', sort_order: 3 },
      { name: 'Black pepper', amount: 2, unit: 'tsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Salt', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
    ],
    steps: [
      { instruction: 'Cook spaghetti in well-salted boiling water until al dente, reserving 200 ml pasta water.', step_order: 0 },
      { instruction: 'Fry guanciale in a pan over medium heat until crispy. Remove pan from heat.', step_order: 1 },
      { instruction: 'Whisk together eggs, grated pecorino, and plenty of black pepper in a bowl.', step_order: 2 },
      { instruction: 'Add hot drained pasta to the guanciale pan. Toss off heat.', step_order: 3 },
      { instruction: 'Pour egg mixture over pasta and toss rapidly, adding pasta water a splash at a time until creamy.', step_order: 4 },
      { instruction: 'Serve immediately topped with more pecorino and black pepper.', step_order: 5 },
    ],
  },
  {
    title: 'Margherita Pizza',
    description: 'Neapolitan-style pizza with tomato sauce, fresh mozzarella, and basil.',
    cuisine: 'italian', carb_type: 'bread', protein_type: 'none',
    prep_time_min: 30, cook_time_min: 12, servings: 4,
    emoji: '🍕', bg_color: '#ef4444',
    advance_prep_days: 1, advance_prep_note: 'Dough needs overnight cold ferment for best flavour.',
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: '00 flour', amount: 500, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Active dry yeast', amount: 7, unit: 'g', storage_location: 'pantry', sort_order: 1 },
      { name: 'Water (warm)', amount: 325, unit: 'ml', storage_location: 'pantry', sort_order: 2 },
      { name: 'Olive oil', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 3 },
      { name: 'Salt', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Crushed tomatoes', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 5 },
      { name: 'Fresh mozzarella', amount: 250, unit: 'g', storage_location: 'fridge', sort_order: 6 },
      { name: 'Fresh basil', amount: 20, unit: 'g', storage_location: 'fridge', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Mix flour, yeast, salt. Add water + olive oil and knead 10 min. Rest in fridge overnight.', step_order: 0 },
      { instruction: 'Preheat oven to max (ideally 250°C) with a pizza stone or heavy baking tray.', step_order: 1 },
      { instruction: 'Stretch dough balls into 30 cm rounds on floured surface.', step_order: 2 },
      { instruction: 'Spread crushed tomatoes, top with torn mozzarella. Do not add basil yet.', step_order: 3 },
      { instruction: 'Bake 10–12 min until crust is puffed and charred at edges.', step_order: 4 },
      { instruction: 'Top with fresh basil and a drizzle of olive oil before serving.', step_order: 5 },
    ],
  },
  {
    title: 'Mushroom Risotto',
    description: 'Creamy Arborio rice with mixed mushrooms, white wine, and Parmesan.',
    cuisine: 'italian', carb_type: 'rice', protein_type: 'none',
    prep_time_min: 15, cook_time_min: 35, servings: 4,
    emoji: '🍄', bg_color: '#d97706',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Arborio rice', amount: 320, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Mixed mushrooms', amount: 400, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Vegetable or chicken stock', amount: 1200, unit: 'ml', storage_location: 'pantry', sort_order: 2 },
      { name: 'White wine', amount: 150, unit: 'ml', storage_location: 'pantry', sort_order: 3 },
      { name: 'Onion, diced', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 4 },
      { name: 'Garlic cloves, minced', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 5 },
      { name: 'Parmesan, grated', amount: 80, unit: 'g', storage_location: 'fridge', sort_order: 6 },
      { name: 'Butter', amount: 40, unit: 'g', storage_location: 'fridge', sort_order: 7 },
      { name: 'Olive oil', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Heat stock in a separate pan and keep warm over low heat.', step_order: 0 },
      { instruction: 'Sauté onion and garlic in butter + oil until soft. Add mushrooms and cook 5 min.', step_order: 1 },
      { instruction: 'Add rice and toast 2 min, stirring. Pour in wine and stir until absorbed.', step_order: 2 },
      { instruction: 'Add warm stock one ladle at a time, stirring constantly, waiting for each addition to absorb.', step_order: 3 },
      { instruction: 'After ~20 min when rice is al dente, remove from heat. Stir in cold butter and Parmesan.', step_order: 4 },
      { instruction: 'Rest covered 2 min. Season and serve immediately.', step_order: 5 },
    ],
  },
  {
    title: 'Chicken Piccata',
    description: 'Pan-fried chicken cutlets in a bright lemon-caper butter sauce.',
    cuisine: 'italian', carb_type: 'none', protein_type: 'chicken',
    prep_time_min: 15, cook_time_min: 20, servings: 4,
    emoji: '🍋', bg_color: '#84cc16',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chicken breasts, butterflied', amount: 600, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Plain flour', amount: 60, unit: 'g', storage_location: 'pantry', sort_order: 1 },
      { name: 'Lemon juice', amount: 60, unit: 'ml', storage_location: 'fridge', sort_order: 2 },
      { name: 'Capers', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 3 },
      { name: 'Chicken stock', amount: 120, unit: 'ml', storage_location: 'pantry', sort_order: 4 },
      { name: 'Butter', amount: 40, unit: 'g', storage_location: 'fridge', sort_order: 5 },
      { name: 'Olive oil', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Parsley, chopped', amount: 15, unit: 'g', storage_location: 'fridge', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Pound chicken to even 1 cm thickness. Season and dredge in flour, shaking off excess.', step_order: 0 },
      { instruction: 'Heat oil in pan over medium-high. Cook chicken 3–4 min per side until golden. Set aside.', step_order: 1 },
      { instruction: 'Add stock and lemon juice to pan. Scrape up any browned bits. Simmer 2 min.', step_order: 2 },
      { instruction: 'Add capers and butter. Swirl to emulsify. Return chicken and coat in sauce.', step_order: 3 },
      { instruction: 'Garnish with parsley and extra lemon slices. Serve immediately.', step_order: 4 },
    ],
  },

  // ── MEXICAN ────────────────────────────────────────────────────────────────
  {
    title: 'Chicken Tacos',
    description: 'Smoky chipotle chicken in soft corn tortillas with avocado and pickled onion.',
    cuisine: 'mexican', carb_type: 'bread', protein_type: 'chicken',
    prep_time_min: 20, cook_time_min: 15, servings: 4,
    emoji: '🌮', bg_color: '#f97316',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chicken thighs, boneless', amount: 600, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Corn tortillas', amount: 12, unit: 'piece', storage_location: 'pantry', sort_order: 1 },
      { name: 'Chipotle in adobo', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 2 },
      { name: 'Avocado', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 3 },
      { name: 'Red onion, thinly sliced', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 4 },
      { name: 'Lime juice', amount: 60, unit: 'ml', storage_location: 'pantry', sort_order: 5 },
      { name: 'Cumin', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Coriander leaves', amount: 20, unit: 'g', storage_location: 'fridge', sort_order: 7 },
      { name: 'Sour cream', amount: 120, unit: 'ml', storage_location: 'fridge', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Quick-pickle onion: combine with lime juice, pinch of salt. Leave 15 min.', step_order: 0 },
      { instruction: 'Mix chipotle, cumin, salt. Coat chicken thighs. Pan-fry or grill 6–7 min per side.', step_order: 1 },
      { instruction: 'Rest chicken 5 min then slice or shred. Mash avocado with lime and salt.', step_order: 2 },
      { instruction: 'Warm tortillas in a dry pan 30 sec per side.', step_order: 3 },
      { instruction: 'Assemble: avocado → chicken → pickled onion → coriander → sour cream.', step_order: 4 },
    ],
  },
  {
    title: 'Beef Enchiladas',
    description: 'Corn tortillas stuffed with spiced beef, smothered in red chile sauce and melted cheese.',
    cuisine: 'mexican', carb_type: 'bread', protein_type: 'beef',
    prep_time_min: 30, cook_time_min: 30, servings: 4,
    emoji: '🫔', bg_color: '#dc2626',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Minced beef', amount: 500, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Corn tortillas', amount: 8, unit: 'piece', storage_location: 'pantry', sort_order: 1 },
      { name: 'Red enchilada sauce', amount: 400, unit: 'ml', storage_location: 'pantry', sort_order: 2 },
      { name: 'Cheddar cheese, grated', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 3 },
      { name: 'Onion, diced', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 4 },
      { name: 'Garlic', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 5 },
      { name: 'Cumin', amount: 2, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Smoked paprika', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Preheat oven to 190°C. Brown beef with onion and garlic. Add cumin, paprika, salt.', step_order: 0 },
      { instruction: 'Dip each tortilla briefly in enchilada sauce to soften.', step_order: 1 },
      { instruction: 'Fill each tortilla with beef mixture, roll tightly, place seam-side down in baking dish.', step_order: 2 },
      { instruction: 'Pour remaining sauce over top. Cover generously with cheese.', step_order: 3 },
      { instruction: 'Bake 25–30 min until bubbly and cheese is golden.', step_order: 4 },
    ],
  },
  {
    title: 'Black Bean Burritos',
    description: 'Hearty vegetarian burritos with black beans, rice, charred corn, and jalapeño.',
    cuisine: 'mexican', carb_type: 'rice', protein_type: 'none',
    prep_time_min: 20, cook_time_min: 20, servings: 4,
    emoji: '🌯', bg_color: '#78716c',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Black beans (canned, drained)', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Basmati rice', amount: 200, unit: 'g', storage_location: 'pantry', sort_order: 1 },
      { name: 'Large flour tortillas', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 2 },
      { name: 'Sweetcorn (canned or frozen)', amount: 150, unit: 'g', storage_location: 'pantry', sort_order: 3 },
      { name: 'Red pepper, diced', amount: 1, unit: 'qty', storage_location: 'fridge', sort_order: 4 },
      { name: 'Jalapeño, sliced', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 5 },
      { name: 'Lime', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 6 },
      { name: 'Cheddar cheese, grated', amount: 100, unit: 'g', storage_location: 'fridge', sort_order: 7 },
      { name: 'Sour cream', amount: 100, unit: 'ml', storage_location: 'fridge', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Cook rice per packet instructions with a pinch of cumin and lime zest.', step_order: 0 },
      { instruction: 'Char corn in dry pan 3–4 min. Add beans, red pepper, cumin. Season.', step_order: 1 },
      { instruction: 'Warm tortillas. Layer rice, bean mix, jalapeño, cheese, sour cream.', step_order: 2 },
      { instruction: 'Fold sides in, roll burrito tightly. Toast in pan seam-side down 2 min.', step_order: 3 },
      { instruction: 'Serve with lime wedges and extra sour cream.', step_order: 4 },
    ],
  },

  // ── CHINESE ────────────────────────────────────────────────────────────────
  {
    title: 'Egg Fried Rice',
    description: 'Classic wok fried rice with egg, vegetables, and soy sauce. Best made with day-old rice.',
    cuisine: 'chinese', carb_type: 'rice', protein_type: 'eggs',
    prep_time_min: 10, cook_time_min: 15, servings: 4,
    emoji: '🍚', bg_color: '#eab308',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Cooked jasmine rice (cold)', amount: 600, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Eggs', amount: 3, unit: 'qty', storage_location: 'fridge', sort_order: 1 },
      { name: 'Spring onions', amount: 4, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Frozen peas', amount: 100, unit: 'g', storage_location: 'freezer', sort_order: 3 },
      { name: 'Soy sauce', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Sesame oil', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Vegetable oil', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Garlic cloves, minced', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Heat wok over very high heat until smoking. Add oil.', step_order: 0 },
      { instruction: 'Add garlic, stir-fry 30 sec. Crack in eggs and scramble quickly.', step_order: 1 },
      { instruction: 'Add cold rice, breaking up clumps. Stir-fry vigorously 3–4 min.', step_order: 2 },
      { instruction: 'Add peas and white parts of spring onion. Toss 2 min.', step_order: 3 },
      { instruction: 'Pour in soy sauce and sesame oil. Toss once more.', step_order: 4 },
      { instruction: 'Top with green spring onion tops. Serve hot.', step_order: 5 },
    ],
  },
  {
    title: 'Pork Dumplings (Gyoza)',
    description: 'Pan-fried and steamed dumplings with a pork and cabbage filling.',
    cuisine: 'chinese', carb_type: 'other', protein_type: 'pork',
    prep_time_min: 45, cook_time_min: 15, servings: 4,
    emoji: '🥟', bg_color: '#a3a3a3',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Gyoza wrappers', amount: 32, unit: 'piece', storage_location: 'fridge', sort_order: 0 },
      { name: 'Minced pork', amount: 300, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Cabbage, finely shredded', amount: 150, unit: 'g', storage_location: 'fridge', sort_order: 2 },
      { name: 'Ginger, grated', amount: 2, unit: 'tsp', storage_location: 'pantry', sort_order: 3 },
      { name: 'Garlic, minced', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 4 },
      { name: 'Soy sauce', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Sesame oil', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Vegetable oil', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Salt cabbage, squeeze out moisture. Mix with pork, ginger, garlic, soy, sesame oil.', step_order: 0 },
      { instruction: 'Place 1 tsp filling in each wrapper. Wet edge, fold and pleat to seal.', step_order: 1 },
      { instruction: 'Heat oil in pan over medium-high. Add dumplings flat-side down. Fry 2 min until golden.', step_order: 2 },
      { instruction: 'Add 60 ml water, cover immediately. Steam 5 min until water evaporated.', step_order: 3 },
      { instruction: 'Uncover, fry 1 more min to re-crisp base. Serve with dipping sauce (soy + rice vinegar).', step_order: 4 },
    ],
  },
  {
    title: 'Kung Pao Chicken',
    description: 'Spicy Sichuan stir-fry with chicken, peanuts, dried chillies, and Sichuan peppercorns.',
    cuisine: 'chinese', carb_type: 'rice', protein_type: 'chicken',
    prep_time_min: 20, cook_time_min: 15, servings: 4,
    emoji: '🌶️', bg_color: '#b91c1c',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chicken breast, diced', amount: 500, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Roasted peanuts', amount: 80, unit: 'g', storage_location: 'pantry', sort_order: 1 },
      { name: 'Dried red chillies', amount: 8, unit: 'qty', storage_location: 'pantry', sort_order: 2 },
      { name: 'Sichuan peppercorns', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 3 },
      { name: 'Soy sauce', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Rice vinegar', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Cornflour', amount: 2, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Sugar', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Spring onions', amount: 3, unit: 'qty', storage_location: 'fridge', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Marinate chicken with 1 tbsp soy sauce and cornflour for 15 min.', step_order: 0 },
      { instruction: 'Mix sauce: remaining soy, rice vinegar, sugar, 1 tsp cornflour.', step_order: 1 },
      { instruction: 'Fry chillies and Sichuan peppercorns in hot oil 30 sec until fragrant.', step_order: 2 },
      { instruction: 'Add chicken and stir-fry on high heat until cooked through, 4–5 min.', step_order: 3 },
      { instruction: 'Pour sauce over, toss. Add peanuts and spring onions. Serve with steamed rice.', step_order: 4 },
    ],
  },

  // ── JAPANESE ───────────────────────────────────────────────────────────────
  {
    title: 'Chicken Teriyaki Bowl',
    description: 'Glazed chicken thighs in homemade teriyaki sauce over steamed rice with pickled ginger.',
    cuisine: 'japanese', carb_type: 'rice', protein_type: 'chicken',
    prep_time_min: 15, cook_time_min: 20, servings: 4,
    emoji: '🍱', bg_color: '#0891b2',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chicken thighs, boneless', amount: 600, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Soy sauce', amount: 4, unit: 'tbsp', storage_location: 'pantry', sort_order: 1 },
      { name: 'Mirin', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 2 },
      { name: 'Sake or dry sherry', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 3 },
      { name: 'Sugar', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Jasmine rice', amount: 320, unit: 'g', storage_location: 'pantry', sort_order: 5 },
      { name: 'Pickled ginger', amount: 40, unit: 'g', storage_location: 'fridge', sort_order: 6 },
      { name: 'Sesame seeds', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Cook rice per packet. Mix soy, mirin, sake, sugar in a small pan. Simmer 3 min until slightly thick.', step_order: 0 },
      { instruction: 'Score chicken thighs on the skin side. Season with salt.', step_order: 1 },
      { instruction: 'Cook skin-side down in oiled pan 5 min. Flip and cook 4 more min.', step_order: 2 },
      { instruction: 'Pour teriyaki sauce over chicken. Simmer 2–3 min, basting, until glazed.', step_order: 3 },
      { instruction: 'Slice chicken and serve over rice with pickled ginger and sesame seeds.', step_order: 4 },
    ],
  },
  {
    title: 'Tonkotsu Ramen',
    description: 'Rich pork bone broth ramen with chashu belly, soft egg, nori, and bamboo shoots.',
    cuisine: 'japanese', carb_type: 'noodles', protein_type: 'pork',
    prep_time_min: 30, cook_time_min: 240, servings: 4,
    emoji: '🍜', bg_color: '#c2410c',
    advance_prep_days: 1, advance_prep_note: 'Broth is best started the day before. Chashu can also be prepared ahead.',
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Pork neck bones', amount: 1000, unit: 'g', storage_location: 'freezer', sort_order: 0 },
      { name: 'Pork belly', amount: 400, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Ramen noodles', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 2 },
      { name: 'Eggs', amount: 4, unit: 'qty', storage_location: 'fridge', sort_order: 3 },
      { name: 'Soy sauce', amount: 4, unit: 'tbsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Mirin', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Bamboo shoots (canned)', amount: 100, unit: 'g', storage_location: 'pantry', sort_order: 6 },
      { name: 'Nori sheets', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 7 },
      { name: 'Spring onions', amount: 4, unit: 'qty', storage_location: 'fridge', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Blanch pork bones 5 min, drain, rinse. Simmer in 2.5 L water 4 hours until milky white.', step_order: 0 },
      { instruction: 'Roll pork belly tightly, tie with string. Braise in soy + mirin + water 2 hours. Cool, slice.', step_order: 1 },
      { instruction: 'Soft-boil eggs 6.5 min, marinate in leftover chashu braising liquid overnight.', step_order: 2 },
      { instruction: 'Season broth with salt and tare (soy + mirin). Taste and adjust.', step_order: 3 },
      { instruction: 'Cook noodles per packet. Ladle hot broth into bowls, add noodles.', step_order: 4 },
      { instruction: 'Top each bowl with chashu, halved marinated egg, bamboo shoots, nori, spring onion.', step_order: 5 },
    ],
  },
  {
    title: 'Miso Salmon',
    description: 'Oven-roasted salmon fillets with a sweet white miso and mirin glaze.',
    cuisine: 'japanese', carb_type: 'rice', protein_type: 'fish',
    prep_time_min: 10, cook_time_min: 12, servings: 4,
    emoji: '🐟', bg_color: '#f97316',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Salmon fillets', amount: 4, unit: 'piece', storage_location: 'fridge', sort_order: 0 },
      { name: 'White miso paste', amount: 3, unit: 'tbsp', storage_location: 'fridge', sort_order: 1 },
      { name: 'Mirin', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 2 },
      { name: 'Sake', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 3 },
      { name: 'Sugar', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Jasmine rice', amount: 320, unit: 'g', storage_location: 'pantry', sort_order: 5 },
      { name: 'Sesame seeds', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Spring onions', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Whisk miso, mirin, sake, sugar. Coat salmon fillets and marinate 15 min (or overnight).', step_order: 0 },
      { instruction: 'Preheat grill/broiler to high. Line baking tray with foil.', step_order: 1 },
      { instruction: 'Grill salmon 8–12 min until caramelised and cooked through. Watch carefully — miso burns quickly.', step_order: 2 },
      { instruction: 'Serve over rice, sprinkled with sesame seeds and sliced spring onions.', step_order: 3 },
    ],
  },

  // ── INDIAN ─────────────────────────────────────────────────────────────────
  {
    title: 'Butter Chicken',
    description: 'Tender chicken in a rich tomato, cream, and spiced butter sauce. Serve with naan.',
    cuisine: 'indian', carb_type: 'bread', protein_type: 'chicken',
    prep_time_min: 20, cook_time_min: 40, servings: 4,
    emoji: '🍛', bg_color: '#ea580c',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chicken thighs, cubed', amount: 700, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Natural yoghurt', amount: 150, unit: 'ml', storage_location: 'fridge', sort_order: 1 },
      { name: 'Butter', amount: 50, unit: 'g', storage_location: 'fridge', sort_order: 2 },
      { name: 'Tinned tomatoes', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 3 },
      { name: 'Double cream', amount: 120, unit: 'ml', storage_location: 'fridge', sort_order: 4 },
      { name: 'Onion', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 5 },
      { name: 'Garlic cloves', amount: 4, unit: 'qty', storage_location: 'pantry', sort_order: 6 },
      { name: 'Fresh ginger', amount: 2, unit: 'tbsp', storage_location: 'fridge', sort_order: 7 },
      { name: 'Garam masala', amount: 2, unit: 'tsp', storage_location: 'pantry', sort_order: 8 },
      { name: 'Cumin', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 9 },
      { name: 'Turmeric', amount: 0.5, unit: 'tsp', storage_location: 'pantry', sort_order: 10 },
    ],
    steps: [
      { instruction: 'Marinate chicken in yoghurt, garam masala, cumin, turmeric for at least 1 hr. Grill or pan-fry until charred.', step_order: 0 },
      { instruction: 'Fry onion, garlic, ginger in butter until golden.', step_order: 1 },
      { instruction: 'Add tomatoes, blitz smooth with stick blender. Simmer 15 min.', step_order: 2 },
      { instruction: 'Add chicken and cream. Simmer 15 min. Season.', step_order: 3 },
      { instruction: 'Serve with naan or basmati rice and garnish with cream swirl and coriander.', step_order: 4 },
    ],
  },
  {
    title: 'Lamb Biryani',
    description: 'Fragrant slow-cooked lamb layered with saffron basmati rice and caramelised onions.',
    cuisine: 'indian', carb_type: 'rice', protein_type: 'lamb',
    prep_time_min: 40, cook_time_min: 90, servings: 6,
    emoji: '🍖', bg_color: '#b45309',
    advance_prep_days: 1, advance_prep_note: 'Best to marinate lamb overnight in yoghurt and spices.',
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Lamb shoulder, cubed', amount: 800, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Basmati rice', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 1 },
      { name: 'Yoghurt', amount: 200, unit: 'ml', storage_location: 'fridge', sort_order: 2 },
      { name: 'Large onions', amount: 3, unit: 'qty', storage_location: 'pantry', sort_order: 3 },
      { name: 'Saffron', amount: 0.5, unit: 'tsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Warm milk', amount: 50, unit: 'ml', storage_location: 'fridge', sort_order: 5 },
      { name: 'Garam masala', amount: 2, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Cardamom pods', amount: 6, unit: 'qty', storage_location: 'pantry', sort_order: 7 },
      { name: 'Bay leaves', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 8 },
      { name: 'Ghee or butter', amount: 60, unit: 'g', storage_location: 'fridge', sort_order: 9 },
    ],
    steps: [
      { instruction: 'Marinate lamb in yoghurt, garam masala, salt overnight. Steep saffron in warm milk.', step_order: 0 },
      { instruction: 'Fry sliced onions in ghee until deep golden and crispy. Set aside half for topping.', step_order: 1 },
      { instruction: 'Cook marinated lamb with remaining onions until tender, 60–90 min on low.', step_order: 2 },
      { instruction: 'Parboil rice with cardamom and bay until 70% cooked. Drain.', step_order: 3 },
      { instruction: 'Layer: lamb → parboiled rice → saffron milk → reserved onions. Cover tightly. Cook on very low 25 min (dum).', step_order: 4 },
      { instruction: 'Gently fold layers once and serve with raita.', step_order: 5 },
    ],
  },
  {
    title: 'Red Lentil Dal',
    description: 'Comforting spiced red lentil soup with a tadka of cumin, mustard seeds, and curry leaves.',
    cuisine: 'indian', carb_type: 'none', protein_type: 'none',
    prep_time_min: 10, cook_time_min: 30, servings: 4,
    emoji: '🫕', bg_color: '#b45309',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Red lentils', amount: 300, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Tinned tomatoes', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 1 },
      { name: 'Onion', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 2 },
      { name: 'Garlic cloves', amount: 3, unit: 'qty', storage_location: 'pantry', sort_order: 3 },
      { name: 'Fresh ginger', amount: 1, unit: 'tbsp', storage_location: 'fridge', sort_order: 4 },
      { name: 'Coconut milk', amount: 200, unit: 'ml', storage_location: 'pantry', sort_order: 5 },
      { name: 'Cumin seeds', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Mustard seeds', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Curry leaves', amount: 10, unit: 'qty', storage_location: 'pantry', sort_order: 8 },
      { name: 'Turmeric', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 9 },
    ],
    steps: [
      { instruction: 'Rinse lentils. Simmer with 800 ml water, turmeric, and salt until soft, 20 min. Stir occasionally.', step_order: 0 },
      { instruction: 'Sauté onion until golden. Add garlic, ginger, tomatoes. Cook 5 min.', step_order: 1 },
      { instruction: 'Add coconut milk and tomato-onion base to lentils. Simmer 10 more min.', step_order: 2 },
      { instruction: 'Make tadka: heat oil in small pan, pop mustard seeds, add cumin and curry leaves 30 sec.', step_order: 3 },
      { instruction: 'Pour sizzling tadka over dal. Serve with rice or chapati.', step_order: 4 },
    ],
  },

  // ── AMERICAN ───────────────────────────────────────────────────────────────
  {
    title: 'Classic Beef Burgers',
    description: 'Juicy smash-style beef patties with melted American cheese, pickles, and special sauce.',
    cuisine: 'american', carb_type: 'bread', protein_type: 'beef',
    prep_time_min: 15, cook_time_min: 15, servings: 4,
    emoji: '🍔', bg_color: '#dc2626',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Minced beef (20% fat)', amount: 600, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Burger buns', amount: 4, unit: 'qty', storage_location: 'pantry', sort_order: 1 },
      { name: 'American cheese slices', amount: 4, unit: 'piece', storage_location: 'fridge', sort_order: 2 },
      { name: 'Dill pickles', amount: 8, unit: 'piece', storage_location: 'fridge', sort_order: 3 },
      { name: 'Iceberg lettuce', amount: 4, unit: 'piece', storage_location: 'fridge', sort_order: 4 },
      { name: 'Tomato', amount: 1, unit: 'qty', storage_location: 'fridge', sort_order: 5 },
      { name: 'Mayonnaise', amount: 3, unit: 'tbsp', storage_location: 'fridge', sort_order: 6 },
      { name: 'Ketchup', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Yellow mustard', amount: 1, unit: 'tbsp', storage_location: 'fridge', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Mix mayo, ketchup, mustard for special sauce. Toast bun cut-sides in pan.', step_order: 0 },
      { instruction: 'Divide beef into 4 balls. Heat cast iron until smoking.', step_order: 1 },
      { instruction: 'Place balls on pan, smash flat with spatula. Season. Cook 2 min until edges brown.', step_order: 2 },
      { instruction: 'Flip, add cheese immediately. Cook 1 more min.', step_order: 3 },
      { instruction: 'Assemble: sauce on bun → lettuce → tomato → patty → pickles → more sauce.', step_order: 4 },
    ],
  },
  {
    title: 'BBQ Pulled Pork',
    description: 'Slow-roasted pork shoulder, pulled and tossed in smoky BBQ sauce. Perfect in brioche buns.',
    cuisine: 'american', carb_type: 'bread', protein_type: 'pork',
    prep_time_min: 20, cook_time_min: 300, servings: 8,
    emoji: '🥩', bg_color: '#7c2d12',
    advance_prep_days: 1, advance_prep_note: 'Best to dry rub the pork overnight in the fridge.',
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Pork shoulder', amount: 2000, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Smoked paprika', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 1 },
      { name: 'Brown sugar', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 2 },
      { name: 'Garlic powder', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 3 },
      { name: 'BBQ sauce', amount: 250, unit: 'ml', storage_location: 'pantry', sort_order: 4 },
      { name: 'Brioche buns', amount: 8, unit: 'qty', storage_location: 'pantry', sort_order: 5 },
      { name: 'Apple cider vinegar', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Coleslaw', amount: 300, unit: 'g', storage_location: 'fridge', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Mix paprika, sugar, garlic powder, salt. Rub all over pork. Refrigerate overnight.', step_order: 0 },
      { instruction: 'Preheat oven to 150°C. Roast pork in a covered dish 4–5 hrs until falling apart.', step_order: 1 },
      { instruction: 'Shred pork with two forks. Discard excess fat.', step_order: 2 },
      { instruction: 'Toss pulled pork with BBQ sauce and splash of apple cider vinegar.', step_order: 3 },
      { instruction: 'Pile high on brioche buns with coleslaw.', step_order: 4 },
    ],
  },
  {
    title: 'Mac & Cheese',
    description: 'Ultra-creamy stovetop mac with a three-cheese sauce and crunchy breadcrumb topping.',
    cuisine: 'american', carb_type: 'pasta', protein_type: 'none',
    prep_time_min: 10, cook_time_min: 25, servings: 4,
    emoji: '🧀', bg_color: '#f59e0b',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Macaroni', amount: 350, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Mature cheddar, grated', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Gruyère, grated', amount: 100, unit: 'g', storage_location: 'fridge', sort_order: 2 },
      { name: 'Parmesan, grated', amount: 50, unit: 'g', storage_location: 'fridge', sort_order: 3 },
      { name: 'Whole milk', amount: 500, unit: 'ml', storage_location: 'fridge', sort_order: 4 },
      { name: 'Butter', amount: 40, unit: 'g', storage_location: 'fridge', sort_order: 5 },
      { name: 'Plain flour', amount: 30, unit: 'g', storage_location: 'pantry', sort_order: 6 },
      { name: 'Panko breadcrumbs', amount: 60, unit: 'g', storage_location: 'pantry', sort_order: 7 },
      { name: 'Mustard powder', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Cook macaroni until al dente. Drain, reserving 100 ml pasta water.', step_order: 0 },
      { instruction: 'Make roux: melt butter, whisk in flour, cook 2 min. Gradually add milk, whisking until smooth.', step_order: 1 },
      { instruction: 'Add mustard powder. Off heat, stir in cheddar and gruyère until melted. Season.', step_order: 2 },
      { instruction: 'Combine pasta with sauce, loosen with pasta water if needed.', step_order: 3 },
      { instruction: 'Top with panko + Parmesan, grill 3–4 min until golden. Serve immediately.', step_order: 4 },
    ],
  },

  // ── MEDITERRANEAN ──────────────────────────────────────────────────────────
  {
    title: 'Greek Salad Bowl',
    description: 'Crispy falafel over a bed of hummus, tabbouleh, cucumber, and tomato with tahini dressing.',
    cuisine: 'mediterranean', carb_type: 'other', protein_type: 'none',
    prep_time_min: 25, cook_time_min: 20, servings: 4,
    emoji: '🥗', bg_color: '#15803d',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chickpeas (canned, drained)', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Feta cheese', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Cucumber', amount: 1, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Tomatoes', amount: 3, unit: 'qty', storage_location: 'fridge', sort_order: 3 },
      { name: 'Kalamata olives', amount: 100, unit: 'g', storage_location: 'pantry', sort_order: 4 },
      { name: 'Red onion', amount: 0.5, unit: 'qty', storage_location: 'pantry', sort_order: 5 },
      { name: 'Olive oil', amount: 4, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Lemon juice', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Dried oregano', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 8 },
      { name: 'Pita bread', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 9 },
    ],
    steps: [
      { instruction: 'Chop cucumber, tomatoes, and onion into large chunks.', step_order: 0 },
      { instruction: 'Combine vegetables with olives and chickpeas in a large bowl.', step_order: 1 },
      { instruction: 'Whisk olive oil, lemon juice, oregano, salt, pepper. Toss with salad.', step_order: 2 },
      { instruction: 'Top with crumbled feta. Do not toss again — leave feta on top.', step_order: 3 },
      { instruction: 'Serve with warm pita bread.', step_order: 4 },
    ],
  },
  {
    title: 'Shakshuka',
    description: 'Eggs poached in a spiced tomato and pepper sauce. Quick, satisfying, and endlessly customisable.',
    cuisine: 'mediterranean', carb_type: 'bread', protein_type: 'eggs',
    prep_time_min: 10, cook_time_min: 25, servings: 4,
    emoji: '🍳', bg_color: '#dc2626',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Eggs', amount: 6, unit: 'qty', storage_location: 'fridge', sort_order: 0 },
      { name: 'Tinned chopped tomatoes', amount: 800, unit: 'g', storage_location: 'pantry', sort_order: 1 },
      { name: 'Red peppers', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Onion', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 3 },
      { name: 'Garlic cloves', amount: 3, unit: 'qty', storage_location: 'pantry', sort_order: 4 },
      { name: 'Cumin', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Smoked paprika', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Harissa', amount: 1, unit: 'tbsp', storage_location: 'fridge', sort_order: 7 },
      { name: 'Crusty bread', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Sauté onion and peppers in olive oil until soft, 8 min. Add garlic, cumin, paprika, harissa.', step_order: 0 },
      { instruction: 'Add tomatoes. Season. Simmer 15 min until sauce is thick.', step_order: 1 },
      { instruction: 'Make wells in sauce. Crack eggs in. Cover and cook on low until whites set, yolks runny, ~8 min.', step_order: 2 },
      { instruction: 'Scatter crumbled feta and parsley. Serve straight from pan with crusty bread.', step_order: 3 },
    ],
  },
  {
    title: 'Lamb Kofta Wraps',
    description: 'Spiced minced lamb kofta in flatbreads with tzatziki, tomato, and pickled chilli.',
    cuisine: 'mediterranean', carb_type: 'bread', protein_type: 'lamb',
    prep_time_min: 25, cook_time_min: 15, servings: 4,
    emoji: '🥙', bg_color: '#92400e',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Minced lamb', amount: 500, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Flatbreads', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 1 },
      { name: 'Greek yoghurt', amount: 200, unit: 'ml', storage_location: 'fridge', sort_order: 2 },
      { name: 'Cucumber', amount: 0.5, unit: 'qty', storage_location: 'fridge', sort_order: 3 },
      { name: 'Garlic clove, minced', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 4 },
      { name: 'Cumin', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Coriander', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Cinnamon', amount: 0.5, unit: 'tsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Tomatoes', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Mix lamb with cumin, coriander, cinnamon, salt, and half the garlic. Shape into 12 oval koftas.', step_order: 0 },
      { instruction: 'Grate cucumber, salt, squeeze dry. Mix with yoghurt and remaining garlic for tzatziki.', step_order: 1 },
      { instruction: 'Grill or pan-fry koftas 3–4 min per side until charred and cooked through.', step_order: 2 },
      { instruction: 'Warm flatbreads. Spread tzatziki, add sliced tomatoes, koftas.', step_order: 3 },
      { instruction: 'Roll tightly and serve immediately.', step_order: 4 },
    ],
  },

  // ── THAI ───────────────────────────────────────────────────────────────────
  {
    title: 'Pad Thai',
    description: 'Stir-fried rice noodles with prawns, egg, bean sprouts, and tamarind sauce.',
    cuisine: 'thai', carb_type: 'noodles', protein_type: 'shrimp',
    prep_time_min: 20, cook_time_min: 15, servings: 4,
    emoji: '🍜', bg_color: '#f97316',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Flat rice noodles', amount: 250, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Raw prawns, peeled', amount: 400, unit: 'g', storage_location: 'freezer', sort_order: 1 },
      { name: 'Eggs', amount: 3, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Bean sprouts', amount: 150, unit: 'g', storage_location: 'fridge', sort_order: 3 },
      { name: 'Tamarind paste', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Fish sauce', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Palm sugar', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Spring onions', amount: 3, unit: 'qty', storage_location: 'fridge', sort_order: 7 },
      { name: 'Crushed peanuts', amount: 60, unit: 'g', storage_location: 'pantry', sort_order: 8 },
      { name: 'Lime', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 9 },
    ],
    steps: [
      { instruction: 'Soak noodles in cold water 30 min until pliable, drain.', step_order: 0 },
      { instruction: 'Mix tamarind, fish sauce, sugar for the sauce.', step_order: 1 },
      { instruction: 'Stir-fry prawns in very hot wok until pink. Push aside, scramble eggs in same wok.', step_order: 2 },
      { instruction: 'Add noodles and sauce. Toss vigorously 2–3 min until noodles absorb sauce.', step_order: 3 },
      { instruction: 'Add bean sprouts and spring onions. Toss once more.', step_order: 4 },
      { instruction: 'Serve with crushed peanuts, lime wedges, and extra chilli on the side.', step_order: 5 },
    ],
  },
  {
    title: 'Thai Green Curry',
    description: 'Creamy coconut milk curry with chicken, Thai basil, and fragrant green curry paste.',
    cuisine: 'thai', carb_type: 'rice', protein_type: 'chicken',
    prep_time_min: 15, cook_time_min: 25, servings: 4,
    emoji: '🍛', bg_color: '#16a34a',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chicken breast, sliced', amount: 600, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Coconut milk', amount: 400, unit: 'ml', storage_location: 'pantry', sort_order: 1 },
      { name: 'Green curry paste', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 2 },
      { name: 'Thai basil', amount: 20, unit: 'g', storage_location: 'fridge', sort_order: 3 },
      { name: 'Fish sauce', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Palm sugar', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Aubergine', amount: 1, unit: 'qty', storage_location: 'fridge', sort_order: 6 },
      { name: 'Kaffir lime leaves', amount: 4, unit: 'qty', storage_location: 'pantry', sort_order: 7 },
      { name: 'Jasmine rice', amount: 320, unit: 'g', storage_location: 'pantry', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Fry curry paste in a dry wok 1 min. Add half the coconut milk, stir until split and fragrant.', step_order: 0 },
      { instruction: 'Add chicken, stir to coat. Cook 5 min.', step_order: 1 },
      { instruction: 'Add remaining coconut milk, lime leaves, fish sauce, sugar, and aubergine.', step_order: 2 },
      { instruction: 'Simmer 15 min until chicken is cooked and aubergine is tender.', step_order: 3 },
      { instruction: 'Stir in Thai basil off heat. Serve over jasmine rice.', step_order: 4 },
    ],
  },
  {
    title: 'Tom Yum Soup',
    description: 'Hot and sour Thai broth with prawns, mushrooms, lemongrass, and kaffir lime.',
    cuisine: 'thai', carb_type: 'none', protein_type: 'shrimp',
    prep_time_min: 15, cook_time_min: 15, servings: 4,
    emoji: '🥘', bg_color: '#dc2626',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Raw prawns', amount: 400, unit: 'g', storage_location: 'freezer', sort_order: 0 },
      { name: 'Mushrooms, sliced', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Lemongrass stalks', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 2 },
      { name: 'Kaffir lime leaves', amount: 6, unit: 'qty', storage_location: 'pantry', sort_order: 3 },
      { name: 'Galangal or ginger, sliced', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 4 },
      { name: 'Tom yum paste', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Fish sauce', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Lime juice', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Red chillies', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 8 },
      { name: 'Coriander', amount: 20, unit: 'g', storage_location: 'fridge', sort_order: 9 },
    ],
    steps: [
      { instruction: 'Bring 1 L water to boil with bruised lemongrass, kaffir lime leaves, and galangal.', step_order: 0 },
      { instruction: 'Stir in tom yum paste. Simmer 5 min.', step_order: 1 },
      { instruction: 'Add mushrooms and prawns. Cook 3–4 min until prawns are pink.', step_order: 2 },
      { instruction: 'Season with fish sauce and lime juice. Taste — should be hot, sour, salty.', step_order: 3 },
      { instruction: 'Ladle into bowls with chillies and coriander.', step_order: 4 },
    ],
  },

  // ── FRENCH ─────────────────────────────────────────────────────────────────
  {
    title: 'Quiche Lorraine',
    description: 'Classic French tart with a buttery pastry crust, lardons, and a silky egg custard.',
    cuisine: 'french', carb_type: 'other', protein_type: 'pork',
    prep_time_min: 30, cook_time_min: 45, servings: 6,
    emoji: '🥧', bg_color: '#f59e0b',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Shortcrust pastry sheet', amount: 1, unit: 'piece', storage_location: 'fridge', sort_order: 0 },
      { name: 'Lardons or smoked bacon', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Eggs', amount: 3, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Double cream', amount: 300, unit: 'ml', storage_location: 'fridge', sort_order: 3 },
      { name: 'Gruyère cheese, grated', amount: 100, unit: 'g', storage_location: 'fridge', sort_order: 4 },
      { name: 'Nutmeg', amount: 0.25, unit: 'tsp', storage_location: 'pantry', sort_order: 5 },
    ],
    steps: [
      { instruction: 'Preheat oven to 190°C. Line a 23 cm tart tin with pastry. Blind bake 15 min.', step_order: 0 },
      { instruction: 'Fry lardons until golden. Scatter over pastry base with half the cheese.', step_order: 1 },
      { instruction: 'Whisk eggs with cream, nutmeg, salt, and pepper.', step_order: 2 },
      { instruction: 'Pour custard over lardons. Top with remaining cheese.', step_order: 3 },
      { instruction: 'Bake 30–35 min until just set with a slight wobble. Cool 10 min before slicing.', step_order: 4 },
    ],
  },
  {
    title: 'Ratatouille',
    description: 'Provençal slow-cooked vegetable stew with aubergine, courgette, tomatoes, and herbes de Provence.',
    cuisine: 'french', carb_type: 'none', protein_type: 'none',
    prep_time_min: 20, cook_time_min: 60, servings: 6,
    emoji: '🫕', bg_color: '#dc2626',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Aubergine, cubed', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 0 },
      { name: 'Courgette, cubed', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 1 },
      { name: 'Red peppers', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Tomatoes, chopped', amount: 4, unit: 'qty', storage_location: 'fridge', sort_order: 3 },
      { name: 'Onion', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 4 },
      { name: 'Garlic cloves', amount: 3, unit: 'qty', storage_location: 'pantry', sort_order: 5 },
      { name: 'Olive oil', amount: 5, unit: 'tbsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Herbes de Provence', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Tomato purée', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Salt aubergine and courgette cubes 20 min to draw moisture. Pat dry.', step_order: 0 },
      { instruction: 'Brown aubergine and courgette separately in batches in olive oil. Set aside.', step_order: 1 },
      { instruction: 'Soften onion and peppers in same pan 8 min. Add garlic and tomato purée.', step_order: 2 },
      { instruction: 'Return all vegetables to pan. Add tomatoes and herbes de Provence.', step_order: 3 },
      { instruction: 'Cover and simmer 40 min on low, stirring occasionally. Season. Serve warm or at room temperature.', step_order: 4 },
    ],
  },

  // ── MIDDLE EASTERN ─────────────────────────────────────────────────────────
  {
    title: 'Chicken Shawarma',
    description: 'Marinated chicken thighs with warm Middle Eastern spices, served in flatbread with garlic sauce.',
    cuisine: 'middle-eastern', carb_type: 'bread', protein_type: 'chicken',
    prep_time_min: 20, cook_time_min: 20, servings: 4,
    emoji: '🥙', bg_color: '#d97706',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Chicken thighs', amount: 700, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Flatbreads', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 1 },
      { name: 'Yoghurt', amount: 150, unit: 'ml', storage_location: 'fridge', sort_order: 2 },
      { name: 'Garlic cloves', amount: 4, unit: 'qty', storage_location: 'pantry', sort_order: 3 },
      { name: 'Lemon juice', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Cumin', amount: 1.5, unit: 'tsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Allspice', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 6 },
      { name: 'Turmeric', amount: 0.5, unit: 'tsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Tomatoes', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 8 },
    ],
    steps: [
      { instruction: 'Marinate chicken in yoghurt, 2 garlic cloves, lemon, cumin, allspice, turmeric at least 1 hr.', step_order: 0 },
      { instruction: 'Make garlic sauce: blend remaining garlic with olive oil, lemon juice until thick.', step_order: 1 },
      { instruction: 'Grill or oven-roast chicken at 220°C for 15–20 min until charred at edges.', step_order: 2 },
      { instruction: 'Rest 5 min, slice thinly.', step_order: 3 },
      { instruction: 'Spread garlic sauce on warm flatbread, top with chicken and tomato.', step_order: 4 },
    ],
  },
  {
    title: 'Beef & Lamb Kebabs',
    description: 'Minced beef and lamb kebabs spiced with parsley, onion, and sumac. Serve with flatbread and yoghurt.',
    cuisine: 'middle-eastern', carb_type: 'bread', protein_type: 'beef',
    prep_time_min: 20, cook_time_min: 15, servings: 4,
    emoji: '🍖', bg_color: '#b45309',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Minced beef', amount: 300, unit: 'g', storage_location: 'fridge', sort_order: 0 },
      { name: 'Minced lamb', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Onion, grated', amount: 1, unit: 'qty', storage_location: 'pantry', sort_order: 2 },
      { name: 'Parsley, finely chopped', amount: 30, unit: 'g', storage_location: 'fridge', sort_order: 3 },
      { name: 'Sumac', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 4 },
      { name: 'Cumin', amount: 1, unit: 'tsp', storage_location: 'pantry', sort_order: 5 },
      { name: 'Flatbreads', amount: 4, unit: 'piece', storage_location: 'pantry', sort_order: 6 },
      { name: 'Greek yoghurt', amount: 200, unit: 'ml', storage_location: 'fridge', sort_order: 7 },
    ],
    steps: [
      { instruction: 'Combine meats, grated onion, parsley, sumac, cumin, salt. Mix well.', step_order: 0 },
      { instruction: 'Shape onto skewers as elongated sausages. Chill 30 min if time allows.', step_order: 1 },
      { instruction: 'Grill over high heat turning regularly, 10–12 min until charred.', step_order: 2 },
      { instruction: 'Serve on warm flatbreads with yoghurt and a squeeze of lemon.', step_order: 3 },
    ],
  },

  // ── KOREAN ─────────────────────────────────────────────────────────────────
  {
    title: 'Bibimbap',
    description: 'Korean mixed rice bowl with marinated beef, assorted vegetables, fried egg, and gochujang sauce.',
    cuisine: 'korean', carb_type: 'rice', protein_type: 'beef',
    prep_time_min: 30, cook_time_min: 20, servings: 4,
    emoji: '🍚', bg_color: '#dc2626',
    advance_prep_days: 0, advance_prep_note: null,
    is_global: true, household_id: null, created_by: null,
    ingredients: [
      { name: 'Short grain rice', amount: 400, unit: 'g', storage_location: 'pantry', sort_order: 0 },
      { name: 'Beef sirloin, thinly sliced', amount: 300, unit: 'g', storage_location: 'fridge', sort_order: 1 },
      { name: 'Eggs', amount: 4, unit: 'qty', storage_location: 'fridge', sort_order: 2 },
      { name: 'Spinach', amount: 200, unit: 'g', storage_location: 'fridge', sort_order: 3 },
      { name: 'Carrots', amount: 2, unit: 'qty', storage_location: 'fridge', sort_order: 4 },
      { name: 'Courgette', amount: 1, unit: 'qty', storage_location: 'fridge', sort_order: 5 },
      { name: 'Bean sprouts', amount: 100, unit: 'g', storage_location: 'fridge', sort_order: 6 },
      { name: 'Soy sauce', amount: 3, unit: 'tbsp', storage_location: 'pantry', sort_order: 7 },
      { name: 'Sesame oil', amount: 2, unit: 'tbsp', storage_location: 'pantry', sort_order: 8 },
      { name: 'Gochujang', amount: 4, unit: 'tbsp', storage_location: 'fridge', sort_order: 9 },
      { name: 'Sugar', amount: 1, unit: 'tbsp', storage_location: 'pantry', sort_order: 10 },
      { name: 'Garlic cloves', amount: 2, unit: 'qty', storage_location: 'pantry', sort_order: 11 },
    ],
    steps: [
      { instruction: 'Marinate beef in soy sauce, 1 tsp sesame oil, garlic, sugar for 15 min. Stir-fry until cooked.', step_order: 0 },
      { instruction: 'Blanch spinach and bean sprouts separately 1 min. Squeeze dry, season with sesame oil and salt.', step_order: 1 },
      { instruction: 'Sauté julienned carrots and courgette separately until just tender.', step_order: 2 },
      { instruction: 'Mix gochujang sauce: gochujang + sugar + sesame oil + 1 tbsp water.', step_order: 3 },
      { instruction: 'Divide rice into 4 bowls. Arrange vegetables and beef in sections on top. Add fried egg in centre.', step_order: 4 },
      { instruction: 'Drizzle gochujang sauce over. Mix everything together at the table before eating.', step_order: 5 },
    ],
  },
];

// ─── Main seed function ───────────────────────────────────────────────────────

async function seed() {
  console.log(`Seeding ${RECIPES.length} global recipes…`);

  let success = 0;
  let skipped = 0;

  for (const recipe of RECIPES) {
    const { ingredients, steps, ...recipeData } = recipe;

    // Check if already exists (idempotent by title + is_global)
    const { data: existing } = await supabase
      .from('recipes')
      .select('id')
      .eq('title', recipeData.title)
      .eq('is_global', true)
      .maybeSingle();

    if (existing) {
      console.log(`  ⏭  Skipping "${recipeData.title}" (already exists)`);
      skipped++;
      continue;
    }

    // Insert recipe
    const { data: inserted, error: recipeErr } = await supabase
      .from('recipes')
      .insert(recipeData as never)
      .select('id')
      .single();

    if (recipeErr || !inserted) {
      console.error(`  ✗  Failed to insert "${recipeData.title}":`, recipeErr?.message);
      continue;
    }

    const recipeId = (inserted as unknown as { id: string }).id;

    // Insert ingredients
    if (ingredients.length > 0) {
      const { error: ingErr } = await supabase
        .from('recipe_ingredients')
        .insert(ingredients.map((ing) => ({ ...ing, recipe_id: recipeId } as never)));

      if (ingErr) {
        console.error(`  ✗  Failed to insert ingredients for "${recipeData.title}":`, ingErr.message);
        continue;
      }
    }

    // Insert steps
    if (steps.length > 0) {
      const { error: stepErr } = await supabase
        .from('recipe_steps')
        .insert(steps.map((step) => ({ ...step, recipe_id: recipeId } as never)));

      if (stepErr) {
        console.error(`  ✗  Failed to insert steps for "${recipeData.title}":`, stepErr.message);
        continue;
      }
    }

    console.log(`  ✓  "${recipeData.title}"`);
    success++;
  }

  console.log(`\nDone. ${success} inserted, ${skipped} skipped.`);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
