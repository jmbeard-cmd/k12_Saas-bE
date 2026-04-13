import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Users, Key, Search, MoreVertical, Lock, Unlock,
  AlertTriangle, CheckCircle2, Clock, UserCheck, RefreshCw,
  Download, Eye, EyeOff, Copy, X, Hash
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { AppLayout } from '@/components/AppLayout';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { getAllAccounts, type UserAccount } from '@/lib/custodialKeys';
import { useToast } from '@/hooks/useToast';

interface RecoveryRequest {
  id: string;
  userEmail: string;
  userName: string;
  requestedAt: string;
  status: 'pending' | 'in_progress' | 'resolved';
  notes: string;
}

const MOCK_RECOVERY_REQUESTS: RecoveryRequest[] = [
  {
    id: 'r1',
    userEmail: 'parent.smith@gmail.com',
    userName: 'Sarah Smith',
    requestedAt: '2026-04-13T09:00:00Z',
    status: 'pending',
    notes: 'Parent forgot password, cannot access child enrollment records.',
  },
  {
    id: 'r2',
    userEmail: 'john.doe@student.ok.edu',
    userName: 'John Doe',
    requestedAt: '2026-04-12T15:30:00Z',
    status: 'in_progress',
    notes: 'Student changed device, session expired. Needs key re-export.',
  },
  {
    id: 'r3',
    userEmail: 'teacher.brown@okschool.edu',
    userName: 'Patricia Brown',
    requestedAt: '2026-04-11T11:00:00Z',
    status: 'resolved',
    notes: 'Password reset completed successfully.',
  },
];

function RecoveryWorkflowModal({
  open,
  onClose,
  targetAccount,
}: {
  open: boolean;
  onClose: () => void;
  targetAccount: UserAccount | null;
}) {
  const { account: adminAccount } = useCustodialAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'confirm' | 'new_password' | 'done'>('confirm');
  const [adminPassword, setAdminPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showAdminPw, setShowAdminPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tempNsec, setTempNsec] = useState('');
  const [nsecVisible, setNsecVisible] = useState(false);

  const reset = () => {
    setStep('confirm');
    setAdminPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setTempNsec('');
    setNsecVisible(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleResetPassword = async () => {
    if (!adminAccount || !targetAccount) return;
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const { adminResetPassword } = await import('@/lib/custodialKeys');
      await adminResetPassword(adminAccount.email, adminPassword, targetAccount.email, newPassword);

      // Generate a temporary display-only nsec based on the target's public key info
      const pubkey = targetAccount.keys.pubkey;
      const npub = nip19.npubEncode(pubkey);
      setTempNsec(npub); // We show the npub as confirmation, not the actual nsec
      setStep('done');
      toast({ title: 'Recovery Initiated', description: `Password reset for ${targetAccount.displayName}. The recovery request has been logged.` });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed. Check admin credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!targetAccount) return null;
  const initials = targetAccount.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-5 w-5 text-amber-500" />
            Key Recovery Workflow
          </DialogTitle>
          <DialogDescription>
            Admin-assisted account recovery for a locked-out user.
          </DialogDescription>
        </DialogHeader>

        {/* Target User */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-sm">{targetAccount.displayName}</p>
            <p className="text-xs text-muted-foreground">{targetAccount.email}</p>
          </div>
          <Badge variant="outline" className="ml-auto text-xs capitalize">{targetAccount.role}</Badge>
        </div>

        <Separator />

        {step === 'confirm' && (
          <div className="space-y-4">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                This action will initiate a password reset for this user. You must verify your admin credentials. All recovery actions are logged.
              </AlertDescription>
            </Alert>
            <div className="space-y-1.5">
              <Label htmlFor="admin-password">Your Admin Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type={showAdminPw ? 'text' : 'password'}
                  className="pl-10 pr-10"
                  placeholder="Verify your identity"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowAdminPw(!showAdminPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showAdminPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              onClick={() => {
                if (!adminPassword) { setError('Admin password is required.'); return; }
                setError('');
                setStep('new_password');
              }}
            >
              Verify & Continue
            </Button>
          </div>
        )}

        {step === 'new_password' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Set a temporary password for <strong>{targetAccount.displayName}</strong>. Instruct them to change it after logging in.
            </p>
            <div className="space-y-1.5">
              <Label htmlFor="new-password">New Temporary Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="new-password"
                  type={showNewPw ? 'text' : 'password'}
                  className="pl-10 pr-10"
                  placeholder="Min 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-new-password">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirm-new-password"
                  type="password"
                  className="pl-10"
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep('confirm')} className="flex-1">Back</Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
                onClick={handleResetPassword}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'done' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg">Recovery Initiated</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Password reset has been logged. Provide the user with their temporary password securely.
              </p>
            </div>

            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">User's Public School ID (npub)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-muted px-2 py-1.5 rounded break-all">
                  {nsecVisible ? tempNsec : tempNsec.slice(0, 20) + '...' + tempNsec.slice(-8)}
                </code>
                <Button size="icon" variant="ghost" onClick={() => setNsecVisible(!nsecVisible)}>
                  {nsecVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                This recovery has been logged with timestamp and admin ID for audit purposes. The user should change their password immediately after login.
              </AlertDescription>
            </Alert>
            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function AdminPage() {
  useSeoMeta({ title: 'Admin Panel — Oklahoma K-12 Connect' });
  const { account } = useCustodialAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [allAccounts, setAllAccounts] = useState<UserAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [recoveryTarget, setRecoveryTarget] = useState<UserAccount | null>(null);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [requests, setRequests] = useState<RecoveryRequest[]>(MOCK_RECOVERY_REQUESTS);

  useEffect(() => {
    if (account?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    setAllAccounts(getAllAccounts());
  }, [account, navigate]);

  const filteredAccounts = allAccounts.filter((a) =>
    a.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    total: allAccounts.length,
    students: allAccounts.filter((a) => a.role === 'student').length,
    parents: allAccounts.filter((a) => a.role === 'parent').length,
    teachers: allAccounts.filter((a) => a.role === 'teacher').length,
    admins: allAccounts.filter((a) => a.role === 'admin').length,
    pendingRecovery: requests.filter((r) => r.status === 'pending').length,
  };

  const copyPubkey = async (pubkey: string) => {
    await navigator.clipboard.writeText(nip19.npubEncode(pubkey));
    toast({ title: 'Copied!', description: 'Public key copied to clipboard.' });
  };

  const resolveRequest = (id: string) => {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status: 'resolved' } : r));
    toast({ title: 'Request Resolved', description: 'Recovery request marked as resolved.' });
  };

  const roleBadge: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    teacher: 'bg-blue-100 text-blue-700 border-blue-200',
    parent: 'bg-green-100 text-green-700 border-green-200',
    student: 'bg-amber-100 text-amber-700 border-amber-200',
  };

  const requestStatusBadge: Record<string, { label: string; class: string }> = {
    pending: { label: 'Pending', class: 'bg-red-100 text-red-700' },
    in_progress: { label: 'In Progress', class: 'bg-amber-100 text-amber-700' },
    resolved: { label: 'Resolved', class: 'bg-green-100 text-green-700' },
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div className="relative oklahoma-gradient rounded-2xl p-6 overflow-hidden isolate">
          <div className="hero-pattern absolute inset-0 -z-10" />
          <div className="flex items-center gap-4 text-white">
            <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 flex-shrink-0">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <p className="text-blue-200 text-sm">Manage accounts, monitor activity, and handle key recovery.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Users', value: stats.total, color: 'text-foreground' },
            { label: 'Students', value: stats.students, color: 'text-amber-600' },
            { label: 'Parents', value: stats.parents, color: 'text-green-600' },
            { label: 'Teachers', value: stats.teachers, color: 'text-blue-600' },
            { label: 'Admins', value: stats.admins, color: 'text-purple-600' },
            { label: 'Recovery Requests', value: stats.pendingRecovery, color: 'text-red-600' },
          ].map((s) => (
            <Card key={s.label} className="text-center shadow-sm">
              <CardContent className="p-4">
                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="users">
          <TabsList className="grid grid-cols-3 max-w-sm">
            <TabsTrigger value="users">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="recovery">
              <Key className="h-4 w-4 mr-2" />
              Recovery
              {stats.pendingRecovery > 0 && (
                <Badge className="ml-1.5 text-[9px] px-1.5 py-0 bg-destructive text-white">{stats.pendingRecovery}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit">
              <Clock className="h-4 w-4 mr-2" />
              Audit Log
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-5">
            <Card>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <div>
                    <CardTitle className="text-base">User Directory</CardTitle>
                    <CardDescription>All registered accounts in the system.</CardDescription>
                  </div>
                  <div className="sm:ml-auto relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-10 w-full sm:w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {filteredAccounts.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">{searchQuery ? 'No users match your search' : 'No users registered yet'}</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredAccounts.map((user) => {
                      const initials = user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                      const npub = user.keys.pubkey ? nip19.npubEncode(user.keys.pubkey) : '';
                      return (
                        <div key={user.email} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">{user.displayName}</p>
                              <Badge className={`text-[10px] px-1.5 py-0 border capitalize ${roleBadge[user.role]}`}>
                                {user.role}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                            {npub && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Hash className="h-3 w-3 text-muted-foreground/50" />
                                <p className="text-[10px] text-muted-foreground/60 font-mono truncate max-w-[200px]">
                                  {npub.slice(0, 16)}...{npub.slice(-8)}
                                </p>
                              </div>
                            )}
                          </div>
                          <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 px-2 text-xs"
                              onClick={() => copyPubkey(user.keys.pubkey)}
                            >
                              <Copy className="h-3.5 w-3.5 mr-1" />
                              Copy ID
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2 text-xs border-amber-200 text-amber-700 hover:bg-amber-50"
                              onClick={() => { setRecoveryTarget(user); setRecoveryModalOpen(true); }}
                            >
                              <Key className="h-3.5 w-3.5 mr-1" />
                              Recovery
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recovery Tab */}
          <TabsContent value="recovery" className="mt-5 space-y-4">
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <Key className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                <strong>Key Recovery Workflow:</strong> When a parent, student, or teacher is locked out, use this panel to initiate an admin-assisted password reset. All actions are logged for compliance.
              </AlertDescription>
            </Alert>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  Recovery Requests
                </CardTitle>
                <CardDescription>Pending recovery requests from locked-out users.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {requests.map((req) => {
                    const statusInfo = requestStatusBadge[req.status];
                    const matchingAccount = allAccounts.find((a) => a.email === req.userEmail) ?? null;
                    return (
                      <div key={req.id} className="px-6 py-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-9 w-9 flex-shrink-0">
                              <AvatarFallback className="text-xs font-bold">
                                {req.userName.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{req.userName}</p>
                              <p className="text-xs text-muted-foreground">{req.userEmail}</p>
                              <p className="text-xs text-muted-foreground mt-1">{req.notes}</p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <Badge className={`text-[10px] px-1.5 ${statusInfo.class}`}>{statusInfo.label}</Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(req.requestedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {req.status !== 'resolved' && (
                          <div className="flex gap-2 pt-1">
                            <Button
                              size="sm"
                              className="h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
                              onClick={() => {
                                if (matchingAccount) {
                                  setRecoveryTarget(matchingAccount);
                                  setRecoveryModalOpen(true);
                                } else {
                                  toast({ title: 'User not found', description: 'This user has not registered in the system yet.' });
                                }
                              }}
                            >
                              <Key className="h-3 w-3 mr-1" />
                              Begin Recovery
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs"
                              onClick={() => resolveRequest(req.id)}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Mark Resolved
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Manual Recovery */}
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  Manual Recovery by Email
                </CardTitle>
                <CardDescription>Find a user by email and begin the recovery process.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Enter user email..."
                      className="pl-10"
                      id="recovery-search"
                    />
                  </div>
                  <Button
                    className="bg-gradient-oklahoma hover:opacity-90 text-white"
                    onClick={() => {
                      const input = document.getElementById('recovery-search') as HTMLInputElement;
                      const email = input?.value?.toLowerCase().trim();
                      const found = allAccounts.find((a) => a.email === email);
                      if (found) {
                        setRecoveryTarget(found);
                        setRecoveryModalOpen(true);
                      } else {
                        toast({
                          title: 'User not found',
                          description: `No account found for "${email}". Verify the email and try again.`,
                          variant: 'destructive',
                        });
                      }
                    }}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Start Recovery
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Log Tab */}
          <TabsContent value="audit" className="mt-5">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Audit Log
                </CardTitle>
                <CardDescription>Recent admin actions and security events.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {[
                  { action: 'Key Recovery Initiated', user: 'Patricia Brown', admin: account?.displayName ?? 'Admin', time: '5 min ago', type: 'recovery' },
                  { action: 'New User Registered', user: 'Marcus Johnson', admin: 'System', time: '2h ago', type: 'register' },
                  { action: 'Admin Login', user: account?.displayName ?? 'Admin', admin: 'System', time: '2h ago', type: 'login' },
                  { action: 'Password Changed', user: 'Sarah Thompson', admin: 'Self', time: '1d ago', type: 'password' },
                  { action: 'Key Recovery Resolved', user: 'John Doe', admin: account?.displayName ?? 'Admin', time: '1d ago', type: 'recovery' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3 border-b last:border-0 hover:bg-muted/20">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      log.type === 'recovery' ? 'bg-amber-400' :
                      log.type === 'register' ? 'bg-green-400' :
                      log.type === 'login' ? 'bg-blue-400' : 'bg-muted-foreground/50'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{log.action}</p>
                      <p className="text-xs text-muted-foreground">User: {log.user} • By: {log.admin}</p>
                    </div>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{log.time}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <RecoveryWorkflowModal
        open={recoveryModalOpen}
        onClose={() => setRecoveryModalOpen(false)}
        targetAccount={recoveryTarget}
      />
    </AppLayout>
  );
}
