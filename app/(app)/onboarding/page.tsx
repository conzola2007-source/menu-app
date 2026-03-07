'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Check, ChevronRight, Leaf, Drumstick, Wheat, Star } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type DietaryPreference = 'none' | 'vegan' | 'vegetarian' | 'halal';

interface GlobalRecipe {
  id: string;
  title: string;
  description: string;
  emoji: string;
  bg_color: string;
  prep_time_min: number;
  cook_time_min: number;
  dietary_tags: string[];
}

// ─── Dietary options ──────────────────────────────────────────────────────────

const DIETARY_OPTIONS: {
  id: DietaryPreference;
  label: string;
  emoji: string;
  desc: string;
}[] = [
  { id: 'none',       label: 'No restriction', emoji: '🍽️', desc: 'Show me everything'  },
  { id: 'vegan',      label: 'Vegan',           emoji: '🌱', desc: 'Plant-based only'    },
  { id: 'vegetarian', label: 'Vegetarian',      emoji: '🥗', desc: 'No meat or fish'     },
  { id: 'halal',      label: 'Halal',           emoji: '☪️', desc: 'No pork products'    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [step,           setStep]           = useState<1 | 2>(1);
  const [dietary,        setDietary]        = useState<DietaryPreference>('none');
  const [recipes,        setRecipes]        = useState<GlobalRecipe[]>([]);
  const [selected,       setSelected]       = useState<Set<string>>(new Set());
  const [loadingRec,     setLoadingRec]     = useState(false);
  const [saving,         setSaving]         = useState(false);
  const [redirecting,    setRedirecting]    = useState(false);

  // If user has already completed onboarding, bounce them away
  useEffect(() => {
    if (!user) return;
    const supabase = getSupabaseClient();
    void supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.onboarding_completed) {
          router.replace('/planned');
        }
      });
  }, [user, router]);

  // ── Step 1 handlers ──────────────────────────────────────────────────────────

  async function handleNext() {
    setLoadingRec(true);
    const supabase = getSupabaseClient();

    let q = supabase
      .from('recipes')
      .select(
        'id, title, description, emoji, bg_color, prep_time_min, cook_time_min, dietary_tags',
      )
      .eq('is_global', true)
      .order('title', { ascending: true });

    if (dietary !== 'none') {
      q = (q as ReturnType<typeof q.contains>).contains('dietary_tags', [dietary]);
    }

    const { data, error } = await q;
    if (!error) setRecipes((data ?? []) as unknown as GlobalRecipe[]);
    setLoadingRec(false);
    setStep(2);
  }

  // ── Step 2 handlers ──────────────────────────────────────────────────────────

  function toggleRecipe(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    const supabase = getSupabaseClient();

    try {
      // Save chosen global recipes to personal collection
      if (selected.size > 0) {
        const rows = Array.from(selected).map((recipe_id) => ({
          user_id: user.id,
          recipe_id,
        }));
        await supabase
          .from('user_saved_global_recipes')
          .insert(rows as never);
      }

      // Mark onboarding complete + store dietary preference
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          dietary_preference: dietary,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', user.id);

      setRedirecting(true);
      router.replace('/household/create');
    } finally {
      setSaving(false);
    }
  }

  // ── Step 1: Dietary preference ────────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-900 px-5 pt-safe">
        {/* Progress */}
        <div className="mb-6 pt-10">
          <div className="mb-4 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-slate-700" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Step 1 of 2
          </p>
          <h1 className="mt-1 text-2xl font-bold text-white">What do you eat?</h1>
          <p className="mt-1 text-sm text-slate-400">
            We&apos;ll filter the recipe library to match your diet.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {DIETARY_OPTIONS.map((opt) => {
            const isActive = dietary === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDietary(opt.id)}
                className={`flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all ${
                  isActive
                    ? 'border-primary bg-primary/10 ring-1 ring-primary'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <span className="text-3xl leading-none">{opt.emoji}</span>
                <div className="flex-1">
                  <p className="font-semibold text-white">{opt.label}</p>
                  <p className="text-xs text-slate-400">{opt.desc}</p>
                </div>
                {isActive && (
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-auto pb-10 pt-8">
          <button
            type="button"
            onClick={() => void handleNext()}
            disabled={loadingRec}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loadingRec ? 'Loading recipes…' : 'Next: Pick your recipes'}
            {!loadingRec && <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    );
  }

  // ── Step 2: Recipe selection ──────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-slate-900">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
        <div className="pt-3">
          {/* Progress */}
          <div className="mb-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
            <div className="h-1.5 flex-1 rounded-full bg-primary" />
          </div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">
                Step 2 of 2
              </p>
              <h1 className="text-lg font-bold text-white">Pick your recipes</h1>
              <p className="text-xs text-slate-400">
                {selected.size === 0
                  ? 'Tap any recipe to add it to your collection'
                  : `${selected.size} recipe${selected.size !== 1 ? 's' : ''} selected`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={saving || redirecting}
              className="mt-1 shrink-0 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving || redirecting
                ? 'Saving…'
                : selected.size === 0
                ? 'Skip'
                : `Add ${selected.size} →`}
            </button>
          </div>
        </div>
      </div>

      {/* Recipe grid */}
      <div className="flex-1 p-4 pb-10">
        {loadingRec ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-slate-800" />
            ))}
          </div>
        ) : recipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-5xl">🥡</span>
            <p className="mt-3 font-medium text-white">No recipes match</p>
            <p className="mt-1 text-sm text-slate-500">
              Try a different dietary preference
            </p>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="mt-4 text-sm text-primary hover:underline"
            >
              ← Change preference
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {recipes.map((r) => {
              const isSel = selected.has(r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => toggleRecipe(r.id)}
                  className={`relative flex flex-col rounded-2xl border p-3 text-left transition-all ${
                    isSel
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  {/* Selected checkmark */}
                  {isSel && (
                    <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                      <Check className="h-3 w-3 text-white" />
                    </span>
                  )}

                  {/* Emoji tile */}
                  <span
                    className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                    style={{ backgroundColor: r.bg_color }}
                  >
                    {r.emoji}
                  </span>

                  {/* Title */}
                  <p className="flex-1 text-sm font-semibold leading-tight text-white">
                    {r.title}
                  </p>

                  {/* Description */}
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-400">
                    {r.description}
                  </p>

                  {/* Cook time */}
                  <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3 shrink-0" />
                    <span>{r.prep_time_min + r.cook_time_min} min</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
