'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Eye, EyeOff, KeyRound, Loader2, Save, UserCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/providers/auth-provider';
import { profileService } from '@/services/profile-service';

function initialsOf(first?: string | null, last?: string | null, email?: string | null): string {
  const a = first?.trim()?.[0];
  const b = last?.trim()?.[0];
  if (a || b) return `${a ?? ''}${b ?? ''}`.toUpperCase();
  return email?.trim()?.[0]?.toUpperCase() ?? '?';
}

function roleBadgeClass(role: string): string {
  switch (role) {
    case 'SUPER_ADMIN':
      return 'bg-amber-500/20 text-amber-500';
    case 'ADMIN':
      return 'bg-blue-500/20 text-blue-500';
    default:
      return 'bg-gray-500/20 text-gray-400';
  }
}

export default function ProfilePage() {
  const { user } = useAuth();

  // --- Profile card state ---
  const { data: me, isLoading, refetch } = useQuery({
    queryKey: ['my-profile'],
    queryFn: profileService.getMe,
  });

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Prefill from the fetched profile (falls back to auth context). Derived
  // values keep the inputs in sync with the query until the user edits them.
  const serverFirstName = me?.profile?.firstName ?? user?.profile.firstName ?? '';
  const serverLastName = me?.profile?.lastName ?? user?.profile.lastName ?? '';
  const [nameDirty, setNameDirty] = useState(false);
  const effectiveFirstName = nameDirty ? firstName : serverFirstName;
  const effectiveLastName = nameDirty ? lastName : serverLastName;

  const avatarUrl = useMemo(() => {
    if (avatarPreview) return avatarPreview;
    const raw = me?.profile?.avatarUrl;
    if (!raw) return null;
    return raw.startsWith('http') ? raw : `${process.env.NEXT_PUBLIC_API_URL || ''}${raw}`;
  }, [me, avatarPreview]);

  const onAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    setAvatarPreview(file ? URL.createObjectURL(file) : null);
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      await profileService.updateProfile(
        { firstName: effectiveFirstName.trim(), lastName: effectiveLastName.trim() },
        avatarFile,
      );
      toast.success('Profile updated');
      setFirstName(effectiveFirstName.trim());
      setLastName(effectiveLastName.trim());
      setAvatarFile(null);
      setAvatarPreview(null);
      await refetch();
    } catch (err) {
      const message =
        // @ts-expect-error axios error shape
        err?.response?.data?.message ?? 'Failed to update profile';
      toast.error(Array.isArray(message) ? message[0] : message);
    } finally {
      setSavingProfile(false);
    }
  };

  // --- Change password card state ---
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const pwError = useMemo(() => {
    if (!newPassword && !confirmPassword) return null;
    if (newPassword.length > 0 && newPassword.length < 8)
      return 'New password must be at least 8 characters';
    if (newPassword && confirmPassword && newPassword !== confirmPassword)
      return 'Passwords do not match';
    return null;
  }, [newPassword, confirmPassword]);

  const canChangePassword =
    currentPassword.length > 0 && newPassword.length >= 8 && newPassword === confirmPassword;

  const changePassword = async () => {
    if (!canChangePassword || pwError) return;
    setChangingPassword(true);
    try {
      await profileService.changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      const message =
        // @ts-expect-error axios error shape
        err?.response?.data?.message ?? 'Failed to change password';
      toast.error(typeof message === 'string' ? message : 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <UserCircle2 className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-outfit font-bold tracking-tight">Profile</h1>
          <p className="text-muted-foreground">Manage your account details and password.</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* --- Profile info --- */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Profile information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border border-border">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt="Avatar" /> : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initialsOf(
                    me?.profile?.firstName ?? user?.profile.firstName,
                    me?.profile?.lastName ?? user?.profile.lastName,
                    me?.email ?? user?.email,
                  )}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <Label htmlFor="avatar" className="cursor-pointer text-sm text-primary hover:underline">
                  Change photo
                </Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
                />
                {avatarFile && (
                  <p className="text-xs text-muted-foreground">{avatarFile.name}</p>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="h-24 animate-pulse rounded-lg bg-muted" />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={effectiveFirstName}
                      onChange={(e) => { setFirstName(e.target.value); setNameDirty(true); }}
                      placeholder="First name"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={effectiveLastName}
                      onChange={(e) => { setLastName(e.target.value); setNameDirty(true); }}
                      placeholder="Last name"
                    />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground break-all">
                      {me?.email ?? user?.email ?? '—'}
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Role</Label>
                    <div>
                      <Badge className={roleBadgeClass(me?.role ?? user?.role ?? '')}>
                        {me?.role ?? user?.role ?? '—'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </>
            )}

            <Button onClick={saveProfile} disabled={savingProfile || isLoading}>
              {savingProfile ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {savingProfile ? 'Saving…' : 'Save changes'}
            </Button>
          </CardContent>
        </Card>

        {/* --- Change password --- */}
        <Card className="border-border bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-primary" />
              Change password
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Current password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showCurrent ? 'Hide password' : 'Show password'}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showNew ? 'Hide password' : 'Show password'}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
              {pwError && <p className="text-xs text-destructive">{pwError}</p>}
            </div>

            <Button
              onClick={changePassword}
              disabled={!canChangePassword || Boolean(pwError) || changingPassword}
            >
              {changingPassword ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <KeyRound className="mr-2 h-4 w-4" />
              )}
              {changingPassword ? 'Changing…' : 'Change password'}
            </Button>

            <p className="text-xs text-muted-foreground">
              Changing your password keeps your current sessions; other devices stay logged in
              until their tokens expire.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
