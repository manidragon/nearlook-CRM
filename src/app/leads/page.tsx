'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Plus,
  MessageSquare,
  TrendingUp,
  Send,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  Filter,
  Search,
  Building,
  Phone,
  Mail,
  UserCheck,
  Check,
  Sparkles,
  Lock,
  FileSpreadsheet,
  FileText,
  ShieldAlert,
  AlertCircle,
  Pencil,
  Trash2,
  Globe,
  Target,
  BarChart3,
  PieChart,
  MessageCircle,
  Instagram,
  Linkedin,
  Youtube,
  Building2,
  ChevronDown,
  ChevronUp,
  Award,
  Layers,
  UserPlus,
  Calendar,
  CalendarDays,
  CalendarClock,
  Clock,
  MapPin,
  Eye,
  AlertTriangle,
  X
} from 'lucide-react';
import { Lead, StaffMember, LeadStage, ServiceType, AgencyService, StaffTeam, ConsultationNote, LeadSource, Project, Quotation } from '@/lib/types';
import { getWhatsAppDirectUrl } from '@/lib/whatsappService';
import { useAuth } from '@/lib/AuthContext';

const LEAD_SOURCES: {
  key: LeadSource;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  border: string;
  barColor: string;
  badgeBg: string;
}[] = [
    { key: 'WORD_OF_MOUTH', label: 'Word of Mouth', icon: MessageCircle, color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-200', barColor: 'bg-amber-500', badgeBg: 'bg-amber-100 text-amber-800' },
    { key: 'CLIENT_REFERRAL', label: 'Client Referral', icon: Users, color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-200', barColor: 'bg-emerald-500', badgeBg: 'bg-emerald-100 text-emerald-800' },
    { key: 'GOOGLE_SEARCH', label: 'Google Search (SEO)', icon: Search, color: 'text-blue-800', bg: 'bg-blue-50', border: 'border-blue-200', barColor: 'bg-blue-500', badgeBg: 'bg-blue-100 text-blue-800' },
    { key: 'GOOGLE_ADS', label: 'Google Ads (PPC)', icon: Target, color: 'text-indigo-800', bg: 'bg-indigo-50', border: 'border-indigo-200', barColor: 'bg-indigo-500', badgeBg: 'bg-indigo-100 text-indigo-800' },
    { key: 'WEBSITE', label: 'Agency Website / Direct', icon: Globe, color: 'text-teal-800', bg: 'bg-teal-50', border: 'border-teal-200', barColor: 'bg-teal-500', badgeBg: 'bg-teal-100 text-teal-800' },
    { key: 'SOCIAL_MEDIA_INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'text-pink-800', bg: 'bg-pink-50', border: 'border-pink-200', barColor: 'bg-pink-500', badgeBg: 'bg-pink-100 text-pink-800' },
    { key: 'SOCIAL_MEDIA_LINKEDIN', label: 'LinkedIn Outreach', icon: Linkedin, color: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-200', barColor: 'bg-sky-500', badgeBg: 'bg-sky-100 text-sky-800' },
    { key: 'SOCIAL_MEDIA_YOUTUBE', label: 'YouTube Content', icon: Youtube, color: 'text-red-800', bg: 'bg-red-50', border: 'border-red-200', barColor: 'bg-red-500', badgeBg: 'bg-red-100 text-red-800' },
    { key: 'COLD_OUTREACH', label: 'Cold Email / WhatsApp', icon: Mail, color: 'text-violet-800', bg: 'bg-violet-50', border: 'border-violet-200', barColor: 'bg-violet-500', badgeBg: 'bg-violet-100 text-violet-800' },
    { key: 'NETWORKING_EVENTS', label: 'Events / Networking', icon: Building2, color: 'text-purple-800', bg: 'bg-purple-50', border: 'border-purple-200', barColor: 'bg-purple-500', badgeBg: 'bg-purple-100 text-purple-800' },
    { key: 'OTHER', label: 'Other Channel', icon: Sparkles, color: 'text-slate-800', bg: 'bg-slate-50', border: 'border-slate-200', barColor: 'bg-slate-500', badgeBg: 'bg-slate-100 text-slate-800' }
  ];

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'NEW', label: 'New Lead', color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { key: 'CONTACTED', label: 'Contacted', color: 'border-blue-300 bg-blue-50 text-blue-700' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { key: 'NEGOTIATION', label: 'Negotiation', color: 'border-purple-300 bg-purple-50 text-purple-700' },
  { key: 'WON', label: 'Won (Client)', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { key: 'LOST', label: 'Closed / Lost', color: 'border-slate-300 bg-slate-50 text-slate-600' },
];

const DEFAULT_SERVICES: AgencyService[] = [
  { id: 'SOFTWARE_DEV', label: 'Software Development (Custom SaaS, Microservices)' },
  { id: 'WEB_DEV', label: 'Web Development (Next.js / Shopify / Full-Stack)' },
  { id: 'AI_AUTOMATION', label: 'AI Automation (LLMs, Voice Bots, Workflows)' },
  { id: 'SOCIAL_MEDIA', label: 'Social Media Marketing (Reels, Meta Ads, Influencers)' },
  { id: 'SEO', label: 'SEO & Organic Growth Engineering' },
  { id: 'BRANDING', label: 'Branding & UI/UX Product Design' },
  { id: 'FULL_SUITE', label: 'Full-Suite Enterprise Retainer' }
];

const TEAMS: { key: StaffTeam; label: string }[] = [
  { key: 'WEB_DEVELOPMENT', label: 'Engineering & Web Dev' },
  { key: 'MARKETING', label: 'Growth & Marketing' },
  { key: 'DESIGN', label: 'UI/UX & Creative' },
  { key: 'CONTENT', label: 'Content Strategy' },
  { key: 'ACCOUNTS', label: 'Accounts & Finance' },
  { key: 'FIELD_STAFF', label: 'Field Staff / Sales Reps' },
  { key: 'MANAGEMENT', label: 'Executive Management' }
];

const BUSINESS_CATEGORIES: { id: string; label: string }[] = [
  { id: 'RETAIL_ECOMMERCE', label: 'Retail & E-Commerce' },
  { id: 'HEALTHCARE_PHARMA', label: 'Healthcare & Pharma' },
  { id: 'REAL_ESTATE_CONSTRUCTION', label: 'Real Estate & Construction' },
  { id: 'EDUCATION_EDTECH', label: 'Education & EdTech' },
  { id: 'HOSPITALITY_FOOD', label: 'Hospitality, Food & Dining' },
  { id: 'MANUFACTURING_INDUSTRIAL', label: 'Manufacturing & Industrial' },
  { id: 'TECHNOLOGY_SAAS', label: 'Technology, IT & SaaS' },
  { id: 'FINANCE_LEGAL_CONSULTING', label: 'Finance, Banking & Consulting' },
  { id: 'MARKETING_MEDIA_ENTERTAINMENT', label: 'Media, PR & Entertainment' },
  { id: 'AUTOMOBILE_LOGISTICS', label: 'Automobile & Logistics' },
  { id: 'FASHION_LIFESTYLE', label: 'Fashion, Beauty & Lifestyle' },
  { id: 'PROFESSIONAL_SERVICES', label: 'Professional & Business Services' },
  { id: 'OTHER', label: 'Other Business Domain' }
];

export default function LeadsPage() {
  const { currentUser, canViewFinancials } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [services, setServices] = useState<AgencyService[]>(DEFAULT_SERVICES);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Consultation Notes Modal State (Phase 2)
  const [activeConsultationLead, setActiveConsultationLead] = useState<Lead | null>(null);
  const [consultationNotes, setConsultationNotes] = useState<ConsultationNote[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);

  // New Service Addition State
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [isSavingService, setIsSavingService] = useState(false);

  // Client Selection Mode for Form
  const [clientSelectionMode, setClientSelectionMode] = useState<'NEW' | 'EXISTING'>('NEW');

  // Form State (Phase 2 updates: assignedTeam, dynamic assignedStaff, Lead Source & Referral, Dates & Follow-ups, Multiple Services, Business Category & Address)
  const [formData, setFormData] = useState({
    clientId: '',
    leadName: '',
    businessName: '',
    businessCategory: 'Retail & E-Commerce',
    address: '',
    whatsappNumber: '',
    email: '',
    serviceType: 'WEB_DEV' as ServiceType,
    servicesInterested: ['WEB_DEV'] as string[],
    leadStage: 'NEW' as LeadStage,
    source: 'WORD_OF_MOUTH' as LeadSource,
    referrerName: '',
    estimatedDealValue: '',
    leadGeneratedDate: new Date().toISOString().split('T')[0],
    contactedDate: '',
    nextFollowUpDate: '',
    followUpNotes: '',
    notes: '',
    assignedTeam: 'WEB_DEVELOPMENT' as StaffTeam,
    assignedManagerId: ''
  });

  // Duplicate Client Detection State
  const [duplicateWarning, setDuplicateWarning] = useState<{
    client: any;
    reason: string;
    field: 'phone' | 'business' | 'email';
    isLead?: boolean;
  } | null>(null);

  const checkDuplicateClient = (phone: string, busName: string, emailStr?: string) => {
    const normPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const normBusName = busName ? busName.trim().toLowerCase() : '';
    const normEmail = emailStr ? emailStr.trim().toLowerCase() : '';

    if (!normPhone && !normBusName && !normEmail) return null;

    // 1. Check existing registered clients
    if (clients && clients.length > 0) {
      for (const c of clients) {
        const cPhone = (c.whatsappNumber || c.phone || '').replace(/\D/g, '').slice(-10);
        const cBusName = (c.businessName || '').trim().toLowerCase();
        const cEmail = (c.email || '').trim().toLowerCase();

        if (normPhone && normPhone.length >= 7 && cPhone && (cPhone === normPhone || cPhone.endsWith(normPhone) || normPhone.endsWith(cPhone))) {
          return { client: c, reason: `Phone Number (${c.whatsappNumber || c.phone})`, field: 'phone' as const, isLead: false };
        }
        if (normBusName && normBusName.length >= 3 && cBusName && (cBusName === normBusName || (normBusName.length >= 4 && cBusName.includes(normBusName)))) {
          return { client: c, reason: `Business Name ("${c.businessName}")`, field: 'business' as const, isLead: false };
        }
        if (normEmail && normEmail.length >= 5 && cEmail && cEmail === normEmail) {
          return { client: c, reason: `Email Address (${c.email})`, field: 'email' as const, isLead: false };
        }
      }
    }

    // 2. Check existing leads in pipeline
    if (leads && leads.length > 0) {
      for (const l of leads) {
        const lPhone = (l.whatsappNumber || '').replace(/\D/g, '').slice(-10);
        const lBusName = (l.businessName || '').trim().toLowerCase();
        const lEmail = (l.email || '').trim().toLowerCase();

        if (normPhone && normPhone.length >= 7 && lPhone && (lPhone === normPhone || lPhone.endsWith(normPhone) || normPhone.endsWith(lPhone))) {
          return { client: { id: l.id, businessName: l.businessName, contactName: l.leadName, whatsappNumber: l.whatsappNumber }, reason: `Existing Lead Phone (${l.whatsappNumber})`, field: 'phone' as const, isLead: true };
        }
        if (normBusName && normBusName.length >= 3 && lBusName && (lBusName === normBusName || (normBusName.length >= 4 && lBusName.includes(normBusName)))) {
          return { client: { id: l.id, businessName: l.businessName, contactName: l.leadName, whatsappNumber: l.whatsappNumber }, reason: `Existing Lead Business ("${l.businessName}")`, field: 'business' as const, isLead: true };
        }
        if (normEmail && normEmail.length >= 5 && lEmail && lEmail === normEmail) {
          return { client: { id: l.id, businessName: l.businessName, contactName: l.leadName, whatsappNumber: l.whatsappNumber }, reason: `Existing Lead Email (${l.email})`, field: 'email' as const, isLead: true };
        }
      }
    }

    return null;
  };

  // Edit Lead State
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [leadToConvert, setLeadToConvert] = useState<Lead | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [editFormData, setEditFormData] = useState({
    clientId: '',
    leadName: '',
    businessName: '',
    businessCategory: 'Retail & E-Commerce',
    address: '',
    whatsappNumber: '',
    email: '',
    serviceType: 'WEB_DEV' as ServiceType,
    servicesInterested: ['WEB_DEV'] as string[],
    leadStage: 'NEW' as LeadStage,
    source: 'WORD_OF_MOUTH' as LeadSource,
    referrerName: '',
    estimatedDealValue: '',
    leadGeneratedDate: '',
    contactedDate: '',
    nextFollowUpDate: '',
    followUpNotes: '',
    notes: '',
    assignedTeam: 'WEB_DEVELOPMENT' as StaffTeam,
    assignedManagerId: ''
  });

  // Analytics Modal State (separated from page flow so it doesn't push down the leads cards)
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);

  // Quick Follow-Up Modal State
  const [quickFollowUpLead, setQuickFollowUpLead] = useState<Lead | null>(null);
  const [quickFollowUpDate, setQuickFollowUpDate] = useState<string>('');
  const [quickFollowUpNotes, setQuickFollowUpNotes] = useState<string>('');
  const [isSavingFollowUp, setIsSavingFollowUp] = useState<boolean>(false);

  // WhatsApp Greeting Modal State (Nearlook Mart Pvt Ltd)
  const [greetingLead, setGreetingLead] = useState<Lead | null>(null);
  const [greetingMessage, setGreetingMessage] = useState<string>('');
  const [greetingAutoMarkContacted, setGreetingAutoMarkContacted] = useState<boolean>(true);
  const [isSendingGreeting, setIsSendingGreeting] = useState<boolean>(false);

  // Lead Details Popup Modal State
  const [selectedDetailLead, setSelectedDetailLead] = useState<Lead | null>(null);

  // Days Calculation Helper
  const getDaysCount = (fromDateStr?: string, toDateStr?: string) => {
    if (!fromDateStr) return 0;
    const fromDate = new Date(fromDateStr).getTime();
    const toDate = toDateStr ? new Date(toDateStr).getTime() : Date.now();
    const diff = Math.floor((toDate - fromDate) / (1000 * 60 * 60 * 24));
    return Math.max(0, diff);
  };

  const getServiceLabel = (serviceId: string) => {
    const found = services.find(s => s.id === serviceId);
    return found ? found.label : serviceId.replace(/_/g, ' ');
  };

  const formatServicesList = (serviceIds: string[] = []) => {
    if (!serviceIds || serviceIds.length === 0) return 'Software & Digital Solutions';
    const labels = serviceIds.map(id => getServiceLabel(id));
    if (labels.length === 1) return labels[0];
    return labels.slice(0, -1).join(', ') + ' & ' + labels[labels.length - 1];
  };

  const buildGreetingText = (lead: Lead) => {
    const svcList = lead.servicesInterested && lead.servicesInterested.length > 0
      ? lead.servicesInterested
      : [lead.serviceType || 'WEB_DEV'];
    const servicesText = formatServicesList(svcList);
    const specialist = lead.assignedManager?.name || 'our dedicated specialists';

    return `Dear ${lead.leadName},\n\nThank you for reaching out to *Nearlook Mart Pvt Ltd* regarding *${servicesText}* for *${lead.businessName}*! 🚀\n\nOur specialized team has received your inquiry and will be happy to assist you further with technical blueprints, deliverables, and customized strategies. One of our specialists (${specialist}) will connect with you shortly.\n\nIf you have any specific requirements, references, or documents to share in the meantime, please feel free to send them here.\n\nWarm regards,\n*Nearlook Mart Pvt Ltd*\nTechnology & Digital Solutions Division`;
  };

  const openGreetingModal = (lead: Lead) => {
    setGreetingLead(lead);
    setGreetingMessage(buildGreetingText(lead));
    setGreetingAutoMarkContacted(lead.leadStage === 'NEW');
  };

  const handleDispatchGreeting = async () => {
    if (!greetingLead) return;
    setIsSendingGreeting(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const cleanPhone = greetingLead.whatsappNumber.replace(/\D/g, '');
      const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greetingMessage)}`;

      // 1. Dispatch & log to WhatsApp API route
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: greetingLead.whatsappNumber,
          recipientName: `${greetingLead.leadName} (${greetingLead.businessName})`,
          recipientType: 'CLIENT',
          eventType: 'LEAD_WELCOME',
          message: greetingMessage
        })
      }).catch(() => null);

      // 2. Update Lead with greeting state & optionally transition to CONTACTED
      const patchData: Record<string, any> = {
        isGreetingSent: true,
        greetingSentAt: new Date().toISOString()
      };
      if (greetingAutoMarkContacted && greetingLead.leadStage === 'NEW') {
        patchData.leadStage = 'CONTACTED';
        patchData.contactedDate = greetingLead.contactedDate || todayStr;
      }

      const res = await fetch(`/api/leads/${greetingLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchData)
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === greetingLead.id ? data.data : l));
        setActionAlert(`✨ Nearlook Mart WhatsApp Greeting dispatched to ${greetingLead.leadName}!`);
        setTimeout(() => setActionAlert(null), 4000);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
      }

      // 3. Open WhatsApp Web or Mobile
      window.open(waUrl, '_blank');
      setGreetingLead(null);
    } catch (err) {
      console.error('Error dispatching greeting:', err);
      alert('Failed to dispatch greeting');
    } finally {
      setIsSendingGreeting(false);
    }
  };

  const toggleFormService = (serviceId: string) => {
    setFormData(prev => {
      const current = prev.servicesInterested || [];
      const exists = current.includes(serviceId);
      const updated = exists
        ? current.filter(id => id !== serviceId)
        : [...current, serviceId];
      const finalServices = updated.length > 0 ? updated : [serviceId];
      return {
        ...prev,
        servicesInterested: finalServices,
        serviceType: finalServices[0] as ServiceType
      };
    });
  };

  const toggleEditFormService = (serviceId: string) => {
    setEditFormData(prev => {
      const current = prev.servicesInterested || [];
      const exists = current.includes(serviceId);
      const updated = exists
        ? current.filter(id => id !== serviceId)
        : [...current, serviceId];
      const finalServices = updated.length > 0 ? updated : [serviceId];
      return {
        ...prev,
        servicesInterested: finalServices,
        serviceType: finalServices[0] as ServiceType
      };
    });
  };

  // Lead Acquisition Source Analytics & Filters
  const [selectedSource, setSelectedSource] = useState<string>('ALL');
  const [showSourceChart, setShowSourceChart] = useState<boolean>(true);
  const [chartMetricMode, setChartMetricMode] = useState<'COUNT' | 'VALUE'>('COUNT');

  const sourceAnalytics = React.useMemo(() => {
    const stats: Record<string, { count: number; totalValue: number; wonCount: number; wonValue: number; referrers: string[] }> = {};

    LEAD_SOURCES.forEach(s => {
      stats[s.key] = { count: 0, totalValue: 0, wonCount: 0, wonValue: 0, referrers: [] };
    });

    leads.forEach(l => {
      const srcKey = l.source || 'WORD_OF_MOUTH';
      if (!stats[srcKey]) {
        stats[srcKey] = { count: 0, totalValue: 0, wonCount: 0, wonValue: 0, referrers: [] };
      }
      stats[srcKey].count += 1;
      stats[srcKey].totalValue += (Number(l.estimatedDealValue) || 0);
      if (l.leadStage === 'WON') {
        stats[srcKey].wonCount += 1;
        stats[srcKey].wonValue += (Number(l.estimatedDealValue) || 0);
      }
      if (l.referrerName && !stats[srcKey].referrers.includes(l.referrerName)) {
        stats[srcKey].referrers.push(l.referrerName);
      }
    });

    const totalCount = leads.length;
    const totalPipeline = leads.reduce((sum, l) => sum + (Number(l.estimatedDealValue) || 0), 0);

    let topSourceByCount = { key: 'NONE', count: 0, label: 'None' };
    let topSourceByValue = { key: 'NONE', value: 0, label: 'None' };

    Object.entries(stats).forEach(([k, v]) => {
      const cfg = LEAD_SOURCES.find(s => s.key === k);
      if (v.count > topSourceByCount.count) {
        topSourceByCount = { key: k, count: v.count, label: cfg?.label || k };
      }
      if (v.totalValue > topSourceByValue.value) {
        topSourceByValue = { key: k, value: v.totalValue, label: cfg?.label || k };
      }
    });

    return {
      stats,
      totalCount,
      totalPipeline,
      topSourceByCount,
      topSourceByValue
    };
  }, [leads]);

  const fetchLeads = async () => {
    try {
      const [leadsRes, staffRes, servicesRes, clientsRes, projRes, quotesRes] = await Promise.all([
        fetch('/api/leads').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/services').then(r => r.json()).catch(() => ({ success: false })),
        fetch('/api/clients').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/projects').then(r => r.json()).catch(() => ({ success: false, data: [] })),
        fetch('/api/quotations').then(r => r.json()).catch(() => ({ success: false, data: [] }))
      ]);
      if (leadsRes.success) setLeads(leadsRes.data);
      if (staffRes.success) setStaff(staffRes.data);
      if (servicesRes.success && Array.isArray(servicesRes.data)) {
        setServices(servicesRes.data);
      }
      if (clientsRes?.success && Array.isArray(clientsRes.data)) {
        setClients(clientsRes.data);
      }
      if (projRes?.success && Array.isArray(projRes.data)) {
        setProjects(projRes.data);
      }
      if (quotesRes?.success && Array.isArray(quotesRes.data)) {
        setQuotations(quotesRes.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExistingClient = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setFormData(prev => ({
        ...prev,
        clientId: selectedClient.id,
        businessName: selectedClient.businessName,
        leadName: selectedClient.contactName,
        whatsappNumber: selectedClient.whatsappNumber,
        email: selectedClient.email || '',
        address: selectedClient.address || selectedClient.city || ''
      }));
    } else {
      setFormData(prev => ({ ...prev, clientId: '' }));
    }
  };

  const handleSelectExistingClientForEdit = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setEditFormData(prev => ({
        ...prev,
        clientId: selectedClient.id,
        businessName: selectedClient.businessName,
        leadName: selectedClient.contactName,
        whatsappNumber: selectedClient.whatsappNumber,
        email: selectedClient.email || '',
        address: selectedClient.address || selectedClient.city || ''
      }));
    } else {
      setEditFormData(prev => ({ ...prev, clientId: '' }));
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Real-time synchronization across CRM pages & AI Copilot
  useEffect(() => {
    const handleCrmUpdate = () => {
      fetchLeads();
    };
    window.addEventListener('crm-data-updated', handleCrmUpdate);
    return () => window.removeEventListener('crm-data-updated', handleCrmUpdate);
  }, []);

  // Keep details modal synchronized when leads data updates
  useEffect(() => {
    if (selectedDetailLead) {
      const updated = leads.find(l => l.id === selectedDetailLead.id);
      if (updated) setSelectedDetailLead(updated);
    }
  }, [leads]);

  const handleAddNewService = async () => {
    const trimmed = newServiceName.trim();
    if (!trimmed) return;
    setIsSavingService(true);
    try {
      const existing = services.find(s => s.label.toLowerCase() === trimmed.toLowerCase());
      if (existing) {
        setFormData(prev => ({
          ...prev,
          serviceType: existing.id,
          servicesInterested: Array.from(new Set([...(prev.servicesInterested || []), existing.id]))
        }));
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
      setFormData(prev => ({
        ...prev,
        serviceType: newSvc.id,
        servicesInterested: Array.from(new Set([...(prev.servicesInterested || []), newSvc.id]))
      }));

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
        setFormData(prev => ({
          ...prev,
          serviceType: data.data.id,
          servicesInterested: Array.from(new Set([...(prev.servicesInterested || []).filter(id => id !== newSvc.id), data.data.id]))
        }));
      }

      setActionAlert(`✨ New service "${trimmed}" added and selected!`);
      setTimeout(() => setActionAlert(null), 3500);
      setIsAddingService(false);
      setNewServiceName('');
    } catch (e) {
      console.error('Error adding service:', e);
    } finally {
      setIsSavingService(false);
    }
  };

  const handleStageChange = async (leadId: string, newStage: LeadStage) => {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadStage: newStage })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, leadStage: newStage } : l));
        setActionAlert(`Lead status moved to ${newStage.replace('_', ' ')}!`);
        setTimeout(() => setActionAlert(null), 3500);

        // When lead is won: Ask whether to add into active Projects automatically!
        if (newStage === 'WON') {
          const targetLead = leads.find(l => l.id === leadId);
          if (targetLead) {
            setLeadToConvert(targetLead);
            setShowConvertModal(true);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmConvertToProject = async () => {
    if (!leadToConvert) return;
    try {
      setIsConverting(true);
      let domain: 'SOFTWARE' | 'WEB' | 'AI' | 'MARKETING' = 'SOFTWARE';
      const svc = (leadToConvert.serviceInterested || leadToConvert.serviceType || '').toLowerCase();
      if (svc.includes('web') || svc.includes('shopify') || svc.includes('portal')) domain = 'WEB';
      else if (svc.includes('ai') || svc.includes('automation') || svc.includes('bot')) domain = 'AI';
      else if (svc.includes('social') || svc.includes('marketing') || svc.includes('ad')) domain = 'MARKETING';

      const totalVal = Number(leadToConvert.estimatedDealValue) || 150000;
      const budgetVal = Math.round(totalVal * 0.7);

      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${leadToConvert.businessName} - ${leadToConvert.serviceInterested || 'Digital Solution Deliverables'}`,
          clientName: leadToConvert.businessName,
          clientContact: leadToConvert.contactName,
          clientEmail: leadToConvert.email,
          clientPhone: leadToConvert.whatsappNumber,
          domain,
          techStack: domain === 'SOFTWARE' ? 'Next.js 14, Node.js, PostgreSQL' : domain === 'AI' ? 'Python, OpenAI API, LangChain' : domain === 'WEB' ? 'React, Next.js, Tailwind, Headless' : 'Meta Ads, Reels Production, Influencers',
          totalValue: totalVal,
          budget: budgetVal,
          advanceRequired: Math.round(totalVal * 0.4),
          startDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'IN_PROGRESS',
          description: `Converted from Won Lead: ${leadToConvert.businessName}. Contact: ${leadToConvert.contactName} (${leadToConvert.whatsappNumber}). Scope: ${leadToConvert.serviceInterested || 'Full Execution'}.`,
          assignedLeadName: leadToConvert.assignedStaffName || 'Alex Rivera (Tech Lead)',
          milestones: [
            { id: `m1-${Date.now()}`, title: 'Phase 1: Architecture, Wireframes & Technical Blueprint', amount: Math.round(totalVal * 0.3), status: 'PENDING' },
            { id: `m2-${Date.now()}`, title: 'Phase 2: Core Engineering, Integrations & Feature Development', amount: Math.round(totalVal * 0.4), status: 'PENDING' },
            { id: `m3-${Date.now()}`, title: 'Phase 3: QA Testing, Security Audit & Production Launch', amount: Math.round(totalVal * 0.3), status: 'PENDING' }
          ]
        })
      });

      const projData = await projRes.json();
      if (projData.success && projData.data) {
        setShowConvertModal(false);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        window.location.href = `/projects?viewProjectId=${projData.data.id}`;
      } else {
        alert(projData.error || 'Failed to convert project');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating project from lead');
    } finally {
      setIsConverting(false);
    }
  };

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const selectedSvcs = formData.servicesInterested && formData.servicesInterested.length > 0
        ? formData.servicesInterested
        : [formData.serviceType || 'WEB_DEV'];

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          serviceType: selectedSvcs[0] as ServiceType,
          servicesInterested: selectedSvcs,
          estimatedDealValue: formData.estimatedDealValue ? Number(formData.estimatedDealValue) : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => [data.data, ...prev]);
        setIsModalOpen(false);
        setClientSelectionMode('NEW');
        setFormData({
          clientId: '',
          leadName: '',
          businessName: '',
          businessCategory: 'Retail & E-Commerce',
          address: '',
          whatsappNumber: '',
          email: '',
          serviceType: 'WEB_DEV',
          servicesInterested: ['WEB_DEV'],
          leadStage: 'NEW',
          source: 'WORD_OF_MOUTH',
          referrerName: '',
          estimatedDealValue: '',
          leadGeneratedDate: new Date().toISOString().split('T')[0],
          contactedDate: '',
          nextFollowUpDate: '',
          followUpNotes: '',
          notes: '',
          assignedTeam: 'WEB_DEVELOPMENT',
          assignedManagerId: ''
        });
        setActionAlert(
          data.data.nextFollowUpDate
            ? `Lead created! Follow-up task auto-added to Google Calendar for ${data.data.nextFollowUpDate}.`
            : '✨ New lead registered! Click "Send WhatsApp Greeting" to send the Nearlook Mart welcome message.'
        );
        setTimeout(() => setActionAlert(null), 5000);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
      } else {
        alert(data.error || 'Failed to save lead');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving lead');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditModal = (lead: Lead) => {
    setEditingLead(lead);
    const existingSvcs = lead.servicesInterested && lead.servicesInterested.length > 0
      ? lead.servicesInterested
      : [lead.serviceType || 'WEB_DEV'];

    setEditFormData({
      clientId: (lead as any).clientId || '',
      leadName: lead.leadName,
      businessName: lead.businessName,
      businessCategory: lead.businessCategory || 'Retail & E-Commerce',
      address: lead.address || '',
      whatsappNumber: lead.whatsappNumber,
      email: lead.email || '',
      serviceType: lead.serviceType,
      servicesInterested: existingSvcs,
      leadStage: lead.leadStage,
      source: lead.source || 'WORD_OF_MOUTH',
      referrerName: lead.referrerName || '',
      estimatedDealValue: lead.estimatedDealValue ? String(lead.estimatedDealValue) : '',
      leadGeneratedDate: lead.leadGeneratedDate || (lead.createdAt ? lead.createdAt.split('T')[0] : new Date().toISOString().split('T')[0]),
      contactedDate: lead.contactedDate || '',
      nextFollowUpDate: lead.nextFollowUpDate || '',
      followUpNotes: lead.followUpNotes || '',
      notes: lead.notes || '',
      assignedTeam: lead.assignedTeam || 'WEB_DEVELOPMENT',
      assignedManagerId: lead.assignedManagerId || ''
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLead) return;
    setSubmitting(true);
    try {
      const selectedSvcs = editFormData.servicesInterested && editFormData.servicesInterested.length > 0
        ? editFormData.servicesInterested
        : [editFormData.serviceType || 'WEB_DEV'];

      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editFormData,
          serviceType: selectedSvcs[0] as ServiceType,
          servicesInterested: selectedSvcs,
          estimatedDealValue: editFormData.estimatedDealValue ? Number(editFormData.estimatedDealValue) : 0
        })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === editingLead.id ? data.data : l));
        setIsEditModalOpen(false);
        setEditingLead(null);
        setActionAlert(
          data.data.nextFollowUpDate
            ? `Lead updated! Follow-up synced to Google Calendar for ${data.data.nextFollowUpDate}.`
            : 'Lead updated successfully!'
        );
        setTimeout(() => setActionAlert(null), 3500);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
      } else {
        alert(data.error || 'Failed to update lead');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating lead');
    } finally {
      setSubmitting(false);
    }
  };

  const openQuickFollowUp = (lead: Lead) => {
    setQuickFollowUpLead(lead);
    setQuickFollowUpDate(lead.nextFollowUpDate || new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setQuickFollowUpNotes(lead.followUpNotes || '');
  };

  const handleSaveQuickFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickFollowUpLead) return;
    setIsSavingFollowUp(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const contactedDate = quickFollowUpLead.contactedDate || todayStr;
      const newStage = quickFollowUpLead.leadStage === 'NEW' ? 'CONTACTED' : quickFollowUpLead.leadStage;

      const res = await fetch(`/api/leads/${quickFollowUpLead.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nextFollowUpDate: quickFollowUpDate,
          followUpNotes: quickFollowUpNotes,
          contactedDate,
          leadStage: newStage
        })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l.id === quickFollowUpLead.id ? data.data : l));
        setActionAlert(`📅 Follow-up scheduled for ${quickFollowUpDate}! Auto-synced to Google Calendar checklist.`);
        setTimeout(() => setActionAlert(null), 4000);
        setQuickFollowUpLead(null);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
      } else {
        alert(data.error || 'Failed to schedule follow-up');
      }
    } catch (err) {
      console.error(err);
      alert('Error saving follow-up');
    } finally {
      setIsSavingFollowUp(false);
    }
  };

  const handleDeleteLead = async (lead: Lead) => {
    if (!confirm(`Are you sure you want to delete lead "${lead.businessName}"? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.filter(l => l.id !== lead.id));
        setActionAlert(`Lead "${lead.businessName}" deleted successfully.`);
        setTimeout(() => setActionAlert(null), 3500);
      } else {
        alert(data.error || 'Failed to delete lead');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting lead');
    }
  };

  const handleSendProposalWhatsApp = async (lead: Lead) => {
    const text = `🚀 Great news ${lead.leadName}! Your customized proposal for ${lead.businessName} (₹${lead.estimatedDealValue.toLocaleString('en-IN')}) has been compiled.\n\nReview proposal & scope here: http://localhost:3005/quotations?leadId=${lead.id}\n\nLet us know your availability for a 15-minute walkthrough!`;
    const waUrl = getWhatsAppDirectUrl(lead.whatsappNumber, text);

    try {
      await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.whatsappNumber,
          recipientName: `${lead.leadName} (${lead.businessName})`,
          recipientType: 'CLIENT',
          eventType: 'PROPOSAL_SENT',
          message: text
        })
      });
      handleStageChange(lead.id, 'PROPOSAL_SENT');
      setActionAlert(`Proposal triggered via WhatsApp Cloud API to ${lead.leadName}!`);
      setTimeout(() => setActionAlert(null), 3500);
      window.open(waUrl, '_blank');
    } catch (e) {
      console.error(e);
      window.open(waUrl, '_blank');
    }
  };

  // Open Consultation Notes (Phase 2 with RBAC check)
  const openConsultationNotes = async (lead: Lead) => {
    setActiveConsultationLead(lead);
    setLoadingNotes(true);
    try {
      const res = await fetch(`/api/leads/${lead.id}/consultation?staffId=${currentUser?.id || ''}&staffRole=${currentUser?.role || ''}`);
      const data = await res.json();
      if (data.success) {
        setConsultationNotes(data.notes || []);
      } else {
        setConsultationNotes([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingNotes(false);
    }
  };

  const handleAddConsultationNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !activeConsultationLead) return;

    setSavingNote(true);
    try {
      const res = await fetch(`/api/leads/${activeConsultationLead.id}/consultation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorId: currentUser?.id || 'staff-1',
          authorName: currentUser?.name || 'Authorized Staff',
          authorRole: currentUser?.role || 'ADMIN',
          text: newNoteText.trim()
        })
      });
      const data = await res.json();
      if (data.success && data.note) {
        setConsultationNotes(prev => [...prev, data.note]);
        setNewNoteText('');
      } else {
        alert(data.error || 'Access denied: You are not assigned to this lead.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingNote(false);
    }
  };

  // Check if current user is authorized to view/add consultation notes
  const isAuthorizedForConsultation = (lead: Lead) => {
    if (!currentUser) return false;
    if (currentUser.role === 'ADMIN' || currentUser.role === 'OWNER') return true;
    return lead.assignedManagerId === currentUser.id;
  };

  // Dynamic filter of staff based on selected team in modal
  const filteredStaffByTeam = staff.filter(s => s.team === formData.assignedTeam);

  const filteredLeads = leads.filter(l => {
    const matchesSearch =
      l.leadName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.whatsappNumber.includes(searchQuery) ||
      (l.referrerName && l.referrerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStage = selectedStage === 'ALL' || l.leadStage === selectedStage;
    const matchesSource = selectedSource === 'ALL' || (l.source || 'WORD_OF_MOUTH') === selectedSource;
    return matchesSearch && matchesStage && matchesSource;
  });

  const totalPipeline = leads
    .filter(l => l.leadStage !== 'LOST')
    .reduce((sum, l) => sum + l.estimatedDealValue, 0);

  const wonTotal = leads
    .filter(l => l.leadStage === 'WON')
    .reduce((sum, l) => sum + l.estimatedDealValue, 0);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-orange-600" />
            Lead Management & Dynamic Pipeline (₹ INR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Track lead generation, contact duration, scheduled follow-ups, origin attribution & 1-click quotations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => setIsAnalyticsModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-300 rounded-xl text-xs font-bold shadow-xs transition-all"
          >
            <BarChart3 className="w-4 h-4 text-orange-600" />
            <span>Lead Acquisition Sources & Origin Analytics</span>
            <span className="px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[10px] font-black">
              {leads.length}
            </span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Lead (+ Auto-WhatsApp)</span>
          </button>
        </div>
      </div>

      {/* Action Alert Banner */}
      {actionAlert && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Pipeline Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Pipeline Value</span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {canViewFinancials ? `₹${totalPipeline.toLocaleString('en-IN')}` : '₹••••••••'}
          </div>
          <span className="text-[11px] text-orange-600 font-bold">{leads.filter(l => l.leadStage !== 'LOST').length} live opportunities</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Converted (Won Clients)</span>
          <div className="mt-1 text-2xl font-black text-emerald-600">
            {canViewFinancials ? `₹${wonTotal.toLocaleString('en-IN')}` : '₹••••••••'}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">Successfully closed contracts</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Team Routing</span>
          <div className="mt-1 text-base font-bold text-slate-900 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Dynamic Staff Filter
          </div>
          <span className="text-[11px] text-slate-500 font-medium">Automatic lead allocation by department</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by lead name, business, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {/* Source Filter Dropdown */}
          <select
            value={selectedSource}
            onChange={e => setSelectedSource(e.target.value)}
            className="bg-slate-50 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Sources ({leads.length})</option>
            {LEAD_SOURCES.map(src => {
              const count = sourceAnalytics.stats[src.key]?.count || 0;
              return (
                <option key={src.key} value={src.key}>{src.label} ({count})</option>
              );
            })}
          </select>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedStage('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${selectedStage === 'ALL'
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
            >
              All Leads ({leads.length})
            </button>
            {STAGES.map(s => {
              const count = leads.filter(l => l.leadStage === s.key).length;
              return (
                <button
                  key={s.key}
                  onClick={() => setSelectedStage(s.key)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${selectedStage === s.key
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                >
                  {s.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leads Cards Grid - Compact Scannable Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.map((lead) => {
          const stageObj = STAGES.find(s => s.key === lead.leadStage) || STAGES[0];
          const waChatUrl = getWhatsAppDirectUrl(lead.whatsappNumber, `Hi ${lead.leadName}, following up regarding ${lead.businessName} with Nearlook Mart Pvt Ltd.`);
          const isTodayFollowUp = lead.nextFollowUpDate === new Date().toISOString().split('T')[0];

          // Match Project if already created for this lead (exact, client, title, or typo-tolerant)
          const norm = (str?: string) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
          const lBizNorm = norm(lead.businessName);
          const lNameNorm = norm(lead.leadName);

          const matchedProj = projects.find(p => {
            if (!p) return false;
            if ((p as any).leadId === lead.id) return true;
            if (lead.clientId && p.clientId === lead.clientId) return true;
            const pClientNorm = norm(p.clientName);
            const pTitleNorm = norm(p.title);
            if (lBizNorm && pClientNorm && (pClientNorm === lBizNorm || pClientNorm.includes(lBizNorm) || lBizNorm.includes(pClientNorm))) return true;
            if (lBizNorm && pTitleNorm && (pTitleNorm.includes(lBizNorm) || lBizNorm.includes(pTitleNorm))) return true;
            if (lNameNorm && pClientNorm && (pClientNorm === lNameNorm || pClientNorm.includes(lNameNorm) || lNameNorm.includes(pClientNorm))) return true;
            // Typo-tolerant: e.g. "kathikco" vs "karthikco"
            if (lBizNorm.length >= 5 && pClientNorm.length >= 5 && Math.abs(lBizNorm.length - pClientNorm.length) <= 2) {
              let diff = 0;
              const minLen = Math.min(lBizNorm.length, pClientNorm.length);
              for (let i = 0; i < minLen; i++) {
                if (lBizNorm[i] !== pClientNorm[i]) diff++;
              }
              if (diff <= 2) return true;
            }
            return false;
          });

          // Match Quotation if already created for this lead
          const matchedQuote = quotations.find(q => {
            if (!q) return false;
            if (q.leadId === lead.id) return true;
            const qBizNorm = norm(q.clientBusiness || (q as any).clientCompany);
            const qNameNorm = norm((q as any).clientName || (q as any).clientContact);
            if (lBizNorm && qBizNorm && (qBizNorm === lBizNorm || qBizNorm.includes(lBizNorm) || lBizNorm.includes(qBizNorm))) return true;
            if (lBizNorm && qNameNorm && (qNameNorm === lBizNorm || qNameNorm.includes(lBizNorm) || lBizNorm.includes(qNameNorm))) return true;
            if (lNameNorm && qNameNorm && (qNameNorm === lNameNorm || qNameNorm.includes(lNameNorm) || lNameNorm.includes(qNameNorm))) return true;
            // Typo-tolerant
            if (lBizNorm.length >= 5 && qBizNorm.length >= 5 && Math.abs(lBizNorm.length - qBizNorm.length) <= 2) {
              let diff = 0;
              const minLen = Math.min(lBizNorm.length, qBizNorm.length);
              for (let i = 0; i < minLen; i++) {
                if (lBizNorm[i] !== qBizNorm[i]) diff++;
              }
              if (diff <= 2) return true;
            }
            return false;
          });

          return (
            <div
              key={lead.id}
              className="bg-white border border-slate-200 hover:border-orange-400 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                {/* Top Row: Business Name, Quick Actions, and Deal Value */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black text-slate-900 truncate tracking-tight" title={lead.businessName}>
                        {lead.businessName}
                      </h3>
                      {/* Interactive Stage / Status Pop-down Selector */}
                      <select
                        value={lead.leadStage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border shrink-0 cursor-pointer focus:outline-none focus:ring-1 focus:ring-orange-400 ${stageObj.color}`}
                        title="Click to change live status directly"
                      >
                        {STAGES.map(s => (
                          <option key={s.key} value={s.key} className="bg-white text-slate-800 font-semibold">
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                      Contact: <span className="text-slate-800 font-bold">{lead.leadName}</span>
                    </p>
                  </div>

                  {/* Deal Value */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-slate-900">
                      {lead.estimatedDealValue
                        ? (canViewFinancials ? `₹${lead.estimatedDealValue.toLocaleString('en-IN')}` : 'Protected')
                        : 'TBD'}
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Deal Value</span>
                  </div>
                </div>

                {/* Middle Row: Next Follow-up & Assigned Staff */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  {/* Follow-up info */}
                  <div className="flex items-center gap-1.5 min-w-0">
                    <CalendarClock className={`w-3.5 h-3.5 shrink-0 ${isTodayFollowUp ? 'text-red-500 animate-pulse' : 'text-amber-500'}`} />
                    {lead.nextFollowUpDate ? (
                      <div className="flex items-center gap-1 truncate text-[11px]">
                        <span className="text-slate-500 font-medium">Follow-up:</span>
                        <span className={`font-bold ${isTodayFollowUp ? 'text-red-600' : 'text-slate-800'}`}>
                          {new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                        {isTodayFollowUp && (
                          <span className="px-1.5 py-0.2 bg-red-600 text-white rounded text-[8px] font-black uppercase">Today</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">No follow-up set</span>
                    )}
                    <button
                      type="button"
                      onClick={() => openQuickFollowUp(lead)}
                      className="ml-1 text-[10px] text-amber-700 hover:text-amber-900 font-bold underline cursor-pointer"
                      title="Reschedule follow-up date"
                    >
                      {lead.nextFollowUpDate ? 'Change' : '+ Set'}
                    </button>
                  </div>

                  {/* Assigned Staff */}
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px]" title={`Assigned: ${lead.assignedManager?.name || 'Unassigned'}`}>
                    <div className="w-5 h-5 rounded-full bg-orange-100 text-orange-700 font-black text-[10px] flex items-center justify-center border border-orange-200">
                      {(lead.assignedManager?.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <span className="text-slate-700 font-semibold max-w-[85px] truncate">
                      {lead.assignedManager?.name?.split(' ')[0] || 'Unassigned'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row: View Details + Quick Controls */}
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
                {/* Primary "View Details" Button */}
                <button
                  type="button"
                  onClick={() => setSelectedDetailLead(lead)}
                  className="flex-1 py-1.5 px-2.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-200 hover:border-orange-200 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-orange-600" />
                  <span>View Details</span>
                </button>

                {/* Project Status & Action */}
                {matchedProj ? (
                  <Link
                    href={`/projects?viewProjectId=${matchedProj.id}`}
                    className="py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[11px] font-black shadow-xs transition-all flex items-center justify-center gap-1 shrink-0"
                    title={`Project active: ${matchedProj.title}`}
                  >
                    <span>📁 Project Created</span>
                  </Link>
                ) : lead.leadStage === 'WON' ? (
                  <Link
                    href={`/projects?createFromLead=${lead.id}`}
                    className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-black shadow-xs transition-all flex items-center justify-center gap-1 shrink-0"
                    title="Directly Create Active Project"
                  >
                    <span>🚀 Create Project</span>
                  </Link>
                ) : null}

                {/* Quotation Status & Action (Edit if already exists, Create if new) */}
                {matchedQuote ? (
                  <Link
                    href={`/quotations?editId=${matchedQuote.id}`}
                    className="py-1 px-2 bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-300 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 shrink-0"
                    title={`Edit Existing Quotation (${matchedQuote.quotationNumber})`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Edit Quote</span>
                  </Link>
                ) : (
                  <Link
                    href={`/quotations?leadId=${lead.id}&leadName=${encodeURIComponent(lead.leadName)}&businessName=${encodeURIComponent(lead.businessName)}&phone=${encodeURIComponent(lead.whatsappNumber)}&dealValue=${lead.estimatedDealValue || 0}`}
                    className="p-1.5 rounded-xl bg-orange-50 hover:bg-orange-600 text-orange-600 hover:text-white border border-orange-200 transition-colors shrink-0"
                    title="Create Quotation"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </Link>
                )}

                {/* Quick WhatsApp */}
                <a
                  href={waChatUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white border border-emerald-200 transition-colors"
                  title="Direct WhatsApp Chat"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </a>

                {/* Quick Edit */}
                <button
                  onClick={() => openEditModal(lead)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
                  title="Edit Lead"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>

                {/* Quick Delete */}
                <button
                  onClick={() => handleDeleteLead(lead)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 transition-colors"
                  title="Delete Lead"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* "View Details" Popup Modal */}
      {selectedDetailLead && (() => {
        const lead = selectedDetailLead;
        const stageObj = STAGES.find(s => s.key === lead.leadStage) || STAGES[0];
        const sourceCfg = LEAD_SOURCES.find(s => s.key === (lead.source || 'WORD_OF_MOUTH'));
        const SourceIcon = sourceCfg?.icon || Globe;
        const authorizedForNotes = isAuthorizedForConsultation(lead);
        const genDateStr = lead.leadGeneratedDate || (lead.createdAt ? lead.createdAt.split('T')[0] : '');
        const daysSinceGen = genDateStr ? getDaysCount(genDateStr) : 0;
        const waChatUrl = getWhatsAppDirectUrl(lead.whatsappNumber, `Hi ${lead.leadName}, following up regarding ${lead.businessName} with Nearlook Mart Pvt Ltd.`);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 p-6 md:p-7 shadow-2xl relative my-6 text-slate-900 max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-100 shrink-0">
                <div className="pr-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full border ${stageObj.color}`}>
                      {stageObj.label}
                    </span>
                    {lead.businessCategory && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Building className="w-3 h-3 text-slate-500" />
                        {lead.businessCategory}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mt-1">
                    {lead.businessName}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Lead ID: <span className="font-mono text-slate-700">{lead.id}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <div className="text-lg md:text-xl font-black text-slate-900">
                      {lead.estimatedDealValue
                        ? (canViewFinancials ? `₹${lead.estimatedDealValue.toLocaleString('en-IN')}` : 'Protected')
                        : 'TBD'}
                    </div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated Value</span>
                  </div>
                  <button
                    onClick={() => setSelectedDetailLead(null)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto py-4 space-y-5 pr-1 text-xs">
                {/* Stage Progression & Timeline Tracker */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-700">Update Pipeline Stage:</span>
                      <select
                        value={lead.leadStage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value as LeadStage)}
                        className="bg-white text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        {STAGES.map(s => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Generated: <strong>{genDateStr ? new Date(genDateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent'}</strong></span>
                      <span>•</span>
                      <span className="text-orange-600 font-bold">{daysSinceGen === 0 ? 'Today' : `${daysSinceGen}d ago`}</span>
                    </div>
                  </div>

                  {/* Status Banner */}
                  <div className="mt-3">
                    {lead.leadStage === 'WON' ? (
                      <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-emerald-600" />
                          <span>
                            {lead.contactedDate
                              ? `Converted in ${getDaysCount(lead.contactedDate, lead.convertedDate)} days (from contact)`
                              : `Converted in ${getDaysCount(genDateStr, lead.convertedDate)} days`}
                          </span>
                        </span>
                        <span className="font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-md">
                          Won Deal
                        </span>
                      </div>
                    ) : lead.contactedDate ? (
                      <div className="px-3 py-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span>Following up for {getDaysCount(lead.contactedDate)} days</span>
                        </span>
                        <span className="text-blue-700 font-semibold">
                          First Contact: {new Date(lead.contactedDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                    ) : (
                      <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-amber-600" />
                          <span>New Inbound Lead - Pending First Contact</span>
                        </span>
                        <span className="text-amber-700 font-semibold">
                          {daysSinceGen === 0 ? 'New Today' : `${daysSinceGen}d in queue`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contact Information & Location */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="text-[11px] uppercase font-black text-slate-400 tracking-wider">Contact Details</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-slate-500">Contact Person:</span>
                        <strong className="text-slate-900 font-bold">{lead.leadName}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-slate-500">WhatsApp:</span>
                        <a href={waChatUrl} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-900 font-bold underline">
                          {lead.whatsappNumber}
                        </a>
                      </div>
                      {lead.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-slate-500">Email:</span>
                          <span className="text-slate-800 font-medium truncate">{lead.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="text-[11px] uppercase font-black text-slate-400 tracking-wider">Location & Assignment</h4>
                    <div className="space-y-1.5">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-slate-500">Address: </span>
                          <span className="text-slate-800 font-medium">{lead.address || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-slate-500">Assigned Specialist:</span>
                        <strong className="text-slate-900">{lead.assignedManager?.name || 'Unassigned'}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-slate-500">Assigned Team:</span>
                        <span className="text-slate-800 font-medium">{lead.assignedTeam ? lead.assignedTeam.replace('_', ' ') : 'Engineering & Web Dev'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selected Services & Requirements */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <h4 className="text-[11px] uppercase font-black text-slate-400 tracking-wider mb-2">Selected Services & Interests</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {(lead.servicesInterested && lead.servicesInterested.length > 0
                      ? lead.servicesInterested
                      : [lead.serviceType || 'WEB_DEV']
                    ).map(svcId => (
                      <span
                        key={svcId}
                        className="text-xs font-bold px-3 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200 inline-flex items-center gap-1.5"
                      >
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        <span>{getServiceLabel(svcId)}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Acquisition Source & Origin Attribution */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border ${sourceCfg?.bg || 'bg-slate-100'} ${sourceCfg?.border || 'border-slate-300'}`}>
                      <SourceIcon className={`w-4 h-4 ${sourceCfg?.color || 'text-slate-700'}`} />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Acquisition Source</div>
                      <div className="text-xs font-bold text-slate-800">{sourceCfg?.label || 'Direct Inbound'}</div>
                    </div>
                  </div>
                  {lead.referrerName && (
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 font-semibold block">Client Referrer</span>
                      <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {lead.referrerName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Scheduled Follow-up & Google Calendar Sync */}
                <div className="p-3.5 bg-amber-50/90 border border-amber-200 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                      <CalendarClock className="w-4 h-4 text-amber-600" />
                      {lead.nextFollowUpDate ? (
                        <span>
                          Next Follow-up: <strong>{new Date(lead.nextFollowUpDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                          {lead.nextFollowUpDate === new Date().toISOString().split('T')[0] && (
                            <span className="ml-2 px-2 py-0.5 bg-red-600 text-white rounded text-[10px] font-black uppercase">Today</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">No follow-up scheduled yet</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => openQuickFollowUp(lead)}
                      className="text-xs font-black text-amber-800 hover:text-amber-950 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-xl border border-amber-300 transition-all cursor-pointer"
                    >
                      {lead.nextFollowUpDate ? 'Reschedule' : 'Set Follow-up'}
                    </button>
                  </div>
                  {lead.followUpNotes && (
                    <p className="text-xs text-amber-800/90 mt-2 italic pl-6 border-l-2 border-amber-300">
                      &quot;{lead.followUpNotes}&quot;
                    </p>
                  )}
                  {lead.nextFollowUpDate && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold pl-6">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Synced to Google Calendar Checklist & Tasks</span>
                    </div>
                  )}
                </div>

                {/* Confidential Consultation Notes Section */}
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <FileText className="w-4 h-4 text-orange-600" />
                      <span>Consultation Notes (Confidential)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openConsultationNotes(lead)}
                      className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1 ${authorizedForNotes
                        ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                        : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                        }`}
                    >
                      {authorizedForNotes ? 'Open Notes Panel' : 'Restricted Notes'}
                      {!authorizedForNotes && <Lock className="w-3 h-3 text-slate-400" />}
                    </button>
                  </div>
                  {lead.notes ? (
                    <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-200 leading-relaxed line-clamp-3">
                      {lead.notes}
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No notes recorded yet. Click above to add confidential consultation notes.</p>
                  )}
                </div>

                {/* WhatsApp Greeting Dispatch */}
                {lead.isGreetingSent ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Nearlook Mart Greeting Sent ({lead.greetingSentAt ? new Date(lead.greetingSentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Logged'})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => openGreetingModal(lead)}
                      className="text-xs font-black text-emerald-700 hover:text-emerald-950 underline cursor-pointer"
                    >
                      Resend / Custom
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openGreetingModal(lead)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-200" />
                    <span>Send WhatsApp Greeting (Nearlook Mart Pvt Ltd)</span>
                  </button>
                )}
              </div>

              {/* Modal Footer Controls */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const l = lead;
                      setSelectedDetailLead(null);
                      openEditModal(l);
                    }}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Lead</span>
                  </button>
                  <button
                    onClick={() => {
                      const l = lead;
                      setSelectedDetailLead(null);
                      handleDeleteLead(l);
                    }}
                    className="py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={waChatUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition-colors flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Chat WhatsApp</span>
                  </a>

                  {lead.leadStage === 'WON' ? (
                    <Link
                      href={`/projects?createFromLead=${lead.id}`}
                      className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
                    >
                      <span>🚀 Create Project Now →</span>
                    </Link>
                  ) : (
                    <Link
                      href={`/quotations?leadId=${lead.id}&leadName=${encodeURIComponent(lead.leadName)}&businessName=${encodeURIComponent(lead.businessName)}&phone=${encodeURIComponent(lead.whatsappNumber)}&dealValue=${lead.estimatedDealValue || 0}`}
                      className="py-2 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Create Quotation</span>
                    </Link>
                  )}

                  <button
                    onClick={() => setSelectedDetailLead(null)}
                    className="py-2 px-4 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Consultation Notes Modal / Drawer (Phase 2 with RBAC shield) */}
      {activeConsultationLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-600" />
                  Consultation Notes
                </h2>
                <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                  Private client discussions for <strong className="text-slate-900">{activeConsultationLead.businessName}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveConsultationLead(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg font-bold transition-colors cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* RBAC Privacy Shield Check */}
              {!isAuthorizedForConsultation(activeConsultationLead) ? (
                <div className="my-4 p-5 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
                  <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto" />
                  <h3 className="font-bold text-amber-900 text-sm">Confidential Access Restricted</h3>
                  <p className="text-xs text-amber-800 leading-relaxed max-w-sm mx-auto">
                    Under Phase 2 RBAC policies, consultation notes are shielded. Only the assigned specialist (
                    <strong>{activeConsultationLead.assignedManager?.name || 'Assigned Lead'}</strong>) and Admin/Owner may view or record client consultation notes.
                  </p>
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500">
                      Logged in as: {currentUser?.name} ({currentUser?.role})
                    </span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Notes History */}
                  <div className="space-y-3">
                    {loadingNotes ? (
                      <div className="text-center py-6 text-xs text-slate-400">Loading private notes...</div>
                    ) : consultationNotes.length === 0 ? (
                      <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
                        No consultation notes recorded yet for this client.
                      </div>
                    ) : (
                      consultationNotes.map((note) => (
                        <div key={note.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-orange-700">{note.authorName} ({note.authorRole})</span>
                            <span className="text-slate-400">
                              {new Date(note.createdAt).toLocaleDateString()} {new Date(note.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-800 leading-relaxed whitespace-pre-wrap">{note.text}</p>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add New Note Form */}
                  <form onSubmit={handleAddConsultationNote} className="space-y-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-700 block">
                      Record New Consultation Note:
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Enter discussion points, client budget alignment, technical needs..."
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={savingNote || !newNoteText.trim()}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        {savingNote ? 'Saving...' : 'Add Note to Lead File'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setActiveConsultationLead(null)}
                className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lead Modal in White/Orange (Phase 2) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl relative max-h-[92vh] flex flex-col text-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Capture New Agency Lead
                  </h2>
                  <p className="text-xs text-slate-500">
                    Client contact, business category, address & inquired services.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="create-lead-form" onSubmit={handleCreateLead} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* SECTION 1: Client & Business Information */}
              <div className="p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
                  <h3 className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-orange-600" />
                    <span>1. Client & Business Details</span>
                  </h3>
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                    Primary Profile
                  </span>
                </div>

                {/* Client Selection Mode: New vs Existing Directory Client */}
                <div className="p-1 bg-white border border-orange-200 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setClientSelectionMode('NEW');
                      setFormData(prev => ({ ...prev, clientId: '' }));
                      setDuplicateWarning(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                      clientSelectionMode === 'NEW'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    + New Client Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientSelectionMode('EXISTING')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      clientSelectionMode === 'EXISTING'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Select Existing Client ({clients.length})</span>
                  </button>
                </div>

                {/* Existing Client Picker */}
                {clientSelectionMode === 'EXISTING' && (
                  <div className="p-3 bg-white border-2 border-orange-400/80 rounded-xl space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                        <span>Select Existing Client from Directory:</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                        Multi-Project Tracking Enabled
                      </span>
                    </div>
                    <select
                      value={formData.clientId}
                      onChange={(e) => handleSelectExistingClient(e.target.value)}
                      className="w-full bg-orange-50/70 border border-orange-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- Choose an Existing Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.businessName} (Contact: {c.contactName} • {c.whatsappNumber})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 italic pt-0.5">
                      ✓ Auto-populates client contact & address while allowing you to log a new, distinct project lead & quotation under their account.
                    </p>
                  </div>
                )}

                {/* Live Duplicate Client Warning Banner */}
                {duplicateWarning && clientSelectionMode === 'NEW' && (
                  <div className="p-3.5 bg-amber-50 border-2 border-amber-400 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn text-amber-950 shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-200/90 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <AlertTriangle className="w-4 h-4 text-amber-800" />
                      </div>
                      <div>
                        <div className="text-xs font-black flex items-center gap-2">
                          <span>⚠️ Client Already Exists in Directory!</span>
                          <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                            Matched by {duplicateWarning.reason}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1 leading-snug">
                          <strong>{duplicateWarning.client.businessName}</strong> (Contact: {duplicateWarning.client.contactName} • Phone: {duplicateWarning.client.whatsappNumber}) is already registered in your directory.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setClientSelectionMode('EXISTING');
                          handleSelectExistingClient(duplicateWarning.client.id);
                          setDuplicateWarning(null);
                        }}
                        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Link to Existing Client</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDuplicateWarning(null)}
                        className="p-1.5 text-amber-700 hover:bg-amber-200/60 rounded-lg text-xs cursor-pointer"
                        title="Dismiss warning"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Client / Contact Person Name</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Elena Rostova / Rajesh Kumar"
                      value={formData.leadName}
                      onChange={(e) => setFormData({ ...formData, leadName: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Business / Company Name</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Nearlook Mart / BioMed Innovations"
                      value={formData.businessName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, businessName: val });
                        if (clientSelectionMode === 'NEW') {
                          setDuplicateWarning(checkDuplicateClient(formData.whatsappNumber, val, formData.email));
                        }
                      }}
                      onBlur={() => {
                        if (clientSelectionMode === 'NEW') {
                          setDuplicateWarning(checkDuplicateClient(formData.whatsappNumber, formData.businessName, formData.email));
                        }
                      }}
                      className={`mt-1 w-full bg-white border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs ${
                        duplicateWarning && duplicateWarning.field === 'business' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-200'
                      }`}
                    />
                    {duplicateWarning && clientSelectionMode === 'NEW' && duplicateWarning.field === 'business' && (
                      <div className="mt-1 p-1.5 px-2 bg-amber-100/90 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          Matches registered client "{duplicateWarning.client.businessName}"
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setClientSelectionMode('EXISTING');
                            handleSelectExistingClient(duplicateWarning.client.id);
                            setDuplicateWarning(null);
                          }}
                          className="text-amber-950 underline text-[10px] ml-2 font-black cursor-pointer hover:text-orange-700"
                        >
                          Select Client →
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Business Category / Industry</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <select
                      value={formData.businessCategory}
                      onChange={(e) => setFormData({ ...formData, businessCategory: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    >
                      {BUSINESS_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      <span>Business Address / Location</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #42 MG Road, Anna Nagar, Chennai"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Phone</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={formData.whatsappNumber}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, whatsappNumber: val });
                        if (clientSelectionMode === 'NEW') {
                          setDuplicateWarning(checkDuplicateClient(val, formData.businessName, formData.email));
                        }
                      }}
                      onBlur={() => {
                        if (clientSelectionMode === 'NEW') {
                          setDuplicateWarning(checkDuplicateClient(formData.whatsappNumber, formData.businessName, formData.email));
                        }
                      }}
                      className={`mt-1 w-full bg-white border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs ${
                        duplicateWarning && duplicateWarning.field === 'phone' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-200'
                      }`}
                    />
                    {duplicateWarning && clientSelectionMode === 'NEW' && duplicateWarning.field === 'phone' && (
                      <div className="mt-1 p-1.5 px-2 bg-amber-100/90 border border-amber-300 rounded-lg text-[11px] font-bold text-amber-900 flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          Phone belongs to registered client "{duplicateWarning.client.businessName}"
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setClientSelectionMode('EXISTING');
                            handleSelectExistingClient(duplicateWarning.client.id);
                            setDuplicateWarning(null);
                          }}
                          className="text-amber-950 underline text-[10px] ml-2 font-black cursor-pointer hover:text-orange-700"
                        >
                          Select Client →
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      placeholder="contact@business.com"
                      value={formData.email}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, email: val });
                        if (clientSelectionMode === 'NEW') {
                          setDuplicateWarning(checkDuplicateClient(formData.whatsappNumber, formData.businessName, val));
                        }
                      }}
                      onBlur={() => {
                        if (clientSelectionMode === 'NEW') {
                          setDuplicateWarning(checkDuplicateClient(formData.whatsappNumber, formData.businessName, formData.email));
                        }
                      }}
                      className={`mt-1 w-full bg-white border rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs ${
                        duplicateWarning && duplicateWarning.field === 'email' ? 'border-amber-400 ring-1 ring-amber-400' : 'border-slate-200'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Agency Services Inquired (Multiple Selection Option) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-orange-600" />
                      <span>Services Inquired (Multiple Selection) *</span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      Select all services the client is approaching for. Included in Nearlook Mart greeting & quotations.
                    </p>
                  </div>

                  {!isAddingService && (
                    <button
                      type="button"
                      onClick={() => setIsAddingService(true)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-all cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Custom Service</span>
                    </button>
                  )}
                </div>

                {/* Inline Add Custom Service Form */}
                {isAddingService && (
                  <div className="p-2.5 bg-orange-50/80 border-2 border-orange-400 rounded-xl space-y-2 animate-fadeIn shadow-sm">
                    <div className="flex items-center justify-between text-[11px] font-bold text-orange-950">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-orange-600" /> Add New Agency Service
                      </span>
                      <button
                        type="button"
                        onClick={() => { setIsAddingService(false); setNewServiceName(''); }}
                        className="text-slate-400 hover:text-slate-600 text-xs font-bold p-0.5"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        autoFocus
                        placeholder="e.g. Influencer Marketing, Mobile App Dev..."
                        value={newServiceName}
                        onChange={(e) => setNewServiceName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewService();
                          } else if (e.key === 'Escape') {
                            setIsAddingService(false);
                          }
                        }}
                        className="flex-1 bg-white border border-orange-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleAddNewService}
                        disabled={!newServiceName.trim() || isSavingService}
                        className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" />
                        <span>Save</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Interactive Multi-Select Service Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {services.map(svc => {
                    const isSelected = (formData.servicesInterested || []).includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleFormService(svc.id)}
                        className={`px-3 py-2 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-1 ring-orange-400/40 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <span className="text-xs leading-tight truncate mr-2">{svc.label}</span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Selected: <strong className="text-orange-700">{(formData.servicesInterested || []).length} services</strong></span>
                  <span className="text-slate-400 text-[10px]">Click any chip to toggle selection</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Estimated Deal Value (₹ INR) (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g. 850000 (Optional)"
                  value={formData.estimatedDealValue}
                  onChange={(e) => setFormData({ ...formData, estimatedDealValue: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              {/* Lead Generated Date & First Contacted Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Lead Generated Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.leadGeneratedDate}
                    onChange={(e) => setFormData({ ...formData, leadGeneratedDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">First Contacted Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.contactedDate}
                    onChange={(e) => setFormData({ ...formData, contactedDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              {/* Scheduled Follow-up Date & Calendar Task Integration */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-amber-600" />
                    <span>Follow-up Date (Auto-syncs to Google Calendar checklist)</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Calendar Task
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Next Follow-up Date</label>
                    <input
                      type="date"
                      value={formData.nextFollowUpDate}
                      onChange={(e) => setFormData({ ...formData, nextFollowUpDate: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Follow-up Notes / Callback Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Client checking with director, callback on this date"
                      value={formData.followUpNotes}
                      onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <p className="text-[10px] text-amber-800">
                  When the client says they will check and get back on a specific date, enter it here. It will automatically populate as a task in your Google Calendar checklist.
                </p>
              </div>

              {/* Phase 2: Assigned Team & Dynamic Assigned Staff Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Team *</label>
                  <select
                    value={formData.assignedTeam}
                    onChange={(e) => setFormData({
                      ...formData,
                      assignedTeam: e.target.value as StaffTeam,
                      assignedManagerId: '' // reset staff selection when team changes
                    })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    {TEAMS.map(t => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Assigned Staff (Filtered by Team) *</label>
                  <select
                    value={formData.assignedManagerId}
                    onChange={(e) => setFormData({ ...formData, assignedManagerId: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">Select Team Specialist</option>
                    {(filteredStaffByTeam.length > 0 ? filteredStaffByTeam : staff).map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* How did you get this lead? (Lead Acquisition Source) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-orange-600" />
                      <span>How Did You Get This Lead? (Acquisition Channel) *</span>
                    </label>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      Channel Tracking
                    </span>
                  </div>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value as LeadSource })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {LEAD_SOURCES.map(src => (
                      <option key={src.key} value={src.key}>{src.label}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Referrer Name Input */}
                {(formData.source === 'CLIENT_REFERRAL' || formData.source === 'WORD_OF_MOUTH') && (
                  <div className="animate-fadeIn pt-1">
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{formData.source === 'CLIENT_REFERRAL' ? 'Referrer Name / Existing Client *' : 'Recommended By / Person Name (Optional)'}</span>
                    </label>
                    <input
                      type="text"
                      required={formData.source === 'CLIENT_REFERRAL'}
                      placeholder={formData.source === 'CLIENT_REFERRAL' ? 'e.g. Rahul Sharma (Kavya Boutique) / Dr. Arvind' : 'e.g. Ashok Kumar / Mutual Friend'}
                      value={formData.referrerName}
                      onChange={(e) => setFormData({ ...formData, referrerName: e.target.value })}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <p className="text-[10px] text-emerald-700 mt-1">
                      {formData.source === 'CLIENT_REFERRAL'
                        ? 'Track which client introduced this opportunity to acknowledge and reward referrals.'
                        : 'Record the person who recommended your services.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Lead Status */}
              <div>
                <label className="text-xs font-bold text-slate-700">Lead Status</label>
                <select
                  value={formData.leadStage}
                  onChange={(e) => setFormData({ ...formData, leadStage: e.target.value as LeadStage })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {STAGES.map(s => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Initial Scope & Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Client requirements, deliverables outline in ₹ INR..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

            </form>

            {/* Fixed Footer */}
            <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-100 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="create-lead-form"
                disabled={submitting}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? 'Saving & Triggering...' : 'Save Lead & Dispatch WhatsApp (₹)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Lead Modal */}
      {isEditModalOpen && editingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-5 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl relative max-h-[92vh] flex flex-col text-slate-900 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                  <Pencil className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    Edit Lead Details
                  </h2>
                  <p className="text-xs text-slate-500">
                    Update commercial deal parameters, client details, and assigned specialist.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditingLead(null); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="edit-lead-form" onSubmit={handleUpdateLead} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              {/* SECTION 1: Client & Business Information */}
              <div className="p-4 bg-orange-50/50 border border-orange-200/80 rounded-2xl space-y-3.5">
                <div className="flex items-center justify-between border-b border-orange-200/60 pb-2">
                  <h3 className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-orange-600" />
                    <span>1. Client & Business Details</span>
                  </h3>
                  <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200">
                    Primary Profile
                  </span>
                </div>

                {/* Client Selection Mode: New vs Existing Directory Client */}
                <div className="p-1 bg-white border border-orange-200 rounded-xl flex items-center gap-1.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => {
                      setClientSelectionMode('NEW');
                      setFormData(prev => ({ ...prev, clientId: '' }));
                      setDuplicateWarning(null);
                    }}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                      clientSelectionMode === 'NEW'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    + New Client Lead
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientSelectionMode('EXISTING')}
                    className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      clientSelectionMode === 'EXISTING'
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Select Existing Client ({clients.length})</span>
                  </button>
                </div>

                {/* Existing Client Picker */}
                {clientSelectionMode === 'EXISTING' && (
                  <div className="p-3 bg-white border-2 border-orange-400/80 rounded-xl space-y-1.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-orange-950 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-orange-600" />
                        <span>Select Existing Client from Directory:</span>
                      </label>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded border border-emerald-200">
                        Multi-Project Tracking Enabled
                      </span>
                    </div>
                    <select
                      value={editFormData.clientId}
                      onChange={(e) => handleSelectExistingClientForEdit(e.target.value)}
                      className="w-full bg-orange-50/70 border border-orange-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="">-- Choose an Existing Client --</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.businessName} (Contact: {c.contactName} • {c.whatsappNumber})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500 italic pt-0.5">
                      ✓ Auto-populates client contact & address while allowing you to log a new, distinct project lead & quotation under their account.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Client / Contact Person Name</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.leadName}
                      onChange={(e) => setEditFormData({ ...editFormData, leadName: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Business / Company Name</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.businessName}
                      onChange={(e) => setEditFormData({ ...editFormData, businessName: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <span>Business Category / Industry</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <select
                      value={editFormData.businessCategory}
                      onChange={(e) => setEditFormData({ ...editFormData, businessCategory: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    >
                      {BUSINESS_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.label}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-orange-600" />
                      <span>Business Address / Location</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. #42 MG Road, Anna Nagar, Chennai"
                      value={editFormData.address}
                      onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>WhatsApp Phone</span>
                      <span className="text-rose-500 font-black">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editFormData.whatsappNumber}
                      onChange={(e) => setEditFormData({ ...editFormData, whatsappNumber: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={editFormData.email}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Lead Stage</label>
                  <select
                    value={editFormData.leadStage}
                    onChange={(e) => setEditFormData({ ...editFormData, leadStage: e.target.value as LeadStage })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {STAGES.map(s => (
                      <option key={s.key} value={s.key}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Estimated Deal Value (₹ INR) (Optional)</label>
                  <input
                    type="number"
                    placeholder="e.g. 50000 (Optional)"
                    value={editFormData.estimatedDealValue}
                    onChange={(e) => setEditFormData({ ...editFormData, estimatedDealValue: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Lead Generated Date & First Contacted Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Lead Generated Date</label>
                  <input
                    type="date"
                    value={editFormData.leadGeneratedDate}
                    onChange={(e) => setEditFormData({ ...editFormData, leadGeneratedDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">First Contacted Date (Optional)</label>
                  <input
                    type="date"
                    value={editFormData.contactedDate}
                    onChange={(e) => setEditFormData({ ...editFormData, contactedDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
                  />
                </div>
              </div>

              {/* Scheduled Follow-up Date & Calendar Task Integration */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-amber-900 flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-amber-600" />
                    <span>Follow-up Date (Auto-syncs to Google Calendar checklist)</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    Calendar Task
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Next Follow-up Date</label>
                    <input
                      type="date"
                      value={editFormData.nextFollowUpDate}
                      onChange={(e) => setEditFormData({ ...editFormData, nextFollowUpDate: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700">Follow-up Notes / Callback Reason</label>
                    <input
                      type="text"
                      placeholder="e.g. Client requested callback on this date"
                      value={editFormData.followUpNotes}
                      onChange={(e) => setEditFormData({ ...editFormData, followUpNotes: e.target.value })}
                      className="mt-1 w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Agency Services Inquired (Multiple Selection Option) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-orange-600" />
                    <span>Services Inquired (Multiple Selection) *</span>
                  </label>
                  <span className="text-[10px] text-orange-700 font-bold bg-orange-100 px-2 py-0.5 rounded-full">
                    {(editFormData.servicesInterested || []).length} selected
                  </span>
                </div>

                {/* Interactive Multi-Select Service Chips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 max-h-48 overflow-y-auto pr-1">
                  {services.map(svc => {
                    const isSelected = (editFormData.servicesInterested || []).includes(svc.id);
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => toggleEditFormService(svc.id)}
                        className={`px-3 py-2 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${isSelected
                          ? 'bg-orange-50 border-orange-500 text-orange-950 font-bold ring-1 ring-orange-400/40 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                      >
                        <span className="text-xs leading-tight truncate mr-2">{svc.label}</span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${isSelected ? 'bg-orange-600 border-orange-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Assigned Team</label>
                <select
                  value={editFormData.assignedTeam}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedTeam: e.target.value as StaffTeam })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {TEAMS.map(t => (
                    <option key={t.key} value={t.key}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Assigned Specialist / Lead Manager</label>
                <select
                  value={editFormData.assignedManagerId}
                  onChange={(e) => setEditFormData({ ...editFormData, assignedManagerId: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- Select Specialist --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role.replace('_', ' ')})</option>
                  ))}
                </select>
              </div>

              {/* How did you get this lead? (Lead Acquisition Source) */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Target className="w-4 h-4 text-orange-600" />
                      <span>Lead Acquisition Channel *</span>
                    </label>
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200">
                      Channel Tracking
                    </span>
                  </div>
                  <select
                    value={editFormData.source}
                    onChange={(e) => setEditFormData({ ...editFormData, source: e.target.value as LeadSource })}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {LEAD_SOURCES.map(src => (
                      <option key={src.key} value={src.key}>{src.label}</option>
                    ))}
                  </select>
                </div>

                {/* Conditional Referrer Name Input */}
                {(editFormData.source === 'CLIENT_REFERRAL' || editFormData.source === 'WORD_OF_MOUTH') && (
                  <div className="animate-fadeIn pt-1">
                    <label className="text-xs font-bold text-emerald-800 flex items-center gap-1.5 mb-1">
                      <Users className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{editFormData.source === 'CLIENT_REFERRAL' ? 'Referrer Name / Existing Client *' : 'Recommended By / Person Name (Optional)'}</span>
                    </label>
                    <input
                      type="text"
                      required={editFormData.source === 'CLIENT_REFERRAL'}
                      placeholder={editFormData.source === 'CLIENT_REFERRAL' ? 'e.g. Rahul Sharma (Kavya Boutique) / Dr. Arvind' : 'e.g. Ashok Kumar / Mutual Friend'}
                      value={editFormData.referrerName}
                      onChange={(e) => setEditFormData({ ...editFormData, referrerName: e.target.value })}
                      className="w-full bg-white border border-emerald-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Lead Notes & Requirements</label>
                <textarea
                  rows={3}
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

            </form>

            {/* Fixed Footer */}
            <div className="flex items-center justify-end gap-3 p-4 px-6 border-t border-slate-100 shrink-0 bg-slate-50/80">
              <button
                type="button"
                onClick={() => { setIsEditModalOpen(false); setEditingLead(null); }}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-lead-form"
                disabled={submitting}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60 flex items-center gap-1.5 cursor-pointer"
              >
                {submitting ? 'Saving Changes...' : 'Update Lead (₹)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONVERT WON LEAD TO PROJECT MODAL */}
      {showConvertModal && leadToConvert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Deal Won! Convert to Active Project?</h3>
                <p className="text-xs text-slate-500">{leadToConvert.businessName} • ₹{leadToConvert.estimatedDealValue.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Lead <span className="font-bold text-slate-900">{leadToConvert.businessName}</span> has been converted to <span className="font-bold text-emerald-700">WON</span>! Would you like to automatically create an active Project with its contract value (<span className="font-mono font-bold text-slate-900">₹{leadToConvert.estimatedDealValue.toLocaleString('en-IN')}</span>), deliverables, and milestones?
            </p>

            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowConvertModal(false);
                  setLeadToConvert(null);
                }}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                No, Just Mark as Won
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertToProject}
                disabled={isConverting}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
              >
                {isConverting ? 'Creating Project...' : 'Yes, Create Project & View Details →'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* WhatsApp Greeting Modal (Nearlook Mart Pvt Ltd) */}
      {greetingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 shadow-xs shrink-0">
                  <MessageSquare className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Send WhatsApp Greeting
                    </h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Nearlook Mart Pvt Ltd
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                    Official welcome for <strong className="text-slate-800">{greetingLead.businessName}</strong>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setGreetingLead(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Recipient & Inquired Services Summary */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Recipient Contact</span>
                    <strong className="text-slate-900 font-bold">{greetingLead.leadName}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">WhatsApp Number</span>
                    <strong className="text-emerald-700 font-bold">{greetingLead.whatsappNumber}</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                    Inquired Services ({(greetingLead.servicesInterested || [greetingLead.serviceType || 'WEB_DEV']).length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(greetingLead.servicesInterested || [greetingLead.serviceType || 'WEB_DEV']).map(svcId => (
                      <span
                        key={svcId}
                        className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md"
                      >
                        {getServiceLabel(svcId)}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editable Greeting Message */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Customizable Professional Greeting Message:
                  </label>
                  <button
                    type="button"
                    onClick={() => setGreetingMessage(buildGreetingText(greetingLead))}
                    className="text-[10px] text-orange-600 hover:text-orange-700 font-bold underline cursor-pointer"
                  >
                    Reset to Default
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={greetingMessage}
                  onChange={(e) => setGreetingMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
                />
              </div>

              {/* Auto mark as contacted option */}
              <label className="flex items-start gap-2.5 p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={greetingAutoMarkContacted}
                  onChange={(e) => setGreetingAutoMarkContacted(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                />
                <div className="text-xs text-emerald-950">
                  <span className="font-bold block">Update Lead Status to &quot;Contacted&quot;</span>
                  <p className="text-[10px] text-emerald-800">
                    Automatically starts the follow-up day counter (e.g., following for 0 days from today).
                  </p>
                </div>
              </label>
            </div>

            {/* Fixed Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => setGreetingLead(null)}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDispatchGreeting}
                disabled={isSendingGreeting || !greetingMessage.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSendingGreeting ? 'Dispatching...' : 'Open WhatsApp & Send Greeting'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Follow-up Modal (1-click schedule from card with automatic Google Calendar checklist sync) */}
      {quickFollowUpLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleSaveQuickFollowUp} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shrink-0">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Schedule Lead Follow-up
                    </h3>
                    <p className="text-xs text-slate-500 truncate max-w-xs">
                      {quickFollowUpLead.businessName} • {quickFollowUpLead.leadName}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQuickFollowUpLead(null)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Follow-up Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={quickFollowUpDate}
                    onChange={(e) => setQuickFollowUpDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    When the client says they will check and get back on a specific date, enter it here.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Follow-up Notes / Callback Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. Client requested a callback after discussing with their internal technical team..."
                    value={quickFollowUpNotes}
                    onChange={(e) => setQuickFollowUpNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <strong className="block text-[11px]">Automatic Google Calendar Checklist Task</strong>
                    <p className="text-[10px] text-emerald-800 leading-relaxed">
                      Saving will immediately add a priority follow-up task on this date to the <strong>/calendar</strong> module with actionable checklist items.
                    </p>
                  </div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setQuickFollowUpLead(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingFollowUp || !quickFollowUpDate}
                  className="px-4 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isSavingFollowUp ? 'Saving & Syncing...' : 'Save & Sync to Calendar'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Acquisition Sources & Origin Analytics Modal */}
      {isAnalyticsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full border border-slate-200 shadow-2xl relative text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Fixed Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                      Lead Acquisition Sources & Origin Analytics
                    </h2>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 border border-orange-200">
                      Channel Attribution
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Track where your leads originate: Word of mouth, client referrals, Google, website, and social channels.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle: Leads Count vs Pipeline Value */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setChartMetricMode('COUNT')}
                    className={`px-3 py-1 rounded-lg transition-all ${chartMetricMode === 'COUNT' ? 'bg-white text-orange-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    By Leads Count
                  </button>
                  <button
                    onClick={() => setChartMetricMode('VALUE')}
                    className={`px-3 py-1 rounded-lg transition-all ${chartMetricMode === 'VALUE' ? 'bg-white text-orange-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    By Pipeline Value
                  </button>
                </div>

                <button
                  onClick={() => setIsAnalyticsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                  title="Close Analytics"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5">

            {/* Key KPI Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Origin Channel</span>
                <strong className="text-sm font-black text-slate-900 truncate block mt-0.5">
                  {sourceAnalytics.topSourceByCount.count > 0 ? sourceAnalytics.topSourceByCount.label : 'No leads recorded'}
                </strong>
                <span className="text-[11px] text-orange-600 font-bold">
                  {sourceAnalytics.topSourceByCount.count > 0 ? `${sourceAnalytics.topSourceByCount.count} Leads (${Math.round((sourceAnalytics.topSourceByCount.count / (sourceAnalytics.totalCount || 1)) * 100)}%)` : 'Start capturing leads'}
                </span>
              </div>

              <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Highest Value Source</span>
                <strong className="text-sm font-black text-emerald-950 truncate block mt-0.5">
                  {sourceAnalytics.topSourceByValue.value > 0 ? sourceAnalytics.topSourceByValue.label : 'No revenue yet'}
                </strong>
                <span className="text-[11px] text-emerald-700 font-bold">
                  {sourceAnalytics.topSourceByValue.value > 0 ? `₹${sourceAnalytics.topSourceByValue.value.toLocaleString('en-IN')}` : '₹0'}
                </span>
              </div>

              <div className="p-3.5 bg-blue-50/50 rounded-2xl border border-blue-200">
                <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wider block">Client Referral Network</span>
                <strong className="text-sm font-black text-blue-950 truncate block mt-0.5">
                  {sourceAnalytics.stats['CLIENT_REFERRAL']?.count || 0} Referred Leads
                </strong>
                <span className="text-[11px] text-blue-700 font-bold">
                  ₹{(sourceAnalytics.stats['CLIENT_REFERRAL']?.totalValue || 0).toLocaleString('en-IN')} pipeline
                </span>
              </div>

              <div className="p-3.5 bg-amber-50/50 rounded-2xl border border-amber-200">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Word of Mouth</span>
                <strong className="text-sm font-black text-amber-950 truncate block mt-0.5">
                  {sourceAnalytics.stats['WORD_OF_MOUTH']?.count || 0} Inbound Leads
                </strong>
                <span className="text-[11px] text-amber-700 font-bold">
                  ₹{(sourceAnalytics.stats['WORD_OF_MOUTH']?.totalValue || 0).toLocaleString('en-IN')} pipeline
                </span>
              </div>
            </div>

            {/* Proportional Stacked Multi-Color Distribution Bar */}
            {sourceAnalytics.totalCount > 0 ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                  <span>Channel Share ({sourceAnalytics.totalCount} Leads • ₹{sourceAnalytics.totalPipeline.toLocaleString('en-IN')} Pipeline)</span>
                  <span>{selectedSource !== 'ALL' ? `Filtered by: ${LEAD_SOURCES.find(s => s.key === selectedSource)?.label}` : 'Click any channel card below to filter'}</span>
                </div>
                <div className="h-4 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
                  {LEAD_SOURCES.map(source => {
                    const count = sourceAnalytics.stats[source.key]?.count || 0;
                    const value = sourceAnalytics.stats[source.key]?.totalValue || 0;
                    if (chartMetricMode === 'COUNT' ? count === 0 : value === 0) return null;

                    const sharePercent = chartMetricMode === 'COUNT'
                      ? (count / sourceAnalytics.totalCount) * 100
                      : sourceAnalytics.totalPipeline > 0 ? (value / sourceAnalytics.totalPipeline) * 100 : 0;

                    return (
                      <div
                        key={source.key}
                        onClick={() => setSelectedSource(selectedSource === source.key ? 'ALL' : source.key)}
                        style={{ width: `${Math.max(2, sharePercent)}%` }}
                        className={`${source.barColor} h-full transition-all duration-300 cursor-pointer hover:opacity-80 relative group`}
                        title={`${source.label}: ${count} leads (₹${value.toLocaleString('en-IN')}) - ${sharePercent.toFixed(1)}%`}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl">
                <PieChart className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <h4 className="text-xs font-bold text-slate-700">No Lead Source Data Available</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click &quot;Add New Lead&quot; to log your first lead with acquisition channel attribution.
                </p>
              </div>
            )}

            {/* Interactive Grid of Acquisition Channels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-2">
              {LEAD_SOURCES.map(source => {
                const stat = sourceAnalytics.stats[source.key] || { count: 0, totalValue: 0, wonCount: 0, wonValue: 0, referrers: [] };
                const IconComponent = source.icon;
                const isSelected = selectedSource === source.key;
                const countPercent = sourceAnalytics.totalCount > 0 ? Math.round((stat.count / sourceAnalytics.totalCount) * 100) : 0;
                const winRate = stat.count > 0 ? Math.round((stat.wonCount / stat.count) * 100) : 0;

                return (
                  <div
                    key={source.key}
                    onClick={() => setSelectedSource(selectedSource === source.key ? 'ALL' : source.key)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative ${isSelected
                      ? 'bg-orange-50/50 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                      : stat.count > 0
                        ? `${source.bg} ${source.border} hover:shadow-md`
                        : 'bg-white border-slate-200 opacity-60 hover:opacity-100 hover:border-slate-300'
                      }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl ${source.bg} ${source.color} flex items-center justify-center border ${source.border}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900 leading-tight">{source.label}</h4>
                          <span className="text-[10px] text-slate-500 font-semibold">{stat.count} Leads ({countPercent}%)</span>
                        </div>
                      </div>

                      {isSelected && (
                        <span className="px-1.5 py-0.5 bg-orange-600 text-white rounded text-[9px] font-black uppercase">
                          Filtered
                        </span>
                      )}
                    </div>

                    {/* Value & Win Rate */}
                    <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-semibold">Pipeline</span>
                        <strong className="text-slate-900 text-xs font-black">
                          {canViewFinancials ? `₹${stat.totalValue.toLocaleString('en-IN')}` : 'Protected'}
                        </strong>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-semibold">Won Deals</span>
                        <span className="text-emerald-700 font-black text-[11px]">
                          {stat.wonCount} ({winRate}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for this channel */}
                    <div className="w-full bg-slate-200/60 rounded-full h-1.5 mt-2.5 overflow-hidden">
                      <div
                        className={`${source.barColor} h-full rounded-full transition-all duration-500`}
                        style={{ width: `${countPercent}%` }}
                      />
                    </div>

                    {/* Referrer Names Pill preview if Client Referral */}
                    {stat.referrers.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/60 text-[10px] text-emerald-800 font-bold truncate">
                        Referred by: {stat.referrers.join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <div className="text-xs text-slate-500 font-medium">
                {selectedSource !== 'ALL' ? (
                  <span>Filtering by: <strong className="text-orange-600 font-bold">{LEAD_SOURCES.find(s => s.key === selectedSource)?.label}</strong></span>
                ) : (
                  <span>Showing all {sourceAnalytics.totalCount} leads across all sources</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {selectedSource !== 'ALL' && (
                  <button
                    onClick={() => setSelectedSource('ALL')}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 rounded-xl text-slate-700 border border-slate-200 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                )}
                <button
                  onClick={() => setIsAnalyticsModalOpen(false)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md shadow-orange-500/20"
                >
                  Apply & View Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
