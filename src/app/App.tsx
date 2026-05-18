import { useState, useMemo } from 'react';
import { Search, Calendar, MapPin, User, BookOpen, CheckCircle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';

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

// Mock data for sessions
const mockSessions = [
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

export default function App() {
  const [selectedModule, setSelectedModule] = useState('physical');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);

  // Filter sessions by selected module and search query
  const filteredSessions = useMemo(() => {
    return mockSessions.filter(session => {
      const matchesModule = session.module === selectedModule;
      const matchesSearch = searchQuery === '' ||
        session.mentor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.learner.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesModule && matchesSearch;
    });
  }, [selectedModule, searchQuery]);

  // Calculate earnings for each module
  const calculateModuleEarnings = (module: string) => {
    const sessions = mockSessions.filter(s => s.module === module);
    const sessionCount = sessions.length;

    let mentorEarnings = 0;
    if (module === 'physical' || module === 'home') {
      mentorEarnings = sessionCount * RATES.mentor.physical;
    } else {
      mentorEarnings = sessionCount * RATES.mentor.online;
    }

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

  const mentorStats = calculateMentorStats();

  const getMentorSessionEarnings = (module: string) => (
    module === 'online' ? RATES.mentor.online : RATES.mentor.physical
  );

  // Get all sessions for the selected mentor across all modules
  const getMentorDetails = (mentorName: string) => {
    const allMentorSessions = mockSessions.filter(s => s.mentor === mentorName);
    const physicalSessions = allMentorSessions.filter(s => s.module === 'physical');
    const homeSessions = allMentorSessions.filter(s => s.module === 'home');
    const onlineSessions = allMentorSessions.filter(s => s.module === 'online');

    const physicalEarnings = physicalSessions.length * RATES.mentor.physical;
    const homeEarnings = homeSessions.length * RATES.mentor.home;
    const onlineEarnings = onlineSessions.length * RATES.mentor.online;
    const totalEarnings = physicalEarnings + homeEarnings + onlineEarnings;

    const paidSessions = allMentorSessions.filter(s => s.status === 'paid').length;
    const pendingSessions = allMentorSessions.filter(s => s.status === 'pending').length;

    return {
      name: mentorName,
      allSessions: allMentorSessions,
      physicalSessions,
      homeSessions,
      onlineSessions,
      physicalEarnings,
      homeEarnings,
      onlineEarnings,
      totalEarnings,
      totalSessions: allMentorSessions.length,
      paidSessions,
      pendingSessions,
    };
  };

  return (
    <div className="w-full min-w-0 bg-gray-50 px-4 py-4 sm:px-6 lg:px-8">
      <div className="w-full min-w-0 max-w-screen-2xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2" style={{ color: '#25476a' }}>Payment Tracking Dashboard</h1>
          <p className="text-gray-600">Track earnings across Physical, Home, and Online sessions</p>
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

          {filteredSessions.length > 0 ? (
            <>
            <div className="block md:hidden divide-y divide-gray-200">
              {filteredSessions.map((session) => (
                <div key={session.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedMentor(session.mentor)}
                      className="text-left font-semibold hover:underline focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm"
                      style={{ color: '#25476a' }}
                      aria-label={`View details for ${session.mentor}`}
                    >
                      {session.mentor}
                    </button>
                    {session.status === 'paid' ? (
                      <span className="inline-flex shrink-0 items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                        <CheckCircle size={14} />
                        Paid
                      </span>
                    ) : (
                      <span className="inline-flex shrink-0 items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                        <Clock size={14} />
                        Pending
                      </span>
                    )}
                  </div>
                  <div className="mt-3 grid gap-2 text-sm" style={{ color: '#25476a' }}>
                    <div className="flex items-center gap-2">
                      <Calendar size={15} className="text-gray-400" />
                      <span>{format(new Date(session.date), 'MMM dd, yyyy')}</span>
                    </div>
                    {selectedModule === 'physical' && (
                      <div className="flex items-center gap-2">
                        <MapPin size={15} className="text-gray-400" />
                        <span>{session.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <User size={15} className="text-gray-400" />
                      <span>{session.learner}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen size={15} className="text-gray-400" />
                      <span>{session.description}</span>
                    </div>
                  </div>
                  <p className="mt-3 font-bold" style={{ color: '#feb139' }}>
                    KSh {getMentorSessionEarnings(selectedModule).toLocaleString()}
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
                        Date
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
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User size={16} style={{ color: '#38aae1' }} />
                          <button
                            type="button"
                            onClick={() => setSelectedMentor(session.mentor)}
                            className="font-medium hover:underline cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-sm px-1"
                            style={{ color: '#25476a' }}
                            aria-label={`View details for ${session.mentor}`}
                          >
                            {session.mentor}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} className="text-gray-400" />
                          <span className="text-sm" style={{ color: '#25476a' }}>{format(new Date(session.date), 'MMM dd, yyyy')}</span>
                        </div>
                      </td>
                      {selectedModule === 'physical' && (
                        <td className="px-6 py-4">
                          <span className="text-sm" style={{ color: '#25476a' }}>{session.location}</span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className="text-sm" style={{ color: '#25476a' }}>{session.learner}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <BookOpen size={16} className="text-gray-400" />
                          <span className="text-sm" style={{ color: '#25476a' }}>{session.description}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold" style={{ color: '#feb139' }}>
                          KSh {getMentorSessionEarnings(selectedModule).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {session.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle size={14} />
                            Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                            <Clock size={14} />
                            Pending
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
              <p className="text-gray-500">No sessions found matching your search criteria.</p>
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
                          Complete Session Overview
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
                          <p className="text-sm text-gray-600 mb-1">Paid</p>
                          <p className="text-2xl font-bold text-green-700">{mentorDetails.paidSessions}</p>
                        </div>
                        <div className="p-4 rounded-lg" style={{ backgroundColor: '#fff3e0' }}>
                          <p className="text-sm text-gray-600 mb-1">Pending</p>
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
                            <p className="text-xs text-gray-500 mt-1">{mentorDetails.physicalSessions.length} sessions</p>
                          </div>
                          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#38aae1' }}>
                            <p className="text-sm text-gray-600 mb-1">Home Location</p>
                            <p className="text-xl font-bold" style={{ color: '#38aae1' }}>KSh {mentorDetails.homeEarnings.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{mentorDetails.homeSessions.length} sessions</p>
                          </div>
                          <div className="p-4 rounded-lg border-2" style={{ borderColor: '#feb139' }}>
                            <p className="text-sm text-gray-600 mb-1">Online Sessions</p>
                            <p className="text-xl font-bold" style={{ color: '#feb139' }}>KSh {mentorDetails.onlineEarnings.toLocaleString()}</p>
                            <p className="text-xs text-gray-500 mt-1">{mentorDetails.onlineSessions.length} sessions</p>
                          </div>
                        </div>
                      </div>

                      {/* All Sessions List */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3" style={{ color: '#25476a' }}>All Sessions</h3>
                        <div className="border border-gray-200 rounded-lg overflow-x-auto">
                          <table className="w-full">
                            <thead style={{ backgroundColor: '#f8fafc' }}>
                              <tr>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Date</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Module</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Location</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Learner</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Description</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Earnings</th>
                                <th className="px-4 py-3 text-left text-sm font-semibold" style={{ color: '#25476a' }}>Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {mentorDetails.allSessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((session) => (
                                <tr key={session.id} className="hover:bg-gray-50">
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>
                                    {format(new Date(session.date), 'MMM dd, yyyy')}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className="inline-block px-2 py-1 rounded text-xs font-medium text-white"
                                      style={{
                                        backgroundColor: session.module === 'physical' ? '#25476a' :
                                                        session.module === 'home' ? '#38aae1' : '#feb139'
                                      }}
                                    >
                                      {session.module === 'physical' ? 'Physical' : session.module === 'home' ? 'Home' : 'Online'}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>
                                    {session.module === 'physical' ? session.location : '-'}
                                  </td>
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>{session.learner}</td>
                                  <td className="px-4 py-3 text-sm" style={{ color: '#25476a' }}>{session.description}</td>
                                  <td className="px-4 py-3 text-sm font-bold" style={{ color: '#feb139' }}>
                                    KSh {getMentorSessionEarnings(session.module).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    {session.status === 'paid' ? (
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
