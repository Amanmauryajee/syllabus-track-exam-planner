import React, { useState, useEffect } from 'react';
import {
  GoalSetupData,
  Subject,
  Chapter,
  TaskLog,
  StudySessionLog,
  Backlog,
  AppNotification,
} from './types';
import {
  INITIAL_GOAL,
  INITIAL_SUBJECTS,
  INITIAL_CHAPTERS,
  INITIAL_TASKS,
  INITIAL_STUDY_LOGS,
  INITIAL_BACKLOGS,
  INITIAL_NOTIFICATIONS,
} from './presets';
import { getTodayStr, parseDateStr, getDateOffsetStr } from './utils';

// Import subcomponents
import Header from './components/Header';
import DashboardTab from './components/DashboardTab';
import PlannerTab from './components/PlannerTab';
import SyllabusTab from './components/SyllabusTab';
import BacklogsTab from './components/BacklogsTab';

// Lucide icons
import { LayoutDashboard, CalendarDays, BookOpen, AlertCircle } from 'lucide-react';

export default function App() {
  // --- CORE STATE DECLARATIONS & INITIALIZATION ---
  const [goal, setGoal] = useState<GoalSetupData>(() => {
    const stored = localStorage.getItem('abhyas_goal');
    return stored ? JSON.parse(stored) : {
      examName: 'My Target Exam',
      examDate: getDateOffsetStr(90), // default 90 days countdown
      studyStartDate: getTodayStr(),
      dailyHoursGoal: 4
    };
  });
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const stored = localStorage.getItem('abhyas_subjects');
    return stored ? JSON.parse(stored) : [];
  });
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const stored = localStorage.getItem('abhyas_chapters');
    return stored ? JSON.parse(stored) : [];
  });
  const [tasks, setTasks] = useState<TaskLog[]>(() => {
    const stored = localStorage.getItem('abhyas_tasks');
    return stored ? JSON.parse(stored) : [];
  });
  const [studyLogs, setStudyLogs] = useState<StudySessionLog[]>(() => {
    const stored = localStorage.getItem('abhyas_studylogs');
    return stored ? JSON.parse(stored) : [];
  });
  const [backlogs, setBacklogs] = useState<Backlog[]>(() => {
    const stored = localStorage.getItem('abhyas_backlogs');
    return stored ? JSON.parse(stored) : [];
  });
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const stored = localStorage.getItem('abhyas_notifs');
    return stored ? JSON.parse(stored) : [
      {
        id: `notif-fresh-${Date.now()}`,
        type: 'info',
        message: '🚀 Welcome to Santhal Plan! Click on "Change Goal/Date" (gear or edit icon) at the top to customize your target exam name and exam date, then add subjects/topics in the "Syllabus Directory" below to generate your trackable schedule.',
        timestamp: 'Just now',
        read: false
      }
    ];
  });

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'planner' | 'syllabus' | 'backlogs'>('dashboard');

  // Sync back to local storage whenever state updates
  useEffect(() => {
    localStorage.setItem('abhyas_goal', JSON.stringify(goal));
    localStorage.setItem('abhyas_subjects', JSON.stringify(subjects));
    localStorage.setItem('abhyas_chapters', JSON.stringify(chapters));
    localStorage.setItem('abhyas_tasks', JSON.stringify(tasks));
    localStorage.setItem('abhyas_studylogs', JSON.stringify(studyLogs));
    localStorage.setItem('abhyas_backlogs', JSON.stringify(backlogs));
    localStorage.setItem('abhyas_notifs', JSON.stringify(notifications));
  }, [goal, subjects, chapters, tasks, studyLogs, backlogs, notifications]);


  // --- AUTOMATIC BACKLOG DETECTOR SCAN (Module 5) ---
  useEffect(() => {
    const today = getTodayStr();
    
    // Find checklist items that are:
    // - In the past (< today)
    // - Uncompleted (completed: false)
    const missedPastTasks = tasks.filter(t => t.date < today && !t.completed);
    
    if (missedPastTasks.length > 0) {
      // 1. Convert missed tasks into Backlog entries
      const newBacklogs: Backlog[] = missedPastTasks.map(t => ({
        id: `back-auto-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        originalDate: t.date,
        taskName: t.name,
        taskType: t.type,
        subjectId: t.subjectId,
        chapterId: t.chapterId,
        questionCount: t.questionCount,
        status: 'pending',
      }));

      // 2. Alert the user with a notification
      const backlogAlertNotif: AppNotification = {
        id: `notif-auto-${Date.now()}`,
        type: 'warning',
        message: `⚠️ Missed Goals Added to Backlogs: You have ${missedPastTasks.length} pending backlogs from past schedules. Go to the "Backlog Recovery Hub" to reschedule.`,
        timestamp: 'Just now',
        read: false,
      };

      // 3. Remove missed tasks from the regular task flow to avoid clutter
      const remainingTasks = tasks.filter(t => !(t.date < today && !t.completed));

      setBacklogs(prev => [...prev.filter(b => !newBacklogs.some(n => n.taskName === b.taskName)), ...newBacklogs]);
      setTasks(remainingTasks);
      setNotifications(prev => [backlogAlertNotif, ...prev]);
    }
  }, [tasks]);

  // Quick fix for backlog state merging
  const setBacklogsSafe = (updater: (prev: Backlog[]) => Backlog[]) => {
    setBacklogs(prev => {
      const updated = updater(prev);
      // Ensure no duplicates
      const ids = new Set();
      return updated.filter(item => {
        if (ids.has(item.id)) return false;
        ids.add(item.id);
        return true;
      });
    });
  };


  // --- HANDLER FUNCTIONS ---

  // Module 1: Update target goal parameters
  const handleUpdateGoal = (updatedGoal: GoalSetupData) => {
    setGoal(updatedGoal);
    // Queue a success notification
    const goalNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'success',
      message: `🎯 Target Goal Updated: "${updatedGoal.examName}" exam countdown configured for ${updatedGoal.examDate}.`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [goalNotif, ...prev]);
  };

  // Module 2: Add Subject
  const handleAddSubject = (name: string, color: string) => {
    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      name,
      color,
    };
    setSubjects(prev => [...prev, newSubject]);
  };

  // Remove Subject & clean associations
  const handleRemoveSubject = (id: string) => {
    setSubjects(prev => prev.filter(s => s.id !== id));
    setChapters(prev => prev.filter(c => c.subjectId !== id));
    setTasks(prev => prev.filter(t => t.subjectId !== id));
    setStudyLogs(prev => prev.filter(l => l.subjectId !== id));
    setBacklogsSafe(prev => prev.filter(b => b.subjectId !== id));
  };

  // Module 3: Chapters & topics
  const handleAddChapter = (subjectId: string, name: string, questionTarget: number) => {
    const newChapter: Chapter = {
      id: `ch-${Date.now()}`,
      subjectId,
      name,
      questionTarget,
      theoryCompleted: false,
    };
    setChapters(prev => [...prev, newChapter]);
  };

  const handleRemoveChapter = (id: string) => {
    setChapters(prev => prev.filter(c => c.id !== id));
    setTasks(prev => prev.filter(t => t.chapterId !== id));
    setBacklogsSafe(prev => prev.filter(b => b.chapterId !== id));
  };

  // Toggle theory
  const handleToggleTheory = (id: string) => {
    setChapters(prev =>
      prev.map(c => {
        if (c.id === id) {
          const updated = !c.theoryCompleted;
          // Add notification of milestone
          if (updated) {
            const milestoneNotif: AppNotification = {
              id: `notif-${Date.now()}`,
              type: 'success',
              message: `📚 Syllabus Milestone: Mark completed theory study for chapter "${c.name}". Ready for mock quizzes.`,
              timestamp: 'Just now',
              read: false,
            };
            setNotifications(o => [milestoneNotif, ...o]);
          }
          return { ...c, theoryCompleted: updated };
        }
        return c;
      })
    );
  };

  const handleUpdateChapterQuestions = (id: string, target: number) => {
    setChapters(prev => prev.map(c => (c.id === id ? { ...c, questionTarget: target } : c)));
  };

  // Module 4: Tasks Planner CRUD
  const handleAddTask = (taskDetails: Omit<TaskLog, 'id' | 'completed'>) => {
    const newTask: TaskLog = {
      ...taskDetails,
      id: `task-${Date.now()}`,
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleRemoveTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // Logging answer stats inline (Module 7)
  const handleToggleTaskComplete = (
    id: string,
    actualQStatistics?: { attempted: number; correct: number; wrong: number }
  ) => {
    setTasks(prev =>
      prev.map(t => {
        if (t.id === id) {
          const newComplete = !t.completed;
          return {
            ...t,
            completed: newComplete,
            actualQuestions: newComplete ? actualQStatistics : undefined,
          };
        }
        return t;
      })
    );
  };

  // Module 6: Study Timer Minute session logging
  const handleAddStudyLog = (subjectId: string, minutes: number) => {
    const newLog: StudySessionLog = {
      id: `log-${Date.now()}`,
      date: getTodayStr(),
      subjectId: subjectId || undefined,
      durationMinutes: minutes,
    };
    setStudyLogs(prev => [...prev, newLog]);
  };

  // Module 5: Backlog Action implementation
  const handleRescheduleBacklog = (id: string, targetNewDate: string) => {
    const backlogItem = backlogs.find(b => b.id === id);
    if (!backlogItem) return;

    // 1. Create a brand new active schedule Task on that date!
    const rescheduleTask: TaskLog = {
      id: `task-resched-${Date.now()}`,
      date: targetNewDate,
      name: `[Backlog Recovery] ${backlogItem.taskName}`,
      type: backlogItem.taskType,
      subjectId: backlogItem.subjectId,
      chapterId: backlogItem.chapterId,
      questionCount: backlogItem.questionCount,
      completed: false,
    };

    // 2. Add rescheduled task
    setTasks(prev => [...prev, rescheduleTask]);

    // 3. Mark backlog as resolved (status: 'rescheduled')
    setBacklogsSafe(prev =>
      prev.map(b => (b.id === id ? { ...b, status: 'rescheduled', rescheduledDate: targetNewDate } : b))
    );

    // 4. Create in-app success alerts
    const backNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'info',
      message: `🔄 Backlog Rescheduled: "${backlogItem.taskName}" shifted to checklist on date ${targetNewDate}.`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [backNotif, ...prev]);
  };

  const handleIgnoreBacklog = (id: string) => {
    setBacklogsSafe(prev => prev.map(b => (b.id === id ? { ...b, status: 'ignored' } : b)));
  };

  // Multi auto-distribute to tomorrow
  const handleAutoDistributeBacklogs = () => {
    const tomorrowStr = getDateOffsetStr(1);
    const pending = backlogs.filter(b => b.status === 'pending');

    const rescheduledTasks: TaskLog[] = pending.map((b, idx) => ({
      id: `task-auto-resched-${Date.now()}-${idx}`,
      date: tomorrowStr,
      name: `[Backlog Auto] ${b.taskName}`,
      type: b.taskType,
      subjectId: b.subjectId,
      chapterId: b.chapterId,
      questionCount: b.questionCount,
      completed: false,
    }));

    setTasks(prev => [...prev, ...rescheduledTasks]);
    setBacklogsSafe(prev =>
      prev.map(b => (b.status === 'pending' ? { ...b, status: 'rescheduled', rescheduledDate: tomorrowStr } : b))
    );

    const autoNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      type: 'success',
      message: `⚡ Backlog Recovery: Rescheduled ${rescheduledTasks.length} pending items to tomorrow's checklist.`,
      timestamp: 'Just now',
      read: false,
    };
    setNotifications(prev => [autoNotif, ...prev]);
  };

  // Clear or read alerts (Module 17)
  const handleClearNotifications = () => {
    setNotifications([]);
  };

  const handleMarkNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
  };

  // Load AFCAT standard test sets to instantly preview the statistics
  const handleResetToDemoPresets = () => {
    setGoal(INITIAL_GOAL);
    setSubjects(INITIAL_SUBJECTS);
    setChapters(INITIAL_CHAPTERS);
    setTasks(INITIAL_TASKS);
    setStudyLogs(INITIAL_STUDY_LOGS);
    setBacklogs(INITIAL_BACKLOGS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentTab('dashboard');

    localStorage.setItem('abhyas_goal', JSON.stringify(INITIAL_GOAL));
    localStorage.setItem('abhyas_subjects', JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem('abhyas_chapters', JSON.stringify(INITIAL_CHAPTERS));
    localStorage.setItem('abhyas_tasks', JSON.stringify(INITIAL_TASKS));
    localStorage.setItem('abhyas_studylogs', JSON.stringify(INITIAL_STUDY_LOGS));
    localStorage.setItem('abhyas_backlogs', JSON.stringify(INITIAL_BACKLOGS));
    localStorage.setItem('abhyas_notifs', JSON.stringify(INITIAL_NOTIFICATIONS));
  };

  // Instantly start fresh for customized exams (UPSC, NEET, JEE, GRE, etc.)
  const handleClearAllData = () => {
    const freshGoal = {
      examName: 'My Target Exam',
      examDate: getDateOffsetStr(90), // default 90 days countdown
      studyStartDate: getTodayStr(),
      dailyHoursGoal: 4
    };
    const freshNotifs = [
      {
        id: `notif-fresh-${Date.now()}`,
        type: 'info',
        message: '🚀 Onboarding: Your dashboard has been cleared! Click on "Change Goal/Date" to set your customized target exam, and head to the "Syllabus directory" tab to add your subjects and chapters.',
        timestamp: 'Just now',
        read: false
      }
    ];

    setGoal(freshGoal);
    setSubjects([]);
    setChapters([]);
    setTasks([]);
    setStudyLogs([]);
    setBacklogs([]);
    setNotifications(freshNotifs);
    setCurrentTab('syllabus'); // redirect automatically so they can add topics!

    localStorage.setItem('abhyas_goal', JSON.stringify(freshGoal));
    localStorage.setItem('abhyas_subjects', JSON.stringify([]));
    localStorage.setItem('abhyas_chapters', JSON.stringify([]));
    localStorage.setItem('abhyas_tasks', JSON.stringify([]));
    localStorage.setItem('abhyas_studylogs', JSON.stringify([]));
    localStorage.setItem('abhyas_backlogs', JSON.stringify([]));
    localStorage.setItem('abhyas_notifs', JSON.stringify(freshNotifs));
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-slate-100 flex flex-col font-sans transition-colors antialiased">
      {/* 1. APP NAVBAR AND HEADER CENTRE (Module 1, 17) */}
      <Header
        goal={goal}
        notifications={notifications}
        onUpdateGoal={handleUpdateGoal}
        onClearNotifications={handleClearNotifications}
        onMarkNotificationRead={handleMarkNotifRead}
        onResetToDemoPresets={handleResetToDemoPresets}
        onClearAllData={handleClearAllData}
      />

      {/* 2. CORE INTERFACE CONTAINER AND TABS NAV */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* TAB BUTTONS BAR */}
        <div className="flex flex-wrap border-b border-white/10 overflow-x-auto gap-1">
          <button
            id="tab-btn-dashboard"
            type="button"
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-2 py-3 px-4 text-xs tracking-wider uppercase font-extrabold border-b-2 transition-all cursor-pointer ${
              currentTab === 'dashboard'
                ? 'border-[#00FF66] text-[#00FF66] font-bold'
                : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/10'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 shrink-0" />
            Analytics Dashboard
          </button>

          <button
            id="tab-btn-planner"
            type="button"
            onClick={() => setCurrentTab('planner')}
            className={`flex items-center gap-2 py-3 px-4 text-xs tracking-wider uppercase font-extrabold border-b-2 transition-all cursor-pointer ${
              currentTab === 'planner'
                ? 'border-[#00FF66] text-[#00FF66] font-bold'
                : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/10'
            }`}
          >
            <CalendarDays className="w-4 h-4 shrink-0" />
            Today's Planner & clock
          </button>

          <button
            id="tab-btn-syllabus"
            type="button"
            onClick={() => setCurrentTab('syllabus')}
            className={`flex items-center gap-2 py-3 px-4 text-xs tracking-wider uppercase font-extrabold border-b-2 transition-all cursor-pointer ${
              currentTab === 'syllabus'
                ? 'border-[#00FF66] text-[#00FF66] font-bold'
                : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/10'
            }`}
          >
            <BookOpen className="w-4 h-4 shrink-0" />
            Syllabus directory
          </button>

          <button
            id="tab-btn-backlogs"
            type="button"
            onClick={() => setCurrentTab('backlogs')}
            className={`flex items-center gap-2 py-3 px-4 text-xs tracking-wider uppercase font-extrabold border-b-2 transition-all cursor-pointer relative ${
              currentTab === 'backlogs'
                ? 'border-[#00FF66] text-[#00FF66] font-bold'
                : 'border-transparent text-white/50 hover:text-white/80 hover:border-white/10'
            }`}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            Backlog recovery console
            {backlogs.filter(b => b.status === 'pending').length > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF3333] absolute top-2 right-2 animate-pulse" />
            )}
          </button>
        </div>

        {/* 3. DYNAMICALLY LOADED TAB SCREENS */}
        <div className="py-4">
          {currentTab === 'dashboard' && (
            <DashboardTab
              subjects={subjects}
              chapters={chapters}
              tasks={tasks}
              studyLogs={studyLogs}
              goal={goal}
              backlogs={backlogs}
            />
          )}

          {currentTab === 'planner' && (
            <PlannerTab
              subjects={subjects}
              chapters={chapters}
              tasks={tasks}
              studyLogs={studyLogs}
              onAddTask={handleAddTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onAddStudyLog={handleAddStudyLog}
              onRemoveTask={handleRemoveTask}
            />
          )}

          {currentTab === 'syllabus' && (
            <SyllabusTab
              subjects={subjects}
              chapters={chapters}
              onAddSubject={handleAddSubject}
              onRemoveSubject={handleRemoveSubject}
              onAddChapter={handleAddChapter}
              onRemoveChapter={handleRemoveChapter}
              onToggleTheory={handleToggleTheory}
              onUpdateChapterQuestions={handleUpdateChapterQuestions}
            />
          )}

          {currentTab === 'backlogs' && (
            <BacklogsTab
              backlogs={backlogs}
              subjects={subjects}
              onRescheduleBacklog={handleRescheduleBacklog}
              onIgnoreBacklog={handleIgnoreBacklog}
              onAutoDistribute={handleAutoDistributeBacklogs}
            />
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/10 py-6 mt-12 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] font-mono text-white/30 tracking-widest">
          <span>ALGO-V1.2 / SYNC: ACTIVE</span>
          <span>© 2026 SANTHAL PLAN / PREP CORE</span>
          <span>DATA-DRIVEN PREPARATION PROTOCOL</span>
        </div>
      </footer>
    </div>
  );
}
