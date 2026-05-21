'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  SunIcon,
  MoonIcon,
  EyeIcon,
  EyeSlashIcon,
  BoltIcon,
  ChartBarIcon,
  ArrowPathIcon,
  SparklesIcon,
  ClockIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { sentences } from '../constants/sentences';

const CLASSES = [
  { id: 'ey-jupiter', name: 'EY Jupiter' },
  { id: 'ey-venus', name: 'EY Venus' },
  { id: 'ey-mercury', name: 'EY Mercury' },
  { id: 'ey-neptune', name: 'EY Neptune' },
];

export default function TeacherDashboardContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [selectedClass, setSelectedClass] = useState('ey-jupiter');
  const [students, setStudents] = useState([]);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isTabActive, setIsTabActive] = useState(true);
  const [lastActivityTime, setLastActivityTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('students'); // 'students' or 'typing'
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    completedTests: 0,
  });

  // Get user from localStorage (set during login)
  useEffect(() => {
    const authUser = localStorage.getItem('authUser');
    if (authUser) {
      try {
        const userData = JSON.parse(authUser);
        console.log('✅ [TEACHER] User data from localStorage:', userData.email);
        setUser(userData);

        // Redirect non-teachers
        if (userData.role !== 'teacher') {
          console.log('🔄 [TEACHER] Non-teacher redirecting to /dashboard');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('❌ [TEACHER] Failed to parse user data:', error);
        router.push('/auth/login');
        return;
      }
    } else {
      console.log('❌ [TEACHER] No user in localStorage, redirecting to login');
      router.push('/auth/login');
      return;
    }
    setLoading(false);
  }, [router]);
  
  // Typing test states
  const [typingStats, setTypingStats] = useState({
    wpm: 0,
    accuracy: 100,
    testsDone: 0,
    avgWpm: 0,
    bestWpm: 0,
    bestAccuracy: 100,
  });
  const [currentSentence, setCurrentSentence] = useState('');
  const [userInput, setUserInput] = useState('');
  const [testActive, setTestActive] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timerActive, setTimerActive] = useState(false);
  
  // Refs for typing test
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const totalCharsTypedRef = useRef(0);
  const correctCharsRef = useRef(0);
  const inputRef = useRef(null);

  // Initialize dark mode from localStorage
  useEffect(() => {
    setMounted(true);
    const isDark = localStorage.getItem('teacher-darkMode') === 'true';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  // Update dark mode
  useEffect(() => {
    if (mounted) {
      if (darkMode) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('teacher-darkMode', 'true');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('teacher-darkMode', 'false');
      }
    }
  }, [darkMode, mounted]);

  // Track tab visibility changes
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isActive = !document.hidden;
      setIsTabActive(isActive);
      setLastActivityTime(new Date());
      
      console.log(`Teacher tab is now ${isActive ? 'ACTIVE' : 'HIDDEN'}`);
      
      // Log when teacher switches tabs
      if (user?.id) {
        fetch('/api/student/activity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user.id,
            isActive: isActive,
            timestamp: new Date().toISOString(),
            userRole: 'teacher'
          })
        }).catch(err => console.error('Activity tracking error:', err));
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  // Fetch data when user is loaded
  useEffect(() => {
    if (user && selectedClass) {
      fetchClassStudents();
    }
  }, [selectedClass]);

  const fetchClassStudents = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching class:', selectedClass);
      const response = await fetch(`/api/teacher/class/${selectedClass}?email=${encodeURIComponent(user?.email)}`);
      
      if (!response.ok) {
        let errorMessage = 'Failed to fetch students';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          if (errorData.received) {
            errorMessage += ` (received: "${errorData.received}", available: ${JSON.stringify(errorData.available)})`;
          }
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        setError(errorMessage);
        setStudents([]);
        console.error('API Error:', errorMessage);
        return;
      }

      const data = await response.json();
      setStudents(data.students || []);
      setStats({
        totalStudents: data.totalStudents || 0,
        activeStudents: data.activeStudents || 0,
        completedTests: data.completedTests || 0,
      });
    } catch (error) {
      console.error('Error fetching class data:', error);
      setError(error.message || 'An unexpected error occurred');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  // Load teacher's typing stats from database
  useEffect(() => {
    if (user?.id) {
      loadTeacherTypingStats();
    }
  }, [user?.id]);

  const loadTeacherTypingStats = async () => {
    try {
      const response = await fetch(`/api/scores?userId=${user.id}&userRole=teacher`);
      
      if (!response.ok) {
        console.warn('Failed to load typing stats');
        return;
      }

      const data = await response.json();
      const scores = Array.isArray(data.scores) ? data.scores : [];
      
      if (scores.length === 0) {
        // No scores yet, keep default stats
        return;
      }

      // Calculate stats from scores
      const bestWpm = Math.max(...scores.map(s => s.wpm || 0), 0);
      const bestAccuracy = Math.max(...scores.map(s => s.accuracy || 0), 0);
      const avgWpm = Math.round(scores.reduce((sum, s) => sum + (s.wpm || 0), 0) / scores.length);
      const testsDone = scores.length;

      setTypingStats({
        wpm: scores[scores.length - 1]?.wpm || 0,
        accuracy: scores[scores.length - 1]?.accuracy || 100,
        testsDone,
        avgWpm,
        bestWpm,
        bestAccuracy,
      });
    } catch (error) {
      console.error('Error loading typing stats:', error);
    }
  };

  const handleLogout = async () => {
    // Clear all auth-related localStorage items
    localStorage.removeItem('authUser');
    localStorage.removeItem('theme');
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('auth') || key.startsWith('token') || key.startsWith('session')) {
        localStorage.removeItem(key);
      }
    });
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Typing test methods with real-time updates
  const startTypingTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    
    const randomSentence = sentences[Math.floor(Math.random() * sentences.length)];
    setCurrentSentence(randomSentence);
    setUserInput('');
    setTestActive(true);
    setTimerActive(false);
    setTimeLeft(30);
    setTestResults(null);
    
    totalCharsTypedRef.current = 0;
    correctCharsRef.current = 0;
    startTimeRef.current = null;
    
    setTimeout(() => {
      if (inputRef.current) inputRef.current.focus();
    }, 0);
  };

  const startTimer = () => {
    if (!timerActive) {
      setTimerActive(true);
      startTimeRef.current = Date.now();
      
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            endTypingTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const endTypingTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setTestActive(false);

    const timeElapsed = startTimeRef.current 
      ? (Date.now() - startTimeRef.current) / 1000 
      : 0;
    const timeInMinutes = Math.max(timeElapsed / 60, 0.016);
    
    // Get the actual current input length (not stale state)
    // Use the ref value which is accurate, fallback to state if needed
    const actualCharsTyped = userInput.length || totalCharsTypedRef.current;
    
    // Calculate WPM (5 characters = 1 word)
    const wpm = Math.round((correctCharsRef.current / 5) / timeInMinutes);
    const accuracy = totalCharsTypedRef.current > 0
      ? Math.round((correctCharsRef.current / totalCharsTypedRef.current) * 100)
      : 100;

    const result = {
      wpm: Math.max(0, wpm),
      accuracy: Math.min(100, accuracy),
      charsTyped: actualCharsTyped,
      sentenceLength: currentSentence.length,
    };

    setTestResults(result);

    // Save test to database
    if (user?.id) {
      fetch('/api/scores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          wpm: result.wpm,
          accuracy: result.accuracy,
          userRole: 'teacher',
        }),
      }).catch(err => console.error('Error saving test:', err));
    }

    // Update teacher stats
    setTypingStats(prev => {
      const newTestsDone = prev.testsDone + 1;
      const newAvgWpm = Math.round((prev.avgWpm * prev.testsDone + result.wpm) / newTestsDone);
      const newBestWpm = Math.max(prev.bestWpm, result.wpm);
      const newBestAccuracy = Math.max(prev.bestAccuracy, result.accuracy);
      
      return {
        ...prev,
        wpm: result.wpm,
        accuracy: result.accuracy,
        testsDone: newTestsDone,
        avgWpm: newAvgWpm,
        bestWpm: newBestWpm,
        bestAccuracy: newBestAccuracy,
      };
    });
  };

  const handleTypeInput = (e) => {
    const newInput = e.target.value;
    
    if (!timerActive && newInput.length > 0) {
      startTimer();
    }

    // Calculate changes
    const addedChars = newInput.length - userInput.length;
    if (addedChars > 0) {
      totalCharsTypedRef.current += addedChars; // Count all keys pressed for WPM
      for (let i = userInput.length; i < newInput.length; i++) {
        if (newInput[i] === currentSentence[i]) {
          correctCharsRef.current++;
        }
      }
    } else if (addedChars < 0) {
      // When deleting, subtract from correct count but keep total for WPM calculation
      for (let i = newInput.length; i < userInput.length; i++) {
        if (userInput[i] === currentSentence[i]) {
          correctCharsRef.current--;
        }
      }
    }

    setUserInput(newInput);

    // Update WPM in real-time
    if (startTimeRef.current) {
      const timeElapsed = (Date.now() - startTimeRef.current) / 1000;
      const timeInMinutes = Math.max(timeElapsed / 60, 0.016);
      const netWpm = Math.round((correctCharsRef.current / 5) / timeInMinutes);
      const accuracy = totalCharsTypedRef.current > 0
        ? Math.round((correctCharsRef.current / totalCharsTypedRef.current) * 100)
        : 100;
      
      setTypingStats(prev => ({
        ...prev,
        wpm: netWpm,
        accuracy: accuracy,
      }));
    }

    // Auto-end test when user types the entire sentence
    if (newInput.length >= currentSentence.length && testActive) {
      endTypingTest();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === ' ' && testActive) {
      e.preventDefault();
      const newInput = userInput + ' ';
      setUserInput(newInput);
      
      // Process the space character
      if (!timerActive) startTimer();
      totalCharsTypedRef.current += 1;
      if (' ' === currentSentence[userInput.length]) {
        correctCharsRef.current++;
      }
    }
  };

  if (loading || !user) {
    const isDarkMode = darkMode;
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-slate-950' : 'bg-gradient-to-br from-slate-50 to-slate-100'}`}>
        {/* Navbar Skeleton */}
        <nav className={`border-b ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} sticky top-0 z-50`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16 items-center">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-7 bg-gray-200 w-48 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : ''}`}></div>
              </div>
              <div className="flex items-center gap-4">
                <div className={`h-4 bg-gray-200 w-32 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : ''}`}></div>
                <div className={`h-10 w-10 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-10 w-20 rounded ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tab Switcher Skeleton */}
          <div className="mb-8 flex gap-4">
            {[1, 2].map(i => (
              <div key={i} className={`h-12 px-6 rounded-lg animate-pulse w-48 ${isDarkMode ? 'bg-slate-700' : 'bg-gray-200'}`}></div>
            ))}
          </div>

          {/* Content Skeleton */}
          <div className={`rounded-lg border p-6 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
            {/* Header */}
            <div className={`h-6 bg-gray-200 w-40 mb-6 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : ''}`}></div>

            {/* Table skeleton */}
            <div className="space-y-3">
              {/* Header row */}
              <div className="flex gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className={`flex-1 h-4 bg-gray-200 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : ''}`}></div>
                ))}
              </div>
              {/* Data rows */}
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex gap-4">
                  {[1, 2, 3, 4, 5].map(j => (
                    <div key={j} className={`flex-1 h-4 bg-gray-200 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : ''}`}></div>
                  ))}
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex gap-2 mt-6 justify-center">
              {[1, 2, 3].map(i => (
                <div key={i} className={`w-10 h-10 bg-gray-200 rounded animate-pulse ${isDarkMode ? 'bg-slate-700' : ''}`}></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <AcademicCapIcon className="w-8 h-8 text-emerald-500" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Teacher Dashboard
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-slate-400">
                {user?.name || user?.email}
              </span>
              
              {/* Tab Activity Indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700/50">
                {isTabActive ? (
                  <>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Active</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Inactive</span>
                  </>
                )}
              </div>

              <button
                onClick={toggleDarkMode}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                title={darkMode ? 'Light Mode' : 'Dark Mode'}
              >
                {darkMode ? (
                  <SunIcon className="w-5 h-5" />
                ) : (
                  <MoonIcon className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Switcher */}
        <div className="mb-8 flex gap-4">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'students'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            Student Management
          </button>
          <button
            onClick={() => setActiveTab('typing')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'typing'
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:border-emerald-300'
            }`}
          >
            <BoltIcon className="w-5 h-5" />
            Try Typing Test
          </button>
        </div>

        {/* Student Management Tab */}
        {activeTab === 'students' && (
          <>
        {/* Class Selector */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Select a Class
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {CLASSES.map((cls) => (
              <button
                key={cls.id}
                onClick={() => setSelectedClass(cls.id)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 font-medium ${
                  selectedClass === cls.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                    : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 text-gray-700 dark:text-slate-300 hover:border-emerald-300'
                }`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-lg p-4 mb-8">
            <p className="text-red-800 dark:text-red-400 text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Teacher Activity Status */}
        <div className={`rounded-lg border p-4 mb-8 ${
          isTabActive
            ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30'
            : 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/30'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isTabActive ? (
                <EyeIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <EyeSlashIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
              <div>
                <p className={`font-medium ${
                  isTabActive
                    ? 'text-emerald-900 dark:text-emerald-300'
                    : 'text-amber-900 dark:text-amber-300'
                }`}>
                  {isTabActive ? '✓ Teacher tab is ACTIVE' : '⚠ Teacher tab is INACTIVE'}
                </p>
                <p className={`text-sm ${
                  isTabActive
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-amber-700 dark:text-amber-400'
                }`}>
                  Last activity: {lastActivityTime.toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Total Students
                </p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  {stats.totalStudents}
                </p>
              </div>
              <UserGroupIcon className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Active Now
                </p>
                <p className="text-3xl font-bold text-emerald-600">
                  {stats.activeStudents}
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-500/10 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">
                  Tests Completed Today
                </p>
                <p className="text-3xl font-bold text-purple-600">
                  {stats.completedTests}
                </p>
              </div>
              <CheckCircleIcon className="w-12 h-12 text-purple-500 opacity-20" />
            </div>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Students in {CLASSES.find((c) => c.id === selectedClass)?.name}
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin"></div>
            </div>
          ) : students.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-slate-400">
                No students in this class yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Student Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Tab Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Avg WPM
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Tests
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        {student.name || student.username || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium w-fit ${
                              student.isActive
                                ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30'
                                : 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-500/30'
                            }`}
                          >
                            <div
                              className={`w-2.5 h-2.5 rounded-full ${
                                student.isActive ? 'bg-emerald-500' : 'bg-red-500'
                              } ${student.isActive ? 'animate-pulse' : ''}`}
                            ></div>
                            {student.isActive ? (
                              <>
                                <span>✓ On Tab</span>
                              </>
                            ) : (
                              <>
                                <span>✕ Tab Hidden</span>
                              </>
                            )}
                          </span>
                          {student.lastActivity && (
                            <span className="text-xs text-gray-500 dark:text-slate-500">
                              Last: {new Date(student.lastActivity).toLocaleTimeString()}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white font-medium">
                        {student.avgWpm || 0} WPM
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-slate-400">
                        {student.testCount || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 space-y-4">
          <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Dashboard Info:</strong> This dashboard updates in real-time. Students in your class will appear here when they log in.
              You can monitor their activity, typing speed, and test progress.
            </p>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-3">📊 Tab Status Legend</h4>
            <div className="space-y-2 text-sm text-indigo-800 dark:text-indigo-300">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                <span><strong>✓ On Tab</strong> - Student is actively on the typing page</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                <span><strong>✕ Tab Hidden</strong> - Student switched to another tab or minimized window</span>
              </div>
              <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-2 ml-5.5">
                ℹ️ The timestamp shows when the last activity was recorded
              </p>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Typing Test Tab */}
        {activeTab === 'typing' && (
          <div>
            {/* Teacher Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Best WPM</p>
                    <p className="text-3xl font-bold text-emerald-600">{typingStats.bestWpm}</p>
                  </div>
                  <BoltIcon className="w-12 h-12 text-emerald-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Best Accuracy</p>
                    <p className="text-3xl font-bold text-blue-600">{typingStats.bestAccuracy}%</p>
                  </div>
                  <CheckCircleIcon className="w-12 h-12 text-blue-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Average WPM</p>
                    <p className="text-3xl font-bold text-purple-600">{typingStats.avgWpm}</p>
                  </div>
                  <ChartBarIcon className="w-12 h-12 text-purple-500 opacity-20" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-slate-400 mb-1">Tests Completed</p>
                    <p className="text-3xl font-bold text-pink-600">{typingStats.testsDone}</p>
                  </div>
                  <SparklesIcon className="w-12 h-12 text-pink-500 opacity-20" />
                </div>
              </div>
            </div>

            {/* Typing Test Area */}
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  ⌨️ Typing Test
                </h3>
              </div>

              <div className="p-8">
                {/* Timer Display */}
                {testActive && (
                  <div className="mb-6 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50 dark:from-emerald-500/10 dark:to-blue-500/10 p-6 rounded-lg border border-emerald-200 dark:border-emerald-500/30">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-semibold">Time Left</p>
                        <p className={`text-3xl font-bold font-mono ${
                          timeLeft <= 5 ? 'text-red-600 dark:text-red-400 animate-pulse' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {timeLeft}s
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-semibold">Live WPM</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{typingStats.wpm}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-gray-500 dark:text-slate-400 mb-1 font-semibold">Accuracy</p>
                        <p className={`text-3xl font-bold ${
                          typingStats.accuracy >= 95 ? 'text-emerald-600 dark:text-emerald-400' : 'text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {typingStats.accuracy}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sentence to Type - Full Screen Display */}
                {currentSentence && (
                  <div className="relative">
                    {/* Hidden Input for capturing keystrokes */}
                    {testActive && (
                      <input
                        ref={inputRef}
                        type="text"
                        value={userInput}
                        onChange={handleTypeInput}
                        onKeyDown={handleKeyDown}
                        className="sr-only"
                        autoFocus
                      />
                    )}
                    
                    <div 
                      className={`relative rounded-lg p-12 border-2 font-mono transition-all duration-300 cursor-text focus:outline-none min-h-96 flex flex-col justify-center ${
                        testActive
                          ? 'bg-white dark:bg-slate-900 border-emerald-500'
                          : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700'
                      }`}
                      tabIndex={testActive ? 0 : -1}
                      onClick={() => {
                        if (testActive && inputRef.current) {
                          inputRef.current.focus();
                        }
                      }}
                      onKeyDown={(e) => {
                        if (testActive && inputRef.current) {
                          inputRef.current.focus();
                        }
                      }}
                    >
                      {/* Sentence Display with Visible Spaces */}
                      <div className="text-3xl lg:text-4xl leading-relaxed text-gray-900 dark:text-white break-words">
                        {currentSentence.split('').map((char, idx) => (
                          <span
                            key={idx}
                            className={`transition-all duration-75 inline-block ${
                              char === ' '
                                ? idx < userInput.length
                                  ? userInput[idx] === ' '
                                    ? 'w-4 h-8 mx-1 border-b-4 border-dashed border-emerald-500 dark:border-emerald-400' // Space typed correctly
                                    : 'w-4 h-8 mx-1 border-b-4 border-dashed border-red-500 dark:border-red-400 bg-red-100 dark:bg-red-900/30' // Space typed wrong
                                  : idx === userInput.length
                                  ? 'w-4 h-8 mx-1 border-b-4 border-dashed border-emerald-500 dark:border-emerald-400 animate-pulse' // Current space to type
                                  : 'w-4 h-8 mx-1 border-b-2 border-dashed border-gray-400 dark:border-slate-500' // Untouched space
                                : ''
                            } ${
                              char !== ' ' && (
                                idx < userInput.length
                                  ? userInput[idx] === char
                                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30'
                                    : 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30'
                                  : idx === userInput.length
                                  ? 'text-white dark:text-slate-200 bg-emerald-500 dark:bg-emerald-600 rounded animate-pulse'
                                  : 'text-gray-400 dark:text-slate-500'
                              )
                            }`}
                          >
                            {char === ' ' ? '' : char}
                          </span>
                        ))}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-medium text-gray-600 dark:text-slate-400">Progress</span>
                          <span className="text-sm text-gray-600 dark:text-slate-400 font-mono text-lg font-bold">
                            {userInput.length} / {currentSentence.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-4 overflow-hidden shadow-lg">
                          <div
                            className="bg-gradient-to-r from-emerald-500 to-blue-500 h-4 rounded-full transition-all duration-150 shadow-lg"
                            style={{ width: `${(userInput.length / currentSentence.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      <p className="text-sm text-gray-500 dark:text-slate-400 mt-6 text-center">
                        💡 Click to focus • Type directly • Use backspace to delete • Complete the sentence to finish
                      </p>
                    </div>
                  </div>
                )}

                {/* Test Results */}
                {testResults ? (
                  <div className="mb-8 p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                    <h4 className="text-lg font-semibold text-emerald-900 dark:text-emerald-300 mb-4 flex items-center gap-2">
                      <CheckCircleIcon className="w-6 h-6" />
                      Test Complete!
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-1">Words Per Minute</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{testResults.wpm}</p>
                      </div>
                      <div>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-1">Accuracy</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{testResults.accuracy}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-emerald-800 dark:text-emerald-300 mb-1">Characters Typed</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                          {testResults.charsTyped}/{testResults.sentenceLength}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (!testActive && !testResults) ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-slate-400 mb-6 text-lg">
                      Ready to test your typing skills? Start a new test to see how fast you can type!
                    </p>
                  </div>
                ) : null}

                {/* Buttons */}
                <div className="flex gap-4 justify-center">
                  {!testActive && !testResults ? (
                    <button
                      onClick={startTypingTest}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      <BoltIcon className="w-5 h-5" />
                      Start Test
                    </button>
                  ) : testActive ? (
                    <button
                      onClick={endTypingTest}
                      className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      End Test
                    </button>
                  ) : null}

                  {testResults && (
                    <button
                      onClick={() => startTypingTest()}
                      className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-lg font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Info Box for Typing Test */}
            <div className="mt-8 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 <strong>Teacher Tip:</strong> Taking typing tests alongside your students helps you understand the experience they go through. It also sets a great example! Your stats are saved so you can track your own progress over time.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

