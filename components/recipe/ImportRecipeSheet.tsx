'use client';

import { useState } from 'react';
import { Link2, Loader2, AlertCircle } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { useImportRecipe } from '@/hooks/useImportRecipe';
import type { ScrapedRecipe } from '@/lib/recipe-scraper';

interface ImportRecipeSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (data: ScrapedRecipe) => void;
}

export function ImportRecipeSheet({ isOpen, onClose, onImported }: ImportRecipeSheetProps) {
  const [url, setUrl] = useState('');
  const importRecipe = useImportRecipe();

  function handleImport() {
    const trimmed = url.trim();
    if (!trimmed) return;
    importRecipe.mutate(trimmed, {
      onSuccess: (data) => {
        setUrl('');
        onImported(data);
        onClose();
      },
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleImport();
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Import from URL">
      <div className="flex flex-col gap-4 px-4 py-4">
        <p className="text-sm text-slate-400">
          Paste a link to any recipe page. Works best with sites that use structured recipe data
          (AllRecipes, BBC Good Food, Serious Eats, etc.).
        </p>

        <div className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 focus-within:border-primary">
          <Link2 className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://www.allrecipes.com/recipe/..."
            className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder-slate-600 focus:outline-none"
            autoFocus
            autoComplete="off"
            autoCorrect="off"
          />
          {url && (
            <button
              type="button"
              onClick={() => setUrl('')}
              className="text-slate-600 hover:text-slate-400 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {importRecipe.isError && (
          <div className="flex items-start gap-2 rounded-xl bg-red-500/10 px-3 py-2.5 text-sm text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{importRecipe.error instanceof Error ? importRecipe.error.message : 'Import failed'}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleImport}
          disabled={!url.trim() || importRecipe.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {importRecipe.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing…
            </>
          ) : (
            'Import recipe'
          )}
        </button>

        <p className="text-center text-xs text-slate-600">
          You can review and edit all fields before saving.
        </p>
      </div>
    </Sheet>
  );
}
