'use client';

import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Send, 
  ShieldCheck, 
  CheckCircle2, 
  ExternalLink, 
  RefreshCw, 
  Search,
  Code,
  Smartphone
} from 'lucide-react';
import { WhatsAppLog, WhatsAppEventType, WhatsAppRecipientType } from '@/lib/types';
import { getWhatsAppDirectUrl } from '@/lib/whatsappService';

const EVENT_LABELS: Record<WhatsAppEventType, string> = {
  LEAD_WELCOME: 'Lead Welcome',
  PROPOSAL_SENT: 'Proposal Sent',
  QUOTATION_DISPATCH: 'Quotation Dispatch',
  RETAINER_INVOICE: 'Retainer Invoice',
  MILESTONE_COMPLETION: 'Milestone Completed',
  DUE_REMINDER: 'Payment Due Reminder',
  TASK_ASSIGNED: 'Task Assigned (Staff)',
  TASK_STATUS_UPDATE: 'Task Status Update',
  PAYMENT_RECEIVED: 'Payment Received',
  CONTENT_APPROVAL: 'Review Required (PM)',
  OVERDUE_NUDGE: 'Overdue Task Nudge',
  VENDOR_PAYMENT_NOTICE: 'Vendor Payment Notice',
  CUSTOM: 'Custom Notification'
};

export default function WhatsAppCenterPage() {
  const [logs, setLogs] = useState<WhatsAppLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<WhatsAppLog | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessAlert, setSendSuccessAlert] = useState<string | null>(null);

  // Dispatcher form
  const [form, setForm] = useState({
    to: '+919876543210',
    recipientName: 'Apex Legal Partners (Sarah Connor)',
    recipientType: 'CLIENT' as WhatsAppRecipientType,
    eventType: 'RETAINER_INVOICE' as WhatsAppEventType,
    message: 'Hello Sarah! Your recurring monthly retainer invoice INV-2026-088 for ₹1,85,000 is ready. View & Pay: https://agency.nearlook.com/pay/inv-088'
  });

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/whatsapp');
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setSendSuccessAlert(null);

    try {
      const res = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (data.success) {
        await fetchLogs();
        setSendSuccessAlert(`WhatsApp notification dispatched successfully! Status: ${data.data.status}`);
        setTimeout(() => setSendSuccessAlert(null), 5000);
      } else {
        alert(data.error || 'Failed to dispatch');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSending(false);
    }
  };

  const handleTemplateChange = (type: WhatsAppEventType) => {
    let msg = '';
    let recType: WhatsAppRecipientType = 'CLIENT';

    switch (type) {
      case 'LEAD_WELCOME':
        msg = '👋 Welcome to Nearlook Agency! Thanks for reaching out regarding our SEO & Digital Marketing Retainers. Our Account Manager will connect with your team within 2 hours.';
        recType = 'CLIENT';
        break;
      case 'PROPOSAL_SENT':
        msg = '🚀 Great news! Your customized scope proposal for ₹14,50,000 has been compiled. Review here: https://agency.nearlook.com/proposals/preview';
        recType = 'CLIENT';
        break;
      case 'RETAINER_INVOICE':
        msg = '🧾 Hello! Your monthly retainer invoice for ₹1,85,000 has been generated. Due Date: Nov 05, 2026. Direct Pay: https://agency.nearlook.com/invoices/pay';
        recType = 'CLIENT';
        break;
      case 'MILESTONE_COMPLETION':
        msg = '🎉 Milestone Achieved! The milestone "Figma UI/UX & High Fidelity Prototype" is completed and ready for your sign-off.';
        recType = 'CLIENT';
        break;
      case 'DUE_REMINDER':
        msg = '⚠️ Friendly Reminder: Payment for invoice INV-2026-088 (₹1,85,000) is past due. Please settle today to keep marketing campaigns uninterrupted.';
        recType = 'CLIENT';
        break;
      case 'TASK_ASSIGNED':
        msg = '⚡ Task Assigned: You have been assigned "Monthly Google Ads ROAS Audit". Priority: HIGH. Due: Oct 28. Check Kanban for briefs.';
        recType = 'STAFF';
        break;
      case 'CONTENT_APPROVAL':
        msg = '📝 Review Required: Assets for "California Injury Landing Page" are ready in "Internal Review". Please inspect and approve for client release.';
        recType = 'STAFF';
        break;
      case 'OVERDUE_NUDGE':
        msg = '🚨 Overdue Task Alert: "Stripe Webhooks Integration" is past its due date. Please update status or log hours in the agency ERP.';
        recType = 'STAFF';
        break;
      default:
        msg = 'Hello from Nearlook Agency!';
        recType = 'CLIENT';
    }

    setForm(prev => ({
      ...prev,
      eventType: type,
      recipientType: recType,
      message: msg
    }));
  };

  const filteredLogs = logs.filter(log => {
    const q = searchQuery.toLowerCase();
    return (
      log.recipientName.toLowerCase().includes(q) ||
      log.recipientPhone.includes(q) ||
      log.messageBody.toLowerCase().includes(q) ||
      log.eventType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <MessageSquare className="w-6 h-6 text-emerald-600" />
            Meta WhatsApp Cloud API Engine (₹ INR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Centralized automated webhook dispatcher, live delivery audit trail, and raw Meta Graph API payload inspection.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all border border-slate-200 self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Meta API Status Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine Status</span>
          <div className="mt-1 flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-bold text-slate-900">Active / Online</span>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold">Meta Graph API v20.0</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dispatched Messages</span>
          <div className="mt-1 text-2xl font-black text-slate-900">
            {logs.length}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Total automated & manual triggers</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delivery Rate</span>
          <div className="mt-1 text-2xl font-black text-emerald-600">
            100%
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Success across delivered & simulated</span>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Automated Hooks</span>
          <div className="mt-1 text-sm font-bold text-orange-600">
            8 Event Triggers (₹)
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Retainers, Leads, Tasks, Overdue</span>
        </div>
      </div>

      {/* Alert banner */}
      {sendSuccessAlert && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{sendSuccessAlert}</span>
        </div>
      )}

      {/* Two Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: WhatsApp Message Dispatcher Console */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Live WhatsApp Dispatcher (₹ INR)
              </h2>
              <p className="text-xs text-slate-500">Test any template or custom trigger to any Indian or international phone.</p>
            </div>
          </div>

          <form onSubmit={handleDispatch} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-700">Choose Event Trigger Template</label>
              <select
                value={form.eventType}
                onChange={(e) => handleTemplateChange(e.target.value as WhatsAppEventType)}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                {Object.entries(EVENT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700">Recipient Phone *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={form.to}
                  onChange={(e) => setForm({ ...form, to: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">Recipient Name</label>
                <input
                  type="text"
                  required
                  placeholder="Sarah Connor"
                  value={form.recipientName}
                  onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700">Message Body (Payload in ₹)</label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                disabled={isSending}
                className="flex-1 py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending via Meta API...' : 'Dispatch WhatsApp Alert (₹)'}</span>
              </button>

              <a
                href={getWhatsAppDirectUrl(form.to, form.message)}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 flex items-center gap-1.5 transition-colors"
                title="Open in WhatsApp Web"
              >
                <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
                <span>wa.me</span>
              </a>
            </div>
          </form>
        </div>

        {/* Right Column: WhatsApp Delivery Audit Log Table */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-orange-600" />
                Delivery Audit Trail
              </h2>
              <p className="text-xs text-slate-500">Timestamped proof of dispatch, message IDs & delivery statuses.</p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Filter logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
            {filteredLogs.map((log) => {
              const waUrl = getWhatsAppDirectUrl(log.recipientPhone, log.messageBody);

              return (
                <div key={log.id} className="py-3.5 space-y-2 hover:bg-orange-50/40 p-2 rounded-xl transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900">
                        {log.recipientName}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        ({log.recipientPhone})
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                        log.recipientType === 'CLIENT'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-orange-50 text-orange-700 border border-orange-200'
                      }`}>
                        {log.recipientType}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        log.status === 'DELIVERED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : log.status === 'SIMULATED'
                          ? 'bg-orange-50 text-orange-700 border border-orange-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100 leading-relaxed">
                    {log.messageBody}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 font-medium">
                    <span className="font-bold text-orange-600">
                      Trigger: {EVENT_LABELS[log.eventType] || log.eventType}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>{new Date(log.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                      {log.responsePayload && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs font-bold text-orange-600 hover:underline flex items-center gap-1"
                        >
                          <Code className="w-3 h-3" />
                          <span>Meta Payload</span>
                        </button>
                      )}
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                        title="Open WhatsApp Direct Link"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-600" />
                        <span>Chat</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Meta API Payload Viewer Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 p-6 shadow-2xl relative my-8 text-slate-900">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Code className="w-4 h-4 text-orange-600" />
              Meta WhatsApp Cloud API Payload
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Response details recorded from Meta Graph API v20.0 endpoint.
            </p>

            <div className="mt-4 p-3 rounded-xl bg-slate-900 text-amber-400 font-mono text-xs overflow-x-auto max-h-60 border border-slate-800">
              <pre>{selectedLog.responsePayload}</pre>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
