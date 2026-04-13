import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, CalendarDays, Tag, Wrench,
  GitBranch, Hash, Shield, Zap, Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/AppLayout';
import { AssignmentCalendar } from '@/components/teacher/AssignmentCalendar';
import { LessonPlanEditor } from '@/components/teacher/LessonPlanEditor';
import { StandardsPanel } from '@/components/teacher/StandardsPanel';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { nip19 } from 'nostr-tools';

export default function TeacherToolsPage() {
  useSeoMeta({ title: 'Teacher Tools — Oklahoma K-12 Connect' });

  const { account } = useCustodialAuth();
  const { user } = useCurrentUser();
  const navigate = useNavigate();

  // Shared standards state — flows into both Calendar and Lesson Planner
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);
  const [selectedCteIds, setSelectedCteIds] = useState<string[]>([]);
  const [selectedCcIds, setSelectedCcIds] = useState<string[]>([]);

  const [activeTab, setActiveTab] = useState('calendar');

  // Gate: only teachers and admins may access this page
  if (account && account.role !== 'teacher' && account.role !== 'admin') {
    return (
      <AppLayout>
        <div className="p-8 max-w-lg mx-auto">
          <Alert variant="destructive">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              Teacher Tools are only available to teachers and administrators.
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  const npub = user?.pubkey ? nip19.npubEncode(user.pubkey) : null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in space-y-6">

        {/* Hero Header */}
        <div className="relative oklahoma-gradient rounded-2xl p-6 lg:p-8 overflow-hidden isolate">
          <div className="hero-pattern absolute inset-0 -z-10" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3 -z-10" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-5 w-5 text-accent" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">Teacher Tools</Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">Classroom Toolkit</h1>
              <p className="text-blue-200 text-sm max-w-xl">
                Create lesson plans (NIP-23), schedule assignments on a Nostr-native calendar (NIP-52), and align content to Oklahoma CTE and Common Core standards.
              </p>
            </div>

            {/* Stats */}
            <div className="flex gap-3 flex-wrap">
              {[
                { icon: BookOpen, label: 'NIP-23', sublabel: 'Lesson Plans', color: 'text-purple-300' },
                { icon: CalendarDays, label: 'NIP-52', sublabel: 'Calendar Events', color: 'text-green-300' },
                { icon: Tag, label: 'Standards', sublabel: 'Embedded Tags', color: 'text-amber-300' },
              ].map((s) => (
                <div key={s.label} className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20 min-w-[90px]">
                  <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                  <div className="text-sm font-bold text-white">{s.label}</div>
                  <div className="text-[10px] text-blue-200">{s.sublabel}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Nostr Identity Banner */}
        {npub && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-muted/50 border border-border text-xs">
            <Hash className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-muted-foreground">Publishing as:</span>
            <code className="font-mono text-primary flex-1 truncate">{npub}</code>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs">
                All NIP-23 and NIP-52 events are signed with this Nostr keypair (your custodial Digital School ID) and broadcast to wss://beginningend.com.
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Protocol key */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          {[
            {
              icon: CalendarDays,
              label: 'NIP-52 Assignments',
              desc: 'Every assignment is a signed kind:31922 date-based calendar event. Reschedules create new versions with RFC + audit chain.',
              color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30',
              border: 'border-blue-200 dark:border-blue-900',
            },
            {
              icon: BookOpen,
              label: 'NIP-23 Lesson Plans',
              desc: 'Lesson plans are kind:30023 long-form content events (Markdown). Drafts use kind:30024. Standards are embedded as searchable tags.',
              color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30',
              border: 'border-purple-200 dark:border-purple-900',
            },
            {
              icon: GitBranch,
              label: 'RFC Audit Trail',
              desc: 'Rescheduling requires a Reason for Change selection. The new event references the old event ID, creating an immutable history on Nostr.',
              color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30',
              border: 'border-amber-200 dark:border-amber-900',
            },
          ].map((item) => (
            <Card key={item.label} className={`border ${item.border}`}>
              <CardContent className={`p-3 ${item.color} rounded-lg flex items-start gap-2.5`}>
                <item.icon className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-0.5">{item.label}</p>
                  <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Tabs */}
        <div className="grid lg:grid-cols-4 gap-6">

          {/* Standards Panel (always visible sidebar) */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <StandardsPanel
              selectedStandards={selectedStandards}
              onChangeStandards={setSelectedStandards}
              selectedCteIds={selectedCteIds}
              onChangeCteIds={setSelectedCteIds}
              selectedCcIds={selectedCcIds}
              onChangeCcIds={setSelectedCcIds}
            />

            {/* Standards → events info */}
            {selectedStandards.length > 0 && (
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs space-y-1.5">
                <p className="font-semibold text-primary flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5" />
                  Auto-applied to next event
                </p>
                <p className="text-muted-foreground">
                  {selectedStandards.length} standard code{selectedStandards.length > 1 ? 's' : ''} will be embedded as{' '}
                  <code className="font-mono bg-muted px-1 rounded">ok-standards</code> tags in your next lesson plan or assignment.
                </p>
              </div>
            )}
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 w-full mb-5">
                <TabsTrigger value="calendar" className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4" />
                  Assignment Calendar
                  <Badge variant="secondary" className="text-[10px] ml-1 bg-blue-100 text-blue-700">NIP-52</Badge>
                </TabsTrigger>
                <TabsTrigger value="lessons" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Lesson Plans
                  <Badge variant="secondary" className="text-[10px] ml-1 bg-purple-100 text-purple-700">NIP-23</Badge>
                </TabsTrigger>
              </TabsList>

              {/* ── Assignment Calendar Tab ── */}
              <TabsContent value="calendar" className="mt-0 animate-fade-in">
                <AssignmentCalendar selectedStandards={selectedStandards} />
              </TabsContent>

              {/* ── Lesson Plans Tab ── */}
              <TabsContent value="lessons" className="mt-0 animate-fade-in">
                <LessonPlanEditor
                  selectedStandards={selectedStandards}
                  selectedCteIds={selectedCteIds}
                  selectedCcIds={selectedCcIds}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          All events signed with your Nostr key and published to{' '}
          <code className="font-mono text-primary">wss://beginningend.com</code>
          {' '}•{' '}
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Vibed with Shakespeare
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
