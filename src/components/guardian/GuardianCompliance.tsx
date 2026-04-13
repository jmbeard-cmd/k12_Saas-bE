/**
 * GuardianCompliance — Compliance tab for the Guardian Portal
 *
 * Renders FERPA, Media Release, and OK ICAP consent forms.
 * When a parent clicks "Sign", their custodial key signs a kind:38467 Nostr event
 * and publishes it to wss://beginningend.com.
 */

import { useState } from 'react';
import {
  Shield, FileText, Camera, GraduationCap,
  CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp,
  Lock, Key, AlertCircle, Info, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import {
  useConsentRecords,
  usePublishConsent,
  getConsentStatus,
  type FormType,
  type ConsentStatus,
} from '@/hooks/useComplianceConsent';

// ─── Form definitions ─────────────────────────────────────────────────────────

interface FormDef {
  id: FormType;
  title: string;
  subtitle: string;
  Icon: React.ElementType;
  iconColor: string;
  version: string;
  school: string;
  summary: string;
  fullText: string[];
  scope?: string;
}

const FORMS: FormDef[] = [
  {
    id: 'ferpa',
    title: 'FERPA Annual Notification',
    subtitle: 'Family Educational Rights and Privacy Act',
    Icon: Shield,
    iconColor: 'text-blue-600',
    version: '2025-A',
    school: 'Oklahoma K-12 Connect',
    summary:
      'Acknowledges your rights under FERPA to inspect, review, and request corrections to your child\'s educational records.',
    fullText: [
      'Under the Family Educational Rights and Privacy Act (FERPA), parents and eligible students have the right to:',
      '• Inspect and review education records maintained by the school.',
      '• Request correction of records believed to be inaccurate or misleading.',
      '• Consent to disclosures of personally identifiable information, except as authorized by law.',
      '• File a complaint with the U.S. Department of Education concerning alleged failures to comply with FERPA.',
      'The school discloses education records without prior written consent only to school officials with a legitimate educational interest, and as otherwise permitted by 34 CFR Part 99.',
      'Signing this form acknowledges receipt of this annual FERPA notification for the current school year.',
    ],
  },
  {
    id: 'media',
    title: 'Media Release Authorization',
    subtitle: 'Photo & Video Consent for Educational Use',
    Icon: Camera,
    iconColor: 'text-emerald-600',
    version: '2025-A',
    school: 'Oklahoma K-12 Connect',
    scope: 'educational-media',
    summary:
      'Authorizes the school to capture and use photos/videos of your child for educational, school-published media on the bE platform.',
    fullText: [
      'By signing this Media Release, you authorize Oklahoma K-12 Connect and its partner schools to:',
      '• Photograph or video record your child during school activities, events, and classroom instruction.',
      '• Publish approved media to the bE Guardian Portal, school announcements, and official school communications.',
      '• Use such media for educational and school promotional purposes — never for third-party advertising.',
      'All media is hosted on the bE Nostr relay (wss://beginningend.com) and is accessible only to authenticated parents and school staff.',
      'You may revoke this consent at any time by re-signing this form with the "Deny" option. Revocation takes effect within 48 hours.',
    ],
  },
  {
    id: 'ok-icap',
    title: 'Oklahoma Individual Career Academic Plan',
    subtitle: 'OK ICAP Acknowledgement (Grades 6–12)',
    Icon: GraduationCap,
    iconColor: 'text-purple-600',
    version: '2025-A',
    school: 'Oklahoma K-12 Connect',
    summary:
      'Acknowledges participation in the Oklahoma ICAP program — a state-required four-year academic and career planning process.',
    fullText: [
      'Oklahoma law (70 O.S. § 1210.508) requires each student in grades 6–12 to develop and annually update an Individual Career and Academic Plan (ICAP).',
      'The ICAP program is designed to:',
      '• Help students explore career interests and align coursework to career goals.',
      '• Ensure students meet state and federal graduation requirements.',
      '• Qualify students for Oklahoma Promise (OHLAP) scholarship eligibility.',
      'By signing this form, you as a parent/guardian acknowledge:',
      '• Awareness of your child\'s current ICAP on file with the school counselor.',
      '• Your right to participate in ICAP review meetings each academic year.',
      '• That this digital signature via the bE Guardian Portal constitutes a legally valid consent record under Oklahoma state guidelines.',
    ],
  },
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ConsentStatus | undefined }) {
  if (!status) {
    return (
      <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300 bg-amber-50">
        <Clock className="h-3 w-3" />
        Pending
      </Badge>
    );
  }
  if (status === 'granted') {
    return (
      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-300 bg-emerald-50">
        <CheckCircle2 className="h-3 w-3" />
        Signed
      </Badge>
    );
  }
  if (status === 'revoked') {
    return (
      <Badge variant="outline" className="gap-1 text-gray-500 border-gray-300 bg-gray-50">
        <XCircle className="h-3 w-3" />
        Revoked
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-red-600 border-red-300 bg-red-50">
      <XCircle className="h-3 w-3" />
      Denied
    </Badge>
  );
}

// ─── Sign dialog ──────────────────────────────────────────────────────────────

interface SignDialogProps {
  form: FormDef;
  studentName: string;
  parentName: string;
  parentPubkey: string;
  open: boolean;
  onClose: () => void;
  onSign: (consent: ConsentStatus, notes: string) => Promise<void>;
  isSigning: boolean;
}

function SignDialog({
  form, studentName, parentName, open, onClose, onSign, isSigning,
}: SignDialogProps) {
  const [notes, setNotes] = useState('');
  const [choice, setChoice] = useState<ConsentStatus>('granted');

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <form.Icon className={`h-5 w-5 ${form.iconColor}`} />
            Sign: {form.title}
          </DialogTitle>
          <DialogDescription>
            This action will sign a Nostr event with your custodial key and publish it to{' '}
            <code className="text-xs font-mono text-primary">wss://beginningend.com</code>.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Student / parent info */}
          <div className="rounded-lg bg-muted/40 px-4 py-3 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Student</span>
              <span className="font-medium">{studentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Guardian</span>
              <span className="font-medium">{parentName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Form version</span>
              <span className="font-mono text-xs">{form.version}</span>
            </div>
          </div>

          {/* Consent choice */}
          <div className="flex gap-3">
            <button
              onClick={() => setChoice('granted')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all ${
                choice === 'granted'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-border text-muted-foreground hover:border-emerald-300'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Grant Consent
            </button>
            <button
              onClick={() => setChoice('denied')}
              className={`flex-1 flex items-center justify-center gap-2 rounded-lg border-2 py-3 text-sm font-semibold transition-all ${
                choice === 'denied'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-border text-muted-foreground hover:border-red-300'
              }`}
            >
              <XCircle className="h-4 w-4" />
              Deny Consent
            </button>
          </div>

          {/* Optional notes */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
              Optional notes (included in signed record)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any comments or conditions…"
              rows={2}
              className="text-sm resize-none"
            />
          </div>

          {/* Cryptographic notice */}
          <Alert className="py-2.5">
            <Key className="h-3.5 w-3.5" />
            <AlertDescription className="text-xs leading-relaxed">
              Clicking <strong>Sign &amp; Publish</strong> will use your custodial Nostr key to
              sign a <code>kind:38467</code> event. The signature is cryptographically
              verifiable and timestamped on the relay.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isSigning}>
            Cancel
          </Button>
          <Button
            onClick={() => onSign(choice, notes)}
            disabled={isSigning}
            className={choice === 'denied' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {isSigning ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                Signing…
              </>
            ) : (
              <>
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                Sign &amp; Publish
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Form card ────────────────────────────────────────────────────────────────

interface FormCardProps {
  form: FormDef;
  record: ReturnType<typeof getConsentStatus>;
  onSignClick: () => void;
}

function FormCard({ form, record, onSignClick }: FormCardProps) {
  const [expanded, setExpanded] = useState(false);
  const status = record?.consent;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 p-2 rounded-lg bg-muted/50`}>
              <form.Icon className={`h-5 w-5 ${form.iconColor}`} />
            </div>
            <div>
              <CardTitle className="text-base leading-tight">{form.title}</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{form.subtitle}</p>
            </div>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <p className="text-sm text-muted-foreground">{form.summary}</p>

        {/* Signed record details */}
        {record && (
          <div className="rounded-lg bg-muted/30 px-3 py-2.5 text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Signed</span>
              <span className="font-medium">
                {new Date(record.signedAt).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Event ID</span>
              <code className="font-mono text-[10px] text-primary">
                {record.event.id.slice(0, 12)}…
              </code>
            </div>
            {record.notes && (
              <div className="pt-1 border-t border-border/50">
                <span className="text-muted-foreground">Notes: </span>
                <span>{record.notes}</span>
              </div>
            )}
          </div>
        )}

        {/* Expandable full text */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          {expanded ? 'Hide' : 'Read'} full form text
        </button>

        {expanded && (
          <div className="rounded-lg bg-muted/20 border border-border/50 px-4 py-3 space-y-2">
            {form.fullText.map((line, i) => (
              <p key={i} className="text-xs text-muted-foreground leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            Form {form.version} · {form.school}
          </span>
          <Button size="sm" onClick={onSignClick} variant={status === 'granted' ? 'outline' : 'default'}>
            <Lock className="h-3.5 w-3.5 mr-1.5" />
            {status === 'granted' ? 'Update Signature' : status ? 'Re-sign' : 'Sign Form'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface GuardianComplianceProps {
  studentName?: string;
}

export function ComplianceTab({ studentName = 'Elijah' }: GuardianComplianceProps) {
  const { user } = useCurrentUser();
  const { account } = useCustodialAuth();

  const parentPubkey = user?.pubkey;
  const parentName = account?.displayName ?? 'Parent/Guardian';

  const { data: records, isLoading, isError, refetch } = useConsentRecords(parentPubkey);
  const { mutateAsync: publishConsent } = usePublishConsent();

  // Active sign dialog state
  const [activeForm, setActiveForm] = useState<FormDef | null>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [signResult, setSignResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSign = async (consent: ConsentStatus, notes: string) => {
    if (!activeForm || !parentPubkey) return;
    setIsSigning(true);
    setSignResult(null);
    try {
      await publishConsent({
        formType: activeForm.id,
        formVersion: activeForm.version,
        studentName,
        school: activeForm.school,
        consent,
        scope: activeForm.scope,
        parentName,
        notes,
      });
      setSignResult({ ok: true, msg: `"${activeForm.title}" signed successfully and published to the school relay.` });
      setActiveForm(null);
    } catch (err) {
      setSignResult({ ok: false, msg: err instanceof Error ? err.message : 'Failed to sign. Please try again.' });
    } finally {
      setIsSigning(false);
    }
  };

  // Not logged in
  if (!user || !parentPubkey) {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          You must be logged in with a custodial account to sign compliance forms.
        </AlertDescription>
      </Alert>
    );
  }

  const completedCount = FORMS.filter((f) =>
    records && getConsentStatus(records, parentPubkey, studentName, f.id, f.scope)?.consent === 'granted'
  ).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Compliance &amp; Consent
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and sign required forms for <strong>{studentName}</strong>. Each signature is
            cryptographically signed with your Nostr key.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => refetch()} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Progress summary */}
      <div className="flex items-center gap-3 rounded-xl border px-4 py-3 bg-muted/20">
        <div className="flex-1">
          <div className="text-sm font-semibold mb-1">
            {completedCount} of {FORMS.length} forms signed
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${(completedCount / FORMS.length) * 100}%` }}
            />
          </div>
        </div>
        {completedCount === FORMS.length ? (
          <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            All Complete
          </Badge>
        ) : (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1">
            <Clock className="h-3 w-3" />
            {FORMS.length - completedCount} Pending
          </Badge>
        )}
      </div>

      {/* Relay status */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        <span>Records stored on</span>
        <code className="font-mono text-primary">wss://beginningend.com</code>
        <Info className="h-3.5 w-3.5 ml-1" />
        <span>Signed with your custodial key · kind:38467</span>
      </div>

      {/* Error */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Could not load existing consent records. Your new signatures will still be published.
          </AlertDescription>
        </Alert>
      )}

      {/* Result toast */}
      {signResult && (
        <Alert variant={signResult.ok ? 'default' : 'destructive'} className="animate-slide-up">
          {signResult.ok
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            : <AlertCircle className="h-4 w-4" />
          }
          <AlertDescription>{signResult.msg}</AlertDescription>
        </Alert>
      )}

      {/* Form cards */}
      <div className="space-y-4">
        {FORMS.map((form) => (
          <FormCard
            key={form.id}
            form={form}
            record={records
              ? getConsentStatus(records, parentPubkey, studentName, form.id, form.scope)
              : undefined
            }
            onSignClick={() => { setSignResult(null); setActiveForm(form); }}
          />
        ))}
      </div>

      {/* Nostr transparency note */}
      <div className="rounded-xl bg-muted/30 border border-border/60 px-4 py-3 text-xs text-muted-foreground space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <Key className="h-3.5 w-3.5" />
          Cryptographic Transparency
        </div>
        <p>
          Each signed form is a <code className="font-mono">kind:38467</code> Nostr event,
          addressable by parent pubkey × student × form type. The event is signed with your
          custodial private key and verifiable by any Nostr client. Records are stored on{' '}
          <code className="font-mono">wss://beginningend.com</code> — the school's authoritative relay.
        </p>
        <p>
          Under FERPA, you may request a copy of any signed record. Contact your school
          administrator with the event ID shown on each signed form.
        </p>
      </div>

      {/* Sign dialog */}
      {activeForm && (
        <SignDialog
          form={activeForm}
          studentName={studentName}
          parentName={parentName}
          parentPubkey={parentPubkey}
          open={!!activeForm}
          onClose={() => setActiveForm(null)}
          onSign={handleSign}
          isSigning={isSigning}
        />
      )}
    </div>
  );
}

export default ComplianceTab;
