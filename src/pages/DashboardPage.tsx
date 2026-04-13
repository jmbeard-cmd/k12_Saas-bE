import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Bell, Award, TrendingUp, Clock,
  ChevronRight, Calendar, Users, Star, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AppLayout } from '@/components/AppLayout';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';

const SAMPLE_CLASSES = [
  { id: 1, name: 'Algebra II', teacher: 'Ms. Johnson', grade: 'B+', progress: 78, color: 'bg-blue-500', next: 'Mon 9:00 AM' },
  { id: 2, name: 'English Literature', teacher: 'Mr. Davis', grade: 'A', progress: 92, color: 'bg-purple-500', next: 'Tue 10:30 AM' },
  { id: 3, name: 'US History', teacher: 'Mrs. Williams', grade: 'A-', progress: 85, color: 'bg-green-500', next: 'Wed 1:00 PM' },
  { id: 4, name: 'Biology', teacher: 'Dr. Martinez', grade: 'B', progress: 71, color: 'bg-orange-500', next: 'Thu 2:30 PM' },
];

const ANNOUNCEMENTS = [
  { id: 1, title: 'Spring Semester Finals Schedule Released', category: 'Academic', time: '2h ago', urgent: true },
  { id: 2, title: 'Parent-Teacher Conferences — April 20-21', category: 'Event', time: '1d ago', urgent: false },
  { id: 3, title: 'New Lunch Menu Available for May', category: 'General', time: '2d ago', urgent: false },
];

const ASSIGNMENTS = [
  { id: 1, title: 'Quadratic Equations Problem Set', subject: 'Algebra II', dueDate: 'Tomorrow', status: 'pending' },
  { id: 2, title: 'Essay: The Great Gatsby Chapter 6-9', subject: 'English', dueDate: 'Apr 18', status: 'in_progress' },
  { id: 3, title: 'WWI & WWII Timeline', subject: 'US History', dueDate: 'Apr 22', status: 'pending' },
];

export default function DashboardPage() {
  useSeoMeta({ title: 'Dashboard — Oklahoma K-12 Connect' });
  const { account } = useCustodialAuth();

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  })();

  const firstName = account?.displayName?.split(' ')[0] ?? 'there';

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">

        {/* Hero Header */}
        <div className="relative oklahoma-gradient rounded-2xl p-6 lg:p-8 overflow-hidden isolate">
          <div className="hero-pattern absolute inset-0 -z-10" />
          <div className="absolute top-[-40px] right-[-40px] w-48 h-48 rounded-full bg-white/5 -z-10" />
          <div className="absolute bottom-[-30px] right-1/3 w-32 h-32 rounded-full bg-accent/10 -z-10" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-white">
              <p className="text-blue-200 text-sm font-medium mb-1">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">
                {greeting}, {firstName}! 👋
              </h1>
              <p className="text-blue-100 text-sm">
                You have <strong className="text-white">3 assignments</strong> due this week and <strong className="text-white">2 upcoming events</strong>.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="text-2xl font-bold text-white">86%</div>
                <div className="text-xs text-blue-200">Avg Grade</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="text-2xl font-bold text-accent">4</div>
                <div className="text-xs text-blue-200">Classes</div>
              </div>
              <div className="text-center bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
                <div className="text-2xl font-bold text-white">12</div>
                <div className="text-xs text-blue-200">Credits</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Attendance', value: '98%', icon: Users, trend: '+2%', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30' },
            { label: 'Assignments Due', value: '3', icon: Award, trend: 'This week', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/30' },
            { label: 'GPA', value: '3.7', icon: TrendingUp, trend: '↑ 0.1', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Study Streak', value: '7 days', icon: Zap, trend: '🔥 Keep it up!', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-950/30' },
          ].map((stat) => (
            <Card key={stat.label} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className={`p-4 ${stat.bg} rounded-lg`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg bg-white/70 dark:bg-black/20`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className={`text-2xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-xs font-medium text-foreground/70">{stat.label}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{stat.trend}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Classes */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">My Classes</h2>
              <Button variant="ghost" size="sm" asChild className="text-primary">
                <Link to="/classes">View all <ChevronRight className="h-4 w-4 ml-1" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {SAMPLE_CLASSES.map((cls) => (
                <Card key={cls.id} className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${cls.color} flex items-center justify-center flex-shrink-0`}>
                        <BookOpen className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{cls.name}</p>
                        <p className="text-xs text-muted-foreground">{cls.teacher}</p>
                      </div>
                      <Badge variant="secondary" className="font-bold text-xs">{cls.grade}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Progress</span>
                        <span>{cls.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${cls.color} rounded-full`} style={{ width: `${cls.progress}%` }} />
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Next: {cls.next}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Upcoming Assignments */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-accent" />
                    Upcoming Work
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/assignments"><ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {ASSIGNMENTS.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.status === 'in_progress' ? 'bg-amber-400' : 'bg-muted-foreground/30'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-snug truncate">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.subject}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-[10px] font-semibold ${a.dueDate === 'Tomorrow' ? 'text-destructive' : 'text-muted-foreground'}`}>
                        {a.dueDate}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Announcements */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Announcements
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link to="/announcements"><ChevronRight className="h-4 w-4" /></Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {ANNOUNCEMENTS.map((a) => (
                  <div key={a.id} className="flex items-start gap-2.5 py-1.5">
                    <div className={`mt-1 w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.urgent ? 'bg-destructive' : 'bg-muted-foreground/30'}`} />
                    <div>
                      <p className="text-xs font-medium leading-snug">{a.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[9px] py-0 px-1">{a.category}</Badge>
                        <span className="text-[10px] text-muted-foreground">{a.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-accent" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2 pt-0">
                {[
                  { label: 'Grades', href: '/reports', icon: TrendingUp },
                  { label: 'Schedule', href: '/classes', icon: Calendar },
                  { label: 'Directory', href: '/directory', icon: Users },
                  { label: 'My ID', href: '/profile', icon: Award },
                ].map((link) => (
                  <Link key={link.href} to={link.href}>
                    <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs h-9">
                      <link.icon className="h-3.5 w-3.5 text-primary" />
                      {link.label}
                    </Button>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-4 border-t border-border">
          <p>
            Connected to <code className="text-primary font-mono">wss://beginningend.com</code> •{' '}
            <a href="https://shakespeare.diy" target="_blank" rel="noopener noreferrer" className="hover:text-foreground underline">
              Vibed with Shakespeare
            </a>
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
