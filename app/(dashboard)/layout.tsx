/**
 * Dashboard route group layout.
 * Shared across all product dashboards.
 * Will contain: top nav, sidebar, notification rail.
 * Built out fully in S1-F-06.
 */
import type { ReactNode } from 'react';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Nav + sidebar shell — built in S1-F-06 */}
      <main className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </div>
  );
}
