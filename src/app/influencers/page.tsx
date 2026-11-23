'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Plus, 
  Search, 
  Instagram, 
  Youtube, 
  Linkedin, 
  Twitter, 
  Share2, 
  Phone, 
  Mail, 
  CreditCard, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  Eye, 
  X, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  DollarSign
} from 'lucide-react';
import { Influencer } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';

const formatINR = (val?: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val || 0);
};

export default function InfluencersPage() {
  const { currentStaff, canViewFinancials } = useAuth();

  const [influencers, setInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [platformFilter, setPlatformFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingInfluencer, setEditingInfluencer] = useState<Influencer | null>(null);
  const [deletingInfluencer, setDeletingInfluencer] = useState<Influencer | null>(null);
  const [viewingInfluencer, setViewingInfluencer] = useState<Influencer | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formHandle, setFormHandle] = useState('');
  const [formPlatform, setFormPlatform] = useState('Instagram');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formCategory, setFormCategory] = useState('Technology & SaaS');
  const [formFollowers, setFormFollowers] = useState('50K');
  const [formRate, setFormRate] = useState('10000');
  const [formUpiId, setFormUpiId] = useState('');
  const [formBankDetails, setFormBankDetails] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formStatus, setFormStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  const loadData = async () => {
    try {
      const res = await fetch('/api/influencers').then(r => r.json());
      if (res.success) setInfluencers(res.data);
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
    setFormHandle('');
    setFormPlatform('Instagram');
    setFormPhone('');
    setFormEmail('');
    setFormCategory('Technology & SaaS');
    setFormFollowers('50K');
    setFormRate('10000');
    setFormUpiId('');
    setFormBankDetails('');
    setFormNotes('');
    setFormStatus('ACTIVE');
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleOpenEditModal = (inf: Influencer) => {
    setEditingInfluencer(inf);
    setFormName(inf.name);
    setFormHandle(inf.handle);
    setFormPlatform(inf.platform);
    setFormPhone(inf.phone || '');
    setFormEmail(inf.email || '');
    setFormCategory(inf.category || 'Technology & SaaS');
    setFormFollowers(inf.followersCount || '');
    setFormRate(String(inf.standardRate || 0));
    setFormUpiId(inf.upiId || '');
    setFormBankDetails(inf.bankDetails || '');
    setFormNotes(inf.notes || '');
    setFormStatus(inf.status || 'ACTIVE');
  };

  const handleSaveInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formHandle) {
      alert('Please fill in Name and Social Handle');
      return;
    }

    try {
      if (editingInfluencer) {
        const res = await fetch('/api/influencers', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingInfluencer.id,
            name: formName,
            handle: formHandle,
            platform: formPlatform,
            phone: formPhone,
            email: formEmail,
            category: formCategory,
            followersCount: formFollowers,
            standardRate: Number(formRate) || 0,
            upiId: formUpiId,
            bankDetails: formBankDetails,
            notes: formNotes,
            status: formStatus
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Influencer profile for ${formName} updated!`);
          setEditingInfluencer(null);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      } else {
        const res = await fetch('/api/influencers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: formName,
            handle: formHandle,
            platform: formPlatform,
            phone: formPhone,
            email: formEmail,
            category: formCategory,
            followersCount: formFollowers,
            standardRate: Number(formRate) || 0,
            upiId: formUpiId,
            bankDetails: formBankDetails,
            notes: formNotes,
            status: formStatus
          })
        });
        const data = await res.json();
        if (data.success) {
          setToastMessage(`✅ Added ${formName} (${formHandle}) to Influencer Directory.`);
          setShowCreateModal(false);
          loadData();
          window.dispatchEvent(new Event('crm-data-updated'));
        }
      }
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error(err);
      alert('Failed to save influencer');
    }
  };

  const handleDeleteInfluencer = async () => {
    if (!deletingInfluencer) return;
    try {
      const res = await fetch(`/api/influencers?id=${deletingInfluencer.id}&deletedBy=${encodeURIComponent(currentStaff.name)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setToastMessage(`🗑️ ${deletingInfluencer.name} removed from active creators.`);
        setDeletingInfluencer(null);
        loadData();
        window.dispatchEvent(new Event('crm-data-updated'));
        setTimeout(() => setToastMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = influencers.filter(inf => {
    const matchesSearch = 
      inf.name.toLowerCase().includes(search.toLowerCase()) ||
      inf.handle.toLowerCase().includes(search.toLowerCase()) ||
      (inf.category && inf.category.toLowerCase().includes(search.toLowerCase())) ||
      (inf.email && inf.email.toLowerCase().includes(search.toLowerCase()));
    const matchesPlatform = platformFilter === 'ALL' || inf.platform.toLowerCase() === platformFilter.toLowerCase();
    return matchesSearch && matchesPlatform;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'instagram':
        return <Instagram className="w-3.5 h-3.5 text-pink-600" />;
      case 'youtube':
        return <Youtube className="w-3.5 h-3.5 text-red-600" />;
      case 'linkedin':
        return <Linkedin className="w-3.5 h-3.5 text-blue-600" />;
      case 'twitter/x':
      case 'twitter':
      case 'x':
        return <Twitter className="w-3.5 h-3.5 text-sky-600" />;
      default:
        return <Share2 className="w-3.5 h-3.5 text-purple-600" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fadeIn text-slate-800">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex items-center space-x-2 text-xs font-semibold animate-slideUp border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Influencer & Creator Directory</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-pink-100 text-pink-800 border border-pink-200">
              Creators & Roster
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Maintain verified creator databases, Instagram/YouTube follower metrics, commercial collaboration fees, and UPI payment coordinates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/vendors"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <span>← Project Expenses</span>
          </Link>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Influencer / Creator</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Active Creators</span>
          <p className="text-xl font-black text-slate-900 mt-1 font-mono">
            {influencers.filter(i => i.status === 'ACTIVE').length}
          </p>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">Verified Roster</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Instagram Creators</span>
          <p className="text-xl font-black text-pink-600 mt-1 font-mono">
            {influencers.filter(i => i.platform?.toLowerCase() === 'instagram').length}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Reels & Collabs</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">YouTube Channels</span>
          <p className="text-xl font-black text-red-600 mt-1 font-mono">
            {influencers.filter(i => i.platform?.toLowerCase() === 'youtube').length}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Reviews & Integrations</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Avg Commercial Rate</span>
          <p className="text-xl font-black text-emerald-700 mt-1 font-mono">
            {formatINR(
              influencers.length > 0 
                ? Math.round(influencers.reduce((s, i) => s + (i.standardRate || 0), 0) / influencers.length) 
                : 0
            )}
          </p>
          <span className="text-[10px] text-slate-400 block mt-0.5">Standard Reel / Video Fee</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search creator name, @handle, niche category, or email..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="text-xs font-bold text-slate-500">Platform:</span>
          <select
            value={platformFilter}
            onChange={e => setPlatformFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="ALL">All Platforms</option>
            <option value="Instagram">Instagram</option>
            <option value="YouTube">YouTube</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Twitter/X">Twitter/X</option>
          </select>
        </div>
      </div>

      {/* Influencers Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 font-bold text-sm">Loading creator profiles...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-slate-300 rounded-2xl">
          <p className="text-slate-500 font-bold text-sm">No influencers found matching search criteria.</p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-3 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-bold hover:bg-orange-500 transition"
          >
            + Add First Creator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(inf => {
            const cleanPhone = (inf.phone || '').replace(/\D/g, '');
            const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hi ${inf.name}, reaching out from Nearlook Agency regarding an upcoming brand campaign collaboration.`)}` : null;

            return (
              <div
                key={inf.id}
                className="bg-white border border-slate-200 hover:border-orange-400 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="p-1 rounded-lg bg-slate-100 border border-slate-200">
                          {getPlatformIcon(inf.platform)}
                        </span>
                        <h3 className="font-extrabold text-slate-900 text-sm">{inf.name}</h3>
                      </div>
                      <p className="text-xs font-bold text-orange-600 mt-0.5">{inf.handle}</p>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                      inf.status === 'ACTIVE' 
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}>
                      {inf.status}
                    </span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
                      <span className="font-semibold text-slate-700 truncate block">{inf.category || 'Lifestyle'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Followers</span>
                      <span className="font-black text-slate-900 block font-mono">{inf.followersCount || 'N/A'}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Standard Fee</span>
                      <span className="font-black text-emerald-700 block font-mono">{formatINR(inf.standardRate)}</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">UPI ID</span>
                      <span className="font-mono text-slate-600 truncate block text-[11px]" title={inf.upiId || 'Not set'}>
                        {inf.upiId || '—'}
                      </span>
                    </div>
                  </div>

                  {inf.notes && (
                    <p className="mt-2 text-[11px] text-slate-500 bg-slate-50 p-2 rounded-xl line-clamp-2 italic">
                      "{inf.notes}"
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white transition"
                        title="Direct WhatsApp Creator Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {inf.email && (
                      <a
                        href={`mailto:${inf.email}`}
                        className="p-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition"
                        title="Send Email"
                      >
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingInfluencer(inf)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                      title="View Full Profile"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(inf)}
                      className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                      title="Edit Creator"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingInfluencer(inf)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Creator"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Influencer Modal */}
      {(showCreateModal || editingInfluencer) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-600" />
                <h3 className="font-black text-base text-slate-900">
                  {editingInfluencer ? 'Edit Influencer Profile' : 'Onboard New Influencer / Creator'}
                </h3>
              </div>
              <button
                onClick={() => { setShowCreateModal(false); setEditingInfluencer(null); }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInfluencer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Creator Name *</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Arun Kumar"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Social Handle *</label>
                  <input
                    type="text"
                    required
                    value={formHandle}
                    onChange={e => setFormHandle(e.target.value)}
                    placeholder="e.g. @tech_arun"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Primary Platform</label>
                  <select
                    value={formPlatform}
                    onChange={e => setFormPlatform(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Twitter/X">Twitter/X</option>
                    <option value="TikTok">TikTok</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Niche / Category</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value)}
                    placeholder="e.g. Tech, SaaS, Fashion"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Followers / Audience Reach</label>
                  <input
                    type="text"
                    value={formFollowers}
                    onChange={e => setFormFollowers(e.target.value)}
                    placeholder="e.g. 150K"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Standard Rate (₹ INR)</label>
                  <input
                    type="number"
                    value={formRate}
                    onChange={e => setFormRate(e.target.value)}
                    placeholder="15000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">WhatsApp / Phone (Optional)</label>
                  <input
                    type="text"
                    value={formPhone}
                    onChange={e => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Email Address (Optional)</label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="creator@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">UPI ID for Payouts</label>
                  <input
                    type="text"
                    value={formUpiId}
                    onChange={e => setFormUpiId(e.target.value)}
                    placeholder="creator@okhdfcbank"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Profile Status</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank Account Coordinates</label>
                <input
                  type="text"
                  value={formBankDetails}
                  onChange={e => setFormBankDetails(e.target.value)}
                  placeholder="e.g. HDFC A/C: 501004921004 • IFSC: HDFC0001234"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Collaboration Notes & Requirements</label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="e.g. Requires 3-day turnaround time, 1 reel + 2 stories combo package..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCreateModal(false); setEditingInfluencer(null); }}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-xs shadow-md shadow-orange-600/20 transition cursor-pointer"
                >
                  {editingInfluencer ? 'Update Creator Profile' : 'Save Creator'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Influencer Modal */}
      {viewingInfluencer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-orange-50 text-orange-600 border border-orange-200">
                  {getPlatformIcon(viewingInfluencer.platform)}
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900">{viewingInfluencer.name}</h3>
                  <p className="text-xs text-orange-600 font-bold">{viewingInfluencer.handle}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingInfluencer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Platform:</span>
                <span className="font-bold text-slate-900">{viewingInfluencer.platform}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Niche / Category:</span>
                <span className="font-bold text-slate-900">{viewingInfluencer.category || 'Lifestyle'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Audience / Followers:</span>
                <span className="font-black text-slate-900 font-mono">{viewingInfluencer.followersCount || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Standard Campaign Fee:</span>
                <span className="font-black text-emerald-700 font-mono">{formatINR(viewingInfluencer.standardRate)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">WhatsApp / Phone:</span>
                <span className="font-bold text-slate-900">{viewingInfluencer.phone || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">Email:</span>
                <span className="font-bold text-slate-900">{viewingInfluencer.email || '—'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 font-bold">UPI ID:</span>
                <span className="font-mono font-bold text-purple-700">{viewingInfluencer.upiId || '—'}</span>
              </div>
              {viewingInfluencer.bankDetails && (
                <div className="py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-bold block mb-0.5">Bank Details:</span>
                  <span className="font-mono text-slate-800 text-[11px]">{viewingInfluencer.bankDetails}</span>
                </div>
              )}
              {viewingInfluencer.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 font-bold block mb-0.5">Guidelines & Notes:</span>
                  <p className="text-slate-700 text-[11px]">{viewingInfluencer.notes}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  const inf = viewingInfluencer;
                  setViewingInfluencer(null);
                  handleOpenEditModal(inf);
                }}
                className="px-3.5 py-1.5 bg-orange-50 text-orange-700 font-bold text-xs rounded-xl hover:bg-orange-100 transition"
              >
                Edit Profile
              </button>
              <button
                onClick={() => setViewingInfluencer(null)}
                className="px-4 py-1.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingInfluencer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 space-y-4">
            <h3 className="font-black text-base text-slate-900">Remove Creator?</h3>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove <strong className="text-slate-900">{deletingInfluencer.name} ({deletingInfluencer.handle})</strong>?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingInfluencer(null)}
                className="px-3.5 py-1.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteInfluencer}
                className="px-4 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-xl hover:bg-rose-500 transition"
              >
                Yes, Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
