'use client';

import React, { useState, useEffect } from 'react';
import { 
  KanbanSquare, 
  List, 
  Plus, 
  RefreshCw, 
  Clock, 
  CheckCircle2, 
  Search,
  CheckSquare,
  Square,
  Sparkles,
  Check,
  Lock,
  Unlock,
  AlertTriangle,
  Send,
  Calendar,
  Share2,
  DollarSign,
  Receipt,
  Eye,
  Instagram,
  Linkedin,
  Youtube,
  Facebook,
  Twitter,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  Pencil,
  Trash2,
  Paperclip,
  FileCheck,
  Upload,
  MessageSquare
} from 'lucide-react';
import { 
  Task, 
  StaffMember, 
  Client, 
  TaskStatus, 
  TaskPriority, 
  ServiceType, 
  AgencyService, 
  Project, 
  PaymentReceipt, 
  SocialMediaTask, 
  SocialMediaPlatform 
} from '@/lib/types';
import { getWhatsAppDirectUrl } from '@/lib/whatsappService';
import { useAuth } from '@/lib/AuthContext';

const DEFAULT_SERVICES: AgencyService[] = [
  { id: 'WEB_DEV', label: 'Web Development' },
  { id: 'SEO', label: 'SEO & Organic Growth' },
  { id: 'PERFORMANCE_ADS', label: 'Performance Ads' },
  { id: 'SOCIAL_MEDIA', label: 'Social Media' },
  { id: 'BRANDING', label: 'Design & Branding' },
  { id: 'FULL_SUITE', label: 'Full-Suite Retainer' },
  { id: 'DESIGN', label: 'UI/UX & Product Design' },
  { id: 'CONTENT', label: 'Content Writing & Copywriting' }
];

const COLUMNS: { id: TaskStatus; label: string; headerColor: string }[] = [
  { id: 'BACKLOG', label: 'Backlog', headerColor: 'bg-slate-100 text-slate-700 border-slate-200' },
  { id: 'TO_DO', label: 'To Do', headerColor: 'bg-blue-50 text-blue-800 border-blue-200' },
  { id: 'IN_PROGRESS', label: 'In Progress', headerColor: 'bg-orange-50 text-orange-800 border-orange-200' },
  { id: 'INTERNAL_REVIEW', label: 'Internal Review', headerColor: 'bg-purple-50 text-purple-800 border-purple-200' },
  { id: 'CLIENT_REVIEW', label: 'Client Review', headerColor: 'bg-amber-50 text-amber-800 border-amber-200' },
  { id: 'COMPLETED', label: 'Completed', headerColor: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
];

const PRIORITY_BADGES: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: 'Low', className: 'bg-slate-100 text-slate-600 border-slate-200' },
  MEDIUM: { label: 'Medium', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  HIGH: { label: 'High', className: 'bg-orange-50 text-orange-700 border-orange-200' },
  URGENT: { label: 'Urgent', className: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' },
  CRITICAL: { label: 'Critical', className: 'bg-rose-100 text-rose-800 border-rose-300 font-black' },
};

const PLATFORM_ICONS: Record<SocialMediaPlatform, any> = {
  INSTAGRAM: Instagram,
  LINKEDIN: Linkedin,
  YOUTUBE: Youtube,
  FACEBOOK: Facebook,
  TWITTER: Twitter,
};

const PLATFORM_COLORS: Record<SocialMediaPlatform, string> = {
  INSTAGRAM: 'bg-pink-50 text-pink-700 border-pink-200',
  LINKEDIN: 'bg-blue-50 text-blue-700 border-blue-200',
  YOUTUBE: 'bg-red-50 text-red-700 border-red-200',
  FACEBOOK: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  TWITTER: 'bg-sky-50 text-sky-700 border-sky-200',
};

export default function TasksPage() {
  const { currentUser, canViewFinancials, canManageAccounts, isFieldStaff } = useAuth();

  const [activeTab, setActiveTab] = useState<'deliverables' | 'social'>('deliverables');

  // Core Data
  const [tasks, setTasks] = useState<Task[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [services, setServices] = useState<AgencyService[]>(DEFAULT_SERVICES);

  // Social Media State (Phase 5)
  const [socialTasks, setSocialTasks] = useState<SocialMediaTask[]>([]);
  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [socialForm, setSocialForm] = useState({
    clientId: '',
    title: '',
    platform: 'INSTAGRAM' as SocialMediaPlatform,
    contentCreationDate: new Date().toISOString().split('T')[0],
    shootDate: '',
    editingDate: '',
    postingDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    assignedStaffId: ''
  });

  const [viewMode, setViewMode] = useState<'KANBAN' | 'LIST'>('KANBAN');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Split Receipts Modal
  const [selectedProjectReceipts, setSelectedProjectReceipts] = useState<Project | null>(null);

  // New Service Addition State
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [isSavingService, setIsSavingService] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    clientId: '',
    projectId: '',
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    serviceCategory: 'WEB_DEV' as ServiceType,
    assignedStaffId: '',
    dueDate: '',
    estimatedHours: '2',
    isRecurring: false,
    recurringRule: 'NONE',
    subTasksText: ''
  });

  // Edit Task State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isEditTaskModalOpen, setIsEditTaskModalOpen] = useState(false);
  const [editTaskForm, setEditTaskForm] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM' as TaskPriority,
    serviceCategory: 'WEB_DEV' as ServiceType,
    assignedStaffId: '',
    dueDate: '',
    estimatedHours: '2',
    status: 'TO_DO' as TaskStatus
  });

  // Automated Completion & WhatsApp Share Modal State
  const [completionShareData, setCompletionShareData] = useState<{
    task: Task;
    client: any;
    projectProgress: number;
    shareMessage: string;
    whatsappUrl: string;
    ownerNotification: any;
  } | null>(null);

  // Proof Deliverable Upload Modal State
  const [proofUploadTask, setProofUploadTask] = useState<Task | null>(null);
  const [proofForm, setProofForm] = useState({
    name: '',
    url: '',
    notes: '',
    fileSize: '1.2 MB'
  });

  const loadData = async () => {
    try {
      const [tasksRes, staffRes, clientsRes, projectsRes, socialRes, servicesRes] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/social-media').then(r => r.json()),
        fetch('/api/services').then(r => r.json()).catch(() => ({ success: false }))
      ]);

      if (tasksRes.success) setTasks(tasksRes.data);
      if (staffRes.success) setStaff(staffRes.data);
      if (clientsRes.success) {
        setClients(clientsRes.data);
        if (!formData.clientId && clientsRes.data.length > 0) {
          setFormData(prev => ({ ...prev, clientId: clientsRes.data[0].id }));
          setSocialForm(prev => ({ ...prev, clientId: clientsRes.data[0].id }));
        }
      }
      if (projectsRes.success) {
        setProjects(projectsRes.data);
        if (selectedProjectId === 'ALL' && projectsRes.data.length > 0) {
          setSelectedProjectId(projectsRes.data[0].id);
        }
      }
      if (socialRes.success) setSocialTasks(socialRes.data);
      if (servicesRes.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddNewService = async () => {
    const trimmed = newServiceName.trim();
    if (!trimmed) return;
    setIsSavingService(true);
    try {
      const existing = services.find(s => s.label.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        setFormData(prev => ({ ...prev, serviceCategory: existing.id }));
        setIsAddingService(false);
        setNewServiceName('');
        return;
      }

      const generatedId = trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '') || `SVC_${Date.now()}`;
      const newSvc: AgencyService = {
        id: generatedId,
        label: trimmed,
        isCustom: true
      };

      setServices(prev => [...prev, newSvc]);
      setFormData(prev => ({ ...prev, serviceCategory: newSvc.id }));

      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: trimmed })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setServices(prev => {
          const filtered = prev.filter(s => s.id !== newSvc.id);
          return [...filtered, data.data];
        });
        setFormData(prev => ({ ...prev, serviceCategory: data.data.id }));
      }

      setNotification(`✨ New service "${trimmed}" added!`);
      setTimeout(() => setNotification(null), 3000);
      setIsAddingService(false);
      setNewServiceName('');
    } catch (e) {
      console.error('Error adding service:', e);
    } finally {
      setIsSavingService(false);
    }
  };

  // Phase 5: 2% Weekly Penalty Trigger
  const handleSendLateFeeReminder = async (projectId: string) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/late-fee`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success && data.data) {
        setNotification(`🚨 2% Weekly Overdue Notice Dispatched! Total Due with penalty: ₹${data.data.totalDueWithPenalty.toLocaleString('en-IN')}`);
        setTimeout(() => setNotification(null), 5000);
      } else {
        alert(data.error || 'Failed to send late fee notice');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (!taskId) return;

    const task = tasks.find(t => t.id === taskId);

    if (newStatus === 'COMPLETED' && task) {
      await handleCompleteAndShareTask(task);
      return;
    }

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: newStatus,
          updatedByStaffId: currentUser?.id,
          updatedByStaffName: currentUser?.name,
          updatedByStaffPhone: currentUser?.phone
        })
      });
      const data = await res.json();
      if (data.success) {
        setNotification(`Task moved to ${newStatus.replace('_', ' ')}! WhatsApp notification dispatched.`);
        setTimeout(() => setNotification(null), 3500);
      }
    } catch (err) {
      console.error('Failed to update task status:', err);
    }
  };

  const handleCompleteAndShareTask = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}/complete-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staff: currentUser || { id: 'staff-1', name: 'Rachel Adams', role: 'ADMIN' },
          completionNotes: 'Deliverable finalized, verified and ready for client delivery.'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'COMPLETED' as TaskStatus } : t));
        setCompletionShareData(data.data);
        setNotification(`🎉 Task "${task.title}" completed! Project is now ${data.data.projectProgress}% complete.`);
        setTimeout(() => setNotification(null), 5000);
      } else {
        alert(data.error || 'Failed to complete task');
      }
    } catch (err: any) {
      console.error('Error completing task:', err);
      alert(err.message || 'Error completing task');
    }
  };

  const handleUploadProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofUploadTask) return;
    try {
      const computedUrl = proofForm.url.trim() || `https://storage.nearlook.com/proofs/${Date.now()}_${encodeURIComponent(proofForm.name.trim() || 'deliverable.png')}`;
      const res = await fetch(`/api/tasks/${proofUploadTask.id}/proof`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: proofForm.name.trim() || 'Deliverable Proof File',
          url: computedUrl,
          notes: proofForm.notes.trim(),
          fileSize: proofForm.fileSize.trim() || '1.2 MB'
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTasks(prev => prev.map(t => {
          if (t.id === proofUploadTask.id) {
            const existingProofs = t.proofFiles || [];
            return { ...t, proofFiles: [data.data, ...existingProofs] };
          }
          return t;
        }));
        setProofUploadTask(null);
        setProofForm({ name: '', url: '', notes: '', fileSize: '1.2 MB' });
        setNotification(`📎 Deliverable proof saved for "${proofUploadTask.title}"!`);
        setTimeout(() => setNotification(null), 4000);
      } else {
        alert(data.error || 'Failed to upload proof deliverable');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading proof');
    }
  };

  const handleToggleSubTask = async (taskId: string, subTaskId: string) => {
    try {
      setTasks(prev => prev.map(t => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          subTasks: t.subTasks.map(st => st.id === subTaskId ? { ...st, isCompleted: !st.isCompleted } : st)
        };
      }));

      await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subTaskId })
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subTasks = formData.subTasksText
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          projectId: selectedProjectId !== 'ALL' ? selectedProjectId : undefined,
          subTasks
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setIsModalOpen(false);
        setNotification(`Task created! WhatsApp alert dispatched to staff.`);
        setTimeout(() => setNotification(null), 4000);
        setFormData({
          clientId: clients[0]?.id || '',
          projectId: '',
          title: '',
          description: '',
          priority: 'MEDIUM',
          serviceCategory: 'WEB_DEV',
          assignedStaffId: '',
          dueDate: '',
          estimatedHours: '2',
          isRecurring: false,
          recurringRule: 'NONE',
          subTasksText: ''
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditTask = (task: Task) => {
    setEditingTask(task);
    setEditTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      serviceCategory: task.serviceCategory || 'WEB_DEV',
      assignedStaffId: task.assignedStaffId || '',
      dueDate: task.dueDate ? task.dueDate.split('T')[0] : '',
      estimatedHours: String(task.estimatedHours || 2),
      status: task.status || 'TO_DO'
    });
    setIsEditTaskModalOpen(true);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    try {
      const staffMember = staff.find(s => s.id === editTaskForm.assignedStaffId);
      const res = await fetch(`/api/tasks/${editingTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editTaskForm,
          assignedStaffName: staffMember?.name || editingTask.assignedStaffName,
          estimatedHours: Number(editTaskForm.estimatedHours) || 2
        })
      });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.map(t => t.id === editingTask.id ? data.data : t));
        setIsEditTaskModalOpen(false);
        setEditingTask(null);
        setNotification('Task updated successfully!');
        setTimeout(() => setNotification(null), 3500);
      } else {
        alert(data.error || 'Failed to update task');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating task');
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!confirm(`Are you sure you want to delete task "${task.title}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setTasks(prev => prev.filter(t => t.id !== task.id));
        setNotification(`Task "${task.title}" deleted.`);
        setTimeout(() => setNotification(null), 3500);
      } else {
        alert(data.error || 'Failed to delete task');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting task');
    }
  };

  const handleCreateSocialTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const client = clients.find(c => c.id === socialForm.clientId);
      const staffMember = staff.find(s => s.id === socialForm.assignedStaffId);

      const res = await fetch('/api/social-media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...socialForm,
          clientName: client?.businessName || 'Client Brand',
          assignedStaffName: staffMember?.name
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setSocialTasks(prev => [data.data, ...prev]);
        setIsSocialModalOpen(false);
        setNotification(`Scheduled ${socialForm.platform} content deliverable for ${client?.businessName}!`);
        setTimeout(() => setNotification(null), 4000);
        setSocialForm({
          clientId: clients[0]?.id || '',
          title: '',
          platform: 'INSTAGRAM',
          contentCreationDate: new Date().toISOString().split('T')[0],
          shootDate: '',
          editingDate: '',
          postingDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          assignedStaffId: ''
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Active Selected Project
  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Filter Tasks by Project & Search & Field Staff Role
  const filteredTasks = tasks.filter(t => {
    const matchesProject = selectedProjectId === 'ALL' || t.projectId === selectedProjectId;
    const matchesSearch = 
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedStaffName?.toLowerCase().includes(searchQuery.toLowerCase());

    // Field Staff isolation: only show assigned tasks
    if (isFieldStaff && currentUser) {
      return matchesProject && matchesSearch && t.assignedStaffId === currentUser.id;
    }

    return matchesProject && matchesSearch;
  });

  // Calculate project progress percentage
  const projectTasks = tasks.filter(t => t.projectId === selectedProjectId);
  const completedCount = projectTasks.filter(t => t.status === 'COMPLETED').length;
  const projectProgress = projectTasks.length > 0 
    ? Math.round((completedCount / projectTasks.length) * 100) 
    : 0;

  // Overdue Check
  const isProjectOverdue = activeProject?.dueDate ? new Date(activeProject.dueDate) < new Date() : false;

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <KanbanSquare className="w-6 h-6 text-orange-600" />
            Project Deliverables & Task Progress Engine
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track client deliverables, milestone execution, weekly 2% overdue interest reminders & social media content calendar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'deliverables' ? (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Create Task (+ WhatsApp)</span>
            </button>
          ) : (
            <button
              onClick={() => setIsSocialModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Content Post</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('deliverables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'deliverables'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <KanbanSquare className="w-4 h-4" />
          <span>Project Deliverables Workspace</span>
        </button>

        <button
          onClick={() => setActiveTab('social')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'social'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Social Media & Content Calendar</span>
        </button>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{notification}</span>
        </div>
      )}

      {/* TAB 1: Deliverables Workspace (Phase 4 & 5) */}
      {activeTab === 'deliverables' && (
        <div className="space-y-6">
          {/* Top-Level Project Selector & Financial Progress Banner */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Project Dropdown */}
              <div className="flex-1 max-w-xl">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Active Project Workspace
                </label>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="ALL">-- View All Agency Tasks Across Projects --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>
                      [{p.status}] {p.clientName} - {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Progress & Due Date Badges */}
              {activeProject && (
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Deliverables Done</span>
                    <div className="text-base font-black text-slate-900">{projectProgress}%</div>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">Timeline Status</span>
                    <div className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isProjectOverdue ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isProjectOverdue ? 'Overdue Due Date' : 'On Track'}
                    </div>
                  </div>

                  {canViewFinancials && activeProject.receipts && activeProject.receipts.length > 0 && (
                    <button
                      onClick={() => setSelectedProjectReceipts(activeProject)}
                      className="flex items-center gap-1.5 px-3 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200 transition-colors"
                    >
                      <Receipt className="w-4 h-4 text-emerald-600" />
                      <span>{activeProject.receipts.length} Split Receipts</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Financial Balances & 2% Overdue Reminder Button (Phase 5) */}
            {activeProject && canViewFinancials && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Contract Total</span>
                  <div className="font-mono font-bold text-slate-900 text-sm">
                    ₹{activeProject.totalValue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Collected</span>
                  <div className="font-mono font-bold text-emerald-600 text-sm">
                    ₹{activeProject.collectedAmount.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Balance Outstanding</span>
                  <div className="font-mono font-black text-rose-600 text-sm">
                    ₹{activeProject.balanceDue.toLocaleString('en-IN')}
                  </div>
                </div>

                <div>
                  {activeProject.balanceDue > 0 ? (
                    <button
                      onClick={() => handleSendLateFeeReminder(activeProject.id)}
                      className="w-full py-2 px-2.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1.5 transition-colors"
                      title="Dispatches WhatsApp alert with 2% weekly compound interest calculation"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                      <span>Send 2% Overdue Notice (WA)</span>
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> Dues Fully Cleared
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Search & View Mode Switcher */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search tasks, clients, or team specialists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setViewMode('KANBAN')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'KANBAN'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <KanbanSquare className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode('LIST')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'LIST'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>

          {/* Kanban Board */}
          {viewMode === 'KANBAN' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 items-start overflow-x-auto pb-4">
              {COLUMNS.map((column) => {
                const columnTasks = filteredTasks.filter(t => t.status === column.id);

                return (
                  <div
                    key={column.id}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                    className="bg-slate-50/80 rounded-2xl border border-slate-200 p-3 flex flex-col min-h-[500px]"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border ${column.headerColor}`}>
                        {column.label}
                      </span>
                      <span className="text-[11px] font-bold text-slate-400">
                        {columnTasks.length}
                      </span>
                    </div>

                    <div className="space-y-2.5 flex-1">
                      {columnTasks.map((task) => {
                        const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM;
                        const completedSubs = task.subTasks?.filter(st => st.isCompleted).length || 0;
                        const totalSubs = task.subTasks?.length || 0;

                        return (
                          <div
                            key={task.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, task.id)}
                            className="bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:border-orange-400 hover:shadow-md transition-all cursor-grab active:cursor-grabbing text-xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-[10px] font-bold text-orange-600 truncate max-w-[120px]">
                                {task.clientName}
                              </span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${priorityInfo.className}`}>
                                {priorityInfo.label}
                              </span>
                            </div>

                            <h4 className="font-bold text-slate-900 leading-snug">
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-[11px] text-slate-500 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {totalSubs > 0 && (
                              <div className="pt-1 space-y-1">
                                <div className="flex justify-between text-[10px] text-slate-500 font-semibold">
                                  <span>Checklist</span>
                                  <span>{completedSubs}/{totalSubs}</span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className="bg-orange-500 h-full rounded-full"
                                    style={{ width: `${(completedSubs / totalSubs) * 100}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}

                            {/* Proof Deliverables */}
                            {task.proofFiles && task.proofFiles.length > 0 && (
                              <div className="pt-1 flex flex-wrap gap-1">
                                {task.proofFiles.map(pf => (
                                  <a
                                    key={pf.id}
                                    href={pf.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 text-[10px] font-semibold border border-purple-200"
                                    title={pf.name}
                                  >
                                    <Paperclip className="w-2.5 h-2.5" />
                                    <span className="truncate max-w-[90px]">{pf.name}</span>
                                  </a>
                                ))}
                              </div>
                            )}

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                              <span className="font-bold text-slate-700 truncate max-w-[85px]" title={task.assignedStaffName}>
                                {task.assignedStaffName || 'Unassigned'}
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); setProofUploadTask(task); }}
                                  className="p-1 rounded hover:bg-purple-100 text-slate-400 hover:text-purple-600 transition-colors"
                                  title="Upload Proof Deliverable"
                                >
                                  <Upload className="w-3 h-3" />
                                </button>
                                {task.status === 'COMPLETED' ? (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCompleteAndShareTask(task); }}
                                    className="p-1 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
                                    title="Share Completion Progress on WhatsApp"
                                  >
                                    <Share2 className="w-3 h-3" />
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); handleCompleteAndShareTask(task); }}
                                    className="p-1 rounded hover:bg-emerald-100 text-slate-400 hover:text-emerald-600 transition-colors"
                                    title="Mark Completed & Notify Client"
                                  >
                                    <CheckCircle2 className="w-3 h-3" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); openEditTask(task); }}
                                  className="p-1 rounded hover:bg-orange-100 text-slate-400 hover:text-orange-600 transition-colors"
                                  title="Edit Task"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => { e.stopPropagation(); handleDeleteTask(task); }}
                                  className="p-1 rounded hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition-colors"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                                {task.dueDate && (
                                  <span className="font-medium text-slate-400 ml-1">
                                    {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'LIST' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="py-3 px-4">Task / Deliverable</th>
                      <th className="py-3 px-4">Client Brand</th>
                      <th className="py-3 px-4">Assigned Specialist</th>
                      <th className="py-3 px-4">Priority</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Due Date</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-orange-50/30 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          {task.title}
                        </td>
                        <td className="py-3.5 px-4 text-orange-600 font-semibold">
                          {task.clientName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {task.assignedStaffName || 'Unassigned'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${PRIORITY_BADGES[task.priority].className}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            value={task.status}
                            onChange={(e) => handleDrop({ preventDefault: () => {}, dataTransfer: { getData: () => task.id } } as any, e.target.value as TaskStatus)}
                            className="bg-slate-50 text-slate-800 text-xs font-bold px-2 py-1 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-orange-500"
                          >
                            {COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditTask(task)}
                              className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors"
                              title="Edit Task"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task)}
                              className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                              title="Delete Task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Social Media & Content Calendar (Phase 5) */}
      {activeTab === 'social' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-orange-600" />
                Agency Content Production Pipeline
              </h2>
              <p className="text-xs text-slate-500">
                Track full lifecycle: Creation Date → Shoot Date → Video Editing → Final Posting on Client Socials.
              </p>
            </div>

            <button
              onClick={() => setIsSocialModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Schedule Content Post</span>
            </button>
          </div>

          {/* Social Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialTasks.map((post) => {
              const PlatformIcon = PLATFORM_ICONS[post.platform] || Instagram;
              const colorClass = PLATFORM_COLORS[post.platform] || PLATFORM_COLORS.INSTAGRAM;

              return (
                <div
                  key={post.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:border-orange-300 transition-all space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1.5 ${colorClass}`}>
                      <PlatformIcon className="w-3.5 h-3.5" />
                      <span>{post.platform}</span>
                    </span>

                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {post.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">
                      {post.title}
                    </h3>
                    <div className="text-xs text-orange-600 font-semibold mt-1">
                      Client: {post.clientName}
                    </div>
                  </div>

                  {/* Production Milestones Timeline */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span>📸 Shoot Date:</span>
                      <strong className="text-slate-900">{post.shootDate || 'TBD'}</strong>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span>🎬 Editing Date:</span>
                      <strong className="text-slate-900">{post.editingDate || 'TBD'}</strong>
                    </div>
                    <div className="flex justify-between items-center text-emerald-700 font-bold border-t border-slate-200/60 pt-1.5">
                      <span>🚀 Posting Date:</span>
                      <span>{post.postingDate}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>Creator: <strong className="text-slate-800">{post.assignedStaffName || 'Agency Team'}</strong></span>
                    {post.postUrl && (
                      <a
                        href={post.postUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 hover:text-orange-700 flex items-center gap-1 font-bold"
                      >
                        <span>View Post</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Split Payment Receipts Modal (Phase 5) */}
      {selectedProjectReceipts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 shadow-2xl relative my-8 text-slate-900">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-600" />
                  Split Payment Receipts (50/30/20)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Milestone collections for <strong>{selectedProjectReceipts.title}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedProjectReceipts(null)}
                className="p-1 text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <div className="my-5 space-y-3">
              {selectedProjectReceipts.receipts?.map((rcp) => (
                <div key={rcp.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="font-mono text-emerald-700">{rcp.receiptNumber}</span>
                    <span className="text-sm font-black text-slate-900 font-mono">
                      ₹{rcp.amount.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Milestone: <strong>{rcp.milestoneLabel}</strong></span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(rcp.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 flex items-center justify-between">
                    <span>Recorded by: {rcp.recordedByStaffName || 'Accounts Manager'}</span>
                    <span className="text-emerald-600 font-semibold">WhatsApp Confirmed</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setSelectedProjectReceipts(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleCreateTask} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-orange-600" />
                    Create Project Task
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Assign task to specialist and automatically dispatch notification with contact details.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg font-bold transition-colors cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Client / Brand *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Task Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Implement Stripe Webhook & Supabase Auth"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Specialist *</label>
                  <select
                    value={formData.assignedStaffId}
                    onChange={(e) => setFormData({ ...formData, assignedStaffId: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="">Select Team Member</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Immediate WhatsApp)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Est. Hours</label>
                  <input
                    type="number"
                    value={formData.estimatedHours}
                    onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Sub-Tasks Checklist (one per line)</label>
                <textarea
                  rows={3}
                  placeholder="Design Figma mockups&#10;Implement responsive navbar&#10;Write unit tests"
                  value={formData.subTasksText}
                  onChange={(e) => setFormData({ ...formData, subTasksText: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Assign & Notify via WhatsApp</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Social Media Modal (Phase 5) */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleCreateSocialTask} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-orange-600" />
                    Schedule Social Media Deliverable
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Plan shoot date, editing timeline, and publish date across client social channels.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSocialModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg font-bold transition-colors cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Client Brand *</label>
                <select
                  value={socialForm.clientId}
                  onChange={(e) => setSocialForm({ ...socialForm, clientId: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Content Deliverable Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 30s Brand Founder Story Reel"
                  value={socialForm.title}
                  onChange={(e) => setSocialForm({ ...socialForm, title: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Platform *</label>
                  <select
                    value={socialForm.platform}
                    onChange={(e) => setSocialForm({ ...socialForm, platform: e.target.value as SocialMediaPlatform })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    <option value="INSTAGRAM">Instagram</option>
                    <option value="LINKEDIN">LinkedIn</option>
                    <option value="YOUTUBE">YouTube</option>
                    <option value="FACEBOOK">Facebook</option>
                    <option value="TWITTER">Twitter / X</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Creator</label>
                  <select
                    value={socialForm.assignedStaffId}
                    onChange={(e) => setSocialForm({ ...socialForm, assignedStaffId: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Creator</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Shoot Date</label>
                  <input
                    type="date"
                    value={socialForm.shootDate}
                    onChange={(e) => setSocialForm({ ...socialForm, shootDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Editing Date</label>
                  <input
                    type="date"
                    value={socialForm.editingDate}
                    onChange={(e) => setSocialForm({ ...socialForm, editingDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 block mb-1">Posting Date *</label>
                  <input
                    type="date"
                    required
                    value={socialForm.postingDate}
                    onChange={(e) => setSocialForm({ ...socialForm, postingDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>
              </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsSocialModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Schedule Content</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {isEditTaskModalOpen && editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleUpdateTask} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-orange-600" />
                    Edit Task Deliverable
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                    Client: <strong className="text-slate-800">{editingTask.clientName}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsEditTaskModalOpen(false); setEditingTask(null); }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg font-bold transition-colors cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={editTaskForm.title}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Description</label>
                <textarea
                  rows={3}
                  value={editTaskForm.description}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Status Column</label>
                  <select
                    value={editTaskForm.status}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, status: e.target.value as TaskStatus })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {COLUMNS.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Priority</label>
                  <select
                    value={editTaskForm.priority}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, priority: e.target.value as TaskPriority })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Red Alert)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Assigned Specialist</label>
                  <select
                    value={editTaskForm.assignedStaffId}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, assignedStaffId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">-- Unassigned --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={editTaskForm.dueDate}
                    onChange={(e) => setEditTaskForm({ ...editTaskForm, dueDate: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estimated Hours</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={editTaskForm.estimatedHours}
                  onChange={(e) => setEditTaskForm({ ...editTaskForm, estimatedHours: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsEditTaskModalOpen(false); setEditingTask(null); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all cursor-pointer"
                >
                  Save Task Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Automated Task Completion Client WhatsApp Share Modal */}
      {completionShareData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Task Completed!</h3>
                  <p className="text-xs text-slate-500">Milestone deliverable ready for client</p>
                </div>
              </div>
              <button
                onClick={() => setCompletionShareData(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Progress summary banner */}
            <div className="p-3.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white shadow-sm space-y-1">
              <div className="flex justify-between items-center text-xs font-bold text-orange-100">
                <span>Overall Project Progress</span>
                <span className="text-white text-sm font-black">{completionShareData.projectProgress}%</span>
              </div>
              <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-500" 
                  style={{ width: `${completionShareData.projectProgress}%` }}
                />
              </div>
            </div>

            {/* Owner notification log confirmation */}
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Owner Rachel Adams notified automatically via internal audit log.</span>
            </div>

            {/* WhatsApp message preview */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                Client WhatsApp Update Preview
              </label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 whitespace-pre-wrap font-sans max-h-36 overflow-y-auto">
                {completionShareData.shareMessage}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <a
                href={completionShareData.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setCompletionShareData(null)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20"
              >
                <Share2 className="w-4 h-4" />
                <span>Open & Share on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => setCompletionShareData(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Proof Deliverable Modal */}
      {proofUploadTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 text-slate-900 space-y-4">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Upload Task Deliverable Proof</h3>
                  <p className="text-xs text-slate-500 truncate max-w-[280px]">{proofUploadTask.title}</p>
                </div>
              </div>
              <button
                onClick={() => setProofUploadTask(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadProofSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deliverable / File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Figma_Wireframes_Export.pdf"
                  value={proofForm.name}
                  onChange={(e) => setProofForm({ ...proofForm, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cloud / CDN URL (Google Drive, S3, Figma)</label>
                <input
                  type="url"
                  placeholder="https://... or leave blank for simulated cloud CDN"
                  value={proofForm.url}
                  onChange={(e) => setProofForm({ ...proofForm, url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">File Size</label>
                <input
                  type="text"
                  placeholder="1.2 MB"
                  value={proofForm.fileSize}
                  onChange={(e) => setProofForm({ ...proofForm, fileSize: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Deliverable Notes</label>
                <textarea
                  rows={2}
                  placeholder="Details on what is included in this deliverable version..."
                  value={proofForm.notes}
                  onChange={(e) => setProofForm({ ...proofForm, notes: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setProofUploadTask(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Attach Proof</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
