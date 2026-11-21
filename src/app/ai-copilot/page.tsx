'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  AlertTriangle,
  XCircle,
  ShieldAlert,
  Ban,
  Send, 
  Calendar, 
  User, 
  Filter, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  ShieldCheck, 
  Zap, 
  KanbanSquare, 
  DollarSign, 
  Building2, 
  FileText,
  ExternalLink,
  MessageSquare,
  RotateCcw,
  X
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { AIChatMessage, AIChatAuditLog, AIChatPendingApproval } from '@/lib/types';

export default function AICopilotPage() {
  const { currentStaff, isFieldStaff, canViewFinancials } = useAuth();
  
  const initialWelcomeMessage: AIChatMessage = {
    id: 'welcome-msg',
    sender: 'ai',
    text: `### 🤖 Nearlook Executive AI Copilot\n\n` +
      `Welcome **${currentStaff?.name}** (${currentStaff?.role.replace('_', ' ')})!\n\n` +
      `I am your 24/7 Agency AI Copilot. I have full tool-calling capabilities across our CRM database:\n` +
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

  // Chat state with session persistence
  const [messages, setMessages] = useState<AIChatMessage[]>([initialWelcomeMessage]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AIChatAuditLog[]>([]);
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('ALL');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState<string>('ALL');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [searchAuditQuery, setSearchAuditQuery] = useState('');
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);

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

  const handleResetSession = () => {
    setMessages([initialWelcomeMessage]);
    if (typeof window !== 'undefined' && currentStaff?.id) {
      localStorage.removeItem(`nearlook_ai_copilot_session_${currentStaff.id}`);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    fetchAuditLogs();
  }, [selectedDate, selectedStaffFilter, selectedCategoryFilter, searchAuditQuery]);

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
        if (typeof window !== 'undefined' && (data.message.statusBadge === '[SUCCESS]' || data.message.actionExecuted)) {
          window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: data.message }));
        }
        fetchAuditLogs();
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
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('crm-data-updated', { detail: data.message }));
        }
        setMessages(prev => prev.map(m => {
          if (m.pendingApproval && m.pendingApproval.id === pending.id) {
            return {
              ...m,
              pendingApproval: { ...m.pendingApproval, status: 'APPROVED' as const }
            };
          }
          return m;
        }).concat(data.message));
        fetchAuditLogs();
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
        fetchAuditLogs();
      }
    } catch (err: any) {
      console.error('Cancel action error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Inline formatting helper
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

  // Markdown renderer
  const renderFormattedText = (raw: string) => {
    const lines = raw.split('\n');
    let inTable = false;
    let tableRows: string[][] = [];
    const elements: React.ReactNode[] = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

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

  const renderStatusBadge = (badge?: string) => {
    if (!badge) return null;

    if (badge === '[SUCCESS]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>[SUCCESS]</span>
        </span>
      );
    }
    if (badge === '[APPROVAL REQUIRED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse">
          <AlertTriangle className="w-3 h-3 text-amber-600" />
          <span>[APPROVAL REQUIRED]</span>
        </span>
      );
    }
    if (badge === '[UNAUTHORIZED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          <span>[UNAUTHORIZED]</span>
        </span>
      );
    }
    if (badge === '[ACTION FAILED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300">
          <XCircle className="w-3 h-3 text-red-600" />
          <span>[ACTION FAILED]</span>
        </span>
      );
    }
    if (badge === '[CANCELLED]') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-slate-100 text-slate-700 border border-slate-300">
          <Ban className="w-3 h-3 text-slate-500" />
          <span>[CANCELLED]</span>
        </span>
      );
    }
    return null;
  };

  const actionCount = auditLogs.filter(l => l.actionCategory !== 'READ_QUERY').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-fadeIn">
      {/* Top Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-600 via-orange-500 to-amber-500 flex items-center justify-center text-white shadow-xl shadow-orange-500/25">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">Nearlook Executive AI Copilot</h1>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                TOOL-CALLING ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Natural Language CRM Intelligence, Action Automation & Date-Wise Executive Audit Trail in ₹ INR
            </p>
          </div>
        </div>

        {/* Operating Staff Context & Reset */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-xs font-black text-orange-700">
            {currentStaff.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">{currentStaff.name}</div>
            <div className="text-[10px] text-orange-600 font-bold uppercase">{currentStaff.role.replace('_', ' ')} ({currentStaff.userId})</div>
            <div className="text-[9px] text-slate-400">All prompts attributed to your profile</div>
          </div>
          <button
            onClick={handleResetSession}
            className="ml-2 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
            title="Reset conversation session"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total AI Prompts</span>
            <Bot className="w-4 h-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{auditLogs.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Logged across all dates</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Actions Executed</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{actionCount}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Tasks created, dues & attendance logged</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Audit Date History</span>
            <Calendar className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{availableDates.length} Days</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Chronologically recorded</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>RBAC Safety Gate</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-purple-700 mt-2">
            {isFieldStaff ? 'Field Guard' : 'Executive'}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {isFieldStaff ? 'Financial values shielded' : 'Full commercial access'}
          </div>
        </div>
      </div>

      {/* Main Dual-Column Command Center */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Chat Interface (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
          {/* Chat Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600 flex items-center justify-center text-white">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Interactive Executive Prompt Stream</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
                <div className="text-[10px] text-slate-400">Ask or command in natural language</div>
              </div>
            </div>

            <button
              onClick={handleResetSession}
              className="text-[11px] font-semibold text-slate-300 hover:text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors"
            >
              Reset Session
            </button>
          </div>

          {/* Quick Command Suggestions Strip */}
          <div className="bg-orange-50/60 p-2.5 border-b border-orange-100 flex items-center gap-1.5 overflow-x-auto text-[11px]">
            <span className="font-bold text-orange-900 text-[10px] uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-orange-600" />
              Quick:
            </span>
            <button
              onClick={() => handleSendMessage("Assign lead 'John Doe' to the Web Dev team and select staff Rahul.")}
              className="bg-white hover:bg-orange-100 text-slate-700 px-2.5 py-1 rounded-lg border border-orange-200 font-medium whitespace-nowrap"
            >
              🎯 Assign John Doe
            </button>
            <button
              onClick={() => handleSendMessage("Generate a quotation for lead 'Acme Corp' with 18% inclusive GST for 50,000 INR.")}
              className="bg-white hover:bg-orange-100 text-slate-700 px-2.5 py-1 rounded-lg border border-orange-200 font-medium whitespace-nowrap"
            >
              📄 Quote Acme Corp
            </button>
            <button
              onClick={() => handleSendMessage("Log today's video shoot completion for client XYZ and notify the client.")}
              className="bg-white hover:bg-orange-100 text-slate-700 px-2.5 py-1 rounded-lg border border-orange-200 font-medium whitespace-nowrap"
            >
              🎬 Video Shoot XYZ
            </button>
            <button
              onClick={() => handleSendMessage("Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha.")}
              className="bg-white hover:bg-orange-100 text-slate-700 px-2.5 py-1 rounded-lg border border-orange-200 font-medium whitespace-nowrap"
            >
              💰 ₹25k Payment
            </button>
            <button
              onClick={() => handleSendMessage("Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks.")}
              className="bg-white hover:bg-orange-100 text-slate-700 px-2.5 py-1 rounded-lg border border-orange-200 font-medium whitespace-nowrap"
            >
              👥 Vikram & Expense
            </button>
          </div>

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 px-1">
                  {msg.sender === 'user' ? (
                    <>
                      <span>{msg.userStaff?.name || currentStaff.name}</span>
                      <span className="font-semibold text-orange-600">({msg.userStaff?.role || currentStaff.role})</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-orange-600" />
                      <span className="font-bold text-slate-700">Nearlook AI</span>
                      {renderStatusBadge(msg.statusBadge)}
                    </>
                  )}
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`p-4 rounded-2xl max-w-[92%] shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-orange-600 text-white rounded-tr-none text-xs font-medium leading-relaxed'
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

                  {/* Interactive Approval Gate Card */}
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

                  {/* Rich Action Links */}
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
                <span className="text-xs text-slate-500 font-medium">Computing action & updating CRM records...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-slate-200 flex flex-col gap-2">
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
                placeholder="Type query or command: Assign lead..., Generate quotation..., Record payment..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputText.trim()}
                className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl shadow-md shadow-orange-600/25 transition-all text-xs font-bold flex items-center gap-1.5"
              >
                <span>Send</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Press Enter to send. Automatically logged to date-wise audit trail.</span>
              <span className="text-orange-600 font-bold">Nearlook AI Active</span>
            </div>
          </div>
        </div>

        {/* Right Column: Date-Wise Action Audit Trail (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[750px] overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-600/20 text-orange-400 border border-orange-500/30 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-white">Date-Wise Executive Audit Trail</div>
                <div className="text-[10px] text-slate-400">{auditLogs.length} verified operations recorded</div>
              </div>
            </div>

            <button
              onClick={fetchAuditLogs}
              disabled={isLoadingAudit}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              title="Refresh Audit History"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAudit ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="p-3 bg-slate-50 border-b border-slate-200 space-y-2.5">
            {/* Date selection pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">Date:</span>
              <button
                onClick={() => setSelectedDate('ALL')}
                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition-all ${
                  selectedDate === 'ALL'
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
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
                      ? 'bg-orange-600 text-white shadow-2xs'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {d === new Date().toISOString().split('T')[0] ? `Today (${d})` : d}
                </button>
              ))}
            </div>

            {/* Category & Search Filter */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                <input
                  type="text"
                  value={searchAuditQuery}
                  onChange={(e) => setSearchAuditQuery(e.target.value)}
                  placeholder="Filter prompts or actions taken..."
                  className="w-full bg-white border border-slate-200 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:outline-none"
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

          {/* Audit Records Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoadingAudit ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading audit trail records...</div>
            ) : auditLogs.length === 0 ? (
              <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
                No audit entries found matching the filter criteria.
              </div>
            ) : (
              auditLogs.map((log) => (
                <div 
                  key={log.id}
                  className="p-3.5 bg-slate-50/70 border border-slate-200 hover:border-orange-300 rounded-2xl transition-all shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono">{log.date}</span>
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
                      <span className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-500 text-[9px] uppercase font-bold">
                        {log.actionCategory}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs font-semibold text-slate-900 flex items-start gap-1">
                    <span className="text-orange-600 font-bold">Prompt:</span>
                    <span className="italic text-slate-700">"{log.userPrompt}"</span>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl text-[11px] text-slate-600 border border-slate-200 leading-relaxed">
                    <strong className="text-slate-800">Action Taken:</strong> {log.actionTaken}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
