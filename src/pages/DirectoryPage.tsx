import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Users, Search, Mail, Hash, GraduationCap, Shield } from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/AppLayout';
import { getAllAccounts, type UserAccount } from '@/lib/custodialKeys';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { useToast } from '@/hooks/useToast';

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 border-purple-200',
  teacher: 'bg-blue-100 text-blue-700 border-blue-200',
  parent: 'bg-green-100 text-green-700 border-green-200',
  student: 'bg-amber-100 text-amber-700 border-amber-200',
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Shield className="h-3 w-3" />,
  teacher: <GraduationCap className="h-3 w-3" />,
  parent: <Users className="h-3 w-3" />,
  student: <GraduationCap className="h-3 w-3" />,
};

export default function DirectoryPage() {
  useSeoMeta({ title: 'Directory — Oklahoma K-12 Connect' });
  const { account: currentUser } = useCustodialAuth();
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const allAccounts = getAllAccounts();
  const filtered = allAccounts.filter((a) => {
    const matchSearch = a.displayName.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      (a.school ?? '').toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || a.role === roleFilter;
    return matchSearch && matchRole;
  });

  const copyPublicKey = async (pubkey: string, name: string) => {
    const npub = nip19.npubEncode(pubkey);
    await navigator.clipboard.writeText(npub);
    toast({ title: 'Copied!', description: `${name}'s Public School ID copied.` });
  };

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" />
            School Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {allAccounts.length} registered users
          </p>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or school..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {['student', 'parent', 'teacher', 'admin'].map((role) => (
              <Button
                key={role}
                variant={roleFilter === role ? 'default' : 'outline'}
                size="sm"
                className="capitalize"
                onClick={() => setRoleFilter(roleFilter === role ? null : role)}
              >
                {role}s
              </Button>
            ))}
          </div>
        </div>

        {/* Users */}
        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Users className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {allAccounts.length === 0
                  ? 'No users registered yet. Create an account to see the directory.'
                  : 'No users match your search.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {filtered.map((user: UserAccount) => {
              const initials = user.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
              const npub = user.keys.pubkey ? nip19.npubEncode(user.keys.pubkey) : '';
              const isMe = user.email === currentUser?.email;

              return (
                <Card key={user.email} className={`hover:shadow-md transition-all ${isMe ? 'border-primary/40 bg-primary/2' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-sm">{user.displayName}</p>
                          {isMe && <Badge variant="secondary" className="text-[10px] px-1.5">You</Badge>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge className={`text-[10px] px-1.5 py-0 gap-1 border capitalize ${ROLE_COLORS[user.role]}`}>
                            {ROLE_ICONS[user.role]}
                            {user.role}
                          </Badge>
                          {user.grade && (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              Grade {user.grade}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-1.5">
                          <Mail className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                        {npub && (
                          <div
                            className="flex items-center gap-1 mt-1 cursor-pointer hover:opacity-70 transition-opacity"
                            onClick={() => copyPublicKey(user.keys.pubkey, user.displayName)}
                          >
                            <Hash className="h-3 w-3 text-muted-foreground/50" />
                            <p className="text-[10px] text-muted-foreground/60 font-mono truncate">
                              {npub.slice(0, 12)}...{npub.slice(-8)}
                            </p>
                            <span className="text-[10px] text-primary/60 hover:text-primary">Copy</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
