import { useState, useMemo, type FormEvent } from 'react';
import {
  Search,
  Calendar,
  MapPin,
  User,
  BookOpen,
  CheckCircle,
  Clock,
  X,
  Plus,
  Smartphone,
  Building2,
  ClipboardList,
  Eye,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Home,
  Laptop,
  Receipt,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';

type ModuleType = 'physical' | 'home' | 'online';
type PaymentStatus = 'paid' | 'pending';
type PaymentMethod = 'MPESA' | 'Bank Transfer';
type ClaimStatus = 'submitted' | 'approved' | 'paid';
type SupervisorClaimStatus = 'pending_review' | 'approved' | 'rejected' | 'moved_to_finance';
type ClaimPaymentType = 'full' | 'advance';
type AssignmentStatus = 'issued' | 'submitted' | 'graded';
type ReportStatus = 'pending' | 'graded';
type AdminPage = 'dashboard' | 'supervisor' | 'claims' | 'payment' | 'claim-detail' | 'assignment-detail' | 'report-detail';

type Session = {
  id: number;
  mentor: string;
  date: string;
  learner: string;
  description: string;
  module: ModuleType;
  status: PaymentStatus;
  location?: string;
  amount?: number;
  paymentMethod?: PaymentMethod;
};

type PaymentFormState = {
  learner: string;
  mentor: string;
  date: string;
  module: ModuleType;
  description: string;
  location: string;
  amount: string;
  paymentMethod: PaymentMethod;
  mpesaPhone: string;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  cardholderName: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
  cashReceivedBy: string;
};

type MentorClaim = {
  id: number;
  sessionIds: number[];
  mentor: string;
  learner: string;
  courseName: string;
  module: ModuleType;
  claimMonth: string;
  completedSessions: number;
  totalSessions: number;
  submittedAt: string;
  status: ClaimStatus;
  supervisorStatus: SupervisorClaimStatus;
  paymentType: ClaimPaymentType;
  progressPercent: number;
  etimsDocumentId: string;
  etimsDocumentUrl: string;
  courseActivity: string[];
  rejectionReason?: string;
  reviewedAt?: string;
  movedToFinanceAt?: string;
  notes?: string;
};

type ClaimStudent = {
  id: number;
  name: string;
  initials: string;
  attendance: 'present' | 'absent';
  assignmentStatus: AssignmentStatus;
  reportStatus: ReportStatus;
};

// Payment rates in KSh
const RATES = {
  mentor: {
    physical: 904,
    home: 904,
    online: 500,
  },
  digifunzi: 500,
  location: 500,
};

const MAX_COURSE_SESSION_COUNT = 12;

const courseOptions = [
  'Story development',
  'Animation',
  'Simple robotics',
  'Game design',
  'Code foundation',
  'Robotics with Quarky',
  'Introduction to coding',
  'Programming in Python',
];

const locationOptions = ['The Work Place', 'Java House', 'Artcaffee'];
const SHARED_BANK_NAME = 'KCB Bank';
const paymentMethods: Array<{ name: PaymentMethod; icon: typeof Smartphone }> = [
  { name: 'MPESA', icon: Smartphone },
  { name: 'Bank Transfer', icon: Building2 },
];

const getClaimProgress = (completedSessions: number, totalSessions: number) => (
  Math.round((completedSessions / totalSessions) * 100)
);

const createEtimsUrl = (claimId: number) => `https://etims.digifunzi.local/documents/ETIMS-${claimId}`;

const studentNamePool = [
  'Amara Osei',
  'Brian Kamau',
  'Cynthia Mwangi',
  'David Njoroge',
  'Esther Akinyi',
  'Felix Otieno',
  'James Kariuki',
  'Lena Omondi',
];

const getInitials = (name: string) => (
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
);

const getClaimStudents = (claim: MentorClaim): ClaimStudent[] => {
  const count = claim.module === 'physical' ? 6 : 2;
  return studentNamePool.slice(0, count).map((name, index) => {
    const isLearnerRow = index === 0;
    const submittedButNotGraded = claim.progressPercent < 70 && index === count - 1;
    const issuedOnly = claim.progressPercent < 40 && index >= Math.max(count - 2, 1);
    const reportPending = claim.progressPercent < 60 && index === count - 1;

    return {
      id: claim.id * 10 + index,
      name: isLearnerRow ? claim.learner : name,
      initials: getInitials(isLearnerRow ? claim.learner : name),
      attendance: claim.progressPercent < 30 && index === count - 1 ? 'absent' : 'present',
      assignmentStatus: issuedOnly ? 'issued' : submittedButNotGraded ? 'submitted' : 'graded',
      reportStatus: reportPending ? 'pending' : 'graded',
    };
  });
};

// Mock data for sessions
const mockSessions: Session[] = [
  // Physical sessions
  { id: 1, mentor: 'Brian Otieno', date: '2026-05-15', location: 'The Work Place', learner: 'Leonella Thutu', description: 'Story development', module: 'physical', status: 'paid' },
  { id: 2, mentor: 'Peter Kariuki', date: '2026-05-16', location: 'Java House', learner: 'Isabella Mbugua', description: 'Animation', module: 'physical', status: 'paid' },
  { id: 3, mentor: 'Mercy Wanjiku', date: '2026-05-14', location: 'Artcaffee', learner: 'Jayson Mwangi', description: 'Simple robotics', module: 'physical', status: 'pending' },
  { id: 4, mentor: 'Kevin Mwangi', date: '2026-05-17', location: 'The Work Place', learner: 'Nancy Wanjiku', description: 'Game design', module: 'physical', status: 'paid' },
  { id: 5, mentor: 'Amina Hassan', date: '2026-05-18', location: 'Java House', learner: 'Neema Odhiambo', description: 'Code foundation', module: 'physical', status: 'pending' },
  { id: 6, mentor: 'Faith Njeri', date: '2026-05-19', location: 'Artcaffee', learner: 'Bradley Munene', description: 'Robotics with Quarky', module: 'physical', status: 'paid' },
  { id: 7, mentor: 'Samuel Kiptoo', date: '2026-05-20', location: 'The Work Place', learner: 'Nayla Mwangi', description: 'Introduction to coding', module: 'physical', status: 'paid' },
  { id: 8, mentor: 'Grace Achieng', date: '2026-05-21', location: 'Java House', learner: 'Peter Mbugua', description: 'Programming in Python', module: 'physical', status: 'pending' },
  { id: 9, mentor: 'Daniel Mutua', date: '2026-05-22', location: 'Artcaffee', learner: 'Natasha Kinuthia', description: 'Story development', module: 'physical', status: 'paid' },
  { id: 10, mentor: 'Winnie Chebet', date: '2026-05-23', location: 'The Work Place', learner: 'Author Gatimu', description: 'Animation', module: 'physical', status: 'pending' },

  // Home sessions
  { id: 11, mentor: 'Mercy Wanjiku', date: '2026-05-15', learner: 'Bradley Munene', description: 'Robotics with Quarky', module: 'home', status: 'paid' },
  { id: 12, mentor: 'Faith Njeri', date: '2026-05-16', learner: 'Nayla Mwangi', description: 'Introduction to coding', module: 'home', status: 'paid' },
  { id: 13, mentor: 'Samuel Kiptoo', date: '2026-05-17', learner: 'Peter Mbugua', description: 'Programming in Python', module: 'home', status: 'pending' },
  { id: 14, mentor: 'Brian Otieno', date: '2026-05-18', learner: 'Natasha Kinuthia', description: 'Story development', module: 'home', status: 'paid' },
  { id: 15, mentor: 'Kevin Mwangi', date: '2026-05-19', learner: 'Author Gatimu', description: 'Animation', module: 'home', status: 'paid' },
  { id: 16, mentor: 'Amina Hassan', date: '2026-05-20', learner: 'Leonella Thutu', description: 'Simple robotics', module: 'home', status: 'pending' },
  { id: 17, mentor: 'Grace Achieng', date: '2026-05-21', learner: 'Isabella Mbugua', description: 'Game design', module: 'home', status: 'paid' },
  { id: 18, mentor: 'Daniel Mutua', date: '2026-05-22', learner: 'Jayson Mwangi', description: 'Code foundation', module: 'home', status: 'paid' },
  { id: 19, mentor: 'Winnie Chebet', date: '2026-05-23', learner: 'Nancy Wanjiku', description: 'Robotics with Quarky', module: 'home', status: 'pending' },
  { id: 20, mentor: 'Peter Kariuki', date: '2026-05-24', learner: 'Neema Odhiambo', description: 'Programming in Python', module: 'home', status: 'paid' },

  // Online sessions
  { id: 21, mentor: 'Kevin Mwangi', date: '2026-05-15', learner: 'Author Gatimu', description: 'Animation', module: 'online', status: 'paid' },
  { id: 22, mentor: 'Grace Achieng', date: '2026-05-16', learner: 'Leonella Thutu', description: 'Simple robotics', module: 'online', status: 'paid' },
  { id: 23, mentor: 'Daniel Mutua', date: '2026-05-17', learner: 'Isabella Mbugua', description: 'Game design', module: 'online', status: 'pending' },
  { id: 24, mentor: 'Brian Otieno', date: '2026-05-18', learner: 'Jayson Mwangi', description: 'Code foundation', module: 'online', status: 'paid' },
  { id: 25, mentor: 'Mercy Wanjiku', date: '2026-05-19', learner: 'Nancy Wanjiku', description: 'Programming in Python', module: 'online', status: 'pending' },
  { id: 26, mentor: 'Amina Hassan', date: '2026-05-20', learner: 'Neema Odhiambo', description: 'Story development', module: 'online', status: 'paid' },
  { id: 27, mentor: 'Faith Njeri', date: '2026-05-21', learner: 'Bradley Munene', description: 'Animation', module: 'online', status: 'paid' },
  { id: 28, mentor: 'Samuel Kiptoo', date: '2026-05-22', learner: 'Nayla Mwangi', description: 'Introduction to coding', module: 'online', status: 'pending' },
  { id: 29, mentor: 'Peter Kariuki', date: '2026-05-23', learner: 'Peter Mbugua', description: 'Robotics with Quarky', module: 'online', status: 'paid' },
  { id: 30, mentor: 'Winnie Chebet', date: '2026-05-24', learner: 'Natasha Kinuthia', description: 'Programming in Python', module: 'online', status: 'paid' },
];

// Additional mock sessions added for more comprehensive UI testing
const additionalMockSessions: Session[] = [
  { id: 31, mentor: 'Lydia Muturi', date: '2026-05-25', location: 'Java House', learner: 'Omar Ali', description: 'Code foundation', module: 'physical', status: 'paid', amount: 1904, paymentMethod: 'MPESA' },
  { id: 32, mentor: 'Jared Omondi', date: '2026-05-26', location: 'The Work Place', learner: 'Aisha Noor', description: 'Game design', module: 'physical', status: 'pending' },
  { id: 33, mentor: 'Njeri Kamau', date: '2026-05-27', learner: 'Kwame Mensah', description: 'Introduction to coding', module: 'home', status: 'paid', amount: 1404, paymentMethod: 'Bank Transfer' },
  { id: 34, mentor: 'Felix Oduor', date: '2026-05-28', learner: 'Martha Wanjiru', description: 'Animation', module: 'online', status: 'paid', amount: 1000, paymentMethod: 'MPESA' },
  { id: 35, mentor: 'Susan Mwende', date: '2026-05-29', location: 'Artcaffee', learner: 'John Doe', description: 'Robotics with Quarky', module: 'physical', status: 'pending' },
  { id: 36, mentor: 'Patrick Njoroge', date: '2026-05-30', learner: 'Jane Otieno', description: 'Story development', module: 'online', status: 'paid', amount: 1000, paymentMethod: 'MPESA' },
  { id: 37, mentor: 'Rachel Kimani', date: '2026-06-01', location: 'Java House', learner: 'Samuel Kiplimo', description: 'Animation', module: 'physical', status: 'paid', amount: 1904, paymentMethod: 'Bank Transfer' },
  { id: 38, mentor: 'Tom Ouma', date: '2026-06-02', learner: 'Ruth Ndegwa', description: 'Code foundation', module: 'home', status: 'pending' },
  { id: 39, mentor: 'Alice Njoroge', date: '2026-06-03', location: 'The Work Place', learner: 'Brian Obiero', description: 'Programming in Python', module: 'physical', status: 'paid', amount: 1904, paymentMethod: 'MPESA' },
  { id: 40, mentor: 'Charles Kibet', date: '2026-06-04', learner: 'Nancy Wanjiku', description: 'Game design', module: 'online', status: 'pending' },
  { id: 41, mentor: 'Dorcas Awuor', date: '2026-06-05', location: 'Artcaffee', learner: 'Kevin Mwangi', description: 'Story development', module: 'physical', status: 'paid', amount: 1904, paymentMethod: 'Bank Transfer' },
  { id: 42, mentor: 'Evelyn Otieno', date: '2026-06-06', learner: 'Neema Odhiambo', description: 'Simple robotics', module: 'home', status: 'paid', amount: 1404, paymentMethod: 'MPESA' },
  { id: 43, mentor: 'Francis Mwangi', date: '2026-06-07', learner: 'Isabella Mbugua', description: 'Robotics with Quarky', module: 'online', status: 'paid', amount: 1000, paymentMethod: 'Bank Transfer' },
  { id: 44, mentor: 'Gladys Wanja', date: '2026-06-08', location: 'Java House', learner: 'Bradley Munene', description: 'Introduction to coding', module: 'physical', status: 'pending' },
  { id: 45, mentor: 'Henry Mutiso', date: '2026-06-09', learner: 'Nayla Mwangi', description: 'Animation', module: 'home', status: 'paid', amount: 1404, paymentMethod: 'MPESA' },
  { id: 46, mentor: 'Irene Chebon', date: '2026-06-10', location: 'Artcaffee', learner: 'Peter Mbugua', description: 'Programming in Python', module: 'physical', status: 'paid', amount: 1904, paymentMethod: 'Bank Transfer' },
  { id: 47, mentor: 'James Otieno', date: '2026-06-11', learner: 'Leonella Thutu', description: 'Code foundation', module: 'online', status: 'pending' },
  { id: 48, mentor: 'Khadija Noor', date: '2026-06-12', location: 'The Work Place', learner: 'Natasha Kinuthia', description: 'Story development', module: 'physical', status: 'paid', amount: 1904, paymentMethod: 'MPESA' },
  { id: 49, mentor: 'Larry Kimani', date: '2026-06-13', learner: 'Author Gatimu', description: 'Simple robotics', module: 'home', status: 'pending' },
  { id: 50, mentor: 'Moses Karanja', date: '2026-06-14', location: 'Java House', learner: 'Amina Hassan', description: 'Robotics with Quarky', module: 'physical', status: 'paid', amount: 1904, paymentMethod: 'Bank Transfer' },
];

// Merge additional sessions into the main mockSessions array so the rest of the app uses them
const mergedMockSessions: Session[] = [...mockSessions, ...additionalMockSessions];
type SeedMentorClaim = Omit<
  MentorClaim,
  'supervisorStatus' | 'paymentType' | 'progressPercent' | 'etimsDocumentId' | 'etimsDocumentUrl' | 'courseActivity'
> & Partial<Pick<
  MentorClaim,
  'supervisorStatus' | 'paymentType' | 'progressPercent' | 'etimsDocumentId' | 'etimsDocumentUrl' | 'courseActivity'
>>;

const seedClaims: SeedMentorClaim[] = [
  {
    id: 1001,
    sessionIds: [3, 5, 8, 10],
    mentor: 'Mercy Wanjiku',
    learner: 'Jayson Mwangi',
    courseName: 'Simple robotics',
    module: 'physical',
    claimMonth: 'May 2026',
    completedSessions: 4,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-05-31',
    status: 'submitted',
    supervisorStatus: 'pending_review',
    paymentType: 'advance',
    progressPercent: 33,
    notes: 'Advance claim submitted after the first block of physical sessions.',
  },
  {
    id: 1002,
    sessionIds: [13, 16, 19],
    mentor: 'Samuel Kiptoo',
    learner: 'Peter Mbugua',
    courseName: 'Programming in Python',
    module: 'home',
    claimMonth: 'May 2026',
    completedSessions: 12,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-05-31',
    status: 'approved',
    supervisorStatus: 'moved_to_finance',
    paymentType: 'full',
    progressPercent: 100,
    movedToFinanceAt: '2026-06-02',
    notes: 'Approved after reviewing the completed home-course sessions.',
  },
  {
    id: 1003,
    sessionIds: [23, 25, 28],
    mentor: 'Daniel Mutua',
    learner: 'Isabella Mbugua',
    courseName: 'Game design',
    module: 'online',
    claimMonth: 'May 2026',
    completedSessions: 6,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-05-31',
    status: 'approved',
    supervisorStatus: 'moved_to_finance',
    paymentType: 'advance',
    progressPercent: 50,
    movedToFinanceAt: '2026-06-02',
    notes: 'Six online sessions submitted for this month; ready for payout.',
  },
  {
    id: 1004,
    sessionIds: [1, 4, 7, 9],
    mentor: 'Brian Otieno',
    learner: 'Leonella Thutu',
    courseName: 'Story development',
    module: 'physical',
    claimMonth: 'April 2026',
    completedSessions: 12,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-04-30',
    status: 'paid',
    supervisorStatus: 'moved_to_finance',
    paymentType: 'full',
    progressPercent: 100,
    reviewedAt: '2026-05-01',
    movedToFinanceAt: '2026-05-01',
    notes: 'Paid through monthly mentor payout.',
  },

  // New claims referencing additional mock sessions
  {
    id: 1005,
    sessionIds: [31, 34, 39],
    mentor: 'Lydia Muturi',
    learner: 'Omar Ali',
    courseName: 'Code foundation',
    module: 'physical',
    claimMonth: 'June 2026',
    completedSessions: 3,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-06-15',
    status: 'submitted',
    supervisorStatus: 'pending_review',
    paymentType: 'full',
    progressPercent: 25,
    notes: 'Full-payment request submitted before the course reached completion.',
  },
  {
    id: 1006,
    sessionIds: [33, 42],
    mentor: 'Njeri Kamau',
    learner: 'Kwame Mensah',
    courseName: 'Introduction to coding',
    module: 'home',
    claimMonth: 'June 2026',
    completedSessions: 2,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-06-15',
    status: 'approved',
    supervisorStatus: 'moved_to_finance',
    paymentType: 'advance',
    progressPercent: 35,
    reviewedAt: '2026-06-16',
    movedToFinanceAt: '2026-06-16',
    notes: 'Home visits verified and approved.',
  },
  {
    id: 1007,
    sessionIds: [36, 43],
    mentor: 'Patrick Njoroge',
    learner: 'Jane Otieno',
    courseName: 'Story development',
    module: 'online',
    claimMonth: 'June 2026',
    completedSessions: 2,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-06-14',
    status: 'submitted',
    supervisorStatus: 'rejected',
    paymentType: 'advance',
    progressPercent: 17,
    rejectionReason: 'Advance claims require at least 30% course progress.',
    reviewedAt: '2026-06-15',
    notes: 'Online sessions were reviewed but did not meet the advance-payment threshold.',
  },
  {
    id: 1008,
    sessionIds: [37, 41, 46, 48, 50],
    mentor: 'Rachel Kimani',
    learner: 'Samuel Kiplimo',
    courseName: 'Animation',
    module: 'physical',
    claimMonth: 'June 2026',
    completedSessions: 5,
    totalSessions: MAX_COURSE_SESSION_COUNT,
    submittedAt: '2026-06-16',
    status: 'paid',
    supervisorStatus: 'moved_to_finance',
    paymentType: 'advance',
    progressPercent: 42,
    reviewedAt: '2026-06-17',
    movedToFinanceAt: '2026-06-17',
    notes: 'Paid claim for a cohort of animation sessions.',
  },
];

const mockClaims: MentorClaim[] = seedClaims.map((claim) => ({
  ...claim,
  supervisorStatus: claim.supervisorStatus ?? (claim.status === 'approved' ? 'moved_to_finance' : 'pending_review'),
  paymentType: claim.paymentType ?? (claim.completedSessions === claim.totalSessions ? 'full' : 'advance'),
  progressPercent: claim.progressPercent ?? getClaimProgress(claim.completedSessions, claim.totalSessions),
  etimsDocumentId: claim.etimsDocumentId ?? `ETIMS-${claim.id}`,
  etimsDocumentUrl: claim.etimsDocumentUrl ?? createEtimsUrl(claim.id),
  courseActivity: claim.courseActivity ?? [
    `${claim.completedSessions}/${claim.totalSessions} course sessions marked complete`,
    `${claim.module === 'physical' ? 'Physical location' : claim.module === 'home' ? 'Home location' : 'Online'} delivery evidence checked`,
    `Claim submitted for ${claim.claimMonth}`,
  ],
}));

export default function App() {
  const [sessions, setSessions] = useState<Session[]>(mergedMockSessions);
  const [claims, setClaims] = useState<MentorClaim[]>(mockClaims);
  const [selectedModule, setSelectedModule] = useState<ModuleType>('physical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [activePage, setActivePage] = useState<AdminPage>('dashboard');
  const [selectedClaimId, setSelectedClaimId] = useState<number | null>(null);
  const [selectedAdminClaimId, setSelectedAdminClaimId] = useState<number | null>(null);
  const [selectedEvidenceSession, setSelectedEvidenceSession] = useState(1);
  const [selectedEtimsClaimId, setSelectedEtimsClaimId] = useState<number | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<number, string>>({});
  const [paymentSaved, setPaymentSaved] = useState(false);
  const [paymentForm, setPaymentForm] = useState<PaymentFormState>({
    learner: '',
    mentor: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    module: 'physical',
    description: '',
    location: locationOptions[0],
    amount: String(RATES.mentor.physical + RATES.digifunzi + RATES.location),
    paymentMethod: 'MPESA',
    mpesaPhone: '',
    bankName: SHARED_BANK_NAME,
    bankAccountNumber: '',
    bankAccountName: '',
    cardholderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    cashReceivedBy: '',
  });

  const updatePaymentForm = <K extends keyof PaymentFormState>(field: K, value: PaymentFormState[K]) => {
    setPaymentSaved(false);
    setPaymentForm((current) => {
      if (field === 'module') {
        const module = value as ModuleType;
        const mentorRate = module === 'online' ? RATES.mentor.online : RATES.mentor.physical;
        const locationRate = module === 'physical' ? RATES.location : 0;

        return {
          ...current,
          module,
          amount: String(mentorRate + RATES.digifunzi + locationRate),
          location: module === 'physical' ? current.location || locationOptions[0] : '',
        };
      }

      return { ...current, [field]: value };
    });
  };

  const getMentorSessionEarnings = (module: string) => (
    module === 'online' ? RATES.mentor.online : RATES.mentor.physical
  );

  const getMentorCourseClaimAmount = (claim: MentorClaim) => (
    getMentorSessionEarnings(claim.module) * claim.completedSessions
  );

  const claimRows = useMemo(() => (
    claims
      .map((claim) => {
        const courseSessions = sessions.filter((session) => claim.sessionIds.includes(session.id));
        return { ...claim, courseSessions };
      })
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  ), [claims, sessions]);

  const filteredClaimRows = useMemo(() => (
    claimRows.filter((claim) => {
      const matchesModule = claim.module === selectedModule;
      const matchesSearch = searchQuery === '' ||
        claim.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.learner.toLowerCase().includes(searchQuery.toLowerCase()) ||
        claim.courseName.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesModule && matchesSearch;
    })
  ), [claimRows, selectedModule, searchQuery]);

  const claimSummary = useMemo(() => {
    const submitted = claimRows.filter((claim) => claim.status === 'submitted').length;
    const approved = claimRows.filter((claim) => claim.status === 'approved').length;
    const paid = claimRows.filter((claim) => claim.status === 'paid').length;
    const totalAmount = claimRows.reduce((sum, claim) => sum + getMentorCourseClaimAmount(claim), 0);
    const approvedAmount = claimRows
      .filter((claim) => claim.status === 'approved')
      .reduce((sum, claim) => sum + getMentorCourseClaimAmount(claim), 0);

    return { submitted, approved, paid, totalAmount, approvedAmount };
  }, [claimRows]);

  const financeClaimRows = useMemo(() => (
    claimRows.filter((claim) => claim.supervisorStatus === 'moved_to_finance' && (claim.status === 'approved' || claim.status === 'paid'))
  ), [claimRows]);

  const supervisorSummary = useMemo(() => {
    const pending = claimRows.filter((claim) => claim.supervisorStatus === 'pending_review').length;
    const approved = claimRows.filter((claim) => claim.supervisorStatus === 'approved').length;
    const rejected = claimRows.filter((claim) => claim.supervisorStatus === 'rejected').length;
    const movedToFinance = claimRows.filter((claim) => claim.supervisorStatus === 'moved_to_finance').length;

    return { pending, approved, rejected, movedToFinance };
  }, [claimRows]);

  const selectedEtimsClaim = selectedEtimsClaimId ? claimRows.find((claim) => claim.id === selectedEtimsClaimId) : null;

  const canSupervisorApprove = (claim: MentorClaim) => (
    claim.paymentType === 'full' ? claim.progressPercent >= 100 : claim.progressPercent >= 30
  );

  const getSupervisorStatusLabel = (status: SupervisorClaimStatus) => {
    if (status === 'pending_review') return 'Pending Review';
    if (status === 'moved_to_finance') return 'Approved - Sent to Admin';
    return status === 'approved' ? 'Approved' : 'Rejected';
  };

  const getAdminStatusLabel = (claim: MentorClaim) => {
    if (claim.status === 'paid') return 'Paid';
    if (claim.supervisorStatus === 'moved_to_finance') return 'Ready to Pay';
    if (claim.supervisorStatus === 'rejected') return 'Rejected by Supervisor';
    if (claim.supervisorStatus === 'approved') return 'Supervisor Approved';
    return 'Pending Supervisor Review';
  };

  const approveClaim = (claimId: number) => {
    setClaims((currentClaims) => currentClaims.map((claim) => (
      claim.id === claimId && claim.supervisorStatus === 'pending_review' && canSupervisorApprove(claim)
        ? {
            ...claim,
            status: 'approved',
            supervisorStatus: 'moved_to_finance',
            reviewedAt: format(new Date(), 'yyyy-MM-dd'),
            movedToFinanceAt: format(new Date(), 'yyyy-MM-dd'),
            rejectionReason: undefined,
          }
        : claim
    )));
  };

  const rejectClaim = (claimId: number) => {
    const reason = rejectionReasons[claimId]?.trim();
    if (!reason) return;

    setClaims((currentClaims) => currentClaims.map((claim) => (
      claim.id === claimId
        ? { ...claim, supervisorStatus: 'rejected', status: 'submitted', rejectionReason: reason, reviewedAt: format(new Date(), 'yyyy-MM-dd') }
        : claim
    )));
  };

  const startClaimPayment = (claimId: number) => {
    const claim = claimRows.find((item) => item.id === claimId);
    if (!claim || claim.status !== 'approved' || claim.supervisorStatus !== 'moved_to_finance') return;

    setSelectedClaimId(claim.id);
    setPaymentSaved(false);
    setPaymentForm((current) => ({
      ...current,
      learner: claim.learner,
      mentor: claim.mentor,
      date: format(new Date(), 'yyyy-MM-dd'),
      module: claim.module,
      description: claim.courseName,
      location: claim.courseSessions[0]?.location || '',
      amount: String(getMentorCourseClaimAmount(claim)),
      paymentMethod: 'MPESA',
      bankName: SHARED_BANK_NAME,
    }));
    setActivePage('payment');
  };

  const handlePaymentSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (selectedClaimId !== null) {
      const paidClaim = claims.find((claim) => claim.id === selectedClaimId);
      if (paidClaim) {
        setClaims((currentClaims) => currentClaims.map((claim) => (
          claim.id === selectedClaimId ? { ...claim, status: 'paid' } : claim
        )));
        setSessions((currentSessions) => currentSessions.map((session) => (
          paidClaim.sessionIds.includes(session.id)
            ? {
                ...session,
                status: 'paid',
                amount: getMentorSessionEarnings(paidClaim.module),
                paymentMethod: paymentForm.paymentMethod,
              }
            : session
        )));
        setSelectedModule(paidClaim.module);
        setSearchQuery('');
        setPaymentSaved(true);
        setSelectedClaimId(null);
        setActivePage('dashboard');
        return;
      }
    }

    const nextSession: Session = {
      id: Math.max(...sessions.map((session) => session.id), 0) + 1,
      mentor: paymentForm.mentor.trim(),
      date: paymentForm.date,
      learner: paymentForm.learner.trim(),
      description: paymentForm.description,
      module: paymentForm.module,
      status: 'paid',
      amount: Number(paymentForm.amount),
      paymentMethod: paymentForm.paymentMethod,
      ...(paymentForm.module === 'physical' ? { location: paymentForm.location } : {}),
    };

    setSessions((currentSessions) => [nextSession, ...currentSessions]);
    setSelectedModule(paymentForm.module);
    setSearchQuery('');
    setPaymentSaved(true);
    setActivePage('dashboard');
    setPaymentForm((current) => ({
      ...current,
      learner: '',
      mentor: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: String(
        (current.module === 'online' ? RATES.mentor.online : RATES.mentor.physical) +
        RATES.digifunzi +
        (current.module === 'physical' ? RATES.location : 0)
      ),
    }));
  };

  // Filter sessions by selected module and search query
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      const matchesModule = session.module === selectedModule;
      const matchesSearch = searchQuery === '' ||
        session.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.learner.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesModule && matchesSearch;
    });
  }, [sessions, selectedModule, searchQuery]);

  // Calculate earnings for each module
  const calculateModuleEarnings = (module: ModuleType) => {
    const moduleClaims = financeClaimRows.filter(claim => claim.module === module);
    const sessionCount = moduleClaims.reduce((sum, claim) => sum + claim.completedSessions, 0);
    const mentorEarnings = moduleClaims.reduce((sum, claim) => sum + getMentorCourseClaimAmount(claim), 0);

    const digifunziEarnings = sessionCount * RATES.digifunzi;
    const locationEarnings = module === 'physical' ? sessionCount * RATES.location : 0;
    const total = mentorEarnings + digifunziEarnings + locationEarnings;

    return { mentorEarnings, digifunziEarnings, locationEarnings, total, sessionCount };
  };

  // Calculate mentor-specific earnings
  const calculateMentorStats = () => {
    const mentorStats = new Map();

    filteredSessions.forEach(session => {
      if (!mentorStats.has(session.mentor)) {
        mentorStats.set(session.mentor, { sessions: [], totalEarnings: 0, sessionCount: 0 });
      }

      const stats = mentorStats.get(session.mentor);
      stats.sessions.push(session);
      stats.sessionCount += 1;

      if (selectedModule === 'physical' || selectedModule === 'home') {
        stats.totalEarnings += RATES.mentor.physical;
      } else {
        stats.totalEarnings += RATES.mentor.online;
      }
    });

    return mentorStats;
  };

  const physicalEarnings = calculateModuleEarnings('physical');
  const homeEarnings = calculateModuleEarnings('home');
  const onlineEarnings = calculateModuleEarnings('online');
  const totalEarnings = physicalEarnings.total + homeEarnings.total + onlineEarnings.total;
  const selectedClaim = selectedClaimId ? claimRows.find((claim) => claim.id === selectedClaimId) : null;
  const selectedAdminClaim = selectedAdminClaimId ? claimRows.find((claim) => claim.id === selectedAdminClaimId) : null;

  const mentorStats = calculateMentorStats();

  const openAdminClaim = (claimId: number) => {
    setSelectedAdminClaimId(claimId);
    setSelectedEvidenceSession(1);
    setActivePage('claim-detail');
  };

  const backToAdminClaim = () => {
    setActivePage(selectedAdminClaimId ? 'claim-detail' : 'claims');
  };

  const getAssignmentStatusClass = (status: AssignmentStatus) => (
    status === 'graded'
      ? 'bg-green-50 text-green-700 border-green-200'
      : status === 'submitted'
        ? 'bg-orange-50 text-orange-700 border-orange-200'
        : 'bg-gray-100 text-gray-700 border-gray-200'
  );

  const getReportStatusLabel = (status: ReportStatus) => (status === 'graded' ? 'Graded' : 'Pending');

  const getReportStatusClass = (status: ReportStatus) => (
    status === 'graded' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-pink-50 text-pink-700 border-pink-200'
  );

  const getClaimStatusPillClass = (claim: MentorClaim) => {
    if (claim.status === 'paid' || claim.status === 'approved') return 'bg-green-50 text-green-700';
    if (claim.supervisorStatus === 'rejected') return 'bg-red-50 text-red-700';
    return 'bg-yellow-50 text-yellow-700';
  };

  const getMethodLabel = (module: ModuleType) => (
    module === 'physical' ? 'Physical' : module === 'home' ? 'Home' : 'Online'
  );

  // Get all monthly claims for the selected mentor across all modules
  const getMentorDetails = (mentorName: string) => {
    const allMentorClaims = claimRows.filter(claim => claim.mentor === mentorName);
    const physicalClaims = allMentorClaims.filter(claim => claim.module === 'physical');
    const homeClaims = allMentorClaims.filter(claim => claim.module === 'home');
    const onlineClaims = allMentorClaims.filter(claim => claim.module === 'online');

    const physicalSessions = physicalClaims.reduce((sum, claim) => sum + claim.completedSessions, 0);
    const homeSessions = homeClaims.reduce((sum, claim) => sum + claim.completedSessions, 0);
    const onlineSessions = onlineClaims.reduce((sum, claim) => sum + claim.completedSessions, 0);

    const physicalEarnings = physicalClaims.reduce((sum, claim) => sum + getMentorCourseClaimAmount(claim), 0);
    const homeEarnings = homeClaims.reduce((sum, claim) => sum + getMentorCourseClaimAmount(claim), 0);
    const onlineEarnings = onlineClaims.reduce((sum, claim) => sum + getMentorCourseClaimAmount(claim), 0);
    const totalEarnings = physicalEarnings + homeEarnings + onlineEarnings;

    const paidSessions = allMentorClaims
      .filter(claim => claim.status === 'paid')
      .reduce((sum, claim) => sum + claim.completedSessions, 0);
    const pendingSessions = allMentorClaims
      .filter(claim => claim.status !== 'paid')
      .reduce((sum, claim) => sum + claim.completedSessions, 0);

    return {
      name: mentorName,
      allClaims: allMentorClaims,
      physicalSessions,
      homeSessions,
      onlineSessions,
      physicalEarnings,
      homeEarnings,
      onlineEarnings,
      totalEarnings,
      totalSessions: allMentorClaims.reduce((sum, claim) => sum + claim.completedSessions, 0),
      totalClaims: allMentorClaims.length,
      paidSessions,
      pendingSessions,
    };
  };

  if (activePage === 'assignment-detail' || activePage === 'report-detail') {
    if (!selectedAdminClaim) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <button
            type="button"
            onClick={() => setActivePage('claims')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 font-semibold shadow-sm"
            style={{ color: '#25476a' }}
          >
            <ChevronLeft size={18} />
            Back to Approved Claims
          </button>
        </div>
      );
    }

    const students = getClaimStudents(selectedAdminClaim);
    const isAssignmentPage = activePage === 'assignment-detail';
    const gradedAssignments = students.filter((student) => student.assignmentStatus === 'graded').length;
    const submittedAssignments = students.filter((student) => student.assignmentStatus === 'submitted').length;
    const issuedAssignments = students.filter((student) => student.assignmentStatus === 'issued').length;
    const gradedReports = students.filter((student) => student.reportStatus === 'graded').length;
    const pendingReports = students.filter((student) => student.reportStatus === 'pending').length;

    return (
      <div className="min-h-screen w-full min-w-0 bg-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full min-w-0 max-w-screen-2xl mx-auto">
          <div className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={backToAdminClaim}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors hover:bg-white"
              style={{ color: '#25476a' }}
              aria-label="Back to course claim"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => setActivePage('claims')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors hover:bg-white"
              style={{ color: '#25476a' }}
              aria-label="Back to mentor claims"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#001b3f' }}>
                {isAssignmentPage ? 'Assignments' : 'Reports'} - Session {selectedEvidenceSession}
              </h1>
              <p className="text-sm" style={{ color: '#3f6790' }}>{selectedAdminClaim.submittedAt}</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedEvidenceSession((current) => Math.min(current + 1, selectedAdminClaim.completedSessions))}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-sm transition-colors hover:bg-white"
              style={{ color: '#25476a' }}
              aria-label="Next session"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="mb-5 rounded-lg bg-white px-5 py-5 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>{selectedAdminClaim.courseName}</p>
                <h2 className="text-xl font-bold" style={{ color: '#001b3f' }}>
                  Session {selectedEvidenceSession}{isAssignmentPage ? '' : ' Report'}
                </h2>
                <p className="text-sm" style={{ color: '#3f6790' }}>{selectedAdminClaim.submittedAt} - {students.length} students</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {isAssignmentPage ? (
                  <>
                    <div className="rounded-lg bg-green-50 px-6 py-3 text-center">
                      <p className="text-lg font-bold text-green-700">{gradedAssignments}</p>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-700">Graded</p>
                    </div>
                    <div className="rounded-lg bg-orange-50 px-6 py-3 text-center">
                      <p className="text-lg font-bold text-orange-700">{submittedAssignments}</p>
                      <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Submitted</p>
                    </div>
                    <div className="rounded-lg bg-gray-100 px-6 py-3 text-center">
                      <p className="text-lg font-bold" style={{ color: '#25476a' }}>{issuedAssignments}</p>
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Issued</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="rounded-lg bg-green-50 px-8 py-3 text-center">
                      <p className="text-lg font-bold text-green-700">{gradedReports}</p>
                      <p className="text-xs font-bold uppercase tracking-wide text-green-700">Graded</p>
                    </div>
                    <div className="rounded-lg bg-pink-50 px-8 py-3 text-center">
                      <p className="text-lg font-bold text-pink-700">{pendingReports}</p>
                      <p className="text-xs font-bold uppercase tracking-wide text-pink-700">Pending</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#eaf1f8' }}>
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Student Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>
                      {isAssignmentPage ? 'Assignment' : 'Report'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>
                      {isAssignmentPage ? 'Progress' : 'Status'}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>
                      {isAssignmentPage ? 'Assignment File' : 'Download'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#214a73' }}>
                            {student.initials}
                          </span>
                          <span className="font-semibold" style={{ color: '#001b3f' }}>{student.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold" style={{ color: '#001b3f' }}>Session {selectedEvidenceSession}{isAssignmentPage ? '' : ' Report'}</p>
                        <p className="text-xs" style={{ color: '#3f6790' }}>Session {selectedEvidenceSession}</p>
                      </td>
                      <td className="px-6 py-4">
                        {isAssignmentPage ? (
                          <div className="flex flex-wrap items-center gap-2 text-xs" style={{ color: '#001b3f' }}>
                            {(['issued', 'submitted', 'graded'] as AssignmentStatus[]).map((status, index) => (
                              <span key={status} className="inline-flex items-center gap-2">
                                <span className={`h-2.5 w-2.5 rounded-full ${student.assignmentStatus === status ? 'bg-[#214a73]' : 'bg-gray-300'}`} />
                                <span className="capitalize">{status}</span>
                                {index < 2 && <span className="h-px w-5 bg-gray-300" />}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getReportStatusClass(student.reportStatus)}`}>
                            {getReportStatusLabel(student.reportStatus)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold shadow-sm hover:bg-gray-50"
                          style={{ color: '#001b3f' }}
                        >
                          <Download size={16} />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Dialog.Root open={selectedEtimsClaimId !== null} onOpenChange={(open) => { if (!open) setSelectedEtimsClaimId(null); }}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed inset-0 flex items-center justify-center p-4">
              <div className="w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-lg overflow-hidden">
                <div className="flex items-center justify-between border-b p-3">
                  <div className="flex items-center gap-3">
                    <FileText size={18} />
                    <div className="text-sm font-semibold" style={{ color: '#001b3f' }}>{selectedEtimsClaim?.etimsDocumentId}</div>
                  </div>
                  <button type="button" onClick={() => setSelectedEtimsClaimId(null)} className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100" style={{ color: '#25476a' }}>
                    <X size={18} />
                  </button>
                </div>
                <iframe src={selectedEtimsClaim?.etimsDocumentUrl || ''} title="ETIMS Document" className="w-full h-full border-0" />
              </div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>

      </div>
    );
  }

  if (activePage === 'claim-detail') {
    if (!selectedAdminClaim) {
      return (
        <div className="min-h-screen bg-gray-50 p-6">
          <button
            type="button"
            onClick={() => setActivePage('claims')}
            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-4 py-2 font-semibold shadow-sm"
            style={{ color: '#25476a' }}
          >
            <ChevronLeft size={18} />
            Back to Approved Claims
          </button>
        </div>
      );
    }

    const students = getClaimStudents(selectedAdminClaim);
    const amountPayable = getMentorCourseClaimAmount(selectedAdminClaim);
    const advancePayable = Math.round(amountPayable * 0.3);
    // If this is an advance claim, the requested amount is the advance; otherwise it's the full amount
    const requestedAmount = selectedAdminClaim.paymentType === 'advance' ? advancePayable : amountPayable;
    // Estimated earnings: if request is advance, estimated full earnings ≈ requested / 0.3, else it's the full amount
    const estimatedEarnings = selectedAdminClaim.paymentType === 'advance' ? Math.round(requestedAmount / 0.3) : amountPayable;
    const attendancePercent = Math.round((students.filter((student) => student.attendance === 'present').length / students.length) * 100);
    const assignmentPercent = Math.round((students.filter((student) => student.assignmentStatus === 'graded').length / students.length) * 100);
    const reportPercent = Math.round((students.filter((student) => student.reportStatus === 'graded').length / students.length) * 100);

    return (
      <div className="min-h-screen w-full min-w-0 bg-gray-100 px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full min-w-0 max-w-screen-2xl mx-auto">
          <div className="mb-5 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setActivePage('claims')}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-white"
              style={{ color: '#25476a' }}
              aria-label="Back to mentor claims"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ backgroundColor: '#25476a' }}>
              <BookOpen size={20} />
            </span>
            <div>
              <h1 className="text-2xl font-bold" style={{ color: '#001b3f' }}>{selectedAdminClaim.courseName}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm" style={{ color: '#3f6790' }}>
                <span className="rounded-full bg-purple-600 px-3 py-1 text-xs font-semibold text-white">
                  {selectedAdminClaim.module === 'physical' ? 'Physical' : selectedAdminClaim.module === 'home' ? 'Home' : 'Online'}
                </span>
                <span>{selectedAdminClaim.courseSessions[0]?.location || `${selectedAdminClaim.module} class`}</span>
              </div>
            </div>
          </div>

            <div className="mb-6 grid overflow-hidden rounded-lg bg-white shadow-sm lg:grid-cols-3">
            <div className="flex items-center gap-5 border-b border-gray-200 p-6 lg:border-b-0 lg:border-r">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                style={{
                  color: '#001b3f',
                  background: `conic-gradient(#16a34a ${selectedAdminClaim.progressPercent * 3.6}deg, #e5edf5 0deg)`,
                }}
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white">{selectedAdminClaim.progressPercent}%</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Course Progress</p>
                <p className="text-lg font-bold" style={{ color: '#001b3f' }}>{selectedAdminClaim.completedSessions}/{selectedAdminClaim.totalSessions} sessions</p>
                <span className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold" style={{ color: '#25476a' }}>
                  <Users size={14} />
                  {students.length} students
                </span>
              </div>
            </div>
            <div className="border-b border-gray-200 p-6 lg:border-b-0 lg:border-r">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                <div className="lg:col-span-2">
                  <div className="rounded-lg border border-green-100 bg-green-50 p-6 h-full">
                    <p className="text-xs font-bold uppercase tracking-wide text-green-700">Amount Requested</p>
                    <p className="mt-4 text-3xl font-bold" style={{ color: '#0b5e3a' }}>KSh {requestedAmount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Estimated Earnings</p>
                    <p className="mt-2 text-lg font-bold text-gray-800">KSh {estimatedEarnings.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wide text-orange-700">Estimated Advance</p>
                    <p className="mt-2 text-lg font-bold text-orange-700">KSh {advancePayable.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6">
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Payment Actions</p>
              <p className="mt-2 text-sm font-semibold" style={{ color: '#001b3f' }}>
                {getAdminStatusLabel(selectedAdminClaim)}
              </p>
              {selectedAdminClaim.status === 'approved' ? (
                <button
                  type="button"
                  onClick={() => startClaimPayment(selectedAdminClaim.id)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-lg px-5 py-3 font-semibold text-white shadow-sm"
                  style={{ backgroundColor: '#25476a' }}
                >
                  <Receipt size={18} />
                  Pay Mentor
                </button>
              ) : (
                <div className="mt-6 rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700">
                  Payment status: {selectedAdminClaim.status === 'paid' ? 'Paid' : getAdminStatusLabel(selectedAdminClaim)}
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="overflow-hidden rounded-lg bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-gray-200 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-bold" style={{ color: '#001b3f' }}>Session {selectedEvidenceSession}</h2>
                  <p className="text-sm" style={{ color: '#3f6790' }}>{selectedAdminClaim.submittedAt}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold" style={{ color: '#001b3f' }}>Attendance {attendancePercent}%</span>
                  <button
                    type="button"
                    onClick={() => setActivePage('assignment-detail')}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50"
                    style={{ color: '#001b3f' }}
                  >
                    Assignment {assignmentPercent}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setActivePage('report-detail')}
                    className="rounded-full border border-gray-200 bg-white px-4 py-2 text-sm font-bold hover:bg-gray-50"
                    style={{ color: '#001b3f' }}
                  >
                    Report {reportPercent}%
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEvidenceSession((current) => Math.max(1, current - 1))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-50"
                    aria-label="Previous session"
                    style={{ color: '#25476a' }}
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm" style={{ color: '#001b3f' }}>{selectedEvidenceSession} / {selectedAdminClaim.completedSessions}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedEvidenceSession((current) => Math.min(current + 1, selectedAdminClaim.completedSessions))}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-50"
                    aria-label="Next session"
                    style={{ color: '#25476a' }}
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ backgroundColor: '#eaf1f8' }}>
                    <tr>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Student</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Attendance</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Assignment</th>
                      <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Report</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#214a73' }}>
                              {student.initials}
                            </span>
                            <span className="font-semibold" style={{ color: '#001b3f' }}>{student.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${student.attendance === 'present' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {student.attendance === 'present' ? 'Present' : 'Absent'}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setActivePage('assignment-detail')}
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold capitalize ${getAssignmentStatusClass(student.assignmentStatus)}`}
                          >
                            {student.assignmentStatus}
                          </button>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            type="button"
                            onClick={() => setActivePage('report-detail')}
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getReportStatusClass(student.reportStatus)}`}
                          >
                            {getReportStatusLabel(student.reportStatus)}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-lg bg-white p-5 shadow-sm">
              <div className="flex items-start gap-4">
                  <div>
                    <h2 className="text-lg font-bold" style={{ color: '#001b3f' }}>Claim History</h2>
                    <p className="text-sm" style={{ color: '#3f6790' }}>{selectedAdminClaim.courseName}</p>
                  </div>
                </div>
                <div className="mt-5">
                  <div className="rounded-lg border border-gray-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-bold" style={{ color: '#001b3f' }}>
                        {selectedAdminClaim.paymentType === 'advance' ? 'Advance claim' : 'Payment claim'}
                      </p>
                      <p className="text-xs" style={{ color: '#3f6790' }}>{format(new Date(selectedAdminClaim.submittedAt), 'MMM dd, yyyy')} 08:36 AM</p>
                    </div>
                    <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">{selectedAdminClaim.status === 'paid' ? 'Paid' : getAdminStatusLabel(selectedAdminClaim)}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm">
                    <span style={{ color: '#41658a' }}>Amount</span>
                    <span className="font-bold" style={{ color: '#001b3f' }}>KSh {requestedAmount.toLocaleString()}</span>
                  </div>
                  {selectedAdminClaim.notes && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>Note</p>
                      <p className="mt-1 text-sm" style={{ color: '#3f6790' }}>{selectedAdminClaim.notes}</p>
                    </div>
                  )}
                  {/* ETIMS attachment */}
                  {selectedAdminClaim.etimsDocumentUrl && (
                    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-wide" style={{ color: '#41658a' }}>ETIMS Document</p>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="text-sm text-gray-700">{selectedAdminClaim.etimsDocumentId}</div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedEtimsClaimId(selectedAdminClaim.id)}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                            style={{ color: '#25476a' }}
                          >
                            <FileText size={16} />
                            View ETIMS
                          </button>
                          <a href={selectedAdminClaim.etimsDocumentUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Open in new tab</a>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'supervisor') {
    return (
      <div className="min-h-screen w-full min-w-0 bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full min-w-0 max-w-screen-2xl mx-auto">
          <div className="mb-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActivePage('dashboard')}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
              style={{ color: '#25476a' }}
              aria-label="Back to Dashboard"
            >
              <ChevronLeft size={18} />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: '#25476a' }}>Supervisor Review (Removed)</h1>
          </div>
          <div className="rounded-lg bg-white p-6 text-sm text-gray-600">
            The Supervisor Review module has been removed.
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'claims') {
    return (
      <div className="min-h-screen w-full min-w-0 bg-gray-50 px-3 py-3 sm:px-4 lg:px-6">
        <div className="w-full min-w-0 max-w-screen-2xl mx-auto">
          <div className="mb-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedClaimId(null);
                setActivePage('dashboard');
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
              style={{ color: '#25476a' }}
              aria-label="Back to Dashboard"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-0" style={{ color: '#25476a' }}>Approved Claims</h1>
              <p className="text-gray-600">Pay claims approved by supervisors and sent to admin.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="block lg:hidden divide-y divide-gray-200">
              {financeClaimRows.map((claim) => (
                <div key={claim.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold" style={{ color: '#001b3f' }}>{claim.courseName}</p>
                      <p className="text-sm" style={{ color: '#25476a' }}>{claim.learner} - {claim.claimMonth}</p>
                    </div>
                    <span className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold ${getClaimStatusPillClass(claim)}`}>
                      {getAdminStatusLabel(claim)}
                    </span>
                  </div>
                  <div className="mt-3 grid gap-2 text-sm" style={{ color: '#25476a' }}>
                    <span>Mentor: {claim.mentor}</span>
                    <span>Method: {getMethodLabel(claim.module)}</span>
                    <span>Sessions: {claim.completedSessions}/{claim.totalSessions}</span>
                    <span>Submitted: {format(new Date(claim.submittedAt), 'MMM dd, yyyy')}</span>
                    <span className="font-bold">KES {getMentorCourseClaimAmount(claim).toLocaleString()}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => openAdminClaim(claim.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold hover:bg-blue-100"
                      style={{ color: '#25476a' }}
                    >
                      View More
                      <ChevronRight size={16} />
                    </button>
                    {claim.status === 'approved' && (
                      <button
                        type="button"
                        onClick={() => startClaimPayment(claim.id)}
                        className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white"
                        style={{ backgroundColor: '#feb139' }}
                      >
                        <Plus size={16} />
                        Pay Mentor
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#eaf1f8' }}>
                  <tr className="border-b border-gray-200">
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Course</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Mentor</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Method</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Sessions</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Claim</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Submitted</th>
                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Status</th>
                    <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {financeClaimRows.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-5">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50" style={{ color: '#25476a' }}>
                            {claim.module === 'physical' ? <BookOpen size={18} /> : claim.module === 'home' ? <Home size={18} /> : <Laptop size={18} />}
                          </span>
                          <div>
                            <p className="font-bold" style={{ color: '#001b3f' }}>{claim.courseName}</p>
                            <p className="text-xs" style={{ color: '#25476a' }}>{claim.learner} - {claim.claimMonth}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-5">
                        <p className="text-sm" style={{ color: '#001b3f' }}>{claim.mentor}</p>
                      </td>
                      <td className="px-4 py-5">
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white"
                          style={{
                            backgroundColor: claim.module === 'physical' ? '#25476a' :
                                            claim.module === 'home' ? '#38aae1' : '#feb139'
                          }}
                        >
                          {claim.module === 'physical' ? <BookOpen size={12} /> : claim.module === 'home' ? <Home size={12} /> : <Laptop size={12} />}
                          {getMethodLabel(claim.module)}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-sm" style={{ color: '#001b3f' }}>
                        {claim.completedSessions}/{claim.totalSessions}
                      </td>
                      <td className="px-4 py-5 text-sm font-bold" style={{ color: '#001b3f' }}>
                        KES {getMentorCourseClaimAmount(claim).toLocaleString()}
                      </td>
                      <td className="px-4 py-5 text-sm" style={{ color: '#001b3f' }}>
                        {format(new Date(claim.submittedAt), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-4 py-5">
                        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${getClaimStatusPillClass(claim)}`}>
                          {getAdminStatusLabel(claim)}
                        </span>
                      </td>
                      <td className="px-4 py-5 text-right">
                        <button
                          type="button"
                          onClick={() => openAdminClaim(claim.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 hover:bg-blue-100"
                          style={{ color: '#25476a' }}
                          aria-label={`View more for ${claim.courseName}`}
                        >
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (activePage === 'payment') {
    return (
      <div className="min-h-screen w-full min-w-0 bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
        <div className="w-full min-w-0 max-w-5xl mx-auto">
          <div className="mb-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSelectedClaimId(null);
                setActivePage(selectedClaimId ? 'claims' : 'dashboard');
              }}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
              style={{ color: '#25476a' }}
              aria-label="Back to Dashboard"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-0" style={{ color: '#25476a' }}>
                {selectedClaimId ? 'Pay Mentor Claim' : 'Make Payment'}
              </h1>
              <p className="text-gray-600">
                {selectedClaimId ? 'Send an approved mentor payout and mark the claim as paid.' : 'Complete a course payment and send it back to the dashboard records.'}
              </p>
            </div>
          </div>

          <form onSubmit={handlePaymentSubmit} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 sm:p-6" style={{ background: 'linear-gradient(135deg, #25476a 0%, #38aae1 100%)' }}>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                {selectedClaimId ? 'Mentor Payout Details' : 'Payment Details'}
              </h2>
              <p className="text-sm sm:text-base text-white/90 mt-1">
                {selectedClaimId ? 'Confirm the approved claim and choose how the mentor will be paid.' : 'Record learner, course, amount, and method for this payment.'}
              </p>
            </div>

            <div className="p-4 sm:p-6">
              {selectedClaim ? (
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-6">
                  <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Approved Claim #{selectedClaim.id}</p>
                      <h3 className="mt-1 text-xl font-bold" style={{ color: '#25476a' }}>{selectedClaim.mentor}</h3>
                      <p className="text-sm text-gray-600">{selectedClaim.claimMonth} monthly claim submitted {format(new Date(selectedClaim.submittedAt), 'MMM dd, yyyy')}</p>
                    </div>
                    <span className="inline-flex w-fit items-center gap-1 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      <CheckCircle size={14} />
                      Approved
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Learner</p>
                      <p className="mt-1 font-semibold" style={{ color: '#25476a' }}>{selectedClaim.learner}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Course Sessions</p>
                      <p className="mt-1 font-semibold" style={{ color: '#25476a' }}>{selectedClaim.completedSessions}/{selectedClaim.totalSessions} completed</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Module</p>
                      <p className="mt-1 font-semibold" style={{ color: '#25476a' }}>
                        {selectedClaim.module === 'physical' ? 'Physical Location' : selectedClaim.module === 'home' ? 'Home Location' : 'Online Course'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Payout Amount</p>
                      <p className="mt-1 text-lg font-bold" style={{ color: '#feb139' }}>
                        KSh {getMentorCourseClaimAmount(selectedClaim).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Course / Description</p>
                      <p className="mt-1 font-semibold" style={{ color: '#25476a' }}>{selectedClaim.courseName}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Location</p>
                      <p className="mt-1 font-semibold" style={{ color: '#25476a' }}>
                        {selectedClaim.module === 'physical' ? selectedClaim.courseSessions[0]?.location || 'Physical location' : 'Not applicable'}
                      </p>
                    </div>
                  </div>

                  {selectedClaim.notes && (
                    <div className="mt-4 rounded-md bg-white p-3 text-sm text-gray-600">
                      {selectedClaim.notes}
                    </div>
                  )}
                </div>
              ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>
                    <User size={14} style={{ color: '#38aae1' }} />
                    Learner Name
                  </span>
                  <input
                    type="text"
                    required
                    value={paymentForm.learner}
                    onChange={(event) => updatePaymentForm('learner', event.target.value)}
                    placeholder="e.g. John Kamau"
                    className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                    style={{ color: '#25476a' }}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>
                    <User size={14} style={{ color: '#38aae1' }} />
                    Mentor Name
                  </span>
                  <input
                    type="text"
                    required
                    value={paymentForm.mentor}
                    onChange={(event) => updatePaymentForm('mentor', event.target.value)}
                    placeholder="e.g. Brian Otieno"
                    className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                    style={{ color: '#25476a' }}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>
                    <Calendar size={14} style={{ color: '#38aae1' }} />
                    Payment Date
                  </span>
                  <input
                    type="date"
                    required
                    value={paymentForm.date}
                    onChange={(event) => updatePaymentForm('date', event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                    style={{ color: '#25476a' }}
                  />
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>
                    <BookOpen size={14} style={{ color: '#38aae1' }} />
                    Module
                  </span>
                  <select
                    value={paymentForm.module}
                    onChange={(event) => updatePaymentForm('module', event.target.value as ModuleType)}
                    className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                    style={{ color: '#25476a' }}
                  >
                    <option value="physical">Physical Location</option>
                    <option value="home">Home Location</option>
                    <option value="online">Online Sessions</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>
                    <BookOpen size={14} style={{ color: '#38aae1' }} />
                    Course / Description
                  </span>
                  <select
                    required
                    value={paymentForm.description}
                    onChange={(event) => updatePaymentForm('description', event.target.value)}
                    className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                    style={{ color: '#25476a' }}
                  >
                    <option value="">Select a course</option>
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>{course}</option>
                    ))}
                  </select>
                </label>

                {paymentForm.module === 'physical' && (
                  <label className="block">
                    <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>
                      <MapPin size={14} style={{ color: '#38aae1' }} />
                      Location
                    </span>
                    <select
                      required
                      value={paymentForm.location}
                      onChange={(event) => updatePaymentForm('location', event.target.value)}
                      className="w-full rounded-md border border-gray-200 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                      style={{ color: '#25476a' }}
                    >
                      {locationOptions.map((location) => (
                        <option key={location} value={location}>{location}</option>
                      ))}
                    </select>
                  </label>
                )}

                <label className="block">
                  <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>
                    KSh
                    Amount
                  </span>
                  <input
                    type="number"
                    min="1"
                    required
                    value={paymentForm.amount}
                    onChange={(event) => updatePaymentForm('amount', event.target.value)}
                    className="w-full rounded-md border border-gray-200 px-4 py-3 text-sm font-semibold shadow-sm focus:outline-none focus:ring-2"
                    style={{ color: '#25476a' }}
                  />
                </label>
              </div>
              )}

              <div className="mt-5">
                <p className="mb-3 text-xs font-bold uppercase tracking-wide" style={{ color: '#25476a' }}>Payment Method</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {paymentMethods.map(({ name, icon: MethodIcon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => updatePaymentForm('paymentMethod', name)}
                      className={`rounded-lg border p-4 text-center text-sm font-semibold shadow-sm transition-all focus:outline-none focus:ring-2 ${
                        paymentForm.paymentMethod === name ? 'border-transparent text-white' : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                      style={paymentForm.paymentMethod === name ? { backgroundColor: '#25476a' } : { color: '#25476a' }}
                      aria-pressed={paymentForm.paymentMethod === name}
                    >
                      <span className={`mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-lg ${paymentForm.paymentMethod === name ? 'bg-white/20' : 'bg-gray-100'}`}>
                        <MethodIcon size={20} />
                      </span>
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {paymentForm.paymentMethod === 'MPESA' && (
                <div className="mt-4 rounded-lg border-2 p-4 sm:p-6" style={{ borderColor: '#38aae1', background: 'linear-gradient(135deg, #f2fbff 0%, #ffffff 100%)' }}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg text-white" style={{ backgroundColor: '#38aae1' }}>
                      <Smartphone size={22} />
                    </span>
                    <h3 className="text-lg font-bold" style={{ color: '#25476a' }}>MPESA Payment Details</h3>
                  </div>
                  <label className="block">
                    <span className="mb-2 block text-sm font-semibold" style={{ color: '#25476a' }}>Phone Number</span>
                    <input
                      type="tel"
                      required
                      value={paymentForm.mpesaPhone}
                      onChange={(event) => updatePaymentForm('mpesaPhone', event.target.value)}
                      placeholder="0712345678"
                      className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                      style={{ color: '#25476a' }}
                    />
                  </label>
                  <div className="mt-3 rounded-md px-4 py-3 text-sm font-semibold" style={{ backgroundColor: '#e5f6ff', color: '#25476a' }}>
                    You will receive an MPESA prompt on this number
                  </div>
                </div>
              )}

              {paymentForm.paymentMethod === 'Bank Transfer' && (
                <div className="mt-4 rounded-lg border-2 p-4 sm:p-6" style={{ borderColor: '#25476a', background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)' }}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg text-white" style={{ backgroundColor: '#25476a' }}>
                      <Building2 size={22} />
                    </span>
                    <h3 className="text-lg font-bold" style={{ color: '#25476a' }}>Bank Transfer Details</h3>
                  </div>
                  <div className="grid gap-4">
                    <div>
                      <span className="mb-2 block text-sm font-semibold" style={{ color: '#25476a' }}>Shared Bank</span>
                      <div className="rounded-md border border-gray-300 bg-gray-50 px-4 py-3 text-sm font-semibold" style={{ color: '#25476a' }}>
                        {SHARED_BANK_NAME}
                      </div>
                    </div>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold" style={{ color: '#25476a' }}>Account Number</span>
                      <input
                        type="text"
                        required
                        value={paymentForm.bankAccountNumber}
                        onChange={(event) => updatePaymentForm('bankAccountNumber', event.target.value)}
                        placeholder="Enter your account number"
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                        style={{ color: '#25476a' }}
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-semibold" style={{ color: '#25476a' }}>Account Name</span>
                      <input
                        type="text"
                        required
                        value={paymentForm.bankAccountName}
                        onChange={(event) => updatePaymentForm('bankAccountName', event.target.value)}
                        placeholder="Name as it appears on account"
                        className="w-full rounded-md border border-gray-300 px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2"
                        style={{ color: '#25476a' }}
                      />
                    </label>
                  </div>
                  <div className="mt-4 rounded-md px-4 py-3 text-sm font-semibold" style={{ backgroundColor: '#e5e9ee', color: '#25476a' }}>
                    Transfer will be initiated from your account. Please ensure you have sufficient funds.
                  </div>
                </div>
              )}

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClaimId(null);
                    setActivePage(selectedClaimId ? 'claims' : 'dashboard');
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-5 py-3 font-semibold shadow-sm transition-colors hover:bg-gray-50"
                  style={{ color: '#25476a' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-md px-5 py-3 font-semibold text-white shadow-md transition-colors hover:brightness-95"
                  style={{ backgroundColor: '#feb139' }}
                >
                  <Plus size={18} />
                  {selectedClaimId ? 'Pay Mentor' : 'Complete Payment'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="w-full min-w-0 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#25476a' }}>Payment Tracking Dashboard</h1>
            <p className="text-gray-600">Track earnings across Physical, Home, and Online sessions</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {paymentSaved && (
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-green-100 px-3 py-2 text-sm font-semibold text-green-700">
                <CheckCircle size={16} />
                Payment added
              </span>
            )}
            {/* Supervisor Review button removed per request */}
            <button
              type="button"
              onClick={() => setActivePage('claims')}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-5 py-3 font-semibold shadow-sm transition-colors hover:bg-gray-50"
              style={{ color: '#25476a' }}
            >
              <ClipboardList size={18} />
              Approved Claims
            </button>
          </div>
        </div>

        {/* Dashboard Summary */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8" style={{ borderTop: '4px solid #25476a' }}>
          <h2 className="text-xl font-semibold mb-4" style={{ color: '#25476a' }}>Overall Earnings Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#25476a' }}>KSh {totalEarnings.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Physical Location</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#38aae1' }}>KSh {physicalEarnings.total.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{physicalEarnings.sessionCount} sessions</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Home Location</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#38aae1' }}>KSh {homeEarnings.total.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{homeEarnings.sessionCount} sessions</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">Online Sessions</p>
              <p className="text-xl sm:text-2xl font-bold" style={{ color: '#38aae1' }}>KSh {onlineEarnings.total.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{onlineEarnings.sessionCount} sessions</p>
            </div>
          </div>
        </div>

        {/* Module Cards */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#25476a' }}>Select Payment Module</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {/* Physical Location Card */}
            <button
              onClick={() => setSelectedModule('physical')}
              className={`p-4 sm:p-6 rounded-lg text-left transition-all ${
                selectedModule === 'physical'
                  ? 'shadow-xl ring-2 ring-offset-2'
                  : 'bg-white shadow-md hover:shadow-lg'
              }`}
              style={selectedModule === 'physical' ? { backgroundColor: '#25476a', color: 'white', ringColor: '#25476a' } : {}}
            >
              <h3 className={`text-xl font-bold mb-3 ${selectedModule === 'physical' ? 'text-white' : ''}`} style={selectedModule !== 'physical' ? { color: '#25476a' } : {}}>
                Physical Location
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${selectedModule === 'physical' ? 'text-gray-200' : 'text-gray-600'}`}>Mentor</span>
                  <span className="font-semibold">KSh {physicalEarnings.mentorEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${selectedModule === 'physical' ? 'text-gray-200' : 'text-gray-600'}`}>Digifunzi</span>
                  <span className="font-semibold">KSh {physicalEarnings.digifunziEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${selectedModule === 'physical' ? 'text-gray-200' : 'text-gray-600'}`}>Location</span>
                  <span className="font-semibold">KSh {physicalEarnings.locationEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t" style={selectedModule === 'physical' ? { borderColor: 'rgba(255,255,255,0.3)' } : {}}>
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">KSh {physicalEarnings.total.toLocaleString()}</span>
                </div>
                <p className={`text-xs mt-2 ${selectedModule === 'physical' ? 'text-gray-300' : 'text-gray-500'}`}>
                  {physicalEarnings.sessionCount} sessions
                </p>
              </div>
            </button>

            {/* Home Location Card */}
            <button
              onClick={() => setSelectedModule('home')}
              className={`p-4 sm:p-6 rounded-lg text-left transition-all ${
                selectedModule === 'home'
                  ? 'shadow-xl ring-2 ring-offset-2'
                  : 'bg-white shadow-md hover:shadow-lg'
              }`}
              style={selectedModule === 'home' ? { backgroundColor: '#38aae1', color: 'white', ringColor: '#38aae1' } : {}}
            >
              <h3 className={`text-xl font-bold mb-3 ${selectedModule === 'home' ? 'text-white' : ''}`} style={selectedModule !== 'home' ? { color: '#25476a' } : {}}>
                Home Location
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${selectedModule === 'home' ? 'text-gray-200' : 'text-gray-600'}`}>Mentor</span>
                  <span className="font-semibold">KSh {homeEarnings.mentorEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${selectedModule === 'home' ? 'text-gray-200' : 'text-gray-600'}`}>Digifunzi</span>
                  <span className="font-semibold">KSh {homeEarnings.digifunziEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t" style={selectedModule === 'home' ? { borderColor: 'rgba(255,255,255,0.3)' } : {}}>
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">KSh {homeEarnings.total.toLocaleString()}</span>
                </div>
                <p className={`text-xs mt-2 ${selectedModule === 'home' ? 'text-gray-300' : 'text-gray-500'}`}>
                  {homeEarnings.sessionCount} sessions
                </p>
              </div>
            </button>

            {/* Online Sessions Card */}
            <button
              onClick={() => setSelectedModule('online')}
              className={`p-4 sm:p-6 rounded-lg text-left transition-all ${
                selectedModule === 'online'
                  ? 'shadow-xl ring-2 ring-offset-2'
                  : 'bg-white shadow-md hover:shadow-lg'
              }`}
              style={selectedModule === 'online' ? { backgroundColor: '#feb139', color: 'white', ringColor: '#feb139' } : {}}
            >
              <h3 className={`text-xl font-bold mb-3 ${selectedModule === 'online' ? 'text-white' : ''}`} style={selectedModule !== 'online' ? { color: '#25476a' } : {}}>
                Online Sessions
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className={`text-sm ${selectedModule === 'online' ? 'text-gray-200' : 'text-gray-600'}`}>Mentor</span>
                  <span className="font-semibold">KSh {onlineEarnings.mentorEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`text-sm ${selectedModule === 'online' ? 'text-gray-200' : 'text-gray-600'}`}>Digifunzi</span>
                  <span className="font-semibold">KSh {onlineEarnings.digifunziEarnings.toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t" style={selectedModule === 'online' ? { borderColor: 'rgba(255,255,255,0.3)' } : {}}>
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-lg">KSh {onlineEarnings.total.toLocaleString()}</span>
                </div>
                <p className={`text-xs mt-2 ${selectedModule === 'online' ? 'text-gray-300' : 'text-gray-500'}`}>
                  {onlineEarnings.sessionCount} sessions
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Session Details Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden min-w-0">
          <div className="p-4 sm:p-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between" style={{ backgroundColor: '#25476a' }}>
            <h2 className="text-xl font-semibold text-white">
              {selectedModule === 'physical' ? 'Physical Location' : selectedModule === 'home' ? 'Home Locations' : 'Online Sessions'}
            </h2>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search mentor or learner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-white/30 rounded-md focus:outline-none focus:ring-2 focus:ring-white"
              />
            </div>
          </div>

          {filteredClaimRows.length > 0 ? (
            <>
            <div className="block md:hidden divide-y divide-gray-200">
              {filteredClaimRows.map((claim) => (
                <div key={claim.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMentor(claim.mentor)}
                      className="text-left font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm"
                      style={{ color: '#25476a' }}
                      aria-label={`View details for ${claim.mentor}`}
                    >
                      {claim.mentor}
                    </button>
                    {claim.status === 'paid' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={14} />
                        Paid
                      </span>
                    ) : claim.supervisorStatus === 'moved_to_finance' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                        <Clock size={14} />
                        Ready to Pay
                      </span>
                    ) : claim.supervisorStatus === 'rejected' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                        <AlertCircle size={14} />
                        Rejected
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <Clock size={14} />
                        {getSupervisorStatusLabel(claim.supervisorStatus)}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm" style={{ color: '#25476a' }}>
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-gray-400" />
                      <span>{claim.claimMonth}</span>
                    </div>
                    {selectedModule === 'physical' && (
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-gray-400" />
                        <span>{claim.courseSessions[0]?.location || 'Physical location'}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-gray-400" />
                      <span>{claim.learner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={15} className="text-gray-400" />
                      <span>{claim.courseName}</span>
                    </div>
                    <span>{claim.completedSessions}/{claim.totalSessions} sessions claimed</span>
                  </div>
                  <p className="mt-3 font-bold" style={{ color: '#feb139' }}>
                    KSh {getMentorCourseClaimAmount(claim).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead style={{ backgroundColor: '#ffffff' }}>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>
                      <div className="flex items-center gap-2">
                        <User size={16} style={{ color: '#38aae1' }} />
                        Mentor
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>
                      <div className="flex items-center gap-2">
                        <Calendar size={16} style={{ color: '#38aae1' }} />
                        Claim Month
                      </div>
                    </th>
                    {selectedModule === 'physical' && (
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} style={{ color: '#38aae1' }} />
                          Location
                        </div>
                      </th>
                    )}
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Learner</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Claimed Sessions</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} style={{ color: '#38aae1' }} />
                        Description
                      </div>
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Earnings</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClaimRows.map((claim) => (
                    <tr key={claim.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} style={{ color: '#38aae1' }} />
                          <button
                            type="button"
                            onClick={() => setSelectedMentor(claim.mentor)}
                            className="font-medium hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm px-1"
                            style={{ color: '#25476a' }}
                            aria-label={`View details for ${claim.mentor}`}
                          >
                            {claim.mentor}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm" style={{ color: '#25476a' }}>{claim.claimMonth}</span>
                        </div>
                      </td>
                      {selectedModule === 'physical' && (
                        <td className="px-6 py-4">
                          <span className="text-sm" style={{ color: '#25476a' }}>{claim.courseSessions[0]?.location || 'Physical location'}</span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="text-sm" style={{ color: '#25476a' }}>{claim.learner}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold" style={{ color: '#25476a' }}>
                          {claim.completedSessions}/{claim.totalSessions}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-gray-400" />
                          <span className="text-sm" style={{ color: '#25476a' }}>{claim.courseName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold" style={{ color: '#feb139' }}>
                          KSh {getMentorCourseClaimAmount(claim).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {claim.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle size={14} />
                            Paid
                          </span>
                        ) : claim.supervisorStatus === 'moved_to_finance' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <Clock size={14} />
                            Ready to Pay
                          </span>
                        ) : claim.supervisorStatus === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                            <AlertCircle size={14} />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <Clock size={14} />
                            {getSupervisorStatusLabel(claim.supervisorStatus)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          ) : (
            <div className="p-8 sm:p-12 text-center">
              <p className="text-gray-500">No claims found matching your search criteria.</p>
            </div>
          )}

        </div>

        {/* Mentor Details Modal */}
        <Dialog.Root open={selectedMentor !== null} onOpenChange={(open) => !open && setSelectedMentor(null)}>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
            <Dialog.Content className="fixed top-1/2 left-1/2 z-50 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl max-w-4xl w-[calc(100vw-1rem)] sm:w-[calc(100vw-2rem)] max-h-[90vh] overflow-hidden">
              {selectedMentor && (() => {
                const mentorDetails = getMentorDetails(selectedMentor);
                return (
                  <>
                    {/* Modal Header */}
                    <div className="p-4 sm:p-6 flex justify-between items-start gap-4" style={{ backgroundColor: '#25476a' }}>
                      <div>
                        <Dialog.Title className="text-xl sm:text-2xl font-bold text-white">
                          {mentorDetails.name}
                        </Dialog.Title>
                        <Dialog.Description className="text-gray-200 mt-1">
                          Monthly Claim Overview
                        </Dialog.Description>
                      </div>
                      <Dialog.Close className="text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded-sm">
                        <X size={24} />
                      </Dialog.Close>
                    </div>

                    {/* Modal Body */}
                    <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0f4f8' }}>
                          <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
                          <p className="text-2xl font-bold" style={{ color: '#25476a' }}>{mentorDetails.totalSessions}</p>
                        </div>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#f0f4f8' }}>
                          <p className="text-sm text-gray-600 mb-1">Total Earnings</p>
                          <p className="text-2xl font-bold" style={{ color: '#38aae1' }}>KSh {mentorDetails.totalEarnings.toLocaleString()}</p>
                        </div>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#e8f5e9' }}>
                          <p className="text-sm text-gray-600 mb-1">Paid Sessions</p>
                          <p className="text-2xl font-bold text-green-700">{mentorDetails.paidSessions}</p>
                        </div>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#fff3e0' }}>
                          <p className="text-sm text-gray-600 mb-1">Unpaid Sessions</p>
                          <p className="text-2xl font-bold text-orange-700">{mentorDetails.pendingSessions}</p>
                        </div>
                      </div>

                      {/* Earnings by Module */}
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold mb-3" style={{ color: '#25476a' }}>Earnings by Module</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#25476a' }}>
                            <p className="text-sm text-gray-600 mb-1">Physical Location</p>
                            <p className="text-xl font-bold" style={{ color: '#25476a' }}>KSh {mentorDetails.physicalEarnings.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{mentorDetails.physicalSessions} claimed sessions</p>
                          </div>
                          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#38aae1' }}>
                            <p className="text-sm text-gray-600 mb-1">Home Location</p>
                            <p className="text-xl font-bold" style={{ color: '#38aae1' }}>KSh {mentorDetails.homeEarnings.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{mentorDetails.homeSessions} claimed sessions</p>
                          </div>
                          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#feb139' }}>
                            <p className="text-sm text-gray-600 mb-1">Online Sessions</p>
                            <p className="text-xl font-bold" style={{ color: '#feb139' }}>KSh {mentorDetails.onlineEarnings.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{mentorDetails.onlineSessions} claimed sessions</p>
                          </div>
                        </div>
                      </div>

                      {/* All Claims List */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: '#25476a' }}>All Monthly Claims</h3>
                        <div className="border border-gray-200 rounded-lg overflow-x-auto">
                          <table className="w-full">
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Claim Month</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Module</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Location</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Learner</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Course</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Sessions</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Earnings</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {mentorDetails.allClaims.map((claim) => (
                                <tr key={claim.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>
                                    {claim.claimMonth}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                                      style={{
                                        backgroundColor: claim.module === 'physical' ? '#25476a' :
                                                        claim.module === 'home' ? '#38aae1' : '#feb139'
                                      }}
                                    >
                                      {claim.module === 'physical' ? 'Physical' : claim.module === 'home' ? 'Home' : 'Online'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>
                                    {claim.module === 'physical' ? claim.courseSessions[0]?.location || 'Physical location' : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>{claim.learner}</td>
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>{claim.courseName}</td>
                                  <td className="px-4 py-3 text-sm font-semibold" style={{ color: '#25476a' }}>{claim.completedSessions}/{claim.totalSessions}</td>
                                  <td className="px-4 py-3 text-sm font-bold" style={{ color: '#feb139' }}>
                                    KSh {getMentorCourseClaimAmount(claim).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {claim.status === 'paid' ? (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <CheckCircle size={12} />
                                        Paid
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                        <Clock size={12} />
                                        Pending
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </div>
  );
}
