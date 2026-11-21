'use client';

import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Receipt, 
  DollarSign, 
  FileText, 
  Users, 
  Calendar, 
  Truck, 
  Landmark, 
  Filter,
  Check,
  X,
  Building
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { FinancialApprovalItem, LeaveApplication, StaffMember } from '@/lib/types';

export default function ApprovalsPage() {
  const { currentStaff, isOwnerOrAdmin } = useAuth();

  const [activeTab, setActiveTab] = useState<'financial' | 'leaves' | 'history'>('financial');
  const [financialApprovals, setFinancialApprovals] = useState<FinancialApprovalItem[]>([]);
  const [leaves, setLeaves] = useState<LeaveApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [notification, setNotification] = useState<string | null>(null);

  // Reject Modal State
  const [rejectItem, setRejectItem] = useState<{
    id: string;
    type: 'FINANCIAL' | 'LEAVE';
    title: string;
  } | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const [apprRes, leavesRes] = await Promise.all([
        fetch('/api/approvals').then(r => r.json()),
        fetch('/api/leaves').then(r => r.json())
      ]);

      if (apprRes.success) {
        setFinancialApprovals(apprRes.data || []);
      }
      if (leavesRes.success) {
        setLeaves(leavesRes.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Approve Financial Transaction
  const handleApproveFinancial = async (item: FinancialApprovalItem) => {
    try {
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          action: 'APPROVE',
          reviewerStaff: currentStaff
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Approved! ${item.type} of ₹${item.amount.toLocaleString('en-IN')} posted to live ledgers.`);
        loadApprovals();
        window.dispatchEvent(new Event('crm-data-updated'));
      } else {
        alert(data.error || 'Failed to approve');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Reject Financial Transaction
  const handleConfirmReject = async () => {
    if (!rejectItem) return;

    try {
      if (rejectItem.type === 'FINANCIAL') {
        const res = await fetch('/api/approvals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: rejectItem.id,
            action: 'REJECT',
            reason: rejectReason || 'Rejected by Owner/Admin',
            reviewerStaff: currentStaff
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('✕ Transaction marked as Rejected. Financial balances remain unaffected.');
          setRejectItem(null);
          setRejectReason('');
          loadApprovals();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else if (rejectItem.type === 'LEAVE') {
        const res = await fetch('/api/leaves', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: rejectItem.id,
            status: 'REJECTED',
            reviewNotes: rejectReason || 'Rejected by Owner/Admin',
            reviewerStaff: currentStaff
          })
        });
        const data = await res.json();
        if (data.success) {
          showToast('✕ Leave application rejected.');
          setRejectItem(null);
          setRejectReason('');
          loadApprovals();
        }
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  // Approve Leave Application
  const handleApproveLeave = async (leave: LeaveApplication) => {
    try {
      const res = await fetch('/api/leaves', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: leave.id,
          status: 'APPROVED',
          reviewNotes: 'Approved by Owner/Admin',
          reviewerStaff: currentStaff
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`✓ Approved leave for ${leave.staffName}! Attendance records updated.`);
        loadApprovals();
      } else {
        alert(data.error || 'Failed to approve leave');
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const pendingFinancials = financialApprovals.filter(a => a.status === 'PENDING');
  const pendingLeaves = leaves.filter(l => l.status === 'PENDING');

  const filteredFinancials = filterType === 'ALL' 
    ? pendingFinancials 
    : pendingFinancials.filter(a => a.type === filterType);

  const historyFinancials = financialApprovals.filter(a => a.status !== 'PENDING');
  const historyLeaves = leaves.filter(l => l.status !== 'PENDING');

  return (
    <div className="space-y-6 pb-16 animate-fadeIn">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-5 right-5 z-50 p-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl flex items-center space-x-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-amber-300" />
          <span>{notification}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center space-x-2.5">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <h1 className="text-2xl font-black tracking-tight">Owner Approvals & Maker-Checker Hub</h1>
            <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
              Executive Gate
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Maker-Checker governance for financial entries and team leave requests. All transactions submitted by Account Managers or staff remain in a pending gate with <strong>zero ledger impact</strong> until approved by Owner.
          </p>
        </div>

        {/* Pending Badges */}
        <div className="flex items-center space-x-3">
          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-2xl text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Financials</span>
            <span className="text-lg font-black font-mono text-amber-400 block mt-0.5">{pendingFinancials.length}</span>
          </div>

          <div className="bg-slate-800/80 border border-slate-700 px-4 py-2.5 rounded-2xl text-center min-w-[110px]">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Pending Leaves</span>
            <span className="text-lg font-black font-mono text-blue-400 block mt-0.5">{pendingLeaves.length}</span>
          </div>
        </div>
      </div>

      {/* Crucial Ledger Rule Card */}
      <div className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start space-x-3 text-xs text-amber-950">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-black text-amber-900 block mb-0.5">Crucial Double-Entry Ledger Rule:</strong>
          Financial transactions entered by Account Managers (Invoices, Receipts, Expenses, Vendor Payouts) enter a strict <strong>Pending Owner Approval</strong> state. They are <strong>NOT</strong> applied to live cash/bank balances, receivables, or Daybook tally until you click <strong>Approve</strong>. If rejected, they are archived without altering any accounts.
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('financial')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'financial'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>Financial Transactions ({pendingFinancials.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('leaves')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'leaves'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Staff Leave Requests ({pendingLeaves.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl font-bold text-xs transition ${
            activeTab === 'history'
              ? 'bg-amber-500 text-slate-950 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Approval Audit History ({historyFinancials.length + historyLeaves.length})</span>
        </button>
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: FINANCIAL TRANSACTIONS QUEUE */}
      {/* ===================================================================== */}
      {activeTab === 'financial' && (
        <div className="space-y-4">
          {/* Sub-Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
            {['ALL', 'INVOICE', 'RECEIPT', 'EXPENSE', 'VENDOR_PAYOUT', 'JOURNAL_VOUCHER'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap ${
                  filterType === t
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {filteredFinancials.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">Financial Approval Queue is Clean!</p>
              <p className="text-xs mt-1">No pending financial transactions from Account Managers right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFinancials.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-300 transition"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        item.type === 'INVOICE'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : item.type === 'RECEIPT'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : item.type === 'EXPENSE'
                          ? 'bg-rose-50 text-rose-800 border-rose-200'
                          : 'bg-purple-50 text-purple-800 border-purple-200'
                      }`}>
                        {item.type}
                      </span>
                      <span className="font-mono text-xs font-black text-slate-900">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-slate-400 text-xs">•</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Submitted by: <strong className="text-slate-800">{item.submittedByStaffName}</strong>
                      </span>
                    </div>

                    <h4 className="text-sm font-extrabold text-slate-900">{item.title}</h4>
                    <p className="text-xs text-slate-600">{item.description}</p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono pt-1">
                      <span>Submitted: {new Date(item.submittedAt).toLocaleString('en-IN')}</span>
                      <span>•</span>
                      <span className="text-amber-700 font-bold">Status: PENDING OWNER APPROVAL</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => setRejectItem({ id: item.id, type: 'FINANCIAL', title: item.title })}
                      className="flex items-center space-x-1 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApproveFinancial(item)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Post to Ledgers</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: STAFF LEAVE REQUESTS */}
      {/* ===================================================================== */}
      {activeTab === 'leaves' && (
        <div className="space-y-4">
          {pendingLeaves.length === 0 ? (
            <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">No Pending Leave Requests!</p>
              <p className="text-xs mt-1">All staff leave applications have been reviewed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((leave) => (
                <div
                  key={leave.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-amber-300 transition"
                >
                  <div className="space-y-1.5 flex-1 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-black text-slate-900 text-sm">{leave.staffName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {leave.staffRole.replace(/_/g, ' ')}
                      </span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] border border-blue-200">
                        {leave.leaveType} LEAVE
                      </span>
                      <span className="font-mono text-slate-500 font-bold">
                        {leave.daysCount} Day(s)
                      </span>
                    </div>

                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
                      "{leave.reason}"
                    </p>

                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono">
                      <span>Dates: <strong>{leave.startDate} to {leave.endDate}</strong></span>
                      <span>•</span>
                      <span>Applied: {new Date(leave.appliedAt).toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => setRejectItem({ id: leave.id, type: 'LEAVE', title: `Leave for ${leave.staffName}` })}
                      className="flex items-center space-x-1 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => handleApproveLeave(leave)}
                      className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs shadow-md transition"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Leave</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: AUDIT HISTORY */}
      {/* ===================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 text-xs">
            <div className="p-4 bg-slate-50 font-black text-slate-800 text-xs">
              Reviewed History & Audit Trail
            </div>

            {historyFinancials.concat(historyLeaves as any).length === 0 ? (
              <div className="p-8 text-center text-slate-400">No reviewed items yet.</div>
            ) : (
              historyFinancials.concat(historyLeaves as any).map((h: any, idx) => (
                <div key={h.id || idx} className="p-4 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                        h.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {h.status}
                      </span>
                      <span className="font-bold text-slate-900">{h.title || `${h.staffName} (${h.leaveType} Leave)`}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {h.description || h.reason} • Reviewed by {h.reviewedByStaffName || 'Owner'}
                    </p>
                  </div>
                  <div className="text-right text-[11px] text-slate-400 font-mono">
                    {h.amount ? `₹${h.amount.toLocaleString('en-IN')}` : `${h.daysCount} day(s)`}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-rose-700">Reject {rejectItem.title}</h3>
              <button onClick={() => setRejectItem(null)} className="p-1 text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <p className="text-xs text-slate-600">
              Provide an explanation for rejecting this request. It will be recorded in the audit trail and visible to the submitter.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Rejection *</label>
              <textarea
                rows={3}
                required
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Documentation incomplete, budget overrun, conflict with scheduled client release..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setRejectItem(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
