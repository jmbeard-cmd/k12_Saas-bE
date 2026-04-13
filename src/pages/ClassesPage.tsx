import { useSeoMeta } from '@unhead/react';
import { BookOpen, Clock, Users, Star, ChevronRight, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AppLayout } from '@/components/AppLayout';
import { useCustodialAuth } from '@/hooks/useCustodialAuth';

const CLASSES = [
  {
    id: 1, name: 'Algebra II', code: 'MATH-201', teacher: 'Ms. Sarah Johnson',
    period: '1st Period', time: 'Mon/Wed/Fri 9:00 – 9:50 AM', room: 'Room 204',
    grade: 'B+', credits: 1, students: 28, progress: 78, color: 'bg-blue-500',
    description: 'Advanced algebra including polynomials, rational functions, and complex numbers.',
    upcoming: 'Problem Set 7 due Apr 18',
  },
  {
    id: 2, name: 'English Literature', code: 'ENG-301', teacher: 'Mr. David Davis',
    period: '2nd Period', time: 'Mon/Tue/Thu 10:30 – 11:20 AM', room: 'Room 112',
    grade: 'A', credits: 1, students: 24, progress: 92, color: 'bg-purple-500',
    description: 'Survey of major works in British and American literature from the 18th-20th centuries.',
    upcoming: 'Essay on Gatsby Chapters 6-9 due Apr 18',
  },
  {
    id: 3, name: 'US History', code: 'HIST-201', teacher: 'Mrs. Carol Williams',
    period: '4th Period', time: 'Tue/Wed 1:00 – 2:15 PM', room: 'Room 315',
    grade: 'A-', credits: 1, students: 30, progress: 85, color: 'bg-green-500',
    description: 'Comprehensive study of United States history from colonial era to the present day.',
    upcoming: 'WWI & WWII Timeline due Apr 22',
  },
  {
    id: 4, name: 'Biology', code: 'SCI-201', teacher: 'Dr. Carlos Martinez',
    period: '5th Period', time: 'Mon/Wed/Fri 2:30 – 3:20 PM', room: 'Lab 101',
    grade: 'B', credits: 1, students: 26, progress: 71, color: 'bg-orange-500',
    description: 'Introduction to living systems, cell biology, genetics, and ecology.',
    upcoming: 'Lab Report: Mitosis due Apr 25',
  },
  {
    id: 5, name: 'Physical Education', code: 'PE-101', teacher: 'Coach Mike Taylor',
    period: '3rd Period', time: 'Tue/Thu 11:30 AM – 12:20 PM', room: 'Gymnasium',
    grade: 'A', credits: 0.5, students: 32, progress: 95, color: 'bg-red-500',
    description: 'Physical fitness, team sports, and health education.',
    upcoming: 'Fitness assessment on Apr 20',
  },
];

export default function ClassesPage() {
  useSeoMeta({ title: 'My Classes — Oklahoma K-12 Connect' });
  const { account } = useCustodialAuth();

  const totalCredits = CLASSES.reduce((sum, c) => sum + c.credits, 0);
  const avgProgress = Math.round(CLASSES.reduce((sum, c) => sum + c.progress, 0) / CLASSES.length);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto animate-fade-in space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              My Classes
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Spring Semester 2026 • {account?.school}</p>
          </div>
          <div className="flex gap-3">
            <div className="text-center hidden sm:block">
              <div className="text-xl font-bold text-primary">{totalCredits}</div>
              <div className="text-xs text-muted-foreground">Credits</div>
            </div>
            <div className="text-center hidden sm:block">
              <div className="text-xl font-bold text-green-600">{avgProgress}%</div>
              <div className="text-xs text-muted-foreground">Avg Progress</div>
            </div>
          </div>
        </div>

        {/* Classes Grid */}
        <div className="space-y-4">
          {CLASSES.map((cls) => (
            <Card key={cls.id} className="hover:shadow-lg transition-all hover:-translate-y-0.5 group">
              <CardContent className="p-0">
                <div className="flex flex-col sm:flex-row">
                  {/* Color stripe */}
                  <div className={`${cls.color} sm:w-2 h-2 sm:h-auto rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none flex-shrink-0`} />

                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                      <div className={`hidden sm:flex w-12 h-12 rounded-xl ${cls.color} items-center justify-center flex-shrink-0`}>
                        <BookOpen className="h-6 w-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{cls.name}</h3>
                          <Badge variant="secondary" className="text-xs font-mono">{cls.code}</Badge>
                          <Badge variant="outline" className="text-xs font-bold">{cls.grade}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{cls.description}</p>

                        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {cls.students} students
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {cls.time}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {cls.room}
                          </span>
                          <span className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-accent" />
                            {cls.credits} credit{cls.credits !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2 justify-end mb-1">
                            <span className="text-xs text-muted-foreground">Progress</span>
                            <span className="text-sm font-bold">{cls.progress}%</span>
                          </div>
                          <div className="w-full sm:w-28 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full ${cls.color} rounded-full`} style={{ width: `${cls.progress}%` }} />
                          </div>
                        </div>
                        <Button size="sm" variant="outline" className="gap-1 mt-2 group-hover:border-primary/50 group-hover:text-primary">
                          View <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Teacher + Upcoming */}
                    <div className="mt-4 pt-3 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-[10px] bg-muted">{cls.teacher.split(' ').map((n) => n[0]).join('').slice(0, 2)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{cls.teacher}</span>
                        <Badge variant="outline" className="text-[10px]">{cls.period}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        <span className="text-xs text-muted-foreground">Next: {cls.upcoming}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
