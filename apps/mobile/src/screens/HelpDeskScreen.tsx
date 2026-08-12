import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, View, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SupportTicket, useSupportTicketsViewModel } from '@jayedaad/core';
import { Button, TextInput, theme, useToast } from '@jayedaad/ui-native';

const PAGE_SIZE = 10;

// Same real contact details as apps/web's (agent)/help/page.tsx's
// CONTACT_ROWS — mirrored, not reinvented.
const CONTACT_ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; href?: string }[] = [
  { icon: 'location-outline', label: 'Address', value: 'Jayedaad House, 12-A Main Boulevard, Gulberg III, Lahore' },
  { icon: 'time-outline', label: 'Hours', value: 'Mon–Sat · 9:00 – 20:00' },
  { icon: 'call-outline', label: 'Phone', value: '+92 42 111 000 111', href: 'tel:+9242111000111' },
  { icon: 'mail-outline', label: 'Email', value: 'hello@jayedaad.com', href: 'mailto:hello@jayedaad.com' },
  { icon: 'logo-whatsapp', label: 'WhatsApp', value: '+92 300 000 0000', href: 'https://wa.me/923000000000' },
];

const STATUS_LABEL: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  open: { bg: '#FEF3C7', text: '#92400E' },
  in_progress: { bg: '#DBEAFE', text: '#1E40AF' },
  resolved: { bg: '#DCFCE7', text: '#166534' },
};

// Mobile counterpart to apps/web's (agent)/help/page.tsx — mobile had no
// screen for this at all despite the shared business logic
// (useSupportTicketsViewModel, supportRepository, packages/core) already
// being fully built and working for web. Same flow: contact details,
// submit/edit an issue, track status, no reply thread (server-enforced
// status-only lifecycle, see services/api/src/support/support.repository.ts).
export function HelpDeskScreen() {
  const [page, setPage] = useState(1);
  const { tickets, total, isLoading, isError, submit, update, remove } = useSupportTicketsViewModel({ page, pageSize: PAGE_SIZE });
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function startEdit(ticket: SupportTicket) {
    setEditingId(ticket.id);
    setSubject(ticket.subject);
    setMessage(ticket.message);
  }

  function cancelEdit() {
    setEditingId(null);
    setSubject('');
    setMessage('');
  }

  function handleSubmit() {
    if (!subject.trim() || !message.trim()) return;

    if (editingId) {
      update.mutate(
        { id: editingId, input: { subject: subject.trim(), message: message.trim() } },
        {
          onSuccess: () => {
            showToast('Ticket updated.');
            cancelEdit();
          },
          onError: () => showToast('Something went wrong — please try again.', 'error'),
        },
      );
      return;
    }

    submit.mutate(
      { subject: subject.trim(), message: message.trim() },
      {
        onSuccess: () => {
          showToast('Your issue has been sent to the Jayedaad team.');
          setSubject('');
          setMessage('');
          setPage(1);
        },
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  function handleDelete(ticket: SupportTicket) {
    Alert.alert('Delete ticket', "Delete this ticket? This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () =>
          remove.mutate(ticket.id, {
            onSuccess: () => {
              showToast('Ticket deleted.');
              if (editingId === ticket.id) cancelEdit();
            },
            onError: () => showToast('Something went wrong — please try again.', 'error'),
          }),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Head office</Text>
          <Text style={styles.officeName}>Jayedaad House, Lahore</Text>
          {CONTACT_ROWS.map((row) => (
            <Pressable
              key={row.label}
              style={styles.contactRow}
              disabled={!row.href}
              onPress={() => row.href && Linking.openURL(row.href)}
            >
              <View style={styles.contactIcon}>
                <Ionicons name={row.icon} size={16} color={theme.colors.primary} />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.contactLabel}>{row.label}</Text>
                <Text style={styles.contactValue}>{row.value}</Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.card}>
          <View style={styles.formHeader}>
            <Text style={styles.sectionTitle}>{editingId ? 'Edit issue' : 'Submit an issue'}</Text>
            {editingId && (
              <Pressable onPress={cancelEdit}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </Pressable>
            )}
          </View>
          <TextInput label="Subject" value={subject} onChangeText={setSubject} placeholder="What's this about?" />
          <TextInput
            label="Message"
            value={message}
            onChangeText={setMessage}
            placeholder="Describe the issue — the more detail, the faster we can help."
            multiline
            numberOfLines={4}
          />
          <Button
            label={editingId ? (update.isPending ? 'Saving…' : 'Save changes') : submit.isPending ? 'Sending…' : 'Send to Jayedaad team'}
            onPress={handleSubmit}
            disabled={submit.isPending || update.isPending || !subject.trim() || !message.trim()}
          />
        </View>

        <Text style={styles.sectionTitle}>Your submitted issues</Text>
        {isLoading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : isError ? (
          <Text style={styles.error}>Couldn't load your tickets — please try again.</Text>
        ) : tickets.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="help-buoy-outline" size={32} color={theme.colors.mutedLight} />
            <Text style={styles.emptyText}>Nothing submitted yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {tickets.map((ticket) => {
              const color = STATUS_COLOR[ticket.status];
              return (
                <View key={ticket.id} style={styles.ticketCard}>
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
                      <Text style={[styles.statusText, { color: color.text }]}>{STATUS_LABEL[ticket.status]}</Text>
                    </View>
                  </View>
                  <Text style={styles.ticketMessage}>{ticket.message}</Text>
                  {ticket.adminNote && (
                    <View style={styles.adminNoteBox}>
                      <Text style={styles.adminNoteLabel}>Jayedaad team:</Text>
                      <Text style={styles.adminNoteText}>{ticket.adminNote}</Text>
                    </View>
                  )}
                  <Text style={styles.ticketDate}>
                    {new Date(ticket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                  {ticket.status === 'open' && (
                    <View style={styles.ticketActions}>
                      <Pressable style={styles.ticketAction} onPress={() => startEdit(ticket)}>
                        <Ionicons name="pencil-outline" size={14} color={theme.colors.primary} />
                        <Text style={styles.ticketActionText}>Edit</Text>
                      </Pressable>
                      <Pressable style={styles.ticketAction} onPress={() => handleDelete(ticket)}>
                        <Ionicons name="trash-outline" size={14} color={theme.colors.danger} />
                        <Text style={[styles.ticketActionText, { color: theme.colors.danger }]}>Delete</Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {totalPages > 1 && (
          <View style={styles.pager}>
            <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)}>
              <Text style={[styles.pagerText, page <= 1 && styles.pagerTextDisabled]}>Previous</Text>
            </Pressable>
            <Text style={styles.pagerLabel}>
              Page {page} of {totalPages}
            </Text>
            <Pressable disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)}>
              <Text style={[styles.pagerText, page >= totalPages && styles.pagerTextDisabled]}>Next</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  card: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  officeName: { fontSize: 15, fontWeight: '700', color: theme.colors.text, marginBottom: 4 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: 4 },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  flex1: { flex: 1 },
  contactLabel: { fontSize: 10, fontWeight: '700', color: theme.colors.muted, textTransform: 'uppercase', letterSpacing: 0.4 },
  contactValue: { fontSize: 13, fontWeight: '600', color: theme.colors.text, marginTop: 1 },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: theme.colors.text },
  cancelLink: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  muted: { fontSize: 13, color: theme.colors.muted },
  error: { fontSize: 13, color: theme.colors.danger },
  emptyState: { alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.xl },
  emptyText: { fontSize: 13, color: theme.colors.muted },
  list: { gap: theme.spacing.md },
  ticketCard: {
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: 6,
  },
  ticketHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm },
  ticketSubject: { flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.text },
  statusBadge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  ticketMessage: { fontSize: 13, color: theme.colors.muted },
  adminNoteBox: { backgroundColor: theme.colors.secondaryBg, borderRadius: 10, padding: theme.spacing.sm },
  adminNoteLabel: { fontSize: 12, fontWeight: '700', color: theme.colors.text },
  adminNoteText: { fontSize: 12, color: theme.colors.text, marginTop: 2 },
  ticketDate: { fontSize: 11, color: theme.colors.mutedLight },
  ticketActions: { flexDirection: 'row', gap: theme.spacing.lg, marginTop: 4 },
  ticketAction: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ticketActionText: { fontSize: 12, fontWeight: '600', color: theme.colors.primary },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pagerLabel: { fontSize: 12, color: theme.colors.muted },
  pagerText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  pagerTextDisabled: { color: theme.colors.mutedLight },
});
