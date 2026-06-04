import React, { useState, useEffect, useRef } from 'react';
import { Subject, Chapter, TaskLog, StudySessionLog } from '../types';
import { Play, Pause, Square, Plus, CheckCircle2, Circle, Clock, Flame, Keyboard, Save } from 'lucide-react';
import { getTodayStr, calculateAccuracy } from '../utils';

interface PlannerTabProps {
  subjects: Subject[];
  chapters: Chapter[];
  tasks: TaskLog[];
  studyLogs: StudySessionLog[];
  onAddTask: (task: Omit<TaskLog, 'id' | 'completed'>) => void;
  onToggleTaskComplete: (id: string, actualQuestions?: { attempted: number; correct: number; wrong: number }) => void;
  onAddStudyLog: (subjectId: string, minutes: number) => void;
  onRemoveTask: (id: string) => void;
}

export default function PlannerTab({
  subjects,
  chapters,
  tasks,
  studyLogs,
  onAddTask,
  onToggleTaskComplete,
  onAddStudyLog,
  onRemoveTask,
}: PlannerTabProps) {
  const todayStr = getTodayStr();

  // TIMER STATE
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerSubjectId, setTimerSubjectId] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // LOG MANUAL TIME STATE
  const [manualMinutes, setManualMinutes] = useState<number>(60);
  const [manualSubjectId, setManualSubjectId] = useState('');

  // TASK FORM STATE
  const [taskSubjectId, setTaskSubjectId] = useState('');
  const [taskChapterId, setTaskChapterId] = useState('');
  const [taskName, setTaskName] = useState('');
  const [taskType, setTaskType] = useState<'theory' | 'questions'>('theory');
  const [taskQCount, setTaskQCount] = useState<number>(30);

  // QUESTION LOGGER MODAL STATE (For ticking a questions target)
  const [activeLoggingTaskId, setActiveLoggingTaskId] = useState<string | null>(null);
  const [attempted, setAttempted] = useState<number>(30);
  const [correct, setCorrect] = useState<number>(25);
  const [wrong, setWrong] = useState<number>(5);

  // Handle ticking task
  const handleTaskClick = (task: TaskLog) => {
    if (task.completed) {
      // Toggle back to incomplete
      onToggleTaskComplete(task.id);
    } else {
      if (task.type === 'questions') {
        // Must trigger numerical questions log modal/input
        const defaultCount = task.questionCount || 30;
        setAttempted(defaultCount);
        setCorrect(Math.round(defaultCount * 0.8));
        setWrong(Math.max(0, defaultCount - Math.round(defaultCount * 0.8)));
        setActiveLoggingTaskId(task.id);
      } else {
        // Just check instantly
        onToggleTaskComplete(task.id);
      }
    }
  };

  const handleSaveQuestionsLog = () => {
    if (!activeLoggingTaskId) return;
    const computedWrong = Math.max(0, attempted - correct);
    onToggleTaskComplete(activeLoggingTaskId, {
      attempted,
      correct,
      wrong: computedWrong,
    });
    setActiveLoggingTaskId(null);
  };

  // Timer runner
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleStopAndSaveTimer = () => {
    setIsTimerRunning(false);
    if (timerSeconds < 5) {
      if (confirm('Session was very short. Do you want to cancel saving this session?')) {
        setTimerSeconds(0);
        return;
      }
    }

    const mins = Math.max(1, Math.round(timerSeconds / 60));
    const targetSubId = timerSubjectId || (subjects.length > 0 ? subjects[0].id : '');

    onAddStudyLog(targetSubId, mins);
    alert(`Success! Logged ${mins} minutes of study time for ${getSubjectName(targetSubId)}.`);
    setTimerSeconds(0);
  };

  // Form helpers
  const handleTaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) return;

    const subId = taskSubjectId || (subjects.length > 0 ? subjects[0].id : '');
    onAddTask({
      date: todayStr,
      name: taskName.trim(),
      type: taskType,
      subjectId: subId || undefined,
      chapterId: taskChapterId || undefined,
      questionCount: taskType === 'questions' ? Number(taskQCount) : undefined,
    });

    setTaskName('');
  };

  const handleManualTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const subId = manualSubjectId || (subjects.length > 0 ? subjects[0].id : '');
    onAddStudyLog(subId, Number(manualMinutes));
    alert(`Logged ${manualMinutes} minutes study log successfully.`);
    setManualMinutes(60);
  };

  const formatTime = (totalSecs: number) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getSubjectName = (subId?: string) => {
    const s = subjects.find(item => item.id === subId);
    return s ? s.name : 'General study';
  };

  const getSubjectColor = (subId?: string) => {
    const s = subjects.find(item => item.id === subId);
    return s ? s.color : '#64748b';
  };

  const todayTasks = tasks.filter(t => t.date === todayStr);

  // Sub-chapters filtered when a subject is chosen in the form
  const filteredChaptersForForm = taskSubjectId
    ? chapters.filter(c => c.subjectId === taskSubjectId)
    : chapters;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* COLUMN 1: Live Study clock, stopwatch and historical time logger */}
      <div className="space-y-6 lg:col-span-1">
        {/* Stopwatch Card */}
        <div id="countdown-stopwatch" className="bg-gradient-to-br from-[#121214] to-[#0A0A0B] border border-white/10 rounded-2xl p-6 text-white text-left shadow-lg relative overflow-hidden">
          {/* Subtle graphical glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00FF66]/5 rounded-full blur-3xl" />
          
          <h2 className="text-lg font-bold flex items-center gap-2 mb-1 text-white">
            <Clock className="w-5 h-5 text-[#00FF66]" /> Live Target Stopwatch
          </h2>
          <p className="text-xs text-white/40 mb-6">Start of training session log</p>

          <div className="flex flex-col items-center justify-center py-6">
            <div className="text-5xl font-mono tracking-wider font-extrabold text-[#00FF66] bg-white/5 px-6 py-4 rounded-2xl border border-white/10 shadow-inner">
              {formatTime(timerSeconds)}
            </div>

            <div className="mt-6 w-full space-y-4">
              <div>
                <label className="block text-[11px] font-mono uppercase tracking-wider text-white/45 mb-1.5">Study Focus Subject</label>
                <select
                  id="stopwatch-subject-select"
                  value={timerSubjectId}
                  onChange={e => setTimerSubjectId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF66]/50"
                >
                  {subjects.length === 0 && <option value="" className="bg-[#121214]">General Practice</option>}
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#121214]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isTimerRunning ? (
                  <button
                    id="timer-start"
                    type="button"
                    onClick={handleStartTimer}
                    className="flex-1 py-3 bg-[#00FF66] hover:bg-[#00E55C] text-black font-extrabold text-xs tracking-wider uppercase font-mono rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Play className="w-4 h-4 fill-black text-black" /> Resume / Start
                  </button>
                ) : (
                  <button
                    id="timer-pause"
                    type="button"
                    onClick={handlePauseTimer}
                    className="flex-1 py-3 bg-[#FFCC00] hover:bg-[#E5B800] text-black font-extrabold text-xs tracking-wider uppercase font-mono rounded-xl inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Pause className="w-4 h-4 fill-black text-black" /> Pause
                  </button>
                )}

                <button
                  id="timer-save"
                  type="button"
                  onClick={handleStopAndSaveTimer}
                  disabled={timerSeconds === 0}
                  className="px-4 bg-white/10 border border-white/10 text-white rounded-xl inline-flex items-center justify-center cursor-pointer transition-colors hover:bg-white/15 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Stop and save session logs"
                >
                  <Square className="w-4 h-4 fill-white" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Manual study logger */}
        <div id="manual-study-logger" className="bg-white/5 border border-white/10 rounded-2xl p-6 text-left text-white shadow-lg">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Save className="w-4 h-4 text-[#00FF66]" /> Manual Study Session
          </h2>
          <form onSubmit={handleManualTimeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Select Subject</label>
              <select
                id="manual-subject-select"
                value={manualSubjectId}
                onChange={e => setManualSubjectId(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF66]/50"
              >
                {subjects.length === 0 && <option value="" className="bg-[#121214]">General Custom Study</option>}
                {subjects.map(s => (
                  <option key={s.id} value={s.id} className="bg-[#121214]">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Time Studied (Minutes)</label>
              <input
                id="manual-minutes-input"
                type="number"
                min="5"
                max="600"
                value={manualMinutes}
                onChange={e => setManualMinutes(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-[#00FF66]/50"
              />
            </div>

            <button
              id="manual-save-btn"
              type="submit"
              className="w-full py-2 bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold uppercase tracking-wider text-xs rounded-lg transition-colors cursor-pointer"
            >
              Add Minutes to Logs
            </button>
          </form>
        </div>
      </div>

      {/* COLUMN 2 & 3: Daily Target Checklist and Planner Actions */}
      <div className="lg:col-span-2 space-y-6">
        {/* Dynamic target launcher */}
        <div id="custom-task-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white shadow-lg text-left">
          <h2 className="text-base font-bold text-white flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-[#00FF66]" /> Add Today's Planner Targets
          </h2>

          <form onSubmit={handleTaskSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1">Subject</label>
                <select
                  id="task-subject-select"
                  value={taskSubjectId}
                  onChange={e => {
                    setTaskSubjectId(e.target.value);
                    setTaskChapterId(''); // reset chapter when subject switches
                  }}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF66]/50"
                >
                  <option value="" className="bg-[#121214]">(Select Subject)</option>
                  {subjects.map(s => (
                    <option key={s.id} value={s.id} className="bg-[#121214]">
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1">Chapter Association</label>
                <select
                  id="task-chapter-select"
                  value={taskChapterId}
                  onChange={e => setTaskChapterId(e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF66]/50"
                >
                  <option value="" className="bg-[#121214]">General Custom Task (No specific chapter)</option>
                  {filteredChaptersForForm.map(c => (
                    <option key={c.id} value={c.id} className="bg-[#121214]">
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">What will you work on today?</label>
              <input
                id="task-name-input"
                type="text"
                required
                value={taskName}
                onChange={e => setTaskName(e.target.value)}
                placeholder="e.g. Solve Ratio practice sheet of 50 questions / Learn theory notes"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF66]/50"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-white/50 shrink-0">Priority / Target Quota:</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTaskType('theory')}
                    className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-md cursor-pointer transition-colors ${
                      taskType === 'theory' ? 'bg-[#00FF66] text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                  >
                    Theory Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => setTaskType('questions')}
                    className={`px-3 py-1 text-[11px] font-extrabold uppercase rounded-md cursor-pointer transition-colors ${
                      taskType === 'questions' ? 'bg-[#00FF66] text-black' : 'bg-white/10 text-white/60 hover:bg-white/15'
                    }`}
                  >
                    Questions Mode
                  </button>
                </div>
              </div>

              {taskType === 'questions' && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/60">Count:</span>
                  <input
                    id="task-questions-count-input"
                    type="number"
                    min="5"
                    max="500"
                    value={taskQCount}
                    onChange={e => setTaskQCount(Math.max(5, parseInt(e.target.value) || 0))}
                    className="w-16 text-center bg-white/5 border border-white/10 px-2 py-1 text-xs rounded text-white font-mono"
                  />
                  <span className="text-xs text-white/40 font-mono">MCQs</span>
                </div>
              )}

              <button
                id="submit-task-btn"
                type="submit"
                className="px-4 py-1.5 bg-[#00FF66] hover:bg-[#00E55C] text-black font-black uppercase tracking-wider text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer ml-auto sm:ml-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" /> Plan Task
              </button>
            </div>
          </form>
        </div>

        {/* Task lists checklist */}
        <div id="planner-tasks-checklist" className="bg-white/5 border border-white/10 rounded-2xl p-6 text-white shadow-lg text-left">
          <h2 className="text-lg font-bold text-white mb-1">Today's Study Checklist ({todayTasks.length})</h2>
          <p className="text-xs text-white/40 mb-6 font-mono">Targets active for date {todayStr}</p>

          {todayTasks.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-white/50 text-sm">No goals planned yet for today.</p>
              <button
                type="button"
                onClick={() => {
                  setTaskName('Solve 50 sample exam questions');
                  setTaskType('questions');
                  setTaskQCount(50);
                }}
                className="text-xs font-bold text-[#00FF66] hover:underline mt-2 cursor-pointer"
              >
                Quick-add a mock practice task
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {todayTasks.map(task => {
                const subColor = getSubjectColor(task.subjectId);
                return (
                  <div
                    key={task.id}
                    className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                      task.completed
                        ? 'bg-emerald-500/10 border-emerald-500/20 opacity-90'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => handleTaskClick(task)}
                        className={`mt-0.5 rounded-full outline-none transition-all shrink-0 cursor-pointer ${
                          task.completed
                            ? 'text-[#00FF66] scale-105'
                            : 'text-white/30 hover:text-[#00FF66]'
                        }`}
                        title="Mark complete / Click to edit questions log"
                      >
                        {task.completed ? (
                          <CheckCircle2 className="w-5 h-5 fill-[#00FF66]/10" />
                        ) : (
                          <Circle className="w-5 h-5 bg-transparent" />
                        )}
                      </button>

                      <div className="min-w-0 text-left flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p
                            className={`text-sm font-bold truncate ${
                              task.completed ? 'text-white/40 line-through font-normal' : 'text-white'
                            }`}
                          >
                            {task.name}
                          </p>
                          {task.subjectId && (
                            <span
                              className="text-[9px] px-2 py-0.5 rounded-sm text-white font-extrabold uppercase font-mono tracking-wide shrink-0"
                              style={{ backgroundColor: subColor }}
                            >
                              {getSubjectName(task.subjectId)}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[10px] text-white/40 font-mono">
                            Mode: {task.type === 'theory' ? 'Theory / Concepts' : 'Question Practice'}
                          </span>
                          {task.completed && task.actualQuestions && (
                            <span className="text-[10px] font-mono text-[#00FF66] bg-[#00FF66]/15 border border-[#00FF66]/20 px-1.5 py-0.2 rounded-sm">
                              Logged: {task.actualQuestions.attempted} attempted |{' '}
                              {calculateAccuracy(task.actualQuestions.attempted, task.actualQuestions.correct)}% Accuracy
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 shrink-0 md:self-center">
                      {task.type === 'questions' && !task.completed && (
                        <button
                          type="button"
                          onClick={() => handleTaskClick(task)}
                          className="px-3 py-1 bg-[#00FF66]/10 hover:bg-[#00FF66]/20 text-[#00FF66] border border-[#00FF66]/20 font-extrabold text-[10px] uppercase rounded transition-colors cursor-pointer"
                        >
                          Log Answers
                        </button>
                      )}
                      
                      <button
                        type="button"
                        onClick={() => onRemoveTask(task.id)}
                        className="text-white/45 hover:text-[#FF3333] text-xs px-2 py-1 cursor-pointer transition-colors font-medium font-sans"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* QUESTION LOGGING CONSOLE MODAL / BOX */}
      {activeLoggingTaskId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-3xl w-full max-w-md p-6 border border-white/10 text-left shadow-2xl text-white">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
              <Keyboard className="w-5 h-5 text-[#00FF66]" /> Log Practice Results
            </h3>
            <p className="text-xs text-white/45 mb-6 leading-relaxed font-sans">
              Enter details for target tasks. Accuracy index directly affects your readiness prediction.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1">Questions Attempted</label>
                <input
                  type="number"
                  min="1"
                  value={attempted}
                  onChange={e => {
                    const val = Math.max(1, parseInt(e.target.value) || 0);
                    setAttempted(val);
                    if (correct > val) setCorrect(val);
                    setWrong(Math.max(0, val - correct));
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00FF66]/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1">Correct Answers ✅</label>
                  <input
                    type="number"
                    min="0"
                    max={attempted}
                    value={correct}
                    onChange={e => {
                      const val = Math.min(attempted, Math.max(0, parseInt(e.target.value) || 0));
                      setCorrect(val);
                      setWrong(attempted - val);
                    }}
                    className="w-full bg-[#00FF66]/10 border border-[#00FF66]/20 rounded-lg px-3 py-2 text-sm text-[#00FF66] font-mono font-bold focus:outline-none focus:border-[#00FF66]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1">Wrong Answers ❌</label>
                  <input
                    type="number"
                    readOnly
                    value={attempted - correct}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white/40 font-mono"
                    title="Wrong is auto-calculated"
                  />
                </div>
              </div>

              {/* Accuracy Live indicator */}
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <span className="text-white/50 font-sans">Auto-calculated Accuracy:</span>
                <span className="font-bold font-mono text-[#00FF66]">
                  {calculateAccuracy(attempted, correct)}%
                </span>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveLoggingTaskId(null)}
                  className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestionsLog}
                  className="flex-1 py-2 bg-[#00FF66] hover:bg-[#00E55C] text-black font-extrabold text-xs rounded-xl cursor-pointer uppercase tracking-wider"
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
