import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { AuthenticatedUser } from '../auth/jwt-auth.guard';
import { LeadsRepository } from '../leads/leads.repository';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

// Self-scoped throughout — owner_id IS the scope, every method filters on
// it directly rather than needing a separate ownership-check helper (unlike
// leads/reminders, which are shared across an agency). Any authenticated
// role can have tasks (owner_id references auth.users, not agent_profiles —
// an owner might want a personal follow-up too), so there's no @Roles()
// restriction at the controller beyond being signed in.
@Injectable()
export class TasksRepository {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly leads: LeadsRepository,
  ) {}

  async list(userId: string) {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .select('*')
      .eq('owner_id', userId)
      .order('due_at', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  }

  async create(scope: AuthenticatedUser, input: CreateTaskDto) {
    if (input.leadId) await this.leads.assertCanAccessLead(scope, input.leadId);
    const { data, error } = await this.supabase.client
      .from('tasks')
      .insert({ owner_id: scope.id, lead_id: input.leadId, title: input.title, due_at: input.dueAt })
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(userId: string, id: string, input: UpdateTaskDto) {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update({ title: input.title, due_at: input.dueAt })
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async complete(userId: string, id: string) {
    const { data, error } = await this.supabase.client
      .from('tasks')
      .update({ completed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('owner_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async remove(userId: string, id: string): Promise<{ id: string }> {
    const { error } = await this.supabase.client.from('tasks').delete().eq('id', id).eq('owner_id', userId);
    if (error) throw error;
    return { id };
  }
}
