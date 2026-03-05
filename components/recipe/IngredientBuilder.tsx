'use client';

import { useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { useController, type Control, type FieldErrors, type FieldArrayWithId } from 'react-hook-form';
import { INGREDIENT_UNITS } from '@/lib/recipe-constants';
import { IngredientSearch } from './IngredientSearch';
import type { RecipeFormValues } from './RecipeForm';
import type { IngredientUnit } from '@/lib/supabase/types';

type IngredientField = FieldArrayWithId<RecipeFormValues, 'ingredients', 'id'>;

// ─── Single sortable row ──────────────────────────────────────────────────────

interface IngredientRowProps {
  field: IngredientField;
  index: number;
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  householdId: string | null;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function IngredientRow({ field, index, control, errors, householdId, onRemove, canRemove }: IngredientRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: field.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const rowErrors = errors.ingredients?.[index];

  // Controlled name field so we can wire up IngredientSearch
  const { field: nameField } = useController({ control, name: `ingredients.${index}.name` });
  const { field: unitField } = useController({ control, name: `ingredients.${index}.unit` });
  const { field: amountField } = useController({ control, name: `ingredients.${index}.amount` });
  const { field: storageField } = useController({ control, name: `ingredients.${index}.storage_location` });

  function handleIngredientSelect(name: string, unit?: IngredientUnit) {
    nameField.onChange(name);
    if (unit) unitField.onChange(unit);
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      {/* Drag handle */}
      <button
        type="button"
        className="mt-2 cursor-grab touch-none text-slate-500 hover:text-slate-300 active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Fields grid */}
      <div className="grid flex-1 grid-cols-6 gap-2">
        {/* Name — spans 6 cols on mobile, 3 on sm */}
        <div className="col-span-6 sm:col-span-3">
          <IngredientSearch
            householdId={householdId}
            value={nameField.value as string}
            onChange={handleIngredientSelect}
          />
          {rowErrors?.name && (
            <p className="mt-0.5 text-xs text-red-400">{rowErrors.name.message}</p>
          )}
        </div>

        {/* Amount — 2 of 6 */}
        <div className="col-span-2">
          <input
            type="number"
            step="0.1"
            min="0"
            placeholder="Qty"
            value={amountField.value as number}
            onChange={(e) => amountField.onChange(parseFloat(e.target.value))}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {rowErrors?.amount && (
            <p className="mt-0.5 text-xs text-red-400">{rowErrors.amount.message}</p>
          )}
        </div>

        {/* Unit — 2 of 6 */}
        <div className="col-span-2">
          <select
            value={unitField.value as string}
            onChange={(e) => unitField.onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {INGREDIENT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Storage — full row on mobile, 3 of 6 on sm */}
        <div className="col-span-3 sm:col-span-3">
          <select
            value={storageField.value as string}
            onChange={(e) => storageField.onChange(e.target.value)}
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="pantry">Pantry</option>
            <option value="fridge">Fridge</option>
            <option value="freezer">Freezer</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="mt-2 text-slate-500 hover:text-red-400 disabled:opacity-30"
        aria-label="Remove ingredient"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Builder container ────────────────────────────────────────────────────────

interface IngredientBuilderProps {
  fields: IngredientField[];
  control: Control<RecipeFormValues>;
  errors: FieldErrors<RecipeFormValues>;
  householdId: string | null;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (from: number, to: number) => void;
}

export function IngredientBuilder({
  fields,
  control,
  errors,
  householdId,
  onAdd,
  onRemove,
  onMove,
}: IngredientBuilderProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const from = fields.findIndex((f) => f.id === active.id);
        const to = fields.findIndex((f) => f.id === over.id);
        if (from !== -1 && to !== -1) onMove(from, to);
      }
    },
    [fields, onMove]
  );

  return (
    <div className="flex flex-col gap-3">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.map((field, index) => (
            <IngredientRow
              key={field.id}
              field={field}
              index={index}
              control={control}
              errors={errors}
              householdId={householdId}
              onRemove={onRemove}
              canRemove={fields.length > 1}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={onAdd}
        className="flex items-center gap-1.5 self-start text-sm text-primary hover:underline"
      >
        <Plus className="h-4 w-4" />
        Add ingredient
      </button>

      {typeof errors.ingredients?.root?.message === 'string' && (
        <p className="text-xs text-red-400">{errors.ingredients.root.message}</p>
      )}
      {typeof errors.ingredients?.message === 'string' && (
        <p className="text-xs text-red-400">{errors.ingredients.message}</p>
      )}
    </div>
  );
}

// Re-export arrayMove so RecipeForm can use it without importing from @dnd-kit/sortable directly
export { arrayMove };
