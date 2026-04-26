/**
 * /[product]/dashboard
 * S1-F-06 — Student Dashboard Shell
 *
 * Product-scoped dashboard. Each product gets its own dashboard route:
 *   /score-boost-ap/dashboard
 *   /grade-guard/dashboard  (Phase 2)
 *   /study-sensei/dashboard (Phase 3)
 *
 * This is a shell. Full dashboard built in S1-F-06 batch.
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard — AceOS',
};

export default function DashboardPage() {
  return (
    <div className="text-center text-neutral-400 py-20">
      Dashboard — coming in S1-F-06
    </div>
  );
}
