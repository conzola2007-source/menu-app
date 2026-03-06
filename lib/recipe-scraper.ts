// Server-side recipe scraper — parses JSON-LD schema.org/Recipe from HTML
// Used by app/api/recipes/import/route.ts

import type { CuisineType, IngredientUnit } from '@/lib/supabase/types';
import { CUISINE_TYPES } from '@/lib/recipe-constants';

// ─── Output types ─────────────────────────────────────────────────────────────

export interface ScrapedIngredient {
  name: string;
  amount: number;
  unit: IngredientUnit;
}

export interface ScrapedRecipe {
  title: string;
  description: string;
  cuisine: CuisineType;
  prep_time_min: number;
  cook_time_min: number;
  servings: number;
  ingredients: ScrapedIngredient[];
  steps: { instruction: string }[];
}

// ─── ISO 8601 duration → minutes ─────────────────────────────────────────────

function parseDuration(iso: unknown): number {
  if (typeof iso !== 'string') return 0;
  // e.g. PT30M, PT1H, PT1H30M, P0DT45M
  const match = iso.match(/P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const days = parseInt(match[1] ?? '0', 10);
  const hours = parseInt(match[2] ?? '0', 10);
  const mins = parseInt(match[3] ?? '0', 10);
  return days * 1440 + hours * 60 + mins;
}

// ─── Cuisine string → CuisineType ────────────────────────────────────────────

const CUISINE_MAP: Record<string, CuisineType> = {
  italian: 'italian', pasta: 'italian', pizza: 'italian',
  mexican: 'mexican', tex: 'mexican',
  chinese: 'chinese',
  japanese: 'japanese', sushi: 'japanese', ramen: 'japanese',
  indian: 'indian',
  american: 'american',
  mediterranean: 'mediterranean', greek: 'mediterranean',
  thai: 'thai',
  french: 'french',
  'middle eastern': 'middle-eastern', middle: 'middle-eastern', arabic: 'middle-eastern', lebanese: 'middle-eastern',
  korean: 'korean',
};

function parseCuisine(raw: unknown): CuisineType {
  if (!raw) return 'other';
  const str = (Array.isArray(raw) ? raw[0] : raw).toString().toLowerCase();
  for (const [key, val] of Object.entries(CUISINE_MAP)) {
    if (str.includes(key)) return val;
  }
  return 'other';
}

// ─── Ingredient string parser ─────────────────────────────────────────────────

const UNIT_MAP: Record<string, IngredientUnit> = {
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', millilitre: 'ml',
  l: 'l', liter: 'l', litre: 'l', liters: 'l', litres: 'l',
  oz: 'oz', ounce: 'oz', ounces: 'oz',
  lb: 'lb', pound: 'lb', pounds: 'lb',
  cup: 'cup', cups: 'cup',
  tbsp: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp',
  piece: 'piece', pieces: 'piece',
  pack: 'pack', packet: 'pack', packets: 'pack',
  bag: 'bag', bags: 'bag',
  bottle: 'bottle', bottles: 'bottle',
};

function parseFraction(str: string): number {
  // Handle unicode fractions and slash fractions
  const UNICODE: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 0.333, '⅔': 0.667, '⅛': 0.125 };
  if (UNICODE[str]) return UNICODE[str];
  const parts = str.split('/');
  if (parts.length === 2) {
    const num = parseFloat(parts[0]);
    const den = parseFloat(parts[1]);
    if (!isNaN(num) && !isNaN(den) && den !== 0) return num / den;
  }
  return parseFloat(str) || 0;
}

export function parseIngredientString(raw: string): ScrapedIngredient {
  // Strip HTML tags if any
  const str = raw.replace(/<[^>]+>/g, '').trim();

  // Pattern: optional number (including fractions/unicode), optional unit, then name
  // e.g. "2 cups flour", "1/2 tsp salt", "3 large eggs", "200g chicken breast"
  const pattern = /^([\d½¼¾⅓⅔⅛\/\.\s]+)?\s*([a-zA-Z]+)?\s+(.+)$/;
  const match = str.match(pattern);

  if (match) {
    const rawAmount = (match[1] ?? '').trim();
    const rawUnit = (match[2] ?? '').toLowerCase().trim();
    const rawName = (match[3] ?? '').trim();

    const amount = rawAmount ? parseFraction(rawAmount.replace(/\s/g, '')) : 1;
    const unit: IngredientUnit = UNIT_MAP[rawUnit] ?? 'qty';

    // If rawUnit isn't a recognized unit, include it in the name
    const name = UNIT_MAP[rawUnit] ? rawName : `${rawUnit} ${rawName}`.trim();

    return { name: name || str, amount: amount || 1, unit };
  }

  // Fallback: whole string as name
  return { name: str, amount: 1, unit: 'qty' };
}

// ─── Extract instructions ─────────────────────────────────────────────────────

function parseInstructions(raw: unknown): { instruction: string }[] {
  if (!raw) return [];

  const items: unknown[] = Array.isArray(raw) ? raw : [raw];
  const steps: { instruction: string }[] = [];

  for (const item of items) {
    if (typeof item === 'string' && item.trim()) {
      steps.push({ instruction: item.trim() });
    } else if (typeof item === 'object' && item !== null) {
      const obj = item as Record<string, unknown>;
      // HowToStep
      if (obj['@type'] === 'HowToStep' && typeof obj.text === 'string') {
        steps.push({ instruction: obj.text.trim() });
      } else if (typeof obj.text === 'string' && obj.text.trim()) {
        steps.push({ instruction: obj.text.trim() });
      } else if (obj['@type'] === 'HowToSection' && Array.isArray(obj.itemListElement)) {
        for (const sub of obj.itemListElement as unknown[]) {
          if (typeof sub === 'object' && sub !== null) {
            const s = sub as Record<string, unknown>;
            if (typeof s.text === 'string' && s.text.trim()) {
              steps.push({ instruction: s.text.trim() });
            }
          }
        }
      }
    }
  }

  return steps.length > 0 ? steps : [{ instruction: 'See original recipe for instructions.' }];
}

// ─── Extract servings ─────────────────────────────────────────────────────────

function parseServings(raw: unknown): number {
  if (!raw) return 1;
  const str = Array.isArray(raw) ? raw[0] : raw;
  const num = parseInt(String(str).replace(/[^\d]/g, ''), 10);
  return isNaN(num) || num < 1 ? 1 : Math.min(num, 20);
}

// ─── Find Recipe node in JSON-LD ──────────────────────────────────────────────

function findRecipeNode(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== 'object') return null;

  const obj = data as Record<string, unknown>;

  // Direct match
  if (obj['@type'] === 'Recipe') return obj;

  // Array of @types
  if (Array.isArray(obj['@type']) && (obj['@type'] as string[]).includes('Recipe')) return obj;

  // @graph array
  if (Array.isArray(obj['@graph'])) {
    for (const node of obj['@graph'] as unknown[]) {
      const found = findRecipeNode(node);
      if (found) return found;
    }
  }

  // Top-level array (some sites wrap in array)
  if (Array.isArray(data)) {
    for (const node of data as unknown[]) {
      const found = findRecipeNode(node);
      if (found) return found;
    }
  }

  return null;
}

// ─── Main scraper ─────────────────────────────────────────────────────────────

export function scrapeRecipe(html: string): ScrapedRecipe | null {
  // Extract all JSON-LD script blocks
  const scriptPattern = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match: RegExpExecArray | null;
  let recipe: Record<string, unknown> | null = null;

  while ((match = scriptPattern.exec(html)) !== null) {
    try {
      const json = JSON.parse(match[1]);
      const found = findRecipeNode(json);
      if (found) {
        recipe = found;
        break;
      }
    } catch {
      // Invalid JSON — skip
    }
  }

  if (!recipe) return null;

  const title = typeof recipe.name === 'string' ? recipe.name.trim() : '';
  if (!title) return null;

  const description = typeof recipe.description === 'string'
    ? recipe.description.replace(/<[^>]+>/g, '').trim()
    : '';

  const ingredients = Array.isArray(recipe.recipeIngredient)
    ? (recipe.recipeIngredient as unknown[])
        .filter((i): i is string => typeof i === 'string')
        .map(parseIngredientString)
    : [{ name: 'See original recipe', amount: 1, unit: 'qty' as IngredientUnit }];

  const steps = parseInstructions(recipe.recipeInstructions);

  return {
    title,
    description,
    cuisine: parseCuisine(recipe.recipeCuisine),
    prep_time_min: parseDuration(recipe.prepTime),
    cook_time_min: parseDuration(recipe.cookTime),
    servings: parseServings(recipe.recipeYield),
    ingredients,
    steps,
  };
}
