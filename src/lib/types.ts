export type StaffRole = 
  | 'ADMIN' 
  | 'OWNER'
  | 'ACCOUNT_MANAGER'
  | 'PROJECT_MANAGER' 
  | 'DEVELOPER' 
  | 'FIELD_STAFF'
  | 'DESIGNER' 
  | 'CONTENT_WRITER' 
  | 'MARKETER';

export type StaffTeam = 
  | 'MANAGEMENT'
  | 'ACCOUNTS'
  | 'WEB_DEVELOPMENT'
  | 'MARKETING'
  | 'DESIGN'
  | 'CONTENT'
  | 'FIELD_STAFF';

export type StaffStatus = 'ACTIVE' | 'INACTIVE';

export interface StaffDocument {
  id: string;
  type: 'RESUME' | 'PAYSLIP' | 'ID_PROOF' | 'CERTIFICATE' | 'OTHER';
  name: string;
  url?: string;
  uploadedAt: string;
}

export interface StaffMember {
  id: string;
  userId: string; // e.g. STF-101
  password?: string; // Generated login password
  name: string;
  email: string;
  phone: string;
  address?: string;
  monthlySalary: number; // in ₹ INR
  hourlyRate: number; // in ₹ INR
  role: StaffRole;
  team: StaffTeam;
  status: StaffStatus;
  avatar?: string;
  documents?: StaffDocument[];
  activeTasksCount: number;
  totalProjectsWorked?: number;
  onTimeCompletionRate?: number;
  overdueCount?: number;
  salaryPaidDate?: string;
  isSalaryOverdue?: boolean;
  shiftTiming?: string;
  deductionsPerAbsence?: number;
  allowedModules?: string[];
  canManageUsers?: boolean;
}

export interface TaskProofFile {
  id: string;
  name: string;
  url: string;
  uploadedAt: string;
  fileSize?: string;
  notes?: string;
}

export type LeaveType = 'CASUAL' | 'SICK' | 'PAID' | 'UNPAID';
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveApplication {
  id: string;
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  staffEmail?: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  daysCount: number;
  leaveType: LeaveType;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedByStaffId?: string;
  reviewedByStaffName?: string;
  reviewNotes?: string;
  reviewedAt?: string;
}

export type FinancialApprovalType = 
  | 'INVOICE' 
  | 'RECEIPT' 
  | 'EXPENSE' 
  | 'VENDOR_PAYOUT' 
  | 'JOURNAL_VOUCHER';

export type FinancialApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface FinancialApprovalItem {
  id: string;
  type: FinancialApprovalType;
  title: string;
  amount: number;
  entityId: string;
  description: string;
  submittedByStaffId: string;
  submittedByStaffName: string;
  submittedByRole: StaffRole;
  status: FinancialApprovalStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByStaffName?: string;
  rejectionReason?: string;
  payload: any;
}

export type ClientDocCategory = 
  | 'CONTRACT' 
  | 'NDA' 
  | 'BRAND_ASSET' 
  | 'REQUIREMENTS' 
  | 'DESIGN' 
  | 'REPORT' 
  | 'OTHER';

export interface ClientDocument {
  id: string;
  clientId: string;
  clientName: string;
  title: string;
  category: ClientDocCategory;
  fileUrl: string;
  fileName: string;
  fileSize?: string;
  uploadedByStaffId: string;
  uploadedByStaffName: string;
  uploadedAt: string;
  notes?: string;
}

export type StandardServiceType = 
  | 'SEO' 
  | 'SOCIAL_MEDIA' 
  | 'WEB_DEV' 
  | 'PERFORMANCE_ADS' 
  | 'BRANDING' 
  | 'FULL_SUITE'
  | 'DESIGN'
  | 'CONTENT';

export type ServiceType = StandardServiceType | (string & {});

export interface AgencyService {
  id: string;
  label: string;
  isCustom?: boolean;
}

export type LeadStage = 
  | 'NEW' 
  | 'CONTACTED' 
  | 'PROPOSAL_SENT' 
  | 'NEGOTIATION' 
  | 'WON' 
  | 'LOST';

export type LeadSource = 
  | 'WORD_OF_MOUTH'
  | 'CLIENT_REFERRAL'
  | 'GOOGLE_SEARCH'
  | 'GOOGLE_ADS'
  | 'WEBSITE'
  | 'SOCIAL_MEDIA_INSTAGRAM'
  | 'SOCIAL_MEDIA_LINKEDIN'
  | 'SOCIAL_MEDIA_YOUTUBE'
  | 'COLD_OUTREACH'
  | 'NETWORKING_EVENTS'
  | 'OTHER';

export interface ConsultationNote {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: StaffRole;
  text: string;
  createdAt: string;
  isPrivate?: boolean;
}

export interface Lead {
  id: string;
  clientId?: string; // Linked existing client ID if applicable
  leadName: string;
  businessName: string;
  businessCategory?: string; // e.g. Retail & E-Commerce, Healthcare, Real Estate, Technology, etc.
  address?: string; // Business/Office address
  city?: string;
  whatsappNumber: string;
  email?: string;
  contactName?: string;
  serviceInterested?: string;
  servicesInterested?: string[]; // Multiple selected services (e.g. ['WEB_DEV', 'AI_AUTOMATION', 'SOCIAL_MEDIA'])
  assignedStaffName?: string;
  serviceType: ServiceType;
  leadStage: LeadStage;
  source?: LeadSource;
  referrerName?: string;
  estimatedDealValue: number; // in ₹ INR (optional, defaults to 0)
  notes?: string;
  assignedTeam: StaffTeam;
  assignedManagerId?: string;
  assignedManager?: StaffMember;
  consultationNotes?: ConsultationNote[];
  leadGeneratedDate?: string; // YYYY-MM-DD
  contactedDate?: string; // YYYY-MM-DD
  nextFollowUpDate?: string; // YYYY-MM-DD
  followUpNotes?: string;
  convertedDate?: string; // YYYY-MM-DD (when won)
  followUpTaskId?: string; // ID of the linked task in calendar
  isGreetingSent?: boolean; // Whether WhatsApp greeting was dispatched
  greetingSentAt?: string; // Timestamp when greeting was dispatched
  createdAt: string;
  updatedAt: string;
}

export type GSTType = 'ADDITIONAL_18' | 'INCLUSIVE_18' | 'NO_GST';

export interface QuotationLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number; // in ₹ INR
  amount: number; // in ₹ INR
}

export interface Quotation {
  id: string;
  quotationNumber: string; // e.g. "QTN-001-26"
  recoveredFrom?: string; // Previous quotation number if recovered from Recycle Bin
  leadId: string;
  clientBusiness: string;
  clientContact: string;
  clientPhone: string;
  clientEmail?: string;
  lineItems: QuotationLineItem[];
  subtotal: number;
  gstType: GSTType;
  taxAmount: number;
  totalAmount: number;
  internalTaxCalculated: number; // Underlying 18% GST component
  paymentTerms: string;
  lateFeeTerms: string;
  status: 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED';
  sentViaWhatsApp: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ClientType = 
  | 'ONE_TIME_PROJECT' 
  | 'RECURRING_RETAINER';

export type ClientStatus = 
  | 'ONBOARDING' 
  | 'ACTIVE' 
  | 'PAUSED' 
  | 'CHURNED';

export type CredentialCategory = 
  | 'WORDPRESS' 
  | 'META_BUSINESS_MANAGER' 
  | 'HOSTING_CPANEL_AWS' 
  | 'GOOGLE_ANALYTICS_GTM' 
  | 'SHOPIFY' 
  | 'CUSTOM_APP';

export interface VaultCredential {
  id: string;
  clientId: string;
  category: CredentialCategory;
  label: string;
  loginUrl?: string;
  username: string;
  encryptedPassword?: string;
  iv?: string;
  decryptedPassword?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentReceipt {
  id: string;
  receiptNumber: string; // e.g. "RCP-001-26"
  recoveredFrom?: string; // Previous receipt number if recovered from Recycle Bin
  projectId: string;
  projectTitle?: string;
  clientId: string;
  clientName: string;
  clientPhone?: string;
  amount: number; // in ₹ INR
  totalContractValue?: number;
  totalPaidToDate?: number;
  remainingBalanceDue?: number;
  lateFeeAccrued?: number;
  nextDueDate?: string;
  nextDueAmount?: number;
  referenceId?: string;
  notes?: string;
  milestoneLabel: string; // e.g. "50% Advance", "30% Review", "20% Completion"
  paymentMethod: string;
  recordedByStaffId?: string;
  recordedByStaffName?: string;
  recordedByStaffPhone?: string;
  autoInvoiceGenerated?: boolean;
  invoiceId?: string;
  invoiceNumber?: string;
  createdAt: string;
}

export interface ProjectMilestone {
  id: string;
  title: string;
  deliverable?: string;
  amount: number;
  dueDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'UAT_REVIEW' | 'COMPLETED';
}

export interface Project {
  id: string;
  code?: string;
  recoveredFrom?: string; // Previous project code if recovered from Recycle Bin
  clientId: string;
  clientName?: string;
  title: string;
  description?: string;
  domain?: 'SOFTWARE' | 'WEB' | 'AI' | 'MARKETING' | string;
  techStack?: string;
  projectType: ClientType | string;
  contractType?: string;
  status: string;
  isAdvanceReceived: boolean;
  advanceRequired: number;
  totalValue: number;
  billedAmount: number;
  collectedAmount: number;
  balanceDue: number;
  lateFeeAssigned?: boolean;
  lateFeeAccrued?: number;
  lateFeeWeeks?: number;
  dueDate?: string;
  startDate?: string;
  targetDate?: string;
  budget: number;
  location?: string;
  category?: string;
  cashCollected?: number;
  bankCollected?: number;
  gstAmount?: number;
  expensesTotal?: number;
  progressPercent?: number;
  clientPhone?: string;
  assignedLeadId?: string;
  assignedLeadName?: string;
  milestones?: ProjectMilestone[];
  receipts?: PaymentReceipt[];
  createdAt: string;
  updatedAt: string;
}

export interface DailyReport {
  id: string;
  reportDate: string; // YYYY-MM-DD
  staffId: string;
  staffName: string;
  staffRole: string;
  projectId?: string;
  projectName?: string;
  domain: 'SOFTWARE' | 'WEB' | 'AI' | 'MARKETING' | string;
  tasksCompleted: string;
  hoursWorked: number;
  blockers?: string;
  nextDayPlan?: string;
  repoOrAssetUrl?: string;
  supervisorNotes?: string;
  status: 'SUBMITTED' | 'APPROVED' | 'NEEDS_REVISION';
  completedTasksCount?: number;
  pendingTasksCount?: number;
  overdueTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type ITInventoryCategory = 
  | 'HARDWARE_LAPTOPS'
  | 'HARDWARE_MONITORS'
  | 'HARDWARE_PERIPHERALS'
  | 'SOFTWARE_LICENSES'
  | 'CLOUD_SUBSCRIPTIONS'
  | 'OFFICE_SUPPLIES';

export type ITInventoryStatus = 
  | 'IN_USE'
  | 'AVAILABLE_IN_STORE'
  | 'UNDER_REPAIR'
  | 'EXPIRED_OR_RETIRED';

export interface ITInventoryItem {
  id: string;
  itemCode: string;
  name: string;
  category: ITInventoryCategory;
  serialOrLicenseKey?: string;
  totalQuantity: number;
  availableQuantity: number;
  assignedStaffId?: string;
  assignedStaffName?: string;
  vendorName?: string;
  purchaseValue: number; // in ₹ INR
  purchaseDate?: string;
  warrantyExpiry?: string;
  status: ITInventoryStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';

export interface AccountHead {
  id?: string;
  code: string;
  name: string;
  type: AccountType;
  subtype: string;
  balance: number;
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debit: number;
  credit: number;
}

export interface JournalVoucher {
  id: string;
  voucherNumber: string;
  voucherType: 'JOURNAL' | 'RECEIPT' | 'PAYMENT' | 'SALES' | 'PURCHASE' | 'CONTRA';
  date: string;
  narration: string;
  totalAmount: number;
  lines: JournalLine[];
  referenceNo?: string;
  createdAt: string;
}

export type TaskStatus = 
  | 'BACKLOG' 
  | 'TO_DO' 
  | 'IN_PROGRESS' 
  | 'INTERNAL_REVIEW' 
  | 'CLIENT_REVIEW' 
  | 'COMPLETED';

export type TaskPriority = 
  | 'LOW' 
  | 'MEDIUM' 
  | 'HIGH' 
  | 'URGENT'
  | 'CRITICAL';

export type RecurringInterval = 
  | 'NONE' 
  | 'WEEKLY_MONDAY' 
  | 'BI_WEEKLY' 
  | 'MONTHLY_1ST';

export interface SubTask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  projectId?: string;
  clientId: string;
  clientName?: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  serviceCategory: ServiceType;
  assignedStaffId?: string;
  assignedStaffName?: string;
  assignedStaff?: StaffMember;
  dueDate?: string;
  estimatedHours: number;
  isRecurring: boolean;
  recurringRule: RecurringInterval;
  order: number;
  subTasks: SubTask[];
  proofFiles?: TaskProofFile[];
  completionNotes?: string;
  sharedWithClientAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TimeLog {
  id: string;
  taskId: string;
  taskTitle?: string;
  staffId: string;
  staffName?: string;
  durationMinutes: number;
  startTime?: string;
  endTime?: string;
  isBillable: boolean;
  notes?: string;
  loggedAt: string;
}

export type InvoiceType = 
  | 'RECURRING_RETAINER' 
  | 'MILESTONE_PROJECT'
  | 'MILESTONE_WEB_DEV' 
  | 'AD_HOC';

export type InvoiceStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'PAID' 
  | 'CLOSED'
  | 'OVERDUE'
  | 'PARTIALLY_PAID';

export interface InvoicePaymentInstallment {
  id: string;
  label: string; // e.g. "1st Payment - Advance", "2nd Payment - Milestone 1", "3rd Payment - Delivery"
  amount: number;
  dueDate: string;
  paidAmount?: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
  paidDate?: string;
  paymentMethod?: string;
  referenceId?: string;
  delayReason?: 'NONE' | 'OUR_MISTAKE_PROJECT_DELAY' | 'CLIENT_DELAY' | 'MUTUAL_AGREEMENT';
  delayNotes?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  recoveredFrom?: string; // Previous invoice number if recovered from Recycle Bin
  clientId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectId?: string;
  projectTitle?: string;
  type: InvoiceType;
  subtotal?: number;
  gstType?: GSTType;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount?: number;
  balanceDue?: number;
  lateFeeAssigned?: boolean;
  lateFeeAccrued?: number;
  lateFeeWeeks?: number;
  internalTaxCalculated?: number;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  lineItems: InvoiceLineItem[];
  notes?: string;
  isFinalInvoice?: boolean;
  paymentSplits?: any[];
  installments?: InvoicePaymentInstallment[];
  nextScheduledPaymentAmount?: number;
  nextScheduledDueDate?: string;
  delayReason?: 'NONE' | 'OUR_MISTAKE_PROJECT_DELAY' | 'CLIENT_DELAY' | 'MUTUAL_AGREEMENT';
  delayNotes?: string;
  isOnHold?: boolean;
  holdReason?: string;
  closedMonth?: string;
  createdAt: string;
  updatedAt?: string;
}

export type ExpenseCategory = 
  | 'SALARY'
  | 'RENT'
  | 'ELECTRICITY_EB'
  | 'MAINTENANCE'
  | 'PURCHASES_HARDWARE'
  | 'TEA_SNACKS'
  | 'SAAS_TOOL' 
  | 'HOSTING_DOMAIN' 
  | 'AD_SPEND' 
  | 'SUBCONTRACTOR' 
  | 'FREELANCER'
  | 'INFLUENCER_PAYOUT'
  | 'MISCELLANEOUS';

export type VendorType = 'VENDOR' | 'INFLUENCER' | 'FREELANCER';

export interface Vendor {
  id: string;
  companyName: string;
  contactPerson?: string;
  phone: string;
  email?: string;
  bankDetails?: string;
  vendorType?: VendorType;
  serviceCategory: string;
  totalPayable: number;
  advancePaid: number;
  balanceDue: number;
  advanceCredit?: number;
  lateFeeAssigned?: boolean;
  lateFeeAccrued?: number;
  lateFeeWeeks?: number;
  dueDate?: string;
  platform?: string;
  followerCount?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  clientId?: string;
  clientName?: string;
  vendorId?: string;
  vendorName?: string;
  category: ExpenseCategory;
  description: string;
  amount: number; // in ₹ INR
  date: string;
  paymentMode?: 'CASH' | 'BANK';
  receiptUrl?: string;
  receiptName?: string;
  createdAt?: string;
}

export type AttendanceStatus = 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'PRE_APPLIED_LEAVE';

export interface AttendanceRecord {
  id: string;
  staffId: string;
  staffName?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  reason?: string;
  isDeductionApplied: boolean;
  deductionAmount: number;
  createdAt: string;
}

export interface HolidayItem {
  date: string; // YYYY-MM-DD
  name: string;
}

export interface MonthlyWorkCalendar {
  id: string;
  yearMonth: string; // "2026-10"
  workingDaysCount: number;
  holidays: HolidayItem[];
  updatedAt: string;
}

export type SocialMediaPlatform = 'INSTAGRAM' | 'LINKEDIN' | 'YOUTUBE' | 'FACEBOOK' | 'TWITTER';

export interface SocialMediaTask {
  id: string;
  projectId?: string;
  clientId: string;
  clientName: string;
  title: string;
  platform: SocialMediaPlatform;
  contentCreationDate?: string;
  shootDate?: string;
  editingDate?: string;
  postingDate: string;
  status: 'PLANNED' | 'IN_PRODUCTION' | 'CLIENT_REVIEW' | 'APPROVED' | 'POSTED';
  assignedStaffId?: string;
  assignedStaffName?: string;
  postUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type WhatsAppRecipientType = 'CLIENT' | 'STAFF' | 'VENDOR';

export type WhatsAppEventType = 
  | 'LEAD_WELCOME'
  | 'PROPOSAL_SENT'
  | 'QUOTATION_DISPATCH'
  | 'RETAINER_INVOICE'
  | 'MILESTONE_COMPLETION'
  | 'DUE_REMINDER'
  | 'TASK_ASSIGNED'
  | 'TASK_STATUS_UPDATE'
  | 'PAYMENT_RECEIVED'
  | 'CONTENT_APPROVAL'
  | 'OVERDUE_NUDGE'
  | 'VENDOR_PAYMENT_NOTICE'
  | 'CUSTOM';

export type WhatsAppDeliveryStatus = 'DELIVERED' | 'SENT' | 'FAILED' | 'SIMULATED';

export interface WhatsAppLog {
  id: string;
  recipientPhone: string;
  recipientName: string;
  recipientType: WhatsAppRecipientType;
  eventType: WhatsAppEventType;
  messageBody: string;
  status: WhatsAppDeliveryStatus;
  sentAt: string;
  messageId?: string;
  responsePayload?: any;
  errorDetails?: string;
}

export interface DashboardMetrics {
  totalContractValue: number;          // Total signed projects + active client contracts
  thisMonthSales: number;              // Current month billed / booked project sales
  totalExpenses: number;               // Office expenses + IT purchases + Freelancers
  officeExpensesTotal: number;         // Rent, EB, Maintenance, Snacks
  techPurchasesTotal: number;          // Domains, Cloud/Hosting, Subcontractors, SaaS
  vendorAndInfluencerPayables: number; // Balance due to vendors, hosting providers, influencers, freelancers
  vendorPayablesCount: number;         // Count of pending vendor & influencer payouts
  clientInvoicesTotal: number;         // Total client amount billed
  clientCollectedTotal: number;        // Total payments collected from clients
  clientBalanceToBePaid: number;       // Outstanding balance to be paid by clients
  totalActiveProjects: number;
  totalActiveRetainers: number;
  activeRetainersCount?: number;
  mrrThisMonth: number;
  revenueThisMonth: number;
  pendingClientApprovals: number;
  averageStaffUtilization: number;
  activeLeadsCount: number;
  totalPipelineValue: number;
  overdueInvoicesCount: number;
  overdueInvoicesAmount: number;
  totalCollectedTaxLiability?: number; // Total GST collected internally to remit
  pendingVendorBalances?: number; // Total unpaid vendor dues
  upcomingVendorDuesCount?: number;
  todayDeliverablesCount?: number;
  totalCollectionsInBank?: number;
  totalCollectionsInCash?: number;
  // Collection Forecasts (Today, This Month, Next Month)
  toBeCollectedToday?: number;
  toBeCollectedThisMonth?: number;
  toBeCollectedNextMonth?: number;
  // 2-Day Due Alert & Action Center
  twoDayUpcomingDuesCount?: number;
  twoDayUpcomingDuesAmount?: number;
  twoDayUpcomingDuesList?: any[];
  // Closed Business & Monthly Statutory GST
  thisMonthClosedBusiness?: number;
  gstPayableThisMonth?: number;
}

export interface Client {
  id: string;
  businessName: string;
  contactName: string;
  whatsappNumber: string;
  email: string;
  website?: string;
  city?: string;
  address?: string;
  clientType: ClientType;
  status: ClientStatus;
  monthlyRetainerAmount: number;
  billingCycleDay: number;
  retainerStartDate?: string;
  retainerRenewalDate?: string;
  assignedManagerId?: string;
  assignedManager?: StaffMember;
  credentials?: VaultCredential[];
  projects?: Project[];
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// AI EXECUTIVE CHATBOT & AUDIT TRAIL TYPES
// ==========================================

export type AIChatIntent = 
  | 'GET_TODAYS_TASKS'
  | 'ADD_TASK'
  | 'UPDATE_TASK_STATUS'
  | 'GET_PROJECTS_SUMMARY'
  | 'GET_PROJECT_DETAIL'
  | 'GET_PAYMENT_DUES'
  | 'RECORD_PAYMENT'
  | 'UPDATE_ATTENDANCE'
  | 'GET_ATTENDANCE_REPORT'
  | 'GET_METRICS_OVERVIEW'
  | 'GET_LEADS_SUMMARY'
  | 'ASSIGN_LEAD'
  | 'UPDATE_LEAD_STAGE'
  | 'CREATE_QUOTATION'
  | 'CREATE_INVOICE'
  | 'LOG_EXPENSE'
  | 'DELETE_RECORD'
  | 'ALTER_CONTRACT'
  | 'GET_VENDOR_PAYABLES'
  | 'CLEAR_ADVANCE_GATE'
  | 'GENERAL_QUERY';

export type AIActionCategory = 
  | 'READ_QUERY' 
  | 'TASK_MUTATION' 
  | 'ATTENDANCE_UPDATE' 
  | 'FINANCE_ACTION' 
  | 'STATUS_UPDATE'
  | 'LEAD_MUTATION'
  | 'QUOTATION_MUTATION'
  | 'EXPENSE_MUTATION'
  | 'APPROVAL_GATE';

export type AIChatStatusBadge = 
  | '[SUCCESS]' 
  | '[APPROVAL REQUIRED]' 
  | '[ACTION FAILED]' 
  | '[UNAUTHORIZED]' 
  | '[CANCELLED]';

export interface AIChatActionLink {
  label: string;
  url?: string;
  isWhatsApp?: boolean;
  phone?: string;
  message?: string;
}

export interface AIChatPendingApproval {
  id: string;
  actionType: string;
  title: string;
  description: string;
  payload: any;
  status: 'PENDING' | 'APPROVED' | 'CANCELLED';
}

export interface AIChatAction {
  type: string;
  description: string;
  payload?: any;
  success: boolean;
  resultData?: any;
}

export interface AIChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  intent?: AIChatIntent;
  statusBadge?: AIChatStatusBadge;
  actionExecuted?: AIChatAction;
  pendingApproval?: AIChatPendingApproval;
  actionLinks?: AIChatActionLink[];
  dataPayload?: any;
  suggestedNextPrompts?: string[];
  userStaff?: {
    id: string;
    name: string;
    role: StaffRole;
  };
}

export interface AIChatAuditLog {
  id: string;
  timestamp: string; // ISO 8601
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  staffId: string;
  staffName: string;
  staffRole: StaffRole;
  userPrompt: string;
  detectedIntent: string;
  actionTaken: string;
  actionCategory: AIActionCategory;
  responseSummary: string;
  status: 'SUCCESS' | 'ERROR' | 'INFO' | 'UNAUTHORIZED' | 'APPROVAL_REQUIRED' | 'CANCELLED';
  metadata?: Record<string, any>;
}

export type RecycleBinEntityType =
  | 'PROJECT'
  | 'LEAD'
  | 'QUOTATION'
  | 'INVOICE'
  | 'EXPENSE'
  | 'TASK'
  | 'DAILY_REPORT'
  | 'INVENTORY'
  | 'CLIENT'
  | 'VENDOR'
  | 'STAFF'
  | 'ATTENDANCE'
  | 'RECEIPT'
  | 'CREDENTIAL'
  | 'ACCOUNTING_VOUCHER'
  | 'APPOINTMENT'
  | 'OTHER';

export type AppointmentType = 
  | 'CLIENT_MEETING' 
  | 'DEMO_CONSULTATION' 
  | 'PROJECT_REVIEW' 
  | 'INTERNAL_SPRINT' 
  | 'DISCOVERY_CALL' 
  | 'INFLUENCER_BRIEFING';

export type AppointmentLocation = 
  | 'GOOGLE_MEET' 
  | 'ZOOM' 
  | 'OFFICE_IN_PERSON' 
  | 'PHONE_CALL' 
  | 'CLIENT_SITE';

export type AppointmentStatus = 
  | 'SCHEDULED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'RESCHEDULED';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  appointmentType: AppointmentType;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm (e.g. "10:30")
  endTime: string; // HH:mm (e.g. "11:30")
  clientId?: string;
  clientName?: string;
  leadId?: string;
  leadName?: string;
  projectId?: string;
  projectName?: string;
  assignedStaffId?: string;
  assignedStaffName?: string;
  attendees?: string[];
  locationType: AppointmentLocation;
  meetingLink?: string;
  status: AppointmentStatus;
  reminderMinutes?: number;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RecycleBinItem {
  id: string; // e.g. rb-171829...
  originalId: string;
  entityType: RecycleBinEntityType;
  title: string;
  subtitle?: string;
  details?: Record<string, any>;
  deletedAt: string; // ISO 8601 string
  deletedBy: string; // Staff member name / role
  data: any; // Full preserved JSON representation for 100% restoration
}
