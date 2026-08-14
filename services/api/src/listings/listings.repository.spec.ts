import { ListingsRepository } from './listings.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { DocumentsService } from '../documents/documents.service';
import { EntitlementsService } from '../subscriptions/entitlements.service';

// Unit-level coverage for the re-review-on-edit rule in update() — the
// exact behavior that changed: a verified listing now keeps its status
// through edits (previously reset to 'pending_verification' unconditionally
// on every edit, same as rejected). No live DB involved — `from()` is
// stubbed to return just enough of the fluent Supabase chain this method
// actually calls (select().eq().single() for the pre-read, update().eq()
// for the write), matching the "unit-level ... independent of a running
// HTTP server or database" layer described in scope.guard.spec.ts.
function makeSupabase(existingStatus: string) {
  const single = jest.fn().mockResolvedValue({ data: { status: existingStatus, property_type_id: null }, error: null });
  const selectEq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq: selectEq });

  const updateEq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq: updateEq });

  const from = jest.fn().mockReturnValue({ select, update });
  const client = { from } as unknown as SupabaseService['client'];
  return { client, update, updateEq };
}

describe('ListingsRepository.update', () => {
  it('keeps a verified listing verified through an edit', async () => {
    const { client, update } = makeSupabase('verified');
    const supabase = { client } as SupabaseService;
    const repo = new ListingsRepository(supabase, {} as DocumentsService, {} as EntitlementsService);

    await repo.update('listing-1', { title: 'Updated title' } as any);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'verified' }));
  });

  it('still resets a rejected listing to pending_verification through an edit', async () => {
    const { client, update } = makeSupabase('rejected');
    const supabase = { client } as SupabaseService;
    const repo = new ListingsRepository(supabase, {} as DocumentsService, {} as EntitlementsService);

    await repo.update('listing-1', { title: 'Updated title' } as any);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_verification' }));
  });

  it('leaves a still-pending listing pending through an edit', async () => {
    const { client, update } = makeSupabase('pending_verification');
    const supabase = { client } as SupabaseService;
    const repo = new ListingsRepository(supabase, {} as DocumentsService, {} as EntitlementsService);

    await repo.update('listing-1', { title: 'Updated title' } as any);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending_verification' }));
  });
});
