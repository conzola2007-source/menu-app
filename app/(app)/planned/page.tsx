import { redirect } from 'next/navigation';

/**
 * /planned is no longer the planning hub — the flow is now:
 *   /vote → /plan → /grocery
 *
 * Redirect anyone who lands here (bookmarks, old links) straight to /vote.
 * The vote page itself checks sessionStorage for an in-progress revote session
 * and will bounce to /vote?mode=revote automatically if one exists.
 */
export default function PlannedPage() {
  redirect('/vote');
}
