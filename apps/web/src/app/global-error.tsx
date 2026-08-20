'use client';

import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Capture the error to Sentry if configured
  Sentry.captureException(error);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-white px-4">
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold text-[#111111]">Something went wrong</h2>
            <p className="mt-4 text-base text-[#6B7280]">
              An error occurred while loading the application.
            </p>
            <button
              onClick={reset}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#14A800] px-5 text-sm font-semibold text-white hover:bg-[#14A800]/90"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
