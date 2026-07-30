// Present on every page of the platform, not just inside the chatbot —
// one tap, no confirmation prompt, per [Spec §3.5]/[Reqs §3.5].
const EXPERT_PHONE = 'tel:+920000000000';
const EXPERT_WHATSAPP = 'https://wa.me/920000000000';

export function ReachOutToExperts() {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex gap-2">
      <a
        href={EXPERT_PHONE}
        aria-label="Call Jayedaad Experts"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white shadow-lg hover:bg-slate-800 dark:bg-white dark:text-slate-900"
      >
        📞
      </a>
      <a
        href={EXPERT_WHATSAPP}
        target="_blank"
        rel="noreferrer"
        aria-label="WhatsApp Jayedaad Experts"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700"
      >
        💬
      </a>
    </div>
  );
}
