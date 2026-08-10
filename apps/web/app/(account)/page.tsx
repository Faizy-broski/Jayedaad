import { redirect } from 'next/navigation';

// /account has no overview screen of its own yet — Favorites & Saved
// Searches is the only section, so it's the sole real destination.
export default function AccountIndexPage() {
  redirect('/account/saved');
}
