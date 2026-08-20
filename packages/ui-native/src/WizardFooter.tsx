import { View, StyleSheet } from 'react-native';
import { Button } from './Button';
import { theme } from './theme';

export interface WizardFooterProps {
  onBack: () => void;
  backDisabled: boolean;
  isLastStep: boolean;
  onContinue: () => void;
  continueDisabled: boolean;
  continueLabel?: string;
  // Last-step-only actions — a wizard's final step swaps "Continue" for the
  // real submit actions instead of advancing further.
  onSaveDraft?: () => void;
  saveDraftLabel?: string;
  onSubmit?: () => void;
  submitLabel?: string;
  submitDisabled?: boolean;
}

// Shared Back/Continue/(Save Draft)/(Submit) bar for the Post Listing/Post
// Project step wizards — fixed at the screen bottom, outside the per-step
// scroll area. "Back" uses Button's new variant="outline" rather than
// variant="secondary" — secondary is a gold gradient already used for Save
// as Draft/Add Features elsewhere on these same screens, which would clash
// if reused here.
export function WizardFooter({
  onBack,
  backDisabled,
  isLastStep,
  onContinue,
  continueDisabled,
  continueLabel = 'Continue',
  onSaveDraft,
  saveDraftLabel = 'Save as Draft',
  onSubmit,
  submitLabel = 'Submit',
  submitDisabled,
}: WizardFooterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <View style={styles.flex1}>
          <Button label="Back" variant="outline" onPress={onBack} disabled={backDisabled} style={styles.fullWidthButton} />
        </View>
        {isLastStep ? (
          <>
            {onSaveDraft && (
              <View style={styles.flex1}>
                <Button
                  label={saveDraftLabel}
                  variant="secondary"
                  onPress={onSaveDraft}
                  disabled={submitDisabled}
                  style={styles.fullWidthButton}
                />
              </View>
            )}
            <View style={styles.flex1}>
              <Button
                label={submitLabel}
                variant="primary"
                onPress={onSubmit}
                disabled={submitDisabled}
                style={styles.fullWidthButton}
              />
            </View>
          </>
        ) : (
          <View style={styles.flex1}>
            <Button
              label={continueLabel}
              variant="primary"
              onPress={onContinue}
              disabled={continueDisabled}
              style={styles.fullWidthButton}
            />
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.figma.border,
    backgroundColor: theme.colors.figma.surface,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.lg,
  },
  row: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  flex1: { flex: 1, minWidth: 100 },
  // Overrides Button's own fixed 249-wide sizing — this footer needs each
  // button to fill its flex:1 wrapping View instead (2-3 buttons sharing
  // one row never fit at a fixed 249 width each on a phone screen). Height
  // matches Button's own default (48) instead of the old 44 override.
  fullWidthButton: { width: '100%', height: 48 },
});
