import { useState } from 'react';
import { Linking, Pressable, ScrollView, SafeAreaView, Text, TextInput as RNTextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LEAD_STATUS_TRANSITIONS, LeadStatus, ReminderChannel, useLeadDetailViewModel, useLeadRemindersViewModel } from '@jayedaad/core';
import { Button, theme, useToast } from '@jayedaad/ui-native';
import { RootStackParamList } from '../navigation/RootNavigator';

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'negotiating', label: 'Negotiating' },
  { value: 'closed', label: 'Closed' },
  { value: 'lost', label: 'Lost' },
];

const CHANNEL_OPTIONS: { value: ReminderChannel; label: string }[] = [
  { value: 'in_app', label: 'In-app' },
  { value: 'push', label: 'Push' },
  { value: 'email', label: 'Email' },
];

const SOURCE_LABEL: Record<string, string> = {
  chatbot: 'Chatbot',
  contact_form: 'Contact form',
  call_request: 'Call request',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

// Previously nonexistent — AgentCRMScreen's row was the only place any lead
// data ever showed, with a single hardcoded "Mark Contacted" action and no
// way to see contact info, full status control, or notes. This is the real
// detail view: full contact info with working call/WhatsApp/email
// (Linking.openURL, same pattern as ProjectDetailScreen.tsx), every status
// transition, and the notes composer + history (addNote already existed in
// the shared viewmodel, just was never wired into any mobile screen).
export function LeadDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'LeadDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { leadId } = route.params;
  const { showToast } = useToast();
  const { lead, isLoading, isError, refetch, updateStatus, addNote } = useLeadDetailViewModel(leadId);
  const { reminders, create: createReminder, remove: removeReminder } = useLeadRemindersViewModel(leadId);
  const [noteDraft, setNoteDraft] = useState('');
  const [reminderDateText, setReminderDateText] = useState('');
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>('in_app');

  function changeStatus(status: LeadStatus) {
    if (!lead || status === lead.status) return;
    updateStatus.mutate(
      { status },
      {
        onSuccess: () => showToast(`Lead marked as ${status}.`),
        onError: (err: any) => showToast(err?.response?.data?.message || 'Something went wrong — please try again.', 'error'),
      },
    );
  }

  function submitNote() {
    const body = noteDraft.trim();
    if (!body) return;
    addNote.mutate(body, {
      onSuccess: () => {
        showToast('Note added.');
        setNoteDraft('');
      },
      onError: () => showToast('Something went wrong — please try again.', 'error'),
    });
  }

  // Same "plain text date/time, parsed via new Date(...)" convention as
  // CalendarScreen's "Add appointment" flow — no date-picker dependency.
  function submitReminder() {
    const parsed = new Date(reminderDateText);
    if (Number.isNaN(parsed.getTime())) {
      showToast('Enter a valid date/time, e.g. 2026-08-10 14:00', 'error');
      return;
    }
    createReminder.mutate(
      { remindAt: parsed.toISOString(), channel: reminderChannel },
      {
        onSuccess: () => {
          showToast('Reminder set.');
          setReminderDateText('');
        },
        onError: () => showToast('Something went wrong — please try again.', 'error'),
      },
    );
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loading}>Loading…</Text>
      </SafeAreaView>
    );
  }

  if (isError || !lead) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={32} color={theme.colors.muted} />
          <Text style={styles.errorText}>Couldn&apos;t load this lead.</Text>
          <Button label="Retry" variant="secondary" size="sm" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.name}>{lead.name}</Text>
        <Text style={styles.meta}>
          {SOURCE_LABEL[lead.source] ?? lead.source} · {formatDate(lead.createdAt)}
        </Text>

        <View style={styles.contactRow}>
          <Pressable style={styles.contactBtn} onPress={() => Linking.openURL(`tel:${lead.phone}`)}>
            <Ionicons name="call" size={18} color={theme.colors.bg} />
          </Pressable>
          <Pressable
            style={[styles.contactBtn, { backgroundColor: '#25D366' }]}
            onPress={() => Linking.openURL(`https://wa.me/${lead.phone.replace(/\D/g, '')}`)}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#fff" />
          </Pressable>
          <Pressable style={[styles.contactBtn, { backgroundColor: theme.colors.surfaceAlt }]} onPress={() => Linking.openURL(`mailto:${lead.email}`)}>
            <Ionicons name="mail" size={18} color={theme.colors.text} />
          </Pressable>
          <View style={styles.contactInfo}>
            <Text style={styles.contactInfoText}>{lead.phone}</Text>
            <Text style={styles.contactInfoText}>{lead.email}</Text>
          </View>
        </View>

        {lead.message ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Enquiry</Text>
            <Text style={styles.messageText}>{lead.message}</Text>
          </View>
        ) : null}

        {/* Exactly one of listingId/projectId is ever set (DB constraint —
            see the Lead model comment) — jumps straight to the actual
            listing/project this enquiry is about instead of leaving the
            agent to guess from the free-text message alone. Projects go
            through PostProject in view-only mode (not the public
            ProjectDetail screen, which needs a slug this lead doesn't
            have) — same screen MyProjectsScreen already uses to view one. */}
        {(lead.listingId || lead.projectId) && (
          <Pressable
            style={styles.propertyLink}
            onPress={() =>
              lead.listingId
                ? navigation.navigate('ListingDetail', { listingId: lead.listingId! })
                : navigation.navigate('PostProject', { editProjectId: lead.projectId!, viewOnly: true })
            }
          >
            <Ionicons name="business-outline" size={16} color={theme.colors.primary} />
            <Text style={styles.propertyLinkText}>View {lead.listingId ? 'listing' : 'project'}</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.colors.primary} />
          </Pressable>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          {/* closed/lost are terminal and contacted/negotiating can't go
              back to "new" — the API enforces this (leads.repository.ts's
              ALLOWED_STATUS_TRANSITIONS) and previously every chip stayed
              tappable regardless, so an invalid tap silently round-tripped
              into a 400 error toast. Graying out invalid targets up front
              stops that instead of reacting to the rejection after the fact. */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusRow}>
            {STATUS_OPTIONS.map((opt) => {
              const active = opt.value === lead.status;
              const disabled = updateStatus.isPending || (!active && !LEAD_STATUS_TRANSITIONS[lead.status].includes(opt.value));
              return (
                <Pressable
                  key={opt.value}
                  disabled={disabled}
                  style={[styles.statusChip, active && styles.statusChipActive, disabled && !active && styles.statusChipDisabled]}
                  onPress={() => changeStatus(opt.value)}
                >
                  <Text
                    style={[
                      styles.statusChipText,
                      active && styles.statusChipTextActive,
                      disabled && !active && styles.statusChipTextDisabled,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notes{lead.notes.length ? ` (${lead.notes.length})` : ''}</Text>
          {lead.notes.length > 0 && (
            <View style={styles.notesList}>
              {lead.notes.map((note) => (
                <View key={note.id} style={styles.noteCard}>
                  <View style={styles.noteIconWrap}>
                    <Ionicons name="document-text-outline" size={13} color={theme.colors.primary} />
                  </View>
                  <View style={styles.noteCardBody}>
                    <Text style={styles.noteBody}>{note.body}</Text>
                    <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.noteComposer}>
            <RNTextInput
              style={styles.noteComposerInput}
              value={noteDraft}
              onChangeText={setNoteDraft}
              placeholder="Add a note…"
              placeholderTextColor={theme.colors.mutedLight}
              multiline
            />
            <Pressable
              style={[styles.noteSendBtn, (!noteDraft.trim() || addNote.isPending) && styles.noteSendBtnDisabled]}
              disabled={!noteDraft.trim() || addNote.isPending}
              onPress={submitNote}
              hitSlop={6}
            >
              <Ionicons name="send" size={15} color={theme.colors.bg} />
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reminders{reminders.length ? ` (${reminders.length})` : ''}</Text>
          {reminders.length > 0 && (
            <View style={styles.notesList}>
              {reminders.map((r) => (
                <View key={r.id} style={styles.reminderRow}>
                  <Text style={[styles.reminderText, !!r.firedAt && styles.reminderTextFired]}>
                    {formatDate(r.remindAt)} · {CHANNEL_OPTIONS.find((c) => c.value === r.channel)?.label}
                  </Text>
                  {!r.firedAt && (
                    <Pressable onPress={() => removeReminder.mutate(r.id)} hitSlop={8}>
                      <Ionicons name="close" size={14} color={theme.colors.muted} />
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}
          <RNTextInput
            style={styles.input}
            value={reminderDateText}
            onChangeText={setReminderDateText}
            placeholder="2026-08-10 14:00"
            placeholderTextColor={theme.colors.mutedLight}
          />
          <View style={styles.channelRow}>
            {CHANNEL_OPTIONS.map((opt) => {
              const active = opt.value === reminderChannel;
              return (
                <Pressable
                  key={opt.value}
                  style={[styles.statusChip, active && styles.statusChipActive]}
                  onPress={() => setReminderChannel(opt.value)}
                >
                  <Text style={[styles.statusChipText, active && styles.statusChipTextActive]}>{opt.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            label="Set reminder"
            size="sm"
            disabled={!reminderDateText.trim() || createReminder.isPending}
            onPress={submitReminder}
            style={styles.setReminderButton}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  loading: { color: theme.colors.muted, textAlign: 'center', marginTop: theme.spacing.xl },
  errorState: { alignItems: 'center', justifyContent: 'center', flex: 1, gap: theme.spacing.sm },
  errorText: { color: theme.colors.muted },
  name: { fontSize: 22, fontWeight: '700', color: theme.colors.text },
  meta: { fontSize: 12, color: theme.colors.muted, marginTop: 2 },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginTop: theme.spacing.md },
  contactBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
  },
  contactInfo: { marginLeft: theme.spacing.xs, gap: 2 },
  contactInfoText: { fontSize: 12, color: theme.colors.muted },
  section: { marginTop: theme.spacing.xl },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: theme.colors.text, marginBottom: theme.spacing.sm },
  messageText: { fontSize: 14, color: theme.colors.text, lineHeight: 20 },
  propertyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: theme.spacing.sm,
  },
  propertyLinkText: { fontSize: 13, fontWeight: '600', color: theme.colors.primary },
  statusRow: { flexDirection: 'row', gap: theme.spacing.sm, paddingRight: theme.spacing.lg },
  statusChip: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 999,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
  },
  statusChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  statusChipDisabled: { opacity: 0.4 },
  statusChipText: { fontSize: 12, fontWeight: '600', color: theme.colors.muted },
  statusChipTextActive: { color: theme.colors.bg },
  statusChipTextDisabled: { color: theme.colors.mutedLight },
  notesList: { gap: theme.spacing.sm, marginBottom: theme.spacing.md },
  noteCard: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  noteIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  noteCardBody: { flex: 1, gap: 2 },
  noteBody: { fontSize: 13, color: theme.colors.text, lineHeight: 18 },
  noteDate: { fontSize: 10.5, color: theme.colors.muted },
  noteComposer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.inputBorder,
    borderRadius: theme.radius.md + 6,
    paddingLeft: theme.spacing.md,
    paddingRight: 6,
    paddingVertical: 6,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  noteComposerInput: {
    flex: 1,
    fontSize: 13.5,
    color: theme.colors.text,
    maxHeight: 90,
    minHeight: 36,
    paddingVertical: 8,
  },
  noteSendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 1,
  },
  noteSendBtnDisabled: { backgroundColor: theme.colors.mutedLight },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 8,
  },
  reminderText: { fontSize: 12, color: theme.colors.text },
  reminderTextFired: { color: theme.colors.muted, textDecorationLine: 'line-through' },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 10,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 10,
    fontSize: 13,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  channelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm, marginBottom: theme.spacing.sm },
  setReminderButton: { alignSelf: 'flex-start' },
});
