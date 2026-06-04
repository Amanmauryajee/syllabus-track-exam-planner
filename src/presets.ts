import { GoalSetupData, Subject, Chapter, TaskLog, StudySessionLog, Backlog, AppNotification } from './types';
import { getDateOffsetStr } from './utils';

// Generate a sample preparation plan for AFCAT
export const INITIAL_GOAL: GoalSetupData = {
  examName: 'AFCAT 2026',
  examDate: getDateOffsetStr(60), // 60 days from today
  studyStartDate: getDateOffsetStr(-15), // Started 15 days ago
  dailyHoursGoal: 4
};

export const INITIAL_SUBJECTS: Subject[] = [
  { id: 'sub-1', name: 'Mathematics', color: '#10b981' }, // emerald
  { id: 'sub-2', name: 'English Verbal', color: '#3b82f6' }, // blue
  { id: 'sub-3', name: 'Reasoning Aptitude', color: '#8b5cf6' }, // violet
  { id: 'sub-4', name: 'General Awareness', color: '#f59e0b' } // amber
];

export const INITIAL_CHAPTERS: Chapter[] = [
  // Math
  { id: 'ch-1', subjectId: 'sub-1', name: 'Ratio & Proportion', questionTarget: 150, theoryCompleted: true },
  { id: 'ch-2', subjectId: 'sub-1', name: 'Percentage Problems', questionTarget: 200, theoryCompleted: true },
  { id: 'ch-3', subjectId: 'sub-1', name: 'Profit & Loss', questionTarget: 150, theoryCompleted: false },
  { id: 'ch-4', subjectId: 'sub-1', name: 'Time & Work', questionTarget: 180, theoryCompleted: false },
  // English
  { id: 'ch-5', subjectId: 'sub-2', name: 'Comprehension passages', questionTarget: 100, theoryCompleted: true },
  { id: 'ch-6', subjectId: 'sub-2', name: 'Synonyms & Antonyms', questionTarget: 250, theoryCompleted: true },
  { id: 'ch-7', subjectId: 'sub-2', name: 'Error Spotting rules', questionTarget: 150, theoryCompleted: false },
  // Reasoning
  { id: 'ch-8', subjectId: 'sub-3', name: 'Coding Decoding', questionTarget: 120, theoryCompleted: true },
  { id: 'ch-9', subjectId: 'sub-3', name: 'Venn Diagrams', questionTarget: 100, theoryCompleted: true },
  { id: 'ch-10', subjectId: 'sub-3', name: 'Analogy & Classification', questionTarget: 80, theoryCompleted: false },
  // General Awareness
  { id: 'ch-11', subjectId: 'sub-4', name: 'History (Modern India)', questionTarget: 200, theoryCompleted: true },
  { id: 'ch-12', subjectId: 'sub-4', name: 'General Science Core', questionTarget: 150, theoryCompleted: false },
  { id: 'ch-13', subjectId: 'sub-4', name: 'Defense & Current Affairs', questionTarget: 300, theoryCompleted: false }
];

export const INITIAL_TASKS: TaskLog[] = [
  // 3 days ago - Ratio Questions Completed
  {
    id: 'task-1',
    date: getDateOffsetStr(-3),
    name: 'Practice Ratio level 1 questions',
    type: 'questions',
    subjectId: 'sub-1',
    chapterId: 'ch-1',
    completed: true,
    actualQuestions: { attempted: 100, correct: 92, wrong: 8 }
  },
  // 3 days ago - History theory and reading
  {
    id: 'task-2',
    date: getDateOffsetStr(-3),
    name: 'Read History 1857 Revolt Theory',
    type: 'theory',
    subjectId: 'sub-4',
    chapterId: 'ch-11',
    completed: true
  },
  // 2 days ago - Percentage Questions
  {
    id: 'task-3',
    date: getDateOffsetStr(-2),
    name: 'Percentage intermediate test practice',
    type: 'questions',
    subjectId: 'sub-1',
    chapterId: 'ch-2',
    completed: true,
    actualQuestions: { attempted: 80, correct: 43, wrong: 37 } // low accuracy topic example
  },
  // 1 day ago (Yesterday) - Coding theory
  {
    id: 'task-4',
    date: getDateOffsetStr(-1),
    name: 'Learn Coding-Decoding basics',
    type: 'theory',
    subjectId: 'sub-3',
    chapterId: 'ch-8',
    completed: true
  },
  // 1 day ago - Synonyms MCQ practice
  {
    id: 'task-5',
    date: getDateOffsetStr(-1),
    name: 'Practice synonyms list 1-50',
    type: 'questions',
    subjectId: 'sub-2',
    chapterId: 'ch-6',
    completed: true,
    actualQuestions: { attempted: 60, correct: 54, wrong: 6 } // high accuracy topic example
  },
  // Today's active blank tasks (planned)
  {
    id: 'task-6',
    date: getDateOffsetStr(0),
    name: 'Study Profit & Loss concepts',
    type: 'theory',
    subjectId: 'sub-1',
    chapterId: 'ch-3',
    completed: false
  },
  {
    id: 'task-7',
    date: getDateOffsetStr(0),
    name: 'Practice Profit & Loss basic 30 questions',
    type: 'questions',
    subjectId: 'sub-1',
    chapterId: 'ch-3',
    completed: false
  }
];

export const INITIAL_STUDY_LOGS: StudySessionLog[] = [
  // 4 days ago
  { id: 'log-1', date: getDateOffsetStr(-4), subjectId: 'sub-1', durationMinutes: 240 }, // 4h
  // 3 days ago
  { id: 'log-2', date: getDateOffsetStr(-3), subjectId: 'sub-1', durationMinutes: 180 }, // 3h
  { id: 'log-3', date: getDateOffsetStr(-3), subjectId: 'sub-4', durationMinutes: 120 }, // 2h (5h total)
  // 2 days ago
  { id: 'log-4', date: getDateOffsetStr(-2), subjectId: 'sub-1', durationMinutes: 150 }, // 2.5h
  // Yesterday (1 day ago)
  { id: 'log-5', date: getDateOffsetStr(-1), subjectId: 'sub-3', durationMinutes: 120 }, // 2h
  { id: 'log-6', date: getDateOffsetStr(-1), subjectId: 'sub-2', durationMinutes: 180 }  // 3h (5h total)
];

export const INITIAL_BACKLOGS: Backlog[] = [
  {
    id: 'back-1',
    originalDate: getDateOffsetStr(-2),
    taskName: 'Error Spotting grammatical rules',
    taskType: 'theory',
    subjectId: 'sub-2',
    chapterId: 'ch-7',
    status: 'pending'
  },
  {
    id: 'back-2',
    originalDate: getDateOffsetStr(-1),
    taskName: 'General Science Physics notes',
    taskType: 'theory',
    subjectId: 'sub-4',
    chapterId: 'ch-12',
    status: 'pending'
  }
];

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    type: 'countdown',
    message: '🚨 60 Days left until your AFCAT 2026 exam! Optimize daily questions target to cross 85% score.',
    timestamp: 'Just now',
    read: false
  },
  {
    id: 'notif-2',
    type: 'warning',
    message: '⚠️ Warning: Average accuracy for Percentage Problems chapter is only 54%. Tagged as "Weak Topic".',
    timestamp: '2 hours ago',
    read: false
  },
  {
    id: 'notif-3',
    type: 'info',
    message: '📊 Weekly report reminder: Your study hours increased from 4.0h/day to 5.0h/day (+25.0% performance boost).',
    timestamp: 'Yesterday',
    read: true
  }
];
