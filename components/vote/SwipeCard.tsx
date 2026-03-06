'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  type PanInfo,
} from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  Star,
  AlertTriangle,
  Clock,
  ChefHat,
  Users,
} from 'lucide-react';
import { CUISINE_LABELS, STORAGE_LABELS } from '@/lib/recipe-constants';
import { formatQuantity } from '@/lib/utils';
import type { VoteRecipe } from '@/hooks/useVotes';
import type { VoteType, CuisineType, StorageLocation } from '@/lib/supabase/types';
import { Sheet } from '@/components/ui/Sheet';

// ─── Public handle (for parent-controlled swipes) ────────────────────────────

export interface SwipeCardHandle {
  triggerVote: (vote: VoteType) => void;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SwipeCardProps {
  recipe: VoteRecipe;
  /** 0 = top (active), 1 = second, 2 = third */
  position: number;
  onVote: (recipeId: string, vote: VoteType) => void;
  isActive: boolean;
  /** Current vote for this recipe (shown as badge in revote mode) */
  currentVote?: VoteType;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 80;
const DRAG_DETECT = 5; // px moved before we consider it a drag (not a tap)

const STACK_SCALE   = [1, 0.95, 0.9]    as const;
const STACK_Y       = [0, 12, 24]        as const;
const STACK_OPACITY = [1, 0.88, 0.76]    as const;

// ─── Expanded recipe detail sheet ────────────────────────────────────────────

function ExpandedSheet({
  recipe,
  isOpen,
  onClose,
}: {
  recipe: VoteRecipe;
  isOpen: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xl"
            style={{ backgroundColor: recipe.bg_color }}
          >
            {recipe.emoji}
          </div>
          <div>
            <p className="text-sm font-bold text-white">{recipe.title}</p>
            <p className="text-xs text-slate-500">
              {CUISINE_LABELS[recipe.cuisine as CuisineType] ?? recipe.cuisine}
            </p>
          </div>
        </div>
      }
    >
      <div className="px-5 py-4 pb-10">
        {recipe.description && (
          <p className="mb-4 text-sm leading-relaxed text-slate-400">
            {recipe.description}
          </p>
        )}

        {/* Stats */}
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-slate-300">
          {recipe.prep_time_min > 0 && (
            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-slate-400" />
              Prep: {recipe.prep_time_min}m
            </span>
          )}
          {recipe.cook_time_min > 0 && (
            <span className="flex items-center gap-1.5">
              <ChefHat className="h-4 w-4 text-slate-400" />
              Cook: {recipe.cook_time_min}m
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400" />
            {recipe.servings} servings
          </span>
        </div>

        {recipe.advance_prep_days > 0 && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-amber-500/10 px-3 py-2.5 text-sm text-amber-300">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Needs {recipe.advance_prep_days} day
              {recipe.advance_prep_days > 1 ? 's' : ''} advance prep
              {recipe.advance_prep_note ? `: ${recipe.advance_prep_note}` : ''}
            </span>
          </div>
        )}

        {/* Ingredients */}
        {recipe.ingredients.length > 0 && (
          <section className="mb-5">
            <h4 className="mb-2 text-sm font-semibold text-white">Ingredients</h4>
            <ul className="flex flex-col divide-y divide-slate-800">
              {[...recipe.ingredients]
                .sort((a, b) => a.sort_order - b.sort_order)
                .map((ing) => (
                  <li key={ing.id} className="flex items-center justify-between py-2 text-sm">
                    <span className="text-white">{ing.name}</span>
                    <div className="flex items-center gap-2 text-slate-400">
                      <span>{formatQuantity(ing.amount)} {ing.unit}</span>
                      <span
                        className="rounded bg-slate-800 px-1.5 py-0.5 text-xs"
                        title={STORAGE_LABELS[ing.storage_location as StorageLocation] ?? ing.storage_location}
                      >
                        {ing.storage_location === 'fridge'
                          ? '❄️'
                          : ing.storage_location === 'freezer'
                            ? '🧊'
                            : ing.storage_location === 'pantry'
                              ? '🥫'
                              : '📦'}
                      </span>
                    </div>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {/* Steps */}
        {recipe.steps.length > 0 && (
          <section>
            <h4 className="mb-2 text-sm font-semibold text-white">Steps</h4>
            <ol className="flex flex-col gap-3">
              {[...recipe.steps]
                .sort((a, b) => a.step_order - b.step_order)
                .map((step, i) => (
                  <li key={step.id} className="flex gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed text-slate-300">
                      {step.instruction}
                    </p>
                  </li>
                ))}
            </ol>
          </section>
        )}
      </div>
    </Sheet>
  );
}

// ─── SwipeCard ────────────────────────────────────────────────────────────────

export const SwipeCard = forwardRef<SwipeCardHandle, SwipeCardProps>(
  function SwipeCard({ recipe, position, onVote, isActive, currentVote }, ref) {
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotate   = useTransform(x, [-200, 200], [-15, 15]);
    const controls = useAnimationControls();
    const didDragRef = useRef(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const yesOpacity = useTransform(x, [SWIPE_THRESHOLD * 0.3, SWIPE_THRESHOLD], [0, 1]);
    const noOpacity  = useTransform(x, [-SWIPE_THRESHOLD * 0.3, -SWIPE_THRESHOLD], [0, 1]);
    const superOpacity = useTransform(y, [-SWIPE_THRESHOLD * 0.3, -SWIPE_THRESHOLD], [0, 1]);

    const totalTime = recipe.prep_time_min + recipe.cook_time_min;

    useEffect(() => {
      if (isActive) {
        void controls.start({
          scale: 1, y: 0, opacity: 1,
          transition: { type: 'spring', stiffness: 320, damping: 30 },
        });
      }
    }, [isActive, controls]);

    const triggerVoteRef = useRef<(vote: VoteType) => void>(() => undefined);

    function triggerVote(vote: VoteType) {
      const exitX   = vote === 'yes' ? 650 : vote === 'no' ? -650 : 0;
      const exitY   = vote === 'super' ? -650 : 0;
      const exitRot = vote === 'yes' ? 18 : vote === 'no' ? -18 : 0;
      void controls
        .start({ x: exitX, y: exitY, rotate: exitRot, opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } })
        .then(() => onVote(recipe.id, vote));
    }

    triggerVoteRef.current = triggerVote;

    useImperativeHandle(ref, () => ({
      triggerVote: (vote: VoteType) => triggerVoteRef.current(vote),
    }));

    function handleDragStart() { didDragRef.current = false; }

    function handleDrag(_: unknown, info: PanInfo) {
      if (Math.abs(info.offset.x) > DRAG_DETECT || Math.abs(info.offset.y) > DRAG_DETECT) {
        didDragRef.current = true;
      }
    }

    function handleDragEnd(_: unknown, info: PanInfo) {
      const { offset } = info;
      if (offset.y < -SWIPE_THRESHOLD && Math.abs(offset.y) >= Math.abs(offset.x) * 0.75) {
        triggerVote('super'); return;
      }
      if (offset.x > SWIPE_THRESHOLD)  { triggerVote('yes'); return; }
      if (offset.x < -SWIPE_THRESHOLD) { triggerVote('no');  return; }
      void controls.start({ x: 0, y: 0, rotate: 0, transition: { type: 'spring', stiffness: 400, damping: 30 } });
    }

    function handleTap() {
      if (didDragRef.current || !isActive) return;
      setIsExpanded(true);
    }

    useEffect(() => {
      if (!isActive) return;
      function onKey(e: KeyboardEvent) {
        if (e.key === 'ArrowRight') triggerVoteRef.current('yes');
        else if (e.key === 'ArrowLeft') triggerVoteRef.current('no');
        else if (e.key === 'ArrowUp')   triggerVoteRef.current('super');
      }
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, [isActive]);

    return (
      <>
        <motion.div
          className={`absolute inset-x-0 top-0 select-none ${isActive ? 'cursor-grab active:cursor-grabbing' : ''}`}
          style={{
            x: isActive ? x : 0,
            y: isActive ? y : 0,
            rotate: isActive ? rotate : 0,
            zIndex: 10 - position,
            height: '100%',
            touchAction: 'none',
          }}
          animate={
            isActive
              ? controls
              : { scale: STACK_SCALE[position] ?? 0.85, y: STACK_Y[position] ?? 36, opacity: STACK_OPACITY[position] ?? 0.6 }
          }
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          drag={isActive}
          dragElastic={0.65}
          dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          onClick={handleTap}
        >
          {/* ── Card body ────────────────────────────────────────────────── */}
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 shadow-2xl">
            {/* Hero */}
            <div
              className="relative flex items-center justify-center text-7xl"
              style={{ backgroundColor: recipe.bg_color, flex: '0 0 44%' }}
            >
              {recipe.emoji}
              {currentVote && (
                <span className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-base">
                  {currentVote === 'super' ? '⭐' : currentVote === 'yes' ? '👍' : '👎'}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-xl font-bold leading-tight text-white">{recipe.title}</h2>
                  <span className="mt-0.5 shrink-0 rounded-full bg-slate-700 px-2 py-0.5 text-xs text-slate-300">
                    {CUISINE_LABELS[recipe.cuisine as CuisineType] ?? recipe.cuisine}
                  </span>
                </div>
                {recipe.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{recipe.description}</p>
                )}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                {totalTime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {totalTime}m
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {recipe.servings} servings
                </span>
                {recipe.advance_prep_days > 0 && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {recipe.advance_prep_days}d prep
                  </span>
                )}
                {isActive && <span className="ml-auto text-slate-600">Tap for details</span>}
              </div>
            </div>
          </div>

          {/* ── Vote overlays (active card only) ─────────────────────────── */}
          {isActive && (
            <>
              <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-green-500/20" style={{ opacity: yesOpacity }}>
                <div className="rounded-full border-4 border-green-400 p-4"><ThumbsUp className="h-12 w-12 text-green-400" /></div>
              </motion.div>
              <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-red-500/20" style={{ opacity: noOpacity }}>
                <div className="rounded-full border-4 border-red-400 p-4"><ThumbsDown className="h-12 w-12 text-red-400" /></div>
              </motion.div>
              <motion.div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-amber-500/20" style={{ opacity: superOpacity }}>
                <div className="rounded-full border-4 border-amber-400 p-4"><Star className="h-12 w-12 text-amber-400 fill-amber-400" /></div>
              </motion.div>
            </>
          )}
        </motion.div>

        {/* ── Expanded recipe detail sheet ─────────────────────────────────── */}
        <ExpandedSheet
          recipe={recipe}
          isOpen={isExpanded}
          onClose={() => setIsExpanded(false)}
        />
      </>
    );
  },
);
