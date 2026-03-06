import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

Deno.serve(async () => {
  const { error, count } = await supabase
    .from('household_members')
    .delete({ count: 'exact' })
    .lt('visitor_expires_at', new Date().toISOString())
    .not('visitor_expires_at', 'is', null);

  if (error) {
    console.error('[expire-visitors]', error.message);
    return new Response(error.message, { status: 500 });
  }

  console.log(`[expire-visitors] removed ${count ?? 0} expired visitor(s)`);
  return new Response(`OK: removed ${count ?? 0} expired visitor(s)`, { status: 200 });
});
