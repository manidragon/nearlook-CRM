'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Edit2, 
  Trash2, 
  Laptop, 
  Globe, 
  Bot, 
  Share2, 
  ExternalLink, 
  X, 
  Check, 
  Users, 
  Code2, 
  FileText,
  Sparkles,
  CheckSquare
} from 'lucide-react';
import { DailyReport, StaffMember, Project, Task } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

export default function DailyReportsPage() {
  const { currentStaff, isFieldStaff } = useAuth();

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [dateFilter, setDateFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingReport, setViewingReport] = useState<DailyReport | null>(null);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [deletingReport, setDeletingReport] = useState<DailyReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formStaffId, setFormStaffId] = useState('');
  const [formProjectId, setFormProjectId] = useState('');
  const [formDomain, setFormDomain] = useState<'SOFTWARE' | 'WEB' | 'AI' | 'MARKETING'>('SOFTWARE');
  const [formTasks, setFormTasks] = useState('');
  const [formHours, setFormHours] = useState('8');
  const [formBlockers, setFormBlockers] = useState('');
  const [formNextPlan, setFormNextPlan] = useState('');
  const [formRepoUrl, setFormRepoUrl] = useState('');

  const loadData = async () => {
    try {
      const [reportsRes, staffRes, projRes, tasksRes] = await Promise.all([
        fetch('/api/daily-reports').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);

      if (reportsRes.success) setReports(reportsRes.data);
      if (tasksRes.success) setTasks(tasksRes.data || []);
      if (staffRes.success) {
        setStaff(staffRes.data);
        if (!formStaffId && staffRes.data.length > 0) {
          const match = staffRes.data.find((s: StaffMember) => s.id === currentStaff.id) || staffRes.data[0];
          setFormStaffId(match.id);
        }
      }
      if (projRes.success) {
        setProjects(projRes.data);
        if (!formProjectId && projRes.data.length > 0) {
          setFormProjectId(projRes.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const resetForm = () => {
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormStaffId(currentStaff.id || (staff[0]?.id || ''));
    setFormProjectId(projects[0]?.id || '');
    setFormDomain('SOFTWARE');
    setFormTasks('');
    setFormHours('8');
    setFormBlockers('');
    setFormNextPlan('');
    setFormRepoUrl('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (r: DailyReport) => {
    setEditingReport(r);
    setFormDate(r.reportDate);
    setFormStaffId(r.staffId);
    setFormProjectId(r.projectId || '');
    setFormDomain((r.domain as any) || 'SOFTWARE');
    setFormTasks(r.tasksCompleted);
    setFormHours(String(r.hoursWorked));
    setFormBlockers(r.blockers || '');
    setFormNextPlan(r.nextDayPlan || '');
    setFormRepoUrl(r.repoOrAssetUrl || '');
  };

  const handleSaveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTasks) {
      alert('Please enter tasks completed');
      return;
    }

    const selectedStaff = staff.find(s => s.id === formStaffId);
    const selectedProject = projects.find(p => p.id === formProjectId);

    const staffTasks = tasks.filter(t => t.assignedStaffId === formStaffId);
    const staffCompletedCount = staffTasks.filter(t => t.status === 'COMPLETED').length;
    const staffPendingCount = staffTasks.filter(t => t.status !== 'COMPLETED').length;
    const staffOverdueCount = staffTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()).length;

    try {
      if (editingReport) {
        const res = await fetch('/api/daily-reports', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingReport.id,
            reportDate: formDate,
            staffId: formStaffId,
            staffName: selectedStaff?.name || editingReport.staffName,
            staffRole: selectedStaff?.role || editingReport.staffRole,
            projectId: formProjectId || undefined,
            projectName: selectedProject?.title || undefined,
            domain: formDomain,
            tasksCompleted: formTasks,
            hoursWorked: Number(formHours),
            blockers: formBlockers,
            nextDayPlan: formNextPlan,
            repoOrAssetUrl: formRepoUrl,
            completedTasksCount: staffCompletedCount,
            pendingTasksCount: staffPendingCount,
            overdueTasksCount: staffOverdueCount
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Daily Task Report updated.`);
          setEditingReport(null);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else {
        const res = await fetch('/api/daily-reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reportDate: formDate,
            staffId: formStaffId,
            staffName: selectedStaff?.name || currentStaff.name,
            staffRole: selectedStaff?.role || currentStaff.role,
            projectId: formProjectId || undefined,
            projectName: selectedProject?.title || undefined,
            domain: formDomain,
            tasksCompleted: formTasks,
            hoursWorked: Number(formHours),
            blockers: formBlockers,
            nextDayPlan: formNextPlan,
            repoOrAssetUrl: formRepoUrl,
            completedTasksCount: staffCompletedCount,
            pendingTasksCount: staffPendingCount,
            overdueTasksCount: staffOverdueCount
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Daily Report submitted successfully for ${formDate}.`);
          setShowCreateModal(false);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save daily report');
    }
  };

  const handleApproveReport = async (r: DailyReport) => {
    try {
      const res = await fetch('/api/daily-reports', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: r.id,
          status: 'APPROVED',
          supervisorNotes: `Approved by ${currentStaff.name}`
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`✓ Report by ${r.staffName} approved.`);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReport = async () => {
    if (!deletingReport) return;
    try {
      const res = await fetch(`/api/daily-reports?id=${deletingReport.id}&deletedBy=${encodeURIComponent(currentStaff.name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ Daily Report moved to Recycle Bin.`);
        setDeletingReport(null);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter
  const filtered = reports.filter(r => {
    const matchesSearch = 
      r.staffName.toLowerCase().includes(search.toLowerCase()) ||
      r.tasksCompleted.toLowerCase().includes(search.toLowerCase()) ||
      (r.projectName && r.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (r.blockers && r.blockers.toLowerCase().includes(search.toLowerCase()));

    const matchesDomain = domainFilter === 'ALL' || r.domain === domainFilter;
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesDate = !dateFilter || r.reportDate === dateFilter;

    return matchesSearch && matchesDomain && matchesStatus && matchesDate;
  });

  const totalHours = reports.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
  const blockersCount = reports.filter(r => r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.toLowerCase() !== 'none reported' && r.blockers.trim() !== '').length;

  const getDomainBadge = (domain?: string) => {
    switch (domain) {
      case 'SOFTWARE': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'WEB': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'AI': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'MARKETING': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Daily Task Reports (DSR)...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner (Enterprise Daily Task Reports / Standup) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Daily Task Reports (DSR) & Standup
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
              Live Standup
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Daily engineering output, pull requests, hours logged, and blockers across developers, AI specialists, designers, and marketing reps.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Submit Daily Report</span>
        </button>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm">✕</button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Reports Logged</span>
            <ClipboardList className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{reports.length}</p>
          <div className="text-[11px] text-blue-600 font-semibold mt-1">
            <span>Across engineering & growth</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Hours Logged</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{totalHours} hrs</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Productive dev & creative time</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Blockers / Impediments</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">{blockersCount}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Requiring PM attention</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Approved Reports</span>
            <CheckCircle2 className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-700 mt-2">
            {reports.filter(r => r.status === 'APPROVED').length}
          </p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Supervised & signed off</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search staff name, tasks accomplished, or project..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Domain Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Domain:</span>
            <select
              value={domainFilter}
              onChange={(e) => setDomainFilter(e.target.value)}
              aria-label="Filter by domain"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Domains</option>
              <option value="SOFTWARE">Software Dev</option>
              <option value="WEB">Web Dev</option>
              <option value="AI">AI Automation</option>
              <option value="MARKETING">Marketing</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Date:</span>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              aria-label="Filter by date"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {dateFilter && (
              <button onClick={() => setDateFilter('')} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕</button>
            )}
          </div>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Date & Staff</th>
                <th className="py-3 px-4">Project & Domain</th>
                <th className="py-3 px-4">Tasks Accomplished</th>
                <th className="py-3 px-4 text-center">Hours</th>
                <th className="py-3 px-4">Blockers</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No daily task reports found matching the criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => {
                  const hasBlocker = r.blockers && r.blockers.toLowerCase() !== 'none' && r.blockers.toLowerCase() !== 'none reported' && r.blockers.trim() !== '';
                  const isApproved = r.status === 'APPROVED';
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs">{r.staffName}</div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-0.5">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{r.reportDate}</span>
                          <span className="px-1 py-0.2 bg-slate-100 rounded text-slate-600 uppercase font-bold">{r.staffRole}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-800 text-xs">{r.projectName || 'General Platform Dev'}</div>
                        <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full border ${getDomainBadge(r.domain)}`}>
                          {r.domain || 'SOFTWARE'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2 leading-relaxed">{r.tasksCompleted}</p>
                        
                        {/* Task metrics badge */}
                        {(r.completedTasksCount !== undefined || r.pendingTasksCount !== undefined) && (
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              ✓ {r.completedTasksCount || 0} Done
                            </span>
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                              ⏳ {r.pendingTasksCount || 0} Pending
                            </span>
                            {(r.overdueTasksCount || 0) > 0 && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                🚨 {r.overdueTasksCount} Overdue
                              </span>
                            )}
                          </div>
                        )}

                        {r.repoOrAssetUrl && (
                          <a
                            href={r.repoOrAssetUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline mt-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>View PR / Asset</span>
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-900 font-mono">
                        {r.hoursWorked}h
                      </td>
                      <td className="py-3.5 px-4 max-w-xs">
                        {hasBlocker ? (
                          <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span className="truncate">{r.blockers}</span>
                          </span>
                        ) : (
                          <span className="text-emerald-700 text-[11px] font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>No Blockers</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isApproved ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isApproved && (
                            <button
                              onClick={() => handleApproveReport(r)}
                              title="Approve Report"
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => setViewingReport(r)}
                            title="View Full Report"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            title="Edit Report"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingReport(r)}
                            title="Delete Report (Move to Recycle Bin)"
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          CREATE / EDIT REPORT MODAL
         ========================================================================= */}
      {(showCreateModal || editingReport) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-lg text-slate-900">
                  {editingReport ? 'Edit Daily Task Report' : 'Submit Daily Task Report'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingReport(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReport} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Report Date *</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Staff Member *</label>
                    <select
                      value={formStaffId}
                      onChange={(e) => setFormStaffId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Project Associated</label>
                    <select
                      value={formProjectId}
                      onChange={(e) => setFormProjectId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Service Domain *</label>
                    <select
                      value={formDomain}
                      onChange={(e) => setFormDomain(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="SOFTWARE">Software Development</option>
                      <option value="WEB">Web Development</option>
                      <option value="AI">AI Automation</option>
                      <option value="MARKETING">Social Media Marketing</option>
                    </select>
                  </div>

                  {/* Assigned Task Summary & Auto-fill */}
                  {(() => {
                    const currentStaffTasks = tasks.filter(t => t.assignedStaffId === formStaffId);
                    const compCount = currentStaffTasks.filter(t => t.status === 'COMPLETED').length;
                    const pendCount = currentStaffTasks.filter(t => t.status !== 'COMPLETED').length;
                    const overCount = currentStaffTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && new Date(t.dueDate) < new Date()).length;

                    return (
                      <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                            Assigned Task Metrics & Tracking
                          </span>
                          {currentStaffTasks.length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const comp = currentStaffTasks.filter(t => t.status === 'COMPLETED').map(t => `• [COMPLETED] ${t.title}`);
                                const inProg = currentStaffTasks.filter(t => t.status !== 'COMPLETED').map(t => `• [IN-PROGRESS] ${t.title}`);
                                const combined = [...comp, ...inProg].join('\n');
                                if (combined) {
                                  setFormTasks(prev => prev ? `${prev}\n${combined}` : combined);
                                }
                              }}
                              className="text-[10px] text-amber-600 hover:text-amber-700 font-bold underline cursor-pointer"
                            >
                              Auto-Fill from Assigned Tasks
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <div className="text-emerald-700 font-black text-sm">{compCount}</div>
                            <div className="text-[10px] text-emerald-600 font-bold">Completed</div>
                          </div>
                          <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-blue-700 font-black text-sm">{pendCount}</div>
                            <div className="text-[10px] text-blue-600 font-bold">Pending</div>
                          </div>
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg">
                            <div className="text-rose-700 font-black text-sm">{overCount}</div>
                            <div className="text-[10px] text-rose-600 font-bold">Overdue</div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tasks Accomplished Today *</label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Describe code written, APIs tested, PRs merged, campaigns launched, or assets created..."
                      value={formTasks}
                      onChange={(e) => setFormTasks(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    ></textarea>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Hours Logged</label>
                    <input
                      type="number"
                      step="0.5"
                      value={formHours}
                      onChange={(e) => setFormHours(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">PR / GitHub / Asset Link</label>
                    <input
                      type="url"
                      placeholder="https://github.com/... or Figma link"
                      value={formRepoUrl}
                      onChange={(e) => setFormRepoUrl(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Blockers / Roadblocks</label>
                    <input
                      type="text"
                      placeholder="Mention any blocker, or leave empty if none"
                      value={formBlockers}
                      onChange={(e) => setFormBlockers(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Tomorrow's Planned Tasks</label>
                    <input
                      type="text"
                      placeholder="Next milestone tasks for tomorrow..."
                      value={formNextPlan}
                      onChange={(e) => setFormNextPlan(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingReport(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingReport ? 'Save Changes' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW REPORT DETAILS MODAL
         ========================================================================= */}
      {viewingReport && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <span className="font-mono text-[11px] text-slate-500 block mb-1">{viewingReport.reportDate}</span>
                <h3 className="font-black text-lg text-slate-900">{viewingReport.staffName}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                  {viewingReport.staffRole}
                </span>
              </div>
              <button
                onClick={() => setViewingReport(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Project & Domain</span>
                <span className="font-bold text-slate-900">{viewingReport.projectName || 'General Platform'} ({viewingReport.domain})</span>
              </div>

              <div>
                <span className="font-bold text-slate-500 uppercase text-[10px] block">Tasks Completed</span>
                <p className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 leading-relaxed mt-1">
                  {viewingReport.tasksCompleted}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Hours Logged</span>
                  <span className="font-black text-slate-900 text-sm">{viewingReport.hoursWorked} hours</span>
                </div>
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Review Status</span>
                  <span className="font-bold text-emerald-700">{viewingReport.status}</span>
                </div>
              </div>

              {viewingReport.blockers && (
                <div>
                  <span className="font-bold text-rose-600 uppercase text-[10px] block">Blockers / Roadblocks</span>
                  <p className="p-2 bg-rose-50 text-rose-800 rounded-lg text-xs mt-1 border border-rose-100">
                    {viewingReport.blockers}
                  </p>
                </div>
              )}

              {viewingReport.nextDayPlan && (
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Next Day's Plan</span>
                  <p className="text-slate-700 mt-1">{viewingReport.nextDayPlan}</p>
                </div>
              )}

              {viewingReport.repoOrAssetUrl && (
                <div>
                  <span className="font-bold text-slate-500 uppercase text-[10px] block">Deliverable URL</span>
                  <a
                    href={viewingReport.repoOrAssetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1 mt-1 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>{viewingReport.repoOrAssetUrl}</span>
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setViewingReport(null)}
                className="px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
         ========================================================================= */}
      {deletingReport && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">Move Daily Report to Recycle Bin?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to delete the report from <strong className="text-slate-800">{deletingReport.staffName} ({deletingReport.reportDate})</strong>? It can be restored anytime with a new ID number.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingReport(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReport}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

