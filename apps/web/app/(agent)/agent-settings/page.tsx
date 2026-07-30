'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  AreaUnit,
  COUNTRIES,
  getMaxPhoneDigits,
  PAKISTAN_CITIES,
  useAgentProfileViewModel,
  useAuthViewModel,
  usePreferencesViewModel,
} from '@jayedaad/core';
import {
  Button,
  Card,
  CardContent,
  CountryCodeSelect,
  Input,
  Label,
  Select,
  Switch,
} from '@jayedaad/ui-web';

const AREA_UNITS: AreaUnit[] = ['marla', 'kanal', 'sqyd', 'sqft', 'sqm', 'acre'];

// Stored values are a plain string (e.g. "+923001234567" or, from before this
// selector existed, bare digits with no country code at all). Parse back into
// a dial code + local number by matching the longest known dial code prefix,
// falling back to Pakistan so older un-prefixed data still displays sensibly.
function parsePhone(stored: string | null | undefined): { dialCode: string; number: string } {
  if (!stored) return { dialCode: '92', number: '' };
  if (stored.startsWith('+')) {
    const digits = stored.slice(1);
    const candidates = COUNTRIES.map((c) => c.dialCode.split(',')[0].replace(/\D/g, '')).filter((code) =>
      digits.startsWith(code),
    );
    const match = candidates.sort((a, b) => b.length - a.length)[0];
    if (match) return { dialCode: match, number: digits.slice(match.length) };
  }
  return { dialCode: '92', number: stored.replace(/\D/g, '') };
}

type SettingsTab = 'user' | 'preferences' | 'password';

const SUB_NAV: { id: SettingsTab; label: string }[] = [
  { id: 'user', label: 'User Settings' },
  { id: 'preferences', label: 'Preferences' },
  { id: 'password', label: 'Change Password' },
];

// Profolio Settings reference: left sub-nav switching between three
// independent panels — User Settings (agent_profiles), Preferences
// (user_preferences), Change Password (Supabase Auth only).
export default function AgentSettingsPage() {
  const [tab, setTab] = useState<SettingsTab>('user');

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
      <Card className="h-fit">
        <CardContent className="p-3">
          <nav className="space-y-1">
            {SUB_NAV.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors ${
                  tab === item.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </CardContent>
      </Card>

      {tab === 'user' && <UserSettingsPanel />}
      {tab === 'preferences' && <PreferencesPanel />}
      {tab === 'password' && <ChangePasswordPanel />}
    </div>
  );
}

function UserSettingsPanel() {
  const { user } = useAuthViewModel();
  const { profile, isLoading, updateProfile, uploadPhoto } = useAgentProfileViewModel();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    displayName: '',
    phone: '',
    phoneDialCode: '92',
    landline: '',
    landlineDialCode: '92',
    whatsapp: '',
    whatsappDialCode: '92',
    city: '',
    address: '',
  });

  useEffect(() => {
    if (!profile) return;
    const phone = parsePhone(profile.phone);
    const landline = parsePhone(profile.landline);
    const whatsapp = parsePhone(profile.whatsapp);
    setForm({
      displayName: profile.displayName ?? '',
      phone: phone.number,
      phoneDialCode: phone.dialCode,
      landline: landline.number,
      landlineDialCode: landline.dialCode,
      whatsapp: whatsapp.number,
      whatsappDialCode: whatsapp.dialCode,
      city: profile.city ?? '',
      address: profile.address ?? '',
    });
  }, [profile]);

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    updateProfile.mutate(
      {
        displayName: form.displayName,
        phone: form.phone ? `+${form.phoneDialCode.replace(/\D/g, '')}${form.phone}` : undefined,
        landline: form.landline ? `+${form.landlineDialCode.replace(/\D/g, '')}${form.landline}` : undefined,
        whatsapp: form.whatsapp ? `+${form.whatsappDialCode.replace(/\D/g, '')}${form.whatsapp}` : undefined,
        city: form.city,
        address: form.address,
      },
      {
        onSuccess: () => toast.success('Profile saved.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-4 p-6">
          {profile?.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.photoUrl} alt="" className="h-14 w-14 rounded-full object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-lg font-semibold text-muted-foreground">
              {(profile?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{profile?.displayName || user?.email}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                {profile?.agency ? 'Agency' : 'Individual'}
              </span>
            </div>
            <span className="text-sm text-muted-foreground">{user?.email}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-medium">Additional Information</h2>

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="displayName">Name</Label>
                <Input id="displayName" value={form.displayName} onChange={(e) => update('displayName', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email ?? ''} disabled className="bg-muted" />
              </div>
              <PhoneField
                label="Mobile"
                value={form.phone}
                onChange={(v) => update('phone', v)}
                dialCode={form.phoneDialCode}
                onDialCodeChange={(v) => update('phoneDialCode', v)}
              />
              <PhoneField
                label="Landline"
                value={form.landline}
                onChange={(v) => update('landline', v)}
                dialCode={form.landlineDialCode}
                onDialCodeChange={(v) => update('landlineDialCode', v)}
              />
              <PhoneField
                label="Whatsapp"
                value={form.whatsapp}
                onChange={(v) => update('whatsapp', v)}
                dialCode={form.whatsappDialCode}
                onDialCodeChange={(v) => update('whatsappDialCode', v)}
              />
              <div className="space-y-1.5">
                <Label htmlFor="city">City</Label>
                <Select id="city" value={form.city} onChange={(e) => update('city', e.target.value)}>
                  <option value="">Select City</option>
                  {PAKISTAN_CITIES.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="Enter Address" value={form.address} onChange={(e) => update('address', e.target.value)} />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Upload a picture</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      uploadPhoto.mutate(file, {
                        onSuccess: () => toast.success('Photo uploaded.'),
                        onError: () => toast.error('Upload failed — please try again.'),
                      });
                    }
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadPhoto.isPending}
                  className="w-full rounded-md border border-dashed border-input px-3 py-6 text-center text-sm text-muted-foreground hover:border-primary hover:text-primary"
                >
                  {uploadPhoto.isPending ? 'Uploading…' : 'Browse and Upload'}
                </button>
                {uploadPhoto.isError && <p className="text-sm text-destructive">Upload failed — please try again.</p>}
              </div>

              {/* Listings join agent_profiles live (see PUBLIC_LISTING_COLUMNS)
                  — a profile update already applies everywhere immediately. */}
              <p className="text-sm text-muted-foreground sm:col-span-2">
                Your profile details are shown live on all your listings.
              </p>
            </div>
          )}

          {updateProfile.isError && <p className="text-sm text-destructive">Something went wrong — please try again.</p>}
          {updateProfile.isSuccess && <p className="text-sm text-primary">Saved.</p>}

          <Button onClick={handleSave} disabled={updateProfile.isPending}>
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function PhoneField({
  label,
  value,
  onChange,
  dialCode,
  onDialCodeChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  dialCode: string;
  onDialCodeChange: (dialCode: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <CountryCodeSelect countries={COUNTRIES} value={dialCode} onChange={onDialCodeChange} className="w-[110px] shrink-0" />
        <Input
          type="tel"
          inputMode="numeric"
          placeholder="3XXXXXXXXX"
          value={value}
          maxLength={getMaxPhoneDigits(dialCode)}
          onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, getMaxPhoneDigits(dialCode)))}
          className="min-w-0 flex-1"
        />
      </div>
    </div>
  );
}

function PreferencesPanel() {
  const { preferences, isLoading, updatePreferences } = usePreferencesViewModel();

  if (isLoading || !preferences) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </CardContent>
      </Card>
    );
  }

  const toastOpts = {
    onSuccess: () => toast.success('Preferences updated.'),
    onError: () => toast.error('Something went wrong — please try again.'),
  };

  return (
    <Card>
      <CardContent className="space-y-6 p-6">
        <h2 className="font-medium">Preferences</h2>

        <ToggleRow
          label="Email Notification"
          description="Allow to receive email notifications"
          checked={preferences.emailNotifications}
          onCheckedChange={(checked) => updatePreferences.mutate({ emailNotifications: checked }, toastOpts)}
        />
        <ToggleRow
          label="Newsletters"
          description="Allow to stay updated and receive newsletter"
          checked={preferences.newsletters}
          onCheckedChange={(checked) => updatePreferences.mutate({ newsletters: checked }, toastOpts)}
        />
       

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="currency">Currency</Label>
            <Select
              id="currency"
              value={preferences.preferredCurrency}
              onChange={(e) => updatePreferences.mutate({ preferredCurrency: e.target.value }, toastOpts)}
            >
              <option value="PKR">PKR</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="areaUnit">Area Unit</Label>
            <Select
              id="areaUnit"
              value={preferences.preferredAreaUnit}
              onChange={(e) => updatePreferences.mutate({ preferredAreaUnit: e.target.value as AreaUnit }, toastOpts)}
            >
              {AREA_UNITS.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-4 last:border-b-0 last:pb-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function ChangePasswordPanel() {
  const { changePassword } = useAuthViewModel();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const mismatch = newPassword.length > 0 && confirmPassword.length > 0 && newPassword !== confirmPassword;

  function handleConfirm() {
    if (mismatch || !oldPassword || !newPassword) return;
    changePassword.mutate(
      { oldPassword, newPassword },
      {
        onSuccess: () => {
          setOldPassword('');
          setNewPassword('');
          setConfirmPassword('');
          toast.success('Password changed.');
        },
        onError: () => toast.error('Could not change password — check your old password.'),
      },
    );
  }

  return (
    <Card>
      <CardContent className="max-w-sm space-y-4 p-6">
        <PasswordField
          label="Enter Old Password"
          value={oldPassword}
          onChange={setOldPassword}
          visible={showOld}
          onToggleVisible={() => setShowOld((v) => !v)}
        />
        <PasswordField
          label="Enter New Password"
          value={newPassword}
          onChange={setNewPassword}
          visible={showNew}
          onToggleVisible={() => setShowNew((v) => !v)}
        />
        <PasswordField
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          visible={showConfirm}
          onToggleVisible={() => setShowConfirm((v) => !v)}
        />

        {mismatch && <p className="text-sm text-destructive">Passwords don&apos;t match.</p>}
        {changePassword.isError && <p className="text-sm text-destructive">Could not change password — check your old password.</p>}
        {changePassword.isSuccess && <p className="text-sm text-primary">Password changed.</p>}

        <Button onClick={handleConfirm} disabled={changePassword.isPending}>
          {changePassword.isPending ? 'Confirming…' : 'Confirm'}
        </Button>
      </CardContent>
    </Card>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  visible,
  onToggleVisible,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggleVisible: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pr-10"
        />
        <button
          type="button"
          onClick={onToggleVisible}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  );
}
