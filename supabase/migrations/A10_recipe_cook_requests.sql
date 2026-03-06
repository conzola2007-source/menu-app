-- A10: recipe_cook_requests table (Phase 8.2)
CREATE TABLE IF NOT EXISTS recipe_cook_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id    uuid NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending','approved','denied')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (recipe_id, requester_id)
);

ALTER TABLE recipe_cook_requests ENABLE ROW LEVEL SECURITY;

-- Requester can insert and read their own requests
CREATE POLICY "requester_access" ON recipe_cook_requests
  FOR ALL USING (requester_id = auth.uid());

-- Owner can read and update (approve/deny) requests on their recipes
CREATE POLICY "owner_access" ON recipe_cook_requests
  FOR ALL USING (owner_id = auth.uid());
