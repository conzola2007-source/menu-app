import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// Root redirect — server-side, runs before the client loads
export default async function RootPage() {
  // If Supabase is not configured, skip session check and go to sign-in.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    redirect('/sign-in');
  }

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/sign-in');
  }

  const { data: membership } = await supabase
    .from('household_members')
    .select('household_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!membership) {
    redirect('/household/create');
  }

  redirect('/week');
}
