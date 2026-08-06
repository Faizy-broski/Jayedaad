// New page — the footer (apps/web/data/footer.ts) already links here, but
// the route didn't exist (404). Working draft, not a substitute for review
// by qualified legal counsel before going live. Expands on the Limitation
// of Liability / No Warranty on Listing Accuracy clauses in /terms.
const SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: 'Listing Content',
    body: [
      'Property listings on Jayedaad — including descriptions, pricing, area, amenities, photographs, and availability — are provided by the individual owner or real estate agency who submitted them. Jayedaad does not author, edit, or independently confirm this content.',
    ],
  },
  {
    heading: 'What "Verified" Means on Jayedaad',
    body: [
      'Where a listing or account is shown as "verified," this refers specifically to Jayedaad\'s ownership-verification process — a review of documentation (such as ownership documents, a recent utility bill, or CNIC identity verification) intended to confirm the submitting party\'s claimed ownership of, or authority to list, the property.',
      'Verification does not mean Jayedaad has inspected the property, confirmed the accuracy of the listing description, or endorsed the condition, price, or availability of the property. Buyers and tenants should independently confirm all details before relying on them.',
    ],
  },
  {
    heading: 'No Liability for Listing Accuracy',
    body: [
      "Jayedaad is not responsible or liable for any inaccuracy, omission, or misrepresentation in listing content, or for any loss arising from reliance on it. This limitation does not extend to Jayedaad's own ownership-verification process, which is described in full in our Terms and Conditions.",
    ],
  },
  {
    heading: 'Third-Party Conduct',
    body: [
      'Jayedaad is not responsible for the conduct of any user — owner, agent, agency, buyer, or tenant — on or off the Platform, including the outcome of any negotiation, transaction, or dispute between users.',
    ],
  },
];

export default function DisclaimersPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">Disclaimers</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Read alongside our{' '}
        <a href="/terms" className="underline">
          Terms and Conditions
        </a>
        .
      </p>

      <div className="mt-8 space-y-6">
        {SECTIONS.map((section) => (
          <section key={section.heading}>
            <h2 className="text-base font-semibold text-foreground">{section.heading}</h2>
            {section.body.map((paragraph, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  );
}
