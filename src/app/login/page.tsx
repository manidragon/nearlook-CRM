'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Key, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  CheckCircle2,
  Building,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { StaffMember } from '@/lib/types';
import { DEMO_PROFILES } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, allProfiles } = useAuth();

  const [userIdOrEmail, setUserIdOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>(DEMO_PROFILES);

  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    fetch('/api/staff')
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.data) && d.data.length > 0) {
          setStaffList(d.data);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanInput = userIdOrEmail.trim().toLowerCase();
    const cleanPass = password.trim();

    if (!cleanInput || !cleanPass) {
      setError('Please enter your Staff User ID / Email and Password.');
      setLoading(false);
      return;
    }

    // Match by userId, email, or name
    const found = staffList.find(s => 
      (s.userId && s.userId.toLowerCase() === cleanInput) ||
      (s.email && s.email.toLowerCase() === cleanInput) ||
      (s.name && s.name.toLowerCase() === cleanInput)
    );

    if (!found) {
      setError(`No active staff account found matching "${userIdOrEmail}".`);
      setLoading(false);
      return;
    }

    // If password matches or demo password bypass
    const expectedPass = found.password || `${found.name.split(' ')[0]}#Nearlook2026!`;
    if (cleanPass !== expectedPass && cleanPass !== 'Nearlook#2026!' && cleanPass !== 'Arun#Owner2026!') {
      setError('Incorrect password. Please verify your credentials or use the Quick Access buttons below.');
      setLoading(false);
      return;
    }

    // Success!
    login(found);
    if (found.role === 'FIELD_STAFF') {
      router.push('/portal');
    } else {
      router.push('/');
    }
  };

  const handleQuickLogin = (profile: StaffMember) => {
    setError(null);
    login(profile);
    if (profile.role === 'FIELD_STAFF') {
      router.push('/portal');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center p-4 text-slate-100 selection:bg-orange-500 selection:text-white">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md z-10 space-y-6">
        {/* Brand Card Header */}
        <div className="text-center space-y-3">
          <div className="inline-block bg-white p-3 rounded-2xl shadow-xl shadow-orange-500/10 border border-slate-700/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Nearlook Mart Pvt Ltd" 
              className="h-12 w-auto max-w-[200px] object-contain mx-auto" 
            />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>Agency ERP & CRM Platform</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Secure Staff Portal, IT Ops, Double-Entry Tally & Client Commercials
            </p>
          </div>
        </div>

        {/* Login Form Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-sm text-slate-200">Staff Portal Authentication</span>
            </div>
            <span className="text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 px-2 py-0.5 rounded border border-orange-500/20">
              RBAC v2.4
            </span>
          </div>

          {error && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Staff User ID or Email *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. STF-101 or arun@nearlook.com"
                  value={userIdOrEmail}
                  onChange={e => setUserIdOrEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Portal Password *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your security password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 focus:border-orange-500 rounded-xl pl-9 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-orange-500 font-mono transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In to ERP Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Switcher */}
          <div className="pt-4 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-bold flex items-center gap-1 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                Quick Role Selector (Trial Evaluation)
              </span>
              <span>1-Click Switch</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const arun = staffList.find(s => s.id === 'staff-1') || DEMO_PROFILES[0];
                  handleQuickLogin(arun);
                }}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 text-left transition flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-purple-900/50 text-purple-300 font-black text-[10px] flex items-center justify-center border border-purple-700/50">
                  AR
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-slate-200 truncate">Arun</div>
                  <div className="text-[9px] text-purple-400 font-semibold uppercase">Owner / Admin</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const acc = staffList.find(s => s.role === 'ACCOUNT_MANAGER') || DEMO_PROFILES[1];
                  handleQuickLogin(acc);
                }}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 text-left transition flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-900/50 text-emerald-300 font-black text-[10px] flex items-center justify-center border border-emerald-700/50">
                  AC
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-slate-200 truncate">Michael Patel</div>
                  <div className="text-[9px] text-emerald-400 font-semibold uppercase">Accounts Manager</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const dev = staffList.find(s => s.role === 'DEVELOPER') || DEMO_PROFILES[2];
                  handleQuickLogin(dev);
                }}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-blue-500/50 text-left transition flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-blue-900/50 text-blue-300 font-black text-[10px] flex items-center justify-center border border-blue-700/50">
                  DV
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-slate-200 truncate">David Chen</div>
                  <div className="text-[9px] text-blue-400 font-semibold uppercase">Developer</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  const field = staffList.find(s => s.role === 'FIELD_STAFF') || DEMO_PROFILES[5];
                  handleQuickLogin(field);
                }}
                className="p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-left transition flex items-center gap-2"
              >
                <div className="w-6 h-6 rounded-lg bg-amber-900/50 text-amber-300 font-black text-[10px] flex items-center justify-center border border-amber-700/50">
                  FS
                </div>
                <div className="overflow-hidden">
                  <div className="text-[11px] font-bold text-slate-200 truncate">Vikram Malhotra</div>
                  <div className="text-[9px] text-amber-400 font-semibold uppercase">Field Staff</div>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>© {new Date().getFullYear()} Nearlook Mart Pvt Ltd. All rights reserved.</p>
          <p className="text-[10px] text-slate-600">Enterprise Agency ERP & CRM • Secure Session Engine</p>
        </div>
      </div>
    </div>
  );
}
