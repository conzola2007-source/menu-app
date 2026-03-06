-- A12: visitor_head role (Phase 8.5)
ALTER TABLE household_members
  DROP CONSTRAINT IF EXISTS household_members_role_check;

ALTER TABLE household_members
  ADD CONSTRAINT household_members_role_check
  CHECK (role IN ('owner','head_of_household','visitor_head','member','visitor'));
