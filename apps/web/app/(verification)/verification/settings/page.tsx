'use client';

import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { useAccountProfileViewModel, useAuthViewModel } from '@jayedaad/core';
import { Button, Card, CardContent, Input, Label } from '@jayedaad/ui-web';
import { Camera, Loader2 } from 'lucide-react';
import { Reveal } from '@/components/Reveal';

// verification_staff's self-service profile page — reuses
// useAccountProfileViewModel (already fully built: profile/updateProfile/
// uploadPhoto, previously only consumed by apps/mobile's
// ProfileSettingsScreen, this is its first apps/web usage) and the same
// avatar-upload UI pattern as apps/web/app/(agent)/agent-settings/page.tsx's
// UserSettingsPanel, adapted with no agency-specific fields — this role has
// no agent_profiles row, only displayName/phone (OwnProfile's actual shape).
export default function VerificationSettingsPage() {
  const { user } = useAuthViewModel();
  const { profile, isLoading, updateProfile, uploadPhoto } = useAccountProfileViewModel();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({ displayName: '', phone: '' });

  useEffect(() => {
    if (!profile) return;
    setForm({ displayName: profile.displayName ?? '', phone: profile.phone ?? '' });
  }, [profile]);

  function handleSave() {
    updateProfile.mutate(
      { displayName: form.displayName, phone: form.phone || undefined },
      {
        onSuccess: () => toast.success('Profile saved.'),
        onError: () => toast.error('Something went wrong — please try again.'),
      },
    );
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhoto.mutate(file, {
        onSuccess: () => toast.success('Photo uploaded.'),
        onError: () => toast.error('Upload failed — please try again.'),
      });
    }
    e.target.value = '';
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Reveal>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Update your name, phone, and photo.</p>
        </div>
      </Reveal>

      <Reveal>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic"
              className="hidden"
              onChange={handleFileChange}
            />
            <motion.button
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-full"
              aria-label="Change profile photo"
            >
              {profile?.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.photoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-muted text-lg font-semibold text-muted-foreground">
                  {(profile?.displayName ?? user?.email ?? '?').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                {uploadPhoto.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                ) : (
                  <Camera className="h-5 w-5 text-white" />
                )}
              </span>
            </motion.button>
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{profile?.displayName || user?.email}</p>
              <p className="truncate text-xs text-muted-foreground">{profile?.email ?? user?.email}</p>
            </div>
          </CardContent>
        </Card>
      </Reveal>

      <Reveal>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={form.displayName}
                onChange={(e) => setForm((prev) => ({ ...prev, displayName: e.target.value }))}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                disabled={isLoading}
                placeholder="+92300…"
              />
            </div>
            <Button onClick={handleSave} disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>
      </Reveal>
    </div>
  );
}
