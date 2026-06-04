import React, { useState } from 'react';
import { Backlog, Subject } from '../types';
import { AlertCircle, Calendar, Sparkles, X, ArrowRight, CheckCircle2 } from 'lucide-react';
import { getTodayStr, getDateOffsetStr } from '../utils';

interface BacklogsTabProps {
  backlogs: Backlog[];
  subjects: Subject[];
  onRescheduleBacklog: (id: string, newDate: string) => void;
  onIgnoreBacklog: (id: string) => void;
  onAutoDistribute: () => void;
}

export default function BacklogsTab({
  backlogs,
  subjects,
  onRescheduleBacklog,
  onIgnoreBacklog,
  onAutoDistribute
}: BacklogsTabProps) {
  const [customDates, setCustomDates] = useState<Record<string, string>>({});
  const pendingBacklogs = backlogs.filter(b => b.status === 'pending');
  const resolvedBacklogs = backlogs.filter(b => b.status !== 'pending');

  const getSubjectColor = (subjectId?: string) => {
    if (!subjectId) return '#64748b';
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.color : '#64748b';
  };

  const getSubjectName = (subjectId?: string) => {
    if (!subjectId) return 'General/Custom';
    const sub = subjects.find(s => s.id === subjectId);
    return sub ? sub.name : 'General/Custom';
  };

  const handleCustomDateSubmit = (e: React.FormEvent, backlogId: string) => {
    e.preventDefault();
    const date = customDates[backlogId];
    if (!date) return;
    onRescheduleBacklog(backlogId, date);
  };

  return (
    <div className="space-y-8">
      {/* HEADER SECTION WITH QUICK STATS AND AUTO ACTION */}
      <div className="bg-gradient-to-br from-[#121214] to-[#0A0A0B] border border-white/10 rounded-2xl p-6 text-white text-left flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl" />
        <div className="relative z-10">
          <h2 className="text-xl font-extrabold flex items-center gap-2 text-white">
            <AlertCircle className="w-5 h-5 text-amber-400" />
            Backlog Recovery Console
          </h2>
          <p className="text-white/60 text-sm mt-1 max-w-2xl font-sans">
            You have <span className="text-amber-400 font-bold font-mono">{pendingBacklogs.length} missed targets</span>.
            Delaying tasks reduces syllabus depth. Use our rescheduling toolbox to fit them back into your schedule.
          </p>
        </div>

        {pendingBacklogs.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Auto-reschedule will move all pending backlogs to Tomorrow to clear your dashboard. Continue?')) {
                onAutoDistribute();
              }
            }}
            className="px-5 py-2.5 bg-[#00FF66] hover:bg-[#00E55C] rounded-xl text-black text-xs font-black uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors shrink-0 self-start md:self-auto relative z-10"
          >
            <Sparkles className="w-4 h-4 text-black shrink-0" />
            Auto-Schedule to Tomorrow
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PENDING BACKLOGS LIST (Left Column x2) */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-white text-left flex items-center gap-2">
            Pending Quotas ({pendingBacklogs.length})
          </h3>

          {pendingBacklogs.length === 0 ? (
            <div className="text-center py-16 bg-white/5 border border-dashed border-white/10 rounded-2xl">
              <CheckCircle2 className="w-12 h-12 text-[#00FF66] mx-auto mb-3" />
              <p className="text-white font-bold text-base">Perfect Discipline!</p>
              <p className="text-white/40 text-sm mt-0.5">No pending backlogs detected on your dashboard! Keep it going!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingBacklogs.map(backlog => (
                <div
                  key={backlog.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-lg text-left relative overflow-hidden"
                >
                  {/* Left accent color strip */}
                  <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: getSubjectColor(backlog.subjectId) }}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pl-2">
                    <div className="min-w-0 flex-1">
                      {/* Subject Name Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className="text-[10px] px-2 py-0.5 rounded text-white font-extrabold uppercase font-mono tracking-wide"
                          style={{ backgroundColor: getSubjectColor(backlog.subjectId) }}
                        >
                          {getSubjectName(backlog.subjectId)}
                        </span>
                        <span className="text-[10px] bg-white/10 text-white/80 border border-white/10 px-2 py-0.5 rounded font-mono">
                          Missed: {backlog.originalDate}
                        </span>
                        {backlog.taskType === 'questions' && (
                          <span className="text-[10px] bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/20 px-2 py-0.5 rounded font-bold font-mono">
                            {backlog.questionCount} MCQs Target
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-bold text-white mt-3">
                        {backlog.taskName}
                      </h4>
                      <p className="text-xs text-white/50 mt-1">
                        Required Action: {backlog.taskType === 'theory' ? 'Theory Reading & Note Making' : 'Unfinished Question-Solving Practice'}
                      </p>
                    </div>

                    {/* Reschedule Button Cluster */}
                    <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-stretch min-w-[140px] shrink-0">
                      <button
                        type="button"
                        onClick={() => onRescheduleBacklog(backlog.id, getDateOffsetStr(1))}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-semibold rounded-lg border border-white/10 transition-colors cursor-pointer text-left flex items-center justify-between"
                      >
                        <span>Tomorrow</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#00FF66]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          // Find next Saturday (or weekend day)
                          const d = new Date();
                          const dayNum = d.getDay(); // 0 is Sunday, 6 is Saturday
                          let offset = 6 - dayNum;
                          if (offset <= 0) offset += 7; // if it is Saturday, move to next weekend
                          onRescheduleBacklog(backlog.id, getDateOffsetStr(offset));
                        }}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/90 text-xs font-semibold rounded-lg border border-white/10 transition-colors cursor-pointer text-left flex items-center justify-between"
                      >
                        <span>Next Weekend</span>
                        <Calendar className="w-3.5 h-3.5 text-[#00FF66]" />
                      </button>

                      <form
                        onSubmit={e => handleCustomDateSubmit(e, backlog.id)}
                        className="flex items-center gap-1.5"
                      >
                        <input
                          type="date"
                          value={customDates[backlog.id] || ''}
                          min={getTodayStr()}
                          onChange={e =>
                            setCustomDates(prev => ({ ...prev, [backlog.id]: e.target.value }))
                          }
                          className="px-2 py-1.5 bg-white/5 border border-white/10 text-xs rounded-lg text-white font-mono focus:outline-none focus:border-[#00FF66]/40 w-full"
                        />
                        <button
                          type="submit"
                          disabled={!customDates[backlog.id]}
                          className="p-1 px-2.5 bg-[#00FF66] text-black rounded-lg hover:bg-[#00E55C] transition-colors text-xs font-bold cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                        >
                          OK
                        </button>
                      </form>

                      <button
                        type="button"
                        onClick={() => onIgnoreBacklog(backlog.id)}
                        className="px-3 py-1 bg-white/5 hover:bg-[#FF3333]/15 text-[#FF3333] border border-[#FF3333]/25 hover:border-[#FF3333]/40 text-[11px] font-bold rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center gap-1 mt-1"
                      >
                        <X className="w-3 h-3" /> Ignore Target
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* LOG OF RESOLVED BACKLOGS (Right Column x1) */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="text-lg font-bold text-white text-left">
            Resolved Log ({resolvedBacklogs.length})
          </h3>

          {resolvedBacklogs.length === 0 ? (
            <div className="bg-white/5 rounded-2xl p-6 text-center border border-dashed border-white/10">
              <p className="text-white/40 text-xs">No resolved backlogs logged yet.</p>
            </div>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 divide-y divide-white/10 max-h-[500px] overflow-y-auto">
              {resolvedBacklogs.map(log => (
                <div key={log.id} className="py-3 text-left first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-mono text-white/40">{log.originalDate}</p>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider font-mono border ${
                        log.status === 'rescheduled'
                          ? 'bg-[#00FF66]/15 text-[#00FF66] border-[#00FF66]/20'
                          : 'bg-white/10 text-white/50 border-white/10'
                      }`}
                    >
                      {log.status === 'rescheduled' ? `Rescheduled → ${log.rescheduledDate}` : 'Ignored'}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-white mt-1.5 leading-snug line-clamp-2">
                    {log.taskName}
                  </p>
                  <p className="text-[11px] text-white/40 mt-0.5 font-mono">
                    {getSubjectName(log.subjectId)} — {log.taskType}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
