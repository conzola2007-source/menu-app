'use client';

import { useState } from 'react';
import { Link as LinkIcon, Check } from 'lucide-react';
import { DayCountPicker } from '@/components/plan/DayCountPicker';
import { Sheet } from '@/components/ui/Sheet';

interface VisitInviteSheetProps {
  isOpen: boolean;
  inviteCode: string;
  onClose: () => void;
}

export function VisitInviteSheet({ isOpen, inviteCode, onClose }: VisitInviteSheetProps) {
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
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      headerContent={
        <div>
          <p className="text-sm font-semibold text-white">Invite as visitor</p>
          <p className="text-xs text-slate-500">They get temporary access — auto-expires</p>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-6 px-4 py-6">
        <DayCountPicker
          value={days}
          onChange={setDays}
          presets={[1, 3, 7, 14, 30]}
        />

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
    </Sheet>
  );
}
