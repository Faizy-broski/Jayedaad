import { useState } from 'react';
import { Alert, Linking, ScrollView, Text, View, Pressable, TextInput as RNTextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SupportTicket, useSupportTicketsViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';

const PAGE_SIZE = 10;

const CONTACT_ROWS: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; href?: string }[] = [
  { icon: 'location-outline', label: 'Address', value: 'Jayedaad House, 12-A Main Boulevard, Gulberg III, Lahore' },
  { icon: 'time-outline', label: 'Hours', value: 'Mon–Sat · 9:00 – 20:00' },
  { icon: 'call-outline', label: 'Phone', value: '+92 42 111 000 111', href: 'tel:+9242111000111' },
  { icon: 'mail-outline', label: 'Email', value: 'hello@jayedaad.com', href: 'mailto:hello@jayedaad.com' },
  { icon: 'logo-whatsapp', label: 'WhatsApp', value: '+92 300 000 0000', href: 'https://wa.me/923000000000' },
];

const STATUS_LABEL: Record<string, string> = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' };
const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string }> = {
  open: { bg: '#FEF3C7', text: '#92400E', dot: '#F59E0B' },
  in_progress: { bg: '#DBEAFE', text: '#1E40AF', dot: '#3B82F6' },
  resolved: { bg: '#DCFCE7', text: '#166534', dot: '#22C55E' },
};

type StatusFilter = 'all' | SupportTicket['status'];

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'open', label: 'Open' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'resolved', label: 'Resolved' },
];

export function HelpDeskScreen() {
  const [page, setPage] = useState(1);
  const { tickets, total, isLoading, isError, submit, update, remove } = useSupportTicketsViewModel({ page, pageSize: PAGE_SIZE });
  const { showToast } = useToast();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const visibleTickets = statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter);

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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Head office — gradient hero card */}
        <LinearGradient
          colors={theme.gradients.primary.colors}
          start={theme.gradients.primary.start}
          end={theme.gradients.primary.end}
          style={styles.heroCard}
        >
          <View style={styles.heroIconWrap}>
            <Ionicons name="business" size={22} color="#ffffff" />
          </View>
          <Text style={styles.heroEyebrow}>Head office</Text>
          <Text style={styles.heroTitle}>Jayedaad House, Lahore</Text>

          <View style={styles.heroDivider} />

          {CONTACT_ROWS.map((row) => (
            <Pressable
              key={row.label}
              style={({ pressed }) => [styles.heroRow, !!row.href && pressed ? styles.heroRowPressed : null]}
              disabled={!row.href}
              onPress={() => row.href && Linking.openURL(row.href)}
            >
              <View style={styles.heroRowIcon}>
                <Ionicons name={row.icon} size={16} color="#ffffff" />
              </View>
              <View style={styles.flex1}>
                <Text style={styles.heroRowLabel}>{row.label}</Text>
                <Text style={styles.heroRowValue}>{row.value}</Text>
              </View>
              {row.href && <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.55)" />}
            </Pressable>
          ))}
        </LinearGradient>

        {/* Submit an issue */}
        <View style={styles.formCard}>
          <View style={styles.formHeader}>
            <View>
              <Text style={styles.sectionTitle}>{editingId ? 'Edit issue' : 'Submit an issue'}</Text>
              <Text style={styles.sectionSubtitle}>
                {editingId ? 'Update the details below.' : "We'll get back to you as soon as we can."}
              </Text>
            </View>
            {editingId && (
              <Pressable onPress={cancelEdit} style={styles.cancelPill}>
                <Text style={styles.cancelLink}>Cancel</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Subject</Text>
            <RNTextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="What's this about?"
              placeholderTextColor={theme.colors.mutedLight}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Message</Text>
            <RNTextInput
              style={[styles.input, styles.inputMultiline]}
              value={message}
              onChangeText={setMessage}
              placeholder="Describe the issue — the more detail, the faster we can help."
              placeholderTextColor={theme.colors.mutedLight}
              multiline
              numberOfLines={4}
            />
          </View>

          <Button
            label={editingId ? (update.isPending ? 'Saving…' : 'Save changes') : submit.isPending ? 'Sending…' : 'Send to Jayedaad team'}
            onPress={handleSubmit}
            disabled={submit.isPending || update.isPending || !subject.trim() || !message.trim()}
            size="lg"
            style={styles.submitButton}
          />
        </View>

        {/* Submitted issues */}
        <View style={styles.listSection}>
          <Text style={styles.listTitle}>Your submitted issues</Text>

          {tickets.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {STATUS_FILTERS.map((f) => {
                const active = statusFilter === f.key;
                const count = f.key === 'all' ? tickets.length : tickets.filter((t) => t.status === f.key).length;
                return (
                  <Pressable
                    key={f.key}
                    onPress={() => setStatusFilter(f.key)}
                    style={[styles.filterPill, active && styles.filterPillActive]}
                  >
                    <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{f.label}</Text>
                    <View style={[styles.filterCount, active && styles.filterCountActive]}>
                      <Text style={[styles.filterCountText, active && styles.filterCountTextActive]}>{count}</Text>
                    </View>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}

          {isLoading ? (
            <Text style={styles.muted}>Loading…</Text>
          ) : isError ? (
            <Text style={styles.error}>Couldn't load your tickets — please try again.</Text>
          ) : visibleTickets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="help-buoy-outline" size={28} color={theme.colors.mutedLight} />
              </View>
              <Text style={styles.emptyText}>
                {tickets.length === 0 ? 'Nothing submitted yet.' : `No ${STATUS_LABEL[statusFilter] ?? ''} issues on this page.`}
              </Text>
            </View>
          ) : (
            <View style={styles.list}>
              {visibleTickets.map((ticket) => {
                const color = STATUS_COLOR[ticket.status];
                return (
                  <View key={ticket.id} style={styles.ticketCard}>
                    {/* Header */}
                    <View style={styles.ticketHeader}>
                      <View style={styles.ticketHeaderLeft}>
                        <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                        <Text style={styles.ticketDate}>
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: color.bg }]}>
                        <View style={[styles.statusDot, { backgroundColor: color.dot }]} />
                        <Text style={[styles.statusText, { color: color.text }]}>{STATUS_LABEL[ticket.status]}</Text>
                      </View>
                    </View>

                    {/* Body */}
                    <View style={styles.ticketBody}>
                      <Text style={styles.ticketMessage}>{ticket.message}</Text>
                      
                      {ticket.adminNote && (
                        <View style={styles.adminNoteBox}>
                          <View style={styles.adminNoteHeader}>
                            <Ionicons name="return-down-forward" size={14} color={theme.colors.primary} />
                            <Text style={styles.adminNoteLabel}>Jayedaad Team Reply</Text>
                          </View>
                          <Text style={styles.adminNoteText}>{ticket.adminNote}</Text>
                        </View>
                      )}
                    </View>

                    {/* Tabular Footer Actions */}
                    {ticket.status === 'open' && (
                      <View style={styles.ticketFooter}>
                        <Pressable style={[styles.actionBtn, styles.actionBtnEdit]} onPress={() => startEdit(ticket)}>
                          <Ionicons name="pencil" size={14} color={theme.colors.primary} />
                          <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Edit</Text>
                        </Pressable>
                        <Pressable style={[styles.actionBtn, styles.actionBtnDelete]} onPress={() => handleDelete(ticket)}>
                          <Ionicons name="trash" size={14} color={theme.colors.danger} />
                          <Text style={[styles.actionBtnText, { color: theme.colors.danger }]}>Delete</Text>
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
              <Pressable disabled={page <= 1} onPress={() => setPage((p) => p - 1)} hitSlop={6}>
                <Text style={[styles.pagerText, page <= 1 && styles.pagerTextDisabled]}>Previous</Text>
              </Pressable>
              <Text style={styles.pagerLabel}>
                Page {page} of {totalPages}
              </Text>
              <Pressable disabled={page >= totalPages} onPress={() => setPage((p) => p + 1)} hitSlop={6}>
                <Text style={[styles.pagerText, page >= totalPages && styles.pagerTextDisabled]}>Next</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.xl, paddingBottom: theme.spacing.xxl, gap: theme.spacing.xxl },
  flex1: { flex: 1 },

  // Hero (head office) card
  heroCard: {
    borderRadius: 24,
    padding: theme.spacing.xl,
    gap: 4,
  },
  heroIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroTitle: { fontSize: 19, fontWeight: '800', color: '#ffffff', marginTop: 2 },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.16)',
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: 10,
    borderRadius: 14,
    paddingHorizontal: 4,
  },
  heroRowPressed: { backgroundColor: 'rgba(255,255,255,0.08)' },
  heroRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroRowLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  heroRowValue: { fontSize: 14, fontWeight: '600', color: '#ffffff', marginTop: 2 },

  // Submit an issue card
  formCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 24,
    padding: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: theme.spacing.sm },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  sectionSubtitle: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  cancelPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: theme.colors.bg,
  },
  cancelLink: { fontSize: 12, fontWeight: '700', color: theme.colors.muted },
  fieldGroup: { gap: theme.spacing.xs },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: theme.colors.text,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.bg,
    borderRadius: 14,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 14,
    fontSize: 15,
    color: theme.colors.text,
  },
  inputMultiline: { minHeight: 110, textAlignVertical: 'top', paddingTop: 14 },
  submitButton: { marginTop: theme.spacing.xs },

  // Submitted issues list
  listSection: { gap: theme.spacing.lg },
  listTitle: { fontSize: 17, fontWeight: '800', color: theme.colors.text },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingRight: theme.spacing.xs },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceAlt,
  },
  filterPillActive: { backgroundColor: theme.colors.primary },
  filterPillText: { fontSize: 13, fontWeight: '600', color: theme.colors.muted },
  filterPillTextActive: { color: '#ffffff' },
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bg,
  },
  filterCountActive: { backgroundColor: 'rgba(255,255,255,0.22)' },
  filterCountText: { fontSize: 11, fontWeight: '700', color: theme.colors.muted },
  filterCountTextActive: { color: '#ffffff' },
  muted: { fontSize: 13, color: theme.colors.muted },
  error: { fontSize: 13, color: theme.colors.danger },
  emptyState: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.xxl,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 20,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: { fontSize: 13, color: theme.colors.muted },
  list: { gap: theme.spacing.md },
  
  // Refactored Tabular Tickets
  ticketCard: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    padding: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  ticketHeaderLeft: {
    flex: 1,
    paddingRight: theme.spacing.md,
    gap: 4,
  },
  ticketSubject: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: theme.colors.text 
  },
  ticketDate: { 
    fontSize: 12, 
    color: theme.colors.mutedLight 
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  ticketBody: { 
    marginTop: theme.spacing.xs,
  },
  ticketMessage: { 
    fontSize: 14, 
    color: theme.colors.muted, 
    lineHeight: 21 
  },
  adminNoteBox: { 
    marginTop: theme.spacing.md,
    backgroundColor: 'rgba(0,0,0,0.03)', 
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    borderRadius: 8, 
    padding: theme.spacing.md, 
    gap: 6 
  },
  adminNoteHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminNoteLabel: { fontSize: 13, fontWeight: '700', color: theme.colors.text },
  adminNoteText: { fontSize: 13, color: theme.colors.muted, lineHeight: 19 },
  
  // Tabular Action Buttons
  ticketFooter: { 
    flexDirection: 'row', 
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.sm, 
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  actionBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnEdit: {
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: theme.colors.bg,
  },
  actionBtnDelete: {
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  actionBtnText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },

  // Pagination
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: theme.spacing.xs },
  pagerLabel: { fontSize: 12, color: theme.colors.muted },
  pagerText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  pagerTextDisabled: { color: theme.colors.mutedLight },
});