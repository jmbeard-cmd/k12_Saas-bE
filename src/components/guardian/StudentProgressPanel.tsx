/**
 * StudentProgressPanel
 *
 * Compact right-column widget for the Guardian Portal dashboard.
 * Shows a quick grade summary + upcoming assignment list, with a link
 * to the full StudentProgressPage.
 *
 * All data is fetched from wss://beginningend.com via useStudentProgressWithFallback.
 */

import { useNavigate } from 'react-router-dom';
import {
  BarChart2, CalendarDays, ChevronRight, Clock,
  AlertTriangle, GitBranch, Award, TrendingUp, Wifi, WifiOff,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useStudentProgressWithFallback, SCHOOL_RELAY } from '@/hooks/useStudentProgress';
import { ASSIGNMENT_TYPE_LABELS, ASSIGNMENT_TYPE_COLORS } from '@/lib/okStandards';
import type { ParsedAssignment } from '@/hooks/useAssignmentEvents';
import type { GradeReport } from '@/hooks/useStudentProgress';

// ─── Grade pill colours ───────────────────────────────────────────────────────

const GRADE_COLOR: Record<string, string> = {
  'A+': 'text-emerald-600 bg-emerald-50 border-emerald-200',
  'A':  'text-emerald-600 bg-emerald-50 border-emerald-200',
  'A-': 'text-green-600 bg-green-50 border-green-200',
  'B+': 'text-blue-600 bg-blue-50 border-blue-200',
  'B':  'text-blue-600 bg-blue-50 border-blue-200',
  'B-': 'text-sky-600 bg-sky-50 border-sky-200',
  'C+': 'text-amber-600 bg-amber-50 border-amber-200',
  'C':  'text-amber-600 bg-amber-50 border-amber-200',
  'D':  'text-orange-600 bg-orange-50 border-orange-200',
  'F':  'text-red-600 bg-red-50 border-red-200',
};

const BAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-red-500', 'bg-cyan-500',
];

function gradeToPercent(grade: string): number {
  const map: Record<string, number> = {
    'A+': 100, 'A': 97, 'A-': 93, 'B+': 89, 'B': 86, 'B-': 83,
    'C+': 79, 'C': 76, 'C-': 73, 'D+': 69, 'D': 66, 'F': 50,
  };
  return map[grade.toUpperCase()] ?? 70;
}

function dueLabel(dateStr: string, today: string): string {
  const diff = Math.round(
    (new Date(dateStr).getTime() - new Date(today).getTime()) / 86400000
  );
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff <= 7) return `In ${diff}d`;
  return dateStr;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface StudentProgressPanelProps {
  teacherPubkeys?: string[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function StudentProgressPanel({ teacherPubkeys = [] }: StudentProgressPanelProps) {
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  const { data, isLoading } = useStudentProgressWithFallback({ teacherPubkeys });

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-primary" />
            Student Progress
          </h3>
          <div className="flex items-center gap-1.5 mt-0.5">
            {data.isLive
              ? <Wifi className="h-3 w-3 text-green-500" />
              : <WifiOff className="h-3 w-3 text-amber-500" />
            }
            <p className="text-xs text-muted-foreground">
              {data.isLive ? 'Live · ' : 'Demo · '}
              <code className="font-mono text-[10px]">{SCHOOL_RELAY}</code>
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-primary gap-1 flex-shrink-0"
          onClick={() => navigate('/guardian/progress')}
        >
          Full view <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* ── GPA + Attendance summary ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-center">
            <div className="text-2xl font-black text-primary">
              {data.gpa?.toFixed(1) ?? '—'}
            </div>
            <div className="text-xs text-muted-foreground">Current GPA</div>
          </div>
          <div className={cn(
            'rounded-xl border p-3 text-center',
            (data.avgAttendance ?? 100) >= 95
              ? 'border-green-200 bg-green-50'
              : 'border-amber-200 bg-amber-50'
          )}>
            <div className={cn(
              'text-2xl font-black',
              (data.avgAttendance ?? 100) >= 95 ? 'text-green-600' : 'text-amber-600'
            )}>
              {data.avgAttendance ?? '—'}%
            </div>
            <div className="text-xs text-muted-foreground">Attendance</div>
          </div>
        </div>
      )}

      {/* ── Live Grade List ── */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Award className="h-3 w-3" /> Live Grades · kind:31103
          </p>
          {data.grades.slice(0, 5).map((g, idx) => (
            <GradeRow key={g.dTag} report={g} idx={idx} />
          ))}
          {data.grades.length > 5 && (
            <button
              className="w-full text-xs text-center text-primary py-1.5 hover:underline"
              onClick={() => navigate('/guardian/progress')}
            >
              +{data.grades.length - 5} more courses →
            </button>
          )}
        </div>
      )}

      <Separator />

      {/* ── Upcoming Assignments ── */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3" /> Assignment Timeline · NIP-52
          </p>
          {data.dueThisWeek.length > 0 && (
            <Badge className="text-[9px] px-1.5 py-0 bg-amber-500 text-white">
              {data.dueThisWeek.length} due soon
            </Badge>
          )}
        </div>

        {isLoading ? (
          [1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)
        ) : data.upcoming.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">No upcoming assignments.</p>
        ) : (
          data.upcoming.slice(0, 4).map((a) => (
            <AssignmentMini key={a.dTag} a={a} today={today} />
          ))
        )}

        {data.upcoming.length > 4 && (
          <button
            className="w-full text-xs text-center text-primary py-1 hover:underline"
            onClick={() => navigate('/guardian/progress')}
          >
            View all {data.upcoming.length} assignments →
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Grade Row ────────────────────────────────────────────────────────────────

function GradeRow({ report, idx }: { report: GradeReport; idx: number }) {
  const pct = report.score != null && report.maxScore != null
    ? Math.round((report.score / report.maxScore) * 100)
    : gradeToPercent(report.grade);
  const barColor = BAR_COLORS[idx % BAR_COLORS.length];
  const pillClass = GRADE_COLOR[report.grade] ?? 'bg-gray-50 text-gray-700 border-gray-200';

  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-border p-2.5 hover:border-primary/20 transition-colors">
      <div className={`w-1 h-8 rounded-full flex-shrink-0 ${barColor}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-xs font-semibold truncate">{report.courseName}</span>
          <Badge className={cn('text-[10px] font-bold border px-1.5 py-0 flex-shrink-0', pillClass)}>
            {report.grade}
          </Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
            <div className={`h-full ${barColor} rounded-full`} style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] text-muted-foreground">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Assignment Mini Row ──────────────────────────────────────────────────────

function AssignmentMini({ a, today }: { a: ParsedAssignment; today: string }) {
  const diff = Math.round((new Date(a.startDate).getTime() - new Date(today).getTime()) / 86400000);
  const isUrgent = diff <= 2;
  const isToday = a.startDate === today;
  const typeColor = ASSIGNMENT_TYPE_COLORS[a.assignmentType] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = ASSIGNMENT_TYPE_LABELS[a.assignmentType] ?? a.assignmentType;
  const label = dueLabel(a.startDate, today);

  return (
    <div className={cn(
      'flex items-start gap-2.5 p-2.5 rounded-xl border transition-all',
      isUrgent
        ? 'border-amber-200 bg-amber-50/60 dark:bg-amber-950/20'
        : 'border-border hover:border-primary/20'
    )}>
      <div className={cn(
        'w-2 h-2 rounded-full flex-shrink-0 mt-1',
        isToday ? 'bg-blue-500 animate-pulse' :
        isUrgent ? 'bg-amber-500' : 'bg-emerald-400'
      )} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold truncate">{a.title}</p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={cn('text-[10px] px-1 py-0.5 rounded font-medium', typeColor)}>
            {typeLabel}
          </span>
          <span className="text-[10px] text-muted-foreground">{a.className}</span>
          {a.version > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-[10px] text-amber-600 flex items-center gap-0.5 cursor-help">
                  <GitBranch className="h-2.5 w-2.5" /> v{a.version}
                </span>
              </TooltipTrigger>
              <TooltipContent side="top">
                Rescheduled · RFC: {a.rfcCode}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn('text-[11px] font-bold',
          isToday ? 'text-blue-600' : isUrgent ? 'text-amber-600' : 'text-muted-foreground'
        )}>
          {label}
        </p>
        {a.maxPoints && (
          <p className="text-[10px] text-muted-foreground">{a.maxPoints}pts</p>
        )}
      </div>
    </div>
  );
}
