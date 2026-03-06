'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';

type AssignRole = 'head_of_household' | 'member' | 'visitor';

const VISITOR_DAY_OPTIONS = [1, 3, 7, 14, 30];

interface ApprovalConditionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requesterName: string;
  onConfirm: (role: AssignRole, visitorDays?: number) => void;
  isLoading?: boolean;
}

export function ApprovalConditionsSheet({
  isOpen,
  onClose,
  requesterName,
  onConfirm,
  isLoading,
}: ApprovalConditionsSheetProps) {
  const [selectedRole, setSelectedRole] = useState<AssignRole>('member');
  const [visitorDays, setVisitorDays] = useState(7);

  function handleConfirm() {
    onConfirm(selectedRole, selectedRole === 'visitor' ? visitorDays : undefined);
  }

  const roles: { value: AssignRole; label: string; description: string }[] = [
    { value: 'head_of_household', label: 'Head', description: 'Full access + manage members' },
    { value: 'member',            label: 'Member', description: 'Standard access' },
    { value: 'visitor',           label: 'Visitor', description: 'Temporary, limited access' },
  ];

  return (
    <Sheet
      isOpen={isOpen}
      onClose={onClose}
      title={`Accept ${requesterName}'s request`}
    >
      <div className="flex flex-col gap-5 pb-6">
        {/* Role picker */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Role
          </p>
          <div className="flex flex-col gap-2">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setSelectedRole(r.value)}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                  selectedRole === r.value
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div
                  className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${
                    selectedRole === r.value
                      ? 'border-primary bg-primary'
                      : 'border-slate-600'
                  }`}
                />
                <div>
                  <p className={`text-sm font-medium ${selectedRole === r.value ? 'text-white' : 'text-slate-300'}`}>
                    {r.label}
                  </p>
                  <p className="text-xs text-slate-500">{r.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Visitor duration picker */}
        {selectedRole === 'visitor' && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Duration
            </p>
            <div className="flex gap-2 flex-wrap">
              {VISITOR_DAY_OPTIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setVisitorDays(d)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                    visitorDays === d
                      ? 'bg-primary text-white'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {d === 1 ? '1 day' : `${d} days`}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Visitor access expires after {visitorDays} {visitorDays === 1 ? 'day' : 'days'}.
            </p>
          </div>
        )}

        {/* Confirm button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isLoading ? 'Accepting…' : 'Confirm'}
        </button>
      </div>
    </Sheet>
  );
}
