import React, { useState } from 'react';
import { GoalSetupData, AppNotification } from '../types';
import { Calendar, Bell, Edit, Settings, X, ShieldAlert, BadgeInfo, Check } from 'lucide-react';
import { getTodayStr, daysBetween } from '../utils';

interface HeaderProps {
  goal: GoalSetupData;
  notifications: AppNotification[];
  onUpdateGoal: (newGoal: GoalSetupData) => void;
  onClearNotifications: () => void;
  onMarkNotificationRead: (id: string) => void;
  onResetToDemoPresets: () => void;
  onClearAllData: () => void;
}

export default function Header({
  goal,
  notifications,
  onUpdateGoal,
  onClearNotifications,
  onMarkNotificationRead,
  onResetToDemoPresets,
  onClearAllData,
}: HeaderProps) {
  const todayStr = getTodayStr();
  const daysLeft = daysBetween(todayStr, goal.examDate);

  // States
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Form local state
  const [examName, setExamName] = useState(goal.examName);
  const [examDate, setExamDate] = useState(goal.examDate);
  const [studyStartDate, setStudyStartDate] = useState(goal.studyStartDate);
  const [dailyHoursGoal, setDailyHoursGoal] = useState(goal.dailyHoursGoal);

  // Sync edit form states when parent goal changes (e.g. on Start Fresh or Reset)
  React.useEffect(() => {
    setExamName(goal.examName);
    setExamDate(goal.examDate);
    setStudyStartDate(goal.studyStartDate);
    setDailyHoursGoal(goal.dailyHoursGoal);
  }, [goal]);

  // Handle Goal Update Submit
  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGoal({
      examName: examName.trim() || 'My Target Exam',
      examDate: examDate || getTodayStr(),
      studyStartDate: studyStartDate || getTodayStr(),
      dailyHoursGoal: Number(dailyHoursGoal) || 4,
    });
    setIsGoalModalOpen(false);
  };

  const unreadNotifs = notifications.filter(n => !n.read);

  return (
    <header className={`bg-[#0A0A0B] border-b border-white/10 sticky top-0 bg-opacity-95 backdrop-blur-md text-white transition-all duration-200 ${isGoalModalOpen ? 'z-[9999]' : 'z-40'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
        
        {/* APP BRAND / LOGO */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00FF66]/10 border border-[#00FF66]/30 rounded-xl flex items-center justify-center text-[#00FF66] font-extrabold text-lg select-none shadow-[#00FF66]/10 shadow-sm">
            S
          </div>
          <div className="text-left">
            <h1 className="text-base font-extrabold text-white tracking-tight leading-tight uppercase font-sans">
              Santhal Plan
            </h1>
            <p className="text-[10px] text-white/40 font-mono tracking-widest leading-none">
              SYLLABUS & PREPAREDNESS INDEX
            </p>
          </div>
        </div>

        {/* ACTIVE EXAM RUNNING COUNTDOWN BADGE */}
        <div className="hidden md:flex items-center gap-4 bg-white/5 border border-white/10 p-1.5 px-3 rounded-full text-sm text-white/85">
          <Calendar className="w-4 h-4 text-[#00FF66]" />
          <div className="text-left">
            <span className="font-semibold text-white">{goal.examName || 'My Target Exam'}</span>
            <span className="text-white/20 mx-2">|</span>
            <span className="font-mono text-xs font-bold text-[#00FF66] uppercase">
              {daysLeft > 0 ? `${daysLeft} Days Left` : daysLeft === 0 ? 'Exam is TODAY' : 'Exam completed'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setExamName(goal.examName);
              setExamDate(goal.examDate);
              setStudyStartDate(goal.studyStartDate);
              setDailyHoursGoal(goal.dailyHoursGoal);
              setIsGoalModalOpen(true);
            }}
            className="p-1 text-white/50 hover:text-[#00FF66] hover:bg-white/5 rounded-full transition-colors cursor-pointer"
            title="Update Target Goal config"
          >
            <Edit className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* NOTIFICATIONS CENTER + ACTIONS */}
        <div className="flex items-center gap-3">
          {/* Quick Edit button for small layouts */}
          <button
            type="button"
            onClick={() => {
              setExamName(goal.examName);
              setExamDate(goal.examDate);
              setStudyStartDate(goal.studyStartDate);
              setDailyHoursGoal(goal.dailyHoursGoal);
              setIsGoalModalOpen(true);
            }}
            className="md:hidden p-2 text-white/70 hover:text-[#00FF66] bg-white/5 border border-white/10 rounded-xl transition-colors cursor-pointer"
            title="Edit Goal"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Start Fresh Clear Trigger */}
          <button
            type="button"
            onClick={() => {
              if (confirm('This action will delete all subjects, chapters, task lists, and study logs to start a brand new exam plan from scratch. Are you absolutely sure?')) {
                onClearAllData();
                setIsGoalModalOpen(false);
              }
            }}
            className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 border border-[#FF3333]/25 hover:border-[#FF3333]/50 text-[#FF3333] hover:bg-[#FF3333]/5 font-semibold text-xs rounded-lg transition-colors cursor-pointer"
          >
            Start Fresh (Clear)
          </button>

          {/* Notifications Inbox Trigger */}
          <div className="relative">
            <button
              id="notifications-bell-trigger"
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-white/70 hover:text-[#00FF66] bg-white/5 border border-white/10 rounded-xl transition-colors cursor-pointer relative"
              title="Notifications Inbox"
            >
              <Bell className="w-4 h-4" />
              {unreadNotifs.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-[#FF3333] text-white rounded-full text-[9px] font-bold flex items-center justify-center animate-pulse">
                  {unreadNotifs.length}
                </span>
              )}
            </button>

            {/* NOTIFICATION DROP BOX */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2.5 w-80 bg-[#121214] border border-white/10 rounded-2xl shadow-xl z-55 text-white text-left p-4 overflow-hidden">
                <div className="flex justify-between items-center mb-3 pb-2 border-b border-white/10">
                  <h4 className="font-bold text-sm text-white">Alert Notification Inbox</h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={onClearNotifications}
                      className="text-[10px] text-white/40 hover:text-[#FF3333] font-semibold uppercase cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNotifOpen(false)}
                      className="text-white/45 hover:text-white p-0.5 rounded-full"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {notifications.length === 0 ? (
                  <p className="text-xs text-white/40 py-6 text-center">No active notifications logged.</p>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {notifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => onMarkNotificationRead(notif.id)}
                        className={`p-2.5 rounded-xl text-xs relative cursor-pointer hover:bg-white/5 transition-colors ${
                          notif.read ? 'bg-white/5' : 'bg-[#00FF66]/10 border border-[#00FF66]/20 font-medium'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 shrink-0">
                            {notif.type === 'warning' || notif.type === 'countdown' ? (
                              <ShieldAlert className="w-3.5 h-3.5 text-[#FF3333]" />
                            ) : (
                              <BadgeInfo className="w-3.5 h-3.5 text-[#00FF66]" />
                            )}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-white/90 leading-normal">{notif.message}</p>
                            <span className="text-[9px] text-white/30 font-mono mt-1 block">
                              {notif.timestamp}
                            </span>
                          </div>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#00FF66] shrink-0 self-center" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* MODAL WINDOW: GOAL SETUP AND TARGET EDIT CONFIG (Module 1) */}
      {isGoalModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-[#121214] rounded-3xl w-full max-w-md p-6 border border-white/10 text-left shadow-2xl relative text-white my-auto transform transition-all z-[10001] shadow-black/80 max-h-[95vh] overflow-y-auto">
            <button
              onClick={() => setIsGoalModalOpen(false)}
              className="absolute top-4 right-4 text-white/40 hover:text-white p-1 rounded-full cursor-pointer lg:hover:rotate-90 transition-transform"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-1">
              <Settings className="w-5 h-5 text-[#00FF66]" /> Goal Setup & Target Config
            </h3>
            <p className="text-xs text-white/50 mb-6">
              Configure target parameters. Velocity and scheduling rates are parsed over these thresholds.
            </p>

            <form onSubmit={handleGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1">Target Exam Name</label>
                <input
                  type="text"
                  required
                  value={examName}
                  onChange={e => setExamName(e.target.value)}
                  placeholder="e.g. AFCAT, Bank PO, UPSC Prelims"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00FF66]/50 placeholder-white/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/50 mb-1">Target Exam Date</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  min={getTodayStr()}
                  onChange={e => setExamDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00FF66]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1">Prep Start Date</label>
                  <input
                    type="date"
                    required
                    value={studyStartDate}
                    max={getTodayStr()}
                    onChange={e => setStudyStartDate(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00FF66]/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-white/50 mb-1">Daily Study Hour Goal</label>
                  <input
                    type="number"
                    min="1"
                    max="16"
                    value={dailyHoursGoal}
                    onChange={e => setDailyHoursGoal(Math.min(16, Math.max(1, parseInt(e.target.value) || 0)))}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-[#00FF66]/50"
                  />
                </div>
              </div>

              <div className="p-3 bg-[#FF3333]/10 rounded-xl border border-[#FF3333]/30 text-xs text-[#FF3333] flex items-start gap-1.5 mt-2">
                <ShieldAlert className="w-4 h-4 text-[#FF3333] shrink-0 mt-0.5" />
                <p>Changing dates will instantly re-calibrate days remaining and velocity equations!</p>
              </div>

              <div className="flex flex-col gap-2 pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsGoalModalOpen(false)}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/80 font-semibold text-xs rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-[#00FF66] hover:bg-[#00E55C] text-black font-extrabold text-xs rounded-xl cursor-pointer flex items-center justify-center gap-1 uppercase tracking-wider"
                  >
                    <Check className="w-4 h-4 stroke-[3px]" /> Save New Target
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (confirm('This action will delete all subjects, chapters, task lists, and study logs to start a brand new exam plan from scratch. Are you absolutely sure?')) {
                      onClearAllData();
                      setIsGoalModalOpen(false);
                    }
                  }}
                  className="w-full py-2 border border-[#FF3333]/20 hover:border-[#FF3333]/40 text-[#FF3333] hover:bg-[#FF3333]/5 text-[11px] font-black uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center mt-2"
                >
                  Start Fresh (Clear All Data)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
