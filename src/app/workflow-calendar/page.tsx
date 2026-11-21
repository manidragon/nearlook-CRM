'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Calendar as CalendarIcon, 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  CheckSquare, 
  Upload, 
  Send, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Users, 
  FolderKanban, 
  ExternalLink,
  Plus,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Task, Project, StaffMember, TaskProofFile } from '@/lib/types';

export default function WorkflowCalendarPage() {
  const { currentStaff, allProfiles, isOwnerOrAdmin } = useAuth();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Filters
  const [selectedStaffId, setSelectedStaffId] = useState<string>(
    isOwnerOrAdmin ? 'ALL' : currentStaff.id
  );
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');

  // Calendar Date Navigation
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)); // Nov 2026

  // Selected Day Drawer / Modal
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);

  // Proof Upload Modal
  const [proofTask, setProofTask] = useState<Task | null>(null);
  const [proofForm, setProofForm] = useState({
    name: '',
    url: '',
    notes: '',
    fileSize: '1.8 MB'
  });

  // Task Completion & WhatsApp Share Modal
  const [completionModal, setCompletionModal] = useState<{
    task: Task;
    shareData: {
      clientMessage: string;
      clientWhatsAppUrl: string;
      ownerMessage: string;
      ownerWhatsAppUrl: string;
      progressPercent: number;
    };
  } | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksRes, projectsRes] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/projects').then(r => r.json())
      ]);

      if (tasksRes.success) {
        setTasks(tasksRes.data || []);
      }
      if (projectsRes.success) {
        setProjects(projectsRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter tasks by staff and project
  const filteredTasks = tasks.filter(t => {
    const matchesStaff = selectedStaffId === 'ALL' || t.assignedStaffId === selectedStaffId;
    const matchesProject = selectedProjectId === 'ALL' || t.projectId === selectedProjectId;
    return matchesStaff && matchesProject;
  });

  // Calendar Grid Calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 1));
  };

  // Upload proof deliverable
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofTask) return;

    try {
      const res = await fetch(`/api/tasks/${proofTask.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Proof / deliverable uploaded successfully!');
        setProofTask(null);
        setProofForm({ name: '', url: '', notes: '', fileSize: '1.8 MB' });
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Complete Task & Trigger WhatsApp Share
  const handleCompleteTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff: currentStaff,
          completionNotes: 'Campaign & sprint milestone deliverable verified and closed.'
        })
      });
      const data = await res.json();
      if (data.success) {
        setCompletionModal({
          task,
          shareData: data.data
        });
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <CalendarIcon className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black tracking-tight">Task & Milestone Workflow Calendar</h1>
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
              Project Execution
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Separate professional workflow calendar for tracking client project deliverables, staff schedules, and social media/ad campaign proof uploads in real time.
          </p>
        </div>

        <Link
          href="/calendar"
          className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-bold text-xs shadow-sm transition self-start md:self-auto"
        >
          <CalendarDays className="w-4 h-4" />
          <span>Switch to Client Meetings Calendar ↗</span>
        </Link>
      </div>

      {/* Synchronized Filtering Bar (Per-User Sync with Owner + Per-Project) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Staff & Project Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Per-User Sync Selector */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <Users className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] uppercase font-bold text-slate-500">Staff Workflow:</span>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Team Members (Owner Master Sync)</option>
              {allProfiles.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Per-Project Filter */}
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs">
            <FolderKanban className="w-4 h-4 text-slate-500" />
            <span className="text-[10px] uppercase font-bold text-slate-500">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Month Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="font-black text-sm text-slate-900 px-3 min-w-[140px] text-center font-mono">
            {monthNames[month]} {year}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleToday}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center font-black text-xs text-slate-500 py-3 uppercase tracking-wider">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7 divide-x divide-y divide-slate-100 auto-rows-fr">
          {/* Empty cells before 1st of month */}
          {Array.from({ length: firstDayIndex }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[120px] bg-slate-50/50 p-2 text-slate-300"></div>
          ))}

          {/* Days of Month */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const dayTasks = filteredTasks.filter(t => t.dueDate === dateStr);
            const isToday = dayNum === 18 && month === 10; // 18 Nov 2026

            return (
              <div
                key={`day-${dayNum}`}
                onClick={() => setSelectedDateStr(dateStr)}
                className={`min-h-[120px] p-2.5 transition flex flex-col justify-between cursor-pointer group hover:bg-amber-50/30 ${
                  isToday ? 'bg-amber-50/40' : 'bg-white'
                }`}
              >
                {/* Date Header */}
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-black font-mono px-2 py-0.5 rounded-lg ${
                    isToday ? 'bg-amber-500 text-slate-950 font-black shadow-sm' : 'text-slate-700'
                  }`}>
                    {dayNum}
                  </span>

                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                      {dayTasks.length}
                    </span>
                  )}
                </div>

                {/* Day Tasks Badges */}
                <div className="space-y-1 my-1 overflow-hidden">
                  {dayTasks.slice(0, 2).map((t) => (
                    <div
                      key={t.id}
                      className={`text-[10px] px-2 py-1 rounded-lg font-bold truncate border flex items-center justify-between ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200 line-through'
                          : 'bg-slate-50 text-slate-800 border-slate-200'
                      }`}
                    >
                      <span className="truncate">{t.title}</span>
                      {t.proofFiles && t.proofFiles.length > 0 && (
                        <ImageIcon className="w-3 h-3 text-blue-500 ml-1 shrink-0" />
                      )}
                    </div>
                  ))}

                  {dayTasks.length > 2 && (
                    <span className="text-[10px] font-bold text-amber-600 block pl-1">
                      +{dayTasks.length - 2} more...
                    </span>
                  )}
                </div>

                <div className="text-[10px] text-slate-400 group-hover:text-amber-700 font-bold text-right opacity-0 group-hover:opacity-100 transition">
                  View Agenda →
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Agenda Drawer / Modal */}
      {selectedDateStr && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900">
                  Workflow Agenda: {selectedDateStr}
                </h3>
              </div>
              <button onClick={() => setSelectedDateStr(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
              {filteredTasks.filter(t => t.dueDate === selectedDateStr).length === 0 ? (
                <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl">
                  No project tasks scheduled for this date.
                </div>
              ) : (
                filteredTasks.filter(t => t.dueDate === selectedDateStr).map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border">
                        {t.clientName || 'General Project'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        t.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {t.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-sm text-slate-900">{t.title}</h4>
                    {t.description && <p className="text-slate-500">{t.description}</p>}

                    <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 font-mono">
                      <span>Assigned: <strong>{t.assignedStaffName || 'Unassigned'}</strong></span>
                      <span>Est: {t.estimatedHours} hrs</span>
                    </div>

                    {/* Proof deliverable buttons */}
                    <div className="flex items-center justify-end space-x-2 pt-2">
                      <button
                        onClick={() => {
                          setProofTask(t);
                          setProofForm({ name: `${t.title} - Ad Campaign Result`, url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600', notes: 'CTR 4.8%, ROAS 3.4x verified', fileSize: '2.4 MB' });
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center space-x-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Proof</span>
                      </button>

                      {t.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCompleteTask(t)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Complete & WhatsApp Share</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setSelectedDateStr(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Deliverable Upload Modal */}
      {proofTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900">Upload Campaign & Social Media Proof</h3>
              </div>
              <button onClick={() => setProofTask(null)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleUploadProof} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Proof / Deliverable Title *</label>
                <input
                  type="text"
                  required
                  value={proofForm.name}
                  onChange={(e) => setProofForm({ ...proofForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Screenshot / Asset Cloud URL *</label>
                <input
                  type="url"
                  required
                  value={proofForm.url}
                  onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Analytics & Execution Notes</label>
                <textarea
                  rows={3}
                  value={proofForm.notes}
                  onChange={(e) => setProofForm({ ...proofForm, notes: e.target.value })}
                  placeholder="e.g. Meta Ads campaign went live, 14,200 impressions, creative approved..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProofTask(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md"
                >
                  Attach to Calendar Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Completion & WhatsApp Share Modal */}
      {completionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 bg-emerald-50 -mx-6 -mt-6 p-6 rounded-t-3xl">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-emerald-950">Deliverable Completed & Progress Share</h3>
              </div>
              <button onClick={() => setCompletionModal(null)} className="p-1 text-emerald-700 hover:bg-emerald-100 rounded-lg">✕</button>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Overall Project Progress</span>
                <p className="text-xl font-black text-emerald-900 mt-0.5">
                  {completionModal.shareData.progressPercent}% Completed
                </p>
              </div>
              <span className="text-2xl">🚀</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Client WhatsApp Message</label>
              <textarea
                rows={7}
                readOnly
                value={completionModal.shareData.clientMessage}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setCompletionModal(null)}
                className="px-4 py-2 bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                Close
              </button>

              {completionModal.shareData.clientWhatsAppUrl && (
                <a
                  href={completionModal.shareData.clientWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Client WhatsApp ↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
