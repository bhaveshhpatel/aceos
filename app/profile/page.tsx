'use client';

import { useState, useEffect } from 'react';
import { NavBar } from '@/components/navigation/NavBar';
import { User, Key, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProfilePage() {
  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
        }
      } catch (err) {
        console.error('Failed to load profile', err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setStatusMessage(null);

    if (password.length < 8) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 8 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      setStatusMessage({ type: 'error', text: 'Passwords do not match.' });
      return;
    }

    setUpdatingPassword(true);

    try {
      const res = await fetch('/api/auth/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatusMessage({ type: 'error', text: data.message || 'Failed to update password.' });
      } else {
        setStatusMessage({ type: 'success', text: 'Password updated successfully!' });
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred.' });
    } finally {
      setUpdatingPassword(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <NavBar />

      <main className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            Account & Security Settings
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Manage your student profile information, subscription tier, and password.
          </p>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            Student Identity & Membership Status
          </h2>

          {loadingProfile ? (
            <p className="text-sm text-slate-500">Loading account details...</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Email Address
                </label>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {profile?.email || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  First Name
                </label>
                <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {profile?.first_name || 'N/A'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Account Status
                </label>
                <span className="mt-1 inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800 dark:bg-green-950/60 dark:text-green-300">
                  {profile?.account_status ? profile.account_status.toUpperCase() : 'ACTIVE'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  Subscription Tier
                </label>
                <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
                  AceOS Student Pro Pass
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Change Password Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-800 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            Update Security Password
          </h2>

          {statusMessage && (
            <div
              className={`flex items-center gap-2 rounded-lg p-3 text-sm font-medium ${
                statusMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 dark:bg-green-950/40 dark:text-green-300'
                  : 'bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              type="submit"
              disabled={updatingPassword}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {updatingPassword ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
