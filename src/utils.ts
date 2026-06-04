import { GoalSetupData, Subject, Chapter, TaskLog, StudySessionLog, Backlog } from './types';

// Helper: Get local date string 'YYYY-MM-DD'
export function getTodayStr(): string {
  // Use local time instead of UTC to align with user's real-time interaction
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

// Get standard date strings offset from today (for testing or historic viewing)
export function getDateOffsetStr(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const date = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

// Helper: Parse date YYYY-MM-DD to Date object
export function parseDateStr(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Helper: Calculate days between
export function daysBetween(fromStr: string, toStr: string): number {
  try {
    const from = parseDateStr(fromStr);
    const to = parseDateStr(toStr);
    const diffTime = to.getTime() - from.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (e) {
    return 0;
  }
}

// Module 7: Accuracy Formula and Math Helpers
export function calculateAccuracy(attempted: number, correct: number): number {
  if (attempted <= 0) return 0;
  return Math.round((correct / attempted) * 100);
}

// Module 6: Study Time Tracking Aggregator
export function getStudyHoursForRange(
  logs: StudySessionLog[],
  range: 'today' | 'week' | 'month',
  todayStr: string = getTodayStr()
): number {
  const targetDate = parseDateStr(todayStr);
  let totalMinutes = 0;

  logs.forEach(log => {
    try {
      const logDate = parseDateStr(log.date);
      const diffDays = Math.floor((targetDate.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24));

      if (range === 'today') {
        if (log.date === todayStr) {
          totalMinutes += log.durationMinutes;
        }
      } else if (range === 'week') {
        // Last 7 days
        if (diffDays >= 0 && diffDays < 7) {
          totalMinutes += log.durationMinutes;
        }
      } else if (range === 'month') {
        // Last 30 days
        if (diffDays >= 0 && diffDays < 30) {
          totalMinutes += log.durationMinutes;
        }
      }
    } catch {
      // Ignore corrupted entries
    }
  });

  return Math.round((totalMinutes / 60) * 10) / 10;
}

// Aggregated values helper
export function getQuestionCountForRange(
  tasks: TaskLog[],
  range: 'today' | 'week' | 'month',
  todayStr: string = getTodayStr()
): { attempted: number; correct: number; wrong: number } {
  const targetDate = parseDateStr(todayStr);
  let attempted = 0;
  let correct = 0;
  let wrong = 0;

  tasks.forEach(task => {
    if (!task.completed || !task.actualQuestions) return;
    try {
      const taskDate = parseDateStr(task.date);
      const diffDays = Math.floor((targetDate.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));

      const include =
        range === 'today' ? task.date === todayStr :
        range === 'week' ? (diffDays >= 0 && diffDays < 7) :
        (diffDays >= 0 && diffDays < 30);

      if (include) {
        attempted += task.actualQuestions.attempted;
        correct += task.actualQuestions.correct;
        wrong += task.actualQuestions.wrong;
      }
    } catch {
      // Ignore corrupted dates
    }
  });

  return { attempted, correct, wrong };
}

// Module 8: Subject Analysis
export interface SubjectStats {
  subjectId: string;
  name: string;
  color: string;
  attempted: number;
  correct: number;
  wrong: number;
  accuracy: number;
  totalChapters: number;
  completedChapters: number;
}

export function analyzeSubjects(
  subjects: Subject[],
  chapters: Chapter[],
  tasks: TaskLog[]
): { stats: SubjectStats[]; weakestSubject: SubjectStats | null } {
  const statsList: SubjectStats[] = subjects.map(sub => {
    const subChapters = chapters.filter(ch => ch.subjectId === sub.id);
    const subTasks = tasks.filter(t => t.subjectId === sub.id && t.completed && t.actualQuestions);

    let attempted = 0;
    let correct = 0;
    let wrong = 0;

    subTasks.forEach(t => {
      if (t.actualQuestions) {
        attempted += t.actualQuestions.attempted;
        correct += t.actualQuestions.correct;
        wrong += t.actualQuestions.wrong;
      }
    });

    const totalChapters = subChapters.length;
    // Chapter completed means theory completed AND questions completed (or close to target)
    const completedChapters = subChapters.filter(ch => {
      const qDone = tasks
        .filter(t => t.chapterId === ch.id && t.completed && t.type === 'questions')
        .reduce((sum, t) => sum + (t.actualQuestions?.attempted || 0), 0);
      return ch.theoryCompleted && (ch.questionTarget === 0 || qDone >= ch.questionTarget);
    }).length;

    return {
      subjectId: sub.id,
      name: sub.name,
      color: sub.color,
      attempted,
      correct,
      wrong,
      accuracy: attempted > 0 ? calculateAccuracy(attempted, correct) : 0,
      totalChapters,
      completedChapters
    };
  });

  // Calculate weakest subject (Only counts if they attempted at least 1 question)
  const activeStats = statsList.filter(s => s.attempted > 0);
  let weakestSubject: SubjectStats | null = null;
  if (activeStats.length > 0) {
    weakestSubject = activeStats.reduce((prev, current) => {
      // Find the one with lowest accuracy
      return prev.accuracy < current.accuracy ? prev : current;
    });
  } else if (statsList.length > 0) {
    // If no questions attempted yet, fallback to first
    weakestSubject = null;
  }

  return { stats: statsList, weakestSubject };
}

// Module 9: Topic Analysis
export interface TopicStats {
  chapterId: string;
  chapterName: string;
  subjectName: string;
  attempted: number;
  correct: number;
  accuracy: number;
  theoryCompleted: boolean;
  questionTarget: number;
}

export function analyzeTopics(
  subjects: Subject[],
  chapters: Chapter[],
  tasks: TaskLog[]
): { allTopics: TopicStats[]; weakTopics: TopicStats[] } {
  const results: TopicStats[] = chapters.map(ch => {
    const sub = subjects.find(s => s.id === ch.subjectId);
    const chTasks = tasks.filter(t => t.chapterId === ch.id && t.completed && t.actualQuestions);

    let attempted = 0;
    let correct = 0;

    chTasks.forEach(t => {
      if (t.actualQuestions) {
        attempted += t.actualQuestions.attempted;
        correct += t.actualQuestions.correct;
      }
    });

    return {
      chapterId: ch.id,
      chapterName: ch.name,
      subjectName: sub ? sub.name : 'Unknown',
      attempted,
      correct,
      accuracy: attempted > 0 ? calculateAccuracy(attempted, correct) : 0,
      theoryCompleted: ch.theoryCompleted,
      questionTarget: ch.questionTarget
    };
  });

  // Weak topics are those where accuracy is < 60% and have been attempted, or low-scoring active ones.
  // We can sort them by lowest accuracy and return topics below 60% with at least some attempts.
  const weakTopics = results
    .filter(topic => topic.attempted > 0 && topic.accuracy < 65)
    .sort((a, b) => a.accuracy - b.accuracy);

  return { allTopics: results, weakTopics };
}

// Module 13: Consistency and Streak Tracker
export interface ConsistencyInfo {
  dailyHoursGoalAchievedDays: number;
  missedDays: number; // Days in range where they logged 0 min
  streakDays: number;
  achieveRatio: number; // Achieved / Total active days
}

export function calculateConsistency(
  logs: StudySessionLog[],
  goal: GoalSetupData,
  todayStr: string = getTodayStr()
): ConsistencyInfo {
  if (!goal.studyStartDate) {
    return { dailyHoursGoalAchievedDays: 0, missedDays: 0, streakDays: 0, achieveRatio: 0 };
  }

  const startFormatted = goal.studyStartDate;
  const daysDiff = daysBetween(startFormatted, todayStr);
  const totalDays = Math.max(1, daysDiff + 1);

  // Map minutes by date string
  const timeByDate: Record<string, number> = {};
  logs.forEach(log => {
    timeByDate[log.date] = (timeByDate[log.date] || 0) + log.durationMinutes;
  });

  let achievedCount = 0;
  let missedCount = 0;

  // Scan dates from start date up to today
  const targetMin = goal.dailyHoursGoal * 60;

  for (let i = 0; i < totalDays; i++) {
    const curDateStr = getDateOffsetStr(-i); // backwards from today
    const min = timeByDate[curDateStr] || 0;

    if (min >= targetMin) {
      achievedCount++;
    } else if (min === 0) {
      missedCount++;
    }
  }

  // Calculate current streak: sequential consecutive days backward from today/yesterday with any study log > 0 mins
  let streak = 0;
  let offset = 0;

  // Let's count streak
  while (true) {
    const checkDateStr = getDateOffsetStr(-offset);
    const min = timeByDate[checkDateStr] || 0;

    if (min > 0) {
      streak++;
      offset++;
    } else {
      // If it's today and they haven't logged yet, streak doesn't break yet, we check yesterday
      if (offset === 0) {
        offset++;
        continue;
      }
      break;
    }

    // Safety guard to avoid any infinite loop
    if (offset > 365) break;
  }

  return {
    dailyHoursGoalAchievedDays: achievedCount,
    missedDays: missedCount,
    streakDays: streak,
    achieveRatio: Math.round((achievedCount / totalDays) * 100)
  };
}

// Module 14: Exam Readiness Score
export function calculateReadinessScore(
  syllabusCompletedPercent: number, // 30% weight
  questionsRatioPercent: number,    // 20% weight (questions done / target total)
  averageAccuracy: number,         // 30% weight
  consistencyScoreRatio: number    // 20% weight
): number {
  const syllabusWeight = 0.30;
  const questionsWeight = 0.20;
  const accuracyWeight = 0.30;
  const consistencyWeight = 0.20;

  const score =
    (syllabusCompletedPercent * syllabusWeight) +
    (questionsRatioPercent * questionsWeight) +
    (averageAccuracy * accuracyWeight) +
    (consistencyScoreRatio * consistencyWeight);

  return Math.min(100, Math.max(0, Math.round(score)));
}

// Module 15: Prediction Engine
export interface PredictionResult {
  daysLeft: number;
  completedChaptersCount: number;
  remainingChaptersCount: number;
  currentVelocity: number; // Chapters per day completed
  requiredVelocity: number; // Chapters per day required
  ispaceSufficient: boolean;
}

export function calculatePrediction(
  chapters: Chapter[],
  tasks: TaskLog[],
  goal: GoalSetupData,
  todayStr: string = getTodayStr()
): PredictionResult {
  const daysLeft = Math.max(0, daysBetween(todayStr, goal.examDate));

  // A chapter counts as "completed" if:
  // - Theory is complete AND questions target has been reached or at least started and accuracy is high
  // Let's simplify: completed chapters are those where theory is completed and we've met the question targeted practice
  const completedChapters = chapters.filter(ch => {
    const qDone = tasks
      .filter(t => t.chapterId === ch.id && t.completed && t.type === 'questions')
      .reduce((sum, t) => sum + (t.actualQuestions?.attempted || 0), 0);
    return ch.theoryCompleted && (ch.questionTarget === 0 || qDone >= ch.questionTarget);
  });

  const completedCount = completedChapters.length;
  const totalCount = chapters.length;
  const remainingCount = Math.max(0, totalCount - completedCount);

  // Velocity calculation: how many chapters completed since the start date
  const prepDaysPassed = Math.max(1, daysBetween(goal.studyStartDate, todayStr));
  const currentVelocity = completedCount / prepDaysPassed; // Chapters per day

  // Required velocity: Remaining chapters / Days left
  const requiredVelocity = daysLeft > 0 ? remainingCount / daysLeft : remainingCount;

  // Is pace sufficient?
  // If remainingCount is 0, then pace is always sufficient.
  // If current velocity satisfies or exceeds required velocity, it's sufficient.
  const ispaceSufficient = remainingCount === 0 || (currentVelocity >= requiredVelocity && currentVelocity > 0);

  return {
    daysLeft,
    completedChaptersCount: completedCount,
    remainingChaptersCount: remainingCount,
    currentVelocity: Math.round(currentVelocity * 100) / 100,
    requiredVelocity: Math.round(requiredVelocity * 100) / 100,
    ispaceSufficient
  };
}

// Module 16: Honest Feedback System
export interface HonestFeedbackItem {
  status: 'good' | 'warning' | 'alert';
  message: string;
}

export function getHonestFeedback(
  accuracy: number,
  syllabusCompletion: number,
  studyTimeChangePercent: number, // positive or negative
  accuracyChangePercent: number, // positive or negative
  paceSufficient: boolean,
  currentStreak: number,
  backlogCount: number
): HonestFeedbackItem[] {
  const feedbacks: HonestFeedbackItem[] = [];

  // Feedback 1: Accuracy drop vs study time gain
  if (studyTimeChangePercent > 10 && accuracyChangePercent < -5) {
    feedbacks.push({
      status: 'warning',
      message: `Your study time is up by ${Math.abs(Math.round(studyTimeChangePercent))}% but quality is suffering: practice accuracy dropped by ${Math.abs(Math.round(accuracyChangePercent))}%. You are rushing through practice. Slow down and focus on depth, not just completing targets.`
    });
  } else if (studyTimeChangePercent < -10 && accuracyChangePercent > 5) {
    feedbacks.push({
      status: 'warning',
      message: `Accuracy is solid (up by ${Math.round(accuracyChangePercent)}%), but your total study time dropped by ${Math.abs(Math.round(studyTimeChangePercent))}%. Consistent review is required to retain key formulas.`
    });
  }

  // Feedback 2: Pace Engine output
  if (!paceSufficient && syllabusCompletion < 95) {
    feedbacks.push({
      status: 'alert',
      message: 'Your current learning pace is too slow! You risk not completing the exam syllabus on time. You must increase study hours or chapters per day immediately.'
    });
  } else if (paceSufficient && syllabusCompletion > 20) {
    feedbacks.push({
      status: 'good',
      message: 'Excellent pace velocity. You are securely on-track to cover your syllabus goals well before the exam date if you sustain this momentum.'
    });
  }

  // Feedback 3: Accuracy-driven strict critique
  if (accuracy > 0 && accuracy < 60) {
    feedbacks.push({
      status: 'alert',
      message: `Average practice accuracy is only ${accuracy}%. This is below competitive mock benchmarks. Memorising content without active, accurate recall will cause negative marking in real exams.`
    });
  } else if (accuracy >= 80) {
    feedbacks.push({
      status: 'good',
      message: `Robust recall and accuracy (${accuracy}%). Keep maintaining these strict subject analytics for high weightage chapters.`
    });
  }

  // Feedback 4: Backlogs & Streak critique
  if (backlogCount > 3) {
    feedbacks.push({
      status: 'alert',
      message: `You have ${backlogCount} pending backlogs waiting for rescheduling. Postponing backlogs repeatedly lowers discipline. Clean them up this weekend.`
    });
  } else if (currentStreak > 7) {
    feedbacks.push({
      status: 'good',
      message: `Outstanding consistency! You are on a solid ${currentStreak}-day learning streak. Keep fueling this habits-loop.`
    });
  }

  // Default if everything is empty
  if (feedbacks.length === 0) {
    feedbacks.push({
      status: 'warning',
      message: 'Log your first daily study durations and correct/wrong answers to receive personalized, data-driven preparation feedback.'
    });
  }

  return feedbacks;
}
