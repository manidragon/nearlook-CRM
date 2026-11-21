'use client';

import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  ShieldCheck, 
  Key, 
  Eye, 
  EyeOff, 
  Copy, 
  Check, 
  Lock, 
  ExternalLink, 
  Server,
  Globe,
  Share2,
  FileText,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { Client, VaultCredential, CredentialCategory, ClientType } from '@/lib/types';

const CATEGORY_ICONS: Record<CredentialCategory, any> = {
  WORDPRESS: Globe,
  META_BUSINESS_MANAGER: Share2,
  HOSTING_CPANEL_AWS: Server,
  GOOGLE_ANALYTICS_GTM: FileText,
  SHOPIFY: Globe,
  CUSTOM_APP: Lock
};

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'RECURRING_RETAINER' | 'ONE_TIME_PROJECT'>('ALL');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modals
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isVaultModalOpen, setIsVaultModalOpen] = useState(false);

  // Form states
  const [clientForm, setClientForm] = useState({
    businessName: '',
    contactName: '',
    whatsappNumber: '',
    email: '',
    website: '',
    clientType: 'RECURRING_RETAINER' as ClientType,
    monthlyRetainerAmount: '',
    billingCycleDay: '1'
  });

  // Edit Client State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [editClientForm, setEditClientForm] = useState({
    businessName: '',
    contactName: '',
    whatsappNumber: '',
    email: '',
    website: '',
    clientType: 'RECURRING_RETAINER' as ClientType,
    monthlyRetainerAmount: '',
    billingCycleDay: '1'
  });

  const [vaultForm, setVaultForm] = useState({
    category: 'WORDPRESS' as CredentialCategory,
    label: '',
    loginUrl: '',
    username: '',
    passwordText: '',
    notes: ''
  });

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
        if (!selectedClient && data.data.length > 0) {
          setSelectedClient(data.data[0]);
        } else if (selectedClient) {
          const updatedSelected = data.data.find((c: Client) => c.id === selectedClient.id);
          if (updatedSelected) setSelectedClient(updatedSelected);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleRevealPassword = async (credId: string) => {
    if (revealedPasswords[credId]) {
      setRevealedPasswords(prev => {
        const copy = { ...prev };
        delete copy[credId];
        return copy;
      });
      return;
    }

    try {
      const res = await fetch('/api/vault/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credId })
      });
      const data = await res.json();
      if (data.success) {
        setRevealedPasswords(prev => ({ ...prev, [credId]: data.decryptedPassword }));
      }
    } catch (e) {
      console.error('Decryption reveal error:', e);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clientForm)
      });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        setSelectedClient(data.data);
        setIsClientModalOpen(false);
        setClientForm({
          businessName: '',
          contactName: '',
          whatsappNumber: '',
          email: '',
          website: '',
          clientType: 'RECURRING_RETAINER',
          monthlyRetainerAmount: '',
          billingCycleDay: '1'
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddVaultCredential = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      const res = await fetch('/api/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...vaultForm,
          clientId: selectedClient.id
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        setIsVaultModalOpen(false);
        setVaultForm({
          category: 'WORDPRESS',
          label: '',
          loginUrl: '',
          username: '',
          passwordText: '',
          notes: ''
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const openEditClient = (client: Client, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingClient(client);
    setEditClientForm({
      businessName: client.businessName || '',
      contactName: client.contactName || '',
      whatsappNumber: client.whatsappNumber || '',
      email: client.email || '',
      website: client.website || '',
      clientType: client.clientType,
      monthlyRetainerAmount: client.monthlyRetainerAmount ? String(client.monthlyRetainerAmount) : '',
      billingCycleDay: client.billingCycleDay ? String(client.billingCycleDay) : '1'
    });
    setIsEditClientModalOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    try {
      const res = await fetch('/api/clients', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingClient.id,
          businessName: editClientForm.businessName,
          contactName: editClientForm.contactName,
          whatsappNumber: editClientForm.whatsappNumber,
          email: editClientForm.email,
          website: editClientForm.website,
          clientType: editClientForm.clientType,
          monthlyRetainerAmount: Number(editClientForm.monthlyRetainerAmount) || 0,
          billingCycleDay: Number(editClientForm.billingCycleDay) || 1
        })
      });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        setIsEditClientModalOpen(false);
        setEditingClient(null);
      }
    } catch (err) {
      console.error('Update client error:', err);
    }
  };

  const handleDeleteClient = async (clientId: string, clientName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm(`Are you sure you want to delete client "${clientName}" and all associated credentials? This action cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/clients?id=${clientId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        await fetchClients();
        if (selectedClient?.id === clientId) {
          setSelectedClient(null);
        }
      }
    } catch (err) {
      console.error('Delete client error:', err);
    }
  };

  const filteredClients = clients.filter(c => {
    if (activeTab === 'ALL') return true;
    return c.clientType === activeTab;
  });

  return (
    <div className="space-y-6 pb-12 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-orange-600" />
            Client Accounts & Retainers (₹ INR)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage recurring monthly retainers in Indian Rupees and AES-256 encrypted access credentials.
          </p>
        </div>

        <button
          onClick={() => setIsClientModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Client Account</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ALL'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          All Accounts ({clients.length})
        </button>
        <button
          onClick={() => setActiveTab('RECURRING_RETAINER')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'RECURRING_RETAINER'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          Monthly Retainers ({clients.filter(c => c.clientType === 'RECURRING_RETAINER').length})
        </button>
        <button
          onClick={() => setActiveTab('ONE_TIME_PROJECT')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ONE_TIME_PROJECT'
              ? 'bg-orange-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-orange-50 hover:text-orange-600'
          }`}
        >
          One-Time Contracts ({clients.filter(c => c.clientType === 'ONE_TIME_PROJECT').length})
        </button>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Client List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredClients.length === 0 ? (
            <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mx-auto mb-3 border border-orange-100">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No Clients Registered Yet</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Start fresh by registering your first IT client, retainer subscription, or milestone contract.
              </p>
              <button
                onClick={() => setIsClientModalOpen(true)}
                className="mt-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Client</span>
              </button>
            </div>
          ) : (
            filteredClients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            const credCount = client.credentials?.length || 0;

            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-orange-50/40 border-orange-500 shadow-md ring-2 ring-orange-500/20'
                    : 'bg-white border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 font-black flex items-center justify-center text-sm border border-orange-200">
                      {client.businessName.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900">
                        {client.businessName}
                      </h3>
                      <div className="text-xs text-slate-500">
                        {client.contactName} • {client.whatsappNumber}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      client.clientType === 'RECURRING_RETAINER'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                      {client.clientType === 'RECURRING_RETAINER' ? 'Retainer' : 'Milestone'}
                    </span>
                    <button
                      onClick={(e) => openEditClient(client, e)}
                      title="Edit Client"
                      className="p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClient(client.id, client.businessName, e)}
                      title="Delete Client"
                      className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    {client.clientType === 'RECURRING_RETAINER' ? (
                      <span className="font-black text-orange-600 text-sm">
                        ₹{client.monthlyRetainerAmount.toLocaleString('en-IN')}/mo
                      </span>
                    ) : (
                      <span className="font-bold text-slate-700">Milestone Contract</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-500 font-bold">
                    <Key className="w-3.5 h-3.5 text-amber-500" />
                    <span>{credCount} Vault Logins</span>
                  </div>
                </div>
              </div>
            );
          }))}
        </div>

        {/* Right Column: Selected Client & AES-256 Credentials Vault */}
        <div className="lg:col-span-7">
          {selectedClient ? (
            <div className="space-y-6">
              {/* Profile Card */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-600">
                      Client Profile & Retainer Specs
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-0.5">
                      {selectedClient.businessName}
                    </h2>
                    {selectedClient.website && (
                      <a 
                        href={selectedClient.website} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-xs text-orange-600 hover:underline flex items-center gap-1 mt-1 font-medium"
                      >
                        <span>{selectedClient.website}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="text-left sm:text-right">
                      {selectedClient.clientType === 'RECURRING_RETAINER' ? (
                        <div>
                          <div className="text-2xl font-black text-emerald-600">
                            ₹{selectedClient.monthlyRetainerAmount.toLocaleString('en-IN')}
                            <span className="text-xs text-slate-400 font-normal">/mo</span>
                          </div>
                          <div className="text-xs text-slate-500 font-medium">Billed on Day {selectedClient.billingCycleDay}</div>
                        </div>
                      ) : (
                        <div className="text-base font-bold text-blue-600">Fixed Milestone Contract</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => openEditClient(selectedClient)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg transition-colors border border-slate-200"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClient(selectedClient.id, selectedClient.businessName)}
                        className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Client</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold">Primary Contact</span>
                    <strong className="text-slate-900">{selectedClient.contactName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold">WhatsApp Phone</span>
                    <strong className="text-emerald-700">{selectedClient.whatsappNumber}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-semibold">Account Manager</span>
                    <strong className="text-orange-600">{selectedClient.assignedManager?.name || 'Alex Rivera'}</strong>
                  </div>
                </div>
              </div>

              {/* Credentials Vault in White & Orange */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      Encrypted Credentials Vault (AES-256)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Encrypted WordPress, Meta Business Manager, Server & Analytics logins.
                    </p>
                  </div>

                  <button
                    onClick={() => setIsVaultModalOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Store Credential</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {(selectedClient.credentials && selectedClient.credentials.length > 0) ? (
                    selectedClient.credentials.map((cred) => {
                      const Icon = CATEGORY_ICONS[cred.category] || Lock;
                      const isRevealed = Boolean(revealedPasswords[cred.id]);
                      const clearPassword = revealedPasswords[cred.id] || '••••••••••••••••';

                      return (
                        <div 
                          key={cred.id} 
                          className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg border border-orange-200">
                                <Icon className="w-4 h-4" />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-900">
                                  {cred.label}
                                </h4>
                                <span className="text-[10px] text-slate-500 font-bold">
                                  Category: {cred.category.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            {cred.loginUrl && (
                              <a
                                href={cred.loginUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-1"
                              >
                                <span>Login Portal</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                              <span className="text-slate-400 text-[11px] font-bold">User:</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-slate-900 font-bold">{cred.username}</span>
                                <button
                                  onClick={() => handleCopy(cred.username, `user-${cred.id}`)}
                                  className="text-slate-400 hover:text-orange-600"
                                  title="Copy Username"
                                >
                                  {copiedId === `user-${cred.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200">
                              <span className="text-slate-400 text-[11px] font-bold">Pass:</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-mono font-bold ${isRevealed ? 'text-emerald-700 text-xs' : 'text-slate-500 text-xs'}`}>
                                  {clearPassword}
                                </span>
                                <button
                                  onClick={() => handleRevealPassword(cred.id)}
                                  className="text-slate-400 hover:text-orange-600 transition-colors"
                                  title={isRevealed ? "Hide Password" : "AES-256 Decrypt & Reveal"}
                                >
                                  {isRevealed ? <EyeOff className="w-3.5 h-3.5 text-amber-600" /> : <Eye className="w-3.5 h-3.5" />}
                                </button>
                                {isRevealed && (
                                  <button
                                    onClick={() => handleCopy(clearPassword, `pass-${cred.id}`)}
                                    className="text-slate-400 hover:text-orange-600"
                                    title="Copy Password"
                                  >
                                    {copiedId === `pass-${cred.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {cred.notes && (
                            <p className="text-[11px] text-slate-500 italic bg-white p-2 rounded-lg border border-slate-200">
                              Note: {cred.notes}
                            </p>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-xl">
                      <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No credentials stored for {selectedClient.businessName} yet.</p>
                      <button
                        onClick={() => setIsVaultModalOpen(true)}
                        className="mt-2 text-xs font-bold text-orange-600 hover:underline"
                      >
                        + Add WordPress, Meta or Server Access
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto mb-3 border border-slate-100">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700">Client Profile & AES-256 Vault</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Select a client account to inspect contracts, monthly retainers, and encrypted credentials.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-black text-slate-900">Create New Client Account</h2>
                <p className="text-xs text-slate-500">Configure retainer billing or one-time milestone project terms in ₹ INR.</p>
              </div>
              <button
                onClick={() => setIsClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Business / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={clientForm.businessName}
                    onChange={(e) => setClientForm({ ...clientForm, businessName: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={clientForm.contactName}
                      onChange={(e) => setClientForm({ ...clientForm, contactName: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={clientForm.whatsappNumber}
                      onChange={(e) => setClientForm({ ...clientForm, whatsappNumber: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@acme.com"
                      value={clientForm.email}
                      onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://acme.com"
                      value={clientForm.website}
                      onChange={(e) => setClientForm({ ...clientForm, website: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Contract Type</label>
                    <select
                      value={clientForm.clientType}
                      onChange={(e) => setClientForm({ ...clientForm, clientType: e.target.value as ClientType })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="RECURRING_RETAINER">Recurring Monthly Retainer</option>
                      <option value="ONE_TIME_PROJECT">One-Time Milestone Project</option>
                    </select>
                  </div>

                  {clientForm.clientType === 'RECURRING_RETAINER' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-700">Monthly Retainer (₹ INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 185000"
                        value={clientForm.monthlyRetainerAmount}
                        onChange={(e) => setClientForm({ ...clientForm, monthlyRetainerAmount: e.target.value })}
                        className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-700">Billing Day</label>
                      <input
                        type="number"
                        placeholder="1"
                        value={clientForm.billingCycleDay}
                        onChange={(e) => setClientForm({ ...clientForm, billingCycleDay: e.target.value })}
                        className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsClientModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Create Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Vault Credential Modal */}
      {isVaultModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Store AES-256 Encrypted Credential
                </h2>
                <p className="text-xs text-slate-500">Credentials will be encrypted with a 32-byte secret key and stored securely.</p>
              </div>
              <button
                onClick={() => setIsVaultModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVaultCredential} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Category *</label>
                    <select
                      value={vaultForm.category}
                      onChange={(e) => setVaultForm({ ...vaultForm, category: e.target.value as CredentialCategory })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="WORDPRESS">WordPress CMS</option>
                      <option value="META_BUSINESS_MANAGER">Meta Business Manager</option>
                      <option value="HOSTING_CPANEL_AWS">Hosting / AWS / cPanel</option>
                      <option value="GOOGLE_ANALYTICS_GTM">Google Analytics / GTM</option>
                      <option value="SHOPIFY">Shopify Store Admin</option>
                      <option value="CUSTOM_APP">Custom App / API Keys</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Label / Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Production WP Admin"
                      value={vaultForm.label}
                      onChange={(e) => setVaultForm({ ...vaultForm, label: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Login URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/wp-login.php"
                    value={vaultForm.loginUrl}
                    onChange={(e) => setVaultForm({ ...vaultForm, loginUrl: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Username / Email *</label>
                    <input
                      type="text"
                      required
                      placeholder="admin_user"
                      value={vaultForm.username}
                      onChange={(e) => setVaultForm({ ...vaultForm, username: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700">Password / Secret *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••••••"
                      value={vaultForm.passwordText}
                      onChange={(e) => setVaultForm({ ...vaultForm, passwordText: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">Internal Security Notes</label>
                  <textarea
                    rows={2}
                    placeholder="2FA recovery codes, IP restrictions, server port..."
                    value={vaultForm.notes}
                    onChange={(e) => setVaultForm({ ...vaultForm, notes: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsVaultModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/20"
                >
                  Encrypt & Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Account Modal */}
      {isEditClientModalOpen && editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-900">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Pencil className="w-5 h-5 text-orange-600" />
                  Edit Client Profile: {editingClient.businessName}
                </h2>
                <p className="text-xs text-slate-500">Update client business specifications, billing details, and contact numbers.</p>
              </div>
              <button
                onClick={() => setIsEditClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateClient} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="overflow-y-auto flex-1 p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700">Business / Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acme Tech Solutions"
                    value={editClientForm.businessName}
                    onChange={(e) => setEditClientForm({ ...editClientForm, businessName: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Contact Person *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Rahul Sharma"
                      value={editClientForm.contactName}
                      onChange={(e) => setEditClientForm({ ...editClientForm, contactName: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">WhatsApp Phone *</label>
                    <input
                      type="tel"
                      required
                      placeholder="+91 98765 43210"
                      value={editClientForm.whatsappNumber}
                      onChange={(e) => setEditClientForm({ ...editClientForm, whatsappNumber: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="rahul@acme.com"
                      value={editClientForm.email}
                      onChange={(e) => setEditClientForm({ ...editClientForm, email: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700">Website URL</label>
                    <input
                      type="url"
                      placeholder="https://acme.com"
                      value={editClientForm.website}
                      onChange={(e) => setEditClientForm({ ...editClientForm, website: e.target.value })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700">Contract Type</label>
                    <select
                      value={editClientForm.clientType}
                      onChange={(e) => setEditClientForm({ ...editClientForm, clientType: e.target.value as ClientType })}
                      className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                    >
                      <option value="RECURRING_RETAINER">Recurring Monthly Retainer</option>
                      <option value="ONE_TIME_PROJECT">One-Time Milestone Project</option>
                    </select>
                  </div>

                  {editClientForm.clientType === 'RECURRING_RETAINER' ? (
                    <div>
                      <label className="text-xs font-bold text-slate-700">Monthly Retainer (₹ INR)</label>
                      <input
                        type="number"
                        placeholder="e.g. 185000"
                        value={editClientForm.monthlyRetainerAmount}
                        onChange={(e) => setEditClientForm({ ...editClientForm, monthlyRetainerAmount: e.target.value })}
                        className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 font-bold text-orange-600"
                      />
                    </div>
                  ) : (
                    <div>
                      <label className="text-xs font-bold text-slate-700">Billing Day</label>
                      <input
                        type="number"
                        placeholder="1"
                        value={editClientForm.billingCycleDay}
                        onChange={(e) => setEditClientForm({ ...editClientForm, billingCycleDay: e.target.value })}
                        className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
