/**
 * Life-Stream Hook — Oklahoma K-12 Guardian Portal
 *
 * Fetches and publishes school media events from Nostr.
 * Media items use kind:1 notes with special tags for discoverability:
 *
 *   ["t", "oklahoma-k12-media"]            — community filter tag
 *   ["ok-student", "<student-name>"]        — which student this media is about
 *   ["ok-event-type", "<type>"]             — classroom | athletic | field-trip | art | stem | social | performing-arts
 *   ["ok-class", "<class-name>"]            — class or activity name (optional)
 *   ["ok-school", "<school-name>"]          — school name
 *   ["imeta", "url <url>", "m <mime>", …]  — NIP-94 image metadata
 *   ["url", "<media-url>"]                  — direct media URL shortcut
 *
 * Teachers/admins publish these events; parents query them filtered by student name.
 *
 * For the guardian feed we also query the teacher's lesson plan events (NIP-23 kind:30023)
 * so parents see when new lesson plans are published (academic transparency).
 */

import { useNostr } from '@nostrify/react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { useCurrentUser } from './useCurrentUser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaEventType =
  | 'classroom'
  | 'athletic'
  | 'field-trip'
  | 'art'
  | 'stem'
  | 'social'
  | 'performing-arts'
  | 'general';

export interface MediaItem {
  event: NostrEvent;
  id: string;
  /** The media URL extracted from imeta or url tags */
  url: string;
  mimeType: string;
  title: string;
  description: string;
  studentName: string;
  eventType: MediaEventType;
  className: string;
  school: string;
  /** Unix timestamp */
  createdAt: number;
  pubkey: string;
  /** true if this is a video */
  isVideo: boolean;
}

export interface PublishMediaInput {
  url: string;
  mimeType: string;
  title: string;
  description?: string;
  studentName: string;
  eventType: MediaEventType;
  className?: string;
  school?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

function getImetaUrl(event: NostrEvent): string {
  // First try imeta tag: ["imeta", "url <url>", ...]
  const imetaTag = event.tags.find(([t]) => t === 'imeta');
  if (imetaTag) {
    const urlPart = imetaTag.slice(1).find((s) => s.startsWith('url '));
    if (urlPart) return urlPart.slice(4).trim();
  }
  // Fallback to direct url tag
  const urlTag = event.tags.find(([t]) => t === 'url');
  if (urlTag) return urlTag[1];
  // Fallback: parse first URL from content
  const urlMatch = event.content.match(/https?:\/\/[^\s]+\.(jpg|jpeg|png|gif|webp|mp4|mov|webm)/i);
  if (urlMatch) return urlMatch[0];
  return '';
}

function getImetaMime(event: NostrEvent): string {
  const imetaTag = event.tags.find(([t]) => t === 'imeta');
  if (imetaTag) {
    const mPart = imetaTag.slice(1).find((s) => s.startsWith('m '));
    if (mPart) return mPart.slice(2).trim();
  }
  return 'image/jpeg';
}

export function parseMediaItem(event: NostrEvent): MediaItem | null {
  const url = getImetaUrl(event);
  if (!url) return null;

  const mimeType = getImetaMime(event);
  const isVideo = mimeType.startsWith('video/') || /\.(mp4|mov|webm|avi)$/i.test(url);

  // Title from content first line or ok-title tag
  const titleTag = getTag(event, 'ok-title');
  const firstLine = event.content.split('\n')[0].replace(/^#+\s*/, '').trim();
  const title = titleTag || firstLine || 'School Moment';

  return {
    event,
    id: event.id,
    url,
    mimeType,
    title,
    description: event.content,
    studentName: getTag(event, 'ok-student') ?? '',
    eventType: (getTag(event, 'ok-event-type') ?? 'general') as MediaEventType,
    className: getTag(event, 'ok-class') ?? '',
    school: getTag(event, 'ok-school') ?? '',
    createdAt: event.created_at,
    pubkey: event.pubkey,
    isVideo,
  };
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetch the Life-Stream for a parent.
 * Queries kind:1 events tagged with oklahoma-k12-media from the school relay.
 * Optionally filters by student name.
 */
export function useLifeStream(options?: {
  studentName?: string;
  eventType?: MediaEventType;
  limit?: number;
}) {
  const { nostr } = useNostr();
  const { studentName, eventType, limit = 50 } = options ?? {};

  return useQuery({
    queryKey: ['nostr', 'life-stream', studentName ?? 'all', eventType ?? 'all'],
    queryFn: async (): Promise<MediaItem[]> => {
      const filter: Record<string, unknown> = {
        kinds: [1],
        '#t': ['oklahoma-k12-media'],
        limit,
      };

      // Relay-level tag filter for student
      if (studentName) {
        filter['#ok-student'] = [studentName];
      }
      if (eventType) {
        filter['#ok-event-type'] = [eventType];
      }

      const events = await nostr.query(
        [filter as Parameters<typeof nostr.query>[0][0]],
        { signal: AbortSignal.timeout(8000) }
      );

      return events
        .map(parseMediaItem)
        .filter((item): item is MediaItem => item !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    },
    staleTime: 60_000,
  });
}

/**
 * Publish a new media event to the Life-Stream.
 * Used by teachers/admins to share classroom/athletic photos+videos.
 */
export function usePublishMedia() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: PublishMediaInput): Promise<NostrEvent> => {
      if (!user) throw new Error('Not logged in');

      const tags: string[][] = [
        ['t', 'oklahoma-k12-media'],
        ['ok-student', input.studentName],
        ['ok-event-type', input.eventType],
        ['url', input.url],
        // NIP-94 imeta
        ['imeta',
          `url ${input.url}`,
          `m ${input.mimeType}`,
          `alt ${input.title}`,
        ],
      ];

      if (input.className) tags.push(['ok-class', input.className]);
      if (input.school) tags.push(['ok-school', input.school]);
      if (input.title) tags.push(['ok-title', input.title]);
      if (location.protocol === 'https:') tags.push(['client', location.hostname]);

      const content = input.description
        ? `${input.title}\n\n${input.description}`
        : input.title;

      const event = await user.signer.signEvent({
        kind: 1,
        content,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      });

      await nostr.event(event, { signal: AbortSignal.timeout(8000) });
      return event;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nostr', 'life-stream'] });
    },
  });
}
