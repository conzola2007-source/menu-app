'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UserCheck, UserX, Check, X } from 'lucide-react';
import { useHousehold } from '@/hooks/useHousehold';
import { useJoinRequests, useAcceptJoinRequest, useDenyJoinRequest } from '@/hooks/useJoinRequests';
import { useSuggestions, useRespondToSuggestion } from '@/hooks/useSuggestions';
import { ApprovalConditionsSheet } from '@/components/household/ApprovalConditionsSheet';
import { isHead } from '@/lib/roles';

export default function NotificationsPage() {
  const router = useRouter();
  const { data: membership, isLoading } = useHousehold();

  const currentUserIsHead = membership ? isHead(membership.role) : false;
  const householdId = membership?.household.id;

  const { data: joinRequests = [] } = useJoinRequests(
    currentUserIsHead ? householdId : undefined,
  );
  const { data: suggestions = [] } = useSuggestions(
    currentUserIsHead ? householdId : undefined,
  );

  const acceptRequest = useAcceptJoinRequest();
  const denyRequest   = useDenyJoinRequest();
  const respondToSuggestion = useRespondToSuggestion();

  const [approvalRequestId,     setApprovalRequestId]     = useState<string | null>(null);
  const [approvalRequesterName, setApprovalRequesterName] = useState('');

  // Redirect non-heads once membership loads
  if (!isLoading && membership && !currentUserIsHead) {
    router.replace('/household');
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 px-4 pt-4 pb-24">
        <div className="animate-pulse space-y-3">
          <div className="h-10 w-1/3 rounded-xl bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
          <div className="h-24 rounded-xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!membership) {
    router.replace('/household');
    return null;
  }

  const isEmpty = joinRequests.length === 0 && suggestions.length === 0;

  return (
    <>
      <div className="min-h-screen bg-slate-900 pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/95 px-4 pb-3 pt-safe backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base font-bold text-white">Notifications</h1>
              <p className="text-xs text-slate-500">{membership.household.name}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5 px-4 pt-5">
          {isEmpty && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="text-5xl">🎉</span>
              <p className="mt-3 font-medium text-white">All clear!</p>
              <p className="mt-1 text-sm text-slate-500">No pending requests or suggestions.</p>
            </div>
          )}

          {/* ── Join Requests ────────────────────────────────────────────── */}
          {joinRequests.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Join Requests · {joinRequests.length}
              </h2>
              <div className="flex flex-col divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
                {joinRequests.map((req) => (
                  <div key={req.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
                      {(req.profile?.display_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white">
                        {req.profile?.display_name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Wants to join
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setApprovalRequestId(req.id);
                        setApprovalRequesterName(req.profile?.display_name ?? 'Unknown');
                      }}
                      disabled={acceptRequest.isPending}
                      className="flex items-center gap-1 rounded-lg bg-green-500/20 px-2.5 py-1.5 text-xs font-medium text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                    >
                      <UserCheck className="h-3.5 w-3.5" />
                      Accept
                    </button>
                    <button
                      type="button"
                      onClick={() => denyRequest.mutate(req.id)}
                      disabled={denyRequest.isPending}
                      className="flex items-center gap-1 rounded-lg bg-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                    >
                      <UserX className="h-3.5 w-3.5" />
                      Deny
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Suggestions ──────────────────────────────────────────────── */}
          {suggestions.length > 0 && (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Meal Suggestions · {suggestions.length}
              </h2>
              <div className="flex flex-col divide-y divide-slate-800 rounded-2xl border border-slate-800 bg-slate-900">
                {suggestions.map((s) => (
                  <div key={s.id} className="flex items-start gap-3 px-4 py-3.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">
                      {(s.profile?.display_name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white">{s.content}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        from {s.profile?.display_name ?? 'Unknown'}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          respondToSuggestion.mutate({
                            suggestionId: s.id,
                            householdId: householdId!,
                            status: 'approved',
                          })
                        }
                        disabled={respondToSuggestion.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50"
                        aria-label="Approve"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          respondToSuggestion.mutate({
                            suggestionId: s.id,
                            householdId: householdId!,
                            status: 'denied',
                          })
                        }
                        disabled={respondToSuggestion.isPending}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                        aria-label="Deny"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Approval conditions sheet */}
      <ApprovalConditionsSheet
        isOpen={!!approvalRequestId}
        onClose={() => setApprovalRequestId(null)}
        requesterName={approvalRequesterName}
        isLoading={acceptRequest.isPending}
        onConfirm={(role, visitorDays) => {
          if (!approvalRequestId) return;
          acceptRequest.mutate(
            { requestId: approvalRequestId, assignRole: role, visitorDays },
            { onSuccess: () => setApprovalRequestId(null) },
          );
        }}
      />
    </>
  );
}
