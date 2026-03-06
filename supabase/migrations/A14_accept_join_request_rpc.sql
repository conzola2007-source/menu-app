-- A14: update accept_join_request RPC to support flexible expiry timestamp (Phase 8.4)
-- Adds visitor_expires_at parameter — when provided it takes precedence over visitor_days.
-- Existing callers using visitor_days continue to work unchanged.

CREATE OR REPLACE FUNCTION accept_join_request(
  request_id        uuid,
  assign_role       text            DEFAULT 'member',
  visitor_days      integer         DEFAULT NULL,
  visitor_expires_at timestamptz    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_household_id uuid;
  v_user_id      uuid;
  v_expires_at   timestamptz;
BEGIN
  -- Resolve household + user from the join request
  SELECT household_id, user_id
    INTO v_household_id, v_user_id
    FROM join_requests
   WHERE id = request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'join request not found';
  END IF;

  -- Compute expiry: explicit timestamp takes precedence over visitor_days
  IF visitor_expires_at IS NOT NULL THEN
    v_expires_at := visitor_expires_at;
  ELSIF visitor_days IS NOT NULL THEN
    v_expires_at := now() + (visitor_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  -- Upsert membership
  INSERT INTO household_members (household_id, user_id, role, visitor_expires_at)
    VALUES (v_household_id, v_user_id, assign_role, v_expires_at)
    ON CONFLICT (household_id, user_id)
    DO UPDATE SET role = EXCLUDED.role,
                  visitor_expires_at = EXCLUDED.visitor_expires_at;

  -- Mark request accepted
  UPDATE join_requests SET status = 'accepted' WHERE id = request_id;
END;
$$;
