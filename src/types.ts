export interface Question {
  id: number;
  question: string;
  imageUrl?: string;
  options: string[];
  optionImages?: (string | undefined)[];
  correctAnswer: number;
}

export interface StudentInfo {
  studentCode: string;
  name: string;
  studentClass: string;
  participantType?: 'student' | 'other';
}

export interface QuizQuestionDetail {
  id: number;
  question: string;
  imageUrl?: string;
  options: string[];
  optionImages?: (string | undefined)[];
  correctAnswer: number;
  selectedAnswer: number; // 0..3 or -1 if unselected
  isCorrect: boolean;
}

export interface StudentResult {
  id: string;
  studentCode: string;
  name: string;
  studentClass: string;
  participantType?: 'student' | 'other';
  score: number;
  total: number;
  percentage: number;
  evaluation: string;
  submittedAt: string;
  answers: Record<number, number>;
  timeSpentFormatted?: string;
  autoSubmitted?: boolean;
  quizDetails?: QuizQuestionDetail[];
}

export interface QuizTimerConfig {
  enabled: boolean;
  durationMinutes: number;
  durationSeconds?: number;
}

export type AppState = 'registration' | 'quiz' | 'result' | 'admin_login' | 'admin_portal';
