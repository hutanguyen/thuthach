import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle } from 'lucide-react';
import { QUIZ_QUESTIONS } from './constants';
import { StudentInfo, StudentResult, AppState, Question, QuizTimerConfig } from './types';
import { getEvaluationText } from './utils/excelExport';
import { saveQuestionsToStorage, loadQuestionsFromStorage } from './utils/questionStorage';
import { loadTimerConfig, saveTimerConfig } from './utils/timerStorage';
import { StudentRegistration } from './components/StudentRegistration';
import { QuizView } from './components/QuizView';
import { ResultView } from './components/ResultView';
import { AdminLogin } from './components/AdminLogin';
import { AdminPortal } from './components/AdminPortal';
import { ThemeToggle } from './components/ThemeToggle';
import { SoundToggle } from './components/SoundToggle';
import { soundEngine } from './utils/soundEngine';

const STORAGE_KEY = 'quiz_student_results';
const QUESTIONS_STORAGE_KEY = 'quiz_custom_questions';
const ADMIN_SESSION_KEY = 'quiz_admin_session';
const THEME_STORAGE_KEY = 'quiz_theme_mode';

export default function App() {
  const [state, setState] = useState<AppState>('registration');
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({ studentCode: '', name: '', studentClass: '' });
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  
  // Theme state: light or dark
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme;
      }
    } catch {}
    return 'light';
  });

  // Admin authentication state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Custom or Default Questions
  const [questions, setQuestions] = useState<Question[]>(() => {
    try {
      const saved = localStorage.getItem(QUESTIONS_STORAGE_KEY);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Lỗi khi tải câu hỏi:', e);
    }
    return QUIZ_QUESTIONS;
  });

  const [emptyQuestionsWarning, setEmptyQuestionsWarning] = useState(false);

  // Timer configuration for question sets
  const [timerConfig, setTimerConfig] = useState<QuizTimerConfig>(loadTimerConfig);
  const [quizStartedAt, setQuizStartedAt] = useState<number | null>(null);

  const handleSaveTimerConfig = (newConfig: QuizTimerConfig) => {
    setTimerConfig(newConfig);
    saveTimerConfig(newConfig);
  };

  // Results storage
  const [results, setResults] = useState<StudentResult[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentResult, setCurrentResult] = useState<StudentResult | null>(null);

  // Sync theme
  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {}

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Sync admin authentication to sessionStorage
  useEffect(() => {
    try {
      if (isAdminAuthenticated) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
      }
    } catch (e) {
      console.error('Lỗi lưu phiên làm việc:', e);
    }
  }, [isAdminAuthenticated]);

  // Load custom questions asynchronously from IndexedDB/localStorage
  useEffect(() => {
    loadQuestionsFromStorage().then(loaded => {
      if (Array.isArray(loaded) && loaded.length > 0) {
        setQuestions(loaded);
      }
    }).catch(err => {
      console.error('Lỗi nạp câu hỏi từ storage:', err);
    });
  }, []);

  // Sync questions to persistent storage (IndexedDB + localStorage)
  useEffect(() => {
    saveQuestionsToStorage(questions).catch(e => {
      console.error('Lỗi lưu câu hỏi:', e);
    });
  }, [questions]);

  // Sync results to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (e) {
      console.error('Lỗi lưu kết quả:', e);
    }
  }, [results]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleStartQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    if (studentInfo.name.trim()) {
      if (questions.length === 0) {
        setEmptyQuestionsWarning(true);
        setTimeout(() => setEmptyQuestionsWarning(false), 4000);
        return;
      }
      if (soundEngine.isSoundEnabled()) {
        soundEngine.start();
      }
      setCurrentQuestionIndex(0);
      setAnswers({});
      setQuizStartedAt(Date.now());
      setState('quiz');
    }
  };

  const handleSelectOption = (questionId: number, optionIndex: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = (isAutoSubmitted = false, timeSpentSec?: number) => {
    // Calculate final score based on active questions
    const score = questions.reduce((acc, q) => {
      return answers[q.id] === q.correctAnswer ? acc + 1 : acc;
    }, 0);

    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const evaluation = getEvaluationText(score, total);
    const submittedAt = new Date().toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const isOtherType = studentInfo.participantType === 'other' || (!studentInfo.studentCode && (studentInfo.studentClass === 'Khác' || !studentInfo.studentClass));

    let timeSpentFormatted: string | undefined = undefined;
    if (typeof timeSpentSec === 'number' && timeSpentSec > 0) {
      const m = Math.floor(timeSpentSec / 60);
      const s = timeSpentSec % 60;
      timeSpentFormatted = m > 0 ? `${m} phút ${s} giây` : `${s} giây`;
    }

    const newResult: StudentResult = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      participantType: isOtherType ? 'other' : 'student',
      studentCode: isOtherType ? '' : studentInfo.studentCode.trim(),
      name: studentInfo.name.trim(),
      studentClass: isOtherType ? '' : (studentInfo.studentClass.trim() || 'Khác'),
      score,
      total,
      percentage,
      evaluation,
      submittedAt,
      answers,
      autoSubmitted: isAutoSubmitted,
      timeSpentFormatted,
    };

    setResults(prev => [newResult, ...prev]);
    setCurrentResult(newResult);
    setState('result');
  };

  const handleClearAllResults = () => {
    setResults([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleDeleteSingleResult = (id: string) => {
    setResults(prev => prev.filter(item => item.id !== id));
  };

  const handleRestart = () => {
    setState('registration');
    setStudentInfo({ studentCode: '', name: '', studentClass: '', participantType: 'student' });
    setCurrentQuestionIndex(0);
    setAnswers({});
    setCurrentResult(null);
    setQuizStartedAt(null);
  };

  const handleOpenAdmin = () => {
    if (isAdminAuthenticated) {
      setState('admin_portal');
    } else {
      setState('admin_login');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    setState('admin_portal');
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setState('registration');
  };

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-6 md:p-8 flex flex-col items-center justify-center relative transition-colors duration-300 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 selection:bg-cyan-900 selection:text-cyan-200'
        : 'bg-gradient-to-br from-indigo-50/70 via-sky-50/60 to-emerald-50/70 text-slate-900 selection:bg-emerald-200'
    }`}>
      {/* Top Floating Controls (Âm thanh & Giao diện) - ẩn khi ở Quản trị vì nút đã được cố định ngay phía trên chữ Quản Trị Hệ Thống */}
      {state !== 'admin_portal' && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2.5">
          <SoundToggle theme={theme} />
          <ThemeToggle theme={theme} onToggleTheme={toggleTheme} />
        </div>
      )}

      {/* Cảnh báo khi chưa có câu hỏi */}
      {emptyQuestionsWarning && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 z-50 px-5 py-3.5 rounded-2xl bg-rose-600 text-white shadow-2xl flex items-center gap-3 text-sm font-bold border border-rose-400"
        >
          <AlertCircle size={20} className="flex-shrink-0" />
          <span>Chưa có câu hỏi nào trong bộ đề. Vui lòng vào Quản Trị để thêm câu hỏi!</span>
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {state === 'registration' && (
          <StudentRegistration
            studentInfo={studentInfo}
            setStudentInfo={setStudentInfo}
            onStartQuiz={handleStartQuiz}
            onOpenAdmin={handleOpenAdmin}
            theme={theme}
            timerConfig={timerConfig}
          />
        )}

        {state === 'admin_login' && (
          <AdminLogin
            onLoginSuccess={handleAdminLoginSuccess}
            onBack={() => setState('registration')}
            theme={theme}
          />
        )}

        {state === 'admin_portal' && (
          <AdminPortal
            questions={questions}
            onSaveQuestions={newQuestions => setQuestions(newQuestions)}
            onResetToDefault={() => setQuestions(QUIZ_QUESTIONS)}
            results={results}
            onClearAllResults={handleClearAllResults}
            onDeleteSingleResult={handleDeleteSingleResult}
            onLogout={handleAdminLogout}
            onBackToApp={() => setState('registration')}
            theme={theme}
            onToggleTheme={toggleTheme}
            timerConfig={timerConfig}
            onSaveTimerConfig={handleSaveTimerConfig}
          />
        )}

        {state === 'quiz' && (
          <QuizView
            questions={questions}
            currentQuestionIndex={currentQuestionIndex}
            setCurrentQuestionIndex={setCurrentQuestionIndex}
            answers={answers}
            onSelectOption={handleSelectOption}
            onSubmitQuiz={handleSubmitQuiz}
            theme={theme}
            timerConfig={timerConfig}
            quizStartedAt={quizStartedAt}
          />
        )}

        {state === 'result' && currentResult && (
          <ResultView
            result={currentResult}
            onRestart={handleRestart}
            theme={theme}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
