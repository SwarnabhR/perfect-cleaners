import { redirect } from 'next/navigation';

// URL moved — all traffic forwarded to the canonical marketing page
export default function SocietiesRedirect() {
  redirect('/for-societies');
}
