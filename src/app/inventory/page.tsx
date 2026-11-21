'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Boxes, 
  Plus, 
  Search, 
  Laptop, 
  Tv, 
  Key, 
  Cloud, 
  Sparkles, 
  Eye, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  X, 
  Check, 
  ExternalLink,
  ShieldCheck,
  Building,
  UserCheck
} from 'lucide-react';
import { ITInventoryItem, ITInventoryCategory, ITInventoryStatus, StaffMember } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function InventoryPage() {
  const { currentStaff, canViewFinancials } = useAuth();

  const [items, setItems] = useState<ITInventoryItem[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<ITInventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<ITInventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<ITInventoryItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formItemCode, setFormItemCode] = useState('');
  const [formCategory, setFormCategory] = useState<ITInventoryCategory>('HARDWARE_LAPTOPS');
  const [formSerial, setFormSerial] = useState('');
  const [formTotalQty, setFormTotalQty] = useState('1');
  const [formAvailQty, setFormAvailQty] = useState('0');
  const [formAssignedStaffId, setFormAssignedStaffId] = useState('');
  const [formVendorName, setFormVendorName] = useState('Dell Enterprise Hardware India');
  const [formPurchaseValue, setFormPurchaseValue] = useState('');
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [formWarrantyExpiry, setFormWarrantyExpiry] = useState('');
  const [formStatus, setFormStatus] = useState<ITInventoryStatus>('IN_USE');
  const [formNotes, setFormNotes] = useState('');

  const loadData = async () => {
    try {
      const [invRes, staffRes] = await Promise.all([
        fetch('/api/inventory').then(r => r.json()),
        fetch('/api/staff').then(r => r.json())
      ]);

      if (invRes.success) setItems(invRes.data);
      if (staffRes.success) setStaff(staffRes.data);
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
    setFormItemCode(`AST-${Date.now().toString().slice(-4)}`);
    setFormCategory('HARDWARE_LAPTOPS');
    setFormSerial('');
    setFormTotalQty('1');
    setFormAvailQty('0');
    setFormAssignedStaffId('');
    setFormVendorName('Dell Enterprise Hardware India');
    setFormPurchaseValue('');
    setFormPurchaseDate(new Date().toISOString().split('T')[0]);
    setFormWarrantyExpiry('');
    setFormStatus('IN_USE');
    setFormNotes('');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (item: ITInventoryItem) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormItemCode(item.itemCode);
    setFormCategory(item.category);
    setFormSerial(item.serialOrLicenseKey || '');
    setFormTotalQty(String(item.totalQuantity));
    setFormAvailQty(String(item.availableQuantity));
    setFormAssignedStaffId(item.assignedStaffId || '');
    setFormVendorName(item.vendorName || '');
    setFormPurchaseValue(String(item.purchaseValue || ''));
    setFormPurchaseDate(item.purchaseDate || '');
    setFormWarrantyExpiry(item.warrantyExpiry || '');
    setFormStatus(item.status);
    setFormNotes(item.notes || '');
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formCategory) {
      alert('Please fill in Item Name and Category');
      return;
    }

    const assignedStaff = staff.find(s => s.id === formAssignedStaffId);

    try {
      if (editingItem) {
        const res = await fetch('/api/inventory', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingItem.id,
            name: formName,
            itemCode: formItemCode,
            category: formCategory,
            serialOrLicenseKey: formSerial,
            totalQuantity: Number(formTotalQty),
            availableQuantity: Number(formAvailQty),
            assignedStaffId: formAssignedStaffId || undefined,
            assignedStaffName: assignedStaff ? `${assignedStaff.name} (${assignedStaff.role})` : undefined,
            vendorName: formVendorName,
            purchaseValue: Number(formPurchaseValue) || 0,
            purchaseDate: formPurchaseDate,
            warrantyExpiry: formWarrantyExpiry,
            status: formStatus,
            notes: formNotes
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ IT Asset "${formName}" updated.`);
          setEditingItem(null);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else {
        const res = await fetch('/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            itemCode: formItemCode,
            category: formCategory,
            serialOrLicenseKey: formSerial,
            totalQuantity: Number(formTotalQty),
            availableQuantity: Number(formAvailQty),
            assignedStaffId: formAssignedStaffId || undefined,
            assignedStaffName: assignedStaff ? `${assignedStaff.name} (${assignedStaff.role})` : undefined,
            vendorName: formVendorName,
            purchaseValue: Number(formPurchaseValue) || 0,
            purchaseDate: formPurchaseDate,
            warrantyExpiry: formWarrantyExpiry,
            status: formStatus,
            notes: formNotes
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Added "${formName}" to IT inventory.`);
          setShowCreateModal(false);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save IT inventory item');
    }
  };

  const handleDeleteItem = async () => {
    if (!deletingItem) return;
    try {
      const res = await fetch(`/api/inventory?id=${deletingItem.id}&deletedBy=${encodeURIComponent(currentStaff.name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ Item "${deletingItem.name}" moved to Recycle Bin.`);
        setDeletingItem(null);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter items
  const filtered = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      (item.assignedStaffName && item.assignedStaffName.toLowerCase().includes(search.toLowerCase())) ||
      (item.serialOrLicenseKey && item.serialOrLicenseKey.toLowerCase().includes(search.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalValuation = items.reduce((acc, i) => acc + (i.purchaseValue || 0), 0);
  const hardwareCount = items.filter(i => i.category.startsWith('HARDWARE')).length;
  const subscriptionsCount = items.filter(i => i.category === 'SOFTWARE_LICENSES' || i.category === 'CLOUD_SUBSCRIPTIONS').length;
  const inStoreCount = items.filter(i => i.status === 'AVAILABLE_IN_STORE').length;

  const getCategoryBadge = (cat: ITInventoryCategory) => {
    switch (cat) {
      case 'HARDWARE_LAPTOPS': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'HARDWARE_MONITORS': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'HARDWARE_PERIPHERALS': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'SOFTWARE_LICENSES': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'CLOUD_SUBSCRIPTIONS': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'OFFICE_SUPPLIES': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadge = (status: ITInventoryStatus) => {
    switch (status) {
      case 'IN_USE': return 'bg-emerald-100 text-emerald-800';
      case 'AVAILABLE_IN_STORE': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REPAIR': return 'bg-amber-100 text-amber-800';
      case 'EXPIRED_OR_RETIRED': return 'bg-rose-100 text-rose-800';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-sm text-slate-500 font-medium">Loading IT Office Materials & Assets...</p>
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
              Materials & IT Office Inventory
            </h1>
            <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300">
              Hardware & SaaS
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tracking laptops, developer workstations, 4K displays, GitHub/Figma licenses, and cloud server subscriptions.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-bold text-xs shadow-md shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add IT Asset / License</span>
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
            <span>Total Asset Valuation</span>
            <Boxes className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-slate-900 mt-2">{formatINR(totalValuation)}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Combined hardware & tools</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Hardware Assets</span>
            <Laptop className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-xl font-black text-blue-600 mt-2">{hardwareCount}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>MacBooks, monitors & PCs</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Cloud & Software Licenses</span>
            <Key className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-xl font-black text-purple-700 mt-2">{subscriptionsCount}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>AWS, GitHub, Figma, OpenAI</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Available in IT Store</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-amber-600 mt-2">{inStoreCount}</p>
          <div className="text-[11px] text-slate-500 mt-1">
            <span>Ready for onboarding</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search asset code, name, serial key, or assigned staff..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter by inventory category"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Categories</option>
              <option value="HARDWARE_LAPTOPS">Laptops & Workstations</option>
              <option value="HARDWARE_MONITORS">Displays & Monitors</option>
              <option value="HARDWARE_PERIPHERALS">Peripherals & Network</option>
              <option value="SOFTWARE_LICENSES">Software Licenses</option>
              <option value="CLOUD_SUBSCRIPTIONS">Cloud Subscriptions</option>
              <option value="OFFICE_SUPPLIES">Office Supplies</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by inventory status"
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_USE">In Use</option>
              <option value="AVAILABLE_IN_STORE">Available in Store</option>
              <option value="UNDER_REPAIR">Under Repair</option>
              <option value="EXPIRED_OR_RETIRED">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold tracking-wider">
              <tr>
                <th className="py-3 px-4">Asset Code</th>
                <th className="py-3 px-4">Item & Specifications</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Assigned To</th>
                <th className="py-3 px-4 text-right">Purchase Value</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Warranty / Exp</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No IT materials or inventory found.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                      {item.itemCode}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 text-xs">{item.name}</div>
                      {item.serialOrLicenseKey && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Key/SN: {item.serialOrLicenseKey}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(item.category)}`}>
                        {item.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {item.assignedStaffName ? (
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{item.assignedStaffName}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">In IT Store</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">
                      {formatINR(item.purchaseValue)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(item.status)}`}>
                        {item.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                      {item.warrantyExpiry || 'Active'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setViewingItem(item)}
                          title="View Asset Details"
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          title="Edit Asset"
                          className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingItem(item)}
                          title="Delete Asset (Move to Recycle Bin)"
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

      {/* =========================================================================
          CREATE / EDIT ITEM MODAL
         ========================================================================= */}
      {(showCreateModal || editingItem) && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div className="flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-amber-500" />
                <h3 className="font-black text-lg text-slate-900">
                  {editingItem ? 'Edit IT Inventory Item' : 'Add IT Asset / License'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingItem(null); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Item / Asset Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apple MacBook Pro M3, Dell 32 4K Monitor, GitHub Enterprise"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Asset Code</label>
                    <input
                      type="text"
                      value={formItemCode}
                      onChange={(e) => setFormItemCode(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="HARDWARE_LAPTOPS">Laptops & Workstations</option>
                      <option value="HARDWARE_MONITORS">Displays & Monitors</option>
                      <option value="HARDWARE_PERIPHERALS">Peripherals & Network</option>
                      <option value="SOFTWARE_LICENSES">Software Licenses</option>
                      <option value="CLOUD_SUBSCRIPTIONS">Cloud Subscriptions</option>
                      <option value="OFFICE_SUPPLIES">Office Supplies</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Serial / License Key</label>
                    <input
                      type="text"
                      placeholder="e.g. C02G91XP0MD6 or License Token"
                      value={formSerial}
                      onChange={(e) => setFormSerial(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Assigned Staff Member</label>
                    <select
                      value={formAssignedStaffId}
                      onChange={(e) => setFormAssignedStaffId(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="">-- In IT Store (Unassigned) --</option>
                      {staff.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Purchase / Value (₹) *</label>
                    <input
                      type="number"
                      placeholder="e.g. 150000"
                      value={formPurchaseValue}
                      onChange={(e) => setFormPurchaseValue(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    >
                      <option value="IN_USE">In Use</option>
                      <option value="AVAILABLE_IN_STORE">Available in Store</option>
                      <option value="UNDER_REPAIR">Under Repair</option>
                      <option value="EXPIRED_OR_RETIRED">Retired</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Vendor / Supplier</label>
                    <input
                      type="text"
                      value={formVendorName}
                      onChange={(e) => setFormVendorName(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Warranty / Expiry Date</label>
                    <input
                      type="date"
                      value={formWarrantyExpiry}
                      onChange={(e) => setFormWarrantyExpiry(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Location</label>
                    <textarea
                      rows={2}
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="Pod assignment, desk location, license renewal terms..."
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingItem(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-md shadow-amber-500/20"
                >
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DETAILS MODAL
         ========================================================================= */}
      {viewingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <span className="font-mono text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {viewingItem.itemCode}
                </span>
                <h3 className="font-black text-xl text-slate-900 mt-1">{viewingItem.name}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getCategoryBadge(viewingItem.category)} inline-block mt-1`}>
                  {viewingItem.category.replace(/_/g, ' ')}
                </span>
              </div>
              <button
                onClick={() => setViewingItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 p-6 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Purchase Valuation:</span>
                <span className="font-black text-slate-900 text-sm">{formatINR(viewingItem.purchaseValue)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Assigned User / Pod:</span>
                <span className="font-bold text-slate-800">{viewingItem.assignedStaffName || 'In IT Store'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Serial / License Key:</span>
                <span className="font-mono text-slate-800">{viewingItem.serialOrLicenseKey || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Vendor / Supplier:</span>
                <span className="text-slate-800">{viewingItem.vendorName || 'Corporate Procurement'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Condition / Status:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getStatusBadge(viewingItem.status)}`}>
                  {viewingItem.status}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Warranty / Renewal Expiry:</span>
                <span className="font-mono text-slate-800">{viewingItem.warrantyExpiry || 'Active'}</span>
              </div>
              {viewingItem.notes && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1">Notes:</span>
                  <p className="p-2 bg-slate-50 rounded-lg text-slate-700 text-xs">{viewingItem.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <button
                onClick={() => setViewingItem(null)}
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
      {deletingItem && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-black text-lg text-slate-900 mb-1">Move Asset to Recycle Bin?</h3>
            <p className="text-xs text-slate-500 mb-4">
              Are you sure you want to remove <strong className="text-slate-800">{deletingItem.name}</strong> from active inventory? It can be restored anytime with a new ID number.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteItem}
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

