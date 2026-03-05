'use client';

import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface DayCountPickerProps {
  value: number;
  onChange: (days: number) => void;
  min?: number;
  max?: number;
}

const ITEM_HEIGHT = 48;

export function DayCountPicker({
  value,
  onChange,
  min = 1,
  max = 30,
}: DayCountPickerProps) {
  const numbers = Array.from({ length: max - min + 1 }, (_, i) => i + min);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Scroll to the current value on mount and when value changes externally
  useEffect(() => {
    if (!containerRef.current || isDragging.current) return;
    const idx = value - min;
    containerRef.current.scrollTo({
      top: idx * ITEM_HEIGHT,
      behavior: 'smooth',
    });
  }, [value, min]);

  function handleScroll() {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(numbers.length - 1, idx));
    const newVal = numbers[clamped];
    if (newVal !== value) onChange(newVal);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Display */}
      <div className="flex items-baseline gap-2">
        <motion.span
          key={value}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-bold tabular-nums text-white"
        >
          {value}
        </motion.span>
        <span className="text-lg text-slate-400">{value === 1 ? 'day' : 'days'}</span>
      </div>

      {/* Drum roller */}
      <div className="relative w-24 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
        {/* Selection highlight */}
        <div
          className="pointer-events-none absolute inset-x-0 z-10 rounded-xl bg-primary/20"
          style={{ top: ITEM_HEIGHT, height: ITEM_HEIGHT }}
        />
        {/* Top/bottom fade masks */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-12 bg-gradient-to-b from-slate-800 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-12 bg-gradient-to-t from-slate-800 to-transparent" />

        {/* Scrollable list */}
        <div
          ref={containerRef}
          className="overflow-y-scroll"
          style={{
            height: ITEM_HEIGHT * 3,
            scrollSnapType: 'y mandatory',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
          }}
          onScroll={handleScroll}
        >
          {/* Top padding so first item can center */}
          <div style={{ height: ITEM_HEIGHT }} />
          {numbers.map((n) => (
            <div
              key={n}
              className="flex items-center justify-center font-semibold text-slate-300 transition-colors"
              style={{
                height: ITEM_HEIGHT,
                scrollSnapAlign: 'center',
                fontSize: n === value ? 20 : 16,
                color: n === value ? 'white' : undefined,
              }}
            >
              {n}
            </div>
          ))}
          {/* Bottom padding so last item can center */}
          <div style={{ height: ITEM_HEIGHT }} />
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2">
        {[3, 5, 7, 14].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
              value === d
                ? 'bg-primary text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            {d}d
          </button>
        ))}
      </div>
    </div>
  );
}
