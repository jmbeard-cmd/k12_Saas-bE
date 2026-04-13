/**
 * useComplianceConsent
 *
 * Manages kind:38467 Oklahoma K-12 Compliance Consent Records.
 *
 * Each consent form (FERPA, Media Release, OK ICAP) is published as a signed
 * addressable Nostr event using the parent's custodial key. The d-tag structure
 * ensures one authoritative record per parent×student×form combination on the relay.
 *
 * All events are published to and read from wss://beginningend.com.
 *
 * Signing is done through useCurrentUser().user.signer — the custodial nsec
 * injected into Nostrify at login via CustodialAuthProvider.
 */

import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import { SCHOOL_RELAY } from './useStudentProgress';

// ─── Constants ────────────────────────────────────────────────────────────────

export const KIND_COMPLIANCE = 38467;
export const COMPLIANCE_T_TAG = 'oklahoma-k12-compliance';

// ─── Types ────────────────────────────────────────────────────────────────────

export type FormType = 'ferpa' | 'media' | 'ok-icap';
export type ConsentStatus = 'granted' | 'denied' | 'revoked';

export interface ConsentRecord {
  /** Underlying Nostr event */
  event: NostrEvent;
  /** d-tag value */
  dTag: string;
  formType: FormType;
  formVersion: string;
  studentName: string;
  school: string;
  /** Consent status */
  consent: ConsentStatus;
  /** ISO-8601 string of when parent clicked Sign */
  signedAt: string;
  /** Optional media scope key (for media release forms) */
  scope?: string;
  parentName: string;
  parentPubkey: string;
  /** Optional notes from the parent */
  notes: string;
  /** Unix timestamp */
  createdAt: number;
}

export interface PublishConsentInput {
  formType: FormType;
  formVersion: string;
  studentName: string;
  school: string;
  consent: ConsentStatus;
  scope?: string;
  parentName: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32);
}

function buildDTag(parentPubkey: string, studentName: string, formType: FormType, scope?: string): string {
  const base = `${parentPubkey.slice(0, 16)}:${slugify(studentName)}:${formType}`;
  return scope ? `${base}:${slugify(scope)}` : base;
}

export function parseConsentRecord(event: NostrEvent): ConsentRecord {
  return {
    event,
    dTag: getTag(event, 'd') ?? '',
    formType: (getTag(event, 'ok-form-type') ?? 'ferpa') as FormType,
    formVersion: getTag(event, 'ok-form-version') ?? '2025-A',
    studentName: getTag(event, 'ok-student-name') ?? '',
    school: getTag(event, 'ok-school') ?? '',
    consent: (getTag(event, 'ok-consent') ?? 'denied') as ConsentStatus,
    signedAt: getTag(event, 'ok-signed-at') ?? new Date(event.created_at * 1000).toISOString(),
    scope: getTag(event, 'ok-scope'),
    parentName: getTag(event, 'ok-parent-name') ?? '',
    parentPubkey: event.pubkey,
    notes: event.content,
    createdAt: event.created_at,
  };
}

// ─── Query hook ───────────────────────────────────────────────────────────────

/**
 * Fetches all compliance consent records for the current parent from
 * wss://beginningend.com. Returns a map keyed by d-tag for O(1) lookup.
 */
export function useConsentRecords(parentPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'compliance', parentPubkey ?? 'none'],
    queryFn: async (): Promise<Map<string, ConsentRecord>> => {
      if (!parentPubkey) return new Map();

      const relay = nostr.relay(SCHOOL_RELAY);
      const events = await relay.query(
        [{
          kinds: [KIND_COMPLIANCE],
          authors: [parentPubkey],
          '#t': [COMPLIANCE_T_TAG],
          limit: 200,
        }],
        { signal: AbortSignal.timeout(8000) }
      );

      // Deduplicate: keep latest per d-tag
      const byDTag = new Map<string, NostrEvent>();
      for (const ev of events) {
        const d = getTag(ev, 'd') ?? ev.id;
        const existing = byDTag.get(d);
        if (!existing || ev.created_at > existing.created_at) {
          byDTag.set(d, ev);
        }
      }

      const result = new Map<string, ConsentRecord>();
      for (const [d, ev] of byDTag) {
        result.set(d, parseConsentRecord(ev));
      }
      return result;
    },
    enabled: !!parentPubkey,
    staleTime: 30_000,
  });
}

// ─── Publish hook ─────────────────────────────────────────────────────────────

/**
 * Signs and publishes a compliance consent event (kind:38467) using the
 * parent's custodial Nostr key via useCurrentUser().user.signer.
 */
export function usePublishConsent() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishConsentInput): Promise<NostrEvent> => {
      if (!user) throw new Error('Not signed in — please log in to sign consent forms.');

      const now = new Date().toISOString();
      const dTag = buildDTag(user.pubkey, input.studentName, input.formType, input.scope);

      const tags: string[][] = [
        ['d', dTag],
        ['t', COMPLIANCE_T_TAG],
        ['ok-form-type', input.formType],
        ['ok-form-version', input.formVersion],
        ['ok-student-name', input.studentName],
        ['ok-school', input.school],
        ['ok-consent', input.consent],
        ['ok-signed-at', now],
        ['ok-parent-name', input.parentName],
        ['alt', `Compliance consent: ${input.formType} for ${input.studentName} — ${input.consent}`],
      ];

      if (input.scope) tags.push(['ok-scope', input.scope]);
      if (location.protocol === 'https:') tags.push(['client', location.hostname]);

      const event = await user.signer.signEvent({
        kind: KIND_COMPLIANCE,
        content: input.notes?.trim() ?? '',
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      // Publish to the school relay
      const relay = nostr.relay(SCHOOL_RELAY);
      await relay.event(event, { signal: AbortSignal.timeout(8000) });

      return event;
    },
    onSuccess: () => {
      if (user) {
        qc.invalidateQueries({ queryKey: ['nostr', 'compliance', user.pubkey] });
      }
    },
  });
}

// ─── Convenience lookup ───────────────────────────────────────────────────────

/**
 * Returns the current consent status for a specific form type + student,
 * given the full map returned by useConsentRecords.
 */
export function getConsentStatus(
  records: Map<string, ConsentRecord>,
  parentPubkey: string,
  studentName: string,
  formType: FormType,
  scope?: string
): ConsentRecord | undefined {
  const dTag = buildDTag(parentPubkey, studentName, formType, scope);
  return records.get(dTag);
}
