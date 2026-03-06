// POST /api/push/send
// Accepts two authentication modes:
//   1. x-push-secret header matching PUSH_API_SECRET (Edge Functions / cron)
//   2. Authenticated user who is a head of the target householdId (client-triggered)
//
// Body: { userId?, householdId?, type, title, body, url? }

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendPush } from '@/lib/webpush';
import type { PushSubscriptionData } from '@/lib/webpush';

// ─── Service-role Supabase client (bypasses RLS) ──────────────────────────────
// Untyped intentionally — service role client is server-side only.

function getServiceClient() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: {
    userId?: string;
    householdId?: string;
    type: string;
    title: string;
    body: string;
    url?: string;
  };
  try {
    body = await req.json() as typeof body;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }

  const secret = req.headers.get('x-push-secret');
  const supabase = getServiceClient();

  if (secret === process.env.PUSH_API_SECRET) {
    // Edge Function / cron — secret authenticated, full trust
  } else {
    // Client path — verify authenticated head of the target household
    const authClient = await createServerSupabaseClient();
    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (body.householdId) {
      const { data: member } = await supabase
        .from('household_members')
        .select('role')
        .eq('household_id', body.householdId)
        .eq('user_id', user.id)
        .maybeSingle();
      const callerIsHead = member?.role === 'head_of_household' || member?.role === 'owner';
      if (!callerIsHead) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    } else if (body.userId && body.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // ── Resolve target user IDs ────────────────────────────────────────────────
  let userIds: string[] = [];

  if (body.userId) {
    userIds = [body.userId];
  } else if (body.householdId) {
    const { data } = await supabase
      .from('household_members')
      .select('user_id')
      .eq('household_id', body.householdId);
    userIds = (data ?? []).map((m) => m.user_id);
  }

  if (userIds.length === 0) {
    return NextResponse.json({ sent: 0, stale: 0 });
  }

  // ── Filter by notification preference ─────────────────────────────────────
  type PrefColumn = 'plan_finalized' | 'cooking_reminder' | 'advance_prep_reminder' | 'join_request' | 'recipe_add_request';
  const validPrefColumns: PrefColumn[] = [
    'plan_finalized', 'cooking_reminder', 'advance_prep_reminder', 'join_request', 'recipe_add_request',
  ];
  const prefColumn = body.type as PrefColumn;

  if (validPrefColumns.includes(prefColumn)) {
    // Select all pref columns to avoid template-literal type issues
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('user_id, plan_finalized, cooking_reminder, advance_prep_reminder, join_request, recipe_add_request')
      .in('user_id', userIds);

    // Keep users who have opted in (default = true when no row exists)
    const optedOut = new Set(
      (prefs ?? [])
        .filter((p: Record<string, unknown>) => p[prefColumn] === false)
        .map((p: Record<string, unknown>) => p.user_id as string),
    );
    userIds = userIds.filter((id) => !optedOut.has(id));
  }

  if (userIds.length === 0) {
    return NextResponse.json({ sent: 0, stale: 0 });
  }

  // ── Fetch subscriptions ───────────────────────────────────────────────────
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth')
    .in('user_id', userIds);

  if (!subs?.length) {
    return NextResponse.json({ sent: 0, stale: 0 });
  }

  // ── Send + clean up stale ─────────────────────────────────────────────────
  const payload = {
    title: body.title,
    body: body.body,
    url: body.url ?? '/',
    icon: '/icons/icon-192x192.png',
  };

  let sent = 0;
  let stale = 0;
  const staleEndpoints: string[] = [];

  await Promise.all(
    subs.map(async (sub) => {
      const subscriptionData: PushSubscriptionData = {
        endpoint: sub.endpoint,
        p256dh: sub.p256dh,
        auth: sub.auth,
      };
      const result = await sendPush(subscriptionData, payload);
      if (result.success) {
        sent++;
      } else if (result.stale) {
        stale++;
        staleEndpoints.push(sub.endpoint);
      }
    }),
  );

  // Remove stale subscriptions
  if (staleEndpoints.length > 0) {
    await supabase
      .from('push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints);
  }

  return NextResponse.json({ sent, stale });
}
