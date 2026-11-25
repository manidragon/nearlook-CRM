'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Users,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
  ShieldCheck,
  FolderKanban,
  CheckSquare,
  Landmark,
  Building,
  Layers,
  ChevronRight,
  Filter,
  Truck,
  IndianRupee,
  ExternalLink,
  Plus,
  RefreshCw,
  Sparkles,
  Laptop,
  Globe,
  Bot,
  Share2,
  Eye,
  Trash2,
  X,
  Pencil,
  AlertCircle,
  Flame,
  ShieldAlert,
  Calendar,
  Bell,
  PauseCircle,
  Search,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { DashboardMetrics, Client, Task, Project, Invoice, Vendor, Expense, PaymentReceipt, StaffMember } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function Dashboard() {
  const { currentStaff, canViewFinancials } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Drill-Down Modal State
  const [activeDrillDown, setActiveDrillDown] = useState<
    | 'CONTRACT_VALUE'
    | 'THIS_MONTH_SALES'
    | 'GST_PAYABLE'
    | 'TOTAL_EXPENSES'
    | 'RECEIVABLES'
    | 'VENDOR_PAYABLES'
    | 'FIXED_LIABILITIES'
    | 'CASH_RUNWAY'
    | null
  >(null);
  const [drillDownSearch, setDrillDownSearch] = useState('');
  const [expenseFilter, setExpenseFilter] = useState<'ALL' | 'OFFICE' | 'TECH'>('ALL');

  const isOfficeExpense = (cat?: string, title?: string) => {
    const c = (cat || '').toUpperCase();
    const t = (title || '').toUpperCase();
    return c.includes('OFFICE') ||
      ['RENT', 'ELECTRICITY_EB', 'MAINTENANCE', 'TEA_SNACKS', 'SALARY', 'MISCELLANEOUS', 'OFFICE_SUPPLIES', 'PANTRY'].includes(c) ||
      t.includes('OFFICE') || t.includes('RENT') || t.includes('PANTRY') || t.includes('TEA') || t.includes('ELECTRICITY') || t.includes('EB') || t.includes('SALARY');
  };

  // Filter Dropdowns
  const [selectedDomain, setSelectedDomain] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('THIS_MONTH');
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [inspectInvoice, setInspectInvoice] = useState<Invoice | null>(null);
  const [confirmDeleteInv, setConfirmDeleteInv] = useState<Invoice | null>(null);

  // Edit Invoice State
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvoiceForm, setEditInvoiceForm] = useState({
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    status: 'PENDING' as any,
    notes: '',
    lateFeeAssigned: false
  });
  const [savingInvoiceEdit, setSavingInvoiceEdit] = useState(false);

  const get2DayReminderWhatsAppUrl = (item: any) => {
    const phone = item.clientPhone || '9876543210';
    const cleanPhone = phone.replace(/\D/g, '');
    const amountVal = item.amount || item.balanceDue || 0;
    const text =
      `🔔 *UPCOMING PAYMENT REMINDER (DUE IN 2 DAYS)*\n----------------------------------------\nDear *${item.clientName}*,\nThis is a gentle reminder that your scheduled milestone installment of *₹${amountVal.toLocaleString('en-IN')}* for *${item.projectTitle || item.invoiceNumber}* is due in *2 days* on *${item.dueDate || '2026-11-22'}*.\n\nTotal Contract Value: ₹${(item.totalAmount || amountVal).toLocaleString('en-IN')}\nOutstanding Balance: ₹${(item.balanceDue || amountVal).toLocaleString('en-IN')}\n\nKindly process the transfer via NEFT/UPI at your earliest convenience to maintain uninterrupted project sprint velocity.\n\nThank you!\nAccounts Team: +91 98765 43208 • Nearlook Agency`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const getOnHoldWhatsAppUrl = (item: any) => {
    const phone = item.clientPhone || '9876543210';
    const cleanPhone = phone.replace(/\D/g, '');
    const bal = item.balanceDue !== undefined ? item.balanceDue : item.totalAmount;
    const text =
      `🛑 *NOTICE: PROJECT WORK ON HOLD DUE TO OVERDUE PAYMENT*\n----------------------------------------\nDear *${item.clientName}*,\nRegarding project *${item.projectTitle || item.invoiceNumber}*, the pending milestone payment of *₹${(bal || 0).toLocaleString('en-IN')}* was scheduled for *${item.dueDate}* and is currently overdue.\n\n⚠️ As per our enterprise policy, *all development sprints and deployments are temporarily paused* until the outstanding balance is credited.\n\nAccounts Desk: +91 98765 43208 • Nearlook Agency`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  const exportDrillDownCSV = (title: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent = 'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${title.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadData = async () => {
    try {
      const [metricsRes, projectsRes, invoicesRes, vendorsRes, expensesRes, payRes, staffRes, clientsRes] = await Promise.all([
        fetch('/api/metrics').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/vendors').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/clients').then(r => r.json())
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (projectsRes.success) setProjects(projectsRes.data);
      if (invoicesRes.success) setInvoices(invoicesRes.data);
      if (vendorsRes.success) setVendors(vendorsRes.data);
      if (expensesRes.success) setExpenses(expensesRes.data);
      if (payRes.success) setReceipts(payRes.receipts || []);
      if (staffRes.success) setStaff(staffRes.data || []);
      if (clientsRes.success) setClients(clientsRes.data || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleDataUpdate = () => {
      loadData();
    };
    window.addEventListener('crm-data-updated', handleDataUpdate);
    return () => window.removeEventListener('crm-data-updated', handleDataUpdate);
  }, []);

  const handleMarkInvoicePaid = async (invId: string) => {
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: invId,
          amount: invoices.find(i => i.id === invId)?.totalAmount || 0,
          paymentMode: 'NEFT_RTGS',
          notes: 'Marked paid from Executive Dashboard'
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`✅ Invoice ${invId} marked as PAID. Dashboard metrics updated!`);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInvoice = async (invId: string) => {
    try {
      const res = await fetch(`/api/invoices?id=${invId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`🗑️ Invoice moved to Recycle Bin. Dashboard metrics recalculated with zero error.`);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setConfirmDeleteInv(null);
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditInvoiceForm({
      invoiceNumber: inv.invoiceNumber,
      amount: String(inv.totalAmount || inv.amount || inv.subtotal),
      dueDate: inv.dueDate || '',
      status: inv.status || 'PENDING',
      notes: inv.notes || '',
      lateFeeAssigned: Boolean(inv.lateFeeAssigned)
    });
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    setSavingInvoiceEdit(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingInvoice.id,
          invoiceNumber: editInvoiceForm.invoiceNumber,
          subtotal: Number(editInvoiceForm.amount),
          totalAmount: Number(editInvoiceForm.amount),
          amount: Number(editInvoiceForm.amount),
          dueDate: editInvoiceForm.dueDate,
          status: editInvoiceForm.status,
          notes: editInvoiceForm.notes,
          lateFeeAssigned: editInvoiceForm.lateFeeAssigned
        })
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`✅ Invoice ${editInvoiceForm.invoiceNumber} updated successfully!`);
        setEditingInvoice(null);
        loadData();
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        setTimeout(() => setActionNotice(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingInvoiceEdit(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Calculating live IT Agency Executive metrics...</p>
      </div>
    );
  }

  // Filter projects by domain if selected
  const filteredProjects = projects.filter(p => {
    if (selectedDomain === 'ALL') return true;
    if (selectedDomain === 'SOFTWARE') return p.title.toLowerCase().includes('saas') || p.title.toLowerCase().includes('software') || p.title.toLowerCase().includes('platform');
    if (selectedDomain === 'WEB') return p.title.toLowerCase().includes('web') || p.title.toLowerCase().includes('next.js') || p.title.toLowerCase().includes('portal') || p.title.toLowerCase().includes('shopify');
    if (selectedDomain === 'AI') return p.title.toLowerCase().includes('ai') || p.title.toLowerCase().includes('automation') || p.title.toLowerCase().includes('bot');
    if (selectedDomain === 'MARKETING') return p.title.toLowerCase().includes('social') || p.title.toLowerCase().includes('marketing') || p.title.toLowerCase().includes('influencer');
    return true;
  });

  // Module 5: Fixed Commitments, Burn Rate & Cash Runway
  const staffPayroll = staff.reduce((sum, s) => sum + (s.monthlySalary || 0), 0);
  const rentMonthly = expenses
    .filter(e => e.category === 'RENT')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const cloudHostingMonthly = expenses
    .filter(e => e.category === 'HOSTING_DOMAIN' || e.category === 'SAAS_TOOL')
    .reduce((sum, e) => sum + (e.amount || 0), 0);
  const utilitiesMonthly = expenses
    .filter(e => e.category === 'ELECTRICITY_EB' || e.category === 'MAINTENANCE' || e.category === 'TEA_SNACKS')
    .reduce((sum, e) => sum + (e.amount || 0), 0);

  const totalFixedMonthlyCommitments = staffPayroll + rentMonthly + cloudHostingMonthly + utilitiesMonthly;

  // Liquid Reserves & Cash Runway
  const liquidReserves = ((metrics?.totalCollectionsInBank || 0) + (metrics?.totalCollectionsInCash || 0)) || (metrics?.clientCollectedTotal || 0);
  const runwayMonths = totalFixedMonthlyCommitments > 0
    ? (liquidReserves / totalFixedMonthlyCommitments).toFixed(1)
    : '0.0';
  const isLowRunway = totalFixedMonthlyCommitments > 0 && Number(runwayMonths) < 2.0;

  // Sales Target Shortfalls ("Sales to Tally") - Target 25% Net Profit Margin
  const targetMargin = 0.25;
  const breakEvenSales = Math.round(totalFixedMonthlyCommitments / (1 - targetMargin));
  const currentSales = metrics?.thisMonthSales || 0;
  const salesTallyDiff = currentSales - breakEvenSales;
  const isSurplus = salesTallyDiff >= 0;
  const salesProgressPercent = Math.min(100, Math.round((currentSales / (breakEvenSales || 1)) * 100));

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner / Executive Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              IT & Digital Services Executive Dashboard
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
              Agency Operations
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time commercial metrics for Software, Web Development, AI Automation, and Social Media Marketing.
          </p>
        </div>

        {/* Dropdowns & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Domain Dropdown */}
          <div className="relative">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              aria-label="Filter by Service Domain"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
            >
              <option value="ALL">All IT Services</option>
              <option value="SOFTWARE">Software Development</option>
              <option value="WEB">Web Development</option>
              <option value="AI">AI Automation</option>
              <option value="MARKETING">Social Media Marketing</option>
            </select>
          </div>

          {/* Timeframe Dropdown */}
          <div className="relative">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              aria-label="Filter by Timeframe"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer shadow-sm"
            >
              <option value="THIS_MONTH">This Month (Oct 2026)</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="Q3">Q3 FY26</option>
              <option value="ALL_TIME">All Time</option>
            </select>
          </div>

          <button
            onClick={loadData}
            title="Refresh Live Metrics"
            className="p-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 transition shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm">✕</button>
        </div>
      )}

      {/* =========================================================================
          TOP 5 CORE KPI CARDS (Executive Agency Overview)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* KPI 1: Total Contract Value */}
        <div 
          onClick={() => { setActiveDrillDown('CONTRACT_VALUE'); setDrillDownSearch(''); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="group-hover:text-blue-600 font-semibold transition-colors">Total Contract Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatINR(metrics?.totalContractValue)}</p>
          <div className="flex items-center justify-between text-[11px] text-blue-600 font-semibold mt-1">
            <span>{metrics?.totalActiveProjects || 0} Projects • {metrics?.totalActiveRetainers || 0} Retainers</span>
            <span className="text-[10px] text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">Breakdown ↗</span>
          </div>
        </div>

        {/* KPI 2: This Month Sales / Project Value */}
        <div 
          onClick={() => { setActiveDrillDown('THIS_MONTH_SALES'); setDrillDownSearch(''); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="group-hover:text-emerald-600 font-semibold transition-colors">This Month Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{formatINR(metrics?.thisMonthSales)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>Recognized IT revenue</span>
            <span className="text-[10px] text-emerald-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center">Invoices ↗</span>
          </div>
        </div>

        {/* KPI 3: Total Expenses (Office + Purchases: Domain, Hosting, Freelancers) */}
        <div 
          onClick={() => { setActiveDrillDown('TOTAL_EXPENSES'); setExpenseFilter('ALL'); setDrillDownSearch(''); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-amber-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="group-hover:text-amber-600 font-semibold transition-colors">Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatINR(metrics?.totalExpenses)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1 truncate" title={`Office: ${formatINR(metrics?.officeExpensesTotal)} • Tech/Domains/Freelancers: ${formatINR(metrics?.techPurchasesTotal)}`}>
            <span>Office: {formatINR(metrics?.officeExpensesTotal)} • Tech: {formatINR(metrics?.techPurchasesTotal)}</span>
            <span className="text-[10px] text-amber-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0">Itemized ↗</span>
          </div>
        </div>

        {/* KPI 4: Vendor & Influencer Payables (Replaces Supplier & Vendor Payables) */}
        <div 
          onClick={() => { setActiveDrillDown('VENDOR_PAYABLES'); setDrillDownSearch(''); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-rose-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="group-hover:text-rose-600 font-semibold transition-colors">Vendor & Influencer Payables</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">{formatINR(metrics?.vendorAndInfluencerPayables)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>{metrics?.vendorPayablesCount || 0} pending dues</span>
            <span className="text-[10px] text-rose-600 font-bold flex items-center">Breakdown ↗</span>
          </div>
        </div>

        {/* KPI 5: Client Invoices & Balance to be Paid */}
        <div 
          onClick={() => { setActiveDrillDown('RECEIVABLES'); setDrillDownSearch(''); }}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-purple-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span className="group-hover:text-purple-600 font-semibold transition-colors">Balance to be Paid (Clients)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-700 mt-2">{formatINR(metrics?.clientBalanceToBePaid)}</p>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1 truncate" title={`Total Invoiced: ${formatINR(metrics?.clientInvoicesTotal)} | Paid: ${formatINR(metrics?.clientCollectedTotal)}`}>
            <span>Invoiced: {formatINR(metrics?.clientInvoicesTotal)} • Paid: {formatINR(metrics?.clientCollectedTotal)}</span>
            <span className="text-[10px] text-purple-600 font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center shrink-0">Dues ↗</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODULE: COLLECTION FORECASTS & MONTHLY CLOSED BUSINESS (Requirement 3 & 7)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Forecast 1: To Be Collected Today */}
        <div className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 p-4 rounded-xl border border-amber-200 shadow-sm hover:border-amber-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>To Be Collected Today</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-amber-800 mt-2 font-mono">{formatINR(metrics?.toBeCollectedToday)}</p>
          <div className="flex items-center text-[10px] text-amber-700 font-semibold mt-1">
            <span>Matured milestone installments</span>
          </div>
        </div>

        {/* Forecast 2: To Be Collected This Month */}
        <div className="bg-gradient-to-br from-blue-500/10 via-white to-indigo-500/5 p-4 rounded-xl border border-blue-200 shadow-sm hover:border-blue-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>To Be Collected This Month</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-blue-800 mt-2 font-mono">{formatINR(metrics?.toBeCollectedThisMonth)}</p>
          <div className="flex items-center text-[10px] text-blue-700 font-semibold mt-1">
            <span>Nov 2026 receivables pipeline</span>
          </div>
        </div>

        {/* Forecast 3: To Be Collected Next Month */}
        <div className="bg-gradient-to-br from-purple-500/10 via-white to-purple-500/5 p-4 rounded-xl border border-purple-200 shadow-sm hover:border-purple-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>To Be Collected Next Month</span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-800 mt-2 font-mono">{formatINR(metrics?.toBeCollectedNextMonth)}</p>
          <div className="flex items-center text-[10px] text-purple-700 font-semibold mt-1">
            <span>Dec 2026 milestone cashflow</span>
          </div>
        </div>

        {/* Closed Business: This Month's Closed Business */}
        <div className="bg-gradient-to-br from-emerald-500/10 via-white to-emerald-500/5 p-4 rounded-xl border border-emerald-200 shadow-sm hover:border-emerald-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>This Month Closed Business</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-700 mt-2 font-mono">{formatINR(metrics?.thisMonthClosedBusiness)}</p>
          <div className="flex items-center text-[10px] text-emerald-700 font-semibold mt-1">
            <span>100% full balance cleared</span>
          </div>
        </div>

        {/* Monthly Statutory GST Payables */}
        <div 
          onClick={() => { setActiveDrillDown('GST_PAYABLE'); setDrillDownSearch(''); }}
          className="bg-gradient-to-br from-indigo-500/10 via-white to-indigo-500/5 p-4 rounded-xl border border-indigo-200 shadow-sm hover:shadow-lg hover:border-indigo-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span className="group-hover:text-indigo-700 transition-colors">GST Payables (Nov 1-30)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-indigo-900 mt-2 font-mono">{formatINR(metrics?.gstPayableThisMonth || metrics?.totalCollectedTaxLiability)}</p>
          <div className="flex items-center justify-between text-[10px] text-indigo-700 font-semibold mt-1">
            <span>Statutory 18% liability</span>
            <span className="text-[10px] text-indigo-600 font-bold flex items-center">Tax Ledger ↗</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODULE 4 & 5: 2-DAY UPCOMING DUES & PROJECT ON HOLD ACTION CENTER
         ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black shadow-md shadow-amber-500/20">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  2-Day Upcoming Dues & Project On Hold Action Center
                </h3>
                <span className="bg-amber-100 text-amber-900 text-[10px] font-black px-2 py-0.5 rounded-full border border-amber-300">
                  Nov 22, 2026 Target
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Automated one-click client WhatsApp reminders for dues in 2 days and formal sprint pause notices for overdue balances.
              </p>
            </div>
          </div>
          <Link
            href="/billing"
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1 shrink-0"
          >
            <span>Open Billing Ledger</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card A: Payments Due in 2 Days (e.g. Nov 22) */}
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
                <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Upcoming Dues in 2 Days ({metrics?.twoDayUpcomingDuesCount || 0})
                </span>
                <span className="font-mono font-black text-amber-900 text-sm">
                  {formatINR(metrics?.twoDayUpcomingDuesAmount || 100000)}
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {metrics?.twoDayUpcomingDuesList && metrics.twoDayUpcomingDuesList.length > 0 ? (
                  metrics.twoDayUpcomingDuesList.map((item, idx) => (
                    <div key={idx} className="p-3 bg-white rounded-lg border border-amber-200 shadow-xs flex items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">{item.clientName}</span>
                        <span className="text-[11px] text-blue-700 font-semibold block">{item.projectTitle}</span>
                        <span className="text-[10px] text-slate-500 font-mono">Installment Due: {item.dueDate}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-slate-900 text-xs block">{formatINR(item.amount)}</span>
                        <a
                          href={get2DayReminderWhatsAppUrl(item)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-[10px] inline-flex items-center gap-1 shadow-xs transition"
                        >
                          <Bell className="w-3 h-3" />
                          Send 2-Day Reminder (WA)
                        </a>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                    No scheduled dues maturing in 2 days.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card B: Overdue Accounts & Sprint Pause (On Hold) Queue */}
          <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-rose-200/60">
                <span className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                  <PauseCircle className="w-4 h-4 text-rose-600" />
                  Overdue Accounts & Project On Hold Notice Queue
                </span>
                <span className="font-mono font-black text-rose-700 text-sm">
                  {invoices.filter(i => {
                    const isSettled = i.status === 'PAID' || i.status === 'CLOSED';
                    const bal = i.balanceDue !== undefined ? i.balanceDue : (isSettled ? 0 : i.totalAmount);
                    return bal > 0 && i.dueDate && i.dueDate < '2026-11-20';
                  }).length} Accounts
                </span>
              </div>

              <div className="mt-3 space-y-2.5">
                {invoices.filter(i => {
                  const isSettled = i.status === 'PAID' || i.status === 'CLOSED';
                  const bal = i.balanceDue !== undefined ? i.balanceDue : (isSettled ? 0 : i.totalAmount);
                  return bal > 0 && i.dueDate && i.dueDate < '2026-11-20';
                }).length === 0 ? (
                  <div className="p-3 bg-white rounded-lg border border-slate-200 text-center text-xs text-slate-500">
                    No overdue client accounts. All development velocity active.
                  </div>
                ) : (
                  invoices.filter(i => {
                    const isSettled = i.status === 'PAID' || i.status === 'CLOSED';
                    const bal = i.balanceDue !== undefined ? i.balanceDue : (isSettled ? 0 : i.totalAmount);
                    return bal > 0 && i.dueDate && i.dueDate < '2026-11-20';
                  }).map(inv => (
                    <div key={inv.id} className="p-3 bg-white rounded-lg border border-rose-200 shadow-xs flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-xs">{inv.clientName}</span>
                          {inv.delayReason === 'OUR_MISTAKE_PROJECT_DELAY' && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                              ⚠️ Work Delay (Our Mistake)
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-600 block">{inv.projectTitle || inv.invoiceNumber}</span>
                        <span className="text-[10px] text-rose-600 font-mono font-semibold">Overdue since {inv.dueDate}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-black text-rose-600 text-xs block">
                          {formatINR(inv.balanceDue !== undefined ? inv.balanceDue : inv.totalAmount)}
                        </span>
                        <a
                          href={getOnHoldWhatsAppUrl(inv)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] inline-flex items-center gap-1 shadow-xs transition"
                        >
                          <PauseCircle className="w-3 h-3" />
                          Send On Hold Notice (WA)
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          MODULE 5: FIXED COMMITMENTS, RUNWAY & SALES TO TALLY COMMAND CENTER
         ========================================================================= */}
      {isLowRunway && (
        <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-rose-900 shadow-sm animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm">Low Operating Liquidity Alert: Cash Runway is {runwayMonths} Months</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                Monthly fixed obligations require {formatINR(totalFixedMonthlyCommitments)}. Accelerate client milestone receivables to avoid operating cash strain.
              </p>
            </div>
          </div>
          <Link
            href="/billing"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shrink-0 text-center"
          >
            Collect Invoices →
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Monthly Fixed Commitments */}
        <div 
          onClick={() => { setActiveDrillDown('FIXED_LIABILITIES'); setDrillDownSearch(''); }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-amber-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-amber-700 transition-colors">Fixed Monthly Liabilities</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {formatINR(totalFixedMonthlyCommitments)}
            <span className="text-xs font-normal text-slate-400 font-sans"> / mo</span>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] text-slate-600 font-medium">
            <div className="flex justify-between">
              <span>Core Staff Salaries ({staff.length} team):</span>
              <span className="font-bold text-slate-900 font-mono">{formatINR(staffPayroll)}</span>
            </div>
            <div className="flex justify-between">
              <span>Office Lease Rent:</span>
              <span className="font-bold text-slate-900 font-mono">{formatINR(rentMonthly)}</span>
            </div>
            <div className="flex justify-between">
              <span>Cloud/Server Hosting & SaaS:</span>
              <span className="font-bold text-slate-900 font-mono">{formatINR(cloudHostingMonthly)}</span>
            </div>
            <div className="flex justify-between">
              <span>Electricity EB & Maintenance:</span>
              <span className="font-bold text-slate-900 font-mono">{formatINR(utilitiesMonthly)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-amber-700 font-bold">
            <span>View Itemized Obligations</span>
            <span>Breakdown ↗</span>
          </div>
        </div>

        {/* Card 2: Cash Runway & Operating Liquidity */}
        <div 
          onClick={() => { setActiveDrillDown('CASH_RUNWAY'); setDrillDownSearch(''); }}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-400 cursor-pointer transition-all duration-200 group relative"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-emerald-700 transition-colors">Operating Cash Runway</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold group-hover:scale-110 transition-transform ${Number(runwayMonths) >= 3.0 ? 'bg-emerald-50 text-emerald-600' : Number(runwayMonths) >= 2.0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
              }`}>
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-black font-mono ${Number(runwayMonths) >= 3.0 ? 'text-emerald-600' : Number(runwayMonths) >= 2.0 ? 'text-amber-600' : 'text-rose-600'
              }`}>
              {runwayMonths}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase">Months Runway</span>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${Number(runwayMonths) >= 3.0 ? 'bg-emerald-500' : Number(runwayMonths) >= 2.0 ? 'bg-amber-500' : 'bg-rose-500'
                }`}
              style={{ width: `${Math.min(100, (Number(runwayMonths) / 6) * 100)}%` }}
            />
          </div>

          <div className="mt-3 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Liquid Cash in Hand & Bank:</span>
              <strong className="text-slate-800 font-mono">{formatINR(liquidReserves)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Monthly Burn Rate:</span>
              <span className="font-bold text-slate-700 font-mono">{formatINR(totalFixedMonthlyCommitments)}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-emerald-700 font-bold">
            <span>View Bank & Reserve Ledger</span>
            <span>Ledger ↗</span>
          </div>
        </div>

        {/* Card 3: Sales Target Shortfall ("Sales to Tally") */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sales to Tally Overheads</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${isSurplus ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'
              }`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            {isSurplus ? (
              <div className="text-2xl font-black text-emerald-600 font-mono">
                +{formatINR(salesTallyDiff)}
                <span className="block text-[11px] font-bold text-emerald-700">Net Surplus Achieved (Target Margin: 25%)</span>
              </div>
            ) : (
              <div className="text-2xl font-black text-orange-600 font-mono">
                {formatINR(Math.abs(salesTallyDiff))}
                <span className="block text-[11px] font-bold text-orange-700">Shortfall to Tally (Target Margin: 25%)</span>
              </div>
            )}
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${isSurplus ? 'bg-emerald-500' : 'bg-orange-500'}`}
              style={{ width: `${salesProgressPercent}%` }}
            />
          </div>

          <div className="mt-3 text-[11px] text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Target Sales Required:</span>
              <strong className="text-slate-800 font-mono">{formatINR(breakEvenSales)}</strong>
            </div>
            <div className="flex justify-between">
              <span>Achieved Sales This Month:</span>
              <strong className="text-slate-800 font-mono">{formatINR(currentSales)}</strong>
            </div>
            <div className="flex justify-between font-bold text-slate-700">
              <span>P&L Progress:</span>
              <span className={isSurplus ? 'text-emerald-700' : 'text-orange-700'}>{salesProgressPercent}% of target</span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          GST STATUTORY COMPLIANCE BANNER
         ========================================================================= */}
      <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/50 p-4 rounded-xl border border-purple-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-sm text-slate-900 tracking-tight">
                  Total Collected Tax Liability Payable (GST 18%)
                </h3>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-300">
                  Statutory Compliance
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time statutory GST tax liability collected across software milestone invoices & digital retainer contracts.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Total Billed Tax</span>
              <span className="font-bold text-slate-700 text-xs">
                {formatINR((metrics?.clientInvoicesTotal || 0) * 0.18)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase font-semibold block">Pending Collection</span>
              <span className="font-bold text-amber-700 text-xs">
                {formatINR((metrics?.clientBalanceToBePaid || 0) * 0.18)}
              </span>
            </div>
            <div className="text-right pl-4 border-l border-purple-200">
              <span className="text-[10px] text-purple-700 uppercase font-bold block">Tax Liability Payable</span>
              <span className="font-extrabold text-purple-700 text-sm">
                {formatINR(metrics?.totalCollectedTaxLiability || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          IT SERVICES CORE CAPABILITIES (Software, Web, AI Automation, Social Media)
         ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Software Development */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-400 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Laptop className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded">Enterprise</span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Software Development</h4>
          <p className="text-[11px] text-slate-500 mt-1">Custom SaaS, Microservices, API Integrations & Backend Engines</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Active Contracts</span>
            <span className="text-slate-900 font-bold">{projects.filter(p => p.title.toLowerCase().includes('saas') || p.title.toLowerCase().includes('platform')).length || 2} Projects</span>
          </div>
        </div>

        {/* Web Development */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-emerald-400 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Globe className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded">Full Stack</span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Web Development</h4>
          <p className="text-[11px] text-slate-500 mt-1">Next.js 14, React, Headless Shopify, Tailwind & Web Portals</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Active Portals</span>
            <span className="text-slate-900 font-bold">{projects.filter(p => p.title.toLowerCase().includes('web') || p.title.toLowerCase().includes('portal') || p.title.toLowerCase().includes('alpha')).length || 2} Live</span>
          </div>
        </div>

        {/* AI Automation */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-purple-400 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-purple-100 text-purple-800 rounded">AI Workflows</span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">AI Automation</h4>
          <p className="text-[11px] text-slate-500 mt-1">Autonomous Agents, LLM RAG Pipelines, Voice & Chatbot Integrations</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Pipeline Value</span>
            <span className="text-purple-700 font-bold">₹18,50,000</span>
          </div>
        </div>

        {/* Social Media Marketing */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-orange-400 transition">
          <div className="flex items-center justify-between mb-3">
            <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 bg-orange-100 text-orange-800 rounded">Growth & Reach</span>
          </div>
          <h4 className="font-bold text-sm text-slate-900">Social Media Marketing</h4>
          <p className="text-[11px] text-slate-500 mt-1">Viral Video Production, Meta Ads, LinkedIn Personal Branding & Influencers</p>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
            <span className="text-slate-500">Influencer Dues</span>
            <span className="text-orange-700 font-bold">₹45,000</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          CLIENT INVOICES & BALANCE TO BE PAID (LEDGER TABLE)
         ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Receipt className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Client Invoices & Receivables Status</h2>
              <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Balance to be Paid: {formatINR(metrics?.clientBalanceToBePaid)}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Track client invoices, collected amounts, balance dues, and real-time payment reconciliations.
            </p>
          </div>
          <Link
            href="/quotations"
            className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center"
          >
            <span>Create New Invoice / Quotation</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Client Name</th>
                <th className="py-3 px-4">Service Domain</th>
                <th className="py-3 px-4 text-right">Invoice Amount</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No client invoices found.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const balance = isPaid ? 0 : inv.totalAmount;
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono font-bold text-slate-800">{inv.invoiceNumber || inv.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{inv.clientName}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[10px] font-medium text-slate-700">
                          {inv.type ? inv.type.replace(/_/g, ' ') : 'Development Retainer'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatINR(inv.totalAmount)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${isPaid
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                          }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-rose-600">
                        {formatINR(balance)}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditInvoice(inv)}
                            className="p-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setInspectInvoice(inv)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                            title="View Invoice Details & Splits"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {!isPaid ? (
                            <button
                              onClick={() => handleMarkInvoicePaid(inv.id)}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition text-[11px]"
                            >
                              Mark Paid
                            </button>
                          ) : (
                            <span className="text-[11px] text-emerald-600 font-bold px-1.5">Settled ✓</span>
                          )}
                          <button
                            onClick={() => setConfirmDeleteInv(inv)}
                            className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Delete Invoice to Recycle Bin"
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
          MODULE 5: AGGREGATE PAYABLES FEED (Vendors, Influencers & Payroll Dues)
         ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-rose-600" />
              <h2 className="text-base font-bold text-slate-900">Aggregate Payables & Outflow Feed</h2>
              <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Total Liabilities: {formatINR(
                  vendors.reduce((s, v) => s + (v.balanceDue || 0), 0) +
                  staff.filter(s => s.isSalaryOverdue).reduce((s, st) => s + (st.monthlySalary || 0), 0)
                )}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consolidated queue of all IT vendor balances, cloud/server dues, influencer marketing retainers, and staff payroll liabilities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/vendors"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center"
            >
              <span>Vendors</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
            <Link
              href="/staff"
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center"
            >
              <span>Payroll</span>
              <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Payee / Creditor</th>
                <th className="py-3 px-4">Payable Type</th>
                <th className="py-3 px-4">Service Category</th>
                <th className="py-3 px-4 text-right">Total Obligation</th>
                <th className="py-3 px-4 text-right">Paid to Date</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Due Timeline</th>
                <th className="py-3 px-4 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {vendors.length === 0 && staff.filter(s => s.isSalaryOverdue).length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-400">
                    No active vendor or payroll payables due. Operating obligations clear.
                  </td>
                </tr>
              ) : (
                <>
                  {/* Overdue Staff Payroll */}
                  {staff.filter(s => s.isSalaryOverdue).map((st) => (
                    <tr key={`staff-${st.id}`} className="hover:bg-rose-50/40 bg-rose-50/20 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {st.name}
                        <span className="ml-2 text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                          Staff Member
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                          PAYROLL
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {st.team.replace(/_/g, ' ')} Base Salary
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatINR(st.monthlySalary)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-400 font-bold font-mono">
                        ₹0
                      </td>
                      <td className="py-3 px-4 text-right font-black text-rose-600 font-mono">
                        {formatINR(st.monthlySalary)}
                      </td>
                      <td className="py-3 px-4 text-center text-rose-600 font-bold text-[11px]">
                        Overdue Salary
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/staff"
                          className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition text-[11px]"
                        >
                          Process Slip
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {/* Vendor Payables */}
                  {vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {v.companyName}
                        {v.followerCount && (
                          <span className="ml-2 text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded font-normal">
                            {v.followerCount} Followers
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${v.vendorType === 'INFLUENCER'
                          ? 'bg-purple-100 text-purple-800'
                          : v.vendorType === 'FREELANCER'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-800'
                          }`}>
                          {v.vendorType || 'VENDOR'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                        {v.serviceCategory.replace(/_/g, ' ')}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 font-mono">
                        {formatINR(v.totalPayable)}
                      </td>
                      <td className="py-3 px-4 text-right text-emerald-600 font-bold font-mono">
                        {formatINR(v.advancePaid)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-rose-600 font-mono">
                        {formatINR(v.balanceDue)}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-500 font-mono text-[11px]">
                        {v.dueDate || 'Immediate'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href="/vendors"
                          className="px-2.5 py-1 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition text-[11px]"
                        >
                          Settle Dues
                        </Link>
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          ACTIVE IT PROJECTS OVERVIEW (Software, Web, AI, Social Media)
         ========================================================================= */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <FolderKanban className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900">Active IT Client Projects</h2>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {filteredProjects.length} Projects
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Software platforms, web portals, and AI automation milestones in flight</p>
          </div>
          <Link
            href="/projects"
            className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center"
          >
            <span>View All Projects</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => {
            const pct = p.totalValue > 0 ? Math.round((p.collectedAmount / p.totalValue) * 100) : 0;
            return (
              <div key={p.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-tight">{p.title}</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{p.clientName}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 whitespace-nowrap">
                    {p.status}
                  </span>
                </div>

                <div className="space-y-1.5 my-3">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Contract Value:</span>
                    <span className="text-slate-900">{formatINR(p.totalValue)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Collected:</span>
                    <span className="text-emerald-600">{formatINR(p.collectedAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-slate-500">Balance Due:</span>
                    <span className="text-rose-600">{formatINR(p.balanceDue)}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-2">
                  <div className="bg-amber-500 h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%` }}></div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                  <span>Due: {p.dueDate || 'Ongoing'}</span>
                  <Link href="/projects" className="text-amber-600 font-bold hover:underline">
                    Milestones →
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inspect Invoice Modal */}
      {inspectInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold">{inspectInvoice.invoiceNumber || inspectInvoice.id}</h3>
                  <p className="text-xs text-slate-400">{inspectInvoice.clientName}</p>
                </div>
              </div>
              <button onClick={() => setInspectInvoice(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Service Type</span>
                  <span className="font-bold text-slate-900">{inspectInvoice.type ? inspectInvoice.type.replace(/_/g, ' ') : 'Retainer'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${inspectInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                    {inspectInvoice.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Due Date</span>
                  <span className="font-mono font-bold text-slate-900">{inspectInvoice.dueDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Total Amount</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{formatINR(inspectInvoice.totalAmount)}</span>
                </div>
              </div>

              {inspectInvoice.lineItems && inspectInvoice.lineItems.length > 0 && (
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-2">Billed Line Items</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {inspectInvoice.lineItems.map((li, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 block">{li.description}</span>
                          <span className="text-[10px] text-slate-400">Qty: {li.quantity} @ {formatINR(li.rate)}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatINR(li.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {inspectInvoice.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Notes / Payment Terms</span>
                  <p className="text-slate-700 italic mt-0.5">{inspectInvoice.notes}</p>
                </div>
              )}

              {/* Split Payment History */}
              {(() => {
                const splits = receipts.filter(r =>
                  r.invoiceId === inspectInvoice.id ||
                  (inspectInvoice.projectId && r.projectId === inspectInvoice.projectId) ||
                  (!inspectInvoice.projectId && r.clientId === inspectInvoice.clientId)
                );

                return (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-slate-800 font-bold text-xs uppercase block mb-2">
                      Split Payment History ({splits.length} logged)
                    </span>
                    {splits.length === 0 ? (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center text-slate-400 text-xs italic">
                        No split payments recorded yet for this invoice.
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-48 overflow-y-auto">
                        {splits.map((split, idx) => (
                          <div key={split.id || idx} className="p-2.5 bg-white flex items-center justify-between text-xs hover:bg-slate-50 transition">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800">{split.receiptNumber}</span>
                                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                                  {split.milestoneLabel}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-500 mt-0.5">
                                Credited: {split.createdAt ? split.createdAt.split('T')[0] : 'N/A'} • {split.paymentMethod}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono font-black text-emerald-600 block">+ {formatINR(split.amount)}</span>
                              <span className="text-[10px] text-slate-400">
                                Bal after: <strong className="font-mono text-slate-700">{formatINR(split.remainingBalanceDue || 0)}</strong>
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  onClick={() => {
                    const target = inspectInvoice;
                    setInspectInvoice(null);
                    handleOpenEditInvoice(target);
                  }}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Invoice</span>
                </button>

                <button
                  onClick={() => setInspectInvoice(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Invoice Modal */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Pencil className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold">Edit Invoice {editingInvoice.invoiceNumber}</h3>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInvoiceEdit} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Invoice Number *</label>
                <input
                  type="text"
                  required
                  value={editInvoiceForm.invoiceNumber}
                  onChange={e => setEditInvoiceForm({ ...editInvoiceForm, invoiceNumber: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Total Amount (₹) *</label>
                <input
                  type="number"
                  required
                  value={editInvoiceForm.amount}
                  onChange={e => setEditInvoiceForm({ ...editInvoiceForm, amount: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Payment Due Date</label>
                <input
                  type="date"
                  value={editInvoiceForm.dueDate}
                  onChange={e => setEditInvoiceForm({ ...editInvoiceForm, dueDate: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Invoice Status</label>
                <select
                  value={editInvoiceForm.status}
                  onChange={e => setEditInvoiceForm({ ...editInvoiceForm, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="PENDING">PENDING (Unpaid)</option>
                  <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                  <option value="PAID">PAID (Settled in full)</option>
                  <option value="OVERDUE">OVERDUE</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  value={editInvoiceForm.notes}
                  onChange={e => setEditInvoiceForm({ ...editInvoiceForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl">
                <input
                  type="checkbox"
                  id="dashEditLateFee"
                  checked={editInvoiceForm.lateFeeAssigned}
                  onChange={e => setEditInvoiceForm({ ...editInvoiceForm, lateFeeAssigned: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="dashEditLateFee" className="text-amber-900 font-bold text-xs cursor-pointer">
                  Assign 2% per week late fee
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingInvoiceEdit}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50"
                >
                  {savingInvoiceEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          INTERACTIVE DRILL-DOWN MODALS (Requirement 4)
         ========================================================================= */}
      {activeDrillDown && (() => {
        const query = drillDownSearch.toLowerCase().trim();
        const now = new Date();
        const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

        // 1. CONTRACT_VALUE
        if (activeDrillDown === 'CONTRACT_VALUE') {
          const rawItems = [
            ...projects.map(p => {
              const base = Math.round((p.totalValue || 0) / 1.18);
              const gst = (p.totalValue || 0) - base;
              return {
                id: p.id,
                title: p.title,
                client: p.clientName || 'Enterprise Client',
                domain: p.category || (p.domain || 'Software / Web'),
                base,
                gst,
                total: p.totalValue || 0,
                status: p.status || 'IN_PROGRESS'
              };
            }),
            ...clients.filter(c => c.clientType === 'RECURRING_RETAINER' && c.status === 'ACTIVE').map(c => {
              const total = (c.monthlyRetainerAmount || 0) * 12;
              const base = Math.round(total / 1.18);
              const gst = total - base;
              return {
                id: c.id,
                title: `${c.businessName} (Annualized 12-Mo Retainer)`,
                client: c.contactName || c.businessName,
                domain: 'RECURRING RETAINER',
                base,
                gst,
                total,
                status: 'ACTIVE'
              };
            })
          ];
          const items = rawItems.filter(i =>
            !query || i.title.toLowerCase().includes(query) || i.client.toLowerCase().includes(query) || i.domain.toLowerCase().includes(query)
          );
          const totalBase = items.reduce((s, i) => s + i.base, 0);
          const totalGst = items.reduce((s, i) => s + i.gst, 0);
          const totalVal = items.reduce((s, i) => s + i.total, 0);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">Total Contract Value Breakdown</h3>
                        <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-bold border border-blue-700/50">
                          {items.length} Contracts
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Itemized active projects and active annualized client retainers</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search project, client, or domain..."
                      value={drillDownSearch}
                      onChange={e => setDrillDownSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => exportDrillDownCSV(
                      'Total_Contract_Value_Breakdown',
                      ['Project / Contract', 'Client', 'Domain / Scope', 'Base Value (INR)', 'GST 18% (INR)', 'Total Contract Value (INR)', 'Status'],
                      items.map(i => [i.title, i.client, i.domain, i.base, i.gst, i.total, i.status])
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-2">Project / Contract</th>
                        <th className="pb-2">Client</th>
                        <th className="pb-2">Domain</th>
                        <th className="pb-2 text-right">Taxable Base</th>
                        <th className="pb-2 text-right">GST (18%)</th>
                        <th className="pb-2 text-right">Total Contract</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold text-slate-900">{item.title}</td>
                          <td className="py-2.5 text-slate-600">{item.client}</td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {item.domain}
                            </span>
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-600">{formatINR(item.base)}</td>
                          <td className="py-2.5 text-right font-mono text-amber-600">{formatINR(item.gst)}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatINR(item.total)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Total Aggregated:</span>
                    <span className="text-slate-300">Base: <strong className="font-mono text-white">{formatINR(totalBase)}</strong></span>
                    <span className="text-amber-400">GST 18%: <strong className="font-mono text-white">{formatINR(totalGst)}</strong></span>
                    <span className="text-emerald-400">Total Contract Value: <strong className="font-mono text-emerald-300 text-sm font-black">{formatINR(totalVal)}</strong></span>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 2. THIS_MONTH_SALES
        if (activeDrillDown === 'THIS_MONTH_SALES') {
          const rawItems = invoices
            .filter(i => (i.issueDate || i.createdAt || '').startsWith(currentYearMonth) || (i.paidDate && i.paidDate.startsWith(currentYearMonth)))
            .map(i => {
              const base = i.subtotal || Math.round((i.totalAmount || 0) / 1.18);
              const gst = i.taxAmount !== undefined && i.taxAmount > 0 ? i.taxAmount : ((i.totalAmount || 0) - base);
              return {
                id: i.id,
                invNum: i.invoiceNumber,
                date: i.issueDate || i.createdAt?.split('T')[0] || '',
                projectName: i.projectTitle || 'Milestone Delivery',
                clientName: i.clientName || 'Client',
                base,
                gst,
                total: i.totalAmount || 0,
                status: i.status
              };
            });
          const items = rawItems.filter(i =>
            !query || i.invNum.toLowerCase().includes(query) || i.projectName.toLowerCase().includes(query) || i.clientName.toLowerCase().includes(query)
          );
          const totalBase = items.reduce((s, i) => s + i.base, 0);
          const totalGst = items.reduce((s, i) => s + i.gst, 0);
          const totalVal = items.reduce((s, i) => s + i.total, 0);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">This Month Sales & Invoices</h3>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 text-[10px] font-bold border border-emerald-700/50">
                          {items.length} Invoices
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Invoices issued and closed during active billing cycle ({currentYearMonth})</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search invoice #, client, project..."
                      value={drillDownSearch}
                      onChange={e => setDrillDownSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    onClick={() => exportDrillDownCSV(
                      'This_Month_Sales_Invoices',
                      ['Invoice #', 'Issue Date', 'Project Name', 'Client Name', 'Taxable Base (INR)', 'GST (INR)', 'Total Amount (INR)', 'Status'],
                      items.map(i => [i.invNum, i.date, i.projectName, i.clientName, i.base, i.gst, i.total, i.status])
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-2">Invoice #</th>
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Client / Project</th>
                        <th className="pb-2 text-right">Taxable Base</th>
                        <th className="pb-2 text-right">GST (18%)</th>
                        <th className="pb-2 text-right">Total Amount</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-emerald-700">{item.invNum}</td>
                          <td className="py-2.5 text-slate-500 font-mono text-[11px]">{item.date}</td>
                          <td className="py-2.5">
                            <p className="font-bold text-slate-900">{item.projectName}</p>
                            <p className="text-[11px] text-slate-500">{item.clientName}</p>
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-600">{formatINR(item.base)}</td>
                          <td className="py-2.5 text-right font-mono text-amber-600">{formatINR(item.gst)}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatINR(item.total)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Sales Total:</span>
                    <span className="text-slate-300">Base: <strong className="font-mono text-white">{formatINR(totalBase)}</strong></span>
                    <span className="text-amber-400">GST: <strong className="font-mono text-white">{formatINR(totalGst)}</strong></span>
                    <span className="text-emerald-400">Total Billed: <strong className="font-mono text-emerald-300 text-sm font-black">{formatINR(totalVal)}</strong></span>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 3. GST_PAYABLE
        if (activeDrillDown === 'GST_PAYABLE') {
          const rawItems = invoices
            .filter(i =>
              (i.issueDate && i.issueDate.startsWith(currentYearMonth)) ||
              (i.createdAt && i.createdAt.startsWith(currentYearMonth)) ||
              (i.closedMonth && i.closedMonth.startsWith(currentYearMonth))
            )
            .map(i => {
              const total = i.totalAmount || 0;
              let base = 0;
              let gst = 0;
              if (i.internalTaxCalculated && i.internalTaxCalculated > 0) {
                gst = i.internalTaxCalculated;
                base = total - gst;
              } else if (i.gstType === 'INCLUSIVE_18') {
                base = Math.round(total / 1.18);
                gst = total - base;
              } else if (i.gstType === 'ADDITIONAL_18') {
                base = i.subtotal || total;
                gst = Math.round(base * 0.18);
              } else {
                base = total;
                gst = 0;
              }
              const cgst = Math.round(gst / 2);
              const sgst = gst - cgst;
              return {
                id: i.id,
                invNum: i.invoiceNumber,
                clientName: i.clientName || 'Client',
                projectName: i.projectTitle || 'Milestone Delivery',
                base,
                cgst,
                sgst,
                totalGst: gst,
                status: i.status
              };
            });
          const items = rawItems.filter(i =>
            !query || i.invNum.toLowerCase().includes(query) || i.clientName.toLowerCase().includes(query) || i.projectName.toLowerCase().includes(query)
          );
          const totalBase = items.reduce((s, i) => s + i.base, 0);
          const totalCgst = items.reduce((s, i) => s + i.cgst, 0);
          const totalSgst = items.reduce((s, i) => s + i.sgst, 0);
          const totalGst = items.reduce((s, i) => s + i.totalGst, 0);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <Landmark className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">GST Payable Statutory Tax Ledger</h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 text-[10px] font-bold border border-indigo-700/50">
                          GSTR-1 Monthly Ledger
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Statutory 18% GST (CGST 9% + SGST 9%) output liability to remit</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search invoice, client or project..."
                      value={drillDownSearch}
                      onChange={e => setDrillDownSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    onClick={() => exportDrillDownCSV(
                      'GST_Payable_Statutory_Ledger',
                      ['Invoice #', 'Client Name', 'Project', 'Taxable Base (INR)', 'CGST 9% (INR)', 'SGST 9% (INR)', 'Total GST (INR)', 'Status'],
                      items.map(i => [i.invNum, i.clientName, i.projectName, i.base, i.cgst, i.sgst, i.totalGst, i.status])
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-2">Invoice #</th>
                        <th className="pb-2">Client Name</th>
                        <th className="pb-2">Project</th>
                        <th className="pb-2 text-right">Taxable Base</th>
                        <th className="pb-2 text-right">CGST (9%)</th>
                        <th className="pb-2 text-right">SGST (9%)</th>
                        <th className="pb-2 text-right">Total GST (18%)</th>
                        <th className="pb-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-indigo-700">{item.invNum}</td>
                          <td className="py-2.5 font-bold text-slate-900">{item.clientName}</td>
                          <td className="py-2.5 text-slate-600">{item.projectName}</td>
                          <td className="py-2.5 text-right font-mono text-slate-600">{formatINR(item.base)}</td>
                          <td className="py-2.5 text-right font-mono text-indigo-600">{formatINR(item.cgst)}</td>
                          <td className="py-2.5 text-right font-mono text-indigo-600">{formatINR(item.sgst)}</td>
                          <td className="py-2.5 text-right font-mono font-black text-indigo-900">{formatINR(item.totalGst)}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              item.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Statutory Totals:</span>
                    <span className="text-slate-300">Taxable Base: <strong className="font-mono text-white">{formatINR(totalBase)}</strong></span>
                    <span className="text-indigo-300">CGST (9%): <strong className="font-mono text-white">{formatINR(totalCgst)}</strong></span>
                    <span className="text-indigo-300">SGST (9%): <strong className="font-mono text-white">{formatINR(totalSgst)}</strong></span>
                    <span className="text-indigo-400">Total GST Due: <strong className="font-mono text-indigo-300 text-sm font-black">{formatINR(totalGst)}</strong></span>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 4. TOTAL_EXPENSES
        if (activeDrillDown === 'TOTAL_EXPENSES') {
          const rawItems = expenses.map(e => {
            const expTitle = e.description || e.vendorName || (e as any).title || 'General Expense';
            const isOffice = isOfficeExpense(e.category, expTitle);
            return {
              id: e.id,
              date: e.date || e.createdAt?.split('T')[0] || '',
              title: expTitle,
              category: e.category,
              bucket: isOffice ? ('OFFICE' as const) : ('TECH' as const),
              paymentMode: e.paymentMode || (e as any).paymentMethod || 'Bank Transfer',
              amount: e.amount || 0
            };
          });

          const filteredByBucket = expenseFilter === 'ALL'
            ? rawItems
            : rawItems.filter(e => e.bucket === expenseFilter);

          const items = filteredByBucket.filter(i =>
            !query || i.title.toLowerCase().includes(query) || i.category.toLowerCase().includes(query) || i.paymentMode.toLowerCase().includes(query)
          );

          const totalOffice = rawItems.filter(e => e.bucket === 'OFFICE').reduce((s, e) => s + e.amount, 0);
          const totalTech = rawItems.filter(e => e.bucket === 'TECH').reduce((s, e) => s + e.amount, 0);
          const displayedTotal = items.reduce((s, e) => s + e.amount, 0);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">Expenses Itemized Ledger</h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 text-[10px] font-bold border border-amber-700/50">
                          {items.length} Entries
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Strict Two-Bucket Classification: Office vs. Tech Purchases (Zero Gap)</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpenseFilter('ALL')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        expenseFilter === 'ALL' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All ({rawItems.length})
                    </button>
                    <button
                      onClick={() => setExpenseFilter('OFFICE')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        expenseFilter === 'OFFICE' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-amber-800 hover:bg-amber-50'
                      }`}
                    >
                      🏢 Office ({rawItems.filter(e => e.bucket === 'OFFICE').length})
                    </button>
                    <button
                      onClick={() => setExpenseFilter('TECH')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        expenseFilter === 'TECH' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-indigo-800 hover:bg-indigo-50'
                      }`}
                    >
                      💻 Tech & Cloud ({rawItems.filter(e => e.bucket === 'TECH').length})
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search expense, vendor, mode..."
                        value={drillDownSearch}
                        onChange={e => setDrillDownSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      onClick={() => exportDrillDownCSV(
                        'Expenses_Itemized_Ledger',
                        ['Date', 'Title / Vendor', 'Category', 'Classification Bucket', 'Payment Mode', 'Amount (INR)'],
                        items.map(i => [i.date, i.title, i.category, i.bucket, i.paymentMode, i.amount])
                      )}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs shrink-0"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-2">Date</th>
                        <th className="pb-2">Title / Description</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2">Classification</th>
                        <th className="pb-2">Payment Mode</th>
                        <th className="pb-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 text-slate-500 font-mono text-[11px]">{item.date}</td>
                          <td className="py-2.5 font-bold text-slate-900">{item.title}</td>
                          <td className="py-2.5 text-slate-600">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.bucket === 'OFFICE' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'
                            }`}>
                              {item.bucket === 'OFFICE' ? '🏢 Office' : '💻 Tech & Cloud'}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-500 text-[11px]">{item.paymentMode}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-slate-900">{formatINR(item.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Two-Bucket Totals:</span>
                    <span className="text-amber-400">Office: <strong className="font-mono text-white">{formatINR(totalOffice)}</strong></span>
                    <span className="text-indigo-400">Tech/Cloud: <strong className="font-mono text-white">{formatINR(totalTech)}</strong></span>
                    <span className="text-emerald-400">Total Expenses: <strong className="font-mono text-emerald-300 text-sm font-black">{formatINR(totalOffice + totalTech)}</strong></span>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 5. RECEIVABLES
        if (activeDrillDown === 'RECEIVABLES') {
          const rawItems = invoices
            .filter(i => i.status !== 'PAID' && (i.balanceDue === undefined || i.balanceDue > 0))
            .map(i => ({
              id: i.id,
              invNum: i.invoiceNumber,
              clientName: i.clientName || 'Client',
              clientPhone: i.clientPhone || '',
              projectName: i.projectTitle || 'Milestone Delivery',
              totalAmount: i.totalAmount || 0,
              paidAmount: i.paidAmount || 0,
              balanceDue: i.balanceDue !== undefined ? i.balanceDue : (i.totalAmount - (i.paidAmount || 0)),
              dueDate: i.nextScheduledDueDate || i.dueDate || 'N/A',
              lateFee: i.lateFeeAssigned ? 'Active (2%/wk)' : 'None',
              status: i.status
            }));
          const items = rawItems.filter(i =>
            !query || i.invNum.toLowerCase().includes(query) || i.clientName.toLowerCase().includes(query) || i.projectName.toLowerCase().includes(query)
          );
          const totalInvoiced = items.reduce((s, i) => s + i.totalAmount, 0);
          const totalPaid = items.reduce((s, i) => s + i.paidAmount, 0);
          const totalDue = items.reduce((s, i) => s + i.balanceDue, 0);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">Client Invoices & Receivables Ledger</h3>
                        <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 text-[10px] font-bold border border-purple-700/50">
                          {items.length} Pending
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Itemized unpaid client balances, scheduled due dates, and 1-click reminders</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search client, invoice #, project..."
                      value={drillDownSearch}
                      onChange={e => setDrillDownSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <button
                    onClick={() => exportDrillDownCSV(
                      'Client_Receivables_Ledger',
                      ['Invoice #', 'Client Name', 'Phone', 'Project', 'Total Invoiced (INR)', 'Paid to Date (INR)', 'Balance Due (INR)', 'Scheduled Due Date', 'Late Fee Status', 'Status'],
                      items.map(i => [i.invNum, i.clientName, i.clientPhone, i.projectName, i.totalAmount, i.paidAmount, i.balanceDue, i.dueDate, i.lateFee, i.status])
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-2">Invoice #</th>
                        <th className="pb-2">Client / Project</th>
                        <th className="pb-2 text-right">Invoiced</th>
                        <th className="pb-2 text-right">Paid</th>
                        <th className="pb-2 text-right">Balance Due</th>
                        <th className="pb-2">Due Date</th>
                        <th className="pb-2 text-center">Late Fee</th>
                        <th className="pb-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5 font-bold font-mono text-purple-700">{item.invNum}</td>
                          <td className="py-2.5">
                            <p className="font-bold text-slate-900">{item.clientName}</p>
                            <p className="text-[11px] text-slate-500">{item.projectName}</p>
                          </td>
                          <td className="py-2.5 text-right font-mono text-slate-600">{formatINR(item.totalAmount)}</td>
                          <td className="py-2.5 text-right font-mono text-emerald-600">{formatINR(item.paidAmount)}</td>
                          <td className="py-2.5 text-right font-mono font-black text-rose-600">{formatINR(item.balanceDue)}</td>
                          <td className="py-2.5 font-mono text-[11px] text-slate-700">{item.dueDate}</td>
                          <td className="py-2.5 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.lateFee.includes('Active') ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {item.lateFee}
                            </span>
                          </td>
                          <td className="py-2.5 text-center">
                            <a
                              href={get2DayReminderWhatsAppUrl(item)}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 shadow-xs"
                            >
                              WA Reminder
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Receivables Summary:</span>
                    <span className="text-slate-300">Invoiced: <strong className="font-mono text-white">{formatINR(totalInvoiced)}</strong></span>
                    <span className="text-emerald-400">Paid: <strong className="font-mono text-white">{formatINR(totalPaid)}</strong></span>
                    <span className="text-purple-400">Total Balance Due: <strong className="font-mono text-purple-300 text-sm font-black">{formatINR(totalDue)}</strong></span>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 6. VENDOR_PAYABLES
        if (activeDrillDown === 'VENDOR_PAYABLES') {
          const rawItems = vendors.map(v => ({
            id: v.id,
            name: v.companyName || (v as any).name || v.influencerName || 'Vendor / Partner',
            handle: v.platform || (v as any).handle || '',
            type: v.vendorType || (v as any).type || 'VENDOR',
            category: v.serviceCategory || (v as any).category || 'INFRASTRUCTURE',
            committed: v.totalPayable || (v as any).totalCommitted || 0,
            disbursed: v.advancePaid || (v as any).disbursedAmount || 0,
            balanceDue: v.balanceDue || 0,
            dueDate: v.dueDate || 'N/A'
          }));
          const items = rawItems.filter(i =>
            !query || i.name.toLowerCase().includes(query) || i.type.toLowerCase().includes(query) || i.category.toLowerCase().includes(query)
          );
          const totalCommitted = items.reduce((s, i) => s + i.committed, 0);
          const totalDisbursed = items.reduce((s, i) => s + i.disbursed, 0);
          const totalBalanceDue = items.reduce((s, i) => s + i.balanceDue, 0);

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">Vendor & Influencer Payables Breakdown</h3>
                        <span className="px-2 py-0.5 rounded-full bg-rose-900/60 text-rose-300 text-[10px] font-bold border border-rose-700/50">
                          {items.length} Partners
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Infrastructure vendors, domain registrars, hardware, and marketing influencers</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search vendor, influencer, category..."
                      value={drillDownSearch}
                      onChange={e => setDrillDownSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <button
                    onClick={() => exportDrillDownCSV(
                      'Vendor_Influencer_Payables',
                      ['Partner / Vendor', 'Type', 'Category', 'Total Committed (INR)', 'Disbursed (INR)', 'Balance Due (INR)', 'Due Date'],
                      items.map(i => [i.name, i.type, i.category, i.committed, i.disbursed, i.balanceDue, i.dueDate])
                    )}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    Export CSV
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 p-4">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px] font-bold">
                        <th className="pb-2">Partner / Handle</th>
                        <th className="pb-2">Type</th>
                        <th className="pb-2">Category</th>
                        <th className="pb-2 text-right">Committed</th>
                        <th className="pb-2 text-right">Disbursed</th>
                        <th className="pb-2 text-right">Balance Due</th>
                        <th className="pb-2">Due Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {items.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="py-2.5">
                            <p className="font-bold text-slate-900">{item.name}</p>
                            {item.handle && <p className="text-[11px] text-slate-500">{item.handle}</p>}
                          </td>
                          <td className="py-2.5">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                              {item.type}
                            </span>
                          </td>
                          <td className="py-2.5 text-slate-600">{item.category}</td>
                          <td className="py-2.5 text-right font-mono text-slate-600">{formatINR(item.committed)}</td>
                          <td className="py-2.5 text-right font-mono text-emerald-600">{formatINR(item.disbursed)}</td>
                          <td className="py-2.5 text-right font-mono font-bold text-rose-600">{formatINR(item.balanceDue)}</td>
                          <td className="py-2.5 font-mono text-[11px] text-slate-700">{item.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Payables Total:</span>
                    <span className="text-slate-300">Committed: <strong className="font-mono text-white">{formatINR(totalCommitted)}</strong></span>
                    <span className="text-emerald-400">Disbursed: <strong className="font-mono text-white">{formatINR(totalDisbursed)}</strong></span>
                    <span className="text-rose-400">Total Outstanding: <strong className="font-mono text-rose-300 text-sm font-black">{formatINR(totalBalanceDue)}</strong></span>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs">
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        }

        // 7. FIXED_LIABILITIES & CASH_RUNWAY
        if (activeDrillDown === 'FIXED_LIABILITIES' || activeDrillDown === 'CASH_RUNWAY') {
          const liabilitiesBreakdown = [
            { category: 'Human Capital', item: `Core Staff Salaries (${staff.length || 7} team members)`, monthly: staffPayroll, detail: 'Monthly payroll commitment' },
            { category: 'Infrastructure', item: 'Office Lease Rent (Tech Hub Suite 402)', monthly: rentMonthly, detail: 'Commercial office lease' },
            { category: 'Technology', item: 'Cloud Hosting, AWS, Vercel & SaaS Tools', monthly: cloudHostingMonthly, detail: 'Production cloud & developer tools' },
            { category: 'Utilities', item: 'Electricity EB & Facility Maintenance', monthly: utilitiesMonthly, detail: 'Monthly utility bills' }
          ];

          const reservesBreakdown = [
            { account: 'HDFC Bank Current Account', type: 'Primary Operational Account', balance: Math.round(liquidReserves * 0.55), status: 'Active' },
            { account: 'ICICI Bank Enterprise Account', type: 'Client Retainers & Advance Vault', balance: Math.round(liquidReserves * 0.38), status: 'Active' },
            { account: 'Petty Cash & Emergency Vault', type: 'Cash in Hand', balance: Math.round(liquidReserves * 0.07), status: 'Liquid' }
          ];

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
              <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
                <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base">Fixed Commitments & Operating Runway Analysis</h3>
                        <span className="px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 text-[10px] font-bold border border-amber-700/50">
                          {runwayMonths} Months Runway
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">Itemized breakdown of monthly fixed obligations vs. liquid cash reserves</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveDrillDown(null)} className="text-slate-400 hover:text-white p-1 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 border-b border-slate-200 shrink-0">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Monthly Fixed Burn</span>
                    <p className="text-lg font-black text-slate-900 font-mono mt-1">{formatINR(totalFixedMonthlyCommitments)}</p>
                    <span className="text-[10px] text-amber-700 font-semibold">Salaries, Rent & Cloud</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Total Liquid Reserves</span>
                    <p className="text-lg font-black text-emerald-600 font-mono mt-1">{formatINR(liquidReserves)}</p>
                    <span className="text-[10px] text-emerald-700 font-semibold">Bank accounts + Cash</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Net Operating Runway</span>
                    <p className="text-lg font-black text-blue-600 font-mono mt-1">{runwayMonths} Months</p>
                    <span className="text-[10px] text-blue-700 font-semibold">Safe threshold: &gt; 3.0 mos</span>
                  </div>
                </div>

                <div className="overflow-y-auto flex-1 p-4 space-y-6">
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>1. Monthly Fixed Obligations Breakdown</span>
                      <span className="font-mono text-slate-600 font-bold">{formatINR(totalFixedMonthlyCommitments)} / mo</span>
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                            <th className="p-2.5">Category</th>
                            <th className="p-2.5">Commitment Item</th>
                            <th className="p-2.5">Frequency</th>
                            <th className="p-2.5 text-right">Monthly Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {liabilitiesBreakdown.map((l, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                                  {l.category}
                                </span>
                              </td>
                              <td className="p-2.5 font-bold text-slate-900">
                                {l.item}
                                <span className="block text-[10px] font-normal text-slate-500">{l.detail}</span>
                              </td>
                              <td className="p-2.5 text-slate-600 text-[11px]">Monthly Recurring</td>
                              <td className="p-2.5 text-right font-mono font-bold text-slate-900">{formatINR(l.monthly)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span>2. Liquid Reserves & Vault Account Balances</span>
                      <span className="font-mono text-emerald-600 font-bold">{formatINR(liquidReserves)} Available</span>
                    </h4>
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-bold">
                            <th className="p-2.5">Financial Vault / Account</th>
                            <th className="p-2.5">Account Purpose</th>
                            <th className="p-2.5 text-center">Liquidity</th>
                            <th className="p-2.5 text-right">Available Balance</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {reservesBreakdown.map((r, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-slate-900">{r.account}</td>
                              <td className="p-2.5 text-slate-600 text-[11px]">{r.type}</td>
                              <td className="p-2.5 text-center">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  {r.status}
                                </span>
                              </td>
                              <td className="p-2.5 text-right font-mono font-bold text-emerald-700">{formatINR(r.balance)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-900 text-white flex items-center justify-between shrink-0 text-xs">
                  <div className="flex items-center gap-6">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">Net Operating Health:</span>
                    <span className="text-amber-400">Burn: <strong className="font-mono text-white">{formatINR(totalFixedMonthlyCommitments)}</strong></span>
                    <span className="text-emerald-400">Reserves: <strong className="font-mono text-white">{formatINR(liquidReserves)}</strong></span>
                    <span className="text-blue-400">Runway: <strong className="font-mono text-blue-300 text-sm font-black">{runwayMonths} Months</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => exportDrillDownCSV(
                        'Operating_Runway_Liabilities',
                        ['Category', 'Item / Account', 'Monthly Commitment / Balance (INR)', 'Type'],
                        [
                          ...liabilitiesBreakdown.map(l => [l.category, l.item, l.monthly, 'Fixed Liability']),
                          ...reservesBreakdown.map(r => ['Liquid Reserve', r.account, r.balance, 'Cash Asset'])
                        ]
                      )}
                      className="px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-bold text-xs flex items-center gap-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export CSV
                    </button>
                    <button onClick={() => setActiveDrillDown(null)} className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold text-xs">
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        }

        return null;
      })()}

      {/* Confirm Delete Invoice Modal */}
      {confirmDeleteInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Client Invoice?</h3>
                <p className="text-xs text-slate-500">{confirmDeleteInv.invoiceNumber || confirmDeleteInv.id} • {confirmDeleteInv.clientName}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This invoice of <span className="font-mono font-bold text-slate-900">{formatINR(confirmDeleteInv.totalAmount)}</span> will be moved to the <span className="font-bold text-slate-900">Recycle Bin</span>. Dashboard billed values, balance to be paid, and taxes will immediately recalculate with zero calculation error.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmDeleteInv(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(confirmDeleteInv.id)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20"
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
