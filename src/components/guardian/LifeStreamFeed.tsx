import { useState } from 'react';
import {
  Camera, Search, Heart, ZoomIn, X, ChevronLeft, ChevronRight,
  Download, Share2, Play, Filter, Upload, Loader2, Video,
  Image as ImageIcon, AlertCircle, Plus, Tag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  useLifeStream, usePublishMedia,
  type MediaItem, type MediaEventType
} from '@/hooks/useLifeStream';
import { useUploadFile } from '@/hooks/useUploadFile';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { useToast } from '@/hooks/useToast';

// ─── Static fallback media for demo purposes ──────────────────────────────────
// Shown when relay returns no results (new deployment, empty relay, etc.)

const DEMO_MEDIA: MediaItem[] = [
  {
    event: { id: 'd1', pubkey: '', created_at: 1744300000, kind: 1, content: 'Science Fair 2026', tags: [], sig: '' },
    id: 'd1', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Science Fair 2026', description: 'Award-winning water filtration project',
    studentName: 'Elijah', eventType: 'classroom', className: 'Biology', school: 'Edmond Public Schools',
    createdAt: 1744300000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'd2', pubkey: '', created_at: 1744200000, kind: 1, content: 'Spring Art Show', tags: [], sig: '' },
    id: 'd2', url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Spring Art Show', description: 'Zoe\'s watercolor displayed in the main hall',
    studentName: 'Zoe', eventType: 'art', className: 'Art', school: 'Edmond Public Schools',
    createdAt: 1744200000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'd3', pubkey: '', created_at: 1744100000, kind: 1, content: 'Basketball Tournament', tags: [], sig: '' },
    id: 'd3', url: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Basketball Tournament', description: 'Elijah named MVP of the school tournament',
    studentName: 'Elijah', eventType: 'athletic', className: 'Physical Education', school: 'Edmond Public Schools',
    createdAt: 1744100000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'd4', pubkey: '', created_at: 1744000000, kind: 1, content: 'Robotics Club', tags: [], sig: '' },
    id: 'd4', url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Robotics Club Demo', description: 'Regional competition qualifying round',
    studentName: 'Elijah', eventType: 'stem', className: 'Computer Science', school: 'Edmond Public Schools',
    createdAt: 1744000000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'd5', pubkey: '', created_at: 1743900000, kind: 1, content: 'School Play', tags: [], sig: '' },
    id: 'd5', url: 'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Spring Musical Rehearsal', description: 'Zoe landing the lead role',
    studentName: 'Zoe', eventType: 'performing-arts', className: 'Theater Arts', school: 'Edmond Public Schools',
    createdAt: 1743900000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'd6', pubkey: '', created_at: 1743800000, kind: 1, content: 'Field Trip', tags: [], sig: '' },
    id: 'd6', url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Natural History Museum', description: 'Class field trip to OKC museum',
    studentName: 'Elijah', eventType: 'field-trip', className: 'US History', school: 'Edmond Public Schools',
    createdAt: 1743800000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'd7', pubkey: '', created_at: 1743700000, kind: 1, content: 'Reading Circle', tags: [], sig: '' },
    id: 'd7', url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'Classroom Reading Circle', description: 'Zoe completed 25-book reading challenge',
    studentName: 'Zoe', eventType: 'classroom', className: 'English Literature', school: 'Edmond Public Schools',
    createdAt: 1743700000, pubkey: '', isVideo: false,
  },
  {
    event: { id: 'd8', pubkey: '', created_at: 1743600000, kind: 1, content: 'PE Soccer', tags: [], sig: '' },
    id: 'd8', url: 'https://images.unsplash.com/photo-1551958219-acbc595d5c21?w=500&h=380&fit=crop',
    mimeType: 'image/jpeg', title: 'PE Soccer Match', description: 'Weekly sports session',
    studentName: 'Elijah', eventType: 'athletic', className: 'Physical Education', school: 'Edmond Public Schools',
    createdAt: 1743600000, pubkey: '', isVideo: false,
  },
];

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

interface LifeStreamFeedProps {
  studentName?: string;
}

export function LifeStreamFeed({ studentName }: LifeStreamFeedProps) {
  const { account } = useCustodialAuth();
  const { user } = useCurrentUser();
  const { toast } = useToast();

  const { data: nostrMedia = [], isLoading } = useLifeStream({ studentName });
  const publishMedia = usePublishMedia();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<MediaEventType | 'all'>('all');
  const [studentFilter, setStudentFilter] = useState<string>('all');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Upload form state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadStudent, setUploadStudent] = useState('');
  const [uploadEventType, setUploadEventType] = useState<MediaEventType>('classroom');
  const [uploadClass, setUploadClass] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Use Nostr data if available, otherwise demo data
  const mediaItems = nostrMedia.length > 0 ? nostrMedia : DEMO_MEDIA;
  const usingDemo = nostrMedia.length === 0;

  // All unique students in the feed
  const allStudents = [...new Set(mediaItems.map((m) => m.studentName).filter(Boolean))];

  // Filter
  const filtered = mediaItems.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || item.eventType === typeFilter;
    const matchStudent = studentFilter === 'all' || item.studentName === studentFilter;
    return matchSearch && matchType && matchStudent;
  });

  const lightboxIdx = lightboxItem ? filtered.indexOf(lightboxItem) : -1;

  const canUpload = account?.role === 'teacher' || account?.role === 'admin';

  const handleUpload = async () => {
    if (!selectedFile || !uploadTitle || !uploadStudent) {
      toast({ title: 'Missing fields', description: 'Title, student, and media file are required.', variant: 'destructive' });
      return;
    }
    try {
      const [[, url], , [, , mimeEntry]] = await uploadFile(selectedFile) as string[][];
      const mime = mimeEntry?.startsWith('m ') ? mimeEntry.slice(2) : selectedFile.type;

      await publishMedia.mutateAsync({
        url,
        mimeType: mime,
        title: uploadTitle,
        description: uploadDescription,
        studentName: uploadStudent,
        eventType: uploadEventType,
        className: uploadClass,
        school: account?.school ?? 'Oklahoma K-12',
      });

      toast({ title: '✅ Media Published', description: `"${uploadTitle}" signed and published to wss://beginningend.com` });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadTitle('');
    } catch (err) {
      toast({ title: 'Upload Failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    }
  };

  const formatDate = (ts: number) =>
    new Date(ts * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            Life-Stream
            {usingDemo && !isLoading && (
              <Badge variant="secondary" className="text-[10px]">Demo</Badge>
            )}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length} moments • Signed Nostr events from wss://beginningend.com
          </p>
        </div>
        {canUpload && (
          <Button
            size="sm"
            className="bg-gradient-oklahoma hover:opacity-90 text-white gap-1.5"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Media
          </Button>
        )}
      </div>

      {usingDemo && !isLoading && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 py-2">
          <AlertCircle className="h-3.5 w-3.5 text-blue-600" />
          <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
            Showing sample media. When teachers publish photos/videos with the <code className="font-mono">oklahoma-k12-media</code> tag to{' '}
            <code className="font-mono">wss://beginningend.com</code>, they'll appear here automatically.
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search moments…" className="pl-9 h-8 text-sm" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={studentFilter} onValueChange={setStudentFilter}>
          <SelectTrigger className="h-8 text-sm w-32">
            <SelectValue placeholder="Student" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            {allStudents.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as MediaEventType | 'all')}>
          <SelectTrigger className="h-8 text-sm w-36">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
              <SelectItem key={k} value={k}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="break-inside-avoid h-36 rounded-xl" />
          ))}
        </div>
      )}

      {/* Grid */}
      {!isLoading && (
        <div className="columns-2 sm:columns-3 gap-3 space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="group relative break-inside-avoid rounded-xl overflow-hidden border border-border cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setLightboxItem(item)}
            >
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
                    (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=300&h=220&fit=crop&sig=${item.id}`;
                  }}
                />
              )}
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge className={cn('text-[10px] mb-1 border-0', EVENT_TYPE_COLORS[item.eventType] ?? 'bg-gray-100 text-gray-700')}>
                  {EVENT_TYPE_LABELS[item.eventType] ?? item.eventType}
                </Badge>
                <p className="text-white text-xs font-semibold leading-tight truncate">{item.title}</p>
                <p className="text-white/70 text-[10px]">{item.studentName} · {formatDate(item.createdAt)}</p>
              </div>
              {/* Top actions */}
              <div className="absolute top-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">No media found.</p>
          </CardContent>
        </Card>
      )}

      {/* Lightbox */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-50 bg-black/96 flex items-center justify-center p-4"
          onClick={() => setLightboxItem(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
            onClick={() => setLightboxItem(null)}
          >
            <X className="h-5 w-5" />
          </button>
          {lightboxIdx > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxItem(filtered[lightboxIdx - 1]); }}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {lightboxIdx < filtered.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white"
              onClick={(e) => { e.stopPropagation(); setLightboxItem(filtered[lightboxIdx + 1]); }}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxItem.url.replace(/w=\d+&h=\d+/, 'w=1200&h=900')}
              alt={lightboxItem.title}
              className="w-full rounded-2xl object-contain max-h-[72vh]"
            />
            <div className="flex items-start justify-between mt-4 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={cn('text-[10px] border-0', EVENT_TYPE_COLORS[lightboxItem.eventType] ?? 'bg-gray-100 text-gray-700')}>
                    {EVENT_TYPE_LABELS[lightboxItem.eventType]}
                  </Badge>
                  {lightboxItem.className && (
                    <Badge variant="secondary" className="text-[10px]">{lightboxItem.className}</Badge>
                  )}
                </div>
                <h3 className="text-white font-semibold text-lg leading-snug">{lightboxItem.title}</h3>
                <p className="text-white/60 text-sm mt-0.5">
                  {lightboxItem.studentName} · {formatDate(lightboxItem.createdAt)} · {lightboxItem.school}
                </p>
                {lightboxItem.description && lightboxItem.description !== lightboxItem.title && (
                  <p className="text-white/50 text-xs mt-1 line-clamp-2">{lightboxItem.description}</p>
                )}
                {/* Nostr event ID */}
                <p className="text-white/30 text-[10px] font-mono mt-1">
                  Event: {lightboxItem.event.id.slice(0, 16)}…
                </p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => setLikedIds((p) => { const n = new Set(p); n.has(lightboxItem.id) ? n.delete(lightboxItem.id) : n.add(lightboxItem.id); return n; })}>
                  <Heart className={cn('h-4 w-4 mr-1.5', likedIds.has(lightboxItem.id) ? 'fill-rose-400 text-rose-400' : '')} />
                  {likedIds.has(lightboxItem.id) ? 'Saved' : 'Save'}
                </Button>
                <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10"
                  onClick={() => window.open(lightboxItem.url, '_blank')}>
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Dialog (teacher/admin) */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              Publish Media to Life-Stream
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* File picker */}
            <div className="space-y-1.5">
              <Label>Media File (Photo or Video)</Label>
              <div
                className={cn(
                  'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/50 transition-colors',
                  selectedFile ? 'border-primary/40 bg-primary/5' : 'border-border'
                )}
                onClick={() => document.getElementById('media-upload-input')?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center gap-3 justify-center">
                    {selectedFile.type.startsWith('video/') ? (
                      <Video className="h-6 w-6 text-primary" />
                    ) : (
                      <ImageIcon className="h-6 w-6 text-primary" />
                    )}
                    <div className="text-left">
                      <p className="text-sm font-medium">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }} className="ml-auto">
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Camera className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Click to select photo or video</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, MP4, MOV accepted</p>
                  </div>
                )}
                <input
                  id="media-upload-input"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Student Name *</Label>
                <Input placeholder="e.g., Elijah" value={uploadStudent} onChange={(e) => setUploadStudent(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Event Type</Label>
                <Select value={uploadEventType} onValueChange={(v) => setUploadEventType(v as MediaEventType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, label]) => (
                      <SelectItem key={k} value={k}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Title *</Label>
              <Input placeholder="e.g., Science Fair 2026" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Class / Activity</Label>
              <Input placeholder="e.g., Biology, PE, Art" value={uploadClass} onChange={(e) => setUploadClass(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Description (optional)</Label>
              <Textarea
                placeholder="Share context about this moment…"
                rows={2}
                className="resize-none text-sm"
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
              />
            </div>

            <Alert className="py-2 border-blue-200 bg-blue-50 dark:bg-blue-950/20">
              <Tag className="h-3.5 w-3.5 text-blue-600" />
              <AlertDescription className="text-xs text-blue-800 dark:text-blue-200">
                Published as a signed Nostr kind:1 event with <code className="font-mono">oklahoma-k12-media</code> tag.
              </AlertDescription>
            </Alert>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleUpload}
                disabled={isUploading || publishMedia.isPending || !selectedFile || !uploadTitle || !uploadStudent}
                className="bg-gradient-oklahoma hover:opacity-90 text-white gap-2"
              >
                {(isUploading || publishMedia.isPending) ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Publishing…</>
                ) : (
                  <><Upload className="h-4 w-4" />Publish</>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
