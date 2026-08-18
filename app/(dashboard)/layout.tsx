import { NavBar } from '@/components/navigation/NavBar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavBar />
      <main>{children}</main>
    </div>
  );
}
