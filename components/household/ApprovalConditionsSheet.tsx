'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import type { VisitorExpiry } from '@/hooks/useJoinRequests';

type AssignRole = 'head_of_household' | 'visitor_head' | 'member' | 'visitor';
type DurationUnit = 'minutes' | 'hours' | 'days' | 'months' | 'years';

const VISITOR_DAY_OPTIONS = [1, 3, 7, 14, 30];

interface ApprovalConditionsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  requesterName: string;
  onConfirm: (role: AssignRole, visitorExpiry?: VisitorExpiry) => void;
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
  const [visitorType, setVisitorType] = useState<'visitor' | 'visitor_head'>('visitor');

  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [visitorDays, setVisitorDays] = useState(7);

  const [advancedMode, setAdvancedMode] = useState<'duration' | 'until'>('duration');
  const [durationValue, setDurationValue] = useState('7');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days');
  const [untilDate, setUntilDate] = useState('');
  const [untilTime, setUntilTime] = useState('23:59');

  const isVisitorRole = selectedRole === 'visitor' || selectedRole === 'visitor_head';

  function handleConfirm() {
    const role: AssignRole = isVisitorRole ? visitorType : selectedRole;
    if (!isVisitorRole) {
      onConfirm(role);
      return;
    }
    let expiry: VisitorExpiry;
    if (!advancedOpen) {
      expiry = { type: 'duration', value: visitorDays, unit: 'days' };
    } else if (advancedMode === 'duration') {
      expiry = { type: 'duration', value: Math.max(1, parseInt(durationValue, 10) || 1), unit: durationUnit };
    } else {
      expiry = { type: 'until', iso: new Date(`${untilDate}T${untilTime || '23:59'}`).toISOString() };
    }
    onConfirm(role, expiry);
  }

  const roles: { value: AssignRole; label: string; description: string }[] = [
    { value: 'head_of_household', label: 'Head',    description: 'Full access + manage members' },
    { value: 'member',            label: 'Member',  description: 'Standard access' },
    { value: 'visitor',           label: 'Visitor', description: 'Temporary, limited access' },
  ];

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title={`Accept ${requesterName}'s request`}>
      <div className="flex flex-col gap-5 pb-6">

        {/* Role picker */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Role</p>
          <div className="flex flex-col gap-2">
            {roles.map((r) => {
              const active = r.value === 'visitor' ? isVisitorRole : selectedRole === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setSelectedRole(r.value)}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                    active ? 'border-primary bg-primary/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 ${active ? 'border-primary bg-primary' : 'border-slate-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${active ? 'text-white' : 'text-slate-300'}`}>{r.label}</p>
                    <p className="text-xs text-slate-500">{r.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Visitor sub-type */}
        {isVisitorRole && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Visitor type</p>
            <div className="flex flex-col gap-2">
              {(
                [
                  { value: 'visitor',      label: 'Regular Visitor', description: 'Standard member permissions, expires on timer' },
                  { value: 'visitor_head', label: 'Visitor Head',    description: 'Can edit content (ingredients, costs, packs), expires on timer' },
                ] as { value: 'visitor' | 'visitor_head'; label: string; description: string }[]
              ).map((vt) => (
                <button
                  key={vt.value}
                  type="button"
                  onClick={() => setVisitorType(vt.value)}
                  className={`flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    visitorType === vt.value ? 'border-primary bg-primary/10' : 'border-slate-700 bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className={`mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 ${visitorType === vt.value ? 'border-primary bg-primary' : 'border-slate-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${visitorType === vt.value ? 'text-white' : 'text-slate-300'}`}>{vt.label}</p>
                    <p className="text-xs text-slate-500">{vt.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Visitor duration */}
        {isVisitorRole && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Duration</p>
            {!advancedOpen ? (
              <>
                <div className="flex gap-2 flex-wrap">
                  {VISITOR_DAY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setVisitorDays(d)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                        visitorDays === d ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {d === 1 ? '1 day' : `${d} days`}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={() => setAdvancedOpen(true)} className="mt-2 text-xs text-primary hover:underline">
                  Advanced…
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  {(['duration', 'until'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setAdvancedMode(m)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                        advancedMode === m ? 'bg-primary text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {m === 'duration' ? 'Duration' : 'Until date'}
                    </button>
                  ))}
                </div>

                {advancedMode === 'duration' ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={durationValue}
                      onChange={(e) => setDurationValue(e.target.value)}
                      className="w-20 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                    <select
                      value={durationUnit}
                      onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:outline-none"
                    >
                      <option value="minutes">Minutes</option>
                      <option value="hours">Hours</option>
                      <option value="days">Days</option>
                      <option value="months">Months</option>
                      <option value="years">Years</option>
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <input
                      type="date"
                      value={untilDate}
                      onChange={(e) => setUntilDate(e.target.value)}
                      className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                    <input
                      type="time"
                      value={untilTime}
                      onChange={(e) => setUntilTime(e.target.value)}
                      className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white focus:border-primary focus:outline-none"
                    />
                  </div>
                )}

                <button type="button" onClick={() => setAdvancedOpen(false)} className="self-start text-xs text-slate-500 hover:text-slate-300">
                  ← Back to simple
                </button>
              </div>
            )}
          </div>
        )}

        {/* Confirm */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isLoading || (isVisitorRole && advancedOpen && advancedMode === 'until' && !untilDate)}
          className="w-full rounded-2xl bg-primary py-3.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {isLoading ? 'Accepting…' : 'Confirm'}
        </button>
      </div>
    </Sheet>
  );
}
