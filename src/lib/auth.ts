import { StaffMember, StaffRole } from './types';

export interface ModulePermission {
  key: string;
  label: string;
  description: string;
  path: string;
}

export const ALL_MODULE_KEYS: ModulePermission[] = [
  { key: 'DASHBOARD', label: 'Executive Dashboard', description: 'Overview, KPI stats & revenue', path: '/' },
  { key: 'PROJECTS', label: 'Client Projects & IT Ops', description: 'Projects, milestones, SOW & financials', path: '/projects' },
  { key: 'TASKS', label: 'Tasks & Milestones', description: 'Task board, issue tracking & status sync', path: '/tasks' },
  { key: 'WORKFLOW_CALENDAR', label: 'Task & Milestone Workflow Calendar', description: 'Task deadlines, per-user sync & proof uploads', path: '/workflow-calendar' },
  { key: 'CALENDAR', label: 'Appointments & Meetings', description: 'Client meetings & video consultations', path: '/calendar' },
  { key: 'DPR', label: 'Daily Task Report (DPR / Standup)', description: 'Daily standup, hours & blocker logs', path: '/daily-reports' },
  { key: 'LEADS', label: 'Leads & Dynamic Pipeline', description: 'Lead tracking, deal value & stages', path: '/leads' },
  { key: 'QUOTATIONS', label: 'Client Quotations', description: 'Proposals, scope & negotiations', path: '/quotations' },
  { key: 'BILLING', label: 'Client Billing & Master Invoices', description: 'Invoices, milestones & payment receipts', path: '/billing' },
  { key: 'INVENTORY', label: 'Materials & IT Assets Inventory', description: 'Hardware assets, licenses & stock', path: '/inventory' },
  { key: 'VENDORS', label: 'Vendor & Influencer Payables', description: 'Vendor invoices & disbursements', path: '/vendors' },
  { key: 'OFFICE', label: 'Office Expenses & Staff Payouts', description: 'Operational expenses & payroll', path: '/office' },
  { key: 'ACCOUNTS', label: 'Double-Entry Accounting Tally', description: 'Ledgers, Daybook & balance sheet', path: '/accounts' },
  { key: 'STAFF', label: 'User & Staff Management', description: 'Team directory, roles & permissions', path: '/staff' },
  { key: 'APPROVALS', label: 'Owner Approvals Hub', description: 'Maker-checker financial & leave approvals', path: '/approvals' },
  { key: 'VAULT', label: 'Client Document Upload Vault', description: 'Contracts, NDAs & on-demand sharing', path: '/vault' },
  { key: 'PORTAL', label: 'Staff Access / My Portal', description: 'My tasks, attendance, payslips & leaves', path: '/portal' },
  { key: 'RECYCLE_BIN', label: 'System Recycle Bin', description: 'Audit log & deleted entity recovery', path: '/recycle-bin' },
];

export const ALL_MODULE_KEY_STRINGS = ALL_MODULE_KEYS.map(m => m.key);

// Predefined Demo Profiles for instant RBAC switching
export const DEMO_PROFILES: StaffMember[] = [
  {
    id: 'staff-1',
    userId: 'STF-101',
    password: 'Arun#Owner2026!',
    name: 'Arun',
    email: 'arun@nearlook.com',
    phone: '+919876543201',
    address: '42 MG Road, Indiranagar, Bengaluru, KA',
    monthlySalary: 0,
    hourlyRate: 0,
    role: 'OWNER',
    team: 'MANAGEMENT',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: [],
    canManageUsers: true,
    allowedModules: [...ALL_MODULE_KEY_STRINGS]
  },
  {
    id: 'staff-acc',
    userId: 'STF-102',
    password: 'Michael#Acc2026!',
    name: 'Michael Patel',
    email: 'michael.accounts@nearlook.com',
    phone: '+919876543208',
    address: '15 Anna Salai, Guindy, Chennai, TN',
    monthlySalary: 0,
    hourlyRate: 0,
    role: 'ACCOUNT_MANAGER',
    team: 'ACCOUNTS',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: [],
    canManageUsers: false,
    allowedModules: ['DASHBOARD', 'PROJECTS', 'QUOTATIONS', 'BILLING', 'OFFICE', 'ACCOUNTS', 'VENDORS', 'PORTAL', 'VAULT', 'TASKS', 'CALENDAR', 'DPR']
  },
  {
    id: 'staff-3',
    userId: 'STF-103',
    password: 'David#Dev2026!',
    name: 'David Chen',
    email: 'david@nearlook.com',
    phone: '+919876543203',
    address: '88 Hitech City Rd, Madhapur, Hyderabad, TS',
    monthlySalary: 0,
    hourlyRate: 0,
    role: 'DEVELOPER',
    team: 'WEB_DEVELOPMENT',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: [],
    canManageUsers: false,
    allowedModules: ['DASHBOARD', 'PROJECTS', 'TASKS', 'WORKFLOW_CALENDAR', 'DPR', 'PORTAL']
  },
  {
    id: 'staff-4',
    userId: 'STF-104',
    password: 'Priya#Mkt2026!',
    name: 'Priya Sharma',
    email: 'priya@nearlook.com',
    phone: '+919876543204',
    address: '21 Linking Road, Bandra West, Mumbai, MH',
    monthlySalary: 0,
    hourlyRate: 0,
    role: 'MARKETER',
    team: 'MARKETING',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: [],
    canManageUsers: false,
    allowedModules: ['DASHBOARD', 'LEADS', 'TASKS', 'WORKFLOW_CALENDAR', 'DPR', 'PORTAL', 'VAULT']
  },
  {
    id: 'staff-rahul',
    userId: 'STF-108',
    password: 'Rahul#Dev2026!',
    name: 'Rahul Sen',
    email: 'rahul@nearlook.com',
    phone: '+919876543207',
    address: '29 Koramangala 4th Block, Bengaluru, KA',
    monthlySalary: 0,
    hourlyRate: 0,
    role: 'DEVELOPER',
    team: 'WEB_DEVELOPMENT',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: [],
    canManageUsers: false,
    allowedModules: ['DASHBOARD', 'PROJECTS', 'TASKS', 'WORKFLOW_CALENDAR', 'DPR', 'PORTAL']
  },
  {
    id: 'staff-vikram',
    userId: 'STF-109',
    password: 'Vikram#Ops2026!',
    name: 'Vikram Malhotra',
    email: 'vikram@nearlook.com',
    phone: '+919876543209',
    address: '88 MG Road, Pune, MH',
    monthlySalary: 0,
    hourlyRate: 0,
    role: 'FIELD_STAFF',
    team: 'FIELD_STAFF',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: [],
    canManageUsers: false,
    allowedModules: ['DASHBOARD', 'TASKS', 'WORKFLOW_CALENDAR', 'DPR', 'PORTAL']
  }
];

// RBAC Rules & Permission Checkers
export const RBAC = {
  isOwnerOrAdmin: (role: StaffRole): boolean => {
    return role === 'ADMIN' || role === 'OWNER';
  },

  // Maker-checker rule: Account Managers entering financial data need Owner approval
  requiresOwnerApproval: (role: StaffRole): boolean => {
    return role === 'ACCOUNT_MANAGER';
  },

  // Can view financial cards, deal values, P&L, revenue, invoices
  canViewFinancials: (role: StaffRole): boolean => {
    return role === 'ADMIN' || role === 'OWNER' || role === 'ACCOUNT_MANAGER';
  },

  // Can view and create Quotations, Invoices, Payment Collection
  canManageAccounts: (role: StaffRole): boolean => {
    return role === 'ADMIN' || role === 'OWNER' || role === 'ACCOUNT_MANAGER';
  },

  // Can onboard new staff, set salaries, and view all system credentials
  canManageStaff: (role: StaffRole, canManageUsersFlag?: boolean): boolean => {
    if (role === 'ADMIN' || role === 'OWNER') return true;
    return Boolean(canManageUsersFlag);
  },

  // Check if staff has granular access to a specific module
  hasModulePermission: (staff: StaffMember, moduleKey: string): boolean => {
    if (staff.role === 'ADMIN' || staff.role === 'OWNER') return true;
    if (!staff.allowedModules || staff.allowedModules.length === 0) {
      // Fallback role defaults
      if (moduleKey === 'PORTAL' || moduleKey === 'DASHBOARD') return true;
      if (staff.role === 'ACCOUNT_MANAGER') {
        return ['DASHBOARD', 'PROJECTS', 'QUOTATIONS', 'BILLING', 'OFFICE', 'ACCOUNTS', 'VENDORS', 'PORTAL', 'VAULT'].includes(moduleKey);
      }
      return ['DASHBOARD', 'TASKS', 'WORKFLOW_CALENDAR', 'DPR', 'PORTAL'].includes(moduleKey);
    }
    return staff.allowedModules.includes(moduleKey);
  },

  // Can view consultation notes: Only Admin, Owner, or specifically assigned staff member
  canViewConsultationNotes: (role: StaffRole, assignedStaffId?: string, currentStaffId?: string): boolean => {
    if (role === 'ADMIN' || role === 'OWNER') return true;
    if (assignedStaffId && currentStaffId && assignedStaffId === currentStaffId) return true;
    return false;
  },

  // Field staff / Developers can ONLY view assigned tasks/projects and update statuses
  isRestrictedFieldStaff: (role: StaffRole): boolean => {
    return role === 'DEVELOPER' || role === 'FIELD_STAFF' || role === 'DESIGNER' || role === 'CONTENT_WRITER';
  }
};
