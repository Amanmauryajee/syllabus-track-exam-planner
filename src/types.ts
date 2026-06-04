export interface GoalSetupData {
  examName: string;
  examDate: string; // YYYY-MM-DD
  studyStartDate: string; // YYYY-MM-DD
  dailyHoursGoal: number; // e.g. 4
}

export interface Subject {
  id: string;
  name: string;
  color: string; // hex or Tailwind color class
}

export interface Chapter {
  id: string;
  subjectId: string;
  name: string;
  questionTarget: number; // e.g. 300
  theoryCompleted: boolean;
}

export interface TaskLog {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  type: 'theory' | 'questions' | 'custom';
  subjectId?: string;
  chapterId?: string;
  questionCount?: number; // Target question count for today
  completed: boolean;
  actualQuestions?: {
    attempted: number;
    correct: number;
    wrong: number;
  };
}

export interface StudySessionLog {
  id: string;
  date: string; // YYYY-MM-DD
  subjectId?: string;
  durationMinutes: number; // stored tracked minutes
}

export interface Backlog {
  id: string;
  originalDate: string; // YYYY-MM-DD
  taskName: string;
  taskType: 'theory' | 'questions' | 'custom';
  subjectId?: string;
  chapterId?: string;
  questionCount?: number;
  status: 'pending' | 'rescheduled' | 'ignored';
  rescheduledDate?: string;
}

export interface AppNotification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'countdown';
  message: string;
  timestamp: string;
  read: boolean;
}
