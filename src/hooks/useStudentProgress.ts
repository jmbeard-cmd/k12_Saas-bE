/**
 * useStudentProgress
 *
 * Fetches live student progress data from wss://beginningend.com:
 *
 *   1. kind:31103  — Student Grade Reports (custom Oklahoma K-12 kind)
 *      Published by teachers; one per student×course; addressable so the relay
 *      always returns the latest grade automatically.
 *
 *   2. kind:31922  — NIP-52 Assignment Calendar Events
 *      Published by teachers with t=oklahoma-k12-assignment.
 *
 * Both queries are scoped to wss://beginningend.com via nostr.relay() so that
 * we always read the school-authoritative relay, regardless of the user's
 * personal relay list.
 *
 * Fallback demo data is returned when the relay returns no events (empty relay,
 * new deployment, connectivity issues) so the UI is never blank.
 */

import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';
import { parseAssignment, type ParsedAssignment } from './useAssignmentEvents';
import type { AssignmentType } from '@/lib/okStandards';

// ─── School relay constant ────────────────────────────────────────────────────

export const SCHOOL_RELAY = 'wss://beginningend.com';

// ─── Grade Report kind ────────────────────────────────────────────────────────

/** kind:31103 — Student Grade Report */
export const KIND_GRADE_REPORT = 31103;

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GradeReport {
  /** The underlying Nostr event */
  event: NostrEvent;
  /** d-tag: "<student-pubkey>:<course-code>" */
  dTag: string;
  studentPubkey: string;
  studentName: string;
  /** Machine-readable course code, e.g. "MATH-201" */
  courseCode: string;
  /** Human-readable course name, e.g. "Algebra II" */
  courseName: string;
  /** Letter grade: A, A-, B+, B, … */
  grade: string;
  /** Numeric score (0-100 or raw points) */
  score?: number;
  /** Maximum possible score */
  maxScore?: number;
  /** Attendance percentage (0-100) */
  attendance?: number;
  /** Academic term, e.g. "2025-2026-Q3" */
  term: string;
  /** Teacher display name */
  teacherName: string;
  /** Teacher Nostr pubkey */
  teacherPubkey: string;
  /** Optional narrative comment from teacher */
  comment: string;
  /** Unix timestamp of last update */
  updatedAt: number;
}

export interface StudentProgressData {
  grades: GradeReport[];
  assignments: ParsedAssignment[];
  /** Overall GPA computed from grade reports */
  gpa: number | null;
  /** Average attendance across all grade reports */
  avgAttendance: number | null;
  /** Assignments due within the next 7 days */
  dueThisWeek: ParsedAssignment[];
  /** Upcoming assignments (due today or later) */
  upcoming: ParsedAssignment[];
  /** Past assignments */
  past: ParsedAssignment[];
  /** true when live relay data was returned */
  isLive: boolean;
}

// ─── Grade→GPA conversion ─────────────────────────────────────────────────────

const GRADE_TO_GPA: Record<string, number> = {
  'A+': 4.0, 'A': 4.0, 'A-': 3.7,
  'B+': 3.3, 'B': 3.0, 'B-': 2.7,
  'C+': 2.3, 'C': 2.0, 'C-': 1.7,
  'D+': 1.3, 'D': 1.0, 'D-': 0.7,
  'F': 0.0,
};

function gradeToGPA(grade: string): number | null {
  return GRADE_TO_GPA[grade.toUpperCase()] ?? null;
}

function computeGPA(grades: GradeReport[]): number | null {
  const gpas = grades.map((g) => gradeToGPA(g.grade)).filter((v): v is number => v !== null);
  if (gpas.length === 0) return null;
  return Math.round((gpas.reduce((s, v) => s + v, 0) / gpas.length) * 100) / 100;
}

function computeAvgAttendance(grades: GradeReport[]): number | null {
  const vals = grades.map((g) => g.attendance).filter((v): v is number => v !== undefined);
  if (vals.length === 0) return null;
  return Math.round(vals.reduce((s, v) => s + v, 0) / vals.length);
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function getTag(event: NostrEvent, name: string): string | undefined {
  return event.tags.find(([t]) => t === name)?.[1];
}

export function parseGradeReport(event: NostrEvent): GradeReport {
  const scoreStr = getTag(event, 'ok-score');
  const maxScoreStr = getTag(event, 'ok-max-score');
  const attendanceStr = getTag(event, 'ok-attendance');

  return {
    event,
    dTag: getTag(event, 'd') ?? '',
    studentPubkey: getTag(event, 'ok-student-pubkey') ?? '',
    studentName: getTag(event, 'ok-student-name') ?? 'Student',
    courseCode: getTag(event, 'ok-course') ?? '',
    courseName: getTag(event, 'ok-course-name') ?? getTag(event, 'ok-course') ?? 'Course',
    grade: getTag(event, 'ok-grade') ?? 'N/A',
    score: scoreStr ? Number(scoreStr) : undefined,
    maxScore: maxScoreStr ? Number(maxScoreStr) : undefined,
    attendance: attendanceStr ? Number(attendanceStr) : undefined,
    term: getTag(event, 'ok-term') ?? '2025-2026',
    teacherName: getTag(event, 'ok-teacher-name') ?? 'Teacher',
    teacherPubkey: event.pubkey,
    comment: event.content,
    updatedAt: event.created_at,
  };
}

// ─── Demo fallback data ───────────────────────────────────────────────────────

export const DEMO_GRADES: GradeReport[] = [
  {
    event: { id: 'g1', pubkey: 'demo', created_at: 1744300000, kind: 31103, content: 'Great improvement this quarter!', tags: [], sig: '' },
    dTag: 'demo:MATH-201', studentPubkey: 'demo', studentName: 'Elijah',
    courseCode: 'MATH-201', courseName: 'Algebra II',
    grade: 'B+', score: 87, maxScore: 100, attendance: 96,
    term: '2025-2026-Q3', teacherName: 'Ms. Johnson', teacherPubkey: 'demo',
    comment: 'Great improvement this quarter!', updatedAt: 1744300000,
  },
  {
    event: { id: 'g2', pubkey: 'demo', created_at: 1744200000, kind: 31103, content: 'Excellent analytical writing.', tags: [], sig: '' },
    dTag: 'demo:ENG-301', studentPubkey: 'demo', studentName: 'Elijah',
    courseCode: 'ENG-301', courseName: 'English Literature',
    grade: 'A', score: 96, maxScore: 100, attendance: 100,
    term: '2025-2026-Q3', teacherName: 'Mr. Davis', teacherPubkey: 'demo',
    comment: 'Excellent analytical writing.', updatedAt: 1744200000,
  },
  {
    event: { id: 'g3', pubkey: 'demo', created_at: 1744100000, kind: 31103, content: 'Strong grasp of primary sources.', tags: [], sig: '' },
    dTag: 'demo:HIST-201', studentPubkey: 'demo', studentName: 'Elijah',
    courseCode: 'HIST-201', courseName: 'US History',
    grade: 'A-', score: 91, maxScore: 100, attendance: 98,
    term: '2025-2026-Q3', teacherName: 'Mrs. Williams', teacherPubkey: 'demo',
    comment: 'Strong grasp of primary sources.', updatedAt: 1744100000,
  },
  {
    event: { id: 'g4', pubkey: 'demo', created_at: 1744000000, kind: 31103, content: 'Lab reports need more detail.', tags: [], sig: '' },
    dTag: 'demo:SCI-201', studentPubkey: 'demo', studentName: 'Elijah',
    courseCode: 'SCI-201', courseName: 'Biology',
    grade: 'B', score: 82, maxScore: 100, attendance: 94,
    term: '2025-2026-Q3', teacherName: 'Dr. Martinez', teacherPubkey: 'demo',
    comment: 'Lab reports need more detail.', updatedAt: 1744000000,
  },
  {
    event: { id: 'g5', pubkey: 'demo', created_at: 1743900000, kind: 31103, content: 'Outstanding participation.', tags: [], sig: '' },
    dTag: 'demo:PE-101', studentPubkey: 'demo', studentName: 'Elijah',
    courseCode: 'PE-101', courseName: 'Physical Education',
    grade: 'A', score: 98, maxScore: 100, attendance: 100,
    term: '2025-2026-Q3', teacherName: 'Coach Taylor', teacherPubkey: 'demo',
    comment: 'Outstanding participation.', updatedAt: 1743900000,
  },
];

export const DEMO_ASSIGNMENTS: ParsedAssignment[] = [
  {
    event: { id: 'a1', pubkey: 'demo', created_at: 1744300000, kind: 31922, content: 'Complete problems 1-25 from Chapter 9. Show all work.', tags: [], sig: '' },
    dTag: 'ok-assignment-quad-eq', title: 'Quadratic Equations Problem Set',
    description: 'Complete problems 1-25 from Chapter 9. Show all work.',
    startDate: '2026-04-18', className: 'Algebra II',
    assignmentType: 'homework' as AssignmentType, maxPoints: 50,
    standards: ['CCSS.MATH.CONTENT.HSA-REI.B.4'], version: 0,
    pubkey: 'demo', createdAt: 1744300000,
  },
  {
    event: { id: 'a2', pubkey: 'demo', created_at: 1744200000, kind: 31922, content: '5-paragraph essay on the American Dream in The Great Gatsby.', tags: [], sig: '' },
    dTag: 'ok-assignment-gatsby-essay', title: 'Essay: The Great Gatsby Chapters 6-9',
    description: '5-paragraph essay on the American Dream.',
    startDate: '2026-04-20', className: 'English Literature',
    assignmentType: 'essay' as AssignmentType, maxPoints: 100,
    standards: ['ELA-LITERACY.W.11-12.1'], version: 0,
    pubkey: 'demo', createdAt: 1744200000,
  },
  {
    event: { id: 'a3', pubkey: 'demo', created_at: 1744100000, kind: 31922, content: 'Create a detailed visual timeline of WWI and WWII key events.', tags: [], sig: '' },
    dTag: 'ok-assignment-wwi-wwii', title: 'WWI & WWII Timeline Project',
    description: 'Create a detailed visual timeline of key events 1914-1945.',
    startDate: '2026-04-22', className: 'US History',
    assignmentType: 'project' as AssignmentType, maxPoints: 75,
    standards: ['USH.10.1', 'USH.10.2'], version: 0,
    pubkey: 'demo', createdAt: 1744100000,
  },
  {
    event: { id: 'a4', pubkey: 'demo', created_at: 1744000000, kind: 31922, content: 'Formal lab report following scientific method for mitosis lab.', tags: [], sig: '' },
    dTag: 'ok-assignment-mitosis-lab', title: 'Cell Mitosis Lab Report',
    description: 'Formal lab report following scientific method.',
    startDate: '2026-04-25', className: 'Biology',
    assignmentType: 'lab' as AssignmentType, maxPoints: 80,
    standards: ['HS-LS1-4'], version: 1, rfcCode: 'ILLNESS',
    rfcNote: 'Rescheduled — student illness',
    pubkey: 'demo', createdAt: 1744000000,
  },
  {
    event: { id: 'a5', pubkey: 'demo', created_at: 1743900000, kind: 31922, content: 'Online quiz covering Chapter 8 polynomial functions.', tags: [], sig: '' },
    dTag: 'ok-assignment-ch8-quiz', title: 'Chapter 8 Polynomial Quiz',
    description: 'Online quiz covering Chapter 8 polynomial functions.',
    startDate: '2026-04-10', className: 'Algebra II',
    assignmentType: 'quiz' as AssignmentType, maxPoints: 50,
    standards: ['CCSS.MATH.CONTENT.HSA-APR.A.1'], version: 0,
    pubkey: 'demo', createdAt: 1743900000,
  },
  {
    event: { id: 'a6', pubkey: 'demo', created_at: 1743800000, kind: 31922, content: 'Written analysis of "The Love Song of J. Alfred Prufrock."', tags: [], sig: '' },
    dTag: 'ok-assignment-prufrock', title: 'Poetry Analysis: T.S. Eliot',
    description: 'Written analysis of "The Love Song of J. Alfred Prufrock."',
    startDate: '2026-04-07', className: 'English Literature',
    assignmentType: 'essay' as AssignmentType, maxPoints: 100,
    standards: ['ELA-LITERACY.RL.11-12.1'], version: 0,
    pubkey: 'demo', createdAt: 1743800000,
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

interface UseStudentProgressOptions {
  /**
   * Teacher pubkey(s) to fetch grade reports and assignments from.
   * Only events from these authors are trusted (security).
   */
  teacherPubkeys: string[];
  /**
   * Optional student pubkey to filter grade reports.
   * When omitted, all grade reports from the teacher are returned.
   */
  studentPubkey?: string;
}

/**
 * Fetches student progress from wss://beginningend.com.
 * Combines kind:31103 grade reports and kind:31922 NIP-52 assignments
 * into a unified StudentProgressData object.
 */
export function useStudentProgress(options: UseStudentProgressOptions) {
  const { nostr } = useNostr();
  const { teacherPubkeys, studentPubkey } = options;

  return useQuery({
    queryKey: ['nostr', 'student-progress', ...teacherPubkeys.sort(), studentPubkey ?? 'all'],
    queryFn: async (): Promise<StudentProgressData> => {
      const relay = nostr.relay(SCHOOL_RELAY);
      const today = new Date().toISOString().split('T')[0];

      if (teacherPubkeys.length === 0) {
        return buildProgress([], [], today, false);
      }

      // ── Single round-trip: fetch both kinds together ──────────────────────
      const gradeFilter: Record<string, unknown> = {
        kinds: [KIND_GRADE_REPORT],
        authors: teacherPubkeys,
        '#t': ['oklahoma-k12-grade'],
        limit: 200,
      };
      if (studentPubkey) {
        gradeFilter['#ok-student-pubkey'] = [studentPubkey];
      }

      const assignmentFilter: Record<string, unknown> = {
        kinds: [31922],
        authors: teacherPubkeys,
        '#t': ['oklahoma-k12-assignment'],
        limit: 300,
      };

      const [rawGrades, rawAssignments] = await Promise.all([
        relay.query(
          [gradeFilter as Parameters<typeof relay.query>[0][0]],
          { signal: AbortSignal.timeout(8000) }
        ),
        relay.query(
          [assignmentFilter as Parameters<typeof relay.query>[0][0]],
          { signal: AbortSignal.timeout(8000) }
        ),
      ]);

      // Deduplicate grade reports: keep latest per d-tag
      const byDTag = new Map<string, NostrEvent>();
      for (const ev of rawGrades) {
        const d = getTag(ev, 'd') ?? ev.id;
        const existing = byDTag.get(d);
        if (!existing || ev.created_at > existing.created_at) {
          byDTag.set(d, ev);
        }
      }
      const grades = Array.from(byDTag.values())
        .map(parseGradeReport)
        .sort((a, b) => a.courseName.localeCompare(b.courseName));

      // Deduplicate assignments: keep latest per d-tag
      const byAssignDTag = new Map<string, NostrEvent>();
      for (const ev of rawAssignments) {
        const d = getTag(ev, 'd') ?? ev.id;
        const existing = byAssignDTag.get(d);
        if (!existing || ev.created_at > existing.created_at) {
          byAssignDTag.set(d, ev);
        }
      }
      const assignments = Array.from(byAssignDTag.values())
        .map(parseAssignment)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      const isLive = grades.length > 0 || assignments.length > 0;
      return buildProgress(grades, assignments, today, isLive);
    },
    staleTime: 60_000,
    retry: 2,
  });
}

function buildProgress(
  grades: GradeReport[],
  assignments: ParsedAssignment[],
  today: string,
  isLive: boolean
): StudentProgressData {
  const upcoming = assignments
    .filter((a) => a.startDate >= today)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const past = assignments
    .filter((a) => a.startDate < today)
    .sort((a, b) => b.startDate.localeCompare(a.startDate));

  const dueThisWeek = upcoming.filter((a) => {
    const diff = (new Date(a.startDate).getTime() - new Date(today).getTime())
      / (1000 * 60 * 60 * 24);
    return diff <= 7;
  });

  return {
    grades,
    assignments,
    gpa: computeGPA(grades),
    avgAttendance: computeAvgAttendance(grades),
    dueThisWeek,
    upcoming,
    past,
    isLive,
  };
}

/**
 * Convenience hook that falls back to demo data when the relay is empty.
 */
export function useStudentProgressWithFallback(options: UseStudentProgressOptions) {
  const query = useStudentProgress(options);

  const data: StudentProgressData = query.data
    ?? (query.isLoading
      ? { grades: [], assignments: [], gpa: null, avgAttendance: null,
          dueThisWeek: [], upcoming: [], past: [], isLive: false }
      : buildFallback());

  return { ...query, data };
}

function buildFallback(): StudentProgressData {
  const today = new Date().toISOString().split('T')[0];
  return buildProgress(DEMO_GRADES, DEMO_ASSIGNMENTS, today, false);
}
