import Link from 'next/link';

export default function ConsentAlreadyActionedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-900">
      <div className="w-full max-w-md space-y-6 rounded-lg bg-white p-8 shadow-md text-center dark:bg-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          This link has already been used
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          You have already responded to this parental consent request.
        </p>
        <div className="pt-2">
          <Link
            href="/signin"
            className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Go to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
