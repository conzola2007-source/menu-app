'use client';

import { useState } from 'react';
import { useForm, useFieldArray, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { IngredientBuilder, arrayMove } from './IngredientBuilder';
import {
  CUISINE_TYPES, CUISINE_LABELS,
  CARB_TYPES, CARB_LABELS,
  PROTEIN_TYPES, PROTEIN_LABELS,
  FOOD_EMOJIS, BG_COLORS,
} from '@/lib/recipe-constants';
import type { RecipeDetail } from '@/hooks/useRecipes';
import { useHousehold } from '@/hooks/useHousehold';

// ─── Zod schema ───────────────────────────────────────────────────────────────

const ingredientSchema = z.object({
  name: z.string().min(1, 'Name required').max(100),
  amount: z.coerce.number().positive('Must be > 0'),
  unit: z.enum(['g', 'ml', 'kg', 'l', 'oz', 'lb', 'cup', 'tbsp', 'tsp', 'qty', 'piece', 'pack', 'bag', 'bottle']),
  storage_location: z.enum(['pantry', 'fridge', 'freezer', 'other']),
  pack_qty: z.union([z.coerce.number().positive(), z.literal('')]).optional().transform((v) => (v === '' || v === undefined ? null : Number(v))),
  pack_price: z.union([z.coerce.number().positive(), z.literal('')]).optional().transform((v) => (v === '' || v === undefined ? null : Number(v))),
});

const stepSchema = z.object({
  instruction: z.string().min(1, 'Step required').max(1000),
});

const recipeSchema = z.object({
  title: z.string().min(1, 'Title required').max(100),
  description: z.string().max(500).default(''),
  cuisine: z.enum(CUISINE_TYPES),
  carb_type: z.enum(CARB_TYPES),
  protein_type: z.enum(PROTEIN_TYPES),
  prep_time_min: z.coerce.number().int().min(0).max(480).default(15),
  cook_time_min: z.coerce.number().int().min(0).max(480).default(30),
  servings: z.coerce.number().int().min(1).max(20).default(1),
  emoji: z.string().min(1, 'Pick an emoji'),
  bg_color: z.string().min(1, 'Pick a colour'),
  advance_prep_days: z.coerce.number().int().min(0).max(7).default(0),
  advance_prep_note: z.string().max(200).default(''),
  ingredients: z.array(ingredientSchema).min(1, 'Add at least one ingredient'),
  steps: z.array(stepSchema).min(1, 'Add at least one step'),
});

export type RecipeFormValues = z.infer<typeof recipeSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function defaultIngredient() {
  return { name: '', amount: 0 as unknown as number, unit: 'g' as const, storage_location: 'pantry' as const, pack_qty: null as number | null, pack_price: null as number | null };
}

function defaultStep() {
  return { instruction: '' };
}

function recipeToFormValues(recipe: RecipeDetail): RecipeFormValues {
  return {
    title: recipe.title,
    description: recipe.description ?? '',
    cuisine: recipe.cuisine,
    carb_type: recipe.carb_type,
    protein_type: recipe.protein_type,
    prep_time_min: recipe.prep_time_min,
    cook_time_min: recipe.cook_time_min,
    servings: recipe.servings,
    emoji: recipe.emoji,
    bg_color: recipe.bg_color,
    advance_prep_days: recipe.advance_prep_days,
    advance_prep_note: recipe.advance_prep_note ?? '',
    ingredients: recipe.ingredients.map((ing) => ({
      name: ing.name,
      amount: ing.amount,
      unit: ing.unit,
      storage_location: ing.storage_location,
      pack_qty: (ing as unknown as { pack_qty?: number | null }).pack_qty ?? null,
      pack_price: (ing as unknown as { pack_price?: number | null }).pack_price ?? null,
    })),
    steps: recipe.steps.map((s) => ({ instruction: s.instruction })),
  };
}

// ─── Step row (sortable) ──────────────────────────────────────────────────────

interface StepRowProps {
  fieldId: string;
  index: number;
  register: ReturnType<typeof useForm<RecipeFormValues>>['register'];
  errors: ReturnType<typeof useForm<RecipeFormValues>>['formState']['errors'];
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function StepRow({ fieldId, index, register, errors, onRemove, canRemove }: StepRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: fieldId,
  });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 };
  const err = errors.steps?.[index]?.instruction;

  return (
    <div ref={setNodeRef} style={style} className="flex items-start gap-2">
      <button
        type="button"
        className="mt-2.5 cursor-grab touch-none text-slate-500 hover:text-slate-300"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="flex-1">
        <div className="flex items-start gap-2">
          <span className="mt-2 min-w-[1.5rem] text-center text-sm font-medium text-slate-400">
            {index + 1}.
          </span>
          <div className="flex-1">
            <textarea
              {...register(`steps.${index}.instruction`)}
              rows={2}
              placeholder={`Step ${index + 1}…`}
              className="w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-3 py-1.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {err && <p className="mt-0.5 text-xs text-red-400">{err.message}</p>}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onRemove(index)}
        disabled={!canRemove}
        className="mt-2.5 text-slate-500 hover:text-red-400 disabled:opacity-30"
        aria-label="Remove step"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────

interface RecipeFormProps {
  /** Pre-populate for edit mode. Omit for create mode. */
  initial?: RecipeDetail;
  /** Pre-fill from an imported recipe (create mode only, ignored when `initial` is set). */
  importedDefaults?: Partial<RecipeFormValues>;
  onSubmit: (values: RecipeFormValues) => Promise<void>;
  submitLabel?: string;
}

export function RecipeForm({ initial, importedDefaults, onSubmit, submitLabel = 'Save recipe' }: RecipeFormProps) {
  const { data: membership } = useHousehold();
  const householdId = (membership as unknown as { household?: { id: string } } | null)?.household?.id ?? null;

  const [showAdvancePrepNote, setShowAdvancePrepNote] = useState(
    (initial?.advance_prep_days ?? importedDefaults?.advance_prep_days ?? 0) > 0
  );
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<RecipeFormValues>({
    // Cast needed: Zod v4 + zodResolver infers input type (with .default() fields optional)
    // but useForm<RecipeFormValues> expects the output type (all fields required).
    resolver: zodResolver(recipeSchema) as unknown as Resolver<RecipeFormValues>,
    defaultValues: initial
      ? recipeToFormValues(initial)
      : {
          title: importedDefaults?.title ?? '',
          description: importedDefaults?.description ?? '',
          cuisine: importedDefaults?.cuisine ?? 'other',
          carb_type: importedDefaults?.carb_type ?? 'none',
          protein_type: importedDefaults?.protein_type ?? 'none',
          prep_time_min: importedDefaults?.prep_time_min ?? 15,
          cook_time_min: importedDefaults?.cook_time_min ?? 30,
          servings: importedDefaults?.servings ?? 1,
          emoji: '🍳',
          bg_color: BG_COLORS[0],
          advance_prep_days: 0,
          advance_prep_note: '',
          ingredients: importedDefaults?.ingredients?.length
            ? importedDefaults.ingredients
            : [defaultIngredient()],
          steps: importedDefaults?.steps?.length
            ? importedDefaults.steps
            : [defaultStep()],
        },
  });

  // ── Ingredient array ──
  const {
    fields: ingFields,
    append: appendIng,
    remove: removeIng,
    move: moveIng,
  } = useFieldArray({ control, name: 'ingredients' });

  // ── Step array ──
  const {
    fields: stepFields,
    append: appendStep,
    remove: removeStep,
    move: moveStep,
  } = useFieldArray({ control, name: 'steps' });

  // ── Watched values for live preview ──
  const watchedEmoji = watch('emoji');
  const watchedBgColor = watch('bg_color');
  const watchedAdvancePrepDays = watch('advance_prep_days');

  // ── Step dnd sensors ──
  const stepSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleStepDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = stepFields.findIndex((f) => f.id === active.id);
      const to = stepFields.findIndex((f) => f.id === over.id);
      if (from !== -1 && to !== -1) moveStep(from, to);
    }
  }

  async function handleFormSubmit(values: RecipeFormValues) {
    setServerError('');
    try {
      await onSubmit(values);
    } catch (err) {
      console.error('[RecipeForm] submit error:', err);
      setServerError('Failed to save recipe. Please try again.');
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="flex flex-col gap-6 pb-24">
      {/* ── Preview card + emoji/colour pickers ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
        <Label className="mb-3 block">Appearance</Label>

        {/* Mini preview */}
        <div
          className="mb-4 flex h-20 w-full items-center justify-center rounded-xl text-4xl"
          style={{ backgroundColor: watchedBgColor }}
        >
          {watchedEmoji}
        </div>

        {/* Emoji picker */}
        <p className="mb-2 text-xs font-medium text-slate-400">Choose emoji</p>
        <div className="grid grid-cols-8 gap-1">
          {FOOD_EMOJIS.map((em) => (
            <button
              key={em}
              type="button"
              onClick={() => setValue('emoji', em, { shouldValidate: true })}
              className={`rounded-lg p-1 text-xl transition-colors ${
                watchedEmoji === em ? 'bg-slate-600 ring-1 ring-primary' : 'hover:bg-slate-700'
              }`}
            >
              {em}
            </button>
          ))}
        </div>
        {errors.emoji && (
          <p className="mt-1 text-xs text-red-400">{errors.emoji.message}</p>
        )}

        {/* Colour picker */}
        <p className="mb-2 mt-4 text-xs font-medium text-slate-400">Choose colour</p>
        <div className="grid grid-cols-8 gap-2">
          {BG_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setValue('bg_color', color, { shouldValidate: true })}
              className={`h-7 w-7 rounded-full transition-transform ${
                watchedBgColor === color ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-800' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
              aria-label={`Background colour ${color}`}
            />
          ))}
        </div>
        {errors.bg_color && (
          <p className="mt-1 text-xs text-red-400">{errors.bg_color.message}</p>
        )}
      </section>

      {/* ── Basic info ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
        <Label className="mb-3 block">Basic info</Label>

        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="e.g. Spaghetti Carbonara"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={2}
              placeholder="A short description…"
              className="mt-1 w-full resize-none rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Cuisine / Carb / Protein */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <Label htmlFor="cuisine">Cuisine</Label>
              <select
                id="cuisine"
                {...register('cuisine')}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CUISINE_TYPES.map((c) => (
                  <option key={c} value={c}>{CUISINE_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="carb_type">Carb</Label>
              <select
                id="carb_type"
                {...register('carb_type')}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {CARB_TYPES.map((c) => (
                  <option key={c} value={c}>{CARB_LABELS[c]}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="protein_type">Protein</Label>
              <select
                id="protein_type"
                {...register('protein_type')}
                className="mt-1 w-full rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {PROTEIN_TYPES.map((p) => (
                  <option key={p} value={p}>{PROTEIN_LABELS[p]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="prep_time_min">Prep (min)</Label>
              <Input
                id="prep_time_min"
                type="number"
                min={0}
                max={480}
                error={errors.prep_time_min?.message}
                {...register('prep_time_min')}
              />
            </div>
            <div>
              <Label htmlFor="cook_time_min">Cook (min)</Label>
              <Input
                id="cook_time_min"
                type="number"
                min={0}
                max={480}
                error={errors.cook_time_min?.message}
                {...register('cook_time_min')}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Advance prep ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
        <button
          type="button"
          onClick={() => setShowAdvancePrepNote((v) => !v)}
          className="flex w-full items-center justify-between"
        >
          <Label className="cursor-pointer">Advance prep</Label>
          {showAdvancePrepNote ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </button>

        {showAdvancePrepNote && (
          <div className="mt-4 flex flex-col gap-3">
            <div>
              <Label htmlFor="advance_prep_days">Days of advance prep needed</Label>
              <Input
                id="advance_prep_days"
                type="number"
                min={0}
                max={7}
                error={errors.advance_prep_days?.message}
                {...register('advance_prep_days')}
              />
              <p className="mt-1 text-xs text-slate-500">
                0 = can be cooked same day. 1–7 = needs that many days of advance prep (e.g.
                marinating, soaking). This restricts which days it can appear in the meal plan.
              </p>
            </div>
            {Number(watchedAdvancePrepDays) > 0 && (
              <div>
                <Label htmlFor="advance_prep_note">Prep note (optional)</Label>
                <Input
                  id="advance_prep_note"
                  placeholder="e.g. Marinate overnight"
                  {...register('advance_prep_note')}
                />
              </div>
            )}
          </div>
        )}

        {!showAdvancePrepNote && (
          <p className="mt-1 text-xs text-slate-500">
            Tap to set advance prep requirements (marinating, soaking, etc.)
          </p>
        )}
      </section>

      {/* ── Servings ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
        <Label className="mb-3 block">This recipe serves</Label>
        <div className="flex items-center gap-3">
          <Input
            id="servings"
            type="number"
            min={1}
            max={20}
            error={errors.servings?.message}
            className="w-20"
            {...register('servings')}
          />
          <span className="text-sm text-slate-400">people</span>
        </div>
      </section>

      {/* ── Ingredients ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
        <Label className="mb-3 block">
          Ingredients *
          <span className="ml-2 font-normal text-slate-400">drag to reorder</span>
        </Label>
        <IngredientBuilder
          fields={ingFields}
          control={control}
          errors={errors}
          householdId={householdId}
          onAdd={() => appendIng(defaultIngredient())}
          onRemove={(i) => removeIng(i)}
          onMove={(from, to) => {
            const newFields = arrayMove(ingFields, from, to);
            moveIng(from, to);
            void newFields;
          }}
        />
      </section>

      {/* ── Steps ── */}
      <section className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
        <Label className="mb-3 block">
          Steps *
          <span className="ml-2 font-normal text-slate-400">drag to reorder</span>
        </Label>

        <div className="flex flex-col gap-3">
          <DndContext
            sensors={stepSensors}
            collisionDetection={closestCenter}
            onDragEnd={handleStepDragEnd}
          >
            <SortableContext
              items={stepFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {stepFields.map((field, index) => (
                <StepRow
                  key={field.id}
                  fieldId={field.id}
                  index={index}
                  register={register}
                  errors={errors}
                  onRemove={(i) => removeStep(i)}
                  canRemove={stepFields.length > 1}
                />
              ))}
            </SortableContext>
          </DndContext>

          <button
            type="button"
            onClick={() => appendStep(defaultStep())}
            className="flex items-center gap-1.5 self-start text-sm text-primary hover:underline"
          >
            <Plus className="h-4 w-4" />
            Add step
          </button>

          {errors.steps?.root?.message && (
            <p className="text-xs text-red-400">{errors.steps.root.message}</p>
          )}
          {typeof errors.steps?.message === 'string' && (
            <p className="text-xs text-red-400">{errors.steps.message}</p>
          )}
        </div>
      </section>

      {/* ── Submit ── */}
      {serverError && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{serverError}</p>
      )}

      <Button type="submit" loading={isSubmitting} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
