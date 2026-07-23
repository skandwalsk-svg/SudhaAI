import React, { useState, useEffect } from 'react';
import {
  LayoutGrid,
  Calendar,
  BookOpen,
  TrendingUp,
  User,
  Sun,
  Moon,
  Smartphone,
  Tablet,
  Monitor,
  Code2,
  Layers,
  Sparkles,
  Lock,
  CheckCircle2,
  Copy,
  Check,
  Folder,
  FileCode,
  ShieldCheck,
  BrainCircuit,
  Database,
  ArrowRight,
  Eye,
  EyeOff,
  Mail,
  LockKeyhole,
  UserCheck,
  ArrowLeft,
  KeyRound,
  CheckCircle,
  Play,
  LogOut,
  Plus,
  Trash2,
  Clock,
  Tag,
  FileText,
  PlusCircle,
  RefreshCw,
  X
} from 'lucide-react';
import { FLUTTER_FILES, FlutterFile } from './data/flutterFiles';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signOut, 
  onAuthStateChanged, 
  updateProfile, 
  getFriendlyAuthErrorMessage,
  User as FirebaseUser
} from './lib/firebase';
import {
  UserDocument,
  StudyProgressDocument,
  StudyPlanDocument,
  NoteDocument
} from './lib/models/firestore_models';
import {
  UserRepository,
  StudyProgressRepository,
  StudyPlanRepository,
  NoteRepository
} from './services/firestore_repositories';
import { AIRepository, useAI, AIPromptType } from './lib/ai';
import { PdfIntelligenceEngine } from './components/pdf/PdfIntelligenceEngine';

type AuthRoute = 'splash' | 'welcome' | 'login' | 'signUp' | 'forgotPassword' | 'mainApp';


export default function App() {
  // Theme state for the Flutter app emulator
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Active Auth/App route state inside Flutter emulator
  const [currentRoute, setCurrentRoute] = useState<AuthRoute>('welcome');
  
  // Navigation tab state inside Flutter emulator (for mainApp)
  const [activeTab, setActiveTab] = useState<'home' | 'planner' | 'pdf' | 'notes' | 'analytics' | 'profile'>('home');
  
  // Device Frame state (mobile, tablet, desktop)
  const [deviceFrame, setDeviceFrame] = useState<'mobile' | 'tablet' | 'desktop'>('mobile');
  
  // Main Studio View state (Emulator vs Code Inspector vs Architecture Blueprint)
  const [mainView, setMainView] = useState<'emulator' | 'code' | 'architecture'>('emulator');
  
  // Selected file for Code Inspector
  const [selectedFile, setSelectedFile] = useState<FlutterFile>(FLUTTER_FILES[2]); // splash_screen.dart
  const [copiedCode, setCopiedCode] = useState(false);

  // Form states for Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // Form states for Sign Up
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [signUpLoading, setSignUpLoading] = useState(false);

  // Form states for Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  // Firebase Auth user state
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);

  // Firestore collections real-time states (Milestone 5)
  const [userDoc, setUserDoc] = useState<UserDocument | null>(null);
  const [studyProgress, setStudyProgress] = useState<StudyProgressDocument | null>(null);
  const [studyPlans, setStudyPlans] = useState<StudyPlanDocument[]>([]);
  const [notes, setNotes] = useState<NoteDocument[]>([]);

  // Gemini AI Foundation Hook (Milestone 6)
  const { isLoading: isAiLoading, error: aiError, response: aiResponse, data: aiData, execute: executeAI, cancel: cancelAI, reset: resetAI } = useAI();
  const [activeAiTest, setActiveAiTest] = useState<AIPromptType | null>(null);

  const handleTestAiPlanner = () => {
    setActiveAiTest('STUDY_PLANNER');
    executeAI((signal) =>
      AIRepository.generateStudyPlan(
        {
          targetExam: userDoc?.targetExam || 'UPSC CSE 2026',
          subject: 'Indian Polity Laxmikanth',
          availableHoursPerDay: 5,
          durationDays: 5
        },
        { abortSignal: signal }
      )
    );
  };

  const handleTestAiSummary = () => {
    setActiveAiTest('PDF_SUMMARY');
    executeAI((signal) =>
      AIRepository.generateSummary(
        {
          documentTitle: 'Fundamental Rights Overview',
          documentContent: 'Article 14 guarantees equality before law and equal protection of laws within India. Article 19 safeguards six freedoms: speech and expression, assembly, association, movement, residence, and profession. Article 21 guarantees protection of life and personal liberty.'
        },
        { abortSignal: signal }
      )
    );
  };

  const handleTestAiQuiz = () => {
    setActiveAiTest('QUIZ_GENERATOR');
    executeAI((signal) =>
      AIRepository.generateQuiz(
        {
          subject: 'Polity',
          topic: 'Preamble & Fundamental Rights',
          numQuestions: 3,
          difficulty: 'UPSC Level'
        },
        { abortSignal: signal }
      )
    );
  };

  const handleTestAiFlashcards = () => {
    setActiveAiTest('FLASHCARDS');
    executeAI((signal) =>
      AIRepository.generateFlashcards(
        {
          subject: 'Polity',
          topic: 'Constitutional Bodies',
          count: 3
        },
        { abortSignal: signal }
      )
    );
  };

  const handleTestAiRevision = () => {
    setActiveAiTest('REVISION_PLANNER');
    executeAI((signal) =>
      AIRepository.generateRevisionPlan(
        {
          weakTopics: ['Writs Jurisdiction', 'Directive Principles', 'Emergency Provisions'],
          targetExam: userDoc?.targetExam || 'UPSC CSE 2026'
        },
        { abortSignal: signal }
      )
    );
  };
  const [firestoreLoading, setFirestoreLoading] = useState<boolean>(true);
  const [firestoreError, setFirestoreError] = useState<string | null>(null);

  // Form states for creating Study Plan
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanTargetDate, setNewPlanTargetDate] = useState('');
  const [newPlanSubjects, setNewPlanSubjects] = useState('');

  // Form states for creating Note
  const [showAddNoteModal, setShowAddNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteSubject, setNewNoteSubject] = useState('Polity & Constitution');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteTags, setNewNoteTags] = useState('GS2, Laxmikanth');

  // Form states for Profile edit
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editTargetExam, setEditTargetExam] = useState('UPSC CSE 2026 • UKPSC');
  const [editExamYear, setEditExamYear] = useState<number>(2026);

  // Toast feedback state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Listen to persistent Firebase authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Subscriptions for authenticated user
  useEffect(() => {
    if (!authUser) {
      setUserDoc(null);
      setStudyProgress(null);
      setStudyPlans([]);
      setNotes([]);
      setFirestoreLoading(false);
      return;
    }

    setFirestoreLoading(true);
    setFirestoreError(null);

    // Initialize or sync default Firestore documents for user if first time
    const initFirestoreDocs = async () => {
      try {
        const existingUser = await UserRepository.getUser(authUser.uid);
        if (!existingUser) {
          const newUser: UserDocument = {
            uid: authUser.uid,
            name: authUser.displayName || authUser.email?.split('@')[0] || 'Aspirant',
            email: authUser.email || '',
            targetExam: 'UPSC CSE 2026 • UKPSC',
            examYear: 2026,
            onboardingCompleted: true,
            createdAt: new Date().toISOString(),
          };
          await UserRepository.createOrUpdateUser(newUser);
        }

        const existingProgress = await StudyProgressRepository.getProgress(authUser.uid);
        if (!existingProgress) {
          const newProgress: StudyProgressDocument = {
            uid: authUser.uid,
            totalStudyHours: 42.5,
            currentStreak: 14,
            weeklyProgress: [4.5, 6.0, 5.2, 7.0, 3.5, 8.0, 6.5],
            completedTopics: 28,
            lastStudyDate: new Date().toISOString(),
          };
          await StudyProgressRepository.updateProgress(newProgress);
        }
      } catch (err: any) {
        console.error('Firestore init warning:', err);
      }
    };

    initFirestoreDocs();

    // 1. Subscribe to users collection doc
    const unsubUser = UserRepository.subscribeToUser(
      authUser.uid,
      (data) => {
        if (data) {
          setUserDoc(data);
          setEditTargetExam(data.targetExam || 'UPSC CSE 2026 • UKPSC');
          setEditExamYear(data.examYear || 2026);
        }
        setFirestoreLoading(false);
      },
      (err) => {
        setFirestoreError(err.message);
        setFirestoreLoading(false);
      }
    );

    // 2. Subscribe to study_progress collection doc
    const unsubProgress = StudyProgressRepository.subscribeToProgress(
      authUser.uid,
      (data) => {
        if (data) setStudyProgress(data);
      },
      (err) => setFirestoreError(err.message)
    );

    // 3. Subscribe to study_plans collection
    const unsubPlans = StudyPlanRepository.subscribeToUserPlans(
      authUser.uid,
      (data) => {
        setStudyPlans(data);
      },
      (err) => setFirestoreError(err.message)
    );

    // 4. Subscribe to notes collection
    const unsubNotes = NoteRepository.subscribeToUserNotes(
      authUser.uid,
      (data) => {
        setNotes(data);
      },
      (err) => setFirestoreError(err.message)
    );

    return () => {
      unsubUser();
      unsubProgress();
      unsubPlans();
      unsubNotes();
    };
  }, [authUser]);

  // Handler: Log Study Session (updates study_progress in Firestore)
  const handleLogStudySession = async (hours: number = 1.0) => {
    if (!authUser || !studyProgress) return;
    try {
      const updated: StudyProgressDocument = {
        ...studyProgress,
        totalStudyHours: parseFloat((studyProgress.totalStudyHours + hours).toFixed(1)),
        completedTopics: studyProgress.completedTopics + 1,
        lastStudyDate: new Date().toISOString(),
      };
      await StudyProgressRepository.updateProgress(updated);
      showToast(`Logged ${hours} study hour(s) to Firestore!`);
    } catch (err) {
      showToast('Error updating study progress in Firestore.');
    }
  };

  // Handler: Add Study Plan (creates doc in study_plans collection)
  const handleAddStudyPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !newPlanTitle.trim()) {
      showToast('Please enter a plan title.');
      return;
    }
    try {
      const planToCreate: Omit<StudyPlanDocument, 'id'> = {
        uid: authUser.uid,
        title: newPlanTitle.trim(),
        targetDate: newPlanTargetDate || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        subjects: newPlanSubjects.split(',').map((s) => s.trim()).filter(Boolean),
        completed: false,
      };
      await StudyPlanRepository.addPlan(planToCreate);
      setNewPlanTitle('');
      setNewPlanSubjects('');
      setShowAddPlanModal(false);
      showToast('Study plan created in Firestore!');
    } catch (err) {
      showToast('Failed to create study plan in Firestore.');
    }
  };

  // Handler: Toggle Study Plan Completion
  const handleTogglePlan = async (planId: string, currentCompleted: boolean) => {
    try {
      await StudyPlanRepository.togglePlanCompleted(planId, !currentCompleted);
      showToast(currentCompleted ? 'Plan marked in progress' : 'Plan marked completed in Firestore!');
    } catch (err) {
      showToast('Error updating study plan in Firestore.');
    }
  };

  // Handler: Delete Study Plan
  const handleDeletePlan = async (planId: string) => {
    try {
      await StudyPlanRepository.deletePlan(planId);
      showToast('Study plan deleted from Firestore.');
    } catch (err) {
      showToast('Error deleting study plan from Firestore.');
    }
  };

  // Handler: Add Note (creates doc in notes collection)
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser || !newNoteTitle.trim() || !newNoteContent.trim()) {
      showToast('Please enter a title and content for your note.');
      return;
    }
    try {
      const noteToCreate: Omit<NoteDocument, 'id'> = {
        uid: authUser.uid,
        title: newNoteTitle.trim(),
        subject: newNoteSubject.trim() || 'General Studies',
        content: newNoteContent.trim(),
        tags: newNoteTags.split(',').map((t) => t.trim()).filter(Boolean),
        createdAt: new Date().toISOString(),
      };
      await NoteRepository.addNote(noteToCreate);
      setNewNoteTitle('');
      setNewNoteContent('');
      setShowAddNoteModal(false);
      showToast('Smart note saved to Firestore!');
    } catch (err) {
      showToast('Failed to save note in Firestore.');
    }
  };

  // Handler: Delete Note
  const handleDeleteNote = async (noteId: string) => {
    try {
      await NoteRepository.deleteNote(noteId);
      showToast('Note deleted from Firestore.');
    } catch (err) {
      showToast('Error deleting note from Firestore.');
    }
  };

  // Handler: Update User Profile (updates users/{uid} in Firestore)
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) return;
    try {
      const updatedUser: UserDocument = {
        uid: authUser.uid,
        name: userDoc?.name || authUser.displayName || authUser.email?.split('@')[0] || 'Aspirant',
        email: authUser.email || '',
        targetExam: editTargetExam.trim() || 'UPSC CSE 2026 • UKPSC',
        examYear: Number(editExamYear) || 2026,
        onboardingCompleted: true,
        createdAt: userDoc?.createdAt || new Date().toISOString(),
      };
      await UserRepository.createOrUpdateUser(updatedUser);
      setIsEditingProfile(false);
      showToast('Profile updated and saved to Firestore!');
    } catch (err) {
      showToast('Error saving profile to Firestore.');
    }
  };


  // Splash Screen timer simulation
  useEffect(() => {
    if (currentRoute === 'splash') {
      const timer = setTimeout(() => {
        if (authUser) {
          setCurrentRoute('mainApp');
        } else {
          setCurrentRoute('welcome');
        }
      }, 2400);
      return () => clearTimeout(timer);
    }
  }, [currentRoute, authUser]);

  // Copy code handler
  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Firebase Email & Password Login
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      showToast('Please enter both email address and password.');
      return;
    }
    setLoginLoading(true);
    try {
      await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      setLoginLoading(false);
      showToast('Welcome back to SudhaAI! Firebase Authentication active.');
      setCurrentRoute('mainApp');
    } catch (err: any) {
      setLoginLoading(false);
      const friendlyMsg = getFriendlyAuthErrorMessage(err.code || '');
      showToast(friendlyMsg);
    }
  };

  // Firebase Email & Password Sign Up
  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) {
      showToast('Please complete all required fields.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      showToast('Passwords do not match. Please verify.');
      return;
    }
    setSignUpLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        signUpEmail.trim(),
        signUpPassword
      );
      if (userCredential.user) {
        await updateProfile(userCredential.user, {
          displayName: signUpName.trim(),
        });
      }
      setSignUpLoading(false);
      showToast('Account created successfully in Firebase Auth! Welcome to SudhaAI.');
      setCurrentRoute('mainApp');
    } catch (err: any) {
      setSignUpLoading(false);
      const friendlyMsg = getFriendlyAuthErrorMessage(err.code || '');
      showToast(friendlyMsg);
    }
  };

  // Firebase Password Reset Email
  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your email address.');
      return;
    }
    setForgotLoading(true);
    try {
      await sendPasswordResetEmail(auth, forgotEmail.trim());
      setForgotLoading(false);
      setForgotSent(true);
      showToast('Password reset email sent successfully!');
    } catch (err: any) {
      setForgotLoading(false);
      const friendlyMsg = getFriendlyAuthErrorMessage(err.code || '');
      showToast(friendlyMsg);
    }
  };

  // Firebase Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      showToast('Signed out of SudhaAI successfully.');
      setCurrentRoute('welcome');
    } catch (err) {
      showToast('Error signing out. Please try again.');
    }
  };

  // Screen configuration metadata for Main App
  const screenContent = {
    home: {
      title: 'Home Dashboard',
      illustrationIcon: <LayoutGrid className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />,
      illustrationLabel: 'AI Study Center Dashboard',
      cardTitle: 'Personalized AI Study Hub',
      cardDesc: 'Your unified workspace combining real-time study streaks, recent notes, active quizzes, and adaptive daily goals.',
      features: [
        'Gemini AI Powered Daily Study Recommendations',
        'Firebase Auth User Sync & Persistent Streaks',
        'Quick PDF Scanner & Smart Summary Widget',
        'Active Focus Timer & Ambient Audio Mode'
      ]
    },
    planner: {
      title: 'Study Planner',
      illustrationIcon: <Calendar className="w-10 h-10 text-emerald-500 dark:text-emerald-400" />,
      illustrationLabel: 'Smart AI Study Timetable',
      cardTitle: 'Automated Study Scheduler',
      cardDesc: 'Intelligent schedule optimization tailored to your exam dates, difficulty levels, and learning pace.',
      features: [
        'Spaced Repetition & Exam Countdown Timers',
        'Firestore Sync across Mobile & Web Devices',
        'Google Calendar Integration via OAuth',
        'AI Time-Slot Suggestions for Heavy Topics'
      ]
    },
    pdf: {
      title: 'AI PDF Intelligence',
      illustrationIcon: <FileText className="w-10 h-10 text-indigo-500 dark:text-indigo-400" />,
      illustrationLabel: 'PDF Documents & Gemini Analysis',
      cardTitle: 'AI PDF Reader & Note Extractor',
      cardDesc: 'Upload textbook chapters or notes to generate summaries, MCQs, and flashcards with Gemini.',
      features: [
        'Gemini Flash PDF Content Processing',
        'Automatic Chapter Chunking & Summarization',
        'UPSC & Competitive Exam Level MCQs',
        'Spaced Revision Scheduler (1-7-30 Rule)'
      ]
    },
    notes: {
      title: 'Smart Notes',
      illustrationIcon: <BookOpen className="w-10 h-10 text-cyan-500 dark:text-cyan-400" />,
      illustrationLabel: 'AI Markdown & PDF Notes Library',
      cardTitle: 'AI Note-Taking & Document Analyzer',
      cardDesc: 'Upload PDFs, lecture slides, or hand-written notes to generate automatic summaries, key term flashcards, and Q&A pairs.',
      features: [
        'Gemini PDF OCR & Semantic Indexing',
        'Markdown Rich Text Editor with LaTeX Math',
        'Firebase Storage Document Cloud Sync',
        'One-Click AI Concept Map Generation'
      ]
    },
    analytics: {
      title: 'Learning Analytics',
      illustrationIcon: <TrendingUp className="w-10 h-10 text-purple-500 dark:text-purple-400" />,
      illustrationLabel: 'Visual Progress & Knowledge Heatmaps',
      cardTitle: 'Comprehensive Mastery Metrics',
      cardDesc: 'Deep cognitive analytics tracking topic retention rates, time distribution per subject, and AI quiz accuracy scores.',
      features: [
        'Interactive Chart.js & Flutter Canvas Heatmaps',
        'Weak Spot Identification & Targeted Drills',
        'Study Velocity & Memory Decay Predictions',
        'Exportable Progress PDF Reports for Teachers'
      ]
    },
    profile: {
      title: 'User Profile',
      illustrationIcon: <User className="w-10 h-10 text-amber-500 dark:text-amber-400" />,
      illustrationLabel: 'Student Identity & Account Settings',
      cardTitle: 'Student Account Management',
      cardDesc: 'Manage your user profile, study goals, target exams, theme preferences, and connected AI integration keys.',
      features: [
        'Firebase Authentication (Google & Email/Password)',
        'Study Target Goals & Grade Level Setup',
        'Custom AI Persona & Explanation Detail Dial',
        'Cloud Backup & Multi-Device Sync Control'
      ]
    }
  };

  const currentMainScreen = screenContent[activeTab];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-bounce">
          <CheckCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-950/80 backdrop-blur px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-500 p-0.5 shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-white">SudhaAI</h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full">
                Milestone 3 Premium Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Personal AI Mentor for UPSC & UKPSC</p>
          </div>
        </div>

        {/* View Selector Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setMainView('emulator')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mainView === 'emulator'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">App Emulator</span>
          </button>
          <button
            onClick={() => setMainView('code')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mainView === 'code'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span className="hidden sm:inline">Flutter Code Inspector</span>
          </button>
          <button
            onClick={() => setMainView('architecture')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              mainView === 'architecture'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Clean Architecture</span>
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {mainView === 'emulator' && (
            <div className="hidden lg:flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => setDeviceFrame('mobile')}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
                  deviceFrame === 'mobile' ? 'bg-slate-800 text-indigo-400' : ''
                }`}
                title="Mobile (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceFrame('tablet')}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
                  deviceFrame === 'tablet' ? 'bg-slate-800 text-indigo-400' : ''
                }`}
                title="Tablet (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceFrame('desktop')}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors ${
                  deviceFrame === 'desktop' ? 'bg-slate-800 text-indigo-400' : ''
                }`}
                title="Desktop Responsive"
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-xl text-slate-300 hover:text-white transition-colors"
            title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* VIEW 1: LIVE INTERACTIVE APP EMULATOR */}
        {mainView === 'emulator' && (
          <div className="flex-1 bg-slate-950 p-4 md:p-6 flex flex-col items-center justify-start overflow-y-auto">
            {/* Auth Screen Navigator Bar */}
            <div className="w-full max-w-xl bg-slate-900 border border-slate-800 p-2 rounded-2xl mb-4 flex items-center justify-between gap-1 text-xs overflow-x-auto shrink-0">
              <span className="text-slate-400 font-semibold px-2 hidden sm:inline shrink-0">Screen Route:</span>
              <div className="flex items-center gap-1 overflow-x-auto">
                <button
                  onClick={() => setCurrentRoute('splash')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                    currentRoute === 'splash'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  1. Splash
                </button>
                <button
                  onClick={() => setCurrentRoute('welcome')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                    currentRoute === 'welcome'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  2. Welcome
                </button>
                <button
                  onClick={() => setCurrentRoute('login')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                    currentRoute === 'login'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  3. Login
                </button>
                <button
                  onClick={() => setCurrentRoute('signUp')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                    currentRoute === 'signUp'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  4. Sign Up
                </button>
                <button
                  onClick={() => setCurrentRoute('forgotPassword')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                    currentRoute === 'forgotPassword'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  5. Forgot Pass
                </button>
                <button
                  onClick={() => setCurrentRoute('mainApp')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 ${
                    currentRoute === 'mainApp'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800'
                  }`}
                >
                  6. Main App
                </button>
              </div>
            </div>

            {/* Device Frame Wrapper */}
            <div
              className={`transition-all duration-300 flex flex-col rounded-[32px] border-4 border-slate-800 shadow-2xl overflow-hidden my-auto ${
                deviceFrame === 'mobile'
                  ? 'w-[375px] min-h-[750px]'
                  : deviceFrame === 'tablet'
                  ? 'w-[680px] min-h-[800px]'
                  : 'w-full max-w-4xl min-h-[760px]'
              }`}
            >
              {/* SCREEN 1: SPLASH SCREEN */}
              {currentRoute === 'splash' && (
                <div className="flex-1 bg-[#0F111A] text-white flex flex-col items-center justify-between p-8 text-center relative overflow-hidden">
                  <div className="my-auto space-y-6">
                    <div className="relative inline-block">
                      <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#635BFF] via-[#8E2DE2] to-[#00B4D8] p-1 shadow-2xl shadow-indigo-500/40 animate-pulse">
                        <div className="w-full h-full bg-[#0F111A] rounded-[22px] flex items-center justify-center">
                          <Sparkles className="w-12 h-12 text-indigo-400" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-bold tracking-tight text-white mb-2">SudhaAI</h2>
                      <p className="text-xs font-semibold text-cyan-400 max-w-xs mx-auto leading-relaxed">
                        Your Personal AI Mentor for UPSC & UKPSC
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-[11px] text-slate-500 font-mono">
                      Milestone 2 • Animated Splash Screen • Auto navigating...
                    </p>
                  </div>
                </div>
              )}

              {/* SCREEN 2: WELCOME SCREEN */}
              {currentRoute === 'welcome' && (
                <div
                  className={`flex-1 flex flex-col justify-between p-6 transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#0F111A] text-[#E4E6F2]' : 'bg-[#F8F9FE] text-[#1A1C24]'
                  }`}
                >
                  <div className="my-auto space-y-8">
                    {/* Hero Illustration Container */}
                    <div
                      className={`rounded-3xl p-8 text-center border relative overflow-hidden ${
                        isDarkMode
                          ? 'bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border-indigo-900/40'
                          : 'bg-gradient-to-br from-indigo-50 via-purple-50 to-cyan-50 border-indigo-100'
                      }`}
                    >
                      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#635BFF] via-[#8E2DE2] to-[#00B4D8] p-1 mx-auto shadow-xl shadow-indigo-500/20 mb-4 flex items-center justify-center">
                        <Sparkles className="w-10 h-10 text-white" />
                      </div>

                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          isDarkMode
                            ? 'bg-[#181A26] border-[#2E3248] text-indigo-400'
                            : 'bg-white border-[#E2E5F0] text-indigo-600'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        Smart UPSC & UKPSC Syllabus AI
                      </div>
                    </div>

                    {/* Headline & Description */}
                    <div className="text-center space-y-2">
                      <h2 className="text-2xl font-bold tracking-tight">Master Civil Services Exams with SudhaAI</h2>
                      <p className={`text-xs leading-relaxed max-w-xs mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Adaptive study schedules, instant PDF summaries, AI answer evaluation, and real-time revision analytics.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-3 pt-4">
                    <button
                      onClick={() => setCurrentRoute('signUp')}
                      className="w-full py-3.5 px-4 rounded-xl bg-[#635BFF] hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
                    >
                      <span>Get Started</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setCurrentRoute('login')}
                      className={`w-full py-3.5 px-4 rounded-xl border text-xs font-semibold transition-all ${
                        isDarkMode
                          ? 'border-[#2E3248] hover:bg-[#181A26] text-white'
                          : 'border-indigo-200 hover:bg-indigo-50 text-indigo-600'
                      }`}
                    >
                      Already have an account? Login
                    </button>

                    <button
                      onClick={() => setCurrentRoute('mainApp')}
                      className="w-full py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      Explore as Guest
                    </button>
                  </div>
                </div>
              )}

              {/* SCREEN 3: LOGIN SCREEN */}
              {currentRoute === 'login' && (
                <div
                  className={`flex-1 flex flex-col p-6 transition-colors duration-300 overflow-y-auto ${
                    isDarkMode ? 'bg-[#0F111A] text-[#E4E6F2]' : 'bg-[#F8F9FE] text-[#1A1C24]'
                  }`}
                >
                  <button
                    onClick={() => setCurrentRoute('welcome')}
                    className="p-2 -ml-2 self-start text-slate-400 hover:text-slate-200 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="my-auto space-y-6">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#635BFF] to-[#00B4D8] flex items-center justify-center text-white">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-base text-[#635BFF]">SudhaAI</span>
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">Welcome Back!</h2>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Sign in to access your AI study schedules and notes.
                      </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleLoginSubmit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            placeholder="student@upsc.org"
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                              isDarkMode
                                ? 'bg-[#232636] border-[#2E3248] text-white focus:border-[#635BFF]'
                                : 'bg-white border-[#E2E5F0] text-slate-900 focus:border-[#635BFF]'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Password</label>
                        <div className="relative">
                          <LockKeyhole className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type={showLoginPassword ? 'text' : 'password'}
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                              isDarkMode
                                ? 'bg-[#232636] border-[#2E3248] text-white focus:border-[#635BFF]'
                                : 'bg-white border-[#E2E5F0] text-slate-900 focus:border-[#635BFF]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                          >
                            {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setCurrentRoute('forgotPassword')}
                          className="text-xs font-semibold text-[#635BFF] hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full py-3 px-4 rounded-xl bg-[#635BFF] hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                      >
                        {loginLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Sign In</span>
                        )}
                      </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex py-1 items-center">
                      <div className={`flex-grow border-t ${isDarkMode ? 'border-[#2E3248]' : 'border-slate-200'}`} />
                      <span className="flex-shrink mx-3 text-[10px] uppercase font-bold text-slate-400">OR</span>
                      <div className={`flex-grow border-t ${isDarkMode ? 'border-[#2E3248]' : 'border-slate-200'}`} />
                    </div>

                    {/* Google Sign In UI Button */}
                    <button
                      type="button"
                      onClick={() => showToast('Google Sign-In ready for Milestone 2 Firebase deployment')}
                      className={`w-full py-2.5 px-4 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        isDarkMode
                          ? 'border-[#2E3248] hover:bg-[#181A26] text-slate-200'
                          : 'border-slate-300 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="font-bold text-red-500">G</span>
                      <span>Continue with Google</span>
                    </button>

                    {/* Footer Nav Link */}
                    <div className="text-center text-xs">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Don't have an account?{' '}
                      </span>
                      <button
                        onClick={() => setCurrentRoute('signUp')}
                        className="font-bold text-[#635BFF] hover:underline"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 4: SIGN UP SCREEN */}
              {currentRoute === 'signUp' && (
                <div
                  className={`flex-1 flex flex-col p-6 transition-colors duration-300 overflow-y-auto ${
                    isDarkMode ? 'bg-[#0F111A] text-[#E4E6F2]' : 'bg-[#F8F9FE] text-[#1A1C24]'
                  }`}
                >
                  <button
                    onClick={() => setCurrentRoute('welcome')}
                    className="p-2 -ml-2 self-start text-slate-400 hover:text-slate-200 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="my-auto space-y-5">
                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#635BFF] to-[#00B4D8] flex items-center justify-center text-white">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-base text-[#635BFF]">SudhaAI</span>
                      </div>
                      <h2 className="text-2xl font-bold tracking-tight">Create Account</h2>
                      <p className={`text-xs ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Start your AI-guided preparation for UPSC & UKPSC exams.
                      </p>
                    </div>

                    {/* Sign Up Form */}
                    <form onSubmit={handleSignUpSubmit} className="space-y-3.5">
                      <div>
                        <label className="block text-xs font-semibold mb-1">Full Name</label>
                        <div className="relative">
                          <UserCheck className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="text"
                            value={signUpName}
                            onChange={(e) => setSignUpName(e.target.value)}
                            placeholder="Anjali Sharma"
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                              isDarkMode
                                ? 'bg-[#232636] border-[#2E3248] text-white focus:border-[#635BFF]'
                                : 'bg-white border-[#E2E5F0] text-slate-900 focus:border-[#635BFF]'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Email Address</label>
                        <div className="relative">
                          <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type="email"
                            value={signUpEmail}
                            onChange={(e) => setSignUpEmail(e.target.value)}
                            placeholder="student@upsc.org"
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                              isDarkMode
                                ? 'bg-[#232636] border-[#2E3248] text-white focus:border-[#635BFF]'
                                : 'bg-white border-[#E2E5F0] text-slate-900 focus:border-[#635BFF]'
                            }`}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Password</label>
                        <div className="relative">
                          <LockKeyhole className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type={showSignUpPassword ? 'text' : 'password'}
                            value={signUpPassword}
                            onChange={(e) => setSignUpPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full pl-9 pr-9 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                              isDarkMode
                                ? 'bg-[#232636] border-[#2E3248] text-white focus:border-[#635BFF]'
                                : 'bg-white border-[#E2E5F0] text-slate-900 focus:border-[#635BFF]'
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                            className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                          >
                            {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold mb-1">Confirm Password</label>
                        <div className="relative">
                          <LockKeyhole className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                          <input
                            type={showSignUpPassword ? 'text' : 'password'}
                            value={signUpConfirmPassword}
                            onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                              isDarkMode
                                ? 'bg-[#232636] border-[#2E3248] text-white focus:border-[#635BFF]'
                                : 'bg-white border-[#E2E5F0] text-slate-900 focus:border-[#635BFF]'
                            }`}
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={signUpLoading}
                        className="w-full py-3 px-4 rounded-xl bg-[#635BFF] hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 mt-2"
                      >
                        {signUpLoading ? (
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <span>Create Account</span>
                        )}
                      </button>
                    </form>

                    {/* Footer Nav Link */}
                    <div className="text-center text-xs pt-2">
                      <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>
                        Already have an account?{' '}
                      </span>
                      <button
                        onClick={() => setCurrentRoute('login')}
                        className="font-bold text-[#635BFF] hover:underline"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 5: FORGOT PASSWORD SCREEN */}
              {currentRoute === 'forgotPassword' && (
                <div
                  className={`flex-1 flex flex-col p-6 transition-colors duration-300 overflow-y-auto ${
                    isDarkMode ? 'bg-[#0F111A] text-[#E4E6F2]' : 'bg-[#F8F9FE] text-[#1A1C24]'
                  }`}
                >
                  <button
                    onClick={() => setCurrentRoute('login')}
                    className="p-2 -ml-2 self-start text-slate-400 hover:text-slate-200 rounded-lg"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>

                  <div className="my-auto space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                      <KeyRound className="w-6 h-6" />
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Forgot Password?</h2>
                      <p className={`text-xs mt-1 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Don't worry! Enter your registered email address and we will send you a password reset link.
                      </p>
                    </div>

                    {forgotSent ? (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs">
                          <CheckCircle className="w-4 h-4" />
                          <span>Reset Link Sent!</span>
                        </div>
                        <p className="text-xs text-slate-300">
                          Check your inbox at <span className="font-semibold">{forgotEmail}</span> for instructions.
                        </p>
                      </div>
                    ) : (
                      <form onSubmit={handleForgotSubmit} className="space-y-4">
                        <div>
                          <label className="block text-xs font-semibold mb-1">Email Address</label>
                          <div className="relative">
                            <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                            <input
                              type="email"
                              value={forgotEmail}
                              onChange={(e) => setForgotEmail(e.target.value)}
                              placeholder="student@upsc.org"
                              className={`w-full pl-9 pr-3 py-2.5 rounded-xl text-xs border outline-none transition-colors ${
                                isDarkMode
                                  ? 'bg-[#232636] border-[#2E3248] text-white focus:border-[#635BFF]'
                                  : 'bg-white border-[#E2E5F0] text-slate-900 focus:border-[#635BFF]'
                              }`}
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={forgotLoading}
                          className="w-full py-3 px-4 rounded-xl bg-[#635BFF] hover:bg-indigo-700 text-white font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2"
                        >
                          {forgotLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <span>Reset Password</span>
                          )}
                        </button>
                      </form>
                    )}

                    <div className="text-center">
                      <button
                        onClick={() => setCurrentRoute('login')}
                        className="text-xs font-bold text-[#635BFF] hover:underline inline-flex items-center gap-1"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Back to Sign In</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* SCREEN 6: MAIN APP (5-Tab BottomNav Scaffold) */}
              {currentRoute === 'mainApp' && (
                <div
                  className={`flex-1 flex flex-col transition-colors duration-300 ${
                    isDarkMode ? 'bg-[#0F111A] text-[#E4E6F2]' : 'bg-[#F8F9FE] text-[#1A1C24]'
                  }`}
                >
                  {/* 1. SudhaAppBar Component */}
                  <div
                    className={`h-16 px-4 flex items-center justify-between border-b transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#635BFF] via-[#8E2DE2] to-[#00B4D8] p-1 flex items-center justify-center text-white shadow-md">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-bold text-base tracking-tight">{currentMainScreen?.title || 'SudhaAI'}</h2>
                        <span className="text-[10px] text-slate-400 font-medium">SudhaAI • Material 3</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDarkMode
                            ? 'bg-[#232636] text-amber-400 hover:bg-slate-700'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                        title="Theme Toggle"
                      >
                        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={handleLogout}
                        className="px-2.5 py-1 text-[11px] font-semibold bg-red-500/10 text-red-400 rounded-lg border border-red-500/20 hover:bg-red-500/20"
                        title="Sign Out"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>

                  {/* 2. Active Screen Content */}
                  <div className="flex-1 p-4 md:p-5 overflow-y-auto space-y-6">
                    {activeTab === 'home' && (
                      /* HOME DASHBOARD TAB - FIRESTORE SYNCED */
                      <div className="space-y-6">
                        {/* 1. Greeting Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#635BFF] via-[#8E2DE2] to-[#00B4D8] p-0.5 shadow-lg shadow-indigo-500/30">
                                <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-base text-[#635BFF] ${isDarkMode ? 'bg-[#181A26]' : 'bg-white'}`}>
                                  {userDoc?.name
                                    ? userDoc.name.substring(0, 2).toUpperCase()
                                    : authUser?.displayName
                                    ? authUser.displayName.substring(0, 2).toUpperCase()
                                    : 'AS'}
                                </div>
                              </div>
                              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className={isDarkMode ? 'text-slate-400' : 'text-slate-600'}>Good Day,</span>
                                <span className="font-bold">
                                  {userDoc?.name || authUser?.displayName || authUser?.email?.split('@')[0] || 'Aspirant'}
                                </span>
                                <span>👋</span>
                              </div>
                              <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[#635BFF] text-[10px] font-bold mt-0.5">
                                {userDoc?.targetExam || 'UPSC CSE 2026 • UKPSC'}
                              </span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleLogStudySession(1.0)}
                            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#635BFF] to-[#8E2DE2] text-white text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Log 1h Study</span>
                          </button>
                        </div>

                        {/* 2. Today's Study Progress Card (Firestore Synced) */}
                        <div className={`p-5 rounded-[20px] border relative overflow-hidden shadow-xl transition-all ${
                          isDarkMode
                            ? 'bg-gradient-to-br from-[#1E1C38] to-[#141829] border-indigo-500/30'
                            : 'bg-gradient-to-br from-[#F3F1FF] to-[#EBE8FF] border-indigo-200'
                        }`}>
                          <div className="flex items-center justify-between mb-4">
                            <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#635BFF] to-[#8E2DE2] text-white text-[10px] font-bold tracking-wider flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              FIRESTORE PROGRESS: {studyProgress?.totalStudyHours ?? 42.5} HOURS
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-500">
                              ● Live Synced
                            </span>
                          </div>

                          <div className="flex items-center gap-4 mb-4">
                            <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                              <svg className="w-20 h-20 transform -rotate-90">
                                <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className={isDarkMode ? 'text-indigo-950/60' : 'text-indigo-200/60'} fill="transparent" />
                                <circle cx="40" cy="40" r="32" stroke="#635BFF" strokeWidth="6" strokeDasharray="201" strokeDashoffset={201 - (201 * Math.min((studyProgress?.totalStudyHours ?? 42.5) / 100, 1))} strokeLinecap="round" fill="transparent" />
                              </svg>
                              <div className="absolute flex flex-col items-center justify-center text-center">
                                <span className="font-bold text-sm leading-none">{studyProgress?.currentStreak ?? 14}d</span>
                                <span className="text-[9px] text-slate-400 mt-0.5">Streak 🔥</span>
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <span className="text-[10px] font-semibold text-[#635BFF] block uppercase tracking-wider">Current Exam Target</span>
                              <h4 className="font-bold text-sm truncate">{userDoc?.targetExam || 'UPSC CSE 2026'} ({userDoc?.examYear || 2026})</h4>
                              <p className={`text-xs truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                {studyProgress?.completedTopics ?? 28} Syllabus Topics Completed
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => handleLogStudySession(1.0)}
                            className="w-full py-3 px-4 rounded-xl bg-[#635BFF] hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all"
                          >
                            <Play className="w-4 h-4 fill-white" />
                            <span>Log Study Hour to Firestore</span>
                          </button>
                        </div>

                        {/* 3. Study Statistics Grid */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-sm">Firestore Real-time Metrics</h3>
                            <span className="text-[11px] font-bold text-emerald-400">Owner-Locked</span>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { label: 'Total Study Hours', val: `${studyProgress?.totalStudyHours ?? 42.5} hrs`, sub: 'study_progress collection', badge: 'Active', color: 'text-[#635BFF]' },
                              { label: 'Current Streak', val: `${studyProgress?.currentStreak ?? 14} Days`, sub: 'Daily Study Chain', badge: '🔥 Hot', color: 'text-red-400' },
                              { label: 'Completed Topics', val: `${studyProgress?.completedTopics ?? 28} Units`, sub: 'Syllabus Tracker', badge: 'Done', color: 'text-emerald-400' },
                              { label: 'Target Exam Year', val: `${userDoc?.examYear ?? 2026}`, sub: 'users collection', badge: 'Target', color: 'text-cyan-400' },
                            ].map((st, i) => (
                              <div
                                key={i}
                                className={`p-3.5 rounded-[20px] border flex flex-col justify-between ${
                                  isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className={`text-xs font-bold ${st.color}`}>{st.label}</span>
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 ${st.color}`}>
                                    {st.badge}
                                  </span>
                                </div>
                                <span className="font-bold text-lg leading-tight">{st.val}</span>
                                <span className={`text-[10px] mt-0.5 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{st.sub}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 4. Gemini AI Foundation Engine (Milestone 6) */}
                        <div className={`p-4 rounded-[22px] border ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-5 h-5 text-amber-400" />
                              <div>
                                <h3 className="font-bold text-sm">Gemini AI Foundation</h3>
                                <p className="text-[10px] text-slate-400">gemini-3.6-flash • Centralized AIService • Retry & Timeout Engine</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          </div>

                          <p className={`text-xs mb-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Test prompt templates with retry logic, cancellation support, and structured schema responses:
                          </p>

                          {/* Quick AI Test Buttons */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
                            <button
                              onClick={handleTestAiPlanner}
                              disabled={isAiLoading}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                activeAiTest === 'STUDY_PLANNER' && isAiLoading
                                  ? 'border-[#635BFF] bg-[#635BFF]/10'
                                  : isDarkMode ? 'bg-[#232636] border-[#2E3248] hover:border-[#635BFF]' : 'bg-slate-50 border-slate-200 hover:border-[#635BFF]'
                              }`}
                            >
                              <div className="font-bold text-xs flex items-center gap-1.5 text-[#635BFF]">
                                <Calendar className="w-3.5 h-3.5" />
                                <span>Study Planner</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Generate Timetable</span>
                            </button>

                            <button
                              onClick={handleTestAiSummary}
                              disabled={isAiLoading}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                activeAiTest === 'PDF_SUMMARY' && isAiLoading
                                  ? 'border-cyan-500 bg-cyan-500/10'
                                  : isDarkMode ? 'bg-[#232636] border-[#2E3248] hover:border-cyan-500' : 'bg-slate-50 border-slate-200 hover:border-cyan-500'
                              }`}
                            >
                              <div className="font-bold text-xs flex items-center gap-1.5 text-cyan-400">
                                <FileText className="w-3.5 h-3.5" />
                                <span>PDF Summary</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">High-Yield Notes</span>
                            </button>

                            <button
                              onClick={handleTestAiQuiz}
                              disabled={isAiLoading}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                activeAiTest === 'QUIZ_GENERATOR' && isAiLoading
                                  ? 'border-purple-500 bg-purple-500/10'
                                  : isDarkMode ? 'bg-[#232636] border-[#2E3248] hover:border-purple-500' : 'bg-slate-50 border-slate-200 hover:border-purple-500'
                              }`}
                            >
                              <div className="font-bold text-xs flex items-center gap-1.5 text-purple-400">
                                <BrainCircuit className="w-3.5 h-3.5" />
                                <span>Quiz Engine</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">MCQs & Rationale</span>
                            </button>

                            <button
                              onClick={handleTestAiFlashcards}
                              disabled={isAiLoading}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                activeAiTest === 'FLASHCARDS' && isAiLoading
                                  ? 'border-amber-500 bg-amber-500/10'
                                  : isDarkMode ? 'bg-[#232636] border-[#2E3248] hover:border-amber-500' : 'bg-slate-50 border-slate-200 hover:border-amber-500'
                              }`}
                            >
                              <div className="font-bold text-xs flex items-center gap-1.5 text-amber-400">
                                <Layers className="w-3.5 h-3.5" />
                                <span>Flashcards</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Active Recall Deck</span>
                            </button>

                            <button
                              onClick={handleTestAiRevision}
                              disabled={isAiLoading}
                              className={`p-2.5 rounded-xl border text-left transition-all col-span-2 sm:col-span-1 ${
                                activeAiTest === 'REVISION_PLANNER' && isAiLoading
                                  ? 'border-emerald-500 bg-emerald-500/10'
                                  : isDarkMode ? 'bg-[#232636] border-[#2E3248] hover:border-emerald-500' : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                              }`}
                            >
                              <div className="font-bold text-xs flex items-center gap-1.5 text-emerald-400">
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Revision Roadmap</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Spaced Repetition</span>
                            </button>
                          </div>

                          {/* Loading State & Cancel Button */}
                          {isAiLoading && (
                            <div className="p-3 rounded-xl bg-[#635BFF]/10 border border-[#635BFF]/30 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <RefreshCw className="w-4 h-4 text-[#635BFF] animate-spin" />
                                <div>
                                  <span className="text-xs font-bold text-[#635BFF] block leading-tight">Executing {activeAiTest} Prompt...</span>
                                  <span className="text-[10px] text-slate-400">Centralized AIRepository with timeout & backoff</span>
                                </div>
                              </div>
                              <button
                                onClick={cancelAI}
                                className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 text-[11px] font-bold border border-red-500/30"
                              >
                                Cancel
                              </button>
                            </div>
                          )}

                          {/* AI Error Display */}
                          {aiError && !isAiLoading && (
                            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
                              <div className="flex items-center justify-between text-red-400 font-bold text-xs">
                                <span>AI Error: {aiError.code}</span>
                                <button onClick={resetAI} className="text-[10px] underline">Dismiss</button>
                              </div>
                              <p className="text-[11px] text-red-300">{aiError.message}</p>
                            </div>
                          )}

                          {/* AI Result Display */}
                          {aiResponse && aiResponse.success && !isAiLoading && (
                            <div className={`mt-3 p-3 rounded-xl border space-y-2 ${isDarkMode ? 'bg-[#11131F] border-[#2E3248]' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="flex items-center justify-between border-b pb-1.5 border-slate-700/50">
                                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                                  <CheckCircle className="w-3.5 h-3.5" />
                                  <span>{aiResponse.meta.promptType} Response</span>
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  {aiResponse.meta.latencyMs}ms • {aiResponse.meta.model}
                                </span>
                              </div>
                              <pre className="text-[10px] font-mono max-h-48 overflow-y-auto p-2 rounded bg-black/40 text-emerald-300 whitespace-pre-wrap">
                                {JSON.stringify(aiData, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {activeTab === 'planner' && (
                      /* PLANNER TAB - FIRESTORE study_plans COLLECTION */
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-base flex items-center gap-2">
                              <Calendar className="w-5 h-5 text-[#635BFF]" />
                              Firestore Study Plans
                            </h3>
                            <p className="text-xs text-slate-400">collection: study_plans ({studyPlans.length} plans)</p>
                          </div>

                          <button
                            onClick={() => setShowAddPlanModal(true)}
                            className="px-3 py-2 rounded-xl bg-[#635BFF] hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>New Plan</span>
                          </button>
                        </div>

                        {/* Modal to add plan */}
                        {showAddPlanModal && (
                          <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="font-bold text-xs text-[#635BFF]">Add Plan to Firestore</h4>
                              <button onClick={() => setShowAddPlanModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={handleAddStudyPlan} className="space-y-3">
                              <input
                                type="text"
                                placeholder="Plan Title (e.g. Laxmikanth Polity Revision)"
                                value={newPlanTitle}
                                onChange={(e) => setNewPlanTitle(e.target.value)}
                                className={`w-full p-2.5 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="date"
                                  value={newPlanTargetDate}
                                  onChange={(e) => setNewPlanTargetDate(e.target.value)}
                                  className={`p-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                                <input
                                  type="text"
                                  placeholder="Subjects (comma separated)"
                                  value={newPlanSubjects}
                                  onChange={(e) => setNewPlanSubjects(e.target.value)}
                                  className={`p-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                              </div>
                              <button type="submit" className="w-full py-2 bg-[#635BFF] text-white text-xs font-bold rounded-xl shadow-md">
                                Save Plan to Firestore
                              </button>
                            </form>
                          </div>
                        )}

                        {/* List of study plans from Firestore */}
                        {studyPlans.length === 0 ? (
                          <div className={`p-6 rounded-2xl border text-center space-y-2 ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                            <Calendar className="w-8 h-8 text-indigo-400 mx-auto" />
                            <h4 className="font-bold text-sm">No Study Plans Saved Yet</h4>
                            <p className="text-xs text-slate-400">Click "New Plan" to save your first timetable directly to Firestore.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {studyPlans.map((plan) => (
                              <div
                                key={plan.id}
                                className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                                  plan.completed
                                    ? 'opacity-60 bg-slate-950/20 border-emerald-500/30'
                                    : isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="checkbox"
                                    checked={plan.completed}
                                    onChange={() => handleTogglePlan(plan.id!, plan.completed)}
                                    className="w-4 h-4 rounded text-[#635BFF] focus:ring-0 cursor-pointer"
                                  />
                                  <div>
                                    <h4 className={`font-bold text-xs ${plan.completed ? 'line-through text-slate-400' : ''}`}>
                                      {plan.title}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-[10px] text-indigo-400 font-semibold flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        Target: {plan.targetDate}
                                      </span>
                                      {plan.subjects?.map((sub, sIdx) => (
                                        <span key={sIdx} className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 font-bold">
                                          {sub}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleDeletePlan(plan.id!)}
                                  className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-500/10"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'pdf' && (
                      <PdfIntelligenceEngine
                        uid={authUser?.uid || 'guest_aspirant'}
                        isDarkMode={isDarkMode}
                      />
                    )}

                    {activeTab === 'notes' && (
                      /* NOTES TAB - FIRESTORE notes COLLECTION */
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-base flex items-center gap-2">
                              <BookOpen className="w-5 h-5 text-cyan-400" />
                              Smart Notes Vault
                            </h3>
                            <p className="text-xs text-slate-400">collection: notes ({notes.length} notes saved)</p>
                          </div>

                          <button
                            onClick={() => setShowAddNoteModal(true)}
                            className="px-3 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>New Note</span>
                          </button>
                        </div>

                        {/* Modal to add note */}
                        {showAddNoteModal && (
                          <div className={`p-4 rounded-2xl border space-y-3 ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                            <div className="flex items-center justify-between border-b pb-2">
                              <h4 className="font-bold text-xs text-cyan-400">Create Smart Note in Firestore</h4>
                              <button onClick={() => setShowAddNoteModal(false)} className="text-slate-400"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={handleAddNote} className="space-y-3">
                              <input
                                type="text"
                                placeholder="Note Title (e.g. Fundamental Rights - Article 19)"
                                value={newNoteTitle}
                                onChange={(e) => setNewNoteTitle(e.target.value)}
                                className={`w-full p-2.5 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  placeholder="Subject (e.g. Polity & Constitution)"
                                  value={newNoteSubject}
                                  onChange={(e) => setNewNoteSubject(e.target.value)}
                                  className={`p-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                                <input
                                  type="text"
                                  placeholder="Tags (comma separated e.g. GS2, Mains)"
                                  value={newNoteTags}
                                  onChange={(e) => setNewNoteTags(e.target.value)}
                                  className={`p-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                                />
                              </div>
                              <textarea
                                placeholder="Note Content / Key Takeaways..."
                                rows={3}
                                value={newNoteContent}
                                onChange={(e) => setNewNoteContent(e.target.value)}
                                className={`w-full p-2.5 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                              />
                              <button type="submit" className="w-full py-2 bg-cyan-500 text-slate-950 text-xs font-bold rounded-xl shadow-md">
                                Save Note to Firestore
                              </button>
                            </form>
                          </div>
                        )}

                        {/* List of notes from Firestore */}
                        {notes.length === 0 ? (
                          <div className={`p-6 rounded-2xl border text-center space-y-2 ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                            <FileText className="w-8 h-8 text-cyan-400 mx-auto" />
                            <h4 className="font-bold text-sm">Notes Vault Empty</h4>
                            <p className="text-xs text-slate-400">Click "New Note" to save study summaries and flash notes to Firestore.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {notes.map((note) => (
                              <div
                                key={note.id}
                                className={`p-4 rounded-2xl border space-y-2 ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}
                              >
                                <div className="flex items-start justify-between">
                                  <div>
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold">
                                      {note.subject}
                                    </span>
                                    <h4 className="font-bold text-xs mt-1">{note.title}</h4>
                                  </div>
                                  <button
                                    onClick={() => handleDeleteNote(note.id!)}
                                    className="p-1 text-slate-400 hover:text-red-400"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {note.content}
                                </p>
                                <div className="flex items-center gap-1.5 pt-1">
                                  {note.tags?.map((t, idx) => (
                                    <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'analytics' && (
                      /* ANALYTICS TAB - FIRESTORE DATA VISUALIZATION */
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-base flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-emerald-400" />
                            Study Analytics & Streaks
                          </h3>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                            Live Synced
                          </span>
                        </div>

                        <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                          <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Weekly Progress Breakdown</h4>
                          <div className="flex items-end justify-between gap-2 h-28 pt-4">
                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, dIdx) => {
                              const val = (studyProgress?.weeklyProgress?.[dIdx] ?? [4.5, 6, 5.2, 7, 3.5, 8, 6.5][dIdx]);
                              const heightPct = Math.min((val / 10) * 100, 100);
                              return (
                                <div key={day} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                                  <span className="text-[9px] text-slate-400 font-bold">{val}h</span>
                                  <div className="w-full bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-20">
                                    <div
                                      style={{ height: `${heightPct}%` }}
                                      className="w-full bg-gradient-to-t from-[#635BFF] to-[#00B4D8] rounded-t-lg transition-all duration-500"
                                    />
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-semibold">{day}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                            <span className="text-xs text-slate-400 font-semibold">Total Hours</span>
                            <h3 className="text-xl font-bold mt-1 text-[#635BFF]">{studyProgress?.totalStudyHours ?? 42.5} hrs</h3>
                            <span className="text-[10px] text-emerald-400 font-bold">Firestore Verified</span>
                          </div>

                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                            <span className="text-xs text-slate-400 font-semibold">Current Streak</span>
                            <h3 className="text-xl font-bold mt-1 text-red-400">🔥 {studyProgress?.currentStreak ?? 14} Days</h3>
                            <span className="text-[10px] text-slate-400">Personal Record</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'profile' && (
                      /* PROFILE TAB - FIRESTORE users COLLECTION */
                      <div className="space-y-5">
                        <div className={`p-5 rounded-2xl border relative space-y-4 ${isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'}`}>
                          <div className="flex items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#635BFF] to-[#00B4D8] p-0.5 shadow-lg">
                              <div className={`w-full h-full rounded-full flex items-center justify-center font-bold text-lg text-[#635BFF] ${isDarkMode ? 'bg-[#181A26]' : 'bg-white'}`}>
                                {userDoc?.name
                                  ? userDoc.name.substring(0, 2).toUpperCase()
                                  : authUser?.displayName
                                  ? authUser.displayName.substring(0, 2).toUpperCase()
                                  : 'AS'}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-bold text-base">{userDoc?.name || authUser?.displayName || 'Aspirant'}</h3>
                              <p className="text-xs text-slate-400">{userDoc?.email || authUser?.email}</p>
                              <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[#635BFF] text-[10px] font-bold">
                                {userDoc?.targetExam || 'UPSC CSE 2026 • UKPSC'}
                              </span>
                            </div>
                          </div>

                          <div className="pt-3 border-t border-slate-800 space-y-3">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Exam Year Target:</span>
                              <span className="font-bold">{userDoc?.examYear || 2026}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400">Firestore UID:</span>
                              <span className="font-mono text-[10px] text-indigo-400 truncate max-w-[150px]">{authUser?.uid}</span>
                            </div>
                          </div>

                          {!isEditingProfile ? (
                            <button
                              onClick={() => setIsEditingProfile(true)}
                              className="w-full py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-[#635BFF] font-bold text-xs rounded-xl border border-indigo-500/20 transition-colors"
                            >
                              Edit Profile in Firestore
                            </button>
                          ) : (
                            <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Exam</label>
                                <input
                                  type="text"
                                  value={editTargetExam}
                                  onChange={(e) => setEditTargetExam(e.target.value)}
                                  className={`w-full p-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200'}`}
                                />
                              </div>
                              <div>
                                <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Year</label>
                                <input
                                  type="number"
                                  value={editExamYear}
                                  onChange={(e) => setEditExamYear(parseInt(e.target.value, 10))}
                                  className={`w-full p-2 rounded-xl text-xs border outline-none ${isDarkMode ? 'bg-[#232636] border-[#2E3248] text-white' : 'bg-slate-50 border-slate-200'}`}
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  type="submit"
                                  className="flex-1 py-2 bg-[#635BFF] text-white font-bold text-xs rounded-xl"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setIsEditingProfile(false)}
                                  className="px-3 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded-xl"
                                >
                                  Cancel
                                </button>
                              </div>
                            </form>
                          )}
                        </div>

                        <button
                          onClick={handleLogout}
                          className="w-full py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out of SudhaAI</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 3. Bottom Navigation Scaffold (5 Tabs) */}
                  <div
                    className={`h-16 px-2 flex items-center justify-around border-t transition-colors duration-300 ${
                      isDarkMode ? 'bg-[#181A26] border-[#2E3248]' : 'bg-white border-[#E2E5F0]'
                    }`}
                  >
                    <button
                      onClick={() => setActiveTab('home')}
                      className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                        activeTab === 'home'
                          ? 'text-[#635BFF] font-semibold'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <LayoutGrid className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Home</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('planner')}
                      className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                        activeTab === 'planner'
                          ? 'text-[#635BFF] font-semibold'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <Calendar className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Planner</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('pdf')}
                      className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                        activeTab === 'pdf'
                          ? 'text-[#635BFF] font-semibold'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <FileText className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">AI PDF</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('notes')}
                      className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                        activeTab === 'notes'
                          ? 'text-[#635BFF] font-semibold'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <BookOpen className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Notes</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('analytics')}
                      className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                        activeTab === 'analytics'
                          ? 'text-[#635BFF] font-semibold'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <TrendingUp className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Analytics</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all ${
                        activeTab === 'profile'
                          ? 'text-[#635BFF] font-semibold'
                          : isDarkMode
                          ? 'text-slate-400 hover:text-slate-200'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      <User className="w-5 h-5" />
                      <span className="text-[10px] mt-0.5">Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: FLUTTER CODE INSPECTOR */}
        {mainView === 'code' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-950">
            {/* File Tree Sidebar */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-slate-800 bg-slate-900/50 p-4 flex flex-col overflow-y-auto shrink-0">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Folder className="w-4 h-4 text-indigo-400" />
                SudhaAI Flutter Codebase
              </h3>

              <div className="space-y-1">
                {FLUTTER_FILES.map((file) => {
                  const isSelected = selectedFile.path === file.path;
                  return (
                    <button
                      key={file.path}
                      onClick={() => setSelectedFile(file)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white font-medium shadow-md'
                          : 'text-slate-400 hover:bg-slate-800/80 hover:text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-indigo-400'}`} />
                        <span className="truncate">{file.name}</span>
                      </div>
                      <span className="text-[10px] opacity-60 font-mono uppercase">{file.category}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code Viewer Panel */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
              <div className="h-12 border-b border-slate-800 bg-slate-900/80 px-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 font-mono text-xs text-indigo-300">
                  <FileCode className="w-4 h-4 text-indigo-400" />
                  <span>{selectedFile.path}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCode(selectedFile.content)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-auto font-mono text-xs leading-relaxed text-slate-300 bg-slate-950">
                <pre className="whitespace-pre-wrap select-text">{selectedFile.content}</pre>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: CLEAN ARCHITECTURE SYSTEM BLUEPRINT */}
        {mainView === 'architecture' && (
          <div className="flex-1 p-6 md:p-10 bg-slate-950 overflow-y-auto space-y-8 max-w-6xl mx-auto w-full">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Milestone 2 - Authentication Module Blueprint</h2>
              <p className="text-slate-400 text-sm">
                Production-ready Flutter Clean Architecture implementation for SudhaAI Auth Module (UPSC & UKPSC Mentor).
              </p>
            </div>

            {/* Architecture Layers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">1. Splash Screen</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Animated logo scale & fade entrance, custom tagline "Your Personal AI Mentor for UPSC & UKPSC", auto-timer navigation.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-purple-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">2. Welcome Screen</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Vector hero banner with AI badge, Get Started button, Login route button, and Guest Explore pathway.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <LockKeyhole className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">3. Login & Sign Up</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Email & password fields, password visibility toggles, form validation, Google Sign-In button, and route switching.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/50 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                  <KeyRound className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-white text-base mb-1">4. Forgot Password</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Email verification input, reset submission simulation, success feedback banner, and back to sign in navigation.
                </p>
              </div>
            </div>

            {/* Future Integration Specs */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-indigo-500/30 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Milestone 3 Extension Readiness</h3>
                  <p className="text-xs text-slate-400">Clean architecture contract ready for Firebase Auth SDK</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                  <Database className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">FirebaseAuth Repository Integration</h4>
                    <p className="text-xs text-slate-400">
                      The forms are bound to `SudhaTextField` with validation ready for `FirebaseAuth.instance.signInWithEmailAndPassword` and `createUserWithEmailAndPassword`.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-sm text-white mb-1">Google OAuth Credentials</h4>
                    <p className="text-xs text-slate-400">
                      `Google Sign-In` button structure prepared for `google_sign_in` package and OAuth token exchanges.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
