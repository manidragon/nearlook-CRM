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
  PauseCircle
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
  const [loading, setLoading] = useState(true);

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

  const loadData = async () => {
    try {
      const [metricsRes, projectsRes, invoicesRes, vendorsRes, expensesRes, payRes, staffRes] = await Promise.all([
        fetch('/api/metrics').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/vendors').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
        fetch('/api/staff').then(r => r.json())
      ]);

      if (metricsRes.success) setMetrics(metricsRes.data);
      if (projectsRes.success) setProjects(projectsRes.data);
      if (invoicesRes.success) setInvoices(invoicesRes.data);
      if (vendorsRes.success) setVendors(vendorsRes.data);
      if (expensesRes.success) setExpenses(expensesRes.data);
      if (payRes.success) setReceipts(payRes.receipts || []);
      if (staffRes.success) setStaff(staffRes.data || []);
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
  const liquidReserves = (metrics?.totalCollectionsInBank || 0) + (metrics?.totalCollectionsInCash || 0) || (metrics?.clientCollectedTotal || 0);
  const runwayMonths = totalFixedMonthlyCommitments > 0
    ? (liquidReserves / totalFixedMonthlyCommitments).toFixed(1)
    : '0.0';
  const isLowRunway = totalFixedMonthlyCommitments > 0 && Number(runwayMonths) < 2.0;

  // Sales Target Shortfalls ("Sales to Tally") - Target 25% Net Profit Margin
  const targetMargin = 0.25;
  const breakEvenSales = totalFixedMonthlyCommitments > 0 ? Math.round(totalFixedMonthlyCommitments / (1 - targetMargin)) : 0;
  const currentSales = metrics?.thisMonthSales || 0;
  const salesTallyDiff = currentSales - breakEvenSales;
  const isSurplus = salesTallyDiff >= 0;
  const salesProgressPercent = breakEvenSales > 0 ? Math.min(100, Math.round((currentSales / breakEvenSales) * 100)) : 0;

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
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Contract Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatINR(metrics?.totalContractValue)}</p>
          <div className="flex items-center text-[11px] text-blue-600 font-semibold mt-1">
            <span>{metrics?.totalActiveProjects || 0} Projects • {metrics?.totalActiveRetainers || 0} Retainers</span>
          </div>
        </div>

        {/* KPI 2: This Month Sales / Project Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>This Month Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{formatINR(metrics?.thisMonthSales)}</p>
          <div className="flex items-center text-[11px] text-slate-500 mt-1">
            <span>Recognized IT revenue this month</span>
          </div>
        </div>

        {/* KPI 3: Total Expenses (Office + Purchases: Domain, Hosting, Freelancers) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Expenses</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatINR(metrics?.totalExpenses)}</p>
          <div className="flex items-center text-[10px] text-slate-500 font-medium mt-1 truncate" title={`Office: ${formatINR(metrics?.officeExpensesTotal)} • Tech/Domains/Freelancers: ${formatINR(metrics?.techPurchasesTotal)}`}>
            <span>Office: {formatINR(metrics?.officeExpensesTotal)} • Tech: {formatINR(metrics?.techPurchasesTotal)}</span>
          </div>
        </div>

        {/* KPI 4: Vendor & Influencer Payables (Replaces Supplier & Vendor Payables) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Vendor & Influencer Payables</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">{formatINR(metrics?.vendorAndInfluencerPayables)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
            <span>{metrics?.vendorPayablesCount || 0} pending dues</span>
            <Link href="/vendors" className="text-rose-600 font-bold hover:underline">
              Payables →
            </Link>
          </div>
        </div>

        {/* KPI 5: Client Invoices & Balance to be Paid */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Balance to be Paid (Clients)</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-purple-700 mt-2">{formatINR(metrics?.clientBalanceToBePaid)}</p>
          <div className="flex items-center text-[10px] text-slate-500 font-medium mt-1 truncate" title={`Total Invoiced: ${formatINR(metrics?.clientInvoicesTotal)} | Paid: ${formatINR(metrics?.clientCollectedTotal)}`}>
            <span>Invoiced: {formatINR(metrics?.clientInvoicesTotal)} • Paid: {formatINR(metrics?.clientCollectedTotal)}</span>
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
        <div className="bg-gradient-to-br from-indigo-500/10 via-white to-indigo-500/5 p-4 rounded-xl border border-indigo-200 shadow-sm hover:border-indigo-400 transition">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>GST Payables (Nov 1-30)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-indigo-900 mt-2 font-mono">{formatINR(metrics?.gstPayableThisMonth || metrics?.totalCollectedTaxLiability)}</p>
          <div className="flex items-center text-[10px] text-indigo-700 font-semibold mt-1">
            <span>Internal 18% GST statutory liability</span>
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
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fixed Monthly Liabilities</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {formatINR(totalFixedMonthlyCommitments)}
            <span className="text-xs font-normal text-slate-400 font-sans"> / mo</span>
          </div>
          <div className="mt-3 space-y-1.5 text-[11px] text-slate-600 font-medium">
            <div className="flex justify-between">
              <span>Core Staff Salaries ({staff.length || 7} team):</span>
              <span className="font-bold text-slate-900 font-mono">{formatINR(staffPayroll)}</span>
            </div>
            <div className="flex justify-between">
              <span>Office Lease Rent (Tech Hub Suite 402):</span>
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
        </div>

        {/* Card 2: Cash Runway & Operating Liquidity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:border-slate-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Operating Cash Runway</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${Number(runwayMonths) >= 3.0 ? 'bg-emerald-50 text-emerald-600' : Number(runwayMonths) >= 2.0 ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
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
              <strong className="text-slate-800 font-mono">{formatINR(totalFixedMonthlyCommitments)}</strong>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">
              Zero debt burn duration without new invoice inflows.
            </div>
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
            <span className="text-slate-900 font-bold">{projects.filter(p => p.title.toLowerCase().includes('saas') || p.title.toLowerCase().includes('platform') || p.title.toLowerCase().includes('software')).length} Projects</span>
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
            <span className="text-slate-900 font-bold">{projects.filter(p => p.title.toLowerCase().includes('web') || p.title.toLowerCase().includes('portal') || p.title.toLowerCase().includes('alpha')).length} Live</span>
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
            <span className="text-purple-700 font-bold">{formatINR(metrics?.totalPipelineValue || 0)}</span>
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
            <span className="text-orange-700 font-bold">{formatINR(metrics?.vendorAndInfluencerPayables || 0)}</span>
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
