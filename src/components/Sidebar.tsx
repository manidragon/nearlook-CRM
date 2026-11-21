'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FolderKanban,
  CheckSquare,
  ClipboardList,
  CalendarDays,
  Calendar,
  Users, 
  FileText,
  Boxes,
  Truck,
  Building,
  Landmark,
  Trash2,
  Lock,
  Sparkles,
  Receipt,
  UserCheck,
  ShieldCheck,
  FolderArchive
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

interface NavGroup {
  group: string;
  items: {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: string;
    moduleKey: string;
    requiresFinancials?: boolean;
    requiresAccounts?: boolean;
    requiresOwner?: boolean;
  }[];
}

export default function Sidebar() {
  const pathname = usePathname();
  const { currentStaff, isFieldStaff, hasModuleAccess, isOwnerOrAdmin, canManageUsers } = useAuth();
  const [recycleCount, setRecycleCount] = React.useState<number>(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState<number>(0);

  const fetchRecycleCount = () => {
    fetch('/api/recycle-bin')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.counts) setRecycleCount(d.counts.total);
      })
      .catch(() => {});
  };

  const fetchPendingApprovals = () => {
    fetch('/api/approvals')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.pendingCount !== undefined) {
          setPendingApprovalsCount(d.pendingCount);
        }
      })
      .catch(() => {});
  };

  React.useEffect(() => {
    fetchRecycleCount();
    fetchPendingApprovals();
    const handleUpdate = () => {
      fetchRecycleCount();
      fetchPendingApprovals();
    };
    window.addEventListener('crm-data-updated', handleUpdate);
    return () => window.removeEventListener('crm-data-updated', handleUpdate);
  }, []);

  const navGroups: NavGroup[] = [
    {
      group: 'Core Enterprise',
      items: [
        { label: 'Dashboard', href: '/', icon: LayoutDashboard, moduleKey: 'DASHBOARD' },
        { label: 'Projects', href: '/projects', icon: FolderKanban, badge: 'IT Ops', moduleKey: 'PROJECTS' },
        { label: 'Staff Portal', href: '/portal', icon: UserCheck, badge: 'My Desk', moduleKey: 'PORTAL' },
        ...(isOwnerOrAdmin ? [{ 
          label: 'Owner Approvals', 
          href: '/approvals', 
          icon: ShieldCheck, 
          badge: pendingApprovalsCount > 0 ? `${pendingApprovalsCount} PENDING` : 'Queue', 
          moduleKey: 'APPROVALS',
          requiresOwner: true 
        }] : []),
      ],
    },
    {
      group: 'Execution & Workflows',
      items: [
        { label: 'Tasks & Milestones', href: '/tasks', icon: CheckSquare, moduleKey: 'TASKS' },
        { label: 'Workflow Calendar', href: '/workflow-calendar', icon: Calendar, badge: 'Workflows', moduleKey: 'WORKFLOW_CALENDAR' },
        { label: 'Client Meetings', href: '/calendar', icon: CalendarDays, badge: 'Schedule', moduleKey: 'CALENDAR' },
        { label: 'Daily Task Report', href: '/daily-reports', icon: ClipboardList, badge: 'DPR', moduleKey: 'DPR' },
      ],
    },
    {
      group: 'Sales & Commercials',
      items: [
        { label: 'Leads & Pipeline', href: '/leads', icon: Users, badge: 'Pipeline', moduleKey: 'LEADS' },
        { label: 'Client Quotations', href: '/quotations', icon: FileText, requiresAccounts: true, moduleKey: 'QUOTATIONS' },
        { label: 'Client Billing & Invoices', href: '/billing', icon: Receipt, badge: 'Invoices', moduleKey: 'BILLING' },
      ],
    },
    {
      group: 'Stores & Procurement',
      items: [
        { label: 'Materials & Inventory', href: '/inventory', icon: Boxes, badge: 'IT Assets', moduleKey: 'INVENTORY' },
        { label: 'Vendor & Influencers', href: '/vendors', icon: Truck, badge: 'Payables', moduleKey: 'VENDORS' },
      ],
    },
    {
      group: 'Finance & Accounting',
      items: [
        { label: 'Office Expenses & Staff', href: '/office', icon: Building, requiresFinancials: true, moduleKey: 'OFFICE' },
        { label: 'Double-Entry Accounting', href: '/accounts', icon: Landmark, badge: 'Tally', requiresFinancials: true, moduleKey: 'ACCOUNTS' },
        { label: 'User & Permissions', href: '/staff', icon: Users, badge: 'Roles', moduleKey: 'STAFF' },
      ],
    },
    {
      group: 'System Vault & Documents',
      items: [
        { label: 'Client Document Vault', href: '/vault', icon: FolderArchive, badge: 'Docs', moduleKey: 'VAULT' },
        { 
          label: 'Recycle Bin', 
          href: '/recycle-bin', 
          icon: Trash2, 
          badge: recycleCount > 0 ? `${recycleCount}` : undefined,
          moduleKey: 'RECYCLE_BIN' 
        },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen fixed left-0 top-0 z-40 text-slate-300 shadow-xl">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/70">
        <Link href="/" className="block group">
          <div className="bg-white rounded-xl p-2.5 flex items-center justify-center shadow-md shadow-orange-500/10 border border-slate-200/20 group-hover:border-orange-500/50 group-hover:shadow-orange-500/20 transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src="/logo.png" 
              alt="Nearlook Mart Pvt Ltd" 
              className="h-10 w-auto max-w-full object-contain" 
            />
          </div>
        </Link>
        <div className="flex items-center justify-between px-1 pt-2.5 text-[10px] text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            IT ERP & CRM
          </span>
          <span className="text-amber-400 font-mono tracking-wider font-bold">ENTERPRISE</span>
        </div>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
        {navGroups.map((group) => (
          <div key={group.group} className="space-y-1">
            <div className="px-3 pb-1 text-[10px] font-extrabold tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>{group.group}</span>
            </div>

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              // Check Owner-only requirements
              if (item.requiresOwner && !isOwnerOrAdmin) {
                return null;
              }

              // Check Granular Module Permissions
              if (!isOwnerOrAdmin && !hasModuleAccess(item.moduleKey)) {
                return null;
              }

              // RBAC Filtering for Field Staff
              if (item.requiresFinancials && isFieldStaff) {
                return (
                  <div
                    key={item.href}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-600 cursor-not-allowed select-none"
                    title="Restricted: Field Staff cannot access financials"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-slate-600" />
                      <span>{item.label}</span>
                    </div>
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                );
              }

              if (item.requiresAccounts && isFieldStaff) {
                return null;
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950 font-bold' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive 
                        ? 'bg-slate-950/20 text-slate-950' 
                        : item.badge?.includes('PENDING')
                          ? 'bg-amber-500 text-slate-950 font-black animate-pulse'
                          : item.badge === 'Tally' 
                            ? 'bg-purple-900/60 text-purple-300 border border-purple-700/50'
                            : 'bg-slate-800 text-amber-400 border border-slate-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User profile footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-400 text-xs">
            {currentStaff.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="overflow-hidden">
            <div className="text-xs font-bold text-slate-200 truncate">{currentStaff.name}</div>
            <div className="text-[10px] text-amber-400/90 font-medium uppercase truncate">{currentStaff.role.replace(/_/g, ' ')}</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
