'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FolderArchive, 
  Upload, 
  Share2, 
  FileText, 
  ShieldCheck, 
  FileCheck, 
  Palette, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  X, 
  Check, 
  Plus, 
  Download, 
  Building2, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  HardDrive,
  Layers,
  FileCode,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { ClientDocument, ClientDocCategory, Client } from '@/lib/types';
import { useAuth } from '@/lib/AuthContext';
import { getWhatsAppDirectUrl } from '@/lib/whatsappService';

const CATEGORY_CONFIG: Record<ClientDocCategory, { label: string; color: string; icon: any }> = {
  CONTRACT: { label: 'Client Contract', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: ShieldCheck },
  NDA: { label: 'Confidentiality NDA', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: ShieldCheck },
  BRAND_ASSET: { label: 'Brand Asset / Logo', color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Palette },
  REQUIREMENTS: { label: 'SOW / Requirements', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: FileText },
  DESIGN: { label: 'Design Mockup / UI', color: 'bg-pink-50 text-pink-700 border-pink-200', icon: Layers },
  REPORT: { label: 'Milestone / Delivery Report', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: FileCheck },
  OTHER: { label: 'General Document', color: 'bg-slate-50 text-slate-700 border-slate-200', icon: FileCode }
};

export default function ClientVaultPage() {
  const { currentStaff, isOwnerOrAdmin } = useAuth();

  const [documents, setDocuments] = useState<ClientDocument[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modals & UI states
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Upload Form
  const [uploadForm, setUploadForm] = useState({
    clientId: '',
    title: '',
    category: 'CONTRACT' as ClientDocCategory,
    fileName: '',
    fileUrl: '',
    fileSize: '1.8 MB',
    notes: ''
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [docsRes, clientsRes] = await Promise.all([
        fetch('/api/client-documents').then(r => r.json()),
        fetch('/api/clients').then(r => r.json())
      ]);

      if (docsRes.success) {
        setDocuments(docsRes.data || []);
      }
      if (clientsRes.success) {
        setClients(clientsRes.data || []);
        if (clientsRes.data?.length > 0 && !uploadForm.clientId) {
          setUploadForm(prev => ({ ...prev, clientId: clientsRes.data[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load vault data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = 
        doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (doc.notes && doc.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesClient = selectedClientId === 'ALL' || doc.clientId === selectedClientId;
      const matchesCategory = selectedCategory === 'ALL' || doc.category === selectedCategory;

      return matchesSearch && matchesClient && matchesCategory;
    });
  }, [documents, searchQuery, selectedClientId, selectedCategory]);

  // Statistics
  const stats = useMemo(() => {
    const total = documents.length;
    const contractsCount = documents.filter(d => d.category === 'CONTRACT' || d.category === 'NDA').length;
    const creativeCount = documents.filter(d => d.category === 'BRAND_ASSET' || d.category === 'DESIGN').length;
    const reportsCount = documents.filter(d => d.category === 'REPORT' || d.category === 'REQUIREMENTS').length;
    return { total, contractsCount, creativeCount, reportsCount };
  }, [documents]);

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.clientId) {
      alert('Please select a client');
      return;
    }
    if (!uploadForm.title.trim()) {
      alert('Please enter a document title');
      return;
    }

    const selectedClient = clients.find(c => c.id === uploadForm.clientId);
    const clientName = selectedClient ? selectedClient.businessName : 'Client';
    const computedFileName = uploadForm.fileName.trim() || `${uploadForm.title.trim().replace(/\s+/g, '_')}.pdf`;
    const computedFileUrl = uploadForm.fileUrl.trim() || `https://storage.nearlook.com/vault/${Date.now()}_${encodeURIComponent(computedFileName)}`;

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/client-documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: uploadForm.clientId,
          clientName,
          title: uploadForm.title.trim(),
          category: uploadForm.category,
          fileName: computedFileName,
          fileUrl: computedFileUrl,
          fileSize: uploadForm.fileSize.trim() || '1.5 MB',
          uploadedByStaffId: currentStaff.id,
          uploadedByStaffName: currentStaff.name,
          notes: uploadForm.notes.trim()
        })
      });

      const data = await res.json();
      if (data.success && data.data) {
        setDocuments(prev => [data.data, ...prev]);
        setIsUploadModalOpen(false);
        setUploadForm({
          clientId: clients[0]?.id || '',
          title: '',
          category: 'CONTRACT',
          fileName: '',
          fileUrl: '',
          fileSize: '1.8 MB',
          notes: ''
        });
        showToast(`Document "${data.data.title}" stored safely in Vault!`);
      } else {
        alert(data.error || 'Failed to save document');
      }
    } catch (err: any) {
      alert(err.message || 'Error uploading document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (doc: ClientDocument) => {
    if (!confirm(`Are you sure you want to permanently delete "${doc.title}" for ${doc.clientName}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/client-documents?id=${doc.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setDocuments(prev => prev.filter(d => d.id !== doc.id));
        showToast('Document removed from vault.');
      } else {
        alert('Failed to delete document');
      }
    } catch (err) {
      alert('Error deleting document');
    }
  };

  const handleShareWhatsApp = (doc: ClientDocument) => {
    const client = clients.find(c => c.id === doc.clientId);
    const clientPhone = client?.whatsappNumber || '+919876543210';
    const message = `Hello *${doc.clientName}*,\n\nHere is your official deliverable document from *Nearlook Agency*:\n\n📄 *Document:* ${doc.title}\n🏷️ *Category:* ${CATEGORY_CONFIG[doc.category]?.label || doc.category}\n📦 *File Size:* ${doc.fileSize || 'Standard'}\n🔗 *Direct Cloud Link:* ${doc.fileUrl}\n\nPlease review and let us know if you need any adjustments.\n\nWarm regards,\n*${currentStaff.name}*\nNearlook Agency Operations`;

    const waUrl = getWhatsAppDirectUrl(clientPhone, message);
    window.open(waUrl, '_blank');
    showToast(`WhatsApp sharing link opened for ${doc.clientName}!`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700 animate-slideUp">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FolderArchive className="w-6 h-6 text-orange-600" />
            Client Document Upload Vault
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Dedicated secure cloud repository for contracts, NDAs, brand assets, project scopes, and delivery reports with 1-click WhatsApp dispatch.
          </p>
        </div>

        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Client Document</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Vault Files</span>
            <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.total}</div>
          <div className="text-[11px] text-slate-400 mt-1">Across all onboarded agency clients</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contracts & NDAs</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.contractsCount}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1">Legally binding agreements</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Creative & Design Assets</span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100">
              <Palette className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.creativeCount}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-1">Logos, mockups & design kits</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">SOWs & Delivery Reports</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{stats.reportsCount}</div>
          <div className="text-[11px] text-amber-600 font-semibold mt-1">Proof of delivery & milestones</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search document title, client, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        {/* Client & Category Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Client filter */}
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Clients ({clients.length})</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>{c.businessName}</option>
              ))}
            </select>
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="ALL">All Categories</option>
              {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {(searchQuery || selectedClientId !== 'ALL' || selectedCategory !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClientId('ALL');
                setSelectedCategory('ALL');
              }}
              className="text-[11px] text-orange-600 hover:text-orange-700 font-bold px-2 py-1"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs font-semibold">
          Loading client vault files...
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 text-center">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center mx-auto mb-3">
            <FolderArchive className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Documents Found in Vault</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-5">
            {searchQuery || selectedClientId !== 'ALL' || selectedCategory !== 'ALL'
              ? 'Try adjusting your search criteria or client filters.'
              : 'Upload and organize client agreements, branding assets, SOWs, and milestone delivery reports.'}
          </p>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-orange-500/20"
          >
            <Upload className="w-4 h-4" />
            <span>Upload First Document</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const cat = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.OTHER;
            const CatIcon = cat.icon;

            return (
              <div 
                key={doc.id}
                className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Card Header: Category & Client */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cat.color}`}>
                      <CatIcon className="w-3 h-3" />
                      {cat.label}
                    </span>

                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      {doc.clientName}
                    </span>
                  </div>

                  {/* Title & File Name */}
                  <h3 className="text-sm font-bold text-slate-900 group-hover:text-orange-600 transition-colors line-clamp-2">
                    {doc.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                    {doc.fileName}
                  </p>

                  {/* Optional Notes */}
                  {doc.notes && (
                    <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mt-2.5 line-clamp-2">
                      {doc.notes}
                    </p>
                  )}
                </div>

                {/* Footer Metadata & Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3 text-slate-400" />
                      {doc.fileSize || '1.5 MB'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {new Date(doc.uploadedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 truncate max-w-[150px]">
                      <User className="w-3 h-3 text-slate-400" />
                      {doc.uploadedByStaffName}
                    </span>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      Cloud Verified
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>View File</span>
                    </a>

                    <button
                      onClick={() => handleShareWhatsApp(doc)}
                      className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1 shadow-sm"
                      title="Share document download link directly to client on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Delete document"
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

      {/* Upload Client Document Modal (Strict Flexbox Column Layout) */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-xl flex flex-col h-full max-h-[90vh] shadow-2xl border border-slate-200 overflow-hidden">
            {/* Locked Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white z-10">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-orange-50 text-orange-600 border border-orange-100">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">Upload Client Document to Vault</h2>
                  <p className="text-xs text-slate-500">Store and organize digital contracts, briefs, assets & reports</p>
                </div>
              </div>

              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="vaultUploadForm" onSubmit={handleUploadSubmit} className="overflow-y-auto flex-1 p-6 space-y-4">
              {/* Select Client */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Client Organization <span className="text-rose-500">*</span>
                </label>
                <select
                  value={uploadForm.clientId}
                  onChange={(e) => setUploadForm({ ...uploadForm, clientId: e.target.value })}
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="" disabled>-- Select Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.businessName} ({c.id})</option>
                  ))}
                </select>
              </div>

              {/* Document Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Document Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Services Agreement (MSA) - Phase 1"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  required
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Document Category <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setUploadForm({ ...uploadForm, category: key as ClientDocCategory })}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                        uploadForm.category === key
                          ? 'bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-500/20'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span>{config.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* File Name & Estimated Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">File Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Nearlook_MSA_Contract_Signed.pdf"
                    value={uploadForm.fileName}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileName: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">File Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 2.4 MB"
                    value={uploadForm.fileSize}
                    onChange={(e) => setUploadForm({ ...uploadForm, fileSize: e.target.value })}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Cloud File URL */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">
                  Cloud Storage File URL / Google Drive / S3
                </label>
                <input
                  type="url"
                  placeholder="https://drive.google.com/file/... or leave blank for auto-generated cloud URL"
                  value={uploadForm.fileUrl}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileUrl: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Leave blank to simulate hosting on Nearlook Cloud CDN (docs.nearlook.com)
                </span>
              </div>

              {/* Notes / Internal Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1.5">Notes / SOW Details</label>
                <textarea
                  rows={2}
                  placeholder="Optional internal remarks, milestone references, or client signature notes..."
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                />
              </div>
            </form>

            {/* Locked Sticky Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-3 z-10">
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                form="vaultUploadForm"
                disabled={isSubmitting}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-500/20 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>{isSubmitting ? 'Uploading...' : 'Save & Store in Vault'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
