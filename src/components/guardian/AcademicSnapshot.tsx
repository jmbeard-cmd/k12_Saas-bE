import { useState } from 'react';
import {
  TrendingUp, Award, Clock, BookOpen, CalendarDays,
  ChevronRight, AlertTriangle, CheckCircle2, Circle,
  GraduationCap, BarChart2, GitBranch, Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAssignmentEvents, type ParsedAssignment } from '@/hooks/useAssignmentEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { ASSIGNMENT_TYPE_LABELS, ASSIGNMENT_TYPE_COLORS } from '@/lib/okStandards';

// ─── Static grade data (in production, from teacher-published Nostr events) ──

const LIVE_GRADES = [
  { subject: 'Algebra II', code: 'MATH-201', teacher: 'Ms. Johnson', grade: 'B+', gpa: 3.3, progress: 78, color: 'bg-blue-500', attendance: '96%', lastUpdated: '2 days ago' },
  { subject: 'English Literature', code: 'ENG-301', teacher: 'Mr. Davis', grade: 'A', gpa: 4.0, progress: 92, color: 'bg-purple-500', attendance: '100%', lastUpdated: '1 day ago' },
  { subject: 'US History', code: 'HIST-201', teacher: 'Mrs. Williams', grade: 'A-', gpa: 3.7, progress: 85, color: 'bg-green-500', attendance: '98%', lastUpdated: 'Today' },
  { subject: 'Biology', code: 'SCI-201', teacher: 'Dr. Martinez', grade: 'B', gpa: 3.0, progress: 71, color: 'bg-orange-500', attendance: '94%', lastUpdated: '3 days ago' },
  { subject: 'Physical Education', code: 'PE-101', teacher: 'Coach Taylor', grade: 'A', gpa: 4.0, progress: 95, color: 'bg-red-500', attendance: '100%', lastUpdated: 'Today' },
];

const GRADE_COLOR: Record<string, string> = {
  'A': 'text-green-600 bg-green-50 border-green-200',
  'A-': 'text-green-600 bg-green-50 border-green-200',
  'B+': 'text-blue-600 bg-blue-50 border-blue-200',
  'B': 'text-blue-600 bg-blue-50 border-blue-200',
  'B-': 'text-blue-600 bg-blue-50 border-blue-200',
  'C+': 'text-amber-600 bg-amber-50 border-amber-200',
  'C': 'text-amber-600 bg-amber-50 border-amber-200',
  'D': 'text-orange-600 bg-orange-50 border-orange-200',
  'F': 'text-red-600 bg-red-50 border-red-200',
};

interface AcademicSnapshotProps {
  /** Teacher pubkey to pull NIP-52 assignments from */
  teacherPubkey?: string;
}

export function AcademicSnapshot({ teacherPubkey }: AcademicSnapshotProps) {
  const { user } = useCurrentUser();
  const pubkeyToQuery = teacherPubkey ?? user?.pubkey;
  const { data: assignments = [], isLoading: assignmentsLoading } = useAssignmentEvents(pubkeyToQuery);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const overallGPA = (LIVE_GRADES.reduce((s, g) => s + g.gpa, 0) / LIVE_GRADES.length).toFixed(2);

  // Upcoming assignments: next 30 days, sorted by date
  const upcoming = assignments
    .filter((a) => a.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
    .slice(0, 10);

  // Past/completed
  const past = assignments
    .filter((a) => a.startDate < today)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 5);

  const dueThisWeek = upcoming.filter((a) => {
    const diffDays = (new Date(a.startDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="font-bold text-base flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-primary" />
          Academic Snapshot
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">Live grades + NIP-52 assignment timeline</p>
      </div>

      {/* GPA Summary Row */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/20 bg-primary/3">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-primary">{overallGPA}</div>
            <div className="text-xs text-muted-foreground">Current GPA</div>
          </CardContent>
        </Card>
        <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="p-3 text-center">
            <div className={cn('text-2xl font-bold', dueThisWeek.length > 0 ? 'text-amber-600' : 'text-green-600')}>
              {dueThisWeek.length}
            </div>
            <div className="text-xs text-muted-foreground">Due This Week</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">97%</div>
            <div className="text-xs text-muted-foreground">Attendance</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="grades">
        <TabsList className="grid grid-cols-2 w-full">
          <TabsTrigger value="grades" className="text-xs">
            <Award className="h-3.5 w-3.5 mr-1.5" />
            Live Grades
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs">
            <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
            NIP-52 Timeline
            {dueThisWeek.length > 0 && (
              <Badge className="ml-1 text-[9px] px-1 py-0 bg-amber-500 text-white">{dueThisWeek.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── Grades Tab ── */}
        <TabsContent value="grades" className="mt-3 space-y-2">
          {LIVE_GRADES.map((g) => (
            <div key={g.subject}>
              <button
                className={cn(
                  'w-full text-left rounded-xl border p-3 transition-all hover:shadow-sm',
                  expandedSubject === g.subject ? 'border-primary/30 bg-primary/3' : 'border-border hover:border-primary/20'
                )}
                onClick={() => setExpandedSubject(expandedSubject === g.subject ? null : g.subject)}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-10 rounded-full ${g.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm truncate">{g.subject}</span>
                      <Badge className={cn('text-xs font-bold border', GRADE_COLOR[g.grade] ?? 'bg-gray-50 text-gray-700')}>
                        {g.grade}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${g.color} rounded-full`} style={{ width: `${g.progress}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{g.progress}%</span>
                    </div>
                  </div>
                </div>
              </button>

              {expandedSubject === g.subject && (
                <div className="ml-6 mt-1 p-3 rounded-xl bg-muted/40 border border-border text-xs space-y-1.5 animate-fade-in">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Teacher:</span>
                    <span className="font-medium">{g.teacher}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Course Code:</span>
                    <code className="font-mono">{g.code}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Attendance:</span>
                    <span className="font-medium text-green-600">{g.attendance}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">GPA Points:</span>
                    <span className="font-medium">{g.gpa.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span className="font-medium">{g.lastUpdated}</span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Year progress */}
          <div className="pt-2">
            <Separator className="mb-3" />
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-muted-foreground">School Year 2025–2026</span>
              <span className="font-semibold text-primary">72% complete</span>
            </div>
            <Progress value={72} className="h-2" />
            <p className="text-[11px] text-muted-foreground text-right mt-1">47 school days remaining</p>
          </div>
        </TabsContent>

        {/* ── NIP-52 Timeline Tab ── */}
        <TabsContent value="timeline" className="mt-3 space-y-3">
          {assignmentsLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          )}

          {!assignmentsLoading && upcoming.length === 0 && past.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <CalendarDays className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground mb-1">No NIP-52 assignment events found</p>
                <p className="text-xs text-muted-foreground/70">
                  Teachers publish assignments as signed kind:31922 events to wss://beginningend.com.
                  They'll appear here automatically once published.
                </p>
              </CardContent>
            </Card>
          )}

          {!assignmentsLoading && upcoming.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Upcoming</p>
              {upcoming.map((a) => (
                <AssignmentTimelineRow key={a.dTag} assignment={a} today={today} />
              ))}
            </div>
          )}

          {!assignmentsLoading && past.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recent Past</p>
              {past.map((a) => (
                <AssignmentTimelineRow key={a.dTag} assignment={a} today={today} isPast />
              ))}
            </div>
          )}

          {/* NIP-52 info badge */}
          <div className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
            <GitBranch className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary/60" />
            <p>
              Each assignment above is a cryptographically signed <strong>NIP-52 kind:31922</strong> calendar event,
              published with your teacher's Nostr key to <code className="font-mono text-[10px]">wss://beginningend.com</code>.
              Reschedules include a Reason for Change (RFC) in the event tags.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Assignment Timeline Row ──────────────────────────────────────────────────

function AssignmentTimelineRow({
  assignment: a,
  today,
  isPast = false,
}: {
  assignment: ParsedAssignment;
  today: string;
  isPast?: boolean;
}) {
  const typeColor = ASSIGNMENT_TYPE_COLORS[a.assignmentType] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = ASSIGNMENT_TYPE_LABELS[a.assignmentType] ?? a.assignmentType;

  // Days until
  const daysUntil = Math.round(
    (new Date(a.startDate).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
  );
  const isUrgent = !isPast && daysUntil <= 2;
  const isToday = a.startDate === today;

  return (
    <div className={cn(
      'flex items-start gap-3 p-3 rounded-xl border transition-all',
      isPast ? 'opacity-60 bg-muted/20 border-border/50' :
      isUrgent ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20' :
      'border-border bg-card hover:border-primary/20'
    )}>
      {/* Status dot */}
      <div className={cn(
        'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
        isPast ? 'bg-muted-foreground/30' :
        isToday ? 'bg-blue-500 animate-pulse' :
        isUrgent ? 'bg-amber-500' : 'bg-green-400'
      )} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{a.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={cn('text-[10px] px-1.5 py-0 rounded font-medium', typeColor)}>
            {typeLabel}
          </span>
          <span className="text-xs text-muted-foreground">{a.className}</span>
          {a.version > 0 && (
            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
              <GitBranch className="h-2.5 w-2.5" />
              Rescheduled v{a.version}
            </span>
          )}
        </div>
        {a.rfcCode && (
          <p className="text-[10px] text-amber-600 mt-0.5">RFC: {a.rfcCode}</p>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className={cn('text-xs font-semibold',
          isToday ? 'text-blue-600' :
          isUrgent ? 'text-amber-600' :
          isPast ? 'text-muted-foreground' : 'text-foreground'
        )}>
          {isToday ? 'Today' :
           isPast ? a.startDate :
           daysUntil === 1 ? 'Tomorrow' :
           daysUntil <= 7 ? `In ${daysUntil}d` : a.startDate}
        </p>
        {a.maxPoints && (
          <p className="text-[10px] text-muted-foreground">{a.maxPoints} pts</p>
        )}
      </div>
    </div>
  );
}
