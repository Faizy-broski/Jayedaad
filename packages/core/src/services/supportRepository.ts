import { httpClient } from './httpClient';
import { CreateSupportTicketInput, SupportTicket, UpdateSupportTicketInput, UpdateSupportTicketStatusInput } from '../models';

export interface SupportTicketFilters {
  status?: SupportTicket['status'];
  assignedTo?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedSupportTickets {
  items: SupportTicket[];
  total: number;
  page: number;
  pageSize: number;
}

// services/api/src/support/support.repository.ts returns raw snake_case
// rows — mapped here to match every other camelCase model in this package.
function mapTicketRow(row: any): SupportTicket {
  return {
    id: row.id,
    createdBy: row.created_by,
    agencyId: row.agency_id,
    subject: row.subject,
    message: row.message,
    status: row.status,
    adminNote: row.admin_note,
    assignedTo: row.assigned_to,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const supportRepository = {
  // Agent-facing.
  submit: async (input: CreateSupportTicketInput): Promise<SupportTicket> => {
    const { data } = await httpClient.post('/support/tickets', input);
    return mapTicketRow(data);
  },

  listMine: async (filters: { page?: number; pageSize?: number } = {}): Promise<PaginatedSupportTickets> => {
    const { data } = await httpClient.get('/support/tickets/mine', { params: filters });
    return { ...data, items: (data.items as any[]).map(mapTicketRow) };
  },

  // Agent-facing — only succeeds while the ticket is still 'open' (server-
  // enforced; the UI additionally hides these actions once it isn't).
  update: async (id: string, input: UpdateSupportTicketInput): Promise<SupportTicket> => {
    const { data } = await httpClient.patch(`/support/tickets/${id}/edit`, input);
    return mapTicketRow(data);
  },

  remove: async (id: string): Promise<void> => {
    await httpClient.delete(`/support/tickets/${id}`);
  },

  // Super Admin-only.
  listAll: async (filters: SupportTicketFilters = {}): Promise<PaginatedSupportTickets> => {
    const { data } = await httpClient.get('/support/tickets', { params: filters });
    return { ...data, items: (data.items as any[]).map(mapTicketRow) };
  },

  updateStatus: async (id: string, input: UpdateSupportTicketStatusInput): Promise<SupportTicket> => {
    const { data } = await httpClient.patch(`/support/tickets/${id}`, input);
    return mapTicketRow(data);
  },

  assign: async (id: string, staffId: string): Promise<SupportTicket> => {
    const { data } = await httpClient.patch(`/support/tickets/${id}/assign`, { staffId });
    return mapTicketRow(data);
  },

  // verification_staff-facing — the "assigned to me" queue.
  listAssigned: async (filters: { status?: SupportTicket['status']; page?: number; pageSize?: number } = {}): Promise<PaginatedSupportTickets> => {
    const { data } = await httpClient.get('/support/tickets/assigned', { params: filters });
    return { ...data, items: (data.items as any[]).map(mapTicketRow) };
  },
};
