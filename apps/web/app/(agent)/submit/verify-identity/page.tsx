'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@jayedaad/ui-web';
import { IdentityVerificationPanel } from '@/components/shared/IdentityVerificationPanel';

// One-time identity check for individuals (owners and independent agents
// alike — see IdentityVerificationPanel), staff-reviewed same as agency
// verification. Reached from /submit's gate card before a fresh
// owner/independent agent can post their first listing.
export default function VerifyIdentityPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg space-y-6 py-12">
      <div>
        <h1 className="text-2xl font-semibold">Verify Your Identity</h1>
        <p className="mt-1 text-sm text-muted-foreground">You can post your first listing once you&apos;re verified.</p>
      </div>

      <IdentityVerificationPanel />

      <Button variant="outline" className="w-full" onClick={() => router.push('/submit')}>
        Back
      </Button>
    </div>
  );
}
