'use client';

import { useState, useRef } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  useAnimationControls,
  type PanInfo,
} from 'framer-motion';
import { Check, X, Minus } from 'lucide-react';
import { formatQuantity } from '@/lib/utils';
import type { PantryCheckItem } from '@/stores/groceryStore';

// ─── Constants ────────────────────────────────────────────────────────────────

const SWIPE_THRESHOLD = 80;

// ─── Props ────────────────────────────────────────────────────────────────────

interface PantryCheckCardProps {
  item: PantryCheckItem;
  onHave: () => void;
  onNeed: () => void;
  onPartial: (amountHave: number) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PantryCheckCard({ item, onHave, onNeed, onPartial }: PantryCheckCardProps) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const controls = useAnimationControls();

  const [showPartial, setShowPartial] = useState(false);
  const [partialInput, setPartialInput] = useState('');
  const [partialError, setPartialError] = useState('');
  const didDragRef = useRef(false);

  const haveOpacity = useTransform(x, [SWIPE_THRESHOLD * 0.3, SWIPE_THRESHOLD], [0, 1]);
  const needOpacity = useTransform(x, [-SWIPE_THRESHOLD * 0.3, -SWIPE_THRESHOLD], [0, 1]);

  async function triggerHave() {
    await controls.start({ x: 600, opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } });
    onHave();
  }

  async function triggerNeed() {
    await controls.start({ x: -600, opacity: 0, transition: { duration: 0.22, ease: 'easeOut' } });
    onNeed();
  }

  function handleDragStart() {
    didDragRef.current = false;
  }

  function handleDrag(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > 5) didDragRef.current = true;
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      void triggerHave();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      void triggerNeed();
    } else {
      void controls.start({
        x: 0,
        rotate: 0,
        transition: { type: 'spring', stiffness: 400, damping: 30 },
      });
    }
  }

  function handlePartialSubmit() {
    const val = parseFloat(partialInput);
    if (isNaN(val) || val <= 0) {
      setPartialError('Enter a positive number.');
      return;
    }
    if (item.amount !== null && val >= item.amount) {
      setPartialError(`Must be less than ${formatQuantity(item.amount)}.`);
      return;
    }
    onPartial(val);
  }

  return (
    <div className="relative w-full">
      {/* ── Swipeable card ──────────────────────────────────────────────────── */}
      <motion.div
        className="relative cursor-grab select-none overflow-hidden rounded-3xl border border-slate-700 bg-slate-800 shadow-2xl active:cursor-grabbing"
        style={{ x, rotate }}
        animate={controls}
        drag="x"
        dragElastic={0.65}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {/* Content */}
        <div className="p-6">
          {/* Storage badge */}
          <div className="mb-4 flex justify-center">
            <span className="rounded-full bg-slate-700 px-3 py-1 text-xs font-medium capitalize text-slate-400">
              {item.storageLocation === 'freezer'
                ? '🧊 Freezer'
                : item.storageLocation === 'fridge'
                  ? '❄️ Fridge'
                  : item.storageLocation === 'pantry'
                    ? '🥫 Pantry'
                    : '📦 Other'}
            </span>
          </div>

          {/* Name */}
          <h2 className="mb-2 text-center text-2xl font-bold text-white">{item.name}</h2>

          {/* Amount */}
          {item.amount !== null && (
            <p className="mb-1 text-center text-lg text-slate-300">
              {formatQuantity(item.amount)}
              {item.unit ? ` ${item.unit}` : ''}
            </p>
          )}

          {/* Used in */}
          {item.recipeNames.length > 0 && (
            <p className="mt-3 text-center text-xs text-slate-600">
              Used in: {item.recipeNames.join(', ')}
            </p>
          )}
        </div>

        {/* HAVE overlay (right swipe) */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-green-500/20"
          style={{ opacity: haveOpacity }}
        >
          <div className="rounded-full border-4 border-green-400 p-5">
            <Check className="h-12 w-12 text-green-400" strokeWidth={3} />
          </div>
        </motion.div>

        {/* NEED overlay (left swipe) */}
        <motion.div
          className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-3xl bg-red-500/20"
          style={{ opacity: needOpacity }}
        >
          <div className="rounded-full border-4 border-red-400 p-5">
            <X className="h-12 w-12 text-red-400" />
          </div>
        </motion.div>
      </motion.div>

      {/* ── Action buttons ─────────────────────────────────────────────────── */}
      <div className="mt-6 flex items-center justify-center gap-4">
        {/* Need it */}
        <button
          type="button"
          onClick={() => void triggerNeed()}
          aria-label="Need it"
          className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-red-500/50 bg-slate-800 text-red-400 shadow-lg hover:border-red-500 hover:bg-red-500/10 active:scale-95 transition-all"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Partial / Have some */}
        <button
          type="button"
          onClick={() => setShowPartial((p) => !p)}
          aria-label="Have some"
          className="flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 border-amber-500/50 bg-slate-800 text-amber-400 shadow-lg hover:border-amber-500 hover:bg-amber-500/10 active:scale-95 transition-all"
        >
          <Minus className="h-5 w-5" />
        </button>

        {/* Have it */}
        <button
          type="button"
          onClick={() => void triggerHave()}
          aria-label="Have it"
          className="flex h-14 w-14 flex-col items-center justify-center rounded-full border-2 border-green-500/50 bg-slate-800 text-green-400 shadow-lg hover:border-green-500 hover:bg-green-500/10 active:scale-95 transition-all"
        >
          <Check className="h-6 w-6" strokeWidth={3} />
        </button>
      </div>

      {/* ── Partial input ──────────────────────────────────────────────────── */}
      {showPartial && (
        <motion.div
          className="mt-4 rounded-2xl border border-amber-500/20 bg-slate-900 p-4"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <p className="mb-2 text-sm text-slate-400">
            How much do you have?
            {item.unit ? ` (${item.unit})` : ''}
          </p>
          <div className="flex gap-2">
            <input
              type="number"
              min="0.01"
              step="0.1"
              value={partialInput}
              onChange={(e) => { setPartialInput(e.target.value); setPartialError(''); }}
              placeholder="e.g. 200"
              autoFocus
              className="flex-1 rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-amber-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handlePartialSubmit}
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Confirm
            </button>
          </div>
          {partialError && <p className="mt-1 text-xs text-red-400">{partialError}</p>}
        </motion.div>
      )}

      {/* Label */}
      <p className="mt-3 text-center text-xs text-slate-700">
        ← Need it · Have some · Have it →
      </p>
    </div>
  );
}
