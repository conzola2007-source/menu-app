import type { MemberRole } from './supabase/types';

/** Returns true for roles with full head-of-household privileges (manage membership, approve joins, etc.). */
export function isHead(role: MemberRole): boolean {
  return role === 'head_of_household' || role === 'owner';
}

/** Returns true if the role is visitor_head (can edit content but cannot manage membership). */
export function isVisitorHead(role: MemberRole): boolean {
  return role === 'visitor_head';
}

/** Returns true for roles that can edit household content (ingredients, costs, packs). */
export function canEditContent(role: MemberRole): boolean {
  return isHead(role) || role === 'visitor_head';
}
