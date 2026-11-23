'use client';

import React, { useState, useEffect } from 'react';
import { 
  Receipt, 
  Plus, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Printer,
  Building,
  CreditCard,
  Lock,
  Phone,
  FileCheck,
  Check,
  AlertTriangle,
  Landmark,
  Coffee,
  Zap,
  ShoppingBag,
  ExternalLink,
  Pencil,
  Trash2,
  Filter,
  Search,
  BarChart3,
  Calendar,
  Layers,
  Percent,
  X
} from 'lucide-react';
import { 
  Invoice, 
  Expense, 
  Client, 
  InvoiceType, 
  ExpenseCategory, 
  Vendor, 
  GSTType, 
  Project,
  PaymentReceipt
} from '@/lib/types';
import { ClientPL } from '@/lib/dataService';
import { getWhatsAppDirectUrl } from '@/lib/whatsappService';
import { useAuth } from '@/lib/AuthContext';

const EXPENSE_CATEGORIES: { id: ExpenseCategory; label: string; icon: any; color: string }[] = [
  { id: 'SALARY', label: 'Staff Salaries', icon: DollarSign, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { id: 'RENT', label: 'Office Rent', icon: Building, color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { id: 'ELECTRICITY_EB', label: 'Electricity (EB)', icon: Zap, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'MAINTENANCE', label: 'Office Maintenance', icon: Building, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
  { id: 'PURCHASES_HARDWARE', label: 'Hardware Purchases', icon: ShoppingBag, color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { id: 'TEA_SNACKS', label: 'Tea & Snacks / Refreshments', icon: Coffee, color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { id: 'SAAS_TOOL', label: 'SaaS Software & Subscriptions', icon: CreditCard, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  { id: 'HOSTING_DOMAIN', label: 'Cloud Hosting / AWS', icon: Landmark, color: 'text-sky-600 bg-sky-50 border-sky-200' },
  { id: 'AD_SPEND', label: 'Client Ad Spend', icon: TrendingUp, color: 'text-orange-600 bg-orange-50 border-orange-200' },
  { id: 'SUBCONTRACTOR', label: 'Subcontractors / Freelancers', icon: FileText, color: 'text-violet-600 bg-violet-50 border-violet-200' },
  { id: 'MISCELLANEOUS', label: 'Miscellaneous Overheads', icon: Receipt, color: 'text-slate-600 bg-slate-50 border-slate-200' },
];

export default function FinancePage() {
  const { currentUser, canViewFinancials } = useAuth();

  const [activeTab, setActiveTab] = useState<'INVOICES' | 'PAYMENTS' | 'EXPENSES' | 'VENDORS' | 'PL'>('INVOICES');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [plClients, setPlClients] = useState<ClientPL[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Client Split Payments & Receipts State
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [duesSummary, setDuesSummary] = useState<any[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [activeReceiptPreview, setActiveReceiptPreview] = useState<PaymentReceipt | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    clientId: '',
    projectId: '',
    amount: '',
    milestoneLabel: 'Split Milestone Payment',
    paymentMethod: 'UPI',
    referenceId: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Filter States
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState<'ALL' | 'PAID' | 'SENT' | 'OVERDUE' | 'DRAFT'>('ALL');
  const [invoiceSearchQuery, setInvoiceSearchQuery] = useState('');
  
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseSearchQuery, setExpenseSearchQuery] = useState('');

  const [vendorStatusFilter, setVendorStatusFilter] = useState<'ALL' | 'PENDING_DUES' | 'SETTLED'>('ALL');
  const [vendorSearchQuery, setVendorSearchQuery] = useState('');

  // Creation Modals
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [payingVendor, setPayingVendor] = useState<Vendor | null>(null);
  const [vendorPayAmount, setVendorPayAmount] = useState('');
  const [vendorPayMethod, setVendorPayMethod] = useState('NEFT_BANK_TRANSFER');
  const [viewInvoice, setViewInvoice] = useState<Invoice | null>(null);

  // Edit Modals
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  // Forms
  const [invoiceForm, setInvoiceForm] = useState({
    clientId: '',
    projectId: '',
    type: 'RECURRING_RETAINER' as InvoiceType,
    subtotal: '250000',
    gstType: 'ADDITIONAL_18' as GSTType,
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
    isFinalInvoice: false,
    notes: 'Payment via NEFT / RTGS or UPI. Thank you for partnering with Nearlook Agency.'
  });

  const [expenseForm, setExpenseForm] = useState({
    clientId: '',
    vendorId: '',
    category: 'TEA_SNACKS' as ExpenseCategory,
    description: '',
    amount: '',
    receiptName: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [vendorForm, setVendorForm] = useState({
    companyName: '',
    contactPerson: '',
    phone: '',
    email: '',
    bankDetails: '',
    serviceCategory: 'HOSTING_SERVERS',
    totalPayable: '35000',
    advancePaid: '0',
    dueDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      const [invRes, expRes, vendRes, projRes, plRes, cliRes, payRes] = await Promise.all([
        fetch('/api/invoices').then(r => r.json()),
        fetch('/api/expenses').then(r => r.json()),
        fetch('/api/vendors').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/reports/pl').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
        fetch('/api/payments').then(r => r.json()),
      ]);

      if (invRes.success) setInvoices(invRes.data);
      if (expRes.success) setExpenses(expRes.data);
      if (vendRes.success) setVendors(vendRes.data);
      if (projRes.success) setProjects(projRes.data);
      if (plRes.success) setPlClients(plRes.data);
      if (cliRes.success) {
        setClients(cliRes.data);
        if (cliRes.data.length > 0 && !invoiceForm.clientId) {
          setInvoiceForm(prev => ({ ...prev, clientId: cliRes.data[0].id }));
        }
      }
      if (payRes.success) {
        setReceipts(payRes.receipts || []);
        setDuesSummary(payRes.duesSummary || []);
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

  // Split Milestone Payment Handlers
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentForm.clientId || !paymentForm.amount || Number(paymentForm.amount) <= 0) {
      alert('Please select a client/project and enter a valid payment amount.');
      return;
    }
    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: paymentForm.clientId,
          projectId: paymentForm.projectId || undefined,
          amount: Number(paymentForm.amount),
          milestoneLabel: paymentForm.milestoneLabel,
          paymentMethod: paymentForm.paymentMethod,
          referenceId: paymentForm.referenceId,
          notes: paymentForm.notes,
          paymentDate: paymentForm.paymentDate,
          staffName: currentUser?.name || 'Michael Patel',
          staffPhone: '+919876543208'
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setIsPaymentModalOpen(false);
        const receipt = data.data.receipt;
        setActiveReceiptPreview(receipt);
        if (receipt.autoInvoiceGenerated) {
          setActionAlert(`🎉 100% full settlement cleared! Tax Invoice ${receipt.invoiceNumber} automatically created and marked as PAID.`);
        } else {
          setActionAlert(`✅ Split payment of ₹${Number(paymentForm.amount).toLocaleString('en-IN')} recorded. Receipt ${receipt.receiptNumber} issued with remaining balance due: ₹${(receipt.remainingBalanceDue || 0).toLocaleString('en-IN')}.`);
        }
        setTimeout(() => setActionAlert(null), 6000);
      } else {
        alert(data.error || 'Failed to record payment');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReceipt = async (id: string, num: string) => {
    if (!confirm(`Are you sure you want to delete payment receipt ${num}? This will restore the client's balance due.`)) return;
    try {
      const res = await fetch(`/api/payments?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setActionAlert(`🗑️ Payment receipt ${num} deleted and contract balance restored.`);
        setTimeout(() => setActionAlert(null), 4000);
      } else {
        alert(data.error || 'Failed to delete receipt');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendLateFeeWhatsApp = async (projectId: string, clientPhone?: string, clientName?: string, balanceDue?: number, lateFeeAmount?: number) => {
    try {
      const res = await fetch(`/api/projects/${projectId}/late-fee`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setActionAlert(`📲 2% weekly late fee notice sent to ${clientName || 'Client'} via WhatsApp!`);
        setTimeout(() => setActionAlert(null), 4000);
        return;
      }
    } catch (e) {
      // Fallback direct WhatsApp link
    }
    const penalty = lateFeeAmount ? `₹${lateFeeAmount.toLocaleString('en-IN')}` : '2% compound per week';
    const bal = balanceDue ? `₹${balanceDue.toLocaleString('en-IN')}` : 'Overdue Balance';
    const waText = `⚠️ *Nearlook Agency: Payment Due & Late Fee Intimation Notice*\n\nHello ${clientName || 'Valued Client'},\n\nThis is an official notice regarding your outstanding balance of *${bal}*.\nAs per contract terms, an overdue late fee penalty of *${penalty}* (2%/week) has accrued.\n\nKindly process the installment today to prevent any campaign or deliverable delays.\n\nAccounts Desk: +91 98765 43208`;
    window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(clientPhone || '+919876543210')}&text=${encodeURIComponent(waText)}`, '_blank');
    setActionAlert(`📲 WhatsApp late fee notice dispatched.`);
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Invoice Handlers
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoiceForm)
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setIsInvoiceModalOpen(false);
        setActionAlert(`✅ Sequential invoice ${data.data.invoiceNumber} created successfully!`);
        setTimeout(() => setActionAlert(null), 5000);
      } else {
        alert(data.error || 'Failed to create invoice');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingInvoice.id,
          clientName: editingInvoice.clientName,
          clientPhone: editingInvoice.clientPhone,
          status: editingInvoice.status,
          subtotal: Number(editingInvoice.subtotal || editingInvoice.amount),
          gstType: editingInvoice.gstType,
          dueDate: editingInvoice.dueDate,
          notes: editingInvoice.notes
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setEditingInvoice(null);
        setActionAlert(`✅ Invoice ${data.data.invoiceNumber} updated successfully!`);
        setTimeout(() => setActionAlert(null), 4000);
      } else {
        alert(data.error || 'Failed to update invoice');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteInvoice = async (id: string, invNum: string) => {
    if (!confirm(`Are you sure you want to delete invoice ${invNum}? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setActionAlert(`🗑️ Invoice ${invNum} deleted successfully.`);
        setTimeout(() => setActionAlert(null), 4000);
      } else {
        alert(data.error || 'Failed to delete invoice');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReminder = async (invoiceId: string, invoiceNumber: string) => {
    try {
      const res = await fetch('/api/invoices/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId })
      });
      const data = await res.json();
      if (data.success) {
        setActionAlert(`📲 WhatsApp payment reminder sent for invoice ${invoiceNumber}!`);
        setTimeout(() => setActionAlert(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Expense Handlers
  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm)
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setIsExpenseModalOpen(false);
        setActionAlert(`✅ Office expense of ₹${Number(expenseForm.amount).toLocaleString('en-IN')} logged!`);
        setTimeout(() => setActionAlert(null), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    try {
      const res = await fetch('/api/expenses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingExpense.id,
          category: editingExpense.category,
          description: editingExpense.description,
          amount: Number(editingExpense.amount),
          date: editingExpense.date
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setEditingExpense(null);
        setActionAlert(`✅ Expense updated successfully!`);
        setTimeout(() => setActionAlert(null), 4000);
      } else {
        alert(data.error || 'Failed to update expense');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteExpense = async (id: string, desc: string) => {
    if (!confirm(`Are you sure you want to delete expense "${desc}"?`)) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setActionAlert(`🗑️ Expense "${desc}" deleted.`);
        setTimeout(() => setActionAlert(null), 4000);
      } else {
        alert(data.error || 'Failed to delete expense');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Vendor Handlers
  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/vendors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(vendorForm)
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setIsVendorModalOpen(false);
        setActionAlert(`✅ Supplier vendor "${vendorForm.companyName}" added!`);
        setTimeout(() => setActionAlert(null), 5000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingVendor) return;
    try {
      const res = await fetch('/api/vendors', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVendor.id,
          companyName: editingVendor.companyName,
          contactPerson: editingVendor.contactPerson,
          phone: editingVendor.phone,
          email: editingVendor.email,
          bankDetails: editingVendor.bankDetails,
          serviceCategory: editingVendor.serviceCategory,
          totalPayable: Number(editingVendor.totalPayable),
          advancePaid: Number(editingVendor.advancePaid),
          dueDate: editingVendor.dueDate
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setEditingVendor(null);
        setActionAlert(`✅ Vendor "${data.data.companyName}" updated successfully!`);
        setTimeout(() => setActionAlert(null), 4000);
      } else {
        alert(data.error || 'Failed to update vendor');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteVendor = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete vendor "${name}"?`)) return;
    try {
      const res = await fetch(`/api/vendors?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setActionAlert(`🗑️ Vendor "${name}" deleted.`);
        setTimeout(() => setActionAlert(null), 4000);
      } else {
        alert(data.error || 'Failed to delete vendor');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSettleVendorPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingVendor) return;

    try {
      const res = await fetch(`/api/vendors/${payingVendor.id}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(vendorPayAmount),
          paymentMethod: vendorPayMethod
        })
      });
      const data = await res.json();
      if (data.success) {
        await loadData();
        setPayingVendor(null);
        setVendorPayAmount('');
        setActionAlert(`✅ Vendor payment of ₹${Number(vendorPayAmount).toLocaleString('en-IN')} confirmed & WhatsApp remittance advice dispatched!`);
        setTimeout(() => setActionAlert(null), 5000);
      } else {
        alert(data.error || 'Failed to record vendor payment');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Aggregate Calculations
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.totalAmount, 0);
  const totalCollected = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalOutstanding = invoices.filter(i => i.status === 'SENT').reduce((sum, i) => sum + i.totalAmount, 0);
  const totalTaxLiabilityPayable = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + (i.internalTaxCalculated || 0), 0);
  const collectionRate = totalInvoiced > 0 ? Math.round((totalCollected / totalInvoiced) * 100) : 0;

  const totalExpensesAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRentEB = expenses.filter(e => e.category === 'RENT' || e.category === 'ELECTRICITY_EB').reduce((sum, e) => sum + e.amount, 0);
  const totalHardware = expenses.filter(e => e.category === 'PURCHASES_HARDWARE').reduce((sum, e) => sum + e.amount, 0);
  const totalPantry = expenses.filter(e => e.category === 'TEA_SNACKS').reduce((sum, e) => sum + e.amount, 0);

  const totalVendorPayables = vendors.reduce((sum, v) => sum + v.totalPayable, 0);
  const totalVendorAdvancePaid = vendors.reduce((sum, v) => sum + v.advancePaid, 0);
  const totalPendingVendorPayables = vendors.reduce((sum, v) => sum + v.balanceDue, 0);
  const activeVendorsWithDues = vendors.filter(v => v.balanceDue > 0).length;

  // Filtered Lists
  const filteredInvoices = invoices.filter(inv => {
    const isOverdue = inv.status === 'SENT' && new Date(inv.dueDate) < new Date();
    if (invoiceStatusFilter === 'PAID' && inv.status !== 'PAID') return false;
    if (invoiceStatusFilter === 'SENT' && (inv.status !== 'SENT' || isOverdue)) return false;
    if (invoiceStatusFilter === 'OVERDUE' && !isOverdue) return false;
    if (invoiceStatusFilter === 'DRAFT' && inv.status !== 'DRAFT') return false;

    if (invoiceSearchQuery) {
      const q = invoiceSearchQuery.toLowerCase();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.clientName.toLowerCase().includes(q) ||
        inv.clientPhone.includes(q)
      );
    }
    return true;
  });

  const filteredExpenses = expenses.filter(exp => {
    if (expenseCategoryFilter !== 'ALL' && exp.category !== expenseCategoryFilter) return false;
    if (expenseSearchQuery) {
      const q = expenseSearchQuery.toLowerCase();
      return (
        exp.description.toLowerCase().includes(q) ||
        (exp.vendorName && exp.vendorName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredVendors = vendors.filter(v => {
    if (vendorStatusFilter === 'PENDING_DUES' && v.balanceDue <= 0) return false;
    if (vendorStatusFilter === 'SETTLED' && v.balanceDue > 0) return false;
    if (vendorSearchQuery) {
      const q = vendorSearchQuery.toLowerCase();
      return (
        v.companyName.toLowerCase().includes(q) ||
        (v.phone && v.phone.includes(q)) ||
        v.serviceCategory.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Final invoice check
  const selectedProjectForInvoice = projects.find(p => p.id === invoiceForm.projectId);
  const isFinalInvoiceBlocked = invoiceForm.isFinalInvoice && selectedProjectForInvoice && selectedProjectForInvoice.balanceDue > 0;

  if (!canViewFinancials) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Restricted Module: Financial Accounts</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Agency invoices, revenue ledgers, tax liability calculations, and vendor balances are restricted to Admin/Owner and Account Managers under RBAC isolation policies.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-orange-600" />
            Financial Accounts, GST Liability & Vendor Portal (₹ INR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Dashboard overview, status filters, and full entry management (Edit & Delete) across Invoices, Expenses & Suppliers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setPaymentForm({
                clientId: clients[0]?.id || '',
                projectId: projects[0]?.id || '',
                amount: '',
                milestoneLabel: 'Split Milestone Payment',
                paymentMethod: 'UPI',
                referenceId: '',
                paymentDate: new Date().toISOString().split('T')[0],
                notes: ''
              });
              setIsPaymentModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Client Payment</span>
          </button>

          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Office Expense</span>
          </button>

          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200"
          >
            <Building className="w-3.5 h-3.5" />
            <span>Add Vendor</span>
          </button>

          <button
            onClick={() => setIsInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Issue Sequential Invoice</span>
          </button>
        </div>
      </div>

      {/* Action Alert Banner */}
      {actionAlert && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('INVOICES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'INVOICES'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Sequential Invoicing ({invoices.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'PAYMENTS'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Client Dues & Split Receipts ({receipts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('EXPENSES')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'EXPENSES'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Office Expenses & Bills ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('VENDORS')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'VENDORS'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>Vendor Management ({vendors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'PL'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/25'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Client P&L Breakdown</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: INVOICES (DASHBOARD VIEW + FILTERED LIST + CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'INVOICES' && (
        <div className="space-y-6">
          {/* Dashboard Summary Strip for Invoices */}
          <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-white p-5 rounded-3xl border border-orange-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-950">
                <BarChart3 className="w-4 h-4 text-orange-600" />
                <span>Invoicing & Collections Dashboard View</span>
              </div>
              <span className="text-xs font-mono font-bold text-orange-700 bg-white border border-orange-200 px-3 py-1 rounded-full shadow-2xs">
                Collection Ratio: {collectionRate}%
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Invoiced</span>
                <div className="mt-1.5 text-2xl font-black text-slate-900 font-mono">
                  ₹{totalInvoiced.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Gross commercial billings</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Settled Collections</span>
                <div className="mt-1.5 text-2xl font-black text-emerald-600 font-mono">
                  ₹{totalCollected.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-700 mt-1 font-semibold">Credited to bank accounts</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Overdue Client Dues</span>
                <div className="mt-1.5 text-2xl font-black text-amber-600 font-mono">
                  ₹{totalOutstanding.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-amber-800 mt-1 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-600" />
                  <span>2% compound fee active</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-orange-200 shadow-2xs">
                <span className="text-[11px] font-bold text-orange-700 uppercase tracking-wider flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-orange-600" />
                  <span>18% GST Tax Liability</span>
                </span>
                <div className="mt-1.5 text-2xl font-black text-orange-600 font-mono">
                  ₹{totalTaxLiabilityPayable.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Reserved for government return</div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Collections Progress</span>
                <span className="font-mono font-bold text-orange-600">₹{totalCollected.toLocaleString('en-IN')} / ₹{totalInvoiced.toLocaleString('en-IN')}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, collectionRate)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                Status:
              </span>
              {[
                { key: 'ALL', label: 'All Invoices', count: invoices.length },
                { key: 'PAID', label: 'Paid', count: invoices.filter(i => i.status === 'PAID').length },
                { key: 'SENT', label: 'Sent', count: invoices.filter(i => i.status === 'SENT' && new Date(i.dueDate) >= new Date()).length },
                { key: 'OVERDUE', label: 'Overdue (2%/wk)', count: invoices.filter(i => i.status === 'SENT' && new Date(i.dueDate) < new Date()).length },
                { key: 'DRAFT', label: 'Draft', count: invoices.filter(i => i.status === 'DRAFT').length },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setInvoiceStatusFilter(f.key as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    invoiceStatusFilter === f.key
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    invoiceStatusFilter === f.key ? 'bg-orange-700/80 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by invoice #, client, phone..."
                value={invoiceSearchQuery}
                onChange={(e) => setInvoiceSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Invoices List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Classification</th>
                    <th className="py-3 px-4 text-right">Subtotal (₹)</th>
                    <th className="py-3 px-4">Tax Structure</th>
                    <th className="py-3 px-4 text-right">Total Amount (₹)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 text-xs">
                        No invoices match the selected status filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isOverdue = inv.status === 'SENT' && new Date(inv.dueDate) < new Date();
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-orange-600">
                            {inv.invoiceNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{inv.clientName}</div>
                            <div className="text-[11px] text-slate-400 font-medium">{inv.clientPhone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                              {inv.type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                            ₹{(inv.subtotal || inv.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            {inv.gstType === 'ADDITIONAL_18' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                                +18% GST (₹{inv.taxAmount.toLocaleString('en-IN')})
                              </span>
                            )}
                            {inv.gstType === 'INCLUSIVE_18' && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                                18% Inclusive (₹{inv.internalTaxCalculated?.toLocaleString('en-IN')} tax)
                              </span>
                            )}
                            {(!inv.gstType || inv.gstType === 'NO_GST') && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                                No GST (0%)
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm font-mono">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              inv.status === 'PAID'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : isOverdue
                                ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {isOverdue ? 'OVERDUE' : inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {inv.dueDate}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* View PDF */}
                              <button
                                onClick={() => setViewInvoice(inv)}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                                title="View PDF"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>

                              {/* Send WhatsApp Reminder */}
                              {inv.status === 'SENT' && (
                                <button
                                  onClick={() => handleSendReminder(inv.id, inv.invoiceNumber)}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
                                  title="Send WhatsApp Payment Nudge"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Edit Invoice */}
                              <button
                                onClick={() => setEditingInvoice(inv)}
                                className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold transition-colors"
                                title="Edit Invoice Details"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Invoice */}
                              <button
                                onClick={() => handleDeleteInvoice(inv.id, inv.invoiceNumber)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                                title="Delete Invoice"
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: CLIENT PAYMENTS & SPLIT RECEIPTS (DELAYED INVOICING) */}
      {/* ========================================================= */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-6">
          {/* Dashboard Summary Strip for Client Dues & Split Milestone Receipts */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-white p-5 rounded-3xl border border-emerald-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-950">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Split Payments & Outstanding Milestone Dues</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-white border border-emerald-200 px-3 py-1 rounded-full shadow-2xs">
                  Late Fee Policy: 2% / Week Compound
                </span>
                <button
                  onClick={() => {
                    setPaymentForm({
                      clientId: clients[0]?.id || '',
                      projectId: projects[0]?.id || '',
                      amount: '',
                      milestoneLabel: 'Split Milestone Payment',
                      paymentMethod: 'UPI',
                      referenceId: '',
                      paymentDate: new Date().toISOString().split('T')[0],
                      notes: ''
                    });
                    setIsPaymentModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Record Client Payment</span>
                </button>
              </div>
            </div>

            {/* Metric KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Contract Portfolio</span>
                <div className="mt-1.5 text-2xl font-black text-slate-900 font-mono">
                  ₹{projects.reduce((sum, p) => sum + p.totalValue, 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Across all active contracts</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Milestone Payments Collected</span>
                <div className="mt-1.5 text-2xl font-black text-emerald-600 font-mono">
                  ₹{receipts.reduce((sum, r) => sum + r.amount, 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-700 mt-1 font-semibold">{receipts.length} verified receipts issued</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Active Balance Dues Pending</span>
                <div className="mt-1.5 text-2xl font-black text-rose-600 font-mono">
                  ₹{projects.reduce((sum, p) => sum + p.balanceDue, 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-rose-700 mt-1 font-semibold">Awaiting client installments</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-amber-200 shadow-2xs">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">Overdue Late Fees Accrued</span>
                <div className="mt-1.5 text-2xl font-black text-amber-600 font-mono">
                  ₹{duesSummary.reduce((sum, d) => sum + (d.lateFee?.penaltyAmount || 0), 0).toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-amber-800 mt-1 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>2% per week penalty applied</span>
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Workflow Notice */}
          <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-2xl text-xs flex items-start gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-xl shrink-0 mt-0.5">
              <FileCheck className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900">
                Automatic Delayed Invoicing & Split Receipt Rule
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Client milestone installments do <strong>not</strong> generate premature tax invoices. Whenever the client pays any sum, the CRM issues an official <strong>Payment Receipt</strong> detailing the paid sum, total contract value, and remaining balance due. Only when the balance due is <strong>completely settled (100% full payment)</strong>, the official Tax Invoice is <strong>automatically generated on that settlement date</strong> and marked as <span className="font-bold text-emerald-700">PAID</span>.
              </p>
            </div>
          </div>

          {/* SECTION 1: Active Contracts & Outstanding Dues Dashboard */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-orange-600" />
                  <span>Active Contracts & Outstanding Balance Dues</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Real-time milestone balance tracking and automated 2% weekly late fee computation.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Contract / Client</th>
                    <th className="py-3 px-4 text-right">Contract Total</th>
                    <th className="py-3 px-4 text-right">Collected to Date</th>
                    <th className="py-3 px-4 text-right">Remaining Balance Due</th>
                    <th className="py-3 px-4">Due Date & Late Fee (2%/wk)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {duesSummary.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No active contracts or payment dues recorded.
                      </td>
                    </tr>
                  ) : (
                    duesSummary.map((due: any) => {
                      const lateFee = due.lateFee || { weeksOverdue: 0, penaltyAmount: 0, totalDue: due.balanceDue };
                      const isOverdue = lateFee.weeksOverdue > 0;
                      const isFullySettled = due.balanceDue <= 0;

                      return (
                        <tr key={due.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{due.title}</div>
                            <div className="text-[11px] text-slate-500">{due.clientName} • {due.clientPhone || due.clientContact}</div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                            ₹{due.totalValue.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                            ₹{due.collectedAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isFullySettled ? (
                              <span className="font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ₹0 (100% Settled)
                              </span>
                            ) : (
                              <span className="font-mono font-black text-rose-600 text-sm">
                                ₹{due.balanceDue.toLocaleString('en-IN')}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isFullySettled ? (
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Cleared & Closed
                              </span>
                            ) : isOverdue ? (
                              <div className="space-y-0.5">
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                                  <span>{lateFee.weeksOverdue} Wks Overdue (+₹{lateFee.penaltyAmount.toLocaleString('en-IN')})</span>
                                </span>
                                <div className="text-[10px] text-slate-500 font-mono">
                                  Total with Late Fee: ₹{lateFee.totalDue.toLocaleString('en-IN')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-600 font-medium">
                                Due: {due.dueDate || 'On Delivery'}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isFullySettled
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : due.status === 'PENDING_ADVANCE'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}>
                              {isFullySettled ? 'COMPLETED (PAID)' : due.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isFullySettled && (
                                <button
                                  onClick={() => {
                                    setPaymentForm({
                                      clientId: due.clientId,
                                      projectId: due.id,
                                      amount: String(due.balanceDue),
                                      milestoneLabel: due.balanceDue === due.totalValue ? 'Advance Installment' : 'Milestone Settlement',
                                      paymentMethod: 'UPI',
                                      referenceId: '',
                                      paymentDate: new Date().toISOString().split('T')[0],
                                      notes: ''
                                    });
                                    setIsPaymentModalOpen(true);
                                  }}
                                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                                  title="Add payment installment"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Payment</span>
                                </button>
                              )}

                              {!isFullySettled && isOverdue && (
                                <button
                                  onClick={() => handleSendLateFeeWhatsApp(due.id, due.clientPhone, due.clientName, due.balanceDue, lateFee.penaltyAmount)}
                                  className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                  title="Send WhatsApp Late Fee Intimation Notice"
                                >
                                  <Send className="w-3 h-3 text-amber-700" />
                                  <span>WhatsApp Notice</span>
                                </button>
                              )}
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

          {/* SECTION 2: Verified Split Payment Receipts Directory */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Split Milestone Payment Receipts Ledger</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Official receipts issued to clients with remaining balance due breakdown & automated invoice links.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Client & Project</th>
                    <th className="py-3 px-4 text-right">Sum Received</th>
                    <th className="py-3 px-4 text-right">Remaining Balance Due</th>
                    <th className="py-3 px-4">Payment Mode & Ref</th>
                    <th className="py-3 px-4 text-center">Invoicing Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {receipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No payment receipts recorded yet. Click &quot;Record Client Payment&quot; above to log an installment.
                      </td>
                    </tr>
                  ) : (
                    receipts.map((rcp) => (
                      <tr key={rcp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-600">
                          {rcp.receiptNumber}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(rcp.createdAt).toLocaleDateString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{rcp.clientName}</div>
                          <div className="text-[11px] text-slate-400 font-medium">
                            {rcp.milestoneLabel} {rcp.projectTitle && `• ${rcp.projectTitle}`}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                          ₹{rcp.amount.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {rcp.remainingBalanceDue !== undefined && rcp.remainingBalanceDue <= 0 ? (
                            <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                              ₹0 (Settled)
                            </span>
                          ) : (
                            <span className="font-mono font-bold text-rose-600">
                              ₹{(rcp.remainingBalanceDue || 0).toLocaleString('en-IN')}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-slate-800">{rcp.paymentMethod}</div>
                          {rcp.referenceId && (
                            <div className="text-[10px] text-slate-400 font-mono">Ref: {rcp.referenceId}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {rcp.autoInvoiceGenerated && rcp.invoiceNumber ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Auto-Invoice: {rcp.invoiceNumber}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                              Withheld (Awaiting 100% Settlement)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Receipt */}
                            <button
                              onClick={() => setActiveReceiptPreview(rcp)}
                              className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                              title="View & Print Payment Receipt"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>

                            {/* WhatsApp Share */}
                            <button
                              onClick={() => {
                                const balText = rcp.remainingBalanceDue !== undefined 
                                  ? (rcp.remainingBalanceDue <= 0 ? 'Full Settlement (₹0 due)' : `₹${rcp.remainingBalanceDue.toLocaleString('en-IN')}`)
                                  : 'Contact accounts';
                                const msg = `💳 *Payment Receipt ${rcp.receiptNumber}*\n\nHello ${rcp.clientName},\nWe acknowledge receipt of *₹${rcp.amount.toLocaleString('en-IN')}* for [${rcp.milestoneLabel}].\n\n*Remaining Balance Due:* ${balText}\n${rcp.autoInvoiceGenerated ? `🎉 Official Tax Invoice ${rcp.invoiceNumber} generated!` : 'Official tax invoice will be generated upon 100% full settlement.'}\n\n- Nearlook Agency Accounts Desk`;
                                window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(rcp.clientPhone || '+919876543210')}&text=${encodeURIComponent(msg)}`, '_blank');
                              }}
                              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
                              title="Share Receipt on WhatsApp"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Receipt */}
                            <button
                              onClick={() => handleDeleteReceipt(rcp.id, rcp.receiptNumber)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                              title="Delete Receipt (Revert Balance)"
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

      {/* ========================================================= */}
      {/* TAB 3: OFFICE EXPENSES (DASHBOARD VIEW + CATEGORY FILTERS + CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-6">
          {/* Dashboard Summary Strip for Expenses */}
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-white p-5 rounded-3xl border border-blue-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span>Office Expenses & Bills Dashboard View</span>
              </div>
              <span className="text-xs font-mono font-bold text-blue-700 bg-white border border-blue-200 px-3 py-1 rounded-full shadow-2xs">
                Total Expenses: ₹{totalExpensesAmount.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Monthly Burn</span>
                <div className="mt-1.5 text-2xl font-black text-slate-900 font-mono">
                  ₹{totalExpensesAmount.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">{expenses.length} expense vouchers logged</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-blue-200 shadow-2xs">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">Lease Rent & EB Power</span>
                <div className="mt-1.5 text-2xl font-black text-blue-600 font-mono">
                  ₹{totalRentEB.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-blue-700 mt-1 font-semibold">Office facilities & electricity</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-2xs">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Hardware Purchases</span>
                <div className="mt-1.5 text-2xl font-black text-purple-600 font-mono">
                  ₹{totalHardware.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-purple-700 mt-1 font-semibold">Dell 4K monitors & assets</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Tea & Snacks / Pantry</span>
                <div className="mt-1.5 text-2xl font-black text-rose-600 font-mono">
                  ₹{totalPantry.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-rose-700 mt-1 font-semibold">Team refreshments facility</div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                Category:
              </span>
              <button
                onClick={() => setExpenseCategoryFilter('ALL')}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                  expenseCategoryFilter === 'ALL'
                    ? 'bg-orange-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All ({expenses.length})
              </button>
              {EXPENSE_CATEGORIES.map(c => {
                const count = expenses.filter(e => e.category === c.id).length;
                if (count === 0 && expenseCategoryFilter !== c.id) return null;
                return (
                  <button
                    key={c.id}
                    onClick={() => setExpenseCategoryFilter(c.id)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      expenseCategoryFilter === c.id
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{c.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      expenseCategoryFilter === c.id ? 'bg-orange-700/80 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search description, vendor..."
                value={expenseSearchQuery}
                onChange={(e) => setExpenseSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Expenses List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Vendor / Supplier</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Bill Receipt</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                        No office expenses match the active filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const catInfo = EXPENSE_CATEGORIES.find(c => c.id === exp.category);
                      return (
                        <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${catInfo?.color || 'bg-slate-100 text-slate-700'}`}>
                              {catInfo?.label || exp.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-medium text-slate-900">
                            {exp.description}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            {exp.vendorName || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm font-mono">
                            ₹{exp.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                            {exp.date}
                          </td>
                          <td className="py-3.5 px-4">
                            {exp.receiptName ? (
                              <span className="text-[10px] font-mono text-orange-600 font-bold bg-orange-50 border border-orange-200 px-2 py-0.5 rounded">
                                {exp.receiptName}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No attachment</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Edit Expense */}
                              <button
                                onClick={() => setEditingExpense(exp)}
                                className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold transition-colors"
                                title="Edit Expense"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Expense */}
                              <button
                                onClick={() => handleDeleteExpense(exp.id, exp.description)}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                                title="Delete Expense"
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
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: VENDOR MANAGEMENT (DASHBOARD VIEW + STATUS FILTERS + CRUD) */}
      {/* ========================================================= */}
      {activeTab === 'VENDORS' && (
        <div className="space-y-6">
          {/* Dashboard Summary Strip for Vendors */}
          <div className="bg-gradient-to-r from-rose-500/10 via-purple-500/5 to-white p-5 rounded-3xl border border-rose-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900">
                <BarChart3 className="w-4 h-4 text-rose-600" />
                <span>Vendor Payables & Supplier Accounts Dashboard View</span>
              </div>
              <span className="text-xs font-mono font-bold text-rose-700 bg-white border border-rose-200 px-3 py-1 rounded-full shadow-2xs">
                Active Supplier Accounts: {vendors.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Commitments</span>
                <div className="mt-1.5 text-2xl font-black text-slate-900 font-mono">
                  ₹{totalVendorPayables.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Total contract value</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-emerald-200 shadow-2xs">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Payments Disbursed</span>
                <div className="mt-1.5 text-2xl font-black text-emerald-600 font-mono">
                  ₹{totalVendorAdvancePaid.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-emerald-700 mt-1 font-semibold">Remitted to supplier banks</div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-rose-200 shadow-2xs">
                <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">Net Balance Due</span>
                <div className="mt-1.5 text-2xl font-black text-rose-600 font-mono">
                  ₹{totalPendingVendorPayables.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-rose-700 mt-1 font-semibold">
                  Awaiting settlement
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white border border-purple-200 shadow-2xs">
                <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Suppliers with Dues</span>
                <div className="mt-1.5 text-2xl font-black text-purple-600 font-mono">
                  {activeVendorsWithDues} Vendors
                </div>
                <div className="text-[10px] text-purple-700 mt-1 font-semibold">Pending disbursement</div>
              </div>
            </div>
          </div>

          {/* Filter Bar & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Status Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" />
                Status:
              </span>
              {[
                { key: 'ALL', label: 'All Suppliers', count: vendors.length },
                { key: 'PENDING_DUES', label: 'Pending Dues (Balance > 0)', count: vendors.filter(v => v.balanceDue > 0).length },
                { key: 'SETTLED', label: 'Settled / Nil Balance', count: vendors.filter(v => v.balanceDue === 0).length },
              ].map(f => (
                <button
                  key={f.key}
                  onClick={() => setVendorStatusFilter(f.key as any)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                    vendorStatusFilter === f.key
                      ? 'bg-orange-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{f.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    vendorStatusFilter === f.key ? 'bg-orange-700/80 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {f.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search vendor, phone, service..."
                value={vendorSearchQuery}
                onChange={(e) => setVendorSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          {/* Vendors List Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                  <tr>
                    <th className="py-3 px-4">Vendor Company</th>
                    <th className="py-3 px-4">Service Category</th>
                    <th className="py-3 px-4">Contact / Phone</th>
                    <th className="py-3 px-4 text-right">Total Payable (₹)</th>
                    <th className="py-3 px-4 text-right">Disbursed Amount (₹)</th>
                    <th className="py-3 px-4 text-right">Balance Due (₹)</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVendors.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                        No vendors match the active filter or search query.
                      </td>
                    </tr>
                  ) : (
                    filteredVendors.map((vendor) => (
                      <tr key={vendor.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          <div>{vendor.companyName}</div>
                          {vendor.bankDetails && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">{vendor.bankDetails}</div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            {vendor.serviceCategory}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-800">{vendor.contactPerson || '-'}</div>
                          <div className="text-[11px] text-slate-400 font-medium">{vendor.phone}</div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-700">
                          ₹{vendor.totalPayable.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                          ₹{vendor.advancePaid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-sm text-rose-600">
                          ₹{vendor.balanceDue.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {vendor.dueDate || '-'}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Settle Balance */}
                            {vendor.balanceDue > 0 && (
                              <button
                                onClick={() => {
                                  setPayingVendor(vendor);
                                  setVendorPayAmount(String(vendor.balanceDue));
                                }}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow-sm"
                              >
                                Settle
                              </button>
                            )}

                            {/* Edit Vendor */}
                            <button
                              onClick={() => setEditingVendor(vendor)}
                              className="p-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg text-xs font-bold transition-colors"
                              title="Edit Vendor"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Vendor */}
                            <button
                              onClick={() => handleDeleteVendor(vendor.id, vendor.companyName)}
                              className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                              title="Delete Vendor"
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

      {/* ========================================================= */}
      {/* TAB 4: CLIENT P&L BREAKDOWN */}
      {/* ========================================================= */}
      {activeTab === 'PL' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              Client Profit & Loss Margin Ledger
            </h2>
            <p className="text-xs text-slate-500">
              Live margin calculations deducting direct operational costs and server infrastructure from paid revenue.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                <tr>
                  <th className="py-3 px-4">Client Name</th>
                  <th className="py-3 px-4">Contract Structure</th>
                  <th className="py-3 px-4 text-right">Paid Revenue (₹)</th>
                  <th className="py-3 px-4 text-right">Direct Expenses (₹)</th>
                  <th className="py-3 px-4 text-right">Net Margin (₹)</th>
                  <th className="py-3 px-4 text-center">Profit %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {plClients.map((client) => (
                  <tr key={client.clientId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {client.clientName}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {client.clientType.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                      ₹{client.totalRevenue.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600">
                      ₹{client.totalExpenses.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 text-sm">
                      ₹{client.netProfit.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                        client.profitMarginPercent >= 70
                          ? 'bg-emerald-100 text-emerald-800'
                          : client.profitMarginPercent >= 40
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {client.profitMarginPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: EDIT INVOICE MODAL */}
      {/* ========================================================= */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Pencil className="w-4 h-4 text-orange-600" />
                <span>Edit Invoice: {editingInvoice.invoiceNumber}</span>
              </div>
              <button onClick={() => setEditingInvoice(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateInvoice} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Client Name</label>
                <input
                  type="text"
                  required
                  value={editingInvoice.clientName}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, clientName: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Subtotal Amount (₹ INR)</label>
                  <input
                    type="number"
                    required
                    value={editingInvoice.subtotal || editingInvoice.amount}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, subtotal: Number(e.target.value), amount: Number(e.target.value) })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    required
                    value={editingInvoice.dueDate}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, dueDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Status</label>
                  <select
                    value={editingInvoice.status}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, status: e.target.value as any })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  >
                    <option value="SENT">SENT (Pending)</option>
                    <option value="PAID">PAID (Settled)</option>
                    <option value="OVERDUE">OVERDUE (2% Fee)</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">GST Structure</label>
                  <select
                    value={editingInvoice.gstType || 'ADDITIONAL_18'}
                    onChange={(e) => setEditingInvoice({ ...editingInvoice, gstType: e.target.value as any })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ADDITIONAL_18">+18% Additional GST</option>
                    <option value="INCLUSIVE_18">18% Inclusive GST</option>
                    <option value="NO_GST">No GST (0%)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Client WhatsApp Phone</label>
                <input
                  type="text"
                  value={editingInvoice.clientPhone || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, clientPhone: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Notes & Payment Terms</label>
                <textarea
                  rows={2}
                  value={editingInvoice.notes || ''}
                  onChange={(e) => setEditingInvoice({ ...editingInvoice, notes: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingInvoice(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: EDIT EXPENSE MODAL */}
      {/* ========================================================= */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Pencil className="w-4 h-4 text-orange-600" />
                <span>Edit Office Expense Entry</span>
              </div>
              <button onClick={() => setEditingExpense(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateExpense} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Category *</label>
                <select
                  value={editingExpense.category}
                  onChange={(e) => setEditingExpense({ ...editingExpense, category: e.target.value as any })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Description *</label>
                <input
                  type="text"
                  required
                  value={editingExpense.description}
                  onChange={(e) => setEditingExpense({ ...editingExpense, description: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={editingExpense.amount}
                    onChange={(e) => setEditingExpense({ ...editingExpense, amount: Number(e.target.value) })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Date *</label>
                  <input
                    type="date"
                    required
                    value={editingExpense.date}
                    onChange={(e) => setEditingExpense({ ...editingExpense, date: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: EDIT VENDOR MODAL */}
      {/* ========================================================= */}
      {editingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Pencil className="w-4 h-4 text-orange-600" />
                <span>Edit Supplier Vendor: {editingVendor.companyName}</span>
              </div>
              <button onClick={() => setEditingVendor(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateVendor} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Company Name *</label>
                <input
                  type="text"
                  required
                  value={editingVendor.companyName}
                  onChange={(e) => setEditingVendor({ ...editingVendor, companyName: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    value={editingVendor.contactPerson || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, contactPerson: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Phone (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    value={editingVendor.phone}
                    onChange={(e) => setEditingVendor({ ...editingVendor, phone: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Total Payable (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={editingVendor.totalPayable}
                    onChange={(e) => setEditingVendor({ ...editingVendor, totalPayable: Number(e.target.value) })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Disbursed Amount (₹ INR)</label>
                  <input
                    type="number"
                    value={editingVendor.advancePaid}
                    onChange={(e) => setEditingVendor({ ...editingVendor, advancePaid: Number(e.target.value) })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Service Category</label>
                  <input
                    type="text"
                    value={editingVendor.serviceCategory}
                    onChange={(e) => setEditingVendor({ ...editingVendor, serviceCategory: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Due Date</label>
                  <input
                    type="date"
                    value={editingVendor.dueDate || ''}
                    onChange={(e) => setEditingVendor({ ...editingVendor, dueDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Bank / NEFT Details</label>
                <input
                  type="text"
                  value={editingVendor.bankDetails || ''}
                  onChange={(e) => setEditingVendor({ ...editingVendor, bankDetails: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVendor(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 4: CREATE INVOICE MODAL */}
      {/* ========================================================= */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Plus className="w-4 h-4 text-orange-600" />
                <span>Issue Sequential Tax Invoice (INV-2026-XXX)</span>
              </div>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Client Account *</label>
                <select
                  required
                  value={invoiceForm.clientId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, clientId: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.contactName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Linked Project (Optional)</label>
                <select
                  value={invoiceForm.projectId}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, projectId: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="">-- No Specific Project --</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>[{p.status}] {p.title} (Balance: ₹{p.balanceDue.toLocaleString('en-IN')})</option>
                  ))}
                </select>
              </div>

              {/* Final Invoice Gate */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={invoiceForm.isFinalInvoice}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, isFinalInvoice: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span>This is the Final Handover Invoice for Project</span>
                </label>

                {isFinalInvoiceBlocked && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>
                      Final Invoice Blocked: Selected project has pending balance of ₹{selectedProjectForInvoice?.balanceDue.toLocaleString('en-IN')}. Dues must be zero before final handover.
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Subtotal Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    value={invoiceForm.subtotal}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, subtotal: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Maturity / Due Date *</label>
                  <input
                    type="date"
                    required
                    value={invoiceForm.dueDate}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Dynamic GST Rate Structure</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setInvoiceForm({ ...invoiceForm, gstType: 'ADDITIONAL_18' })}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      invoiceForm.gstType === 'ADDITIONAL_18'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    +18% Additional
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceForm({ ...invoiceForm, gstType: 'INCLUSIVE_18' })}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      invoiceForm.gstType === 'INCLUSIVE_18'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    18% Flat Inclusive
                  </button>
                  <button
                    type="button"
                    onClick={() => setInvoiceForm({ ...invoiceForm, gstType: 'NO_GST' })}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      invoiceForm.gstType === 'NO_GST'
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    No GST (0%)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Bank & Remittance Notes</label>
                <textarea
                  rows={2}
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInvoiceModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isFinalInvoiceBlocked}
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 5: LOG EXPENSE MODAL */}
      {/* ========================================================= */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Plus className="w-4 h-4 text-orange-600" />
                <span>Record Operational Office Expense</span>
              </div>
              <button onClick={() => setIsExpenseModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Expense Category *</label>
                <select
                  required
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value as any })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                >
                  {EXPENSE_CATEGORIES.map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Description / Bill Memo *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bescom EB Electricity Bill for Oct 2026"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="18500"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Expense Date *</label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Linked Supplier (Optional)</label>
                  <select
                    value={expenseForm.vendorId}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vendorId: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="">-- Direct Payment (No Vendor) --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>{v.companyName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Receipt Attachment</label>
                  <input
                    type="text"
                    placeholder="e.g. BESCOM_EB_Bill_Oct.pdf"
                    value={expenseForm.receiptName}
                    onChange={(e) => setExpenseForm({ ...expenseForm, receiptName: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 6: ADD VENDOR MODAL */}
      {/* ========================================================= */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <Building className="w-4 h-4 text-orange-600" />
                <span>Register Supplier / Vendor</span>
              </div>
              <button onClick={() => setIsVendorModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dell Enterprise Hardware India"
                  value={vendorForm.companyName}
                  onChange={(e) => setVendorForm({ ...vendorForm, companyName: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    placeholder="Rohan Mehra"
                    value={vendorForm.contactPerson}
                    onChange={(e) => setVendorForm({ ...vendorForm, contactPerson: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Phone (WhatsApp) *</label>
                  <input
                    type="text"
                    required
                    placeholder="+919876543280"
                    value={vendorForm.phone}
                    onChange={(e) => setVendorForm({ ...vendorForm, phone: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Total Contract / Bill (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="180000"
                    value={vendorForm.totalPayable}
                    onChange={(e) => setVendorForm({ ...vendorForm, totalPayable: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Disbursed Amount (₹ INR)</label>
                  <input
                    type="number"
                    value={vendorForm.advancePaid}
                    onChange={(e) => setVendorForm({ ...vendorForm, advancePaid: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Service Category</label>
                  <input
                    type="text"
                    value={vendorForm.serviceCategory}
                    onChange={(e) => setVendorForm({ ...vendorForm, serviceCategory: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Due Date</label>
                  <input
                    type="date"
                    value={vendorForm.dueDate}
                    onChange={(e) => setVendorForm({ ...vendorForm, dueDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Bank Details / IFSC</label>
                <input
                  type="text"
                  placeholder="HDFC Bank | A/C: 502000129481 | IFSC: HDFC0000128"
                  value={vendorForm.bankDetails}
                  onChange={(e) => setVendorForm({ ...vendorForm, bankDetails: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/20"
                >
                  Register Vendor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 7: SETTLE VENDOR PAYMENT */}
      {/* ========================================================= */}
      {payingVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Settle Vendor Balance: {payingVendor.companyName}</span>
              </div>
              <button onClick={() => setPayingVendor(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSettleVendorPayment} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Total Payable:</span>
                  <span className="font-mono font-bold text-slate-900">₹{payingVendor.totalPayable.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Payment Disbursed:</span>
                  <span className="font-mono font-bold text-emerald-600">₹{payingVendor.advancePaid.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs font-bold text-rose-600 pt-1 border-t border-slate-200">
                  <span>Remaining Due:</span>
                  <span className="font-mono text-sm">₹{payingVendor.balanceDue.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Settlement Amount (₹ INR) *</label>
                <input
                  type="number"
                  required
                  value={vendorPayAmount}
                  onChange={(e) => setVendorPayAmount(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Disbursement Method *</label>
                <select
                  value={vendorPayMethod}
                  onChange={(e) => setVendorPayMethod(e.target.value)}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="NEFT_BANK_TRANSFER">NEFT / RTGS Corporate Bank Transfer</option>
                  <option value="UPI_AUTOPAY">Corporate UPI / Immediate Payment</option>
                  <option value="CHEQUE">Corporate Account Payee Cheque</option>
                </select>
              </div>

              <div className="text-[11px] text-slate-500 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200 flex items-start gap-2">
                <Send className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <span>An automated payment confirmation notice will be dispatched to {payingVendor.phone} via WhatsApp.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingVendor(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Confirm Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 8: VIEW INVOICE MODAL */}
      {/* ========================================================= */}
      {viewInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">{viewInvoice.invoiceNumber}</h3>
                <span className="text-xs text-slate-500">{viewInvoice.clientName}</span>
              </div>
              <button onClick={() => setViewInvoice(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase">Billed To</span>
                <div className="font-bold text-slate-900 mt-1">{viewInvoice.clientName}</div>
                <div className="text-slate-500">{viewInvoice.clientPhone}</div>
                <div className="text-slate-500">{viewInvoice.clientEmail}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 font-bold uppercase">Invoice Metadata</span>
                <div className="font-semibold text-slate-800 mt-1">Issue Date: {viewInvoice.issueDate}</div>
                <div className="font-bold text-rose-600">Due Date: {viewInvoice.dueDate}</div>
                <div className="mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {viewInvoice.status}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2 px-3">Description</th>
                    <th className="py-2 px-3 text-center">Qty</th>
                    <th className="py-2 px-3 text-right">Rate</th>
                    <th className="py-2 px-3 text-right">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {viewInvoice.lineItems.map(item => (
                    <tr key={item.id}>
                      <td className="py-2 px-3 font-medium text-slate-800">{item.description}</td>
                      <td className="py-2 px-3 text-center font-mono">{item.quantity}</td>
                      <td className="py-2 px-3 text-right font-mono">₹{item.rate.toLocaleString('en-IN')}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">₹{item.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <div className="w-64 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold">₹{(viewInvoice.subtotal || viewInvoice.amount).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Rate:</span>
                  <span className="font-bold">{viewInvoice.gstType}</span>
                </div>
                {viewInvoice.taxAmount > 0 && (
                  <div className="flex justify-between text-blue-600">
                    <span>Tax (+18%):</span>
                    <span className="font-mono font-bold">₹{viewInvoice.taxAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 border-t border-slate-200 pt-1.5">
                  <span>Total Amount:</span>
                  <span className="font-mono text-orange-600">₹{viewInvoice.totalAmount.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setViewInvoice(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECORD CLIENT SPLIT PAYMENT (DELAYED INVOICING) */}
      {/* ========================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden my-8">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-slate-900">
                <CreditCard className="w-5 h-5 text-emerald-600" />
                <span>Record Client Payment (Split Installment)</span>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayment} className="p-6 space-y-4 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700">Select Contract / Project *</label>
                <select
                  required
                  value={paymentForm.projectId}
                  onChange={(e) => {
                    const selectedProj = projects.find(p => p.id === e.target.value);
                    setPaymentForm(prev => ({
                      ...prev,
                      projectId: e.target.value,
                      clientId: selectedProj ? selectedProj.clientId : prev.clientId,
                      amount: selectedProj ? String(selectedProj.balanceDue || selectedProj.advanceRequired || '') : prev.amount
                    }));
                  }}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                >
                  <option value="">Select Project Contract...</option>
                  {projects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {proj.title} ({proj.clientName}) — Balance: ₹{proj.balanceDue.toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Live Contract Financial Snapshot */}
              {(() => {
                const proj = projects.find(p => p.id === paymentForm.projectId);
                if (!proj) return null;
                const enterAmount = Number(paymentForm.amount) || 0;
                const newBalance = Math.max(0, proj.balanceDue - enterAmount);
                const isFullSettlement = proj.balanceDue > 0 && enterAmount >= proj.balanceDue;

                return (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-slate-400 font-bold uppercase block">Contract Value</span>
                        <strong className="font-mono text-slate-800 text-xs">₹{proj.totalValue.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-emerald-600 font-bold uppercase block">Paid to Date</span>
                        <strong className="font-mono text-emerald-600 text-xs">₹{proj.collectedAmount.toLocaleString('en-IN')}</strong>
                      </div>
                      <div className="p-2 bg-white rounded-xl border border-slate-100">
                        <span className="text-[10px] text-rose-600 font-bold uppercase block">Current Due</span>
                        <strong className="font-mono text-rose-600 text-xs">₹{proj.balanceDue.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    {/* Dynamic Invoicing Advice Box */}
                    {isFullSettlement ? (
                      <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[11px]">🎉 100% Full Balance Settlement Detected!</strong>
                          <span>This payment completely clears the balance due. The official Tax Invoice will be <strong>automatically generated on this date</strong> and marked as PAID.</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-[11px]">Milestone Installment (Delayed Invoicing)</strong>
                          <span>A Payment Receipt acknowledging ₹{enterAmount.toLocaleString('en-IN')} will be issued with remaining balance of ₹{newBalance.toLocaleString('en-IN')}. Tax invoice will <strong>not</strong> be generated until 100% settlement.</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Amount (₹ INR) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 350000"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-emerald-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Method *</label>
                  <select
                    value={paymentForm.paymentMethod}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value as any })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  >
                    <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
                    <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
                    <option value="BANK_TRANSFER">IMPS Fast Transfer</option>
                    <option value="CHEQUE">Bank Cheque / DD</option>
                    <option value="CASH">Cash Deposit</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700">Milestone Label</label>
                  <input
                    type="text"
                    placeholder="e.g. 50% Advance / Milestone 2"
                    value={paymentForm.milestoneLabel}
                    onChange={(e) => setPaymentForm({ ...paymentForm, milestoneLabel: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Payment Received Date</label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Bank Ref / UTR / Transaction ID</label>
                <input
                  type="text"
                  placeholder="e.g. UTR-982348219034 or UPI-TXN-102938"
                  value={paymentForm.referenceId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, referenceId: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Internal Accounts Notes</label>
                <textarea
                  rows={2}
                  placeholder="Confirmed on HDFC Current Account statement..."
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Payment & Issue Receipt</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PAYMENT RECEIPT PREVIEW MODAL */}
      {/* ========================================================= */}
      {activeReceiptPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden my-8 p-6 space-y-5">
            {/* Receipt Header */}
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 block">
                  Official Payment Acknowledgment
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">
                  Nearlook Digital Agency Pvt. Ltd.
                </h2>
                <div className="text-xs text-slate-500 mt-0.5">
                  GSTIN: 33AAACN1234F1Z8 • Accounts Desk: +91 98765 43208
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full block">
                  {activeReceiptPreview.receiptNumber}
                </span>
                <div className="text-xs text-slate-500 mt-1 font-semibold">
                  Date: {new Date(activeReceiptPreview.createdAt).toLocaleDateString('en-IN')}
                </div>
              </div>
            </div>

            {/* Client & Payment Info */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Received From</span>
                <strong className="text-slate-900 text-sm block mt-0.5">{activeReceiptPreview.clientName}</strong>
                {activeReceiptPreview.clientPhone && (
                  <span className="text-slate-500">{activeReceiptPreview.clientPhone}</span>
                )}
                {activeReceiptPreview.projectTitle && (
                  <div className="text-slate-600 font-semibold mt-1">Project: {activeReceiptPreview.projectTitle}</div>
                )}
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Payment Method</span>
                <strong className="text-slate-800 block mt-0.5">{activeReceiptPreview.paymentMethod}</strong>
                {activeReceiptPreview.referenceId && (
                  <div className="text-slate-500 font-mono text-[11px] mt-0.5">Ref: {activeReceiptPreview.referenceId}</div>
                )}
                <div className="text-emerald-700 font-bold mt-1">Milestone: {activeReceiptPreview.milestoneLabel}</div>
              </div>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4">Financial Ledger Component</th>
                    <th className="py-2.5 px-4 text-right">Amount (₹ INR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {activeReceiptPreview.totalContractValue !== undefined && (
                    <tr>
                      <td className="py-2.5 px-4 text-slate-600">Total Contract Value</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        ₹{activeReceiptPreview.totalContractValue.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-emerald-50/60 font-bold">
                    <td className="py-3 px-4 text-emerald-900">Amount Received in this Installment</td>
                    <td className="py-3 px-4 text-right font-mono text-emerald-700 text-base">
                      ₹{activeReceiptPreview.amount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                  {activeReceiptPreview.totalPaidToDate !== undefined && (
                    <tr>
                      <td className="py-2.5 px-4 text-slate-600">Cumulative Sum Collected to Date</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-800">
                        ₹{activeReceiptPreview.totalPaidToDate.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                  <tr className="bg-slate-50 font-bold">
                    <td className="py-2.5 px-4 text-slate-700">Remaining Balance Due</td>
                    <td className="py-2.5 px-4 text-right font-mono text-rose-600 text-sm">
                      {activeReceiptPreview.remainingBalanceDue !== undefined && activeReceiptPreview.remainingBalanceDue <= 0 ? (
                        <span className="text-emerald-700 font-bold">₹0 (100% Settled)</span>
                      ) : (
                        `₹${(activeReceiptPreview.remainingBalanceDue || 0).toLocaleString('en-IN')}`
                      )}
                    </td>
                  </tr>
                  {activeReceiptPreview.lateFeeAccrued !== undefined && activeReceiptPreview.lateFeeAccrued > 0 && (
                    <tr className="bg-amber-50">
                      <td className="py-2 px-4 text-amber-800 font-medium">Overdue Late Fee Accrued (2%/wk)</td>
                      <td className="py-2 px-4 text-right font-mono font-bold text-amber-700">
                        +₹{activeReceiptPreview.lateFeeAccrued.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Auto Invoice Notice */}
            {activeReceiptPreview.autoInvoiceGenerated && activeReceiptPreview.invoiceNumber ? (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <strong className="block">🎉 Full Settlement Completed!</strong>
                  <span>Official Tax Invoice <strong>{activeReceiptPreview.invoiceNumber}</strong> has been generated and marked as PAID.</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0" />
                <span>Official Tax Invoice will be generated upon 100% full settlement of the remaining balance.</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <span className="text-[11px] text-slate-400">
                Authorized Signature: {activeReceiptPreview.recordedByStaffName || 'Accounts Desk'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveReceiptPreview(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const balText = activeReceiptPreview.remainingBalanceDue !== undefined 
                      ? (activeReceiptPreview.remainingBalanceDue <= 0 ? 'Full Settlement (₹0 due)' : `₹${activeReceiptPreview.remainingBalanceDue.toLocaleString('en-IN')}`)
                      : 'Settled';
                    const msg = `💳 *Payment Receipt ${activeReceiptPreview.receiptNumber}*\n\nHello ${activeReceiptPreview.clientName},\nPayment of *₹${activeReceiptPreview.amount.toLocaleString('en-IN')}* for [${activeReceiptPreview.milestoneLabel}] has been received.\n\n*Remaining Balance Due:* ${balText}\n${activeReceiptPreview.autoInvoiceGenerated ? `🎉 Official Tax Invoice ${activeReceiptPreview.invoiceNumber} generated!` : 'Official tax invoice will be generated upon 100% full settlement.'}\n\n- Nearlook Agency Accounts Desk`;
                    window.open(`https://api.whatsapp.com/send?phone=${encodeURIComponent(activeReceiptPreview.clientPhone || '+919876543210')}&text=${encodeURIComponent(msg)}`, '_blank');
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
