import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// One-time backfill for the app_metadata.email_verified JWT claim (see
// migration 0059_email_verified_app_metadata.sql and
// OtpRepository.markEmailVerified). Only NEW verifications stamp this
// claim going forward — every account that verified BEFORE this change
// shipped has profiles.email_verified = true but no app_metadata claim
// yet, and would incorrectly fail the new JWT-based check on next login
// (bounced to /verify-email) without this having run first.
//
// MUST run after the backend deploy that starts stamping new
// verifications, and MUST complete before the frontend deploy that starts
// reading the claim instead of querying the DB — see the plan's Rollout
// section for the full required ordering.
//
// Usage: pnpm --filter @jayedaad/api exec ts-node scripts/backfill-email-verified-claim.ts
// Safe to re-run: skips any user that already has the claim set.

const BATCH_DELAY_MS = 150; // stay comfortably under Supabase Admin API rate limits

async function main() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
  }

  const supabase = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  const { data: rows, error } = await supabase.from('profiles').select('id').eq('email_verified', true);
  if (error) throw error;
  if (!rows) throw new Error('Query returned no data (unexpected).');

  console.log(`Found ${rows.length} already-verified profiles — stamping app_metadata.email_verified for each…`);

  let updated = 0;
  let skipped = 0;
  const failed: { id: string; message: string }[] = [];

  for (const row of rows) {
    try {
      const { data: existing, error: getError } = await supabase.auth.admin.getUserById(row.id);
      if (getError) throw getError;
      if (!existing.user) {
        skipped++;
        continue; // Stale profile row (auth user deleted) — nothing to stamp.
      }
      if (existing.user.app_metadata?.email_verified === true) {
        skipped++;
        continue; // Already stamped — safe re-run.
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(row.id, {
        app_metadata: { ...existing.user.app_metadata, email_verified: true },
      });
      if (updateError) throw updateError;

      updated++;
    } catch (err) {
      failed.push({ id: row.id, message: err instanceof Error ? err.message : String(err) });
    }

    await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
  }

  console.log(`Done. Updated: ${updated}, already stamped/skipped: ${skipped}, failed: ${failed.length}`);
  if (failed.length > 0) {
    console.log('Failed rows (re-run this script to retry — it is idempotent):');
    for (const f of failed) console.log(`  ${f.id}: ${f.message}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exitCode = 1;
});
