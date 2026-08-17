import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="mx-auto max-w-3xl space-y-6 rounded-lg bg-white p-8 shadow dark:bg-slate-800">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Privacy Policy</h1>
        <p className="text-slate-600 dark:text-slate-300">
          We are finalizing this document. It will be published before AceOS opens to the public. If you have questions, contact us at{' '}
          <a href="mailto:support@aceos.app" className="text-indigo-600 underline dark:text-indigo-400">
            support@aceos.app
          </a>
          .
        </p>
        <p className="text-xs text-slate-400">Last updated: April 2026</p>
      </div>
    </div>
  );
}
