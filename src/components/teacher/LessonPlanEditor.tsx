import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  BookOpen, Plus, Save, Send, FileText, Clock, GraduationCap,
  Target, Hash, ChevronDown, ChevronRight, Loader2, Eye,
  CheckCircle2, Edit3, Trash2, AlertCircle, Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useLessonPlans, usePublishLessonPlan, type ParsedLessonPlan } from '@/hooks/useLessonPlans';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';

// ─── Schema ───────────────────────────────────────────────────────────────────

const lessonSchema = z.object({
  title: z.string().min(3, 'Title is required'),
  className: z.string().min(1, 'Class is required'),
  gradeLevel: z.string().optional(),
  durationMinutes: z.string().optional(),
  summary: z.string().optional(),
  content: z.string().min(10, 'Lesson content is required (min 10 characters)'),
  objectives: z.string().optional(), // newline-separated
});
type LessonForm = z.infer<typeof lessonSchema>;

const SAMPLE_CLASSES = [
  'Algebra II', 'English Literature', 'US History',
  'Biology', 'Physical Education', 'Computer Science',
  'Art', 'Music', 'Spanish', 'Chemistry', 'Physics',
];

const GRADE_LEVELS = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

const MARKDOWN_TEMPLATE = `## Learning Objectives
- Students will be able to...
- Students will understand...

## Materials & Resources
- Textbook: Chapter X
- Handout: [Name]
- Technology: 

## Introduction / Hook (5 min)
Describe how you will engage students at the start of class.

## Direct Instruction (15 min)
Explain the key concepts and skills being taught.

## Guided Practice (10 min)
Describe activities where the teacher leads students through examples.

## Independent Practice (10 min)
Describe the activity students will complete independently.

## Closure / Assessment (5 min)
How will you check for student understanding?

## Differentiation
- **For ELL students:**
- **For advanced learners:**
- **For students with IEPs/504s:**

## Homework
`;

interface LessonPlanEditorProps {
  selectedStandards?: string[];
  selectedCteIds?: string[];
  selectedCcIds?: string[];
}

export function LessonPlanEditor({
  selectedStandards = [],
  selectedCteIds = [],
  selectedCcIds = [],
}: LessonPlanEditorProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const { data: lessons = [], isLoading, isError } = useLessonPlans(user?.pubkey);
  const publishLesson = usePublishLessonPlan();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<ParsedLessonPlan | null>(null);
  const [previewLesson, setPreviewLesson] = useState<ParsedLessonPlan | null>(null);
  const [savingAs, setSavingAs] = useState<'draft' | 'publish' | null>(null);

  const form = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: { title: '', className: '', gradeLevel: '', durationMinutes: '45', summary: '', content: MARKDOWN_TEMPLATE, objectives: '' },
  });

  const openEditor = (lesson?: ParsedLessonPlan) => {
    if (lesson) {
      setEditingLesson(lesson);
      form.reset({
        title: lesson.title,
        className: lesson.className,
        gradeLevel: lesson.gradeLevel ?? '',
        durationMinutes: lesson.durationMinutes ? String(lesson.durationMinutes) : '45',
        summary: lesson.summary ?? '',
        content: lesson.content,
        objectives: lesson.objectives.join('\n'),
      });
    } else {
      setEditingLesson(null);
      form.reset({ title: '', className: '', gradeLevel: '', durationMinutes: '45', summary: '', content: MARKDOWN_TEMPLATE, objectives: '' });
    }
    setEditorOpen(true);
  };

  const handleSave = async (data: LessonForm, isDraft: boolean) => {
    setSavingAs(isDraft ? 'draft' : 'publish');
    try {
      await publishLesson.mutateAsync({
        dTag: editingLesson?.dTag,
        title: data.title,
        className: data.className,
        gradeLevel: data.gradeLevel,
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : undefined,
        summary: data.summary,
        content: data.content,
        objectives: data.objectives?.split('\n').map((s) => s.trim()).filter(Boolean),
        standards: selectedStandards,
        cteClusterIds: selectedCteIds,
        ccDomainIds: selectedCcIds,
        isDraft,
      });
      setEditorOpen(false);
      form.reset();
      toast({
        title: isDraft ? '💾 Draft Saved' : '✅ Lesson Plan Published',
        description: isDraft
          ? 'Saved as NIP-23 kind:30024 draft on wss://beginningend.com'
          : `"${data.title}" published as NIP-23 kind:30023 long-form event.`,
      });
    } catch (err) {
      toast({
        title: 'Save Failed',
        description: err instanceof Error ? err.message : 'Unknown error.',
        variant: 'destructive',
      });
    } finally {
      setSavingAs(null);
    }
  };

  const published = lessons.filter((l) => !l.isDraft);
  const drafts = lessons.filter((l) => l.isDraft);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            Lesson Plans
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Each plan is a signed NIP-23 kind:30023 long-form event
          </p>
        </div>
        <Button
          className="bg-gradient-oklahoma hover:opacity-90 text-white gap-2 h-8 text-sm"
          onClick={() => openEditor()}
        >
          <Plus className="h-4 w-4" />
          New Lesson Plan
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      )}

      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load lesson plans from relay.</AlertDescription>
        </Alert>
      )}

      {!isLoading && !isError && (
        <>
          {/* Drafts */}
          {drafts.length > 0 && (
            <LessonSection
              title="Drafts"
              icon={<FileText className="h-4 w-4 text-muted-foreground" />}
              lessons={drafts}
              onEdit={openEditor}
              onPreview={setPreviewLesson}
            />
          )}

          {/* Published */}
          {published.length > 0 && (
            <LessonSection
              title="Published"
              icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
              lessons={published}
              onEdit={openEditor}
              onPreview={setPreviewLesson}
            />
          )}

          {lessons.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <BookOpen className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
                <p className="font-medium text-muted-foreground mb-1">No lesson plans yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Create your first NIP-23 lesson plan, signed and stored on Nostr.
                </p>
                <Button size="sm" onClick={() => openEditor()} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Lesson Plan
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-0">
            <DialogTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5 text-primary" />
              {editingLesson ? 'Edit Lesson Plan' : 'New Lesson Plan'}
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 py-4 space-y-5">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="lp-title">Lesson Title <span className="text-destructive">*</span></Label>
                  <Input id="lp-title" placeholder="e.g., Introduction to Quadratic Functions" {...form.register('title')} />
                  {form.formState.errors.title && <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Class / Course <span className="text-destructive">*</span></Label>
                  <Select
                    defaultValue={editingLesson?.className}
                    onValueChange={(v) => form.setValue('className', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                    <SelectContent>
                      {SAMPLE_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Grade Level</Label>
                  <Select
                    defaultValue={editingLesson?.gradeLevel}
                    onValueChange={(v) => form.setValue('gradeLevel', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((g) => <SelectItem key={g} value={g}>Grade {g}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lp-duration" className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" /> Duration (minutes)
                  </Label>
                  <Input id="lp-duration" type="number" placeholder="45" {...form.register('durationMinutes')} />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lp-summary">Summary / Tagline</Label>
                  <Input id="lp-summary" placeholder="One-sentence description" {...form.register('summary')} />
                </div>
              </div>

              {/* Objectives */}
              <div className="space-y-1.5">
                <Label htmlFor="lp-objectives" className="flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-primary" />
                  Learning Objectives (one per line)
                </Label>
                <Textarea
                  id="lp-objectives"
                  placeholder={"Students will identify key properties of quadratic functions.\nStudents will graph parabolas using vertex form."}
                  rows={3}
                  className="resize-none text-sm"
                  {...form.register('objectives')}
                />
              </div>

              {/* Main Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="lp-content" className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-primary" />
                    Lesson Body (Markdown) <span className="text-destructive">*</span>
                  </Label>
                  <Badge variant="secondary" className="text-[10px]">NIP-23 .content field</Badge>
                </div>
                <Textarea
                  id="lp-content"
                  className="resize-none font-mono text-xs leading-relaxed"
                  rows={18}
                  {...form.register('content')}
                />
                {form.formState.errors.content && <p className="text-xs text-destructive">{form.formState.errors.content.message}</p>}
              </div>

              {/* Aligned Standards Summary */}
              {(selectedStandards.length > 0 || selectedCteIds.length > 0 || selectedCcIds.length > 0) && (
                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 space-y-2">
                  <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    Standards to be embedded in this event
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedStandards.map((s) => (
                      <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                    ))}
                    {selectedCteIds.map((id) => (
                      <Badge key={id} className="text-[10px] bg-blue-100 text-blue-700">CTE:{id}</Badge>
                    ))}
                    {selectedCcIds.map((id) => (
                      <Badge key={id} className="text-[10px] bg-green-100 text-green-700">CC:{id}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 py-2.5">
                <Hash className="h-3.5 w-3.5 text-blue-600" />
                <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                  <strong>Drafts</strong> → NIP-23 kind:30024 (private, not indexed) •{' '}
                  <strong>Publish</strong> → kind:30023 (public long-form article, queryable by class/standards)
                </AlertDescription>
              </Alert>
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t bg-muted/20">
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            <Button
              variant="outline"
              onClick={form.handleSubmit((d) => handleSave(d, true))}
              disabled={savingAs !== null}
              className="gap-2"
            >
              {savingAs === 'draft' ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
              ) : (
                <><Save className="h-4 w-4" />Save as Draft</>
              )}
            </Button>
            <Button
              onClick={form.handleSubmit((d) => handleSave(d, false))}
              disabled={savingAs !== null}
              className="gap-2 bg-gradient-oklahoma hover:opacity-90 text-white"
            >
              {savingAs === 'publish' ? (
                <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>
              ) : (
                <><Send className="h-4 w-4" />Publish Lesson Plan</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {previewLesson && (
        <LessonPreviewDialog
          lesson={previewLesson}
          open={!!previewLesson}
          onClose={() => setPreviewLesson(null)}
          onEdit={() => { openEditor(previewLesson); setPreviewLesson(null); }}
        />
      )}
    </div>
  );
}

// ─── Lesson Section ───────────────────────────────────────────────────────────

function LessonSection({
  title, icon, lessons, onEdit, onPreview
}: {
  title: string;
  icon: React.ReactNode;
  lessons: ParsedLessonPlan[];
  onEdit: (l: ParsedLessonPlan) => void;
  onPreview: (l: ParsedLessonPlan) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <button
          className="flex items-center gap-2 text-sm font-semibold w-full text-left"
          onClick={() => setCollapsed(!collapsed)}
        >
          {icon}
          {title} ({lessons.length})
          {collapsed ? <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground" /> : <ChevronDown className="h-4 w-4 ml-auto text-muted-foreground" />}
        </button>
      </CardHeader>
      {!collapsed && (
        <CardContent className="pt-0 px-4 pb-4 space-y-2">
          {lessons.map((lesson) => (
            <div
              key={`${lesson.event.kind}:${lesson.dTag}`}
              className="flex items-start gap-3 px-3 py-3 rounded-lg border hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => onPreview(lesson)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2">
                  <p className="font-medium text-sm truncate flex-1">{lesson.title}</p>
                  {lesson.isDraft && <Badge variant="secondary" className="text-[10px] flex-shrink-0">Draft</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{lesson.className}</span>
                  {lesson.gradeLevel && <span className="text-xs text-muted-foreground">• Grade {lesson.gradeLevel}</span>}
                  {lesson.durationMinutes && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />{lesson.durationMinutes} min
                    </span>
                  )}
                  {lesson.standards.length > 0 && (
                    <span className="text-xs text-primary flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5" />{lesson.standards.length} standards
                    </span>
                  )}
                </div>
                {lesson.summary && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{lesson.summary}</p>}
              </div>
              <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); onPreview(lesson); }}
                  title="Preview"
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={(e) => { e.stopPropagation(); onEdit(lesson); }}
                  title="Edit"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ─── Lesson Preview Dialog ────────────────────────────────────────────────────

function LessonPreviewDialog({
  lesson, open, onClose, onEdit
}: {
  lesson: ParsedLessonPlan;
  open: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl max-h-[88vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-3 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl leading-snug">{lesson.title}</DialogTitle>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <Badge variant="outline" className="text-xs">{lesson.className}</Badge>
                {lesson.gradeLevel && <Badge variant="outline" className="text-xs">Grade {lesson.gradeLevel}</Badge>}
                {lesson.durationMinutes && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />{lesson.durationMinutes} min
                  </span>
                )}
                {lesson.isDraft ? (
                  <Badge className="text-xs bg-amber-100 text-amber-700">Draft (kind:30024)</Badge>
                ) : (
                  <Badge className="text-xs bg-green-100 text-green-700">Published (kind:30023)</Badge>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="px-6 py-4 space-y-4">
            {lesson.summary && (
              <p className="text-sm text-muted-foreground italic">{lesson.summary}</p>
            )}

            {lesson.objectives.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5" /> Learning Objectives
                </p>
                <ul className="space-y-1">
                  {lesson.objectives.map((obj, i) => (
                    <li key={i} className="text-sm flex items-start gap-2">
                      <span className="text-primary font-bold mt-0.5">•</span>
                      {obj}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Lesson Content
              </p>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground bg-muted/30 rounded-lg p-4">
                  {lesson.content}
                </pre>
              </div>
            </div>

            {(lesson.standards.length > 0 || lesson.cteClusterIds.length > 0 || lesson.ccDomainIds.length > 0) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Aligned Standards
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {lesson.standards.map((s) => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                  {lesson.cteClusterIds.map((id) => <Badge key={id} className="text-xs bg-blue-100 text-blue-700">CTE:{id}</Badge>)}
                  {lesson.ccDomainIds.map((id) => <Badge key={id} className="text-xs bg-green-100 text-green-700">CC:{id}</Badge>)}
                </div>
              </div>
            )}

            <Separator />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground/60 uppercase tracking-wide text-[10px]">NIP-23 Event Metadata</p>
              <p className="flex items-center gap-1.5">
                <Hash className="h-3 w-3" />
                <span className="font-mono">{lesson.event.id.slice(0, 32)}…</span>
              </p>
              <p>Signed: {new Date(lesson.createdAt * 1000).toLocaleString()}</p>
              <p>d-tag: <code className="font-mono">{lesson.dTag}</code></p>
            </div>
          </div>
        </ScrollArea>

        <div className="flex gap-2 justify-end px-6 py-4 border-t bg-muted/20">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={onEdit} className="gap-2 bg-gradient-oklahoma hover:opacity-90 text-white">
            <Edit3 className="h-4 w-4" />
            Edit Lesson Plan
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
