import React, { useState } from 'react';
import { Subject, Chapter } from '../types';
import { BookOpen, CheckSquare, Plus, Trash2, Tag, Percent } from 'lucide-react';

interface SyllabusTabProps {
  subjects: Subject[];
  chapters: Chapter[];
  onAddSubject: (name: string, color: string) => void;
  onRemoveSubject: (id: string) => void;
  onAddChapter: (subjectId: string, name: string, questionTarget: number) => void;
  onRemoveChapter: (id: string) => void;
  onToggleTheory: (id: string) => void;
  onUpdateChapterQuestions: (id: string, target: number) => void;
}

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#8b5cf6', // Violet
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#14b8a6', // Teal
];

export default function SyllabusTab({
  subjects,
  chapters,
  onAddSubject,
  onRemoveSubject,
  onAddChapter,
  onRemoveChapter,
  onToggleTheory,
  onUpdateChapterQuestions,
}: SyllabusTabProps) {
  // Subject Form State
  const [newSubName, setNewSubName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);

  // Chapter Form State
  const [selectedSubId, setSelectedSubId] = useState('');
  const [newChName, setNewChName] = useState('');
  const [chQTarget, setChQTarget] = useState<number>(150);

  // Active filter state
  const [activeSubjectFilter, setActiveSubjectFilter] = useState<string>('all');

  const handleSubSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;
    onAddSubject(newSubName.trim(), selectedColor);
    setNewSubName('');
    // Auto select the first subject to ease chapter creation if none select
    if (!selectedSubId && subjects.length === 0) {
      // Temporary setup since setState is async, App will generate IDs
    }
  };

  const handleChSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetSubId = selectedSubId || (subjects.length > 0 ? subjects[0].id : '');
    if (!targetSubId) {
      alert('Please add a subject first before creating chapters.');
      return;
    }
    if (!newChName.trim()) return;
    onAddChapter(targetSubId, newChName.trim(), Number(chQTarget) || 0);
    setNewChName('');
  };

  const filteredChapters = activeSubjectFilter === 'all'
    ? chapters
    : chapters.filter(ch => ch.subjectId === activeSubjectFilter);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
      {/* COLUMN 1: Subject Management */}
      <div className="lg:col-span-1 space-y-6">
        {/* Add Subject card */}
        <div id="add-subject-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg text-white">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Tag className="w-5 h-5 text-[#00FF66]" />
            Add Subject
          </h2>
          <form onSubmit={handleSubSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-1">Subject Name</label>
              <input
                id="subject-name-input"
                type="text"
                value={newSubName}
                onChange={e => setNewSubName(e.target.value)}
                placeholder="e.g. Quantitative Aptitude"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF66]/50"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2">Subject Color Theme</label>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    style={{ backgroundColor: color }}
                    className={`h-7 rounded-md transition-all cursor-pointer ${
                      selectedColor === color
                        ? 'ring-2 ring-offset-2 ring-offset-[#0A0A0B] ring-[#00FF66] scale-105'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <button
              id="add-subject-btn"
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#00FF66] hover:bg-[#00E55C] text-black font-black uppercase text-xs tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3px]" /> Add Subject
            </button>
          </form>
        </div>

        {/* Existing Subjects List */}
        <div id="subjects-list-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg text-white">
          <h3 className="text-xs font-bold text-white/50 tracking-wider uppercase mb-3 text-left">Active Subjects ({subjects.length})</h3>
          {subjects.length === 0 ? (
            <p className="text-xs text-white/40 text-center py-4">No subjects configured. Add one above to kick off.</p>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {subjects.map(sub => {
                const subChapters = chapters.filter(c => c.subjectId === sub.id);
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: sub.color }} />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-white truncate">{sub.name}</p>
                        <p className="text-[11px] text-white/40 font-mono">
                          {subChapters.length} {subChapters.length === 1 ? 'chapter' : 'chapters'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Delete subject "${sub.name}"? This deletes all associated chapters & targets!`)) {
                          onRemoveSubject(sub.id);
                        }
                      }}
                      className="text-white/40 hover:text-[#FF3333] p-1.5 rounded-lg transition-colors cursor-pointer"
                      title="Delete Subject"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2 & 3: Chapter / Topic Management */}
      <div className="lg:col-span-2 space-y-6">
        {/* Create Chapter Tool */}
        <div id="add-chapter-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg text-white">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#00FF66]" />
            Add Chapter / Topic to Subject
          </h2>
          <form onSubmit={handleChSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-white/50 mb-1 text-left">Subject</label>
              <select
                id="chapter-subject-select"
                value={selectedSubId}
                onChange={e => setSelectedSubId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF66]/40"
              >
                {subjects.length === 0 && <option value="" className="bg-[#121214]">(Add subject first)</option>}
                {subjects.map(sub => (
                  <option key={sub.id} value={sub.id} className="bg-[#121214]">
                    {sub.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-white/50 mb-1 text-left">Chapter/Topic Name</label>
              <input
                id="chapter-name-input"
                type="text"
                value={newChName}
                onChange={e => setNewChName(e.target.value)}
                placeholder="e.g. Ratio, Percentage, Time & Work"
                className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#00FF66]/40"
              />
            </div>

            <div className="md:col-span-1">
              <label className="block text-xs font-semibold text-white/50 mb-1 text-left">Questions Practice Target</label>
              <div className="flex gap-2">
                <input
                  id="chapter-questions-input"
                  type="number"
                  min="0"
                  max="1000"
                  value={chQTarget}
                  onChange={e => setChQTarget(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="300"
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center font-mono focus:outline-none focus:border-[#00FF66]/40"
                />
                <button
                  id="add-chapter-btn"
                  type="submit"
                  className="px-4 bg-[#00FF66] hover:bg-[#00E55C] text-black rounded-lg transition-colors inline-flex items-center justify-center shrink-0 cursor-pointer"
                  title="Add Chapter"
                >
                  <Plus className="w-5 h-5 stroke-[2.5px]" />
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Chapters list view */}
        <div id="chapters-list-card" className="bg-white/5 border border-white/10 rounded-2xl p-6 shadow-lg text-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-bold text-white text-left">Syllabus Directory & Status</h2>
            
            {/* Filter tags */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveSubjectFilter('all')}
                className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded border cursor-pointer transition-colors ${
                  activeSubjectFilter === 'all'
                    ? 'bg-white text-black border-white'
                    : 'bg-white/10 hover:bg-white/15 text-white/80 border-white/5'
                }`}
              >
                All
              </button>
              {subjects.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveSubjectFilter(s.id)}
                  className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded cursor-pointer transition-all flex items-center gap-1.5 border`}
                  style={{
                    backgroundColor: activeSubjectFilter === s.id ? s.color : 'rgba(255,255,255,0.05)',
                    color: activeSubjectFilter === s.id ? '#000000' : '#ffffff',
                    borderColor: activeSubjectFilter === s.id ? s.color : 'rgba(255,255,255,0.1)',
                    fontWeight: activeSubjectFilter === s.id ? '900' : 'bold'
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeSubjectFilter === s.id ? '#000000' : s.color }} />
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {filteredChapters.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-xl bg-white/5">
              <p className="text-white/40 text-sm">No chapters found for this selection.</p>
              <p className="text-white/30 text-xs mt-1 font-sans">Configure subjects and chapters above to populate your database.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
              {filteredChapters.map(ch => {
                const sub = subjects.find(s => s.id === ch.subjectId);
                return (
                  <div
                    key={ch.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-colors text-left"
                  >
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onToggleTheory(ch.id)}
                        className={`w-5 h-5 rounded border mt-0.5 shrink-0 transition-colors flex items-center justify-center cursor-pointer ${
                          ch.theoryCompleted
                            ? 'bg-[#00FF66] border-[#00FF66] text-black'
                            : 'border-white/20 bg-transparent hover:border-[#00FF66]'
                        }`}
                        title={ch.theoryCompleted ? 'Theory completed' : 'Mark theory as complete'}
                      >
                        {ch.theoryCompleted && <CheckSquare className="w-4 h-4 stroke-[2.5px]" />}
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white shrink-0 truncate max-w-[200px]">{ch.name}</p>
                          {sub && (
                            <span
                              className="text-[9px] px-2 py-0.5 rounded text-white font-extrabold uppercase font-mono tracking-wide"
                              style={{ backgroundColor: sub.color }}
                            >
                              {sub.name}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/40 mt-1 flex items-center gap-1 font-sans">
                          Theory status: {ch.theoryCompleted ? (
                            <span className="text-[#00FF66] font-bold">Concept Mastered ✓</span>
                          ) : (
                            <span className="text-[#FFCC00] font-medium">Pending Review</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      {/* Interactive Q Target Input */}
                      <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-2.5 py-1">
                        <span className="text-[10px] font-mono text-white/45 uppercase tracking-wide">Target:</span>
                        <input
                          type="number"
                          min="0"
                          value={ch.questionTarget}
                          onChange={e => onUpdateChapterQuestions(ch.id, Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-14 bg-transparent border-0 text-right p-0 font-mono text-xs font-bold text-white focus:outline-none focus:ring-0"
                          title="Click to edit questions target"
                        />
                        <span className="text-[10px] font-mono text-[#00FF66] font-bold">MCQs</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Remove chapter "${ch.name}" from syllabus?`)) {
                            onRemoveChapter(ch.id);
                          }
                        }}
                        className="text-white/40 hover:text-[#FF3333] p-1.5 rounded-lg transition-colors cursor-pointer"
                        title="Delete Chapter"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
