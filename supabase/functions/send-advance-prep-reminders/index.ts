// Edge Function: send-advance-prep-reminders
// Runs on a cron schedule (e.g. once per day at 20:00 UTC).
// Finds meal plan slots where:
//   1. slot_date is TOMORROW in the household's timezone
//   2. The recipe has advance_prep_time > 0
//   3. advance_prep_reminder_sent_at IS NULL
// Sends a push notification and marks advance_prep_reminder_sent_at.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

const PUSH_API_SECRET = Deno.env.get('PUSH_API_SECRET')!;
const APP_URL = Deno.env.get('NEXT_PUBLIC_APP_URL') ?? 'https://menuapp.vercel.app';

Deno.serve(async () => {
  try {
    const nowUtc = new Date();

    // Fetch all finalized meal plans with household timezone
    const { data: plans, error: plansError } = await supabase
      .from('meal_plans')
      .select(`
        id,
        household_id,
        households!inner(timezone)
      `)
      .not('finalized_at', 'is', null);

    if (plansError) throw plansError;
    if (!plans?.length) return new Response('No active plans', { status: 200 });

    let notified = 0;

    for (const plan of plans) {
      const household = (plan as Record<string, unknown>).households as { timezone: string };
      const tz = household.timezone ?? 'Europe/London';

      // Get tomorrow's date in the household timezone
      const tomorrowUtc = new Date(nowUtc.getTime() + 86400000);
      const tomorrowInTz = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(tomorrowUtc);

      // Find slots for tomorrow with advance prep that haven't been reminded
      const { data: slots } = await supabase
        .from('meal_plan_slots')
        .select('id, recipe_id, chef_id, recipes!inner(title, emoji, prep_time_min)')
        .eq('meal_plan_id', plan.id)
        .eq('slot_date', tomorrowInTz)
        .is('advance_prep_reminder_sent_at', null);

      if (!slots?.length) continue;

      // Filter to recipes with meaningful prep time (> 30 min = advance prep needed)
      const advancePrepSlots = slots.filter((slot) => {
        const recipe = (slot as Record<string, unknown>).recipes as { prep_time_min: number };
        return recipe.prep_time_min > 30;
      });

      if (!advancePrepSlots.length) continue;

      for (const slot of advancePrepSlots) {
        const recipe = (slot as Record<string, unknown>).recipes as {
          title: string;
          emoji: string;
          prep_time_min: number;
        };

        const chefId = (slot as Record<string, unknown>).chef_id as string | null;
        const title = `🔪 Advance prep reminder`;
        const body = `${recipe.emoji} ${recipe.title} is tomorrow — prep takes ${recipe.prep_time_min} min!`;

        // Send push to assigned chef only; fall back to all household members if no chef set
        const target = chefId
          ? { userId: chefId }
          : { householdId: plan.household_id };

        const res = await fetch(`${APP_URL}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-push-secret': PUSH_API_SECRET,
          },
          body: JSON.stringify({
            ...target,
            type: 'advance_prep_reminder',
            title,
            body,
            url: '/plan',
          }),
        });

        if (res.ok) {
          await supabase
            .from('meal_plan_slots')
            .update({ advance_prep_reminder_sent_at: nowUtc.toISOString() })
            .eq('id', slot.id);
          notified++;
        }
      }
    }

    return new Response(JSON.stringify({ notified }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
