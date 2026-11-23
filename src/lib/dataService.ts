import {
  StaffMember, Lead, Client, VaultCredential, Task, Invoice, Expense, DashboardMetrics, WhatsAppLog,
  RecurringInterval, AgencyService, Quotation, PaymentReceipt, SocialMediaTask, AttendanceRecord,
  MonthlyWorkCalendar, Vendor, StaffTeam, StaffRole, GSTType, ConsultationNote, Project,
  TaskStatus, TaskPriority, ServiceType, CredentialCategory, RecycleBinItem, RecycleBinEntityType,
  Appointment, AppointmentType, AppointmentLocation, AppointmentStatus,
  DailyReport, ITInventoryItem, AccountHead, JournalVoucher, JournalLine, ExpenseCategory,
  InvoicePaymentInstallment, InvoiceStatus, LeaveApplication, LeaveType, LeaveStatus,
  FinancialApprovalItem, FinancialApprovalType, FinancialApprovalStatus, ClientDocument,
  ClientDocCategory, TaskProofFile, Influencer
} from './types';
import { encryptCredential, decryptCredential } from './crypto';
import {
  inMemoryWhatsAppLogs,
  triggerStaffTaskAssignedWhatsApp,
  triggerContentApprovalWhatsApp,
  triggerLeadWelcomeWhatsApp,
  triggerRetainerInvoiceWhatsApp,
  triggerPaymentDueReminderWhatsApp,
  triggerQuotationWhatsApp,
  triggerTaskStatusUpdateWhatsApp,
  triggerPaymentReceiptWhatsApp,
  triggerWeeklyOverdueInterestWhatsApp,
  triggerVendorPaymentWhatsApp
} from './whatsappService';
import { DEMO_PROFILES } from './auth';
import { loadStoreFromDisk, saveStoreToDisk, PersistentCRMStore } from './storage';

export interface ClientPL {
  clientId: string;
  clientName: string;
  clientType: string;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
}

/**
 * Automatically computes statutory Financial Year (April 1 to March 31) 2-digit suffix.
 * e.g., November 2026 -> '26' (for FY 2026-27), April 1, 2027 -> '27' (for FY 2027-28).
 * Never hardcoded. Resets and rolls over automatically on April 1 of each year.
 */
export function getFinancialYearSuffix(date: Date = new Date()): string {
  const d = date instanceof Date ? date : new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0 is January, 3 is April
  const fyStartYear = month >= 3 ? year : year - 1;
  return String(fyStartYear % 100).padStart(2, '0');
}

// Pre-seeded Staff with Login Credentials, Salaries & Documents (Configured for team assignment)
let staffList: StaffMember[] = [
  ...DEMO_PROFILES,
  {
    id: 'staff-2',
    userId: 'STF-105',
    password: 'Alex#PM2026!',
    name: 'Alex Rivera',
    email: 'alex@nearlook.com',
    phone: '+919876543202',
    address: '102 Indiranagar 100ft Rd, Bengaluru, KA',
    monthlySalary: 85000,
    hourlyRate: 2200,
    role: 'PROJECT_MANAGER',
    team: 'MANAGEMENT',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: []
  },
  {
    id: 'staff-5',
    userId: 'STF-106',
    password: 'Maya#Design2026!',
    name: 'Maya Lin',
    email: 'maya@nearlook.com',
    phone: '+919876543205',
    address: '77 Koregaon Park, Pune, MH',
    monthlySalary: 55000,
    hourlyRate: 1600,
    role: 'DESIGNER',
    team: 'DESIGN',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: []
  },
  {
    id: 'staff-6',
    userId: 'STF-107',
    password: 'Liam#Content2026!',
    name: 'Liam O\'Connor',
    email: 'liam@nearlook.com',
    phone: '+919876543206',
    address: '54 Jubilee Hills, Hyderabad, TS',
    monthlySalary: 50000,
    hourlyRate: 1400,
    role: 'CONTENT_WRITER',
    team: 'CONTENT',
    status: 'ACTIVE',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    activeTasksCount: 0,
    totalProjectsWorked: 0,
    onTimeCompletionRate: 100,
    overdueCount: 0,
    salaryPaidDate: 'Pending Cycle',
    isSalaryOverdue: false,
    documents: []
  }
];

// Clean Live Lists (Fresh Start - Zero Mock Entry Data)
let leadsList: Lead[] = [];
let quotationsList: Quotation[] = [];
let clientsList: Client[] = [];
let projectsList: Project[] = [];
let receiptsList: PaymentReceipt[] = [];
let tasksList: Task[] = [];
let socialMediaTasksList: SocialMediaTask[] = [];

let workCalendar: MonthlyWorkCalendar = {
  id: `cal-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  yearMonth: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  workingDaysCount: 25,
  holidays: [],
  updatedAt: new Date().toISOString()
};

let attendanceList: AttendanceRecord[] = [];
let invoicesList: Invoice[] = [];
let vendorsList: Vendor[] = [];
let expensesList: Expense[] = [];

// Agency Services List (Software, Web Development, AI Automation, Social Media Marketing)
let agencyServicesList: AgencyService[] = [
  { id: 'SOFTWARE_DEV', label: 'Software Development (Custom SaaS, Mobile & Desktop Apps)' },
  { id: 'WEB_DEV', label: 'Web Development (Next.js, React, Full-Stack, Shopify)' },
  { id: 'AI_AUTOMATION', label: 'AI Automation (Workflows, LLMs, Voice & Chatbots)' },
  { id: 'SOCIAL_MEDIA', label: 'Social Media Marketing (Instagram, LinkedIn, Influencer Campaigns)' },
  { id: 'SEO', label: 'SEO & Organic Growth Engineering' },
  { id: 'PERFORMANCE_ADS', label: 'Performance Ads (Meta Ads, Google Ads)' },
  { id: 'BRANDING', label: 'Branding & UI/UX Design System' },
  { id: 'FULL_SUITE', label: 'Enterprise Full-Suite Retainer' }
];

let credentialsVault: VaultCredential[] = [];
let recycleBinList: RecycleBinItem[] = [];
let dailyReportsList: DailyReport[] = [];
let itInventoryList: ITInventoryItem[] = [];
let appointmentsList: Appointment[] = [];

// Chart of Accounts (COA - Indian Tally Double-Entry Format, all starting at ₹0 balance)
let chartOfAccountsList: AccountHead[] = [
  // 1000 - ASSETS
  { code: '1010', name: 'Cash in Hand (Petty Cash)', type: 'ASSET', subtype: 'Current Assets', balance: 0 },
  { code: '1020', name: 'HDFC Bank - Current A/C (Operating)', type: 'ASSET', subtype: 'Bank Accounts', balance: 0 },
  { code: '1030', name: 'ICICI Bank - Corporate A/C (Tax & Reserve)', type: 'ASSET', subtype: 'Bank Accounts', balance: 0 },
  { code: '1040', name: 'Sundry Debtors (Client Receivables)', type: 'ASSET', subtype: 'Current Assets', balance: 0 },
  { code: '1050', name: 'Computer & Workstation Assets (Macs, Monitors)', type: 'ASSET', subtype: 'Fixed Assets', balance: 0 },
  // 2000 - LIABILITIES
  { code: '2010', name: 'Sundry Creditors (Tech & Cloud Vendors)', type: 'LIABILITY', subtype: 'Current Liabilities', balance: 0 },
  { code: '2020', name: 'Influencer & Freelancer Payables', type: 'LIABILITY', subtype: 'Current Liabilities', balance: 0 },
  { code: '2030', name: 'Output CGST 9% Payable', type: 'LIABILITY', subtype: 'Duties & Taxes', balance: 0 },
  { code: '2040', name: 'Output SGST 9% Payable', type: 'LIABILITY', subtype: 'Duties & Taxes', balance: 0 },
  { code: '2050', name: 'TDS Payable (Sec 194J / 194C)', type: 'LIABILITY', subtype: 'Duties & Taxes', balance: 0 },
  { code: '2060', name: 'Corporate Loans & Director Borrowings', type: 'LIABILITY', subtype: 'Loans & Borrowings', balance: 0 },
  // 3000 - EQUITY
  { code: '3010', name: 'Partner / Founder Capital', type: 'EQUITY', subtype: 'Capital Account', balance: 0 },
  { code: '3020', name: 'Retained Agency Earnings', type: 'EQUITY', subtype: 'Reserves & Surplus', balance: 0 },
  // 4000 - REVENUE
  { code: '4010', name: 'Software Development & SaaS Engineering Fees', type: 'REVENUE', subtype: 'Direct Income', balance: 0 },
  { code: '4020', name: 'Web Application & E-Commerce Retainers', type: 'REVENUE', subtype: 'Direct Income', balance: 0 },
  { code: '4030', name: 'AI Automation & Custom Agent Workflows', type: 'REVENUE', subtype: 'Direct Income', balance: 0 },
  { code: '4040', name: 'Social Media Management & Growth Services', type: 'REVENUE', subtype: 'Direct Income', balance: 0 },
  // 5000 - DIRECT EXPENSES
  { code: '5010', name: 'AWS & Cloudways Dedicated Server Infrastructure', type: 'EXPENSE', subtype: 'Direct Expenses', balance: 0 },
  { code: '5020', name: 'OpenAI & Claude LLM Token Quotas', type: 'EXPENSE', subtype: 'Direct Expenses', balance: 0 },
  { code: '5030', name: 'Freelancer Python & LangChain Developer Payouts', type: 'EXPENSE', subtype: 'Direct Expenses', balance: 0 },
  { code: '5040', name: 'Social Media Influencer Promotion Campaign Fees', type: 'EXPENSE', subtype: 'Direct Expenses', balance: 0 },
  // 6000 - INDIRECT & OFFICE EXPENSES
  { code: '6010', name: 'Office Facility Lease Rent (Tech Hub Tower)', type: 'EXPENSE', subtype: 'Indirect Expenses', balance: 0 },
  { code: '6020', name: 'Bescom Commercial Power & EB Bill', type: 'EXPENSE', subtype: 'Indirect Expenses', balance: 0 },
  { code: '6030', name: 'Team Pantry, Coffee & Working Refreshments', type: 'EXPENSE', subtype: 'Indirect Expenses', balance: 0 },
  { code: '6040', name: 'Core Engineering & Design Staff Salaries', type: 'EXPENSE', subtype: 'Indirect Expenses', balance: 0 }
];

let journalVouchersList: JournalVoucher[] = [];
let leaveApplicationsList: LeaveApplication[] = [];
let financialApprovalsList: FinancialApprovalItem[] = [];
let clientDocumentsList: ClientDocument[] = [];
let influencersList: Influencer[] = [
  {
    id: 'inf-1',
    name: 'Arun Vlogs',
    handle: '@tech_arun',
    platform: 'Instagram',
    phone: '+91 98450 12345',
    email: 'arun.creators@gmail.com',
    category: 'Technology & SaaS',
    followersCount: '125K',
    standardRate: 15000,
    upiId: 'arunvlogs@oksbi',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'inf-2',
    name: 'Priya Trends',
    handle: '@priya_trends',
    platform: 'Instagram',
    phone: '+91 98765 43210',
    email: 'priya.trends@gmail.com',
    category: 'Lifestyle & E-Commerce',
    followersCount: '240K',
    standardRate: 25000,
    upiId: 'priyatrends@okhdfcbank',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

function moveToRecycleBin(
  originalId: string,
  entityType: RecycleBinEntityType,
  title: string,
  subtitle: string | undefined,
  data: any,
  deletedBy?: string,
  details?: Record<string, any>
): RecycleBinItem {
  const binItem: RecycleBinItem = {
    id: `rb-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    originalId,
    entityType,
    title,
    subtitle,
    deletedAt: new Date().toISOString(),
    deletedBy: deletedBy || 'Arun (Owner)',
    data: JSON.parse(JSON.stringify(data)),
    details
  };
  recycleBinList.unshift(binItem);
  persistStore();
  return binItem;
}

// ============================================================================
// GLOBAL SINGLETON STORE & PERMANENT DISK STORAGE
// ============================================================================
const _g = globalThis as any;

if (!_g.__NEARLOOK_CRM_STORE__) {
  const diskData = loadStoreFromDisk();
  if (diskData) {
    if (Array.isArray(diskData.staffList) && diskData.staffList.length > 0) staffList = diskData.staffList;
    if (Array.isArray(diskData.leadsList)) leadsList = diskData.leadsList;
    if (Array.isArray(diskData.quotationsList)) quotationsList = diskData.quotationsList;
    if (Array.isArray(diskData.clientsList)) clientsList = diskData.clientsList;
    if (Array.isArray(diskData.projectsList)) projectsList = diskData.projectsList;
    if (Array.isArray(diskData.tasksList)) tasksList = diskData.tasksList;
    if (Array.isArray(diskData.invoicesList)) invoicesList = diskData.invoicesList;
    if (Array.isArray(diskData.expensesList)) expensesList = diskData.expensesList;
    if (Array.isArray(diskData.vendorsList)) vendorsList = diskData.vendorsList;
    if (Array.isArray(diskData.agencyServicesList) && diskData.agencyServicesList.length > 0) agencyServicesList = diskData.agencyServicesList;
    if (Array.isArray(diskData.credentialsVault)) credentialsVault = diskData.credentialsVault;
    if (diskData.workCalendar) workCalendar = diskData.workCalendar;
    if (Array.isArray(diskData.attendanceList)) attendanceList = diskData.attendanceList;
    if (Array.isArray(diskData.receiptsList)) receiptsList = diskData.receiptsList;
    if (Array.isArray(diskData.socialMediaTasksList)) socialMediaTasksList = diskData.socialMediaTasksList;
    if (Array.isArray(diskData.dailyReportsList)) dailyReportsList = diskData.dailyReportsList;
    if (Array.isArray(diskData.itInventoryList)) itInventoryList = diskData.itInventoryList;
    if (Array.isArray(diskData.chartOfAccountsList) && diskData.chartOfAccountsList.length > 0) chartOfAccountsList = diskData.chartOfAccountsList;
    if (Array.isArray(diskData.journalVouchersList)) journalVouchersList = diskData.journalVouchersList;
    if (Array.isArray(diskData.appointmentsList)) appointmentsList = diskData.appointmentsList;
    if (Array.isArray(diskData.recycleBinList)) recycleBinList = diskData.recycleBinList;
    if (Array.isArray(diskData.leaveApplicationsList)) leaveApplicationsList = diskData.leaveApplicationsList;
    if (Array.isArray(diskData.financialApprovalsList)) financialApprovalsList = diskData.financialApprovalsList;
    if (Array.isArray(diskData.clientDocumentsList)) clientDocumentsList = diskData.clientDocumentsList;
    if (Array.isArray(diskData.influencersList) && diskData.influencersList.length > 0) influencersList = diskData.influencersList;
  }

  _g.__NEARLOOK_CRM_STORE__ = {
    staffList,
    leadsList,
    quotationsList,
    clientsList,
    projectsList,
    tasksList,
    invoicesList,
    expensesList,
    vendorsList,
    agencyServicesList,
    credentialsVault,
    workCalendar,
    attendanceList,
    receiptsList,
    socialMediaTasksList,
    dailyReportsList,
    itInventoryList,
    chartOfAccountsList,
    journalVouchersList,
    appointmentsList,
    whatsAppLogs: inMemoryWhatsAppLogs,
    recycleBinList,
    leaveApplicationsList,
    financialApprovalsList,
    clientDocumentsList,
    influencersList
  };

  // If initial run and no store on disk, write seed store now
  if (!diskData) {
    saveStoreToDisk(_g.__NEARLOOK_CRM_STORE__);
  }
}

// Point all module references to the unified global store
staffList = _g.__NEARLOOK_CRM_STORE__.staffList;
leadsList = _g.__NEARLOOK_CRM_STORE__.leadsList;
quotationsList = _g.__NEARLOOK_CRM_STORE__.quotationsList;
clientsList = _g.__NEARLOOK_CRM_STORE__.clientsList;
projectsList = _g.__NEARLOOK_CRM_STORE__.projectsList;
tasksList = _g.__NEARLOOK_CRM_STORE__.tasksList;
invoicesList = _g.__NEARLOOK_CRM_STORE__.invoicesList;
expensesList = _g.__NEARLOOK_CRM_STORE__.expensesList;
vendorsList = _g.__NEARLOOK_CRM_STORE__.vendorsList;
agencyServicesList = _g.__NEARLOOK_CRM_STORE__.agencyServicesList;
credentialsVault = _g.__NEARLOOK_CRM_STORE__.credentialsVault;
workCalendar = _g.__NEARLOOK_CRM_STORE__.workCalendar;
attendanceList = _g.__NEARLOOK_CRM_STORE__.attendanceList;
receiptsList = _g.__NEARLOOK_CRM_STORE__.receiptsList;
socialMediaTasksList = _g.__NEARLOOK_CRM_STORE__.socialMediaTasksList;
dailyReportsList = _g.__NEARLOOK_CRM_STORE__.dailyReportsList;
itInventoryList = _g.__NEARLOOK_CRM_STORE__.itInventoryList;
chartOfAccountsList = _g.__NEARLOOK_CRM_STORE__.chartOfAccountsList;
journalVouchersList = _g.__NEARLOOK_CRM_STORE__.journalVouchersList;
appointmentsList = _g.__NEARLOOK_CRM_STORE__.appointmentsList || [];
recycleBinList = _g.__NEARLOOK_CRM_STORE__.recycleBinList;
leaveApplicationsList = _g.__NEARLOOK_CRM_STORE__.leaveApplicationsList || [];
financialApprovalsList = _g.__NEARLOOK_CRM_STORE__.financialApprovalsList || [];
clientDocumentsList = _g.__NEARLOOK_CRM_STORE__.clientDocumentsList || [];
influencersList = _g.__NEARLOOK_CRM_STORE__.influencersList || influencersList;

export function persistStore(): void {
  try {
    saveStoreToDisk({
      staffList: _g.__NEARLOOK_CRM_STORE__.staffList,
      leadsList: _g.__NEARLOOK_CRM_STORE__.leadsList,
      quotationsList: _g.__NEARLOOK_CRM_STORE__.quotationsList,
      clientsList: _g.__NEARLOOK_CRM_STORE__.clientsList,
      projectsList: _g.__NEARLOOK_CRM_STORE__.projectsList,
      tasksList: _g.__NEARLOOK_CRM_STORE__.tasksList,
      invoicesList: _g.__NEARLOOK_CRM_STORE__.invoicesList,
      expensesList: _g.__NEARLOOK_CRM_STORE__.expensesList,
      vendorsList: _g.__NEARLOOK_CRM_STORE__.vendorsList,
      agencyServicesList: _g.__NEARLOOK_CRM_STORE__.agencyServicesList,
      credentialsVault: _g.__NEARLOOK_CRM_STORE__.credentialsVault,
      workCalendar: _g.__NEARLOOK_CRM_STORE__.workCalendar,
      attendanceList: _g.__NEARLOOK_CRM_STORE__.attendanceList,
      receiptsList: _g.__NEARLOOK_CRM_STORE__.receiptsList,
      socialMediaTasksList: _g.__NEARLOOK_CRM_STORE__.socialMediaTasksList,
      dailyReportsList: _g.__NEARLOOK_CRM_STORE__.dailyReportsList,
      itInventoryList: _g.__NEARLOOK_CRM_STORE__.itInventoryList,
      chartOfAccountsList: _g.__NEARLOOK_CRM_STORE__.chartOfAccountsList,
      journalVouchersList: _g.__NEARLOOK_CRM_STORE__.journalVouchersList,
      appointmentsList: _g.__NEARLOOK_CRM_STORE__.appointmentsList,
      whatsAppLogs: _g.__NEARLOOK_CRM_STORE__.whatsAppLogs || inMemoryWhatsAppLogs,
      recycleBinList: _g.__NEARLOOK_CRM_STORE__.recycleBinList,
      leaveApplicationsList: _g.__NEARLOOK_CRM_STORE__.leaveApplicationsList,
      financialApprovalsList: _g.__NEARLOOK_CRM_STORE__.financialApprovalsList,
      clientDocumentsList: _g.__NEARLOOK_CRM_STORE__.clientDocumentsList,
      influencersList: _g.__NEARLOOK_CRM_STORE__.influencersList || influencersList
    });
  } catch (err) {
    console.error('persistStore failed:', err);
  }
}

const rawDataService = {
  // Staff & Onboarding
  getStaff: () => {
    return staffList.map(s => ({
      ...s,
      activeTasksCount: tasksList.filter(t => t.assignedStaffId === s.id && t.status !== 'COMPLETED').length
    }));
  },

  addStaff: (data: {
    name: string;
    email: string;
    phone: string;
    address: string;
    monthlySalary: number;
    role: StaffRole;
    team: StaffTeam;
    hourlyRate?: number;
    documents?: { type: any; name: string }[];
    shiftTiming?: string;
    deductionsPerAbsence?: number;
    allowedModules?: string[];
    canManageUsers?: boolean;
  }) => {
    const nextNum = staffList.length + 101;
    const generatedUserId = `STF-${nextNum}`;
    const generatedPassword = `${data.name.split(' ')[0]}#Nearlook${Math.floor(1000 + Math.random() * 9000)}!`;

    const newStaff: StaffMember = {
      id: `staff-${Date.now()}`,
      userId: generatedUserId,
      password: generatedPassword,
      name: data.name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      monthlySalary: Number(data.monthlySalary) || 45000,
      hourlyRate: Number(data.hourlyRate) || Math.round((Number(data.monthlySalary) || 45000) / (25 * 8)),
      role: data.role,
      team: data.team,
      status: 'ACTIVE',
      avatar: `https://images.unsplash.com/photo-${1500000000000 + (staffList.length * 1000000)}?w=150`,
      activeTasksCount: 0,
      totalProjectsWorked: 0,
      onTimeCompletionRate: 100,
      overdueCount: 0,
      salaryPaidDate: 'Pending Cycle',
      isSalaryOverdue: false,
      shiftTiming: data.shiftTiming || '09:30 AM - 07:30 PM (Standard Slot)',
      deductionsPerAbsence: data.deductionsPerAbsence || Math.round((Number(data.monthlySalary) || 45000) / 30),
      allowedModules: data.allowedModules || ['DASHBOARD', 'TASKS', 'WORKFLOW_CALENDAR', 'DPR', 'PORTAL'],
      canManageUsers: Boolean(data.canManageUsers),
      documents: (data.documents || []).map((d, i) => ({
        id: `doc-${Date.now()}-${i}`,
        type: d.type || 'RESUME',
        name: d.name,
        uploadedAt: new Date().toISOString().split('T')[0]
      }))
    };

    staffList.push(newStaff);
    return newStaff;
  },

  updateStaff: (id: string, data: Partial<StaffMember>) => {
    const staff = staffList.find(s => s.id === id);
    if (!staff) return null;
    Object.assign(staff, data);
    return staff;
  },

  updateStaffProfile: (id: string, data: Partial<StaffMember>) => {
    const staff = staffList.find(s => s.id === id);
    if (!staff) return null;
    if (data.name) staff.name = data.name;
    if (data.email) staff.email = data.email;
    if (data.phone) staff.phone = data.phone;
    if (data.address) staff.address = data.address;
    if (data.avatar) staff.avatar = data.avatar;
    if (data.role) staff.role = data.role;
    if (data.team) staff.team = data.team;
    if (data.shiftTiming) staff.shiftTiming = data.shiftTiming;
    if (data.allowedModules) staff.allowedModules = data.allowedModules;
    if (data.canManageUsers !== undefined) staff.canManageUsers = data.canManageUsers;
    return staff;
  },

  // Leave Management & Approvals
  getLeaveApplications: (staffId?: string) => {
    if (staffId && staffId !== 'ALL') {
      return leaveApplicationsList.filter(l => l.staffId === staffId);
    }
    return [...leaveApplicationsList];
  },

  applyForLeave: (data: {
    staffId: string;
    staffName: string;
    staffRole: StaffRole;
    staffEmail?: string;
    startDate: string;
    endDate: string;
    daysCount: number;
    leaveType: LeaveType;
    reason: string;
  }) => {
    const newLeave: LeaveApplication = {
      id: `leave-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      staffId: data.staffId,
      staffName: data.staffName,
      staffRole: data.staffRole,
      staffEmail: data.staffEmail,
      startDate: data.startDate,
      endDate: data.endDate,
      daysCount: Number(data.daysCount) || 1,
      leaveType: data.leaveType,
      reason: data.reason,
      status: 'PENDING',
      appliedAt: new Date().toISOString()
    };
    leaveApplicationsList.unshift(newLeave);
    return newLeave;
  },

  reviewLeaveApplication: (
    id: string,
    status: 'APPROVED' | 'REJECTED',
    reviewerStaff: StaffMember,
    reviewNotes?: string
  ) => {
    const leave = leaveApplicationsList.find(l => l.id === id);
    if (!leave) return null;

    leave.status = status;
    leave.reviewedByStaffId = reviewerStaff.id;
    leave.reviewedByStaffName = reviewerStaff.name;
    leave.reviewNotes = reviewNotes || (status === 'APPROVED' ? 'Approved by Owner/Admin' : 'Rejected by Owner/Admin');
    leave.reviewedAt = new Date().toISOString();

    // If APPROVED, reflect in attendance records!
    if (status === 'APPROVED') {
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const cur = new Date(start);
      while (cur <= end) {
        const dateStr = cur.toISOString().split('T')[0];
        const existing = attendanceList.find(a => a.staffId === leave.staffId && a.date === dateStr);
        if (existing) {
          existing.status = 'PRE_APPLIED_LEAVE';
          existing.reason = `Approved Leave: ${leave.leaveType} (${leave.reason})`;
          existing.isDeductionApplied = leave.leaveType === 'UNPAID';
        } else {
          attendanceList.unshift({
            id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            staffId: leave.staffId,
            staffName: leave.staffName,
            date: dateStr,
            status: 'PRE_APPLIED_LEAVE',
            reason: `Approved Leave: ${leave.leaveType} (${leave.reason})`,
            isDeductionApplied: leave.leaveType === 'UNPAID',
            deductionAmount: leave.leaveType === 'UNPAID' ? 1500 : 0,
            createdAt: new Date().toISOString()
          });
        }
        cur.setDate(cur.getDate() + 1);
      }
    }

    return leave;
  },

  // Maker-Checker Financial Approvals Hub
  getFinancialApprovals: (status?: FinancialApprovalStatus) => {
    if (status) {
      return financialApprovalsList.filter(a => a.status === status);
    }
    return [...financialApprovalsList];
  },

  submitFinancialApproval: (data: {
    type: FinancialApprovalType;
    title: string;
    amount: number;
    entityId: string;
    description: string;
    submittedByStaffId: string;
    submittedByStaffName: string;
    submittedByRole: StaffRole;
    payload: any;
  }) => {
    const item: FinancialApprovalItem = {
      id: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: data.type,
      title: data.title,
      amount: Number(data.amount) || 0,
      entityId: data.entityId,
      description: data.description,
      submittedByStaffId: data.submittedByStaffId,
      submittedByStaffName: data.submittedByStaffName,
      submittedByRole: data.submittedByRole,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
      payload: data.payload
    };
    financialApprovalsList.unshift(item);
    return item;
  },

  approveFinancialApproval: async (id: string, ownerStaff: StaffMember) => {
    const approval = financialApprovalsList.find(a => a.id === id);
    if (!approval) return null;

    approval.status = 'APPROVED';
    approval.reviewedAt = new Date().toISOString();
    approval.reviewedByStaffName = ownerStaff.name;

    // NOW APPLY TO LIVE FINANCIAL LEDGERS!
    const { type, payload } = approval;
    try {
      if (type === 'INVOICE') {
        await rawDataService.createInvoice({ ...payload, bypassApprovalCheck: true });
      } else if (type === 'RECEIPT') {
        await rawDataService.recordClientPayment({ ...payload, bypassApprovalCheck: true });
      } else if (type === 'EXPENSE') {
        await rawDataService.addExpense({ ...payload, bypassApprovalCheck: true });
      } else if (type === 'VENDOR_PAYOUT') {
        await rawDataService.logVendorPayment(payload.vendorId, Number(payload.amount) || 0, payload.paymentMethod || 'BANK_TRANSFER');
      } else if (type === 'JOURNAL_VOUCHER') {
        rawDataService.addJournalEntry(payload);
      }
    } catch (e) {
      console.error('Error applying approved financial transaction:', e);
    }

    return approval;
  },

  rejectFinancialApproval: (id: string, reason: string, ownerStaff: StaffMember) => {
    const approval = financialApprovalsList.find(a => a.id === id);
    if (!approval) return null;

    approval.status = 'REJECTED';
    approval.rejectionReason = reason || 'Rejected by Owner/Admin';
    approval.reviewedAt = new Date().toISOString();
    approval.reviewedByStaffName = ownerStaff.name;
    // CRUCIAL LEDGER RULE: Zero effect on live balances or ledgers!
    return approval;
  },

  // Client Documents Vault
  getClientDocuments: (clientId?: string) => {
    if (clientId && clientId !== 'ALL') {
      return clientDocumentsList.filter(d => d.clientId === clientId);
    }
    return [...clientDocumentsList];
  },

  addClientDocument: (data: {
    clientId: string;
    clientName: string;
    title: string;
    category: ClientDocCategory;
    fileUrl: string;
    fileName: string;
    fileSize?: string;
    uploadedByStaffId: string;
    uploadedByStaffName: string;
    notes?: string;
  }) => {
    const doc: ClientDocument = {
      id: `cdoc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientId: data.clientId,
      clientName: data.clientName,
      title: data.title,
      category: data.category,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSize: data.fileSize || '1.4 MB',
      uploadedByStaffId: data.uploadedByStaffId,
      uploadedByStaffName: data.uploadedByStaffName,
      uploadedAt: new Date().toISOString(),
      notes: data.notes
    };
    clientDocumentsList.unshift(doc);
    return doc;
  },

  deleteClientDocument: (id: string) => {
    const idx = clientDocumentsList.findIndex(d => d.id === id);
    if (idx === -1) return false;
    clientDocumentsList.splice(idx, 1);
    return true;
  },

  // Task Proofs & Automated Client/Owner Completion WhatsApp Notification
  addTaskProofFile: (taskId: string, proof: { name: string; url?: string; dataUrl?: string; notes?: string; fileSize?: string }) => {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return null;
    if (!task.proofFiles) task.proofFiles = [];
    const item: TaskProofFile = {
      id: `proof-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: proof.name,
      url: proof.url || proof.dataUrl || '',
      dataUrl: proof.dataUrl,
      uploadedAt: new Date().toISOString(),
      notes: proof.notes,
      fileSize: proof.fileSize || '1.8 MB'
    };
    task.proofFiles.push(item);
    task.updatedAt = new Date().toISOString();
    persistStore();
    return item;
  },

  completeTaskWithClientShare: async (
    taskId: string,
    staff: StaffMember,
    completionNotes?: string
  ) => {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return null;

    task.status = 'COMPLETED';
    task.completionNotes = completionNotes;
    task.sharedWithClientAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    const client = clientsList.find(c => c.id === task.clientId);
    const project = task.projectId ? projectsList.find(p => p.id === task.projectId) : undefined;

    // Calculate project progress
    const totalProjTasks = project ? tasksList.filter(t => t.projectId === project.id).length : 1;
    const completedProjTasks = project ? tasksList.filter(t => t.projectId === project.id && t.status === 'COMPLETED').length : 1;
    const progressPercent = totalProjTasks > 0 ? Math.round((completedProjTasks / totalProjTasks) * 100) : 100;
    if (project) {
      project.progressPercent = progressPercent;
    }

    const todayDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    // Client WhatsApp Message formatted nicely
    const clientMessage = `*🚀 TASK COMPLETED & CLIENT UPDATE - ${project ? project.title : 'Nearlook Agency'}*\n\n` +
      `Dear ${client?.contactName || 'Client'},\n` +
      `We are pleased to inform you that the following deliverable has been successfully completed today (${todayDate}):\n\n` +
      `✅ *Task:* ${task.title}\n` +
      (task.description ? `📝 *Summary:* ${task.description}\n` : '') +
      (completionNotes ? `💬 *Deliverable Notes:* ${completionNotes}\n` : '') +
      (project ? `📊 *Overall Project Progress:* ${progressPercent}% Completed\n\n` : '\n') +
      `Executed by: ${staff.name} (${staff.role.replace(/_/g, ' ')})\n` +
      `Nearlook IT & Digital Agency • Engineering Excellence`;

    const clientPhoneClean = (client?.whatsappNumber || '').replace(/[^0-9]/g, '');
    const clientWhatsAppUrl = clientPhoneClean
      ? `https://wa.me/${clientPhoneClean}?text=${encodeURIComponent(clientMessage)}`
      : '';

    // Owner Notification WhatsApp Message
    const ownerMessage = `*🔔 OWNER ALERT: TASK COMPLETED & CLIENT SHARED*\n\n` +
      `*Client:* ${client?.businessName || client?.contactName || 'General Client'}\n` +
      `*Project:* ${project?.title || 'Agency Operations'}\n` +
      `*Task:* ${task.title}\n` +
      `*Completed by:* ${staff.name} (${staff.role.replace(/_/g, ' ')})\n` +
      `*Date:* ${todayDate}\n` +
      `*Progress:* ${progressPercent}%\n\n` +
      `Client was updated via WhatsApp. Full audit logged in Nearlook Agency ERP.`;

    const ownerPhone = '+919876543201'; // Owner Arun
    const ownerWhatsAppUrl = `https://wa.me/${ownerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(ownerMessage)}`;

    // Log to inMemoryWhatsAppLogs
    inMemoryWhatsAppLogs.unshift({
      id: `wlog-${Date.now()}-client`,
      recipientPhone: client?.whatsappNumber || '',
      recipientName: client?.contactName || 'Client',
      recipientType: 'CLIENT',
      eventType: 'TASK_STATUS_UPDATE',
      messageBody: clientMessage,
      status: 'DELIVERED',
      sentAt: new Date().toISOString()
    });

    inMemoryWhatsAppLogs.unshift({
      id: `wlog-${Date.now()}-owner`,
      recipientPhone: ownerPhone,
      recipientName: 'Arun (Owner)',
      recipientType: 'STAFF',
      eventType: 'TASK_STATUS_UPDATE',
      messageBody: ownerMessage,
      status: 'DELIVERED',
      sentAt: new Date().toISOString()
    });

    return {
      task,
      progressPercent,
      clientMessage,
      clientWhatsAppUrl,
      ownerMessage,
      ownerWhatsAppUrl
    };
  },

  deleteStaff: (id: string, deletedBy?: string) => {
    const idx = staffList.findIndex(s => s.id === id);
    if (idx === -1) return false;
    const staff = staffList[idx];
    moveToRecycleBin(
      staff.id,
      'STAFF',
      staff.name,
      `${staff.role.replace(/_/g, ' ')} (${staff.userId}) • Team: ${staff.team}`,
      staff,
      deletedBy
    );
    staffList.splice(idx, 1);
    return true;
  },

  // Leads & Consultation Rules
  getLeads: () => {
    return leadsList.map(lead => ({
      ...lead,
      assignedManager: staffList.find(s => s.id === lead.assignedManagerId)
    }));
  },

  addLead: async (data: Omit<Lead, 'id' | 'createdAt' | 'updatedAt' | 'consultationNotes'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const servicesList = data.servicesInterested && data.servicesInterested.length > 0
      ? data.servicesInterested
      : [data.serviceType || 'WEB_DEV'];

    const newLead: Lead = {
      ...data,
      id: `lead-${Date.now()}`,
      serviceType: data.serviceType || (servicesList[0] as ServiceType) || 'WEB_DEV',
      servicesInterested: servicesList,
      serviceInterested: servicesList.join(', '),
      leadGeneratedDate: data.leadGeneratedDate || todayStr,
      contactedDate: data.leadStage === 'CONTACTED' ? (data.contactedDate || todayStr) : data.contactedDate,
      convertedDate: data.leadStage === 'WON' ? (data.convertedDate || todayStr) : data.convertedDate,
      isGreetingSent: data.isGreetingSent || false,
      greetingSentAt: data.greetingSentAt,
      consultationNotes: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedManager: staffList.find(s => s.id === data.assignedManagerId)
    };
    leadsList.unshift(newLead);

    // Auto-create Calendar task for follow-up if follow-up date is provided
    if (newLead.nextFollowUpDate) {
      const followUpTask: Task = {
        id: `task-fu-${Date.now()}`,
        clientId: 'internal-ops',
        clientName: newLead.businessName,
        title: `Follow-up: ${newLead.leadName} (${newLead.businessName})`,
        description: `Scheduled Lead Follow-up: Call/WhatsApp ${newLead.leadName} (${newLead.whatsappNumber}). Notes: ${newLead.followUpNotes || 'Client requested callback.'}`,
        status: 'TO_DO',
        priority: 'HIGH',
        serviceCategory: newLead.serviceType || 'WEB_DEV',
        assignedStaffId: newLead.assignedManagerId,
        dueDate: newLead.nextFollowUpDate,
        estimatedHours: 1,
        isRecurring: false,
        recurringRule: 'NONE',
        order: 0,
        subTasks: [
          { id: `sub-fu-${Date.now()}-1`, taskId: '', title: `Call or WhatsApp ${newLead.leadName} at ${newLead.whatsappNumber}`, isCompleted: false, createdAt: new Date().toISOString() },
          { id: `sub-fu-${Date.now()}-2`, taskId: '', title: `Record consultation notes & update lead status`, isCompleted: false, createdAt: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasksList.unshift(followUpTask);
      newLead.followUpTaskId = followUpTask.id;
    }

    // Auto-trigger WhatsApp Welcome Alert to Lead customized for Nearlook Mart Pvt Ltd
    try {
      await triggerLeadWelcomeWhatsApp({
        phone: newLead.whatsappNumber,
        leadName: newLead.leadName,
        businessName: newLead.businessName,
        serviceType: newLead.serviceType,
        services: servicesList,
        managerName: newLead.assignedManager?.name
      });
    } catch (e) {
      console.error('Auto lead WhatsApp trigger error:', e);
    }

    return newLead;
  },

  updateLeadStatus: async (leadId: string, newStage: Lead['leadStage']) => {
    const lead = leadsList.find(l => l.id === leadId);
    if (!lead) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    const previousStage = lead.leadStage;
    lead.leadStage = newStage;

    if (newStage === 'CONTACTED' && !lead.contactedDate) {
      lead.contactedDate = todayStr;
    }
    if (newStage === 'WON' && !lead.convertedDate) {
      lead.convertedDate = todayStr;
    }
    lead.updatedAt = new Date().toISOString();

    // PHASE 4: If Lead Status transitioned to WON, generate automated task for Accounts Manager
    if (newStage === 'WON' && previousStage !== 'WON') {
      const advanceAmount = Math.round(lead.estimatedDealValue * 0.5);

      // 1. Create client profile if not existing
      let client = clientsList.find(c => c.businessName.toLowerCase() === lead.businessName.toLowerCase());
      if (!client) {
        client = {
          id: `client-${Date.now()}`,
          businessName: lead.businessName,
          contactName: lead.leadName,
          whatsappNumber: lead.whatsappNumber,
          email: lead.email || `${lead.leadName.toLowerCase().replace(/\s+/g, '')}@client.io`,
          clientType: 'ONE_TIME_PROJECT',
          status: 'ACTIVE',
          monthlyRetainerAmount: 0,
          billingCycleDay: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        clientsList.unshift(client);
      }

      // 2. Create Project with isAdvanceReceived = false (Gated)
      const project: Project = {
        id: `proj-${Date.now()}`,
        clientId: client.id,
        clientName: client.businessName,
        title: `${lead.businessName} - ${lead.serviceType.replace('_', ' ')} Execution`,
        description: lead.notes || 'Full delivery sprint.',
        projectType: 'ONE_TIME_PROJECT',
        status: 'PENDING_ADVANCE',
        isAdvanceReceived: false, // 🔒 Initiation Gate Locked until Accounts clears advance
        advanceRequired: advanceAmount,
        totalValue: lead.estimatedDealValue,
        billedAmount: advanceAmount,
        collectedAmount: 0,
        balanceDue: lead.estimatedDealValue,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: lead.estimatedDealValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      projectsList.unshift(project);

      // 3. Automated Task for Accounts Manager
      const accStaff = staffList.find(s => s.role === 'ACCOUNT_MANAGER') || staffList[1];
      const advanceTask: Task = {
        id: `task-adv-${Date.now()}`,
        projectId: project.id,
        clientId: client.id,
        clientName: client.businessName,
        title: `Collect 50% Advance Payment (₹${advanceAmount.toLocaleString('en-IN')}) for ${client.businessName}`,
        description: `Lead won! Project initiation is gated until Accounts Manager confirms receipt of advance.`,
        status: 'TO_DO',
        priority: 'URGENT',
        serviceCategory: lead.serviceType,
        assignedStaffId: accStaff.id,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimatedHours: 1,
        isRecurring: false,
        recurringRule: 'NONE',
        order: 0,
        subTasks: [
          { id: `sub-${Date.now()}-1`, taskId: '', title: `Send 50% advance invoice (₹${advanceAmount.toLocaleString('en-IN')}) with bank details`, isCompleted: false, createdAt: new Date().toISOString() },
          { id: `sub-${Date.now()}-2`, taskId: '', title: `Verify payment credit in bank & mark advance as received`, isCompleted: false, createdAt: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasksList.unshift(advanceTask);
    }

    return lead;
  },

  addConsultationNote: (leadId: string, author: StaffMember, text: string, isPrivate: boolean = false) => {
    const lead = leadsList.find(l => l.id === leadId);
    if (!lead) return null;

    if (!lead.consultationNotes) lead.consultationNotes = [];
    const note: ConsultationNote = {
      id: `cn-${Date.now()}`,
      authorId: author.id,
      authorName: author.name,
      authorRole: author.role,
      text,
      isPrivate,
      createdAt: new Date().toISOString()
    };
    lead.consultationNotes.push(note);
    lead.updatedAt = new Date().toISOString();
    return note;
  },

  updateLead: (id: string, data: Partial<Lead>) => {
    const lead = leadsList.find(l => l.id === id);
    if (!lead) return null;

    const todayStr = new Date().toISOString().split('T')[0];
    if (data.leadStage === 'CONTACTED' && !lead.contactedDate) {
      lead.contactedDate = todayStr;
    }
    if (data.leadStage === 'WON' && !lead.convertedDate) {
      lead.convertedDate = todayStr;
    }

    // Auto-create or sync follow-up task on Calendar
    if (data.nextFollowUpDate !== undefined && data.nextFollowUpDate !== lead.nextFollowUpDate) {
      if (data.nextFollowUpDate) {
        if (lead.followUpTaskId) {
          const existingTask = tasksList.find(t => t.id === lead.followUpTaskId);
          if (existingTask) {
            existingTask.dueDate = data.nextFollowUpDate;
            if (data.followUpNotes) {
              existingTask.description = `Scheduled Lead Follow-up: Call/WhatsApp ${lead.leadName} (${lead.whatsappNumber}). Notes: ${data.followUpNotes}`;
            }
            existingTask.updatedAt = new Date().toISOString();
          }
        } else {
          const followUpTask: Task = {
            id: `task-fu-${Date.now()}`,
            clientId: 'internal-ops',
            clientName: lead.businessName,
            title: `Follow-up: ${lead.leadName} (${lead.businessName})`,
            description: `Scheduled Lead Follow-up: Call/WhatsApp ${lead.leadName} (${lead.whatsappNumber}). Notes: ${data.followUpNotes || lead.followUpNotes || 'Client requested callback.'}`,
            status: 'TO_DO',
            priority: 'HIGH',
            serviceCategory: lead.serviceType || 'WEB_DEV',
            assignedStaffId: data.assignedManagerId || lead.assignedManagerId,
            dueDate: data.nextFollowUpDate,
            estimatedHours: 1,
            isRecurring: false,
            recurringRule: 'NONE',
            order: 0,
            subTasks: [
              { id: `sub-fu-${Date.now()}-1`, taskId: '', title: `Call or WhatsApp ${lead.leadName} at ${lead.whatsappNumber}`, isCompleted: false, createdAt: new Date().toISOString() },
              { id: `sub-fu-${Date.now()}-2`, taskId: '', title: `Record consultation notes & update lead status`, isCompleted: false, createdAt: new Date().toISOString() }
            ],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          tasksList.unshift(followUpTask);
          lead.followUpTaskId = followUpTask.id;
        }
      }
    }

    Object.assign(lead, data, { updatedAt: new Date().toISOString() });
    return lead;
  },

  deleteLead: (id: string, deletedBy?: string) => {
    const idx = leadsList.findIndex(l => l.id === id);
    if (idx === -1) return false;
    const lead = leadsList[idx];
    moveToRecycleBin(
      lead.id,
      'LEAD',
      lead.businessName || lead.leadName,
      `Contact: ${lead.leadName} • Deal: ₹${(lead.estimatedDealValue || 0).toLocaleString('en-IN')}`,
      lead,
      deletedBy
    );
    leadsList.splice(idx, 1);
    return true;
  },

  // Quotation Engine (Phase 3)
  getQuotations: () => quotationsList,

  getNextQuotationNumber: (date: Date = new Date()) => {
    const fySuffix = getFinancialYearSuffix(date);
    let maxSeq = 0;
    const regex = new RegExp(`^QTN-(\\d+)-${fySuffix}$`, 'i');

    quotationsList.forEach(q => {
      if (q.quotationNumber) {
        const m = q.quotationNumber.match(regex);
        if (m) {
          const val = parseInt(m[1], 10);
          if (!isNaN(val) && val > maxSeq) maxSeq = val;
        }
      }
    });

    recycleBinList.forEach(item => {
      if (item.entityType === 'QUOTATION') {
        const num = item.data?.quotationNumber || item.title;
        if (num) {
          const m = num.match(regex);
          if (m) {
            const val = parseInt(m[1], 10);
            if (!isNaN(val) && val > maxSeq) maxSeq = val;
          }
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `QTN-${String(nextSeq).padStart(3, '0')}-${fySuffix}`;
  },

  createQuotation: async (data: {
    leadId: string;
    clientBusiness: string;
    clientContact: string;
    clientPhone: string;
    clientEmail?: string;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
    gstType: GSTType;
    paymentTerms?: string;
    lateFeeTerms?: string;
  }) => {
    const nextNum = DataService.getNextQuotationNumber();

    const items = data.lineItems.map((item, idx) => ({
      id: `qli-${Date.now()}-${idx}`,
      description: item.description,
      quantity: Number(item.quantity) || 1,
      unitPrice: Number(item.unitPrice) || 0,
      amount: (Number(item.quantity) || 1) * (Number(item.unitPrice) || 0)
    }));

    const subtotal = items.reduce((sum, i) => sum + i.amount, 0);
    let taxAmount = 0;
    let totalAmount = subtotal;
    let internalTaxCalculated = 0;

    if (data.gstType === 'ADDITIONAL_18') {
      taxAmount = Math.round(subtotal * 0.18);
      totalAmount = subtotal + taxAmount;
      internalTaxCalculated = taxAmount;
    } else if (data.gstType === 'INCLUSIVE_18') {
      taxAmount = 0; // Hides separate tax breakdown from client
      totalAmount = subtotal;
      internalTaxCalculated = Math.round((subtotal * 18) / 118); // 18% internal tax
    } else {
      taxAmount = 0; // No GST charged to client
      totalAmount = subtotal;
      internalTaxCalculated = Math.round((subtotal * 18) / 118); // Internal 18% tax liability component
    }

    const quotation: Quotation = {
      id: `quote-${Date.now()}`,
      quotationNumber: nextNum,
      leadId: data.leadId,
      clientBusiness: data.clientBusiness,
      clientContact: data.clientContact,
      clientPhone: data.clientPhone,
      clientEmail: data.clientEmail,
      lineItems: items,
      subtotal,
      gstType: data.gstType,
      taxAmount,
      totalAmount,
      internalTaxCalculated,
      paymentTerms: data.paymentTerms || '50% Advance / 30% Review / 20% Completion',
      lateFeeTerms: data.lateFeeTerms || 'Payments delayed beyond the due date will incur a 2% late penalty fee per week.',
      status: 'SENT',
      sentViaWhatsApp: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    quotationsList.unshift(quotation);

    // 1. Update lead status to Proposal Sent automatically
    await DataService.updateLeadStatus(data.leadId, 'PROPOSAL_SENT');

    // 2. Automated WhatsApp Dispatch to Client
    try {
      await triggerQuotationWhatsApp({
        phone: quotation.clientPhone,
        contactName: quotation.clientContact,
        businessName: quotation.clientBusiness,
        quotationNumber: quotation.quotationNumber,
        totalAmount: quotation.totalAmount,
        gstType: quotation.gstType,
        paymentTerms: quotation.paymentTerms
      });
    } catch (e) {
      console.error('WhatsApp Quotation dispatch error:', e);
    }

    return quotation;
  },

  addQuotation: (data: any) => DataService.createQuotation(data),

  updateQuotation: (id: string, data: Partial<Quotation>) => {
    const quote = quotationsList.find(q => q.id === id);
    if (!quote) return null;

    // Recalculate totals if lineItems or gstType change
    if (data.lineItems || data.gstType) {
      const items = data.lineItems || quote.lineItems;
      const gstType = data.gstType || quote.gstType;
      const subtotal = items.reduce((sum, i) => sum + (Number(i.quantity) || 1) * (Number(i.unitPrice) || 0), 0);
      let taxAmount = 0;
      let totalAmount = subtotal;
      let internalTaxCalculated = 0;

      if (gstType === 'ADDITIONAL_18') {
        taxAmount = Math.round(subtotal * 0.18);
        totalAmount = subtotal + taxAmount;
        internalTaxCalculated = taxAmount;
      } else if (gstType === 'INCLUSIVE_18') {
        taxAmount = 0;
        totalAmount = subtotal;
        internalTaxCalculated = Math.round((subtotal * 18) / 118);
      } else {
        taxAmount = 0;
        totalAmount = subtotal;
        internalTaxCalculated = Math.round((subtotal * 18) / 118);
      }

      data.subtotal = subtotal;
      data.taxAmount = taxAmount;
      data.totalAmount = totalAmount;
      data.internalTaxCalculated = internalTaxCalculated;
    }

    Object.assign(quote, data, { updatedAt: new Date().toISOString() });
    return quote;
  },

  deleteQuotation: (id: string, deletedBy?: string) => {
    const idx = quotationsList.findIndex(q => q.id === id);
    if (idx === -1) return false;
    const quote = quotationsList[idx];
    moveToRecycleBin(
      quote.id,
      'QUOTATION',
      quote.quotationNumber,
      `${quote.clientBusiness} • ₹${(quote.totalAmount || 0).toLocaleString('en-IN')} • ${quote.status}`,
      quote,
      deletedBy
    );
    quotationsList.splice(idx, 1);
    return true;
  },

  // Projects & Milestones Management (IT, Software Engineering, AI & Digital Agency Delivery)
  getProjects: () => {
    let storeChanged = false;

    // Ensure Prestige IoT Portal IT project exists
    let prestigeProj = projectsList.find(p => p.code === 'PRJ-SOF-104' || p.id === 'proj-sof-104');
    if (!prestigeProj) {
      prestigeProj = {
        id: 'proj-sof-104',
        code: 'PRJ-SOF-104',
        clientId: 'client-prestige',
        clientName: 'Prestige Urban Developers Ltd',
        clientPhone: '+91 98451 00223',
        location: 'Bangalore / GCP Cloud',
        category: 'ENTERPRISE CLOUD SAAS',
        domain: 'SOFTWARE',
        title: 'Prestige Urban - Smart Enterprise IoT Portal & Mobile App',
        description: 'Cloud microservices, tenant mobile app, IoT telemetry dashboard and executive analytics.',
        techStack: 'React Native, Next.js, Node.js, Fastify, Docker',
        projectType: 'ONE_TIME_PROJECT',
        contractType: 'Milestone Execution Contract',
        status: 'PLANNING',
        isAdvanceReceived: false,
        advanceRequired: 400000,
        totalValue: 1250000,
        budget: 1050000,
        billedAmount: 0,
        collectedAmount: 0,
        cashCollected: 0,
        bankCollected: 0,
        balanceDue: 1250000,
        gstAmount: 0,
        expensesTotal: 0,
        progressPercent: 4,
        startDate: '01 Sept 2024',
        dueDate: '30 Jun 2026',
        assignedLeadName: 'Alex Rivera (PM)',
        milestones: [
          { id: 'ms-prestige-1', title: 'Phase 1: Architecture Blueprint & Cloud Schema', deliverable: 'System design, Auth0 SSO and DB schema', amount: 350000, status: 'IN_PROGRESS' },
          { id: 'ms-prestige-2', title: 'Phase 2: Microservices & Real-time IoT Ingestion', deliverable: 'FastAPI microservices and telemetry ingestion', amount: 500000, status: 'PENDING' },
          { id: 'ms-prestige-3', title: 'Phase 3: React Native Mobile Apps & Handover', deliverable: 'iOS & Android App Store release and admin dashboard', amount: 400000, status: 'PENDING' }
        ],
        createdAt: '2026-09-01T09:00:00.000Z',
        updatedAt: '2026-09-01T09:00:00.000Z'
      };
      projectsList.push(prestigeProj);
      storeChanged = true;
    } else {
      if (prestigeProj.title.includes('Greenfield') || prestigeProj.title.includes('Tower B')) {
        prestigeProj.title = 'Prestige Urban - Smart Enterprise IoT Portal & Mobile App';
        prestigeProj.location = 'Bangalore / GCP Cloud';
        prestigeProj.category = 'ENTERPRISE CLOUD SAAS';
        prestigeProj.domain = 'SOFTWARE';
        storeChanged = true;
      }
    }

    // Ensure K-RIDE Transit Mobile App IT project exists
    let krideProj = projectsList.find(p => p.code === 'PRJ-SOF-102' || p.id === 'proj-sof-102');
    if (!krideProj) {
      krideProj = {
        id: 'proj-sof-102',
        code: 'PRJ-SOF-102',
        clientId: 'client-kride',
        clientName: 'Karnataka Rail Infrastructure Development (K-RIDE)',
        clientPhone: '+91 94480 33445',
        location: 'Whitefield, Bangalore / Hybrid Cloud',
        category: 'MOBILE APP & REALTIME API',
        domain: 'SOFTWARE',
        title: 'K-RIDE Transit - Automated Ticketing & Commuter Mobile App',
        description: 'Real-time commuter transit app, QR ticketing engine, push notification microservice & admin dashboard.',
        techStack: 'Flutter, Node.js, Redis, WebSockets, PostgreSQL',
        projectType: 'ONE_TIME_PROJECT',
        contractType: 'Government EPC Contract',
        status: 'ACTIVE',
        isAdvanceReceived: false,
        advanceRequired: 350000,
        totalValue: 850000,
        budget: 700000,
        billedAmount: 0,
        collectedAmount: 0,
        cashCollected: 0,
        bankCollected: 0,
        balanceDue: 850000,
        gstAmount: 0,
        expensesTotal: 0,
        progressPercent: 22,
        startDate: '01 Apr 2024',
        dueDate: '31 Aug 2025',
        assignedLeadName: 'Alex Rivera (PM)',
        milestones: [
          { id: 'ms-kride-1', title: 'Mobile UI/UX Wireframes & API Gateway Design', deliverable: 'Figma prototypes and OpenAPI specification', amount: 250000, status: 'COMPLETED' },
          { id: 'ms-kride-2', title: 'QR Ticketing Engine & Payment Gateway Integration', deliverable: 'Razorpay / UPI split checkout & offline validation', amount: 350000, status: 'IN_PROGRESS' },
          { id: 'ms-kride-3', title: 'Real-time GPS Tracking & Production Cloud Deployment', deliverable: 'WebSocket live feeds and high-availability cluster', amount: 250000, status: 'PENDING' }
        ],
        createdAt: '2024-04-01T09:00:00.000Z',
        updatedAt: '2024-04-01T09:00:00.000Z'
      };
      projectsList.push(krideProj);
      storeChanged = true;
    } else {
      if (krideProj.title.includes('Metro Station') || krideProj.title.includes('Skywalk')) {
        krideProj.title = 'K-RIDE Transit - Automated Ticketing & Commuter Mobile App';
        krideProj.location = 'Whitefield, Bangalore / Hybrid Cloud';
        krideProj.category = 'MOBILE APP & REALTIME API';
        krideProj.domain = 'SOFTWARE';
        storeChanged = true;
      }
    }

    // Ensure client Arun exists
    if (!clientsList.some(c => c.id === 'client-arun')) {
      clientsList.push({
        id: 'client-arun',
        businessName: 'Arun Enterprises',
        contactName: 'Arun',
        whatsappNumber: '+91 98450 99887',
        email: 'arun@example.com',
        city: 'Bangalore',
        address: 'Indiranagar, Bangalore, Karnataka',
        clientType: 'ONE_TIME_PROJECT',
        status: 'ACTIVE',
        monthlyRetainerAmount: 0,
        billingCycleDay: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      storeChanged = true;
    }

    // Ensure client Prestige exists
    if (!clientsList.some(c => c.id === 'client-prestige')) {
      clientsList.push({
        id: 'client-prestige',
        businessName: 'Prestige Urban Developers Ltd',
        contactName: 'Sanjay Reddy',
        whatsappNumber: '+91 98451 00223',
        email: 'sanjay.reddy@prestigeurban.com',
        city: 'Bangalore',
        address: 'Outer Ring Road, Bellandur, Bangalore',
        clientType: 'ONE_TIME_PROJECT',
        status: 'ACTIVE',
        monthlyRetainerAmount: 0,
        billingCycleDay: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      storeChanged = true;
    }

    // Ensure client K-RIDE exists
    if (!clientsList.some(c => c.id === 'client-kride')) {
      clientsList.push({
        id: 'client-kride',
        businessName: 'Karnataka Rail Infrastructure Development (K-RIDE)',
        contactName: 'M. K. Rao (Chief Engineer)',
        whatsappNumber: '+91 94480 33445',
        email: 'procurement@kride.karnataka.gov.in',
        city: 'Bangalore',
        address: 'Whitefield Main Road, Near ITPL, Bangalore',
        clientType: 'ONE_TIME_PROJECT',
        status: 'ACTIVE',
        monthlyRetainerAmount: 0,
        billingCycleDay: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      storeChanged = true;
    }



    if (storeChanged) {
      persistStore();
    }

    return projectsList.map(proj => {
      const client = clientsList.find(c => c.id === proj.clientId);
      const projReceipts = receiptsList.filter(r => r.projectId === proj.id || (r.clientName && r.clientName.toLowerCase() === (proj.clientName || '').toLowerCase()));

      let receiptCash = 0;
      let receiptBank = 0;
      projReceipts.forEach(r => {
        const method = (r.paymentMethod || '').toUpperCase();
        if (method.includes('CASH')) {
          receiptCash += Number(r.amount) || 0;
        } else {
          receiptBank += Number(r.amount) || 0;
        }
      });

      const totalReceipts = receiptCash + receiptBank;
      const initialSeedCollected = (proj.cashCollected !== undefined || proj.bankCollected !== undefined)
        ? ((proj.cashCollected || 0) + (proj.bankCollected || 0))
        : (proj.collectedAmount || 0);

      // Determine clean collections without double-counting, capped at total contract value
      const rawCollected = totalReceipts > 0 ? totalReceipts : initialSeedCollected;
      const totalCollected = Math.min(proj.totalValue || rawCollected, rawCollected);

      const finalCash = totalReceipts > 0 ? receiptCash : (proj.cashCollected || 0);
      const finalBank = totalReceipts > 0 ? (totalCollected - finalCash) : (proj.bankCollected !== undefined ? proj.bankCollected : (totalCollected - finalCash));

      const projExpenses = expensesList.filter(e => (e as any).projectId === proj.id || e.clientId === proj.clientId);
      const projVendors = vendorsList.filter(v => v.projectId === proj.id);
      const calculatedExpenses = projExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0) + projVendors.reduce((s, v) => s + (Number(v.totalPayable) || 0), 0);
      const totalExpenses = (proj.expensesTotal !== undefined && proj.expensesTotal > 0) ? proj.expensesTotal : calculatedExpenses;

      let progress = proj.progressPercent;
      if (progress === undefined) {
        if (proj.status === 'COMPLETED') progress = 100;
        else if (proj.status === 'PLANNING') progress = 4;
        else if (proj.totalValue > 0) {
          progress = Math.min(100, Math.round((totalCollected / proj.totalValue) * 100));
        } else {
          progress = 0;
        }
      }

      const totalVal = proj.totalValue || 0;
      const internalGst = proj.gstAmount !== undefined && proj.gstAmount > 0
        ? proj.gstAmount
        : Math.round((totalVal * 18) / 118);
      const netBudget = proj.budget !== undefined && proj.budget > 0 && proj.budget < totalVal
        ? proj.budget
        : Math.max(0, totalVal - internalGst);

      return {
        ...proj,
        code: proj.code || (proj.id === 'proj-arun-2026-001' ? 'PRJ-2026-001' : `PRJ-${(proj.domain || 'IT').slice(0, 3).toUpperCase()}-${proj.id.slice(-3)}`),
        clientName: proj.clientName || client?.businessName || client?.contactName || 'Client',
        clientPhone: proj.clientPhone || client?.whatsappNumber || '+91 98450 99887',
        location: proj.location || client?.address || client?.city || 'Bangalore / Cloud Infrastructure',
        category: proj.category || (proj.domain === 'SOFTWARE' ? 'SOFTWARE & CLOUD' : proj.domain === 'WEB' ? 'WEB PLATFORM' : proj.domain === 'AI' ? 'AI AUTOMATION' : 'IT SERVICES'),
        budget: netBudget,
        gstAmount: internalGst,
        cashCollected: finalCash,
        bankCollected: finalBank,
        collectedAmount: totalCollected,
        balanceDue: Math.max(0, totalVal - totalCollected),
        expensesTotal: totalExpenses,
        progressPercent: progress,
        receipts: projReceipts.length > 0 ? projReceipts : proj.receipts
      };
    });
  },

  getProjectById: (id: string) => {
    const list = DataService.getProjects();
    return list.find(p => p.id === id);
  },

  addProject: (data: {
    title: string;
    description?: string;
    clientId: string;
    domain?: string;
    techStack?: string;
    contractType?: string;
    totalValue: number;
    advanceRequired?: number;
    dueDate?: string;
    startDate?: string;
    assignedLeadName?: string;
    status?: string;
    location?: string;
    category?: string;
    budget?: number;
    gstAmount?: number;
    milestones?: any[];
  }) => {
    const client = clientsList.find(c => c.id === data.clientId);
    const totalVal = Number(data.totalValue) || 0;
    const advance = Number(data.advanceRequired) || Math.round(totalVal * 0.4);
    const domainPrefix = (data.domain || 'IT').substring(0, 3).toUpperCase();
    const computedGst = data.gstAmount !== undefined && Number(data.gstAmount) > 0 ? Number(data.gstAmount) : Math.round((totalVal * 18) / 118);
    const computedBudget = data.budget !== undefined && Number(data.budget) > 0 ? Number(data.budget) : Math.max(0, totalVal - computedGst);
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      code: `PRJ-${domainPrefix}-${String(projectsList.length + 101).padStart(3, '0')}`,
      clientId: data.clientId,
      clientName: client?.businessName || 'Enterprise Client',
      clientPhone: client?.whatsappNumber || '',
      location: data.location || client?.address || client?.city || 'Bangalore / Cloud Infrastructure',
      category: data.category || (data.domain === 'SOFTWARE' ? 'SOFTWARE ENGINEERING' : 'WEB PLATFORM'),
      title: data.title,
      description: data.description || '',
      domain: data.domain || 'SOFTWARE',
      techStack: data.techStack || 'Next.js 14, Node.js, PostgreSQL',
      projectType: 'ONE_TIME_PROJECT',
      contractType: data.contractType || 'Fixed Milestone Contract',
      status: data.status || 'PLANNING',
      isAdvanceReceived: false,
      advanceRequired: advance,
      totalValue: totalVal,
      budget: computedBudget,
      billedAmount: 0,
      collectedAmount: 0,
      cashCollected: 0,
      bankCollected: 0,
      balanceDue: totalVal,
      gstAmount: computedGst,
      expensesTotal: 0,
      progressPercent: 0,
      dueDate: data.dueDate || new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString().split('T')[0],
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      assignedLeadName: data.assignedLeadName || 'Alex Rivera (PM)',
      milestones: data.milestones || [
        { id: `ms-${Date.now()}-1`, title: 'Discovery & System Architecture Design', deliverable: 'SRS Document, DB Schema & Wireframes', amount: Math.round(totalVal * 0.3), status: 'PENDING' },
        { id: `ms-${Date.now()}-2`, title: 'Core Development & API Integrations', deliverable: 'Working Alpha Build & Microservices', amount: Math.round(totalVal * 0.5), status: 'PENDING' },
        { id: `ms-${Date.now()}-3`, title: 'UAT, Deployment & Go-Live Handoff', deliverable: 'Production Cloud Deployment & Documentation', amount: Math.round(totalVal * 0.2), status: 'PENDING' }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projectsList.unshift(newProj);
    persistStore();
    return newProj;
  },

  updateProject: (id: string, data: Partial<Project>) => {
    const proj = projectsList.find(p => p.id === id);
    if (!proj) return null;
    Object.assign(proj, data, { updatedAt: new Date().toISOString() });
    if (data.totalValue !== undefined || data.collectedAmount !== undefined) {
      proj.balanceDue = Math.max(0, (proj.totalValue || 0) - (proj.collectedAmount || 0));
    }
    return proj;
  },

  deleteProject: (id: string, deletedBy?: string) => {
    const idx = projectsList.findIndex(p => p.id === id);
    if (idx === -1) return false;
    const proj = projectsList[idx];
    moveToRecycleBin(
      proj.id,
      'PROJECT',
      proj.title,
      `${proj.clientName || 'Client'} • Domain: ${proj.domain || 'IT'} • Contract: ₹${(proj.totalValue || 0).toLocaleString('en-IN')}`,
      proj,
      deletedBy
    );
    projectsList.splice(idx, 1);
    return true;
  },

  markProjectAdvanceReceived: async (projectId: string, paymentMethod: string, recordedBy: StaffMember) => {
    const project = projectsList.find(p => p.id === projectId);
    if (!project) return null;

    project.isAdvanceReceived = true;
    project.status = 'IN_PROGRESS';
    project.updatedAt = new Date().toISOString();

    const maxPaymentAllowed = Math.max(0, project.totalValue - (project.collectedAmount || 0));
    const targetAmount = Math.min(project.advanceRequired || Math.round(project.totalValue * 0.5), maxPaymentAllowed);

    if (targetAmount > 0) {
      const paymentResult = await DataService.recordClientPayment({
        clientId: project.clientId,
        projectId: project.id,
        amount: targetAmount,
        milestoneLabel: 'Initial Milestone Settlement',
        paymentMethod: paymentMethod || 'UPI / Bank Transfer',
        recordedBy: {
          id: recordedBy.id,
          name: recordedBy.name,
          phone: recordedBy.phone
        }
      });
      return { project, receipt: paymentResult.receipt };
    }

    const existingReceipt = receiptsList.find(r => r.projectId === project.id);
    return { project, receipt: existingReceipt };
  },

  // Weekly 2% Overdue Interest Automation - Only calculated when explicitly assigned!
  calculateLateFee: (project: Project) => {
    if (!project.lateFeeAssigned || !project.dueDate || project.balanceDue <= 0) {
      return { weeksOverdue: 0, penaltyAmount: 0, totalDue: project.balanceDue };
    }
    const dueTime = new Date(project.dueDate).getTime();
    const nowTime = Date.now();
    if (nowTime <= dueTime) return { weeksOverdue: 0, penaltyAmount: 0, totalDue: project.balanceDue };

    const diffDays = Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24));
    const weeksOverdue = Math.max(1, Math.ceil(diffDays / 7));
    // 2% per week on remaining balance due
    const penaltyRate = 0.02 * weeksOverdue;
    const penaltyAmount = Math.round(project.balanceDue * penaltyRate);
    const totalDue = project.balanceDue + penaltyAmount;

    return { weeksOverdue, penaltyAmount, totalDue };
  },

  calculateInvoiceLateFee: (invoice: Invoice) => {
    const balance = invoice.balanceDue !== undefined
      ? invoice.balanceDue
      : (invoice.status === 'PAID' ? 0 : invoice.totalAmount);

    if (!invoice.lateFeeAssigned || !invoice.dueDate || balance <= 0) {
      return { weeksOverdue: 0, penaltyAmount: 0, totalDue: balance };
    }
    const dueTime = new Date(invoice.dueDate).getTime();
    const nowTime = Date.now();
    if (nowTime <= dueTime) return { weeksOverdue: 0, penaltyAmount: 0, totalDue: balance };

    const diffDays = Math.floor((nowTime - dueTime) / (1000 * 60 * 60 * 24));
    const weeksOverdue = Math.max(1, Math.ceil(diffDays / 7));
    // 2% per week on remaining balance due
    const penaltyRate = 0.02 * weeksOverdue;
    const penaltyAmount = Math.round(balance * penaltyRate);
    const totalDue = balance + penaltyAmount;

    return { weeksOverdue, penaltyAmount, totalDue };
  },

  toggleLateFee: (id: string, type: 'PROJECT' | 'INVOICE', assigned: boolean) => {
    if (type === 'PROJECT') {
      const p = projectsList.find(x => x.id === id);
      if (p) {
        p.lateFeeAssigned = assigned;
        const res = DataService.calculateLateFee(p);
        p.lateFeeAccrued = res.penaltyAmount;
        p.lateFeeWeeks = res.weeksOverdue;
        p.updatedAt = new Date().toISOString();
        return p;
      }
    } else {
      const inv = invoicesList.find(x => x.id === id);
      if (inv) {
        inv.lateFeeAssigned = assigned;
        const res = DataService.calculateInvoiceLateFee(inv);
        inv.lateFeeAccrued = res.penaltyAmount;
        inv.lateFeeWeeks = res.weeksOverdue;
        return inv;
      }
    }
    return null;
  },

  sendWeeklyOverdueInterestNotice: async (projectId: string) => {
    const project = projectsList.find(p => p.id === projectId);
    if (!project) return null;
    const client = clientsList.find(c => c.id === project.clientId);
    if (!client) return null;

    const { weeksOverdue, penaltyAmount, totalDue } = DataService.calculateLateFee(project);

    await triggerWeeklyOverdueInterestWhatsApp({
      phone: client.whatsappNumber,
      clientName: client.contactName,
      invoiceNumber: `PROJ-${project.id.slice(-4).toUpperCase()}`,
      outstandingBalance: project.balanceDue,
      weeksOverdue,
      penaltyAmount,
      totalDue
    });

    return { weeksOverdue, penaltyAmount, totalDue };
  },

  // Daily Task Reports (IT & Digital Services DSR / Standup Engine)
  getDailyReports: () => {
    return dailyReportsList;
  },

  addDailyReport: (data: Omit<DailyReport, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReport: DailyReport = {
      ...data,
      id: `dpr-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    dailyReportsList.unshift(newReport);
    return newReport;
  },

  updateDailyReport: (id: string, data: Partial<DailyReport>) => {
    const r = dailyReportsList.find(x => x.id === id);
    if (!r) return null;
    Object.assign(r, data, { updatedAt: new Date().toISOString() });
    return r;
  },

  deleteDailyReport: (id: string, deletedBy?: string) => {
    const idx = dailyReportsList.findIndex(x => x.id === id);
    if (idx === -1) return false;
    const r = dailyReportsList[idx];
    moveToRecycleBin(
      r.id,
      'DAILY_REPORT',
      `${r.staffName} (${r.reportDate})`,
      `${r.projectName || r.domain} • ${r.hoursWorked} hrs • Tasks: ${r.tasksCompleted.slice(0, 40)}...`,
      r,
      deletedBy
    );
    dailyReportsList.splice(idx, 1);
    return true;
  },

  // IT Office Materials & Inventory (Hardware, Licenses, Subscriptions, Office Supplies)
  getInventory: () => {
    return itInventoryList;
  },

  addInventoryItem: (data: Omit<ITInventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: ITInventoryItem = {
      ...data,
      id: `ast-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    itInventoryList.unshift(newItem);
    return newItem;
  },

  updateInventoryItem: (id: string, data: Partial<ITInventoryItem>) => {
    const item = itInventoryList.find(x => x.id === id);
    if (!item) return null;
    Object.assign(item, data, { updatedAt: new Date().toISOString() });
    return item;
  },

  deleteInventoryItem: (id: string, deletedBy?: string) => {
    const idx = itInventoryList.findIndex(x => x.id === id);
    if (idx === -1) return false;
    const item = itInventoryList[idx];
    moveToRecycleBin(
      item.id,
      'INVENTORY',
      item.name,
      `${item.itemCode} • ${item.category.replace(/_/g, ' ')} • ₹${(item.purchaseValue || 0).toLocaleString('en-IN')}`,
      item,
      deletedBy
    );
    itInventoryList.splice(idx, 1);
    return true;
  },

  // Double-Entry Accounting Engine (Tally / Accounts Format)
  getCOA: () => {
    return chartOfAccountsList;
  },

  getJournalEntries: () => {
    return journalVouchersList;
  },

  addJournalEntry: (data: {
    voucherType: 'JOURNAL' | 'RECEIPT' | 'PAYMENT' | 'SALES' | 'PURCHASE' | 'CONTRA';
    date: string;
    narration: string;
    referenceNo?: string;
    lines: JournalLine[];
  }) => {
    const totalDebit = data.lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
    const totalCredit = data.lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);

    if (Math.abs(totalDebit - totalCredit) > 1) {
      throw new Error(`Double-entry validation failed: Debits (₹${totalDebit}) must equal Credits (₹${totalCredit})`);
    }

    const typePrefix = data.voucherType === 'RECEIPT' ? 'RCPT' : data.voucherType === 'PAYMENT' ? 'PMT' : data.voucherType === 'CONTRA' ? 'CNTR' : 'JV';
    const newVoucher: JournalVoucher = {
      id: `jv-${Date.now()}`,
      voucherNumber: `${typePrefix}-2026-${String(journalVouchersList.length + 101).padStart(3, '0')}`,
      voucherType: data.voucherType as any,
      date: data.date || new Date().toISOString().split('T')[0],
      narration: data.narration,
      referenceNo: data.referenceNo,
      totalAmount: totalDebit,
      lines: data.lines,
      createdAt: new Date().toISOString()
    };

    // Update Chart of Accounts balances dynamically
    data.lines.forEach(line => {
      const acc = chartOfAccountsList.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          acc.balance += (Number(line.debit) || 0) - (Number(line.credit) || 0);
        } else {
          acc.balance += (Number(line.credit) || 0) - (Number(line.debit) || 0);
        }
      }
    });

    journalVouchersList.unshift(newVoucher);
    return newVoucher;
  },

  deleteJournalEntry: (id: string, deletedBy?: string) => {
    const idx = journalVouchersList.findIndex(x => x.id === id);
    if (idx === -1) return false;
    const v = journalVouchersList[idx];

    // Reverse Chart of Accounts balance impact
    v.lines.forEach(line => {
      const acc = chartOfAccountsList.find(a => a.code === line.accountCode);
      if (acc) {
        if (acc.type === 'ASSET' || acc.type === 'EXPENSE') {
          acc.balance -= (Number(line.debit) || 0) - (Number(line.credit) || 0);
        } else {
          acc.balance -= (Number(line.credit) || 0) - (Number(line.debit) || 0);
        }
      }
    });

    moveToRecycleBin(
      v.id,
      'ACCOUNTING_VOUCHER' as any,
      `${v.voucherNumber} - ${v.voucherType}`,
      `₹${v.totalAmount.toLocaleString('en-IN')} • ${v.narration}`,
      v,
      deletedBy
    );
    journalVouchersList.splice(idx, 1);
    return true;
  },

  getTrialBalance: () => {
    const totalDebit = chartOfAccountsList
      .filter(a => a.type === 'ASSET' || a.type === 'EXPENSE')
      .reduce((sum, a) => sum + a.balance, 0);

    const totalCredit = chartOfAccountsList
      .filter(a => a.type === 'LIABILITY' || a.type === 'EQUITY' || a.type === 'REVENUE')
      .reduce((sum, a) => sum + a.balance, 0);

    return {
      totalDebit,
      totalCredit,
      isBalanced: totalDebit === totalCredit,
      difference: Math.abs(totalDebit - totalCredit),
      accounts: chartOfAccountsList
    };
  },

  getProfitAndLoss: () => {
    const directRevenue = chartOfAccountsList
      .filter(a => a.type === 'REVENUE')
      .reduce((sum, a) => sum + a.balance, 0);

    const directExpenses = chartOfAccountsList
      .filter(a => a.type === 'EXPENSE' && a.subtype === 'Direct Expenses')
      .reduce((sum, a) => sum + a.balance, 0);

    const grossProfit = directRevenue - directExpenses;

    const indirectExpenses = chartOfAccountsList
      .filter(a => a.type === 'EXPENSE' && a.subtype === 'Indirect Expenses')
      .reduce((sum, a) => sum + a.balance, 0);

    const netProfit = grossProfit - indirectExpenses;
    const margin = directRevenue > 0 ? Math.round((netProfit / directRevenue) * 100) : 0;

    return {
      revenue: directRevenue,
      directExpenses,
      grossProfit,
      indirectExpenses,
      netProfit,
      margin
    };
  },

  generateTallyXML: () => {
    const vouchersXml = journalVouchersList.map(v => `
    <VOUCHER VCHTYPE="${v.voucherType}" ACTION="Create">
      <DATE>${v.date.replace(/-/g, '')}</DATE>
      <VOUCHERNUMBER>${v.voucherNumber}</VOUCHERNUMBER>
      <REFERENCE>${v.referenceNo || ''}</REFERENCE>
      <NARRATION>${v.narration}</NARRATION>
      ${v.lines.map((l: JournalLine) => `
      <ALLLEDGERENTRIES.LIST>
        <LEDGERNAME>${l.accountName}</LEDGERNAME>
        <ISDEEMEDPOSITIVE>${l.debit > 0 ? 'Yes' : 'No'}</ISDEEMEDPOSITIVE>
        <AMOUNT>${l.debit > 0 ? -l.debit : l.credit}</AMOUNT>
      </ALLLEDGERENTRIES.LIST>`).join('')}
    </VOUCHER>`).join('');

    return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          ${vouchersXml}
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
  },

  // Tasks & Real-Time WhatsApp Notifications (Phase 5)
  getTasks: () => {
    return tasksList.map(task => ({
      ...task,
      assignedStaff: staffList.find(s => s.id === task.assignedStaffId)
    }));
  },

  createTask: async (data: {
    clientId: string;
    projectId?: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    serviceCategory: ServiceType;
    assignedStaffId?: string;
    dueDate?: string;
    estimatedHours: number;
    isRecurring: boolean;
    recurringRule: string;
    subTasks: string[];
  }) => {
    const client = clientsList.find(c => c.id === data.clientId);
    const assignedStaff = staffList.find(s => s.id === data.assignedStaffId);

    const taskId = `task-${Date.now()}`;
    const formattedSubTasks = (data.subTasks || []).map((title, idx) => ({
      id: `st-${Date.now()}-${idx}`,
      taskId,
      title,
      isCompleted: false,
      createdAt: new Date().toISOString()
    }));

    const newTask: Task = {
      id: taskId,
      clientId: data.clientId,
      clientName: client?.businessName || 'Client Brand',
      projectId: data.projectId,
      title: data.title,
      description: data.description,
      status: data.status || 'TO_DO',
      priority: data.priority || 'MEDIUM',
      serviceCategory: data.serviceCategory || 'WEB_DEV',
      assignedStaffId: data.assignedStaffId,
      assignedStaffName: assignedStaff?.name,
      dueDate: data.dueDate,
      estimatedHours: data.estimatedHours || 2,
      isRecurring: Boolean(data.isRecurring),
      recurringRule: (data.recurringRule as any) || 'NONE',
      order: 0,
      subTasks: formattedSubTasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasksList.unshift(newTask);

    if (assignedStaff) {
      try {
        await triggerStaffTaskAssignedWhatsApp({
          phone: assignedStaff.phone,
          staffName: assignedStaff.name,
          taskTitle: newTask.title,
          clientName: newTask.clientName || 'Client Brand',
          dueDate: newTask.dueDate || 'Standard Deliverable',
          priority: newTask.priority
        });
      } catch (e) {
        console.error('WhatsApp task assignment error:', e);
      }
    }

    return newTask;
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return null;
    Object.assign(task, updates, { updatedAt: new Date().toISOString() });
    persistStore();
    return task;
  },

  updateTaskStatus: async (taskId: string, newStatus: TaskStatus, staff: StaffMember) => {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return null;

    task.status = newStatus;
    task.updatedAt = new Date().toISOString();

    // Trigger WhatsApp update to Client and Owner
    const client = clientsList.find(c => c.id === task.clientId);
    if (client) {
      try {
        await triggerTaskStatusUpdateWhatsApp({
          clientPhone: client.whatsappNumber,
          clientName: client.contactName,
          ownerPhone: '+919876543201', // Owner Arun
          taskTitle: task.title,
          newStatus,
          staffName: staff.name,
          staffRole: staff.role,
          staffPhone: staff.phone
        });
      } catch (e) {
        console.error('Task status update WhatsApp dispatch error:', e);
      }
    }

    return task;
  },

  deleteTask: (taskId: string, deletedBy?: string) => {
    const idx = tasksList.findIndex(t => t.id === taskId);
    if (idx === -1) return false;
    const task = tasksList[idx];
    moveToRecycleBin(
      task.id,
      'TASK',
      task.title,
      `${task.clientName || 'General Task'} • Due: ${task.dueDate} • Priority: ${task.priority}`,
      task,
      deletedBy
    );
    tasksList.splice(idx, 1);
    return true;
  },

  generateRecurringTasks: (): Task[] => {
    const activeRetainers = clientsList.filter(c => c.clientType === 'RECURRING_RETAINER');
    const newTasks: Task[] = [];

    activeRetainers.forEach(client => {
      const task: Task = {
        id: `rec-${Date.now()}-${client.id.slice(-3)}`,
        clientId: client.id,
        clientName: client.businessName,
        title: `Weekly Retainer Performance & Attribution Report - ${client.businessName}`,
        description: 'Auto-compiled Google Ads ROAS, Meta attribution, and technical SEO health metrics in ₹ INR.',
        status: 'TO_DO',
        priority: 'MEDIUM',
        serviceCategory: 'PERFORMANCE_ADS',
        assignedStaffId: client.assignedManagerId || 'staff-4',
        dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
        estimatedHours: 2,
        isRecurring: true,
        recurringRule: 'WEEKLY_MONDAY',
        order: 0,
        subTasks: [
          { id: `rst-1-${Date.now()}`, taskId: `rec-${client.id}`, title: 'Extract Meta Ads GMV and ROAS figures', isCompleted: false, createdAt: new Date().toISOString() },
          { id: `rst-2-${Date.now()}`, taskId: `rec-${client.id}`, title: 'Review Core Web Vitals and organic rank changes', isCompleted: false, createdAt: new Date().toISOString() },
          { id: `rst-3-${Date.now()}`, taskId: `rec-${client.id}`, title: 'Dispatch weekly client report via WhatsApp', isCompleted: false, createdAt: new Date().toISOString() }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      tasksList.unshift(task);
      newTasks.push(task);
    });

    return newTasks;
  },

  // Social Media Calendar (Phase 5)
  getSocialMediaTasks: () => socialMediaTasksList,
  addSocialMediaTask: (data: Omit<SocialMediaTask, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: SocialMediaTask = {
      ...data,
      id: `smt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    socialMediaTasksList.unshift(newTask);
    return newTask;
  },

  // ============================================================================
  // GOOGLE CALENDAR APPOINTMENT ENGINE & TASK CHECKLIST TRACKER
  // ============================================================================
  getAppointments: (dateFilter?: string) => {
    if (dateFilter) {
      return appointmentsList.filter(a => a.date === dateFilter);
    }
    return appointmentsList;
  },

  getAppointmentById: (id: string) => {
    return appointmentsList.find(a => a.id === id) || null;
  },

  createAppointment: (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
    const defaultColor = data.color || (
      data.appointmentType === 'CLIENT_MEETING' ? '#10b981' :
        data.appointmentType === 'PROJECT_REVIEW' ? '#0284c7' :
          data.appointmentType === 'DISCOVERY_CALL' ? '#f59e0b' :
            data.appointmentType === 'INTERNAL_SPRINT' ? '#8b5cf6' :
              data.appointmentType === 'INFLUENCER_BRIEFING' ? '#ec4899' : '#6366f1'
    );

    const generatedMeetLink = data.locationType === 'GOOGLE_MEET' && !data.meetingLink
      ? `https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
      : (data.meetingLink || '');

    const newApt: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
      color: defaultColor,
      locationType: data.locationType || 'GOOGLE_MEET',
      meetingLink: generatedMeetLink,
      status: data.status || 'SCHEDULED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointmentsList.unshift(newApt);
    return newApt;
  },

  updateAppointment: (id: string, updates: Partial<Appointment>) => {
    const apt = appointmentsList.find(a => a.id === id);
    if (!apt) return null;
    Object.assign(apt, updates, { updatedAt: new Date().toISOString() });
    return apt;
  },

  deleteAppointment: (id: string, deletedBy?: string) => {
    const idx = appointmentsList.findIndex(a => a.id === id);
    if (idx === -1) return false;
    const apt = appointmentsList[idx];
    moveToRecycleBin(
      apt.id,
      'APPOINTMENT',
      apt.title,
      `${apt.date} ${apt.startTime}-${apt.endTime} • ${apt.appointmentType.replace(/_/g, ' ')} • ${apt.clientName || apt.leadName || 'General'}`,
      apt,
      deletedBy
    );
    appointmentsList.splice(idx, 1);
    return true;
  },

  // Interactive Task Checklist toggles for Calendar & Quick Progress Tracking
  toggleTaskChecklist: (taskId: string, isCompleted?: boolean) => {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return null;

    if (isCompleted !== undefined) {
      task.status = isCompleted ? 'COMPLETED' : 'IN_PROGRESS';
    } else {
      task.status = task.status === 'COMPLETED' ? 'IN_PROGRESS' : 'COMPLETED';
    }

    // If marked completed, mark all sub-checklist items as completed
    if (task.status === 'COMPLETED' && task.subTasks && task.subTasks.length > 0) {
      task.subTasks.forEach(st => st.isCompleted = true);
    }

    task.updatedAt = new Date().toISOString();
    return task;
  },

  toggleSubTask: (taskId: string, subTaskId: string, isCompleted?: boolean) => {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return null;
    if (!task.subTasks) task.subTasks = [];
    const st = task.subTasks.find(s => s.id === subTaskId);
    if (!st) return null;

    st.isCompleted = isCompleted !== undefined ? isCompleted : !st.isCompleted;

    // Auto-update parent task status if all subtasks complete
    if (task.subTasks.length > 0 && task.subTasks.every(s => s.isCompleted)) {
      task.status = 'COMPLETED';
    } else if (task.status === 'COMPLETED' && !st.isCompleted) {
      task.status = 'IN_PROGRESS';
    }

    task.updatedAt = new Date().toISOString();
    return task;
  },

  addSubTaskToChecklist: (taskId: string, title: string) => {
    const task = tasksList.find(t => t.id === taskId);
    if (!task) return null;
    if (!task.subTasks) task.subTasks = [];

    const newSubTask = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      taskId,
      title: title.trim(),
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    task.subTasks.push(newSubTask);
    task.updatedAt = new Date().toISOString();
    return task;
  },

  // Staff Attendance & Payroll Engine (Phase 6)
  getWorkCalendar: () => workCalendar,
  updateWorkCalendar: (workingDaysCount: number, holidays: { date: string; name: string }[]) => {
    workCalendar = {
      ...workCalendar,
      workingDaysCount,
      holidays,
      updatedAt: new Date().toISOString()
    };
    return workCalendar;
  },

  getAttendance: () => attendanceList,
  getAttendanceRecords: (staffId?: string, date?: string) => {
    let list = attendanceList;
    if (staffId) list = list.filter(a => a.staffId === staffId);
    if (date) list = list.filter(a => a.date === date);
    return list;
  },
  logAttendance: (staffId: string, date: string, status: any, reason?: string) => {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return null;

    const dailyRate = Math.round(staff.monthlySalary / workCalendar.workingDaysCount);
    let deductionAmount = 0;
    let isDeductionApplied = false;

    if (status === 'ABSENT' || status === 'PRE_APPLIED_LEAVE') {
      deductionAmount = dailyRate;
      isDeductionApplied = true;
    } else if (status === 'HALF_DAY') {
      deductionAmount = Math.round(dailyRate * 0.5);
      isDeductionApplied = true;
    }

    // Replace if existing for same day
    attendanceList = attendanceList.filter(a => !(a.staffId === staffId && a.date === date));

    const record: AttendanceRecord = {
      id: `att-${Date.now()}`,
      staffId,
      staffName: staff.name,
      date,
      status,
      reason,
      isDeductionApplied,
      deductionAmount,
      createdAt: new Date().toISOString()
    };
    attendanceList.push(record);
    return record;
  },

  updateAttendance: (id: string, data: Partial<AttendanceRecord>) => {
    const rec = attendanceList.find(a => a.id === id);
    if (!rec) return null;
    const staff = staffList.find(s => s.id === (data.staffId || rec.staffId));
    if (staff && data.status) {
      const dailyRate = Math.round(staff.monthlySalary / workCalendar.workingDaysCount);
      if (data.status === 'ABSENT' || data.status === 'PRE_APPLIED_LEAVE') {
        data.deductionAmount = dailyRate;
        data.isDeductionApplied = true;
      } else if (data.status === 'HALF_DAY') {
        data.deductionAmount = Math.round(dailyRate * 0.5);
        data.isDeductionApplied = true;
      } else if (data.status === 'PRESENT') {
        data.deductionAmount = 0;
        data.isDeductionApplied = false;
      }
    }
    Object.assign(rec, data);
    return rec;
  },

  deleteAttendance: (id: string, deletedBy?: string) => {
    const idx = attendanceList.findIndex(a => a.id === id);
    if (idx === -1) return false;
    const att = attendanceList[idx];
    moveToRecycleBin(
      att.id,
      'ATTENDANCE',
      `Attendance: ${att.staffName}`,
      `Date: ${att.date} • Status: ${att.status} • Deduction: ₹${att.deductionAmount}`,
      att,
      deletedBy
    );
    attendanceList.splice(idx, 1);
    return true;
  },

  getStaffPayrollSummary: (staffId: string) => {
    const staff = staffList.find(s => s.id === staffId);
    if (!staff) return null;

    const staffRecords = attendanceList.filter(a => a.staffId === staffId);
    const absentCount = staffRecords.filter(a => a.status === 'ABSENT' || a.status === 'PRE_APPLIED_LEAVE').length;
    const halfDayCount = staffRecords.filter(a => a.status === 'HALF_DAY').length;
    const totalDeductions = staffRecords.reduce((sum, a) => sum + a.deductionAmount, 0);
    const netSalaryPayable = Math.max(0, staff.monthlySalary - totalDeductions);
    const dailyRate = Math.round(staff.monthlySalary / workCalendar.workingDaysCount);

    return {
      staffId: staff.id,
      staffName: staff.name,
      role: staff.role,
      monthlySalary: staff.monthlySalary,
      workingDaysCount: workCalendar.workingDaysCount,
      dailyRate,
      absentCount,
      halfDayCount,
      totalDeductions,
      netSalaryPayable,
      salaryPaidDate: staff.salaryPaidDate,
      isSalaryOverdue: staff.isSalaryOverdue
    };
  },

  // Invoicing, Final Clearance Gate & GST Liabilities (Phase 7)
  getInvoices: () => invoicesList,

  getNextInvoiceNumber: (date: Date = new Date()) => {
    const fySuffix = getFinancialYearSuffix(date);
    let maxSeq = 0;
    const regex = new RegExp(`^INV-(\\d+)-${fySuffix}$`, 'i');

    invoicesList.forEach(inv => {
      if (inv.invoiceNumber) {
        const m = inv.invoiceNumber.match(regex);
        if (m) {
          const val = parseInt(m[1], 10);
          if (!isNaN(val) && val > maxSeq) maxSeq = val;
        }
      }
    });

    recycleBinList.forEach(item => {
      if (item.entityType === 'INVOICE') {
        const num = item.data?.invoiceNumber || item.title;
        if (num) {
          const m = num.match(regex);
          if (m) {
            const val = parseInt(m[1], 10);
            if (!isNaN(val) && val > maxSeq) maxSeq = val;
          }
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `INV-${String(nextSeq).padStart(3, '0')}-${fySuffix}`;
  },

  getNextReceiptNumber: (date: Date = new Date()) => {
    const fySuffix = getFinancialYearSuffix(date);
    let maxSeq = 0;
    const regex = new RegExp(`^RCP-(\\d+)-${fySuffix}$`, 'i');

    receiptsList.forEach(r => {
      if (r.receiptNumber) {
        const m = r.receiptNumber.match(regex);
        if (m) {
          const val = parseInt(m[1], 10);
          if (!isNaN(val) && val > maxSeq) maxSeq = val;
        }
      }
    });

    projectsList.forEach(p => {
      if (p.receipts && Array.isArray(p.receipts)) {
        p.receipts.forEach(r => {
          if (r.receiptNumber) {
            const m = r.receiptNumber.match(regex);
            if (m) {
              const val = parseInt(m[1], 10);
              if (!isNaN(val) && val > maxSeq) maxSeq = val;
            }
          }
        });
      }
    });

    recycleBinList.forEach(item => {
      if (item.entityType === 'RECEIPT') {
        const num = item.data?.receiptNumber || item.title;
        if (num) {
          const m = num.match(regex);
          if (m) {
            const val = parseInt(m[1], 10);
            if (!isNaN(val) && val > maxSeq) maxSeq = val;
          }
        }
      }
    });

    const nextSeq = maxSeq + 1;
    return `RCP-${String(nextSeq).padStart(3, '0')}-${fySuffix}`;
  },

  createInvoice: (data: {
    clientId: string;
    projectId?: string;
    type?: any;
    subtotal: number;
    gstType?: GSTType;
    dueDate: string;
    lineItems?: any[];
    notes?: string;
    isFinalInvoice?: boolean;
    installments?: InvoicePaymentInstallment[];
    initialPaymentAmount?: number;
    initialPaymentLabel?: string;
    initialPaymentDate?: string;
    nextScheduledPaymentAmount?: number;
    nextScheduledDueDate?: string;
    delayReason?: 'OUR_MISTAKE_PROJECT_DELAY' | 'CLIENT_DELAY' | 'MUTUAL_AGREEMENT';
    delayNotes?: string;
    isOnHold?: boolean;
    holdReason?: string;
  }) => {
    const client = clientsList.find(c => c.id === data.clientId);
    if (!client) throw new Error('Client not found');

    // RULE 1: SINGLE MASTER INVOICE PER PROJECT
    if (data.projectId) {
      const existing = invoicesList.find(i => i.projectId === data.projectId);
      if (existing) {
        if (data.installments && data.installments.length > 0) existing.installments = data.installments;
        if (data.nextScheduledPaymentAmount !== undefined) existing.nextScheduledPaymentAmount = data.nextScheduledPaymentAmount;
        if (data.nextScheduledDueDate !== undefined) existing.nextScheduledDueDate = data.nextScheduledDueDate;
        if (data.delayReason !== undefined) existing.delayReason = data.delayReason;
        if (data.delayNotes !== undefined) existing.delayNotes = data.delayNotes;
        if (data.isOnHold !== undefined) existing.isOnHold = data.isOnHold;
        if (data.notes) existing.notes = data.notes;
        if (data.dueDate) existing.dueDate = data.dueDate;

        // Recalculate paid amount from installments if any
        if (existing.installments && existing.installments.length > 0) {
          const paidSum = existing.installments
            .filter(inst => inst.status === 'PAID')
            .reduce((s, inst) => s + (inst.amount || 0), 0);
          if (paidSum > (existing.paidAmount || 0)) {
            existing.paidAmount = paidSum;
          }
        }
        existing.balanceDue = Math.max(0, existing.totalAmount - (existing.paidAmount || 0));
        if (existing.balanceDue === 0 && (existing.paidAmount || 0) > 0) {
          existing.status = 'PAID';
          existing.closedMonth = new Date().toISOString().slice(0, 7);
        } else if ((existing.paidAmount || 0) > 0) {
          existing.status = 'PARTIALLY_PAID';
        }
        return existing;
      }
    }

    // Phase 7 Rule: Block final invoice generation until all client dues are fully cleared
    if (data.isFinalInvoice && data.projectId) {
      const proj = projectsList.find(p => p.id === data.projectId);
      if (proj && proj.balanceDue > 0) {
        throw new Error(`Final invoice blocked: Client still has pending unpaid balance of ₹${proj.balanceDue.toLocaleString('en-IN')}`);
      }
    }

    const proj = data.projectId ? projectsList.find(p => p.id === data.projectId) : undefined;

    // Project contract value rule: do NOT tack on extra +18% on top of agreed contract value!
    const contractTotal = proj ? proj.totalValue : Number(data.subtotal || 0);
    const subtotal = contractTotal;
    const totalAmount = contractTotal;
    const taxAmount = 0;

    const gstType: GSTType = proj && proj.gstAmount && proj.gstAmount > 0
      ? 'ADDITIONAL_18'
      : (data.gstType || 'NO_GST');

    let internalTaxCalculated = 0;
    if (gstType === 'INCLUSIVE_18') {
      internalTaxCalculated = Math.round((totalAmount * 18) / 118);
    } else {
      internalTaxCalculated = Math.round(totalAmount * 0.18);
    }

    const installments: InvoicePaymentInstallment[] = Array.isArray(data.installments) && data.installments.length > 0
      ? data.installments
      : [];

    let initialPaid = 0;
    if (installments.length > 0) {
      initialPaid = installments.reduce((s, inst) => {
        if (inst.status === 'PAID') return s + Number(inst.paidAmount || inst.amount || 0);
        if (inst.status === 'PARTIALLY_PAID') return s + Number(inst.paidAmount || 0);
        return s;
      }, 0);
    } else if (data.initialPaymentAmount && Number(data.initialPaymentAmount) > 0) {
      initialPaid = Number(data.initialPaymentAmount);
      installments.unshift({
        id: `inst-${Date.now()}-1`,
        label: data.initialPaymentLabel || '1st Payment (Advance)',
        amount: initialPaid,
        paidAmount: initialPaid,
        status: initialPaid >= totalAmount ? 'PAID' : 'PARTIALLY_PAID',
        dueDate: data.initialPaymentDate || new Date().toISOString().split('T')[0],
        paidDate: data.initialPaymentDate || new Date().toISOString().split('T')[0],
        paymentMethod: 'UPI / Bank Transfer'
      });
    }

    // Strict cap: Initial collected cannot exceed total contract value
    initialPaid = Math.min(initialPaid, totalAmount);
    const balanceDue = Math.max(0, totalAmount - initialPaid);
    const status: InvoiceStatus = balanceDue === 0 && initialPaid > 0
      ? 'PAID'
      : (initialPaid > 0 ? 'PARTIALLY_PAID' : 'SENT');

    const nextNumber = DataService.getNextInvoiceNumber();

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: nextNumber,
      clientId: client.id,
      clientName: client.businessName,
      clientEmail: client.email,
      clientPhone: client.whatsappNumber,
      projectId: data.projectId,
      projectTitle: proj?.title,
      type: data.type || (proj ? 'MILESTONE_PROJECT' : 'RECURRING_RETAINER'),
      subtotal,
      gstType,
      amount: subtotal,
      taxAmount,
      totalAmount,
      paidAmount: initialPaid,
      balanceDue,
      internalTaxCalculated,
      status,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: data.dueDate,
      lineItems: data.lineItems || [
        {
          id: `li-${Date.now()}`,
          description: proj ? `${proj.title} - Agreed Milestone Contract` : 'Monthly Agency Retainer & Development Services',
          quantity: 1,
          rate: totalAmount,
          amount: totalAmount
        }
      ],
      installments,
      nextScheduledPaymentAmount: data.nextScheduledPaymentAmount || (balanceDue > 0 ? balanceDue : undefined),
      nextScheduledDueDate: data.nextScheduledDueDate || (balanceDue > 0 ? data.dueDate : undefined),
      delayReason: data.delayReason,
      delayNotes: data.delayNotes,
      isOnHold: Boolean(data.isOnHold),
      notes: data.notes || 'Payment via NEFT / RTGS or UPI. Thank you for your partnership.',
      isFinalInvoice: Boolean(data.isFinalInvoice),
      closedMonth: status === 'PAID' ? new Date().toISOString().slice(0, 7) : undefined,
      createdAt: new Date().toISOString()
    };

    invoicesList.unshift(newInvoice);

    // If initial payment was collected, automatically record payment receipt
    if (initialPaid > 0) {
      DataService.recordClientPayment({
        clientId: client.id,
        projectId: data.projectId,
        invoiceId: newInvoice.id,
        amount: initialPaid,
        milestoneLabel: data.initialPaymentLabel || '1st Payment (Advance)',
        paymentMethod: 'Bank Transfer / NEFT',
        notes: 'Initial payment recorded on master invoice creation',
        nextDueDate: newInvoice.nextScheduledDueDate,
        paymentDate: data.initialPaymentDate || new Date().toISOString().split('T')[0]
      }).catch(err => console.error('[AutoReceipt Error]', err));
    }

    return newInvoice;
  },

  sendPaymentReminder: async (invoiceId: string) => {
    const invoice = invoicesList.find(i => i.id === invoiceId);
    if (!invoice) return null;
    const client = clientsList.find(c => c.id === invoice.clientId);
    const phone = invoice.clientPhone || client?.whatsappNumber || '+919876543210';
    const clientName = invoice.clientName || client?.contactName || 'Client';

    const message = `🔔 *Payment Reminder: ${invoice.invoiceNumber}*\n\nDear ${clientName},\nThis is a friendly reminder that invoice ${invoice.invoiceNumber} for ₹${invoice.totalAmount.toLocaleString('en-IN')} was due on ${invoice.dueDate}.\n\nPlease settle via NEFT/UPI or reply for assistance.`;

    inMemoryWhatsAppLogs.unshift({
      id: `wal-${Date.now()}`,
      recipientPhone: phone,
      recipientName: clientName,
      recipientType: 'CLIENT',
      eventType: 'DUE_REMINDER',
      messageBody: message,
      status: 'DELIVERED',
      sentAt: new Date().toISOString()
    });

    return { invoice, message };
  },

  updateInvoice: (id: string, data: Partial<Invoice>) => {
    const inv = invoicesList.find(i => i.id === id);
    if (!inv) return null;

    if (data.totalAmount !== undefined || data.subtotal !== undefined) {
      const amt = Number(data.totalAmount || data.subtotal);
      inv.totalAmount = amt;
      inv.subtotal = amt;
      inv.amount = amt;
    }

    if (data.installments) {
      inv.installments = data.installments;
      const paidSum = data.installments.reduce((s, inst) => {
        if (inst.status === 'PAID') return s + Number(inst.paidAmount || inst.amount || 0);
        if (inst.status === 'PARTIALLY_PAID') return s + Number(inst.paidAmount || 0);
        return s;
      }, 0);
      inv.paidAmount = Math.min(paidSum, inv.totalAmount);

      // Automatically sync receipts for any paid installment that doesn't have one
      data.installments.forEach(inst => {
        if (inst.status === 'PAID') {
          const exists = receiptsList.some(r =>
            (r.invoiceId === inv.id || (inv.projectId && r.projectId === inv.projectId)) &&
            (r.milestoneLabel === inst.label || (inst.referenceId && r.referenceId === inst.referenceId))
          );
          if (!exists) {
            const rcpNum = DataService.getNextReceiptNumber();
            const paymentAmt = inst.paidAmount || inst.amount || 0;
            const rcp: PaymentReceipt = {
              id: `rcp-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              receiptNumber: rcpNum,
              projectId: inv.projectId || '',
              projectTitle: inv.projectTitle || 'Agency Deliverables',
              clientId: inv.clientId,
              clientName: inv.clientName,
              clientPhone: inv.clientPhone,
              amount: paymentAmt,
              totalContractValue: inv.totalAmount,
              totalPaidToDate: paidSum,
              remainingBalanceDue: Math.max(0, inv.totalAmount - paidSum),
              nextDueDate: inv.nextScheduledDueDate || inv.dueDate,
              nextDueAmount: inv.nextScheduledPaymentAmount,
              referenceId: inst.referenceId || `PAY-${Date.now().toString().slice(-6)}`,
              notes: inst.delayNotes || 'Milestone payment installment verified',
              milestoneLabel: inst.label,
              paymentMethod: inst.paymentMethod || 'UPI / Bank Transfer',
              recordedByStaffName: 'Accounts Desk',
              invoiceId: inv.id,
              invoiceNumber: inv.invoiceNumber,
              createdAt: inst.paidDate ? new Date(inst.paidDate).toISOString() : new Date().toISOString()
            };
            receiptsList.push(rcp);
          }
        }
      });
    }

    if (data.gstType) {
      inv.gstType = data.gstType;
    }

    // Always compute internal 18% GST statutory liability figure
    if (inv.gstType === 'INCLUSIVE_18') {
      inv.internalTaxCalculated = Math.round((inv.totalAmount * 18) / 118);
    } else {
      inv.internalTaxCalculated = Math.round(inv.totalAmount * 0.18);
    }

    if (data.invoiceNumber) inv.invoiceNumber = data.invoiceNumber;
    if (data.dueDate) inv.dueDate = data.dueDate;
    if (data.delayReason !== undefined) inv.delayReason = data.delayReason;
    if (data.delayNotes !== undefined) inv.delayNotes = data.delayNotes;
    if (data.isOnHold !== undefined) inv.isOnHold = data.isOnHold;
    if (data.holdReason !== undefined) inv.holdReason = data.holdReason;
    if (data.notes !== undefined) inv.notes = data.notes;
    if (data.lateFeeAssigned !== undefined) inv.lateFeeAssigned = data.lateFeeAssigned;
    if (data.paidAmount !== undefined && !data.installments) inv.paidAmount = data.paidAmount;

    inv.balanceDue = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));

    // Cap next scheduled payment to remaining balance
    if (data.nextScheduledPaymentAmount !== undefined) {
      inv.nextScheduledPaymentAmount = Math.min(Number(data.nextScheduledPaymentAmount || 0), inv.balanceDue);
    } else if (inv.nextScheduledPaymentAmount !== undefined) {
      inv.nextScheduledPaymentAmount = Math.min(inv.nextScheduledPaymentAmount, inv.balanceDue);
    }
    if (data.nextScheduledDueDate !== undefined) inv.nextScheduledDueDate = data.nextScheduledDueDate;

    if (inv.balanceDue === 0 && (inv.paidAmount || 0) > 0) {
      inv.status = 'PAID';
      inv.closedMonth = new Date().toISOString().slice(0, 7);
      inv.nextScheduledPaymentAmount = 0;
    } else if ((inv.paidAmount || 0) > 0) {
      inv.status = 'PARTIALLY_PAID';
    } else if (data.status) {
      inv.status = data.status;
    }

    // Sync project metrics
    if (inv.projectId) {
      const proj = projectsList.find(p => p.id === inv.projectId);
      if (proj) {
        proj.collectedAmount = inv.paidAmount || 0;
        proj.balanceDue = inv.balanceDue;
        if (inv.balanceDue === 0) {
          proj.status = 'COMPLETED';
        }
      }
    }

    return inv;
  },

  deleteInvoice: (id: string, deletedBy?: string) => {
    const idx = invoicesList.findIndex(i => i.id === id);
    if (idx === -1) return false;
    const inv = invoicesList[idx];
    moveToRecycleBin(
      inv.id,
      'INVOICE',
      inv.invoiceNumber,
      `${inv.clientName} • ₹${(inv.totalAmount || 0).toLocaleString('en-IN')} • ${inv.status}`,
      inv,
      deletedBy
    );
    invoicesList.splice(idx, 1);
    return true;
  },

  // Payment Receipts & Split Payment Engine
  getReceipts: () => receiptsList,

  recordClientPayment: async (data: {
    clientId: string;
    projectId?: string;
    invoiceId?: string;
    amount: number;
    milestoneLabel?: string;
    paymentMethod: string;
    referenceId?: string;
    notes?: string;
    nextDueDate?: string;
    recordedBy?: { id: string; name: string; phone: string };
    paymentDate?: string;
  }) => {
    const client = clientsList.find(c => c.id === data.clientId);
    if (!client) throw new Error('Client not found');

    let project = data.projectId ? projectsList.find(p => p.id === data.projectId) : undefined;
    if (!project) {
      project = projectsList.find(p => p.clientId === data.clientId && p.balanceDue > 0);
    }
    if (!project) {
      project = projectsList.find(p => p.clientId === data.clientId);
    }

    if (!project) {
      project = {
        id: `proj-${Date.now()}`,
        clientId: client.id,
        clientName: client.businessName,
        title: `${client.businessName} - Agency Deliverables & Services`,
        projectType: client.clientType,
        status: 'IN_PROGRESS',
        isAdvanceReceived: true,
        advanceRequired: data.amount,
        totalValue: client.monthlyRetainerAmount > 0 ? client.monthlyRetainerAmount : data.amount,
        billedAmount: 0,
        collectedAmount: 0,
        balanceDue: client.monthlyRetainerAmount > 0 ? client.monthlyRetainerAmount : data.amount,
        budget: client.monthlyRetainerAmount > 0 ? client.monthlyRetainerAmount : data.amount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      projectsList.push(project);
    }

    const paymentAmount = Number(data.amount) || 0;
    if (paymentAmount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Identify targeted invoice if any
    let targetedInvoice = data.invoiceId ? invoicesList.find(i => i.id === data.invoiceId) : undefined;
    if (!targetedInvoice && data.projectId) {
      targetedInvoice = invoicesList.find(i => i.projectId === data.projectId && i.status !== 'PAID');
    }

    // STRICT CUMULATIVE CAP VALIDATION 1: Cannot exceed Project Contract Value
    const remainingProjectBalance = Math.max(0, project.totalValue - (project.collectedAmount || 0));
    if (paymentAmount > remainingProjectBalance) {
      throw new Error(`Overpayment blocked: Payment of ₹${paymentAmount.toLocaleString('en-IN')} exceeds remaining project balance of ₹${remainingProjectBalance.toLocaleString('en-IN')}. Cumulative payments cannot exceed Total Contract Value of ₹${project.totalValue.toLocaleString('en-IN')}.`);
    }

    // STRICT CUMULATIVE CAP VALIDATION 2: Cannot exceed Targeted Invoice Total Value
    if (targetedInvoice) {
      const remainingInvoiceBalance = Math.max(0, targetedInvoice.totalAmount - (targetedInvoice.paidAmount || 0));
      if (paymentAmount > remainingInvoiceBalance) {
        throw new Error(`Overpayment blocked: Payment of ₹${paymentAmount.toLocaleString('en-IN')} exceeds remaining invoice balance of ₹${remainingInvoiceBalance.toLocaleString('en-IN')}. Cumulative payments cannot exceed Total Invoice Value of ₹${targetedInvoice.totalAmount.toLocaleString('en-IN')}.`);
      }
    }

    // Calculate late fee if overdue before recording
    const lateFeeInfo = DataService.calculateLateFee(project);

    // Update Project Balances
    project.collectedAmount += paymentAmount;
    project.balanceDue = Math.max(0, project.totalValue - project.collectedAmount);
    project.isAdvanceReceived = true;
    if (data.nextDueDate) {
      project.dueDate = data.nextDueDate;
    }
    project.updatedAt = new Date().toISOString();

    const receiptNum = DataService.getNextReceiptNumber();
    const paymentTimestamp = data.paymentDate
      ? new Date(data.paymentDate).toISOString()
      : new Date().toISOString();

    const receipt: PaymentReceipt = {
      id: `rcp-${Date.now()}`,
      receiptNumber: receiptNum,
      projectId: project.id,
      projectTitle: project.title,
      clientId: client.id,
      clientName: client.businessName,
      clientPhone: client.whatsappNumber,
      amount: paymentAmount,
      totalContractValue: project.totalValue,
      totalPaidToDate: project.collectedAmount,
      remainingBalanceDue: project.balanceDue,
      lateFeeAccrued: lateFeeInfo.penaltyAmount,
      nextDueDate: data.nextDueDate || project.dueDate,
      referenceId: data.referenceId || '',
      notes: data.notes || '',
      milestoneLabel: data.milestoneLabel || (project.balanceDue === 0 ? 'Final 100% Clearance' : `Installment Split Payment`),
      paymentMethod: data.paymentMethod || 'UPI / Bank Transfer',
      recordedByStaffId: data.recordedBy?.id || 'staff-acc',
      recordedByStaffName: data.recordedBy?.name || 'Accounts Desk',
      recordedByStaffPhone: data.recordedBy?.phone || '+919876543208',
      autoInvoiceGenerated: false,
      createdAt: paymentTimestamp
    };

    if (targetedInvoice) {
      targetedInvoice.paidAmount = (targetedInvoice.paidAmount || 0) + paymentAmount;
      targetedInvoice.balanceDue = Math.max(0, targetedInvoice.totalAmount - targetedInvoice.paidAmount);
      receipt.invoiceId = targetedInvoice.id;
      receipt.invoiceNumber = targetedInvoice.invoiceNumber;
      if (data.nextDueDate) {
        targetedInvoice.dueDate = data.nextDueDate;
        targetedInvoice.nextScheduledDueDate = data.nextDueDate;
      }

      // Update installment tracking
      if (targetedInvoice.installments && targetedInvoice.installments.length > 0) {
        const pendingInst = targetedInvoice.installments.find(inst => inst.status !== 'PAID');
        if (pendingInst) {
          pendingInst.paidAmount = paymentAmount;
          pendingInst.status = 'PAID';
          pendingInst.paidDate = paymentTimestamp.split('T')[0];
          pendingInst.paymentMethod = data.paymentMethod;
          pendingInst.referenceId = data.referenceId;
        }
        const nextPending = targetedInvoice.installments.find(inst => inst.status !== 'PAID');
        if (nextPending) {
          targetedInvoice.nextScheduledPaymentAmount = nextPending.amount;
          if (nextPending.dueDate) targetedInvoice.nextScheduledDueDate = nextPending.dueDate;
        } else {
          targetedInvoice.nextScheduledPaymentAmount = 0;
        }
      }

      if (targetedInvoice.balanceDue === 0) {
        targetedInvoice.status = 'PAID';
        targetedInvoice.paidDate = paymentTimestamp.split('T')[0];
        targetedInvoice.closedMonth = new Date().toISOString().slice(0, 7);
      } else {
        targetedInvoice.status = 'PARTIALLY_PAID';
      }
    }

    let autoInvoice: Invoice | null = null;

    // RULE: Only when the client pays totally (balanceDue === 0) and no existing invoice was targeted, create the invoice automatically!
    if (project.balanceDue <= 0 && !targetedInvoice) {
      project.status = 'COMPLETED';

      // Auto-create official final tax invoice on completion date!
      const nextInvNum = DataService.getNextInvoiceNumber();
      const invoiceSubtotal = Math.round(project.totalValue / 1.18);
      const invoiceTax = project.totalValue - invoiceSubtotal;

      autoInvoice = {
        id: `inv-${Date.now()}`,
        invoiceNumber: nextInvNum,
        clientId: client.id,
        clientName: client.businessName,
        clientEmail: client.email,
        clientPhone: client.whatsappNumber,
        projectId: project.id,
        type: project.projectType === 'RECURRING_RETAINER' ? 'RECURRING_RETAINER' : 'MILESTONE_WEB_DEV',
        subtotal: invoiceSubtotal,
        gstType: 'INCLUSIVE_18',
        amount: invoiceSubtotal,
        taxAmount: invoiceTax,
        totalAmount: project.totalValue,
        paidAmount: project.totalValue,
        balanceDue: 0,
        internalTaxCalculated: invoiceTax,
        status: 'PAID', // Automatically marked as PAID!
        issueDate: paymentTimestamp.split('T')[0],
        paidDate: paymentTimestamp.split('T')[0],
        dueDate: paymentTimestamp.split('T')[0],
        lineItems: [
          {
            id: `li-final-${Date.now()}`,
            description: `${project.title} (100% Contract Delivery & Milestone Clearance)`,
            quantity: 1,
            rate: invoiceSubtotal,
            amount: invoiceSubtotal
          }
        ],
        notes: `Official Tax Invoice auto-generated on ${paymentTimestamp.split('T')[0]} upon 100% full settlement of all split milestone payments. Balance Due: ₹0 Nil.`,
        isFinalInvoice: true,
        createdAt: paymentTimestamp
      };

      invoicesList.unshift(autoInvoice);

      receipt.autoInvoiceGenerated = true;
      receipt.invoiceId = autoInvoice.id;
      receipt.invoiceNumber = autoInvoice.invoiceNumber;
    }

    receiptsList.unshift(receipt);

    // Double-Entry Accounting Tally Ledger Post
    const isCash = (data.paymentMethod || '').toUpperCase().includes('CASH');
    const assetAccountCode = isCash ? '1010' : '1020';
    const assetAccountName = isCash ? 'Cash in Hand (Petty Cash)' : 'HDFC Bank - Current A/C (Operating)';

    try {
      DataService.addJournalEntry({
        voucherType: 'RECEIPT',
        date: paymentTimestamp.split('T')[0],
        referenceNo: receiptNum,
        narration: `Client payment received from ${client.businessName} for ${project.title} (${data.milestoneLabel || 'Milestone Settlement'})`,
        lines: [
          {
            accountCode: assetAccountCode,
            accountName: assetAccountName,
            debit: paymentAmount,
            credit: 0
          },
          {
            accountCode: '1040',
            accountName: 'Accounts Receivable (Trade Debtors)',
            debit: 0,
            credit: paymentAmount
          }
        ]
      });
    } catch (jeErr) {
      console.warn('Auto journal entry note:', jeErr);
    }

    // Dispatch WhatsApp Receipt Acknowledgment
    try {
      await triggerPaymentReceiptWhatsApp({
        phone: client.whatsappNumber,
        clientName: client.contactName,
        receiptNumber: receipt.receiptNumber,
        amount: receipt.amount,
        milestoneLabel: receipt.milestoneLabel,
        remainingBalanceDue: receipt.remainingBalanceDue,
        nextDueDate: receipt.nextDueDate,
        totalContractValue: receipt.totalContractValue,
        lateFeeAccrued: receipt.lateFeeAccrued,
        autoInvoiceGenerated: receipt.autoInvoiceGenerated,
        invoiceNumber: receipt.invoiceNumber,
        accountManagerName: data.recordedBy?.name || 'Accounts Desk',
        accountManagerPhone: data.recordedBy?.phone || '+919876543208'
      });
    } catch (e) {
      console.error('WhatsApp receipt dispatch error:', e);
    }

    return { receipt, project, autoInvoice: autoInvoice || targetedInvoice };
  },

  deleteReceipt: (id: string, deletedBy?: string) => {
    const idx = receiptsList.findIndex(r => r.id === id);
    if (idx === -1) return false;
    const receipt = receiptsList[idx];

    // Revert project collectedAmount & balanceDue
    if (receipt.projectId) {
      const project = projectsList.find(p => p.id === receipt.projectId);
      if (project) {
        project.collectedAmount = Math.max(0, project.collectedAmount - receipt.amount);
        project.balanceDue = Math.max(0, project.totalValue - project.collectedAmount);
        if (project.balanceDue > 0 && project.status === 'COMPLETED') {
          project.status = 'IN_PROGRESS';
        }
      }
    }

    if (receipt.invoiceId) {
      const inv = invoicesList.find(i => i.id === receipt.invoiceId);
      if (inv) {
        inv.paidAmount = Math.max(0, (inv.paidAmount || 0) - receipt.amount);
        inv.balanceDue = Math.max(0, inv.totalAmount - (inv.paidAmount || 0));
        if (inv.balanceDue > 0) {
          inv.status = (inv.paidAmount || 0) > 0 ? 'PARTIALLY_PAID' : 'SENT';
          inv.paidDate = undefined;
        }
      }
    }

    moveToRecycleBin(
      receipt.id,
      'RECEIPT',
      receipt.receiptNumber,
      `${receipt.clientName} • ₹${(receipt.amount || 0).toLocaleString('en-IN')} via ${receipt.paymentMethod}`,
      receipt,
      deletedBy
    );
    receiptsList.splice(idx, 1);
    return true;
  },

  updateReceipt: (id: string, data: Partial<PaymentReceipt>) => {
    const receipt = receiptsList.find(r => r.id === id);
    if (!receipt) return null;

    if (data.amount && data.amount !== receipt.amount && receipt.projectId) {
      const project = projectsList.find(p => p.id === receipt.projectId);
      if (project) {
        const diff = data.amount - receipt.amount;
        project.collectedAmount += diff;
        project.balanceDue = Math.max(0, project.totalValue - project.collectedAmount);
      }
    }

    Object.assign(receipt, data);
    return receipt;
  },

  // Vendors & Office Expenses Portal (Phase 8)
  getVendors: () => vendorsList,

  addVendor: (data: Omit<Vendor, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newVendor: Vendor = {
      ...data,
      id: `vend-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    vendorsList.push(newVendor);
    if (newVendor.projectId) {
      const proj = projectsList.find(p => p.id === newVendor.projectId);
      if (proj) {
        const projVendors = vendorsList.filter(v => v.projectId === proj.id);
        const projExps = expensesList.filter(e => (e as any).projectId === proj.id);
        proj.expensesTotal = projVendors.reduce((s, v) => s + (Number(v.totalPayable) || 0), 0) + projExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      }
    }
    persistStore();
    return newVendor;
  },

  logVendorPayment: async (vendorId: string, amount: number, paymentMethod: string) => {
    const vendor = vendorsList.find(v => v.id === vendorId);
    if (!vendor) return null;

    const currentBalance = Math.max(0, vendor.totalPayable - (vendor.advancePaid || 0));
    let billPaymentAmount = amount;
    let advanceCreditAmount = 0;

    if (amount > currentBalance) {
      billPaymentAmount = currentBalance;
      advanceCreditAmount = amount - currentBalance;
      vendor.advancePaid = vendor.totalPayable;
      vendor.balanceDue = 0;
      vendor.advanceCredit = (vendor.advanceCredit || 0) + advanceCreditAmount;
    } else {
      vendor.advancePaid = (vendor.advancePaid || 0) + amount;
      vendor.balanceDue = Math.max(0, vendor.totalPayable - vendor.advancePaid);
    }
    vendor.updatedAt = new Date().toISOString();

    // Log Expense under Purchases / Operational
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      vendorId: vendor.id,
      vendorName: vendor.companyName,
      category: vendor.serviceCategory as any,
      description: advanceCreditAmount > 0
        ? `Part Payment to ${vendor.companyName}: ₹${billPaymentAmount.toLocaleString('en-IN')} (bill settlement) + ₹${advanceCreditAmount.toLocaleString('en-IN')} (Advance Credit to Vendor)`
        : `Payment to ${vendor.companyName} via ${paymentMethod}`,
      amount,
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };
    expensesList.unshift(exp);
    persistStore();

    // Double-Entry Accounting Tally Ledger Post
    const isCash = (paymentMethod || '').toUpperCase().includes('CASH');
    const assetAccountCode = isCash ? '1010' : '1020';
    const assetAccountName = isCash ? 'Cash in Hand (Petty Cash)' : 'HDFC Bank - Current A/C (Operating)';

    try {
      DataService.addJournalEntry({
        voucherType: 'PAYMENT',
        date: new Date().toISOString().split('T')[0],
        referenceNo: `VPAY-${Date.now().toString().slice(-4)}`,
        narration: `Vendor disbursement to ${vendor.companyName} (${vendor.serviceCategory})`,
        lines: [
          {
            accountCode: '2010',
            accountName: 'Sundry Creditors (Tech & Cloud Vendors)',
            debit: amount,
            credit: 0
          },
          {
            accountCode: assetAccountCode,
            accountName: assetAccountName,
            debit: 0,
            credit: amount
          }
        ]
      });
    } catch (jeErr) {
      console.warn('Vendor journal entry note:', jeErr);
    }

    // Automated WhatsApp notice to vendor
    try {
      if (vendor.phone) {
        await triggerVendorPaymentWhatsApp({
          phone: vendor.phone,
          vendorCompany: vendor.companyName,
          amountPaid: amount,
          balanceDue: vendor.balanceDue,
          dueDate: vendor.dueDate
        });
      }
    } catch (e) {
      console.error('Vendor WhatsApp trigger error:', e);
    }

    return { vendor, expense: exp };
  },

  updateVendor: (id: string, data: Partial<Vendor>) => {
    const vend = vendorsList.find(v => v.id === id);
    if (!vend) return null;
    const oldProjectId = vend.projectId;
    if (data.totalPayable !== undefined || data.advancePaid !== undefined) {
      const total = data.totalPayable !== undefined ? data.totalPayable : vend.totalPayable;
      const adv = data.advancePaid !== undefined ? data.advancePaid : vend.advancePaid;
      data.balanceDue = Math.max(0, total - adv);
    }
    Object.assign(vend, data, { updatedAt: new Date().toISOString() });
    
    // Sync affected projects expenses
    const pId = vend.projectId || oldProjectId;
    if (pId) {
      const proj = projectsList.find(p => p.id === pId);
      if (proj) {
        const projVendors = vendorsList.filter(v => v.projectId === proj.id);
        const projExps = expensesList.filter(e => (e as any).projectId === proj.id);
        proj.expensesTotal = projVendors.reduce((s, v) => s + (Number(v.totalPayable) || 0), 0) + projExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      }
    }
    persistStore();
    return vend;
  },

  deleteVendor: (id: string, deletedBy?: string) => {
    const idx = vendorsList.findIndex(v => v.id === id);
    if (idx === -1) return false;
    const vend = vendorsList[idx];
    const pId = vend.projectId;
    moveToRecycleBin(
      vend.id,
      'VENDOR',
      vend.companyName,
      `${vend.serviceCategory} • Contact: ${vend.contactPerson || '-'} • Due: ₹${(vend.balanceDue || 0).toLocaleString('en-IN')}`,
      vend,
      deletedBy
    );
    vendorsList.splice(idx, 1);
    if (pId) {
      const proj = projectsList.find(p => p.id === pId);
      if (proj) {
        const projVendors = vendorsList.filter(v => v.projectId === proj.id);
        const projExps = expensesList.filter(e => (e as any).projectId === proj.id);
        proj.expensesTotal = projVendors.reduce((s, v) => s + (Number(v.totalPayable) || 0), 0) + projExps.reduce((s, e) => s + (Number(e.amount) || 0), 0);
      }
    }
    persistStore();
    return true;
  },

  // Influencers & Creators Directory
  getInfluencers: () => influencersList,

  addInfluencer: (data: Omit<Influencer, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newInf: Influencer = {
      ...data,
      id: `inf-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    influencersList.push(newInf);
    persistStore();
    return newInf;
  },

  updateInfluencer: (id: string, data: Partial<Influencer>) => {
    const inf = influencersList.find(i => i.id === id);
    if (!inf) return null;
    Object.assign(inf, data, { updatedAt: new Date().toISOString() });
    persistStore();
    return inf;
  },

  deleteInfluencer: (id: string, deletedBy?: string) => {
    const idx = influencersList.findIndex(i => i.id === id);
    if (idx === -1) return false;
    const inf = influencersList[idx];
    moveToRecycleBin(
      inf.id,
      'INFLUENCER' as any,
      inf.name,
      `${inf.platform} (${inf.handle}) • Followers: ${inf.followersCount}`,
      inf,
      deletedBy
    );
    influencersList.splice(idx, 1);
    persistStore();
    return true;
  },

  getExpenses: () => expensesList,
  addExpense: (data: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...data,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    expensesList.unshift(newExp);
    return newExp;
  },

  updateExpense: (id: string, data: Partial<Expense>) => {
    const exp = expensesList.find(e => e.id === id);
    if (!exp) return null;
    Object.assign(exp, data);
    return exp;
  },

  deleteExpense: (id: string, deletedBy?: string) => {
    const idx = expensesList.findIndex(e => e.id === id);
    if (idx === -1) return false;
    const exp = expensesList[idx];
    moveToRecycleBin(
      exp.id,
      'EXPENSE',
      exp.description,
      `${exp.category.replace(/_/g, ' ')} • ₹${(exp.amount || 0).toLocaleString('en-IN')}`,
      exp,
      deletedBy
    );
    expensesList.splice(idx, 1);
    return true;
  },

  // Clients & Credentials Vault (Phase 9)
  getClients: () => {
    return clientsList.map(c => ({
      ...c,
      credentials: credentialsVault.filter(v => v.clientId === c.id),
      projects: projectsList.filter(p => p.clientId === c.id)
    }));
  },

  addClient: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newClient: Client = {
      ...data,
      id: `client-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    clientsList.unshift(newClient);
    return newClient;
  },

  updateClient: (id: string, data: Partial<Client>) => {
    const client = clientsList.find(c => c.id === id);
    if (!client) return null;
    Object.assign(client, data, { updatedAt: new Date().toISOString() });
    return client;
  },

  deleteClient: (id: string, deletedBy?: string) => {
    const idx = clientsList.findIndex(c => c.id === id);
    if (idx === -1) return false;
    const client = clientsList[idx];
    moveToRecycleBin(
      client.id,
      'CLIENT',
      client.businessName,
      `Contact: ${client.contactName} • Retainer: ₹${(client.monthlyRetainerAmount || 0).toLocaleString('en-IN')}/mo`,
      client,
      deletedBy
    );
    clientsList.splice(idx, 1);
    return true;
  },

  getVaultCredentials: (clientId?: string) => {
    if (clientId) {
      return credentialsVault.filter(v => v.clientId === clientId);
    }
    return credentialsVault;
  },

  revealCredential: (id: string): string | null => {
    const cred = credentialsVault.find(c => c.id === id);
    if (!cred || !cred.encryptedPassword || !cred.iv) return null;
    return decryptCredential(cred.encryptedPassword, cred.iv);
  },

  revealVaultPassword: (id: string): string | null => {
    return DataService.revealCredential(id);
  },

  addVaultCredential: (data: {
    clientId: string;
    category: any;
    label: string;
    loginUrl?: string;
    username: string;
    passwordText: string;
    notes?: string;
  }) => {
    const enc = encryptCredential(data.passwordText);
    const newCred: VaultCredential = {
      id: `cred-${Date.now()}`,
      clientId: data.clientId,
      category: data.category,
      label: data.label,
      loginUrl: data.loginUrl,
      username: data.username,
      encryptedPassword: enc.encryptedData,
      iv: enc.iv,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    credentialsVault.unshift(newCred);
    return newCred;
  },

  // Agency Services
  getServices: (): AgencyService[] => agencyServicesList,
  addService: (label: string): AgencyService | null => {
    const trimmed = label.trim();
    if (!trimmed) return null;
    const existing = agencyServicesList.find(s => s.label.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing;
    const id = trimmed.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    const newService: AgencyService = {
      id: id || `SVC_${Date.now()}`,
      label: trimmed,
      isCustom: true
    };
    agencyServicesList.push(newService);
    return newService;
  },

  // WhatsApp Logs
  getWhatsAppLogs: () => inMemoryWhatsAppLogs,

  // Client P&L Margin Matrix
  getClientProfitLoss: (): ClientPL[] => {
    return clientsList.map(client => {
      const clientInvoices = invoicesList.filter(i => i.clientId === client.id && i.status === 'PAID');
      const totalRevenue = clientInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

      const clientExpenses = expensesList.filter(e => e.clientId === client.id);
      const totalExpenses = clientExpenses.reduce((sum, e) => sum + e.amount, 0);

      const netProfit = totalRevenue - totalExpenses;
      const profitMarginPercent = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 100;

      return {
        clientId: client.id,
        clientName: client.businessName,
        clientType: client.clientType,
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMarginPercent
      };
    });
  },

  // Dashboard Aggregates & Tax Liability Summary (Phase 7 & 8)
  getDashboardMetrics: (): DashboardMetrics => {
    const activeRetainers = clientsList.filter(c => c.clientType === 'RECURRING_RETAINER' && c.status === 'ACTIVE');
    const mrr = activeRetainers.reduce((acc, c) => acc + c.monthlyRetainerAmount, 0);

    const paidInvoices = invoicesList.filter(i => i.status === 'PAID');
    const revenueThisMonth = paidInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

    // Total Project Contracts + Client Retainers
    const totalProjectContracts = projectsList.reduce((acc, p) => acc + (p.totalValue || 0), 0);
    const totalClientContracts = clientsList.reduce((acc, c) => acc + (c.monthlyRetainerAmount * 12 || 0), 0);
    const totalContractValue = totalProjectContracts + totalClientContracts;

    // Client Invoices & Receivables
    const clientInvoicesTotal = invoicesList.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const clientCollectedTotal = paidInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);
    const unpaidInvoices = invoicesList.filter(i => i.status !== 'PAID');
    const clientBalanceToBePaid = unpaidInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    // This Month Sales / Project Value
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthInvoices = invoicesList.filter(i => (i.issueDate || i.createdAt || '').startsWith(currentYearMonth));
    const thisMonthSales = thisMonthInvoices.length > 0
      ? thisMonthInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0)
      : revenueThisMonth;

    // Total Expenses (Office Expenses + Domain, Hosting, SaaS, Freelancers, Influencers)
    const officeCats: ExpenseCategory[] = ['RENT', 'ELECTRICITY_EB', 'MAINTENANCE', 'TEA_SNACKS', 'SALARY', 'MISCELLANEOUS'];
    const techCats: ExpenseCategory[] = ['HOSTING_DOMAIN', 'SAAS_TOOL', 'SUBCONTRACTOR', 'FREELANCER', 'INFLUENCER_PAYOUT', 'PURCHASES_HARDWARE', 'AD_SPEND'];

    const totalExpenses = expensesList.reduce((acc, e) => acc + (e.amount || 0), 0);
    const officeExpensesTotal = expensesList
      .filter(e => officeCats.includes(e.category))
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    const techPurchasesTotal = expensesList
      .filter(e => techCats.includes(e.category))
      .reduce((acc, e) => acc + (e.amount || 0), 0);

    // Vendor & Influencer Payables
    const vendorAndInfluencerPayables = vendorsList.reduce((acc, v) => acc + (v.balanceDue || 0), 0);
    const vendorPayablesCount = vendorsList.filter(v => (v.balanceDue || 0) > 0).length;

    // Accumulated 18% GST collected internally to remit to government
    const totalCollectedTaxLiability = paidInvoices.reduce((acc, i) => acc + (i.internalTaxCalculated || 0), 0);

    const pendingApprovals = tasksList.filter(t => t.status === 'CLIENT_REVIEW' || t.status === 'INTERNAL_REVIEW').length;

    const activeTasks = tasksList.filter(t => t.status !== 'COMPLETED').length;
    const staffCount = staffList.length || 1;
    const staffUtilizationRate = Math.min(100, Math.round((activeTasks / (staffCount * 3)) * 100));

    const activeLeads = leadsList.filter(l => l.leadStage !== 'WON' && l.leadStage !== 'LOST');
    const pipelineValue = activeLeads.reduce((acc, l) => acc + l.estimatedDealValue, 0);

    const overdueInvoices = invoicesList.filter(i => i.status === 'SENT' && new Date(i.dueDate) < new Date());
    const overdueAmount = overdueInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

    // Today's Deliverables
    const todayStr = new Date().toISOString().split('T')[0];
    const todayDeliverablesCount = socialMediaTasksList.filter(s => s.postingDate === todayStr).length;

    // Today, current month, next month, and 2-day dates
    const today = new Date();
    const currentYear = today.getFullYear();
    const nextMonthDate = new Date(currentYear, today.getMonth() + 1, 1);
    const nextYearMonth = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

    const twoDaysDate = new Date(today);
    twoDaysDate.setDate(today.getDate() + 2);
    const twoDaysStr = twoDaysDate.toISOString().split('T')[0];

    // Forecasts calculation
    let toBeCollectedToday = 0;
    let toBeCollectedThisMonth = 0;
    let toBeCollectedNextMonth = 0;
    const twoDayUpcomingDuesList: any[] = [];

    invoicesList.forEach(inv => {
      const isPaid = inv.status === 'PAID' || inv.status === 'CLOSED';
      const balance = inv.balanceDue !== undefined ? inv.balanceDue : (isPaid ? 0 : inv.totalAmount);
      if (balance <= 0) return;

      if (inv.installments && inv.installments.length > 0) {
        const pendingInsts = inv.installments.filter(inst => inst.status !== 'PAID');
        if (pendingInsts.length > 0) {
          pendingInsts.forEach(inst => {
            const instDue = inst.dueDate || inv.dueDate;
            const instAmt = inst.amount || balance;
            if (instDue === todayStr) toBeCollectedToday += instAmt;
            if (instDue && instDue.startsWith(currentYearMonth)) toBeCollectedThisMonth += instAmt;
            if (instDue && instDue.startsWith(nextYearMonth)) toBeCollectedNextMonth += instAmt;

            if (instDue === twoDaysStr) {
              twoDayUpcomingDuesList.push({
                id: `${inv.id}-${inst.id}`,
                invoiceId: inv.id,
                invoiceNumber: inv.invoiceNumber,
                clientId: inv.clientId,
                clientName: inv.clientName,
                clientPhone: inv.clientPhone,
                projectTitle: inv.projectTitle || 'Software Project',
                projectId: inv.projectId,
                label: inst.label || 'Scheduled Milestone Installment',
                amount: instAmt,
                dueDate: instDue,
                delayReason: inst.delayReason || inv.delayReason,
                delayNotes: inst.delayNotes || inv.delayNotes
              });
            }
          });
          return;
        }
      }

      const due = inv.nextScheduledDueDate || inv.dueDate;
      const amt = (inv.nextScheduledPaymentAmount && inv.nextScheduledPaymentAmount <= balance)
        ? inv.nextScheduledPaymentAmount
        : balance;

      if (due === todayStr) toBeCollectedToday += amt;
      if (due && due.startsWith(currentYearMonth)) toBeCollectedThisMonth += amt;
      if (due && due.startsWith(nextYearMonth)) toBeCollectedNextMonth += amt;

      if (due === twoDaysStr) {
        twoDayUpcomingDuesList.push({
          id: inv.id,
          invoiceId: inv.id,
          invoiceNumber: inv.invoiceNumber,
          clientId: inv.clientId,
          clientName: inv.clientName,
          clientPhone: inv.clientPhone,
          projectTitle: inv.projectTitle || 'Software Project',
          projectId: inv.projectId,
          label: 'Scheduled Master Invoice Balance',
          amount: amt,
          dueDate: due,
          delayReason: inv.delayReason,
          delayNotes: inv.delayNotes
        });
      }
    });

    const twoDayUpcomingDuesCount = twoDayUpcomingDuesList.length;
    const twoDayUpcomingDuesAmount = twoDayUpcomingDuesList.reduce((sum, item) => sum + item.amount, 0);

    // This Month's Closed Business:
    const thisMonthClosedInvoices = invoicesList.filter(i =>
      (i.status === 'PAID' || i.status === 'CLOSED') &&
      ((i.closedMonth && i.closedMonth.startsWith(currentYearMonth)) ||
        (i.paidDate && i.paidDate.startsWith(currentYearMonth)) ||
        (i.issueDate && i.issueDate.startsWith(currentYearMonth)))
    );
    const thisMonthClosedBusiness = thisMonthClosedInvoices.reduce((acc, i) => acc + (i.totalAmount || 0), 0);

    // Monthly GST Payables to be filed (1st to 30th/31st of this month):
    const gstInvoicesThisMonth = invoicesList.filter(i =>
      (i.issueDate && i.issueDate.startsWith(currentYearMonth)) ||
      (i.createdAt && i.createdAt.startsWith(currentYearMonth)) ||
      (i.closedMonth && i.closedMonth.startsWith(currentYearMonth))
    );
    const gstPayableThisMonth = gstInvoicesThisMonth.reduce((acc, i) => {
      if (i.internalTaxCalculated) return acc + i.internalTaxCalculated;
      if (i.gstType === 'INCLUSIVE_18') return acc + Math.round((i.totalAmount * 18) / 118);
      return acc + Math.round(i.totalAmount * 0.18);
    }, 0);

    return {
      totalContractValue,
      thisMonthSales,
      totalExpenses,
      officeExpensesTotal,
      techPurchasesTotal,
      vendorAndInfluencerPayables,
      vendorPayablesCount,
      clientInvoicesTotal,
      clientCollectedTotal,
      clientBalanceToBePaid,
      totalActiveProjects: projectsList.filter(p => p.status !== 'COMPLETED').length,
      totalActiveRetainers: activeRetainers.length,
      activeRetainersCount: activeRetainers.length,
      mrrThisMonth: mrr,
      revenueThisMonth,
      pendingClientApprovals: pendingApprovals,
      averageStaffUtilization: staffUtilizationRate,
      activeLeadsCount: activeLeads.length,
      totalPipelineValue: pipelineValue,
      overdueInvoicesCount: overdueInvoices.length,
      overdueInvoicesAmount: overdueAmount,
      totalCollectedTaxLiability,
      pendingVendorBalances: vendorAndInfluencerPayables,
      upcomingVendorDuesCount: vendorPayablesCount,
      todayDeliverablesCount,
      toBeCollectedToday,
      toBeCollectedThisMonth,
      toBeCollectedNextMonth,
      twoDayUpcomingDuesCount,
      twoDayUpcomingDuesAmount,
      twoDayUpcomingDuesList,
      thisMonthClosedBusiness,
      gstPayableThisMonth
    };
  },

  // ============================================================================
  // RECYCLE BIN ENGINE (Phase 10: Soft Delete, Restore & Permanent Purge)
  // ============================================================================
  getRecycleBin: () => {
    return recycleBinList;
  },

  restoreRecycleBinItem: (id: string) => {
    const idx = recycleBinList.findIndex(item => item.id === id);
    if (idx === -1) return null;
    const binItem = recycleBinList[idx];
    const itemData = binItem.data;
    const newTimestamp = Date.now();

    switch (binItem.entityType) {
      case 'PROJECT': {
        const oldCode = itemData.code || binItem.title;
        let finalCode = itemData.code;
        if (!finalCode) {
          finalCode = `PRJ-${new Date().getFullYear()}-${String(projectsList.length + 1).padStart(3, '0')}`;
        } else if (projectsList.some(p => p.code === finalCode)) {
          finalCode = `${finalCode}-RESTORED`;
        }
        const restoredProject: Project = {
          ...itemData,
          id: `proj-${newTimestamp}`,
          code: finalCode,
          recoveredFrom: oldCode ? oldCode : undefined,
          updatedAt: new Date().toISOString()
        };
        projectsList.unshift(restoredProject);
        break;
      }
      case 'LEAD': {
        const restoredLead: Lead = {
          ...itemData,
          id: `lead-${newTimestamp}`,
          updatedAt: new Date().toISOString()
        };
        leadsList.unshift(restoredLead);
        break;
      }
      case 'QUOTATION': {
        const oldNumber = itemData.quotationNumber || binItem.title || 'QTN';
        const newNumber = DataService.getNextQuotationNumber();
        const restoredQuote: Quotation = {
          ...itemData,
          id: `quote-${newTimestamp}`,
          quotationNumber: newNumber,
          recoveredFrom: oldNumber,
          updatedAt: new Date().toISOString()
        };
        quotationsList.unshift(restoredQuote);
        break;
      }
      case 'INVOICE': {
        const oldNumber = itemData.invoiceNumber || binItem.title || 'INV';
        const newNumber = DataService.getNextInvoiceNumber();
        const restoredInvoice: Invoice = {
          ...itemData,
          id: `inv-${newTimestamp}`,
          invoiceNumber: newNumber,
          recoveredFrom: oldNumber,
          createdAt: new Date().toISOString()
        };
        invoicesList.unshift(restoredInvoice);
        break;
      }
      case 'EXPENSE': {
        const restoredExpense: Expense = {
          ...itemData,
          id: `exp-${newTimestamp}`,
          createdAt: new Date().toISOString()
        };
        expensesList.unshift(restoredExpense);
        break;
      }
      case 'TASK': {
        const restoredTask: Task = {
          ...itemData,
          id: `task-${newTimestamp}`,
          updatedAt: new Date().toISOString()
        };
        tasksList.unshift(restoredTask);
        break;
      }
      case 'CLIENT': {
        const restoredClient: Client = {
          ...itemData,
          id: `client-${newTimestamp}`,
          updatedAt: new Date().toISOString()
        };
        clientsList.unshift(restoredClient);
        break;
      }
      case 'VENDOR': {
        const restoredVendor: Vendor = {
          ...itemData,
          id: `vend-${newTimestamp}`,
          updatedAt: new Date().toISOString()
        };
        vendorsList.unshift(restoredVendor);
        break;
      }
      case 'STAFF': {
        const restoredStaff: StaffMember = {
          ...itemData,
          id: `staff-${newTimestamp}`
        };
        staffList.push(restoredStaff);
        break;
      }
      case 'ATTENDANCE':
        attendanceList.push({
          ...itemData,
          id: `att-${newTimestamp}`
        });
        break;
      case 'RECEIPT': {
        const oldNumber = itemData.receiptNumber || binItem.title || 'RCP';
        const newNumber = DataService.getNextReceiptNumber();
        const restoredReceipt: PaymentReceipt = {
          ...itemData,
          id: `rcp-${newTimestamp}`,
          receiptNumber: newNumber,
          recoveredFrom: oldNumber,
          createdAt: new Date().toISOString()
        };
        receiptsList.unshift(restoredReceipt);
        if (restoredReceipt.projectId) {
          const project = projectsList.find(p => p.id === restoredReceipt.projectId);
          if (project) {
            project.collectedAmount += restoredReceipt.amount;
            project.balanceDue = Math.max(0, project.totalValue - project.collectedAmount);
            if (project.balanceDue === 0 && project.status !== 'COMPLETED') {
              project.status = 'COMPLETED';
            }
          }
        }
        if (restoredReceipt.invoiceId) {
          const inv = invoicesList.find(i => i.id === restoredReceipt.invoiceId);
          if (inv) {
            inv.paidAmount = (inv.paidAmount || 0) + restoredReceipt.amount;
            inv.balanceDue = Math.max(0, inv.totalAmount - inv.paidAmount);
            if (inv.balanceDue === 0) {
              inv.status = 'PAID';
            } else {
              inv.status = 'PARTIALLY_PAID';
            }
          }
        }
        break;
      }
      case 'DAILY_REPORT': {
        const restoredDpr: DailyReport = {
          ...itemData,
          id: `dpr-${newTimestamp}`,
          updatedAt: new Date().toISOString()
        };
        dailyReportsList.unshift(restoredDpr);
        break;
      }
      case 'INVENTORY': {
        const restoredInv: ITInventoryItem = {
          ...itemData,
          id: `ast-${newTimestamp}`,
          itemCode: itemData.itemCode ? `${itemData.itemCode}-R` : `AST-${newTimestamp.toString().slice(-4)}`,
          updatedAt: new Date().toISOString()
        };
        itInventoryList.unshift(restoredInv);
        break;
      }
      case 'ACCOUNTING_VOUCHER': {
        const restoredVoucher: JournalVoucher = {
          ...itemData,
          id: `jv-${newTimestamp}`,
          voucherNumber: itemData.voucherNumber ? `${itemData.voucherNumber}-R` : `JV-${newTimestamp.toString().slice(-4)}`,
          date: itemData.date || new Date().toISOString().split('T')[0]
        };
        journalVouchersList.unshift(restoredVoucher);
        break;
      }
      case 'APPOINTMENT': {
        const restoredApt: Appointment = {
          ...itemData,
          id: `apt-${newTimestamp}`,
          updatedAt: new Date().toISOString()
        };
        appointmentsList.unshift(restoredApt);
        break;
      }
      default:
        break;
    }

    // Remove from recycle bin
    recycleBinList.splice(idx, 1);
    return binItem;
  },

  restoreAllRecycleBinItems: (entityType?: string) => {
    const itemsToRestore = entityType && entityType !== 'ALL'
      ? recycleBinList.filter(i => i.entityType === entityType)
      : [...recycleBinList];

    let restoredCount = 0;
    itemsToRestore.forEach(item => {
      const res = DataService.restoreRecycleBinItem(item.id);
      if (res) restoredCount++;
    });

    return { success: true, count: restoredCount };
  },

  permanentlyDeleteRecycleBinItem: (id: string) => {
    const idx = recycleBinList.findIndex(item => item.id === id);
    if (idx === -1) return false;
    recycleBinList.splice(idx, 1);
    return true;
  },

  emptyRecycleBin: (entityType?: string) => {
    if (entityType && entityType !== 'ALL') {
      const initialCount = recycleBinList.length;
      for (let i = recycleBinList.length - 1; i >= 0; i--) {
        if (recycleBinList[i].entityType === entityType) {
          recycleBinList.splice(i, 1);
        }
      }
      return { success: true, clearedCount: initialCount - recycleBinList.length };
    } else {
      const count = recycleBinList.length;
      recycleBinList.splice(0, recycleBinList.length);
      return { success: true, clearedCount: count };
    }
  },

  clearAllEntryData: () => {
    leadsList.length = 0;
    quotationsList.length = 0;
    clientsList.length = 0;
    projectsList.length = 0;
    receiptsList.length = 0;
    tasksList.length = 0;
    socialMediaTasksList.length = 0;
    attendanceList.length = 0;
    invoicesList.length = 0;
    vendorsList.length = 0;
    expensesList.length = 0;
    credentialsVault.length = 0;
    recycleBinList.length = 0;
    dailyReportsList.length = 0;
    itInventoryList.length = 0;
    journalVouchersList.length = 0;
    appointmentsList.length = 0;
    inMemoryWhatsAppLogs.length = 0;
    leaveApplicationsList.length = 0;
    financialApprovalsList.length = 0;
    clientDocumentsList.length = 0;
    chartOfAccountsList.forEach(acc => acc.balance = 0);
    staffList.forEach(s => {
      s.activeTasksCount = 0;
      s.totalProjectsWorked = 0;
      s.overdueCount = 0;
      s.salaryPaidDate = undefined;
      s.isSalaryOverdue = false;
      s.documents = [];
    });
    persistStore();
    return { success: true, message: 'All entry data cleared. Fresh start ready.' };
  }
};

const MUTATING_METHODS = new Set([
  'addStaff', 'updateStaff', 'updateStaffProfile', 'deleteStaff',
  'applyForLeave', 'reviewLeaveApplication',
  'submitFinancialApproval', 'approveFinancialApproval', 'rejectFinancialApproval',
  'addClientDocument', 'deleteClientDocument',
  'addTaskProofFile', 'completeTaskWithClientShare',
  'addLead', 'updateLeadStatus', 'addConsultationNote', 'updateLead', 'deleteLead',
  'createQuotation', 'addQuotation', 'updateQuotation', 'deleteQuotation',
  'addProject', 'updateProject', 'deleteProject', 'markProjectAdvanceReceived', 'toggleLateFee',
  'addDailyReport', 'updateDailyReport', 'deleteDailyReport',
  'addInventoryItem', 'updateInventoryItem', 'deleteInventoryItem',
  'addJournalVoucher', 'addJournalEntry', 'deleteJournalEntry', 'updateAccountBalance',
  'addAppointment', 'updateAppointment', 'deleteAppointment',
  'addTask', 'updateTask', 'deleteTask',
  'recordAttendance', 'updateAttendance', 'deleteAttendance',
  'createInvoice', 'updateInvoice', 'deleteInvoice',
  'recordClientPayment', 'deleteReceipt', 'updateReceipt',
  'addVendor', 'logVendorPayment', 'updateVendor', 'deleteVendor',
  'addExpense', 'updateExpense', 'deleteExpense',
  'addClient', 'updateClient', 'deleteClient',
  'addVaultCredential', 'addService',
  'restoreRecycleBinItem', 'restoreAllRecycleBinItems',
  'permanentlyDeleteRecycleBinItem', 'emptyRecycleBin', 'clearAllEntryData'
]);

export const DataService: typeof rawDataService = new Proxy(rawDataService, {
  get(target, prop, receiver) {
    const orig = (target as any)[prop];
    if (typeof orig === 'function') {
      return (...args: any[]) => {
        const result = orig.apply(target, args);
        if (MUTATING_METHODS.has(String(prop))) {
          if (result instanceof Promise) {
            return result.then((res) => {
              persistStore();
              return res;
            });
          } else {
            persistStore();
          }
        }
        return result;
      };
    }
    return Reflect.get(target, prop, receiver);
  }
});
