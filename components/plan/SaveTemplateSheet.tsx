'use client';

import { useState } from 'react';
import { Sheet } from '@/components/ui/Sheet';
import { useSaveTemplate } from '@/hooks/useTemplates';

interface SaveTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  durationDays: number;
  slots: { recipeId: string; dayOffset: number; sortOrder: number }[];
  onSaved?: () => void;
}

export function SaveTemplateSheet({
  isOpen,
  onClose,
  householdId,
  durationDays,
  slots,
  onSaved,
}: SaveTemplateSheetProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const saveTemplate = useSaveTemplate();

  async function handleSave() {
    if (!name.trim()) return;
    await saveTemplate.mutateAsync({
      householdId,
      name: name.trim(),
      description: description.trim(),
      durationDays,
      slots,
    });
    setName('');
    setDescription('');
    onSaved?.();
    onClose();
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Save as template">
      <div className="flex flex-col gap-4 px-4 py-4">
        <p className="text-sm text-slate-400">
          Save the current {durationDays}-day plan with {slots.length} meal{slots.length !== 1 ? 's' : ''} as a reusable template.
        </p>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="template-name" className="text-xs font-medium text-slate-400">
            Template name *
          </label>
          <input
            id="template-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Quick weeknight plan"
            maxLength={50}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="template-desc" className="text-xs font-medium text-slate-400">
            Description (optional)
          </label>
          <input
            id="template-desc"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Easy meals when we're busy"
            maxLength={100}
            className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-600 focus:border-primary focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!name.trim() || saveTemplate.isPending}
          className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saveTemplate.isPending ? 'Saving…' : 'Save template'}
        </button>
      </div>
    </Sheet>
  );
}
