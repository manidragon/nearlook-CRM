'use client';

import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  RotateCcw, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Users, 
  DollarSign, 
  Building2, 
  KanbanSquare, 
  Eye, 
  X, 
  RefreshCw,
  FolderArchive,
  ArrowRight,
  ShieldAlert,
  Sparkles,
  Scale,
  Laptop
} from 'lucide-react';
import { RecycleBinItem, RecycleBinEntityType } from '@/lib/types';

export default function RecycleBinPage() {
  const [items, setItems] = useState<RecycleBinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<string>('ALL');
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Modals state
  const [inspectItem, setInspectItem] = useState<RecycleBinItem | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isConfirmEmptyOpen, setIsConfirmEmptyOpen] = useState(false);
  const [isConfirmRestoreAllOpen, setIsConfirmRestoreAllOpen] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fresh Launch System Reset
  const handleFreshReset = async () => {
    try {
      setActionInProgress(true);
      const res = await fetch('/api/reset-data', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('✨ Clean Fresh-Launch State initialized! All dummy test data cleared.', 'success');
        setIsConfirmResetOpen(false);
        window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: { action: 'RESET_DATA' } }));
        await loadRecycleBin();
      } else {
        showNotification(data.error || 'Failed to reset system data', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error performing fresh-launch reset', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  const loadRecycleBin = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recycle-bin');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Failed to load recycle bin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecycleBin();

    const handleDataUpdate = () => {
      loadRecycleBin();
    };

    window.addEventListener('crm-data-updated', handleDataUpdate);
    return () => window.removeEventListener('crm-data-updated', handleDataUpdate);
  }, []);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Restore Single Item
  const handleRestore = async (item: RecycleBinItem) => {
    try {
      setActionInProgress(true);
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESTORE', id: item.id })
      });
      const data = await res.json();

      if (data.success) {
        showNotification(`✅ Restored "${item.title}" back to active ${item.entityType.toLowerCase()} records with a new unique ID! Calculations updated.`, 'success');
        // Notify other CRM pages and update list
        window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: { action: 'RESTORE', entityType: item.entityType } }));
        await loadRecycleBin();
      } else {
        showNotification(data.error || 'Failed to restore item', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error restoring item from Recycle Bin', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Restore All Items (filtered or all)
  const handleRestoreAll = async () => {
    try {
      setActionInProgress(true);
      const res = await fetch('/api/recycle-bin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'RESTORE_ALL', 
          entityType: selectedTab === 'ALL' ? undefined : selectedTab 
        })
      });
      const data = await res.json();

      if (data.success) {
        showNotification(`🎉 Successfully restored ${data.count} records back to active CRM ledgers!`, 'success');
        setIsConfirmRestoreAllOpen(false);
        window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: { action: 'RESTORE_ALL' } }));
        await loadRecycleBin();
      } else {
        showNotification(data.error || 'Failed to restore items', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error executing batch restore', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Permanently Delete Single Item
  const handlePermanentDelete = async (id: string) => {
    try {
      setActionInProgress(true);
      const res = await fetch(`/api/recycle-bin?id=${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        showNotification('Item permanently deleted from the system.', 'info');
        setConfirmDeleteId(null);
        window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: { action: 'PERMANENT_DELETE' } }));
        await loadRecycleBin();
      } else {
        showNotification(data.error || 'Failed to permanently delete item', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error permanently deleting item', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Empty Recycle Bin
  const handleEmptyBin = async () => {
    try {
      setActionInProgress(true);
      const entityParam = selectedTab === 'ALL' ? '' : `&entityType=${selectedTab}`;
      const res = await fetch(`/api/recycle-bin?action=EMPTY${entityParam}`, {
        method: 'DELETE'
      });
      const data = await res.json();

      if (data.success) {
        showNotification(`🧹 Permanently emptied ${data.clearedCount} records from the Recycle Bin.`, 'info');
        setIsConfirmEmptyOpen(false);
        window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: { action: 'EMPTY' } }));
        await loadRecycleBin();
      } else {
        showNotification(data.error || 'Failed to empty recycle bin', 'error');
      }
    } catch (e) {
      console.error(e);
      showNotification('Error emptying recycle bin', 'error');
    } finally {
      setActionInProgress(false);
    }
  };

  // Filter items
  const filteredItems = items.filter(item => {
    // Tab filter
    if (selectedTab !== 'ALL') {
      if (selectedTab === 'PROJECT' || selectedTab === 'PROJECTS') {
        if (item.entityType !== 'PROJECT') return false;
      } else if (selectedTab === 'INVOICE') {
        if (item.entityType !== 'INVOICE') return false;
      } else if (selectedTab === 'QUOTATION') {
        if (item.entityType !== 'QUOTATION') return false;
      } else if (selectedTab === 'RECEIPT') {
        if (item.entityType !== 'RECEIPT') return false;
      } else if (selectedTab === 'LEAD') {
        if (item.entityType !== 'LEAD') return false;
      } else if (selectedTab === 'EXPENSE') {
        if (item.entityType !== 'EXPENSE') return false;
      } else if (selectedTab === 'TASK') {
        if (item.entityType !== 'TASK') return false;
      } else if (selectedTab === 'DAILY_REPORT') {
        if (item.entityType !== 'DAILY_REPORT') return false;
      } else if (selectedTab === 'INVENTORY') {
        if (item.entityType !== 'INVENTORY') return false;
      } else if (selectedTab === 'FINANCE') {
        if (!['INVOICE', 'RECEIPT', 'ACCOUNTING_VOUCHER'].includes(item.entityType)) return false;
      } else if (selectedTab === 'CLIENTS_VENDORS') {
        if (!['CLIENT', 'VENDOR'].includes(item.entityType)) return false;
      } else if (selectedTab === 'STAFF_HR') {
        if (!['STAFF', 'ATTENDANCE'].includes(item.entityType)) return false;
      } else if (item.entityType !== selectedTab) {
        return false;
      }
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchSub = item.subtitle?.toLowerCase().includes(q);
      const matchType = item.entityType?.toLowerCase().includes(q);
      const matchBy = item.deletedBy?.toLowerCase().includes(q);
      return matchTitle || matchSub || matchType || matchBy;
    }

    return true;
  });

  // Calculate Metrics
  const totalCount = items.length;
  const leadPipelinePreserved = items
    .filter(i => i.entityType === 'LEAD')
    .reduce((sum, i) => sum + (Number(i.data?.estimatedDealValue) || 0), 0);
  const financialDocsCount = items.filter(i => ['QUOTATION', 'INVOICE', 'RECEIPT', 'EXPENSE', 'ACCOUNTING_VOUCHER'].includes(i.entityType)).length;

  const getEntityBadge = (type: RecycleBinEntityType) => {
    switch (type) {
      case 'PROJECT':
        return { label: 'Project', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FolderArchive };
      case 'LEAD':
        return { label: 'Lead', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Users };
      case 'QUOTATION':
        return { label: 'Quotation', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: FileText };
      case 'INVOICE':
        return { label: 'Invoice', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: DollarSign };
      case 'RECEIPT':
        return { label: 'Receipt', color: 'bg-cyan-100 text-cyan-800 border-cyan-200', icon: DollarSign };
      case 'EXPENSE':
        return { label: 'Expense', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: DollarSign };
      case 'TASK':
        return { label: 'Task', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: KanbanSquare };
      case 'DAILY_REPORT':
        return { label: 'Daily Report', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: FileText };
      case 'INVENTORY':
        return { label: 'IT Asset / Inventory', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: Laptop };
      case 'ACCOUNTING_VOUCHER':
        return { label: 'Accounting Voucher', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Scale };
      case 'CLIENT':
        return { label: 'Client', color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: Building2 };
      case 'VENDOR':
        return { label: 'Vendor / Influencer', color: 'bg-teal-100 text-teal-800 border-teal-200', icon: Building2 };
      case 'STAFF':
        return { label: 'Staff', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Users };
      case 'ATTENDANCE':
        return { label: 'Attendance', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock };
      case 'APPOINTMENT':
        return { label: 'Appointment / Meeting', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: Clock };
      default:
        return { label: type, color: 'bg-slate-100 text-slate-800 border-slate-200', icon: FolderArchive };
    }
  };

  const formatDeletedDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

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
                <Trash2 className="w-5 h-5 text-slate-300 flex-shrink-0" />
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

        {/* Page Title & Actions Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">Recycle Bin</h1>
                <span className="text-[11px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 border border-orange-200">
                  Data Safety Ledger
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
                Safely store and recover deleted leads, quotations, client invoices, expenses, and staff records like on your computer desktop. Restores data back to original modules with 100% full fidelity.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              onClick={() => loadRecycleBin()}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
              title="Refresh Recycle Bin"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-orange-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setIsConfirmResetOpen(true)}
              disabled={actionInProgress}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              title="Fresh-launch zero-data reset for brand-new deployment"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Fresh Launch Reset</span>
            </button>

            {items.length > 0 && (
              <>
                <button
                  onClick={() => setIsConfirmRestoreAllOpen(true)}
                  disabled={actionInProgress || filteredItems.length === 0}
                  className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/25 flex items-center gap-2 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Restore All ({filteredItems.length})</span>
                </button>

                <button
                  onClick={() => setIsConfirmEmptyOpen(true)}
                  disabled={actionInProgress}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Empty Bin</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total in Recycle Bin</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalCount} Items</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Recoverable at any time</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Preserved Pipeline Value</span>
              <div className="text-2xl font-black text-slate-900 mt-1">₹{leadPipelinePreserved.toLocaleString('en-IN')}</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">In deleted sales leads</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Financial Documents</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{financialDocsCount} Bills & Quotes</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Quotes, Invoices & Receipts</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Restoration Fidelity</span>
              <div className="text-2xl font-black text-slate-900 mt-1">100%</div>
              <div className="text-[11px] text-blue-600 font-semibold mt-0.5">Preserves links & history</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deleted records by name, client, phone, or staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-xs font-medium text-slate-800 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 self-end md:self-auto">
              <span>Showing:</span>
              <span className="font-bold text-slate-900">{filteredItems.length} of {items.length} records</span>
            </div>
          </div>

          {/* Module Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold scrollbar-none">
            {[
              { id: 'ALL', label: 'All Deleted Items', count: items.length },
              { id: 'PROJECT', label: 'Projects', count: items.filter(i => i.entityType === 'PROJECT').length },
              { id: 'INVOICE', label: 'Invoices', count: items.filter(i => i.entityType === 'INVOICE').length },
              { id: 'QUOTATION', label: 'Quotations', count: items.filter(i => i.entityType === 'QUOTATION').length },
              { id: 'RECEIPT', label: 'Receipts', count: items.filter(i => i.entityType === 'RECEIPT').length },
              { id: 'LEAD', label: 'Leads', count: items.filter(i => i.entityType === 'LEAD').length },
              { id: 'EXPENSE', label: 'Expenses', count: items.filter(i => i.entityType === 'EXPENSE').length },
              { id: 'TASK', label: 'Tasks', count: items.filter(i => i.entityType === 'TASK').length },
              { id: 'DAILY_REPORT', label: 'Daily Reports', count: items.filter(i => i.entityType === 'DAILY_REPORT').length },
              { id: 'INVENTORY', label: 'IT Assets / Store', count: items.filter(i => i.entityType === 'INVENTORY').length },
              { id: 'CLIENTS_VENDORS', label: 'Vendors & Clients', count: items.filter(i => ['CLIENT', 'VENDOR'].includes(i.entityType)).length },
              { id: 'STAFF_HR', label: 'Staff & HR', count: items.filter(i => ['STAFF', 'ATTENDANCE'].includes(i.entityType)).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  selectedTab === tab.id
                    ? 'bg-orange-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedTab === tab.id
                    ? 'bg-orange-700/60 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Deleted Items Table / List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
              <p className="text-xs font-semibold">Scanning Recycle Bin directory...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-4">
                <Trash2 className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Recycle Bin is Empty</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                {searchTerm || selectedTab !== 'ALL'
                  ? 'No deleted items matched your active search and filter criteria.'
                  : 'There are currently no deleted items. Any records you remove across the CRM will appear here for easy recovery.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Entity Type</th>
                    <th className="py-3 px-4">Deleted Record & Summary</th>
                    <th className="py-3 px-4">Deleted When</th>
                    <th className="py-3 px-4">Deleted By</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredItems.map(item => {
                    const badge = getEntityBadge(item.entityType);
                    const Icon = badge.icon;

                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-orange-50/30 transition-colors group"
                      >
                        {/* Entity Type Badge */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${badge.color}`}>
                            <Icon className="w-3.5 h-3.5" />
                            <span>{badge.label}</span>
                          </span>
                        </td>

                        {/* Title & Subtitle */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 group-hover:text-orange-600 transition-colors">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {item.subtitle}
                            </div>
                          )}
                          {item.data?.recoveredFrom && (
                            <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                              Lineage: Recovered from {item.data.recoveredFrom}
                            </div>
                          )}
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            ID: {item.originalId}
                          </div>
                        </td>

                        {/* Deleted Date */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDeletedDate(item.deletedAt)}</span>
                          </div>
                        </td>

                        {/* Deleted By */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                            {item.deletedBy || 'System Admin'}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Details */}
                            <button
                              onClick={() => setInspectItem(item)}
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all"
                              title="Inspect deleted JSON record"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Restore Button */}
                            <button
                              onClick={() => handleRestore(item)}
                              disabled={actionInProgress}
                              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                              title="Restore to original CRM module"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Restore</span>
                            </button>

                            {/* Permanently Delete */}
                            <button
                              onClick={() => setConfirmDeleteId(item.id)}
                              disabled={actionInProgress}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                              title="Permanently Delete (Cannot be undone)"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* Inspect Item Modal */}
      {inspectItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Archived Record Snapshot</h3>
                  <p className="text-xs text-slate-500">{inspectItem.title} ({inspectItem.entityType})</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-lg hover:bg-slate-200/60 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 font-medium">Record Title:</span>
                  <div className="font-bold text-slate-800">{inspectItem.title}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Entity Type:</span>
                  <div className="font-bold text-orange-600">{inspectItem.entityType}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Original ID:</span>
                  <div className="font-mono text-slate-700">{inspectItem.originalId}</div>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Deleted By:</span>
                  <div className="font-semibold text-slate-800">{inspectItem.deletedBy}</div>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Complete Preserved JSON Payload
                </label>
                <pre className="bg-slate-900 text-slate-100 p-4 rounded-xl text-[11px] font-mono overflow-x-auto max-h-72 border border-slate-800">
                  {JSON.stringify(inspectItem.data, null, 2)}
                </pre>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all"
              >
                Close
              </button>
              <button
                onClick={() => {
                  handleRestore(inspectItem);
                  setInspectItem(null);
                }}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restore This Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Permanent Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Permanently Delete Record?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This action <span className="font-bold text-rose-600">cannot be undone</span>. The item will be erased completely from the system and cannot be restored from the Recycle Bin later.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePermanentDelete(confirmDeleteId)}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Yes, Delete Forever</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Empty Bin Modal */}
      {isConfirmEmptyOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Empty Recycle Bin?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              Are you sure you want to permanently purge all items from the Recycle Bin?
              {selectedTab !== 'ALL' && ` Only records under category "${selectedTab}" will be removed.`}
              <br />
              <strong className="text-rose-600">This action is irreversible.</strong>
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setIsConfirmEmptyOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleEmptyBin()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/25 flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Purge Recycle Bin</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Restore All Modal */}
      {isConfirmRestoreAllOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Restore All {filteredItems.length} Records?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              All {filteredItems.length} records in this view will be restored back to their active CRM modules (Leads, Quotations, Invoices, Tasks, etc.) with all relationships intact.
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setIsConfirmRestoreAllOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRestoreAll()}
                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-orange-600/25 flex items-center gap-1.5"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restore Everything</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fresh Launch Reset Confirmation Modal */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-900">Fresh Launch System Reset?</h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed">
              This will clear all dummy sample test data (leads, quotations, projects, invoices, receipts, expenses, tasks, attendance records, approvals, and vault files) while keeping the core administrative user accounts intact.
              <br /><br />
              <strong className="text-amber-800">Your system will be left in a clean, brand-new, zero-data ready-to-launch state.</strong>
            </p>

            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button
                onClick={() => setIsConfirmResetOpen(false)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => handleFreshReset()}
                disabled={actionInProgress}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Reset to Fresh State</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
