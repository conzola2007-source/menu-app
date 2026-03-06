-- A11: ingredient bulk pricing (Phase 8.3)
ALTER TABLE ingredients
  ADD COLUMN IF NOT EXISTS pack_qty    numeric,
  ADD COLUMN IF NOT EXISTS pack_price  numeric,
  ADD COLUMN IF NOT EXISTS per_unit_cost numeric
    GENERATED ALWAYS AS (
      CASE WHEN pack_qty IS NOT NULL AND pack_qty > 0
           THEN pack_price / pack_qty
           ELSE NULL
      END
    ) STORED;
