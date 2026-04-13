import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ChevronLeft, ChevronRight, Plus, CalendarDays, Clock,
  Hash, GitBranch, AlertCircle, Loader2, CheckCircle2, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { RescheduleDialog } from './RescheduleDialog';
import {
  useAssignmentEvents, usePublishAssignment,
  type ParsedAssignment
} from '@/hooks/useAssignmentEvents';
import {
  ASSIGNMENT_TYPE_LABELS, ASSIGNMENT_TYPE_COLORS,
  type AssignmentType
} from '@/lib/okStandards';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

// ─── New Assignment form schema ───────────────────────────────────────────────

const newAssignmentSchema = z.object({
  title: z.string().min(3, 'Title required'),
  className: z.string().min(1, 'Class required'),
  assignmentType: z.string().min(1, 'Type required'),
  startDate: z.string().min(1, 'Date required'),
  description: z.string().optional(),
  maxPoints: z.string().optional(),
});
type NewAssignmentForm = z.infer<typeof newAssignmentSchema>;

// ─── Calendar helpers ─────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SAMPLE_CLASSES = [
  'Algebra II', 'English Literature', 'US History',
  'Biology', 'Physical Education', 'Computer Science',
  'Art', 'Music', 'Spanish', 'Chemistry', 'Physics',
];

// ─── Component ────────────────────────────────────────────────────────────────

interface AssignmentCalendarProps {
  selectedStandards?: string[];
}

export function AssignmentCalendar({ selectedStandards = [] }: AssignmentCalendarProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const now = new Date();

  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] = useState<ParsedAssignment | null>(null);
  const [detailTarget, setDetailTarget] = useState<ParsedAssignment | null>(null);
  const [newAssignDate, setNewAssignDate] = useState('');

  const { data: assignments = [], isLoading, isError } = useAssignmentEvents(user?.pubkey);
  const publishAssignment = usePublishAssignment();

  const form = useForm<NewAssignmentForm>({
    resolver: zodResolver(newAssignmentSchema),
    defaultValues: { title: '', className: '', assignmentType: '', startDate: newAssignDate, description: '', maxPoints: '' },
  });

  // Build a map: date-string → assignments
  const assignmentsByDate = assignments.reduce<Record<string, ParsedAssignment[]>>((acc, a) => {
    (acc[a.startDate] ??= []).push(a);
    return acc;
  }, {});

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const openNewDialog = (dateStr?: string) => {
    const d = dateStr ?? new Date().toISOString().split('T')[0];
    setNewAssignDate(d);
    form.reset({ title: '', className: '', assignmentType: '', startDate: d, description: '', maxPoints: '' });
    setNewDialogOpen(true);
  };

  const onSubmitNew = async (data: NewAssignmentForm) => {
    try {
      await publishAssignment.mutateAsync({
        title: data.title,
        className: data.className,
        assignmentType: data.assignmentType as AssignmentType,
        startDate: data.startDate,
        description: data.description ?? '',
        maxPoints: data.maxPoints ? Number(data.maxPoints) : undefined,
        standards: selectedStandards,
      });
      setNewDialogOpen(false);
      form.reset();
      toast({
        title: '✅ Assignment Published',
        description: `"${data.title}" signed as NIP-52 event and broadcast to wss://beginningend.com`,
      });
    } catch (err) {
      toast({
        title: 'Publish Failed',
        description: err instanceof Error ? err.message : 'Failed to publish event.',
        variant: 'destructive',
      });
    }
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const todayStr = now.toISOString().split('T')[0];

  const calendarCells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // Pad to full weeks
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevMonth}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextMonth}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div>
                <h3 className="font-bold text-lg leading-none">
                  {MONTH_NAMES[viewMonth]} {viewYear}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {assignments.length} NIP-52 events • All events signed with your Nostr key
                </p>
              </div>
            </div>
            <Button
              className="bg-gradient-oklahoma hover:opacity-90 text-white gap-2 h-8 text-sm"
              onClick={() => openNewDialog()}
            >
              <Plus className="h-4 w-4" />
              New Assignment
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          {isLoading && (
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1">
                {Array(35).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-lg" />
                ))}
              </div>
            </div>
          )}

          {isError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Failed to load NIP-52 events from relay. Check your connection.</AlertDescription>
            </Alert>
          )}

          {!isLoading && !isError && (
            <>
              {/* Day names header */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1.5">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarCells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="h-16 lg:h-20" />;

                  const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayAssignments = assignmentsByDate[dateStr] ?? [];
                  const isToday = dateStr === todayStr;
                  const isSelected = selectedDay === dateStr;
                  const hasAssignments = dayAssignments.length > 0;

                  return (
                    <button
                      key={dateStr}
                      onClick={() => {
                        setSelectedDay(isSelected ? null : dateStr);
                      }}
                      onDoubleClick={() => openNewDialog(dateStr)}
                      className={cn(
                        'h-16 lg:h-20 rounded-lg border text-left p-1.5 transition-all hover:shadow-md relative group',
                        isToday && 'border-primary/60 bg-primary/5',
                        isSelected && 'ring-2 ring-primary ring-offset-1',
                        !isToday && !isSelected && 'border-border hover:border-primary/30',
                        hasAssignments && 'bg-accent/5'
                      )}
                    >
                      <span className={cn(
                        'text-xs font-semibold inline-flex items-center justify-center w-5 h-5 rounded-full',
                        isToday && 'bg-primary text-primary-foreground',
                        !isToday && 'text-foreground/70'
                      )}>
                        {day}
                      </span>

                      {/* Assignment pills */}
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {dayAssignments.slice(0, 2).map((a) => (
                          <div
                            key={a.dTag}
                            className={cn(
                              'text-[9px] leading-none px-1 py-0.5 rounded truncate font-medium',
                              ASSIGNMENT_TYPE_COLORS[a.assignmentType] ?? 'bg-gray-100 text-gray-700'
                            )}
                          >
                            {a.title}
                          </div>
                        ))}
                        {dayAssignments.length > 2 && (
                          <div className="text-[9px] text-muted-foreground px-1">
                            +{dayAssignments.length - 2} more
                          </div>
                        )}
                      </div>

                      {/* Add button on hover */}
                      <button
                        onClick={(e) => { e.stopPropagation(); openNewDialog(dateStr); }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="h-3 w-3 text-primary" />
                      </button>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Day Detail */}
      {selectedDay && (
        <Card className="border-primary/30 animate-slide-up">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </CardTitle>
              <Button size="sm" variant="outline" onClick={() => openNewDialog(selectedDay)} className="gap-1.5 h-7 text-xs">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {(assignmentsByDate[selectedDay] ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No assignments on this date. Double-click any date or click "Add" to create one.
              </p>
            ) : (
              (assignmentsByDate[selectedDay] ?? []).map((a) => (
                <AssignmentRow
                  key={a.dTag}
                  assignment={a}
                  onReschedule={() => setRescheduleTarget(a)}
                  onDetail={() => setDetailTarget(a)}
                />
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* All Upcoming Assignments */}
      {!selectedDay && assignments.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-accent" />
              All Signed Assignments ({assignments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {assignments.map((a) => (
                  <AssignmentRow
                    key={a.dTag}
                    assignment={a}
                    onReschedule={() => setRescheduleTarget(a)}
                    onDetail={() => setDetailTarget(a)}
                  />
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* New Assignment Dialog */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              New Assignment
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitNew)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="na-title">Assignment Title <span className="text-destructive">*</span></Label>
              <Input id="na-title" placeholder="e.g. Quadratic Equations Problem Set" {...form.register('title')} />
              {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Class <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => form.setValue('className', v)}>
                  <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                  <SelectContent>
                    {SAMPLE_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Type <span className="text-destructive">*</span></Label>
                <Select onValueChange={(v) => form.setValue('assignmentType', v)}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(ASSIGNMENT_TYPE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="na-date">Due Date <span className="text-destructive">*</span></Label>
                <Input id="na-date" type="date" defaultValue={newAssignDate} {...form.register('startDate')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="na-points">Points</Label>
                <Input id="na-points" type="number" placeholder="100" {...form.register('maxPoints')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="na-desc">Description</Label>
              <Textarea id="na-desc" placeholder="Instructions, resources, rubric notes…" rows={3} className="resize-none text-sm" {...form.register('description')} />
            </div>

            {selectedStandards.length > 0 && (
              <div className="rounded-lg bg-primary/5 border border-primary/20 p-2.5 text-xs">
                <p className="font-semibold text-primary mb-1">Aligned Standards ({selectedStandards.length})</p>
                <div className="flex flex-wrap gap-1">
                  {selectedStandards.slice(0, 5).map((s) => (
                    <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                  ))}
                  {selectedStandards.length > 5 && <Badge variant="secondary" className="text-[10px]">+{selectedStandards.length - 5}</Badge>}
                </div>
              </div>
            )}

            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 py-2">
              <Hash className="h-3.5 w-3.5 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                This will be published as a <strong>signed NIP-52 kind:31922</strong> event to <code className="font-mono">wss://beginningend.com</code>.
              </AlertDescription>
            </Alert>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={publishAssignment.isPending} className="bg-gradient-oklahoma hover:opacity-90 text-white">
                {publishAssignment.isPending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Publishing…</>
                ) : (
                  <><CheckCircle2 className="h-4 w-4 mr-2" />Publish Event</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assignment Detail Dialog */}
      {detailTarget && (
        <AssignmentDetailDialog
          assignment={detailTarget}
          open={!!detailTarget}
          onClose={() => setDetailTarget(null)}
          onReschedule={() => { setRescheduleTarget(detailTarget); setDetailTarget(null); }}
        />
      )}

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        assignment={rescheduleTarget}
      />
    </div>
  );
}

// ─── Assignment Row ───────────────────────────────────────────────────────────

function AssignmentRow({
  assignment: a,
  onReschedule,
  onDetail,
}: {
  assignment: ParsedAssignment;
  onReschedule: () => void;
  onDetail: () => void;
}) {
  const typeColor = ASSIGNMENT_TYPE_COLORS[a.assignmentType] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = ASSIGNMENT_TYPE_LABELS[a.assignmentType] ?? a.assignmentType;
  const today = new Date().toISOString().split('T')[0];
  const isPast = a.startDate < today;

  return (
    <div
      className={cn(
        'flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:shadow-sm transition-all cursor-pointer group',
        isPast ? 'opacity-70' : 'hover:border-primary/30'
      )}
      onClick={onDetail}
    >
      <div className={cn('w-2 h-2 rounded-full flex-shrink-0', isPast ? 'bg-muted-foreground/30' : 'bg-green-400')} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{a.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className={cn('text-[10px] px-1.5 py-0 rounded font-medium', typeColor)}>{typeLabel}</span>
          <span className="text-xs text-muted-foreground">{a.className}</span>
          {a.version > 0 && (
            <span className="text-[10px] text-amber-600 flex items-center gap-0.5">
              <GitBranch className="h-2.5 w-2.5" />v{a.version}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={cn('text-xs font-semibold', isPast ? 'text-muted-foreground' : 'text-foreground')}>{a.startDate}</p>
        {a.maxPoints && <p className="text-[10px] text-muted-foreground">{a.maxPoints} pts</p>}
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
        onClick={(e) => { e.stopPropagation(); onReschedule(); }}
      >
        <CalendarDays className="h-3 w-3 mr-1" />
        Reschedule
      </Button>
    </div>
  );
}

// ─── Assignment Detail Dialog ─────────────────────────────────────────────────

function AssignmentDetailDialog({
  assignment: a,
  open,
  onClose,
  onReschedule,
}: {
  assignment: ParsedAssignment;
  open: boolean;
  onClose: () => void;
  onReschedule: () => void;
}) {
  const typeColor = ASSIGNMENT_TYPE_COLORS[a.assignmentType] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = ASSIGNMENT_TYPE_LABELS[a.assignmentType] ?? a.assignmentType;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Assignment Details
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1">
            <div className="flex items-start gap-2">
              <h3 className="font-bold text-lg leading-snug flex-1">{a.title}</h3>
              <Badge className={cn('text-[10px] mt-1 flex-shrink-0', typeColor)}>{typeLabel}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{a.className}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Due:</span>
              <span className="font-medium">{a.startDate}</span>
            </div>
            {a.maxPoints && (
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">Points:</span>
                <span className="font-medium">{a.maxPoints}</span>
              </div>
            )}
          </div>

          {a.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{a.description}</p>
          )}

          {a.standards.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Aligned Standards</p>
              <div className="flex flex-wrap gap-1">
                {a.standards.map((s) => (
                  <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {a.rfcCode && (
            <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 py-2">
              <GitBranch className="h-3.5 w-3.5 text-amber-600" />
              <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Rescheduled (v{a.version}):</strong> RFC code <code className="font-mono">{a.rfcCode}</code>
                {a.rfcNote && <span className="ml-1">— {a.rfcNote}</span>}
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground/60 uppercase tracking-wide text-[10px]">NIP-52 Event Metadata</p>
            <div className="flex items-center gap-2">
              <Hash className="h-3 w-3" />
              <span className="font-mono truncate">{a.event.id.slice(0, 24)}…</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              <span>Signed {new Date(a.createdAt * 1000).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <GitBranch className="h-3 w-3" />
              <span>Version {a.version} • d-tag: <code className="font-mono">{a.dTag.slice(0, 24)}…</code></span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button
            className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
            onClick={() => { onClose(); onReschedule(); }}
          >
            <CalendarDays className="h-4 w-4" />
            Reschedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
