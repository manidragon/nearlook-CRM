'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Search, 
  Plus, 
  Sparkles, 
  CheckCircle2, 
  RefreshCw,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { DEMO_PROFILES } from '@/lib/auth';

export default function Header() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recurringMessage, setRecurringMessage] = useState<string | null>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const { currentStaff, setCurrentStaff, canViewFinancials, isFieldStaff } = useAuth();

  const handleRunRecurringTasks = async () => {
    setIsGenerating(true);
    setRecurringMessage(null);
    try {
      const res = await fetch('/api/tasks/recurring', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setRecurringMessage(data.message || 'Generated weekly report tasks in ₹ INR!');
        setTimeout(() => setRecurringMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch(role) {
      case 'ADMIN':
      case 'OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'ACCOUNT_MANAGER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'DEVELOPER':
      case 'FIELD_STAFF':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-orange-100 text-orange-800 border-orange-200';
    }
  };

  return (
    <header className="h-16 border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between px-6 transition-colors shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, retainers, credentials vault, tasks in ₹..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Global Actions */}
      <div className="flex items-center gap-3">
        {/* Recurring Generator Notification */}
        {recurringMessage && (
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-700 rounded-full text-xs animate-fadeIn font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{recurringMessage}</span>
          </div>
        )}

        {/* Currency indicator badge */}
        <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-lg text-xs font-bold text-orange-700">
          <span>₹ INR</span>
        </div>

        {/* RBAC Role Switcher (Phase 1 Requirement) */}
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 transition-all shadow-sm"
            title="Switch Active RBAC User Role"
          >
            <div className="w-6 h-6 rounded-full bg-orange-100 border border-orange-300 flex items-center justify-center text-[10px] font-black text-orange-700">
              {currentStaff.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-[11px] font-bold text-slate-900 leading-tight">{currentStaff.name}</div>
              <div className="text-[9px] text-orange-600 font-bold uppercase">{currentStaff.role.replace('_', ' ')}</div>
            </div>
            <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(currentStaff.role)}`}>
              {currentStaff.role === 'ADMIN' ? 'Owner/Admin' : currentStaff.role === 'ACCOUNT_MANAGER' ? 'Accounts' : 'Field Staff'}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-fadeIn text-slate-800">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Switch Active Role (RBAC)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Test permissions & role-based data isolation live
                </p>
              </div>

              <div className="space-y-1">
                {DEMO_PROFILES.map((profile) => {
                  const isSelected = profile.id === currentStaff.id;
                  return (
                    <button
                      key={profile.id}
                      onClick={() => {
                        setCurrentStaff(profile);
                        setShowRoleDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-xl transition-all flex items-center justify-between ${
                        isSelected 
                          ? 'bg-orange-50 border border-orange-300' 
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                          {profile.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900 leading-tight">{profile.name}</div>
                          <div className="text-[10px] text-slate-500">{profile.userId} • {profile.team.replace('_', ' ')}</div>
                        </div>
                      </div>
                      <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border ${getRoleBadgeColor(profile.role)}`}>
                        {profile.role.replace('_', ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2 pt-2 border-t border-slate-100 px-2 text-[10px] text-slate-400">
                {isFieldStaff ? (
                  <span className="text-amber-600 font-bold">🔒 Field Staff mode: Financial values hidden, only assigned tasks visible.</span>
                ) : canViewFinancials ? (
                  <span className="text-emerald-600 font-bold">🔓 Unrestricted Financials & Accounts view active.</span>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* Auto Recurring Task Generator */}
        <button
          onClick={handleRunRecurringTasks}
          disabled={isGenerating}
          title="Auto-generate recurring tasks for all active retainers"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-bold transition-all disabled:opacity-60 shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-orange-600 ${isGenerating ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Sync Retainers</span>
        </button>

        {/* AI Copilot Quick Link */}
        <Link
          href="/ai-copilot"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 hover:from-orange-500/20 hover:to-amber-500/20 text-orange-700 border border-orange-300 rounded-xl text-xs font-bold transition-all shadow-2xs"
          title="Open Dedicated AI Copilot & Audit Trail"
        >
          <Sparkles className="w-3.5 h-3.5 text-orange-600 animate-pulse" />
          <span className="hidden md:inline">AI Copilot</span>
        </Link>

        {/* WhatsApp Command Center Link */}
        <Link
          href="/whatsapp"
          className="relative p-2 rounded-xl text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
          title="WhatsApp Cloud API Status"
        >
          <MessageSquare className="w-4 h-4 text-emerald-600" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>
        </Link>

        {/* Create Lead Quick Button */}
        <Link
          href="/leads"
          className="flex items-center gap-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/25 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Lead</span>
        </Link>
      </div>
    </header>
  );
}
