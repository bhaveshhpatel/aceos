import Link from 'next/link';

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            Simple, Transparent Pricing for AP Excellence
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Choose the plan that fits your AP preparation strategy. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-800">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                Starter Tier
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Free</h2>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                $0 <span className="text-xs font-normal text-slate-500">/ forever</span>
              </p>

              <ul className="space-y-2.5 pt-4 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">✓ 1 AP Subject Diagnostic Test</li>
                <li className="flex items-center gap-2">✓ Basic Spaced Repetition Queue</li>
                <li className="flex items-center gap-2">✓ Limited Practice Questions</li>
              </ul>
            </div>

            <div className="pt-8">
              <Link
                href="/signup"
                className="inline-block w-full rounded-lg border border-slate-300 bg-white py-2.5 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                Get Started Free
              </Link>
            </div>
          </div>

          <div className="relative flex flex-col justify-between rounded-2xl border-2 border-indigo-600 bg-white p-8 shadow-lg dark:bg-slate-800">
            <span className="absolute -top-3 right-6 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              Most Popular
            </span>

            <div className="space-y-4">
              <span className="inline-block rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
                Student Pro
              </span>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Pro Pass</h2>
              <p className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                $24.99 <span className="text-xs font-normal text-slate-500">/ month or $179/yr</span>
              </p>

              <ul className="space-y-2.5 pt-4 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2">✓ All 4 AceOS Modules (ScoreBoost AP, GradeGuard, StudySensei, SmartPack)</li>
                <li className="flex items-center gap-2">✓ Unlimited AI FRQ Essay & STEM Grading</li>
                <li className="flex items-center gap-2">✓ Full Bluebook™ Timed Exam Simulator Access</li>
                <li className="flex items-center gap-2">✓ Modal.com Python STEM Answer Sandbox Verification</li>
              </ul>
            </div>

            <div className="pt-8">
              <form action="/api/checkout" method="POST">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-indigo-600 py-2.5 text-center text-sm font-semibold text-white shadow hover:bg-indigo-500"
                >
                  Upgrade to Student Pro
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
