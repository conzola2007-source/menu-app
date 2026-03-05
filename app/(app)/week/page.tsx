import { redirect } from 'next/navigation';

// /week is superseded by /planned — keep for backward-compat with old links
export default function WeekPage() {
  redirect('/planned');
}
