/**
 * NIP-23 Lesson Plans
 *
 * Each lesson plan is a kind:30023 (addressable long-form) event.
 * kind:30024 is used for drafts that haven't been published yet.
 *
 * Custom tags beyond NIP-23 spec:
 *   ["ok-class", "<class-name>"]              — Class / course name
 *   ["ok-grade", "<grade-level>"]             — Grade level (K, 1, 2 … 12)
 *   ["ok-duration", "<minutes>"]              — Estimated lesson duration in minutes
 *   ["ok-objectives", "<obj1>", "<obj2>"]     — Learning objectives
 *   ["ok-standards", "<std1>", "<std2>"]      — Aligned standard codes
 *   ["ok-cte-cluster", "<cluster-id>"]        — CTE cluster ID (if CTE-aligned)
 *   ["ok-cc-domain", "<domain-id>"]           — Common Core domain ID (if CC-aligned)
 *   ["t", "oklahoma-k12-lesson"]              — Community tag for filtering
 */

import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LessonPlanData {
  /** NIP-23 `d` tag — stable slug identifier */
  dTag?: string;
  title: string;
  /** Markdown body — the actual lesson plan content */
  content: string;
  summary?: string;
  className: string;
  gradeLevel?: string;
  /** Duration in minutes */
  durationMinutes?: number;
  objectives?: string[];
  /** Standard codes */
  standards?: string[];
  /** CTE cluster IDs */
  cteClusterIds?: string[];
  /** Common Core domain IDs */
  ccDomainIds?: string[];
  isDraft?: boolean;
}

export interface ParsedLessonPlan {
  event: NostrEvent;
  dTag: string;
  title: string;
  content: string;
  summary?: string;
  className: string;
  gradeLevel?: string;
  durationMinutes?: number;
  objectives: string[];
  standards: string[];
  cteClusterIds: string[];
  ccDomainIds: string[];
  isDraft: boolean;
  publishedAt?: number;
  pubkey: string;
  createdAt: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

export function parseLessonPlan(event: NostrEvent): ParsedLessonPlan {
  const objectivesTag = event.tags.find(([t]) => t === 'ok-objectives');
  const objectives = objectivesTag ? objectivesTag.slice(1) : [];

  const standardsTag = event.tags.find(([t]) => t === 'ok-standards');
  const standards = standardsTag ? standardsTag.slice(1) : [];

  const cteTag = event.tags.find(([t]) => t === 'ok-cte-cluster');
  const cteClusterIds = cteTag ? cteTag.slice(1) : [];

  const ccTag = event.tags.find(([t]) => t === 'ok-cc-domain');
  const ccDomainIds = ccTag ? ccTag.slice(1) : [];

  const publishedAtRaw = getTag(event, 'published_at');

  return {
    event,
    dTag: getTag(event, 'd') ?? '',
    title: getTag(event, 'title') ?? 'Untitled Lesson Plan',
    content: event.content,
    summary: getTag(event, 'summary'),
    className: getTag(event, 'ok-class') ?? '',
    gradeLevel: getTag(event, 'ok-grade'),
    durationMinutes: getTag(event, 'ok-duration') ? Number(getTag(event, 'ok-duration')) : undefined,
    objectives,
    standards,
    cteClusterIds,
    ccDomainIds,
    isDraft: event.kind === 30024,
    publishedAt: publishedAtRaw ? Number(publishedAtRaw) : undefined,
    pubkey: event.pubkey,
    createdAt: event.created_at,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Query all lesson plans (published + drafts) for a teacher.
 */
export function useLessonPlans(teacherPubkey: string | undefined) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['nostr', 'lesson-plans', teacherPubkey ?? ''],
    queryFn: async (): Promise<ParsedLessonPlan[]> => {
      if (!teacherPubkey) return [];

      const events = await nostr.query(
        [{
          kinds: [30023, 30024],
          authors: [teacherPubkey],
          '#t': ['oklahoma-k12-lesson'],
          limit: 100,
        }],
        { signal: AbortSignal.timeout(6000) }
      );

      // Deduplicate by d-tag, keeping latest per kind separately
      const byDTag = new Map<string, NostrEvent>();
      for (const event of events) {
        const d = getTag(event, 'd') ?? '';
        const key = `${event.kind}:${d}`;
        const existing = byDTag.get(key);
        if (!existing || event.created_at > existing.created_at) {
          byDTag.set(key, event);
        }
      }

      return Array.from(byDTag.values())
        .map(parseLessonPlan)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    enabled: !!teacherPubkey,
    staleTime: 30_000,
  });
}

/**
 * Publish or update a lesson plan (NIP-23 kind:30023).
 * Saving as draft uses kind:30024.
 */
export function usePublishLessonPlan() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: LessonPlanData): Promise<NostrEvent> => {
      if (!user) throw new Error('Not logged in');

      const kind = data.isDraft ? 30024 : 30023;
      const dTag = data.dTag || `ok-lesson-${slugify(data.title)}-${Date.now()}`;
      const now = Math.floor(Date.now() / 1000);

      const tags: string[][] = [
        ['d', dTag],
        ['title', data.title],
        ['t', 'oklahoma-k12-lesson'],
        ['ok-class', data.className],
      ];

      if (!data.isDraft) tags.push(['published_at', String(now)]);
      if (data.summary) tags.push(['summary', data.summary]);
      if (data.gradeLevel) tags.push(['ok-grade', data.gradeLevel]);
      if (data.durationMinutes) tags.push(['ok-duration', String(data.durationMinutes)]);
      if (data.objectives?.length) tags.push(['ok-objectives', ...data.objectives]);
      if (data.standards?.length) tags.push(['ok-standards', ...data.standards]);
      if (data.cteClusterIds?.length) tags.push(['ok-cte-cluster', ...data.cteClusterIds]);
      if (data.ccDomainIds?.length) tags.push(['ok-cc-domain', ...data.ccDomainIds]);
      if (location.protocol === 'https:') tags.push(['client', location.hostname]);

      const event = await user.signer.signEvent({
        kind,
        content: data.content,
        tags,
        created_at: now,
      });

      await nostr.event(event, { signal: AbortSignal.timeout(8000) });
      return event;
    },
    onSuccess: () => {
      if (user) {
        qc.invalidateQueries({ queryKey: ['nostr', 'lesson-plans', user.pubkey] });
      }
    },
  });
}
