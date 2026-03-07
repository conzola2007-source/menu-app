import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  // Admin client — can delete users through GoTrue (properly invalidates sessions)
  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Verify the caller's JWT to get their user ID
  const { data: { user }, error: userError } = await admin.auth.getUser(
    authHeader.slice(7),
  );
  if (userError || !user) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Clean up app data first (same as delete_account RPC)
  await admin.from('household_members').delete().eq('user_id', user.id);
  await admin.from('recipes').delete().eq('created_by', user.id).eq('is_global', false);
  await admin.from('recipe_cooks').delete().eq('user_id', user.id);
  await admin.from('shopping_attendance').delete().eq('user_id', user.id);
  await admin.from('push_subscriptions').delete().eq('user_id', user.id);
  await admin.from('notification_preferences').delete().eq('user_id', user.id);

  // Delete through GoTrue — immediately invalidates all sessions
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
