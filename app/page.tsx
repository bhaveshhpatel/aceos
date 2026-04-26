import { redirect } from 'next/navigation';

/**
 * Root route — redirects to sign-in.
 * Marketing page is a future Sprint task.
 */
export default function RootPage() {
  redirect('/signin');
}
