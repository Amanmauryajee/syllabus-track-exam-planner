import React, { useState } from 'react';
import { Subject, Chapter, TaskLog, StudySessionLog, GoalSetupData, Backlog } from '../types';
import {
  TrendingUp,
  Award,
  Calendar,
  Layers,
  CheckCircle,
  AlertTriangle,
  History,
  Target,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  CircleAlert,
  ChevronRight,
  Lightbulb,
  Sparkles,
} from 'lucide-react';
import {
  analyzeSubjects,
  analyzeTopics,
  calculateConsistency,
  calculatePrediction,
  calculateReadinessScore,
  getHonestFeedback,
  getStudyHoursForRange,
  getQuestionCountForRange,
  daysBetween,
  getTodayStr,
  getDateOffsetStr,
} from '../utils';

interface DashboardTabProps {
  subjects: Subject[];
  chapters: Chapter[];
  tasks: TaskLog[];
  studyLogs: StudySessionLog[];
  goal: GoalSetupData;
  backlogs: Backlog[];
}

export default function DashboardTab({
  subjects,
  chapters,
  tasks,
  studyLogs,
  goal,
  backlogs,
}: DashboardTabProps) {
  const todayStr = getTodayStr();

  // 1. Core Analytics Compilation
  const daysLeft = Math.max(0, daysBetween(todayStr, goal.examDate));

  // Syllabus % = Theory completed % (50% weight) + Chapters with targets completed % (50% weight)
  const totalChaptersCount = chapters.length;
  const theoryCompletedCount = chapters.filter(c => c.theoryCompleted).length;
  const theoryPct = totalChaptersCount > 0 ? (theoryCompletedCount / totalChaptersCount) * 100 : 0;

  // Let's count chapters where questions are finished/attempted>=target
  const chapterQDonePctList = chapters.map(ch => {
    if (ch.questionTarget === 0) return 100;
    const qDone = tasks
      .filter(t => t.chapterId === ch.id && t.completed && t.type === 'questions')
      .reduce((sum, t) => sum + (t.actualQuestions?.attempted || 0), 0);
    return Math.min(100, (qDone / ch.questionTarget) * 100);
  });
  const avgQCompletionPct = chapterQDonePctList.length > 0
    ? chapterQDonePctList.reduce((sum, val) => sum + val, 0) / chapterQDonePctList.length
    : 0;

  const syllabusCompletedPercent = Math.round((theoryPct + avgQCompletionPct) / 2);

  // Practice targets done ratio
  const totalPracticeTargetsSum = chapters.reduce((sum, ch) => sum + ch.questionTarget, 0);
  const totalAttemptedSum = tasks
    .filter(t => t.completed && t.actualQuestions)
    .reduce((sum, t) => sum + (t.actualQuestions?.attempted || 0), 0);
  const questionsRatioPercent = totalPracticeTargetsSum > 0
    ? Math.round(Math.min(100, (totalAttemptedSum / totalPracticeTargetsSum) * 100))
    : 0;

  // Question Stats Summary
  const activePracticeTasks = tasks.filter(t => t.completed && t.actualQuestions);
  let totalCorrect = 0;
  let totalAttempted = 0;
  activePracticeTasks.forEach(t => {
    if (t.actualQuestions) {
      totalCorrect += t.actualQuestions.correct;
      totalAttempted += t.actualQuestions.attempted;
    }
  });
  const avgAccuracy = totalAttempted > 0 ? Math.round((totalCorrect / totalAttempted) * 100) : 0;

  // 2. Consistency Streak
  const consistencyObj = calculateConsistency(studyLogs, goal, todayStr);

  // 3. Exam Readiness Score
  const readinessScore = calculateReadinessScore(
    syllabusCompletedPercent,
    questionsRatioPercent,
    avgAccuracy,
    consistencyObj.achieveRatio
  );

  // 4. Prediction pacing Engine
  const predictionObj = calculatePrediction(chapters, tasks, goal, todayStr);

  // 5. Subject & Topic breakdown analysis
  const { stats: subjectAnalysisList, weakestSubject } = analyzeSubjects(subjects, chapters, tasks);
  const { allTopics, weakTopics } = analyzeTopics(subjects, chapters, tasks);

  // 6. Time tracking
  const hrsToday = getStudyHoursForRange(studyLogs, 'today', todayStr);
  const hrsThisWeek = getStudyHoursForRange(studyLogs, 'week', todayStr);
  const hrsThisMonth = getStudyHoursForRange(studyLogs, 'month', todayStr);

  // 7. Daily Comparison (Today vs Yesterday)
  const yesterdayStr = getDateOffsetStr(-1);
  const hrsYesterday = getStudyHoursForRange(studyLogs, 'today', yesterdayStr);
  const quesTodayObj = getQuestionCountForRange(tasks, 'today', todayStr);
  const quesYesterdayObj = getQuestionCountForRange(tasks, 'today', yesterdayStr);

  const dailyHoursChangePct = hrsYesterday > 0
    ? ((hrsToday - hrsYesterday) / hrsYesterday) * 100
    : hrsToday > 0 ? 100 : 0;

  const dailyQuesChangePct = quesYesterdayObj.attempted > 0
    ? ((quesTodayObj.attempted - quesYesterdayObj.attempted) / quesYesterdayObj.attempted) * 100
    : quesTodayObj.attempted > 0 ? 100 : 0;

  // 8. Weekly Comparison (Current 7 days vs Previous 7 days [days -14 to -7])
  let totalMinsCurWeek = 0;
  let totalMinsPrevWeek = 0;
  let curWeekCorrect = 0;
  let curWeekAttempted = 0;
  let prevWeekCorrect = 0;
  let prevWeekAttempted = 0;

  studyLogs.forEach(l => {
    const diff = daysBetween(l.date, todayStr);
    if (diff >= 0 && diff < 7) {
      totalMinsCurWeek += l.durationMinutes;
    } else if (diff >= 7 && diff < 14) {
      totalMinsPrevWeek += l.durationMinutes;
    }
  });

  tasks.forEach(t => {
    if (!t.completed || !t.actualQuestions) return;
    const diff = daysBetween(t.date, todayStr);
    if (diff >= 0 && diff < 7) {
      curWeekCorrect += t.actualQuestions.correct;
      curWeekAttempted += t.actualQuestions.attempted;
    } else if (diff >= 7 && diff < 14) {
      prevWeekCorrect += t.actualQuestions.correct;
      prevWeekAttempted += t.actualQuestions.attempted;
    }
  });

  const curWeekHrs = Math.round((totalMinsCurWeek / 60) * 10) / 10;
  const prevWeekHrs = Math.round((totalMinsPrevWeek / 60) * 10) / 10;
  const curWeekAcc = curWeekAttempted > 0 ? Math.round((curWeekCorrect / curWeekAttempted) * 100) : 0;
  const prevWeekAcc = prevWeekAttempted > 0 ? Math.round((prevWeekCorrect / prevWeekAttempted) * 100) : 0;

  const weekHoursChangePct = prevWeekHrs > 0 ? ((curWeekHrs - prevWeekHrs) / prevWeekHrs) * 100 : 0;
  const weekAccuracyChangePct = curWeekAcc - prevWeekAcc; // direct basis points change

  const isWeeklyPerformanceImproved = curWeekHrs >= prevWeekHrs && curWeekAcc >= prevWeekAcc;

  // 9. Honest Feedback items
  const honestFeedbackList = getHonestFeedback(
    avgAccuracy,
    syllabusCompletedPercent,
    weekHoursChangePct,
    weekAccuracyChangePct,
    predictionObj.ispaceSufficient,
    consistencyObj.streakDays,
    backlogs.filter(b => b.status === 'pending').length
  );

  // Helper rating category text
  const getReadinessClass = (score: number) => {
    if (score < 40) return { label: 'Inadequate Preparation', ringColor: '#FF3333', textClass: 'text-[#FF3333] bg-[#FF3333]/15 border border-[#FF3333]/25 font-bold uppercase' };
    if (score < 65) return { label: 'Average Contender', ringColor: '#FFCC00', textClass: 'text-[#FFCC00] bg-[#FFCC00]/15 border border-[#FFCC00]/25 font-bold uppercase' };
    if (score < 80) return { label: 'Highly Competitive', ringColor: '#00FF66', textClass: 'text-[#00FF66] bg-[#00FF66]/15 border border-[#00FF66]/25 font-bold uppercase' };
    return { label: 'Top Rank Potential', ringColor: '#00FF66', textClass: 'text-black bg-[#00FF66] font-extrabold uppercase tracking-wider' };
  };

  const readinessAttrs = getReadinessClass(readinessScore);

  return (
    <div className="space-y-8 text-left">
      {/* MODULE 10: METRICS GRID IN A BENTO STYLE SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Metric 1: Syllabus Complete % */}
        <div id="metric-syllabus-card" className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase block font-mono">Syllabus Complete</span>
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalChaptersCount > 0 ? `${syllabusCompletedPercent}%` : '0%'}
            </span>
            <span className="text-[11px] text-white/40 block font-mono">
              {totalChaptersCount > 0 ? `${theoryCompletedCount}/${totalChaptersCount} chapters complete` : 'No chapters added'}
            </span>
          </div>
          {/* Custom circular progress SVG */}
          <div className="w-16 h-16 shrink-0 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="#00FF66"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray="163.3"
                strokeDashoffset={163.3 - (163.3 * (totalChaptersCount > 0 ? syllabusCompletedPercent : 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-[#00FF66] font-bold">
              {totalChaptersCount > 0 ? `${syllabusCompletedPercent}%` : '0%'}
            </div>
          </div>
        </div>

        {/* Metric 2: Average practice Accuracy */}
        <div id="metric-accuracy-card" className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase block font-mono">Practice Accuracy</span>
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalAttempted > 0 ? `${avgAccuracy}%` : '0%'}
            </span>
            <span className="text-[11px] text-white/40 block font-mono">
              {totalAttempted > 0 ? `${totalCorrect}/${totalAttempted} answers correct` : 'No questions solved'}
            </span>
          </div>
          {/* Gauge style half-progress */}
          <div className="w-16 h-16 shrink-0 relative">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.06)" strokeWidth="4" fill="transparent" />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke={totalAttempted > 0 ? (avgAccuracy >= 80 ? '#00FF66' : avgAccuracy >= 60 ? '#FFCC00' : '#FF3333') : 'rgba(255,255,255,0.1)'}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray="163.3"
                strokeDashoffset={163.3 - (163.3 * (totalAttempted > 0 ? avgAccuracy : 0)) / 100}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-mono text-white/90 font-bold">
              {totalAttempted > 0 ? `${avgAccuracy}%` : '0%'}
            </div>
          </div>
        </div>

        {/* Metric 3: Active Study Time */}
        <div id="metric-hours-card" className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase block font-mono">Aggregate Hours</span>
            <span className="text-3xl font-extrabold text-[#00FF66] tracking-tight">{hrsThisWeek} hrs</span>
            <div className="text-[11px] text-white/40 flex items-center gap-1.5 font-mono">
              <span className="bg-[#00FF66]/10 text-[#00FF66] border border-[#00FF66]/20 font-bold px-1 rounded">Today: {hrsToday}h</span>
              <span>Month: {Math.round(hrsThisMonth)}h</span>
            </div>
          </div>
          <div className="p-3 bg-white/5 border border-white/5 rounded-2xl text-[#00FF66] shrink-0">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Readiness score */}
        <div id="metric-readiness-card" className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-white/50 tracking-wider uppercase block font-mono">Prep Readiness</span>
            <span className="text-3xl font-extrabold text-white tracking-tight">
              {totalChaptersCount > 0 || studyLogs.length > 0 || totalAttempted > 0 ? `${readinessScore}/100` : '0/100'}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded border inline-block ${
              totalChaptersCount > 0 || studyLogs.length > 0 || totalAttempted > 0 
                ? readinessAttrs.textClass 
                : 'text-white/40 bg-white/5 border-white/10 font-bold uppercase'
            }`}>
              {totalChaptersCount > 0 || studyLogs.length > 0 || totalAttempted > 0 ? readinessAttrs.label : 'Insufficient Data'}
            </span>
          </div>
          <div className="w-16 h-16 shrink-0 relative flex items-center justify-center">
            {/* Elegant multi-ring readiness tracker */}
            <div className="absolute inset-0 rounded-full border-4 border-white/5" />
            <div
              className="absolute inset-1 rounded-full border-4 flex items-center justify-center font-bold text-sm text-white font-mono"
              style={{ 
                borderColor: totalChaptersCount > 0 || studyLogs.length > 0 || totalAttempted > 0 ? readinessAttrs.ringColor : 'rgba(255,255,255,0.1)', 
                boxShadow: totalChaptersCount > 0 || studyLogs.length > 0 || totalAttempted > 0 ? `0 0 10px ${readinessAttrs.ringColor}22` : 'none' 
              }}
            >
              {totalChaptersCount > 0 || studyLogs.length > 0 || totalAttempted > 0 ? readinessScore : 0}
            </div>
          </div>
        </div>
      </div>

      {/* MID SECTION: TIMELINES & PREDICTION PACE ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Module 15: Prediction pacing Engine Output Card (Double Width) */}
        <div id="prediction-pace-engine" className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-[#00FF66]" />
                Target Prediction Pacing Engine
              </h2>
              <span className="text-xs font-bold font-mono text-white/70 bg-white/10 border border-white/15 px-2 py-1 rounded">
                Countdown: {predictionObj.daysLeft} days left
              </span>
            </div>

            <p className="text-xs text-white/55 leading-relaxed mb-6 font-sans">
              Analyzes remaining chapters, active target date ({goal.examDate}), and current velocity to forecast syllabus completion. No mock AI, pure analytics.
            </p>
          </div>

          {/* Velocity visual display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5">
              <span className="text-[10px] font-semibold text-white/40 font-mono uppercase tracking-wider">Your Velocity</span>
              <p className="text-2xl font-bold text-white mt-1">
                {predictionObj.currentVelocity}{' '}
                <span className="text-xs font-medium text-white/40">Chapters / Day</span>
              </p>
              <p className="text-xs text-white/40 mt-1">Completed {predictionObj.completedChaptersCount} chapters so far</p>
            </div>

            <div className="p-4 bg-white/5 rounded-2xl text-left border border-white/5">
              <span className="text-[10px] font-semibold text-white/40 font-mono uppercase tracking-wider">Required Velocity</span>
              <p className="text-2xl font-bold text-white mt-1">
                {predictionObj.requiredVelocity}{' '}
                <span className="text-xs font-medium text-[#FF3333]">Chapters / Day</span>
              </p>
              <p className="text-xs text-white/40 mt-1">To cover {predictionObj.remainingChaptersCount} remaining chapters</p>
            </div>
          </div>

          {/* Warning / OK status banner */}
          {totalChaptersCount === 0 ? (
            <div className="bg-white/5 text-white/60 rounded-xl p-4 flex items-start gap-3 border border-white/10 w-full">
              <CircleAlert className="w-5 h-5 text-white/40 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide font-mono">No Syllabus Configured Yet 📚</p>
                <p className="text-xs text-white/50 mt-0.5 leading-relaxed font-sans">
                  Go to the "Syllabus directory" tab to add your subjects and chapters/topics. The pacing tracker will calculate your daily required learning rates automatically based on your exam date.
                </p>
              </div>
            </div>
          ) : predictionObj.ispaceSufficient ? (
            <div className="bg-[#00FF66]/10 text-[#00FF66] rounded-xl p-4 flex items-start gap-3 border border-[#00FF66]/20">
              <CheckCircle className="w-5 h-5 text-[#00FF66] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold uppercase tracking-wide font-mono">Pace Velocity: ON TRACK</p>
                <p className="text-xs text-white/75 mt-0.5 leading-relaxed">
                  At your current rate, you will cover all remaining chapters prior to the exam on {goal.examDate}. Maintain current study streaks.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-[#FF3333]/15 text-[#FF3333] rounded-xl p-4 flex items-start gap-3 border border-[#FF3333]/25">
              <CircleAlert className="w-5 h-5 text-[#FF3333] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide font-mono">CURRENT PACING INSUFFICIENT ⚠️</p>
                <p className="text-xs text-white/80 mt-0.5 leading-relaxed">
                  Your current velocity is {predictionObj.currentVelocity} chapters/day, but the syllabus schedule requires{' '}
                  <span className="font-bold underline text-[#FF3333]">{predictionObj.requiredVelocity} chapters/day</span>. Schedule double prep hours to close the deficit!
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Consistency Streak and mini achieved calendar */}
        <div id="consistency-tracker-box" className="lg:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-1.5 font-sans">
                <Flame className="text-amber-500 w-5 h-5 fill-amber-400" />
                Consistency Tracker
              </h3>
              <span className="text-xs font-mono font-bold text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20 px-2.5 py-0.5 rounded-full">
                Streak: {consistencyObj.streakDays} Days
              </span>
            </div>

            <p className="text-xs text-white/50 leading-relaxed mb-6 font-sans">
              A day counts as achieved when logged minutes meet or exceed your standard{' '}
              <span className="font-semibold text-white">{goal.dailyHoursGoal}-hour goal</span>. Keep the streak active!
            </p>
          </div>

          {/* Achievement multiplier radial or bar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-white/60">Daily Goal Achieved:</span>
              <span className="font-medium text-white">
                {consistencyObj.dailyHoursGoalAchievedDays} Days / Achieved
              </span>
            </div>
            
            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-400 to-[#00FF66] h-full rounded-full transition-all duration-300"
                style={{ width: `${consistencyObj.achieveRatio}%` }}
              />
            </div>
            
            <div className="flex justify-between items-center text-[10px] text-white/40 font-mono">
              <span>Ratio: {consistencyObj.achieveRatio}% of total days</span>
              <span>Missed: {consistencyObj.missedDays} days</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-2 text-[11px] text-white/45">
            <Lightbulb className="w-4 h-4 text-[#00FF66] shrink-0" />
            <span>Consistency influences 20% of your total exam readiness score.</span>
          </div>
        </div>
      </div>

      {/* HONEST FEEDBACK CONSOLE BLOCK */}
      <div id="honest-feedback-console" className="bg-[#0E0E10] border border-white/10 rounded-2xl p-6 text-white text-left relative overflow-hidden">
        {/* Glowing backdrop elements */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-[#00FF66]/5 rounded-full blur-3xl" />
        
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#00FF66] animate-pulse" />
            Strict Analytical Advice Terminal
          </h2>
          <span className="text-[10px] font-mono bg-white/10 text-[#00FF66] border border-white/10 px-2 py-0.5 rounded-sm uppercase tracking-wider">
            Objective Feedback Matrix — Verified
          </span>
        </div>

        <div className="space-y-3 mt-4">
          {honestFeedbackList.map((feedback, idx) => (
            <div
              key={idx}
              className={`p-3.5 rounded-xl border flex gap-3 text-sm leading-relaxed ${
                feedback.status === 'good'
                  ? 'bg-[#00FF66]/5 border-[#00FF66]/20 text-[#00FF66]'
                  : feedback.status === 'warning'
                  ? 'bg-[#FFCC00]/5 border-[#FFCC00]/20 text-[#FFCC00]'
                  : 'bg-[#FF3333]/5 border-[#FF3333]/20 text-[#FF3333]'
              }`}
            >
              <span className="text-base shrink-0 font-bold select-none mt-0.5 font-mono">
                {feedback.status === 'good' ? '✓' : feedback.status === 'warning' ? '⚠' : '✗'}
              </span>
              <p className="font-sans font-normal leading-relaxed">{feedback.message}</p>
            </div>
          ))}
        </div>
      </div>

      {/* PERFORMANCE BREAKDOWNS (COMPARISONS AND SUBJECTS SECTIONS) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COMPONENT/DIV: Comparisons (Daily & Weekly) */}
        <div id="comparisons-breakdown-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00FF66]" />
            Comparison Audits
          </h2>

          {/* Module 11: Daily Audits */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest text-left font-mono">Today vs Yesterday</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-left">
                <p className="text-[10px] font-medium text-white/50 uppercase font-mono">Study Hours</p>
                <p className="text-base font-bold text-white mt-1 font-mono">
                  {studyLogs.length > 0 ? `${hrsToday}h / ${hrsYesterday}h` : '0h / 0h'}
                </p>
                {studyLogs.length > 0 ? (
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${dailyHoursChangePct >= 0 ? 'text-[#00FF66]' : 'text-[#FF3333]'}`}>
                    {dailyHoursChangePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {dailyHoursChangePct >= 0 ? '+' : ''}{Math.round(dailyHoursChangePct)}%
                  </span>
                ) : (
                  <span className="text-[10px] text-white/30 block mt-0.5 font-mono">No logs yet</span>
                )}
              </div>

              <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-left">
                <p className="text-[10px] font-medium text-white/50 uppercase font-mono">MCQs Solved</p>
                <p className="text-base font-bold text-white mt-1 font-mono">
                  {totalAttempted > 0 ? `${quesTodayObj.attempted} vs ${quesYesterdayObj.attempted}` : '0 vs 0'}
                </p>
                {totalAttempted > 0 ? (
                  <span className={`text-[10px] font-bold flex items-center gap-0.5 mt-0.5 ${dailyQuesChangePct >= 0 ? 'text-[#00FF66]' : 'text-[#FF3333]'}`}>
                    {dailyQuesChangePct >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {dailyQuesChangePct >= 0 ? '+' : ''}{Math.round(dailyQuesChangePct)}%
                  </span>
                ) : (
                  <span className="text-[10px] text-white/30 block mt-0.5 font-mono">No practice yet</span>
                )}
              </div>
            </div>
          </div>

          {/* Module 12: Weekly Audits */}
          <div className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="text-xs font-semibold text-white/40 uppercase tracking-widest text-left font-mono">This Week vs Last Week</h3>
            
            {studyLogs.length === 0 && totalAttempted === 0 ? (
              <p className="text-xs text-white/40 py-2 font-sans text-left">No logs recorded. Comparison logs will populate as you save stopwatch sessions or practice MCQs.</p>
            ) : (
              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between font-mono">
                  <span>Study Duration:</span>
                  <span className="font-bold text-white">{curWeekHrs} hrs vs {prevWeekHrs} hrs</span>
                </div>

                <div className="flex justify-between font-mono">
                  <span>Practice Accuracy:</span>
                  <span className="font-bold text-[#00FF66]">
                    {curWeekAttempted > 0 || prevWeekAttempted > 0 ? `${curWeekAcc}% vs ${prevWeekAcc}%` : 'No MCQ practice'}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl flex items-center justify-between text-xs mt-3 bg-white/5 border border-white/5">
                  <span className="font-semibold text-white/70">Diagnostic:</span>
                  {studyLogs.length > 0 ? (
                    isWeeklyPerformanceImproved ? (
                      <span className="text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20 px-2 py-0.5 rounded font-bold uppercase text-[10px] font-mono">
                        Improved ✓
                      </span>
                    ) : (
                      <span className="text-[#FFCC00] bg-[#FFCC00]/10 border border-[#FFCC00]/20 px-2 py-0.5 rounded font-bold uppercase text-[10px] font-mono">
                        Focus Needed ⚠
                      </span>
                    )
                  ) : (
                    <span className="text-white/40 bg-white/5 border border-white/10 px-2 py-0.5 rounded font-bold uppercase text-[10px] font-mono">
                      Insufficient Data
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* COMPONENT/DIV: Subject wise MCQ statistics (Module 8) */}
        <div id="subject-breakdown-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white text-left">Subject Analytics</h2>
          
          {subjects.length === 0 ? (
            <p className="text-xs text-white/40 py-6 text-center font-sans">Add subjects in the syllabus directory to view analytics.</p>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {subjectAnalysisList.map(item => (
                <div key={item.subjectId} className="p-3 bg-white/5 border border-white/5 rounded-xl text-left">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-white truncate block max-w-[150px]">{item.name}</span>
                    <span className="text-xs font-mono font-bold text-[#00FF66] shrink-0">Accuracy: {item.accuracy}%</span>
                  </div>

                  <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div className="h-full rounded-full" style={{ width: `${item.accuracy}%`, backgroundColor: item.color || '#00FF66' }} />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-white/40 font-mono mt-2">
                    <span>Syllabus: {item.completedChapters}/{item.totalChapters} chapters done</span>
                    <span>Solved: {item.attempted}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weakest Subject Highlight box */}
          {weakestSubject && (
            <div className="p-3.5 bg-[#FF3333]/10 text-[#FF3333] rounded-xl text-left border border-[#FF3333]/20 mt-2 flex items-start gap-2.5">
              <AlertTriangle className="w-4.5 h-4.5 text-[#FF3333] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-extrabold uppercase tracking-wide text-[#FF3333] font-mono">Weakest Subject Highlight</p>
                <p className="text-sm font-bold text-white mt-0.5">{weakestSubject.name}</p>
                <p className="text-xs text-white/60 mt-0.5 leading-relaxed">Average accuracy is only {weakestSubject.accuracy}%. Allocate priority study blocks here.</p>
              </div>
            </div>
          )}
        </div>

        {/* COMPONENT/DIV: Weak topics highlighting (Module 9) */}
        <div id="topic-breakdown-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg space-y-4">
          <h2 className="text-lg font-bold text-white text-left">Weak Topics (&lt; 65%)</h2>
          <p className="text-xs text-white/50 leading-relaxed font-sans">
            Lists specific chapters where practice show inadequate mastery. Ideal for revision sessions.
          </p>

          {totalAttempted === 0 ? (
            <div className="py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl w-full">
              <AlertTriangle className="w-8 h-8 text-white/30 mx-auto mb-2" />
              <p className="text-sm text-white font-semibold">No Practice Logs Yet</p>
              <p className="text-white/40 text-[11px] mt-0.5">Weak topics appear here when you score below 65% in MCQ practice.</p>
            </div>
          ) : weakTopics.length === 0 ? (
            <div className="py-12 text-center bg-white/5 border border-dashed border-white/10 rounded-2xl w-full">
              <CheckCircle className="w-8 h-8 text-[#00FF66] mx-auto mb-2" />
              <p className="text-sm text-white font-semibold">No Weak Chapters!</p>
              <p className="text-white/40 text-[11px] mt-0.5">Sustain this standard of correctness across all topics.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {weakTopics.map(topic => (
                <div
                  key={topic.chapterId}
                  className="flex items-center justify-between p-3 rounded-xl border border-[#FF3333]/20 bg-[#FF3333]/5 hover:bg-[#FF3333]/10 transition-colors text-left"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-sm font-semibold text-white truncate">{topic.chapterName}</p>
                    <p className="text-[10px] text-white/40 font-medium truncate uppercase font-mono">{topic.subjectName}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold font-mono text-[#FF3333] bg-[#FF3333]/10 border border-[#FF3333]/20 px-2 py-0.5 rounded">
                      {topic.accuracy}%
                    </span>
                    <p className="text-[9px] text-white/40 font-mono mt-0.5">{topic.attempted} MCQs</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
