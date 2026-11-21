'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  Clock, 
  FileText, 
  Send, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Printer, 
  X, 
  Plus, 
  ShieldCheck,
  Building,
  Sparkles,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Image as ImageIcon
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { Task, AttendanceRecord, LeaveApplication, StaffMember, TaskProofFile } from '@/lib/types';

export default function StaffPortalPage() {
  const { currentStaff, allProfiles, setCurrentStaff } = useAuth();

  const [activeTab, setActiveTab] = useState<'tasks' | 'attendance' | 'salary' | 'leave'>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);

  // Leave Form State
  const [leaveForm, setLeaveForm] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    leaveType: 'CASUAL' as 'CASUAL' | 'SICK' | 'PAID' | 'UNPAID',
    reason: ''
  });
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Proof Upload Modal State
  const [proofModalTask, setProofModalTask] = useState<Task | null>(null);
  const [proofForm, setProofForm] = useState({
    name: '',
    url: '',
    notes: '',
    fileSize: '1.5 MB'
  });

  // Task Completion & WhatsApp Share Modal State
  const [completionModal, setCompletionModal] = useState<{
    task: Task;
    completionNotes: string;
    shareData?: {
      clientMessage: string;
      clientWhatsAppUrl: string;
      ownerMessage: string;
      ownerWhatsAppUrl: string;
      progressPercent: number;
    };
  } | null>(null);

  // Salary Slip Modal
  const [showSlipModal, setShowSlipModal] = useState(false);

  // Fetch Portal Data
  const loadPortalData = async () => {
    try {
      setLoading(true);
      const [tasksRes, attRes, leavesRes] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json()),
        fetch(`/api/leaves?staffId=${currentStaff.id}`).then(r => r.json())
      ]);

      if (tasksRes.success) {
        // Filter tasks assigned to this staff member
        const myTasks = (tasksRes.data || []).filter((t: Task) => 
          t.assignedStaffId === currentStaff.id || 
          (t.assignedStaffName && t.assignedStaffName.toLowerCase().includes(currentStaff.name.toLowerCase()))
        );
        setTasks(myTasks);
      }

      if (attRes.success) {
        const myAttendance = (attRes.data || []).filter((a: AttendanceRecord) => a.staffId === currentStaff.id);
        setAttendance(myAttendance);
      }

      if (leavesRes.success) {
        setLeaves(leavesRes.data || []);
      }
    } catch (e) {
      console.error('Failed to load portal data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortalData();
  }, [currentStaff.id]);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Clock In / Clock Out Action
  const handleClockIn = async () => {
    const today = new Date().toISOString().split('T')[0];
    const existing = attendance.find(a => a.date === today);
    if (existing) {
      showToast(`Already checked in for today (${existing.status})!`);
      return;
    }

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: currentStaff.id,
          date: today,
          status: 'PRESENT',
          reason: 'Daily Check-in via Staff Portal'
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Clocked in successfully! Have a productive sprint.');
        loadPortalData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Leave Application
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveForm.reason.trim()) {
      alert('Please provide a reason for the leave application.');
      return;
    }

    const start = new Date(leaveForm.startDate);
    const end = new Date(leaveForm.endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysCount = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    try {
      setSubmittingLeave(true);
      const res = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: currentStaff.id,
          staffName: currentStaff.name,
          staffRole: currentStaff.role,
          staffEmail: currentStaff.email,
          startDate: leaveForm.startDate,
          endDate: leaveForm.endDate,
          daysCount,
          leaveType: leaveForm.leaveType,
          reason: leaveForm.reason
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Leave request submitted! Routed to Owner Rachel Adams for approval.');
        setLeaveForm({
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          leaveType: 'CASUAL',
          reason: ''
        });
        loadPortalData();
      } else {
        alert(data.error || 'Failed to submit leave.');
      }
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Upload Task Proof / Screenshot
  const handleAddProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofModalTask) return;

    try {
      const res = await fetch(`/api/tasks/${proofModalTask.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(proofForm)
      });
      const data = await res.json();
      if (data.success) {
        showToast('✓ Proof deliverable uploaded successfully!');
        setProofModalTask(null);
        setProofForm({ name: '', url: '', notes: '', fileSize: '1.5 MB' });
        loadPortalData();
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
          completionNotes: 'Deliverable finalized, reviewed, and ready for deployment.'
        })
      });
      const data = await res.json();
      if (data.success) {
        setCompletionModal({
          task,
          completionNotes: 'Deliverable finalized, reviewed, and ready for deployment.',
          shareData: data.data
        });
        loadPortalData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Salary Calculations
  const monthlySalary = currentStaff.monthlySalary || 0;
  const absentDays = attendance.filter(a => a.status === 'ABSENT').length;
  const halfDays = attendance.filter(a => a.status === 'HALF_DAY').length;
  const dailyRate = Math.round(monthlySalary / 30);
  const totalDeductions = (absentDays * dailyRate) + (halfDays * Math.round(dailyRate / 2));
  const netSalary = Math.max(0, monthlySalary - totalDeductions);

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Staff Identity & Quick Action Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-400 font-black text-2xl shadow-inner">
            {currentStaff.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="flex items-center space-x-2.5">
              <h1 className="text-2xl font-black tracking-tight">{currentStaff.name}</h1>
              <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
                {currentStaff.userId}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-amber-400 font-bold uppercase">{currentStaff.role.replace(/_/g, ' ')}</span>
              <span>•</span>
              <span>Shift: {currentStaff.shiftTiming || '09:30 AM - 07:30 PM'}</span>
              <span>•</span>
              <span className="text-emerald-400 font-semibold">{currentStaff.email}</span>
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Switch Profile Dropdown for quick testing */}
          <div className="flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
            <span className="text-slate-400 text-[10px] uppercase font-bold">Switch User:</span>
            <select
              value={currentStaff.id}
              onChange={(e) => {
                const found = allProfiles.find(p => p.id === e.target.value);
                if (found) setCurrentStaff(found);
              }}
              className="bg-transparent text-amber-300 font-bold focus:outline-none cursor-pointer"
            >
              {allProfiles.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                  {p.name} ({p.role.replace(/_/g, ' ')})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClockIn}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition"
          >
            <Clock className="w-4 h-4" />
            <span>Clock In Today</span>
          </button>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'tasks'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>My Assigned Tasks ({tasks.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'attendance'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Attendance & Logs ({attendance.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('salary')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'salary'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Salary & Payslip</span>
        </button>

        <button
          onClick={() => setActiveTab('leave')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'leave'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Apply for Leave ({leaves.length})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: MY ASSIGNED TASKS */}
      {/* ===================================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h2 className="text-base font-black text-slate-900">Sprint Tasks & Deliverables</h2>
              <p className="text-xs text-slate-500 mt-0.5">Tasks assigned directly to you across active client projects.</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full">
              {tasks.filter(t => t.status !== 'COMPLETED').length} Pending Tasks
            </span>
          </div>

          {tasks.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <CheckSquare className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-sm">No tasks currently assigned to you.</p>
              <p className="text-xs mt-1">Check back once your Project Manager schedules new sprint items.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition hover:shadow-md flex flex-col justify-between ${
                    task.status === 'COMPLETED' ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {task.clientName || 'Agency Project'}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        task.status === 'COMPLETED' 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : task.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300'
                      }`}>
                        {task.status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h3 className={`text-base font-extrabold ${task.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{task.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <span>Target: <strong className="text-slate-700">{task.dueDate || 'Sprint Window'}</strong></span>
                      <span>•</span>
                      <span>Est: <strong className="text-slate-700">{task.estimatedHours} hrs</strong></span>
                      <span>•</span>
                      <span className="text-amber-700 font-bold">{task.priority} Priority</span>
                    </div>

                    {/* Proof Deliverables List */}
                    {task.proofFiles && task.proofFiles.length > 0 && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Attached Proof Deliverables:</span>
                        {task.proofFiles.map(pf => (
                          <div key={pf.id} className="flex items-center justify-between text-[11px] text-slate-700">
                            <span className="flex items-center gap-1 font-semibold truncate max-w-[200px]">
                              <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                              {pf.name}
                            </span>
                            <a href={pf.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-0.5 text-[10px]">
                              View ↗
                            </a>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Task Actions */}
                  <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setProofModalTask(task);
                        setProofForm({ name: `${task.title} - Result Screenshot`, url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600', notes: 'Campaign metrics & deliverable verified', fileSize: '2.1 MB' });
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-slate-600" />
                      <span>Upload Proof / Ad Results</span>
                    </button>

                    {task.status !== 'COMPLETED' ? (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-sm transition"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Done & Share</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCompleteTask(task)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-100 transition"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Re-share with Client</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: ATTENDANCE & DAILY CLOCK-IN */}
      {/* ===================================================================== */}
      {activeTab === 'attendance' && (
        <div className="space-y-5">
          {/* Attendance KPI Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm text-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Total Days Recorded</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{attendance.length}</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Days Present</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">
                {attendance.filter(a => a.status === 'PRESENT').length}
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-[10px] font-bold text-amber-700 uppercase">Approved Leaves</span>
              <p className="text-2xl font-black text-amber-800 mt-1">
                {attendance.filter(a => a.status === 'PRE_APPLIED_LEAVE').length}
              </p>
            </div>
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl shadow-sm text-center">
              <span className="text-[10px] font-bold text-rose-700 uppercase">Unapproved Absences</span>
              <p className="text-2xl font-black text-rose-800 mt-1">
                {absentDays}
              </p>
            </div>
          </div>

          {/* Attendance History Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-sm text-slate-900">Attendance Log History</h3>
              <button
                onClick={handleClockIn}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition"
              >
                + Check In for Today
              </button>
            </div>

            {attendance.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">No attendance records logged yet.</div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {attendance.map((rec) => (
                  <div key={rec.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition">
                    <div>
                      <span className="font-mono font-bold text-slate-900">{rec.date}</span>
                      <p className="text-slate-500 text-[11px] mt-0.5">{rec.reason || 'Normal workday sprint'}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                        rec.status === 'PRESENT'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : rec.status === 'PRE_APPLIED_LEAVE'
                          ? 'bg-blue-100 text-blue-800 border-blue-300'
                          : rec.status === 'HALF_DAY'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : 'bg-rose-100 text-rose-800 border-rose-300'
                      }`}>
                        {rec.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: SALARY & PAYSLIP */}
      {/* ===================================================================== */}
      {activeTab === 'salary' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">CURRENT SPRINT PAYROLL</span>
              <h2 className="text-3xl font-black mt-1">₹{netSalary.toLocaleString('en-IN')}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Net Salary Payable after attendance & absence reconciliations.
              </p>
            </div>
            <button
              onClick={() => setShowSlipModal(true)}
              className="flex items-center space-x-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl shadow-lg transition self-start md:self-auto"
            >
              <Printer className="w-4 h-4" />
              <span>View & Print Official Payslip</span>
            </button>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Gross Monthly Base</span>
              <p className="text-xl font-black text-slate-900 font-mono mt-1">
                ₹{monthlySalary.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Agreed contractual retainer/salary</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Absence Deductions</span>
              <p className="text-xl font-black text-rose-600 font-mono mt-1">
                -₹{totalDeductions.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {absentDays} unapproved absence(s) • ₹{dailyRate}/day
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase">Payment Cycle Status</span>
              <p className="text-xl font-black text-emerald-600 font-mono mt-1">
                {currentStaff.salaryPaidDate || 'Ready for Payout'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1">Direct Bank Transfer / NEFT</p>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 4: APPLY FOR LEAVE */}
      {/* ===================================================================== */}
      {activeTab === 'leave' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Apply For Leave Form (5 cols) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Submit Leave Application</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted leaves route directly to Owner / Superadmin for review.
              </p>
            </div>

            <form onSubmit={handleApplyLeave} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Leave Type *</label>
                <select
                  value={leaveForm.leaveType}
                  onChange={(e) => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="CASUAL">Casual Leave (Personal / Family)</option>
                  <option value="SICK">Sick Leave (Medical / Health)</option>
                  <option value="PAID">Paid Privilege Leave</option>
                  <option value="UNPAID">Unpaid Leave</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">From Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.startDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">To Date *</label>
                  <input
                    type="date"
                    required
                    value={leaveForm.endDate}
                    onChange={(e) => setLeaveForm({ ...leaveForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Leave *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="e.g. Attending family wedding, doctor appointment, or medical recovery..."
                  value={leaveForm.reason}
                  onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                🔔 <strong>Owner Approval Workflow:</strong> Once submitted, your application enters a <strong>Pending Approval</strong> state. Only upon Owner approval will your leave balance and attendance record be formally adjusted.
              </div>

              <button
                type="submit"
                disabled={submittingLeave}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition disabled:opacity-50"
              >
                {submittingLeave ? 'Submitting Application...' : 'Send Leave Request to Owner'}
              </button>
            </form>
          </div>

          {/* Right: My Leave History & Approval Tracker (7 cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900">My Leave Applications & Live Status</h3>

            {leaves.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                No leave requests filed yet. Use the form on the left to apply.
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col justify-between space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900">{l.leaveType} LEAVE</span>
                        <span className="font-mono text-slate-400">•</span>
                        <span className="font-mono text-slate-600 font-bold">{l.daysCount} day(s)</span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] border ${
                        l.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : l.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                      }`}>
                        {l.status}
                      </span>
                    </div>

                    <p className="text-slate-600">{l.reason}</p>

                    <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-200/60 text-[11px] text-slate-400 font-mono">
                      <span>Duration: {l.startDate} to {l.endDate}</span>
                      {l.reviewedByStaffName && (
                        <span className="text-slate-600 font-semibold">
                          Reviewed by {l.reviewedByStaffName} ({l.reviewNotes || l.status})
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 1: PROOF / SCREENSHOT UPLOAD MODAL */}
      {/* ===================================================================== */}
      {proofModalTask && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <Upload className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900">Upload Task Proof / Result</h3>
              </div>
              <button onClick={() => setProofModalTask(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProof} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  value={proofForm.name}
                  onChange={(e) => setProofForm({ ...proofForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Screenshot / Cloud URL *</label>
                <input
                  type="url"
                  required
                  value={proofForm.url}
                  onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Execution & Metric Notes</label>
                <textarea
                  rows={3}
                  value={proofForm.notes}
                  onChange={(e) => setProofForm({ ...proofForm, notes: e.target.value })}
                  placeholder="e.g. Click-through rate reached 4.2%, 18 conversions recorded, code approved in PR #42..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setProofModalTask(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md"
                >
                  Save Proof Deliverable
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: TASK COMPLETED & CLIENT WHATSAPP SHARE MODAL */}
      {/* ===================================================================== */}
      {completionModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-emerald-50 shrink-0">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-sm text-emerald-950">Task Completed & WhatsApp Share</h3>
              </div>
              <button onClick={() => setCompletionModal(null)} className="p-1 rounded-lg hover:bg-emerald-100 text-emerald-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Overall Project Progress</span>
                  <p className="text-xl font-black text-emerald-900 mt-0.5">
                    {completionModal.shareData?.progressPercent || 100}% Completed
                  </p>
                </div>
                <span className="text-2xl">🚀</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pre-formatted Client WhatsApp Message</label>
                <textarea
                  rows={7}
                  readOnly
                  value={completionModal.shareData?.clientMessage || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed"
                />
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                🔔 <strong>Owner Rachel Adams</strong> has been simultaneously notified in the ERP activity audit trail.
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setCompletionModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-xs"
              >
                Done
              </button>

              {completionModal.shareData?.clientWhatsAppUrl && (
                <a
                  href={completionModal.shareData.clientWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send to Client WhatsApp Web ↗</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: OFFICIAL PRINTABLE SALARY SLIP */}
      {/* ===================================================================== */}
      {showSlipModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-fadeIn">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-sm text-slate-900">Official Monthly Salary Slip</h3>
              </div>
              <button onClick={() => setShowSlipModal(false)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Printable Payslip Body */}
            <div className="p-8 text-slate-900 space-y-6 overflow-y-auto flex-1 print:p-0">
              {/* Header */}
              <div className="flex items-start justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo.png" alt="Nearlook Mart Pvt Ltd" className="h-10 w-auto object-contain" />
                  </div>
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">NEARLOOK IT & DIGITAL AGENCY</h1>
                    <p className="text-[11px] text-slate-500">Bangalore Technology Park, Indiranagar, KA • GSTIN: 29AABCN8891P1Z4</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-mono font-bold bg-slate-100 px-2 py-1 rounded">PAYSLIP - NOV 2026</span>
                </div>
              </div>

              {/* Staff Details Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee Name</span>
                  <p className="font-black text-slate-900">{currentStaff.name}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Employee ID</span>
                  <p className="font-mono font-bold text-slate-900">{currentStaff.userId}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation & Role</span>
                  <p className="font-bold text-slate-900">{currentStaff.role.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                  <p className="font-bold text-slate-900">{currentStaff.team}</p>
                </div>
              </div>

              {/* Earnings & Deductions Table */}
              <div className="border rounded-xl overflow-hidden text-xs">
                <div className="grid grid-cols-2 bg-slate-100 font-bold p-2.5 border-b text-slate-700">
                  <span>Earnings Breakdown</span>
                  <span className="text-right">Amount (₹)</span>
                </div>
                <div className="divide-y divide-slate-100">
                  <div className="grid grid-cols-2 p-2.5">
                    <span>Basic Salary + Professional Allowances</span>
                    <span className="text-right font-mono font-bold">₹{monthlySalary.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="grid grid-cols-2 p-2.5 text-rose-600">
                    <span>Absence Deductions ({absentDays} Day(s) + {halfDays} Half-day)</span>
                    <span className="text-right font-mono font-bold">-₹{totalDeductions.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="grid grid-cols-2 p-3 bg-amber-50 font-black text-sm text-slate-900">
                    <span>NET SALARY PAYABLE</span>
                    <span className="text-right font-mono text-emerald-700">₹{netSalary.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 flex items-center justify-between text-center text-xs text-slate-400">
                <div>
                  <div className="w-32 border-b border-slate-300 mb-1 mx-auto"></div>
                  <span>Employee Signature</span>
                </div>
                <div>
                  <div className="w-32 border-b border-slate-300 mb-1 mx-auto"></div>
                  <span>Authorized Signature (Director)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setShowSlipModal(false)}
                className="px-4 py-2 bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Close
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Print Salary Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
