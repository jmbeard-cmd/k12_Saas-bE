import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Bell, Pin, ChevronDown, Search, Plus, AlertCircle, Info, Calendar, Megaphone } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AppLayout } from '@/components/AppLayout';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';
import { cn } from '@/lib/utils';

interface Announcement {
  id: number;
  title: string;
  content: string;
  category: 'Academic' | 'Event' | 'General' | 'Urgent' | 'Sports';
  author: string;
  authorRole: string;
  date: string;
  pinned: boolean;
  school: string;
}

const ANNOUNCEMENTS: Announcement[] = [
  {
    id: 1,
    title: '⚠️ Spring Semester Finals Schedule Released',
    content: 'The final examination schedule for Spring 2026 has been posted. Finals week runs May 11-15. Please check the district website for your specific room assignments and time slots. Students with IEPs should contact their counselor for accommodations.',
    category: 'Urgent',
    author: 'Dr. Patricia Williams',
    authorRole: 'Principal',
    date: '2026-04-13',
    pinned: true,
    school: 'Edmond Public Schools',
  },
  {
    id: 2,
    title: 'Parent-Teacher Conferences — April 20-21',
    content: 'Parent-Teacher conferences are scheduled for April 20-21. Sign-ups are now available through the district portal. Each session is 15 minutes. If you need a translator, please contact the front office at least 48 hours in advance.',
    category: 'Event',
    author: 'Office of Student Services',
    authorRole: 'Administration',
    date: '2026-04-12',
    pinned: true,
    school: 'Edmond Public Schools',
  },
  {
    id: 3,
    title: 'AP Exam Registration Deadline — April 30',
    content: 'Students enrolled in AP courses must complete their exam registration by April 30. Late fees apply after this date. See your AP teacher or the registrar\'s office for registration forms.',
    category: 'Academic',
    author: 'Ms. Rebecca Foster',
    authorRole: 'Academic Coordinator',
    date: '2026-04-11',
    pinned: false,
    school: 'Edmond Public Schools',
  },
  {
    id: 4,
    title: 'Spring Sports Awards Ceremony — May 3',
    content: 'Join us in celebrating our spring athletes at the annual Sports Awards Ceremony on May 3rd at 6:00 PM in the Main Gymnasium. All families are welcome. Light refreshments will be served.',
    category: 'Sports',
    author: 'Athletic Department',
    authorRole: 'Staff',
    date: '2026-04-10',
    pinned: false,
    school: 'Edmond Public Schools',
  },
  {
    id: 5,
    title: 'New Lunch Menu Available for May',
    content: 'The cafeteria has updated the lunch menu for May. Highlights include a new vegetarian option every Wednesday and expanded allergy-free selections. View the full menu on the school website.',
    category: 'General',
    author: 'Cafeteria Services',
    authorRole: 'Staff',
    date: '2026-04-09',
    pinned: false,
    school: 'Edmond Public Schools',
  },
  {
    id: 6,
    title: 'Science Fair Projects Due May 7',
    content: 'All 8th-grade science fair projects must be submitted by May 7th. Projects should include a research paper, display board, and working model if applicable. Judging will take place May 8-9.',
    category: 'Academic',
    author: 'Dr. James Martinez',
    authorRole: 'Science Department',
    date: '2026-04-08',
    pinned: false,
    school: 'Edmond Public Schools',
  },
];

const CATEGORY_STYLES: Record<string, { badge: string; icon: React.ReactNode }> = {
  Urgent: { badge: 'bg-red-100 text-red-700 border-red-200', icon: <AlertCircle className="h-3 w-3" /> },
  Academic: { badge: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Info className="h-3 w-3" /> },
  Event: { badge: 'bg-purple-100 text-purple-700 border-purple-200', icon: <Calendar className="h-3 w-3" /> },
  General: { badge: 'bg-gray-100 text-gray-700 border-gray-200', icon: <Megaphone className="h-3 w-3" /> },
  Sports: { badge: 'bg-green-100 text-green-700 border-green-200', icon: <span>🏅</span> },
};

export default function AnnouncementsPage() {
  useSeoMeta({ title: 'Announcements — Oklahoma K-12 Connect' });
  const { account } = useCustodialAuth();
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<number | null>(1);

  const canPost = account?.role === 'teacher' || account?.role === 'admin';

  const filtered = ANNOUNCEMENTS.filter((a) => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.content.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = !activeFilter || a.category === activeFilter;
    return matchesSearch && matchesFilter;
  });

  const pinned = filtered.filter((a) => a.pinned);
  const unpinned = filtered.filter((a) => !a.pinned);

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Announcements
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">School-wide news and updates from {account?.school}.</p>
          </div>
          {canPost && (
            <Button className="bg-gradient-oklahoma hover:opacity-90 text-white gap-2">
              <Plus className="h-4 w-4" />
              Post Announcement
            </Button>
          )}
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search announcements..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(CATEGORY_STYLES).map((cat) => (
              <Button
                key={cat}
                variant={activeFilter === cat ? 'default' : 'outline'}
                size="sm"
                className={cn('h-9 text-xs', activeFilter === cat ? 'bg-primary text-primary-foreground' : '')}
                onClick={() => setActiveFilter(activeFilter === cat ? null : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        {/* Pinned */}
        {pinned.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <Pin className="h-3.5 w-3.5" />
              Pinned
            </div>
            {pinned.map((ann) => (
              <AnnouncementCard
                key={ann.id}
                announcement={ann}
                expanded={expanded === ann.id}
                onToggle={() => setExpanded(expanded === ann.id ? null : ann.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {/* All */}
        {unpinned.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent</div>
            {unpinned.map((ann) => (
              <AnnouncementCard
                key={ann.id}
                announcement={ann}
                expanded={expanded === ann.id}
                onToggle={() => setExpanded(expanded === ann.id ? null : ann.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <Bell className="h-8 w-8 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-muted-foreground">No announcements found.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function AnnouncementCard({
  announcement: ann,
  expanded,
  onToggle,
  formatDate,
}: {
  announcement: Announcement;
  expanded: boolean;
  onToggle: () => void;
  formatDate: (d: string) => string;
}) {
  const style = CATEGORY_STYLES[ann.category];
  const initials = ann.author.split(' ').map((n) => n[0]).join('').slice(0, 2);

  return (
    <Card
      className={cn('transition-all cursor-pointer hover:shadow-md', ann.pinned && 'border-primary/30 bg-primary/2')}
      onClick={onToggle}
    >
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <Badge className={cn('text-[10px] px-1.5 py-0 gap-1 border', style.badge)}>
                {style.icon}
                {ann.category}
              </Badge>
              {ann.pinned && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 gap-1">
                  <Pin className="h-2.5 w-2.5" /> Pinned
                </Badge>
              )}
            </div>
            <h3 className="font-semibold text-sm leading-snug">{ann.title}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-muted-foreground">{ann.author}</span>
              <span className="text-muted-foreground/30">•</span>
              <span className="text-xs text-muted-foreground">{formatDate(ann.date)}</span>
            </div>
          </div>
          <ChevronDown className={cn('h-4 w-4 text-muted-foreground flex-shrink-0 transition-transform mt-1', expanded && 'rotate-180')} />
        </div>
      </CardHeader>
      {expanded && (
        <CardContent className="px-4 pb-4 pt-0">
          <div className="pl-12">
            <p className="text-sm text-foreground/80 leading-relaxed">{ann.content}</p>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
