import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Award, Clock, CheckCircle2, AlertCircle, Circle, Filter, ChevronDown } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AppLayout } from '@/components/AppLayout';
import { cn } from '@/lib/utils';

interface Assignment {
  id: number;
  title: string;
  subject: string;
  subjectColor: string;
  type: 'homework' | 'quiz' | 'project' | 'test' | 'lab';
  dueDate: string;
  dueDateLabel: string;
  status: 'not_started' | 'in_progress' | 'submitted' | 'graded';
  grade?: string;
  points?: number;
  maxPoints?: number;
  description: string;
}

const ASSIGNMENTS: Assignment[] = [
  {
    id: 1, title: 'Quadratic Equations Problem Set', subject: 'Algebra II', subjectColor: 'text-blue-600 bg-blue-100',
    type: 'homework', dueDate: '2026-04-18', dueDateLabel: 'Tomorrow', status: 'not_started',
    maxPoints: 50, description: 'Complete problems 1-25 from Chapter 9. Show all work for full credit.',
  },
  {
    id: 2, title: 'Essay: The Great Gatsby Chapters 6-9', subject: 'English Literature', subjectColor: 'text-purple-600 bg-purple-100',
    type: 'project', dueDate: '2026-04-18', dueDateLabel: 'Tomorrow', status: 'in_progress',
    maxPoints: 100, description: 'Write a 5-paragraph analytical essay on the theme of the American Dream.',
  },
  {
    id: 3, title: 'WWI & WWII Timeline', subject: 'US History', subjectColor: 'text-green-600 bg-green-100',
    type: 'project', dueDate: '2026-04-22', dueDateLabel: 'Apr 22', status: 'not_started',
    maxPoints: 75, description: 'Create a detailed visual timeline of key events from 1914-1945.',
  },
  {
    id: 4, title: 'Cell Mitosis Lab Report', subject: 'Biology', subjectColor: 'text-orange-600 bg-orange-100',
    type: 'lab', dueDate: '2026-04-25', dueDateLabel: 'Apr 25', status: 'not_started',
    maxPoints: 80, description: 'Write a formal lab report following the scientific method for the mitosis observation lab.',
  },
  {
    id: 5, title: 'Chapter 8 Reading Quiz', subject: 'Algebra II', subjectColor: 'text-blue-600 bg-blue-100',
    type: 'quiz', dueDate: '2026-04-10', dueDateLabel: 'Apr 10', status: 'graded',
    grade: 'B+', points: 43, maxPoints: 50, description: 'Online quiz on Chapter 8 polynomial functions.',
  },
  {
    id: 6, title: 'Poetry Analysis: T.S. Eliot', subject: 'English Literature', subjectColor: 'text-purple-600 bg-purple-100',
    type: 'homework', dueDate: '2026-04-07', dueDateLabel: 'Apr 7', status: 'graded',
    grade: 'A', points: 98, maxPoints: 100, description: 'Written analysis of "The Love Song of J. Alfred Prufrock".',
  },
  {
    id: 7, title: 'Reconstruction Era Essay', subject: 'US History', subjectColor: 'text-green-600 bg-green-100',
    type: 'project', dueDate: '2026-04-05', dueDateLabel: 'Apr 5', status: 'submitted',
    maxPoints: 100, description: 'Evaluate the successes and failures of the Reconstruction era.',
  },
];

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: Circle, color: 'text-muted-foreground', badge: 'bg-muted text-muted-foreground' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  submitted: { label: 'Submitted', icon: CheckCircle2, color: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  graded: { label: 'Graded', icon: CheckCircle2, color: 'text-green-600', badge: 'bg-green-100 text-green-700' },
};

const TYPE_LABELS: Record<string, string> = {
  homework: '📝 Homework',
  quiz: '📋 Quiz',
  project: '🗂️ Project',
  test: '📊 Test',
  lab: '🔬 Lab',
};

export default function AssignmentsPage() {
  useSeoMeta({ title: 'Assignments — Oklahoma K-12 Connect' });
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const filtered = ASSIGNMENTS.filter((a) => {
    if (filter === 'upcoming') return a.status === 'not_started' || a.status === 'in_progress';
    if (filter === 'completed') return a.status === 'submitted' || a.status === 'graded';
    return true;
  });

  const upcoming = ASSIGNMENTS.filter((a) => a.status === 'not_started' || a.status === 'in_progress');
  const overdue = upcoming.filter((a) => a.dueDateLabel === 'Tomorrow').length;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Award className="h-6 w-6 text-primary" />
              Assignments
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {upcoming.length} upcoming • {overdue > 0 && <span className="text-destructive font-semibold">{overdue} due soon</span>}
            </p>
          </div>
        </div>

        {/* Due Soon Banner */}
        {overdue > 0 && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm text-destructive">Action Required</p>
              <p className="text-xs text-destructive/80">{overdue} assignment{overdue > 1 ? 's are' : ' is'} due tomorrow. Don't fall behind!</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList>
            <TabsTrigger value="all">All ({ASSIGNMENTS.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({ASSIGNMENTS.length - upcoming.length})</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* List */}
        <div className="space-y-3">
          {filtered.map((assignment) => {
            const statusConfig = STATUS_CONFIG[assignment.status];
            const StatusIcon = statusConfig.icon;
            const isUrgent = assignment.dueDateLabel === 'Tomorrow' && (assignment.status === 'not_started' || assignment.status === 'in_progress');

            return (
              <Card key={assignment.id} className={cn(
                'hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer',
                isUrgent && 'border-destructive/30 bg-destructive/2'
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={cn('p-2 rounded-lg flex-shrink-0 mt-0.5', assignment.subjectColor)}>
                      <Award className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-semibold text-sm">{assignment.title}</h3>
                        {isUrgent && (
                          <Badge className="text-[10px] px-1.5 py-0 bg-destructive text-white">Due Soon</Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-md font-medium', assignment.subjectColor)}>
                          {assignment.subject}
                        </span>
                        <span className="text-xs text-muted-foreground">{TYPE_LABELS[assignment.type]}</span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{assignment.description}</p>
                    </div>

                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Badge className={cn('text-[10px] px-1.5 py-0 gap-1', statusConfig.badge)}>
                        <StatusIcon className="h-2.5 w-2.5" />
                        {statusConfig.label}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className={isUrgent ? 'text-destructive font-semibold' : ''}>{assignment.dueDateLabel}</span>
                      </div>
                      {assignment.grade && (
                        <div className="text-sm font-bold text-green-600">
                          {assignment.grade}
                          <span className="text-xs text-muted-foreground font-normal ml-1">
                            ({assignment.points}/{assignment.maxPoints})
                          </span>
                        </div>
                      )}
                      {!assignment.grade && assignment.maxPoints && (
                        <div className="text-xs text-muted-foreground">{assignment.maxPoints} pts</div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
