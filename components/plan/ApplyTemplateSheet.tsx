'use client';

import { useState } from 'react';
import { Check, ChevronRight, Trash2 } from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';
import { useTemplates, useDeleteTemplate } from '@/hooks/useTemplates';
import { isHead } from '@/lib/roles';
import type { Template } from '@/hooks/useTemplates';
import type { MemberRole } from '@/lib/supabase/types';

interface ApplyTemplateSheetProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  role: MemberRole;
  startDate: string;
  hasExistingSlots: boolean;
  onApply: (template: Template, overwrite: boolean) => void;
}

export function ApplyTemplateSheet({
  isOpen,
  onClose,
  householdId,
  role,
  startDate,
  hasExistingSlots,
  onApply,
}: ApplyTemplateSheetProps) {
  const { data: templates = [] } = useTemplates(householdId);
  const deleteTemplate = useDeleteTemplate();
  const [selected, setSelected] = useState<Template | null>(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(false);
  const userIsHead = isHead(role);

  function handleSelect(template: Template) {
    if (hasExistingSlots) {
      setSelected(template);
      setConfirmOverwrite(true);
    } else {
      onApply(template, false);
      onClose();
    }
  }

  function handleConfirmOverwrite(overwrite: boolean) {
    if (selected) {
      onApply(selected, overwrite);
    }
    setSelected(null);
    setConfirmOverwrite(false);
    onClose();
  }

  if (confirmOverwrite && selected) {
    return (
      <Sheet isOpen={isOpen} onClose={() => { setConfirmOverwrite(false); setSelected(null); onClose(); }} title="Apply template">
        <div className="flex flex-col gap-4 px-4 py-4">
          <p className="text-sm text-slate-300">
            You have existing meals in this plan. What would you like to do?
          </p>
          <p className="rounded-xl bg-slate-800 px-3 py-2.5 text-sm font-medium text-white">
            {selected.name}
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleConfirmOverwrite(true)}
              className="w-full rounded-2xl bg-red-600/20 py-3 text-sm font-semibold text-red-400 hover:bg-red-600/30"
            >
              Replace existing meals
            </button>
            <button
              type="button"
              onClick={() => handleConfirmOverwrite(false)}
              className="w-full rounded-2xl bg-primary py-3 text-sm font-semibold text-white"
            >
              Add alongside existing meals
            </button>
            <button
              type="button"
              onClick={() => { setConfirmOverwrite(false); setSelected(null); }}
              className="text-sm text-slate-500 hover:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet isOpen={isOpen} onClose={onClose} title="Apply a template">
      <div className="flex flex-col gap-2 px-4 py-4">
        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="text-4xl">📋</span>
            <p className="text-sm text-slate-400">No templates yet.</p>
            <p className="text-xs text-slate-600">Save a meal plan as a template to reuse it.</p>
          </div>
        ) : (
          templates.map((template) => (
            <div
              key={template.id}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800 p-3"
            >
              <button
                type="button"
                className="flex min-w-0 flex-1 flex-col text-left"
                onClick={() => handleSelect(template)}
              >
                <p className="truncate text-sm font-medium text-white">{template.name}</p>
                <p className="text-xs text-slate-500">
                  {template.duration_days}d · {template.slots.length} meal{template.slots.length !== 1 ? 's' : ''}
                  {template.description ? ` · ${template.description}` : ''}
                </p>
                {/* Mini recipe preview */}
                <div className="mt-2 flex gap-1">
                  {template.slots.slice(0, 6).map((slot) => (
                    <span
                      key={slot.id}
                      className="flex h-6 w-6 items-center justify-center rounded text-sm"
                      style={{ backgroundColor: slot.recipe.bg_color }}
                      title={slot.recipe.title}
                    >
                      {slot.recipe.emoji}
                    </span>
                  ))}
                  {template.slots.length > 6 && (
                    <span className="flex h-6 w-6 items-center justify-center rounded bg-slate-700 text-xs text-slate-400">
                      +{template.slots.length - 6}
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1">
                {userIsHead && (
                  <button
                    type="button"
                    onClick={() => deleteTemplate.mutate({ templateId: template.id, householdId })}
                    disabled={deleteTemplate.isPending}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-slate-600 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
                    aria-label="Delete template"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
                <ChevronRight className="h-4 w-4 shrink-0 text-slate-600" />
              </div>
            </div>
          ))
        )}
      </div>
    </Sheet>
  );
}
