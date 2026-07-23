import Link from 'next/link';

// Hero section placeholder — search bar (property type, city/area, price range)
// and trust indicators per [Reqs §2]. Full search UX lives in (buyer)/search.
export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-bold">Building Trust in Real Estate</h1>
      <p className="max-w-xl text-slate-600 dark:text-slate-300">
        Every listing on Jayedaad is manually verified by our internal review team before publication.
      </p>
      <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-500">
        <span>✅ Verified Listings</span>
        <span>🤖 AI-Powered Search</span>
        <span>🔒 Secure &amp; Trusted</span>
        <span>🧑‍💼 Expert Support</span>
      </div>
      <Link
        href="/search"
        className="rounded-md bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
      >
        Search Properties
      </Link>
    </main>
  );
}
