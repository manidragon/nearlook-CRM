'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Play,
  Square,
  RotateCcw,
  Plus,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  TrendingUp,
  Phone,
  Mail,
  Calendar,
  FileText,
  Key,
  Copy,
  Check,
  Lock,
  AlertCircle,
  Building,
  UserCheck,
  Pencil,
  Trash2,
  X,
  MessageCircle,
  Download,
  UserCog,
  Shield,
  CheckSquare2,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { StaffMember, Task, TimeLog, StaffRole, StaffTeam, AttendanceRecord, MonthlyWorkCalendar } from '@/lib/types';
import { getWhatsAppDirectUrl } from '@/lib/whatsappService';
import { useAuth } from '@/lib/AuthContext';
import { ALL_MODULE_KEYS, ALL_MODULE_KEY_STRINGS } from '@/lib/auth';

const ROLE_COLORS: Record<string, string> = {
  ADMIN: 'bg-rose-50 text-rose-700 border-rose-200',
  OWNER: 'bg-rose-50 text-rose-700 border-rose-200',
  ACCOUNT_MANAGER: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PROJECT_MANAGER: 'bg-orange-50 text-orange-700 border-orange-200',
  DEVELOPER: 'bg-blue-50 text-blue-700 border-blue-200',
  FIELD_STAFF: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  MARKETER: 'bg-amber-50 text-amber-700 border-amber-200',
  DESIGNER: 'bg-purple-50 text-purple-700 border-purple-200',
  CONTENT_WRITER: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const TEAM_LABELS: Record<string, string> = {
  MANAGEMENT: 'Executive Management',
  ACCOUNTS: 'Accounts & Finance',
  WEB_DEVELOPMENT: 'Engineering & Tech',
  MARKETING: 'Growth & Marketing',
  DESIGN: 'UI/UX & Creative',
  CONTENT: 'Content Strategy',
  FIELD_STAFF: 'On-Field Client Reps',
};

const DEFAULT_TEAMS = [
  { key: 'WEB_DEVELOPMENT', label: 'Engineering & Tech' },
  { key: 'MARKETING', label: 'Growth & Marketing' },
  { key: 'DESIGN', label: 'UI/UX & Creative' },
  { key: 'CONTENT', label: 'Content Strategy' },
  { key: 'ACCOUNTS', label: 'Accounts & Finance' },
  { key: 'FIELD_STAFF', label: 'On-Field Client Reps' },
  { key: 'MANAGEMENT', label: 'Executive Management' },
];

const DEFAULT_ROLES = [
  { key: 'DEVELOPER', label: 'Developer (Field Staff Isolation)' },
  { key: 'FIELD_STAFF', label: 'Field Staff / Rep' },
  { key: 'ACCOUNT_MANAGER', label: 'Account Manager (Financials Access)' },
  { key: 'PROJECT_MANAGER', label: 'Project Manager' },
  { key: 'MARKETER', label: 'Performance Marketer' },
  { key: 'DESIGNER', label: 'UI/UX Designer' },
  { key: 'CONTENT_WRITER', label: 'Content Writer' },
  { key: 'ADMIN', label: 'System Admin' },
  { key: 'OWNER', label: 'Agency Owner' },
];

export default function StaffPage() {
  const { currentUser, currentStaff, canViewFinancials, canManageStaff, isOwnerOrAdmin, canManageUsers, updateCurrentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'matrix' | 'payroll'>('matrix');

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Profile Modal State (Owner / Current User)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [showViewStaffPassword, setShowViewStaffPassword] = useState(false);
  const [copiedViewStaffPassword, setCopiedViewStaffPassword] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    avatar: ''
  });

  // New Credentials Pop-up
  const [newCredentials, setNewCredentials] = useState<{
    name: string;
    userId: string;
    password?: string;
    role: string;
    team: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Live Stopwatch State
  const [timerRunning, setTimerRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [isBillable, setIsBillable] = useState(true);
  const [timeNotes, setTimeNotes] = useState('');

  // Local Time Logs
  const [recentLogs, setRecentLogs] = useState<TimeLog[]>([
    {
      id: 'tl-1',
      taskId: 'task-1',
      staffId: 'staff-4',
      staffName: 'Priya Sharma',
      durationMinutes: 120,
      isBillable: true,
      notes: 'Compiled Google Ads and Shopify GMV attribution reports',
      loggedAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'tl-2',
      taskId: 'task-2',
      staffId: 'staff-3',
      staffName: 'David Chen',
      durationMinutes: 240,
      isBillable: true,
      notes: 'Stripe webhook signature check and sandbox testing',
      loggedAt: new Date(Date.now() - 3600000 * 8).toISOString()
    },
    {
      id: 'tl-3',
      taskId: 'task-3',
      staffId: 'staff-5',
      staffName: 'Maya Lin',
      durationMinutes: 180,
      isBillable: true,
      notes: 'High-fidelity Figma wireframes for personal injury funnel',
      loggedAt: new Date(Date.now() - 3600000 * 20).toISOString()
    }
  ]);

  // Attendance & Payroll State (Phase 6)
  const [calendar, setCalendar] = useState<MonthlyWorkCalendar | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [attendanceForm, setAttendanceForm] = useState({
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'PRESENT' as 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'PRE_APPLIED_LEAVE',
    reason: ''
  });
  const [attendanceSuccessMessage, setAttendanceSuccessMessage] = useState('');

  // Salary Slip Modal State
  const [showSalarySlipModal, setShowSalarySlipModal] = useState(false);
  const [selectedSlipStaff, setSelectedSlipStaff] = useState<{
    staff: StaffMember;
    totalDeduction: number;
    netPayable: number;
    absentDays: number;
    halfDays: number;
  } | null>(null);

  // New Staff Onboarding Form (Phase 1)
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: 'Bangalore, Karnataka',
    monthlySalary: '45000',
    hourlyRate: '1500',
    role: 'DEVELOPER' as StaffRole,
    team: 'WEB_DEVELOPMENT' as StaffTeam,
    shiftTiming: '09:30 AM - 07:30 PM (Standard Slot)',
    docResume: true,
    docPayslip: true,
    docIdProof: true,
    allowedModules: [...ALL_MODULE_KEY_STRINGS],
    canManageUsers: false
  });

  // Edit Staff State
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [copiedEditPassword, setCopiedEditPassword] = useState(false);
  const [editStaffForm, setEditStaffForm] = useState({
    name: '',
    userId: '',
    password: '',
    email: '',
    phone: '',
    address: '',
    monthlySalary: '',
    hourlyRate: '',
    role: 'DEVELOPER' as StaffRole,
    team: 'WEB_DEVELOPMENT' as StaffTeam,
    shiftTiming: '09:30 AM - 07:30 PM (Standard Slot)',
    allowedModules: [] as string[],
    canManageUsers: false
  });

  // Edit Attendance State
  const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
  const [isEditAttendanceModalOpen, setIsEditAttendanceModalOpen] = useState(false);
  const [editAttendanceForm, setEditAttendanceForm] = useState({
    date: '',
    status: 'PRESENT' as 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'PRE_APPLIED_LEAVE',
    reason: ''
  });

  // Dynamic Custom Teams & Roles State
  const [customTeams, setCustomTeams] = useState<{ key: string; label: string }[]>([]);
  const [customRoles, setCustomRoles] = useState<{ key: string; label: string; color?: string }[]>([]);
  const [showAddTeamModal, setShowAddTeamModal] = useState(false);
  const [showAddRoleModal, setShowAddRoleModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('bg-blue-100 text-blue-800 border-blue-200');
  const [targetFormType, setTargetFormType] = useState<'create' | 'edit'>('create');

  // Load custom teams and roles from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const savedTeams = localStorage.getItem('nearlook_custom_teams');
        if (savedTeams) {
          const parsed = JSON.parse(savedTeams);
          if (Array.isArray(parsed)) {
            setCustomTeams(parsed);
            parsed.forEach((t: { key: string; label: string }) => {
              if (t.key && t.label) TEAM_LABELS[t.key] = t.label;
            });
          }
        }
        const savedRoles = localStorage.getItem('nearlook_custom_roles');
        if (savedRoles) {
          const parsed = JSON.parse(savedRoles);
          if (Array.isArray(parsed)) {
            setCustomRoles(parsed);
            parsed.forEach((r: { key: string; label: string; color?: string }) => {
              if (r.key && r.color) ROLE_COLORS[r.key] = r.color;
            });
          }
        }
      }
    } catch (e) {
      console.error('Failed to load custom teams and roles:', e);
    }
  }, []);

  // Merge default + custom + any teams found on existing staff members
  const allTeams = React.useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_TEAMS.forEach(t => map.set(t.key, t.label));
    customTeams.forEach(t => map.set(t.key, t.label));
    staff.forEach(s => {
      if (s.team && !map.has(s.team)) {
        map.set(s.team, TEAM_LABELS[s.team] || s.team.replace(/_/g, ' '));
      }
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [customTeams, staff]);

  const allRoles = React.useMemo(() => {
    const map = new Map<string, string>();
    DEFAULT_ROLES.forEach(r => map.set(r.key, r.label));
    customRoles.forEach(r => map.set(r.key, r.label));
    staff.forEach(s => {
      if (s.role && !map.has(s.role)) {
        map.set(s.role, s.role.replace(/_/g, ' '));
      }
    });
    return Array.from(map.entries()).map(([key, label]) => ({ key, label }));
  }, [customRoles, staff]);

  const handleAddNewTeam = () => {
    const trimmed = newTeamName.trim();
    if (!trimmed) return;
    const key = trimmed.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') || `TEAM_${Date.now()}`;
    const newEntry = { key, label: trimmed };
    TEAM_LABELS[key] = trimmed;

    const updated = [...customTeams.filter(t => t.key !== key), newEntry];
    setCustomTeams(updated);
    try {
      localStorage.setItem('nearlook_custom_teams', JSON.stringify(updated));
    } catch (e) { }

    if (targetFormType === 'create') {
      setStaffForm(prev => ({ ...prev, team: key as StaffTeam }));
    } else {
      setEditStaffForm(prev => ({ ...prev, team: key as StaffTeam }));
    }
    setNewTeamName('');
    setShowAddTeamModal(false);
  };

  const handleAddNewRole = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    const key = trimmed.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '') || `ROLE_${Date.now()}`;
    const newEntry = { key, label: trimmed, color: newRoleColor };
    ROLE_COLORS[key] = newRoleColor;

    const updated = [...customRoles.filter(r => r.key !== key), newEntry];
    setCustomRoles(updated);
    try {
      localStorage.setItem('nearlook_custom_roles', JSON.stringify(updated));
    } catch (e) { }

    if (targetFormType === 'create') {
      setStaffForm(prev => ({ ...prev, role: key as StaffRole }));
    } else {
      setEditStaffForm(prev => ({ ...prev, role: key as StaffRole }));
    }
    setNewRoleName('');
    setShowAddRoleModal(false);
  };

  const loadData = async () => {
    try {
      const [staffRes, tasksRes, attendanceRes] = await Promise.all([
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/attendance').then(r => r.json())
      ]);

      if (staffRes.success) {
        setStaff(staffRes.data);
        if (!selectedStaffId && staffRes.data.length > 0) {
          setSelectedStaffId(staffRes.data[0].id);
        }
        if (!attendanceForm.staffId && staffRes.data.length > 0) {
          setAttendanceForm(prev => ({ ...prev, staffId: staffRes.data[0].id }));
        }
      }
      if (tasksRes.success) {
        setTasks(tasksRes.data);
        if (!selectedTaskId && tasksRes.data.length > 0) {
          setSelectedTaskId(tasksRes.data[0].id);
        }
      }
      if (attendanceRes.success) {
        setCalendar(attendanceRes.calendar);
        setAttendanceRecords(attendanceRes.attendance || []);
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

  useEffect(() => {
    let interval: any = null;
    if (timerRunning) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerRunning]);

  const formatTimer = (secs: number) => {
    const hrs = Math.floor(secs / 3600);
    const mins = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStopAndLogTime = () => {
    if (secondsElapsed < 5) {
      alert('Log at least a few seconds of work to record time.');
      return;
    }

    setTimerRunning(false);
    const durationMins = Math.max(1, Math.round(secondsElapsed / 60));
    const staffMember = staff.find(s => s.id === selectedStaffId);

    const newLog: TimeLog = {
      id: `tl-${Date.now()}`,
      taskId: selectedTaskId,
      staffId: selectedStaffId,
      staffName: staffMember?.name || 'Staff Member',
      durationMinutes: durationMins,
      isBillable,
      notes: timeNotes || 'Live session logged via Task Timer',
      loggedAt: new Date().toISOString()
    };

    setRecentLogs(prev => [newLog, ...prev]);
    setSecondsElapsed(0);
    setTimeNotes('');
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const documents = [];
      if (staffForm.docResume) documents.push({ id: `doc-${Date.now()}-1`, type: 'RESUME' as const, name: `${staffForm.name}_Resume.pdf`, uploadedAt: new Date().toISOString() });
      if (staffForm.docPayslip) documents.push({ id: `doc-${Date.now()}-2`, type: 'PAYSLIP' as const, name: `Previous_Payslip.pdf`, uploadedAt: new Date().toISOString() });
      if (staffForm.docIdProof) documents.push({ id: `doc-${Date.now()}-3`, type: 'ID_PROOF' as const, name: `Aadhaar_PAN_Verification.pdf`, uploadedAt: new Date().toISOString() });

      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffForm.name,
          email: staffForm.email,
          phone: staffForm.phone,
          address: staffForm.address,
          monthlySalary: Number(staffForm.monthlySalary) || 0,
          hourlyRate: Number(staffForm.hourlyRate) || 1500,
          role: staffForm.role,
          team: staffForm.team,
          shiftTiming: staffForm.shiftTiming,
          allowedModules: staffForm.allowedModules,
          canManageUsers: staffForm.canManageUsers,
          documents
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        await loadData();
        setIsModalOpen(false);
        // Show auto-generated login credentials modal
        setNewCredentials({
          name: data.data.name,
          userId: data.data.userId || 'STF-101',
          password: data.data.password || 'TechStaff@2026',
          role: data.data.role,
          team: data.data.team
        });

        setStaffForm({
          name: '',
          email: '',
          phone: '',
          address: 'Bangalore, Karnataka',
          monthlySalary: '45000',
          hourlyRate: '1500',
          role: 'DEVELOPER',
          team: 'WEB_DEVELOPMENT',
          shiftTiming: '09:30 AM - 07:30 PM (Standard Slot)',
          docResume: true,
          docPayslip: true,
          docIdProof: true,
          allowedModules: [...ALL_MODULE_KEY_STRINGS],
          canManageUsers: false
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenSalarySlip = (
    member: StaffMember,
    totalDeduction: number,
    netPayable: number,
    absentDays: number,
    halfDays: number
  ) => {
    setSelectedSlipStaff({
      staff: member,
      totalDeduction,
      netPayable,
      absentDays,
      halfDays
    });
    setShowSalarySlipModal(true);
  };

  const handleShareSlipWhatsApp = (
    member: StaffMember,
    netPayable: number,
    totalDeduction: number,
    absentDays: number
  ) => {
    const monthYear = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    const text = encodeURIComponent(
      `*SALARY DISBURSEMENT SLIP - ${monthYear.toUpperCase()}*\n` +
      `🏢 *Nearlook Mart Pvt Ltd (Nearlook Agency ERP)*\n\n` +
      `👤 Employee: *${member.name}* (${member.userId})\n` +
      `💼 Role: *${member.role.replace('_', ' ')}*\n` +
      `⏰ Shift: *${member.shiftTiming || '09:30 AM - 07:30 PM Standard'}*\n\n` +
      `💰 *Gross Base Salary:* ₹${(member.monthlySalary ?? 0).toLocaleString('en-IN')}\n` +
      `⚠️ *Unapproved Absences:* ${absentDays} days\n` +
      `🔻 *Total Statutory Deductions:* ₹${totalDeduction.toLocaleString('en-IN')}\n` +
      `---------------------------------\n` +
      `✅ *NET PAYABLE SALARY:* *₹${netPayable.toLocaleString('en-IN')}*\n` +
      `---------------------------------\n` +
      `Thank you for your valuable contribution to Nearlook Mart Pvt Ltd!`
    );
    const phone = member.phone ? member.phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.startsWith('91') && phone.length === 12 ? phone : phone.length === 10 ? `91${phone}` : phone;
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  const handleLogAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!attendanceForm.staffId) return;

    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attendanceForm)
      });
      const data = await res.json();
      if (data.success) {
        setAttendanceSuccessMessage(`Attendance recorded: ${attendanceForm.status.replace('_', ' ')} for ${attendanceForm.date}`);
        setTimeout(() => setAttendanceSuccessMessage(''), 4000);
        // Reload attendance data
        const freshRes = await fetch('/api/attendance').then(r => r.json());
        if (freshRes.success) {
          setAttendanceRecords(freshRes.attendance || []);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Edit and Delete Staff Handlers
  const openEditStaff = (member: StaffMember) => {
    setEditingStaff(member);
    setEditStaffForm({
      name: member.name,
      userId: member.userId || `STF-${Math.floor(100 + Math.random() * 900)}`,
      password: member.password || `${member.name.split(' ')[0]}#Nearlook${Math.floor(1000 + Math.random() * 9000)}!`,
      email: member.email || '',
      phone: member.phone || '',
      address: member.address || '',
      monthlySalary: String(member.monthlySalary ?? 0),
      hourlyRate: String(member.hourlyRate || 1500),
      role: member.role,
      team: member.team,
      shiftTiming: member.shiftTiming || '09:30 AM - 07:30 PM (Standard Slot)',
      allowedModules: member.allowedModules || [...ALL_MODULE_KEY_STRINGS],
      canManageUsers: Boolean(member.canManageUsers)
    });
    setShowEditPassword(false);
    setCopiedEditPassword(false);
    setIsEditStaffModalOpen(true);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    try {
      const res = await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingStaff.id,
          ...editStaffForm,
          userId: editStaffForm.userId,
          password: editStaffForm.password,
          monthlySalary: Number(editStaffForm.monthlySalary) || 0,
          hourlyRate: Number(editStaffForm.hourlyRate) || 0,
          shiftTiming: editStaffForm.shiftTiming,
          allowedModules: editStaffForm.allowedModules,
          canManageUsers: editStaffForm.canManageUsers
        })
      });
      const data = await res.json();
      if (data.success) {
        setStaff(prev => prev.map(s => s.id === editingStaff.id ? data.data : s));
        setIsEditStaffModalOpen(false);
        setEditingStaff(null);
      } else {
        alert(data.error || 'Failed to update staff member');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating staff member');
    }
  };

  const handleOpenProfile = () => {
    setProfileForm({
      name: currentStaff.name || '',
      email: currentStaff.email || '',
      phone: currentStaff.phone || '',
      address: currentStaff.address || '',
      avatar: currentStaff.avatar || ''
    });
    setIsProfileModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/staff/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: currentStaff.id,
          ...profileForm
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        updateCurrentUser(data.data);
        setStaff(prev => prev.map(s => s.id === currentStaff.id ? { ...s, ...data.data } : s));
        setIsProfileModalOpen(false);
        alert('Your profile details have been successfully updated!');
      } else {
        alert(data.error || 'Failed to update profile');
      }
    } catch (err: any) {
      alert(err.message || 'Error updating profile');
    }
  };

  const handleDeleteStaff = async (member: StaffMember) => {
    if (!confirm(`Are you sure you want to delete staff member "${member.name}" (${member.userId})? This will also remove their assignments.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/staff?id=${member.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setStaff(prev => prev.filter(s => s.id !== member.id));
      } else {
        alert(data.error || 'Failed to delete staff member');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting staff');
    }
  };

  // Edit and Delete Attendance Handlers
  const openEditAttendance = (record: AttendanceRecord) => {
    setEditingAttendance(record);
    setEditAttendanceForm({
      date: record.date,
      status: record.status as any,
      reason: record.reason || ''
    });
    setIsEditAttendanceModalOpen(true);
  };

  const handleUpdateAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAttendance) return;
    try {
      const res = await fetch('/api/attendance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingAttendance.id,
          date: editAttendanceForm.date,
          status: editAttendanceForm.status,
          reason: editAttendanceForm.reason
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsEditAttendanceModalOpen(false);
        setEditingAttendance(null);
        // Refresh attendance records
        const freshRes = await fetch('/api/attendance').then(r => r.json());
        if (freshRes.success) {
          setAttendanceRecords(freshRes.attendance || []);
        }
      } else {
        alert(data.error || 'Failed to update attendance');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating attendance');
    }
  };

  const handleDeleteAttendance = async (record: AttendanceRecord) => {
    if (!confirm(`Are you sure you want to delete this attendance record for ${record.staffName} on ${record.date}?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/attendance?id=${record.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        // Refresh attendance records
        const freshRes = await fetch('/api/attendance').then(r => r.json());
        if (freshRes.success) {
          setAttendanceRecords(freshRes.attendance || []);
        }
      } else {
        alert(data.error || 'Failed to delete attendance record');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting attendance record');
    }
  };

  const copyCredentialsToClipboard = () => {
    if (!newCredentials) return;
    const text = `IT CRM Login Credentials\nName: ${newCredentials.name}\nUser ID: ${newCredentials.userId}\nPassword: ${newCredentials.password}\nRole: ${newCredentials.role}\nTeam: ${newCredentials.team}\nPortal URL: http://localhost:3005`;
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-orange-600" />
            Staff Onboarding, Workload & Payroll (₹ INR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Phase 1 & 6: Automated credential generation, team permissions, daily attendance, and monthly salary deductions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={handleOpenProfile}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:border-orange-300 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-bold shadow-xs transition-all"
            title="Edit your name, phone, email & avatar"
          >
            <UserCog className="w-4 h-4 text-orange-600" />
            <span>Edit My Profile</span>
          </button>

          {isOwnerOrAdmin && (
            <Link
              href="/approvals"
              className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all"
            >
              <Shield className="w-4 h-4" />
              <span>Approvals Hub</span>
            </Link>
          )}

          {(canManageStaff || canManageUsers) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Onboard New Staff</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'matrix'
            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Staff Directory & Workload Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('payroll')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'payroll'
            ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Attendance & Payroll Engine</span>
        </button>
      </div>

      {/* TAB 1: Directory & Workload Matrix */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          {/* Top Stopwatch Widget in White & Vibrant Orange */}
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl shadow-orange-500/15 relative overflow-hidden">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-orange-100 flex items-center gap-1.5 mb-1">
                  <Clock className="w-3.5 h-3.5" />
                  Live Agency Time Tracker
                </span>
                <div className="text-4xl font-black font-mono tracking-tight text-white mt-1">
                  {formatTimer(secondsElapsed)}
                </div>
                <p className="text-xs text-orange-100 mt-1 font-medium">
                  Measure billable agency hours in ₹ INR against clients & deliverables.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-2xl">
                <div>
                  <label className="text-[11px] font-bold text-orange-100 block mb-1">Active Task</label>
                  <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-orange-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    {tasks.map(t => (
                      <option key={t.id} value={t.id}>[{t.clientName}] {t.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-orange-100 block mb-1">Staff Member</label>
                  <select
                    value={selectedStaffId}
                    onChange={(e) => setSelectedStaffId(e.target.value)}
                    className="w-full bg-white text-slate-900 border border-orange-200 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-orange-300"
                  >
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.userId})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-orange-100 block mb-1">Billing Type</label>
                  <button
                    type="button"
                    onClick={() => setIsBillable(!isBillable)}
                    className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-1.5 shadow-sm ${isBillable
                      ? 'bg-white text-orange-700 border-white'
                      : 'bg-orange-700/60 text-white border-orange-400'
                      }`}
                  >
                    <span>{isBillable ? '₹ Billable' : 'Non-Billable'}</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!timerRunning ? (
                  <button
                    onClick={() => setTimerRunning(true)}
                    className="px-5 py-3 bg-white hover:bg-orange-50 text-orange-700 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all"
                  >
                    <Play className="w-4 h-4 fill-orange-700" />
                    <span>Start Timer</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopAndLogTime}
                    className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-lg transition-all animate-pulse"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop & Log</span>
                  </button>
                )}

                <button
                  onClick={() => { setTimerRunning(false); setSecondsElapsed(0); }}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Staff Workload Capacity Matrix */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                  Staff Workload Matrix & Utilization
                </h2>
                <p className="text-xs text-slate-500">
                  Active concurrent deliverables, auto-generated login User IDs, and team department isolation.
                </p>
              </div>
              <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                Agency Benchmark: 5 Tasks = 100% Load
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.map((member) => {
                const activeCount = member.activeTasksCount || 0;
                const loadPercent = Math.min(100, Math.round((activeCount / 5) * 100));
                const roleStyle = ROLE_COLORS[member.role] || ROLE_COLORS.DEVELOPER;

                let statusColor = 'text-emerald-700';
                let statusText = 'Optimal Bandwidth';
                if (loadPercent >= 100) {
                  statusColor = 'text-rose-700';
                  statusText = 'At Max Capacity';
                } else if (loadPercent >= 70) {
                  statusColor = 'text-amber-700';
                  statusText = 'Moderate Load';
                }

                const waDirect = getWhatsAppDirectUrl(member.phone, `Hi ${member.name}, checking in on your active agency deliverables.`);

                return (
                  <div
                    key={member.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3 hover:border-orange-300 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-black text-xs border border-orange-200">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-slate-900">
                              {member.name}
                            </h3>
                            <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                              {member.userId}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${roleStyle}`}>
                              {member.role.replace('_', ' ')}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              • {TEAM_LABELS[member.team] || member.team}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500 font-medium">
                            <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            <span>{member.shiftTiming || '09:30 AM - 07:30 PM (Standard)'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingStaff(member)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="View Staff Profile & Credentials"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {canManageStaff && (
                          <>
                            <button
                              onClick={() => openEditStaff(member)}
                              className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors"
                              title="Edit Staff Member"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                              title="Delete Staff Member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <a
                          href={waDirect}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors border border-emerald-200"
                          title="Direct WhatsApp Staff Nudge"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-semibold">Workload: {activeCount} tasks</span>
                        <span className="font-bold text-slate-900">{loadPercent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${loadPercent >= 100
                            ? 'bg-rose-500'
                            : loadPercent >= 70
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                            }`}
                          style={{ width: `${loadPercent}%` }}
                        ></div>
                      </div>
                      <div className={`text-[10px] font-bold text-right ${statusColor}`}>
                        {statusText}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                      {canViewFinancials ? (
                        <span>Salary: <strong className="text-slate-900 font-bold">₹{member.monthlySalary?.toLocaleString('en-IN')}/mo</strong></span>
                      ) : (
                        <span className="text-slate-400 italic flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Financials Protected
                        </span>
                      )}
                      <span className="text-[11px] text-orange-600 font-semibold">{member.phone}</span>
                    </div>

                    {member.documents && member.documents.length > 0 && (
                      <div className="text-[11px] text-slate-500 pt-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-slate-400" />
                        <span>{member.documents.length} Onboarding Docs Verified</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent Time Tracking Audit Logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              Recent Billable Time Logs (₹ INR)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Duration</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4">Notes / Deliverable</th>
                    <th className="py-3 px-4">Logged At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {log.staffName}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-orange-600">
                        {Math.floor(log.durationMinutes / 60)}h {log.durationMinutes % 60}m
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${log.isBillable
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600'
                          }`}>
                          {log.isBillable ? 'Billable Client Work' : 'Internal / Overhead'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-medium">
                        {log.notes}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Attendance & Payroll Engine (Phase 6) */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Monthly Calendar & Working Days Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Calendar</h3>
                  <div className="text-xl font-black text-slate-900">
                    {calendar?.yearMonth || '2026-10'} (October)
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Working Days: <strong className="text-orange-600 font-bold">{calendar?.workingDaysCount || 26} Days</strong>
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Staff</h3>
                  <div className="text-xl font-black text-slate-900">
                    {staff.length} Team Members
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Enrolled for attendance tracking & automated payroll deductions.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Deduction Rule</h3>
                  <div className="text-base font-bold text-slate-900">
                    Daily Rate = Salary / {calendar?.workingDaysCount || 26}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-600">
                Half Day = 0.5x deduction. Pre-applied leaves = No deduction.
              </p>
            </div>
          </div>

          {/* Attendance Recorder Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <CheckCircle2 className="w-5 h-5 text-orange-600" />
              Daily Attendance Recorder
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Log daily status to automatically calculate pro-rated deductions in the monthly payroll cycle.
            </p>

            {attendanceSuccessMessage && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>{attendanceSuccessMessage}</span>
              </div>
            )}

            <form onSubmit={handleLogAttendance} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Staff Member *</label>
                <select
                  value={attendanceForm.staffId}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, staffId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.userId})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Date *</label>
                <input
                  type="date"
                  value={attendanceForm.date}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Attendance Status *</label>
                <select
                  value={attendanceForm.status}
                  onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value as any })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="PRESENT">Present (Full Day)</option>
                  <option value="HALF_DAY">Half Day (0.5 deduction)</option>
                  <option value="ABSENT">Absent (Unapproved)</option>
                  <option value="PRE_APPLIED_LEAVE">Pre-Applied Leave (Approved)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Record Attendance</span>
              </button>
            </form>
          </div>

          {/* Staff Payroll Calculation Table (Phase 6) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  Monthly Staff Payroll & Net Disbursable Matrix (₹ INR)
                </h3>
                <p className="text-xs text-slate-500">
                  Calculated against {calendar?.workingDaysCount || 26} monthly working days with attendance deductions.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Payroll Cycle: End of Month
              </span>
            </div>

            {!canViewFinancials ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
                <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-700 text-sm">Financial Data Isolation Active</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  Staff salary amounts and payroll calculations are restricted to Admin/Owner and Account Managers under RBAC guidelines.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4">Role & Team</th>
                      <th className="py-3 px-4 text-right">Base Salary (₹)</th>
                      <th className="py-3 px-4 text-center">Daily Rate (₹)</th>
                      <th className="py-3 px-4 text-center">Absences / Half</th>
                      <th className="py-3 px-4 text-right">Deductions (₹)</th>
                      <th className="py-3 px-4 text-right">Net Payable (₹)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {staff.map((member) => {
                      const workingDays = calendar?.workingDaysCount || 26;
                      const dailyRate = Math.round((member.monthlySalary ?? 0) / workingDays);

                      // Calculate staff specific attendance from records
                      const memberRecords = attendanceRecords.filter(r => r.staffId === member.id);
                      const halfDays = memberRecords.filter(r => r.status === 'HALF_DAY').length;
                      const absentDays = memberRecords.filter(r => r.status === 'ABSENT').length;
                      const preAppliedLeaves = memberRecords.filter(r => r.status === 'PRE_APPLIED_LEAVE').length;

                      const totalDeduction = Math.round((absentDays * dailyRate) + (halfDays * dailyRate * 0.5));
                      const netPayable = Math.max(0, (member.monthlySalary ?? 0) - totalDeduction);

                      return (
                        <tr key={member.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{member.name}</div>
                            <div className="text-[10px] font-mono text-slate-500">{member.userId}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${ROLE_COLORS[member.role] || ROLE_COLORS.DEVELOPER}`}>
                              {member.role.replace('_', ' ')}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-0.5">{TEAM_LABELS[member.team] || member.team}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            ₹{(member.monthlySalary ?? 0).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-slate-600">
                            ₹{dailyRate.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="font-semibold text-slate-700">
                              {absentDays} Abs / {halfDays} Half
                            </span>
                            {preAppliedLeaves > 0 && (
                              <div className="text-[10px] text-emerald-600">({preAppliedLeaves} Approved Leaves)</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                            -₹{totalDeduction.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                            ₹{netPayable.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Ready for Payout
                            </span>
                            <div className="flex items-center justify-center gap-1.5 mt-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenSalarySlip(member, totalDeduction, netPayable, absentDays, halfDays)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-[10px] font-bold border border-indigo-200 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                                title="Generate PDF Salary Slip"
                              >
                                <FileText className="w-3 h-3" />
                                Salary Slip
                              </button>
                              <button
                                type="button"
                                onClick={() => handleShareSlipWhatsApp(member, netPayable, totalDeduction, absentDays)}
                                className="p-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg border border-emerald-200 cursor-pointer transition"
                                title="Instant WhatsApp Dispatch"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Attendance Log History & Management Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Daily Attendance Log History & Records
                </h3>
                <p className="text-xs text-slate-500">
                  Individual attendance entries determining pro-rated monthly payroll deductions. Edit status or remove entries.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full">
                {attendanceRecords.length} Records Logged
              </span>
            </div>

            {attendanceRecords.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                No attendance entries logged yet. Use the Daily Attendance Recorder above.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Staff Member</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Deduction (₹)</th>
                      <th className="py-3 px-4">Reason / Notes</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceRecords.map((record) => {
                      const staffMember = staff.find(s => s.id === record.staffId);
                      const workingDays = calendar?.workingDaysCount || 26;
                      const dailyRate = Math.round((staffMember?.monthlySalary ?? 0) / workingDays);
                      let deductionText = '₹0';
                      let deductionClass = 'text-slate-500';
                      if (record.status === 'ABSENT') {
                        deductionText = `-₹${dailyRate.toLocaleString('en-IN')}`;
                        deductionClass = 'text-rose-600 font-bold';
                      } else if (record.status === 'HALF_DAY') {
                        deductionText = `-₹${Math.round(dailyRate * 0.5).toLocaleString('en-IN')}`;
                        deductionClass = 'text-amber-600 font-bold';
                      }

                      return (
                        <tr key={record.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                            {record.date}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900">
                            {record.staffName || staffMember?.name || 'Staff Member'}
                            <span className="text-[10px] font-mono font-normal text-slate-400 ml-1.5">
                              ({staffMember?.userId || record.staffId})
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${record.status === 'PRESENT'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : record.status === 'HALF_DAY'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : record.status === 'ABSENT'
                                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                              {record.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className={`py-3 px-4 text-right font-mono ${deductionClass}`}>
                            {deductionText}
                          </td>
                          <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                            {record.reason || 'Regular shift'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditAttendance(record)}
                                className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors"
                                title="Edit Attendance Entry"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteAttendance(record)}
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                                title="Delete Attendance Entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Phase 1: Generated Credentials Modal */}
      {newCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-orange-200 p-6 shadow-2xl relative text-slate-900">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <Key className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-black text-center text-slate-900">
              Staff Credentials Generated!
            </h2>
            <p className="text-xs text-center text-slate-500 mt-1">
              Automated login credentials have been provisioned for <strong className="text-slate-900">{newCredentials.name}</strong>.
            </p>

            <div className="mt-5 p-4 rounded-xl bg-orange-50/70 border border-orange-200 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-orange-200/60">
                <span className="text-slate-500 font-sans font-bold">User ID:</span>
                <span className="font-bold text-orange-700 text-sm">{newCredentials.userId}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-orange-200/60">
                <span className="text-slate-500 font-sans font-bold">Default Password:</span>
                <span className="font-bold text-slate-900">{newCredentials.password}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-orange-200/60">
                <span className="text-slate-500 font-sans font-bold">Assigned Role:</span>
                <span className="font-bold text-slate-800">{newCredentials.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-sans font-bold">Assigned Team:</span>
                <span className="font-bold text-slate-800">{newCredentials.team}</span>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                onClick={copyCredentialsToClipboard}
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/20"
              >
                {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedKey ? 'Copied to Clipboard!' : 'Copy Login Details'}</span>
              </button>
              <button
                onClick={() => setNewCredentials(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal (Phase 1) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-orange-600" />
                  Onboard New Staff Member
                </h2>
                <p className="text-xs text-slate-500">
                  Collect onboarding details, team assignment, salary, and auto-generate login credentials.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="arun@nearlook.com"
                      value={staffForm.email}
                      onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">WhatsApp Alert Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={staffForm.phone}
                      onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Residential Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 4th Cross, Indiranagar, Bangalore"
                    value={staffForm.address}
                    onChange={(e) => setStaffForm({ ...staffForm, address: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Assigned Team / Dept</label>
                      <button
                        type="button"
                        onClick={() => { setTargetFormType('create'); setShowAddTeamModal(true); }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Add a new custom team / department"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Team</span>
                      </button>
                    </div>
                    <select
                      value={staffForm.team}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_TEAM__') {
                          setTargetFormType('create');
                          setShowAddTeamModal(true);
                        } else {
                          setStaffForm({ ...staffForm, team: e.target.value as StaffTeam });
                        }
                      }}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    >
                      {allTeams.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                      <option value="__NEW_TEAM__" className="text-orange-600 font-bold bg-orange-50">
                        ➕ + Add New Custom Team...
                      </option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">System Role (RBAC)</label>
                      <button
                        type="button"
                        onClick={() => { setTargetFormType('create'); setShowAddRoleModal(true); }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Add a new custom system role"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Role</span>
                      </button>
                    </div>
                    <select
                      value={staffForm.role}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_ROLE__') {
                          setTargetFormType('create');
                          setShowAddRoleModal(true);
                        } else {
                          setStaffForm({ ...staffForm, role: e.target.value as StaffRole });
                        }
                      }}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    >
                      {allRoles.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                      ))}
                      <option value="__NEW_ROLE__" className="text-orange-600 font-bold bg-orange-50">
                        ➕ + Add New Custom Role...
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Monthly Salary (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="45000"
                      value={staffForm.monthlySalary}
                      onChange={(e) => setStaffForm({ ...staffForm, monthlySalary: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Hourly Rate (₹ INR)</label>
                    <input
                      type="number"
                      placeholder="1500"
                      value={staffForm.hourlyRate}
                      onChange={(e) => setStaffForm({ ...staffForm, hourlyRate: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Office Shift Timing *</label>
                  <select
                    value={staffForm.shiftTiming}
                    onChange={(e) => setStaffForm({ ...staffForm, shiftTiming: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="09:30 AM - 07:30 PM (Standard Slot)">09:30 AM - 07:30 PM (Standard Slot)</option>
                    <option value="10:00 AM - 08:00 PM (Transit Adjusted Slot)">10:00 AM - 08:00 PM (Transit Adjusted Slot)</option>
                    <option value="02:00 PM - 11:00 PM (Evening / US Support)">02:00 PM - 11:00 PM (Evening / US Support)</option>
                  </select>
                </div>

                {/* Onboarding Documents Checkboxes */}
                <div className="pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Required Documents Received:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={staffForm.docResume}
                        onChange={(e) => setStaffForm({ ...staffForm, docResume: e.target.checked })}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>Resume</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={staffForm.docPayslip}
                        onChange={(e) => setStaffForm({ ...staffForm, docPayslip: e.target.checked })}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>Payslip</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={staffForm.docIdProof}
                        onChange={(e) => setStaffForm({ ...staffForm, docIdProof: e.target.checked })}
                        className="rounded text-orange-600 focus:ring-orange-500"
                      />
                      <span>ID Proof</span>
                    </label>
                  </div>
                </div>

                {/* Sub-Admin Permission Toggle */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/50 border border-orange-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={staffForm.canManageUsers}
                      onChange={(e) => setStaffForm({ ...staffForm, canManageUsers: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500 mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-orange-600" />
                        Grant Sub-Admin Permission (Manage Other Users)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Allows this staff member to onboard, view, and edit other users/staff members.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Granular Module Access Provisioning */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block">
                        Granular Module & Menu Permissions (RBAC)
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Control which application tabs and features this user is authorized to access.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setStaffForm({ ...staffForm, allowedModules: [...ALL_MODULE_KEY_STRINGS] })}
                        className="text-[10px] text-orange-600 font-bold hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setStaffForm({ ...staffForm, allowedModules: ['PORTAL', 'TASKS', 'CALENDAR', 'DPR'] })}
                        className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer"
                      >
                        Standard Staff
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {ALL_MODULE_KEYS.map((mod) => {
                      const isChecked = staffForm.allowedModules.includes(mod.key);
                      return (
                        <label
                          key={mod.key}
                          className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${isChecked ? 'bg-white border-orange-200 text-slate-900 shadow-2xs' : 'bg-slate-100/60 border-transparent text-slate-400'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setStaffForm({ ...staffForm, allowedModules: [...staffForm.allowedModules, mod.key] });
                              } else {
                                setStaffForm({ ...staffForm, allowedModules: staffForm.allowedModules.filter(k => k !== mod.key) });
                              }
                            }}
                            className="rounded text-orange-600 focus:ring-orange-500 mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold truncate">{mod.label}</div>
                            <div className="text-[9px] text-slate-400 truncate">{mod.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Generate Credentials & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Staff Member Modal */}
      {isEditStaffModalOpen && editingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-orange-600" />
                  Edit Staff Member: {editingStaff.name} ({editingStaff.userId})
                </h2>
                <p className="text-xs text-slate-500">
                  Update staff contact information, department, role, and salary parameters in ₹ INR.
                </p>
              </div>
              <button
                onClick={() => { setIsEditStaffModalOpen(false); setEditingStaff(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateStaff} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Login ID and Password Credentials Setup */}
                <div className="p-3.5 bg-gradient-to-br from-amber-50/90 to-orange-50/70 rounded-xl border border-amber-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-600 text-white flex items-center justify-center shrink-0">
                        <Key className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-black text-xs text-slate-900 block">Portal Login ID & Password Setup</span>
                        <span className="text-[10px] text-slate-500">Credentials for staff member to sign in to Nearlook Agency ERP</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                    <div>
                      <label className="text-[11px] font-bold text-slate-700 block mb-1">
                        Login User ID *
                      </label>
                      <input
                        type="text"
                        required
                        value={editStaffForm.userId}
                        onChange={(e) => setEditStaffForm({ ...editStaffForm, userId: e.target.value })}
                        placeholder="e.g. STF-101"
                        className="w-full bg-white border border-amber-300 font-mono font-bold text-xs text-slate-900 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                      <span className="text-[9px] text-slate-400 mt-0.5 block">Unique identification ID for sign-in</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-bold text-slate-700">
                          Login Password *
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const firstName = editStaffForm.name.trim().split(' ')[0] || 'Staff';
                            const randomDigits = Math.floor(1000 + Math.random() * 9000);
                            const newPass = `${firstName}#Nearlook${randomDigits}!`;
                            setEditStaffForm({ ...editStaffForm, password: newPass });
                            setShowEditPassword(true);
                          }}
                          className="text-[10px] text-orange-600 hover:text-orange-800 font-bold flex items-center gap-1"
                          title="Generate a secure random password"
                        >
                          <RotateCcw className="w-2.5 h-2.5" /> Generate
                        </button>
                      </div>
                      <div className="relative">
                        <input
                          type={showEditPassword ? 'text' : 'password'}
                          required
                          value={editStaffForm.password}
                          onChange={(e) => setEditStaffForm({ ...editStaffForm, password: e.target.value })}
                          placeholder="e.g. Nearlook#2026!"
                          className="w-full bg-white border border-amber-300 font-mono text-xs text-slate-900 rounded-lg pl-3 pr-16 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setShowEditPassword(!showEditPassword)}
                            className="p-1 text-slate-400 hover:text-slate-700 rounded"
                            title={showEditPassword ? 'Hide password' : 'Show password'}
                          >
                            {showEditPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(editStaffForm.password);
                              setCopiedEditPassword(true);
                              setTimeout(() => setCopiedEditPassword(false), 2000);
                            }}
                            className="p-1 text-slate-400 hover:text-orange-600 rounded"
                            title="Copy password"
                          >
                            {copiedEditPassword ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 block">Owner & staff auth key</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={editStaffForm.name}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, name: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={editStaffForm.phone}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, phone: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Email Address</label>
                    <input
                      type="email"
                      value={editStaffForm.email}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, email: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">City / Address</label>
                    <input
                      type="text"
                      value={editStaffForm.address}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, address: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Department Team</label>
                      <button
                        type="button"
                        onClick={() => { setTargetFormType('edit'); setShowAddTeamModal(true); }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Add a new custom team"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Team</span>
                      </button>
                    </div>
                    <select
                      value={editStaffForm.team}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_TEAM__') {
                          setTargetFormType('edit');
                          setShowAddTeamModal(true);
                        } else {
                          setEditStaffForm({ ...editStaffForm, team: e.target.value as StaffTeam });
                        }
                      }}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {allTeams.map((t) => (
                        <option key={t.key} value={t.key}>{t.label}</option>
                      ))}
                      <option value="__NEW_TEAM__" className="text-orange-600 font-bold bg-orange-50">
                        ➕ + Add New Custom Team...
                      </option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">Role Classification</label>
                      <button
                        type="button"
                        onClick={() => { setTargetFormType('edit'); setShowAddRoleModal(true); }}
                        className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 hover:underline cursor-pointer"
                        title="Add a new custom role"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Role</span>
                      </button>
                    </div>
                    <select
                      value={editStaffForm.role}
                      onChange={(e) => {
                        if (e.target.value === '__NEW_ROLE__') {
                          setTargetFormType('edit');
                          setShowAddRoleModal(true);
                        } else {
                          setEditStaffForm({ ...editStaffForm, role: e.target.value as StaffRole });
                        }
                      }}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      {allRoles.map((r) => (
                        <option key={r.key} value={r.key}>{r.label}</option>
                      ))}
                      <option value="__NEW_ROLE__" className="text-orange-600 font-bold bg-orange-50">
                        ➕ + Add New Custom Role...
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Monthly Base Salary (₹ INR)</label>
                    <input
                      type="number"
                      value={editStaffForm.monthlySalary}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, monthlySalary: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Hourly Rate (₹ INR)</label>
                    <input
                      type="number"
                      value={editStaffForm.hourlyRate}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, hourlyRate: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Office Shift Timing *</label>
                  <select
                    value={editStaffForm.shiftTiming}
                    onChange={(e) => setEditStaffForm({ ...editStaffForm, shiftTiming: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="09:30 AM - 07:30 PM (Standard Slot)">09:30 AM - 07:30 PM (Standard Slot)</option>
                    <option value="10:00 AM - 08:00 PM (Transit Adjusted Slot)">10:00 AM - 08:00 PM (Transit Adjusted Slot)</option>
                    <option value="02:00 PM - 11:00 PM (Evening / US Support)">02:00 PM - 11:00 PM (Evening / US Support)</option>
                  </select>
                </div>

                {/* Sub-Admin Permission Toggle */}
                <div className="pt-3 border-t border-slate-100">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-orange-50/50 border border-orange-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editStaffForm.canManageUsers}
                      onChange={(e) => setEditStaffForm({ ...editStaffForm, canManageUsers: e.target.checked })}
                      className="rounded text-orange-600 focus:ring-orange-500 mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-orange-600" />
                        Grant Sub-Admin Permission (Manage Other Users)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Allows this staff member to onboard, view, and edit other users/staff members.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Granular Module Access Provisioning */}
                <div className="pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block">
                        Granular Module & Menu Permissions (RBAC)
                      </label>
                      <p className="text-[10px] text-slate-500">
                        Authorized application tabs and modules for this user profile.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditStaffForm({ ...editStaffForm, allowedModules: [...ALL_MODULE_KEY_STRINGS] })}
                        className="text-[10px] text-orange-600 font-bold hover:underline cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setEditStaffForm({ ...editStaffForm, allowedModules: ['PORTAL', 'TASKS', 'CALENDAR', 'DPR'] })}
                        className="text-[10px] text-slate-500 font-bold hover:underline cursor-pointer"
                      >
                        Standard Staff
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {ALL_MODULE_KEYS.map((mod) => {
                      const isChecked = editStaffForm.allowedModules.includes(mod.key);
                      return (
                        <label
                          key={mod.key}
                          className={`flex items-start gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-colors ${isChecked ? 'bg-white border-orange-200 text-slate-900 shadow-2xs' : 'bg-slate-100/60 border-transparent text-slate-400'
                            }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setEditStaffForm({ ...editStaffForm, allowedModules: [...editStaffForm.allowedModules, mod.key] });
                              } else {
                                setEditStaffForm({ ...editStaffForm, allowedModules: editStaffForm.allowedModules.filter(k => k !== mod.key) });
                              }
                            }}
                            className="rounded text-orange-600 focus:ring-orange-500 mt-0.5"
                          />
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold truncate">{mod.label}</div>
                            <div className="text-[9px] text-slate-400 truncate">{mod.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsEditStaffModalOpen(false); setEditingStaff(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Save Staff Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit My Profile Modal (Owner / Staff) */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <UserCog className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Edit My Profile & Details</h2>
                  <p className="text-xs text-slate-500">Update your name, avatar, email, and phone</p>
                </div>
              </div>
              <button
                onClick={() => setIsProfileModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-3.5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">WhatsApp / Phone *</label>
                    <input
                      type="tel"
                      required
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Avatar Image URL</label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={profileForm.avatar}
                    onChange={(e) => setProfileForm({ ...profileForm, avatar: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  {profileForm.avatar && (
                    <div className="mt-2 flex items-center gap-2">
                      <img src={profileForm.avatar} alt="Avatar Preview" className="w-9 h-9 rounded-full object-cover border border-slate-200" />
                      <span className="text-[11px] text-slate-500 font-medium">Avatar Preview</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Office / Residential Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Attendance Modal */}
      {isEditAttendanceModalOpen && editingAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-orange-600" />
                  Edit Attendance Record
                </h2>
                <p className="text-xs text-slate-500">
                  Modify logged status for <strong className="text-slate-800">{editingAttendance.staffName}</strong>.
                </p>
              </div>
              <button
                onClick={() => { setIsEditAttendanceModalOpen(false); setEditingAttendance(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateAttendance} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={editAttendanceForm.date}
                    onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Attendance Status *</label>
                  <select
                    value={editAttendanceForm.status}
                    onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="PRESENT">Present (Full Day - No deduction)</option>
                    <option value="HALF_DAY">Half Day (0.5x daily deduction)</option>
                    <option value="ABSENT">Absent (1.0x daily deduction)</option>
                    <option value="PRE_APPLIED_LEAVE">Pre-Applied Leave (Approved - No deduction)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reason / Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Reason or explanation..."
                    value={editAttendanceForm.reason}
                    onChange={(e) => setEditAttendanceForm({ ...editAttendanceForm, reason: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsEditAttendanceModalOpen(false); setEditingAttendance(null); }}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Update Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Printable & Downloadable Salary Slip */}
      {showSalarySlipModal && selectedSlipStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Monthly Salary Payslip</h3>
                  <p className="text-xs text-slate-400">Nearlook Mart Pvt Ltd • Nearlook Agency HR</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowSalarySlipModal(false); setSelectedSlipStaff(null); }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Printable Slip Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-6 bg-slate-50">
              <div id="printable-salary-slip" className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs space-y-6">
                {/* Payslip Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-black text-xs">
                        N
                      </div>
                      <h2 className="text-base font-black text-slate-900">Nearlook Mart Pvt Ltd</h2>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Tech Hub Tower, Suite 402, Outer Ring Road, Bangalore, India
                    </p>
                    <p className="text-[11px] text-slate-400">
                      CIN: U72900KA2023PTC178491 • GSTIN: 29AAGCN4829K1ZX
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border border-orange-200">
                      Confidential Payslip
                    </span>
                    <p className="text-xs font-bold text-slate-900 mt-2">
                      Pay Period: {new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">Generated: {new Date().toISOString().split('T')[0]}</p>
                  </div>
                </div>

                {/* Employee Info Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Employee Name</span>
                    <span className="font-bold text-slate-900 text-sm mt-0.5 block">{selectedSlipStaff.staff.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Staff ID</span>
                    <span className="font-mono font-bold text-slate-700 mt-0.5 block">{selectedSlipStaff.staff.userId}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Designation</span>
                    <span className="font-bold text-slate-700 mt-0.5 block">{selectedSlipStaff.staff.role.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Shift Timing</span>
                    <span className="font-bold text-amber-700 mt-0.5 block">{selectedSlipStaff.staff.shiftTiming || '09:30 AM - 07:30 PM'}</span>
                  </div>
                </div>

                {/* Earnings & Deductions Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-emerald-50 px-4 py-2 border-b border-slate-200 font-bold text-emerald-900 text-xs flex justify-between">
                      <span>EARNINGS</span>
                      <span>AMOUNT (₹)</span>
                    </div>
                    <div className="p-3 text-xs space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Basic Salary (50%)</span>
                        <span className="font-mono font-semibold">₹{Math.round((selectedSlipStaff.staff.monthlySalary ?? 0) * 0.5).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>House Rent Allowance (HRA 30%)</span>
                        <span className="font-mono font-semibold">₹{Math.round((selectedSlipStaff.staff.monthlySalary ?? 0) * 0.3).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Special Allowance & Tech Perks (20%)</span>
                        <span className="font-mono font-semibold">₹{Math.round((selectedSlipStaff.staff.monthlySalary ?? 0) * 0.2).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                        <span>Total Gross Earnings</span>
                        <span className="font-mono text-emerald-700">₹{(selectedSlipStaff.staff.monthlySalary ?? 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div className="border border-slate-200 rounded-xl overflow-hidden">
                    <div className="bg-rose-50 px-4 py-2 border-b border-slate-200 font-bold text-rose-900 text-xs flex justify-between">
                      <span>DEDUCTIONS</span>
                      <span>AMOUNT (₹)</span>
                    </div>
                    <div className="p-3 text-xs space-y-2">
                      <div className="flex justify-between text-slate-600">
                        <span>Unapproved Absences ({selectedSlipStaff.absentDays} days)</span>
                        <span className="font-mono font-semibold text-rose-600">
                          -₹{Math.round(selectedSlipStaff.absentDays * ((selectedSlipStaff.staff.monthlySalary ?? 0) / 30)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Half-Days / Late Clock-ins ({selectedSlipStaff.halfDays})</span>
                        <span className="font-mono font-semibold text-rose-600">
                          -₹{Math.round(selectedSlipStaff.halfDays * ((selectedSlipStaff.staff.monthlySalary ?? 0) / 60)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Professional Tax (PT)</span>
                        <span className="font-mono font-semibold">₹200</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
                        <span>Total Deductions</span>
                        <span className="font-mono text-rose-700">-₹{(selectedSlipStaff.totalDeduction + 200).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Net Payable Highlight */}
                <div className="p-4 bg-slate-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 font-bold uppercase tracking-wider block">Net Take-Home Pay</span>
                    <span className="text-[11px] text-emerald-400">Credited via Corporate Bank Direct Deposit</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-400 font-mono">
                      ₹{Math.max(0, selectedSlipStaff.netPayable - 200).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 flex justify-between text-xs text-slate-500 border-t border-slate-200">
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-300 pb-1 mb-1 font-serif italic text-slate-700">Rajeshwar Sharma</div>
                    <span>Authorized Signatory</span>
                  </div>
                  <div className="text-center">
                    <div className="w-32 border-b border-slate-300 pb-1 mb-1 font-serif italic text-slate-700">{selectedSlipStaff.staff.name}</div>
                    <span>Employee Signature</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => { setShowSalarySlipModal(false); setSelectedSlipStaff(null); }}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleShareSlipWhatsApp(
                      selectedSlipStaff.staff,
                      Math.max(0, selectedSlipStaff.netPayable - 200),
                      selectedSlipStaff.totalDeduction + 200,
                      selectedSlipStaff.absentDays
                    );
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Create New Team Modal */}
      {showAddTeamModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-600" />
                Create New Department / Team
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddTeamModal(false); setNewTeamName(''); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Team / Department Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mobile Apps & Flutter / DevOps / QA"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewTeam();
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  autoFocus
                />
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                This new department will appear in all staff selectors and department matrices.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowAddTeamModal(false); setNewTeamName(''); }}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewTeam}
                disabled={!newTeamName.trim()}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
              >
                Save & Select Team
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Role Modal */}
      {showAddRoleModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-orange-600" />
                Create New System Role
              </h3>
              <button
                type="button"
                onClick={() => { setShowAddRoleModal(false); setNewRoleName(''); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="py-4 space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role Title / Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flutter Engineer / QA Lead / SEO Specialist"
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddNewRole();
                    }
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Role Badge Color</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: 'blue', label: 'Blue', cls: 'bg-blue-100 text-blue-800 border-blue-200' },
                    { id: 'purple', label: 'Purple', cls: 'bg-purple-100 text-purple-800 border-purple-200' },
                    { id: 'emerald', label: 'Green', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                    { id: 'amber', label: 'Amber', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
                    { id: 'rose', label: 'Rose', cls: 'bg-rose-100 text-rose-800 border-rose-200' },
                  ].map(col => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setNewRoleColor(col.cls)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold transition-all ${col.cls} ${newRoleColor === col.cls ? 'ring-2 ring-orange-500 shadow-xs' : 'opacity-70 hover:opacity-100'}`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                You can customize this role's granular module permissions in the section below.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => { setShowAddRoleModal(false); setNewRoleName(''); }}
                className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddNewRole}
                disabled={!newRoleName.trim()}
                className="px-4 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20"
              >
                Save & Select Role
              </button>
            </div>
          </div>
        </div>
      )}
      {/* View Staff Member Details Modal */}
      {viewingStaff && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-black text-sm border border-orange-200 shadow-xs">
                  {viewingStaff.name ? viewingStaff.name.slice(0, 2).toUpperCase() : 'ST'}
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                    <span>{viewingStaff.name}</span>
                    <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {viewingStaff.userId}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Staff Profile, Payroll Parameters & Directory Record</p>
                </div>
              </div>
              <button
                onClick={() => setViewingStaff(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
              {/* Login Credentials Card */}
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/70 rounded-xl border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-orange-600" />
                    <span className="font-black text-slate-900 text-xs">Portal Login Credentials (RBAC)</span>
                  </div>
                  <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full border border-orange-200">
                    Active Auth Key
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-amber-200/60">
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Login User ID</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono font-bold text-slate-900 text-xs">{viewingStaff.userId || 'N/A'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          if (viewingStaff.userId) navigator.clipboard.writeText(viewingStaff.userId);
                        }}
                        className="text-slate-400 hover:text-orange-600 p-0.5"
                        title="Copy User ID"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Login Password</span>
                    <div className="flex items-center justify-between mt-1">
                      <span className="font-mono text-xs text-slate-900">
                        {showViewStaffPassword ? (viewingStaff.password || 'Nearlook#2026!') : '••••••••••••'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setShowViewStaffPassword(!showViewStaffPassword)}
                          className="text-slate-400 hover:text-slate-700 p-0.5"
                          title={showViewStaffPassword ? 'Hide password' : 'Show password'}
                        >
                          {showViewStaffPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(viewingStaff.password || 'Nearlook#2026!');
                            setCopiedViewStaffPassword(true);
                            setTimeout(() => setCopiedViewStaffPassword(false), 2000);
                          }}
                          className="text-slate-400 hover:text-orange-600 p-0.5"
                          title="Copy Password"
                        >
                          {copiedViewStaffPassword ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Role & Status Card */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Role & Department</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-bold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
                      {viewingStaff.role ? viewingStaff.role.replace(/_/g, ' ') : 'STAFF'}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      • {TEAM_LABELS[viewingStaff.team] || viewingStaff.team}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                  <span className="inline-block mt-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {viewingStaff.status || 'ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                  Contact Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                    <a href={`mailto:${viewingStaff.email}`} className="text-slate-800 hover:text-orange-600 font-semibold truncate block mt-0.5">
                      {viewingStaff.email || 'N/A'}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">WhatsApp Phone</span>
                    <a 
                      href={`https://wa.me/${(viewingStaff.phone || '').replace(/[^0-9]/g, '')}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-emerald-700 hover:text-emerald-800 font-bold block mt-0.5"
                    >
                      {viewingStaff.phone || 'N/A'} ↗
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Office Shift Slot</span>
                    <span className="text-slate-700 font-medium block mt-0.5">
                      {viewingStaff.shiftTiming || '09:30 AM - 07:30 PM (Standard Shift)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">City / Location</span>
                    <span className="text-slate-700 font-medium block mt-0.5 truncate">
                      {viewingStaff.address || 'Bangalore, Karnataka'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Compensation Breakdown */}
              <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-200/80 space-y-2.5">
                <h4 className="font-bold text-orange-950 text-xs flex items-center gap-1.5 border-b border-orange-200/60 pb-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-orange-600" />
                  Compensation & Payout Terms
                </h4>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Monthly Base</span>
                    <span className="text-base font-black text-slate-900 font-mono block mt-0.5">
                      ₹{(viewingStaff.monthlySalary || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Daily Prorated</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-0.5">
                      ₹{Math.round((viewingStaff.monthlySalary || 0) / 30).toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Hourly Rate</span>
                    <span className="text-sm font-bold text-slate-800 font-mono block mt-0.5">
                      {viewingStaff.hourlyRate ? `₹${viewingStaff.hourlyRate.toLocaleString('en-IN')}` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-Admin Permissions & Access */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-600" />
                  <div>
                    <span className="font-bold text-slate-800 block">Sub-Admin Permission</span>
                    <span className="text-[11px] text-slate-500">
                      {viewingStaff.canManageUsers ? 'Authorized to onboard & manage other staff' : 'Standard staff privileges only'}
                    </span>
                  </div>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded border ${
                  viewingStaff.canManageUsers ? 'bg-orange-100 text-orange-800 border-orange-300' : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}>
                  {viewingStaff.canManageUsers ? 'Sub-Admin' : 'Standard'}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <button
                type="button"
                onClick={() => setViewingStaff(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
              >
                Close
              </button>
              {canManageStaff && (
                <button
                  type="button"
                  onClick={() => {
                    const target = viewingStaff;
                    setViewingStaff(null);
                    openEditStaff(target);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition shadow-md shadow-orange-600/20"
                >
                  Edit Staff Details
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
