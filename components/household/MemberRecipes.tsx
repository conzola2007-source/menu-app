'use client';

import { useState } from 'react';
import { ChefHat, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Avatar } from './MemberList';
import { Sheet } from '@/components/ui/Sheet';
import { useSendRecipeCookRequest } from '@/hooks/useRecipeCookRequests';

interface MemberRecipesProps {
  isOpen: boolean;
  member: {
    user_id: string;
    name: string;
    avatarUrl: string | null;
  } | null;
  currentUserId: string;
  householdId: string;
  onClose: () => void;
}

interface MiniRecipe {
  id: string;
  title: string;
  emoji: string;
  bg_color: string;
  cuisine: string;
  created_by: string | null;
}

export function MemberRecipes({ isOpen, member, currentUserId, householdId, onClose }: MemberRecipesProps) {
  const sendCookRequest = useSendRecipeCookRequest();
  const [requested, setRequested] = useState<Set<string>>(new Set());

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['member-recipes', member?.user_id ?? ''],
    queryFn: async () => {
      const supabase = getSupabaseClient();
      // Get their saved global recipe IDs from onboarding
      const { data: savedRows } = await supabase
        .from('user_saved_global_recipes')
        .select('recipe_id')
        .eq('user_id', member!.user_id);
      const savedIds = (savedRows ?? []).map((r: { recipe_id: string }) => r.recipe_id);

      const filter = savedIds.length > 0
        ? `created_by.eq.${member!.user_id},id.in.(${savedIds.join(',')})`
        : `created_by.eq.${member!.user_id}`;

      const { data, error } = await supabase
        .from('recipes')
        .select('id, title, emoji, bg_color, cuisine, created_by')
        .or(filter)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MiniRecipe[];
    },
    enabled: !!member?.user_id,
  });

  function requestCopy(recipe: MiniRecipe) {
    if (!recipe.created_by) return;
    sendCookRequest.mutate(
      { recipeId: recipe.id, requesterId: currentUserId, ownerId: recipe.created_by },
      { onSuccess: () => setRequested((prev) => new Set([...prev, recipe.id])) },
    );
  }

  const isOwnProfile = member?.user_id === currentUserId;

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        member ? (
          <div className="flex items-center gap-3">
            <Avatar name={member.name} size="sm" avatarUrl={member.avatarUrl} />
            <span className="text-sm font-semibold text-white">
              {isOwnProfile ? 'Your recipes' : `${member.name}'s recipes`}
            </span>
          </div>
        ) : undefined
      }
    >
      <div className="px-4 py-3 pb-8">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-800" />
            ))}
          </div>
        ) : !recipes?.length ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <ChefHat className="h-8 w-8 text-slate-600" />
            <p className="text-sm text-slate-500">No recipes yet</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recipes.map((r) => {
              const alreadyRequested = requested.has(r.id);
              const isSending = sendCookRequest.isPending && !alreadyRequested;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg"
                    style={{ backgroundColor: r.bg_color }}
                  >
                    {r.emoji}
                  </div>
                  <span className="flex-1 truncate text-sm font-medium text-white">
                    {r.title}
                  </span>
                  <span className="shrink-0 text-xs capitalize text-slate-500">{r.cuisine}</span>
                  {!isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => requestCopy(r)}
                      disabled={isSending || alreadyRequested}
                      className="ml-1 flex shrink-0 items-center gap-1 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700 disabled:opacity-50"
                      title="Request to add to your recipes"
                    >
                      {alreadyRequested ? (
                        <Clock className="h-3 w-3 text-amber-400" />
                      ) : null}
                      {alreadyRequested ? 'Requested' : isSending ? '…' : 'Add'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Sheet>
  );
}
