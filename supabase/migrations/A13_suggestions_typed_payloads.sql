-- A13: suggestions typed payloads (Phase 8.6)
ALTER TABLE suggestions
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'note'
    CHECK (type IN ('note','update_ingredient_price','add_recipe','remove_recipe')),
  ADD COLUMN IF NOT EXISTS payload jsonb;
