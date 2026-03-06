// Edge Function: send-cooking-reminders
// Runs on a cron schedule (e.g. every 30 minutes).
// Finds meal plan slots where:
//   1. slot_date is today in the household's timezone
//   2. The current time is within [dinner_time - reminder_hours_before, dinner_time]
//   3. cooking_reminder_sent_at IS NULL
// Sends a push notification and marks cooking_reminder_sent_at.

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

    // Fetch all active (finalized) meal plans with their household settings
    const { data: plans, error: plansError } = await supabase
      .from('meal_plans')
      .select(`
        id,
        household_id,
        households!inner(
          dinner_time,
          reminder_hours_before,
          timezone
        )
      `)
      .not('finalized_at', 'is', null);

    if (plansError) throw plansError;
    if (!plans?.length) return new Response('No active plans', { status: 200 });

    let notified = 0;

    for (const plan of plans) {
      const household = (plan as Record<string, unknown>).households as {
        dinner_time: string;
        reminder_hours_before: number;
        timezone: string;
      };

      const tz = household.timezone ?? 'Europe/London';
      const reminderHours = household.reminder_hours_before ?? 3;
      const [dinnerH, dinnerM] = (household.dinner_time ?? '18:00').split(':').map(Number);

      // Get today's date in the household timezone
      const todayInTz = new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(nowUtc);

      // Build the dinner datetime in the household's timezone (as UTC)
      const dinnerUtcMs = Date.UTC(
        parseInt(todayInTz.slice(0, 4)),
        parseInt(todayInTz.slice(5, 7)) - 1,
        parseInt(todayInTz.slice(8, 10)),
        dinnerH,
        dinnerM,
      ) - (new Date(todayInTz + 'T00:00:00' + getUtcOffset(tz, nowUtc)).getTimezoneOffset?.() ?? 0) * 60000;

      const reminderWindowStart = dinnerUtcMs - reminderHours * 3600000;
      const nowMs = nowUtc.getTime();

      // Only send if we're in the reminder window
      if (nowMs < reminderWindowStart || nowMs > dinnerUtcMs) continue;

      // Find slots for today that haven't had reminders sent
      const { data: slots } = await supabase
        .from('meal_plan_slots')
        .select('id, recipe_id, recipes!inner(title, emoji)')
        .eq('meal_plan_id', plan.id)
        .eq('slot_date', todayInTz)
        .is('cooking_reminder_sent_at', null);

      if (!slots?.length) continue;

      for (const slot of slots) {
        const recipe = (slot as Record<string, unknown>).recipes as { title: string; emoji: string };
        const title = `🍽️ Cooking reminder`;
        const body = `${recipe.emoji} ${recipe.title} is on the menu tonight!`;

        // Send push to all household members
        const res = await fetch(`${APP_URL}/api/push/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-push-secret': PUSH_API_SECRET,
          },
          body: JSON.stringify({
            householdId: plan.household_id,
            type: 'cooking_reminder',
            title,
            body,
            url: '/plan',
          }),
        });

        if (res.ok) {
          // Mark as sent
          await supabase
            .from('meal_plan_slots')
            .update({ cooking_reminder_sent_at: nowUtc.toISOString() })
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

// Approximate UTC offset for a timezone at a given moment
function getUtcOffset(tz: string, date: Date): string {
  try {
    const parts = new Intl.DateTimeFormat('en', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    }).formatToParts(date);
    const offset = parts.find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+0';
    return offset.replace('GMT', '');
  } catch {
    return '+00:00';
  }
}
