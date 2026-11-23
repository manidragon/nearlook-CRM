'use client';

import React, { useState, useEffect } from 'react';
import {
  Landmark,
  Plus,
  BookOpen,
  Scale,
  TrendingUp,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  X,
  Search,
  Download,
  RefreshCw,
  Table,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  Building2,
  FileCode,
  Trash2,
  Eye,
  AlertTriangle,
  Receipt,
  CreditCard,
  HelpCircle,
  ArrowRightLeft,
  Percent
} from 'lucide-react';
import { AccountHead, JournalVoucher, JournalLine } from '@/lib/types';

export default function AccountsPage() {
  const [activeTab, setActiveTab] = useState<'daybook' | 'coa' | 'ledger' | 'trialBalance' | 'loans'>('daybook');
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [coa, setCOA] = useState<AccountHead[]>([]);
  const [journals, setJournals] = useState<JournalVoucher[]>([]);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [pnl, setPnl] = useState<any>(null);

  // Filters & search
  const [voucherFilter, setVoucherFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('1030'); // Default to Bank Account

  // Modals
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [inspectVoucher, setInspectVoucher] = useState<JournalVoucher | null>(null);
  const [confirmDeleteVoucher, setConfirmDeleteVoucher] = useState<JournalVoucher | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // New Voucher Form
  const [voucherForm, setVoucherForm] = useState({
    voucherType: 'JOURNAL' as 'JOURNAL' | 'PAYMENT' | 'RECEIPT' | 'CONTRA',
    date: new Date().toISOString().split('T')[0],
    referenceNo: '',
    narration: '',
    lines: [
      { accountCode: '1030', accountName: 'HDFC Bank Corporate A/c (4589)', debit: 0, credit: 0 },
      { accountCode: '4010', accountName: 'Web & Custom Software Revenue', debit: 0, credit: 0 }
    ]
  });

  // Contra Cash ⇆ Bank Transfer Modal state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromAccount: '1010', // Cash in Hand
    toAccount: '1020', // HDFC Bank
    amount: '',
    date: new Date().toISOString().split('T')[0],
    referenceNo: '',
    narration: 'Cash deposit into bank account via cash deposit machine / branch slip'
  });

  // Corporate Loans & Borrowings state
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loans, setLoans] = useState([
    {
      id: 'loan-1',
      lenderName: 'Director Rajeshwar Sharma (Promoter Infusion)',
      principal: 1500000,
      annualInterestRate: 8.5,
      startDate: '2026-04-01',
      dueDate: '2027-03-31',
      creditAccount: '1020',
      status: 'ACTIVE' as const,
      narration: 'Director promoter loan for AI server hardware expansion'
    },
    {
      id: 'loan-2',
      lenderName: 'HDFC Corporate Working Capital Facility',
      principal: 2500000,
      annualInterestRate: 9.25,
      startDate: '2026-06-15',
      dueDate: '2027-06-14',
      creditAccount: '1020',
      status: 'ACTIVE' as const,
      narration: 'Bank overdraft facility for payroll reserve'
    }
  ]);
  const [loanForm, setLoanForm] = useState({
    lenderName: '',
    principal: '',
    annualInterestRate: '9.0',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    creditAccount: '1020',
    narration: ''
  });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const fetchData = async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/accounts');
      const data = await res.json();
      if (data.success) {
        setCOA(data.coa || []);
        setJournals(data.journals || []);
        setTrialBalance(data.trialBalance || null);
        setPnl(data.pnl || null);
      }
    } catch (err) {
      console.error('Failed to load accounts data:', err);
      showNotification('Failed to load accounting data', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleUpdate = () => fetchData(true);
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const handleExportTallyXML = async () => {
    try {
      setIsExporting(true);
      window.open('/api/accounts?export=tally-xml', '_blank');
      showNotification('Tally XML exported successfully. Ready for import into Tally Prime / ERP 9.', 'success');
    } catch (err) {
      showNotification('Failed to export Tally XML', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Form line manipulation
  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...voucherForm.lines];
    if (field === 'accountCode') {
      const found = coa.find(a => a.code === value);
      updated[index] = {
        ...updated[index],
        accountCode: value,
        accountName: found ? found.name : ''
      };
    } else {
      updated[index] = {
        ...updated[index],
        [field]: Number(value) || 0
      };
    }
    setVoucherForm({ ...voucherForm, lines: updated });
  };

  const addVoucherLine = () => {
    setVoucherForm({
      ...voucherForm,
      lines: [
        ...voucherForm.lines,
        { accountCode: '5010', accountName: 'AWS & Cloud Infrastructure Hosting', debit: 0, credit: 0 }
      ]
    });
  };

  const removeVoucherLine = (index: number) => {
    if (voucherForm.lines.length <= 2) {
      showNotification('A double-entry voucher must contain at least 2 lines.', 'error');
      return;
    }
    const updated = voucherForm.lines.filter((_, i) => i !== index);
    setVoucherForm({ ...voucherForm, lines: updated });
  };

  const formTotalDebit = voucherForm.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const formTotalCredit = voucherForm.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const formDifference = Math.abs(formTotalDebit - formTotalCredit);
  const isFormBalanced = formDifference === 0 && formTotalDebit > 0;

  const handleSaveVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormBalanced) {
      showNotification(`Double-entry unbalanced: Debits (₹${formTotalDebit}) must equal Credits (₹${formTotalCredit}).`, 'error');
      return;
    }

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(voucherForm)
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Journal Voucher posted successfully', 'success');
        setShowVoucherModal(false);
        setVoucherForm({
          voucherType: 'JOURNAL',
          date: new Date().toISOString().split('T')[0],
          referenceNo: '',
          narration: '',
          lines: [
            { accountCode: '1030', accountName: 'HDFC Bank Corporate A/c (4589)', debit: 0, credit: 0 },
            { accountCode: '4010', accountName: 'Web & Custom Software Revenue', debit: 0, credit: 0 }
          ]
        });
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        fetchData(true);
      } else {
        showNotification(data.error || 'Failed to post voucher', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error saving voucher', 'error');
    }
  };

  const handleSaveTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(transferForm.amount);
    if (!amountVal || amountVal <= 0) {
      showNotification('Please enter a valid transfer amount', 'error');
      return;
    }

    const fromAcc = coa.find(a => a.code === transferForm.fromAccount);
    const toAcc = coa.find(a => a.code === transferForm.toAccount);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherType: 'CONTRA',
          date: transferForm.date,
          referenceNo: transferForm.referenceNo || `CD-${Date.now().toString().slice(-4)}`,
          narration: transferForm.narration || `Transfer from ${fromAcc?.name} to ${toAcc?.name}`,
          lines: [
            {
              accountCode: transferForm.toAccount,
              accountName: toAcc?.name || 'Target Account',
              debit: amountVal,
              credit: 0
            },
            {
              accountCode: transferForm.fromAccount,
              accountName: fromAcc?.name || 'Source Account',
              debit: 0,
              credit: amountVal
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Contra voucher posted: Transferred ₹${amountVal.toLocaleString('en-IN')} from ${fromAcc?.name} to ${toAcc?.name}`, 'success');
        setShowTransferModal(false);
        setTransferForm({
          fromAccount: '1010',
          toAccount: '1020',
          amount: '',
          date: new Date().toISOString().split('T')[0],
          referenceNo: '',
          narration: 'Cash deposit into bank account via cash deposit machine / branch slip'
        });
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        fetchData(true);
      } else {
        showNotification(data.error || 'Failed to post transfer', 'error');
      }
    } catch (e) {
      showNotification('Transfer request failed', 'error');
    }
  };

  const handleSaveLoan = async (e: React.FormEvent) => {
    e.preventDefault();
    const principalVal = Number(loanForm.principal);
    if (!principalVal || principalVal <= 0 || !loanForm.lenderName) {
      showNotification('Please fill in lender name and principal amount', 'error');
      return;
    }

    const creditAcc = coa.find(a => a.code === loanForm.creditAccount);

    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voucherType: 'RECEIPT',
          date: loanForm.startDate,
          referenceNo: `LN-${Date.now().toString().slice(-4)}`,
          narration: loanForm.narration || `Corporate borrowing from ${loanForm.lenderName} @ ${loanForm.annualInterestRate}% p.a.`,
          lines: [
            {
              accountCode: loanForm.creditAccount,
              accountName: creditAcc?.name || 'HDFC Bank - Current A/C',
              debit: principalVal,
              credit: 0
            },
            {
              accountCode: '2060',
              accountName: 'Corporate Loans & Director Borrowings',
              debit: 0,
              credit: principalVal
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        const newLoan = {
          id: `loan-${Date.now()}`,
          lenderName: loanForm.lenderName,
          principal: principalVal,
          annualInterestRate: Number(loanForm.annualInterestRate) || 9.0,
          startDate: loanForm.startDate,
          dueDate: loanForm.dueDate,
          creditAccount: loanForm.creditAccount,
          status: 'ACTIVE' as const,
          narration: loanForm.narration
        };
        setLoans(prev => [newLoan, ...prev]);
        showNotification(`✅ Corporate loan recorded & balanced ledger voucher posted into Tally Daybook!`, 'success');
        setShowLoanModal(false);
        setLoanForm({
          lenderName: '',
          principal: '',
          annualInterestRate: '9.0',
          startDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
          creditAccount: '1020',
          narration: ''
        });
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        fetchData(true);
      } else {
        showNotification(data.error || 'Failed to record loan', 'error');
      }
    } catch (e) {
      showNotification('Loan entry failed', 'error');
    }
  };

  const handleDeleteVoucher = async (voucher: JournalVoucher) => {
    try {
      const res = await fetch(`/api/accounts?id=${voucher.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification(`Voucher ${voucher.voucherNumber} moved to Recycle Bin`, 'info');
        setConfirmDeleteVoucher(null);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        fetchData(true);
      } else {
        showNotification(data.error || 'Failed to delete voucher', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deleting voucher', 'error');
    }
  };

  // Filtered Daybook
  const filteredJournals = journals.filter(v => {
    const matchesFilter = voucherFilter === 'ALL' || v.voucherType === voucherFilter;
    const matchesSearch = !searchQuery || 
      v.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.narration.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.lines.some(l => l.accountName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  // Calculate General Ledger entries for selected account
  const ledgerEntries = journals.flatMap(v => {
    const matchingLines = v.lines.filter(l => l.accountCode === selectedLedgerAccount);
    return matchingLines.map(l => ({
      voucherId: v.id,
      voucherNumber: v.voucherNumber,
      voucherType: v.voucherType,
      date: v.date,
      narration: v.narration,
      debit: l.debit,
      credit: l.credit,
      contraAccounts: v.lines.filter(o => o.accountCode !== selectedLedgerAccount).map(o => o.accountName).join(', ')
    }));
  });

  const selectedHead = coa.find(a => a.code === selectedLedgerAccount);
  const ledgerTotalDebit = ledgerEntries.reduce((s, e) => s + e.debit, 0);
  const ledgerTotalCredit = ledgerEntries.reduce((s, e) => s + e.credit, 0);

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg transition-all border ${
          notification.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : notification.type === 'error'
            ? 'bg-rose-50 text-rose-900 border-rose-200'
            : 'bg-slate-900 text-white border-slate-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : notification.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            ) : (
              <Clock className="w-5 h-5 text-slate-300 flex-shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="p-1 rounded-lg hover:bg-black/5 text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Double-Entry Accounting</h1>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                Tally Prime XML Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Standard Indian accounting standard ledger, automatic double-entry Daybook, Chart of Accounts, and statutory Trial Balance for Software & Digital Agency operations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => fetchData(true)}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh ledgers"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportTallyXML}
            disabled={isExporting}
            className="px-4 py-2 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            Export Tally XML
          </button>

          <button
            onClick={() => setShowTransferModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            + Transfer Cash ⇆ Bank
          </button>

          <button
            onClick={() => setShowVoucherModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Plus className="w-4 h-4" />
            + New Journal Voucher
          </button>
        </div>
      </div>

      {/* Accounting KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Assets</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{coa.filter(a => a.type === 'ASSET').reduce((s, a) => s + a.balance, 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Bank accounts, client receivables, fixed hardware</p>
        </div>

        {/* Total Liabilities & Equity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liabilities & Equity</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            ₹{coa.filter(a => a.type === 'LIABILITY' || a.type === 'EQUITY').reduce((s, a) => s + a.balance, 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Vendor payables, GST liability & equity capital</p>
        </div>

        {/* Net Profit & Margin */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Profit (P&L)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            ₹{(pnl?.netProfit || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Operating Net Margin: <span className="font-bold text-emerald-700">{pnl?.margin || 0}%</span>
          </p>
        </div>

        {/* Double-Entry Verification Status */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trial Balance Audit</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              trialBalance?.isBalanced ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-xl font-black ${trialBalance?.isBalanced ? 'text-emerald-700' : 'text-rose-600'}`}>
              {trialBalance?.isBalanced ? 'BALANCED' : 'IMBALANCE'}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              (₹{(trialBalance?.totalDebit || 0).toLocaleString('en-IN')})
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Debits = Credits: {trialBalance?.isBalanced ? '100% In Equilibrium' : `Diff: ₹${trialBalance?.difference}`}
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('daybook')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'daybook'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Daybook & Vouchers ({journals.length})
        </button>

        <button
          onClick={() => setActiveTab('coa')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'coa'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Table className="w-4 h-4" />
          Chart of Accounts ({coa.length})
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          General Ledger View
        </button>

        <button
          onClick={() => setActiveTab('trialBalance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'trialBalance'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Scale className="w-4 h-4" />
          Trial Balance & P&L Statement
        </button>

        <button
          onClick={() => setActiveTab('loans')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'loans'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Corporate Loans & Borrowings ({loans.length})
        </button>
      </div>

      {/* TAB 1: Daybook & Journal Vouchers */}
      {activeTab === 'daybook' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search voucher #, narration, or ledger account..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Voucher Type:</span>
              <select
                value={voucherFilter}
                onChange={e => setVoucherFilter(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">All Vouchers</option>
                <option value="JOURNAL">Journal Vouchers (JV)</option>
                <option value="RECEIPT">Receipt Vouchers (RCPT)</option>
                <option value="PAYMENT">Payment Vouchers (PMT)</option>
                <option value="CONTRA">Contra Vouchers (CTR)</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher No.</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Particulars / Ledger Breakdown</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredJournals.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No accounting vouchers match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredJournals.map(voucher => (
                      <tr key={voucher.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {voucher.date}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {voucher.voucherNumber}
                          {voucher.referenceNo && (
                            <span className="block text-[10px] font-mono text-slate-400">Ref: {voucher.referenceNo}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase border ${
                            voucher.voucherType === 'RECEIPT' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            voucher.voucherType === 'PAYMENT' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            voucher.voucherType === 'CONTRA' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-indigo-50 text-indigo-700 border-indigo-200'
                          }`}>
                            {voucher.voucherType}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 max-w-md">
                          <div className="space-y-1">
                            {voucher.lines.map((line, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px]">
                                <span className={line.debit > 0 ? 'font-semibold text-slate-900' : 'text-slate-600 pl-4'}>
                                  {line.debit > 0 ? 'Dr. ' : 'To '}
                                  {line.accountName} ({line.accountCode})
                                </span>
                                <span className="font-mono text-slate-500">
                                  ₹{(line.debit > 0 ? line.debit : line.credit).toLocaleString('en-IN')}
                                </span>
                              </div>
                            ))}
                            {voucher.narration && (
                              <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-100">
                                Narration: {voucher.narration}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{voucher.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          ₹{voucher.totalAmount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setInspectVoucher(voucher)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                              title="View Voucher"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setConfirmDeleteVoucher(voucher)}
                              className="p-1.5 text-rose-400 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Delete to Recycle Bin"
                            >
                              <Trash2 className="w-4 h-4" />
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

      {/* TAB 2: Chart of Accounts (COA) */}
      {activeTab === 'coa' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <p className="text-xs text-slate-600 font-medium">
              Standardized Indian Accounting Heads with Statutory GST & TDS groupings for IT and Digital services.
            </p>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
              {coa.length} Active Ledgers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const).map(accountType => {
              const heads = coa.filter(a => a.type === accountType);
              const totalTypeBalance = heads.reduce((sum, h) => sum + h.balance, 0);

              return (
                <div key={accountType} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                  <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-black text-slate-900 tracking-wider uppercase">
                        {accountType} ACCOUNTS
                      </h3>
                      <p className="text-[11px] text-slate-400">{heads.length} Sub-ledgers</p>
                    </div>
                    <span className="text-sm font-black font-mono text-slate-900">
                      ₹{totalTypeBalance.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 text-xs">
                    {heads.map(head => (
                      <div key={head.code} className="p-3.5 hover:bg-slate-50/50 flex items-center justify-between transition">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                              {head.code}
                            </span>
                            <span className="font-bold text-slate-800">{head.name}</span>
                          </div>
                          <span className="text-[11px] text-slate-400 mt-0.5 block">{head.subtype}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-slate-900 block">
                            ₹{head.balance.toLocaleString('en-IN')}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {head.type === 'ASSET' || head.type === 'EXPENSE' ? 'Dr Balance' : 'Cr Balance'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: General Ledger View */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Select Ledger Account Head:</label>
              <select
                value={selectedLedgerAccount}
                onChange={e => setSelectedLedgerAccount(e.target.value)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 min-w-[320px] focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {coa.map(head => (
                  <option key={head.code} value={head.code}>
                    {head.code} - {head.name} ({head.type})
                  </option>
                ))}
              </select>
            </div>

            {selectedHead && (
              <div className="text-right">
                <span className="text-[11px] font-bold text-slate-400 uppercase block">Current Closing Balance</span>
                <span className="text-2xl font-black font-mono text-slate-900">
                  ₹{selectedHead.balance.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mt-1">
                  {selectedHead.type === 'ASSET' || selectedHead.type === 'EXPENSE' ? 'DEBIT NORMAL' : 'CREDIT NORMAL'}
                </span>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Ledger Transaction History: {selectedHead?.name}</span>
              <div className="flex gap-4 font-mono">
                <span>Total Dr: ₹{ledgerTotalDebit.toLocaleString('en-IN')}</span>
                <span>Total Cr: ₹{ledgerTotalCredit.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Voucher No</th>
                    <th className="py-3 px-4">Contra Particulars</th>
                    <th className="py-3 px-4">Narration</th>
                    <th className="py-3 px-4 text-right">Debit (₹)</th>
                    <th className="py-3 px-4 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {ledgerEntries.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No transactions recorded for this account head yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerEntries.map((entry, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{entry.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">{entry.voucherNumber}</td>
                        <td className="py-3 px-4 text-slate-700 font-medium">{entry.contraAccounts || 'Journal Contra'}</td>
                        <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">{entry.narration}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {entry.debit > 0 ? `₹${entry.debit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {entry.credit > 0 ? `₹${entry.credit.toLocaleString('en-IN')}` : '-'}
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

      {/* TAB 4: Trial Balance & P&L Statement */}
      {activeTab === 'trialBalance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Trial Balance Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Trial Balance Verification
                </h3>
                <p className="text-[11px] text-slate-400">Golden double-entry debit & credit equality</p>
              </div>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                trialBalance?.isBalanced 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {trialBalance?.isBalanced ? 'Balanced ✓' : 'Discrepancy'}
              </span>
            </div>

            <div className="flex-1 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-2.5 px-4">Code</th>
                    <th className="py-2.5 px-4">Account Head</th>
                    <th className="py-2.5 px-4 text-right">Debit (₹)</th>
                    <th className="py-2.5 px-4 text-right">Credit (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {coa.map(head => {
                    const isDebitNormal = head.type === 'ASSET' || head.type === 'EXPENSE';
                    return (
                      <tr key={head.code} className="hover:bg-slate-50/60">
                        <td className="py-2 px-4 font-mono text-[11px] text-slate-500">{head.code}</td>
                        <td className="py-2 px-4 font-bold text-slate-800">{head.name}</td>
                        <td className="py-2 px-4 text-right font-mono">
                          {isDebitNormal && head.balance > 0 ? `₹${head.balance.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-2 px-4 text-right font-mono">
                          {!isDebitNormal && head.balance > 0 ? `₹${head.balance.toLocaleString('en-IN')}` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-100 font-black text-slate-900 border-t-2 border-slate-300">
                    <td colSpan={2} className="py-3 px-4 uppercase tracking-wider text-xs">Total Equilibrium Sum</td>
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      ₹{(trialBalance?.totalDebit || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-xs">
                      ₹{(trialBalance?.totalCredit || 0).toLocaleString('en-IN')}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Profit & Loss Statement */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Profit & Loss Statement (P&L)
                </h3>
                <p className="text-[11px] text-slate-400">Gross margin & net operating profitability</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Operating Net: {pnl?.margin || 0}%
              </span>
            </div>

            <div className="p-6 space-y-5 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold text-slate-900">
                  <span className="text-sm">Revenue from Operations</span>
                  <span className="text-sm font-mono">₹{(pnl?.revenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500">
                  <div className="flex justify-between">
                    <span>Web & Software Retainers / Milestones</span>
                    <span className="font-mono">₹{(pnl?.revenue || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold text-slate-900">
                  <span className="text-sm">Direct Operating Costs</span>
                  <span className="text-sm font-mono text-rose-600">-₹{(pnl?.directExpenses || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500">
                  <div className="flex justify-between">
                    <span>Cloud Hosting, Freelancers & Influencer Payouts</span>
                    <span className="font-mono">₹{(pnl?.directExpenses || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex justify-between items-center font-black text-emerald-900 text-sm">
                <span>GROSS PROFIT</span>
                <span className="font-mono">₹{(pnl?.grossProfit || 0).toLocaleString('en-IN')}</span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-slate-100 font-bold text-slate-900">
                  <span className="text-sm">Indirect Operational Expenses</span>
                  <span className="text-sm font-mono text-rose-600">-₹{(pnl?.indirectExpenses || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pl-4 space-y-1 text-slate-500">
                  <div className="flex justify-between">
                    <span>Office Rent, EB Power, Staff Salaries, Pantry</span>
                    <span className="font-mono">₹{(pnl?.indirectExpenses || 0).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900 text-white rounded-xl shadow-md flex justify-between items-center font-black text-base">
                <div>
                  <span>NET OPERATING PROFIT</span>
                  <span className="block text-[11px] font-medium text-emerald-400">Net Profit Margin: {pnl?.margin || 0}%</span>
                </div>
                <span className="font-mono text-emerald-400">
                  ₹{(pnl?.netProfit || 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

{/* TAB 5: Corporate Loans & Borrowings */}
      {activeTab === 'loans' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Corporate Loans & Director Borrowings</h2>
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  Liability Head 2060
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Track corporate borrowings, director capital infusions, annual interest rates, and automated repayment vouchers.
              </p>
            </div>
            <button
              onClick={() => setShowLoanModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              + Record Corporate Borrowing
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Active Borrowings</span>
              <div className="text-2xl font-black text-slate-900 mt-2 font-mono">
                ₹{loans.filter(l => l.status === 'ACTIVE').reduce((s, l) => s + l.principal, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-500 mt-1">{loans.filter(l => l.status === 'ACTIVE').length} active corporate facilities</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Live Accrued Interest</span>
              <div className="text-2xl font-black text-amber-600 mt-2 font-mono">
                ₹{loans.reduce((sum, l) => {
                  const elapsedDays = Math.max(1, Math.floor((Date.now() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                  const interest = Math.round(l.principal * (l.annualInterestRate / 100) * (elapsedDays / 365));
                  return sum + (l.status === 'ACTIVE' ? interest : 0);
                }, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-amber-700 mt-1 font-semibold">Calculated on 365-day statutory basis</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Outstanding Obligation</span>
              <div className="text-2xl font-black text-rose-600 mt-2 font-mono">
                ₹{loans.reduce((sum, l) => {
                  if (l.status !== 'ACTIVE') return sum;
                  const elapsedDays = Math.max(1, Math.floor((Date.now() - new Date(l.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                  const interest = Math.round(l.principal * (l.annualInterestRate / 100) * (elapsedDays / 365));
                  return sum + l.principal + interest;
                }, 0).toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-rose-600 mt-1 font-semibold">Principal + Accrued Interest</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Lender / Creditor</th>
                    <th className="py-3 px-4 text-right">Principal</th>
                    <th className="py-3 px-4 text-center">Interest % (p.a.)</th>
                    <th className="py-3 px-4">Start Date</th>
                    <th className="py-3 px-4">Repayment Due</th>
                    <th className="py-3 px-4 text-right">Accrued Interest</th>
                    <th className="py-3 px-4 text-right">Total Payable</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {loans.map(loan => {
                    const elapsedDays = Math.max(1, Math.floor((Date.now() - new Date(loan.startDate).getTime()) / (1000 * 60 * 60 * 24)));
                    const interest = Math.round(loan.principal * (loan.annualInterestRate / 100) * (elapsedDays / 365));
                    const totalDue = loan.principal + interest;

                    return (
                      <tr key={loan.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{loan.lenderName}</span>
                          <span className="text-[10px] text-slate-400 block">{loan.narration}</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          ₹{loan.principal.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold">
                            {loan.annualInterestRate}%
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {loan.startDate}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                          {loan.dueDate}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-600">
                          +₹{interest.toLocaleString('en-IN')}
                          <span className="block text-[10px] text-slate-400 font-sans font-normal">{elapsedDays} days elapsed</span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                          ₹{totalDue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            loan.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {loan.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const res = await fetch('/api/accounts', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    voucherType: 'PAYMENT',
                                    date: new Date().toISOString().split('T')[0],
                                    referenceNo: `RPY-${loan.id}`,
                                    narration: `Repayment in full of corporate borrowing to ${loan.lenderName}`,
                                    lines: [
                                      {
                                        accountCode: '2060',
                                        accountName: 'Corporate Loans & Director Borrowings',
                                        debit: totalDue,
                                        credit: 0
                                      },
                                      {
                                        accountCode: loan.creditAccount || '1020',
                                        accountName: 'HDFC Bank - Current A/C (Operating)',
                                        debit: 0,
                                        credit: totalDue
                                      }
                                    ]
                                  })
                                });
                                const d = await res.json();
                                if (d.success) {
                                  setLoans(prev => prev.map(x => x.id === loan.id ? { ...x, status: 'REPAID' as any } : x));
                                  showNotification('✅ Loan marked fully repaid & balanced PAYMENT voucher posted.', 'success');
                                  fetchData(true);
                                }
                              } catch (e) {
                                showNotification('Failed to process repayment', 'error');
                              }
                            }}
                            disabled={loan.status !== 'ACTIVE'}
                            className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                              loan.status === 'ACTIVE'
                                ? 'bg-slate-900 hover:bg-black text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {loan.status === 'ACTIVE' ? 'Settle & Repay' : 'Repaid ✓'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Journal Voucher */}
      {showVoucherModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">New Journal Voucher</h3>
                  <p className="text-xs text-slate-400">Double-Entry Ledger Balancing Engine</p>
                </div>
              </div>
              <button 
                onClick={() => setShowVoucherModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVoucher} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Voucher Type *</label>
                  <select
                    value={voucherForm.voucherType}
                    onChange={e => setVoucherForm({ ...voucherForm, voucherType: e.target.value as any })}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="JOURNAL">JOURNAL (JV)</option>
                    <option value="PAYMENT">PAYMENT (PMT)</option>
                    <option value="RECEIPT">RECEIPT (RCPT)</option>
                    <option value="CONTRA">CONTRA (CTR)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={voucherForm.date}
                    onChange={e => setVoucherForm({ ...voucherForm, date: e.target.value })}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Reference / Cheque / UTR #</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC-NEFT-92817"
                    value={voucherForm.referenceNo}
                    onChange={e => setVoucherForm({ ...voucherForm, referenceNo: e.target.value })}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Accounting Ledger Lines (Dr / Cr) *</label>
                  <button
                    type="button"
                    onClick={addVoucherLine}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Add Ledger Line
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2.5 px-3">Ledger Account Head</th>
                        <th className="py-2.5 px-3 text-right w-36">Debit Amount (₹)</th>
                        <th className="py-2.5 px-3 text-right w-36">Credit Amount (₹)</th>
                        <th className="py-2.5 px-2 text-center w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {voucherForm.lines.map((line, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <select
                              value={line.accountCode}
                              onChange={e => handleLineChange(idx, 'accountCode', e.target.value)}
                              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              {coa.map(head => (
                                <option key={head.code} value={head.code}>
                                  {head.code} - {head.name} ({head.type})
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.debit || ''}
                              placeholder="0.00"
                              onChange={e => handleLineChange(idx, 'debit', e.target.value)}
                              className="w-full text-right font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.credit || ''}
                              placeholder="0.00"
                              onChange={e => handleLineChange(idx, 'credit', e.target.value)}
                              className="w-full text-right font-mono text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeVoucherLine(idx)}
                              className="text-slate-400 hover:text-rose-600 p-1"
                              title="Remove Line"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-black text-slate-900 border-t border-slate-200">
                        <td className="py-2.5 px-3 text-right">Totals:</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{formTotalDebit.toLocaleString('en-IN')}</td>
                        <td className="py-2.5 px-3 text-right font-mono">₹{formTotalCredit.toLocaleString('en-IN')}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Real-time Balanced Verification Banner */}
                <div className={`mt-2 p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold ${
                  isFormBalanced 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                }`}>
                  <div className="flex items-center gap-2">
                    {isFormBalanced ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    <span>{isFormBalanced ? 'Double-entry balanced (Debits equal Credits)' : `Imbalance: Difference is ₹${formDifference.toLocaleString('en-IN')}`}</span>
                  </div>
                  <span>{isFormBalanced ? 'Ready to Post' : 'Must Equalize'}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Statutory Narration *</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Being amount transferred / paid for AWS hosting server instance..."
                  value={voucherForm.narration}
                  onChange={e => setVoucherForm({ ...voucherForm, narration: e.target.value })}
                  className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isFormBalanced}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md ${
                    isFormBalanced 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20' 
                      : 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Post Voucher into Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Contra Voucher - Cash ⇆ Bank Transfer */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Contra Voucher: Cash ⇆ Bank</h3>
                  <p className="text-xs text-slate-400">Record fund movement between Cash in Hand & Bank Accounts</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowTransferModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSaveTransfer} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                {/* Transfer Direction Quick Toggle */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <label className="text-xs font-bold text-slate-700 block mb-2">Transfer Direction:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferForm(prev => ({
                          ...prev,
                          fromAccount: '1010',
                          toAccount: '1020',
                          narration: 'Cash deposited into HDFC Bank Account via CDM / Branch counter'
                        }));
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition text-center ${
                        transferForm.fromAccount === '1010' && transferForm.toAccount === '1020'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      💵 Cash ➔ 🏦 Bank (Deposit)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTransferForm(prev => ({
                          ...prev,
                          fromAccount: '1020',
                          toAccount: '1010',
                          narration: 'Petty cash self-withdrawal from HDFC Bank ATM / Cheque'
                        }));
                      }}
                      className={`py-2 px-3 rounded-lg text-xs font-bold border transition text-center ${
                        transferForm.fromAccount === '1020' && transferForm.toAccount === '1010'
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      🏦 Bank ➔ 💵 Cash (Withdrawal)
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">From Account (Source)</label>
                    <select
                      value={transferForm.fromAccount}
                      onChange={e => setTransferForm(prev => ({ ...prev, fromAccount: e.target.value }))}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white"
                      required
                    >
                      <option value="1010">1010 - Cash in Hand (Petty Cash)</option>
                      <option value="1020">1020 - HDFC Bank - Current A/C (Operating)</option>
                      <option value="1030">1030 - ICICI Bank - Corporate A/C (Tax & Reserve)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">To Account (Destination)</label>
                    <select
                      value={transferForm.toAccount}
                      onChange={e => setTransferForm(prev => ({ ...prev, toAccount: e.target.value }))}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 bg-white"
                      required
                    >
                      <option value="1020">1020 - HDFC Bank - Current A/C (Operating)</option>
                      <option value="1010">1010 - Cash in Hand (Petty Cash)</option>
                      <option value="1030">1030 - ICICI Bank - Corporate A/C (Tax & Reserve)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Transfer Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 50000"
                      value={transferForm.amount}
                      onChange={e => setTransferForm(prev => ({ ...prev, amount: e.target.value }))}
                      className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                      required
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Transfer Date *</label>
                    <input
                      type="date"
                      value={transferForm.date}
                      onChange={e => setTransferForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Cheque / Slip / UTR Reference No.</label>
                  <input
                    type="text"
                    placeholder="e.g. CHQ-882901 or CDM-TXN-4921"
                    value={transferForm.referenceNo}
                    onChange={e => setTransferForm(prev => ({ ...prev, referenceNo: e.target.value }))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Narration / Voucher Note</label>
                  <textarea
                    rows={2}
                    value={transferForm.narration}
                    onChange={e => setTransferForm(prev => ({ ...prev, narration: e.target.value }))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Posts a standard Indian Accounting CONTRA voucher with zero profit/loss impact.</span>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Post Contra Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Corporate Borrowing / Director Infusion */}
      {showLoanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Fixed Header */}
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Record Corporate Borrowing</h3>
                  <p className="text-xs text-slate-400">Head 2060: Loans, Promoter Infusion & Credit Facilities</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setShowLoanModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleSaveLoan} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Lender / Creditor Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Director Rajeshwar Sharma or HDFC Bank OD Facility"
                    value={loanForm.lenderName}
                    onChange={e => setLoanForm(prev => ({ ...prev, lenderName: e.target.value }))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Principal Amount (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 1000000"
                      value={loanForm.principal}
                      onChange={e => setLoanForm(prev => ({ ...prev, principal: e.target.value }))}
                      className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                      min="1000"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Annual Interest Rate (% p.a.)</label>
                    <input
                      type="number"
                      step="0.05"
                      placeholder="e.g. 8.5"
                      value={loanForm.annualInterestRate}
                      onChange={e => setLoanForm(prev => ({ ...prev, annualInterestRate: e.target.value }))}
                      className="w-full text-xs font-bold font-mono p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Disbursement Date *</label>
                    <input
                      type="date"
                      value={loanForm.startDate}
                      onChange={e => setLoanForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Repayment Due Date</label>
                    <input
                      type="date"
                      value={loanForm.dueDate}
                      onChange={e => setLoanForm(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Credited Account (Disbursement Inflow)</label>
                  <select
                    value={loanForm.creditAccount}
                    onChange={e => setLoanForm(prev => ({ ...prev, creditAccount: e.target.value }))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 bg-white"
                  >
                    <option value="1020">1020 - HDFC Bank - Current A/C (Operating)</option>
                    <option value="1030">1030 - ICICI Bank - Corporate A/C (Tax & Reserve)</option>
                    <option value="1010">1010 - Cash in Hand (Petty Cash)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Agreement / Purpose Narration</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Working capital infusion for Q3 payroll & AI cluster equipment"
                    value={loanForm.narration}
                    onChange={e => setLoanForm(prev => ({ ...prev, narration: e.target.value }))}
                    className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                  />
                </div>

                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-[11px] text-indigo-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Debits Bank (Asset) and Credits Liability Head 2060 with balanced double entry.</span>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowLoanModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Disburse & Post Loan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>

  );

}
