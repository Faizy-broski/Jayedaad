import { useMemo, useState } from 'react';
import { FlatList, Modal, Pressable, SafeAreaView, ScrollView, Text, TextInput as RNTextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Appointment, AppointmentStatus, useAppointmentsViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  requested: 'Requested',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  requested: theme.colors.muted,
  confirmed: theme.colors.primary,
  completed: theme.colors.primary,
  cancelled: theme.colors.danger,
};

function dateKey(iso: string) {
  return new Date(iso).toDateString();
}

function formatSectionDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

// Agenda-style list (no calendar-grid library — matches this app's
// no-Reanimated/no-gesture-handler discipline) backing the Sales Associate
// "calendar" bullet. Appointments here come either from "Book a Visit" on a
// listing (status 'requested') or from the agent creating one manually.
export function CalendarScreen() {
  const { appointments, isLoading, create, update, remove } = useAppointmentsViewModel();
  const [formVisible, setFormVisible] = useState(false);
  const [selected, setSelected] = useState<Appointment | null>(null);

  const sections = useMemo(() => {
    const groups = new Map<string, Appointment[]>();
    for (const appt of appointments) {
      const key = dateKey(appt.scheduledAt);
      groups.set(key, [...(groups.get(key) ?? []), appt]);
    }
    return Array.from(groups.entries()).map(([key, items]) => ({ key, items }));
  }, [appointments]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
        <Pressable style={styles.addButton} onPress={() => setFormVisible(true)}>
          <Ionicons name="add" size={20} color={theme.colors.bg} />
        </Pressable>
      </View>

      {isLoading && <Text style={styles.loading}>Loading…</Text>}

      <FlatList
        data={sections}
        keyExtractor={(section) => section.key}
        contentContainerStyle={styles.list}
        ListEmptyComponent={!isLoading ? <Text style={styles.empty}>No appointments yet.</Text> : null}
        renderItem={({ item: section }) => (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{formatSectionDate(section.items[0].scheduledAt)}</Text>
            {section.items.map((appt) => (
              <Pressable key={appt.id} style={styles.row} onPress={() => setSelected(appt)}>
                <View style={styles.rowLeft}>
                  <Text style={styles.rowTime}>{formatTime(appt.scheduledAt)}</Text>
                  <View style={[styles.statusDot, { backgroundColor: STATUS_COLOR[appt.status] }]} />
                </View>
                <View style={styles.rowBody}>
                  <Text style={styles.rowTitle}>{appt.title}</Text>
                  <Text style={styles.rowStatus}>{STATUS_LABEL[appt.status]}</Text>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      />

      <NewAppointmentModal visible={formVisible} onClose={() => setFormVisible(false)} onCreate={create.mutateAsync} />
      {selected && (
        <AppointmentDetailModal
          appointment={selected}
          onClose={() => setSelected(null)}
          onUpdate={(input) => update.mutateAsync({ appointmentId: selected.id, input })}
          onRemove={() => remove.mutateAsync(selected.id)}
        />
      )}
    </SafeAreaView>
  );
}

function NewAppointmentModal({
  visible,
  onClose,
  onCreate,
}: {
  visible: boolean;
  onClose: () => void;
  onCreate: (input: { title: string; scheduledAt: string; status: AppointmentStatus }) => Promise<unknown>;
}) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [dateText, setDateText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    const scheduledAt = new Date(dateText);
    if (!title || isNaN(scheduledAt.getTime())) {
      showToast('Enter a title and a valid date (e.g. 2026-08-10 14:00).', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await onCreate({ title, scheduledAt: scheduledAt.toISOString(), status: 'confirmed' });
      setTitle('');
      setDateText('');
      onClose();
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>New Appointment</Text>
          <Text style={styles.fieldLabel}>Title</Text>
          <RNTextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="Property viewing" />
          <Text style={styles.fieldLabel}>Date &amp; Time</Text>
          <RNTextInput style={styles.input} value={dateText} onChangeText={setDateText} placeholder="2026-08-10 14:00" />
          <View style={styles.modalActions}>
            <Button label="Cancel" variant="secondary" onPress={onClose} />
            <Button label={submitting ? 'Saving…' : 'Save'} onPress={handleSubmit} disabled={submitting} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function AppointmentDetailModal({
  appointment,
  onClose,
  onUpdate,
  onRemove,
}: {
  appointment: Appointment;
  onClose: () => void;
  onUpdate: (input: { status: AppointmentStatus }) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function setStatus(status: AppointmentStatus) {
    setBusy(true);
    try {
      await onUpdate({ status });
      onClose();
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    try {
      await onRemove();
      onClose();
    } catch {
      showToast('Something went wrong — please try again.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <ScrollView style={styles.modalCard} contentContainerStyle={{ gap: theme.spacing.sm }}>
          <Text style={styles.modalTitle}>{appointment.title}</Text>
          <Text style={styles.fieldLabel}>
            {formatSectionDate(appointment.scheduledAt)} at {formatTime(appointment.scheduledAt)}
          </Text>
          <Text style={styles.fieldLabel}>Status: {STATUS_LABEL[appointment.status]}</Text>
          {appointment.notes && <Text style={styles.notes}>{appointment.notes}</Text>}

          <View style={styles.statusActions}>
            {appointment.status === 'requested' && (
              <Button label="Confirm" size="sm" onPress={() => setStatus('confirmed')} disabled={busy} />
            )}
            {appointment.status !== 'completed' && appointment.status !== 'cancelled' && (
              <Button label="Mark Completed" size="sm" variant="secondary" onPress={() => setStatus('completed')} disabled={busy} />
            )}
            {appointment.status !== 'cancelled' && (
              <Button label="Cancel Appointment" size="sm" variant="secondary" onPress={() => setStatus('cancelled')} disabled={busy} />
            )}
          </View>
          <Button label="Delete" variant="secondary" onPress={handleRemove} disabled={busy} />
          <Button label="Close" variant="secondary" onPress={onClose} />
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  title: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  addButton: {
    backgroundColor: theme.colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { textAlign: 'center', color: theme.colors.muted, marginTop: theme.spacing.md },
  list: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  empty: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.lg },
  section: { gap: theme.spacing.sm },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase' },
  row: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  rowLeft: { width: 72, alignItems: 'flex-start', gap: 4 },
  rowTime: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 14, fontWeight: '600', color: theme.colors.text },
  rowStatus: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.4)', justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: theme.radius.md,
    borderTopRightRadius: theme.radius.md,
    padding: theme.spacing.lg,
    maxHeight: '80%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: theme.colors.muted, marginTop: theme.spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginTop: 4,
    color: theme.colors.text,
  },
  notes: { fontSize: 13, color: theme.colors.muted },
  modalActions: { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg },
  statusActions: { gap: theme.spacing.sm, marginTop: theme.spacing.sm },
});
