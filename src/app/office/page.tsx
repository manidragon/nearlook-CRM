'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Users, 
  Receipt, 
  Plus, 
  Search, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  Edit2, 
  Trash2, 
  DollarSign, 
  Coffee, 
  Zap, 
  Wrench, 
  FileText, 
  X, 
  Check, 
  ShieldCheck, 
  Phone, 
  Mail,
  UserCheck,
  Upload,
  Paperclip,
  Download,
  CreditCard,
  Send,
  Landmark
} from 'lucide-react';
import { Expense, StaffMember, ExpenseCategory, StaffRole, StaffTeam } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function OfficePage() {
  const { currentStaff, canViewFinancials } = useAuth();

  const [activeTab, setActiveTab] = useState<'expenses' | 'staff'>('expenses');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [gstLiability, setGstLiability] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [expenseSearch, setExpenseSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [staffSearch, setStaffSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');

  // Modals
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const [viewingStaff, setViewingStaff] = useState<StaffMember | null>(null);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Expense Form State
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('RENT');
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formVendorName, setFormVendorName] = useState('');
  const [formPaymentMode, setFormPaymentMode] = useState<'BANK' | 'CASH'>('BANK');
  const [formReceiptName, setFormReceiptName] = useState('');
  const [formReceiptUrl, setFormReceiptUrl] = useState('');

  // Staff Form State
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffRole, setStaffRole] = useState<StaffRole>('DEVELOPER');
  const [staffTeam, setStaffTeam] = useState<StaffTeam>('WEB_DEVELOPMENT');
  const [staffSalary, setStaffSalary] = useState('');
  const [staffAddress, setStaffAddress] = useState('');
  const [staffShiftTiming, setStaffShiftTiming] = useState('09:30 AM - 07:30 PM (Standard Shift)');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormReceiptName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormReceiptUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const loadData = async () => {
    try {
      const [expRes, staffRes, metricsRes] = await Promise.all([
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/staff').then(r => r.json()),
        fetch('/api/metrics').then(r => r.json())
      ]);

      if (expRes.success) setExpenses(expRes.data);
      if (staffRes.success) setStaff(staffRes.data);
      if (metricsRes?.success && metricsRes?.data) {
        setGstLiability(metricsRes.data.gstPayableThisMonth ?? 0);
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

  // Handle Save Expense
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formDesc || !formAmount) {
      alert('Please fill in Description and Amount');
      return;
    }

    try {
      if (editingExpense) {
        const res = await fetch('/api/expenses', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingExpense.id,
            category: formCategory,
            description: formDesc,
            amount: Number(formAmount),
            date: formDate,
            vendorName: formVendorName,
            receiptName: formReceiptName,
            receiptUrl: formReceiptUrl || undefined,
            paymentMode: formPaymentMode
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Expense updated.`);
          setEditingExpense(null);
          setFormReceiptName('');
          setFormReceiptUrl('');
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else {
        const res = await fetch('/api/expenses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: formCategory,
            description: formDesc,
            amount: Number(formAmount),
            date: formDate,
            vendorName: formVendorName,
            paymentMode: formPaymentMode,
            receiptUrl: formReceiptUrl || undefined,
            receiptName: formReceiptName || `${formCategory}_Receipt_${formDate}.pdf`
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Logged office expense of ${formatINR(Number(formAmount))}. Dashboard updated!`);
          setShowAddExpenseModal(false);
          setFormDesc('');
          setFormAmount('');
          setFormReceiptName('');
          setFormReceiptUrl('');
          setFormPaymentMode('BANK');
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

  // Handle Delete Expense
  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
    try {
      const res = await fetch(`/api/expenses?id=${deletingExpense.id}&deletedBy=${encodeURIComponent(currentStaff.name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ Expense moved to Recycle Bin. Dashboard total expenses recalculated!`);
        setDeletingExpense(null);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Disburse Salary with Net Attendance Deductions Validation
  const handleDisburseSalary = async (st: StaffMember) => {
    let netAmount = st.monthlySalary;
    let totalDeductions = 0;

    try {
      const attRes = await fetch(`/api/attendance?staffId=${st.id}`);
      const attData = await attRes.json();
      if (attData.success && attData.payroll) {
        netAmount = attData.payroll.netSalaryPayable;
        totalDeductions = attData.payroll.totalDeductions || 0;
      }
    } catch (e) {
      console.warn('Could not fetch attendance summary:', e);
    }

    const confirmMsg = totalDeductions > 0
      ? `Confirm salary payout of ${formatINR(netAmount)} for ${st.name}?\n(Base: ${formatINR(st.monthlySalary)} minus ${formatINR(totalDeductions)} attendance deductions)`
      : `Confirm salary payout of ${formatINR(netAmount)} for ${st.name}? This will record a salary expense and post to Double-Entry Accounts.`;

    if (!confirm(confirmMsg)) {
      return;
    }

    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: st.id,
          category: 'SALARY',
          description: `Monthly Salary Payout (Nov 2026) - ${st.name} (${st.role})`,
          amount: netAmount,
          date: new Date().toISOString().split('T')[0],
          receiptName: `Payslip_${st.name.replace(/\s+/g, '_')}_Nov2026.pdf`,
          paymentMode: 'BANK'
        })
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`✅ Net salary of ${formatINR(netAmount)} disbursed to ${st.name}. Double-entry ledger updated!`);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      } else {
        alert(data.error || 'Failed to disburse salary');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Save Staff
  const handleSaveStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffEmail || !staffPhone || !staffSalary) {
      alert('Please fill in Name, Email, Phone, and Monthly Salary');
      return;
    }

    try {
      if (editingStaff) {
        const res = await fetch('/api/staff', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingStaff.id,
            name: staffName,
            email: staffEmail,
            phone: staffPhone,
            role: staffRole,
            team: staffTeam,
            monthlySalary: Number(staffSalary),
            address: staffAddress,
            shiftTiming: staffShiftTiming
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Staff member ${staffName} updated.`);
          setEditingStaff(null);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else {
        const res = await fetch('/api/staff', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: staffName,
            email: staffEmail,
            phone: staffPhone,
            role: staffRole,
            team: staffTeam,
            monthlySalary: Number(staffSalary),
            address: staffAddress,
            shiftTiming: staffShiftTiming
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Onboarded ${staffName} to team.`);
          setShowAddStaffModal(false);
          setStaffName('');
          setStaffEmail('');
          setStaffPhone('');
          setStaffSalary('');
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save staff');
    }
  };

  // Handle Delete Staff
  const handleDeleteStaff = async () => {
    if (!deletingStaff) return;
    try {
      const res = await fetch(`/api/staff?id=${deletingStaff.id}&deletedBy=${encodeURIComponent(currentStaff.name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ Staff member ${deletingStaff.name} moved to Recycle Bin.`);
        setDeletingStaff(null);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter Expenses
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
      (e.vendorName && e.vendorName.toLowerCase().includes(expenseSearch.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filter Staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.phone.includes(staffSearch);

    const matchesTeam = teamFilter === 'ALL' || s.team === teamFilter;
    return matchesSearch && matchesTeam;
  });

  const totalOfficeExpenses = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const totalPayroll = staff.reduce((acc, s) => acc + (s.monthlySalary || 0), 0);
  const rentExpenses = expenses.filter(e => e.category === 'RENT').reduce((acc, e) => acc + (e.amount || 0), 0);
  const utilityExpenses = expenses.filter(e => e.category === 'ELECTRICITY_EB' || e.category === 'MAINTENANCE' || e.category === 'TEA_SNACKS').reduce((acc, e) => acc + (e.amount || 0), 0);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Office Operations & Staff Payroll...</p>
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
              Office Expenses & Staff Operations
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
              Operations & Payroll
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Office rent, EB electricity, pantry snacks, facility upkeep, and staff monthly payroll disbursals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'expenses' ? (
            <button
              onClick={() => {
                setFormDesc('');
                setFormAmount('');
                setShowAddExpenseModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Log Office Expense</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setStaffName('');
                setStaffEmail('');
                setStaffPhone('');
                setStaffSalary('');
                setShowAddStaffModal(true);
              }}
              className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between shadow-sm animate-fadeIn">
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="text-emerald-700 hover:text-emerald-900 font-extrabold text-sm">✕</button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Operational Expenses</span>
            <Receipt className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatINR(totalOfficeExpenses)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Logged in FY 2026-27</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Monthly Payroll Liability</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{formatINR(totalPayroll)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Across {staff.length} team members</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Office Facility Rent</span>
            <Building className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-blue-600 mt-2">{formatINR(rentExpenses)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Commercial lease committed</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>EB Power & Snacks</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 mt-2">{formatINR(utilityExpenses)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Electricity & pantry facility</span>
          </div>
        </div>

        {/* Requirement 7: Internal 18% GST Statutory Liability Card */}
        <div className="bg-gradient-to-br from-purple-50 via-white to-indigo-50/40 p-4 rounded-xl border border-purple-200 shadow-sm hover:border-purple-300 transition">
          <div className="flex items-center justify-between text-purple-700 text-xs font-semibold">
            <span>Internal 18% GST Statutory Liability</span>
            <Landmark className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-purple-900 mt-2 font-mono">{formatINR(gstLiability)}</p>
          <div className="text-[11px] text-purple-700 mt-1 font-medium">
            <span>Monthly statutory provision (Nov 1-30)</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 bg-white px-5 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('expenses')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
            activeTab === 'expenses'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Office Operational Expenses</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-bold">
            {expenses.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('staff')}
          className={`py-3 px-4 font-bold text-xs flex items-center gap-2 border-b-2 transition ${
            activeTab === 'staff'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory & Payroll</span>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.2 rounded-full font-bold">
            {staff.length}
          </span>
        </button>
      </div>

      {/* =========================================================================
          TAB 1: OFFICE EXPENSES
         ========================================================================= */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search expense description, vendor, or voucher..."
                value={expenseSearch}
                onChange={(e) => setExpenseSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                aria-label="Filter expenses by category"
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Categories</option>
                <option value="RENT">Office Lease Rent</option>
                <option value="ELECTRICITY_EB">Electricity / EB Power</option>
                <option value="TEA_SNACKS">Team Pantry & Snacks</option>
                <option value="MAINTENANCE">Office Maintenance</option>
                <option value="SALARY">Staff Salaries</option>
                <option value="HOSTING_DOMAIN">Domains & Cloud Hosting</option>
                <option value="SAAS_TOOL">API & SaaS Software</option>
                <option value="FREELANCER">Freelancer Payouts</option>
                <option value="INFLUENCER_PAYOUT">Influencer Campaigns</option>
                <option value="PURCHASES_HARDWARE">Hardware Purchases</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description & Receipt</th>
                    <th className="py-3 px-4">Vendor / Payee</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No operational expenses found.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                          {exp.date}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            {exp.category.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs">{exp.description}</div>
                          {exp.receiptName && (
                            <div className="text-[10px] text-blue-600 font-mono mt-0.5 flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              <span>{exp.receiptName}</span>
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {exp.vendorName || exp.clientName || 'Facility Direct'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          {formatINR(exp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setViewingExpense(exp)}
                              title="View Expense"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingExpense(exp);
                                setFormCategory(exp.category);
                                setFormDesc(exp.description);
                                setFormAmount(String(exp.amount));
                                setFormDate(exp.date);
                                setFormVendorName(exp.vendorName || '');
                                setFormReceiptName(exp.receiptName || '');
                                setFormReceiptUrl(exp.receiptUrl || '');
                                setFormPaymentMode(exp.paymentMode || 'BANK');
                              }}
                              title="Edit Expense"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingExpense(exp)}
                              title="Delete Expense (Move to Recycle Bin)"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: STAFF DIRECTORY & PAYROLL
         ========================================================================= */}
      {activeTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff name, email, or phone..."
                value={staffSearch}
                onChange={(e) => setStaffSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Team:</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                aria-label="Filter staff by team"
                className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="ALL">All Teams</option>
                <option value="WEB_DEVELOPMENT">Engineering & Tech</option>
                <option value="MARKETING">Growth & Marketing</option>
                <option value="DESIGN">UI/UX Design</option>
                <option value="CONTENT">Content Strategy</option>
                <option value="ACCOUNTS">Finance & Accounts</option>
                <option value="MANAGEMENT">Executive</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff Member</th>
                    <th className="py-3 px-4">Role & Team</th>
                    <th className="py-3 px-4 text-right">Monthly Salary</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions & Payout</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No staff members found.
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((st) => (
                      <tr key={st.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 text-xs">{st.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {st.userId} • {st.email}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-800 text-xs">{st.role.replace(/_/g, ' ')}</span>
                          <div className="text-[10px] text-slate-500 font-medium">{st.team.replace(/_/g, ' ')}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900">
                          {formatINR(st.monthlySalary)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {st.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleDisburseSalary(st)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm transition"
                            >
                              Disburse Salary
                            </button>
                            <button
                              onClick={() => setViewingStaff(st)}
                              title="View Details"
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStaff(st);
                                setStaffName(st.name);
                                setStaffEmail(st.email);
                                setStaffPhone(st.phone);
                                setStaffRole(st.role);
                                setStaffTeam(st.team);
                                setStaffSalary(String(st.monthlySalary));
                                setStaffAddress(st.address || '');
                                setStaffShiftTiming(st.shiftTiming || '09:30 AM - 07:30 PM (Standard Shift)');
                              }}
                              title="Edit"
                              className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingStaff(st)}
                              title="Delete (Move to Recycle Bin)"
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          LOG EXPENSE MODAL
         ========================================================================= */}
      {(showAddExpenseModal || editingExpense) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingExpense ? 'Edit Office Expense' : 'Log Office Operational Expense'}
                </h3>
                <p className="text-xs text-slate-500">Record cash/bank operational payouts with instant double-entry sync</p>
              </div>
              <button
                onClick={() => { setShowAddExpenseModal(false); setEditingExpense(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExpense} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Expense Category *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="RENT">Office Lease Rent (Suite 402 Tech Hub)</option>
                    <option value="ELECTRICITY_EB">Electricity / Bescom EB Power Bill</option>
                    <option value="TEA_SNACKS">Team Pantry Refreshments, Coffee & Snacks</option>
                    <option value="MAINTENANCE">Office Maintenance, Cleaning & Repairs</option>
                    <option value="HOSTING_DOMAIN">Domains, DNS & Cloud Hosting (AWS / Cloudways)</option>
                    <option value="SAAS_TOOL">API Tokens & Software SaaS (OpenAI / Figma / Slack)</option>
                    <option value="FREELANCER">Freelance Developer / Contractor Payout</option>
                    <option value="INFLUENCER_PAYOUT">Social Media Creator & Influencer Fee</option>
                    <option value="PURCHASES_HARDWARE">Hardware, Monitors & Peripherals</option>
                    <option value="MISCELLANEOUS">Miscellaneous General Operations</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. October Rent for Tech Hub Tower Suite 402"
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹ INR) *</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 120000"
                      value={formAmount}
                      onChange={(e) => setFormAmount(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                {/* Payment Mode Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method / Account *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormPaymentMode('BANK')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                        formPaymentMode === 'BANK'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Bank Account (HDFC/ICICI)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormPaymentMode('CASH')}
                      className={`p-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition ${
                        formPaymentMode === 'CASH'
                          ? 'bg-amber-50 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Cash in Hand (Petty Cash)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Payee</label>
                  <input
                    type="text"
                    placeholder="e.g. Bescom, TechHub Lease"
                    value={formVendorName}
                    onChange={(e) => setFormVendorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                {/* Universal Receipt Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Receipt Attachment (PDF, JPG, PNG)</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-amber-400 bg-slate-50 hover:bg-amber-50/50 rounded-xl cursor-pointer text-xs font-semibold text-slate-600 transition">
                      <Upload className="w-4 h-4 text-slate-400" />
                      <span className="truncate">{formReceiptName ? formReceiptName : 'Upload Bill / Invoice Receipt'}</span>
                      <input
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                    {formReceiptName && (
                      <button
                        type="button"
                        onClick={() => { setFormReceiptName(''); setFormReceiptUrl(''); }}
                        className="p-3 text-rose-500 hover:bg-rose-50 rounded-xl border border-rose-200"
                        title="Remove Receipt"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddExpenseModal(false); setEditingExpense(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense & Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD / EDIT STAFF MODAL
         ========================================================================= */}
      {(showAddStaffModal || editingStaff) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="font-black text-lg text-slate-900">
                  {editingStaff ? 'Edit Staff Member' : 'Onboard Staff Member'}
                </h3>
                <p className="text-xs text-slate-500">Configure team role, shift slot, and payroll parameters</p>
              </div>
              <button
                onClick={() => { setShowAddStaffModal(false); setEditingStaff(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Verma"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Role *</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="DEVELOPER">Developer</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="DESIGNER">UI/UX Designer</option>
                      <option value="MARKETER">Marketer</option>
                      <option value="CONTENT_WRITER">Content Writer</option>
                      <option value="ACCOUNT_MANAGER">Accounts Manager</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Team *</label>
                    <select
                      value={staffTeam}
                      onChange={(e) => setStaffTeam(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="WEB_DEVELOPMENT">Engineering & Tech</option>
                      <option value="MARKETING">Growth & Marketing</option>
                      <option value="DESIGN">UI/UX Design</option>
                      <option value="CONTENT">Content Strategy</option>
                      <option value="ACCOUNTS">Finance & Accounts</option>
                      <option value="MANAGEMENT">Executive</option>
                    </select>
                  </div>
                </div>

                {/* Shift Slot Customization */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Shift Slot Timings *</label>
                  <select
                    value={staffShiftTiming}
                    onChange={(e) => setStaffShiftTiming(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="09:30 AM - 07:30 PM (Standard Shift)">Standard Office Shift (09:30 AM - 07:30 PM)</option>
                    <option value="10:00 AM - 08:00 PM (Transit Slot)">Transit-Adjusted Slot (10:00 AM - 08:00 PM)</option>
                    <option value="06:00 PM - 03:00 AM (US / Night Shift)">Night / US Client Shift (06:00 PM - 03:00 AM)</option>
                  </select>
                  <span className="block text-[11px] text-slate-500 mt-1">Automatic salary deductions calculate if clock-in is past the slot start time.</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Monthly Base Salary (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 75000"
                    value={staffSalary}
                    onChange={(e) => setStaffSalary(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@nearlook.com"
                      value={staffEmail}
                      onChange={(e) => setStaffEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      placeholder="+919876543210"
                      value={staffPhone}
                      onChange={(e) => setStaffPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Indiranagar, Bangalore"
                    value={staffAddress}
                    onChange={(e) => setStaffAddress(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowAddStaffModal(false); setEditingStaff(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 transition"
                >
                  {editingStaff ? 'Save Changes' : 'Onboard Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW EXPENSE DETAILS MODAL
         ========================================================================= */}
      {viewingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h3 className="font-black text-lg text-slate-900">Expense Voucher Details</h3>
                <p className="text-xs text-slate-500">ID: {viewingExpense.id} • {viewingExpense.category.replace(/_/g, ' ')}</p>
              </div>
              <button
                onClick={() => setViewingExpense(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Expense Amount:</span>
                  <span className="text-lg font-black text-slate-900">{formatINR(viewingExpense.amount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Date:</span>
                  <span className="font-bold text-slate-800">{viewingExpense.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Account:</span>
                  <span className="font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {viewingExpense.paymentMode === 'CASH' ? 'Cash in Hand (Petty Cash)' : 'HDFC/ICICI Bank Account'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Vendor / Payee:</span>
                  <span className="font-bold text-slate-800">{viewingExpense.vendorName || 'General Office Expense'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description / Memo</label>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium leading-relaxed">
                  {viewingExpense.description}
                </div>
              </div>

              {/* Receipt Attachment Viewer */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Receipt Attachment</label>
                {viewingExpense.receiptUrl || viewingExpense.receiptName ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-800 truncate">{viewingExpense.receiptName || 'Attached_Receipt.pdf'}</span>
                    </div>
                    {viewingExpense.receiptUrl ? (
                      <a
                        href={viewingExpense.receiptUrl}
                        download={viewingExpense.receiptName || 'receipt'}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1 shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download
                      </a>
                    ) : (
                      <span className="text-[10px] text-emerald-700 font-bold">Verified on File</span>
                    )}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 italic">
                    No receipt uploaded for this transaction.
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `*Nearlook Agency Office Expense Voucher*\n` +
                  `Category: ${viewingExpense.category.replace(/_/g, ' ')}\n` +
                  `Description: ${viewingExpense.description}\n` +
                  `Amount: ₹${viewingExpense.amount.toLocaleString('en-IN')}\n` +
                  `Date: ${viewingExpense.date}\n` +
                  `Payment Account: ${viewingExpense.paymentMode === 'CASH' ? 'Cash in Hand' : 'Bank Transfer'}\n` +
                  `Vendor: ${viewingExpense.vendorName || 'Office'}\n` +
                  `Recorded in Nearlook ERP Accounts Ledger.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                Share Voucher (WhatsApp)
              </a>

              <button
                type="button"
                onClick={() => setViewingExpense(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE EXPENSE MODAL
         ========================================================================= */}
      {deletingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">Move Expense to Recycle Bin?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to delete <strong className="text-slate-800">{deletingExpense.description} ({formatINR(deletingExpense.amount)})</strong>? Dashboard total expenses will automatically subtract this amount.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingExpense(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpense}
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

