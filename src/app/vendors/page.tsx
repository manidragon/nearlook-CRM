'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  Truck, 
  Plus, 
  Search, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Edit2, 
  Trash2, 
  CreditCard, 
  Share2, 
  Laptop, 
  Globe, 
  X, 
  Check, 
  ExternalLink,
  DollarSign,
  Phone,
  Mail,
  Building,
  FolderKanban,
  Users,
  Sparkles,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { Vendor, VendorType, Project, Influencer } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

const DEFAULT_CATEGORIES = [
  { id: 'DOMAIN_REGISTRATION', label: 'Domain Registration & DNS (Hostinger/GoDaddy)' },
  { id: 'HOSTING_SERVERS', label: 'Cloud Servers & Hosting (AWS/Cloudways/Vercel)' },
  { id: 'META_ADS_CAMPAIGN', label: 'Meta Ads & Instagram Campaigns' },
  { id: 'GOOGLE_ADS_CAMPAIGN', label: 'Google & YouTube Ads Network' },
  { id: 'INFLUENCER_MARKETING', label: 'Influencer Marketing & Creator Payables' },
  { id: 'THIRD_PARTY_APIS', label: 'AI & API Quotas (OpenAI/Anthropic)' },
  { id: 'SAAS_LICENSES', label: 'Software & Tool Subscriptions (Canva/GitHub)' },
  { id: 'FREELANCE_DEV', label: 'Freelance Developers & UI Designers' },
  { id: 'HARDWARE_OFFICE', label: 'Hardware & Office Equipment' },
  { id: 'TEA_SNACKS', label: 'Pantry & Office Refreshments' },
];

const PLATFORM_SHORTCUTS = [
  'Hostinger',
  'Meta Ads',
  'Google Ads',
  'AWS Cloud',
  'Cloudflare',
  'OpenAI API',
  'Canva Pro',
  'DigitalOcean',
  'Vercel',
  'Razorpay Fees'
];

function VendorsContent() {
  const searchParams = useSearchParams();
  const queryProjectId = searchParams.get('projectId');
  const queryOpenCreate = searchParams.get('openCreate');

  const { currentStaff, canViewFinancials } = useAuth();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Categories
  const [categories, setCategories] = useState<{ id: string; label: string }[]>(DEFAULT_CATEGORIES);
  const [showAddCategoryInput, setShowAddCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [projectFilter, setProjectFilter] = useState<string>(queryProjectId || 'ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null);
  const [payingVendor, setPayingVendor] = useState<Vendor | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('NEFT_RTGS');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formProjectId, setFormProjectId] = useState<string>(queryProjectId || '');
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBankDetails, setFormBankDetails] = useState('');
  const [formVendorType, setFormVendorType] = useState<VendorType>('VENDOR');
  const [formCategory, setFormCategory] = useState('DOMAIN_REGISTRATION');
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formFollowers, setFormFollowers] = useState('');
  const [formTotalPayable, setFormTotalPayable] = useState('');
  const [formAdvancePaid, setFormAdvancePaid] = useState('0');
  const [formDueDate, setFormDueDate] = useState('');
  const [formExpenseMode, setFormExpenseMode] = useState('CREDIT_CARD');
  const [formInvoiceNumber, setFormInvoiceNumber] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [selectedInfluencerId, setSelectedInfluencerId] = useState('');

  const loadData = async () => {
    try {
      const [venRes, projRes, infRes] = await Promise.all([
        fetch('/api/vendors').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/influencers').then(r => r.json())
      ]);

      if (venRes.success) setVendors(venRes.data);
      if (projRes.success) setProjects(projRes.data);
      if (infRes.success) setInfluencers(infRes.data);
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

  // Handle URL openCreate
  useEffect(() => {
    if (queryOpenCreate === 'true') {
      resetForm();
      if (queryProjectId) {
        setFormProjectId(queryProjectId);
        setProjectFilter(queryProjectId);
      }
      setShowCreateModal(true);
    }
  }, [queryOpenCreate, queryProjectId]);

  const resetForm = () => {
    setFormName('');
    setFormProjectId(queryProjectId || '');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormBankDetails('');
    setFormVendorType('VENDOR');
    setFormCategory('DOMAIN_REGISTRATION');
    setFormPlatform('Instagram');
    setFormFollowers('');
    setFormTotalPayable('');
    setFormAdvancePaid('0');
    setFormDueDate(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
    setFormExpenseMode('CREDIT_CARD');
    setFormInvoiceNumber('');
    setFormNotes('');
    setSelectedInfluencerId('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (v: Vendor) => {
    setEditingVendor(v);
    setFormName(v.companyName);
    setFormProjectId(v.projectId || '');
    setFormContact(v.contactPerson || '');
    setFormPhone(v.phone || '');
    setFormEmail(v.email || '');
    setFormBankDetails(v.bankDetails || '');
    setFormVendorType(v.vendorType || 'VENDOR');
    setFormCategory(v.serviceCategory);
    setFormPlatform(v.platform || 'Instagram');
    setFormFollowers(v.followerCount || '');
    setFormTotalPayable(String(v.totalPayable));
    setFormAdvancePaid(String(v.advancePaid));
    setFormDueDate(v.dueDate || '');
    setFormExpenseMode(v.paymentMode || 'CREDIT_CARD');
    setFormInvoiceNumber(v.invoiceNumber || '');
    setFormNotes(v.notes || '');
    setSelectedInfluencerId(v.influencerId || '');
  };

  const handleAddCustomCategory = () => {
    if (!newCategoryName.trim()) return;
    const catId = newCategoryName.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
    const newCat = { id: catId, label: newCategoryName.trim() };
    setCategories(prev => [...prev, newCat]);
    setFormCategory(catId);
    setNewCategoryName('');
    setShowAddCategoryInput(false);
  };

  const handleInfluencerSelect = (infId: string) => {
    setSelectedInfluencerId(infId);
    if (!infId) return;
    const inf = influencers.find(i => i.id === infId);
    if (inf) {
      setFormName(`${inf.name} (@${inf.handle})`);
      setFormContact(inf.name);
      setFormPlatform(inf.platform);
      setFormFollowers(inf.followersCount || '');
      setFormPhone(inf.phone || '');
      setFormEmail(inf.email || '');
      setFormBankDetails(inf.bankDetails || inf.upiId || '');
      setFormTotalPayable(String(inf.standardRate || ''));
      setFormVendorType('INFLUENCER');
      setFormCategory('INFLUENCER_MARKETING');
    }
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formTotalPayable) {
      alert('Please fill in Partner / Platform Name and Total Payable Amount.');
      return;
    }

    const selectedProj = projects.find(p => p.id === formProjectId);
    const selectedInf = influencers.find(i => i.id === selectedInfluencerId);

    const payload = {
      companyName: formName.trim(),
      projectId: formProjectId || undefined,
      projectName: selectedProj ? selectedProj.title : undefined,
      clientName: selectedProj ? selectedProj.clientName : undefined,
      contactPerson: formContact,
      phone: formPhone || undefined,
      email: formEmail || undefined,
      bankDetails: formBankDetails || undefined,
      vendorType: formVendorType,
      serviceCategory: formCategory,
      platform: formPlatform,
      followerCount: formFollowers,
      influencerId: selectedInfluencerId || undefined,
      influencerName: selectedInf ? selectedInf.name : undefined,
      paymentMode: formExpenseMode,
      invoiceNumber: formInvoiceNumber || undefined,
      notes: formNotes || undefined,
      totalPayable: Number(formTotalPayable),
      advancePaid: Number(formAdvancePaid || 0),
      balanceDue: Math.max(0, Number(formTotalPayable) - Number(formAdvancePaid || 0)),
      dueDate: formDueDate || undefined
    };

    try {
      if (editingVendor) {
        const res = await fetch('/api/vendors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingVendor.id, ...payload })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ ${payload.companyName} expense updated successfully.`);
          setEditingVendor(null);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else {
        const res = await fetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Added ${payload.companyName} to Project Expenses & Payables.`);
          setShowCreateModal(false);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save expense');
    }
  };

  const handleSettlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingVendor || !paymentAmount) return;

    try {
      const res = await fetch(`/api/vendors/${payingVendor.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          paymentMode,
          notes: paymentNotes || 'Disbursed via Agency Banking'
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`💰 Payment of ${formatINR(Number(paymentAmount))} recorded for ${payingVendor.companyName}. Project balance updated!`);
        setPayingVendor(null);
        setPaymentAmount('');
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteVendor = async () => {
    if (!deletingVendor) return;
    try {
      const res = await fetch(`/api/vendors?id=${deletingVendor.id}&deletedBy=${encodeURIComponent(currentStaff.name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ ${deletingVendor.companyName} expense moved to Recycle Bin.`);
        setDeletingVendor(null);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter
  const filtered = vendors.filter(v => {
    const matchesSearch = 
      v.companyName.toLowerCase().includes(search.toLowerCase()) ||
      (v.contactPerson && v.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (v.projectName && v.projectName.toLowerCase().includes(search.toLowerCase())) ||
      (v.phone && v.phone.includes(search)) ||
      (v.serviceCategory && v.serviceCategory.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || (v.vendorType || 'VENDOR') === typeFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'PENDING' && v.balanceDue > 0) || 
      (statusFilter === 'SETTLED' && v.balanceDue <= 0);

    const matchesProject = 
      projectFilter === 'ALL' || 
      (projectFilter === 'GENERAL' && !v.projectId) ||
      (v.projectId === projectFilter);

    return matchesSearch && matchesType && matchesStatus && matchesProject;
  });

  const totalContracted = filtered.reduce((acc, v) => acc + (v.totalPayable || 0), 0);
  const totalPaid = filtered.reduce((acc, v) => acc + (v.advancePaid || 0), 0);
  const totalBalanceDue = filtered.reduce((acc, v) => acc + (v.balanceDue || 0), 0);
  const pendingCount = filtered.filter(v => (v.balanceDue || 0) > 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Project Expenses & Payables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Project Expenses & Vendor Payables
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
              Project Expenses & Procurement
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Allocate domain purchases, Meta/Google ad networks, cloud servers, software tools, and creator fees directly to client projects and agency overhead.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            href="/influencers"
            className="flex items-center space-x-1.5 px-3.5 py-2.5 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl font-bold text-xs transition"
          >
            <Users className="w-4 h-4 text-purple-600" />
            <span>Influencer Directory</span>
          </Link>
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Project Expense</span>
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Expense Contracted</span>
            <DollarSign className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatINR(totalContracted)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Cumulative commitments</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Disbursed / Paid</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{formatINR(totalPaid)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Settled through Bank / UPI / Cards</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Balance Due (Outstanding)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">{formatINR(totalBalanceDue)}</p>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            <span>Flows into Project & Agency Payables</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Payouts Count</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 mt-2">{pendingCount}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Expenses with due balance</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendor name, platform, project, category, handle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <FolderKanban className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none max-w-[170px] truncate"
              >
                <option value="ALL">All Projects & General</option>
                <option value="GENERAL">General Agency Overhead</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>
            </div>

            {/* Entity Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Types</option>
                <option value="VENDOR">Vendors / Platforms</option>
                <option value="INFLUENCER">Influencers</option>
                <option value="FREELANCER">Freelancers</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center space-x-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none"
              >
                <option value="ALL">All Payouts</option>
                <option value="PENDING">Pending Due Balance</option>
                <option value="SETTLED">Settled (₹0 Due)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses & Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Partner / Platform</th>
                <th className="py-3 px-4">Associated Project</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Committed</th>
                <th className="py-3 px-4 text-right">Disbursed</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Payment Mode</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No expense or vendor records found for this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const isSettled = (v.balanceDue || 0) <= 0;
                  return (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                          <span>{v.companyName}</span>
                          {v.vendorType === 'INFLUENCER' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                              Creator
                            </span>
                          )}
                          {v.followerCount && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                              {v.followerCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {v.contactPerson ? `${v.contactPerson}` : ''}
                          {v.phone ? ` • ${v.phone}` : ''}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {v.projectId ? (
                          <Link 
                            href={`/projects?viewProjectId=${v.projectId}`}
                            className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition max-w-[160px] truncate"
                          >
                            <FolderKanban className="w-3 h-3 shrink-0" />
                            <span className="truncate">{v.projectName || 'Project'}</span>
                          </Link>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                            Agency Overhead
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                        {v.serviceCategory.replace(/_/g, ' ')}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-slate-900">
                        {formatINR(v.totalPayable)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600">
                        {formatINR(v.advancePaid)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-rose-600">
                        {formatINR(v.balanceDue)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                          {v.paymentMode ? v.paymentMode.replace(/_/g, ' ') : 'Corporate Card'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {!isSettled && (
                            <button
                              onClick={() => { setPayingVendor(v); setPaymentAmount(String(v.balanceDue)); }}
                              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition"
                            >
                              Settle Dues
                            </button>
                          )}
                          <button
                            onClick={() => setViewingVendor(v)}
                            title="View Details"
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(v)}
                            title="Edit"
                            className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingVendor(v)}
                            title="Delete (Move to Recycle Bin)"
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
          SETTLE PAYMENT MODAL
         ========================================================================= */}
      {payingVendor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="font-black text-lg text-slate-900">Record Payout</h3>
                <p className="text-xs text-slate-500">Pay to: <strong className="text-slate-800">{payingVendor.companyName}</strong></p>
              </div>
              <button onClick={() => setPayingVendor(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettlePayment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-rose-800">Current Balance Due:</span>
                  <span className="font-black text-rose-700 text-sm">{formatINR(payingVendor.balanceDue)}</span>
                </div>

                {payingVendor.projectName && (
                  <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-900 flex items-center space-x-1.5">
                    <FolderKanban className="w-4 h-4 text-blue-600" />
                    <span>Project: <strong>{payingVendor.projectName}</strong></span>
                  </div>
                )}

                {payingVendor.bankDetails && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px]">
                    <span className="font-bold text-slate-500 block">Bank / UPI Transfer Details:</span>
                    <span className="font-mono text-slate-800 font-bold mt-0.5 block">{payingVendor.bankDetails}</span>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">Disbursement Amount (₹) *</label>
                    <span className="text-[10px] text-slate-500 font-semibold">Bill Balance: {formatINR(payingVendor.balanceDue)}</span>
                  </div>
                  <input
                    type="number"
                    min="1"
                    required
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  {Number(paymentAmount) > payingVendor.balanceDue && (
                    <p className="text-[11px] text-amber-700 mt-1 font-semibold">
                      ⚠️ Note: Amount exceeds balance due. Excess will be logged as Advance Credit.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="CREDIT_CARD">Company Corporate Card</option>
                    <option value="UPI">UPI Transfer (GPay / PhonePe)</option>
                    <option value="NEFT_RTGS">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Transaction Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR #10294829 or Card Auth Code"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setPayingVendor(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Confirm Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE / EDIT EXPENSE & VENDOR MODAL
         ========================================================================= */}
      {(showCreateModal || editingVendor) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-lg text-slate-900">
                  {editingVendor ? 'Edit Project Expense / Vendor' : 'Add Project Expense & Procurement'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingVendor(null); }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVendor} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                
                {/* Associated Project */}
                <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200/80">
                  <label className="block text-xs font-bold text-blue-900 mb-1 flex items-center space-x-1.5">
                    <FolderKanban className="w-4 h-4 text-blue-600" />
                    <span>Associate with Project (Allocates Expense to Project Ledger)</span>
                  </label>
                  <select
                    value={formProjectId}
                    onChange={(e) => setFormProjectId(e.target.value)}
                    className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- General Agency Expense (No Specific Project) --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.title} (Client: {p.clientName})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-blue-700/80 mt-1">
                    Attaching to a project automatically updates its Overall Expenses and Realized Net Profit margin.
                  </p>
                </div>

                {/* Quick Platform Shortcuts */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5">
                    Quick Platforms / Suggestions:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {PLATFORM_SHORTCUTS.map(plat => (
                      <button
                        type="button"
                        key={plat}
                        onClick={() => {
                          setFormName(plat);
                          if (plat === 'Hostinger') setFormCategory('DOMAIN_REGISTRATION');
                          if (plat === 'Meta Ads') setFormCategory('META_ADS_CAMPAIGN');
                          if (plat === 'Google Ads') setFormCategory('GOOGLE_ADS_CAMPAIGN');
                          if (plat === 'AWS Cloud') setFormCategory('HOSTING_SERVERS');
                          if (plat === 'OpenAI API') setFormCategory('THIRD_PARTY_APIS');
                          if (plat === 'Canva Pro') setFormCategory('SAAS_LICENSES');
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 rounded-lg text-[10px] font-bold transition border border-slate-200/60"
                      >
                        + {plat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Platform / Vendor / Recipient Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Hostinger, Meta Ads, AWS Cloud, OpenAI, @tech_creator"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Expense Type / Category Dropdown with "+ Add Expense Type" button */}
                  <div className="sm:col-span-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-slate-700">Expense Type / Category *</label>
                      <button
                        type="button"
                        onClick={() => setShowAddCategoryInput(!showAddCategoryInput)}
                        className="text-[11px] font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add New Expense Type</span>
                      </button>
                    </div>

                    {showAddCategoryInput && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex gap-2 items-center">
                        <input
                          type="text"
                          placeholder="e.g. Domain SSL, Influencer Reel, Cloud Backup..."
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          className="flex-1 p-2 bg-white border border-amber-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomCategory}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm"
                        >
                          Save Type
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowAddCategoryInput(false)}
                          className="px-2 py-2 text-slate-400 hover:text-slate-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    )}

                    <select
                      value={formCategory}
                      onChange={(e) => {
                        setFormCategory(e.target.value);
                        if (e.target.value === 'INFLUENCER_MARKETING') {
                          setFormVendorType('INFLUENCER');
                        }
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      {categories.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Influencer Dropdown if category or type is influencer */}
                  {(formCategory === 'INFLUENCER_MARKETING' || formVendorType === 'INFLUENCER') && (
                    <div className="sm:col-span-2 p-3 bg-purple-50 rounded-xl border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-purple-900 flex items-center space-x-1.5">
                          <Users className="w-4 h-4 text-purple-600" />
                          <span>Select Existing Creator / Influencer:</span>
                        </label>
                        <Link 
                          href="/influencers" 
                          target="_blank"
                          className="text-[11px] font-bold text-purple-700 hover:underline flex items-center space-x-0.5"
                        >
                          <span>Manage Directory</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      </div>

                      <select
                        value={selectedInfluencerId}
                        onChange={(e) => handleInfluencerSelect(e.target.value)}
                        className="w-full p-2 bg-white border border-purple-300 rounded-lg text-xs font-bold text-purple-900"
                      >
                        <option value="">-- Choose Influencer from Directory --</option>
                        {influencers.map(inf => (
                          <option key={inf.id} value={inf.id}>
                            {inf.name} (@{inf.handle}) • {inf.platform} • {inf.followersCount || '0'} followers • Standard ₹{inf.standardRate}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Expense Amount (₹) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 4000"
                      value={formTotalPayable}
                      onChange={(e) => setFormTotalPayable(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Disbursed / Paid So Far (₹)</label>
                    <input
                      type="number"
                      value={formAdvancePaid}
                      onChange={(e) => setFormAdvancePaid(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                    <select
                      value={formExpenseMode}
                      onChange={(e) => setFormExpenseMode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="CREDIT_CARD">Company Credit Card / Debit Card</option>
                      <option value="UPI">UPI (GPay / PhonePe / Paytm)</option>
                      <option value="NEFT_RTGS">Bank Transfer (NEFT / RTGS / IMPS)</option>
                      <option value="DIRECT_DEBIT">Auto-Debit / Standing Instruction</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Due Date</label>
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Phone is NOT mandatory */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Contact Phone (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210 (Optional)"
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Invoice / Transaction ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. INV-HOST-2026-09"
                      value={formInvoiceNumber}
                      onChange={(e) => setFormInvoiceNumber(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank / UPI / Payment Details (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. UPI ID or HDFC Bank Account"
                      value={formBankDetails}
                      onChange={(e) => setFormBankDetails(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Description (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Purchased 1-year .com domain renewal for client web build"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingVendor(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingVendor ? 'Save Changes' : 'Record Project Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAILS MODAL
         ========================================================================= */}
      {viewingVendor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                  {viewingVendor.vendorType || 'VENDOR'}
                </span>
                <h3 className="font-black text-xl text-slate-900 mt-1">{viewingVendor.companyName}</h3>
                {viewingVendor.projectName && (
                  <span className="text-xs font-bold text-blue-700 flex items-center space-x-1 mt-0.5">
                    <FolderKanban className="w-3.5 h-3.5" />
                    <span>Project: {viewingVendor.projectName}</span>
                  </span>
                )}
              </div>
              <button onClick={() => setViewingVendor(null)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Payable</span>
                  <span className="text-sm font-black text-slate-900">{formatINR(viewingVendor.totalPayable)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 uppercase font-bold block">Disbursed</span>
                  <span className="text-sm font-black text-emerald-600">{formatINR(viewingVendor.advancePaid)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Balance Due</span>
                  <span className="text-sm font-black text-rose-600">{formatINR(viewingVendor.balanceDue)}</span>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Category:</span>
                  <span className="font-mono text-slate-800">{viewingVendor.serviceCategory.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Payment Mode:</span>
                  <span className="font-mono text-slate-800">{viewingVendor.paymentMode || 'Credit Card'}</span>
                </div>
                {viewingVendor.invoiceNumber && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-bold">Invoice / Ref:</span>
                    <span className="font-mono text-slate-800">{viewingVendor.invoiceNumber}</span>
                  </div>
                )}
                {viewingVendor.phone && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-bold">Phone:</span>
                    <span className="font-mono text-slate-800">{viewingVendor.phone}</span>
                  </div>
                )}
                {viewingVendor.bankDetails && (
                  <div className="py-1">
                    <span className="text-slate-500 font-bold block mb-1">Bank / UPI:</span>
                    <p className="p-2 bg-slate-50 rounded font-mono text-slate-800">{viewingVendor.bankDetails}</p>
                  </div>
                )}
                {viewingVendor.notes && (
                  <div className="py-1">
                    <span className="text-slate-500 font-bold block mb-1">Notes:</span>
                    <p className="p-2 bg-slate-50 rounded text-slate-800">{viewingVendor.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setViewingVendor(null)}
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
      {deletingVendor && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">Move to Recycle Bin?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to delete <strong className="text-slate-800">{deletingVendor.companyName}</strong>? Associated project expenses will be adjusted accordingly.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingVendor(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteVendor}
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

export default function VendorsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <VendorsContent />
    </Suspense>
  );
}
