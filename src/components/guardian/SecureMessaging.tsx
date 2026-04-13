import { useState } from 'react';
import {
  MessageSquareLock, Send, Shield, Hash, Users,
  Search, Lock, Key, ChevronRight, UserCircle, AlertCircle, Info
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { DMConversationList } from '@/components/dm/DMConversationList';
import { DMChatArea } from '@/components/dm/DMChatArea';
import { useDMContext } from '@/hooks/useDMContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { getAllAccounts, type UserAccount } from '@/lib/custodialKeys';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Teacher directory for "New Message" quick-start ─────────────────────────

interface TeacherContact {
  pubkey: string;
  npub: string;
  displayName: string;
  subject: string;
  email: string;
}

function getTeacherContacts(): TeacherContact[] {
  const accounts = getAllAccounts();
  return accounts
    .filter((a) => a.role === 'teacher' || a.role === 'admin')
    .map((a) => ({
      pubkey: a.keys.pubkey,
      npub: a.keys.npub,
      displayName: a.displayName,
      subject: a.school ?? 'Staff',
      email: a.email,
    }));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SecureMessaging() {
  const { account } = useCustodialAuth();
  const { user } = useCurrentUser();
  const isMobile = useIsMobile();
  const { conversations, isLoading: dmLoading } = useDMContext();

  const [selectedPubkey, setSelectedPubkey] = useState<string | null>(null);
  const [showDirectory, setShowDirectory] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  const teacherContacts = getTeacherContacts();
  const filteredContacts = teacherContacts.filter((t) =>
    t.displayName.toLowerCase().includes(directorySearch.toLowerCase()) ||
    t.subject.toLowerCase().includes(directorySearch.toLowerCase()) ||
    t.email.toLowerCase().includes(directorySearch.toLowerCase())
  );

  const myNpub = user?.pubkey ? nip19.npubEncode(user.pubkey) : '';
  const shortNpub = myNpub ? `${myNpub.slice(0, 14)}…${myNpub.slice(-6)}` : '';

  // Mobile: show either list or chat
  const showList = !isMobile || !selectedPubkey;
  const showChat = !isMobile || !!selectedPubkey;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <MessageSquareLock className="h-4 w-4 text-primary" />
            Secure Messaging
            <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">NIP-17</Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            End-to-end encrypted with your custodial Nostr key
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowDirectory(!showDirectory)}
          className="gap-1.5 text-xs"
        >
          <Users className="h-3.5 w-3.5" />
          {showDirectory ? 'Hide Directory' : 'New Message'}
        </Button>
      </div>

      {/* Key identity banner */}
      {user && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border text-xs">
          <Lock className="h-3.5 w-3.5 text-green-600 flex-shrink-0" />
          <span className="text-muted-foreground">Sending as:</span>
          <code className="font-mono text-primary flex-1 truncate">{shortNpub}</code>
          <Badge variant="secondary" className="text-[10px]">NIP-17 ✓</Badge>
        </div>
      )}

      {/* Teacher Directory (new message) */}
      {showDirectory && (
        <Card className="border-primary/20 animate-slide-up">
          <CardHeader className="pb-2 pt-4 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                School Staff Directory
              </CardTitle>
              <p className="text-xs text-muted-foreground">{filteredContacts.length} contacts</p>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search by name or subject…"
                className="pl-9 h-8 text-sm"
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
              />
            </div>

            {filteredContacts.length === 0 ? (
              <div className="text-center py-6">
                <UserCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground">
                  {teacherContacts.length === 0
                    ? 'No teachers registered yet. Teachers need to create accounts first.'
                    : 'No contacts match your search.'}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {filteredContacts.map((contact) => {
                  const initials = contact.displayName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                  const isSelected = selectedPubkey === contact.pubkey;
                  return (
                    <button
                      key={contact.pubkey}
                      className={cn(
                        'w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-all',
                        isSelected ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted border border-transparent'
                      )}
                      onClick={() => {
                        setSelectedPubkey(contact.pubkey);
                        setShowDirectory(false);
                      }}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{contact.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            <Alert className="py-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Key className="h-3.5 w-3.5 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                Messages are encrypted with <strong>NIP-17</strong> (gift-wrap + NIP-44). Only you and the recipient can read them.
                All messages are signed with the custodial key generated when you registered.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* DM Interface */}
      <Card className="border-border overflow-hidden">
        {conversations.length === 0 && !dmLoading && !selectedPubkey ? (
          /* Empty state */
          <CardContent className="py-10 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <MessageSquareLock className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-base">No messages yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
                Start a secure encrypted conversation with your child's teacher using NIP-17.
              </p>
            </div>
            <Button
              size="sm"
              onClick={() => setShowDirectory(true)}
              className="bg-gradient-oklahoma hover:opacity-90 text-white gap-2"
            >
              <Send className="h-4 w-4" />
              Message a Teacher
            </Button>

            <div className="pt-2">
              <Separator className="mb-3" />
              <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                {[
                  { icon: Shield, label: 'NIP-17 Encrypted' },
                  { icon: Key, label: 'Custodial Key Signed' },
                  { icon: Lock, label: 'Gift-Wrapped Privacy' },
                ].map((f) => (
                  <div key={f.label} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/30">
                    <f.icon className="h-4 w-4 text-primary/60" />
                    <span className="text-center leading-tight">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        ) : (
          /* Full DM interface */
          <div className="flex h-[520px]">
            {showList && (
              <div className={cn('border-r border-border', isMobile ? 'w-full' : 'w-72 flex-shrink-0')}>
                <DMConversationList
                  selectedPubkey={selectedPubkey}
                  onSelectConversation={(pk) => setSelectedPubkey(pk)}
                  className="h-full"
                />
              </div>
            )}
            {showChat && (
              <div className="flex-1 min-w-0">
                {selectedPubkey ? (
                  <DMChatArea
                    pubkey={selectedPubkey}
                    onBack={isMobile ? () => setSelectedPubkey(null) : undefined}
                    className="h-full"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-center px-6">
                    <div>
                      <MessageSquareLock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">Select a conversation</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        or click <strong>New Message</strong> to start a new encrypted thread
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Protocol legend */}
      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary/60" />
        <p>
          All messages use <strong>NIP-17</strong> (kind:14 encrypted note, kind:1059 gift wrap).
          Your custodial Nostr key — generated during account creation — is used to sign and decrypt every message.
          No message content is ever readable by relays or third parties.
        </p>
      </div>
    </div>
  );
}
