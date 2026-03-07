-- A12: visitor_head role (Phase 8.5)
-- Role column uses a PostgreSQL enum type (member_role), so add the value to the enum.
ALTER TYPE member_role ADD VALUE IF NOT EXISTS 'visitor_head' AFTER 'head_of_household';
