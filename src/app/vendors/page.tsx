'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Building
} from 'lucide-react';
import { Vendor, VendorType } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function VendorsPage() {
  const { currentStaff, canViewFinancials } = useAuth();

  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
  const [formContact, setFormContact] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formBankDetails, setFormBankDetails] = useState('');
  const [formVendorType, setFormVendorType] = useState<VendorType>('VENDOR');
  const [formCategory, setFormCategory] = useState('HOSTING_SERVERS');
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formFollowers, setFormFollowers] = useState('');
  const [formTotalPayable, setFormTotalPayable] = useState('');
  const [formAdvancePaid, setFormAdvancePaid] = useState('0');
  const [formDueDate, setFormDueDate] = useState('');

  const loadData = async () => {
    try {
      const res = await fetch('/api/vendors').then(r => r.json());
      if (res.success) setVendors(res.data);
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

  const resetForm = () => {
    setFormName('');
    setFormContact('');
    setFormPhone('');
    setFormEmail('');
    setFormBankDetails('');
    setFormVendorType('VENDOR');
    setFormCategory('HOSTING_SERVERS');
    setFormPlatform('Instagram');
    setFormFollowers('');
    setFormTotalPayable('');
    setFormAdvancePaid('0');
    setFormDueDate(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (v: Vendor) => {
    setEditingVendor(v);
    setFormName(v.companyName);
    setFormContact(v.contactPerson || '');
    setFormPhone(v.phone);
    setFormEmail(v.email || '');
    setFormBankDetails(v.bankDetails || '');
    setFormVendorType(v.vendorType || 'VENDOR');
    setFormCategory(v.serviceCategory);
    setFormPlatform(v.platform || 'Instagram');
    setFormFollowers(v.followerCount || '');
    setFormTotalPayable(String(v.totalPayable));
    setFormAdvancePaid(String(v.advancePaid));
    setFormDueDate(v.dueDate || '');
  };

  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formPhone || !formTotalPayable) {
      alert('Please fill in Name, Phone, and Total Payable');
      return;
    }

    try {
      if (editingVendor) {
        const res = await fetch('/api/vendors', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingVendor.id,
            companyName: formName,
            contactPerson: formContact,
            phone: formPhone,
            email: formEmail,
            bankDetails: formBankDetails,
            vendorType: formVendorType,
            serviceCategory: formCategory,
            platform: formPlatform,
            followerCount: formFollowers,
            totalPayable: Number(formTotalPayable),
            advancePaid: Number(formAdvancePaid),
            balanceDue: Math.max(0, Number(formTotalPayable) - Number(formAdvancePaid)),
            dueDate: formDueDate
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ ${formVendorType === 'INFLUENCER' ? 'Influencer' : 'Vendor'} updated successfully.`);
          setEditingVendor(null);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else {
        const res = await fetch('/api/vendors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            companyName: formName,
            contactPerson: formContact,
            phone: formPhone,
            email: formEmail,
            bankDetails: formBankDetails,
            vendorType: formVendorType,
            serviceCategory: formCategory,
            platform: formPlatform,
            followerCount: formFollowers,
            totalPayable: Number(formTotalPayable),
            advancePaid: Number(formAdvancePaid),
            dueDate: formDueDate
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Added ${formName} to Vendor & Influencers.`);
          setShowCreateModal(false);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save');
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
        setToastMessage(`💰 Payment of ${formatINR(Number(paymentAmount))} recorded for ${payingVendor.companyName}. Balance updated!`);
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
        setToastMessage(`🗑️ ${deletingVendor.companyName} moved to Recycle Bin.`);
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
      (v.phone && v.phone.includes(search)) ||
      (v.serviceCategory && v.serviceCategory.toLowerCase().includes(search.toLowerCase()));

    const matchesType = typeFilter === 'ALL' || (v.vendorType || 'VENDOR') === typeFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'PENDING' && v.balanceDue > 0) || 
      (statusFilter === 'SETTLED' && v.balanceDue <= 0);

    return matchesSearch && matchesType && matchesStatus;
  });

  const totalContracted = vendors.reduce((acc, v) => acc + (v.totalPayable || 0), 0);
  const totalPaid = vendors.reduce((acc, v) => acc + (v.advancePaid || 0), 0);
  const totalBalanceDue = vendors.reduce((acc, v) => acc + (v.balanceDue || 0), 0);
  const pendingCount = vendors.filter(v => (v.balanceDue || 0) > 0).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading Vendor & Influencer Payables...</p>
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
              Vendor & Influencers Commercial Payables
            </h1>
            <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-rose-300">
              Procurement & Creators
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Liabilities and payments management for Cloud/AWS hosting, domain registrars, hardware suppliers, freelance developers, and marketing influencers.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Vendor / Influencer</span>
        </button>
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
            <span>Total Payable Contracted</span>
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
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-600 mt-2">{formatINR(totalPaid)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Settled through bank / UPI</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Balance Due (Outstanding)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-xl font-black text-rose-600 mt-2">{formatINR(totalBalanceDue)}</p>
          <div className="text-[11px] text-rose-600 font-semibold mt-1">
            <span>Flows into Dashboard Payables</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Pending Payouts Count</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 mt-2">{pendingCount}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Vendors & Influencers with due</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendor name, influencer handle, phone, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Entity:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              aria-label="Filter by partner entity"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Partners</option>
              <option value="VENDOR">Tech Infrastructure Vendors</option>
              <option value="INFLUENCER">Social Media Influencers</option>
              <option value="FREELANCER">Freelance Engineers</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by payout status"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Payouts</option>
              <option value="PENDING">Pending Dues Only</option>
              <option value="SETTLED">Fully Settled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vendors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Partner & Handle</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Total Committed</th>
                <th className="py-3 px-4 text-right">Disbursed Amount</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No vendor or influencer records found.
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
                          {v.followerCount && (
                            <span className="text-[9px] font-bold px-1.5 py-0.2 bg-purple-100 text-purple-800 rounded">
                              {v.followerCount}
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {v.contactPerson ? `${v.contactPerson} • ` : ''}{v.phone}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          v.vendorType === 'INFLUENCER' 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : v.vendorType === 'FREELANCER'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {v.vendorType || 'VENDOR'}
                        </span>
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
                      <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-500">
                        {v.dueDate || 'Immediate'}
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
                      ⚠️ Note: Amount exceeds balance due. Excess of {formatINR(Number(paymentAmount) - payingVendor.balanceDue)} will be logged as Advance Credit to Vendor.
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
                    <option value="NEFT_RTGS">Bank Transfer (NEFT / RTGS / IMPS)</option>
                    <option value="UPI">UPI Transfer</option>
                    <option value="CREDIT_CARD">Company Corporate Card</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Notes / Transaction Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR / Transaction ID #10294829"
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
          CREATE / EDIT MODAL
         ========================================================================= */}
      {(showCreateModal || editingVendor) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center space-x-2">
                <Truck className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-lg text-slate-900">
                  {editingVendor ? 'Edit Partner' : 'Add Vendor or Influencer'}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Partner / Creator / Company Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cloudways Infrastructure, @tech_aarav, OpenAI"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Entity Type *</label>
                    <select
                      value={formVendorType}
                      onChange={(e) => setFormVendorType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="VENDOR">Tech Infrastructure Vendor</option>
                      <option value="INFLUENCER">Social Media Influencer</option>
                      <option value="FREELANCER">Freelance Developer / Specialist</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Service Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="HOSTING_SERVERS">Cloud Servers & Hosting (AWS/Cloudways)</option>
                      <option value="DOMAIN_REGISTRATION">Domain Registrars & DNS</option>
                      <option value="INFLUENCER_PAYOUT">Influencer Sponsored Campaign</option>
                      <option value="FREELANCER">Freelance AI / Software Dev</option>
                      <option value="PURCHASES_HARDWARE">Hardware & Monitors</option>
                      <option value="SAAS_TOOL">API & SaaS Licenses</option>
                      <option value="TEA_SNACKS">Office Refreshments & Pantry</option>
                    </select>
                  </div>

                  {formVendorType === 'INFLUENCER' && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Platform</label>
                        <select
                          value={formPlatform}
                          onChange={(e) => setFormPlatform(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        >
                          <option value="Instagram">Instagram</option>
                          <option value="YouTube">YouTube</option>
                          <option value="LinkedIn">LinkedIn</option>
                          <option value="X">X (Twitter)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Follower Count</label>
                        <input
                          type="text"
                          placeholder="e.g. 280K, 1.2M"
                          value={formFollowers}
                          onChange={(e) => setFormFollowers(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={formContact}
                      onChange={(e) => setFormContact(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Phone / WhatsApp *</label>
                    <input
                      type="text"
                      required
                      value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Total Payable (₹) *</label>
                    <input
                      type="number"
                      required
                      value={formTotalPayable}
                      onChange={(e) => setFormTotalPayable(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Disbursed Amount (₹)</label>
                    <input
                      type="number"
                      value={formAdvancePaid}
                      onChange={(e) => setFormAdvancePaid(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Bank Details / UPI ID</label>
                    <input
                      type="text"
                      placeholder="e.g. HDFC Bank A/C: ... or UPI: handle@okhdfcbank"
                      value={formBankDetails}
                      onChange={(e) => setFormBankDetails(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
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
                  {editingVendor ? 'Save Changes' : 'Add Partner'}
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
                {viewingVendor.followerCount && (
                  <span className="text-xs font-bold text-purple-700">
                    {viewingVendor.platform}: {viewingVendor.followerCount} Followers
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
                  <span className="text-[10px] text-emerald-600 uppercase font-bold block">Disbursed Amount</span>
                  <span className="text-sm font-black text-emerald-600">{formatINR(viewingVendor.advancePaid)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-rose-600 uppercase font-bold block">Balance Due</span>
                  <span className="text-sm font-black text-rose-600">{formatINR(viewingVendor.balanceDue)}</span>
                </div>
              </div>

              {viewingVendor.advanceCredit && viewingVendor.advanceCredit > 0 && (
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 flex justify-between items-center text-xs text-purple-900 font-bold">
                  <span>Advance Credit to Vendor (Excess Disbursed):</span>
                  <span className="font-mono text-sm">{formatINR(viewingVendor.advanceCredit)}</span>
                </div>
              )}

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Category:</span>
                  <span className="font-mono text-slate-800">{viewingVendor.serviceCategory.replace(/_/g, ' ')}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold">Phone:</span>
                  <span className="font-mono text-slate-800">{viewingVendor.phone}</span>
                </div>
                {viewingVendor.email && (
                  <div className="flex justify-between py-1 border-b border-slate-100">
                    <span className="text-slate-500 font-bold">Email:</span>
                    <span className="text-slate-800">{viewingVendor.email}</span>
                  </div>
                )}
                {viewingVendor.bankDetails && (
                  <div className="py-1">
                    <span className="text-slate-500 font-bold block mb-1">Bank / UPI:</span>
                    <p className="p-2 bg-slate-50 rounded font-mono text-slate-800">{viewingVendor.bankDetails}</p>
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
              Are you sure you want to delete <strong className="text-slate-800">{deletingVendor.companyName}</strong>? Dashboard payables will automatically subtract this balance. It can be restored anytime with a new ID number.
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

