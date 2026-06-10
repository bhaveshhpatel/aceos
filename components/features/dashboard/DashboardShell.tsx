'use client';

/**
 * DashboardShell — S1-F-06
 *
 * Main dashboard layout with navigation and sidebar.
 * Provides the container for all product dashboards.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Home,
  BookOpen,
  BarChart3,
  PenTool,
  Settings,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';

export interface DashboardShellProps {
  student_name: string;
  children: React.ReactNode;
}

export function DashboardShell({ student_name, children }: DashboardShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/signin');
  };

  const navItems = [
    { icon: Home, label: 'Home', href: '#home' },
    { icon: BookOpen, label: 'Diagnostic', href: '#diagnostic', disabled: true },
    { icon: BarChart3, label: 'Practice', href: '#practice', disabled: true },
    { icon: PenTool, label: 'FRQ Grader', href: '#frq', disabled: true },
  ];

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-40 border-b border-neutral-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-neutral-100 rounded-lg lg:hidden"
              >
                {sidebarOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">AceOS</h1>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex flex-col items-end">
                <p className="text-sm font-medium text-neutral-900">
                  {student_name}
                </p>
                <p className="text-xs text-neutral-500">Student</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:flex gap-8">
        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-16 left-0 z-30 w-64 bg-white border-r border-neutral-200
            transform transition-transform lg:relative lg:inset-auto lg:translate-x-0 lg:z-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <nav className="space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition
                    ${
                      item.disabled
                        ? 'text-neutral-400 cursor-not-allowed'
                        : 'text-neutral-700 hover:bg-neutral-100'
                    }
                  `}
                  onClick={(e) => item.disabled && e.preventDefault()}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-medium">{item.label}</span>
                </a>
              );
            })}

            <hr className="my-4" />

            <a
              href="/dashboard/settings"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-neutral-700 hover:bg-neutral-100 transition"
            >
              <Settings className="h-5 w-5" />
              <span className="text-sm font-medium">Settings</span>
            </a>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 mt-16 lg:mt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
