/**
 * NIP-52 Assignment Calendar Events
 *
 * Each assignment (project, paper, quiz, test) is published as a signed
 * NIP-52 kind:31922 (date-based) calendar event authored by the teacher's
 * Nostr keypair. Every reschedule generates a NEW signed event with the same
 * `d` tag (replacing the old one on the relay) PLUS custom tags that embed
 * the RFC (Reason for Change) and an `e` reference to the previous event ID,
 * creating a verifiable on-chain audit trail.
 *
 * Custom tags used (beyond NIP-52 spec):
 *   ["ok-class", "<class-name>"]          — Class / course name
 *   ["ok-type", "<assignment-type>"]       — homework | quiz | test | project | lab …
 *   ["ok-points", "<max-points>"]          — Max point value
 *   ["ok-rfc", "<rfc-code>"]              — Reason For Change code (reschedules only)
 *   ["ok-rfc-note", "<free-text>"]         — Optional RFC elaboration note
 *   ["ok-prev-event", "<event-id>"]        — Previous event ID being replaced
 *   ["ok-version", "<n>"]                 — Monotonically increasing reschedule counter
 *   ["ok-standards", "<std1>", "<std2>"]  — Aligned standard codes
 *   ["t", "oklahoma-k12-assignment"]       — Community tag for filtering
 */

import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';
import type { AssignmentType } from '@/lib/okStandards';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AssignmentEventData {
  /** NIP-52 `d` tag — stable identifier across reschedules */
  dTag: string;
  title: string;
  description: string;
  /** ISO 8601 date YYYY-MM-DD */
  startDate: string;
  /** ISO 8601 date YYYY-MM-DD (optional) */
  endDate?: string;
  className: string;
  assignmentType: AssignmentType;
  maxPoints?: number;
  /** Standard codes aligned to this assignment */
  standards?: string[];
}

export interface RescheduleData {
  /** The existing NIP-52 event being rescheduled */
  existingEvent: NostrEvent;
  newDate: string;
  rfcCode: string;
  rfcNote?: string;
}

export interface ParsedAssignment {
  event: NostrEvent;
  dTag: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  className: string;
  assignmentType: AssignmentType;
  maxPoints?: number;
  standards: string[];
  rfcCode?: string;
  rfcNote?: string;
  prevEventId?: string;
  version: number;
  pubkey: string;
  createdAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

function getAllTagValues(event: NostrEvent, name: string): string[] {
  return event.tags.filter(([t]) => t === name).map(([, v]) => v);
}

export function parseAssignment(event: NostrEvent): ParsedAssignment {
  const standards: string[] = [];
  const stdTag = event.tags.find(([t]) => t === 'ok-standards');
  if (stdTag) standards.push(...stdTag.slice(1));

  return {
    event,
    dTag: getTag(event, 'd') ?? '',
    title: getTag(event, 'title') ?? 'Untitled Assignment',
    description: event.content,
    startDate: getTag(event, 'start') ?? '',
    endDate: getTag(event, 'end'),
    className: getTag(event, 'ok-class') ?? '',
    assignmentType: (getTag(event, 'ok-type') ?? 'homework') as AssignmentType,
    maxPoints: getTag(event, 'ok-points') ? Number(getTag(event, 'ok-points')) : undefined,
    rfcCode: getTag(event, 'ok-rfc'),
    rfcNote: getTag(event, 'ok-rfc-note'),
    prevEventId: getTag(event, 'ok-prev-event'),
    version: Number(getTag(event, 'ok-version') ?? '0'),
    standards,
    pubkey: event.pubkey,
    createdAt: event.created_at,
  };
}

function generateDTag(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
  return `ok-assignment-${slug}-${Date.now()}`;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Query all assignment calendar events for a given teacher pubkey.
 * Uses NIP-52 kind 31922 (date-based) with the oklahoma-k12-assignment t-tag.
 */
export function useAssignmentEvents(teacherPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'assignments', teacherPubkey ?? ''],
    queryFn: async (): Promise<ParsedAssignment[]> => {
      if (!teacherPubkey) return [];

      const events = await nostr.query(
        [{
          kinds: [31922],
          authors: [teacherPubkey],
          '#t': ['oklahoma-k12-assignment'],
          limit: 200,
        }],
        { signal: AbortSignal.timeout(6000) }
      );

      // Deduplicate: for the same d-tag, keep only the most recent event
      const byDTag = new Map<string, NostrEvent>();
      for (const event of events) {
        const d = getTag(event, 'd') ?? '';
        const existing = byDTag.get(d);
        if (!existing || event.created_at > existing.created_at) {
          byDTag.set(d, event);
        }
      }

      return Array.from(byDTag.values())
        .map(parseAssignment)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
    },
    enabled: !!teacherPubkey,
    staleTime: 30_000,
  });
}

/**
 * Fetch the full history (all versions) for a single assignment d-tag.
 * This creates the verifiable audit trail.
 */
export function useAssignmentHistory(teacherPubkey: string | undefined, dTag: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'assignment-history', teacherPubkey ?? '', dTag ?? ''],
    queryFn: async (): Promise<ParsedAssignment[]> => {
      if (!teacherPubkey || !dTag) return [];

      const events = await nostr.query(
        [{
          kinds: [31922],
          authors: [teacherPubkey],
          '#d': [dTag],
          limit: 50,
        }],
        { signal: AbortSignal.timeout(6000) }
      );

      return events
        .map(parseAssignment)
        .sort((a, b) => b.createdAt - a.createdAt); // newest first
    },
    enabled: !!teacherPubkey && !!dTag,
    staleTime: 15_000,
  });
}

/**
 * Publish a NEW NIP-52 assignment event (kind 31922).
 */
export function usePublishAssignment() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: AssignmentEventData): Promise<NostrEvent> => {
      if (!user) throw new Error('Not logged in');

      const dTag = data.dTag || generateDTag(data.title);

      const tags: string[][] = [
        ['d', dTag],
        ['title', data.title],
        ['start', data.startDate],
        ['t', 'oklahoma-k12-assignment'],
        ['t', `ok-class-${data.className.toLowerCase().replace(/\s+/g, '-')}`],
        ['ok-class', data.className],
        ['ok-type', data.assignmentType],
        ['ok-version', '0'],
      ];

      if (data.endDate) tags.push(['end', data.endDate]);
      if (data.maxPoints) tags.push(['ok-points', String(data.maxPoints)]);
      if (data.standards?.length) tags.push(['ok-standards', ...data.standards]);
      if (location.protocol === 'https:') tags.push(['client', location.hostname]);

      const event = await user.signer.signEvent({
        kind: 31922,
        content: data.description,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(8000) });
      return event;
    },
    onSuccess: (_, vars) => {
      // Invalidate assignment queries so the calendar refreshes
      if (user) {
        qc.invalidateQueries({ queryKey: ['nostr', 'assignments', user.pubkey] });
      }
    },
  });
}

/**
 * Reschedule an existing assignment.
 * Creates a NEW signed event with the same `d` tag that:
 *  1. Updates `start` (and optionally `end`) to the new date
 *  2. Adds `ok-rfc` with the reason-for-change code
 *  3. Adds `ok-rfc-note` with optional free-text elaboration
 *  4. Adds `ok-prev-event` pointing to the replaced event's id
 *  5. Increments `ok-version` to track the change sequence
 *
 * Because this is kind 31922 (addressable), relays will replace the old event
 * BUT we preserve the audit chain via the `ok-prev-event` tag.
 */
export function useRescheduleAssignment() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: RescheduleData): Promise<NostrEvent> => {
      if (!user) throw new Error('Not logged in');

      const existing = data.existingEvent;
      const prevVersion = Number(getTag(existing, 'ok-version') ?? '0');
      const newVersion = prevVersion + 1;

      // Copy all existing tags, replacing date/version/audit fields
      const preservedTags = existing.tags.filter(([name]) =>
        !['start', 'end', 'ok-rfc', 'ok-rfc-note', 'ok-prev-event', 'ok-version', 'client'].includes(name)
      );

      const newTags: string[][] = [
        ...preservedTags,
        ['start', data.newDate],
        ['ok-rfc', data.rfcCode],
        ['ok-prev-event', existing.id],
        ['ok-version', String(newVersion)],
      ];

      if (data.rfcNote?.trim()) {
        newTags.push(['ok-rfc-note', data.rfcNote.trim()]);
      }

      if (location.protocol === 'https:') {
        newTags.push(['client', location.hostname]);
      }

      const event = await user.signer.signEvent({
        kind: 31922,
        content: existing.content,
        tags: newTags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(8000) });
      return event;
    },
    onSuccess: () => {
      if (user) {
        qc.invalidateQueries({ queryKey: ['nostr', 'assignments', user.pubkey] });
        qc.invalidateQueries({ queryKey: ['nostr', 'assignment-history'] });
      }
    },
  });
}
