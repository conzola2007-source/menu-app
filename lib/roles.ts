import type { MemberRole } from './supabase/types';

/** Returns true for roles with head-of-household privileges. */
export function isHead(role: MemberRole): boolean {
  return role === 'head_of_household' || role === 'owner';
}
