/**
 * GuardianMediaFeed
 *
 * Full-featured photo/video gallery for the Guardian Portal.
 * Mirrors the look-and-feel of the be-parents-portal MediaGallery.
 * Each media card shows the NIP-52 assignment it is linked to (if any).
 */

import { useState } from 'react';
import {
  Camera, Search, Heart, ZoomIn, X, ChevronLeft, ChevronRight,
  Download, Share2, Play, Video, AlertCircle, CalendarDays,
  BookOpen, Link2, ExternalLink, Loader2, Image as ImageIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useMediaWithAssignments,
  type LinkedMediaItem,
} from '@/hooks/useMediaWithAssignments';
import type { MediaEventType } from '@/hooks/useLifeStream';
import { ASSIGNMENT_TYPE_LABELS, ASSIGNMENT_TYPE_COLORS } from '@/lib/okStandards';

// ─── Constants ────────────────────────────────────────────────────────────────

const EVENT_TYPE_LABELS: Record<MediaEventType, string> = {
  classroom: '📚 Classroom',
  athletic: '🏅 Athletic',
  'field-trip': '🚌 Field Trip',
  art: '🎨 Art',
  stem: '🔬 STEM',
  social: '🎉 Social',
  'performing-arts': '🎭 Performing Arts',
  general: '📸 General',
};

const EVENT_TYPE_COLORS: Record<string, string> = {
  classroom: 'bg-blue-100 text-blue-700',
  athletic: 'bg-green-100 text-green-700',
  'field-trip': 'bg-amber-100 text-amber-700',
  art: 'bg-purple-100 text-purple-700',
  stem: 'bg-cyan-100 text-cyan-700',
  social: 'bg-rose-100 text-rose-700',
  'performing-arts': 'bg-pink-100 text-pink-700',
  general: 'bg-gray-100 text-gray-700',
};

// Demo fallback items — shown when relay has no events yet
const DEMO_ITEMS: LinkedMediaItem[] = [
  {
    event: { id: 'dm1', pubkey: '', created_at: 1744300000, kind: 1, content: 'Science Fair 2026', tags: [], sig: '' },
    id: 'dm1', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Science Fair 2026', description: 'Award-winning water filtration project',
    studentName: 'Elijah', eventType: 'stem', className: 'Biology', school: 'Edmond Public Schools',
    createdAt: 1744300000, pubkey: '', isVideo: false,
    assignment: {
      event: { id: 'a1', pubkey: '', created_at: 1744290000, kind: 31922, content: 'Complete a working model demonstrating water filtration.', tags: [], sig: '' },
      dTag: 'ok-assignment-science-fair-project', title: 'Water Filtration Project',
      description: 'Complete a working model demonstrating water filtration.',
      startDate: '2026-04-02', className: 'Biology', assignmentType: 'project',
      maxPoints: 100, standards: ['SCI-5.3.2'], pubkey: '', createdAt: 1744290000, version: 0,
    },
  },
  {
    event: { id: 'dm2', pubkey: '', created_at: 1744200000, kind: 1, content: 'Spring Art Show', tags: [], sig: '' },
    id: 'dm2', url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Spring Art Show', description: "Zoe's watercolor displayed in the main hall",
    studentName: 'Zoe', eventType: 'art', className: 'Art', school: 'Edmond Public Schools',
    createdAt: 1744200000, pubkey: '', isVideo: false,
    assignment: {
      event: { id: 'a2', pubkey: '', created_at: 1744190000, kind: 31922, content: 'Create an original watercolor scene.', tags: [], sig: '' },
      dTag: 'ok-assignment-spring-watercolor', title: 'Spring Watercolor Painting',
      description: 'Create an original watercolor scene.',
      startDate: '2026-03-28', className: 'Art', assignmentType: 'project',
      maxPoints: 80, standards: ['ART-3.1.1'], pubkey: '', createdAt: 1744190000, version: 0,
    },
  },
  {
    event: { id: 'dm3', pubkey: '', created_at: 1744100000, kind: 1, content: 'Basketball Tournament', tags: [], sig: '' },
    id: 'dm3', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Basketball Tournament', description: 'Elijah named MVP of the school tournament',
    studentName: 'Elijah', eventType: 'athletic', className: 'Physical Education', school: 'Edmond Public Schools',
    createdAt: 1744100000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'dm4', pubkey: '', created_at: 1744000000, kind: 1, content: 'Robotics Club Demo', tags: [], sig: '' },
    id: 'dm4', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Robotics Club Demo', description: 'Regional competition qualifying round',
    studentName: 'Elijah', eventType: 'stem', className: 'Computer Science', school: 'Edmond Public Schools',
    createdAt: 1744000000, pubkey: '', isVideo: false,
    assignment: {
      event: { id: 'a4', pubkey: '', created_at: 1743990000, kind: 31922, content: 'Build and program a robot to complete obstacle course.', tags: [], sig: '' },
      dTag: 'ok-assignment-robotics-demo', title: 'Robotics Competition Entry',
      description: 'Build and program a robot to complete obstacle course.',
      startDate: '2026-02-14', className: 'Computer Science', assignmentType: 'project',
      maxPoints: 150, standards: ['CS-5.2.1'], pubkey: '', createdAt: 1743990000, version: 1,
      rfcCode: 'WEATHER', rfcNote: 'Rescheduled due to snow day',
    },
  },
  {
    event: { id: 'dm5', pubkey: '', created_at: 1743900000, kind: 1, content: 'Spring Musical Rehearsal', tags: [], sig: '' },
    id: 'dm5', url: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Spring Musical Rehearsal', description: 'Zoe landing the lead role',
    studentName: 'Zoe', eventType: 'performing-arts', className: 'Theater Arts', school: 'Edmond Public Schools',
    createdAt: 1743900000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'dm6', pubkey: '', created_at: 1743800000, kind: 1, content: 'Field Trip — Museum', tags: [], sig: '' },
    id: 'dm6', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Natural History Museum', description: 'Class field trip to OKC museum',
    studentName: 'Elijah', eventType: 'field-trip', className: 'US History', school: 'Edmond Public Schools',
    createdAt: 1743800000, pubkey: '', isVideo: false,
    assignment: {
      event: { id: 'a6', pubkey: '', created_at: 1743790000, kind: 31922, content: 'Museum field trip — observation log.', tags: [], sig: '' },
      dTag: 'ok-assignment-museum-observation', title: 'Museum Observation Log',
      description: 'Museum field trip — observation log.',
      startDate: '2026-03-15', className: 'US History', assignmentType: 'lab',
      maxPoints: 40, standards: ['HIST-4.1.3'], pubkey: '', createdAt: 1743790000, version: 0,
    },
  },
  {
    event: { id: 'dm7', pubkey: '', created_at: 1743700000, kind: 1, content: 'Reading Circle', tags: [], sig: '' },
    id: 'dm7', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Classroom Reading Circle', description: 'Zoe completed 25-book reading challenge',
    studentName: 'Zoe', eventType: 'classroom', className: 'English Literature', school: 'Edmond Public Schools',
    createdAt: 1743700000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'dm8', pubkey: '', created_at: 1743600000, kind: 1, content: 'PE Soccer Match', tags: [], sig: '' },
    id: 'dm8', url: 'https://images.unsplash.com/photo-1551958219-acbc595d5c21?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'PE Soccer Match', description: 'Weekly sports session',
    studentName: 'Elijah', eventType: 'athletic', className: 'Physical Education', school: 'Edmond Public Schools',
    createdAt: 1743600000, pubkey: '', isVideo: false,
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Small pill displayed on a media card showing the linked assignment. */
function AssignmentPill({ item, compact = false }: { item: LinkedMediaItem; compact?: boolean }) {
  const a = item.assignment;
  if (!a) return null;

  const typeColor = ASSIGNMENT_TYPE_COLORS[a.assignmentType] ?? 'bg-gray-100 text-gray-700';
  const typeLabel = ASSIGNMENT_TYPE_LABELS[a.assignmentType] ?? a.assignmentType;

  if (compact) {
    return (
      <div className="flex items-center gap-1 mt-1">
        <Link2 className="h-2.5 w-2.5 text-white/60 flex-shrink-0" />
        <span className="text-[10px] text-white/70 truncate leading-none">{a.title}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-1.5">
      <div className="flex items-center gap-2">
        <Link2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <span className="text-xs font-semibold text-primary">Linked Assignment</span>
        {a.version > 0 && (
          <Badge className="text-[9px] px-1 py-0 bg-amber-100 text-amber-700 border-amber-200">
            Rescheduled v{a.version}
          </Badge>
        )}
      </div>
      <p className="text-sm font-medium leading-snug">{a.title}</p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', typeColor)}>
          {typeLabel}
        </span>
        <span className="text-xs text-muted-foreground">{a.className}</span>
        <span className="text-xs text-muted-foreground">·</span>
        <CalendarDays className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">{a.startDate}</span>
        {a.maxPoints && (
          <>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{a.maxPoints} pts</span>
          </>
        )}
      </div>
      {a.rfcCode && (
        <p className="text-[10px] text-amber-600">
          RFC: {a.rfcCode}{a.rfcNote ? ` — ${a.rfcNote}` : ''}
        </p>
      )}
      {a.standards.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-0.5">
          {a.standards.slice(0, 3).map((std) => (
            <span key={std} className="text-[10px] font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
              {std}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GuardianMediaFeedProps {
  /** Optional student name filter passed down from the parent portal */
  studentName?: string;
  /** Teacher pubkeys for NIP-52 assignment loading */
  teacherPubkeys?: string[];
  /** When true, renders as a compact card with "View all" link */
  compact?: boolean;
  /** Called when user clicks "View all" in compact mode */
  onViewAll?: () => void;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function GuardianMediaFeed({
  studentName,
  teacherPubkeys = [],
  compact = false,
  onViewAll,
}: GuardianMediaFeedProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaEventType | 'all'>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [linkedOnly, setLinkedOnly] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [lightboxItem, setLightboxItem] = useState<LinkedMediaItem | null>(null);

  const { data: nostrItems, isLoading, hasAssignments } = useMediaWithAssignments({
    studentName,
    teacherPubkeys,
    limit: compact ? 30 : 80,
  });

  const usingDemo = nostrItems.length === 0 && !isLoading;
  const allItems = usingDemo ? DEMO_ITEMS : nostrItems;

  // All unique students in data
  const allStudents = [...new Set(allItems.map((m) => m.studentName).filter(Boolean))];

  // Filtered view
  const filtered = allItems.filter((item) => {
    if (search && !item.title.toLowerCase().includes(search.toLowerCase()) &&
        !item.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== 'all' && item.eventType !== typeFilter) return false;
    if (studentFilter !== 'all' && item.studentName !== studentFilter) return false;
    if (linkedOnly && !item.assignment) return false;
    return true;
  });

  // In compact mode, only show first 6
  const displayItems = compact ? filtered.slice(0, 6) : filtered;
  const linkedCount = allItems.filter((m) => m.assignment).length;

  const lightboxIdx = lightboxItem ? filtered.indexOf(lightboxItem) : -1;

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Media Feed
            {usingDemo && !isLoading && (
              <Badge variant="secondary" className="text-[10px]">Demo</Badge>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} photos &amp; videos
            {linkedCount > 0 && (
              <span className="ml-1.5 text-primary font-medium">
                · {linkedCount} linked to assignments
              </span>
            )}
          </p>
        </div>
        {compact && onViewAll && (
          <Button variant="ghost" size="sm" className="text-xs text-primary gap-1" onClick={onViewAll}>
            View all
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* ── Demo notice ── */}
      {usingDemo && !isLoading && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
            Showing sample media. Teachers publish photos/videos as Nostr kind:1 events tagged{' '}
            <code className="font-mono">oklahoma-k12-media</code>. Assignment links use NIP-52 kind:31922.
          </AlertDescription>
        </Alert>
      )}

      {/* ── Filters (hide in compact mode) ── */}
      {!compact && (
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search media…"
              className="pl-9 h-8 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={studentFilter} onValueChange={setStudentFilter}>
            <SelectTrigger className="h-8 text-sm w-36">
              <SelectValue placeholder="Student" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Students</SelectItem>
              {allStudents.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MediaEventType | 'all')}>
            <SelectTrigger className="h-8 text-sm w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                <SelectItem key={k} value={k}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* Assignment filter toggle */}
          {linkedCount > 0 && (
            <button
              onClick={() => setLinkedOnly((v) => !v)}
              className={cn(
                'h-8 px-3 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5',
                linkedOnly
                  ? 'bg-primary text-white border-primary'
                  : 'bg-transparent border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
              )}
            >
              <Link2 className="h-3 w-3" />
              Linked to Assignment
            </button>
          )}
        </div>
      )}

      {/* ── Loading skeletons ── */}
      {isLoading && (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {Array(compact ? 6 : 9).fill(0).map((_, i) => (
            <Skeleton key={i} className="break-inside-avoid h-36 rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Masonry Grid (mirrors be-parents-portal exactly) ── */}
      {!isLoading && displayItems.length > 0 && (
        <div className={cn(
          'gap-3 space-y-3',
          compact ? 'columns-2 sm:columns-3' : 'columns-2 sm:columns-3 lg:columns-4'
        )}>
          {displayItems.map((item) => (
            <div
              key={item.id}
              className="group relative break-inside-avoid rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setLightboxItem(item)}
            >
              {/* ── Media thumbnail ── */}
              {item.isVideo ? (
                <div className="relative bg-black aspect-video flex items-center justify-center">
                  <Play className="h-10 w-10 text-white/80" />
                  <Badge className="absolute top-2 left-2 text-[10px] bg-black/70 text-white border-0 gap-1">
                    <Video className="h-2.5 w-2.5" /> Video
                  </Badge>
                </div>
              ) : (
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=220&fit=crop';
                  }}
                />
              )}

              {/* ── Assignment linked indicator (top-left corner dot) ── */}
              {item.assignment && (
                <div className="absolute top-2 left-2 z-10">
                  <div
                    className="flex items-center gap-1 bg-primary/90 backdrop-blur-sm text-white rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none"
                    title={`Linked to: ${item.assignment.title}`}
                  >
                    <Link2 className="h-2.5 w-2.5" />
                    Assignment
                  </div>
                </div>
              )}

              {/* ── Hover overlay ── */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge className={cn('text-[10px] mb-1 border-0', EVENT_TYPE_COLORS[item.eventType] ?? 'bg-gray-100 text-gray-700')}>
                  {EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}
                </Badge>
                <p className="text-white text-xs font-semibold leading-tight truncate">{item.title}</p>
                <p className="text-white/70 text-[10px]">
                  {item.studentName} · {formatDate(item.createdAt)}
                </p>
                {item.assignment && (
                  <AssignmentPill item={item} compact />
                )}
              </div>

              {/* ── Top-right actions ── */}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLikedIds((prev) => {
                      const next = new Set(prev);
                      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
                      return next;
                    });
                  }}
                >
                  <Heart className={cn('h-3.5 w-3.5', likedIds.has(item.id) ? 'fill-rose-500 text-rose-500' : 'text-gray-600')} />
                </button>
                <button
                  className="w-7 h-7 bg-white/90 rounded-full flex items-center justify-center hover:bg-white shadow-sm"
                  onClick={(e) => { e.stopPropagation(); setLightboxItem(item); }}
                >
                  <ZoomIn className="h-3.5 w-3.5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Empty state ── */}
      {!isLoading && displayItems.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No media found.</p>
            {linkedOnly && (
              <p className="text-xs text-muted-foreground/70 mt-1">
                Try removing the "Linked to Assignment" filter.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Stats bar (full mode only) ── */}
      {!compact && !isLoading && filtered.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border">
          <span>
            <Heart className="h-3.5 w-3.5 inline mr-1 fill-rose-400 text-rose-400" />
            {likedIds.size} saved
          </span>
          <span>
            <Link2 className="h-3.5 w-3.5 inline mr-1 text-primary" />
            {linkedCount} of {allItems.length} linked to NIP-52 assignments
          </span>
        </div>
      )}

      {/* ── Lightbox ── */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            onClick={() => setLightboxItem(null)}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Prev */}
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxItem(filtered[lightboxIdx - 1]); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}

          {/* Next */}
          {lightboxIdx < filtered.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
              onClick={(e) => { e.stopPropagation(); setLightboxItem(filtered[lightboxIdx + 1]); }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}

          <div
            className="max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media */}
            {lightboxItem.isVideo ? (
              <video
                src={lightboxItem.url}
                controls
                className="w-full rounded-2xl max-h-[55vh] object-contain bg-black"
              />
            ) : (
              <img
                src={lightboxItem.url.replace(/w=\d+&h=\d+/, 'w=1200&h=900')}
                alt={lightboxItem.title}
                className="w-full rounded-2xl object-contain max-h-[55vh]"
              />
            )}

            {/* Info panel */}
            <div className="mt-4 space-y-3">
              {/* Title row */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Badge className={cn('text-[10px] border-0', EVENT_TYPE_COLORS[lightboxItem.eventType] ?? 'bg-gray-100 text-gray-700')}>
                      {EVENT_TYPE_LABELS[lightboxItem.eventType]}
                    </Badge>
                    {lightboxItem.className && (
                      <Badge variant="secondary" className="text-[10px]">{lightboxItem.className}</Badge>
                    )}
                  </div>
                  <h3 className="text-white font-semibold text-xl leading-snug">{lightboxItem.title}</h3>
                  <p className="text-white/60 text-sm mt-0.5">
                    {lightboxItem.studentName} · {formatDate(lightboxItem.createdAt)} · {lightboxItem.school}
                  </p>
                  {lightboxItem.description && lightboxItem.description !== lightboxItem.title && (
                    <p className="text-white/50 text-xs mt-1 line-clamp-3">{lightboxItem.description}</p>
                  )}
                </div>
                {/* Actions */}
                <div className="flex gap-2 flex-shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => setLikedIds((p) => {
                      const n = new Set(p);
                      n.has(lightboxItem.id) ? n.delete(lightboxItem.id) : n.add(lightboxItem.id);
                      return n;
                    })}
                  >
                    <Heart className={cn('h-4 w-4 mr-1.5', likedIds.has(lightboxItem.id) ? 'fill-rose-400 text-rose-400' : '')} />
                    {likedIds.has(lightboxItem.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => window.open(lightboxItem.url, '_blank')}
                  >
                    <Download className="h-4 w-4 mr-1.5" />
                    Download
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: lightboxItem.title, url: lightboxItem.url });
                      } else {
                        navigator.clipboard.writeText(lightboxItem.url);
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4 mr-1.5" />
                    Share
                  </Button>
                </div>
              </div>

              {/* ── NIP-52 Assignment Panel ── */}
              {lightboxItem.assignment ? (
                <div className="rounded-xl border border-white/15 bg-white/8 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/80 flex items-center justify-center flex-shrink-0">
                      <Link2 className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">Linked NIP-52 Assignment</p>
                      <p className="text-white/50 text-[10px]">kind:31922 · {lightboxItem.assignment.dTag}</p>
                    </div>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div>
                      <p className="text-white/40 mb-0.5">Assignment</p>
                      <p className="text-white font-medium">{lightboxItem.assignment.title}</p>
                    </div>
                    <div>
                      <p className="text-white/40 mb-0.5">Type</p>
                      <span className={cn('px-1.5 py-0.5 rounded text-[10px] font-medium', ASSIGNMENT_TYPE_COLORS[lightboxItem.assignment.assignmentType])}>
                        {ASSIGNMENT_TYPE_LABELS[lightboxItem.assignment.assignmentType]}
                      </span>
                    </div>
                    <div>
                      <p className="text-white/40 mb-0.5">Class</p>
                      <p className="text-white">{lightboxItem.assignment.className}</p>
                    </div>
                    <div>
                      <p className="text-white/40 mb-0.5">Due Date</p>
                      <p className="text-white">{lightboxItem.assignment.startDate}</p>
                    </div>
                    {lightboxItem.assignment.maxPoints && (
                      <div>
                        <p className="text-white/40 mb-0.5">Points</p>
                        <p className="text-white font-semibold">{lightboxItem.assignment.maxPoints} pts</p>
                      </div>
                    )}
                    {lightboxItem.assignment.version > 0 && (
                      <div>
                        <p className="text-white/40 mb-0.5">Version</p>
                        <p className="text-amber-400 font-medium">v{lightboxItem.assignment.version} (Rescheduled)</p>
                      </div>
                    )}
                  </div>

                  {lightboxItem.assignment.rfcCode && (
                    <div className="rounded-lg bg-amber-900/30 border border-amber-500/30 p-2.5 text-xs">
                      <p className="text-amber-300 font-semibold mb-0.5">
                        Reason for Change: {lightboxItem.assignment.rfcCode}
                      </p>
                      {lightboxItem.assignment.rfcNote && (
                        <p className="text-amber-200/70">{lightboxItem.assignment.rfcNote}</p>
                      )}
                    </div>
                  )}

                  {lightboxItem.assignment.description && (
                    <p className="text-white/50 text-xs leading-relaxed line-clamp-3">
                      {lightboxItem.assignment.description}
                    </p>
                  )}

                  {lightboxItem.assignment.standards.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {lightboxItem.assignment.standards.map((std) => (
                        <span key={std} className="text-[10px] font-mono bg-white/10 text-white/60 px-1.5 py-0.5 rounded">
                          {std}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3 flex items-center gap-2 text-xs text-white/40">
                  <BookOpen className="h-3.5 w-3.5 flex-shrink-0" />
                  No NIP-52 assignment linked to this photo.
                </div>
              )}

              {/* Nostr event fingerprint */}
              <p className="text-white/20 text-[10px] font-mono">
                Media event: {lightboxItem.event.id.slice(0, 20)}…
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
