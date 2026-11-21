'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  X, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Ban,
  ChevronRight, 
  Calendar, 
  User, 
  Filter, 
  Search, 
  RefreshCw, 
  ArrowUpRight, 
  ShieldCheck, 
  Zap, 
  Layers, 
  Maximize2, 
  Minimize2,
  DollarSign,
  ExternalLink,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AIChatMessage, AIChatAuditLog, AIChatPendingApproval } from '@/lib/types';

export default function AIChatbotModal() {
  const { currentStaff, isFieldStaff, canViewFinancials } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'audit'>('chat');
  
  const initialWelcomeMessage: AIChatMessage = {
    id: 'welcome-msg',
    sender: 'ai',
    text: `### 👋 Greetings, **${currentStaff?.name || 'Executive'}**!\n\n` +
      `I am **Nearlook Executive AI Copilot**, your real-time CRM operational assistant.\n\n` +
      `I can read, write, update, execute, and verify actions across all CRM modules:\n` +
      `- **Leads & Consultations**: e.g., *"Assign lead 'John Doe' to the Web Dev team and select staff Rahul."*\n` +
      `- **Quotations & GST**: e.g., *"Generate a quotation for lead 'Acme Corp' with 18% inclusive GST for 50,000 INR."*\n` +
      `- **Tasks & WhatsApp**: e.g., *"Log today's video shoot completion for client XYZ and notify the client."*\n` +
      `- **Accounts & Split Dues**: e.g., *"Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha."*\n` +
      `- **Staff Attendance & Expense**: e.g., *"Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks."*`,
    timestamp: new Date().toISOString(),
    statusBadge: '[SUCCESS]',
    suggestedNextPrompts: [
      "Assign lead 'John Doe' to the Web Dev team and select staff Rahul.",
      "Generate a quotation for lead 'Acme Corp' with 18% inclusive GST for 50,000 INR.",
      "Log today's video shoot completion for client XYZ and notify the client.",
      "Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha.",
      "Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks.",
      "Show overdue payment dues with 2% penalty"
    ]
  };

  // Chat state with session persistence per user
  const [messages, setMessages] = useState<AIChatMessage[]>([initialWelcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat session from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentStaff?.id) {
      const storageKey = `nearlook_ai_copilot_session_${currentStaff.id}`;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch (e) {
          console.error('Failed to parse cached chat session:', e);
        }
      }
    }
  }, [currentStaff?.id]);

  // Persist chat session to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && currentStaff?.id && messages.length > 0) {
      const storageKey = `nearlook_ai_copilot_session_${currentStaff.id}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(messages));
      } catch (e) {
        console.error('Failed to save chat session:', e);
      }
    }
  }, [messages, currentStaff?.id]);

  // Reset Session
  const handleResetSession = () => {
    setMessages([initialWelcomeMessage]);
    if (typeof window !== 'undefined' && currentStaff?.id) {
      localStorage.removeItem(`nearlook_ai_copilot_session_${currentStaff.id}`);
    }
  };

  // Audit Log State
  const [auditLogs, setAuditLogs] = useState<AIChatAuditLog[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchAuditQuery, setSearchAuditQuery] = useState('');
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

  // Auto-scroll on new message
  useEffect(() => {
    if (activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Load audit logs when switching to audit tab or opening
  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      let url = '/api/chat/history?';
      if (selectedDate !== 'ALL') url += `date=${selectedDate}&`;
      if (selectedStaffFilter !== 'ALL') url += `staffId=${selectedStaffFilter}&`;
      if (selectedCategoryFilter !== 'ALL') url += `category=${selectedCategoryFilter}&`;
      if (searchAuditQuery) url += `search=${encodeURIComponent(searchAuditQuery)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.data || []);
        if (data.dates) setAvailableDates(data.dates);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [isOpen, activeTab, selectedDate, selectedStaffFilter, selectedCategoryFilter, searchAuditQuery]);

  // Send query
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || isLoading) return;

    const userMsg: AIChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
      userStaff: {
        id: currentStaff.id,
        name: currentStaff.name,
        role: currentStaff.role
      }
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          staff: currentStaff
        })
      });

      const data = await res.json();

      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        // Trigger real-time background page updates if an action succeeded
        if (typeof window !== 'undefined' && (data.message.statusBadge === '[SUCCESS]' || data.message.actionExecuted)) {
          window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: data.message }));
        }
      } else {
        setMessages(prev => [...prev, {
          id: `err-${Date.now()}`,
          sender: 'ai',
          statusBadge: '[ACTION FAILED]',
          text: `⚠️ **Processing Error**: ${data.error || 'Failed to process request.'}`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: 'ai',
        statusBadge: '[ACTION FAILED]',
        text: `⚠️ **Network Error**: ${err.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Approval Gate: Approve Action
  const handleApproveAction = async (pending: AIChatPendingApproval) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmAction: true,
          pendingApproval: pending,
          staff: currentStaff
        })
      });

      const data = await res.json();
      if (data.success && data.message) {
        // Trigger real-time background page updates on approved action execution
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: data.message }));
        }
        // Mark pending as approved in previous messages
        setMessages(prev => prev.map(m => {
          if (m.pendingApproval && m.pendingApproval.id === pending.id) {
            return {
              ...m,
              pendingApproval: { ...m.pendingApproval, status: 'APPROVED' as const }
            };
          }
          return m;
        }).concat(data.message));
      }
    } catch (err: any) {
      console.error('Approval execution error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Approval Gate: Cancel Action
  const handleCancelAction = async (pending: AIChatPendingApproval) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cancelAction: true,
          pendingApproval: pending,
          staff: currentStaff
        })
      });

      const data = await res.json();
      if (data.success && data.message) {
        setMessages(prev => prev.map(m => {
          if (m.pendingApproval && m.pendingApproval.id === pending.id) {
            return {
              ...m,
              pendingApproval: { ...m.pendingApproval, status: 'CANCELLED' as const }
            };
          }
          return m;
        }).concat(data.message));
      }
    } catch (err: any) {
      console.error('Cancel action error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Format AI Markdown rendering helper
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];

    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Check Table
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        inTable = true;
        const cells = trimmed.split('|').slice(1, -1).map(c => c.trim());
        if (!cells.every(c => c.match(/^:?-+:?$/))) {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        inTable = false;
        elements.push(
          <div key={`table-${index}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
                <tr>
                  {tableRows[0]?.map((head, hIdx) => (
                    <th key={hIdx} className="px-3 py-2">{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tableRows.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3 py-2 text-slate-600 font-medium">
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        tableRows = [];
      }

      // Headers
      if (trimmed.startsWith('### ')) {
        elements.push(
          <h3 key={index} className="text-sm font-bold text-slate-900 mt-2 mb-1 flex items-center gap-1.5">
            {renderInlineFormatting(trimmed.slice(4))}
          </h3>
        );
      } else if (trimmed.startsWith('#### ')) {
        elements.push(
          <h4 key={index} className="text-xs font-bold text-slate-800 mt-2 mb-1 uppercase tracking-wider text-orange-700">
            {renderInlineFormatting(trimmed.slice(5))}
          </h4>
        );
      } else if (trimmed.startsWith('- ')) {
        elements.push(
          <li key={index} className="ml-4 text-xs text-slate-600 list-disc my-0.5 leading-relaxed">
            {renderInlineFormatting(trimmed.slice(2))}
          </li>
        );
      } else if (trimmed.length > 0) {
        elements.push(
          <p key={index} className="text-xs text-slate-600 leading-relaxed my-1">
            {renderInlineFormatting(trimmed)}
          </p>
        );
      }
    });

    if (inTable && tableRows.length > 0) {
      elements.push(
        <div key="table-final" className="my-3 overflow-x-auto rounded-xl border border-slate-200 shadow-sm">
          <table className="w-full text-left text-xs bg-white">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                {tableRows[0]?.map((head, hIdx) => (
                  <th key={hIdx} className="px-3 py-2">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tableRows.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50/70 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-slate-600 font-medium">
                      {renderInlineFormatting(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`|\*.*?\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="font-bold text-slate-900">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="bg-orange-50 border border-orange-200 text-orange-700 px-1 py-0.5 rounded text-[10px] font-mono font-semibold">
            {part.slice(1, -1)}
          </code>
        );
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i} className="text-slate-500 italic">{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  // Status Badge Pill Renderer
  const renderStatusBadge = (badge?: string) => {
    if (!badge) return null;

    if (badge === '[SUCCESS]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>[SUCCESS]</span>
        </span>
      );
    }
    if (badge === '[APPROVAL REQUIRED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs animate-pulse">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>[APPROVAL REQUIRED]</span>
        </span>
      );
    }
    if (badge === '[UNAUTHORIZED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shadow-2xs">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          <span>[UNAUTHORIZED]</span>
        </span>
      );
    }
    if (badge === '[ACTION FAILED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300 shadow-2xs">
          <XCircle className="w-3 h-3 text-red-600" />
          <span>[ACTION FAILED]</span>
        </span>
      );
    }
    if (badge === '[CANCELLED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs">
          <Ban className="w-3 h-3 text-slate-500" />
          <span>[CANCELLED]</span>
        </span>
      );
    }
    return null;
  };

  return (
    <>
      {/* Floating Launcher Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white rounded-2xl shadow-xl shadow-orange-600/30 hover:shadow-2xl hover:shadow-orange-600/40 hover:scale-105 active:scale-95 transition-all group font-bold text-xs"
        title="Open Nearlook AI Executive Copilot (Cmd+K / Ctrl+K)"
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>Nearlook AI Copilot</span>
        </div>
        <span className="hidden sm:inline bg-orange-700/60 px-1.5 py-0.5 rounded text-[10px] font-mono text-orange-100">
          ⌘K
        </span>
      </button>

      {/* Main Chatbot Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div 
            className={`bg-white rounded-t-3xl sm:rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
              isExpanded 
                ? 'w-full sm:w-[920px] h-[95vh] sm:h-[88vh]' 
                : 'w-full sm:w-[560px] h-[92vh] sm:h-[730px]'
            }`}
          >
            {/* Top Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/30">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Nearlook Executive AI Copilot</span>
                    <span className="text-[10px] bg-orange-500/20 text-orange-300 font-extrabold px-1.5 py-0.2 rounded border border-orange-500/30">
                      LIVE TOOL ENGINE
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-300 flex items-center gap-1 mt-0.5">
                    <User className="w-3 h-3 text-orange-400" />
                    <span>Active: <strong>{currentStaff.name}</strong></span>
                    <span className="text-slate-400">({currentStaff.role.replace('_', ' ')})</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {/* Reset Session */}
                <button
                  onClick={handleResetSession}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Reset conversation session"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                {/* Expand / Minimize */}
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors hidden sm:block"
                  title={isExpanded ? "Collapse" : "Expand Full View"}
                >
                  {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  title="Close Assistant"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Navigation Tabs (Live Copilot vs Date-wise Audit Trail) */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setActiveTab('chat')}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                  activeTab === 'chat'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Live Action Copilot</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`pb-2.5 px-3 border-b-2 flex items-center gap-1.5 transition-all ${
                  activeTab === 'audit'
                    ? 'border-orange-600 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Date-Wise Action Audit Trail</span>
                <span className="ml-1 text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-full">
                  {auditLogs.length > 0 ? auditLogs.length : 'Live'}
                </span>
              </button>
            </div>

            {/* TAB 1: LIVE CHAT */}
            {activeTab === 'chat' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/40">
                {/* Messages stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      {/* Sender label and status badge */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                        {msg.sender === 'user' ? (
                          <>
                            <span>{msg.userStaff?.name || currentStaff.name}</span>
                            <span className="font-semibold text-orange-600">({msg.userStaff?.role || currentStaff.role})</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3 h-3 text-orange-600" />
                            <span className="font-bold text-slate-700">Nearlook AI Copilot</span>
                            {renderStatusBadge(msg.statusBadge)}
                          </>
                        )}
                        <span>•</span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`p-3.5 rounded-2xl max-w-[92%] shadow-sm ${
                          msg.sender === 'user'
                            ? 'bg-orange-600 text-white rounded-tr-none font-medium text-xs leading-relaxed'
                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none text-xs leading-relaxed'
                        }`}
                      >
                        {msg.sender === 'user' ? (
                          <div className="whitespace-pre-wrap">{msg.text}</div>
                        ) : (
                          <div className="space-y-1">
                            {renderFormattedText(msg.text)}
                          </div>
                        )}

                        {/* Interactive Approval Gate Card (Critical Operations) */}
                        {msg.statusBadge === '[APPROVAL REQUIRED]' && msg.pendingApproval && msg.pendingApproval.status === 'PENDING' && (
                          <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <span className="text-[11px] font-bold text-amber-900 block">{msg.pendingApproval.title}</span>
                                <p className="text-[10px] text-amber-800 leading-relaxed mt-0.5">{msg.pendingApproval.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                              <button
                                onClick={() => handleApproveAction(msg.pendingApproval!)}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-xs transition-colors"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve Action</span>
                              </button>
                              <button
                                onClick={() => handleCancelAction(msg.pendingApproval!)}
                                disabled={isLoading}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Action Executed Banner */}
                        {msg.actionExecuted && (
                          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-emerald-800 text-[11px] font-semibold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>{msg.actionExecuted.description}</span>
                          </div>
                        )}

                        {/* Rich Action Links (e.g. View Quotation, Send WhatsApp) */}
                        {msg.actionLinks && msg.actionLinks.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                            {msg.actionLinks.map((link, lIdx) => (
                              <a
                                key={lIdx}
                                href={link.isWhatsApp && link.phone ? `https://wa.me/${link.phone.replace(/[^0-9]/g, '')}?text=${link.message || ''}` : link.url || '#'}
                                target={link.isWhatsApp ? '_blank' : '_self'}
                                rel="noreferrer"
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all shadow-xs ${
                                  link.isWhatsApp 
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                                    : 'bg-orange-600 hover:bg-orange-700 text-white'
                                }`}
                              >
                                {link.isWhatsApp ? <MessageSquare className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                                <span>{link.label}</span>
                              </a>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Suggested Next Prompts */}
                      {msg.suggestedNextPrompts && msg.suggestedNextPrompts.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5 max-w-[92%]">
                          {msg.suggestedNextPrompts.map((p, pIdx) => (
                            <button
                              key={pIdx}
                              onClick={() => handleSendMessage(p)}
                              className="text-[11px] px-2.5 py-1 bg-white hover:bg-orange-50 text-slate-700 hover:text-orange-700 border border-slate-200 hover:border-orange-300 rounded-full transition-all shadow-2xs font-medium text-left flex items-center gap-1"
                            >
                              <span>{p}</span>
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl w-fit shadow-xs animate-pulse">
                      <Bot className="w-4 h-4 text-orange-600 animate-spin" />
                      <span className="text-xs text-slate-500 font-medium">Executing CRM action & validating RBAC permissions...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-slate-200 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Ask anything or command: Assign lead..., Generate quotation..., Record payment..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                    />

                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isLoading || !inputText.trim()}
                      className="p-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl shadow-sm transition-all"
                      title="Send Command"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span>Tool-calling enabled • Audit trail logged per user session</span>
                    <span className="text-orange-600 font-bold">₹ INR Live Engine</span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: DATE-WISE ACTION AUDIT TRAIL */}
            {activeTab === 'audit' && (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 p-4">
                {/* Audit Controls & Filters */}
                <div className="bg-white p-3 rounded-2xl border border-slate-200 mb-3 space-y-2 shadow-2xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Clock className="w-4 h-4 text-orange-600" />
                      <span>Executive Action History</span>
                    </div>

                    <button
                      onClick={fetchAuditLogs}
                      disabled={isLoadingAudit}
                      className="flex items-center gap-1 text-[11px] font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200"
                    >
                      <RefreshCw className={`w-3 h-3 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Date Selector Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Date:</span>
                    <button
                      onClick={() => setSelectedDate('ALL')}
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                        selectedDate === 'ALL'
                          ? 'bg-orange-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      All Dates
                    </button>
                    {availableDates.map(d => (
                      <button
                        key={d}
                        onClick={() => setSelectedDate(d)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                          selectedDate === d
                            ? 'bg-orange-600 text-white'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {d === new Date().toISOString().split('T')[0] ? `Today (${d})` : d}
                      </button>
                    ))}
                  </div>

                  {/* Search and Category Filters */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                    <div className="flex-1 min-w-[160px] relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchAuditQuery}
                        onChange={(e) => setSearchAuditQuery(e.target.value)}
                        placeholder="Search prompts or actions taken..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
                    >
                      <option value="ALL">All Categories</option>
                      <option value="LEAD_MUTATION">Lead Mutation</option>
                      <option value="QUOTATION_MUTATION">Quotation</option>
                      <option value="TASK_MUTATION">Task Mutation</option>
                      <option value="FINANCE_ACTION">Finance Action</option>
                      <option value="ATTENDANCE_UPDATE">Attendance</option>
                      <option value="EXPENSE_MUTATION">Expenses</option>
                      <option value="APPROVAL_GATE">Approval Gate</option>
                      <option value="READ_QUERY">Read Queries</option>
                    </select>
                  </div>
                </div>

                {/* Audit Logs Stream */}
                <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                  {isLoadingAudit ? (
                    <div className="p-8 text-center text-xs text-slate-400">Loading audit trail records...</div>
                  ) : auditLogs.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                      No audit entries matching the selected criteria.
                    </div>
                  ) : (
                    auditLogs.map((log) => (
                      <div 
                        key={log.id}
                        className="p-3 bg-white border border-slate-200 hover:border-orange-300 rounded-xl transition-all shadow-2xs space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <div className="flex items-center gap-1.5 font-bold text-slate-700">
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono">{log.date}</span>
                            <span className="text-slate-400">{log.time}</span>
                            <span>•</span>
                            <span className="text-orange-600 font-semibold">{log.staffName}</span>
                            <span className="text-slate-400">({log.staffRole.replace('_', ' ')})</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <span className={`px-1.5 py-0.5 rounded font-mono font-bold uppercase text-[9px] ${
                              log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              log.status === 'APPROVAL_REQUIRED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              log.status === 'UNAUTHORIZED' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                              log.status === 'CANCELLED' ? 'bg-slate-100 text-slate-600' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              [{log.status}]
                            </span>
                            <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-500 text-[9px] uppercase font-bold">
                              {log.actionCategory}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs font-semibold text-slate-900 flex items-start gap-1">
                          <span className="text-orange-600 font-bold">Prompt:</span>
                          <span className="italic text-slate-700">"{log.userPrompt}"</span>
                        </div>

                        <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-600 border border-slate-100 leading-relaxed">
                          <strong className="text-slate-800">Action Taken:</strong> {log.actionTaken}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
