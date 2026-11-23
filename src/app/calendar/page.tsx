'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays,
  Clock,
  Video,
  Phone,
  MapPin,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Check,
  Users,
  User,
  ExternalLink,
  Pencil,
  Trash2,
  Filter,
  CheckCircle2,
  Circle,
  AlertCircle,
  AlertTriangle,
  Sparkles,
  FolderKanban,
  Briefcase,
  Tag,
  Search,
  ArrowUpRight,
  X,
  ListTodo,
  Calendar as CalendarIcon,
  Layers,
  ChevronDown,
  Info,
  CalendarCheck2,
  Hourglass,
  ArrowRight,
  Flame,
  CalendarPlus,
  RefreshCw
} from 'lucide-react';
import {
  Appointment,
  AppointmentType,
  AppointmentLocation,
  AppointmentStatus,
  Task,
  TaskStatus,
  TaskPriority,
  Client,
  Lead,
  Project,
  StaffMember,
  ServiceType
} from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

type CalendarViewMode = 'MONTH' | 'WEEK' | 'DAY' | 'AGENDA';
type TaskTabFilter = 'ALL' | 'OVERDUE' | 'DUE_TODAY' | 'UPCOMING';

const APPOINTMENT_TYPES: { id: AppointmentType; label: string; color: string; bg: string; border: string; dot: string }[] = [
  { id: 'CLIENT_MEETING', label: 'Client Consultation', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-300', dot: 'bg-emerald-500' },
  { id: 'PROJECT_REVIEW', label: 'Project Review & Demo', color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-300', dot: 'bg-sky-500' },
  { id: 'DISCOVERY_CALL', label: 'Lead Discovery Call', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', dot: 'bg-amber-500' },
  { id: 'INTERNAL_SPRINT', label: 'Internal Team Sprint', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-300', dot: 'bg-purple-500' },
  { id: 'INFLUENCER_BRIEFING', label: 'Influencer Campaign', color: 'text-pink-700', bg: 'bg-pink-50', border: 'border-pink-300', dot: 'bg-pink-500' },
  { id: 'DEMO_CONSULTATION', label: 'Tech Demo & Strategy', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-300', dot: 'bg-indigo-500' }
];

const LOCATION_OPTIONS: { id: AppointmentLocation; label: string; icon: React.ElementType }[] = [
  { id: 'GOOGLE_MEET', label: 'Google Meet', icon: Video },
  { id: 'ZOOM', label: 'Zoom Meeting', icon: Video },
  { id: 'OFFICE_IN_PERSON', label: 'Office In-Person', icon: MapPin },
  { id: 'PHONE_CALL', label: 'Phone Consultation', icon: Phone },
  { id: 'CLIENT_SITE', label: 'Client Onsite', icon: MapPin }
];

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00'
];

// Consistent staff color-coding & initials
const STAFF_COLORS: Record<string, { bg: string; text: string; border: string; ring: string }> = {
  'staff-1': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', ring: 'ring-purple-400' }, // Arun (Owner)
  'staff-2': { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', ring: 'ring-blue-400' }, // Alex Rivera
  'staff-3': { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300', ring: 'ring-cyan-400' }, // David Chen
  'staff-4': { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', ring: 'ring-emerald-400' }, // Priya Sharma
  'staff-5': { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-300', ring: 'ring-fuchsia-400' }, // Maya Lin
  'staff-6': { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-300', ring: 'ring-rose-400' }, // Liam O'Connor
  'staff-acc': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', ring: 'ring-amber-400' }, // Michael Patel
};

const getStaffStyle = (staffId?: string, staffName?: string) => {
  if (staffId && STAFF_COLORS[staffId]) return STAFF_COLORS[staffId];
  const list = Object.values(STAFF_COLORS);
  let hash = 0;
  const str = staffId || staffName || 'staff';
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return list[Math.abs(hash) % list.length];
};

const getStaffInitials = (name?: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

// Calculate how many days a task has been pending / in progress
const getStaleDays = (task: Task): number => {
  const dateStr = task.createdAt || task.updatedAt;
  if (!dateStr) return 0;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return 0;
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  return Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
};

export default function CalendarModule() {
  const { currentStaff } = useAuth();

  // Navigation & View state
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('MONTH');
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Data collections
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [showAppointments, setShowAppointments] = useState<boolean>(true);
  const [showTasks, setShowTasks] = useState<boolean>(true);
  const [filterStaffId, setFilterStaffId] = useState<string>('ALL');
  const [typeFilters, setTypeFilters] = useState<Record<AppointmentType, boolean>>({
    CLIENT_MEETING: true,
    PROJECT_REVIEW: true,
    DISCOVERY_CALL: true,
    INTERNAL_SPRINT: true,
    INFLUENCER_BRIEFING: true,
    DEMO_CONSULTATION: true
  });

  // Slide-over Drawer & Modals
  const [isDayDrawerOpen, setIsDayDrawerOpen] = useState<boolean>(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState<boolean>(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [inspectingAppointment, setInspectingAppointment] = useState<Appointment | null>(null);
  const [newSubTaskInput, setNewSubTaskInput] = useState<{ [taskId: string]: string }>({});
  const [drawerTaskTab, setDrawerTaskTab] = useState<TaskTabFilter>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states
  const [appointmentForm, setAppointmentForm] = useState({
    title: '',
    description: '',
    appointmentType: 'CLIENT_MEETING' as AppointmentType,
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    clientId: '',
    leadId: '',
    projectId: '',
    assignedStaffId: '',
    locationType: 'GOOGLE_MEET' as AppointmentLocation,
    meetingLink: '',
    reminderMinutes: '15'
  });

  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '10:30',
    priority: 'HIGH' as TaskPriority,
    serviceCategory: 'SOFTWARE_DEV' as ServiceType,
    clientId: '',
    projectId: '',
    assignedStaffId: ''
  });

  // Fetch all calendar data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [aptRes, taskRes, clientRes, leadRes, projRes, staffRes] = await Promise.all([
        fetch('/api/appointments').then(r => r.json()),
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/leads').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/staff').then(r => r.json())
      ]);

      if (aptRes.success) setAppointments(aptRes.data || []);
      if (taskRes.success) setTasks(taskRes.data || []);
      if (clientRes.success) setClients(clientRes.data || []);
      if (leadRes.success) setLeads(leadRes.data || []);
      if (projRes.success) setProjects(projRes.data || []);
      if (staffRes.success) setStaffList(staffRes.data || []);
    } catch (e) {
      console.error('Failed to load calendar data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const handleUpdate = () => fetchData();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Calendar Date Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayStr = new Date().toISOString().split('T')[0];

  // Generate 42 calendar grid cells (prev month padding, current month, next month padding)
  const calendarCells = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDaysInPrevMonth = new Date(year, month, 0).getDate();

    const cells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // Previous month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = totalDaysInPrevMonth - i;
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const mStr = String(prevMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${prevYear}-${mStr}-${dStr}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const mStr = String(month + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dStr}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr
      });
    }

    // Next month padding to fill out 35 or 42 cells
    const remaining = (cells.length > 35 ? 42 : 35) - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const nextMonth = month === 11 ? 0 : month + 1;
      const nextYear = month === 11 ? year + 1 : year;
      const mStr = String(nextMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${nextYear}-${mStr}-${dStr}`;
      cells.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr
      });
    }

    return cells;
  }, [year, month, todayStr]);

  // Week View Days
  const weekDays = useMemo(() => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay();
    const startOfWeek = new Date(curr);
    startOfWeek.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        date: d,
        dateStr,
        dayNumber: d.getDate(),
        dayName: daysOfWeek[d.getDay()],
        isToday: dateStr === todayStr
      });
    }
    return days;
  }, [currentDate, todayStr]);

  // Navigation actions
  const handlePrev = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(year, month - 1, 1));
    } else if (viewMode === 'WEEK') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setCurrentDate(d);
    } else if (viewMode === 'DAY') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      setCurrentDate(d);
      setSelectedDateStr(d.toISOString().split('T')[0]);
    }
  };

  const handleNext = () => {
    if (viewMode === 'MONTH') {
      setCurrentDate(new Date(year, month + 1, 1));
    } else if (viewMode === 'WEEK') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setCurrentDate(d);
    } else if (viewMode === 'DAY') {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      setCurrentDate(d);
      setSelectedDateStr(d.toISOString().split('T')[0]);
    }
  };

  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  // Switch selected date day-by-day directly inside Drawer
  const handleDrawerPrevDay = () => {
    const curr = new Date(selectedDateStr);
    curr.setDate(curr.getDate() - 1);
    const nextStr = curr.toISOString().split('T')[0];
    setSelectedDateStr(nextStr);
    setCurrentDate(curr);
  };

  const handleDrawerNextDay = () => {
    const curr = new Date(selectedDateStr);
    curr.setDate(curr.getDate() + 1);
    const nextStr = curr.toISOString().split('T')[0];
    setSelectedDateStr(nextStr);
    setCurrentDate(curr);
  };

  // Filtered Appointments & Tasks (Respects Global Staff Filter)
  const filteredAppointments = useMemo(() => {
    if (!showAppointments) return [];
    return appointments.filter(a => {
      if (filterStaffId !== 'ALL' && a.assignedStaffId !== filterStaffId) return false;
      if (!typeFilters[a.appointmentType]) return false;
      return true;
    });
  }, [appointments, showAppointments, filterStaffId, typeFilters]);

  const filteredTasks = useMemo(() => {
    if (!showTasks) return [];
    return tasks.filter(t => {
      if (filterStaffId !== 'ALL' && t.assignedStaffId !== filterStaffId) return false;
      return true;
    });
  }, [tasks, showTasks, filterStaffId]);

  // Groupings by date string (YYYY-MM-DD)
  const appointmentsByDate = useMemo(() => {
    const map: { [dateStr: string]: Appointment[] } = {};
    filteredAppointments.forEach(apt => {
      if (!map[apt.date]) map[apt.date] = [];
      map[apt.date].push(apt);
    });
    return map;
  }, [filteredAppointments]);

  const tasksByDate = useMemo(() => {
    const map: { [dateStr: string]: Task[] } = {};
    filteredTasks.forEach(task => {
      const d = task.dueDate || 'NO_DATE';
      if (!map[d]) map[d] = [];
      map[d].push(task);
    });
    return map;
  }, [filteredTasks]);

  // Selected Day Items
  const selectedDayAppointments = appointmentsByDate[selectedDateStr] || [];
  const selectedDayTasks = tasksByDate[selectedDateStr] || [];

  // Categorize tasks for the Day Focus Slide-over Drawer
  const drawerTaskBreakdown = useMemo(() => {
    // 1. Overdue / Pending Long
    const overdueOrStale: Task[] = [];
    // 2. Due on selected date
    const dueOnSelected: Task[] = [];
    // 3. Upcoming (due after selected date within 7 days)
    const upcoming: Task[] = [];

    const refDate = selectedDateStr;

    filteredTasks.forEach(t => {
      if (!t.dueDate) return;
      const isDone = t.status === 'COMPLETED';
      const staleDays = getStaleDays(t);

      if (t.dueDate === refDate) {
        dueOnSelected.push(t);
      } else if (!isDone && (t.dueDate < refDate || (t.dueDate < todayStr && refDate === todayStr) || staleDays >= 3)) {
        overdueOrStale.push(t);
      } else if (!isDone && t.dueDate > refDate) {
        upcoming.push(t);
      }
    });

    return {
      overdueOrStale,
      dueOnSelected,
      upcoming,
      totalSelected: dueOnSelected.length,
      completedSelected: dueOnSelected.filter(t => t.status === 'COMPLETED').length
    };
  }, [filteredTasks, selectedDateStr, todayStr]);

  // Metrics for process tracking banner
  const metrics = useMemo(() => {
    const todayTasks = tasksByDate[todayStr] || [];
    const completedToday = todayTasks.filter(t => t.status === 'COMPLETED').length;
    const progressPercent = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 100;

    const allMonthTasks = filteredTasks.filter(t => t.dueDate && t.dueDate.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`));
    const monthCompleted = allMonthTasks.filter(t => t.status === 'COMPLETED').length;
    const monthProgress = allMonthTasks.length > 0 ? Math.round((monthCompleted / allMonthTasks.length) * 100) : 0;

    const overdueCount = filteredTasks.filter(t => t.status !== 'COMPLETED' && t.dueDate && t.dueDate < todayStr).length;

    return {
      todayTasksCount: todayTasks.length,
      todayCompletedCount: completedToday,
      todayProgressPercent: progressPercent,
      monthTasksCount: allMonthTasks.length,
      monthCompletedCount: monthCompleted,
      monthProgressPercent: monthProgress,
      totalAppointments: filteredAppointments.length,
      overdueCount
    };
  }, [tasksByDate, filteredTasks, filteredAppointments, year, month, todayStr]);

  // Checklist Actions (Syncs with Tasks & Milestones, DPR, Leads)
  const toggleTaskCompletion = async (taskId: string, currentStatus: TaskStatus) => {
    const newCompleted = currentStatus !== 'COMPLETED';
    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: newCompleted ? 'COMPLETED' : 'IN_PROGRESS',
          subTasks: t.subTasks?.map(st => ({ ...st, isCompleted: newCompleted })) || []
        };
      }
      return t;
    }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toggleChecklist: true, isCompleted: newCompleted })
      });
      const data = await res.json();
      if (!data.success) {
        fetchData();
      } else {
        window.dispatchEvent(new Event('crm-data-updated'));
        showToast(newCompleted ? '✅ Task marked complete!' : '↩️ Task set back to in-progress');
      }
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const toggleSubTask = async (taskId: string, subTaskId: string, currentVal: boolean) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const updatedSubs = t.subTasks?.map(st => st.id === subTaskId ? { ...st, isCompleted: !currentVal } : st) || [];
        const allDone = updatedSubs.length > 0 && updatedSubs.every(st => st.isCompleted);
        return {
          ...t,
          status: allDone ? 'COMPLETED' : t.status === 'COMPLETED' ? 'IN_PROGRESS' : t.status,
          subTasks: updatedSubs
        };
      }
      return t;
    }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subTaskId, isCompleted: !currentVal })
      });
      const data = await res.json();
      if (!data.success) {
        fetchData();
      } else {
        window.dispatchEvent(new Event('crm-data-updated'));
      }
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  const handleAddSubTask = async (taskId: string) => {
    const text = (newSubTaskInput[taskId] || '').trim();
    if (!text) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newSubTaskTitle: text })
      });
      const data = await res.json();
      if (data.success) {
        setNewSubTaskInput(prev => ({ ...prev, [taskId]: '' }));
        fetchData();
        window.dispatchEvent(new Event('crm-data-updated'));
        showToast('Sub-task item added');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reschedule Task Date (Syncs with Calendar, DPR & Tasks)
  const handleRescheduleTask = async (taskId: string, targetDateStr: string) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, dueDate: targetDateStr } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueDate: targetDateStr })
      });
      const data = await res.json();
      if (data.success) {
        window.dispatchEvent(new Event('crm-data-updated'));
        showToast(`📅 Task rescheduled to ${targetDateStr}`);
      } else {
        fetchData();
      }
    } catch (e) {
      console.error(e);
      fetchData();
    }
  };

  // Appointment Submission
  const handleSaveAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentForm.title || !appointmentForm.date || !appointmentForm.startTime) return;

    const selectedClient = clients.find(c => c.id === appointmentForm.clientId);
    const selectedLead = leads.find(l => l.id === appointmentForm.leadId);
    const selectedProject = projects.find(p => p.id === appointmentForm.projectId);
    const selectedStaff = staffList.find(s => s.id === appointmentForm.assignedStaffId);

    const payload = {
      ...appointmentForm,
      clientName: selectedClient?.businessName,
      leadName: selectedLead?.leadName,
      projectName: selectedProject?.title,
      assignedStaffName: selectedStaff?.name
    };

    try {
      if (editingAppointment) {
        const res = await fetch('/api/appointments', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingAppointment.id, ...payload })
        });
        const d = await res.json();
        if (d.success) {
          setIsAppointmentModalOpen(false);
          setEditingAppointment(null);
          fetchData();
          window.dispatchEvent(new Event('crm-data-updated'));
          showToast('Appointment updated successfully');
        }
      } else {
        const res = await fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const d = await res.json();
        if (d.success) {
          setIsAppointmentModalOpen(false);
          fetchData();
          window.dispatchEvent(new Event('crm-data-updated'));
          showToast('🎉 Appointment scheduled with Google Meet link!');
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    if (!confirm('Move this appointment to the Recycle Bin?')) return;
    try {
      const res = await fetch(`/api/appointments?id=${id}&deletedBy=${encodeURIComponent(currentStaff.name)}`, {
        method: 'DELETE'
      });
      const d = await res.json();
      if (d.success) {
        setInspectingAppointment(null);
        fetchData();
        window.dispatchEvent(new Event('crm-data-updated'));
        showToast('Appointment moved to Recycle Bin');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Quick Task Creation
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskForm.title || !taskForm.dueDate) return;

    const selectedClient = clients.find(c => c.id === taskForm.clientId);
    const selectedStaff = staffList.find(s => s.id === taskForm.assignedStaffId);

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...taskForm,
          status: 'TO_DO',
          clientName: selectedClient?.businessName || 'Internal Agency',
          assignedStaffName: selectedStaff?.name
        })
      });
      const d = await res.json();
      if (d.success) {
        setIsTaskModalOpen(false);
        setTaskForm({
          title: '',
          description: '',
          dueDate: selectedDateStr,
          dueTime: '10:30',
          priority: 'HIGH',
          serviceCategory: 'SOFTWARE_DEV',
          clientId: '',
          projectId: '',
          assignedStaffId: filterStaffId !== 'ALL' ? filterStaffId : ''
        });
        fetchData();
        window.dispatchEvent(new Event('crm-data-updated'));
        showToast('📋 New task scheduled in calendar checklist!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openNewAppointmentForDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setAppointmentForm(prev => ({
      ...prev,
      date: dateStr,
      title: '',
      description: '',
      clientId: '',
      leadId: '',
      projectId: '',
      assignedStaffId: filterStaffId !== 'ALL' ? filterStaffId : currentStaff.id
    }));
    setEditingAppointment(null);
    setIsAppointmentModalOpen(true);
  };

  const openNewTaskForDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setTaskForm(prev => ({
      ...prev,
      dueDate: dateStr,
      title: '',
      description: '',
      dueTime: '10:30',
      assignedStaffId: filterStaffId !== 'ALL' ? filterStaffId : currentStaff.id
    }));
    setIsTaskModalOpen(true);
  };

  const openDayDrawer = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsDayDrawerOpen(true);
  };

  const selectedStaffObj = staffList.find(s => s.id === filterStaffId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs font-bold flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Top Navigation Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-3 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">

          {/* Left: Brand + Date Controls */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20 font-black">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {monthNames[month]} {year}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-100 text-orange-800 border border-orange-200">
                  Google Meet Ready
                </span>
                {filterStaffId !== 'ALL' && selectedStaffObj && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{selectedStaffObj.name}</span>
                    <button
                      onClick={() => setFilterStaffId('ALL')}
                      className="ml-1 text-blue-600 hover:text-blue-900"
                      title="Clear staff filter"
                    >
                      ✕
                    </button>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Fix appointments, auto-generate Google Meet links, and track tasks via interactive checklists.
              </p>
            </div>

            {/* Nav Arrows & Today */}
            <div className="flex items-center gap-1.5 ml-4">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all border border-slate-200"
              >
                Today
              </button>
              <button
                onClick={handlePrev}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                title="Previous"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                title="Next"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Right: View Modes + Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View Switcher */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                onClick={() => setViewMode('MONTH')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'MONTH'
                    ? 'bg-white text-orange-600 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('WEEK')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'WEEK'
                    ? 'bg-white text-orange-600 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Week
              </button>
              <button
                onClick={() => {
                  setViewMode('DAY');
                  openDayDrawer(selectedDateStr);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'DAY' || isDayDrawerOpen
                    ? 'bg-orange-600 text-white shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
                title="Open right slide-over Day Focus drawer"
              >
                <CalendarCheck2 className="w-3.5 h-3.5" />
                <span>Day Focus Drawer</span>
              </button>
              <button
                onClick={() => setViewMode('AGENDA')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${viewMode === 'AGENDA'
                    ? 'bg-white text-orange-600 shadow-xs font-black'
                    : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                Process List
              </button>
            </div>

            {/* Action Buttons */}
            <button
              onClick={() => openNewAppointmentForDate(selectedDateStr)}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Video className="w-4 h-4" />
              <span>Fix Appointment</span>
            </button>

            <button
              onClick={() => openNewTaskForDate(selectedDateStr)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              <span>+ Add Task</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container: Sidebar + Calendar Grid */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Sidebar */}
        <div className="lg:col-span-3 space-y-5">

          {/* Process Health Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-400">Process Health</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {metrics.todayCompletedCount} / {metrics.todayTasksCount}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Tasks completed today</p>
            <div className="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-gradient-to-r from-orange-500 to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.todayProgressPercent}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-bold">
              <span>{metrics.todayProgressPercent}% Done</span>
              <button
                onClick={() => openDayDrawer(todayStr)}
                className="text-orange-400 hover:underline flex items-center gap-1"
              >
                <span>Today&#39;s Drawer</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {metrics.overdueCount > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-rose-400 font-bold">
                <span className="flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                  <span>{metrics.overdueCount} Overdue Tasks</span>
                </span>
                <button
                  onClick={() => {
                    setDrawerTaskTab('OVERDUE');
                    openDayDrawer(selectedDateStr);
                  }}
                  className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full hover:bg-rose-500/30"
                >
                  Unblock →
                </button>
              </div>
            )}
          </div>

          {/* Mini Calendar Datepicker */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
              <h3 className="text-xs font-black text-slate-900">
                {monthNames[month]} {year}
              </h3>
              <div className="flex items-center gap-1">
                <button onClick={handlePrev} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleNext} className="p-1 hover:bg-slate-100 rounded text-slate-500">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {calendarCells.map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const hasApt = !!appointmentsByDate[cell.dateStr]?.length;
                const hasTsk = !!tasksByDate[cell.dateStr]?.length;

                return (
                  <button
                    key={`mini-${idx}`}
                    onClick={() => {
                      setSelectedDateStr(cell.dateStr);
                      openDayDrawer(cell.dateStr);
                    }}
                    className={`h-7 w-7 mx-auto rounded-lg text-xs font-bold flex flex-col items-center justify-center transition-all relative ${isSelected
                        ? 'bg-orange-600 text-white font-black shadow-xs'
                        : cell.isToday
                          ? 'bg-orange-100 text-orange-900 font-black'
                          : cell.isCurrentMonth
                            ? 'text-slate-700 hover:bg-slate-100'
                            : 'text-slate-300'
                      }`}
                  >
                    <span>{cell.dayNumber}</span>
                    <div className="flex items-center gap-0.5 absolute bottom-0.5">
                      {hasApt && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-orange-500'}`} />}
                      {hasTsk && <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-amber-200' : 'bg-emerald-500'}`} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calendars / Filters */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Layers & Process Filters
              </span>
              <div className="space-y-2">
                <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showAppointments}
                      onChange={e => setShowAppointments(e.target.checked)}
                      className="rounded text-orange-600 focus:ring-orange-500"
                    />
                    <Video className="w-3.5 h-3.5 text-orange-600" />
                    <span>Client Appointments</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-orange-50 text-orange-700 rounded-full font-black">
                    {filteredAppointments.length}
                  </span>
                </label>

                <label className="flex items-center justify-between text-xs font-bold text-slate-700 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={showTasks}
                      onChange={e => setShowTasks(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Task Due Checklists</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-black">
                    {filteredTasks.length}
                  </span>
                </label>
              </div>
            </div>

            {/* GLOBAL STAFF FILTER */}
            <div className="pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Filter by Assigned Staff
                </span>
                {filterStaffId !== 'ALL' && (
                  <button
                    onClick={() => setFilterStaffId('ALL')}
                    className="text-[10px] font-bold text-orange-600 hover:underline"
                  >
                    Reset
                  </button>
                )}
              </div>
              <select
                value={filterStaffId}
                onChange={e => setFilterStaffId(e.target.value)}
                className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 text-slate-800"
              >
                <option value="ALL">All Team Members</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>
                ))}
              </select>
            </div>

            {/* Appointment Categories */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-2">
                Appointment Categories
              </span>
              {APPOINTMENT_TYPES.map(type => (
                <label key={type.id} className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={typeFilters[type.id]}
                    onChange={e => setTypeFilters(prev => ({ ...prev, [type.id]: e.target.checked }))}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className={`w-2 h-2 rounded-full ${type.dot}`} />
                  <span className="truncate">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Center Main Calendar View */}
        <div className="lg:col-span-9 space-y-4">

          {/* MONTH VIEW (ENHANCED: Clean summary badges on cells, no overflowing raw text!) */}
          {viewMode === 'MONTH' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center py-2.5">
                {daysOfWeek.map((d, i) => (
                  <div key={d} className={`text-xs font-black uppercase tracking-wider ${i === 0 || i === 6 ? 'text-rose-500' : 'text-slate-600'}`}>
                    {d}
                  </div>
                ))}
              </div>

              {/* 7x6 Grid Cells */}
              <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100 min-h-[620px]">
                {calendarCells.map((cell, idx) => {
                  const dayApts = appointmentsByDate[cell.dateStr] || [];
                  const dayTsks = tasksByDate[cell.dateStr] || [];
                  const isSelected = cell.dateStr === selectedDateStr;
                  const completedCount = dayTsks.filter(t => t.status === 'COMPLETED').length;
                  const hasOverdue = dayTsks.some(t => t.status !== 'COMPLETED' && ((t.dueDate && t.dueDate < todayStr) || getStaleDays(t) >= 3));
                  const hasCritical = dayTsks.some(t => t.priority === 'CRITICAL' && t.status !== 'COMPLETED');

                  return (
                    <div
                      key={`cell-${idx}`}
                      onClick={() => openDayDrawer(cell.dateStr)}
                      className={`min-h-[110px] p-2 flex flex-col justify-between transition-all group relative cursor-pointer ${isSelected
                          ? 'bg-orange-50/40 ring-2 ring-orange-500/30'
                          : cell.isCurrentMonth
                            ? 'bg-white hover:bg-slate-50/90 hover:shadow-inner'
                            : 'bg-slate-50/40 text-slate-400'
                        }`}
                    >
                      {/* Cell Header: Date Number + Priority Dot + Quick Add Buttons */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-black inline-flex items-center justify-center rounded-full w-6 h-6 ${cell.isToday
                              ? 'bg-orange-600 text-white shadow-xs'
                              : cell.isCurrentMonth
                                ? 'text-slate-800'
                                : 'text-slate-400'
                            }`}>
                            {cell.dayNumber}
                          </span>

                          {hasCritical && (
                            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" title="Critical Priority Item" />
                          )}
                        </div>

                        {/* Quick action buttons on hover */}
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNewAppointmentForDate(cell.dateStr);
                            }}
                            title="Fix Appointment on this date"
                            className="p-1 rounded bg-orange-100 hover:bg-orange-200 text-orange-700 transition"
                          >
                            <Video className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openNewTaskForDate(cell.dateStr);
                            }}
                            title="Add Task Due on this date"
                            className="p-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-700 transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Cell Body: CLEAN SUMMARY BADGES (No overflowing raw text clipping!) */}
                      <div className="space-y-1.5 my-1.5">
                        {/* 1. Appointments Summary Pill */}
                        {dayApts.length > 0 && (
                          <div
                            className="px-2 py-1 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-900 text-[11px] font-bold flex items-center justify-between shadow-2xs transition"
                            title={`${dayApts.length} appointment(s). Click to view agenda.`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              <Video className="w-3 h-3 text-orange-600 flex-shrink-0" />
                              <span className="truncate">
                                {dayApts.length === 1 ? dayApts[0].startTime : `${dayApts.length} Meets`}
                              </span>
                            </div>
                            <span className="text-[10px] font-black bg-orange-200/80 text-orange-950 px-1.5 rounded-full">
                              {dayApts.length}
                            </span>
                          </div>
                        )}

                        {/* 2. Tasks Summary Pill */}
                        {dayTsks.length > 0 && (
                          <div
                            className={`px-2 py-1 rounded-lg border text-[11px] font-bold flex items-center justify-between shadow-2xs transition ${hasOverdue
                                ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900'
                                : completedCount === dayTsks.length
                                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-900'
                                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-800'
                              }`}
                            title={`${completedCount}/${dayTsks.length} tasks completed. Click to inspect in Day Focus.`}
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {completedCount === dayTsks.length ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                              ) : hasOverdue ? (
                                <AlertTriangle className="w-3 h-3 text-rose-600 flex-shrink-0" />
                              ) : (
                                <CheckSquare className="w-3 h-3 text-slate-600 flex-shrink-0" />
                              )}
                              <span className="truncate">
                                {completedCount === dayTsks.length
                                  ? 'All Done'
                                  : hasOverdue
                                    ? `${dayTsks.length} Tasks`
                                    : `${completedCount}/${dayTsks.length} Tasks`}
                              </span>
                            </div>

                            {hasOverdue ? (
                              <span className="text-[9px] font-black bg-rose-200 text-rose-950 px-1 rounded">
                                Overdue
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono font-bold text-slate-500">
                                {Math.round((completedCount / dayTsks.length) * 100)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Cell Footer: Quick Clickable Cue */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                        {(dayApts.length > 0 || dayTsks.length > 0) ? (
                          <span className="text-[10px] font-bold text-slate-500 group-hover:text-orange-600 transition flex items-center gap-0.5">
                            <span>Open agenda</span>
                            <ArrowRight className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400">
                            + Click to plan
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* WEEK VIEW */}
          {viewMode === 'WEEK' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header 7 days */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-slate-50 text-center py-3">
                <div className="text-xs font-black text-slate-400 uppercase">Time</div>
                {weekDays.map(day => (
                  <div
                    key={day.dateStr}
                    onClick={() => openDayDrawer(day.dateStr)}
                    className="space-y-0.5 cursor-pointer hover:bg-slate-100/80 rounded-lg p-1 transition"
                  >
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                      {day.dayName}
                    </div>
                    <div className={`text-sm font-black mx-auto w-7 h-7 rounded-full flex items-center justify-center ${day.isToday ? 'bg-orange-600 text-white' : 'text-slate-800'
                      }`}>
                      {day.dayNumber}
                    </div>
                  </div>
                ))}
              </div>

              {/* All-Day Tasks Checklist Bar */}
              <div className="grid grid-cols-8 border-b border-slate-200 bg-orange-50/30 p-2 divide-x divide-orange-100">
                <div className="text-[11px] font-black text-orange-800 uppercase flex items-center gap-1 px-2">
                  <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
                  <span>Checklist</span>
                </div>
                {weekDays.map(day => {
                  const dayTsks = tasksByDate[day.dateStr] || [];
                  return (
                    <div key={`all-day-${day.dateStr}`} className="px-1.5 space-y-1">
                      {dayTsks.slice(0, 3).map(task => {
                        const isDone = task.status === 'COMPLETED';
                        return (
                          <div
                            key={task.id}
                            onClick={() => toggleTaskCompletion(task.id, task.status)}
                            className={`p-1 rounded text-[11px] font-semibold border flex items-center gap-1 cursor-pointer transition ${isDone ? 'bg-emerald-100/60 line-through text-emerald-800 border-emerald-300' : 'bg-white text-slate-800 border-slate-200 hover:border-orange-300'
                              }`}
                          >
                            {isDone ? <CheckSquare className="w-3 h-3 text-emerald-600 flex-shrink-0" /> : <Square className="w-3 h-3 text-slate-400 flex-shrink-0" />}
                            <span className="truncate">{task.title}</span>
                          </div>
                        );
                      })}
                      {dayTsks.length > 3 && (
                        <button
                          onClick={() => openDayDrawer(day.dateStr)}
                          className="text-[10px] font-bold text-orange-600 hover:underline block text-left"
                        >
                          + {dayTsks.length - 3} more...
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Hourly Slots (09:00 to 19:00) */}
              <div className="max-h-[550px] overflow-y-auto divide-y divide-slate-100">
                {TIME_SLOTS.map(time => (
                  <div key={time} className="grid grid-cols-8 min-h-[48px] divide-x divide-slate-100">
                    <div className="text-[11px] font-bold text-slate-400 p-2 text-center bg-slate-50/50">
                      {time}
                    </div>
                    {weekDays.map(day => {
                      const aptsAtTime = (appointmentsByDate[day.dateStr] || []).filter(a => a.startTime === time);
                      return (
                        <div
                          key={`${day.dateStr}-${time}`}
                          onClick={() => {
                            setSelectedDateStr(day.dateStr);
                            openDayDrawer(day.dateStr);
                          }}
                          className="p-1 hover:bg-orange-50/20 cursor-pointer relative transition-colors"
                        >
                          {aptsAtTime.map(apt => (
                            <div
                              key={apt.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setInspectingAppointment(apt);
                              }}
                              className="bg-orange-100 border border-orange-300 text-orange-900 rounded-lg p-1.5 text-xs font-bold shadow-xs hover:shadow-md transition-shadow"
                            >
                              <div className="flex items-center gap-1">
                                <Video className="w-3 h-3 text-orange-600 flex-shrink-0" />
                                <span className="font-black truncate">{apt.title}</span>
                              </div>
                              <div className="text-[10px] text-orange-700 mt-0.5 truncate">
                                {apt.clientName || apt.leadName || 'Consultation'}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AGENDA / PROCESS LIST VIEW */}
          {viewMode === 'AGENDA' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-base font-black text-slate-900">Process Tracking Agenda</h2>
                  <p className="text-xs text-slate-500">Upcoming schedule grouped by date with appointments & task checklists.</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">
                    Total: {filteredAppointments.length} Appointments, {filteredTasks.length} Tasks
                  </span>
                </div>
              </div>

              {Object.keys(appointmentsByDate).concat(Object.keys(tasksByDate))
                .filter((v, i, a) => a.indexOf(v) === i && v !== 'NO_DATE')
                .sort()
                .map(dateStr => {
                  const dayApts = appointmentsByDate[dateStr] || [];
                  const dayTsks = tasksByDate[dateStr] || [];
                  const formattedDate = new Date(dateStr).toLocaleDateString('en-IN', {
                    weekday: 'short',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <div key={dateStr} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <div
                          onClick={() => openDayDrawer(dateStr)}
                          className="flex items-center gap-2 cursor-pointer hover:text-orange-600 transition"
                        >
                          <CalendarIcon className="w-4 h-4 text-orange-600" />
                          <h3 className="font-black text-sm text-slate-900">{formattedDate}</h3>
                          {dateStr === todayStr && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-orange-600 text-white">TODAY</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                          <button
                            onClick={() => openDayDrawer(dateStr)}
                            className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                          >
                            <span>Open Day Focus Drawer →</span>
                          </button>
                        </div>
                      </div>

                      {/* Appointments */}
                      {dayApts.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-black uppercase text-orange-600 tracking-wider">Appointments</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {dayApts.map(apt => (
                              <div
                                key={apt.id}
                                onClick={() => setInspectingAppointment(apt)}
                                className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between cursor-pointer hover:border-orange-300 transition-colors"
                              >
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <Video className="w-3.5 h-3.5 text-orange-600" />
                                    <strong className="text-xs text-slate-900">{apt.title}</strong>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-0.5">
                                    {apt.startTime} - {apt.endTime} • {apt.clientName || apt.leadName || 'Consultation'}
                                  </div>
                                </div>
                                {apt.meetingLink && (
                                  <a
                                    href={apt.meetingLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="px-2.5 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-200 flex items-center gap-1"
                                  >
                                    <span>Meet</span>
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tasks Checklist */}
                      {dayTsks.length > 0 && (
                        <div className="space-y-1.5 pt-2">
                          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Task Checklist</span>
                          <div className="space-y-1.5">
                            {dayTsks.map(task => {
                              const isDone = task.status === 'COMPLETED';
                              return (
                                <div
                                  key={task.id}
                                  onClick={() => toggleTaskCompletion(task.id, task.status)}
                                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${isDone ? 'bg-emerald-50/60 border-emerald-200' : 'bg-white border-slate-200 hover:border-orange-200'
                                    }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleTaskCompletion(task.id, task.status);
                                      }}
                                    >
                                      {isDone ? (
                                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                                      ) : (
                                        <Square className="w-4 h-4 text-slate-400" />
                                      )}
                                    </button>
                                    <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                                      {task.title}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-500">
                                      {task.clientName || 'General'}
                                    </span>
                                    <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-slate-600'
                                      }`}>
                                      {task.priority}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAY FOCUS SLIDE-OVER DRAWER (FULL-HEIGHT RIGHT-SIDE DRAWER) */}
      {/* ========================================================================= */}
      {isDayDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-fadeIn">
          {/* Backdrop */}
          <div
            onClick={() => setIsDayDrawerOpen(false)}
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col border-l border-slate-200 text-slate-900 overflow-hidden transform transition-all ease-in-out duration-300">

              {/* Drawer Top Header */}
              <div className="p-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 bg-orange-100/70 px-2 py-0.5 rounded-full border border-orange-200">
                      Day Agenda Focus
                    </span>
                    {selectedDateStr === todayStr && (
                      <span className="text-[10px] font-black uppercase bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                        TODAY
                      </span>
                    )}
                    {filterStaffId !== 'ALL' && selectedStaffObj && (
                      <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full border border-blue-200">
                        Assignee: {selectedStaffObj.name}
                      </span>
                    )}
                  </div>

                  <h2 className="text-xl font-black text-slate-900 mt-1">
                    {new Date(selectedDateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                  </h2>
                </div>

                {/* Day Switcher & Close */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-white border border-slate-200 rounded-xl p-0.5 shadow-2xs">
                    <button
                      onClick={handleDrawerPrevDay}
                      className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition"
                      title="Previous Day"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedDateStr(todayStr)}
                      className="px-2 py-1 text-[11px] font-bold text-slate-700 hover:text-orange-600"
                      title="Jump to Today"
                    >
                      Today
                    </button>
                    <button
                      onClick={handleDrawerNextDay}
                      className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-lg transition"
                      title="Next Day"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => setIsDayDrawerOpen(false)}
                    className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition ml-1"
                    title="Close Drawer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Drawer Summary & Quick Action Bar */}
              <div className="p-4 bg-white border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                {/* Stats Pills */}
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span className="px-2.5 py-1 rounded-xl bg-orange-50 text-orange-800 border border-orange-200 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-orange-600" />
                    <span>{selectedDayAppointments.length} Meetings</span>
                  </span>
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{drawerTaskBreakdown.completedSelected}/{drawerTaskBreakdown.totalSelected} Due Done</span>
                  </span>
                  {drawerTaskBreakdown.overdueOrStale.length > 0 && (
                    <span className="px-2.5 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>{drawerTaskBreakdown.overdueOrStale.length} Overdue / Stale</span>
                    </span>
                  )}
                </div>

                {/* Quick Add Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openNewAppointmentForDate(selectedDateStr)}
                    className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>+ Meeting</span>
                  </button>
                  <button
                    onClick={() => openNewTaskForDate(selectedDateStr)}
                    className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+ Task</span>
                  </button>
                </div>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">

                {/* ------------------------------------------------------------- */}
                {/* SECTION 1: APPOINTMENTS WITH GOOGLE MEET INTEGRATION */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                        <Video className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Appointments ({selectedDayAppointments.length})
                      </h3>
                    </div>

                    <button
                      onClick={() => openNewAppointmentForDate(selectedDateStr)}
                      className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Fix Consultation</span>
                    </button>
                  </div>

                  {selectedDayAppointments.length === 0 ? (
                    <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                      <p className="text-xs font-semibold text-slate-500">No appointments scheduled for this date</p>
                      <button
                        onClick={() => openNewAppointmentForDate(selectedDateStr)}
                        className="mt-1.5 text-xs font-bold text-orange-600 hover:underline inline-flex items-center gap-1"
                      >
                        <span>+ Book Client Meet or Demo</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedDayAppointments.map(apt => {
                        const typeConfig = APPOINTMENT_TYPES.find(t => t.id === apt.appointmentType);
                        const staffStyle = getStaffStyle(apt.assignedStaffId, apt.assignedStaffName);
                        const initials = getStaffInitials(apt.assignedStaffName || 'Host');

                        return (
                          <div
                            key={apt.id}
                            className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-orange-300 shadow-2xs hover:shadow-xs transition-all space-y-3"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${typeConfig?.bg || 'bg-slate-100'} ${typeConfig?.color || 'text-slate-800'} ${typeConfig?.border || 'border-slate-300'} uppercase`}>
                                    {typeConfig?.label || apt.appointmentType.replace(/_/g, ' ')}
                                  </span>

                                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-orange-600" />
                                    <span>{apt.startTime} - {apt.endTime}</span>
                                  </div>
                                </div>

                                <h4 className="text-sm font-black text-slate-900">
                                  {apt.title}
                                </h4>

                                {(apt.clientName || apt.leadName) && (
                                  <p className="text-xs text-slate-500 font-medium">
                                    Client / Lead: <span className="font-bold text-slate-700">{apt.clientName || apt.leadName}</span>
                                  </p>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => {
                                    setEditingAppointment(apt);
                                    setAppointmentForm({
                                      title: apt.title,
                                      description: apt.description || '',
                                      appointmentType: apt.appointmentType,
                                      date: apt.date,
                                      startTime: apt.startTime,
                                      endTime: apt.endTime,
                                      clientId: apt.clientId || '',
                                      leadId: apt.leadId || '',
                                      projectId: apt.projectId || '',
                                      assignedStaffId: apt.assignedStaffId || '',
                                      locationType: apt.locationType,
                                      meetingLink: apt.meetingLink || '',
                                      reminderMinutes: String(apt.reminderMinutes || 15)
                                    });
                                    setIsAppointmentModalOpen(true);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-orange-600 rounded-lg hover:bg-orange-50 transition"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteAppointment(apt.id)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Host Staff Avatar Initials Pill */}
                            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-[10px] ${staffStyle.bg} ${staffStyle.text} border ${staffStyle.border}`}>
                                  {initials}
                                </span>
                                <span className="text-slate-600 text-xs font-medium">
                                  Host: <strong className="text-slate-800">{apt.assignedStaffName || 'Internal Host'}</strong>
                                </span>
                              </div>

                              {/* Google Meet Button */}
                              {apt.meetingLink && (
                                <a
                                  href={apt.meetingLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition"
                                >
                                  <Video className="w-3.5 h-3.5" />
                                  <span>Join Google Meet ↗</span>
                                </a>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ------------------------------------------------------------- */}
                {/* SECTION 2: TASKS SPLIT INTO OVERDUE, DUE TODAY, UPCOMING */}
                {/* ------------------------------------------------------------- */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <CheckSquare className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                        Tasks & Checklists
                      </h3>
                    </div>

                    {/* Task Sub-Filter Pills */}
                    <div className="flex items-center gap-1 text-xs">
                      <button
                        onClick={() => setDrawerTaskTab('ALL')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${drawerTaskTab === 'ALL'
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:bg-slate-100'
                          }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setDrawerTaskTab('OVERDUE')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${drawerTaskTab === 'OVERDUE'
                            ? 'bg-rose-600 text-white'
                            : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                          }`}
                      >
                        Overdue ({drawerTaskBreakdown.overdueOrStale.length})
                      </button>
                      <button
                        onClick={() => setDrawerTaskTab('DUE_TODAY')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${drawerTaskTab === 'DUE_TODAY'
                            ? 'bg-emerald-600 text-white'
                            : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                          }`}
                      >
                        Due ({drawerTaskBreakdown.dueOnSelected.length})
                      </button>
                      <button
                        onClick={() => setDrawerTaskTab('UPCOMING')}
                        className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition ${drawerTaskTab === 'UPCOMING'
                            ? 'bg-indigo-600 text-white'
                            : 'text-indigo-700 bg-indigo-50 hover:bg-indigo-100'
                          }`}
                      >
                        Upcoming ({drawerTaskBreakdown.upcoming.length})
                      </button>
                    </div>
                  </div>

                  {/* 2A. OVERDUE / PENDING LONG SECTION */}
                  {(drawerTaskTab === 'ALL' || drawerTaskTab === 'OVERDUE') && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Overdue / Pending Long Tasks ({drawerTaskBreakdown.overdueOrStale.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Needs manager unblock
                        </span>
                      </div>

                      {drawerTaskBreakdown.overdueOrStale.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                          🎉 Zero overdue tasks! Process is healthy.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {drawerTaskBreakdown.overdueOrStale.map(task => {
                            const isDone = task.status === 'COMPLETED';
                            const staleDays = getStaleDays(task);
                            const staffStyle = getStaffStyle(task.assignedStaffId, task.assignedStaffName);
                            const initials = getStaffInitials(task.assignedStaffName);
                            const subTasks = task.subTasks || [];

                            return (
                              <div
                                key={task.id}
                                className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 hover:bg-rose-50/60 transition-all space-y-2.5"
                              >
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => toggleTaskCompletion(task.id, task.status)}
                                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition"
                                  >
                                    {isDone ? (
                                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-rose-400" />
                                    )}
                                  </button>

                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Stale / Pending Long Badge */}
                                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1 animate-pulse">
                                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                                        <span>Stale: Pending {staleDays > 0 ? `${staleDays}d` : 'Overdue'}</span>
                                      </span>

                                      {/* Due Time */}
                                      <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-slate-400" />
                                        <span>Due: {task.dueDate || 'ASAP'}</span>
                                      </span>

                                      {/* Priority */}
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${task.priority === 'CRITICAL' ? 'bg-rose-600 text-white' :
                                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                            'bg-slate-100 text-slate-700'
                                        }`}>
                                        {task.priority}
                                      </span>
                                    </div>

                                    <h4 className="text-xs font-black text-slate-900">
                                      {task.title}
                                    </h4>

                                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                                      <span>Client: <strong className="text-slate-700">{task.clientName || 'General'}</strong></span>
                                    </div>

                                    {/* Sub-tasks */}
                                    {subTasks.length > 0 && (
                                      <div className="pt-2 border-t border-rose-100 space-y-1 pl-1">
                                        {subTasks.map(sub => (
                                          <div
                                            key={sub.id}
                                            onClick={() => toggleSubTask(task.id, sub.id, sub.isCompleted)}
                                            className="flex items-center gap-2 text-xs cursor-pointer"
                                          >
                                            {sub.isCompleted ? (
                                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                            ) : (
                                              <Square className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                            )}
                                            <span className={sub.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}>
                                              {sub.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Footer: Assignee Avatar + One-Click Reschedule */}
                                <div className="pt-2 border-t border-rose-100 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] ${staffStyle.bg} ${staffStyle.text} border ${staffStyle.border}`}>
                                      {initials}
                                    </span>
                                    <span className="text-[11px] text-slate-600 font-semibold">
                                      {task.assignedStaffName || 'Unassigned'}
                                    </span>
                                  </div>

                                  {/* Reschedule Button */}
                                  <button
                                    onClick={() => handleRescheduleTask(task.id, selectedDateStr)}
                                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                                    title="Move this task due date to selected date"
                                  >
                                    <CalendarPlus className="w-3 h-3 text-rose-600" />
                                    <span>Move to {selectedDateStr}</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2B. DUE ON SELECTED DATE (DUE TODAY) */}
                  {(drawerTaskTab === 'ALL' || drawerTaskTab === 'DUE_TODAY') && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                          <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Due on this Date ({drawerTaskBreakdown.dueOnSelected.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {drawerTaskBreakdown.completedSelected}/{drawerTaskBreakdown.totalSelected} Done
                        </span>
                      </div>

                      {drawerTaskBreakdown.dueOnSelected.length === 0 ? (
                        <div className="p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                          <p className="text-xs font-semibold text-slate-500">No tasks due on this date</p>
                          <button
                            onClick={() => openNewTaskForDate(selectedDateStr)}
                            className="mt-1 text-xs font-bold text-emerald-600 hover:underline inline-flex items-center gap-1"
                          >
                            <span>+ Add Task to Checklist</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {drawerTaskBreakdown.dueOnSelected.map(task => {
                            const isDone = task.status === 'COMPLETED';
                            const staffStyle = getStaffStyle(task.assignedStaffId, task.assignedStaffName);
                            const initials = getStaffInitials(task.assignedStaffName);
                            const subTasks = task.subTasks || [];
                            const staleDays = getStaleDays(task);

                            return (
                              <div
                                key={task.id}
                                className={`p-4 rounded-2xl border transition-all space-y-2.5 ${isDone
                                    ? 'bg-emerald-50/40 border-emerald-200'
                                    : 'bg-white border-slate-200 hover:border-orange-300 shadow-2xs'
                                  }`}
                              >
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => toggleTaskCompletion(task.id, task.status)}
                                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition"
                                  >
                                    {isDone ? (
                                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                      <Square className="w-5 h-5 text-slate-400" />
                                    )}
                                  </button>

                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {/* Due Time */}
                                      <span className="text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-orange-600" />
                                        <span>10:30 AM</span>
                                      </span>

                                      {/* Priority */}
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${task.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                                          task.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        {task.priority}
                                      </span>

                                      {/* Stale Warning if >3 days in progress */}
                                      {!isDone && staleDays >= 3 && (
                                        <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                                          <Hourglass className="w-3 h-3 text-amber-600" />
                                          <span>Pending {staleDays}d</span>
                                        </span>
                                      )}
                                    </div>

                                    <h4 className={`text-xs font-black ${isDone ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                      {task.title}
                                    </h4>

                                    <div className="text-[11px] text-slate-500">
                                      Client: <span className="font-semibold text-slate-700">{task.clientName || 'General'}</span>
                                    </div>

                                    {/* Sub-tasks checklist */}
                                    {subTasks.length > 0 && (
                                      <div className="pt-2 border-t border-slate-100 space-y-1.5 pl-1">
                                        {subTasks.map(sub => (
                                          <div
                                            key={sub.id}
                                            onClick={() => toggleSubTask(task.id, sub.id, sub.isCompleted)}
                                            className="flex items-center gap-2 text-xs cursor-pointer"
                                          >
                                            {sub.isCompleted ? (
                                              <CheckSquare className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                            ) : (
                                              <Square className="w-3.5 h-3.5 text-slate-300 flex-shrink-0" />
                                            )}
                                            <span className={sub.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}>
                                              {sub.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}

                                    {/* Inline Add Sub-task */}
                                    <div className="pt-1.5 flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        placeholder="+ Add sub-task item..."
                                        value={newSubTaskInput[task.id] || ''}
                                        onChange={e => setNewSubTaskInput(prev => ({ ...prev, [task.id]: e.target.value }))}
                                        onKeyDown={e => e.key === 'Enter' && handleAddSubTask(task.id)}
                                        className="text-xs p-1.5 bg-slate-50 border border-slate-200 rounded-lg flex-1 focus:ring-1 focus:ring-orange-500"
                                      />
                                      <button
                                        onClick={() => handleAddSubTask(task.id)}
                                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-lg transition"
                                      >
                                        Add
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Card Footer: Assignee Pill + Postpone Action */}
                                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-black text-[9px] ${staffStyle.bg} ${staffStyle.text} border ${staffStyle.border}`}>
                                      {initials}
                                    </span>
                                    <span className="text-[11px] text-slate-600 font-semibold">
                                      {task.assignedStaffName || 'Unassigned'}
                                    </span>
                                  </div>

                                  {/* Quick Postpone to Tomorrow */}
                                  <button
                                    onClick={() => {
                                      const tomorrow = new Date(selectedDateStr);
                                      tomorrow.setDate(tomorrow.getDate() + 1);
                                      handleRescheduleTask(task.id, tomorrow.toISOString().split('T')[0]);
                                    }}
                                    className="text-[11px] font-bold text-slate-500 hover:text-orange-600 transition"
                                    title="Postpone to tomorrow"
                                  >
                                    + Postpone 1d →
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2C. UPCOMING TASKS (LOOKAHEAD) */}
                  {(drawerTaskTab === 'ALL' || drawerTaskTab === 'UPCOMING') && (
                    <div className="space-y-2.5 pt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black uppercase tracking-wider text-indigo-800 flex items-center gap-1.5">
                          <Hourglass className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Upcoming Deliverables ({drawerTaskBreakdown.upcoming.length})</span>
                        </span>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          Next 7 days
                        </span>
                      </div>

                      {drawerTaskBreakdown.upcoming.length === 0 ? (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-400">
                          No upcoming tasks scheduled right after this date.
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {drawerTaskBreakdown.upcoming.slice(0, 5).map(task => {
                            const staffStyle = getStaffStyle(task.assignedStaffId, task.assignedStaffName);
                            const initials = getStaffInitials(task.assignedStaffName);

                            return (
                              <div
                                key={task.id}
                                className="p-3 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 flex items-center justify-between shadow-2xs transition"
                              >
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-bold text-slate-900">{task.title}</span>
                                    <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                                      Due {task.dueDate}
                                    </span>
                                  </div>
                                  <div className="text-[10px] text-slate-500 flex items-center gap-2">
                                    <span>Client: {task.clientName || 'General'}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1">
                                      <span className={`w-3.5 h-3.5 rounded-full inline-flex items-center justify-center font-bold text-[8px] ${staffStyle.bg} ${staffStyle.text}`}>
                                        {initials}
                                      </span>
                                      <span>{task.assignedStaffName}</span>
                                    </span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => handleRescheduleTask(task.id, selectedDateStr)}
                                  className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-lg text-[10px] font-bold border border-indigo-200 transition"
                                  title="Pull this task forward to work on it today"
                                >
                                  Pull to {selectedDateStr}
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Drawer Footer CTA */}
              <div className="p-4 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">
                  {drawerTaskBreakdown.totalSelected} items scheduled for {selectedDateStr}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openNewTaskForDate(selectedDateStr)}
                    className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
                  >
                    + Add New Task
                  </button>
                  <button
                    onClick={() => setIsDayDrawerOpen(false)}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
                  >
                    Done
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* FIX APPOINTMENT MODAL (With Google Meet link generator) */}
      {/* ========================================================================= */}
      {isAppointmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleSaveAppointment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold shrink-0">
                    <Video className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">
                      {editingAppointment ? 'Edit Appointment' : 'Fix New Appointment'}
                    </h2>
                    <p className="text-xs text-slate-500">Google Meet link will be generated automatically.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAppointmentModalOpen(false);
                    setEditingAppointment(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Appointment Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. AI Workflow Consultation / Client Scope Review"
                    value={appointmentForm.title}
                    onChange={e => setAppointmentForm({ ...appointmentForm, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Appointment Type</label>
                    <select
                      value={appointmentForm.appointmentType}
                      onChange={e => setAppointmentForm({ ...appointmentForm, appointmentType: e.target.value as AppointmentType })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    >
                      {APPOINTMENT_TYPES.map(t => (
                        <option key={t.id} value={t.id}>{t.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Date *</label>
                    <input
                      type="date"
                      required
                      value={appointmentForm.date}
                      onChange={e => setAppointmentForm({ ...appointmentForm, date: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Start Time *</label>
                    <select
                      value={appointmentForm.startTime}
                      onChange={e => setAppointmentForm({ ...appointmentForm, startTime: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    >
                      {TIME_SLOTS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">End Time</label>
                    <select
                      value={appointmentForm.endTime}
                      onChange={e => setAppointmentForm({ ...appointmentForm, endTime: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    >
                      {TIME_SLOTS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Link Client (Optional)</label>
                    <select
                      value={appointmentForm.clientId}
                      onChange={e => setAppointmentForm({ ...appointmentForm, clientId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- No Client Selected --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>{c.businessName} ({c.contactName})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Link Lead Pitch (Optional)</label>
                    <select
                      value={appointmentForm.leadId}
                      onChange={e => setAppointmentForm({ ...appointmentForm, leadId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- No Lead Selected --</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>{l.leadName} ({l.businessName})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Host / Staff Assignee</label>
                    <select
                      value={appointmentForm.assignedStaffId}
                      onChange={e => setAppointmentForm({ ...appointmentForm, assignedStaffId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- Select Host --</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Location / Platform</label>
                    <select
                      value={appointmentForm.locationType}
                      onChange={e => setAppointmentForm({ ...appointmentForm, locationType: e.target.value as AppointmentLocation })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                    >
                      {LOCATION_OPTIONS.map(loc => (
                        <option key={loc.id} value={loc.id}>{loc.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">
                    Meeting Link (Leave empty to auto-generate Google Meet URL)
                  </label>
                  <input
                    type="text"
                    placeholder="https://meet.google.com/xxx-yyyy-zzz"
                    value={appointmentForm.meetingLink}
                    onChange={e => setAppointmentForm({ ...appointmentForm, meetingLink: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Agenda / Meeting Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Meeting agenda, deliverables to review, client goals..."
                    value={appointmentForm.description}
                    onChange={e => setAppointmentForm({ ...appointmentForm, description: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAppointmentModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {editingAppointment ? 'Save Changes' : 'Confirm Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* QUICK ADD TASK MODAL (With Due Date & Assigned Staff) */}
      {/* ========================================================================= */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleCreateTask} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">Add Task Due to Calendar</h2>
                    <p className="text-xs text-slate-500">Will appear in the calendar as an interactive checklist item.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deploy Next.js App / Connect Retell AI Agent Webhook"
                    value={taskForm.title}
                    onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Due Date *</label>
                    <input
                      type="date"
                      required
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Due Time (Optional)</label>
                    <select
                      value={taskForm.dueTime}
                      onChange={e => setTaskForm({ ...taskForm, dueTime: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      {TIME_SLOTS.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Priority</label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value as TaskPriority })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="CRITICAL">Critical</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Assigned Staff</label>
                    <select
                      value={taskForm.assignedStaffId}
                      onChange={e => setTaskForm({ ...taskForm, assignedStaffId: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Assign Team Member --</option>
                      {staffList.map(s => (
                        <option key={s.id} value={s.id}>{s.name} ({s.role.replace(/_/g, ' ')})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Link Client (Optional)</label>
                  <select
                    value={taskForm.clientId}
                    onChange={e => setTaskForm({ ...taskForm, clientId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- No Client Selected --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.businessName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-500/20 cursor-pointer"
                >
                  Add to Checklist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* INSPECT APPOINTMENT MODAL */}
      {/* ========================================================================= */}
      {inspectingAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                {inspectingAppointment.appointmentType.replace(/_/g, ' ')}
              </span>
              <button
                type="button"
                onClick={() => setInspectingAppointment(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-3.5">
              <h2 className="text-xl font-black text-slate-900">{inspectingAppointment.title}</h2>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                <Clock className="w-4 h-4 text-orange-600" />
                <span>
                  {new Date(inspectingAppointment.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}, {inspectingAppointment.startTime} - {inspectingAppointment.endTime}
                </span>
              </div>

              {inspectingAppointment.clientName && (
                <div className="text-xs text-slate-600">
                  <span className="text-slate-400 block text-[11px] font-semibold">Client</span>
                  <strong className="text-slate-900">{inspectingAppointment.clientName}</strong>
                </div>
              )}

              {inspectingAppointment.assignedStaffName && (
                <div className="text-xs text-slate-600">
                  <span className="text-slate-400 block text-[11px] font-semibold">Host / Assignee</span>
                  <strong className="text-slate-900">{inspectingAppointment.assignedStaffName}</strong>
                </div>
              )}

              {inspectingAppointment.description && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {inspectingAppointment.description}
                </p>
              )}

              {inspectingAppointment.meetingLink && (
                <div className="pt-2">
                  <a
                    href={inspectingAppointment.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-500/20"
                  >
                    <Video className="w-4 h-4" />
                    <span>Join Google Meet Room ↗</span>
                  </a>
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteAppointment(inspectingAppointment.id)}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInspectingAppointment(null)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAppointment(inspectingAppointment);
                    setAppointmentForm({
                      title: inspectingAppointment.title,
                      description: inspectingAppointment.description || '',
                      appointmentType: inspectingAppointment.appointmentType,
                      date: inspectingAppointment.date,
                      startTime: inspectingAppointment.startTime,
                      endTime: inspectingAppointment.endTime,
                      clientId: inspectingAppointment.clientId || '',
                      leadId: inspectingAppointment.leadId || '',
                      projectId: inspectingAppointment.projectId || '',
                      assignedStaffId: inspectingAppointment.assignedStaffId || '',
                      locationType: inspectingAppointment.locationType,
                      meetingLink: inspectingAppointment.meetingLink || '',
                      reminderMinutes: String(inspectingAppointment.reminderMinutes || 15)
                    });
                    setInspectingAppointment(null);
                    setIsAppointmentModalOpen(true);
                  }}
                  className="px-3.5 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-sm shadow-orange-500/20 cursor-pointer"
                >
                  Edit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
