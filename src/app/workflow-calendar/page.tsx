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
  Image as ImageIcon,
  Eye,
  MessageSquare,
  FastForward,
  ArrowRight,
  FileText
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Task, Project, StaffMember, TaskProofFile, TaskNote } from '@/lib/types';

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

  // Task Details, Postponement & Collaboration Modal
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [postponeDate, setPostponeDate] = useState<string>('');
  const [newNoteText, setNewNoteText] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Proof Upload Modal
  const [proofTask, setProofTask] = useState<Task | null>(null);
  const [proofForm, setProofForm] = useState({
    name: '',
    url: '',
    dataUrl: '',
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

  const handleProofFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setProofForm(prev => ({
        ...prev,
        dataUrl: base64,
        name: prev.name || file.name.replace(/\.[^/.]+$/, ''),
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)} MB`
      }));
    };
    reader.readAsDataURL(file);
  };

  // Upload proof deliverable
  const handleUploadProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofTask) return;
    if (!proofForm.name.trim()) {
      alert('Please provide a proof deliverable title');
      return;
    }
    if (!proofForm.url.trim() && !proofForm.dataUrl) {
      alert('Please upload a screenshot/photo or provide a cloud URL');
      return;
    }

    try {
      const res = await fetch(`/api/tasks/${proofTask.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Campaign proof deliverable attached successfully!');
        setProofTask(null);
        setProofForm({ name: '', url: '', dataUrl: '', notes: '', fileSize: '1.8 MB' });
        loadData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePostponeTask = async (task: Task, targetDate: string) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: targetDate })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`⏩ Task rescheduled to ${targetDate}`);
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, dueDate: targetDate } : t));
        if (detailTask && detailTask.id === task.id) {
          setDetailTask(prev => prev ? { ...prev, dueDate: targetDate } : null);
        }
        window.dispatchEvent(new Event('crm-data-updated'));
      }
    } catch (e) {
      console.error(e);
      alert('Failed to postpone task');
    }
  };

  const handleAddNoteToTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTask || !newNoteText.trim()) return;

    const newNote: TaskNote = {
      id: `note-${Date.now()}`,
      author: currentStaff.name,
      role: currentStaff.role,
      message: newNoteText.trim(),
      authorId: currentStaff.id,
      authorName: currentStaff.name,
      authorRole: currentStaff.role,
      note: newNoteText.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedNotes = [...(detailTask.notesTrail || []), newNote];

    try {
      const res = await fetch(`/api/tasks/${detailTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notesTrail: updatedNotes })
      });
      const data = await res.json();
      if (data.success) {
        setDetailTask(prev => prev ? { ...prev, notesTrail: updatedNotes } : null);
        setTasks(prev => prev.map(t => t.id === detailTask.id ? { ...t, notesTrail: updatedNotes } : t));
        setNewNoteText('');
        showToast('💬 Note posted to task collaboration trail');
        window.dispatchEvent(new Event('crm-data-updated'));
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
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3"
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
                    {t.description ? (
                      <p className="text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs leading-relaxed">
                        {t.description}
                      </p>
                    ) : (
                      <p className="text-slate-400 italic text-[11px]">No description provided</p>
                    )}

                    {/* Attached proofs thumbnails */}
                    {t.proofFiles && t.proofFiles.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Attached Proofs / Screenshots:</span>
                        <div className="flex flex-wrap gap-2">
                          {t.proofFiles.map(pf => (
                            <button
                              type="button"
                              key={pf.id}
                              onClick={() => setPreviewImage(pf.dataUrl || pf.url)}
                              className="flex items-center space-x-1.5 p-1 bg-white border border-slate-200 hover:border-amber-400 rounded-lg transition"
                            >
                              <img src={pf.dataUrl || pf.url} alt={pf.name} className="w-7 h-7 object-cover rounded" />
                              <span className="text-[10px] font-bold text-slate-700 max-w-[110px] truncate">{pf.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 font-mono">
                      <span>Assigned: <strong>{t.assignedStaffName || 'Unassigned'}</strong></span>
                      <span>Est: {t.estimatedHours} hrs</span>
                    </div>

                    {/* Proof & Details buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => {
                          setDetailTask(t);
                          setPostponeDate(t.dueDate || selectedDateStr || '');
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs flex items-center space-x-1 border border-blue-200"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details & Notes</span>
                      </button>

                      <button
                        onClick={() => {
                          setProofTask(t);
                          setProofForm({ name: `${t.title} - Deliverable Proof`, url: '', dataUrl: '', notes: '', fileSize: '1.8 MB' });
                        }}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs flex items-center space-x-1"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Proof</span>
                      </button>

                      {t.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleCompleteTask(t)}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-sm"
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
                  placeholder="e.g. Meta Ads ROAS Screenshot or Creative Approval"
                  value={proofForm.name}
                  onChange={(e) => setProofForm({ ...proofForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                />
              </div>

              {/* Direct Photo / Screenshot File Upload */}
              <div className="space-y-1.5 p-3 bg-amber-50/50 rounded-2xl border border-amber-200/80">
                <label className="block font-bold text-amber-950 mb-0.5">
                  Upload Photo / Screenshot Directly (PNG/JPG)
                </label>
                <p className="text-[11px] text-amber-800/80 mb-2">
                  Pick a screenshot from your device. No need for external image hosting.
                </p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleProofFileChange}
                  className="w-full text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                />

                {proofForm.dataUrl && (
                  <div className="mt-2.5 p-2 bg-white rounded-xl border border-amber-300 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-2.5">
                      <img 
                        src={proofForm.dataUrl} 
                        alt="Screenshot Preview" 
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200" 
                      />
                      <div>
                        <p className="font-bold text-slate-800 text-[11px] truncate max-w-[180px]">{proofForm.name || 'Screenshot'}</p>
                        <span className="text-[10px] text-emerald-700 font-mono font-bold">✓ Ready ({proofForm.fileSize})</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProofForm(p => ({ ...p, dataUrl: '' }))}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold px-2 py-1 rounded hover:bg-rose-50"
                    >
                      ✕ Remove
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Or External Asset Cloud URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/... or https://unsplash.com/..."
                  value={proofForm.url}
                  onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Campaign Analytics & Execution Notes</label>
                <textarea
                  rows={2}
                  value={proofForm.notes}
                  onChange={(e) => setProofForm({ ...proofForm, notes: e.target.value })}
                  placeholder="e.g. Meta Ads campaign went live, CTR 4.8%, ROAS 3.4x verified..."
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
                  Attach Proof to Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Details & Collaboration Trail Modal */}
      {detailTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-700 border">
                    {detailTask.clientName || 'General Project'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    detailTask.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {detailTask.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="font-black text-lg text-slate-900">{detailTask.title}</h3>
              </div>
              <button onClick={() => setDetailTask(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">
              
              {/* Task Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200 font-medium">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Assigned Staff</span>
                  <span className="font-bold text-slate-800">{detailTask.assignedStaffName || 'Unassigned'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Priority</span>
                  <span className="font-bold text-slate-800">{detailTask.priority || 'MEDIUM'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Estimated Hours</span>
                  <span className="font-mono font-bold text-slate-800">{detailTask.estimatedHours || 2} hrs</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block uppercase">Due Date</span>
                  <span className="font-mono font-bold text-amber-700">{detailTask.dueDate || 'Immediate'}</span>
                </div>
              </div>

              {/* Task Description */}
              <div className="space-y-1.5">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Task Description & Deliverable Specs:</span>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed whitespace-pre-wrap">
                  {detailTask.description || 'No detailed instructions entered for this task.'}
                </div>
              </div>

              {/* Postpone Task Section */}
              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-3">
                <div className="flex items-center space-x-1.5 text-amber-900 font-bold">
                  <FastForward className="w-4 h-4 text-amber-600" />
                  <span>Postpone / Reschedule Task Date</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const baseDate = detailTask.dueDate ? new Date(detailTask.dueDate) : new Date();
                      baseDate.setDate(baseDate.getDate() + 1);
                      const nextDate = baseDate.toISOString().split('T')[0];
                      handlePostponeTask(detailTask, nextDate);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs shadow-sm flex items-center space-x-1"
                  >
                    <FastForward className="w-3.5 h-3.5" />
                    <span>⏩ Postpone to Tomorrow (+1 Day)</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <input
                      type="date"
                      value={postponeDate}
                      onChange={(e) => setPostponeDate(e.target.value)}
                      className="px-2.5 py-1.5 bg-white border border-amber-300 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                    <button
                      type="button"
                      disabled={!postponeDate || postponeDate === detailTask.dueDate}
                      onClick={() => handlePostponeTask(detailTask, postponeDate)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold rounded-xl text-xs"
                    >
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>

              {/* Attached Proofs & Screenshots */}
              {detailTask.proofFiles && detailTask.proofFiles.length > 0 && (
                <div className="space-y-2">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">Attached Campaign Proofs ({detailTask.proofFiles.length}):</span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {detailTask.proofFiles.map(pf => (
                      <div
                        key={pf.id}
                        onClick={() => setPreviewImage(pf.dataUrl || pf.url)}
                        className="p-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:border-amber-400 transition group space-y-1.5"
                      >
                        <div className="w-full h-24 bg-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                          <img src={pf.dataUrl || pf.url} alt={pf.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        </div>
                        <p className="font-bold text-slate-900 text-[11px] truncate">{pf.name}</p>
                        {pf.notes && <p className="text-[10px] text-slate-500 truncate">{pf.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Collaboration & Conversation Trail (Staff & Owner Updates, Doubts, Reviews) */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center space-x-1.5 text-slate-900 font-bold">
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Collaboration, Doubts & Review Trail</span>
                </div>

                {/* Conversation List */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto p-1">
                  {(!detailTask.notesTrail || detailTask.notesTrail.length === 0) ? (
                    <p className="text-slate-400 italic text-center py-3 bg-slate-50 rounded-xl">
                      No notes or doubts shared yet. Use the box below to ask questions or post sprint updates.
                    </p>
                  ) : (
                    detailTask.notesTrail.map(n => (
                      <div key={n.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-800">{n.author || n.authorName} <span className="text-[10px] text-slate-400 font-normal">({n.role || n.authorRole})</span></span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(n.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-slate-700 text-xs leading-relaxed">{n.message || n.note}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Note Form */}
                <form onSubmit={handleAddNoteToTask} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Type an update, question, or review note..."
                    value={newNoteText}
                    onChange={(e) => setNewNoteText(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm transition"
                  >
                    Post Note
                  </button>
                </form>
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                onClick={() => setDetailTask(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Screenshot / Image Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="relative max-w-3xl w-full bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950 text-white text-xs font-bold">
              <span>Proof Asset Screenshot Viewer</span>
              <div className="flex items-center space-x-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px]"
                >
                  Open in New Tab ↗
                </a>
                <button onClick={() => setPreviewImage(null)} className="p-1 hover:bg-slate-800 rounded text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[80vh] overflow-auto bg-slate-950/50">
              <img src={previewImage} alt="Full Deliverable Proof" className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            </div>
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
