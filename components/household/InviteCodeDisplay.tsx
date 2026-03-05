'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

interface InviteCodeDisplayProps {
  code: string;
  /** Base URL for the join link. Defaults to window.location.origin + /household/join */
  baseUrl?: string;
}

export function InviteCodeDisplay({ code, baseUrl }: InviteCodeDisplayProps) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null);

  const joinUrl = `${baseUrl ?? (typeof window !== 'undefined' ? window.location.origin : '')}/household/join?code=${code}`;

  async function copyCode() {
    await navigator.clipboard.writeText(code);
    setCopied('code');
    setTimeout(() => setCopied(null), 2000);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(joinUrl);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Code display */}
      <div className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3">
        <span className="flex-1 font-mono text-2xl font-bold tracking-[0.3em] text-white">
          {code}
        </span>
        <button
          type="button"
          onClick={copyCode}
          className="flex items-center gap-1.5 rounded-lg bg-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-600"
          aria-label="Copy invite code"
        >
          {copied === 'code' ? (
            <>
              <Check className="h-4 w-4 text-primary" />
              <span className="text-primary">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" />
              Copy
            </>
          )}
        </button>
      </div>

      {/* Copy link */}
      <button
        type="button"
        onClick={copyLink}
        className="flex items-center gap-2 self-start text-sm text-slate-400 hover:text-slate-200"
      >
        {copied === 'link' ? (
          <>
            <Check className="h-4 w-4 text-primary" />
            <span className="text-primary">Link copied!</span>
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4" />
            Copy invite link
          </>
        )}
      </button>
    </div>
  );
}
