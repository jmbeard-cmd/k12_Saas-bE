import { useSeoMeta } from '@unhead/react';
import { BarChart2, TrendingUp, Award, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AppLayout } from '@/components/AppLayout';

const GRADE_DATA = [
  { subject: 'Algebra II', grade: 'B+', gpa: 3.3, attendance: '96%', trend: 'up' },
  { subject: 'English Literature', grade: 'A', gpa: 4.0, attendance: '100%', trend: 'stable' },
  { subject: 'US History', grade: 'A-', gpa: 3.7, attendance: '98%', trend: 'up' },
  { subject: 'Biology', grade: 'B', gpa: 3.0, attendance: '94%', trend: 'down' },
  { subject: 'Physical Education', grade: 'A', gpa: 4.0, attendance: '100%', trend: 'stable' },
];

const SEMESTER_HISTORY = [
  { period: 'Fall 2025', gpa: 3.5, credits: 6, standing: 'Good' },
  { period: 'Spring 2025', gpa: 3.4, credits: 6, standing: 'Good' },
  { period: 'Fall 2024', gpa: 3.2, credits: 6, standing: 'Good' },
];

export default function ReportsPage() {
  useSeoMeta({ title: 'Reports & Grades — Oklahoma K-12 Connect' });

  const currentGPA = (GRADE_DATA.reduce((s, g) => s + g.gpa, 0) / GRADE_DATA.length).toFixed(2);

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6 text-primary" />
            Reports & Grades
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">Spring Semester 2026 Academic Report</p>
        </div>

        {/* GPA Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Current GPA', value: currentGPA, icon: Star, color: 'text-amber-500' },
            { label: 'Credits Earned', value: '22', icon: Award, color: 'text-blue-500' },
            { label: 'Attendance', value: '97.6%', icon: TrendingUp, color: 'text-green-500' },
            { label: 'Class Rank', value: '47/312', icon: BarChart2, color: 'text-purple-500' },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4 text-center">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Current Grades */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current Semester Grades</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {GRADE_DATA.map((row) => (
                <div key={row.subject} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{row.subject}</p>
                    <p className="text-xs text-muted-foreground">Attendance: {row.attendance}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`text-xs ${row.trend === 'up' ? 'text-green-600' : row.trend === 'down' ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {row.trend === 'up' ? '↑' : row.trend === 'down' ? '↓' : '→'}
                    </div>
                    <Badge variant="outline" className="font-bold text-sm w-10 text-center justify-center">{row.grade}</Badge>
                    <span className="text-xs text-muted-foreground w-8">{row.gpa.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Semester History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Semester History</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {SEMESTER_HISTORY.map((sem) => (
                <div key={sem.period} className="flex items-center gap-4 px-6 py-4">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{sem.period}</p>
                    <p className="text-xs text-muted-foreground">{sem.credits} credits completed</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">{sem.standing}</Badge>
                  <div className="text-right">
                    <p className="font-bold">{sem.gpa.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">GPA</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
