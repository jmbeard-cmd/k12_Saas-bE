import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, GraduationCap, BarChart2, CalendarDays, TrendingUp,
  AlertTriangle, CheckCircle2, Clock, Star, GitBranch,
  BookOpen, Wifi, WifiOff, RefreshCw, ChevronDown, ChevronUp,
  Award, Shield, Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AppLayout } from '@/components/AppLayout';
import { cn } from '@/lib/utils';
import {
  useStudentProgressWithFallback,
  SCHOOL_RELAY, DEMO_GRADES,
  type GradeReport,
} from '@/hooks/useStudentProgress';
import { type ParsedAssignment } from '@/hooks/useAssignmentEvents';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { ASSIGNMENT_TYPE_LABELS, ASSIGNMENT_TYPE_COLORS } from '@/lib/okStandards';

// ─── Students (same demo roster as guardian portal) ───────────────────────────

const STUDENTS = [
  {
    id: '1', name: 'Elijah', grade: '5th Grade', school: 'Lincoln Elementary',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=elijah&backgroundColor=b6e3f4',
    color: 'from-blue-600 to-blue-800', accentClass: 'text-blue-600',
    borderClass: 'border-blue-200', bgClass: 'bg-blue-50',
  },
  {
    id: '2', name: 'Zoe', grade: '3rd Grade', school: 'Lincoln Elementary',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=zoe&backgroundColor=ffd5dc',
    color: 'from-pink-500 to-rose-600', accentClass: 'text-pink-600',
    borderClass: 'border-pink-200', bgClass: 'bg-pink-50',
  },
];

// ─── Grade color map ──────────────────────────────────────────────────────────

const GRADE_PILL: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'A':  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'A-': 'bg-green-100 text-green-700 border-green-200',
  'B+': 'bg-blue-100 text-blue-700 border-blue-200',
  'B':  'bg-blue-100 text-blue-700 border-blue-200',
  'B-': 'bg-sky-100 text-sky-700 border-sky-200',
  'C+': 'bg-amber-100 text-amber-700 border-amber-200',
  'C':  'bg-amber-100 text-amber-700 border-amber-200',
  'C-': 'bg-orange-100 text-orange-700 border-orange-200',
  'D+': 'bg-orange-100 text-orange-700 border-orange-200',
  'D':  'bg-red-100 text-red-600 border-red-200',
  'F':  'bg-red-100 text-red-700 border-red-200',
};

const SUBJECT_COLOR_CYCLE = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500',
  'bg-red-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function gradeToPercent(grade: string): number {
  const map: Record<string, number> = {
    'A+': 100, 'A': 97, 'A-': 93, 'B+': 89, 'B': 86, 'B-': 83,
    'C+': 79, 'C': 76, 'C-': 73, 'D+': 69, 'D': 66, 'D-': 63, 'F': 50,
  };
  return map[grade.toUpperCase()] ?? 70;
}

function relativeDate(dateStr: string, today: string): string {
  const diff = Math.round(
    (new Date(dateStr).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 0 && diff <= 7) return `In ${diff}d`;
  if (diff < 0) return dateStr;
  return dateStr;
}

function timeAgo(ts: number): string {
  const diff = Math.floor((Date.now() / 1000 - ts) / 60);
  if (diff < 60) return `${diff}m ago`;
  if (diff < 60 * 24) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / (60 * 24))}d ago`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function GradeCard({
  report,
  colorClass,
  idx,
}: {
  report: GradeReport;
  colorClass: string;
  idx: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = report.score != null && report.maxScore != null
    ? Math.round((report.score / report.maxScore) * 100)
    : gradeToPercent(report.grade);
  const pillClass = GRADE_PILL[report.grade] ?? 'bg-gray-100 text-gray-700 border-gray-200';
  const barColor = SUBJECT_COLOR_CYCLE[idx % SUBJECT_COLOR_CYCLE.length];

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card hover:shadow-md transition-all">
      <button
        className="w-full text-left p-4"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center gap-3">
          {/* Color stripe */}
          <div className={`w-1.5 h-12 rounded-full flex-shrink-0 ${barColor}`} />

          {/* Course info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-semibold text-sm truncate">{report.courseName}</span>
              <Badge className={cn('text-sm font-bold border px-2.5 py-0.5 flex-shrink-0', pillClass)}>
                {report.grade}
              </Badge>
            </div>
            {/* Progress bar */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor} rounded-full transition-all duration-700`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
            </div>
          </div>

          {/* Expand chevron */}
          <div className="text-muted-foreground flex-shrink-0">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expanded detail panel */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 bg-muted/30 space-y-2.5 animate-fade-in">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Teacher:</span>
              <span className="font-medium">{report.teacherName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Course Code:</span>
              <code className="font-mono text-primary">{report.courseCode}</code>
            </div>
            {report.score != null && report.maxScore != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Score:</span>
                <span className="font-semibold">{report.score} / {report.maxScore}</span>
              </div>
            )}
            {report.attendance != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attendance:</span>
                <span className={cn('font-semibold', report.attendance >= 95 ? 'text-green-600' : 'text-amber-600')}>
                  {report.attendance}%
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Term:</span>
              <span className="font-medium">{report.term}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">{timeAgo(report.updatedAt)}</span>
            </div>
          </div>

          {report.comment && (
            <div className="rounded-lg bg-primary/5 border border-primary/10 p-2.5 text-xs">
              <p className="text-muted-foreground mb-0.5 font-medium">Teacher Note:</p>
              <p className="text-foreground italic">"{report.comment}"</p>
            </div>
          )}

          {/* Nostr proof */}
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Shield className="h-3 w-3" />
            <span>Signed kind:{report.event.kind} · event {report.event.id.slice(0, 16)}…</span>
          </div>
        </div>
      )}
    </div>
  );
}

function AssignmentRow({
  a, today, isPast = false,
}: {
  a: ParsedAssignment;
  today: string;
  isPast?: boolean;
}) {
  const typeColor = ASSIGNMENT_TYPE_COLORS[a.assignmentType] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = ASSIGNMENT_TYPE_LABELS[a.assignmentType] ?? a.assignmentType;
  const dueLabel = relativeDate(a.startDate, today);
  const diff = Math.round((new Date(a.startDate).getTime() - new Date(today).getTime()) / 86400000);
  const isUrgent = !isPast && diff <= 2;
  const isToday = a.startDate === today;

  return (
    <div className={cn(
      'flex items-start gap-3 p-3.5 rounded-xl border transition-all',
      isPast
        ? 'opacity-55 bg-muted/20 border-border/40'
        : isUrgent
          ? 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20 hover:shadow-sm'
          : 'border-border bg-card hover:border-primary/20 hover:shadow-sm'
    )}>
      {/* Timeline dot */}
      <div className={cn(
        'w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1',
        isPast ? 'bg-muted-foreground/25' :
        isToday ? 'bg-blue-500 animate-pulse ring-2 ring-blue-200' :
        isUrgent ? 'bg-amber-500' : 'bg-emerald-400'
      )} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{a.title}</p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-semibold', typeColor)}>
            {typeLabel}
          </span>
          <span className="text-xs text-muted-foreground">{a.className}</span>
          {a.version > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-amber-600 flex items-center gap-0.5 cursor-help">
                  <GitBranch className="h-2.5 w-2.5" />
                  v{a.version}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Rescheduled {a.version} time(s)</p>
                {a.rfcCode && <p className="text-amber-400 text-xs">RFC: {a.rfcCode}</p>}
                {a.rfcNote && <p className="text-xs opacity-80">{a.rfcNote}</p>}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        {a.description && (
          <p className="text-[11px] text-muted-foreground/70 mt-1 line-clamp-1">{a.description}</p>
        )}
        {a.standards.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {a.standards.slice(0, 2).map((s) => (
              <span key={s} className="text-[9px] font-mono bg-muted px-1 py-0.5 rounded text-muted-foreground">
                {s}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <p className={cn('text-xs font-bold',
          isToday ? 'text-blue-600' :
          isUrgent ? 'text-amber-600' :
          isPast ? 'text-muted-foreground' : 'text-foreground'
        )}>
          {dueLabel}
        </p>
        {a.maxPoints && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{a.maxPoints} pts</p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function StudentProgressPage() {
  useSeoMeta({ title: 'Student Progress — Guardian Portal' });
  const { account } = useCustodialAuth();
  const navigate = useNavigate();
  const [selectedStudentIdx, setSelectedStudentIdx] = useState(0);

  const selectedStudent = STUDENTS[selectedStudentIdx];

  // Use the logged-in user's pubkey as teacher pubkey (teachers publish grade reports)
  // In production, parents would receive teacher pubkeys via a trust list
  const teacherPubkeys = account?.keys.pubkey ? [account.keys.pubkey] : [];

  const { data, isLoading, isFetching, refetch } = useStudentProgressWithFallback({
    teacherPubkeys,
  });

  const today = new Date().toISOString().split('T')[0];
  const schoolYear = 2026 - (new Date().getMonth() < 8 ? 0 : -1);
  const schoolYearPct = Math.min(100, Math.max(0, Math.round(
    ((new Date().getTime() - new Date(`${schoolYear - 1}-08-15`).getTime()) /
     (new Date(`${schoolYear}-05-25`).getTime() - new Date(`${schoolYear - 1}-08-15`).getTime())) * 100
  )));

  const gpa = data.gpa ?? 3.8;
  const attendance = data.avgAttendance ?? 97;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in space-y-6">

        {/* ── Back nav ── */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/guardian-portal')}
          >
            <ArrowLeft className="h-4 w-4" />
            Guardian Portal
          </Button>

          <div className="flex items-center gap-2">
            {/* Live / demo indicator */}
            <div className={cn(
              'flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border',
              data.isLive
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            )}>
              {data.isLive
                ? <Wifi className="h-3 w-3" />
                : <WifiOff className="h-3 w-3" />
              }
              {data.isLive ? `Live · ${SCHOOL_RELAY}` : 'Demo data (relay empty)'}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 gap-1.5 text-xs"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-3 w-3', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Hero Banner ── */}
        <div className="relative oklahoma-gradient rounded-2xl p-6 lg:p-8 overflow-hidden isolate">
          <div className="hero-pattern absolute inset-0 -z-10" />
          <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-white/5 translate-x-1/4 translate-y-1/4 -z-10" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="text-white">
              <div className="flex items-center gap-2 mb-2">
                <BarChart2 className="h-5 w-5 text-blue-200" />
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  Student Progress View
                </Badge>
                <Badge className="bg-white/10 text-blue-200 border-white/20 text-[10px]">
                  kind:31103 + kind:31922
                </Badge>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold mb-1">Live Grades & Assignment Timeline</h1>
              <p className="text-blue-200 text-sm">
                All data fetched directly from <code className="font-mono">{SCHOOL_RELAY}</code> via signed Nostr events.
              </p>
            </div>

            {/* Student selector */}
            <div className="flex gap-3">
              {STUDENTS.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudentIdx(i)}
                  className={cn(
                    'rounded-xl px-4 py-3 border text-center transition-all',
                    selectedStudentIdx === i
                      ? 'bg-white/25 border-white/50 shadow-lg scale-105'
                      : 'bg-white/10 border-white/20 hover:bg-white/15'
                  )}
                >
                  <Avatar className="h-10 w-10 mx-auto mb-1 border-2 border-white/30">
                    <AvatarImage src={s.avatar} />
                    <AvatarFallback className="bg-white/20 text-white font-bold text-xs">{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <p className="text-white font-bold text-sm">{s.name}</p>
                  <p className="text-blue-200 text-[10px]">{s.grade}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── KPI strip ── */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {/* GPA */}
            <Card className={cn('border-2', selectedStudent.borderClass, selectedStudent.bgClass)}>
              <CardContent className="p-4 text-center">
                <div className={cn('text-3xl font-black', selectedStudent.accentClass)}>{gpa.toFixed(1)}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">Current GPA</div>
                <Progress value={(gpa / 4.0) * 100} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            {/* Due this week */}
            <Card className={cn('border-2', data.dueThisWeek.length > 0 ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50')}>
              <CardContent className="p-4 text-center">
                <div className={cn('text-3xl font-black', data.dueThisWeek.length > 0 ? 'text-amber-600' : 'text-green-600')}>
                  {data.dueThisWeek.length}
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">Due This Week</div>
                <div className="text-[10px] text-muted-foreground mt-1">
                  {data.upcoming.length} total upcoming
                </div>
              </CardContent>
            </Card>
            {/* Attendance */}
            <Card className="border-2 border-emerald-200 bg-emerald-50">
              <CardContent className="p-4 text-center">
                <div className={cn('text-3xl font-black', attendance >= 95 ? 'text-emerald-600' : 'text-amber-600')}>
                  {attendance}%
                </div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">Attendance</div>
                <Progress value={attendance} className="h-1.5 mt-2" />
              </CardContent>
            </Card>
            {/* Courses */}
            <Card className="border-2 border-primary/20 bg-primary/3">
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-black text-primary">{data.grades.length || 5}</div>
                <div className="text-xs text-muted-foreground mt-0.5 font-medium">Active Courses</div>
                <div className="text-[10px] text-muted-foreground mt-1">{data.assignments.length} assignments total</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Demo notice ── */}
        {!isLoading && !data.isLive && (
          <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Demo data shown.</strong> When teachers publish kind:31103 grade reports to{' '}
              <code className="font-mono text-xs">{SCHOOL_RELAY}</code>, live grades will appear here automatically.
              Assignment data uses NIP-52 kind:31922 events from the same relay.
            </AlertDescription>
          </Alert>
        )}

        {/* ── Main content ── */}
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── LEFT: Grades (3 cols) ── */}
          <div className="lg:col-span-3 space-y-5">

            <div>
              <h2 className="font-bold text-lg flex items-center gap-2 mb-1">
                <Award className="h-5 w-5 text-primary" />
                Live Grade Reports
              </h2>
              <p className="text-xs text-muted-foreground">
                Fetched as kind:31103 addressable events from{' '}
                <code className="font-mono text-primary">{SCHOOL_RELAY}</code>
                {data.isLive && <span className="ml-1 text-green-600 font-medium">· Live</span>}
              </p>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1,2,3,4,5].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {data.grades.map((report, idx) => (
                  <GradeCard key={report.dTag} report={report} colorClass="" idx={idx} />
                ))}
              </div>
            )}

            {/* School year progress */}
            {!isLoading && (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="font-semibold flex items-center gap-1.5">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      School Year {schoolYear - 1}–{schoolYear}
                    </span>
                    <span className="font-bold text-primary">{schoolYearPct}% complete</span>
                  </div>
                  <Progress value={schoolYearPct} className="h-3 rounded-full" />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
                    <span>Aug {schoolYear - 1}</span>
                    <span>{Math.round((100 - schoolYearPct) * 1.8)} school days remaining</span>
                    <span>May {schoolYear}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── RIGHT: Assignment Timeline (2 cols) ── */}
          <div className="lg:col-span-2 space-y-5">

            <div>
              <h2 className="font-bold text-lg flex items-center gap-2 mb-1">
                <CalendarDays className="h-5 w-5 text-primary" />
                Assignment Timeline
              </h2>
              <p className="text-xs text-muted-foreground">
                NIP-52 kind:31922 from{' '}
                <code className="font-mono text-primary">{SCHOOL_RELAY}</code>
              </p>
            </div>

            <Tabs defaultValue="upcoming">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="upcoming" className="text-xs gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  Upcoming
                  {data.dueThisWeek.length > 0 && (
                    <Badge className="text-[9px] px-1 py-0 bg-amber-500 text-white ml-0.5">
                      {data.dueThisWeek.length}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="past" className="text-xs gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Past ({data.past.length})
                </TabsTrigger>
              </TabsList>

              {/* Upcoming */}
              <TabsContent value="upcoming" className="mt-3 space-y-2.5">
                {isLoading ? (
                  [1,2,3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)
                ) : data.upcoming.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-10 text-center">
                      <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-400" />
                      <p className="text-sm font-medium">All caught up!</p>
                      <p className="text-xs text-muted-foreground mt-1">No upcoming assignments.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {data.dueThisWeek.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Due This Week
                        </p>
                        <div className="space-y-2">
                          {data.dueThisWeek.map((a) => (
                            <AssignmentRow key={a.dTag} a={a} today={today} />
                          ))}
                        </div>
                      </div>
                    )}
                    {data.upcoming.filter((a) => {
                      const diff = Math.round((new Date(a.startDate).getTime() - new Date(today).getTime()) / 86400000);
                      return diff > 7;
                    }).length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 mt-3">
                          Coming Up
                        </p>
                        <div className="space-y-2">
                          {data.upcoming
                            .filter((a) => {
                              const diff = Math.round((new Date(a.startDate).getTime() - new Date(today).getTime()) / 86400000);
                              return diff > 7;
                            })
                            .map((a) => (
                              <AssignmentRow key={a.dTag} a={a} today={today} />
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </TabsContent>

              {/* Past */}
              <TabsContent value="past" className="mt-3 space-y-2.5">
                {isLoading ? (
                  [1,2,3].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)
                ) : data.past.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="py-8 text-center">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">No past assignments yet.</p>
                    </CardContent>
                  </Card>
                ) : (
                  data.past.slice(0, 10).map((a) => (
                    <AssignmentRow key={a.dTag} a={a} today={today} isPast />
                  ))
                )}
              </TabsContent>
            </Tabs>

            {/* NIP-52 info */}
            {!isLoading && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-xl p-3 border border-border">
                <GitBranch className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-primary/60" />
                <p>
                  Each assignment is a <strong>NIP-52 kind:31922</strong> calendar event signed by
                  the teacher's Nostr key. Reschedules carry a Reason for Change (RFC) tag and an
                  audit trail pointer to the previous event.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          <span>Grades: kind:31103 · Assignments: NIP-52 kind:31922</span>
          <span>·</span>
          <span>Relay: <code className="font-mono text-primary">{SCHOOL_RELAY}</code></span>
          <span>·</span>
          <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Vibed with Shakespeare
          </a>
        </div>
      </div>
    </AppLayout>
  );
}
