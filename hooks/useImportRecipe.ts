'use client';

import { useMutation } from '@tanstack/react-query';
import type { ScrapedRecipe } from '@/lib/recipe-scraper';

export function useImportRecipe() {
  return useMutation({
    mutationFn: async (url: string): Promise<ScrapedRecipe> => {
      const res = await fetch('/api/recipes/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      const data = await res.json() as { recipe?: ScrapedRecipe; error?: string };
      if (!res.ok || !data.recipe) {
        throw new Error(data.error ?? 'Import failed');
      }
      return data.recipe;
    },
  });
}
