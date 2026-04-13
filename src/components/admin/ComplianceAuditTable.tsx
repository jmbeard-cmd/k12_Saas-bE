/**
 * ComplianceAuditTable
 *
 * Admin-only component that renders a table of all student accounts with
 * live indicators showing whether each required consent form has been signed
 * (kind:38467 events on wss://beginningend.com).
 *
 * Columns:
 *   Student Name | Grade | School | FERPA | Media Release | OK ICAP | Overall
 *
 * Green checkmark  = "granted" event found on relay
 * Red X            = event found but denied / revoked
 * Amber clock      = no event found yet (pending)
 */

import { useState } from 'react';
import {
  CheckCircle2, XCircle, Clock, RefreshCw, Download,
  Search, ChevronUp, ChevronDown, Shield, AlertTriangle,
  Info, ExternalLink,
} from 'lucide-react';
import { nip19 } from 'nostr-tools';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  useComplianceAudit,
  REQUIRED_FORMS,
  type AuditRow,
  type FormAuditStatus,
} from '@/hooks/useComplianceAudit';
import type { FormType } from '@/hooks/useComplianceConsent';

// ─── Cell icon ────────────────────────────────────────────────────────────────

function ConsentCell({ status }: { status: FormAuditStatus }) {
  if (status.signed) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500 drop-shadow-sm" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-xs">
            <p className="font-semibold text-emerald-600">Consent Granted ✓</p>
            {status.signedAt && (
              <p className="text-muted-foreground">
                Signed {new Date(status.signedAt * 1000).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
            {status.eventId && (
              <p className="font-mono text-[10px] text-primary mt-0.5">
                Event: {status.eventId.slice(0, 12)}…
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (status.consentValue === 'denied' || status.consentValue === 'revoked') {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="inline-flex items-center justify-center">
              <XCircle className="h-5 w-5 text-red-400" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-xs capitalize">
            <p className="font-semibold text-red-600">Consent {status.consentValue}</p>
            {status.signedAt && (
              <p className="text-muted-foreground">
                Recorded {new Date(status.signedAt * 1000).toLocaleDateString('en-US', {
                  month: 'short', day: 'numeric', year: 'numeric',
                })}
              </p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-400" />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p className="font-semibold text-amber-600">Pending — not yet signed</p>
          <p className="text-muted-foreground">No event found on relay</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// ─── Overall badge ────────────────────────────────────────────────────────────

function OverallBadge({ row }: { row: AuditRow }) {
  if (row.fullyCompliant) {
    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 gap-1 text-[11px]">
        <CheckCircle2 className="h-3 w-3" />
        Complete
      </Badge>
    );
  }
  if (row.signedCount === 0) {
    return (
      <Badge variant="outline" className="text-red-600 border-red-300 bg-red-50 gap-1 text-[11px]">
        <XCircle className="h-3 w-3" />
        No forms
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 gap-1 text-[11px]">
      <Clock className="h-3 w-3" />
      {row.signedCount}/{REQUIRED_FORMS.length}
    </Badge>
  );
}

// ─── Skeleton row ─────────────────────────────────────────────────────────────

function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="border-b">
          <td className="px-4 py-3">
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-2.5 w-20" />
              </div>
            </div>
          </td>
          <td className="px-4 py-3"><Skeleton className="h-3.5 w-12" /></td>
          <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></td>
          <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></td>
          <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-5 rounded-full mx-auto" /></td>
          <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-16 rounded-full mx-auto" /></td>
        </tr>
      ))}
    </>
  );
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

type SortKey = 'name' | 'grade' | 'signed' | FormType;
type SortDir = 'asc' | 'desc';

function sortRows(rows: AuditRow[], key: SortKey, dir: SortDir): AuditRow[] {
  return [...rows].sort((a, b) => {
    let cmp = 0;
    if (key === 'name') {
      cmp = a.student.displayName.localeCompare(b.student.displayName);
    } else if (key === 'grade') {
      cmp = (a.student.grade ?? '').localeCompare(b.student.grade ?? '');
    } else if (key === 'signed') {
      cmp = a.signedCount - b.signedCount;
    } else {
      // form type sort: signed > pending > denied
      const getScore = (row: AuditRow) => {
        const f = row.forms.find((x) => x.formType === key);
        if (!f) return -1;
        if (f.signed) return 2;
        if (f.consentValue) return 1;
        return 0;
      };
      cmp = getScore(a) - getScore(b);
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}

// ─── CSV export ───────────────────────────────────────────────────────────────

function exportCsv(rows: AuditRow[]) {
  const headers = ['Student Name', 'Email', 'Grade', 'School', ...REQUIRED_FORMS.map((f) => f.abbr), 'Signed Count', 'Fully Compliant'];
  const csvRows = rows.map((row) => [
    row.student.displayName,
    row.student.email,
    row.student.grade ?? '',
    row.student.school ?? '',
    ...row.forms.map((f) => (f.signed ? 'Granted' : f.consentValue ? f.consentValue : 'Pending')),
    row.signedCount,
    row.fullyCompliant ? 'Yes' : 'No',
  ]);
  const content = [headers, ...csvRows].map((r) => r.join(',')).join('\n');
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compliance-audit-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ComplianceAuditTable() {
  const { data: rows, isLoading, isError, refetch, isFetching } = useComplianceAudit();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('signed');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showRelay, setShowRelay] = useState(false);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ colKey }: { colKey: SortKey }) => {
    if (sortKey !== colKey) return <ChevronUp className="h-3 w-3 opacity-20" />;
    return sortDir === 'asc'
      ? <ChevronUp className="h-3 w-3 text-primary" />
      : <ChevronDown className="h-3 w-3 text-primary" />;
  };

  const filtered = rows
    ? sortRows(
        rows.filter((r) =>
          r.student.displayName.toLowerCase().includes(search.toLowerCase()) ||
          r.student.email.toLowerCase().includes(search.toLowerCase()) ||
          (r.student.grade ?? '').toLowerCase().includes(search.toLowerCase())
        ),
        sortKey,
        sortDir
      )
    : [];

  // Summary stats
  const total = rows?.length ?? 0;
  const compliant = rows?.filter((r) => r.fullyCompliant).length ?? 0;
  const partial = rows?.filter((r) => !r.fullyCompliant && r.signedCount > 0).length ?? 0;
  const none = rows?.filter((r) => r.signedCount === 0).length ?? 0;
  const pctComplete = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
        <Shield className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Live Compliance Audit</strong> — This table queries{' '}
          <code className="font-mono text-xs">wss://beginningend.com</code> in real-time for
          signed <code className="font-mono text-xs">kind:38467</code> consent events. A{' '}
          <CheckCircle2 className="inline h-3.5 w-3.5 text-emerald-600 mx-0.5 -mt-0.5" />
          green checkmark means a verified cryptographic signature exists on the relay.
        </AlertDescription>
      </Alert>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{total}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Total Students</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600">{compliant}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Fully Compliant</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{partial}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Partially Signed</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{none}</div>
            <div className="text-xs text-muted-foreground mt-0.5">No Forms Signed</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Overall compliance rate</span>
            <span className="font-semibold text-foreground">{pctComplete}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${pctComplete}%` }}
            />
          </div>
        </div>
      )}

      {/* Table card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Student Consent Records
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Consent status pulled live from{' '}
                <button
                  className="font-mono text-primary hover:underline"
                  onClick={() => setShowRelay((v) => !v)}
                >
                  wss://beginningend.com
                </button>
              </CardDescription>
            </div>
            <div className="sm:ml-auto flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search students…"
                  className="pl-8 h-8 text-xs w-48"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {rows && rows.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => exportCsv(rows)}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  CSV
                </Button>
              )}
            </div>
          </div>

          {/* Relay info panel */}
          {showRelay && (
            <div className="mt-3 rounded-lg bg-muted/40 px-3 py-2.5 text-xs space-y-1 border border-border/60">
              <div className="flex items-center gap-1.5 font-semibold text-foreground">
                <Info className="h-3.5 w-3.5 text-primary" />
                Relay Query Details
              </div>
              <p className="text-muted-foreground">
                Querying <code className="font-mono text-primary">kind:38467</code> events
                with <code className="font-mono text-primary">#t: oklahoma-k12-compliance</code> tag.
                Results are matched to registered student accounts by the{' '}
                <code className="font-mono text-primary">ok-student-name</code> tag.
                Only events with <code className="font-mono text-primary">ok-consent: granted</code> count
                as signed.
              </p>
              <a
                href="https://beginningend.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3 w-3" />
                Open school relay
              </a>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {isError && (
            <div className="p-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Could not reach the school relay. Consent status shown below reflects locally
                  registered students with no live data. Check your connection and try refreshing.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/30">
                  {/* Student */}
                  <th
                    className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort('name')}
                  >
                    <span className="flex items-center gap-1">
                      Student
                      <SortIcon colKey="name" />
                    </span>
                  </th>
                  {/* Grade */}
                  <th
                    className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort('grade')}
                  >
                    <span className="flex items-center gap-1">
                      Grade
                      <SortIcon colKey="grade" />
                    </span>
                  </th>
                  {/* One column per form */}
                  {REQUIRED_FORMS.map((form) => (
                    <th
                      key={form.id}
                      className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none"
                      onClick={() => handleSort(form.id)}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {form.abbr}
                        <SortIcon colKey={form.id} />
                      </span>
                    </th>
                  ))}
                  {/* Overall */}
                  <th
                    className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort('signed')}
                  >
                    <span className="flex items-center justify-center gap-1">
                      Status
                      <SortIcon colKey="signed" />
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <SkeletonRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={3 + REQUIRED_FORMS.length + 1} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Shield className="h-8 w-8 opacity-30" />
                        <p className="text-sm">
                          {search
                            ? 'No students match your search.'
                            : 'No student accounts registered yet.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const initials = row.student.displayName
                      .split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                    const npub = row.student.keys.pubkey
                      ? nip19.npubEncode(row.student.keys.pubkey)
                      : '';

                    return (
                      <tr
                        key={row.student.email}
                        className={`border-b last:border-0 hover:bg-muted/20 transition-colors ${
                          row.fullyCompliant ? '' : 'bg-amber-50/30 dark:bg-amber-950/10'
                        }`}
                      >
                        {/* Student cell */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              row.fullyCompliant
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{row.student.displayName}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{row.student.email}</p>
                              {npub && (
                                <p className="text-[10px] font-mono text-muted-foreground/50 truncate max-w-[160px]">
                                  {npub.slice(0, 12)}…
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Grade cell */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">
                            {row.student.grade ? `Grade ${row.student.grade}` : '—'}
                          </span>
                        </td>

                        {/* Form status cells */}
                        {row.forms.map((formStatus) => (
                          <td key={formStatus.formType} className="px-4 py-3 text-center">
                            <ConsentCell status={formStatus} />
                          </td>
                        ))}

                        {/* Overall status */}
                        <td className="px-4 py-3 text-center">
                          <OverallBadge row={row} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer legend */}
          {!isLoading && filtered.length > 0 && (
            <div className="px-4 py-3 border-t bg-muted/10 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                Consent granted on relay
              </div>
              <div className="flex items-center gap-1.5">
                <XCircle className="h-3.5 w-3.5 text-red-400" />
                Denied or revoked
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-amber-400" />
                Pending — no event found
              </div>
              <span className="ml-auto">
                Showing {filtered.length} of {total} student{total !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
