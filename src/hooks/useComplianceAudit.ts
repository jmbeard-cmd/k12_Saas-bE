/**
 * useComplianceAudit
 *
 * Admin-only hook that queries the school relay (wss://beginningend.com) for
 * kind:38467 consent events across ALL student pubkeys registered in the system.
 *
 * For each student account we check whether the three required consent forms
 * (FERPA, Media Release, OK ICAP) have been signed (status = "granted") by
 * their parent/guardian.
 *
 * Because the d-tag encodes the *parent's* pubkey, we query all kind:38467
 * events with the compliance t-tag and then derive per-student compliance
 * state by matching the student name tag.
 *
 * The hook returns an array of AuditRow — one per student account — ordered
 * by compliance completeness (incomplete first) then alphabetically.
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { getAllAccounts, type UserAccount } from '@/lib/custodialKeys';
import { SCHOOL_RELAY } from './useStudentProgress';
import {
  KIND_COMPLIANCE,
  COMPLIANCE_T_TAG,
  type FormType,
  type ConsentStatus,
} from './useComplianceConsent';

// ─── Types ────────────────────────────────────────────────────────────────────

export const REQUIRED_FORMS: { id: FormType; label: string; abbr: string }[] = [
  { id: 'ferpa',   label: 'FERPA Annual Notification',       abbr: 'FERPA'   },
  { id: 'media',   label: 'Media Release Authorization',     abbr: 'Media'   },
  { id: 'ok-icap', label: 'Oklahoma ICAP Acknowledgement',   abbr: 'OK ICAP' },
];

export interface FormAuditStatus {
  formType: FormType;
  /** Whether a "granted" consent event exists on the relay */
  signed: boolean;
  /** Unix timestamp of the last event for this form (undefined = never published) */
  signedAt?: number;
  /** Relay event ID (short) */
  eventId?: string;
  /** The actual consent value from the event (could be "denied" or "revoked") */
  consentValue?: ConsentStatus;
}

export interface AuditRow {
  student: UserAccount;
  forms: FormAuditStatus[];
  /** Count of forms with status "granted" */
  signedCount: number;
  /** true = all three required forms have been granted */
  fullyCompliant: boolean;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

/**
 * Build audit rows from a flat list of consent events.
 * We group events by student name, then for each student account we resolve
 * the latest event per form type.
 */
function buildAuditRows(
  studentAccounts: UserAccount[],
  events: NostrEvent[]
): AuditRow[] {
  // Index events by (studentName_lower → formType → latest event)
  const byStudentForm = new Map<string, Map<FormType, NostrEvent>>();

  for (const ev of events) {
    const studentName = getTag(ev, 'ok-student-name');
    const formType = getTag(ev, 'ok-form-type') as FormType | undefined;
    if (!studentName || !formType) continue;

    const key = studentName.toLowerCase();
    if (!byStudentForm.has(key)) byStudentForm.set(key, new Map());
    const formMap = byStudentForm.get(key)!;
    const existing = formMap.get(formType);
    if (!existing || ev.created_at > existing.created_at) {
      formMap.set(formType, ev);
    }
  }

  const rows: AuditRow[] = studentAccounts.map((student) => {
    const key = student.displayName.toLowerCase();
    const formMap = byStudentForm.get(key) ?? new Map<FormType, NostrEvent>();

    const forms: FormAuditStatus[] = REQUIRED_FORMS.map(({ id }) => {
      const ev = formMap.get(id);
      if (!ev) {
        return { formType: id, signed: false };
      }
      const consentValue = (getTag(ev, 'ok-consent') ?? 'denied') as ConsentStatus;
      return {
        formType: id,
        signed: consentValue === 'granted',
        signedAt: ev.created_at,
        eventId: ev.id,
        consentValue,
      };
    });

    const signedCount = forms.filter((f) => f.signed).length;
    return {
      student,
      forms,
      signedCount,
      fullyCompliant: signedCount === REQUIRED_FORMS.length,
    };
  });

  // Sort: incomplete first (by ascending signedCount), then alphabetically
  return rows.sort((a, b) => {
    if (a.signedCount !== b.signedCount) return a.signedCount - b.signedCount;
    return a.student.displayName.localeCompare(b.student.displayName);
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useComplianceAudit() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['admin', 'compliance-audit'],
    queryFn: async (): Promise<AuditRow[]> => {
      // 1. Get all local accounts and filter to students only
      const allAccounts = getAllAccounts();
      const students = allAccounts.filter((a) => a.role === 'student');

      if (students.length === 0) return [];

      // 2. Query the school relay for ALL compliance events that carry any
      //    student name matching our student list.
      //    We query broadly (all authors, filtered by t-tag) since consent is
      //    published by *parents*, not the students themselves.
      const relay = nostr.relay(SCHOOL_RELAY);

      const studentNames = students.map((s) => s.displayName.toLowerCase());

      // Fetch up to 1000 compliance events from the school relay
      const events = await relay.query(
        [{
          kinds: [KIND_COMPLIANCE],
          '#t': [COMPLIANCE_T_TAG],
          limit: 1000,
        }],
        { signal: AbortSignal.timeout(10_000) }
      );

      // 3. Filter to events that reference one of our students
      const relevant = events.filter((ev) => {
        const name = getTag(ev, 'ok-student-name')?.toLowerCase();
        return name && studentNames.includes(name);
      });

      // 4. Build and return audit rows
      return buildAuditRows(students, relevant);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
