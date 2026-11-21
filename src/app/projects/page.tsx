'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FolderKanban,
  Plus,
  Search,
  Calendar,
  Layers,
  TrendingUp,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Laptop,
  Globe,
  Bot,
  Share2,
  X,
  Check,
  Receipt,
  Users,
  Code2,
  ExternalLink,
  ChevronRight,
  LayoutGrid,
  List,
  DollarSign,
  UserPlus,
  Briefcase,
  ArrowLeft,
  MapPin,
  Building2,
  Send,
  Copy,
  Printer,
  CreditCard,
  FileText,
  ShieldCheck,
  Terminal,
  Cpu,
  Cloud,
  CheckSquare,
  Square,
  GitBranch
} from 'lucide-react';
import { Project, Client, ProjectMilestone, Invoice, PaymentReceipt, Task } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const formatLakhs = (val?: number) => {
  const num = val || 0;
  if (num === 0) return '₹0';
  if (Math.abs(num) >= 10000000) {
    return `₹${(num / 10000000).toFixed(2)} Cr`;
  }
  if (Math.abs(num) >= 100000) {
    return `₹${(num / 100000).toFixed(2)} L`;
  }
  return formatINR(num);
};

export default function ProjectsPage() {
  const { currentStaff, canViewFinancials } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [quotations, setQuotations] = useState<any[]>([]);
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Open Project: null = Master Directory; Project = Detailed Workspace
  const [openProject, setOpenProject] = useState<Project | null>(null);

  // Active Tab inside Detailed Workspace
  const [activeTab, setActiveTab] = useState<
    'OVERVIEW' | 'SOW' | 'TASKS' | 'INVOICES' | 'EXPENSES' | 'SPRINT' | 'DOCS' | 'VAULT'
  >('OVERVIEW');

  // View Mode for Master Directory: 'GRID' or 'TABLE'
  const [viewMode, setViewMode] = useState<'GRID' | 'TABLE'>('GRID');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deletingProject, setDeletingProject] = useState<Project | null>(null);
  const [showRecordPaymentModal, setShowRecordPaymentModal] = useState(false);
  const [showAddDeliverableModal, setShowAddDeliverableModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [whatsappModal, setWhatsappModal] = useState<{
    isOpen: boolean;
    type: 'DIRECTOR_REPORT' | 'CLIENT_UPDATE';
    title: string;
    phone: string;
    message: string;
  } | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State for Create / Edit Project
  const [formTitle, setFormTitle] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formDomain, setFormDomain] = useState<'SOFTWARE' | 'WEB' | 'AI' | 'MARKETING'>('SOFTWARE');
  const [formCategory, setFormCategory] = useState('AI & FULL-STACK WEB');
  const [formLocation, setFormLocation] = useState('Bangalore / AWS Cloud');
  const [formTechStack, setFormTechStack] = useState('Next.js 14, Node.js, PostgreSQL');
  const [formTotalValue, setFormTotalValue] = useState('');
  const [formAdvanceRequired, setFormAdvanceRequired] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formStatus, setFormStatus] = useState('PLANNING');
  const [formDescription, setFormDescription] = useState('');
  const [formLeadName, setFormLeadName] = useState('Alex Rivera (Lead Architect)');

  // Form State for Add Client
  const [clientForm, setClientForm] = useState({
    businessName: '',
    contactName: '',
    whatsappNumber: '',
    email: '',
    city: 'Bangalore',
    address: 'Indiranagar, Bangalore, Karnataka',
    clientType: 'ONE_TIME_PROJECT' as 'ONE_TIME_PROJECT' | 'RECURRING_RETAINER',
    monthlyRetainerAmount: ''
  });
  const [savingClient, setSavingClient] = useState(false);

  // Form State for Record Payment
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentMethod: 'Bank Transfer / NEFT',
    referenceId: '',
    milestoneLabel: 'Split Payment Installment',
    notes: 'Payment verified and credited'
  });

  // Form State for Deliverable / Scope line
  const [deliverableForm, setDeliverableForm] = useState({
    title: '',
    deliverable: '',
    amount: ''
  });

  // Form State for Task
  const [taskForm, setTaskForm] = useState({
    title: '',
    dueDate: new Date().toISOString().split('T')[0],
    priority: 'MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  });

  const loadData = async () => {
    console.log('[ProjectsPage] loadData started');
    try {
      const [projRes, clientsRes, invRes, rcpRes, tasksRes, quotesRes, leadsRes] = await Promise.all([
        fetch('/api/projects').then(r => r.json()).catch(err => { console.error('proj error:', err); return { success: false, data: [] }; }),
        fetch('/api/clients').then(r => r.json()).catch(err => { console.error('clients error:', err); return { success: false, data: [] }; }),
        fetch('/api/invoices').then(r => r.json()).catch(err => { console.error('inv error:', err); return { success: false, data: [] }; }),
        fetch('/api/payments').then(r => r.json()).catch(err => { console.error('payments error:', err); return { success: false, data: [] }; }),
        fetch('/api/tasks').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/quotations').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/leads').then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);
      console.log('[ProjectsPage] fetches completed, processing data');

      let loadedClients: Client[] = [];
      if (clientsRes?.success) {
        loadedClients = Array.isArray(clientsRes.data) ? clientsRes.data : [];
        setClients(loadedClients);
        if (loadedClients.length > 0 && !formClientId) {
          setFormClientId(loadedClients[0].id);
        }
      }

      if (quotesRes?.success && Array.isArray(quotesRes.data)) {
        setQuotations(quotesRes.data);
      }

      let loadedLeads: any[] = [];
      if (leadsRes?.success && Array.isArray(leadsRes.data)) {
        loadedLeads = leadsRes.data;
        setLeads(loadedLeads);
      }

      if (projRes?.success && Array.isArray(projRes.data)) {
        setProjects(projRes.data);

        // Check if query params ask to view/open a specific project or create from won lead
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const viewId = urlParams.get('openProjectId') || urlParams.get('viewProjectId');
          if (viewId) {
            const target = projRes.data.find((p: Project) => p.id === viewId || p.code === viewId);
            if (target) {
              setOpenProject(target);
            }
          }

          const createFromLeadId = urlParams.get('createFromLead');
          if (createFromLeadId && loadedLeads.length > 0) {
            const lead = loadedLeads.find((l: any) => l.id === createFromLeadId);
            if (lead) {
              const matchedClient = loadedClients.find((c: any) =>
                (lead.clientId && c.id === lead.clientId) ||
                (c.businessName && c.businessName.toLowerCase() === lead.businessName.toLowerCase())
              );
              if (matchedClient) {
                setFormClientId(matchedClient.id);
              }
              const svcTitle = lead.servicesInterested && lead.servicesInterested.length > 0
                ? lead.servicesInterested[0].replace(/_/g, ' ')
                : (lead.serviceType ? lead.serviceType.replace(/_/g, ' ') : 'Digital Platform');
              setFormTitle(`${lead.businessName} - ${svcTitle} Project`);
              setFormCategory(lead.businessCategory || 'AI & FULL-STACK WEB');
              setFormTotalValue(String(lead.estimatedDealValue || 0));
              setFormAdvanceRequired(String(Math.round((lead.estimatedDealValue || 0) * 0.4)));
              setFormDescription(`Created from Won Lead: ${lead.businessName}. Contact: ${lead.leadName} (${lead.whatsappNumber}). Inquired Scope: ${lead.servicesInterested ? lead.servicesInterested.join(', ') : lead.serviceType || 'Custom Execution'}.`);

              const svcStr = (lead.serviceInterested || lead.serviceType || '').toLowerCase();
              let domain: 'SOFTWARE' | 'WEB' | 'AI' | 'MARKETING' = 'SOFTWARE';
              if (svcStr.includes('web') || svcStr.includes('shopify') || svcStr.includes('portal')) domain = 'WEB';
              else if (svcStr.includes('ai') || svcStr.includes('automation') || svcStr.includes('bot')) domain = 'AI';
              else if (svcStr.includes('social') || svcStr.includes('marketing') || svcStr.includes('ad')) domain = 'MARKETING';
              setFormDomain(domain);
              setShowCreateModal(true);
            }
          }
        }
      }

      if (invRes?.success) {
        setInvoices(Array.isArray(invRes.data) ? invRes.data : []);
      }
      if (rcpRes?.success) {
        const receiptsData = Array.isArray(rcpRes.data) ? rcpRes.data : Array.isArray(rcpRes.receipts) ? rcpRes.receipts : [];
        setReceipts(receiptsData);
      }
      if (tasksRes?.success) {
        setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      }
    } catch (err) {
      console.error('Error loading projects data:', err);
    } finally {
      console.log('[ProjectsPage] loadData finally setLoading(false)');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('[ProjectsPage] mounted, calling loadData');
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  // Sync openProject whenever projects list reloads or browser history pops
  useEffect(() => {
    if (openProject) {
      const updated = projects.find(p => p.id === openProject.id);
      if (updated) {
        setOpenProject(updated);
      }
    }
  }, [projects]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const viewId = urlParams.get('openProjectId') || urlParams.get('viewProjectId');
        if (viewId) {
          const target = projects.find(p => p.id === viewId || p.code === viewId);
          if (target) setOpenProject(target);
        } else {
          setOpenProject(null);
        }
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [projects]);

  const handleOpenProject = (proj: Project) => {
    setOpenProject(proj);
    setActiveTab('OVERVIEW');
    if (typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?openProjectId=${encodeURIComponent(proj.id)}`;
      window.history.pushState({}, '', newUrl);
    }
  };

  const handleBackToProjects = () => {
    setOpenProject(null);
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const resetForm = () => {
    setFormTitle('');
    setFormDomain('SOFTWARE');
    setFormCategory('AI & FULL-STACK WEB');
    setFormLocation('Bangalore / AWS Cloud');
    setFormTechStack('Next.js 14, Node.js, PostgreSQL');
    setFormTotalValue('');
    setFormAdvanceRequired('');
    setFormDueDate('');
    setFormStartDate(new Date().toISOString().split('T')[0]);
    setFormStatus('PLANNING');
    setFormDescription('');
    setFormLeadName('Alex Rivera (Lead Architect)');
  };

  const handleImportFromUnconverted = (key: string) => {
    if (!key) return;
    if (key.startsWith('quote-')) {
      const qId = key.replace('quote-', '');
      const quote = quotations.find((q: any) => q.id === qId);
      if (quote) {
        const matchedClient = clients.find(c =>
          c.businessName.toLowerCase() === quote.clientBusiness.toLowerCase()
        );
        if (matchedClient) setFormClientId(matchedClient.id);
        setFormTitle(`${quote.clientBusiness} - Software Deliverables Execution`);
        setFormTotalValue(String(quote.totalAmount));
        setFormAdvanceRequired(String(Math.round(quote.totalAmount * 0.4)));
        setFormDescription(`Imported from Quotation ${quote.quotationNumber}. Client Contact: ${quote.clientContact} (${quote.clientPhone}). Deliverables: ${quote.lineItems ? quote.lineItems.map((i: any) => i.description).join(', ') : 'Agreed milestones'}. Terms: ${quote.paymentTerms}.`);
      }
    } else if (key.startsWith('lead-')) {
      const lId = key.replace('lead-', '');
      const lead = leads.find((l: any) => l.id === lId);
      if (lead) {
        const matchedClient = clients.find(c =>
          (lead.clientId && c.id === lead.clientId) ||
          c.businessName.toLowerCase() === lead.businessName.toLowerCase()
        );
        if (matchedClient) setFormClientId(matchedClient.id);
        const svcTitle = lead.servicesInterested && lead.servicesInterested.length > 0
          ? lead.servicesInterested[0].replace(/_/g, ' ')
          : (lead.serviceType ? lead.serviceType.replace(/_/g, ' ') : 'Project Execution');
        setFormTitle(`${lead.businessName} - ${svcTitle}`);
        setFormCategory(lead.businessCategory || 'AI & FULL-STACK WEB');
        setFormTotalValue(String(lead.estimatedDealValue || 0));
        setFormAdvanceRequired(String(Math.round((lead.estimatedDealValue || 0) * 0.4)));
        setFormDescription(`Created from Won Lead: ${lead.businessName}. Contact: ${lead.leadName} (${lead.whatsappNumber}). Scope: ${lead.servicesInterested ? lead.servicesInterested.join(', ') : lead.serviceType}.`);
        const svcStr = (lead.serviceInterested || lead.serviceType || '').toLowerCase();
        let domain: 'SOFTWARE' | 'WEB' | 'AI' | 'MARKETING' = 'SOFTWARE';
        if (svcStr.includes('web') || svcStr.includes('shopify') || svcStr.includes('portal')) domain = 'WEB';
        else if (svcStr.includes('ai') || svcStr.includes('automation') || svcStr.includes('bot')) domain = 'AI';
        else if (svcStr.includes('social') || svcStr.includes('marketing') || svcStr.includes('ad')) domain = 'MARKETING';
        setFormDomain(domain);
      }
    }
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (proj: Project) => {
    setEditingProject(proj);
    setFormTitle(proj.title);
    setFormClientId(proj.clientId);
    setFormDomain((proj.domain as any) || 'SOFTWARE');
    setFormCategory(proj.category || 'AI & FULL-STACK WEB');
    setFormLocation(proj.location || 'Bangalore / AWS Cloud');
    setFormTechStack(proj.techStack || '');
    setFormTotalValue(String(proj.totalValue));
    setFormAdvanceRequired(String(proj.advanceRequired || Math.round(proj.totalValue * 0.4)));
    setFormDueDate(proj.dueDate || '');
    setFormStartDate(proj.startDate || '');
    setFormStatus(proj.status || 'PLANNING');
    setFormDescription(proj.description || '');
    setFormLeadName(proj.assignedLeadName || 'Alex Rivera (Lead Architect)');
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formClientId || !formTotalValue) {
      alert('Please fill in Project Title, Client, and Contract Value');
      return;
    }

    try {
      if (editingProject) {
        const res = await fetch('/api/projects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingProject.id,
            title: formTitle,
            clientId: formClientId,
            domain: formDomain,
            category: formCategory,
            location: formLocation,
            techStack: formTechStack,
            totalValue: Number(formTotalValue),
            advanceRequired: Number(formAdvanceRequired),
            dueDate: formDueDate,
            startDate: formStartDate,
            status: formStatus,
            description: formDescription,
            assignedLeadName: formLeadName
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Project "${formTitle}" updated successfully.`);
          setEditingProject(null);
          await loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
          setTimeout(() => setToastMessage(null), 4000);
        }
      } else {
        const res = await fetch('/api/projects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formTitle,
            clientId: formClientId,
            domain: formDomain,
            category: formCategory,
            location: formLocation,
            techStack: formTechStack,
            totalValue: Number(formTotalValue),
            advanceRequired: Number(formAdvanceRequired),
            dueDate: formDueDate,
            startDate: formStartDate,
            status: formStatus,
            description: formDescription,
            assignedLeadName: formLeadName
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`🚀 New IT Project "${formTitle}" created successfully!`);
          setShowCreateModal(false);
          await loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
          setTimeout(() => setToastMessage(null), 4000);
        }
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save project');
    }
  };

  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.businessName || !clientForm.contactName || !clientForm.whatsappNumber) {
      alert('Please fill in Business Name, Contact Name, and WhatsApp Number.');
      return;
    }

    setSavingClient(true);
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm)
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🎉 Client "${clientForm.businessName}" created successfully!`);
        setShowClientModal(false);
        setClientForm({
          businessName: '',
          contactName: '',
          whatsappNumber: '',
          email: '',
          city: 'Bangalore',
          address: 'Indiranagar, Bangalore, Karnataka',
          clientType: 'ONE_TIME_PROJECT',
          monthlyRetainerAmount: ''
        });
        await loadData();
        setFormClientId(data.data.id);
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to create client');
      }
    } catch (err) {
      console.error(err);
      alert('Error creating client');
    } finally {
      setSavingClient(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!deletingProject) return;
    try {
      const res = await fetch(`/api/projects?id=${deletingProject.id}&deletedBy=${encodeURIComponent(currentStaff?.name || 'Owner / Admin')}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ Project "${deletingProject.title}" moved to Recycle Bin.`);
        setDeletingProject(null);
        if (openProject?.id === deletingProject.id) {
          setOpenProject(null);
        }
        await loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // WhatsApp Dispatch Helper for Daily Standup Report
  const handleOpenDirectorReportModal = (proj: Project) => {
    const cash = proj.cashCollected || 0;
    const bank = proj.bankCollected || 0;
    const totalCollected = cash + bank;
    const expenses = proj.expensesTotal || 0;
    const netProfit = (proj.budget || proj.totalValue) - expenses;

    const message =
      `📊 *Executive IT Project Standup: ${proj.title}*\n` +
      `📌 *Code:* ${proj.code || 'PRJ-2026-001'}\n` +
      `🏢 *Client:* ${proj.clientName || 'Arun'}\n` +
      `☁️ *Infra/Stack:* ${proj.techStack || 'Next.js 14, Node.js, AWS Cloud'}\n` +
      `📅 *Sprint Timeline:* ${proj.startDate || '18 Nov 2026'} to ${proj.dueDate || '16 Feb 2027'}\n\n` +
      `💰 *Financial Health & Profitability:*\n` +
      `• Contract Total: ${formatINR(proj.totalValue)}\n` +
      `• Approved Dev Budget: ${formatINR(proj.budget || proj.totalValue)}\n` +
      `• Collections Cleared: ${formatINR(totalCollected)} (In Cash: ${formatINR(cash)} | In Bank: ${formatINR(bank)})\n` +
      `• Balance Receivable: ${formatINR(proj.balanceDue)}\n` +
      `• Cloud & Infra Costs: ${formatINR(expenses)}\n` +
      `• Realized Net Profit: ${formatINR(netProfit)} (+100% Margin)\n` +
      `• Sprint Dev Progress: ${proj.progressPercent || 0}%\n\n` +
      `⚙️ *Status:* ${(proj.status || 'ACTIVE').replace(/_/g, ' ')}\n` +
      `Reported by: ${currentStaff?.name || 'Managing Director'} (Nearlook / Nearlook IT Enterprise)`;

    setWhatsappModal({
      isOpen: true,
      type: 'DIRECTOR_REPORT',
      title: 'Daily Standup to Director (WhatsApp / PDF)',
      phone: '+919876543201',
      message
    });
  };

  // WhatsApp Dispatch Helper for Client Sprint Update
  const handleOpenClientUpdateModal = (proj: Project) => {
    const client = clients.find(c => c.id === proj.clientId);
    const phone = proj.clientPhone || client?.whatsappNumber || '+919845099887';
    const totalCollected = (proj.cashCollected || 0) + (proj.bankCollected || 0);

    const message =
      `Hello ${proj.clientName || 'Client'}! 👋\n\n` +
      `Here is the latest verified engineering sprint update for your project *${proj.title}* (${proj.code || 'PRJ-2026-001'}):\n\n` +
      `💻 *Stack & Cloud:* ${proj.techStack || 'Next.js 14, Node.js, Cloud APIs'}\n` +
      `📈 *Sprint Progress:* ${proj.progressPercent || 0}% Completed\n` +
      `💵 *Payment Cleared:* ${formatINR(totalCollected)} of ${formatINR(proj.totalValue)}\n` +
      `📌 *Remaining Balance:* ${formatINR(proj.balanceDue)}\n` +
      `🎯 *Current Status:* ${(proj.status || 'ACTIVE').replace(/_/g, ' ')}\n\n` +
      `Our engineering team is actively delivering milestone commits per the agreed SOW schedule. Thank you for partnering with Nearlook Mart / Nearlook!\n\n` +
      `Best regards,\n` +
      `Nearlook Mart Pvt Ltd / Nearlook Engineering Operations`;

    setWhatsappModal({
      isOpen: true,
      type: 'CLIENT_UPDATE',
      title: 'Share Client Sprint Update (WhatsApp)',
      phone,
      message
    });
  };

  // Record Split Payment (Cash vs Bank)
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openProject || !paymentForm.amount) return;

    try {
      const amt = Number(paymentForm.amount);
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: openProject.id,
          amount: amt,
          paymentMethod: paymentForm.paymentMethod,
          milestoneLabel: paymentForm.milestoneLabel,
          referenceId: paymentForm.referenceId || `TXN-${Date.now().toString().slice(-6)}`,
          notes: paymentForm.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`💰 Split Payment of ${formatINR(amt)} (${paymentForm.paymentMethod}) recorded!`);
        setShowRecordPaymentModal(false);
        setPaymentForm({
          amount: '',
          paymentMethod: 'Bank Transfer / NEFT',
          referenceId: '',
          milestoneLabel: 'Split Payment Installment',
          notes: 'Payment verified and credited'
        });
        await loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (err) {
      console.error(err);
      alert('Error recording payment');
    }
  };

  // Add Deliverable / SOW Line to Project
  const handleAddDeliverable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openProject || !deliverableForm.title || !deliverableForm.amount) return;

    try {
      const currentMilestones = openProject.milestones || [];
      const newMilestone = {
        id: `ms-${Date.now()}`,
        title: deliverableForm.title,
        deliverable: deliverableForm.deliverable || 'Software engineering deliverable',
        amount: Number(deliverableForm.amount),
        status: 'PENDING' as const
      };

      const updatedMilestones = [...currentMilestones, newMilestone];
      const res = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: openProject.id,
          milestones: updatedMilestones
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(`📋 SOW deliverable "${deliverableForm.title}" added!`);
        setShowAddDeliverableModal(false);
        setDeliverableForm({ title: '', deliverable: '', amount: '' });
        await loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Error adding deliverable');
    }
  };

  // Add Task to Project (Syncs with Calendar)
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!openProject || !taskForm.title) return;

    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[${openProject.code || 'PRJ'}] ${taskForm.title}`,
          description: `Engineering task for ${openProject.title}`,
          projectId: openProject.id,
          clientId: openProject.clientId,
          dueDate: taskForm.dueDate,
          priority: taskForm.priority,
          assignedStaffId: 'staff-acc',
          serviceCategory: 'SOFTWARE_DEV'
        })
      });

      const data = await res.json();
      if (data.success) {
        setToastMessage(`✅ Engineering task scheduled in Calendar checklist!`);
        setShowAddTaskModal(false);
        setTaskForm({
          title: '',
          dueDate: new Date().toISOString().split('T')[0],
          priority: 'MEDIUM'
        });
        await loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      alert('Error creating task');
    }
  };

  // Filter projects for Master Directory
  const filtered = projects.filter(p => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.clientName && p.clientName.toLowerCase().includes(search.toLowerCase())) ||
      (p.code && p.code.toLowerCase().includes(search.toLowerCase())) ||
      (p.location && p.location.toLowerCase().includes(search.toLowerCase())) ||
      (p.techStack && p.techStack.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
      case 'PLANNING': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'UAT_REVIEW': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'ON_HOLD': return 'bg-rose-100 text-rose-800 border-rose-300';
      default: return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Software & IT Projects Directory...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DETAILED PROJECT WORKSPACE (IMAGE 2 LAYOUT - ADAPTED FOR IT CRM)
  // When openProject is active
  // =========================================================================
  if (openProject) {
    const cash = openProject.cashCollected || 0;
    const bank = openProject.bankCollected || 0;
    const totalCollected = cash + bank;
    const totalContract = openProject.totalValue || 0;
    const internalGst = openProject.gstAmount !== undefined && openProject.gstAmount > 0
      ? openProject.gstAmount
      : Math.round((totalContract * 18) / 118);
    const budget = openProject.budget && openProject.budget < totalContract
      ? openProject.budget
      : Math.max(0, totalContract - internalGst);
    const directExpenses = openProject.expensesTotal || 0;
    const overallExpenses = directExpenses + internalGst;
    const netProfit = Math.max(0, totalContract - overallExpenses);
    const netMargin = totalContract > 0 ? Math.round((netProfit / totalContract) * 100) : 100;
    const gst = internalGst;
    const expenses = overallExpenses;
    const progress = openProject.progressPercent || 0;

    // Filter receipts, invoices, and tasks safely
    const safeReceipts = Array.isArray(receipts) ? receipts : [];
    const safeInvoices = Array.isArray(invoices) ? invoices : [];
    const safeTasks = Array.isArray(tasks) ? tasks : [];
    const projectReceipts = safeReceipts.filter(r => r && (r.projectId === openProject.id || (r.clientName && openProject.clientName && r.clientName.toLowerCase() === openProject.clientName.toLowerCase())));
    const projectInvoices = safeInvoices.filter(inv => inv && (inv.projectId === openProject.id || (inv.clientName && openProject.clientName && inv.clientName.toLowerCase() === openProject.clientName.toLowerCase())));
    const projectTasks = safeTasks.filter(t => t && (t.projectId === openProject.id || (t.title && openProject.code && t.title.includes(openProject.code))));
    const projectMilestones = Array.isArray(openProject.milestones) ? openProject.milestones : [];

    return (
      <div className="space-y-5 pb-16 animate-fadeIn">
        {/* Top Action Bar (IT Adaptation of Image 2) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Back button */}
          <button
            onClick={handleBackToProjects}
            className="flex items-center space-x-1.5 text-slate-700 hover:text-slate-950 font-bold text-xs bg-white hover:bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm transition self-start"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>← Back to Projects</span>
          </button>

          {/* Right Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('SPRINT')}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Sprint Resources / Dev Timesheets ↗</span>
            </button>

            <button
              onClick={() => handleOpenDirectorReportModal(openProject)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Daily Standup to Director (WhatsApp / PDF)</span>
            </button>

            <button
              onClick={() => handleOpenClientUpdateModal(openProject)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Share Client Sprint Update (WhatsApp)</span>
            </button>

            <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full text-xs shadow-sm">
              Status: {(openProject.status || 'ACTIVE').replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        {/* Project Header Card with 6 Horizontal KPI Stat Boxes */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            {/* Left: Code, Title, Client, Cloud Location, Dates */}
            <div className="space-y-1.5 max-w-xl">
              <div className="flex items-center space-x-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {openProject.code || 'PRJ-2026-001'}
                </span>
                {openProject.recoveredFrom && (
                  <span className="text-[10px] text-emerald-600 font-semibold px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    Recovered from {openProject.recoveredFrom}
                  </span>
                )}
                <span className="text-slate-400 text-xs font-bold">•</span>
                <span className="text-amber-600 font-extrabold text-xs tracking-wider uppercase">
                  {openProject.category || 'AI & FULL-STACK WEB'}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                {openProject.title}
              </h1>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-0.5">
                <div className="flex items-center space-x-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Client: <strong className="text-slate-800 font-bold">{openProject.clientName}</strong></span>
                </div>
                <div className="flex items-center space-x-1">
                  <Cloud className="w-3.5 h-3.5 text-blue-500" />
                  <span>{openProject.location || 'Bangalore / Cloud Infrastructure'}</span>
                </div>
                <div className="flex items-center space-x-1 font-mono text-slate-600">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{openProject.startDate || '18 Nov 2026'} to {openProject.dueDate || '16 Feb 2027'}</span>
                </div>
              </div>
            </div>

            {/* Right: 6 KPI Stat Boxes in a Row */}
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5 w-full lg:w-auto">
              {/* 1. Contract Value */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center min-w-[105px]">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Contract Value</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">{formatLakhs(totalContract)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Agreed SOW Total</span>
              </div>

              {/* 2. GST (Govt Tax) */}
              <div className="bg-amber-50/50 border border-amber-200/70 rounded-xl p-2.5 text-center min-w-[105px]">
                <span className="text-[10px] font-bold text-amber-800 block uppercase">GST (18% Govt)</span>
                <span className="text-sm font-black text-amber-950 block mt-0.5">{formatLakhs(internalGst)}</span>
                <span className="text-[9px] text-amber-700/80 block mt-0.5">Statutory Tax</span>
              </div>

              {/* 3. Approved Budget */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-center min-w-[105px]">
                <span className="text-[10px] font-bold text-slate-500 block uppercase">Approved Budget</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">{formatLakhs(budget)}</span>
                <span className="text-[9px] text-slate-400 block mt-0.5">Net Scope Budget</span>
              </div>

              {/* 4. Overall Expenses */}
              <div className="bg-rose-50/40 border border-rose-200/60 rounded-xl p-2.5 text-center min-w-[105px]">
                <span className="text-[10px] font-bold text-rose-700 block uppercase">Overall Expenses</span>
                <span className="text-sm font-black text-rose-900 block mt-0.5">{formatLakhs(overallExpenses)}</span>
                <span className="text-[9px] text-rose-500 block mt-0.5">Direct + 18% Tax</span>
              </div>

              {/* 5. Realized Net Profit */}
              <div className="bg-emerald-50/50 border border-emerald-200/70 rounded-xl p-2.5 text-center min-w-[105px]">
                <span className="text-[10px] font-bold text-emerald-800 block uppercase">Realized Net Profit</span>
                <span className="text-sm font-black text-emerald-600 block mt-0.5">{formatLakhs(netProfit)}</span>
                <span className="text-[9px] text-emerald-700 font-bold block mt-0.5">(+{netMargin}%)</span>
              </div>

              {/* 6. Sprint / Dev Progress */}
              <div className="bg-blue-50/40 border border-blue-200/60 rounded-xl p-2.5 text-center min-w-[105px]">
                <span className="text-[10px] font-bold text-blue-700 block uppercase">Sprint Progress</span>
                <span className="text-sm font-black text-slate-900 block mt-0.5">{progress}%</span>
                <span className="text-[9px] text-blue-500 block mt-0.5">Completion</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tab Pills (IT CRM Parity) */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${activeTab === 'OVERVIEW'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
          >
            Project Overview
          </button>

          <button
            onClick={() => setActiveTab('SOW')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${activeTab === 'SOW'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
          >
            <span>Scope Deliverables (SOW)</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {projectMilestones.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('TASKS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${activeTab === 'TASKS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
          >
            <span>Sprint Tasks & Milestones</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {projectTasks.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('INVOICES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${activeTab === 'INVOICES'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
          >
            <span>Client Invoices & Milestone Bills</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">
              {projectInvoices.length || (openProject.billedAmount > 0 ? 1 : 0)}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('EXPENSES')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${activeTab === 'EXPENSES'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
          >
            <span>Cloud Costs & API Expenses</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">0</span>
          </button>

          <button
            onClick={() => setActiveTab('DOCS')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${activeTab === 'DOCS'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
          >
            <span>Architecture & SOW Documents</span>
            <span className="bg-slate-100 text-slate-700 text-[10px] px-1.5 py-0.2 rounded-full">0</span>
          </button>

          <button
            onClick={() => setActiveTab('SPRINT')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Developer Timesheets (0) ↗</span>
          </button>
        </div>

        {/* 2-Column Content Layout (Image 2 Structure) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left Column (8 cols): Hero Dark Card & Tab Contents */}
          <div className="lg:col-span-8 space-y-5">
            {/* Dark Navy Hero Card: "Project Financial Health & Realized Profit" */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 text-white shadow-xl">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base tracking-tight text-white">
                      Project Financial Health & Realized Profit
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Approved engineering budget (excl. GST) vs. overall cloud infrastructure & developer expenses incurred
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    NET PROFIT MARGIN
                  </span>
                  <span className="text-base font-black font-mono text-emerald-400 block">
                    +{netMargin}%
                  </span>
                </div>
              </div>

              {/* 4 Top KPI Metrics inside dark card */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-slate-800/80">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">CONTRACT TOTAL</span>
                  <p className="text-base font-black text-white font-mono mt-0.5">{formatINR(totalContract)}</p>
                  <span className="text-[10px] text-slate-400">Agreed SOW (incl. Tax)</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">GST (18% GOVT TAX)</span>
                  <p className="text-base font-black text-amber-400 font-mono mt-0.5">{formatINR(internalGst)}</p>
                  <span className="text-[10px] text-slate-400">Statutory Tax Liability</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">APPROVED BUDGET</span>
                  <p className="text-base font-black text-white font-mono mt-0.5">{formatINR(budget)}</p>
                  <span className="text-[10px] text-slate-400">Net Dev Scope Subtotal</span>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">NET PROFIT</span>
                  <p className="text-base font-black text-emerald-400 font-mono mt-0.5">{formatINR(netProfit)}</p>
                  <span className="text-[10px] text-slate-400">Contract - Overall Expenses</span>
                </div>
              </div>

              {/* 3 Middle Sub-Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
                {/* Card 1: Billed Revenue */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-300 font-semibold block">Billed Revenue</span>
                  <p className="text-lg font-black text-white font-mono mt-1">{formatINR(totalCollected)}</p>
                  <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                    ✓ Collections Cleared
                  </span>
                </div>

                {/* Card 2: Overall Expenses */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-300 font-semibold block">Overall Expenses</span>
                  <p className="text-lg font-black text-white font-mono mt-1">{formatINR(overallExpenses)}</p>
                  <span className="text-[11px] text-slate-400 font-medium block mt-1">
                    Direct: {formatINR(directExpenses)} + 18% Tax: {formatINR(internalGst)}
                  </span>
                </div>

                {/* Card 3: Realized Net Profit */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-xs text-slate-300 font-semibold block">Realized Net Profit</span>
                  <p className="text-lg font-black text-emerald-400 font-mono mt-1">{formatINR(netProfit)}</p>
                  <span className="text-[11px] text-emerald-400 font-bold block mt-1">
                    +{netMargin}% Net Margin
                  </span>
                </div>
              </div>

              {/* Bottom Footer: Collections Split (Cash vs Bank) */}
              <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-slate-300 font-medium">Cash Collected:</span>
                  <span className="text-emerald-400 font-black font-mono">{formatINR(cash)}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="text-slate-300 font-medium">Bank / Account Collected:</span>
                  <span className="text-blue-400 font-black font-mono">{formatINR(bank)}</span>
                </div>

                <button
                  onClick={() => setShowRecordPaymentModal(true)}
                  className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] rounded-lg transition self-start sm:self-auto shadow-sm"
                >
                  + Record Split Receipt
                </button>
              </div>
            </div>

            {/* TAB CONTENTS */}
            {activeTab === 'OVERVIEW' && (
              <div className="space-y-5">
                {/* Scope of Work Deliverables (SOW) Summary Box */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-amber-500" />
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Scope Deliverables & Engineering Milestones (SOW)
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowAddDeliverableModal(true)}
                      className="text-xs font-bold text-amber-600 hover:text-amber-700 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200 transition"
                    >
                      + Add SOW Line
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {projectMilestones.map((ms, idx) => (
                      <div
                        key={ms.id || idx}
                        className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-900">{ms.title}</span>
                            <span
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${ms.status === 'COMPLETED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : ms.status === 'IN_PROGRESS'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-slate-200 text-slate-700'
                                }`}
                            >
                              {ms.status}
                            </span>
                          </div>
                          {ms.deliverable && (
                            <p className="text-[11px] text-slate-500">{ms.deliverable}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-black text-xs text-slate-900">
                            {formatINR(ms.amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Split Payments & Client Milestone Invoices Ledger */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center space-x-2">
                      <Receipt className="w-4 h-4 text-emerald-500" />
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Client Invoices & Split Payments Ledger
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowRecordPaymentModal(true)}
                      className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                    >
                      + Add Payment Receipt
                    </button>
                  </div>

                  {projectReceipts.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      No payment receipts logged yet.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projectReceipts.map((rcp, idx) => (
                        <div
                          key={rcp.id || idx}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                                {rcp.receiptNumber}
                              </span>
                              <span className="font-semibold text-slate-900">{rcp.milestoneLabel}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {rcp.paymentMethod} • Ref: {rcp.referenceId || 'N/A'} • {rcp.createdAt ? new Date(rcp.createdAt).toLocaleDateString('en-IN') : 'Recent'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-black text-emerald-600 text-xs">
                              {formatINR(rcp.amount)}
                            </span>
                            <span className="block text-[9px] text-emerald-700 font-bold">✓ Cleared</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sprint Tasks & Engineering Checklist */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500" />
                      <h4 className="font-extrabold text-sm text-slate-900">
                        Sprint Tasks & Engineering Checklist
                      </h4>
                    </div>
                    <button
                      onClick={() => setShowAddTaskModal(true)}
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition"
                    >
                      + Add Task (Syncs to Calendar)
                    </button>
                  </div>

                  {projectTasks.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400">
                      No active tasks logged for this project. Tasks added here will auto-sync with the Google-style Calendar checklist.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projectTasks.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-slate-400">
                              {t.status === 'COMPLETED' ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </span>
                            <span className={`font-semibold ${t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                              {t.title}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono">
                            <span>Due: {t.dueDate}</span>
                            <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                              {t.priority}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SOW TAB */}
            {activeTab === 'SOW' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Statement of Work (SOW) Deliverables</h3>
                  <button
                    onClick={() => setShowAddDeliverableModal(true)}
                    className="text-xs font-bold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition"
                  >
                    + Add SOW Milestone
                  </button>
                </div>
                <div className="space-y-3">
                  {projectMilestones.map((ms, idx) => (
                    <div key={ms.id || idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-mono text-[10px] font-bold text-slate-500 block mb-1">MILESTONE #{idx + 1}</span>
                        <h4 className="font-bold text-sm text-slate-900">{ms.title}</h4>
                        <p className="text-xs text-slate-500 mt-1">{ms.deliverable || 'Engineering deliverable'}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-slate-900 font-mono block">{formatINR(ms.amount)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${ms.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
                          }`}>
                          {ms.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'TASKS' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Engineering Sprint Tasks & Issue Backlog</h3>
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="text-xs font-bold px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition"
                  >
                    + New Sprint Task
                  </button>
                </div>
                {projectTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No tasks created yet. Click "+ New Sprint Task" to schedule.</p>
                ) : (
                  <div className="space-y-2">
                    {projectTasks.map((t) => (
                      <div key={t.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800">{t.title}</span>
                        <span className="font-mono text-slate-500">Target: {t.dueDate}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'INVOICES' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Client Invoices & Milestone Bills</h3>
                  <button
                    onClick={() => setShowRecordPaymentModal(true)}
                    className="text-xs font-bold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition"
                  >
                    + Record Milestone Payment
                  </button>
                </div>
                <div className="space-y-3">
                  {projectReceipts.map((r) => (
                    <div key={r.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-slate-700">{r.receiptNumber}</span>
                        <p className="font-semibold text-slate-900">{r.milestoneLabel}</p>
                        <p className="text-[10px] text-slate-500">{r.paymentMethod} • Ref: {r.referenceId}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-emerald-600 text-sm font-mono">{formatINR(r.amount)}</span>
                        <span className="block text-[10px] text-emerald-700 font-bold">Cleared</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EXPENSES TAB */}
            {activeTab === 'EXPENSES' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Cloud Infrastructure, Servers & API Costs</h3>
                  <span className="text-xs text-slate-400">Total: {formatINR(expenses)}</span>
                </div>
                <p className="text-xs text-slate-500">
                  Cloud server hosting (AWS/Vercel), LLM token quotas (OpenAI/Claude), third-party SaaS subscriptions, and domain certificates allocated to this project.
                </p>
              </div>
            )}

            {/* SPRINT / DEV TIMESHEETS TAB */}
            {activeTab === 'SPRINT' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Developer Timesheets & Sprint Capacity</h3>
                  <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold">Active Sprint</span>
                </div>
                <p className="text-xs text-slate-500">
                  Specialist hours, commit history, pull request status, and developer timesheets for {openProject.title}.
                </p>
              </div>
            )}

            {/* DOCS TAB */}
            {activeTab === 'DOCS' && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-extrabold text-base text-slate-900">Architecture Specs & GitHub Repositories</h3>
                </div>
                <p className="text-xs text-slate-500">
                  SRS documents, OpenAPI schemas, Figma wireframes, CI/CD pipeline configs, and cloud hosting credentials.
                </p>
              </div>
            )}
          </div>

          {/* Right Column (4 cols): Team & Contributors, Contract Terms */}
          <div className="lg:col-span-4 space-y-5">
            {/* Card 1: Team & Contributors */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-slate-600" />
                  <h4 className="font-extrabold text-sm text-slate-900">Team & Contributors</h4>
                </div>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                  0 active
                </span>
              </div>

              {/* Sub-section: Developer & Design Workforce */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 mb-2">
                  <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] text-amber-800">
                    <Cpu className="w-3.5 h-3.5" />
                    DEVELOPER & DESIGN WORKFORCE
                  </span>
                  <span className="text-slate-400 text-[10px]">0 Active Engineers</span>
                </div>
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  No developer timesheets or commits logged for this sprint yet.
                </p>
              </div>

              {/* Action Button: View Sprint Allocations */}
              <button
                onClick={() => setActiveTab('SPRINT')}
                className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-sm transition mb-5"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>View Sprint Allocations & Dev Timesheets →</span>
              </button>

              {/* Sub-section: Cloud & Software Vendors */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                  <span className="flex items-center gap-1 uppercase tracking-wider text-[10px] text-blue-800">
                    <Cloud className="w-3.5 h-3.5 text-blue-600" />
                    CLOUD & SOFTWARE VENDORS
                  </span>
                  <span className="text-slate-400 text-[10px]">0 Vendors</span>
                </div>
                <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  No cloud infrastructure subscriptions (AWS, OpenAI, Vercel) linked yet.
                </p>
              </div>
            </div>

            {/* Card 2: Contract & Billing Terms */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                <FileText className="w-4 h-4 text-slate-600" />
                <h4 className="font-extrabold text-sm text-slate-900">Contract & Engineering Terms</h4>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Payment Milestones:</span>
                  <span className="font-bold text-slate-800">50% Initial / 30% Milestone / 20% Delivery</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Delayed Late Fee:</span>
                  <span className="font-bold text-rose-600">2% / Week Delayed</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">GST & Tax Status:</span>
                  <span className="font-bold text-slate-800">No GST (0%)</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Target Go-Live:</span>
                  <span className="font-mono font-bold text-slate-800">{openProject.dueDate || '16 Feb 2027'}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-slate-500 font-medium">Post-Launch Warranty:</span>
                  <span className="font-bold text-emerald-700">90 Days Bug SLA</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modals for Detailed View */}
        {showRecordPaymentModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
                <h3 className="font-black text-base text-slate-900">Record Milestone Payment Receipt</h3>
                <button
                  onClick={() => setShowRecordPaymentModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleRecordPayment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="overflow-y-auto flex-1 p-6 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Receipt Amount (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 100000"
                      value={paymentForm.amount}
                      onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method / Channel *</label>
                    <select
                      value={paymentForm.paymentMethod}
                      onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="Bank Transfer / NEFT">Bank Transfer / NEFT (Credited to Bank)</option>
                      <option value="UPI / Google Pay">UPI / Google Pay (Credited to Bank)</option>
                      <option value="Cash in Hand">Cash in Hand (Petty Cash)</option>
                      <option value="Cheque Deposit">Cheque Deposit (Bank Clearing)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC-NEFT-9921004"
                      value={paymentForm.referenceId}
                      onChange={(e) => setPaymentForm({ ...paymentForm, referenceId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Milestone Description</label>
                    <input
                      type="text"
                      value={paymentForm.milestoneLabel}
                      onChange={(e) => setPaymentForm({ ...paymentForm, milestoneLabel: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowRecordPaymentModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm"
                  >
                    Save & Update Collections
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Scope Deliverable Modal */}
        {showAddDeliverableModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
                <h3 className="font-black text-base text-slate-900">Add SOW Deliverable Milestone</h3>
                <button
                  onClick={() => setShowAddDeliverableModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddDeliverable} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="overflow-y-auto flex-1 p-6 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Deliverable Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Core API Integrations & AI Workflow"
                      value={deliverableForm.title}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Scope & Architecture Details</label>
                    <textarea
                      rows={2}
                      placeholder="FastAPI endpoints, LangChain LLM orchestration, etc."
                      value={deliverableForm.deliverable}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, deliverable: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Allocated Budget (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 160000"
                      value={deliverableForm.amount}
                      onChange={(e) => setDeliverableForm({ ...deliverableForm, amount: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddDeliverableModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm"
                  >
                    Add SOW Line
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Task Modal */}
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
                <h3 className="font-black text-base text-slate-900">Add Sprint Task & Calendar Sync</h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddTask} className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <div className="overflow-y-auto flex-1 p-6 space-y-3.5 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sprint Task Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Implement webhook listener for WhatsApp conversational agent"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Target Due Date</label>
                      <input
                        type="date"
                        value={taskForm.dueDate}
                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Priority</label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value as any })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                    📅 This sprint task will automatically appear on your Google-style Calendar checklist!
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-sm"
                  >
                    Schedule Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* WhatsApp Share / Report Modal */}
        {whatsappModal?.isOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <h3 className="font-black text-base text-slate-900">{whatsappModal.title}</h3>
                </div>
                <button
                  onClick={() => setWhatsappModal(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-3 text-xs">
                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Recipient WhatsApp Number</span>
                  <input
                    type="text"
                    value={whatsappModal.phone}
                    onChange={(e) => setWhatsappModal({ ...whatsappModal, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Formatted Message</span>
                  <textarea
                    rows={8}
                    value={whatsappModal.message}
                    onChange={(e) => setWhatsappModal({ ...whatsappModal, message: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(whatsappModal.message);
                    alert('Message copied to clipboard!');
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setWhatsappModal(null)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                  >
                    Close
                  </button>
                  <a
                    href={`https://wa.me/${(whatsappModal.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappModal.message || '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Open WhatsApp Web ↗</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: MASTER PROJECTS DIRECTORY (IT COMPANY ADAPTATION)
  // When openProject is null
  // =========================================================================
  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Enterprise Top Header (Matching Reference Layout for IT & Engineering) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Software & IT Projects
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
              IT Enterprise
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Master directory of client software delivery contracts, SaaS engineering, cloud infrastructure budgets, and sprint milestones.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto">
          <button
            onClick={() => setShowClientModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition border border-slate-300 shadow-sm"
          >
            <UserPlus className="w-4 h-4 text-slate-600" />
            <span>+ Add New Client</span>
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Create New Project</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by code, project title, client, or tech stack..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PLANNING">Planning</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="UAT_REVIEW">UAT Review</option>
            <option value="COMPLETED">Completed</option>
            <option value="ON_HOLD">On Hold</option>
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('GRID')}
              title="Cards Grid View"
              className={`p-1.5 rounded-md transition ${viewMode === 'GRID' ? 'bg-white shadow-sm text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('TABLE')}
              title="List Table View"
              className={`p-1.5 rounded-md transition ${viewMode === 'TABLE' ? 'bg-white shadow-sm text-amber-600 font-bold' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects 3-Column Card Grid (Matching Image 1 Visual Structure) */}
      {filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-500">
          <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold">No IT projects found</p>
          <p className="text-xs text-slate-400 mt-1">Try modifying your search or status filter.</p>
        </div>
      ) : viewMode === 'GRID' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((proj) => {
            const cash = proj.cashCollected || 0;
            const bank = proj.bankCollected || 0;
            const totalCollected = cash + bank;
            const progress = proj.progressPercent !== undefined ? proj.progressPercent : (proj.status === 'COMPLETED' ? 100 : 0);

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group hover:border-amber-300"
              >
                <div className="p-5">
                  {/* Top Line: Project Code & Status */}
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {proj.code || 'PRJ-2026-001'}
                      </span>
                      {proj.recoveredFrom && (
                        <span className="block text-[10px] text-emerald-600 font-sans font-semibold mt-0.5">
                          Recovered from {proj.recoveredFrom}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full border ${getStatusBadge(proj.status)}`}>
                      {(proj.status || 'ACTIVE').replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-extrabold text-slate-900 mt-3 group-hover:text-amber-600 transition line-clamp-1">
                    {proj.title}
                  </h3>

                  {/* Client */}
                  <p className="text-xs text-slate-600 mt-0.5">
                    Client: <span className="font-semibold text-slate-800">{proj.clientName}</span>
                  </p>

                  {/* Cloud / Location & Tech Stack */}
                  <div className="flex items-center space-x-1 text-xs text-slate-400 mt-1">
                    <Cloud className="w-3.5 h-3.5 text-blue-500" />
                    <span>{proj.location || 'Bangalore / Cloud'}</span>
                    {proj.techStack && (
                      <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]" title={proj.techStack}>
                        • {proj.techStack}
                      </span>
                    )}
                  </div>

                  {/* Financials 4-Metric Grid: Contract Value, GST (18%), Approved Budget & Net Profit */}
                  {(() => {
                    const cardContract = proj.totalValue || 0;
                    const cardGst = proj.gstAmount !== undefined && proj.gstAmount > 0
                      ? proj.gstAmount
                      : Math.round((cardContract * 18) / 118);
                    const cardBudget = proj.budget && proj.budget < cardContract
                      ? proj.budget
                      : Math.max(0, cardContract - cardGst);
                    const cardExpenses = (proj.expensesTotal || 0) + cardGst;
                    const cardNetProfit = Math.max(0, cardContract - cardExpenses);

                    return (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 mt-4 pt-3 border-t border-slate-100 text-center">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Contract Value</span>
                          <p className="text-xs font-black text-slate-900 font-mono mt-0.5">{formatINR(cardContract)}</p>
                        </div>
                        <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-200/70">
                          <span className="text-[9px] uppercase font-bold text-amber-800 block truncate">GST (18% Govt)</span>
                          <p className="text-xs font-black text-amber-950 font-mono mt-0.5">{formatINR(cardGst)}</p>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200/60">
                          <span className="text-[9px] uppercase font-bold text-slate-500 block truncate">Approved Budget</span>
                          <p className="text-xs font-black text-slate-900 font-mono mt-0.5">{formatINR(cardBudget)}</p>
                        </div>
                        <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/70">
                          <span className="text-[9px] uppercase font-bold text-emerald-800 block truncate">Net Profit</span>
                          <p className="text-xs font-black text-emerald-600 font-mono mt-0.5">{formatINR(cardNetProfit)}</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* COLLECTIONS Box (Exact match to Image 1: In Cash vs In Bank) */}
                  <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl">
                    <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      <span>COLLECTIONS</span>
                      <span className="text-slate-900 font-black">TOTAL: {formatINR(totalCollected)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Left: In Cash */}
                      <div className="bg-emerald-50/70 border border-emerald-200/60 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                          <span className="text-[10px] font-bold text-emerald-900">In Cash:</span>
                        </div>
                        <span className="text-xs font-bold text-emerald-950 font-mono">
                          {formatINR(cash)}
                        </span>
                      </div>

                      {/* Right: In Bank */}
                      <div className="bg-blue-50/70 border border-blue-200/60 rounded-lg p-2 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"></span>
                          <span className="text-[10px] font-bold text-blue-900">In Bank:</span>
                        </div>
                        <span className="text-xs font-bold text-blue-950 font-mono">
                          {formatINR(bank)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar (Exact match to Image 1) */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-[10px] text-slate-400 font-medium">Sprint Dev Progress</span>
                      <span className="text-xs font-bold text-slate-800">{progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Dates Row */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-3 font-mono">
                    <div className="flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      <span>{proj.startDate || '18 Nov 2026'}</span>
                    </div>
                    <span className="text-slate-300">to</span>
                    <span>{proj.dueDate || '16 Feb 2027'}</span>
                  </div>
                </div>

                {/* Bottom Action Footer (Exact match to Image 1) */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Left: Director & Client quick share buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenDirectorReportModal(proj)}
                      className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-semibold flex items-center space-x-1 transition"
                      title="Send Daily Progress Standup to Director"
                    >
                      <Share2 className="w-3 h-3 text-amber-600" />
                      <span>Standup</span>
                    </button>

                    <button
                      onClick={() => handleOpenClientUpdateModal(proj)}
                      className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center space-x-1 transition"
                      title="Send Sprint Update to Client"
                    >
                      <Send className="w-3 h-3 text-teal-600" />
                      <span>Client</span>
                    </button>
                  </div>

                  {/* Right: Edit, Delete, and Open -> */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleOpenEditModal(proj)}
                      className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 transition"
                      title="Edit Project"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingProject(proj)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200/50 transition"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* OPEN -> Button (Switches to Image 2 Detailed Workspace) */}
                    <button
                      onClick={() => handleOpenProject(proj)}
                      className="text-amber-600 font-extrabold hover:text-amber-700 hover:bg-amber-50 px-2.5 py-1 rounded-lg text-xs flex items-center space-x-1 transition"
                    >
                      <span>Open</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Project Title</th>
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4 text-right">Contract Value</th>
                  <th className="py-3 px-4 text-right">GST (18%)</th>
                  <th className="py-3 px-4 text-right">Approved Budget</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-4 text-right">Collections</th>
                  <th className="py-3 px-4 text-center">Progress</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((proj) => {
                  const totalCollected = (proj.cashCollected || 0) + (proj.bankCollected || 0);
                  const progress = proj.progressPercent !== undefined ? proj.progressPercent : (proj.status === 'COMPLETED' ? 100 : 0);
                  const cardContract = proj.totalValue || 0;
                  const cardGst = proj.gstAmount !== undefined && proj.gstAmount > 0
                    ? proj.gstAmount
                    : Math.round((cardContract * 18) / 118);
                  const cardBudget = proj.budget && proj.budget < cardContract
                    ? proj.budget
                    : Math.max(0, cardContract - cardGst);
                  const cardExpenses = (proj.expensesTotal || 0) + cardGst;
                  const cardNetProfit = Math.max(0, cardContract - cardExpenses);

                  return (
                    <tr key={proj.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-600">
                        {proj.code || 'PRJ-2026-001'}
                        {proj.recoveredFrom && (
                          <span className="block text-[10px] text-emerald-600 font-sans font-semibold">
                            Recovered from {proj.recoveredFrom}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {proj.title}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 font-semibold">
                        {proj.clientName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-slate-900">
                        {formatINR(cardContract)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-amber-900">
                        {formatINR(cardGst)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-slate-800">
                        {formatINR(cardBudget)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-emerald-600">
                        {formatINR(cardNetProfit)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-black font-mono text-blue-600">
                        {formatINR(totalCollected)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                        {progress}%
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(proj.status)}`}>
                          {(proj.status || 'ACTIVE').replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenProject(proj)}
                          className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition"
                        >
                          Open →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {(showCreateModal || editingProject) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <h3 className="font-black text-lg text-slate-900">
                {editingProject ? 'Edit Client Project' : 'New Client Project'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProject(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
                {/* Won Lead / Quotation Quick Import Picker (Requirement 3) */}
                {!editingProject && (
                  <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        <FolderKanban className="w-4 h-4 text-amber-600" />
                        <span>Quick Import: Won Quotation or Lead (Optional)</span>
                      </label>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                        1-Click Pre-fill
                      </span>
                    </div>
                    <select
                      onChange={(e) => handleImportFromUnconverted(e.target.value)}
                      defaultValue=""
                      className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-2xs"
                    >
                      <option value="">-- Pick an Unconverted Won Quotation or Lead --</option>
                      {quotations.filter((q: any) => q.status === 'ACCEPTED' || q.status === 'SENT').map((q: any) => (
                        <option key={`quote-${q.id}`} value={`quote-${q.id}`}>
                          📄 Quotation: {q.quotationNumber} - {q.clientBusiness} ({formatINR(q.totalAmount)})
                        </option>
                      ))}
                      {leads.filter((l: any) => l.leadStage === 'WON').map((l: any) => (
                        <option key={`lead-${l.id}`} value={`lead-${l.id}`}>
                          🏆 Won Lead: {l.businessName} - {l.leadName} ({formatINR(l.estimatedDealValue)})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-amber-900/80 italic">
                      💡 Selecting a won proposal or lead automatically populates the client, project title, agreed contract value, advance milestones, and scope specifications.
                    </p>
                  </div>
                )}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Project Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun - AI Automation & Enterprise Web Platform"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client *</label>
                    <select
                      value={formClientId}
                      onChange={(e) => setFormClientId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.businessName} ({c.contactName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Cloud Hosting / Location *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Bangalore / AWS Cloud"
                      value={formLocation}
                      onChange={(e) => setFormLocation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category / Domain *</label>
                    <input
                      type="text"
                      placeholder="e.g. AI & FULL-STACK WEB / SAAS PLATFORM"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="PLANNING">PLANNING</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="UAT_REVIEW">UAT_REVIEW</option>
                      <option value="COMPLETED">COMPLETED</option>
                      <option value="ON_HOLD">ON_HOLD</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tech Stack & Infrastructure</label>
                  <input
                    type="text"
                    placeholder="e.g. Next.js 14, Node.js, PostgreSQL, OpenAI API, Redis"
                    value={formTechStack}
                    onChange={(e) => setFormTechStack(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Total SOW Contract Value (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 410650"
                      value={formTotalValue}
                      onChange={(e) => setFormTotalValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Payment Expected (₹ INR)</label>
                    <input
                      type="number"
                      placeholder="e.g. 200000"
                      value={formAdvanceRequired}
                      onChange={(e) => setFormAdvanceRequired(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Start Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 18 Nov 2026"
                      value={formStartDate}
                      onChange={(e) => setFormStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Target Production Go-Live</label>
                    <input
                      type="text"
                      placeholder="e.g. 16 Feb 2027"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statement of Work (SOW) Scope & Architecture</label>
                  <textarea
                    rows={3}
                    placeholder="System requirements, cloud microservices, API integrations, deliverable milestones..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Client Modal */}
      {showClientModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <h3 className="font-black text-lg text-slate-900">+ Add New Enterprise Client</h3>
              <button
                onClick={() => setShowClientModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveClient} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company / Entity Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Enterprises & Tech"
                    value={clientForm.businessName}
                    onChange={(e) => setClientForm({ ...clientForm, businessName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Contact Person Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun"
                    value={clientForm.contactName}
                    onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">WhatsApp Number *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98450 99887"
                      value={clientForm.whatsappNumber}
                      onChange={(e) => setClientForm({ ...clientForm, whatsappNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Location / City</label>
                    <input
                      type="text"
                      placeholder="Bangalore"
                      value={clientForm.city}
                      onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowClientModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingClient}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-md shadow-amber-500/20"
                >
                  {savingClient ? 'Saving...' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProject && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-black text-base text-slate-900">Delete Project?</h3>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Are you sure you want to move <strong>"{deletingProject.title}"</strong> to the Recycle Bin?
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => setDeletingProject(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Share / Report Modal (Master Directory) */}
      {whatsappModal?.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <h3 className="font-black text-base text-slate-900">{whatsappModal.title}</h3>
              </div>
              <button
                onClick={() => setWhatsappModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 border border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-3 text-xs">
              <div>
                <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Recipient WhatsApp Number</span>
                <input
                  type="text"
                  value={whatsappModal.phone}
                  onChange={(e) => setWhatsappModal({ ...whatsappModal, phone: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <span className="font-bold text-slate-500 text-[10px] uppercase block mb-1">Formatted Message</span>
                <textarea
                  rows={8}
                  value={whatsappModal.message}
                  onChange={(e) => setWhatsappModal({ ...whatsappModal, message: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(whatsappModal.message);
                  alert('Message copied to clipboard!');
                }}
                className="flex items-center space-x-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Text</span>
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setWhatsappModal(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Close
                </button>
                <a
                  href={`https://wa.me/${(whatsappModal.phone || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(whatsappModal.message || '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-md transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp Web ↗</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
