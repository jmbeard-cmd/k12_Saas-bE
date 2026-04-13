import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import {
  Camera, Shield, Heart,
  Star, Trophy, BookOpen,
  ChevronRight, Award, Lock, Link2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AppLayout } from '@/components/AppLayout';
import { GuardianMediaFeed } from '@/components/guardian/GuardianMediaFeed';
import { StudentProgressPanel } from '@/components/guardian/StudentProgressPanel';
import { SecureMessaging } from '@/components/guardian/SecureMessaging';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';

// ─── Milestone data ───────────────────────────────────────────────────────────

const MILESTONES = [
  { student: 'Elijah', title: 'Science Fair 1st Place', icon: Award, color: 'bg-amber-100 text-amber-600', date: 'Apr 2' },
  { student: 'Zoe', title: 'Read 25 Books!', icon: BookOpen, color: 'bg-emerald-100 text-emerald-600', date: 'Apr 1' },
  { student: 'Zoe', title: 'Perfect Attendance Q3', icon: Star, color: 'bg-blue-100 text-blue-600', date: 'Mar 30' },
  { student: 'Elijah', title: 'Robotics Club Captain', icon: Trophy, color: 'bg-purple-100 text-purple-600', date: 'Mar 20' },
];

const STUDENTS = [
  {
    id: '1',
    name: 'Elijah',
    grade: '5th Grade',
    school: 'Lincoln Elementary',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=elijah&backgroundColor=b6e3f4',
    attendance: 97,
    gpa: 3.7,
    color: 'bg-blue-50 border-blue-200',
    accent: 'text-blue-600',
  },
  {
    id: '2',
    name: 'Zoe',
    grade: '3rd Grade',
    school: 'Lincoln Elementary',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=zoe&backgroundColor=ffd5dc',
    attendance: 100,
    gpa: 3.9,
    color: 'bg-pink-50 border-pink-200',
    accent: 'text-pink-600',
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function GuardianPortalPage() {
  useSeoMeta({ title: 'Guardian Portal — Oklahoma K-12 Connect' });

  const { account } = useCustodialAuth();
  const navigate = useNavigate();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Redirect non-parents
  if (account && account.role !== 'parent' && account.role !== 'admin') {
    return (
      <AppLayout>
        <div className="p-8 max-w-lg mx-auto">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              The Guardian Portal is for parents and guardians only. Teachers can view the Teacher Tools dashboard.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  const selectedStudent = STUDENTS.find((s) => s.id === selectedStudentId) ?? null;
  const npub = account?.keys.npub ?? '';
  const shortNpub = npub ? `${npub.slice(0, 14)}…${npub.slice(-6)}` : '';
  const firstName = account?.displayName?.split(' ')[0] ?? 'Parent';

  const today = new Date();
  const hour = today.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in space-y-6">

        {/* ── Hero ── */}
        <div className="relative oklahoma-gradient rounded-2xl p-6 lg:p-8 overflow-hidden isolate">
          <div className="hero-pattern absolute inset-0 -z-10" />
          <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full bg-white/5 translate-x-1/4 translate-y-1/4 -z-10" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-4 w-4 text-rose-300" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Guardian Portal</Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">
                {greeting}, {firstName}! 👋
              </h1>
              <p className="text-blue-200 text-sm">
                Your children's school journey, all in one secure place.
              </p>
              {/* Nostr identity */}
              {npub && (
                <div className="flex items-center gap-2 mt-3 text-xs">
                  <Lock className="h-3 w-3 text-green-300" />
                  <code className="font-mono text-blue-200/80 truncate max-w-[260px]">{shortNpub}</code>
                  <Badge className="bg-white/15 text-white border-white/20 text-[10px]">NIP-17 Ready</Badge>
                </div>
              )}
            </div>

            {/* Student quick-stats */}
            <div className="flex gap-3 flex-wrap">
              {STUDENTS.map((student) => (
                <button
                  key={student.id}
                  onClick={() => setSelectedStudentId(selectedStudentId === student.id ? null : student.id)}
                  className={cn_plain(
                    'text-center rounded-xl px-4 py-3 border transition-all',
                    selectedStudentId === student.id
                      ? 'bg-white/25 border-white/50 shadow-lg scale-105'
                      : 'bg-white/10 border-white/20 hover:bg-white/15'
                  )}
                >
                  <Avatar className="h-10 w-10 mx-auto mb-1 border-2 border-white/30">
                    <AvatarImage src={student.avatar} />
                    <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                      {student.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white font-bold text-sm">{student.name}</div>
                  <div className="text-blue-200 text-[10px]">{student.grade}</div>
                  <div className="text-accent text-xs font-semibold mt-1">{student.gpa} GPA</div>
                </button>
              ))}
              {/* Stats */}
              <div className="flex flex-col justify-between gap-1.5">
                {[
                  { label: 'Combined GPA', value: '3.8', icon: Star },
                  { label: 'Milestones', value: `${MILESTONES.length}`, icon: Trophy },
                ].map((s) => (
                  <div key={s.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/20 flex items-center gap-2.5">
                    <s.icon className="h-4 w-4 text-accent" />
                    <div>
                      <div className="text-white font-bold text-sm leading-none">{s.value}</div>
                      <div className="text-blue-200 text-[10px]">{s.label}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Selected student banner ── */}
        {selectedStudent && (
          <Card className={`border-2 ${selectedStudent.color} animate-slide-up`}>
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-white shadow-sm flex-shrink-0">
                <AvatarImage src={selectedStudent.avatar} />
                <AvatarFallback className="bg-primary text-white font-bold">{selectedStudent.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-bold text-xl">{selectedStudent.name}</h2>
                  <Badge variant="secondary">{selectedStudent.grade}</Badge>
                  <Badge variant="outline" className="text-xs">{selectedStudent.school}</Badge>
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Attendance</span>
                    <div className="flex items-center gap-1.5">
                      <Progress value={selectedStudent.attendance} className="h-1.5 w-20" />
                      <span className={`text-xs font-bold ${selectedStudent.accent}`}>{selectedStudent.attendance}%</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">GPA</span>
                    <p className={`text-sm font-bold ${selectedStudent.accent}`}>{selectedStudent.gpa}</p>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 text-xs"
                onClick={() => setSelectedStudentId(null)}
              >
                Clear filter
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── bE Brand Bar ── */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-[hsl(226,71%,20%)] to-[hsl(226,71%,28%)] text-white border border-[hsl(226,71%,30%)]">
          <img src="/bE_logo.svg" alt="bE" className="h-6 w-auto invert brightness-[5]" />
          <div className="flex-1">
            <p className="text-xs font-semibold">bE Family Portal</p>
            <p className="text-[10px] text-blue-200/70">Integrated from be-parents-portal · Secure, Nostr-native media &amp; academic data</p>
          </div>
          <Badge className="bg-white/15 text-white border-white/20 text-[10px] flex-shrink-0">
            Connected
          </Badge>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── LEFT: Media Feed + Milestones ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Media Feed (compact — shows first 6 items) */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4 text-primary" />
                    Media Feed
                    <Badge variant="outline" className="text-[10px] gap-1">
                      <Link2 className="h-2.5 w-2.5" />
                      Assignment Linked
                    </Badge>
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-primary gap-1"
                    onClick={() => navigate('/guardian/media')}
                  >
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <GuardianMediaFeed
                  studentName={selectedStudent?.name}
                  compact={true}
                  onViewAll={() => navigate('/guardian/media')}
                />
              </CardContent>
            </Card>

            {/* Milestones */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    Recent Milestones
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs text-primary gap-1">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid sm:grid-cols-2 gap-2 pt-0">
                {MILESTONES
                  .filter((m) => !selectedStudent || m.student === selectedStudent.name)
                  .map((m, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/30 hover:bg-muted/60 transition-colors">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${m.color}`}>
                        <m.icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{m.title}</p>
                        <p className="text-xs text-muted-foreground">{m.student} · {m.date}</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>

          {/* ── RIGHT: Progress + Messaging ── */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-4">
                <StudentProgressPanel
                  teacherPubkeys={account?.keys.pubkey ? [account.keys.pubkey] : []}
                />
              </CardContent>
            </Card>
            <SecureMessaging />
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Connected to <code className="font-mono text-primary">wss://beginningend.com</code></span>
          <span>•</span>
          <span>NIP-17 encrypted messaging</span>
          <span>•</span>
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Vibed with Shakespeare
          </a>
        </div>
      </div>
    </AppLayout>
  );
}

// Simple cn without importing cn utility (to avoid circular issues)
function cn_plain(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
