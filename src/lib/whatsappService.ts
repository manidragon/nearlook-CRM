import { WhatsAppEventType, WhatsAppRecipientType, WhatsAppDeliveryStatus, WhatsAppLog } from './types';

interface SendWhatsAppParams {
  to: string;
  recipientName: string;
  recipientType: WhatsAppRecipientType;
  eventType: WhatsAppEventType;
  message: string;
  templateName?: string;
  templateParams?: string[];
}

export interface WhatsAppSendResult {
  success: boolean;
  status: WhatsAppDeliveryStatus;
  messageId?: string;
  error?: string;
  waDirectUrl: string;
  logEntry: WhatsAppLog;
}

// In-memory fallback log store for runtime persistence across API routes
export const inMemoryWhatsAppLogs: WhatsAppLog[] = [];

/**
 * Format phone number for international WhatsApp standards (strips non-digits, ensures no leading + in Meta API)
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits;
}

/**
 * Generate a click-to-chat WhatsApp link
 */
export function getWhatsAppDirectUrl(phone: string, text: string): string {
  const cleanPhone = sanitizeWhatsAppNumber(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Central WhatsApp Cloud API Engine
 */
export async function sendWhatsAppNotification(params: SendWhatsAppParams): Promise<WhatsAppSendResult> {
  const { to, recipientName, recipientType, eventType, message } = params;
  const cleanPhone = sanitizeWhatsAppNumber(to);
  const waDirectUrl = getWhatsAppDirectUrl(to, message);

  const token = process.env.WHATSAPP_CLOUD_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const isSimulation = process.env.WHATSAPP_SIMULATION_MODE === 'true' || !token || token.includes('REPLACE_WITH');

  const logId = `walog-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  // 1. Simulation Mode Handler (or fallback if API credentials are not configured)
  if (isSimulation) {
    const simulatedLog: WhatsAppLog = {
      id: logId,
      recipientPhone: to,
      recipientName,
      recipientType,
      eventType,
      messageBody: message,
      status: 'SIMULATED',
      responsePayload: JSON.stringify({
        mode: 'SIMULATION_ACTIVE',
        meta_cloud_api_status: '200 OK (Simulated)',
        recipient_id: cleanPhone,
        message_id: `wamid.SIMULATED_${Date.now()}`,
        timestamp: new Date().toISOString()
      }, null, 2),
      sentAt: new Date().toISOString()
    };

    inMemoryWhatsAppLogs.unshift(simulatedLog);

    console.log(`\n[WHATSAPP DISPATCHED (SIMULATED)]\nTo: ${recipientName} (${to})\nType: ${eventType}\nMessage: ${message}\n`);

    return {
      success: true,
      status: 'SIMULATED',
      messageId: `wamid.SIMULATED_${Date.now()}`,
      waDirectUrl,
      logEntry: simulatedLog
    };
  }

  // 2. Real Meta Cloud API Call
  try {
    const endpoint = `https://graph.facebook.com/v20.0/${phoneId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanPhone,
      type: 'text',
      text: {
        preview_url: true,
        body: message
      }
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMsg = responseData?.error?.message || 'Meta Cloud API call rejected';
      const failedLog: WhatsAppLog = {
        id: logId,
        recipientPhone: to,
        recipientName,
        recipientType,
        eventType,
        messageBody: message,
        status: 'FAILED',
        errorDetails: errorMsg,
        responsePayload: JSON.stringify(responseData, null, 2),
        sentAt: new Date().toISOString()
      };
      inMemoryWhatsAppLogs.unshift(failedLog);
      return {
        success: false,
        status: 'FAILED',
        error: errorMsg,
        waDirectUrl,
        logEntry: failedLog
      };
    }

    const messageId = responseData?.messages?.[0]?.id || 'wamid.SUCCESS';
    const successLog: WhatsAppLog = {
      id: logId,
      recipientPhone: to,
      recipientName,
      recipientType,
      eventType,
      messageBody: message,
      status: 'DELIVERED',
      responsePayload: JSON.stringify(responseData, null, 2),
      sentAt: new Date().toISOString()
    };

    inMemoryWhatsAppLogs.unshift(successLog);

    return {
      success: true,
      status: 'DELIVERED',
      messageId,
      waDirectUrl,
      logEntry: successLog
    };
  } catch (err: any) {
    const errorMsg = err?.message || 'Network error reaching Meta Cloud API';
    const failedLog: WhatsAppLog = {
      id: logId,
      recipientPhone: to,
      recipientName,
      recipientType,
      eventType,
      messageBody: message,
      status: 'FAILED',
      errorDetails: errorMsg,
      sentAt: new Date().toISOString()
    };
    inMemoryWhatsAppLogs.unshift(failedLog);
    return {
      success: false,
      status: 'FAILED',
      error: errorMsg,
      waDirectUrl,
      logEntry: failedLog
    };
  }
}

// ----------------- CLIENT-FOCUSED AUTOMATED TRIGGERS ----------------- //

/**
 * Professional greeting message builder customized for Nearlook Mart Pvt Ltd
 * Handles single or multiple services dynamically
 */
export function buildNearlookLeadGreetingMessage(params: {
  leadName: string;
  businessName: string;
  services: string[];
  managerName?: string;
}): string {
  const serviceList = params.services && params.services.length > 0 
    ? params.services 
    : ['Software & Digital Solutions'];
  
  const servicesText = serviceList.length === 1
    ? serviceList[0]
    : serviceList.slice(0, -1).join(', ') + ' & ' + serviceList[serviceList.length - 1];

  return `Dear ${params.leadName},\n\nThank you for reaching out to *Nearlook Mart Pvt Ltd* regarding *${servicesText}* for *${params.businessName}*! 🚀\n\nOur specialized team has received your inquiry and will be happy to assist you further with technical blueprints, deliverables, and customized strategies. One of our specialists${params.managerName ? ` (${params.managerName})` : ''} will connect with you shortly.\n\nIf you have any specific requirements, references, or documents to share in the meantime, please feel free to send them here.\n\nWarm regards,\n*Nearlook Mart Pvt Ltd*\nTechnology & Digital Solutions Division`;
}

export async function triggerLeadWelcomeWhatsApp(params: {
  phone: string;
  leadName: string;
  businessName: string;
  serviceType?: string;
  services?: string[];
  managerName?: string;
}) {
  const services = params.services && params.services.length > 0
    ? params.services
    : [params.serviceType || 'Digital & IT Services'];
  const text = buildNearlookLeadGreetingMessage({
    leadName: params.leadName,
    businessName: params.businessName,
    services,
    managerName: params.managerName
  });
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: `${params.leadName} (${params.businessName})`,
    recipientType: 'CLIENT',
    eventType: 'LEAD_WELCOME',
    message: text
  });
}

export async function triggerProposalSentWhatsApp(params: {
  phone: string;
  contactName: string;
  businessName: string;
  dealValue: number;
  proposalLink?: string;
}) {
  const text = `🚀 Great news ${params.contactName}! Your customized proposal for ${params.businessName} (₹${params.dealValue.toLocaleString('en-IN')}) has been compiled.\n\nReview proposal & scope here: ${params.proposalLink || 'https://agency.nearlook.com/proposals/preview'}\n\nLet us know your availability for a 15-minute walkthrough!`;
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.contactName,
    recipientType: 'CLIENT',
    eventType: 'PROPOSAL_SENT',
    message: text
  });
}

export async function triggerRetainerInvoiceWhatsApp(params: {
  phone: string;
  contactName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  payLink?: string;
}) {
  const text = `🧾 Invoice Notice: Hello ${params.contactName}, your monthly retainer invoice ${params.invoiceNumber} for ₹${params.amount.toLocaleString('en-IN')} has been generated.\n\nDue Date: ${params.dueDate}\nDirect Payment Link: ${params.payLink || 'https://agency.nearlook.com/invoices/pay'}\n\nThank you for partnering with Nearlook!`;
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.contactName,
    recipientType: 'CLIENT',
    eventType: 'RETAINER_INVOICE',
    message: text
  });
}

export async function triggerMilestoneCompletedWhatsApp(params: {
  phone: string;
  contactName: string;
  projectName: string;
  milestoneTitle: string;
}) {
  const text = `🎉 Milestone Achieved! Hello ${params.contactName}, the milestone "${params.milestoneTitle}" for "${params.projectName}" is completed and ready for your sign-off in the client portal.\n\nPlease review and let us know your feedback!`;
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.contactName,
    recipientType: 'CLIENT',
    eventType: 'MILESTONE_COMPLETION',
    message: text
  });
}

export async function triggerPaymentDueReminderWhatsApp(params: {
  phone: string;
  contactName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
}) {
  const text = `⚠️ Friendly Reminder: Hello ${params.contactName}, payment for invoice ${params.invoiceNumber} (₹${params.amount.toLocaleString('en-IN')}) was due on ${params.dueDate}.\n\nPlease ensure settlement today to prevent any disruption to your active marketing campaigns & server hosting.`;
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.contactName,
    recipientType: 'CLIENT',
    eventType: 'DUE_REMINDER',
    message: text
  });
}

// ----------------- STAFF-FOCUSED AUTOMATED TRIGGERS ----------------- //

export async function triggerStaffTaskAssignedWhatsApp(params: {
  phone: string;
  staffName: string;
  taskTitle: string;
  clientName: string;
  priority: string;
  dueDate?: string;
}) {
  const text = `⚡ New Task Assigned: Hi ${params.staffName}, you've been assigned: "${params.taskTitle}" for client [${params.clientName}].\nPriority: ${params.priority}\nDue: ${params.dueDate || 'ASAP'}\nCheck Kanban board for assets & briefs.`;
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.staffName,
    recipientType: 'STAFF',
    eventType: 'TASK_ASSIGNED',
    message: text
  });
}

export async function triggerContentApprovalWhatsApp(params: {
  phone: string;
  staffName: string;
  clientName: string;
  taskTitle: string;
}) {
  const text = `📝 Review Required: Hi ${params.staffName}, assets for "${params.taskTitle}" (${params.clientName}) are ready in "Internal Review". Please inspect and approve for client release.`;
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.staffName,
    recipientType: 'STAFF',
    eventType: 'CONTENT_APPROVAL',
    message: text
  });
}

export async function triggerOverdueNudgeWhatsApp(params: {
  phone: string;
  staffName: string;
  taskTitle: string;
  clientName: string;
}) {
  const text = `🚨 Overdue Task Alert: Hi ${params.staffName}, "${params.taskTitle}" for [${params.clientName}] is past its due date. Please update status or log hours in the ERP.`;
  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.staffName,
    recipientType: 'STAFF',
    eventType: 'OVERDUE_NUDGE',
    message: text
  });
}

// ----------------- PHASE 3, 5, 8 EXPANDED TRIGGERS ----------------- //

export async function triggerQuotationWhatsApp(params: {
  phone: string;
  contactName: string;
  businessName: string;
  quotationNumber: string;
  totalAmount: number;
  gstType: string;
  paymentTerms: string;
  previewUrl?: string;
}) {
  const gstNote = params.gstType === 'ADDITIONAL_18' 
    ? '(includes +18% GST breakdown)' 
    : params.gstType === 'INCLUSIVE_18' 
    ? '(GST 18% All-Inclusive Flat Rate)' 
    : '(Standard Total)';

  const text = `📄 Quotation Generated: Hello ${params.contactName}! Your official estimate ${params.quotationNumber} for ${params.businessName} has been compiled.\n\n💰 Grand Total: ₹${params.totalAmount.toLocaleString('en-IN')} ${gstNote}\n📌 Payment Milestones: ${params.paymentTerms}\n⚠️ Note: Payments delayed beyond due date incur 2% late fee/week.\n\n🔗 View & Sign-off: ${params.previewUrl || 'https://agency.nearlook.com/quotations/preview'}\n\nNearlook Digital Agency Accounts Team`;

  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.contactName,
    recipientType: 'CLIENT',
    eventType: 'QUOTATION_DISPATCH',
    message: text
  });
}

export async function triggerTaskStatusUpdateWhatsApp(params: {
  clientPhone: string;
  clientName: string;
  ownerPhone?: string;
  taskTitle: string;
  newStatus: string;
  staffName: string;
  staffRole: string;
  staffPhone: string;
}) {
  const text = `🔄 Deliverable Progress: Hello ${params.clientName}, "${params.taskTitle}" was updated to [${params.newStatus.replace('_', ' ')}].\n\nUpdated by Specialist: ${params.staffName} (${params.staffRole.replace('_', ' ')})\nContact: ${params.staffPhone}\n\nNearlook Project Intelligence`;

  // Send to client
  await sendWhatsAppNotification({
    to: params.clientPhone,
    recipientName: params.clientName,
    recipientType: 'CLIENT',
    eventType: 'TASK_STATUS_UPDATE',
    message: text
  });

  // Also notify Owner / Admin if phone provided
  if (params.ownerPhone) {
    const ownerMsg = `🔔 Staff Progress Alert: ${params.staffName} moved "${params.taskTitle}" for [${params.clientName}] to ${params.newStatus}.`;
    await sendWhatsAppNotification({
      to: params.ownerPhone,
      recipientName: 'Nearlook Owner',
      recipientType: 'STAFF',
      eventType: 'TASK_STATUS_UPDATE',
      message: ownerMsg
    });
  }
}

export async function triggerPaymentReceiptWhatsApp(params: {
  phone: string;
  clientName: string;
  receiptNumber: string;
  amount: number;
  milestoneLabel: string;
  remainingBalanceDue?: number;
  nextDueDate?: string;
  totalContractValue?: number;
  lateFeeAccrued?: number;
  autoInvoiceGenerated?: boolean;
  invoiceNumber?: string;
  accountManagerName?: string;
  accountManagerPhone?: string;
}) {
  let text = `💳 *PAYMENT RECEIPT: ${params.receiptNumber}*\n\nHello ${params.clientName},\nPayment of *₹${params.amount.toLocaleString('en-IN')}* for [${params.milestoneLabel}] has been received and verified.\n`;

  if (params.totalContractValue !== undefined) {
    text += `\n*Total Contract Value:* ₹${params.totalContractValue.toLocaleString('en-IN')}`;
  }
  if (params.remainingBalanceDue !== undefined) {
    text += `\n*Remaining Balance Due:* ₹${params.remainingBalanceDue.toLocaleString('en-IN')}`;
  }
  if (params.nextDueDate) {
    text += `\n📅 *Payment Due Date:* ${params.nextDueDate}`;
  }
  if (params.lateFeeAccrued && params.lateFeeAccrued > 0) {
    text += `\n*Late Fee Accrued (2%/wk):* ₹${params.lateFeeAccrued.toLocaleString('en-IN')}`;
  }
  if (params.autoInvoiceGenerated && params.invoiceNumber) {
    text += `\n\n🎉 *Balance Completely Cleared!* Official Tax Invoice *${params.invoiceNumber}* has been generated and marked as PAID.`;
  } else if (params.remainingBalanceDue && params.remainingBalanceDue > 0) {
    text += `\n\nℹ️ *Note:* Official Tax Invoice will be automatically generated upon 100% full settlement of the remaining balance.`;
  }

  text += `\n\n👨‍💼 Verified by: ${params.accountManagerName || 'Accounts Desk'} (${params.accountManagerPhone || '+919876543208'})\nThank you for choosing Nearlook Agency!`;

  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.clientName,
    recipientType: 'CLIENT',
    eventType: 'PAYMENT_RECEIVED',
    message: text
  });
}

export async function triggerWeeklyOverdueInterestWhatsApp(params: {
  phone: string;
  clientName: string;
  invoiceNumber: string;
  outstandingBalance: number;
  weeksOverdue: number;
  penaltyAmount: number;
  totalDue: number;
}) {
  const text = `⚠️ Overdue Notice with 2% Weekly Penalty:\nHello ${params.clientName}, payment for invoice ${params.invoiceNumber} is ${params.weeksOverdue} week(s) overdue.\n\nPrincipal Balance: ₹${params.outstandingBalance.toLocaleString('en-IN')}\n2% Weekly Penalty: +₹${params.penaltyAmount.toLocaleString('en-IN')}\n👉 Total Amount Due: ₹${params.totalDue.toLocaleString('en-IN')}\n\nPlease remit immediately to prevent service pause.`;

  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.clientName,
    recipientType: 'CLIENT',
    eventType: 'DUE_REMINDER',
    message: text
  });
}

export async function triggerVendorPaymentWhatsApp(params: {
  phone: string;
  vendorCompany: string;
  amountPaid: number;
  balanceDue: number;
  dueDate?: string;
}) {
  const text = `🏢 Vendor Payment Settlement: Hello ${params.vendorCompany}, payment of ₹${params.amountPaid.toLocaleString('en-IN')} has been logged.\n\nRemaining Balance: ₹${params.balanceDue.toLocaleString('en-IN')}\nDue Date: ${params.dueDate || 'Standard Net 30'}\n\nNearlook Agency Accounts Department`;

  return sendWhatsAppNotification({
    to: params.phone,
    recipientName: params.vendorCompany,
    recipientType: 'VENDOR',
    eventType: 'VENDOR_PAYMENT_NOTICE',
    message: text
  });
}
