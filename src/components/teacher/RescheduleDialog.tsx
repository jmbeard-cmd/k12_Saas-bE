import { useState } from 'react';
import { CalendarDays, AlertTriangle, CheckCircle2, GitBranch, Clock, FileText } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RFC_OPTIONS, RFC_CATEGORY_LABELS } from '@/lib/okStandards';
import type { ParsedAssignment } from '@/hooks/useAssignmentEvents';
import { useRescheduleAssignment, useAssignmentHistory } from '@/hooks/useAssignmentEvents';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useToast } from '@/hooks/useToast';
import { ASSIGNMENT_TYPE_LABELS, ASSIGNMENT_TYPE_COLORS } from '@/lib/okStandards';
import { cn } from '@/lib/utils';

interface RescheduleDialogProps {
  open: boolean;
  onClose: () => void;
  assignment: ParsedAssignment | null;
}

// Group RFC options by category
const rfcByCategory = RFC_OPTIONS.reduce<Record<string, typeof RFC_OPTIONS>>(
  (acc, opt) => {
    (acc[opt.category] ??= []).push(opt);
    return acc;
  },
  {}
);

export function RescheduleDialog({ open, onClose, assignment }: RescheduleDialogProps) {
  const { user } = useCurrentUser();
  const { toast } = useToast();
  const reschedule = useRescheduleAssignment();
  const history = useAssignmentHistory(user?.pubkey, assignment?.dTag);

  const [newDate, setNewDate] = useState('');
  const [rfcCode, setRfcCode] = useState('');
  const [rfcNote, setRfcNote] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'done'>('form');

  const selectedRfc = RFC_OPTIONS.find((r) => r.value === rfcCode);

  const handleClose = () => {
    setNewDate('');
    setRfcCode('');
    setRfcNote('');
    setStep('form');
    onClose();
  };

  const handleSubmit = async () => {
    if (!assignment) return;
    if (step === 'form') {
      setStep('confirm');
      return;
    }

    try {
      await reschedule.mutateAsync({
        existingEvent: assignment.event,
        newDate,
        rfcCode,
        rfcNote: rfcNote.trim() || undefined,
      });
      setStep('done');
      toast({
        title: 'Assignment Rescheduled',
        description: `A new signed NIP-52 event (v${assignment.version + 1}) has been published to wss://beginningend.com.`,
      });
    } catch (err) {
      toast({
        title: 'Reschedule Failed',
        description: err instanceof Error ? err.message : 'Failed to publish event.',
        variant: 'destructive',
      });
    }
  };

  if (!assignment) return null;

  const typeColor = ASSIGNMENT_TYPE_COLORS[assignment.assignmentType] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = ASSIGNMENT_TYPE_LABELS[assignment.assignmentType] ?? assignment.assignmentType;
  const isFormValid = newDate && rfcCode && (!selectedRfc?.requiresNote || rfcNote.trim().length > 0);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            Reschedule Assignment
          </DialogTitle>
          <DialogDescription>
            A new signed NIP-52 event will replace the current one, preserving an on-chain audit trail.
          </DialogDescription>
        </DialogHeader>

        {/* Assignment Card */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <p className="font-semibold text-sm leading-snug">{assignment.title}</p>
            <Badge className={cn('text-[10px] px-1.5 flex-shrink-0', typeColor)}>{typeLabel}</Badge>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Current date: <strong className="text-foreground ml-1">{assignment.startDate}</strong>
            </span>
            <span>{assignment.className}</span>
            {assignment.maxPoints && <span>{assignment.maxPoints} pts</span>}
          </div>
          {assignment.version > 0 && (
            <div className="flex items-center gap-1.5 text-xs">
              <GitBranch className="h-3 w-3 text-amber-500" />
              <span className="text-amber-600 font-medium">Version {assignment.version} — has been rescheduled before</span>
            </div>
          )}
        </div>

        {step !== 'done' && (
          <>
            <Separator />

            {/* Step 1: Form */}
            {step === 'form' && (
              <div className="space-y-4">
                {/* New Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="new-date" className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-primary" />
                    New Due Date <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="new-date"
                    type="date"
                    value={newDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full"
                  />
                  {newDate && newDate <= assignment.startDate && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      New date is the same or earlier than current date.
                    </p>
                  )}
                </div>

                {/* RFC Dropdown */}
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-primary" />
                    Reason for Change (RFC) <span className="text-destructive">*</span>
                  </Label>
                  <Select value={rfcCode} onValueChange={setRfcCode}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a reason for rescheduling…" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {Object.entries(rfcByCategory).map(([cat, opts]) => (
                        <SelectGroup key={cat}>
                          <SelectLabel className="text-xs font-bold text-muted-foreground py-1.5">
                            {RFC_CATEGORY_LABELS[cat] ?? cat}
                          </SelectLabel>
                          {opts.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              <span className="flex items-center gap-2">
                                {opt.label}
                                {opt.requiresNote && (
                                  <span className="text-[10px] text-amber-600 font-medium">(note required)</span>
                                )}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedRfc && (
                    <p className="text-xs text-muted-foreground bg-muted/50 rounded px-2 py-1">
                      Category: <span className="font-medium">{RFC_CATEGORY_LABELS[selectedRfc.category]}</span>
                      {selectedRfc.requiresNote && (
                        <span className="text-amber-600 ml-2">• A note is required for this reason.</span>
                      )}
                    </p>
                  )}
                </div>

                {/* RFC Note */}
                <div className="space-y-1.5">
                  <Label htmlFor="rfc-note" className="flex items-center justify-between">
                    <span>
                      Additional Notes
                      {selectedRfc?.requiresNote && <span className="text-destructive ml-1">*</span>}
                    </span>
                    <span className="text-xs text-muted-foreground font-normal">
                      This note is embedded in the signed Nostr event.
                    </span>
                  </Label>
                  <Textarea
                    id="rfc-note"
                    placeholder={
                      selectedRfc?.requiresNote
                        ? 'Required: Please elaborate on the reason for rescheduling…'
                        : 'Optional: Add any relevant context for this change…'
                    }
                    value={rfcNote}
                    onChange={(e) => setRfcNote(e.target.value)}
                    rows={3}
                    className="resize-none text-sm"
                  />
                </div>

                {/* Nostr audit info */}
                <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 py-2.5">
                  <GitBranch className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                    <strong>Audit trail:</strong> A new NIP-52 event (v{assignment.version + 1}) will be signed with your Nostr key and published to{' '}
                    <code className="font-mono">wss://beginningend.com</code>. It will reference the previous event ID for a verifiable change history.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            {/* Step 2: Confirm */}
            {step === 'confirm' && (
              <div className="space-y-4">
                <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                    You are about to sign and publish a reschedule event. This action is <strong>permanent</strong> and will be recorded on the Nostr network.
                  </AlertDescription>
                </Alert>

                <div className="rounded-xl border divide-y text-sm">
                  {[
                    { label: 'Assignment', value: assignment.title },
                    { label: 'Previous Date', value: assignment.startDate },
                    { label: 'New Date', value: newDate },
                    { label: 'Reason', value: selectedRfc?.label ?? rfcCode },
                    { label: 'Version', value: `v${assignment.version} → v${assignment.version + 1}` },
                    ...(rfcNote.trim() ? [{ label: 'Note', value: rfcNote.trim() }] : []),
                  ].map(({ label, value }) => (
                    <div key={label} className="flex px-3 py-2 gap-3">
                      <span className="text-muted-foreground w-28 flex-shrink-0">{label}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              {step === 'form' ? (
                <>
                  <Button variant="outline" onClick={handleClose}>Cancel</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className="bg-gradient-oklahoma hover:opacity-90 text-white gap-2"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Review Change
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setStep('form')}>Back</Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={reschedule.isPending}
                    className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
                  >
                    {reschedule.isPending ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Signing & Publishing…
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm Reschedule
                      </>
                    )}
                  </Button>
                </>
              )}
            </DialogFooter>
          </>
        )}

        {/* Done State */}
        {step === 'done' && (
          <div className="space-y-4">
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950/40 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-lg mb-1">Reschedule Published</h3>
              <p className="text-sm text-muted-foreground">
                Version {assignment.version + 1} signed and broadcast to{' '}
                <code className="font-mono text-primary text-xs">wss://beginningend.com</code>
              </p>
            </div>

            <div className="rounded-xl border border-green-200 bg-green-50 dark:bg-green-950/20 p-3 space-y-1.5 text-xs">
              <p className="font-semibold text-green-800 dark:text-green-300 flex items-center gap-1.5">
                <GitBranch className="h-3.5 w-3.5" />
                Audit Trail Entry Created
              </p>
              <div className="space-y-0.5 text-green-700 dark:text-green-400">
                <p>• NIP-52 kind:31922 event signed with your Nostr keypair</p>
                <p>• Previous event ID embedded via <code className="font-mono bg-green-100 dark:bg-green-900/40 px-1 rounded">ok-prev-event</code> tag</p>
                <p>• RFC code <code className="font-mono bg-green-100 dark:bg-green-900/40 px-1 rounded">{rfcCode}</code> embedded in event tags</p>
                <p>• Relay will replace the old event; history preserved via tag chain</p>
              </div>
            </div>

            {/* History preview */}
            {history.data && history.data.length > 1 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Change History ({history.data.length} versions)
                </p>
                <div className="space-y-1.5">
                  {history.data.slice(0, 5).map((h, i) => (
                    <div key={h.event.id} className="flex items-center gap-2 text-xs">
                      <div className={cn(
                        'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                        i === 0 ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                      )}>
                        v{h.version}
                      </div>
                      <div className="flex-1">
                        <span className="font-medium">{h.startDate}</span>
                        {h.rfcCode && (
                          <span className="text-muted-foreground ml-2">
                            RFC: {RFC_OPTIONS.find((r) => r.value === h.rfcCode)?.label ?? h.rfcCode}
                          </span>
                        )}
                      </div>
                      <span className="text-muted-foreground/60 font-mono">
                        {h.event.id.slice(0, 8)}…
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
