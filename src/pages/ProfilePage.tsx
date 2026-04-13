import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User, Shield, Settings, Eye, EyeOff, Copy, Download,
  CheckCircle2, AlertTriangle, Lock, Key, Info, RefreshCw,
  GraduationCap, School, Mail, Hash
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { updateAccount } from '@/lib/custodialKeys';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  displayName: z.string().min(2),
  school: z.string().min(2),
  grade: z.string().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Required'),
  newPassword: z.string().min(8, 'Min 8 characters').regex(/[A-Z]/).regex(/[0-9]/),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

function truncate(str: string, len = 20) {
  if (str.length <= len) return str;
  return str.slice(0, len / 2) + '...' + str.slice(-len / 2);
}

export default function ProfilePage() {
  useSeoMeta({ title: 'My Profile — Oklahoma K-12 Connect' });
  const { account, privkeyHex, refreshAccount } = useCustodialAuth();
  const { toast } = useToast();

  const [nsecVisible, setNsecVisible] = useState(false);
  const [nsecRevealed, setNsecRevealed] = useState(false);
  const [confirmReveal, setConfirmReveal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: account?.displayName ?? '',
      school: account?.school ?? '',
      grade: account?.grade ?? '',
    },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const pubkeyHex = account?.keys.pubkey ?? '';
  const npub = pubkeyHex ? nip19.npubEncode(pubkeyHex) : '';
  const nsec = privkeyHex ? nip19.nsecEncode(Uint8Array.from(Buffer.from(privkeyHex, 'hex'))) : '';

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    toast({ title: 'Copied!', description: `${field} copied to clipboard.` });
  };

  const exportNsec = () => {
    if (!nsec) return;
    const blob = new Blob([`# Oklahoma K-12 Connect — Digital Signature Key Export\n# KEEP THIS FILE SECRET — DO NOT SHARE\n# Generated: ${new Date().toISOString()}\n# Account: ${account?.email}\n\nNSEC: ${nsec}\nPUBKEY (npub): ${npub}\nPUBKEY (hex): ${pubkeyHex}\n`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ok_k12_key_${account?.email?.replace('@', '_at_') ?? 'export'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Key Exported', description: 'Store this file securely. Never share your nsec.' });
  };

  const onSaveProfile = (data: ProfileForm) => {
    if (!account) return;
    updateAccount(account.email, { displayName: data.displayName, school: data.school, grade: data.grade });
    refreshAccount();
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
    toast({ title: 'Profile Updated', description: 'Your profile has been saved.' });
  };

  const onChangePassword = async (data: PasswordForm) => {
    try {
      const { changePassword } = await import('@/lib/custodialKeys');
      if (!account) return;
      await changePassword(account.email, data.currentPassword, data.newPassword);
      setPasswordChanged(true);
      passwordForm.reset();
      setTimeout(() => setPasswordChanged(false), 4000);
      toast({ title: 'Password Changed', description: 'Your password and key encryption have been updated.' });
    } catch (err) {
      passwordForm.setError('currentPassword', {
        message: err instanceof Error ? err.message : 'Failed to change password.',
      });
    }
  };

  const initials = account?.displayName?.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  const roleBadgeVariant: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-800 border-purple-200',
    teacher: 'bg-blue-100 text-blue-800 border-blue-200',
    parent: 'bg-green-100 text-green-800 border-green-200',
    student: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in space-y-6">
        {/* Profile Header */}
        <div className="relative oklahoma-gradient rounded-2xl p-6 overflow-hidden isolate">
          <div className="hero-pattern absolute inset-0 -z-10" />
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-white/30 shadow-xl">
                <AvatarFallback className="text-2xl font-bold bg-accent text-accent-foreground">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-400 border-2 border-white" />
            </div>
            <div className="text-white">
              <h1 className="text-2xl font-bold">{account?.displayName}</h1>
              <p className="text-blue-200 text-sm">{account?.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-semibold capitalize', roleBadgeVariant[account?.role ?? 'student'])}>
                  {account?.role}
                </span>
                {account?.grade && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                    Grade {account.grade}
                  </span>
                )}
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/30">
                  {account?.school}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="profile">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* ─── PROFILE TAB ─── */}
          <TabsContent value="profile" className="space-y-5 mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>Update your name and school details.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="displayName">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="displayName" className="pl-10" {...profileForm.register('displayName')} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input value={account?.email ?? ''} disabled className="pl-10 bg-muted/50" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="school">School / District</Label>
                      <div className="relative">
                        <School className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="school" className="pl-10" {...profileForm.register('school')} />
                      </div>
                    </div>
                    {account?.role === 'student' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="grade">Grade Level</Label>
                        <div className="relative">
                          <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input id="grade" placeholder="e.g. 10th" className="pl-10" {...profileForm.register('grade')} />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <Button type="submit" className="bg-gradient-oklahoma hover:opacity-90 text-white">
                      {profileSaved ? <><CheckCircle2 className="h-4 w-4 mr-2" />Saved!</> : 'Save Changes'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SECURITY TAB ─── */}
          <TabsContent value="security" className="space-y-5 mt-5">

            {/* Info Banner */}
            <Alert className="border-primary/30 bg-primary/5">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                Your <strong>Digital School ID</strong> is a Nostr keypair generated automatically when you created your account.
                It cryptographically identifies you on the Oklahoma K-12 Connect network without exposing your personal data.
              </AlertDescription>
            </Alert>

            {/* Public School ID */}
            <Card className="border-blue-200 dark:border-blue-900">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Hash className="h-4 w-4 text-blue-600" />
                  Public School ID
                  <Badge variant="secondary" className="text-[10px] px-1.5 font-medium bg-blue-100 text-blue-700 border-blue-200">Safe to share</Badge>
                </CardTitle>
                <CardDescription>
                  Your unique public identifier on the network. This can be safely shared with teachers, parents, or administrators.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* npub */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">npub (Nostr Public Key — Bech32 Format)</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg font-mono break-all leading-relaxed">
                      {npub}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => copyToClipboard(npub, 'Public School ID (npub)')}
                    >
                      {copiedField === 'Public School ID (npub)' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* hex pubkey */}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Hex Public Key</Label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg font-mono break-all leading-relaxed">
                      {pubkeyHex}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      className="flex-shrink-0"
                      onClick={() => copyToClipboard(pubkeyHex, 'Hex Public Key')}
                    >
                      {copiedField === 'Hex Public Key' ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Key created date */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                  <Key className="h-3.5 w-3.5" />
                  <span>Key generated on {account?.keys.createdAt ? new Date(account.keys.createdAt).toLocaleDateString() : 'unknown'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Digital Signature Key (Private) */}
            <Card className="border-amber-200 dark:border-amber-900/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Lock className="h-4 w-4 text-amber-600" />
                  Digital Signature Key
                  <Badge className="text-[10px] px-1.5 bg-amber-100 text-amber-700 border-amber-200 font-medium">Private — Keep Secret</Badge>
                </CardTitle>
                <CardDescription>
                  Your private cryptographic key. <strong className="text-foreground">Never share this with anyone.</strong> It allows full control of your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!nsecRevealed ? (
                  <div className="rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-6 text-center">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                      <Lock className="h-6 w-6 text-amber-600" />
                    </div>
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-200 mb-1">Private Key Hidden</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300/70 mb-4 max-w-xs mx-auto">
                      Your Digital Signature Key is encrypted and securely stored. Click below to reveal it temporarily.
                    </p>
                    {!confirmReveal ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300"
                        onClick={() => setConfirmReveal(true)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Reveal Private Key
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <Alert variant="destructive" className="text-left">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription className="text-xs">
                            <strong>Warning:</strong> Make sure no one is watching your screen. Your private key grants full access to your account.
                          </AlertDescription>
                        </Alert>
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmReveal(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            className="bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => { setNsecRevealed(true); setNsecVisible(true); setConfirmReveal(false); }}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            I understand, show it
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Alert variant="destructive" className="py-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        Keep this key secret. Do not copy/paste it in public places or share it with anyone.
                      </AlertDescription>
                    </Alert>

                    {/* nsec display */}
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">nsec (Private Key — Bech32 Format)</Label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 text-xs bg-muted px-3 py-2 rounded-lg font-mono break-all leading-relaxed">
                          {nsecVisible ? nsec : '•'.repeat(Math.min(nsec.length, 60))}
                        </code>
                        <div className="flex flex-col gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => setNsecVisible(!nsecVisible)}
                            title={nsecVisible ? 'Hide' : 'Show'}
                          >
                            {nsecVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(nsec, 'Digital Signature Key (nsec)')}
                          >
                            {copiedField === 'Digital Signature Key (nsec)' ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={exportNsec}
                      >
                        <Download className="h-4 w-4" />
                        Export Key File
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 text-muted-foreground"
                        onClick={() => { setNsecRevealed(false); setNsecVisible(false); }}
                      >
                        <EyeOff className="h-4 w-4" />
                        Hide Key
                      </Button>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                      <p className="font-semibold text-foreground">About Key Export</p>
                      <p>Your nsec can be imported into any Nostr-compatible client (e.g., Damus, Amethyst, Prism). This allows you to use your Oklahoma K-12 identity outside this platform.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Change Password */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Change Password
                </CardTitle>
                <CardDescription>Changing your password re-encrypts your private key.</CardDescription>
              </CardHeader>
              <CardContent>
                {passwordChanged && (
                  <Alert className="mb-4 border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 text-sm">
                      Password changed successfully! Your key encryption has been updated.
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="space-y-4">
                  {(['currentPassword', 'newPassword', 'confirmPassword'] as const).map((field) => (
                    <div key={field} className="space-y-1.5">
                      <Label htmlFor={field}>
                        {field === 'currentPassword' ? 'Current Password' : field === 'newPassword' ? 'New Password' : 'Confirm New Password'}
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id={field} type="password" className="pl-10" {...passwordForm.register(field)} />
                      </div>
                      {passwordForm.formState.errors[field] && (
                        <p className="text-xs text-destructive">{passwordForm.formState.errors[field]?.message}</p>
                      )}
                    </div>
                  ))}
                  <Button type="submit" className="bg-gradient-oklahoma hover:opacity-90 text-white">
                    Update Password
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── SETTINGS TAB ─── */}
          <TabsContent value="settings" className="space-y-5 mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { label: 'New announcements', desc: 'Get notified when school posts announcements' },
                  { label: 'Assignment reminders', desc: 'Reminders 24h before due dates' },
                  { label: 'Grade updates', desc: 'When teachers post new grades' },
                  { label: 'Direct messages', desc: 'New messages from teachers or staff' },
                ].map((pref) => (
                  <div key={pref.label} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">{pref.label}</p>
                      <p className="text-xs text-muted-foreground">{pref.desc}</p>
                    </div>
                    <div className="w-10 h-5 rounded-full bg-primary flex items-center justify-end px-0.5 cursor-pointer">
                      <div className="w-4 h-4 rounded-full bg-white shadow" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Relay Connection</CardTitle>
                <CardDescription>Nostr relay this account is connected to.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <code className="text-xs font-mono text-primary flex-1">wss://beginningend.com</code>
                  <Badge variant="secondary" className="text-[10px]">Connected</Badge>
                </div>
              </CardContent>
            </Card>

            <Separator />
            <div className="text-center text-xs text-muted-foreground">
              <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:underline">
                Vibed with Shakespeare
              </a>
              {' • '}Oklahoma K-12 Connect
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
