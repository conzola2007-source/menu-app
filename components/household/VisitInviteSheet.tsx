'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Link as LinkIcon, Check } from 'lucide-react';
import { DayCountPicker } from '@/components/plan/DayCountPicker';

interface VisitInviteSheetProps {
  inviteCode: string;
  onClose: () => void;
}

export function VisitInviteSheet({ inviteCode, onClose }: VisitInviteSheetProps) {
  const [days, setDays] = useState(7);
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const visitUrl = `${baseUrl}/household/join?code=${inviteCode}&visit=${days}`;

  async function copyLink() {
    await navigator.clipboard.writeText(visitUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-[60] rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-white">Invite as visitor</p>
            <p className="text-xs text-slate-500">They get temporary access — auto-expires</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-slate-500 hover:bg-slate-800 hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-6 px-4 py-6 pb-24">
          {/* Drum roller day picker */}
          <DayCountPicker
            value={days}
            onChange={setDays}
            presets={[1, 3, 7, 14, 30]}
          />

          {/* Copy button */}
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3.5 text-sm font-semibold text-white"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" />
                Copy link for {days} {days === 1 ? 'day' : 'days'}
              </>
            )}
          </button>
        </div>
      </motion.div>
    </>
  );
}
