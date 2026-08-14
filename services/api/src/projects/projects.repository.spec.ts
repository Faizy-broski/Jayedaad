import { ProjectsRepository } from './projects.repository';
import { SupabaseService } from '../supabase/supabase.service';
import { EntitlementsService } from '../subscriptions/entitlements.service';

// Unit-level coverage for the re-review-on-edit rule in update() — the
// exact behavior that changed: a verified project now keeps its
// verification_status through edits (previously reset to 'pending'
// unconditionally, same as rejected/draft). update() ends by calling
// findById()/insertChildRows() to return the full row — those are stubbed
// out via spyOn since this test only cares about the status computation
// and the payload update() actually sends, not the full read-back shape.
function makeSupabase(existingVerificationStatus: string) {
  const single = jest.fn().mockResolvedValue({ data: { verification_status: existingVerificationStatus }, error: null });
  const selectEq = jest.fn().mockReturnValue({ single });
  const select = jest.fn().mockReturnValue({ eq: selectEq });

  const updateEq = jest.fn().mockResolvedValue({ error: null });
  const update = jest.fn().mockReturnValue({ eq: updateEq });

  const from = jest.fn().mockReturnValue({ select, update });
  const client = { from } as unknown as SupabaseService['client'];
  return { client, update };
}

function makeRepo(existingVerificationStatus: string) {
  const { client, update } = makeSupabase(existingVerificationStatus);
  const supabase = { client } as SupabaseService;
  const repo = new ProjectsRepository(supabase, {} as EntitlementsService);
  jest.spyOn(repo as any, 'insertChildRows').mockResolvedValue(undefined);
  jest.spyOn(repo, 'findById').mockResolvedValue({} as any);
  return { repo, update };
}

describe('ProjectsRepository.update', () => {
  it('keeps a verified project verified through an edit', async () => {
    const { repo, update } = makeRepo('verified');

    await repo.update('project-1', { name: 'Updated name' } as any);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ verification_status: 'verified' }));
  });

  it('still resets a rejected project to pending through an edit', async () => {
    const { repo, update } = makeRepo('rejected');

    await repo.update('project-1', { name: 'Updated name' } as any);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ verification_status: 'pending' }));
  });

  it('still moves a draft to pending when input.status leaves draft', async () => {
    const { repo, update } = makeRepo('draft');

    await repo.update('project-1', { status: 'planned' } as any);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ verification_status: 'pending' }));
  });

  it('leaves a still-pending project pending through an edit', async () => {
    const { repo, update } = makeRepo('pending');

    await repo.update('project-1', { name: 'Updated name' } as any);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ verification_status: 'pending' }));
  });
});
