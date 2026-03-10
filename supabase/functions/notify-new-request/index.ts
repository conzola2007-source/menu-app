// Edge Function: notify-new-request
// Triggered by Supabase Database Webhooks on:
//   - INSERT on join_requests   → notifies household heads
//   - INSERT on recipe_cook_requests → notifies recipe owner

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const PUSH_API_SECRET = Deno.env.get('PUSH_API_SECRET')!;
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://menuapp.vercel.app';

async function sendPushToUser(
  userId: string,
  type: string,
  title: string,
  body: string,
  url: string,
) {
  const res = await fetch(`${APP_URL}/api/push/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-push-secret': PUSH_API_SECRET,
    },
    body: JSON.stringify({ userId, type, title, body, url }),
  });
  if (!res.ok) {
    console.error(`[notify-new-request] push failed: ${res.status} ${await res.text()}`);
  }
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json() as {
      type: string;
      table: string;
      record: Record<string, string>;
    };

    if (payload.type !== 'INSERT') {
      return new Response('Not an INSERT', { status: 200 });
    }

    // ── join_requests ──────────────────────────────────────────────────────────
    if (payload.table === 'join_requests') {
      const { household_id, user_id } = payload.record;

      // Requester's display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user_id)
        .maybeSingle();
      const requesterName = profile?.display_name ?? 'Someone';

      // All heads of the household
      const { data: heads } = await supabase
        .from('household_members')
        .select('user_id')
        .eq('household_id', household_id)
        .in('role', ['head_of_household', 'owner']);

      if (!heads?.length) return new Response('No heads', { status: 200 });

      await Promise.all(
        heads.map((h: { user_id: string }) =>
          sendPushToUser(
            h.user_id,
            'join_request',
            'New join request',
            `${requesterName} wants to join your household`,
            '/account',
          ),
        ),
      );

      console.log(`[notify-new-request] join_request → notified ${heads.length} head(s)`);
      return new Response('OK', { status: 200 });
    }

    // ── recipe_cook_requests ───────────────────────────────────────────────────
    if (payload.table === 'recipe_cook_requests') {
      const { owner_id, requester_id, recipe_id } = payload.record;

      const [profileRes, recipeRes] = await Promise.all([
        supabase.from('profiles').select('display_name').eq('id', requester_id).maybeSingle(),
        supabase.from('recipes').select('title, emoji').eq('id', recipe_id).maybeSingle(),
      ]);

      const requesterName = profileRes.data?.display_name ?? 'Someone';
      const recipeLabel = recipeRes.data
        ? `${recipeRes.data.emoji} ${recipeRes.data.title}`
        : 'your recipe';

      await sendPushToUser(
        owner_id,
        'recipe_add_request',
        'Recipe copy request',
        `${requesterName} wants a copy of ${recipeLabel}`,
        '/account',
      );

      console.log(`[notify-new-request] recipe_cook_request → notified owner ${owner_id}`);
      return new Response('OK', { status: 200 });
    }

    return new Response('Unknown table', { status: 200 });
  } catch (err) {
    console.error('[notify-new-request]', err);
    return new Response('Error', { status: 500 });
  }
});
