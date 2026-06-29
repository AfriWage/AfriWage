import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      {/* Logo / Wordmark */}
      <div className="flex items-center gap-3 mb-10">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_1px_4px_rgba(14,29,38,0.12)]">
          <div className="relative h-5 w-5 rotate-[18deg]">
            <span className="absolute left-[1px] top-[2px] h-2 w-1.5 rounded-sm bg-[#14A800]" />
            <span className="absolute left-[7px] top-0 h-3 w-1.5 rounded-sm bg-[#86efac]" />
            <span className="absolute left-[13px] top-[4px] h-2 w-1.5 rounded-sm bg-[#111111]" />
            <span className="absolute left-[4px] top-[10px] h-2 w-1.5 rounded-sm bg-[#111111]" />
            <span className="absolute left-[10px] top-[8px] h-3 w-1.5 rounded-sm bg-[#14A800]" />
          </div>
        </div>
        <span
          className="text-xl font-bold tracking-tight text-[#111111]"
          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
          AfriWage
        </span>
      </div>

      {/* 404 */}
      <p className="text-6xl font-bold text-[#14A800] leading-none mb-4">404</p>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-[#111111] mb-3 text-center">
        Page not found
      </h1>

      {/* Body */}
      <p className="text-[#6B7280] text-base text-center max-w-sm mb-8">
        The page you are looking for does not exist or has been moved.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#14A800] text-white font-semibold text-sm transition-colors hover:bg-[#0D7A00] focus:outline-none focus:ring-2 focus:ring-[#14A800] focus:ring-offset-2"
        >
          Go to Dashboard
        </Link>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-[#E5E7EB] text-[#111111] font-semibold text-sm transition-colors hover:border-[#111111] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
        >
          Back to Home
        </Link>
      </div>
    </main>
  );
}
