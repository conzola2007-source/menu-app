'use client';

import { useState } from 'react';
import { X, Link as LinkIcon, Check } from 'lucide-react';

interface VisitInviteSheetProps {
  inviteCode: string;
  onClose: () => void;
}

const MIN_DAYS = 1;
const MAX_DAYS = 30;

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
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-slate-700 bg-slate-900 shadow-2xl">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-slate-600" />
        </div>

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

        <div className="flex flex-col gap-5 px-4 py-5 pb-8">
          {/* Day count picker — styled slider */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">Duration</p>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-white">{days}</span>
                <span className="text-sm text-slate-400">{days === 1 ? 'day' : 'days'}</span>
              </div>
            </div>

            {/* Range slider styled as iOS-like drum picker */}
            <div className="relative">
              <input
                type="range"
                min={MIN_DAYS}
                max={MAX_DAYS}
                step={1}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
                style={{ height: '32px' }}
              />
              <div className="mt-1 flex justify-between text-[10px] text-slate-600">
                <span>1</span>
                <span>7</span>
                <span>14</span>
                <span>21</span>
                <span>30</span>
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex gap-2">
              {[1, 3, 7, 14, 30].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                    days === d
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Link preview */}
          <div className="rounded-xl border border-slate-700 bg-slate-800 p-3">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-slate-500">
              Invite link (expires in {days} {days === 1 ? 'day' : 'days'})
            </p>
            <p className="break-all text-xs text-slate-300">{visitUrl}</p>
          </div>

          {/* Copy button */}
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <LinkIcon className="h-4 w-4" />
                Copy invite link
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
