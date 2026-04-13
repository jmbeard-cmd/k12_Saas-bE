/**
 * Oklahoma CTE (Career & Technology Education) Standards
 * and Common Core State Standards data for teacher tools.
 *
 * CTE clusters come from Oklahoma CareerTech:
 * https://www.okcareertech.org/educators/curriculum/
 *
 * Common Core domains come from corestandards.org
 */

// ─── Oklahoma CTE ─────────────────────────────────────────────────────────────

export interface CTECluster {
  id: string;
  code: string;
  title: string;
  pathways: CTEPathway[];
}

export interface CTEPathway {
  id: string;
  code: string;
  title: string;
  standards: CTEStandard[];
}

export interface CTEStandard {
  id: string;
  code: string;
  description: string;
  grade?: string;
}

export const CTE_CLUSTERS: CTECluster[] = [
  {
    id: 'ag', code: 'AG', title: 'Agriculture, Food & Natural Resources',
    pathways: [
      {
        id: 'ag-prod', code: 'AG-01', title: 'Agribusiness Systems',
        standards: [
          { id: 'ag-01-01', code: 'AG01.01', description: 'Apply principles of economics to agricultural business decisions.' },
          { id: 'ag-01-02', code: 'AG01.02', description: 'Develop a business plan for an agricultural enterprise.' },
          { id: 'ag-01-03', code: 'AG01.03', description: 'Analyze supply and demand factors affecting agricultural markets.' },
        ],
      },
      {
        id: 'ag-sci', code: 'AG-02', title: 'Plant & Animal Science',
        standards: [
          { id: 'ag-02-01', code: 'AG02.01', description: 'Apply principles of plant biology to agricultural production.' },
          { id: 'ag-02-02', code: 'AG02.02', description: 'Describe animal nutrition and its relationship to production efficiency.' },
        ],
      },
    ],
  },
  {
    id: 'bm', code: 'BM', title: 'Business, Marketing & Information Technology',
    pathways: [
      {
        id: 'bm-mkt', code: 'BM-01', title: 'Marketing',
        standards: [
          { id: 'bm-01-01', code: 'BM01.01', description: 'Describe the components of the marketing mix (product, price, place, promotion).' },
          { id: 'bm-01-02', code: 'BM01.02', description: 'Analyze consumer behavior and market research techniques.' },
          { id: 'bm-01-03', code: 'BM01.03', description: 'Develop a marketing plan for a product or service.' },
        ],
      },
      {
        id: 'bm-it', code: 'BM-02', title: 'Information Technology',
        standards: [
          { id: 'bm-02-01', code: 'BM02.01', description: 'Apply programming concepts to solve business problems.' },
          { id: 'bm-02-02', code: 'BM02.02', description: 'Demonstrate proficiency in database design and management.' },
          { id: 'bm-02-03', code: 'BM02.03', description: 'Explain cybersecurity principles and best practices.' },
        ],
      },
    ],
  },
  {
    id: 'ed', code: 'ED', title: 'Education & Training',
    pathways: [
      {
        id: 'ed-teach', code: 'ED-01', title: 'Teaching & Training',
        standards: [
          { id: 'ed-01-01', code: 'ED01.01', description: 'Apply principles of child development in educational settings.' },
          { id: 'ed-01-02', code: 'ED01.02', description: 'Design lesson plans incorporating differentiated instruction.' },
          { id: 'ed-01-03', code: 'ED01.03', description: 'Demonstrate effective classroom management strategies.' },
        ],
      },
    ],
  },
  {
    id: 'hs', code: 'HS', title: 'Health Science',
    pathways: [
      {
        id: 'hs-thera', code: 'HS-01', title: 'Therapeutic Services',
        standards: [
          { id: 'hs-01-01', code: 'HS01.01', description: 'Apply principles of anatomy and physiology to patient care.' },
          { id: 'hs-01-02', code: 'HS01.02', description: 'Demonstrate CPR and basic first aid techniques.' },
          { id: 'hs-01-03', code: 'HS01.03', description: 'Explain HIPAA regulations and patient privacy rights.' },
        ],
      },
      {
        id: 'hs-diag', code: 'HS-02', title: 'Diagnostic Services',
        standards: [
          { id: 'hs-02-01', code: 'HS02.01', description: 'Describe common diagnostic imaging procedures and their purposes.' },
          { id: 'hs-02-02', code: 'HS02.02', description: 'Explain laboratory procedures for specimen collection and analysis.' },
        ],
      },
    ],
  },
  {
    id: 'mfg', code: 'MFG', title: 'Manufacturing',
    pathways: [
      {
        id: 'mfg-prod', code: 'MFG-01', title: 'Production',
        standards: [
          { id: 'mfg-01-01', code: 'MFG01.01', description: 'Apply precision measurement and quality control techniques.' },
          { id: 'mfg-01-02', code: 'MFG01.02', description: 'Demonstrate safe operation of manufacturing equipment.' },
          { id: 'mfg-01-03', code: 'MFG01.03', description: 'Explain lean manufacturing principles and waste reduction.' },
        ],
      },
    ],
  },
  {
    id: 'stem', code: 'STEM', title: 'Science, Technology, Engineering & Math',
    pathways: [
      {
        id: 'stem-eng', code: 'STEM-01', title: 'Engineering & Technology',
        standards: [
          { id: 'stem-01-01', code: 'STEM01.01', description: 'Apply the engineering design process to solve real-world problems.' },
          { id: 'stem-01-02', code: 'STEM01.02', description: 'Use CAD software to design and prototype solutions.' },
          { id: 'stem-01-03', code: 'STEM01.03', description: 'Analyze structural integrity using mathematical modeling.' },
        ],
      },
    ],
  },
];

// ─── Common Core Standards ─────────────────────────────────────────────────────

export interface CCDomain {
  id: string;
  subject: 'ELA' | 'Math';
  gradeRange: string;
  title: string;
  standards: CCStandard[];
}

export interface CCStandard {
  id: string;
  code: string;
  description: string;
  grade: string;
}

export const CC_DOMAINS: CCDomain[] = [
  {
    id: 'cc-ela-ri', subject: 'ELA', gradeRange: '9-12', title: 'Reading: Informational Text',
    standards: [
      { id: 'cc-ri-9-1', code: 'RI.9-10.1', grade: '9-10', description: 'Cite strong textual evidence to support analysis of explicit and inferred information.' },
      { id: 'cc-ri-9-2', code: 'RI.9-10.2', grade: '9-10', description: 'Determine a central idea and analyze its development over a text.' },
      { id: 'cc-ri-11-1', code: 'RI.11-12.1', grade: '11-12', description: 'Cite strong evidence; acknowledge alternative interpretations.' },
      { id: 'cc-ri-11-2', code: 'RI.11-12.2', grade: '11-12', description: 'Determine two or more central ideas and analyze their development.' },
    ],
  },
  {
    id: 'cc-ela-w', subject: 'ELA', gradeRange: '9-12', title: 'Writing',
    standards: [
      { id: 'cc-w-9-1', code: 'W.9-10.1', grade: '9-10', description: 'Write arguments to support claims using valid reasoning and relevant evidence.' },
      { id: 'cc-w-9-2', code: 'W.9-10.2', grade: '9-10', description: 'Write informative/explanatory texts to examine and convey complex ideas.' },
      { id: 'cc-w-11-1', code: 'W.11-12.1', grade: '11-12', description: 'Write arguments with sophisticated claims, counterclaims, and evidence.' },
    ],
  },
  {
    id: 'cc-math-hsf', subject: 'Math', gradeRange: '9-12', title: 'Functions (High School)',
    standards: [
      { id: 'cc-hsf-if-1', code: 'HSF.IF.A.1', grade: '9-12', description: 'Understand that a function assigns exactly one output to each input.' },
      { id: 'cc-hsf-if-4', code: 'HSF.IF.B.4', grade: '9-12', description: 'Interpret key features of function graphs in context.' },
      { id: 'cc-hsf-bf-1', code: 'HSF.BF.A.1', grade: '9-12', description: 'Write a function that describes a relationship between two quantities.' },
    ],
  },
  {
    id: 'cc-math-hsa', subject: 'Math', gradeRange: '9-12', title: 'Algebra (High School)',
    standards: [
      { id: 'cc-hsa-sse-1', code: 'HSA.SSE.A.1', grade: '9-12', description: 'Interpret parts of an expression, such as terms, factors, and coefficients.' },
      { id: 'cc-hsa-sse-3', code: 'HSA.SSE.B.3', grade: '9-12', description: 'Choose and produce an equivalent form of an expression to reveal properties.' },
      { id: 'cc-hsa-rei-4', code: 'HSA.REI.B.4', grade: '9-12', description: 'Solve quadratic equations by appropriate methods.' },
    ],
  },
  {
    id: 'cc-math-8', subject: 'Math', gradeRange: '6-8', title: 'Expressions & Equations (Grades 6-8)',
    standards: [
      { id: 'cc-6-ee-1', code: '6.EE.A.1', grade: '6', description: 'Write and evaluate numerical expressions involving whole-number exponents.' },
      { id: 'cc-7-ee-1', code: '7.EE.A.1', grade: '7', description: 'Apply properties of operations to add, subtract, factor, and expand linear expressions.' },
      { id: 'cc-8-ee-1', code: '8.EE.A.1', grade: '8', description: 'Know and apply the properties of integer exponents.' },
    ],
  },
  {
    id: 'cc-ela-6-8', subject: 'ELA', gradeRange: '6-8', title: 'Reading: Literature (Grades 6-8)',
    standards: [
      { id: 'cc-rl-6-1', code: 'RL.6.1', grade: '6', description: 'Cite textual evidence to support analysis of explicit and inferred text meaning.' },
      { id: 'cc-rl-7-1', code: 'RL.7.1', grade: '7', description: 'Cite several pieces of textual evidence to support analysis.' },
      { id: 'cc-rl-8-1', code: 'RL.8.1', grade: '8', description: 'Cite strongest textual evidence that most strongly supports analysis.' },
    ],
  },
];

// ─── RFC (Reason for Change) options ─────────────────────────────────────────

export interface RFCOption {
  value: string;
  label: string;
  category: 'weather' | 'instruction' | 'administrative' | 'student' | 'technical';
  requiresNote: boolean;
}

export const RFC_OPTIONS: RFCOption[] = [
  // Weather
  { value: 'inclement_weather', label: 'Inclement Weather', category: 'weather', requiresNote: false },
  { value: 'school_closure_weather', label: 'School Closure – Weather', category: 'weather', requiresNote: false },
  // Instruction
  { value: 'remediation_needed', label: 'Remediation Needed', category: 'instruction', requiresNote: true },
  { value: 'additional_instruction_time', label: 'Additional Instruction Time Required', category: 'instruction', requiresNote: true },
  { value: 'curriculum_adjustment', label: 'Curriculum Adjustment', category: 'instruction', requiresNote: true },
  { value: 'pacing_adjustment', label: 'Pacing / Scope & Sequence Adjustment', category: 'instruction', requiresNote: false },
  // Administrative
  { value: 'state_testing', label: 'State Testing Conflict (OSTP/EOI)', category: 'administrative', requiresNote: false },
  { value: 'school_event', label: 'School Event / Assembly', category: 'administrative', requiresNote: false },
  { value: 'field_trip', label: 'Field Trip', category: 'administrative', requiresNote: false },
  { value: 'professional_development', label: 'Teacher Professional Development Day', category: 'administrative', requiresNote: false },
  { value: 'parent_conference', label: 'Parent-Teacher Conference Day', category: 'administrative', requiresNote: false },
  // Student
  { value: 'student_performance', label: 'Student Performance Concern', category: 'student', requiresNote: true },
  { value: 'iep_accommodation', label: 'IEP / 504 Accommodation', category: 'student', requiresNote: false },
  // Technical
  { value: 'technology_failure', label: 'Technology / System Failure', category: 'technical', requiresNote: false },
  { value: 'resource_unavailable', label: 'Required Resource Unavailable', category: 'technical', requiresNote: true },
  { value: 'other', label: 'Other (Specify in Notes)', category: 'technical', requiresNote: true },
];

export const RFC_CATEGORY_LABELS: Record<string, string> = {
  weather: '🌧️ Weather',
  instruction: '📚 Instruction',
  administrative: '🏫 Administrative',
  student: '👩‍🎓 Student',
  technical: '⚙️ Technical',
};

// ─── Assignment types for NIP-52 tagging ─────────────────────────────────────

export type AssignmentType = 'homework' | 'quiz' | 'test' | 'project' | 'lab' | 'presentation' | 'essay' | 'reading';

export const ASSIGNMENT_TYPE_LABELS: Record<AssignmentType, string> = {
  homework: '📝 Homework',
  quiz: '📋 Quiz',
  test: '📊 Test / Exam',
  project: '🗂️ Project',
  lab: '🔬 Lab',
  presentation: '🎤 Presentation',
  essay: '✍️ Essay',
  reading: '📖 Reading',
};

export const ASSIGNMENT_TYPE_COLORS: Record<AssignmentType, string> = {
  homework: 'bg-blue-100 text-blue-700',
  quiz: 'bg-amber-100 text-amber-700',
  test: 'bg-red-100 text-red-700',
  project: 'bg-purple-100 text-purple-700',
  lab: 'bg-green-100 text-green-700',
  presentation: 'bg-indigo-100 text-indigo-700',
  essay: 'bg-orange-100 text-orange-700',
  reading: 'bg-teal-100 text-teal-700',
};
