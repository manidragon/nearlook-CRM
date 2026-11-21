'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  ExternalLink,
  Pencil,
  Trash2,
  Filter,
  Search,
  Calendar,
  Layers,
  Percent,
  X,
  Share2,
  Copy,
  Clock,
  Eye,
  RefreshCw,
  FolderKanban,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  PauseCircle,
  Bell,
  Download
} from 'lucide-react';
import {
  Invoice,
  Project,
  Client,
  PaymentReceipt,
  GSTType,
  InvoiceType,
  InvoicePaymentInstallment
} from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function ClientBillingPage() {
  const { currentStaff, canViewFinancials } = useAuth();

  const [activeTab, setActiveTab] = useState<'invoices' | 'receipts' | 'clients'>('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [duesSummary, setDuesSummary] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState('ALL');
  const [inflowFilter, setInflowFilter] = useState<'ALL' | 'THIS_MONTH' | 'OVERDUE' | 'UPCOMING'>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // New Modals for Requirements 3, 4, 5
  const [shareStatementModalInvoice, setShareStatementModalInvoice] = useState<Invoice | null>(null);
  const [paidInFullModalInvoice, setPaidInFullModalInvoice] = useState<Invoice | null>(null);
  const [consolidatedReceiptInvoice, setConsolidatedReceiptInvoice] = useState<Invoice | null>(null);

  const handleUpdateInvoiceDueDate = async (id: string, dueDate: string) => {
    try {
      const res = await fetch('/api/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, dueDate })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('✅ Due date updated successfully', 'success');
        loadBillingData(false);
      } else {
        showNotification(data.error || 'Failed to update due date', 'error');
      }
    } catch (e) {
      showNotification('Failed to update due date', 'error');
    }
  };

  // Split Payment Modal state
  const [showSplitPaymentModal, setShowSplitPaymentModal] = useState(false);
  const [splitForm, setSplitForm] = useState({
    clientId: '',
    projectId: '',
    invoiceId: '',
    amount: '',
    milestoneLabel: 'Split Installment',
    paymentMethod: 'UPI / Bank Transfer',
    referenceId: '',
    nextDueDate: '',
    nextDueAmount: '',
    notes: '',
    paymentDate: new Date().toISOString().split('T')[0]
  });

  // New Invoice Modal state (Enforces 1 Master Invoice per Project)
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    clientId: '',
    projectId: '',
    type: 'MILESTONE_WEB_DEV' as InvoiceType,
    subtotal: '',
    gstType: 'NO_GST' as GSTType,
    dueDate: '2026-11-22',
    notes: 'Official master invoice. Milestone payments credited upon verification.',
    lineItemDescription: 'Custom IT, Web & Cloud Development Deliverables',
    // Partial payment fields
    initialPaymentLabel: '1st Payment - Advance',
    initialPaymentAmount: '200000',
    initialPaymentDate: '2026-11-18',
    // Next scheduled installment
    nextScheduledPaymentAmount: '100000',
    nextScheduledDueDate: '2026-11-22',
    // Additional installments
    installments: [
      { id: 'inst-1', label: '1st Payment - Advance', amount: 200000, dueDate: '2026-11-18', paidAmount: 200000, status: 'PAID' as const, paidDate: '2026-11-18', paymentMethod: 'Bank Transfer / NEFT' },
      { id: 'inst-2', label: '2nd Payment - Milestone 1 Delivery', amount: 100000, dueDate: '2026-11-22', paidAmount: 0, status: 'PENDING' as const, paymentMethod: 'UPI / Bank Transfer' },
      { id: 'inst-3', label: '3rd Payment - Final Deployment & Handover', amount: 110650, dueDate: '2026-12-10', paidAmount: 0, status: 'PENDING' as const, paymentMethod: 'UPI / Bank Transfer' }
    ] as InvoicePaymentInstallment[],
    delayReason: 'NONE' as 'NONE' | 'OUR_MISTAKE_PROJECT_DELAY' | 'CLIENT_DELAY' | 'MUTUAL_AGREEMENT',
    delayNotes: '',
    isOnHold: false,
    holdReason: ''
  });

  // Receipt Share / Print Modal
  const [activeReceiptModal, setActiveReceiptModal] = useState<PaymentReceipt | null>(null);
  const [inspectInvoice, setInspectInvoice] = useState<Invoice | null>(null);
  const [confirmDeleteInv, setConfirmDeleteInv] = useState<Invoice | null>(null);
  const [confirmDeleteReceipt, setConfirmDeleteReceipt] = useState<PaymentReceipt | null>(null);

  // Edit Invoice Modal state (Master Invoice Editor)
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [editInvoiceForm, setEditInvoiceForm] = useState({
    invoiceNumber: '',
    amount: '',
    dueDate: '',
    status: 'PENDING' as any,
    notes: '',
    lateFeeAssigned: false,
    delayReason: 'NONE' as 'NONE' | 'OUR_MISTAKE_PROJECT_DELAY' | 'CLIENT_DELAY' | 'MUTUAL_AGREEMENT',
    delayNotes: '',
    isOnHold: false,
    holdReason: '',
    nextScheduledPaymentAmount: '',
    nextScheduledDueDate: '',
    installments: [] as InvoicePaymentInstallment[]
  });
  const [savingInvoiceEdit, setSavingInvoiceEdit] = useState(false);

  // Requirement 1 & 2: Real-time Live Balance Computations for Forms
  const editContractValue = Number(editInvoiceForm.amount || 0);
  const editTotalPaid = editInvoiceForm.installments.reduce((sum, inst) =>
    sum + (inst.status === 'PAID' ? Number(inst.paidAmount || inst.amount || 0) : 0), 0
  );
  const editLiveBalance = Math.max(0, editContractValue - editTotalPaid);
  const isEditNextScheduledOverAllocated = Number(editInvoiceForm.nextScheduledPaymentAmount || 0) > editLiveBalance;

  const newContractValue = Number(newInvoiceForm.subtotal || 0);
  const newTotalPaid = newInvoiceForm.installments.reduce((sum, inst) =>
    sum + (inst.status === 'PAID' ? Number(inst.paidAmount || inst.amount || 0) : 0), 0
  );
  const newLiveBalance = Math.max(0, newContractValue - newTotalPaid);
  const isNewNextScheduledOverAllocated = Number(newInvoiceForm.nextScheduledPaymentAmount || 0) > newLiveBalance;

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const loadBillingData = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/payments');
      const data = await res.json();
      if (data.success) {
        setReceipts(data.receipts || []);
        setDuesSummary(data.duesSummary || []);
        setProjects(data.projects || []);
        setClients(data.clients || []);
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error('Failed to load billing data:', err);
      showNotification('Failed to load client billing data', 'error');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadBillingData();

    const handleUpdate = () => loadBillingData(true);
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  // Toggle 2% weekly late fee calculation
  const handleToggleLateFee = async (id: string, type: 'PROJECT' | 'INVOICE', currentAssigned: boolean) => {
    const targetInv = invoices.find(i => i.id === id);
    if (!currentAssigned && targetInv?.delayReason === 'OUR_MISTAKE_PROJECT_DELAY') {
      showNotification('⚠️ Late fee cannot be assigned: This delay is attributed to Our Mistake / Internal Project Delay.', 'error');
      return;
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_LATE_FEE',
          id,
          type,
          assigned: !currentAssigned
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          !currentAssigned
            ? '✅ 2% per week late fee assigned! Penalty now actively calculates on overdue balance.'
            : 'Late fee calculation removed.',
          'info'
        );
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        loadBillingData(true);
      }
    } catch (err) {
      console.error(err);
      showNotification('Failed to toggle late fee', 'error');
    }
  };

  // Open Split Payment Modal pre-filled
  const handleOpenSplitModal = (item: { clientId: string; projectId?: string; invoiceId?: string; balance?: number }) => {
    setSplitForm({
      clientId: item.clientId || (clients[0]?.id || ''),
      projectId: item.projectId || '',
      invoiceId: item.invoiceId || '',
      amount: item.balance ? String(item.balance) : '',
      milestoneLabel: 'Split Installment',
      paymentMethod: 'UPI / Bank Transfer',
      referenceId: '',
      nextDueDate: '2026-12-10',
      nextDueAmount: '',
      notes: 'Split payment received against milestone deliverables.',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setShowSplitPaymentModal(true);
  };

  // Save Split Payment
  const handleSaveSplitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!splitForm.clientId || !splitForm.amount || Number(splitForm.amount) <= 0) {
      showNotification('Please enter a valid split payment amount.', 'error');
      return;
    }

    const enteredAmount = Number(splitForm.amount);

    if (splitForm.projectId) {
      const proj = projects.find(p => p.id === splitForm.projectId);
      if (proj && enteredAmount > proj.balanceDue) {
        showNotification(`⚠️ Overpayment Blocked: Entered amount (${formatINR(enteredAmount)}) exceeds remaining project contract balance (${formatINR(proj.balanceDue)}).`, 'error');
        return;
      }
    }

    if (splitForm.invoiceId) {
      const inv = invoices.find(i => i.id === splitForm.invoiceId);
      const remainingInvBalance = inv?.balanceDue ?? (inv ? inv.totalAmount - (inv.paidAmount || 0) : 0);
      if (inv && enteredAmount > remainingInvBalance) {
        showNotification(`⚠️ Overpayment Blocked: Entered amount (${formatINR(enteredAmount)}) exceeds remaining invoice balance (${formatINR(remainingInvBalance)}).`, 'error');
        return;
      }
    }

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...splitForm,
          staffId: currentStaff?.id || 'staff-acc',
          staffName: currentStaff?.name || 'Accounts Lead',
          staffPhone: currentStaff?.phone || '+919876543208'
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(data.message || 'Split payment recorded successfully! Payment Receipt Generated.', 'success');
        setShowSplitPaymentModal(false);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        await loadBillingData(true);

        // Open Share Receipt modal with the new receipt
        if (data.data?.receipt) {
          setActiveReceiptModal(data.data.receipt);
        }
      } else {
        showNotification(data.error || 'Failed to record split payment', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error recording split payment', 'error');
    }
  };

  // Save New Master Invoice (Single Invoice per Project)
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = Number(newInvoiceForm.subtotal);
    if (!newInvoiceForm.clientId || !amountVal || !newInvoiceForm.dueDate) {
      showNotification('Please select client, contract value, and due date.', 'error');
      return;
    }

    // Requirement 2: Validation check to cap next scheduled payment to remaining balance
    if (isNewNextScheduledOverAllocated) {
      showNotification(`⚠️ Over-allocation Blocked: Next scheduled payment cannot exceed remaining balance of ${formatINR(newLiveBalance)}.`, 'error');
      return;
    }

    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: newInvoiceForm.clientId,
          projectId: newInvoiceForm.projectId || undefined,
          type: newInvoiceForm.type,
          subtotal: amountVal,
          amount: amountVal,
          gstType: newInvoiceForm.gstType,
          dueDate: newInvoiceForm.dueDate,
          notes: newInvoiceForm.notes,
          installments: newInvoiceForm.installments,
          initialPaymentAmount: Number(newInvoiceForm.initialPaymentAmount || 0),
          initialPaymentLabel: newInvoiceForm.initialPaymentLabel,
          initialPaymentDate: newInvoiceForm.initialPaymentDate,
          nextScheduledPaymentAmount: Number(newInvoiceForm.nextScheduledPaymentAmount || 0),
          nextScheduledDueDate: newInvoiceForm.nextScheduledDueDate,
          delayReason: newInvoiceForm.delayReason,
          delayNotes: newInvoiceForm.delayNotes,
          isOnHold: newInvoiceForm.isOnHold,
          lineItems: [
            {
              id: `li-${Date.now()}`,
              description: newInvoiceForm.lineItemDescription || 'Custom Software Development & Milestone Services',
              quantity: 1,
              rate: amountVal,
              amount: amountVal
            }
          ]
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Master Invoice ${data.data?.invoiceNumber} saved! Single invoice per project rule enforced.`, 'success');
        setShowInvoiceModal(false);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        loadBillingData(true);

        // Requirement 3: Prompt immediate statement share if initial payment was marked paid
        if (data.data && newTotalPaid > 0) {
          setShareStatementModalInvoice(data.data);
        }
      } else {
        showNotification(data.error || 'Failed to create invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error creating invoice', 'error');
    }
  };

  // Edit Master Invoice Handlers
  const handleOpenEditInvoiceModal = (inv: Invoice) => {
    setEditingInvoice(inv);
    setEditInvoiceForm({
      invoiceNumber: inv.invoiceNumber,
      amount: String(inv.totalAmount || inv.amount || inv.subtotal),
      dueDate: inv.dueDate || '',
      status: inv.status || 'PENDING',
      notes: inv.notes || '',
      lateFeeAssigned: Boolean(inv.lateFeeAssigned),
      delayReason: (inv.delayReason as any) || 'NONE',
      delayNotes: inv.delayNotes || '',
      isOnHold: Boolean(inv.isOnHold),
      holdReason: inv.holdReason || '',
      nextScheduledPaymentAmount: inv.nextScheduledPaymentAmount ? String(inv.nextScheduledPaymentAmount) : '',
      nextScheduledDueDate: inv.nextScheduledDueDate || '',
      installments: inv.installments ? [...inv.installments] : [
        { id: 'inst-1', label: '1st Payment - Advance', amount: inv.paidAmount || 0, dueDate: inv.dueDate || '2026-11-18', paidAmount: inv.paidAmount || 0, status: (inv.paidAmount && inv.paidAmount > 0 ? 'PAID' : 'PENDING'), paymentMethod: 'Bank Transfer / NEFT' },
        { id: 'inst-2', label: '2nd Payment - Milestone Balance', amount: (inv.balanceDue || 0), dueDate: '2026-11-22', paidAmount: 0, status: 'PENDING', paymentMethod: 'UPI / Bank Transfer' }
      ]
    });
  };

  // Requirement 1: Live Status Change & Recalculation Handler
  const handleEditInstallmentStatusChange = (idx: number, newStatus: 'PAID' | 'PENDING' | 'OVERDUE') => {
    const updated = [...editInvoiceForm.installments];
    const target = updated[idx];
    target.status = newStatus;

    if (newStatus === 'PAID') {
      target.paidAmount = target.amount;
      if (!target.paidDate) target.paidDate = new Date().toISOString().split('T')[0];
      if (!target.paymentMethod) target.paymentMethod = 'UPI / Bank Transfer';
    } else if (newStatus === 'PENDING') {
      target.paidAmount = 0;
    }

    // Recalculate live total paid and live balance
    const updatedPaid = updated.reduce((s, it) => s + (it.status === 'PAID' ? Number(it.paidAmount || it.amount || 0) : 0), 0);
    const updatedBal = Math.max(0, editContractValue - updatedPaid);

    // Automatically cap next scheduled payment amount to remaining balance
    const currentNext = Number(editInvoiceForm.nextScheduledPaymentAmount || 0);
    const cappedNext = Math.min(currentNext, updatedBal);

    // Auto-advance invoice status
    let autoStatus = editInvoiceForm.status;
    if (updatedBal === 0 && updatedPaid > 0) {
      autoStatus = 'PAID';
    } else if (updatedPaid > 0) {
      autoStatus = 'PARTIALLY_PAID';
    } else {
      autoStatus = 'PENDING';
    }

    setEditInvoiceForm({
      ...editInvoiceForm,
      installments: updated,
      nextScheduledPaymentAmount: String(cappedNext),
      status: autoStatus
    });

    showNotification(`⚡ Real-time ledger updated: Remaining Balance is ${formatINR(updatedBal)}`, 'info');
  };

  const handleSaveInvoiceEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInvoice) return;

    // Requirement 2: Strict Over-allocation check
    if (isEditNextScheduledOverAllocated) {
      showNotification(`⚠️ Over-allocation Blocked: Next scheduled payment (${formatINR(Number(editInvoiceForm.nextScheduledPaymentAmount))}) exceeds remaining balance of ${formatINR(editLiveBalance)}. Click 'Cap to Max' to resolve.`, 'error');
      return;
    }

    setSavingInvoiceEdit(true);

    // If delay is our mistake, force late fee to false
    const finalLateFee = editInvoiceForm.delayReason === 'OUR_MISTAKE_PROJECT_DELAY' ? false : editInvoiceForm.lateFeeAssigned;
    const anyPaid = editInvoiceForm.installments.some(inst => inst.status === 'PAID');

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
          lateFeeAssigned: finalLateFee,
          delayReason: editInvoiceForm.delayReason,
          delayNotes: editInvoiceForm.delayNotes,
          isOnHold: editInvoiceForm.isOnHold,
          holdReason: editInvoiceForm.holdReason,
          nextScheduledPaymentAmount: Number(editInvoiceForm.nextScheduledPaymentAmount || 0),
          nextScheduledDueDate: editInvoiceForm.nextScheduledDueDate,
          installments: editInvoiceForm.installments
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`✅ Master Invoice ${editInvoiceForm.invoiceNumber} updated successfully!`, 'success');
        setEditingInvoice(null);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        loadBillingData(true);

        // Requirement 3: Prompt immediate full-statement share when an installment is marked PAID and saved
        if (data.data && anyPaid) {
          setShareStatementModalInvoice(data.data);
        }
      } else {
        showNotification(data.error || 'Failed to update invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error updating invoice', 'error');
    } finally {
      setSavingInvoiceEdit(false);
    }
  };

  // Delete Invoice
  const handleDeleteInvoice = async (inv: Invoice) => {
    try {
      const res = await fetch(`/api/invoices?id=${inv.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification(`Invoice ${inv.invoiceNumber} moved to Recycle Bin. Calculations updated.`, 'info');
        setConfirmDeleteInv(null);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        loadBillingData(true);
      } else {
        showNotification(data.error || 'Failed to delete invoice', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deleting invoice', 'error');
    }
  };

  // Delete Receipt
  const handleDeleteReceipt = async (receipt: PaymentReceipt) => {
    try {
      const res = await fetch(`/api/payments?id=${receipt.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification(`Receipt ${receipt.receiptNumber} moved to Recycle Bin. Balance reverted.`, 'info');
        setConfirmDeleteReceipt(null);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        loadBillingData(true);
      } else {
        showNotification(data.error || 'Failed to delete receipt', 'error');
      }
    } catch (err) {
      console.error(err);
      showNotification('Error deleting receipt', 'error');
    }
  };

  // Requirement 3: Single-Message Full Statement WhatsApp Generator
  const getSingleMessageStatementWhatsAppUrl = (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.clientId);
    const phone = inv.clientPhone || client?.whatsappNumber || '9876543210';
    const cleanPhone = phone.replace(/\D/g, '');

    const totalVal = inv.totalAmount || 0;
    const paidVal = inv.paidAmount || 0;
    const balVal = inv.balanceDue !== undefined ? inv.balanceDue : Math.max(0, totalVal - paidVal);
    const insts = inv.installments && inv.installments.length > 0 ? inv.installments : [];

    const installmentsText = insts.map((it) => {
      if (it.status === 'PAID') {
        return `  ✅ *${it.label}:* ₹${(it.paidAmount || it.amount).toLocaleString('en-IN')} (PAID on ${it.paidDate || 'verified'}${it.paymentMethod ? ` via ${it.paymentMethod}` : ''})`;
      } else {
        return `  ⏳ *${it.label}:* ₹${it.amount.toLocaleString('en-IN')} (PENDING - Due: ${it.dueDate || 'Scheduled'})`;
      }
    }).join('\n');

    const text =
      `📋 *OFFICIAL COMMERCIAL & PAYMENT STATEMENT*
*Invoice No:* ${inv.invoiceNumber}
*Client:* ${inv.clientName}
*Project:* ${inv.projectTitle || 'Agency Master Scope'}
----------------------------------------
💰 *Total Contract Value:* ₹${totalVal.toLocaleString('en-IN')}

📊 *INSTALLMENTS & SETTLEMENT BREAKDOWN:*
${installmentsText || `  ✅ Advance Paid: ₹${paidVal.toLocaleString('en-IN')}\n  ⏳ Balance Due: ₹${balVal.toLocaleString('en-IN')}`}
----------------------------------------
💵 *Total Paid to Date:* ₹${paidVal.toLocaleString('en-IN')}
⏳ *Remaining Balance to be Collected:* ₹${balVal.toLocaleString('en-IN')}
${inv.nextScheduledPaymentAmount && balVal > 0 ? `📅 *Next Scheduled Payment:* ₹${inv.nextScheduledPaymentAmount.toLocaleString('en-IN')} due on ${inv.nextScheduledDueDate || inv.dueDate || 'TBD'}` : ''}
========================================
${balVal === 0 ? '🎉 *STATUS: PAID IN FULL* • Project Commercials 100% Cleared.' : 'ℹ️ Sprints continue as per verified milestone schedule.'}

Accounts Desk: +91 98765 43208 • Nearlook Agency`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Requirement 4: Paid-in-Full Tax Invoice WhatsApp Generator
  const getPaidInFullInvoiceWhatsAppUrl = (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.clientId);
    const phone = inv.clientPhone || client?.whatsappNumber || '9876543210';
    const cleanPhone = phone.replace(/\D/g, '');

    const text =
      `🧾 *OFFICIAL FINAL TAX INVOICE: ${inv.invoiceNumber} (PAID IN FULL)*
----------------------------------------
Dear *${inv.clientName}*,
We are pleased to inform you that all milestone deliverables for *${inv.projectTitle || 'Custom Software Deliverables'}* have been settled in full.

💰 *Total Contract Value:* ₹${(inv.totalAmount || 0).toLocaleString('en-IN')}
✅ *Total Amount Credited:* ₹${(inv.paidAmount || inv.totalAmount || 0).toLocaleString('en-IN')}
🎉 *Outstanding Balance Due:* ₹0 (Zero Balance)
Status: *PAID IN FULL & CLOSED*
----------------------------------------
Thank you for partnering with Nearlook Agency (Nearlook Mart Pvt Ltd). Official digitally signed Tax Invoice is attached to your account portal.

Accounts & Finance Desk
Nearlook Agency • +91 98765 43208`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Compose Cumulative Balance Statement WhatsApp Receipt URL
  const getReceiptWhatsAppUrl = (receipt: PaymentReceipt) => {
    const client = clients.find(c => c.id === receipt.clientId);
    const phone = receipt.clientPhone || client?.whatsappNumber || '9876543210';
    const cleanPhone = phone.replace(/\D/g, '');

    const contractTotal = receipt.totalContractValue || 0;
    const paidToDate = receipt.totalPaidToDate || receipt.amount;
    const remainingBal = receipt.remainingBalanceDue ?? Math.max(0, contractTotal - paidToDate);

    const text =
      `💳 *OFFICIAL PAYMENT RECEIPT & CUMULATIVE STATEMENT*
*Receipt No:* ${receipt.receiptNumber}
----------------------------------------
Dear *${receipt.clientName}*,
We have verified and credited your milestone payment. Thank you!

💵 *Credit Received:* ₹${receipt.amount.toLocaleString('en-IN')}
🏷️ *Milestone Description:* ${receipt.milestoneLabel}
📁 *Project:* ${receipt.projectTitle || 'Software / Digital Retainer'}
📑 *Payment Mode:* ${receipt.paymentMethod} ${receipt.referenceId ? `(Ref: ${receipt.referenceId})` : ''}
🗓️ *Date Credited:* ${receipt.createdAt.split('T')[0]}

========================================
📊 *CUMULATIVE CONTRACT STATEMENT:*
💰 *Total Contract Value:* ₹${contractTotal.toLocaleString('en-IN')}
➖ *Total Paid to Date:* -₹${paidToDate.toLocaleString('en-IN')}
----------------------------------------
⏳ *Current Balance Due:* ₹${remainingBal.toLocaleString('en-IN')}
${receipt.nextDueDate ? `📅 *Next Scheduled Due Date:* ${receipt.nextDueDate}` : ''}
${receipt.nextDueAmount ? `💵 *Next Scheduled Amount:* ₹${receipt.nextDueAmount.toLocaleString('en-IN')}` : ''}
========================================
${remainingBal > 0 ? 'ℹ️ Final Tax Invoice marked CLOSED upon 100% full balance clearance.' : '🎉 All dues cleared in full! Project Commercials marked CLOSED.'}

Accounts Desk: +91 98765 43208 • Nearlook Agency`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Compose 2-Day Due Reminder WhatsApp URL
  const get2DayReminderWhatsAppUrl = (inv: Invoice) => {
    const phone = inv.clientPhone || '9876543210';
    const cleanPhone = phone.replace(/\D/g, '');
    const bal = inv.balanceDue !== undefined ? inv.balanceDue : inv.totalAmount;
    const nextAmount = inv.nextScheduledPaymentAmount || bal;

    const text =
      `🔔 *UPCOMING PAYMENT REMINDER (DUE IN 2 DAYS)*
----------------------------------------
Dear *${inv.clientName}*,
This is a gentle reminder that your scheduled milestone installment of *₹${nextAmount.toLocaleString('en-IN')}* for *${inv.projectTitle || inv.invoiceNumber}* is due in *2 days* on *${inv.dueDate || '2026-11-22'}*.

💰 *Total Contract Value:* ₹${inv.totalAmount.toLocaleString('en-IN')}
✅ *Paid to Date:* ₹${(inv.paidAmount || 0).toLocaleString('en-IN')}
⏳ *Remaining Balance:* ₹${bal.toLocaleString('en-IN')}
📅 *Due Date:* ${inv.dueDate || '2026-11-22'}
----------------------------------------
Kindly process the transfer via NEFT/UPI at your earliest convenience to maintain uninterrupted project sprint velocity.

Thank you!
Accounts Team: +91 98765 43208 • Nearlook Agency`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Compose Project On Hold Due to Non-Payment Notice WhatsApp URL
  const getOnHoldWhatsAppUrl = (inv: Invoice) => {
    const phone = inv.clientPhone || '9876543210';
    const cleanPhone = phone.replace(/\D/g, '');
    const bal = inv.balanceDue !== undefined ? inv.balanceDue : inv.totalAmount;

    const text =
      `🛑 *IMPORTANT NOTICE: PROJECT ON HOLD DUE TO OVERDUE PAYMENT*
----------------------------------------
Dear *${inv.clientName}*,
Regarding project *${inv.projectTitle || inv.invoiceNumber}*, the pending milestone payment of *₹${bal.toLocaleString('en-IN')}* was scheduled for *${inv.dueDate}* and is currently overdue.

⚠️ *Execution Status:*
As per our enterprise agency policy, *all development sprints, design reviews, and live production deployments are temporarily placed ON HOLD* until the outstanding balance is credited and reconciled.

💰 *Total Contract Value:* ₹${inv.totalAmount.toLocaleString('en-IN')}
⏳ *Overdue Balance Due:* ₹${bal.toLocaleString('en-IN')}
----------------------------------------
Please remit the pending dues to resume active sprints immediately. If you have already made the transfer, please reply with the UTR transaction slip.

Operations & Commercials Desk
Nearlook Agency • +91 98765 43208`;

    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
  };

  // Copy receipt summary to clipboard
  const handleCopyReceiptText = (receipt: PaymentReceipt) => {
    const contractTotal = receipt.totalContractValue || 0;
    const paidToDate = receipt.totalPaidToDate || receipt.amount;
    const remainingBal = receipt.remainingBalanceDue ?? Math.max(0, contractTotal - paidToDate);

    const summaryText = `Official Payment Receipt ${receipt.receiptNumber}\nClient: ${receipt.clientName}\nCredit Received: ₹${receipt.amount.toLocaleString('en-IN')}\nTotal Contract Value: ₹${contractTotal.toLocaleString('en-IN')}\nTotal Paid to Date: ₹${paidToDate.toLocaleString('en-IN')}\nRemaining Balance Due: ₹${remainingBal.toLocaleString('en-IN')}\nNext Due Date: ${receipt.nextDueDate || 'N/A'}`;
    navigator.clipboard.writeText(summaryText);
    showNotification('Receipt statement copied to clipboard!', 'info');
  };

  // Aggregate Metrics
  const totalProjectValue = projects.reduce((s, p) => s + (p.totalValue || 0), 0) +
    invoices.filter(i => !i.projectId).reduce((s, i) => s + (i.totalAmount || 0), 0);

  const totalPaidAmount = receipts.reduce((s, r) => s + (r.amount || 0), 0);

  const totalBalanceDue = projects.reduce((s, p) => s + (p.balanceDue || 0), 0) +
    invoices.filter(i => !i.projectId && i.status !== 'PAID' && i.status !== 'CLOSED').reduce((s, i) => s + (i.balanceDue !== undefined ? i.balanceDue : i.totalAmount), 0);

  // Expected Inflows This Month & Date Tracking (Simulated Today: 2026-11-20)
  const currentMonthStr = '2026-11';
  const todayStr = '2026-11-20';

  const expectedInflowsThisMonth = invoices.reduce((sum, inv) => {
    const isSettled = inv.status === 'PAID' || inv.status === 'CLOSED';
    const balance = inv.balanceDue !== undefined ? inv.balanceDue : (isSettled ? 0 : inv.totalAmount);
    if (balance <= 0) return sum;
    if (inv.dueDate && inv.dueDate.startsWith(currentMonthStr)) {
      return sum + balance;
    }
    return sum;
  }, 0);

  // Late fee total across all assigned overdue items (strictly zero if our mistake)
  const totalLateFeeAssigned = invoices
    .filter(i => i.lateFeeAssigned && i.delayReason !== 'OUR_MISTAKE_PROJECT_DELAY')
    .reduce((s, inv) => {
      const balance = inv.balanceDue !== undefined ? inv.balanceDue : inv.totalAmount;
      if (!inv.dueDate || balance <= 0) return s;
      if (inv.dueDate >= todayStr) return s;
      const dueTime = new Date(inv.dueDate).getTime();
      const diffDays = Math.floor((new Date(todayStr).getTime() - dueTime) / (1000 * 60 * 60 * 24));
      const wks = Math.max(1, Math.ceil(diffDays / 7));
      return s + Math.round(balance * 0.02 * wks);
    }, 0);

  // Filtered Invoices
  const filteredInvoices = invoices.filter(inv => {
    if (selectedClientFilter !== 'ALL' && inv.clientId !== selectedClientFilter) {
      return false;
    }

    const q = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      inv.invoiceNumber.toLowerCase().includes(q) ||
      inv.clientName.toLowerCase().includes(q) ||
      (inv.projectTitle && inv.projectTitle.toLowerCase().includes(q)) ||
      (inv.notes && inv.notes.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    const isSettled = inv.status === 'PAID' || inv.status === 'CLOSED';
    const balance = inv.balanceDue !== undefined ? inv.balanceDue : (isSettled ? 0 : inv.totalAmount);

    if (inflowFilter === 'THIS_MONTH') {
      return balance > 0 && Boolean(inv.dueDate && inv.dueDate.startsWith(currentMonthStr));
    }
    if (inflowFilter === 'OVERDUE') {
      return balance > 0 && Boolean(inv.dueDate && inv.dueDate < todayStr);
    }
    if (inflowFilter === 'UPCOMING') {
      return balance > 0 && Boolean(inv.dueDate && inv.dueDate >= todayStr);
    }
    return true;
  });

  // Filtered Receipts
  const filteredReceipts = receipts.filter(rcp => {
    if (selectedClientFilter !== 'ALL' && rcp.clientId !== selectedClientFilter) {
      return false;
    }

    const q = searchTerm.toLowerCase();
    return !searchTerm ||
      rcp.receiptNumber.toLowerCase().includes(q) ||
      rcp.clientName.toLowerCase().includes(q) ||
      rcp.milestoneLabel.toLowerCase().includes(q) ||
      (rcp.referenceId && rcp.referenceId.toLowerCase().includes(q));
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-between shadow-lg transition-all border ${notification.type === 'success'
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

      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">Client Billing & Invoices</h1>
              <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                Single Invoice per Project Engine
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
              Live balance recalculation on status change, capped scheduled payments, one-click statement sharing, paid-in-full tax invoices, and multi-split receipt views.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => loadBillingData(true)}
            disabled={isRefreshing}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            title="Refresh billing data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={() => setShowSplitPaymentModal(true)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
          >
            <Receipt className="w-4 h-4" />
            + Create Payment Receipt
          </button>

          <button
            onClick={() => {
              const defaultProj = projects[0];
              if (defaultProj) {
                setNewInvoiceForm({
                  ...newInvoiceForm,
                  clientId: defaultProj.clientId,
                  projectId: defaultProj.id,
                  subtotal: String(defaultProj.totalValue || 0)
                });
              }
              setShowInvoiceModal(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md"
          >
            <FileText className="w-4 h-4" />
            + Master Client Invoice
          </button>
        </div>
      </div>

      {/* Top 5 Billing Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Project / Contract Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Contract Value</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-slate-900">
            {formatINR(totalProjectValue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Across {projects.length} signed project master contracts
          </p>
        </div>

        {/* Total Amount Paid */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-emerald-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount Paid (Collected)</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-emerald-600">
            {formatINR(totalPaidAmount)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {receipts.length} split payment transactions credited
          </p>
        </div>

        {/* Balance Due */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Balance Due</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-rose-600">
            {formatINR(totalBalanceDue)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Outstanding receivables from active clients
          </p>
        </div>

        {/* Expected Inflows This Month */}
        <div className="bg-white p-5 rounded-2xl border border-indigo-200/80 shadow-sm hover:border-indigo-400 transition bg-gradient-to-br from-indigo-50/40 via-white to-blue-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">Inflows Due This Month</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-indigo-900 font-mono">
            {formatINR(expectedInflowsThisMonth)}
          </div>
          <p className="text-[11px] text-indigo-600 mt-1 font-semibold">
            Due for clearance in Nov 2026
          </p>
        </div>

        {/* Accrued 2% Weekly Late Fee */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">2% / Wk Late Fees</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black text-amber-600">
            {formatINR(totalLateFeeAssigned)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Zero penalty if marked Our Mistake / Delay
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'invoices'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Receipt className="w-4 h-4" />
          Master Client Invoices & Dues ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('receipts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'receipts'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Split Payment Receipts ({receipts.length})
        </button>

        <button
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${activeTab === 'clients'
            ? 'bg-slate-900 text-white shadow-sm'
            : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
        >
          <Building className="w-4 h-4" />
          Client Summary Ledger ({clients.length})
        </button>
      </div>

      {/* TAB 1: Client Invoices & Dues */}
      {activeTab === 'invoices' && (
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search invoice #, client, project..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              {/* Requirement 6: Client Dropdown Filter */}
              <div className="relative">
                <select
                  value={selectedClientFilter}
                  onChange={e => setSelectedClientFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Clients ({clients.length})</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.contactName})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Inflow Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setInflowFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${inflowFilter === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                All ({invoices.length})
              </button>
              <button
                type="button"
                onClick={() => setInflowFilter('THIS_MONTH')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${inflowFilter === 'THIS_MONTH' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
              >
                <Clock className="w-3.5 h-3.5" />
                Due This Month ({invoices.filter(i => {
                  const isSettled = i.status === 'PAID' || i.status === 'CLOSED';
                  const bal = i.balanceDue !== undefined ? i.balanceDue : (isSettled ? 0 : i.totalAmount);
                  return bal > 0 && i.dueDate && i.dueDate.startsWith(currentMonthStr);
                }).length})
              </button>
              <button
                type="button"
                onClick={() => setInflowFilter('OVERDUE')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${inflowFilter === 'OVERDUE' ? 'bg-rose-600 text-white shadow-xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'}`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Overdue ({invoices.filter(i => {
                  const isSettled = i.status === 'PAID' || i.status === 'CLOSED';
                  const bal = i.balanceDue !== undefined ? i.balanceDue : (isSettled ? 0 : i.totalAmount);
                  return bal > 0 && i.dueDate && i.dueDate < todayStr;
                }).length})
              </button>
              <button
                type="button"
                onClick={() => setInflowFilter('UPCOMING')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${inflowFilter === 'UPCOMING' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Upcoming ({invoices.filter(i => {
                  const isSettled = i.status === 'PAID' || i.status === 'CLOSED';
                  const bal = i.balanceDue !== undefined ? i.balanceDue : (isSettled ? 0 : i.totalAmount);
                  return bal > 0 && i.dueDate && i.dueDate >= todayStr;
                }).length})
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Master Invoice #</th>
                    <th className="py-3 px-4">Client & Project</th>
                    <th className="py-3 px-4 text-right">Contract Value</th>
                    <th className="py-3 px-4 text-right">Paid</th>
                    <th className="py-3 px-4 text-right">Balance Due</th>
                    <th className="py-3 px-4">Scheduled Due Date</th>
                    <th className="py-3 px-4">Delay & Hold Status</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions & Communication</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No client invoices match the filter.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map(inv => {
                      const isSettled = inv.status === 'PAID' || inv.status === 'CLOSED';
                      const balance = inv.balanceDue !== undefined ? inv.balanceDue : (isSettled ? 0 : inv.totalAmount);
                      const paid = inv.paidAmount !== undefined ? inv.paidAmount : (isSettled ? inv.totalAmount : 0);

                      // Due date computation relative to 2026-11-20
                      let dueBadge = { text: 'No Due Date', color: 'bg-slate-100 text-slate-600' };
                      let isOverdue = false;
                      let isDueIn2Days = false;
                      let weeksOverdue = 0;

                      if (inv.dueDate && balance > 0) {
                        const dueTime = new Date(inv.dueDate).getTime();
                        const nowTime = new Date('2026-11-20T12:00:00Z').getTime();
                        const diffDays = Math.ceil((dueTime - nowTime) / (1000 * 60 * 60 * 24));

                        if (diffDays === 2 || inv.dueDate === '2026-11-22') {
                          isDueIn2Days = true;
                          dueBadge = { text: '🔔 Due in 2 Days (Nov 22)', color: 'bg-amber-100 text-amber-900 border-amber-300 font-black' };
                        } else if (diffDays > 0) {
                          dueBadge = { text: `Due in ${diffDays} days`, color: 'bg-blue-50 text-blue-700 border-blue-200' };
                        } else if (diffDays === 0) {
                          dueBadge = { text: 'Due Today', color: 'bg-amber-50 text-amber-700 border-amber-200 font-bold' };
                        } else {
                          isOverdue = true;
                          weeksOverdue = Math.max(1, Math.ceil(Math.abs(diffDays) / 7));
                          dueBadge = { text: `Overdue ${Math.abs(diffDays)}d (${weeksOverdue}w)`, color: 'bg-rose-50 text-rose-700 border-rose-200 font-bold' };
                        }
                      } else if (balance === 0) {
                        dueBadge = { text: 'Settled in Full ✓', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold' };
                      }

                      // 2% late fee calculation if assigned AND NOT our mistake
                      const isOurMistake = inv.delayReason === 'OUR_MISTAKE_PROJECT_DELAY';
                      const lateFeeAmount = (inv.lateFeeAssigned && isOverdue && balance > 0 && !isOurMistake)
                        ? Math.round(balance * 0.02 * weeksOverdue)
                        : 0;

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {inv.invoiceNumber}
                            {inv.recoveredFrom && (
                              <span className="block text-[10px] text-emerald-600 font-sans font-semibold">
                                Recovered from {inv.recoveredFrom}
                              </span>
                            )}
                            <span className="block text-[10px] text-slate-400 font-sans font-normal">
                              {inv.type ? inv.type.replace(/_/g, ' ') : 'Master Project'}
                            </span>
                            {inv.isOnHold && (
                              <span className="inline-block mt-1 px-1.5 py-0.5 rounded bg-rose-600 text-white font-sans text-[9px] font-black uppercase tracking-wider">
                                🛑 ON HOLD
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900 block">{inv.clientName}</span>
                            <span className="text-[11px] text-blue-700 font-semibold block">{inv.projectTitle || 'Master Scope'}</span>
                            <span className="text-[10px] text-slate-400 block font-mono">{inv.clientPhone}</span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatINR(inv.totalAmount)}
                            <span className="block text-[10px] text-slate-400 font-sans">
                              {inv.gstType === 'NO_GST' ? 'Without GST' : inv.gstType === 'INCLUSIVE_18' ? 'Inclusive GST' : '+18% GST'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                            {formatINR(paid)}
                            {inv.installments && inv.installments.length > 0 && (
                              <span className="block text-[10px] text-emerald-700 font-sans">
                                {inv.installments.filter(i => i.status === 'PAID').length}/{inv.installments.length} splits paid
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                            <span className="font-black text-rose-600 block">{formatINR(balance)}</span>
                            {lateFeeAmount > 0 && (
                              <div className="text-[10px] font-bold text-amber-600 mt-0.5">
                                <span>+₹{lateFeeAmount.toLocaleString('en-IN')} (2%/wk)</span>
                              </div>
                            )}
                            {inv.nextScheduledPaymentAmount && inv.nextScheduledPaymentAmount > 0 && balance > 0 && (
                              <span className="block text-[10px] text-slate-500 font-sans">
                                Next: {formatINR(inv.nextScheduledPaymentAmount)}
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="date"
                                value={inv.dueDate || ''}
                                onChange={(e) => handleUpdateInvoiceDueDate(inv.id, e.target.value)}
                                className="text-xs bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-400 rounded-lg px-2 py-0.5 font-mono text-slate-800 transition focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                title="Click to edit due date inline"
                              />
                            </div>
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${dueBadge.color} mt-1`}>
                              {dueBadge.text}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {inv.delayReason === 'OUR_MISTAKE_PROJECT_DELAY' ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-300 text-[10px] font-bold">
                                ⚠️ Internal Delay (Our Mistake)
                              </span>
                            ) : inv.delayReason === 'CLIENT_DELAY' ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-semibold">
                                Client Dependency Delay
                              </span>
                            ) : inv.delayReason === 'MUTUAL_AGREEMENT' ? (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                                Mutually Agreed Schedule
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">On Track</span>
                            )}

                            {inv.lateFeeAssigned && !isOurMistake && (
                              <span className="block mt-1 text-[9px] font-bold text-amber-700">
                                2%/wk Late Fee Active
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${inv.status === 'CLOSED' || inv.status === 'PAID' || balance === 0
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : balance < inv.totalAmount
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                              {balance === 0 ? 'PAID IN FULL' : inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5 flex-wrap">
                              {/* Requirement 4: Paid in Full Invoice Generation & Sharing */}
                              {(balance === 0 || inv.status === 'PAID' || inv.status === 'CLOSED') ? (
                                <button
                                  onClick={() => setPaidInFullModalInvoice(inv)}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] flex items-center gap-1 shadow-sm"
                                  title="Generate and Share Official Paid in Full Tax Invoice"
                                >
                                  <FileCheck className="w-3 h-3" />
                                  Tax Invoice
                                </button>
                              ) : null}

                              {/* Requirement 5: Receipt view showing all split payments with date and mode */}
                              <button
                                onClick={() => setConsolidatedReceiptInvoice(inv)}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold rounded-lg transition text-[10px] flex items-center gap-1"
                                title="View all split payments with dates and payment modes"
                              >
                                <Receipt className="w-3 h-3 text-blue-600" />
                                Receipts
                              </button>

                              {/* Requirement 3: Share Full Single-Message Statement */}
                              <button
                                onClick={() => setShareStatementModalInvoice(inv)}
                                className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold rounded-lg transition text-[10px] flex items-center gap-1"
                                title="Share full single-message statement covering all transactions to client"
                              >
                                <Share2 className="w-3 h-3 text-indigo-600" />
                                Share
                              </button>

                              {/* Requirement 4: 2-Day Reminder WhatsApp Button */}
                              {(isDueIn2Days || inv.dueDate === '2026-11-22') && balance > 0 && (
                                <a
                                  href={get2DayReminderWhatsAppUrl(inv)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg transition text-[10px] shadow-sm flex items-center gap-1"
                                  title="Send 2-Day Due Reminder via WhatsApp"
                                >
                                  <Bell className="w-3 h-3 text-slate-950" />
                                  2-Day (WA)
                                </a>
                              )}

                              {/* Requirement 4: Project On Hold Due to Non-Payment Button */}
                              {isOverdue && balance > 0 && (
                                <a
                                  href={getOnHoldWhatsAppUrl(inv)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-300 font-bold rounded-lg transition text-[10px] flex items-center gap-1"
                                  title="Send Project On Hold Notice to Client"
                                >
                                  <PauseCircle className="w-3 h-3 text-rose-600" />
                                  Hold (WA)
                                </a>
                              )}

                              {/* Edit Master Invoice */}
                              <button
                                onClick={() => handleOpenEditInvoiceModal(inv)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                                title="Edit Master Invoice & Installments"
                              >
                                <Pencil className="w-3 h-3 text-amber-600" />
                                Edit
                              </button>

                              {/* View invoice */}
                              <button
                                onClick={() => setInspectInvoice(inv)}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                                title="View Master Invoice Details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete invoice */}
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
        </div>
      )}

      {/* TAB 2: Split Payment Receipts */}
      {activeTab === 'receipts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search receipt #, client, milestone, UTR..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                />
              </div>

              {/* Requirement 6: Client Dropdown Filter in Receipts Tab */}
              <div className="relative">
                <select
                  value={selectedClientFilter}
                  onChange={e => setSelectedClientFilter(e.target.value)}
                  className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="ALL">All Clients ({clients.length})</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.contactName})</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowSplitPaymentModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              + Create Payment Receipt
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Receipt #</th>
                    <th className="py-3 px-4">Date Credited</th>
                    <th className="py-3 px-4">Client & Project</th>
                    <th className="py-3 px-4">Milestone / Split Details</th>
                    <th className="py-3 px-4 text-right">Amount Paid</th>
                    <th className="py-3 px-4 text-right">Remaining Balance</th>
                    <th className="py-3 px-4">Payment Mode</th>
                    <th className="py-3 px-4 text-center">Receipt & Statement Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {filteredReceipts.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No split payment receipts found for this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredReceipts.map(rcp => (
                      <tr key={rcp.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                          {rcp.receiptNumber}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {rcp.createdAt.split('T')[0]}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-slate-900 block">{rcp.clientName}</span>
                          <span className="text-[10px] text-slate-400 block truncate max-w-xs">{rcp.projectTitle || 'Agency Retainer'}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{rcp.milestoneLabel}</span>
                          <span className="text-[10px] text-slate-500 block">
                            {rcp.referenceId ? `Ref: ${rcp.referenceId}` : ''}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                          {formatINR(rcp.amount)}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          {formatINR(rcp.remainingBalanceDue)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 text-[10px] font-bold">
                            {rcp.paymentMethod || 'Bank Transfer'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Send Cumulative Statement via WhatsApp */}
                            <a
                              href={getReceiptWhatsAppUrl(rcp)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                              title="Send Cumulative Balance Statement to Client via WhatsApp"
                            >
                              <Send className="w-3 h-3 text-emerald-600" />
                              Share Statement (WA)
                            </a>

                            {/* View / Print digital receipt */}
                            <button
                              onClick={() => setActiveReceiptModal(rcp)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                              title="View & Print Digital Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete receipt */}
                            <button
                              onClick={() => setConfirmDeleteReceipt(rcp)}
                              className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Receipt to Recycle Bin"
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

      {/* TAB 3: Client Summary Ledger */}
      {activeTab === 'clients' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map(client => {
            const clientProjects = projects.filter(p => p.clientId === client.id);
            const clientInvoices = invoices.filter(i => i.clientId === client.id);
            const clientReceipts = receipts.filter(r => r.clientId === client.id);

            const contractVal = clientProjects.reduce((s, p) => s + (p.totalValue || 0), 0) ||
              clientInvoices.reduce((s, i) => s + (i.totalAmount || 0), 0) || client.monthlyRetainerAmount;

            const paidVal = clientReceipts.reduce((s, r) => s + (r.amount || 0), 0);
            const balanceVal = Math.max(0, contractVal - paidVal);

            return (
              <div key={client.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-blue-300 transition flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{client.businessName}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{client.contactName} • {client.whatsappNumber}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                      {client.clientType ? client.clientType.replace(/_/g, ' ') : 'Master Account'}
                    </span>
                  </div>

                  <div className="space-y-1.5 my-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Total Contract:</span>
                      <span className="font-mono font-bold text-slate-900">{formatINR(contractVal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Total Paid:</span>
                      <span className="font-mono font-bold text-emerald-600">{formatINR(paidVal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-medium">Balance Due:</span>
                      <span className="font-mono font-black text-rose-600">{formatINR(balanceVal)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">{clientReceipts.length} split payments made</span>
                  {balanceVal > 0 ? (
                    <button
                      onClick={() => handleOpenSplitModal({ clientId: client.id, balance: balanceVal })}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition flex items-center gap-1"
                    >
                      <Receipt className="w-3 h-3" />
                      + Payment Receipt
                    </button>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">Settled in Full ✓</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: Record Split Payment / Create Payment Receipt */}
      {showSplitPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Create Official Payment Receipt</h3>
                  <p className="text-xs text-slate-400">Step-by-step cumulative statement generation</p>
                </div>
              </div>
              <button
                onClick={() => setShowSplitPaymentModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSplitPayment} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Client *</label>
                  <select
                    required
                    value={splitForm.clientId}
                    onChange={e => {
                      const cId = e.target.value;
                      const cProjects = projects.filter(p => p.clientId === cId);
                      setSplitForm({
                        ...splitForm,
                        clientId: cId,
                        projectId: cProjects[0]?.id || ''
                      });
                    }}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.businessName} ({c.contactName})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Project / Master Contract *</label>
                  <select
                    required
                    value={splitForm.projectId}
                    onChange={e => setSplitForm({ ...splitForm, projectId: e.target.value })}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">-- Choose Project for Credit --</option>
                    {projects
                      .filter(p => !splitForm.clientId || p.clientId === splitForm.clientId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.code || p.id}) • Total: {formatINR(p.totalValue)} | Bal: {formatINR(p.balanceDue)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Payment Amount (₹) *</label>
                    <input
                      type="number"
                      min="1"
                      required
                      placeholder="e.g. 100000"
                      value={splitForm.amount}
                      onChange={e => setSplitForm({ ...splitForm, amount: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-emerald-700"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Date Credited</label>
                    <input
                      type="date"
                      required
                      value={splitForm.paymentDate}
                      onChange={e => setSplitForm({ ...splitForm, paymentDate: e.target.value })}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Next Payment Due Date</label>
                    <input
                      type="date"
                      value={splitForm.nextDueDate}
                      onChange={e => setSplitForm({ ...splitForm, nextDueDate: e.target.value })}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Next Scheduled Amount (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 110650"
                      value={splitForm.nextDueAmount}
                      onChange={e => setSplitForm({ ...splitForm, nextDueAmount: e.target.value })}
                      className="w-full text-xs font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Milestone Description *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2nd Payment - Milestone 1 Delivery"
                    value={splitForm.milestoneLabel}
                    onChange={e => setSplitForm({ ...splitForm, milestoneLabel: e.target.value })}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Payment Method</label>
                    <select
                      value={splitForm.paymentMethod}
                      onChange={e => setSplitForm({ ...splitForm, paymentMethod: e.target.value })}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="UPI / Bank Transfer">UPI / GPay / PhonePe</option>
                      <option value="NEFT / RTGS">NEFT / RTGS NetBanking</option>
                      <option value="Corporate Credit Card">Corporate Credit Card</option>
                      <option value="Bank Cheque">Bank Cheque</option>
                      <option value="Cash Receipt">Cash Receipt</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Transaction Ref / UTR #</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC-9823412"
                      value={splitForm.referenceId}
                      onChange={e => setSplitForm({ ...splitForm, referenceId: e.target.value })}
                      className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Receipt Notes / Terms</label>
                  <textarea
                    rows={2}
                    placeholder="Official receipt notes for cumulative statement ledger..."
                    value={splitForm.notes}
                    onChange={e => setSplitForm({ ...splitForm, notes: e.target.value })}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowSplitPaymentModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Receipt className="w-4 h-4" />
                  Save & Generate Cumulative Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Master Invoice Creator (Requirement 1 & 2: Live Balance & Cap to Balance) */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold">Master Client Invoice</h3>
                  <p className="text-xs text-slate-400">Strict Single-Invoice per Project Architecture</p>
                </div>
              </div>
              <button
                onClick={() => setShowInvoiceModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
                {/* Client Picker */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Client *</label>
                  <select
                    required
                    value={newInvoiceForm.clientId}
                    onChange={e => {
                      const cId = e.target.value;
                      const cProjects = projects.filter(p => p.clientId === cId);
                      const targetProj = cProjects[0];
                      setNewInvoiceForm({
                        ...newInvoiceForm,
                        clientId: cId,
                        projectId: targetProj?.id || '',
                        subtotal: targetProj ? String(targetProj.totalValue || 0) : newInvoiceForm.subtotal
                      });
                    }}
                    className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose Client --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.businessName} ({c.contactName})</option>
                    ))}
                  </select>
                </div>

                {/* Project Picker */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Select Project (One Master Invoice per Project) *</label>
                  <select
                    required
                    value={newInvoiceForm.projectId}
                    onChange={e => {
                      const pId = e.target.value;
                      const proj = projects.find(p => p.id === pId);
                      setNewInvoiceForm({
                        ...newInvoiceForm,
                        projectId: pId,
                        subtotal: proj ? String(proj.totalValue || 0) : newInvoiceForm.subtotal
                      });
                    }}
                    className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  >
                    <option value="">-- Choose Project for Master Invoice --</option>
                    {projects
                      .filter(p => !newInvoiceForm.clientId || p.clientId === newInvoiceForm.clientId)
                      .map(p => (
                        <option key={p.id} value={p.id}>
                          {p.title} ({p.code || p.id}) • Total Contract Value: {formatINR(p.totalValue)}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Requirement 1: Live Financial Ledger Readout Bar */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-400" />
                      LIVE COMMERCIAL LEDGER SUMMARY
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${newLiveBalance === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                      {newLiveBalance === 0 ? 'PAID IN FULL ✓' : 'BALANCE OUTSTANDING'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Contract Value</span>
                      <span className="font-mono font-bold text-white text-sm">{formatINR(newContractValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-semibold">Total Paid to Date</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">{formatINR(newTotalPaid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400 block font-semibold">Balance to be Collected</span>
                      <span className="font-mono font-black text-rose-400 text-sm">{formatINR(newLiveBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Split Installment Structure with Live Status Toggle */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">Milestone Payment Installments</span>
                    <button
                      type="button"
                      onClick={() => {
                        const count = newInvoiceForm.installments.length + 1;
                        setNewInvoiceForm({
                          ...newInvoiceForm,
                          installments: [
                            ...newInvoiceForm.installments,
                            {
                              id: `inst-${Date.now()}`,
                              label: `${count}th Payment - Milestone Deliverables`,
                              amount: Math.min(50000, newLiveBalance),
                              dueDate: '2026-12-25',
                              paidAmount: 0,
                              status: 'PENDING',
                              paymentMethod: 'UPI / Bank Transfer'
                            }
                          ]
                        });
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      + Add Subsequent Installment
                    </button>
                  </div>

                  {newInvoiceForm.installments.map((inst, idx) => (
                    <div key={inst.id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={inst.label}
                          onChange={e => {
                            const updated = [...newInvoiceForm.installments];
                            updated[idx].label = e.target.value;
                            setNewInvoiceForm({ ...newInvoiceForm, installments: updated });
                          }}
                          className="flex-1 font-bold text-xs bg-white border border-slate-200 rounded-lg px-2 py-1"
                        />
                        <select
                          value={inst.status}
                          onChange={e => {
                            const updated = [...newInvoiceForm.installments];
                            const s = e.target.value as any;
                            updated[idx].status = s;
                            if (s === 'PAID') {
                              updated[idx].paidAmount = updated[idx].amount;
                              updated[idx].paidDate = new Date().toISOString().split('T')[0];
                            } else {
                              updated[idx].paidAmount = 0;
                            }
                            setNewInvoiceForm({ ...newInvoiceForm, installments: updated });
                          }}
                          className="text-[10px] font-bold bg-white border border-slate-200 rounded-lg px-2 py-1"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block">Amount (₹)</label>
                          <input
                            type="number"
                            value={inst.amount}
                            onChange={e => {
                              const updated = [...newInvoiceForm.installments];
                              updated[idx].amount = Number(e.target.value);
                              setNewInvoiceForm({ ...newInvoiceForm, installments: updated });
                            }}
                            className="w-full font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block">Due Date</label>
                          <input
                            type="date"
                            value={inst.dueDate}
                            onChange={e => {
                              const updated = [...newInvoiceForm.installments];
                              updated[idx].dueDate = e.target.value;
                              setNewInvoiceForm({ ...newInvoiceForm, installments: updated });
                            }}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Requirement 2: Capped Next Scheduled Payment Input */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">Next Scheduled Payment Amount (₹)</label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Max Available: <strong className="font-mono text-slate-800">{formatINR(newLiveBalance)}</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    value={newInvoiceForm.nextScheduledPaymentAmount}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, nextScheduledPaymentAmount: e.target.value })}
                    className={`w-full p-2.5 bg-white border rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 ${isNewNextScheduledOverAllocated ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-200 focus:ring-blue-500'}`}
                  />
                  {isNewNextScheduledOverAllocated && (
                    <div className="flex items-center justify-between p-2 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px]">
                      <span>⚠️ Amount exceeds remaining balance of {formatINR(newLiveBalance)}.</span>
                      <button
                        type="button"
                        onClick={() => setNewInvoiceForm({ ...newInvoiceForm, nextScheduledPaymentAmount: String(newLiveBalance) })}
                        className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px]"
                      >
                        Cap to Max: {formatINR(newLiveBalance)}
                      </button>
                    </div>
                  )}
                </div>

                {/* Delay Attribution & Project On Hold */}
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Delay Attribution Reason</label>
                    <select
                      value={newInvoiceForm.delayReason}
                      onChange={e => setNewInvoiceForm({ ...newInvoiceForm, delayReason: e.target.value as any })}
                      className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NONE">No Delay (Schedule on Track)</option>
                      <option value="OUR_MISTAKE_PROJECT_DELAY">⚠️ Our Mistake / Project Work Delay (Late fees strictly waived)</option>
                      <option value="CLIENT_DELAY">Client Dependency / Approval Delay</option>
                      <option value="MUTUAL_AGREEMENT">Mutually Agreed Revised Milestone Schedule</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">Delay Explanation / Notes</label>
                    <textarea
                      rows={2}
                      placeholder="Optional internal delay notes for transparency..."
                      value={newInvoiceForm.delayNotes}
                      onChange={e => setNewInvoiceForm({ ...newInvoiceForm, delayNotes: e.target.value })}
                      className="w-full text-xs bg-white border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="checkbox"
                      id="createOnHold"
                      checked={newInvoiceForm.isOnHold}
                      onChange={e => setNewInvoiceForm({ ...newInvoiceForm, isOnHold: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <label htmlFor="createOnHold" className="text-rose-900 font-bold text-xs cursor-pointer">
                      Place Project On Hold (Pause sprints due to overdue commercial terms)
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isNewNextScheduledOverAllocated}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/20 disabled:opacity-50"
                >
                  Save Master Project Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Master Invoice Editor (Requirement 1, 2, 3: Live Balance, Capped Payment, Share Full Statement) */}
      {editingInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <Pencil className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-bold">Edit Master Invoice {editingInvoice.invoiceNumber}</h3>
                  {editingInvoice.recoveredFrom && (
                    <span className="block text-[10px] text-emerald-400 font-semibold">Recovered from {editingInvoice.recoveredFrom}</span>
                  )}
                  <p className="text-xs text-slate-400">{editingInvoice.clientName} • {editingInvoice.projectTitle || 'Master Scope'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {/* Requirement 3: Share Full Statement button inside form */}
                <button
                  type="button"
                  onClick={() => setShareStatementModalInvoice(editingInvoice)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition"
                  title="Share Full Statement to Client via WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share Statement</span>
                </button>
                <button onClick={() => setEditingInvoice(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveInvoiceEdit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
                {/* Requirement 1: LIVE FINANCIAL BALANCE READOUT BAR */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-md space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <Landmark className="w-3.5 h-3.5 text-blue-400" />
                      LIVE COMMERCIAL LEDGER READOUT
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${editLiveBalance === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-amber-400 text-slate-950'}`}>
                      {editLiveBalance === 0 ? '✓ PAID IN FULL' : 'BALANCE OUTSTANDING'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Total Contract Value</span>
                      <span className="font-mono font-bold text-white text-sm">{formatINR(editContractValue)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 block font-semibold">Total Paid to Date</span>
                      <span className="font-mono font-black text-emerald-400 text-sm">{formatINR(editTotalPaid)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-rose-400 block font-semibold">Balance to be Collected</span>
                      <span className="font-mono font-black text-rose-400 text-sm">{formatINR(editLiveBalance)}</span>
                    </div>
                  </div>
                </div>

                {/* Total Contract Value & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Total Contract Value (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editInvoiceForm.amount}
                      onChange={e => setEditInvoiceForm({ ...editInvoiceForm, amount: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Invoice Commercial Status</label>
                    <select
                      value={editInvoiceForm.status}
                      onChange={e => setEditInvoiceForm({ ...editInvoiceForm, status: e.target.value as any })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                      <option value="PAID">PAID</option>
                      <option value="CLOSED">CLOSED (Settled in full - 100% Cleared)</option>
                      <option value="OVERDUE">OVERDUE</option>
                    </select>
                  </div>
                </div>

                {/* Scheduled Dates & Next Due */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Master Due Date</label>
                    <input
                      type="date"
                      value={editInvoiceForm.dueDate}
                      onChange={e => setEditInvoiceForm({ ...editInvoiceForm, dueDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Next Scheduled Due Date</label>
                    <input
                      type="date"
                      value={editInvoiceForm.nextScheduledDueDate}
                      onChange={e => setEditInvoiceForm({ ...editInvoiceForm, nextScheduledDueDate: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                {/* Requirement 2: CAP NEXT SCHEDULED PAYMENT TO REMAINING BALANCE */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 font-bold">Next Scheduled Payment Amount (₹)</label>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Remaining Cap: <strong className="font-mono text-slate-800">{formatINR(editLiveBalance)}</strong>
                    </span>
                  </div>
                  <input
                    type="number"
                    placeholder="e.g. 100000"
                    value={editInvoiceForm.nextScheduledPaymentAmount}
                    onChange={e => setEditInvoiceForm({ ...editInvoiceForm, nextScheduledPaymentAmount: e.target.value })}
                    className={`w-full p-2.5 bg-white border rounded-xl text-slate-900 font-mono font-bold focus:outline-none focus:ring-2 ${isEditNextScheduledOverAllocated ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/20' : 'border-slate-200 focus:ring-amber-500'}`}
                  />
                  {isEditNextScheduledOverAllocated && (
                    <div className="flex items-center justify-between p-2.5 bg-rose-50 border border-rose-300 rounded-lg text-rose-800 text-[11px]">
                      <span>⚠️ Amount exceeds remaining balance of {formatINR(editLiveBalance)}.</span>
                      <button
                        type="button"
                        onClick={() => setEditInvoiceForm({ ...editInvoiceForm, nextScheduledPaymentAmount: String(editLiveBalance) })}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[10px] shadow-xs"
                      >
                        Cap to Max: {formatINR(editLiveBalance)}
                      </button>
                    </div>
                  )}
                </div>

                {/* Requirement 1: Installments Editor with Real-Time Status Change & Recalculation */}
                <div className="space-y-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800 text-xs block">Milestone Installments Ledger</span>
                      <span className="text-[10px] text-slate-400">Changing an installment status to Paid recalculates balance instantly.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const count = editInvoiceForm.installments.length + 1;
                        setEditInvoiceForm({
                          ...editInvoiceForm,
                          installments: [
                            ...editInvoiceForm.installments,
                            {
                              id: `inst-${Date.now()}`,
                              label: `${count}th Payment Installment`,
                              amount: Math.min(50000, editLiveBalance),
                              dueDate: '2026-12-15',
                              paidAmount: 0,
                              status: 'PENDING',
                              paymentMethod: 'UPI / Bank Transfer'
                            }
                          ]
                        });
                      }}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                    >
                      + Add Subsequent Installment
                    </button>
                  </div>

                  {editInvoiceForm.installments.map((inst, idx) => (
                    <div key={inst.id || idx} className={`p-3 rounded-xl border space-y-2 transition-all ${inst.status === 'PAID' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-center justify-between gap-2">
                        <input
                          type="text"
                          value={inst.label}
                          onChange={e => {
                            const updated = [...editInvoiceForm.installments];
                            updated[idx].label = e.target.value;
                            setEditInvoiceForm({ ...editInvoiceForm, installments: updated });
                          }}
                          className="flex-1 font-bold text-xs bg-white border border-slate-200 rounded-lg px-2 py-1"
                        />
                        {/* Requirement 1: Instant status toggle */}
                        <select
                          value={inst.status}
                          onChange={e => handleEditInstallmentStatusChange(idx, e.target.value as any)}
                          className={`text-[10px] font-black rounded-lg px-2.5 py-1 cursor-pointer border ${inst.status === 'PAID' ? 'bg-emerald-600 text-white border-emerald-700' : 'bg-amber-100 text-amber-900 border-amber-300'}`}
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="PAID">PAID ✓</option>
                          <option value="OVERDUE">OVERDUE</option>
                        </select>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block">Amount (₹)</label>
                          <input
                            type="number"
                            value={inst.amount}
                            onChange={e => {
                              const updated = [...editInvoiceForm.installments];
                              updated[idx].amount = Number(e.target.value);
                              setEditInvoiceForm({ ...editInvoiceForm, installments: updated });
                            }}
                            className="w-full font-mono font-bold text-xs bg-white border border-slate-200 rounded-lg px-2 py-1"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block">Payment Mode</label>
                          <select
                            value={inst.paymentMethod || 'UPI / Bank Transfer'}
                            onChange={e => {
                              const updated = [...editInvoiceForm.installments];
                              updated[idx].paymentMethod = e.target.value;
                              setEditInvoiceForm({ ...editInvoiceForm, installments: updated });
                            }}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1 font-medium"
                          >
                            <option value="UPI / Bank Transfer">UPI / GPay / PhonePe</option>
                            <option value="NEFT / RTGS">NEFT / RTGS</option>
                            <option value="Bank Cheque">Bank Cheque</option>
                            <option value="Cash Receipt">Cash Receipt</option>
                            <option value="Corporate Credit Card">Corporate Card</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-semibold block">{inst.status === 'PAID' ? 'Paid Date' : 'Due Date'}</label>
                          <input
                            type="date"
                            value={inst.status === 'PAID' ? (inst.paidDate || inst.dueDate) : inst.dueDate}
                            onChange={e => {
                              const updated = [...editInvoiceForm.installments];
                              if (inst.status === 'PAID') {
                                updated[idx].paidDate = e.target.value;
                              } else {
                                updated[idx].dueDate = e.target.value;
                              }
                              setEditInvoiceForm({ ...editInvoiceForm, installments: updated });
                            }}
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-2 py-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Delay Attribution */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Delay Attribution Reason</label>
                    <select
                      value={editInvoiceForm.delayReason}
                      onChange={e => setEditInvoiceForm({ ...editInvoiceForm, delayReason: e.target.value as any })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="NONE">No Delay</option>
                      <option value="OUR_MISTAKE_PROJECT_DELAY">⚠️ Our Mistake / Project Work Delay (Late fees strictly waived)</option>
                      <option value="CLIENT_DELAY">Client Dependency Delay</option>
                      <option value="MUTUAL_AGREEMENT">Mutually Agreed Revised Milestone Schedule</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Delay Notes</label>
                    <textarea
                      rows={2}
                      value={editInvoiceForm.delayNotes}
                      onChange={e => setEditInvoiceForm({ ...editInvoiceForm, delayNotes: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <input
                      type="checkbox"
                      id="editOnHold"
                      checked={editInvoiceForm.isOnHold}
                      onChange={e => setEditInvoiceForm({ ...editInvoiceForm, isOnHold: e.target.checked })}
                      className="w-4 h-4 text-rose-600 rounded focus:ring-rose-500"
                    />
                    <label htmlFor="editOnHold" className="text-rose-900 font-bold text-xs cursor-pointer">
                      Project On Hold (Pause active sprints due to pending overdue payment)
                    </label>
                  </div>
                </div>

                {/* 2% Late Fee Toggle (Disabled if our mistake) */}
                <div className={`p-3 rounded-xl border flex items-center gap-2 ${editInvoiceForm.delayReason === 'OUR_MISTAKE_PROJECT_DELAY' ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-amber-50 border-amber-200'}`}>
                  <input
                    type="checkbox"
                    id="editLateFee"
                    disabled={editInvoiceForm.delayReason === 'OUR_MISTAKE_PROJECT_DELAY'}
                    checked={editInvoiceForm.delayReason === 'OUR_MISTAKE_PROJECT_DELAY' ? false : editInvoiceForm.lateFeeAssigned}
                    onChange={e => setEditInvoiceForm({ ...editInvoiceForm, lateFeeAssigned: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="editLateFee" className="text-amber-900 font-bold text-xs cursor-pointer">
                    {editInvoiceForm.delayReason === 'OUR_MISTAKE_PROJECT_DELAY'
                      ? 'Late fee calculation disabled because delay is marked Our Mistake.'
                      : 'Assign 2% per week late fee calculation on overdue balances'}
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setShareStatementModalInvoice(editingInvoice)}
                  className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5 transition"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Preview Full Statement</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingInvoice(null)}
                    className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingInvoiceEdit || isEditNextScheduledOverAllocated}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50"
                  >
                    {savingInvoiceEdit ? 'Saving Master Invoice...' : 'Save Master Invoice'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REQUIREMENT 3: SINGLE-MESSAGE COMBINED STATEMENT SHARE MODAL */}
      {shareStatementModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-indigo-950 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-bold">Client Single-Message Statement</h3>
                  <p className="text-xs text-indigo-200">{shareStatementModalInvoice.invoiceNumber} • {shareStatementModalInvoice.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => setShareStatementModalInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 font-mono text-slate-800 text-[11px] whitespace-pre-wrap leading-relaxed shadow-inner">
                {`📋 OFFICIAL COMMERCIAL & PAYMENT STATEMENT
Invoice No: ${shareStatementModalInvoice.invoiceNumber}
Client: ${shareStatementModalInvoice.clientName}
Project: ${shareStatementModalInvoice.projectTitle || 'Agency Master Scope'}
----------------------------------------
💰 Total Contract Value: ${formatINR(shareStatementModalInvoice.totalAmount)}

📊 INSTALLMENTS & SETTLEMENT BREAKDOWN:
${(shareStatementModalInvoice.installments && shareStatementModalInvoice.installments.length > 0
                  ? shareStatementModalInvoice.installments.map(it => it.status === 'PAID'
                    ? `  ✅ ${it.label}: ${formatINR(it.paidAmount || it.amount)} (PAID on ${it.paidDate || 'verified'} via ${it.paymentMethod || 'Bank Transfer'})`
                    : `  ⏳ ${it.label}: ${formatINR(it.amount)} (PENDING - Due: ${it.dueDate || 'Scheduled'})`
                  ).join('\n')
                  : `  ✅ Paid: ${formatINR(shareStatementModalInvoice.paidAmount)}\n  ⏳ Balance: ${formatINR(shareStatementModalInvoice.balanceDue)}`
                )}
----------------------------------------
💵 Total Paid to Date: ${formatINR(shareStatementModalInvoice.paidAmount || 0)}
⏳ Remaining Balance to be Collected: ${formatINR(shareStatementModalInvoice.balanceDue !== undefined ? shareStatementModalInvoice.balanceDue : 0)}
${shareStatementModalInvoice.nextScheduledPaymentAmount && (shareStatementModalInvoice.balanceDue || 0) > 0 ? `📅 Next Scheduled Payment: ${formatINR(shareStatementModalInvoice.nextScheduledPaymentAmount)} due on ${shareStatementModalInvoice.nextScheduledDueDate || shareStatementModalInvoice.dueDate || 'TBD'}` : ''}
========================================
${(shareStatementModalInvoice.balanceDue === 0 || shareStatementModalInvoice.status === 'PAID' || shareStatementModalInvoice.status === 'CLOSED')
                  ? '🎉 STATUS: PAID IN FULL • Project Commercials 100% Cleared.'
                  : 'ℹ️ Sprints continue as per verified milestone schedule.'}

Accounts Desk: +91 98765 43208 • Nearlook Agency`}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Official Statement for ${shareStatementModalInvoice.clientName} - Invoice ${shareStatementModalInvoice.invoiceNumber}\nTotal Contract Value: ${formatINR(shareStatementModalInvoice.totalAmount)}\nTotal Paid: ${formatINR(shareStatementModalInvoice.paidAmount)}\nRemaining Balance: ${formatINR(shareStatementModalInvoice.balanceDue)}`
                  );
                  showNotification('Statement text copied to clipboard!', 'info');
                }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Text
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShareStatementModalInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
                <a
                  href={getSingleMessageStatementWhatsAppUrl(shareStatementModalInvoice)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send WhatsApp Statement
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT 4: PAID-IN-FULL INVOICE GENERATION & SHARING MODAL */}
      {paidInFullModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FileCheck className="w-6 h-6 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Official Tax Invoice (Paid in Full)</h3>
                  <p className="text-xs text-slate-400">{paidInFullModalInvoice.invoiceNumber} • {paidInFullModalInvoice.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => setPaidInFullModalInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs bg-slate-50/50">
              {/* Printable Tax Invoice Container */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
                {/* Invoice Header */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="Nearlook Mart Pvt Ltd" className="h-11 w-auto object-contain" />
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 tracking-tight">NEARLOOK AGENCY</h2>
                      <p className="text-[11px] text-slate-500">Nearlook Mart Pvt Ltd • IT Services & Digital Infrastructure</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">GSTIN: 29AAACN1234F1Z8 • Bengaluru, Karnataka</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs uppercase tracking-wider">
                      ✓ PAID IN FULL (₹0 BALANCE)
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-900 mt-2">{paidInFullModalInvoice.invoiceNumber}</p>
                    <p className="text-[10px] text-slate-500">Date: {paidInFullModalInvoice.issueDate || '2026-11-20'}</p>
                  </div>
                </div>

                {/* Client & Commercial Details */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Billed To</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{paidInFullModalInvoice.clientName}</strong>
                    <span className="text-slate-500 block text-[11px]">{paidInFullModalInvoice.clientPhone}</span>
                    <span className="text-slate-500 block text-[11px]">{paidInFullModalInvoice.clientEmail || 'accounts@client.com'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Contract Scope</span>
                    <strong className="text-slate-900 text-sm block mt-0.5">{paidInFullModalInvoice.projectTitle || 'Software Development Deliverables'}</strong>
                    <span className="text-slate-500 block text-[11px]">Domain: {paidInFullModalInvoice.type ? paidInFullModalInvoice.type.replace(/_/g, ' ') : 'IT Services'}</span>
                    <span className="text-slate-500 block text-[11px]">Commercial Terms: Without GST (Agreed Contract Scope)</span>
                  </div>
                </div>

                {/* Milestone Settlements Cleared Ledger */}
                <div>
                  <span className="text-xs font-bold text-slate-800 uppercase block mb-2">Milestone Payments Cleared</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                    {(paidInFullModalInvoice.installments && paidInFullModalInvoice.installments.length > 0
                      ? paidInFullModalInvoice.installments
                      : [{ id: 'inst-1', label: '100% Contract Clearance', amount: paidInFullModalInvoice.totalAmount, paidAmount: paidInFullModalInvoice.totalAmount, status: 'PAID', dueDate: paidInFullModalInvoice.dueDate, paidDate: '2026-11-20', paymentMethod: 'Bank Transfer / NEFT' }]
                    ).map((inst, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between bg-slate-50/50">
                        <div>
                          <span className="font-bold text-slate-900 block">{inst.label}</span>
                          <span className="text-[10px] text-slate-500">Credited: {inst.paidDate || inst.dueDate} • Mode: {inst.paymentMethod || 'Bank Transfer'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-mono font-bold text-emerald-600 block">{formatINR(inst.paidAmount || inst.amount)}</span>
                          <span className="text-[10px] font-bold text-emerald-700">Settled ✓</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Double Entry Seal & Balance Summary */}
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="font-bold text-emerald-900 block text-xs">Full Settlement Verification</span>
                    <p className="text-[11px] text-emerald-700">All deliverables verified. Zero outstanding balance due.</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-emerald-800 uppercase block">Final Outstanding Due</span>
                    <span className="font-mono font-black text-emerald-700 text-lg">₹0.00</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Tax Invoice
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPaidInFullModalInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
                <a
                  href={getPaidInFullInvoiceWhatsAppUrl(paidInFullModalInvoice)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Share Paid Invoice (WA)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REQUIREMENT 5: UNIFIED ALL SPLIT PAYMENT RECEIPTS MODAL */}
      {consolidatedReceiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Consolidated Split Payment Receipts</h3>
                  <p className="text-xs text-slate-400">{consolidatedReceiptInvoice.invoiceNumber} • {consolidatedReceiptInvoice.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => setConsolidatedReceiptInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs bg-slate-50/50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
                <div>
                  <span className="font-black text-slate-900 text-sm block">{consolidatedReceiptInvoice.projectTitle || 'Agency Master Scope'}</span>
                  <span className="text-slate-500 text-[11px]">{consolidatedReceiptInvoice.clientName} • {consolidatedReceiptInvoice.clientPhone}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Master Invoice</span>
                  <span className="font-mono font-bold text-slate-900">{consolidatedReceiptInvoice.invoiceNumber}</span>
                </div>
              </div>

              {/* All Split Payments Table */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-3">Milestone Split</th>
                      <th className="py-2.5 px-3">Date Credited</th>
                      <th className="py-2.5 px-3">Payment Mode</th>
                      <th className="py-2.5 px-3">Reference / UTR</th>
                      <th className="py-2.5 px-3 text-right">Amount Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {(() => {
                      // Find all receipts linked to this invoice or project
                      const linkedReceipts = receipts.filter(r =>
                        r.invoiceId === consolidatedReceiptInvoice.id ||
                        (consolidatedReceiptInvoice.projectId && r.projectId === consolidatedReceiptInvoice.projectId) ||
                        (!consolidatedReceiptInvoice.projectId && r.clientId === consolidatedReceiptInvoice.clientId)
                      );

                      // Also include any installments marked PAID
                      const paidInstallments = (consolidatedReceiptInvoice.installments || []).filter(inst => inst.status === 'PAID');

                      // Deduplicate by label/amount if both exists
                      const displayItems = linkedReceipts.length > 0 ? linkedReceipts : paidInstallments.map((inst, i) => ({
                        id: inst.id || `inst-${i}`,
                        milestoneLabel: inst.label,
                        createdAt: inst.paidDate || '2026-11-18',
                        paymentMethod: inst.paymentMethod || 'Bank Transfer / NEFT',
                        referenceId: inst.referenceId || `REF-00${i + 1}`,
                        amount: inst.paidAmount || inst.amount
                      }));

                      if (displayItems.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="py-6 text-center text-slate-400">
                              No split payment transactions recorded yet.
                            </td>
                          </tr>
                        );
                      }

                      return displayItems.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/80">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {item.milestoneLabel}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600">
                            {item.createdAt.split('T')[0]}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold text-[10px]">
                              {item.paymentMethod || 'Bank Transfer'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                            {item.referenceId || '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                            {formatINR(item.amount)}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>

              {/* Financial Ledger Summary Box */}
              <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 p-4 rounded-xl border border-blue-200 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Total Contract Value:</span>
                  <span className="font-mono font-bold text-slate-900">{formatINR(consolidatedReceiptInvoice.totalAmount)}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-emerald-800">
                  <span>Total Cumulative Paid:</span>
                  <span className="font-mono font-bold">- {formatINR(consolidatedReceiptInvoice.paidAmount || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-xs pt-2 border-t border-blue-200">
                  <span className="font-black text-rose-700">Current Remaining Balance Due:</span>
                  <span className="font-mono font-black text-rose-700 text-sm">
                    {formatINR(consolidatedReceiptInvoice.balanceDue !== undefined ? consolidatedReceiptInvoice.balanceDue : (consolidatedReceiptInvoice.totalAmount - (consolidatedReceiptInvoice.paidAmount || 0)))}
                  </span>
                </div>
                {consolidatedReceiptInvoice.nextScheduledPaymentAmount && (consolidatedReceiptInvoice.balanceDue || 0) > 0 && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-blue-200/60 text-blue-900">
                    <span className="font-bold">Next Scheduled Due:</span>
                    <span className="font-mono font-black">
                      {formatINR(consolidatedReceiptInvoice.nextScheduledPaymentAmount)} on {consolidatedReceiptInvoice.nextScheduledDueDate || consolidatedReceiptInvoice.dueDate || 'TBD'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 shrink-0">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Consolidated Receipt
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsolidatedReceiptInvoice(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs"
                >
                  Close
                </button>
                <a
                  href={getSingleMessageStatementWhatsAppUrl(consolidatedReceiptInvoice)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Share Receipts Statement (WA)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View & Share Single Digital Receipt Slip */}
      {activeReceiptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold">Official Payment Receipt & Statement</h3>
                  <p className="text-xs text-slate-400">{activeReceiptModal.receiptNumber} • {activeReceiptModal.clientName}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveReceiptModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs bg-slate-50/50">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-start">
                <div>
                  <span className="font-mono text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {activeReceiptModal.receiptNumber}
                  </span>
                  <h4 className="font-black text-slate-900 text-base mt-2">{activeReceiptModal.clientName}</h4>
                  <p className="text-slate-500 text-[11px]">{activeReceiptModal.projectTitle || 'Custom Software Deliverables'}</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Credited On</span>
                  <span className="font-mono font-bold text-slate-900">{activeReceiptModal.createdAt.split('T')[0]}</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                  <span className="font-bold text-slate-700">Payment Credited:</span>
                  <span className="font-mono font-black text-emerald-600 text-lg">
                    ₹{activeReceiptModal.amount.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Milestone / Description:</span>
                  <span className="font-medium text-slate-800">{activeReceiptModal.milestoneLabel}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Payment Mode:</span>
                  <span className="font-medium text-slate-800">{activeReceiptModal.paymentMethod} {activeReceiptModal.referenceId ? `(Ref: ${activeReceiptModal.referenceId})` : ''}</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 via-indigo-50/40 to-slate-50 p-4 rounded-xl border border-blue-200 space-y-2.5">
                <span className="font-bold text-slate-800 uppercase text-[10px] tracking-wider block border-b border-blue-200/60 pb-1">
                  Cumulative Contract Balance Ledger
                </span>

                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-700">Total Contract Value:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{(activeReceiptModal.totalContractValue || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs text-emerald-800">
                  <span>➖ Total Cumulative Paid to Date:</span>
                  <span className="font-mono font-bold">
                    -₹{(activeReceiptModal.totalPaidToDate || activeReceiptModal.amount || 0).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-blue-200">
                  <span className="font-black text-rose-700">Current Remaining Balance Due:</span>
                  <span className="font-mono font-black text-rose-700 text-base">
                    ₹{(activeReceiptModal.remainingBalanceDue ?? Math.max(0, (activeReceiptModal.totalContractValue || 0) - (activeReceiptModal.totalPaidToDate || activeReceiptModal.amount || 0))).toLocaleString('en-IN')}
                  </span>
                </div>

                {activeReceiptModal.nextDueDate && (
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-blue-200/60 text-blue-900">
                    <span className="font-bold">Next Scheduled Due Date:</span>
                    <span className="font-mono font-black">{activeReceiptModal.nextDueDate}</span>
                  </div>
                )}
                {activeReceiptModal.nextDueAmount && (
                  <div className="flex justify-between items-center text-xs text-blue-900">
                    <span className="font-bold">Next Scheduled Payment Amount:</span>
                    <span className="font-mono font-black">₹{activeReceiptModal.nextDueAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>

              {activeReceiptModal.notes && (
                <div className="p-3 bg-white rounded-xl border border-slate-200 text-slate-600 italic text-[11px]">
                  Note: {activeReceiptModal.notes}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-2 flex-wrap shrink-0">
              <button
                onClick={() => handleCopyReceiptText(activeReceiptModal)}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Statement Text
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Slip
                </button>

                <a
                  href={getReceiptWhatsAppUrl(activeReceiptModal)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                >
                  <Send className="w-3.5 h-3.5" />
                  Share Cumulative Statement (WA)
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Invoice Details */}
      {inspectInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-400" />
                <div>
                  <h3 className="text-base font-bold">{inspectInvoice.invoiceNumber}</h3>
                  {inspectInvoice.recoveredFrom && (
                    <span className="block text-[10px] text-emerald-400 font-semibold">Recovered from {inspectInvoice.recoveredFrom}</span>
                  )}
                  <p className="text-xs text-slate-400">{inspectInvoice.clientName}</p>
                </div>
              </div>
              <button onClick={() => setInspectInvoice(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 pb-3 border-b border-slate-100">
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Contract Value</span>
                  <span className="font-mono font-black text-slate-900 text-sm">{formatINR(inspectInvoice.totalAmount)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Balance Due</span>
                  <span className="font-mono font-black text-rose-600 text-sm">
                    {formatINR(inspectInvoice.balanceDue !== undefined ? inspectInvoice.balanceDue : inspectInvoice.totalAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Due Date</span>
                  <span className="font-mono font-bold text-slate-900">{inspectInvoice.dueDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase">Status</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${inspectInvoice.status === 'CLOSED' || inspectInvoice.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                    {inspectInvoice.status}
                  </span>
                </div>
              </div>

              {inspectInvoice.delayReason && inspectInvoice.delayReason !== 'NONE' && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <span className="font-bold text-amber-900 text-xs block">
                    Delay Attribution: {inspectInvoice.delayReason === 'OUR_MISTAKE_PROJECT_DELAY' ? 'Our Mistake / Internal Project Work Delay' : inspectInvoice.delayReason}
                  </span>
                  {inspectInvoice.delayNotes && (
                    <p className="text-amber-800 text-[11px] mt-0.5">{inspectInvoice.delayNotes}</p>
                  )}
                </div>
              )}

              {/* Installments Ledger */}
              {inspectInvoice.installments && inspectInvoice.installments.length > 0 && (
                <div>
                  <span className="text-slate-400 block font-semibold text-[10px] uppercase mb-2">Milestone Installments</span>
                  <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                    {inspectInvoice.installments.map((inst, i) => (
                      <div key={i} className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-800 block">{inst.label}</span>
                          <span className="text-[10px] text-slate-400">Due: {inst.dueDate} • Status: {inst.status} {inst.paymentMethod ? `via ${inst.paymentMethod}` : ''}</span>
                        </div>
                        <span className="font-mono font-bold text-slate-900">{formatINR(inst.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = inspectInvoice;
                    setInspectInvoice(null);
                    handleOpenEditInvoiceModal(target);
                  }}
                  className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Master Invoice</span>
                </button>

                <button
                  onClick={() => {
                    const target = inspectInvoice;
                    setInspectInvoice(null);
                    setShareStatementModalInvoice(target);
                  }}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 flex items-center gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Share Statement</span>
                </button>
              </div>

              <button
                onClick={() => setInspectInvoice(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Invoice */}
      {confirmDeleteInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Client Invoice?</h3>
                <p className="text-xs text-slate-500">{confirmDeleteInv.invoiceNumber} • {confirmDeleteInv.clientName}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This invoice of <span className="font-mono font-bold text-slate-900">{formatINR(confirmDeleteInv.totalAmount)}</span> will be moved to the <span className="font-bold text-slate-900">Recycle Bin</span>. All dashboard balances and receivables will recalculate automatically with zero error.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmDeleteInv(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteInvoice(confirmDeleteInv)}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md shadow-rose-600/20"
              >
                Move to Recycle Bin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Confirm Delete Receipt */}
      {confirmDeleteReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 p-6 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Payment Receipt?</h3>
                <p className="text-xs text-slate-500">{confirmDeleteReceipt.receiptNumber} • {confirmDeleteReceipt.clientName}</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              This split payment receipt of <span className="font-mono font-bold text-slate-900">{formatINR(confirmDeleteReceipt.amount)}</span> will be moved to the <span className="font-bold text-slate-900">Recycle Bin</span>. The credited amount will be reversed and the client balance due restored.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                onClick={() => setConfirmDeleteReceipt(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReceipt(confirmDeleteReceipt)}
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
