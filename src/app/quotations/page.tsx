'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  FileSpreadsheet, 
  Plus, 
  Trash2, 
  Send, 
  CheckCircle2, 
  Printer, 
  ExternalLink, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  AlertCircle, 
  Building, 
  Phone, 
  Percent, 
  Receipt,
  Eye,
  Lock,
  Pencil,
  FolderKanban
} from 'lucide-react';
import { Quotation, QuotationLineItem, GSTType, Lead, Client } from '@/lib/types';
import { getWhatsAppDirectUrl } from '@/lib/whatsappService';
import { useAuth } from '@/lib/AuthContext';

const PAYMENT_TERM_PRESETS = [
  '50% Advance / 30% Review / 20% Completion',
  '100% Upfront Retainer (Monthly)',
  '40% Advance / 30% Beta Delivery / 30% Launch',
  '30% Advance / 40% Milestone 1 / 30% Handover'
];

const DEFAULT_LATE_FEE = 'Payments delayed beyond the due date will incur a 2% compound late penalty fee per week.';

function QuotationContent() {
  const searchParams = useSearchParams();
  const { currentUser, canViewFinancials } = useAuth();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Auto Convert to Project Modal
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [quotationToConvert, setQuotationToConvert] = useState<Quotation | null>(null);
  const [isConverting, setIsConverting] = useState(false);

  // View Modal State
  const [previewQuotation, setPreviewQuotation] = useState<Quotation | null>(null);

  // Form State
  const [selectedLeadId, setSelectedLeadId] = useState(searchParams.get('leadId') || '');
  const [clientBusiness, setClientBusiness] = useState(searchParams.get('businessName') || '');
  const [clientContact, setClientContact] = useState(searchParams.get('leadName') || '');
  const [clientPhone, setClientPhone] = useState(searchParams.get('phone') || '');
  const [clientEmail, setClientEmail] = useState('');

  const [lineItems, setLineItems] = useState<QuotationLineItem[]>([
    {
      id: 'item-1',
      description: 'Web Application Architecture & Responsive Frontend Development',
      quantity: 1,
      unitPrice: Number(searchParams.get('dealValue')) || 150000,
      amount: Number(searchParams.get('dealValue')) || 150000
    }
  ]);

  const [gstType, setGstType] = useState<GSTType>('ADDITIONAL_18');
  const [paymentTerms, setPaymentTerms] = useState(PAYMENT_TERM_PRESETS[0]);
  const [lateFeeTerms, setLateFeeTerms] = useState(DEFAULT_LATE_FEE);

  // Edit Quotation State
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editClientBusiness, setEditClientBusiness] = useState('');
  const [editClientContact, setEditClientContact] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editLineItems, setEditLineItems] = useState<QuotationLineItem[]>([]);
  const [editGstType, setEditGstType] = useState<GSTType>('ADDITIONAL_18');
  const [editPaymentTerms, setEditPaymentTerms] = useState(PAYMENT_TERM_PRESETS[0]);
  const [editLateFeeTerms, setEditLateFeeTerms] = useState(DEFAULT_LATE_FEE);
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED'>('DRAFT');

  const loadData = async () => {
    try {
      const [quotesRes, leadsRes, clientsRes] = await Promise.all([
        fetch('/api/quotations').then(r => r.json()),
        fetch('/api/leads').then(r => r.json()),
        fetch('/api/clients').then(r => r.json())
      ]);

      if (quotesRes.success) setQuotations(quotesRes.data);
      if (leadsRes.success) setLeads(leadsRes.data);
      if (clientsRes.success) setClients(clientsRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync if query params exist (Once only to prevent duplicate modals and submissions)
  const hasInitializedFromQuery = React.useRef(false);

  useEffect(() => {
    if (hasInitializedFromQuery.current) return;
    const qLeadId = searchParams.get('leadId');
    if (qLeadId && leads.length > 0) {
      const lead = leads.find(l => l.id === qLeadId);
      if (lead) {
        hasInitializedFromQuery.current = true;
        setSelectedLeadId(lead.id);
        setClientBusiness(lead.businessName);
        setClientContact(lead.leadName);
        setClientPhone(lead.whatsappNumber);
        setClientEmail(lead.email || '');
        if (lead.estimatedDealValue > 0) {
          setLineItems([
            {
              id: 'item-1',
              description: `${lead.serviceType.replace(/_/g, ' ')} Development & Implementation`,
              quantity: 1,
              unitPrice: lead.estimatedDealValue,
              amount: lead.estimatedDealValue
            }
          ]);
        }
        setIsModalOpen(true);
      }
    }
  }, [searchParams, leads]);

  // Real-time synchronization across CRM pages & AI Copilot
  useEffect(() => {
    const handleCrmUpdate = () => {
      loadData();
    };
    window.addEventListener('crm-data-updated', handleCrmUpdate);
    return () => window.removeEventListener('crm-data-updated', handleCrmUpdate);
  }, []);

  const handleSelectLeadChange = (leadId: string) => {
    setSelectedLeadId(leadId);
    const lead = leads.find(l => l.id === leadId);
    if (lead) {
      setClientBusiness(lead.businessName);
      setClientContact(lead.leadName);
      setClientPhone(lead.whatsappNumber);
      setClientEmail(lead.email || '');
      if (lead.estimatedDealValue > 0) {
        setLineItems([
          {
            id: 'item-1',
            description: `${lead.serviceType.replace(/_/g, ' ')} Scope Deliverables`,
            quantity: 1,
            unitPrice: lead.estimatedDealValue,
            amount: lead.estimatedDealValue
          }
        ]);
      }
    }
  };

  // Line Item Calculations
  const handleItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    const updated = [...lineItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) || 0 : item.quantity;
      const price = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
      item.amount = qty * price;
    }
    updated[index] = item;
    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0
      }
    ]);
  };

  const removeLineItem = (index: number) => {
    if (lineItems.length === 1) return;
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  // Grand totals
  const subtotal = lineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  let taxAmount = 0;
  let grandTotal = subtotal;
  let internalTax = 0;

  if (gstType === 'ADDITIONAL_18') {
    taxAmount = Math.round(subtotal * 0.18);
    grandTotal = subtotal + taxAmount;
    internalTax = taxAmount;
  } else if (gstType === 'INCLUSIVE_18') {
    taxAmount = 0;
    grandTotal = subtotal;
    internalTax = Math.round((subtotal * 18) / 118);
  } else {
    taxAmount = 0;
    grandTotal = subtotal;
    internalTax = Math.round((subtotal * 18) / 118);
  }

  const handleCreateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return; // Prevent double-clicking / duplicate submissions
    if (!selectedLeadId || !clientBusiness || !clientContact || !clientPhone) {
      alert('Please fill all mandatory client details.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: selectedLeadId,
          clientBusiness,
          clientContact,
          clientPhone,
          clientEmail,
          lineItems,
          gstType,
          paymentTerms,
          lateFeeTerms
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        // Clear search params so modal does not pop up again on refresh
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, '', window.location.pathname);
        }
        hasInitializedFromQuery.current = true;
        setIsModalOpen(false);
        await loadData();
        setActionAlert(`✅ ${data.data.quotationNumber} generated and dispatched via WhatsApp to ${clientContact}!`);
        setTimeout(() => setActionAlert(null), 5000);

        // Notify other CRM views
        window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: { type: 'QUOTATION_CREATED' } }));

        // Open WhatsApp direct link
        const quoteText = `📄 *QUOTATION PROPOSAL: ${data.data.quotationNumber}*\n\nDear ${clientContact},\nThank you for considering Nearlook IT Solutions for ${clientBusiness}.\n\n*Amount Due:* ₹${data.data.totalAmount.toLocaleString('en-IN')}\n*Tax Structure:* ${gstType === 'ADDITIONAL_18' ? '+18% GST breakdown' : gstType === 'INCLUSIVE_18' ? '18% GST Inclusive' : 'No GST'}\n*Payment Milestones:* ${paymentTerms}\n*Late Penalty:* 2% compound interest per week past due date.\n\nPlease review our proposal. Reply YES to confirm!`;
        const waUrl = getWhatsAppDirectUrl(clientPhone, quoteText);
        window.open(waUrl, '_blank');

        // Prompt to automatically convert to active Project
        setQuotationToConvert(data.data);
        setShowConvertModal(true);
      } else {
        alert(data.error || 'Failed to create quotation');
      }
    } catch (e) {
      console.error(e);
      alert('Error creating quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendWhatsApp = (quote: Quotation) => {
    const quoteText = `📄 *OFFICIAL QUOTATION: ${quote.quotationNumber}*\n\nDear ${quote.clientContact},\nHere is your quotation proposal for ${quote.clientBusiness}:\n\n*Total Amount:* ₹${quote.totalAmount.toLocaleString('en-IN')}\n*Milestone Terms:* ${quote.paymentTerms}\n*Terms:* ${quote.lateFeeTerms}\n\nLet us know if you have questions!`;
    const waUrl = getWhatsAppDirectUrl(quote.clientPhone, quoteText);
    window.open(waUrl, '_blank');
  };

  // Edit Quotation Handlers
  const openEditQuotation = (quote: Quotation) => {
    setEditingQuotation(quote);
    setEditClientBusiness(quote.clientBusiness);
    setEditClientContact(quote.clientContact);
    setEditClientPhone(quote.clientPhone);
    setEditClientEmail(quote.clientEmail || '');
    setEditLineItems(quote.lineItems ? JSON.parse(JSON.stringify(quote.lineItems)) : []);
    setEditGstType(quote.gstType || 'ADDITIONAL_18');
    setEditPaymentTerms(quote.paymentTerms || PAYMENT_TERM_PRESETS[0]);
    setEditLateFeeTerms(quote.lateFeeTerms || DEFAULT_LATE_FEE);
    setEditStatus(quote.status as any || 'DRAFT');
    setIsEditModalOpen(true);
  };

  const handleEditItemChange = (index: number, field: keyof QuotationLineItem, value: any) => {
    const updated = [...editLineItems];
    const item = { ...updated[index], [field]: value };
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = field === 'quantity' ? Number(value) || 0 : item.quantity;
      const price = field === 'unitPrice' ? Number(value) || 0 : item.unitPrice;
      item.amount = qty * price;
    }
    updated[index] = item;
    setEditLineItems(updated);
  };

  const addEditLineItem = () => {
    setEditLineItems([
      ...editLineItems,
      {
        id: `item-${Date.now()}`,
        description: '',
        quantity: 1,
        unitPrice: 0,
        amount: 0
      }
    ]);
  };

  const removeEditLineItem = (index: number) => {
    if (editLineItems.length <= 1) return;
    setEditLineItems(editLineItems.filter((_, i) => i !== index));
  };

  const editSubtotal = editLineItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  let editTaxAmount = 0;
  let editGrandTotal = editSubtotal;
  let editInternalTax = 0;
  if (editGstType === 'ADDITIONAL_18') {
    editTaxAmount = Math.round(editSubtotal * 0.18);
    editGrandTotal = editSubtotal + editTaxAmount;
    editInternalTax = editTaxAmount;
  } else if (editGstType === 'INCLUSIVE_18') {
    editTaxAmount = 0;
    editGrandTotal = editSubtotal;
    editInternalTax = Math.round((editSubtotal * 18) / 118);
  } else {
    editTaxAmount = 0;
    editGrandTotal = editSubtotal;
    editInternalTax = Math.round((editSubtotal * 18) / 118);
  }

  const handleUpdateQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuotation) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/quotations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingQuotation.id,
          clientBusiness: editClientBusiness,
          clientContact: editClientContact,
          clientPhone: editClientPhone,
          clientEmail: editClientEmail,
          lineItems: editLineItems,
          gstType: editGstType,
          paymentTerms: editPaymentTerms,
          lateFeeTerms: editLateFeeTerms,
          status: editStatus
        })
      });
      const data = await res.json();
      if (data.success) {
        setQuotations(prev => prev.map(q => q.id === editingQuotation.id ? data.data : q));
        setIsEditModalOpen(false);
        setEditingQuotation(null);
        setActionAlert(`Quotation ${data.data.quotationNumber} updated successfully!`);
        setTimeout(() => setActionAlert(null), 3500);

        if (editStatus === 'ACCEPTED') {
          setQuotationToConvert(data.data);
          setShowConvertModal(true);
        }
      } else {
        alert(data.error || 'Failed to update quotation');
      }
    } catch (e) {
      console.error(e);
      alert('Error updating quotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmConvertToProject = async () => {
    if (!quotationToConvert) return;
    setIsConverting(true);
    try {
      let targetClientId = '';
      const existingClient = clients.find(c => 
        c.businessName.toLowerCase() === quotationToConvert.clientBusiness.toLowerCase() ||
        c.whatsappNumber === quotationToConvert.clientPhone
      );

      if (existingClient) {
        targetClientId = existingClient.id;
      } else {
        const clientRes = await fetch('/api/clients', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessName: quotationToConvert.clientBusiness,
            contactName: quotationToConvert.clientContact,
            whatsappNumber: quotationToConvert.clientPhone,
            email: quotationToConvert.clientEmail || `${quotationToConvert.clientContact.toLowerCase().replace(/\s+/g, '')}@client.com`,
            clientType: 'ONE_TIME_PROJECT'
          })
        });
        const clientData = await clientRes.json();
        if (clientData.success) {
          targetClientId = clientData.data.id;
        }
      }

      const milestones = (quotationToConvert.lineItems || []).map((li, idx) => ({
        id: `ms-${Date.now()}-${idx}`,
        title: li.description || `Milestone ${idx + 1}`,
        deliverable: `Scope item from ${quotationToConvert.quotationNumber}`,
        amount: li.amount,
        status: 'PENDING'
      }));

      const projRes = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `${quotationToConvert.clientBusiness} Delivery Project`,
          clientId: targetClientId,
          domain: 'SOFTWARE',
          techStack: 'Next.js 14, Node.js, Cloud APIs',
          totalValue: quotationToConvert.totalAmount,
          advanceRequired: Math.round(quotationToConvert.totalAmount * 0.4),
          status: 'IN_PROGRESS',
          description: `Auto-converted from Quotation ${quotationToConvert.quotationNumber}. Milestone terms: ${quotationToConvert.paymentTerms}`,
          milestones
        })
      });

      const projData = await projRes.json();
      if (projData.success) {
        setShowConvertModal(false);
        window.dispatchEvent(new CustomEvent('crm-data-updated'));
        window.location.href = `/projects?viewProjectId=${projData.data.id}`;
      } else {
        alert(projData.error || 'Failed to convert project');
      }
    } catch (err) {
      console.error(err);
      alert('Error converting quotation to project');
    } finally {
      setIsConverting(false);
    }
  };

  const handleDeleteQuotation = async (quote: Quotation) => {
    if (!confirm(`Are you sure you want to delete quotation "${quote.quotationNumber}" for ${quote.clientBusiness}? This action cannot be undone.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/quotations?id=${quote.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setQuotations(prev => prev.filter(q => q.id !== quote.id));
        setActionAlert(`Quotation ${quote.quotationNumber} deleted.`);
        setTimeout(() => setActionAlert(null), 3500);
      } else {
        alert(data.error || 'Failed to delete quotation');
      }
    } catch (e) {
      console.error(e);
      alert('Error deleting quotation');
    }
  };

  if (!canViewFinancials) {
    return (
      <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-black text-slate-900">Restricted Module: Quotations & Commercials</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Quotation generation, pricing structures, and commercial deal values are restricted to Admin/Owner and Account Managers under Phase 1 RBAC isolation rules.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-orange-600" />
            Automated Quotation Engine (₹ INR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Phase 3: Sequential numbering (Quotation - 01), dynamic 18% GST computation, milestone terms & automated WhatsApp dispatch.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Quotation</span>
        </button>
      </div>

      {/* Action Banner */}
      {actionAlert && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionAlert}</span>
        </div>
      )}

      {/* Engine Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quotations Issued</span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {quotations.length} Proposals
          </div>
          <span className="text-[11px] text-orange-600 font-bold">Sequential auto-increment active</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quoted Pipeline (₹)</span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            ₹{quotations.reduce((sum, q) => sum + q.totalAmount, 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-500 font-medium">All active proposals in INR</span>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">GST Liability Reserved</span>
          <div className="mt-1 text-2xl font-black text-emerald-600">
            ₹{quotations.reduce((sum, q) => sum + (q.internalTaxCalculated || 0), 0).toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-emerald-700 font-bold">18% GST tax liability component</span>
        </div>
      </div>

      {/* Quotations List Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-orange-600" />
              Issued Quotation Directory
            </h2>
            <p className="text-xs text-slate-500">
              Complete history of client proposals, milestone terms, and WhatsApp dispatch logs.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
              <tr>
                <th className="py-3 px-4">Quote #</th>
                <th className="py-3 px-4">Client / Brand</th>
                <th className="py-3 px-4">Tax Structure</th>
                <th className="py-3 px-4 text-right">Subtotal (₹)</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4">Payment Milestones</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {quotations.map((quote) => (
                <tr key={quote.id} className="hover:bg-orange-50/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-orange-600 whitespace-nowrap">
                    {quote.quotationNumber}
                    {quote.recoveredFrom && (
                      <span className="block text-[10px] text-emerald-600 font-sans font-semibold">
                        Recovered from {quote.recoveredFrom}
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{quote.clientBusiness}</div>
                    <div className="text-[11px] text-slate-500">{quote.clientContact} • {quote.clientPhone}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    {quote.gstType === 'ADDITIONAL_18' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        +18% GST (₹{quote.taxAmount.toLocaleString('en-IN')})
                      </span>
                    )}
                    {quote.gstType === 'INCLUSIVE_18' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                        18% GST Inclusive (₹{quote.internalTaxCalculated.toLocaleString('en-IN')} tax)
                      </span>
                    )}
                    {quote.gstType === 'NO_GST' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                        No GST (0%)
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-semibold text-slate-700">
                    ₹{quote.subtotal.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900 text-sm">
                    ₹{quote.totalAmount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-[11px] font-medium text-slate-700 block max-w-xs truncate" title={quote.paymentTerms}>
                      {quote.paymentTerms}
                    </span>
                    <span className="text-[10px] text-amber-600 font-bold block">
                      Late: 2%/wk overdue interest
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      quote.status === 'ACCEPTED'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {quote.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => setPreviewQuotation(quote)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                        title="View Quotation Preview"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => openEditQuotation(quote)}
                        className="p-1.5 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-colors"
                        title="Edit Quotation"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteQuotation(quote)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
                        title="Delete Quotation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleSendWhatsApp(quote)}
                        className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                        title="Send via WhatsApp"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Preview Modal */}
      {previewQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            {/* Fixed Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm shrink-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Nearlook Mart Pvt Ltd" className="h-10 w-auto object-contain" />
                </div>
                <div>
                  <span className="text-[10px] font-black tracking-widest uppercase text-orange-600">NEARLOOK IT SOLUTIONS & AGENCY</span>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 mt-0.5">{previewQuotation.quotationNumber}</h2>
                  {previewQuotation.recoveredFrom && (
                    <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Recovered from {previewQuotation.recoveredFrom}</div>
                  )}
                  <div className="text-xs text-slate-500 mt-0.5">Date: {new Date(previewQuotation.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuotation(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors text-lg font-bold"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Client / Recipient</span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">{previewQuotation.clientBusiness}</div>
                  <div className="text-slate-600">{previewQuotation.clientContact}</div>
                  <div className="text-slate-600">{previewQuotation.clientPhone}</div>
                  {previewQuotation.clientEmail && <div className="text-slate-500">{previewQuotation.clientEmail}</div>}
                </div>

                <div>
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">Commercial Terms</span>
                  <div className="font-semibold text-slate-800 mt-0.5">Milestone: {previewQuotation.paymentTerms}</div>
                  <div className="font-medium text-amber-700 mt-1">{previewQuotation.lateFeeTerms}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                    <tr>
                      <th className="p-3">Deliverable Scope</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Rate (₹)</th>
                      <th className="p-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewQuotation.lineItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="p-3 font-medium text-slate-800">{item.description}</td>
                        <td className="p-3 text-center font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">₹{item.unitPrice.toLocaleString('en-IN')}</td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end">
                <div className="w-64 space-y-2 text-xs font-mono">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span>₹{previewQuotation.subtotal.toLocaleString('en-IN')}</span>
                  </div>

                  {previewQuotation.gstType === 'ADDITIONAL_18' && (
                    <div className="flex justify-between text-slate-600">
                      <span>GST (+18%):</span>
                      <span>+₹{previewQuotation.taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {previewQuotation.gstType === 'INCLUSIVE_18' && (
                    <div className="flex justify-between text-purple-700 font-sans text-[11px]">
                      <span>GST (18% Flat Inclusive):</span>
                      <span>₹{previewQuotation.internalTaxCalculated.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-slate-900 text-base pt-2 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="text-orange-600">₹{previewQuotation.totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Export PDF</span>
              </button>
              <button
                type="button"
                onClick={() => handleSendWhatsApp(previewQuotation)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>Send WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Quotation Modal (Phase 3) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleCreateQuotation} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-orange-600" />
                    Generate Sequential Quotation
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Next sequential numbering will be generated automatically (`Quotation - 0{quotations.length + 1}`).
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
              <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Client & Lead Selection */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700">1. Select Target Lead & Client Contact:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Lead from CRM *</label>
                    <select
                      value={selectedLeadId}
                      onChange={(e) => handleSelectLeadChange(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    >
                      <option value="">-- Choose Lead --</option>
                      {leads.map(l => (
                        <option key={l.id} value={l.id}>[{l.leadStage}] {l.businessName} - {l.leadName}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Company / Brand Name *</label>
                    <input
                      type="text"
                      required
                      value={clientBusiness}
                      onChange={(e) => setClientBusiness(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={clientContact}
                      onChange={(e) => setClientContact(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Email</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-700">2. Itemized Deliverables & Pricing (₹ INR):</div>
                  <button
                    type="button"
                    onClick={addLineItem}
                    className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-200 transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold">
                      <tr>
                        <th className="p-2.5">Scope Description</th>
                        <th className="p-2.5 w-20 text-center">Qty</th>
                        <th className="p-2.5 w-32 text-right">Unit Price (₹)</th>
                        <th className="p-2.5 w-32 text-right">Amount (₹)</th>
                        <th className="p-2.5 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item, idx) => (
                        <tr key={item.id}>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="e.g. Next.js Full Stack Architecture & CMS..."
                              value={item.description}
                              onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-900 text-center font-mono focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 text-right font-mono font-bold focus:outline-none focus:ring-1 focus:ring-orange-500"
                            />
                          </td>
                          <td className="p-2 text-right font-mono font-black text-slate-900">
                            ₹{(item.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-center">
                            {lineItems.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLineItem(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Dynamic GST Selector (Phase 3 Core) */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  3. Dynamic GST Rate Configuration:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label
                    onClick={() => setGstType('ADDITIONAL_18')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      gstType === 'ADDITIONAL_18'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">+18% Additional GST</span>
                      <input
                        type="radio"
                        checked={gstType === 'ADDITIONAL_18'}
                        onChange={() => setGstType('ADDITIONAL_18')}
                        className="text-orange-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Subtotal + 18% Tax = Grand Total (transparent tax breakdown displayed to client).
                    </p>
                  </label>

                  <label
                    onClick={() => setGstType('INCLUSIVE_18')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      gstType === 'INCLUSIVE_18'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">18% Inclusive GST</span>
                      <input
                        type="radio"
                        checked={gstType === 'INCLUSIVE_18'}
                        onChange={() => setGstType('INCLUSIVE_18')}
                        className="text-orange-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Flat rate shown to client. Internal tax (18/118) tracked for government compliance.
                    </p>
                  </label>

                  <label
                    onClick={() => setGstType('NO_GST')}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      gstType === 'NO_GST'
                        ? 'border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/30'
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900">No GST (0%)</span>
                      <input
                        type="radio"
                        checked={gstType === 'NO_GST'}
                        onChange={() => setGstType('NO_GST')}
                        className="text-orange-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      No GST line item shown/charged to client. Internal 18% GST (18/118) tracked for company accounting.
                    </p>
                  </label>
                </div>
              </div>

              {/* Payment Milestones & 2% Late Fee Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Milestone Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                  >
                    {PAYMENT_TERM_PRESETS.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Late Penalty Clause (2%/week default)</label>
                  <input
                    type="text"
                    value={lateFeeTerms}
                    onChange={(e) => setLateFeeTerms(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Live Totals Card */}
              <div className="p-4 bg-orange-50/70 border border-orange-200 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="text-xs text-slate-700 space-y-1">
                  <div>Items Subtotal: <strong className="font-mono">₹{subtotal.toLocaleString('en-IN')}</strong></div>
                  <div>
                    Tax: {gstType === 'ADDITIONAL_18' ? `+₹${taxAmount.toLocaleString('en-IN')} (18% Additional)` : gstType === 'INCLUSIVE_18' ? `₹${internalTax.toLocaleString('en-IN')} (Inclusive Component)` : '₹0'}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    🏛️ Tax Liability Reserved: ₹{internalTax.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quotation Grand Total</span>
                  <div className="text-2xl font-black text-orange-600 font-mono">
                    ₹{grandTotal.toLocaleString('en-IN')}
                  </div>
                </div>
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
                  disabled={submitting}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Generating...' : 'Save & Dispatch Quotation (WA)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Quotation Modal */}
      {isEditModalOpen && editingQuotation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl text-slate-900 flex flex-col max-h-[90vh] overflow-hidden">
            <form onSubmit={handleUpdateQuotation} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              {/* Fixed Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
                <div>
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <Pencil className="w-5 h-5 text-orange-600" />
                    Edit Quotation: {editingQuotation.quotationNumber}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update deliverables, 18% GST calculation, milestone schedules, and status.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingQuotation(null); }}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg font-bold transition-colors cursor-pointer"
                  title="Close"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5">
              {/* Client Info */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="text-xs font-bold text-slate-700">1. Client Contact & Status:</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Company / Brand *</label>
                    <input
                      type="text"
                      required
                      value={editClientBusiness}
                      onChange={(e) => setEditClientBusiness(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={editClientContact}
                      onChange={(e) => setEditClientContact(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Quotation Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="DRAFT">DRAFT</option>
                      <option value="SENT">SENT</option>
                      <option value="ACCEPTED">ACCEPTED</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      required
                      value={editClientPhone}
                      onChange={(e) => setEditClientPhone(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editClientEmail}
                      onChange={(e) => setEditClientEmail(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-700">2. Deliverable Scope & Pricing (₹ INR):</div>
                  <button
                    type="button"
                    onClick={addEditLineItem}
                    className="text-[11px] font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editLineItems.map((item, idx) => (
                    <div key={item.id || idx} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-12 sm:col-span-6">
                        <input
                          type="text"
                          required
                          placeholder="Scope description..."
                          value={item.description}
                          onChange={(e) => handleEditItemChange(idx, 'description', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                      <div className="col-span-4 sm:col-span-2">
                        <input
                          type="number"
                          min="1"
                          placeholder="Qty"
                          value={item.quantity}
                          onChange={(e) => handleEditItemChange(idx, 'quantity', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-center text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                        />
                      </div>
                      <div className="col-span-6 sm:col-span-3">
                        <input
                          type="number"
                          min="0"
                          placeholder="Rate ₹"
                          value={item.unitPrice}
                          onChange={(e) => handleEditItemChange(idx, 'unitPrice', e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-right text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono font-bold"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeEditLineItem(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GST & Terms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">3. Indian GST Tax Structure</label>
                  <select
                    value={editGstType}
                    onChange={(e) => setEditGstType(e.target.value as GSTType)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ADDITIONAL_18">+18% Additional GST (Added on top of deliverables)</option>
                    <option value="INCLUSIVE_18">18% Inclusive GST (Included in total quotation amount)</option>
                    <option value="NO_GST">No GST (0% Client Billed • 18% Internal Statutory Tax Tracked)</option>
                  </select>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">4. Milestone Payment Terms</label>
                  <select
                    value={editPaymentTerms}
                    onChange={(e) => setEditPaymentTerms(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    {PAYMENT_TERM_PRESETS.map((t, i) => (
                      <option key={i} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-xs text-slate-600">
                    Subtotal: <strong className="font-mono text-slate-900 font-bold">₹{editSubtotal.toLocaleString('en-IN')}</strong>
                    {editGstType === 'ADDITIONAL_18' && ` + 18% GST (₹${editTaxAmount.toLocaleString('en-IN')})`}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-bold">
                    🏛️ Tax Liability Reserved: ₹{editInternalTax.toLocaleString('en-IN')}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quotation Grand Total</span>
                  <div className="text-2xl font-black text-orange-600 font-mono">
                    ₹{editGrandTotal.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              </div>

              {/* Fixed Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setIsEditModalOpen(false); setEditingQuotation(null); }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all disabled:opacity-60 flex items-center gap-2 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>{submitting ? 'Updating...' : 'Save Changes (₹)'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          AUTO CONVERT TO PROJECT MODAL (When Quotation is created / accepted)
         ========================================================================= */}
      {showConvertModal && quotationToConvert && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm overflow-hidden animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            {/* Fixed Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <FolderKanban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">Add to Projects?</h3>
                  <p className="text-[11px] text-slate-400">Convert accepted quotation into active site</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setShowConvertModal(false); setQuotationToConvert(null); }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 text-lg font-bold transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto flex-1 p-6 space-y-3 text-xs">
              <p className="text-xs text-slate-600 leading-relaxed">
                Quotation <strong className="text-slate-800 font-bold">{quotationToConvert.quotationNumber}</strong> has been generated for <strong className="text-slate-800 font-bold">{quotationToConvert.clientBusiness}</strong>. Would you like to automatically create and track this as an active Project?
              </p>

              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Total Contract Value:</span>
                  <span className="font-mono font-black text-slate-900">₹{quotationToConvert.totalAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Advance Expected (40%):</span>
                  <span className="font-mono font-bold text-amber-700">₹{Math.round(quotationToConvert.totalAmount * 0.4).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-bold">Milestones Imported:</span>
                  <span className="font-bold text-slate-800">{(quotationToConvert.lineItems || []).length} scope items</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 italic">
                Clicking &quot;Yes&quot; will create the project and take you directly to the Projects page showing the overall details.
              </p>
            </div>

            {/* Fixed Footer */}
            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={() => { setShowConvertModal(false); setQuotationToConvert(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-100 cursor-pointer"
              >
                No, Keep in Quotations
              </button>
              <button
                type="button"
                onClick={handleConfirmConvertToProject}
                disabled={isConverting}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isConverting ? 'Creating Project...' : 'Yes, Add to Projects'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function QuotationsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading Quotations Engine...</div>}>
      <QuotationContent />
    </Suspense>
  );
}
