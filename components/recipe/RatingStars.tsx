'use client';

import { Star } from 'lucide-react';

interface RatingStarsProps {
  value: number; // 0–5, 0 = unrated
  onChange?: (stars: number) => void;
  size?: 'sm' | 'md';
  readonly?: boolean;
}

export function RatingStars({ value, onChange, size = 'md', readonly = false }: RatingStarsProps) {
  const starSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-5 w-5';

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(star === value ? 0 : star)}
          className={`transition-transform ${readonly ? 'cursor-default' : 'hover:scale-110 active:scale-95'}`}
          aria-label={`${star} star${star !== 1 ? 's' : ''}`}
        >
          <Star
            className={`${starSize} ${
              star <= value
                ? 'fill-amber-400 text-amber-400'
                : 'fill-transparent text-slate-600'
            } transition-colors`}
          />
        </button>
      ))}
    </div>
  );
}
