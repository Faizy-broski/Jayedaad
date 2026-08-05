import { httpClient } from './httpClient';
import { Appointment, CreateAppointmentInput, UpdateAppointmentInput } from '../models';

export interface AppointmentListFilters {
  from?: string;
  to?: string;
}

// Mirrors services/api/src/appointments/appointments.controller.ts — always
// scoped to the logged-in agent's own appointments server-side.
export const appointmentsRepository = {
  list: async (filters: AppointmentListFilters = {}): Promise<Appointment[]> => {
    const { data } = await httpClient.get('/appointments', { params: filters });
    return data;
  },

  create: async (input: CreateAppointmentInput): Promise<Appointment> => {
    const { data } = await httpClient.post('/appointments', input);
    return data;
  },

  update: async (appointmentId: string, input: UpdateAppointmentInput): Promise<Appointment> => {
    const { data } = await httpClient.patch(`/appointments/${appointmentId}`, input);
    return data;
  },

  remove: async (appointmentId: string): Promise<void> => {
    await httpClient.delete(`/appointments/${appointmentId}`);
  },
};
