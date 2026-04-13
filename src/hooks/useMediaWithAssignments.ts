/**
 * useMediaWithAssignments
 *
 * Combines the Life-Stream media feed with NIP-52 assignment events so that
 * each media item can be linked to the assignment it belongs to.
 *
 * Linking strategy (most-specific first):
 *  1. Media event has an explicit `["e", "<event-id>"]` tag pointing to an
 *     assignment event id.
 *  2. Media event has an `["ok-assignment-d", "<d-tag>"]` tag matching an
 *     assignment d-tag.
 *  3. Fuzzy fallback: same class name (ok-class tag) AND same date window
 *     (media created_at falls within assignment's start/end window ±3 days).
 *
 * The hook returns MediaItem objects enriched with an optional `assignment`
 * field of type ParsedAssignment.
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useLifeStream, parseMediaItem, type MediaItem } from './useLifeStream';
import { parseAssignment, type ParsedAssignment } from './useAssignmentEvents';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LinkedMediaItem extends MediaItem {
  /** NIP-52 assignment this media is linked to, if found */
  assignment?: ParsedAssignment;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

/** Build a map from assignment event id → ParsedAssignment */
function buildAssignmentIdMap(
  assignments: ParsedAssignment[]
): Map<string, ParsedAssignment> {
  const map = new Map<string, ParsedAssignment>();
  for (const a of assignments) {
    map.set(a.event.id, a);
  }
  return map;
}

/** Build a map from d-tag → ParsedAssignment */
function buildAssignmentDTagMap(
  assignments: ParsedAssignment[]
): Map<string, ParsedAssignment> {
  const map = new Map<string, ParsedAssignment>();
  for (const a of assignments) {
    if (a.dTag) map.set(a.dTag, a);
  }
  return map;
}

/**
 * Fuzzy match: same class name, media created_at within ±3 days of assignment start.
 */
function fuzzyMatch(
  media: MediaItem,
  assignments: ParsedAssignment[]
): ParsedAssignment | undefined {
  if (!media.className) return undefined;
  const mediaDate = new Date(media.createdAt * 1000);
  const WINDOW_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

  return assignments.find((a) => {
    if (!a.className) return false;
    const classMatch =
      media.className.toLowerCase().trim() === a.className.toLowerCase().trim();
    if (!classMatch) return false;

    const assignDate = new Date(a.startDate + 'T12:00:00');
    const diff = Math.abs(mediaDate.getTime() - assignDate.getTime());
    return diff <= WINDOW_MS;
  });
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseMediaWithAssignmentsOptions {
  /** Filter media by student name */
  studentName?: string;
  /**
   * Teacher pubkeys to load NIP-52 assignments from.
   * If omitted, only tag-based links are used (no fuzzy matching).
   */
  teacherPubkeys?: string[];
  limit?: number;
}

export function useMediaWithAssignments(
  options: UseMediaWithAssignmentsOptions = {}
) {
  const { nostr } = useNostr();
  const { studentName, teacherPubkeys = [], limit = 50 } = options;

  // 1. Fetch media
  const mediaQuery = useLifeStream({ studentName, limit });

  // 2. Fetch assignments from all known teacher pubkeys (single query)
  const assignmentsQuery = useQuery({
    queryKey: ['nostr', 'linked-assignments', teacherPubkeys.sort().join(',')],
    queryFn: async (): Promise<ParsedAssignment[]> => {
      if (teacherPubkeys.length === 0) return [];

      const events = await nostr.query(
        [{
          kinds: [31922],
          authors: teacherPubkeys,
          '#t': ['oklahoma-k12-assignment'],
          limit: 500,
        }],
        { signal: AbortSignal.timeout(8000) }
      );

      // Deduplicate by d-tag per author
      const byKey = new Map<string, NostrEvent>();
      for (const ev of events) {
        const d = getTag(ev, 'd') ?? '';
        const key = `${ev.pubkey}::${d}`;
        const existing = byKey.get(key);
        if (!existing || ev.created_at > existing.created_at) {
          byKey.set(key, ev);
        }
      }

      return Array.from(byKey.values()).map(parseAssignment);
    },
    enabled: teacherPubkeys.length > 0,
    staleTime: 60_000,
  });

  // 3. Link media to assignments
  const data: LinkedMediaItem[] = (() => {
    const mediaItems = mediaQuery.data ?? [];
    const assignments = assignmentsQuery.data ?? [];

    if (assignments.length === 0) {
      return mediaItems.map((m) => ({ ...m }));
    }

    const idMap = buildAssignmentIdMap(assignments);
    const dTagMap = buildAssignmentDTagMap(assignments);

    return mediaItems.map((media) => {
      // Strategy 1: explicit event reference tag ["e", "<assignment-event-id>"]
      const eTag = media.event.tags.find(
        ([name, val]) => name === 'e' && idMap.has(val)
      );
      if (eTag) {
        return { ...media, assignment: idMap.get(eTag[1]) };
      }

      // Strategy 2: d-tag reference ["ok-assignment-d", "<d-tag>"]
      const dTagRef = getTag(media.event, 'ok-assignment-d');
      if (dTagRef && dTagMap.has(dTagRef)) {
        return { ...media, assignment: dTagMap.get(dTagRef) };
      }

      // Strategy 3: fuzzy class+date match
      const fuzzy = fuzzyMatch(media, assignments);
      if (fuzzy) {
        return { ...media, assignment: fuzzy };
      }

      return { ...media };
    });
  })();

  return {
    data,
    isLoading: mediaQuery.isLoading || assignmentsQuery.isLoading,
    isError: mediaQuery.isError,
    hasAssignments: (assignmentsQuery.data?.length ?? 0) > 0,
  };
}
