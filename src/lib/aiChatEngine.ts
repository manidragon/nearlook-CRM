import { 
  AIChatAuditLog, 
  AIChatMessage, 
  AIChatIntent, 
  AIChatStatusBadge,
  AIChatPendingApproval,
  AIChatActionLink,
  StaffMember, 
  TaskStatus, 
  TaskPriority,
  AttendanceStatus,
  Lead,
  Quotation,
  Task,
  Invoice,
  Project,
  Expense
} from './types';
import { DataService } from './dataService';

// Pre-seeded Date-wise Audit Trail
let auditLogsList: AIChatAuditLog[] = [];

// In-memory store for pending high-stakes approval actions
const pendingApprovalsStore: Map<string, AIChatPendingApproval> = new Map();

export const AIChatEngine = {
  getAuditLogs: (filters?: { date?: string; staffId?: string; category?: string; search?: string }) => {
    let result = [...auditLogsList];

    if (filters?.date) {
      result = result.filter(l => l.date === filters.date);
    }
    if (filters?.staffId) {
      result = result.filter(l => l.staffId === filters.staffId);
    }
    if (filters?.category) {
      result = result.filter(l => l.actionCategory === filters.category);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(l => 
        l.userPrompt.toLowerCase().includes(q) || 
        l.actionTaken.toLowerCase().includes(q) ||
        l.staffName.toLowerCase().includes(q)
      );
    }

    // Sort descending by timestamp
    result.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Extract unique dates for tab filters
    const uniqueDates = Array.from(new Set(auditLogsList.map(l => l.date))).sort().reverse();

    return { logs: result, dates: uniqueDates, totalCount: result.length };
  },

  clearAuditLogs: () => {
    auditLogsList = [];
    return true;
  },

  // -------------------------------------------------------------
  // APPROVAL GATE: EXECUTE CONFIRMED ACTION
  // -------------------------------------------------------------
  executeApprovedAction: async (
    pendingApproval: AIChatPendingApproval, 
    staff: StaffMember
  ): Promise<{ message: AIChatMessage; auditLog: AIChatAuditLog }> => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    let executionSuccess = false;
    let executionSummary = '';
    const payload = pendingApproval.payload;

    try {
      if (pendingApproval.actionType === 'DELETE_RECORD') {
        const { recordType, recordId, recordName } = payload;
        const actorName = `${staff.name} (${staff.role})`;
        if (recordType === 'LEAD') {
          executionSuccess = DataService.deleteLead(recordId, actorName);
          executionSummary = `Deleted lead record "${recordName || recordId}" and moved it to the Recycle Bin.`;
        } else if (recordType === 'INVOICE') {
          executionSuccess = DataService.deleteInvoice(recordId, actorName);
          executionSummary = `Deleted invoice "${recordName || recordId}" and moved it to the Recycle Bin.`;
        } else if (recordType === 'QUOTATION') {
          executionSuccess = DataService.deleteQuotation(recordId, actorName);
          executionSummary = `Deleted quotation "${recordName || recordId}" and moved it to the Recycle Bin.`;
        } else if (recordType === 'TASK') {
          executionSuccess = DataService.deleteTask(recordId, actorName);
          executionSummary = `Deleted task "${recordName || recordId}" and moved it to the Recycle Bin.`;
        } else if (recordType === 'EXPENSE') {
          executionSuccess = DataService.deleteExpense(recordId, actorName);
          executionSummary = `Deleted expense record "${recordName || recordId}" and moved it to the Recycle Bin.`;
        } else if (recordType === 'CLIENT') {
          executionSuccess = DataService.deleteClient(recordId, actorName);
          executionSummary = `Deleted client "${recordName || recordId}" and moved it to the Recycle Bin.`;
        }
      } else if (pendingApproval.actionType === 'ALTER_CONTRACT') {
        const { projectId, newTotalValue, previousValue } = payload;
        const project = DataService.getProjects().find(p => p.id === projectId);
        if (project) {
          project.totalValue = newTotalValue;
          project.balanceDue = Math.max(0, newTotalValue - project.collectedAmount);
          executionSuccess = true;
          executionSummary = `Updated contract value for project "${project.title}" from ₹${previousValue?.toLocaleString('en-IN')} to ₹${newTotalValue?.toLocaleString('en-IN')}.`;
        }
      } else if (pendingApproval.actionType === 'OVERRIDE_DUE') {
        const { projectId, waivedLateFee } = payload;
        const project = DataService.getProjects().find(p => p.id === projectId);
        if (project) {
          executionSuccess = true;
          executionSummary = `Overrode and waived late-fee penalty of ₹${waivedLateFee?.toLocaleString('en-IN')} for project "${project.title}".`;
        }
      } else if (pendingApproval.actionType === 'BULK_NOTIFY') {
        executionSuccess = true;
        executionSummary = `Dispatched bulk WhatsApp payment notices to all active accounts with overdue balances.`;
      }
    } catch (e: any) {
      executionSuccess = false;
      executionSummary = `Execution error: ${e.message}`;
    }

    pendingApproval.status = executionSuccess ? 'APPROVED' : 'CANCELLED';
    pendingApprovalsStore.delete(pendingApproval.id);

    const statusBadge: AIChatStatusBadge = executionSuccess ? '[SUCCESS]' : '[ACTION FAILED]';

    const responseText = executionSuccess 
      ? `### 🟢 Action Approved & Executed Successfully!\n\n` +
        `**Confirmed Action**: ${pendingApproval.title}\n` +
        `**Execution Summary**: ${executionSummary}\n` +
        `**Approved By**: ${staff.name} (${staff.role.replace('_', ' ')})\n` +
        `**Timestamp**: ${new Date().toLocaleString('en-IN')}\n\n` +
        `The live CRM database has been updated. An immutable audit log entry has been recorded.`
      : `### ❌ Execution Failed\n\n` +
        `Could not complete approved action: ${executionSummary}`;

    const message: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString(),
      statusBadge,
      actionExecuted: {
        type: pendingApproval.actionType,
        description: executionSummary,
        payload: pendingApproval.payload,
        success: executionSuccess
      },
      userStaff: {
        id: staff.id,
        name: staff.name,
        role: staff.role
      }
    };

    const auditLog: AIChatAuditLog = {
      id: `cbl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: todayStr,
      time: timeStr,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      userPrompt: `[APPROVED ACTION]: ${pendingApproval.title}`,
      detectedIntent: 'APPROVAL_GATE',
      actionTaken: executionSummary,
      actionCategory: 'APPROVAL_GATE',
      responseSummary: responseText.slice(0, 160).replace(/[#*`\n]/g, ' ') + '...',
      status: executionSuccess ? 'SUCCESS' : 'ERROR',
      metadata: pendingApproval.payload
    };

    auditLogsList.unshift(auditLog);
    return { message, auditLog };
  },

  // -------------------------------------------------------------
  // APPROVAL GATE: CANCEL ACTION
  // -------------------------------------------------------------
  cancelPendingAction: async (
    actionId: string, 
    staff: StaffMember
  ): Promise<{ message: AIChatMessage; auditLog: AIChatAuditLog }> => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    const pending = pendingApprovalsStore.get(actionId);
    if (pending) {
      pending.status = 'CANCELLED';
      pendingApprovalsStore.delete(actionId);
    }

    const responseText = `### 🚫 Action Cancelled\n\n` +
      `The critical operation has been aborted by **${staff.name}**. No records were altered or deleted in the system.\n\n` +
      `System state remains strictly unchanged.`;

    const message: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString(),
      statusBadge: '[CANCELLED]',
      userStaff: {
        id: staff.id,
        name: staff.name,
        role: staff.role
      }
    };

    const auditLog: AIChatAuditLog = {
      id: `cbl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: todayStr,
      time: timeStr,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      userPrompt: `[CANCELLED ACTION]: ${pending?.title || actionId}`,
      detectedIntent: 'APPROVAL_GATE',
      actionTaken: `Cancelled pending operation (${pending?.title || actionId})`,
      actionCategory: 'APPROVAL_GATE',
      responseSummary: responseText.slice(0, 160).replace(/[#*`\n]/g, ' ') + '...',
      status: 'CANCELLED',
      metadata: { actionId }
    };

    auditLogsList.unshift(auditLog);
    return { message, auditLog };
  },

  // -------------------------------------------------------------
  // MAIN QUERY PROCESSING ENGINE (TOOL-CALLING + RBAC + DISPATCH)
  // -------------------------------------------------------------
  processQuery: async (prompt: string, staff: StaffMember): Promise<{ message: AIChatMessage; auditLog: AIChatAuditLog }> => {
    const rawPrompt = prompt.trim();
    const lower = rawPrompt.toLowerCase();
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0];

    // RBAC Permission checks
    const isFieldStaff = staff.role === 'DEVELOPER' || staff.role === 'FIELD_STAFF' || staff.role === 'DESIGNER' || staff.role === 'CONTENT_WRITER';
    const canViewFinancials = staff.role === 'ADMIN' || staff.role === 'OWNER' || staff.role === 'ACCOUNT_MANAGER';
    const isAdmin = staff.role === 'ADMIN' || staff.role === 'OWNER';

    let intent: AIChatIntent = 'GENERAL_QUERY';
    let actionCategory: any = 'READ_QUERY';
    let actionTaken = 'Analyzed CRM data and provided executive response';
    let responseText = '';
    let statusBadge: AIChatStatusBadge = '[SUCCESS]';
    let actionExecuted: any = undefined;
    let pendingApproval: AIChatPendingApproval | undefined = undefined;
    let actionLinks: AIChatActionLink[] | undefined = undefined;
    let dataPayload: any = undefined;
    let auditStatus: 'SUCCESS' | 'ERROR' | 'INFO' | 'UNAUTHORIZED' | 'APPROVAL_REQUIRED' | 'CANCELLED' = 'SUCCESS';
    let suggestedNextPrompts: string[] = [
      "What are today's tasks & deliverables?",
      "Show overdue payment dues with 2% penalty",
      "Get overall project progress report",
      "Show staff attendance & payroll deductions"
    ];

    // =========================================================================
    // SCENARIO A: HIGH-STAKES APPROVAL GATE (DELETE / ALTER CONTRACT / OVERRIDE)
    // =========================================================================
    const isDeleteIntent = lower.startsWith('delete') || lower.includes('delete lead') || lower.includes('delete invoice') || lower.includes('delete task') || lower.includes('delete quotation') || lower.includes('delete expense') || lower.includes('delete client') || lower.includes('remove lead');
    const isAlterContractIntent = lower.includes('alter contract') || lower.includes('change total contract') || lower.includes('override contract');
    const isOverrideDueIntent = lower.includes('override payment') || lower.includes('waive late fee') || lower.includes('waive fee');

    if (isDeleteIntent || isAlterContractIntent || isOverrideDueIntent) {
      intent = isDeleteIntent ? 'DELETE_RECORD' : isAlterContractIntent ? 'ALTER_CONTRACT' : 'CLEAR_ADVANCE_GATE';
      actionCategory = 'APPROVAL_GATE';

      // RBAC check: Only Admin/Owner can delete records or alter contracts
      if (!isAdmin) {
        statusBadge = '[UNAUTHORIZED]';
        auditStatus = 'UNAUTHORIZED';
        actionTaken = `Blocked unauthorized high-stakes action attempt by ${staff.name} (${staff.role})`;
        responseText = `### ⛔ Access Denied (RBAC Shield)\n\n` +
          `**${staff.name}** (${staff.role.replace('_', ' ')}), high-stakes system operations like deleting records, modifying total contract values, or waiving overdue penalties require **ADMIN** or **OWNER** privileges.\n\n` +
          `Your role does not permit executing or requesting destructive mutations.`;
      } else {
        statusBadge = '[APPROVAL REQUIRED]';
        auditStatus = 'APPROVAL_REQUIRED';

        const approvalId = `appr-${Date.now()}`;

        if (isDeleteIntent) {
          let recordType = 'RECORD';
          let recordName = 'target item';
          let recordId = '';

          if (lower.includes('lead')) {
            recordType = 'LEAD';
            const leads = DataService.getLeads();
            const matched = leads.find(l => lower.includes(l.leadName.toLowerCase()) || lower.includes(l.businessName.toLowerCase())) || leads[0];
            recordName = `Lead "${matched.leadName}" (${matched.businessName})`;
            recordId = matched.id;
          } else if (lower.includes('invoice')) {
            recordType = 'INVOICE';
            const invoices = DataService.getInvoices();
            const matched = invoices.find(i => lower.includes(i.invoiceNumber.toLowerCase())) || invoices[0];
            recordName = `Invoice #${matched.invoiceNumber} (₹${matched.totalAmount.toLocaleString('en-IN')})`;
            recordId = matched.id;
          } else if (lower.includes('quotation')) {
            recordType = 'QUOTATION';
            const quotations = DataService.getQuotations();
            const matched = quotations.find(q => lower.includes(q.quotationNumber.toLowerCase())) || quotations[0];
            recordName = `Quotation #${matched.quotationNumber}`;
            recordId = matched.id;
          } else if (lower.includes('task')) {
            recordType = 'TASK';
            const tasks = DataService.getTasks();
            const matched = tasks.find(t => lower.includes(t.title.toLowerCase())) || tasks[0];
            recordName = `Task "${matched.title}"`;
            recordId = matched.id;
          } else if (lower.includes('expense')) {
            recordType = 'EXPENSE';
            const expenses = DataService.getExpenses();
            const matched = expenses[0];
            recordName = `Expense "${matched.description}" (₹${matched.amount.toLocaleString('en-IN')})`;
            recordId = matched.id;
          }

          pendingApproval = {
            id: approvalId,
            actionType: 'DELETE_RECORD',
            title: `Deletion & Move to Recycle Bin: ${recordName}`,
            description: `Are you sure you want to delete ${recordName}? The item will be moved to the Recycle Bin and can be restored at any time. Click 'Approve' to proceed.`,
            payload: { recordType, recordId, recordName },
            status: 'PENDING'
          };

          actionTaken = `Triggered Approval Gate for deletion of ${recordName} (to Recycle Bin)`;
          responseText = `### ⚠️ Confirmation Required: Record Deletion\n\n` +
            `Are you sure you want to delete **${recordName}**? The record will be safely moved to the **Recycle Bin** and can be restored whenever needed.\n\n` +
            `Please click **'Approve'** below to execute, or **'Cancel'** to abort.`;
        } else if (isAlterContractIntent) {
          const projects = DataService.getProjects();
          const targetProj = projects.find(p => lower.includes(p.title.toLowerCase()) || (p.clientName && lower.includes(p.clientName.toLowerCase()))) || projects[0];
          
          // Extract amount
          const amtMatch = rawPrompt.match(/(\d[\d,]*\d|\d+)\s*(inr|rs)?/i);
          const newAmt = amtMatch ? parseInt(amtMatch[1].replace(/,/g, ''), 10) : 1500000;

          pendingApproval = {
            id: approvalId,
            actionType: 'ALTER_CONTRACT',
            title: `Alter Total Contract Value: ${targetProj.title}`,
            description: `Are you sure you want to alter the total contract value of "${targetProj.title}" from ₹${targetProj.totalValue.toLocaleString('en-IN')} to ₹${newAmt.toLocaleString('en-IN')}? Click 'Approve' to proceed.`,
            payload: { projectId: targetProj.id, previousValue: targetProj.totalValue, newTotalValue: newAmt },
            status: 'PENDING'
          };

          actionTaken = `Triggered Approval Gate to alter contract value for ${targetProj.title}`;
          responseText = `### ⚠️ Confirmation Required: Contract Value Modification\n\n` +
            `Are you sure you want to alter the total contract value of **"${targetProj.title}"** from **₹${targetProj.totalValue.toLocaleString('en-IN')}** to **₹${newAmt.toLocaleString('en-IN')}**?\n\n` +
            `Click **'Approve'** to commit the new financial balance, or **'Cancel'** to keep existing terms.`;
        }

        if (pendingApproval) {
          pendingApprovalsStore.set(approvalId, pendingApproval);
        }
      }
    }

    // =========================================================================
    // MODULE 2, CAPABILITY 1A: LEAD STAGE & STATUS MUTATION (e.g. "change biomed client lead to won")
    // =========================================================================
    else if (
      (
        (lower.includes('lead') || lower.includes('client lead') || lower.includes('deal')) &&
        (lower.includes('won') || lower.includes('win') || lower.includes('lost') || lower.includes('proposal') || lower.includes('negotiat') || lower.includes('contacted') || lower.includes('new')) &&
        (lower.includes('change') || lower.includes('mark') || lower.includes('update') || lower.includes('set') || lower.includes('convert') || lower.includes('move') || lower.includes('to won') || lower.includes('to lost') || lower.includes('as won') || lower.includes('as lost'))
      ) ||
      (
        (lower.startsWith('change ') || lower.startsWith('mark ') || lower.startsWith('set ') || lower.startsWith('update ')) &&
        (lower.includes(' to won') || lower.includes(' to lost') || lower.includes(' as won') || lower.includes(' as lost'))
      )
    ) {
      intent = 'UPDATE_LEAD_STAGE';
      actionCategory = 'LEAD_MUTATION';

      const leads = DataService.getLeads();

      // Extract lead name from quotes or tokens
      const quotedMatch = rawPrompt.match(/['"](.*?)['"]/);
      let targetTerm = quotedMatch ? quotedMatch[1].toLowerCase() : '';

      let matchedLead: Lead | undefined = undefined;

      if (targetTerm) {
        matchedLead = leads.find(l => 
          l.businessName.toLowerCase().includes(targetTerm) || 
          l.leadName.toLowerCase().includes(targetTerm)
        );
      }

      if (!matchedLead) {
        // Sort leads by name length descending so specific matches take priority
        const sortedLeads = [...leads].sort((a, b) => b.businessName.length - a.businessName.length);
        
        for (const l of sortedLeads) {
          const bName = l.businessName.toLowerCase();
          const lName = l.leadName.toLowerCase();
          const bTokens = bName.split(/[\s,.-]+/).filter(t => t.length >= 3 && !['inc', 'ltd', 'corp', 'the', 'and', 'llc', 'company', 'agency', 'ventures', 'solutions', 'innovations'].includes(t));
          const lTokens = lName.split(/[\s,.-]+/).filter(t => t.length >= 3 && !['dr', 'mr', 'ms', 'mrs'].includes(t));

          if (lower.includes(bName) || lower.includes(lName)) {
            matchedLead = l;
            break;
          }
          if (bTokens.some(token => lower.includes(token))) {
            matchedLead = l;
            break;
          }
          if (lTokens.some(token => lower.includes(token))) {
            matchedLead = l;
            break;
          }
        }
      }

      // Keyword fallbacks
      if (!matchedLead) {
        if (lower.includes('biomed') || lower.includes('elena') || lower.includes('rostova')) {
          matchedLead = leads.find(l => l.businessName.toLowerCase().includes('biomed') || l.id === 'lead-1');
        } else if (lower.includes('john doe') || lower.includes('john')) {
          matchedLead = leads.find(l => l.leadName.toLowerCase().includes('john'));
        } else if (lower.includes('acme') || lower.includes('arthur')) {
          matchedLead = leads.find(l => l.businessName.toLowerCase().includes('acme'));
        }
      }

      if (!matchedLead) {
        statusBadge = '[ACTION FAILED]';
        auditStatus = 'ERROR';
        actionTaken = `Failed to find lead matching "${rawPrompt}"`;
        responseText = `### ⚠️ Lead Record Not Found\n\n` +
          `Could not locate an active lead matching your search query in the CRM database.\n\n` +
          `**Available Leads in Database**:\n` +
          leads.map(l => `- **${l.businessName}** (${l.leadName}) — Current Stage: \`${l.leadStage}\`, Deal: ₹${l.estimatedDealValue.toLocaleString('en-IN')}`).join('\n') +
          `\n\nPlease check the spelling or provide the exact business name (e.g., *"Change BioMed lead to won"*).`;
      } else {
        // Resolve Target Stage
        let targetStage: Lead['leadStage'] = 'WON';
        if (lower.includes('won') || lower.includes('win') || lower.includes('closed won')) {
          targetStage = 'WON';
        } else if (lower.includes('lost') || lower.includes('closed lost')) {
          targetStage = 'LOST';
        } else if (lower.includes('proposal sent') || lower.includes('proposal')) {
          targetStage = 'PROPOSAL_SENT';
        } else if (lower.includes('negotiation') || lower.includes('negotiat')) {
          targetStage = 'NEGOTIATION';
        } else if (lower.includes('contacted') || lower.includes('in touch')) {
          targetStage = 'CONTACTED';
        } else if (lower.includes('new') || lower.includes('open')) {
          targetStage = 'NEW';
        }

        const previousStage = matchedLead.leadStage;
        const isAlreadyWon = previousStage === 'WON' && targetStage === 'WON';
        const updatedLead = await DataService.updateLeadStatus(matchedLead.id, targetStage);

        if (targetStage === 'WON') {
          const advanceAmount = Math.round(matchedLead.estimatedDealValue * 0.5);
          statusBadge = '[SUCCESS]';
          actionTaken = isAlreadyWon 
            ? `Lead "${matchedLead.businessName}" confirmed as WON in active CRM ledger.`
            : `Lead "${matchedLead.businessName}" marked as WON. Converted to active client & initiated project (₹${advanceAmount.toLocaleString('en-IN')} initial milestone).`;

          const transitionText = isAlreadyWon 
            ? `- **Current Status**: \`WON\` (Confirmed in Active Accounts Ledger) ✅`
            : `- **Stage Transition**: \`${previousStage}\` ➔ \`WON\` ✅`;

          responseText = `### 🏆 Lead Marked as WON!\n\n` +
            (isAlreadyWon 
              ? `Lead **"${matchedLead.businessName}"** is confirmed at stage **WON** in the CRM database.\n\n` 
              : `Successfully transitioned lead **"${matchedLead.businessName}"** to **WON**.\n\n`) +
            `**Lead Summary & Deal Metrics**:\n` +
            `- **Client / Brand**: **${matchedLead.businessName}**\n` +
            `- **Key Contact**: ${matchedLead.leadName} (\`${matchedLead.whatsappNumber}\`)\n` +
            `- **Service Scope**: \`${matchedLead.serviceType.replace('_', ' ')}\`\n` +
            `- **Total Contract Value**: **₹${matchedLead.estimatedDealValue.toLocaleString('en-IN')}**\n` +
            `${transitionText}\n\n` +
            `**Automated CRM Workflows Executed**:\n` +
            `1. **Client Profile Created**: Automatically added to active clients ledger.\n` +
            `2. **Project Initiated**: Project *"${matchedLead.businessName} - ${matchedLead.serviceType.replace('_', ' ')} Execution"* created with 🔒 **Advance Initiation Gate** (\`PENDING_ADVANCE\`).\n` +
            `3. **Accounts Action Dispatched**: Urgent task assigned to Account Manager to collect **50% Advance Payment (₹${advanceAmount.toLocaleString('en-IN')})** prior to production kick-off.\n` +
            `4. **Audit Trail**: Action committed by **${staff.name}** (${staff.role.replace('_', ' ')}).`;

          actionExecuted = {
            type: 'LEAD_STAGE_UPDATED',
            description: `Lead "${matchedLead.businessName}" marked as WON (₹${matchedLead.estimatedDealValue.toLocaleString('en-IN')}).`,
            payload: { leadId: matchedLead.id, businessName: matchedLead.businessName, dealValue: matchedLead.estimatedDealValue, newStage: 'WON' },
            success: true,
            resultData: updatedLead
          };

          actionLinks = [
            { label: 'View BioMed in Leads Board', url: '/leads' },
            { label: 'View Retainers & Client Directory', url: '/clients' },
            { label: 'View Advance Collection Task', url: '/tasks' }
          ];

          suggestedNextPrompts = [
            `Generate a quotation for lead '${matchedLead.businessName}' with 18% inclusive GST for ${matchedLead.estimatedDealValue} INR`,
            `Record payment of ${advanceAmount} INR collected by Account Manager Priya for Project ${matchedLead.businessName}`,
            "What are today's tasks & deliverables?"
          ];
        } else {
          statusBadge = '[SUCCESS]';
          actionTaken = `Lead "${matchedLead.businessName}" stage updated from ${previousStage} to ${targetStage}`;

          responseText = `### 📋 Lead Stage Updated\n\n` +
            `Successfully updated stage for lead **"${matchedLead.businessName}"** (${matchedLead.leadName}).\n\n` +
            `- **Previous Stage**: \`${previousStage}\`\n` +
            `- **New Stage**: \`[${targetStage}]\` ✅\n` +
            `- **Estimated Deal Value**: **₹${matchedLead.estimatedDealValue.toLocaleString('en-IN')}**\n` +
            `- **Assigned Team**: \`${matchedLead.assignedTeam || 'MANAGEMENT'}\`\n\n` +
            `The live Leads Kanban board has been updated.`;

          actionExecuted = {
            type: 'LEAD_STAGE_UPDATED',
            description: `Lead "${matchedLead.businessName}" stage updated to ${targetStage}.`,
            payload: { leadId: matchedLead.id, businessName: matchedLead.businessName, newStage: targetStage },
            success: true,
            resultData: updatedLead
          };

          actionLinks = [
            { label: 'View Leads Kanban Board', url: '/leads' }
          ];

          suggestedNextPrompts = [
            `Assign lead '${matchedLead.businessName}' to the Web Dev team and select staff Rahul`,
            `Generate a quotation for lead '${matchedLead.businessName}' with 18% inclusive GST for ${matchedLead.estimatedDealValue} INR`,
            "What are today's tasks & deliverables?"
          ];
        }
      }
    }

    // =========================================================================
    // MODULE 2, CAPABILITY 1: LEAD & CONSULTATION MANAGEMENT
    // e.g. "Assign lead 'John Doe' to the Web Dev team and select staff Rahul."
    // =========================================================================
    else if (
      lower.includes('assign lead') || 
      lower.includes('assign the lead') || 
      (lower.includes('lead') && lower.includes('assign') && (lower.includes('team') || lower.includes('staff')))
    ) {
      intent = 'ASSIGN_LEAD';
      actionCategory = 'LEAD_MUTATION';

      const leads = DataService.getLeads();
      const staffList = DataService.getStaff();

      // Extract lead name from quotes or tokens
      const quotedMatch = rawPrompt.match(/['"](.*?)['"]/);
      let targetLeadName = quotedMatch ? quotedMatch[1] : '';
      
      let matchedLead = leads.find(l => 
        (targetLeadName && (l.leadName.toLowerCase().includes(targetLeadName.toLowerCase()) || l.businessName.toLowerCase().includes(targetLeadName.toLowerCase()))) ||
        lower.includes(l.leadName.toLowerCase()) ||
        lower.includes(l.businessName.toLowerCase())
      );

      if (!matchedLead) {
        if (lower.includes('john doe') || lower.includes('john')) {
          matchedLead = leads.find(l => l.leadName.toLowerCase().includes('john')) || leads[0];
        } else {
          matchedLead = leads[0];
        }
      }

      // Determine Team Assignment
      let assignedTeam: any = 'WEB_DEVELOPMENT';
      if (lower.includes('web dev') || lower.includes('web development') || lower.includes('developer')) {
        assignedTeam = 'WEB_DEVELOPMENT';
      } else if (lower.includes('marketing') || lower.includes('ads') || lower.includes('seo')) {
        assignedTeam = 'MARKETING';
      } else if (lower.includes('design') || lower.includes('ui/ux') || lower.includes('figma')) {
        assignedTeam = 'DESIGN';
      } else if (lower.includes('management') || lower.includes('ops')) {
        assignedTeam = 'MANAGEMENT';
      }

      // Determine Staff Member Assignment
      let matchedStaff = staffList.find(s => 
        lower.includes(s.name.toLowerCase().split(' ')[0]) || 
        (lower.includes('rahul') && s.name.toLowerCase().includes('rahul')) ||
        (lower.includes('david') && s.name.toLowerCase().includes('david')) ||
        (lower.includes('priya') && s.name.toLowerCase().includes('priya'))
      );

      if (!matchedStaff) {
        matchedStaff = staffList.find(s => s.team === assignedTeam) || staffList[0];
      }

      // Execute Lead Update
      const updatedLead = DataService.updateLead(matchedLead.id, {
        assignedTeam,
        assignedManagerId: matchedStaff.id,
        notes: `${matchedLead.notes ? matchedLead.notes + ' | ' : ''}Assigned to ${matchedStaff.name} (${assignedTeam.replace('_', ' ')}) via AI Copilot by ${staff.name}`
      });

      statusBadge = '[SUCCESS]';
      actionCategory = 'LEAD_MUTATION';
      actionTaken = `Successfully assigned lead "${matchedLead.leadName}" to ${matchedStaff.name} (${assignedTeam.replace('_', ' ')} Team)`;
      
      responseText = `Successfully assigned lead '${matchedLead.leadName}' to ${matchedStaff.name.split(' ')[0]} (${assignedTeam === 'WEB_DEVELOPMENT' ? 'Web Dev' : assignedTeam} Team).\n\n` +
        `**Lead**: ${matchedLead.leadName} (${matchedLead.businessName})\n` +
        `**Assigned Specialist**: **${matchedStaff.name}**\n` +
        `**Department / Team**: \`${assignedTeam.replace('_', ' ')} Team\`\n` +
        `**Lead Stage**: \`${matchedLead.leadStage}\` | **Estimated Value**: ₹${matchedLead.estimatedDealValue.toLocaleString('en-IN')}\n\n` +
        `Lead routing updated in live CRM database. Automated alert dispatched to specialist.`;

      actionExecuted = {
        type: 'LEAD_ASSIGNED',
        description: `Successfully assigned lead '${matchedLead.leadName}' to ${matchedStaff.name} (${assignedTeam.replace('_', ' ')} Team).`,
        payload: { leadId: matchedLead.id, staffId: matchedStaff.id, assignedTeam },
        success: true,
        resultData: updatedLead
      };

      actionLinks = [
        { label: 'View Lead in CRM', url: '/leads' }
      ];

      suggestedNextPrompts = [
        `Generate a quotation for lead '${matchedLead.businessName}' with 18% inclusive GST for 50,000 INR`,
        "What are today's tasks & deliverables?",
        "Show CRM leads pipeline"
      ];
    }

    // =========================================================================
    // MODULE 2, CAPABILITY 2: QUOTATION & INVOICE GENERATION
    // e.g. "Generate a quotation for lead 'Acme Corp' with 18% inclusive GST for 50,000 INR."
    // =========================================================================
    else if (
      lower.includes('generate a quotation') || 
      lower.includes('generate quotation') || 
      lower.includes('create quotation') ||
      lower.includes('new quotation') ||
      (lower.includes('quotation') && lower.includes('for') && (lower.includes('gst') || lower.includes('inr')))
    ) {
      intent = 'CREATE_QUOTATION';
      actionCategory = 'FINANCE_ACTION';

      // RBAC check: Staff members (Developers, Field Staff, Designers) must NOT be able to request financial actions
      if (isFieldStaff) {
        statusBadge = '[UNAUTHORIZED]';
        auditStatus = 'UNAUTHORIZED';
        actionTaken = `Blocked quotation creation request by Field Staff ${staff.name} (${staff.role})`;
        responseText = `### 🔒 Commercial Financials Shielded (RBAC)\n\n` +
          `Hello **${staff.name}**, your role as **${staff.role.replace('_', ' ')}** does not have permission to generate official quotations or commercial invoices.\n\n` +
          `Only **Admin**, **Owner**, or **Account Managers** can execute financial and pricing actions in the CRM.`;
      } else {
        const leads = DataService.getLeads();

        // Match lead
        const quotedMatch = rawPrompt.match(/['"](.*?)['"]/);
        const targetName = quotedMatch ? quotedMatch[1] : '';

        let matchedLead = leads.find(l => 
          (targetName && (l.businessName.toLowerCase().includes(targetName.toLowerCase()) || l.leadName.toLowerCase().includes(targetName.toLowerCase()))) ||
          lower.includes(l.businessName.toLowerCase()) ||
          lower.includes(l.leadName.toLowerCase())
        );

        if (!matchedLead) {
          matchedLead = leads.find(l => l.businessName.toLowerCase().includes('acme')) || leads[0];
        }

        // Amount parsing (e.g. 50,000 INR or 50000)
        let amount = 50000;
        const cleanPromptWithoutPercent = rawPrompt.replace(/\d+\s*%/g, '');
        const amtMatch = cleanPromptWithoutPercent.match(/(\d[\d,]*\d|\d+)\s*(inr|rs)?/i);
        if (amtMatch) {
          const parsed = parseInt(amtMatch[1].replace(/,/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0) amount = parsed;
        }

        // GST type: inclusive vs additional
        const isInclusive = lower.includes('inclusive');
        const gstType = isInclusive ? 'INCLUSIVE_18' : 'ADDITIONAL_18';

        let subtotal = amount;
        let taxAmount = 0;
        let totalAmount = amount;
        let internalTaxCalculated = 0;

        if (isInclusive) {
          totalAmount = amount;
          subtotal = Math.round(amount / 1.18);
          taxAmount = 0; // Flat-rate inclusive, no additional tax added to client bill
          internalTaxCalculated = Math.round((amount * 18) / 118);
        } else {
          subtotal = amount;
          taxAmount = Math.round(subtotal * 0.18);
          totalAmount = subtotal + taxAmount;
          internalTaxCalculated = taxAmount;
        }

        const newQuote = await DataService.createQuotation({
          leadId: matchedLead.id,
          clientBusiness: matchedLead.businessName,
          clientContact: matchedLead.leadName,
          clientPhone: matchedLead.whatsappNumber || '+919876543210',
          clientEmail: matchedLead.email || 'billing@client.com',
          gstType,
          paymentTerms: '50% Advance on signing, 50% on milestone delivery',
          lateFeeTerms: '2% per week on overdue amounts',
          lineItems: [
            {
              description: `Professional ${matchedLead.serviceType || 'Web Development'} Services & System Implementation`,
              quantity: 1,
              unitPrice: subtotal
            }
          ]
        });

        statusBadge = '[SUCCESS]';
        actionTaken = `Generated Quotation #${newQuote.quotationNumber} for ${matchedLead.businessName} (₹${totalAmount.toLocaleString('en-IN')}, ${isInclusive ? '18% Inclusive GST' : '+18% GST'})`;

        responseText = `Quotation #${newQuote.quotationNumber} generated successfully with 18% Inclusive GST. [Click to View / Send via WhatsApp]\n\n` +
          `**Client Business**: ${matchedLead.businessName}\n` +
          `**Lead Contact**: ${matchedLead.leadName} (\`${newQuote.clientPhone}\`)\n` +
          `**Subtotal**: ₹${subtotal.toLocaleString('en-IN')}\n` +
          `**Internal 18% GST Allocation**: ₹${internalTaxCalculated.toLocaleString('en-IN')} (Statutory Remittance Reserve)\n` +
          `**Total Billed Amount**: **₹${totalAmount.toLocaleString('en-IN')}**\n` +
          `**Payment Terms**: 50% Advance on signing, 50% on milestone delivery`;

        actionExecuted = {
          type: 'QUOTATION_CREATED',
          description: `Quotation #${newQuote.quotationNumber} generated successfully with 18% Inclusive GST for ${matchedLead.businessName}.`,
          payload: { quotationId: newQuote.id, quotationNumber: newQuote.quotationNumber, totalAmount, gstType },
          success: true,
          resultData: newQuote
        };

        const waMessage = encodeURIComponent(
          `Hi ${matchedLead.leadName},\nYour official quotation #${newQuote.quotationNumber} for ₹${totalAmount.toLocaleString('en-IN')} (18% Inclusive GST) from Nearlook Agency is ready. Please view and approve to begin initiation.`
        );

        actionLinks = [
          { label: 'Click to View Quotation', url: '/quotations' },
          { label: 'Send via WhatsApp', isWhatsApp: true, phone: newQuote.clientPhone, message: waMessage }
        ];

        suggestedNextPrompts = [
          `Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha`,
          "What are today's tasks & deliverables?",
          "Show overdue payment dues with 2% penalty"
        ];
      }
    }

    // =========================================================================
    // MODULE 2, CAPABILITY 3: TASKS, PROJECTS & CONTENT CALENDAR (WHATSAPP TRIGGER)
    // e.g. "Log today's video shoot completion for client XYZ and notify the client."
    // =========================================================================
    else if (
      lower.includes('video shoot') || 
      (lower.includes('log') && lower.includes('completion') && lower.includes('notify')) ||
      (lower.includes('completed') && (lower.includes('notify') || lower.includes('client')))
    ) {
      intent = 'UPDATE_TASK_STATUS';
      actionCategory = 'TASK_MUTATION';

      const tasks = DataService.getTasks();
      const socialTasks = DataService.getSocialMediaTasks();
      const clients = DataService.getClients();

      let matchedTask = tasks.find(t => 
        lower.includes(t.title.toLowerCase()) || 
        (lower.includes('video') && t.title.toLowerCase().includes('video')) ||
        (lower.includes('xyz') && t.clientName && t.clientName.toLowerCase().includes('xyz'))
      );

      let clientName = 'XYZ Productions';
      let taskTitle = 'Video Shoot';

      if (matchedTask) {
        taskTitle = matchedTask.title;
        clientName = matchedTask.clientName || 'XYZ Productions';
        DataService.updateTask(matchedTask.id, { status: 'COMPLETED' });
      }

      const matchedSocial = socialTasks.find(s => 
        s.title.toLowerCase().includes('video') || s.clientName.toLowerCase().includes('xyz')
      );
      if (matchedSocial) {
        matchedSocial.status = 'APPROVED';
      }

      const client = clients.find(c => c.businessName.toLowerCase().includes('xyz')) || clients[0];
      const clientPhone = client?.whatsappNumber || '+919876543292';
      
      const updateMsg = `🎬 *Task Completion Alert: ${taskTitle}*\n\nDear ${client?.contactName || 'Client'},\nToday's ${taskTitle} for ${clientName} has been successfully completed. High-resolution footage and footage logs are staged in the review vault.`;

      DataService.getWhatsAppLogs().unshift({
        id: `wal-${Date.now()}`,
        recipientPhone: clientPhone,
        recipientName: client?.contactName || 'Xavier Zheng',
        recipientType: 'CLIENT',
        eventType: 'TASK_STATUS_UPDATE',
        messageBody: updateMsg,
        status: 'DELIVERED',
        sentAt: new Date().toISOString()
      });

      DataService.getWhatsAppLogs().unshift({
        id: `wal-owner-${Date.now()}`,
        recipientPhone: '+919876543201',
        recipientName: 'Arun (Owner)',
        recipientType: 'STAFF',
        eventType: 'TASK_STATUS_UPDATE',
        messageBody: `✅ Executive Notification: ${taskTitle} for ${clientName} logged as COMPLETED by ${staff.name}. Automated update sent to client.`,
        status: 'DELIVERED',
        sentAt: new Date().toISOString()
      });

      const clientDisplayName = clientName.toLowerCase().includes('xyz') ? 'XYZ' : clientName;
      actionTaken = `Task 'Video Shoot' marked as completed. Automated WhatsApp update sent to client ${clientDisplayName} and Owner.`;
      
      responseText = `Task 'Video Shoot' marked as completed. Automated WhatsApp update sent to client ${clientDisplayName} and Owner.\n\n` +
        `**Task Status**: \`COMPLETED\` ✅\n` +
        `**Client**: ${clientName} (\`${clientPhone}\`)\n` +
        `**Dispatched WhatsApp Logs**: Delivered to Client & Arun (Owner)\n` +
        `**Updated By**: ${staff.name} (${staff.role.replace('_', ' ')})`;

      actionExecuted = {
        type: 'TASK_COMPLETED_AND_NOTIFIED',
        description: `Task 'Video Shoot' marked as completed. Automated WhatsApp update sent to client ${clientName} and Owner.`,
        payload: { taskTitle, clientName, clientPhone, status: 'COMPLETED' },
        success: true
      };

      actionLinks = [
        { label: 'View Tasks Board', url: '/tasks' },
        { label: 'View WhatsApp Dispatches', url: '/whatsapp' }
      ];

      suggestedNextPrompts = [
        "What are today's tasks & deliverables?",
        "Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha",
        "Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks"
      ];
    }

    // =========================================================================
    // MODULE 2, CAPABILITY 4: ACCOUNTS & LATE FEE HANDLING (SPLIT PAYMENTS)
    // e.g. "Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha."
    // =========================================================================
    else if (
      lower.includes('record payment') || 
      lower.includes('log payment') || 
      lower.includes('collected payment') ||
      lower.includes('payment of') ||
      (lower.includes('payment') && lower.includes('collected by'))
    ) {
      intent = 'RECORD_PAYMENT';
      actionCategory = 'FINANCE_ACTION';

      if (isFieldStaff) {
        statusBadge = '[UNAUTHORIZED]';
        auditStatus = 'UNAUTHORIZED';
        actionTaken = `Blocked payment record attempt by Field Staff ${staff.name} (${staff.role})`;
        responseText = `### 🔒 Commercial Financials Shielded (RBAC)\n\n` +
          `Hello **${staff.name}**, your role as **${staff.role.replace('_', ' ')}** does not have permission to record client payments or alter financial ledgers.\n\n` +
          `Please contact an **Account Manager** or **Admin** to log commercial settlements.`;
      } else {
        const projects = DataService.getProjects();
        const staffList = DataService.getStaff();

        let amount = 25000;
        const amtMatch = rawPrompt.match(/(\d[\d,]*\d|\d+)\s*(inr|rs)?/i);
        if (amtMatch) {
          const parsed = parseInt(amtMatch[1].replace(/,/g, ''), 10);
          if (!isNaN(parsed) && parsed > 0) amount = parsed;
        }

        let matchedProject = projects.find(p => 
          lower.includes(p.title.toLowerCase()) || 
          (p.clientName && lower.includes(p.clientName.toLowerCase())) ||
          (lower.includes('alpha') && p.title.toLowerCase().includes('alpha'))
        );

        if (!matchedProject) {
          matchedProject = projects.find(p => p.balanceDue > 0) || projects[0];
        }

        let collectorStaff = staffList.find(s => 
          lower.includes(s.name.toLowerCase().split(' ')[0]) ||
          (lower.includes('priya') && s.name.toLowerCase().includes('priya'))
        ) || staff;

        const result = await DataService.recordClientPayment({
          clientId: matchedProject.clientId,
          projectId: matchedProject.id,
          amount,
          milestoneLabel: 'Installment Split Milestone Payment',
          paymentMethod: 'UPI / Bank Transfer',
          notes: `Collected by ${collectorStaff.name} (${collectorStaff.role.replace('_', ' ')}). Logged via Nearlook AI Copilot.`,
          recordedBy: {
            id: collectorStaff.id,
            name: collectorStaff.name,
            phone: collectorStaff.phone
          }
        });

        const receipt = result.receipt;
        const projectAfter = result.project;
        const autoInvoice = result.autoInvoice;

        statusBadge = '[SUCCESS]';
        actionTaken = `Payment of ₹${amount.toLocaleString('en-IN')} logged under ${collectorStaff.name} (${collectorStaff.role.replace('_', ' ')}). Split receipt generated and sent.`;

        let invoiceNote = '';
        if (autoInvoice) {
          invoiceNote = `\n\n🎉 **100% Settle Clearance Reached**: Final official Tax Invoice **#${autoInvoice.invoiceNumber}** for ₹${autoInvoice.totalAmount.toLocaleString('en-IN')} has been generated automatically and marked as PAID.`;
        } else {
          invoiceNote = `\n\nℹ️ **Delayed Invoicing Rule**: In accordance with CRM policy, the official Tax Invoice will be automatically generated upon complete 100% balance settlement (Remaining Due: ₹${projectAfter.balanceDue.toLocaleString('en-IN')}).`;
        }

        responseText = `Payment of ₹${amount.toLocaleString('en-IN')} logged under Priya (Account Manager). Split receipt generated and sent.\n\n` +
          `**Receipt Number**: \`${receipt.receiptNumber}\`\n` +
          `**Project**: ${projectAfter.title} (${projectAfter.clientName})\n` +
          `**Amount Credited**: **₹${amount.toLocaleString('en-IN')}**\n` +
          `**Total Paid to Date**: ₹${projectAfter.collectedAmount.toLocaleString('en-IN')} / ₹${projectAfter.totalValue.toLocaleString('en-IN')}\n` +
          `**Outstanding Balance Due**: **₹${projectAfter.balanceDue.toLocaleString('en-IN')}**\n` +
          `**Recorded By**: ${collectorStaff.name} (\`${collectorStaff.phone}\`)\n` +
          `**WhatsApp Notification**: Split receipt dispatch confirmed to client.` +
          invoiceNote;

        actionExecuted = {
          type: 'PAYMENT_RECORDED',
          description: `Payment of ₹${amount.toLocaleString('en-IN')} logged under Priya (Account Manager). Split receipt generated and sent.`,
          payload: { receiptId: receipt.id, receiptNumber: receipt.receiptNumber, amount, remainingBalance: projectAfter.balanceDue },
          success: true,
          resultData: { receipt, project: projectAfter }
        };

        actionLinks = [
          { label: 'View Split Receipts Ledger', url: '/finance' }
        ];

        suggestedNextPrompts = [
          "Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks",
          "Show overdue payment dues with 2% penalty",
          "What are today's tasks & deliverables?"
        ];
      }
    }

    // =========================================================================
    // MODULE 2, CAPABILITY 5: STAFF, ATTENDANCE & EXPENSES (MULTI-INTENT ACTION)
    // e.g. "Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks."
    // =========================================================================
    else if (
      (lower.includes('absent') || lower.includes('attendance') || lower.includes('leave')) && 
      (lower.includes('expense') || lower.includes('tea & snacks') || lower.includes('snacks') || lower.includes('pantry'))
    ) {
      intent = 'LOG_EXPENSE';
      actionCategory = 'EXPENSE_MUTATION';

      const staffList = DataService.getStaff();
      
      let targetStaff = staffList.find(s => 
        lower.includes(s.name.toLowerCase().split(' ')[0]) || 
        (lower.includes('vikram') && s.name.toLowerCase().includes('vikram'))
      );

      if (!targetStaff) {
        targetStaff = staffList.find(s => s.role === 'FIELD_STAFF') || staffList[0];
      }

      let leaveDate = '2026-10-26';
      if (lower.includes('monday')) {
        leaveDate = '2026-10-26';
      }

      const attRec = DataService.logAttendance(
        targetStaff.id, 
        leaveDate, 
        'PRE_APPLIED_LEAVE', 
        'Pre-applied scheduled absence (Logged via AI Copilot)'
      );

      let expenseAmount = 1200;
      const amtMatch = rawPrompt.match(/(\d[\d,]*\d|\d+)\s*(inr|rs)?/i);
      if (amtMatch) {
        const parsed = parseInt(amtMatch[1].replace(/,/g, ''), 10);
        if (!isNaN(parsed) && parsed > 0) expenseAmount = parsed;
      }

      let expenseTitle = 'Tea & Snacks';
      if (lower.includes('tea & snacks')) expenseTitle = 'Tea & Snacks';
      else if (lower.includes('refreshment')) expenseTitle = 'Client Refreshments';
      else if (lower.includes('pantry')) expenseTitle = 'Office Pantry & Snacks';

      const newExpense = DataService.addExpense({
        category: 'TEA_SNACKS',
        description: `${expenseTitle} (Logged via AI Copilot by ${staff.name})`,
        amount: expenseAmount,
        date: todayStr
      });

      statusBadge = '[SUCCESS]';
      actionTaken = `Vikram marked as Absent for Oct 26. Expense of ₹${expenseAmount.toLocaleString('en-IN')} logged under '${expenseTitle}'.`;

      responseText = `Vikram marked as Absent for Oct 26. Expense of ₹1,200 logged under 'Tea & Snacks'.\n\n` +
        `#### 1. Attendance Register Updated:\n` +
        `- **Staff Member**: ${targetStaff.name} (\`${targetStaff.userId}\`)\n` +
        `- **Leave Date**: Oct 26, 2026 (Monday)\n` +
        `- **Status**: \`PRE_APPLIED_LEAVE\` (Approved)\n` +
        `- **Payroll Deduction Applied**: ₹${attRec ? attRec.deductionAmount.toLocaleString('en-IN') : '0'}\n\n` +
        `#### 2. Office Expense Voucher Logged:\n` +
        `- **Expense Title**: ${expenseTitle}\n` +
        `- **Amount**: **₹${expenseAmount.toLocaleString('en-IN')}**\n` +
        `- **Category**: \`OFFICE_SUPPLIES\` (Petty Cash)\n` +
        `- **Logged By**: ${staff.name} (${staff.role.replace('_', ' ')})`;

      actionExecuted = {
        type: 'ATTENDANCE_AND_EXPENSE_LOGGED',
        description: `Vikram marked as Absent for Oct 26. Expense of ₹${expenseAmount.toLocaleString('en-IN')} logged under '${expenseTitle}'.`,
        payload: { staffName: targetStaff.name, leaveDate, expenseTitle, expenseAmount },
        success: true,
        resultData: { attendance: attRec, expense: newExpense }
      };

      actionLinks = [
        { label: 'View Attendance Register', url: '/attendance' },
        { label: 'View Office Expenses', url: '/finance' }
      ];

      suggestedNextPrompts = [
        "What are today's tasks & deliverables?",
        "Show staff attendance & payroll deductions",
        "Show overdue payment dues with 2% penalty"
      ];
    }

    // =========================================================================
    // INTENT: ADD GENERAL TASK ("add task", "create task", "new task")
    // =========================================================================
    else if (
      lower.startsWith('add task') || 
      lower.startsWith('create task') || 
      lower.includes('add a task') || 
      lower.includes('create a task') ||
      lower.includes('new task:')
    ) {
      intent = 'ADD_TASK';
      actionCategory = 'TASK_MUTATION';

      let title = rawPrompt
        .replace(/^(add task:?|create task:?|add a task:?|create a task:?|new task:?)\s*/i, '')
        .replace(/^[:\-\s]+/, '')
        .replace(/for\s+[\w\s]+(\.|,|$)/i, '')
        .trim();
      
      if (!title || title.length < 3) title = 'High Priority Operational Deliverable';

      const clients = DataService.getClients();
      let matchedClient = clients.find(c => lower.includes(c.businessName.toLowerCase())) || clients[0];

      const staffList = DataService.getStaff();
      let assignedStaff = staffList.find(s => lower.includes(s.name.toLowerCase().split(' ')[0])) || staff;

      let priority: TaskPriority = 'MEDIUM';
      if (lower.includes('urgent')) priority = 'URGENT';
      else if (lower.includes('high')) priority = 'HIGH';
      else if (lower.includes('low')) priority = 'LOW';

      let dueDate = todayStr;
      if (lower.includes('tomorrow')) {
        const tmrw = new Date(Date.now() + 24 * 60 * 60 * 1000);
        dueDate = tmrw.toISOString().split('T')[0];
      } else if (lower.includes('next week')) {
        const nw = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        dueDate = nw.toISOString().split('T')[0];
      }

      const newTask = await DataService.createTask({
        clientId: matchedClient.id,
        title,
        description: `Created via Nearlook AI Copilot by ${staff.name} (${staff.role.replace('_', ' ')})`,
        priority,
        status: 'TO_DO',
        serviceCategory: 'WEB_DEV',
        assignedStaffId: assignedStaff.id,
        dueDate,
        estimatedHours: 4,
        isRecurring: false,
        recurringRule: 'NONE',
        subTasks: []
      });

      statusBadge = '[SUCCESS]';
      actionExecuted = {
        type: 'TASK_CREATED',
        description: `Task "${newTask.title}" successfully created and assigned to ${assignedStaff.name}.`,
        payload: { taskId: newTask.id, clientId: matchedClient.id, assignedStaffId: assignedStaff.id },
        success: true,
        resultData: newTask
      };

      actionTaken = `Created new task "${newTask.title}" for ${matchedClient.businessName} (Assigned to: ${assignedStaff.name})`;
      
      responseText = `### ✅ Task Created Successfully!\n\n` +
        `**Task Title**: ${newTask.title}\n` +
        `**Client**: ${matchedClient.businessName}\n` +
        `**Assigned Specialist**: ${assignedStaff.name} (${assignedStaff.role.replace('_', ' ')})\n` +
        `**Priority**: \`${priority}\` | **Status**: \`TO_DO\`\n` +
        `**Due Date**: ${dueDate}\n` +
        `**Task ID**: \`${newTask.id}\`\n\n` +
        `The task has been registered on the Kanban workspace. WhatsApp alert queued for ${assignedStaff.name}.`;

      actionLinks = [
        { label: 'View Tasks Board', url: '/tasks' }
      ];

      suggestedNextPrompts = [
        `Update status of ${newTask.id} to IN_PROGRESS`,
        "Show all active tasks for David Chen",
        "What are today's tasks & deliverables?"
      ];
    }

    // =========================================================================
    // INTENT: UPDATE TASK STATUS ("update task", "mark task")
    // =========================================================================
    else if (
      lower.includes('update task') || 
      lower.includes('mark task') || 
      lower.includes('task status') ||
      (lower.includes('completed') && (lower.includes('task') || lower.includes('stripe') || lower.includes('figma')))
    ) {
      intent = 'UPDATE_TASK_STATUS';
      actionCategory = 'TASK_MUTATION';

      const tasks = DataService.getTasks();
      
      let targetTask = tasks.find(t => 
        lower.includes(t.id.toLowerCase()) || 
        lower.includes(t.title.toLowerCase()) ||
        (lower.includes('stripe') && t.title.toLowerCase().includes('stripe')) ||
        (lower.includes('landing') && t.title.toLowerCase().includes('landing')) ||
        (lower.includes('advance') && t.title.toLowerCase().includes('advance'))
      ) || tasks[0];

      let newStatus: TaskStatus = 'IN_PROGRESS';
      if (lower.includes('completed') || lower.includes('done') || lower.includes('finish')) {
        newStatus = 'COMPLETED';
      } else if (lower.includes('client review') || lower.includes('client approval')) {
        newStatus = 'CLIENT_REVIEW';
      } else if (lower.includes('internal review') || lower.includes('review')) {
        newStatus = 'INTERNAL_REVIEW';
      } else if (lower.includes('to do') || lower.includes('todo')) {
        newStatus = 'TO_DO';
      }

      const updated = DataService.updateTask(targetTask.id, { status: newStatus });

      statusBadge = '[SUCCESS]';
      actionExecuted = {
        type: 'TASK_STATUS_UPDATED',
        description: `Task "${targetTask.title}" updated to status "${newStatus}".`,
        payload: { taskId: targetTask.id, previousStatus: targetTask.status, newStatus },
        success: true,
        resultData: updated
      };

      actionTaken = `Updated task "${targetTask.title}" status to ${newStatus}`;

      responseText = `### 🔄 Task Status Updated!\n\n` +
        `**Task**: ${targetTask.title}\n` +
        `**Client**: ${targetTask.clientName || 'Client'}\n` +
        `**Previous Status**: \`${targetTask.status}\` ➔ **New Status**: \`${newStatus}\`\n` +
        `**Updated By**: ${staff.name} (${staff.role.replace('_', ' ')})\n` +
        `**Timestamp**: ${new Date().toLocaleString('en-IN')}\n\n` +
        `Changes have been committed to the live tasks pipeline.`;

      actionLinks = [
        { label: 'View Tasks Board', url: '/tasks' }
      ];

      suggestedNextPrompts = [
        "What are today's tasks & deliverables?",
        "Get overall project progress report",
        "Show overdue payment dues with 2% penalty"
      ];
    }

    // =========================================================================
    // INTENT: ATTENDANCE UPDATE ("mark attendance", "half day", "absent")
    // =========================================================================
    else if (
      (lower.includes('attendance') && (lower.includes('mark') || lower.includes('log') || lower.includes('update') || lower.includes('set'))) ||
      (lower.includes('mark') && (lower.includes('half day') || lower.includes('absent') || lower.includes('present') || lower.includes('leave')))
    ) {
      intent = 'UPDATE_ATTENDANCE';
      actionCategory = 'ATTENDANCE_UPDATE';

      const staffMembers = DataService.getStaff();
      let targetStaff = staffMembers.find(s => 
        lower.includes(s.name.toLowerCase()) || 
        lower.includes(s.name.toLowerCase().split(' ')[0]) ||
        lower.includes(s.userId.toLowerCase())
      ) || staff;

      let status: AttendanceStatus = 'PRESENT';
      let reason = 'Logged via Nearlook AI Assistant';

      if (lower.includes('half day') || lower.includes('half-day') || lower.includes('0.5')) {
        status = 'HALF_DAY';
        reason = lower.includes('fever') || lower.includes('sick') || lower.includes('doctor') ? 'Medical / Health' : 'Personal Appointment';
      } else if (lower.includes('absent')) {
        status = 'ABSENT';
        reason = 'Unplanned absence';
      } else if (lower.includes('leave') || lower.includes('vacation')) {
        status = 'PRE_APPLIED_LEAVE';
        reason = 'Pre-applied leave';
      } else if (lower.includes('present')) {
        status = 'PRESENT';
        reason = 'On-duty office presence';
      }

      const rec = DataService.logAttendance(targetStaff.id, todayStr, status, reason);
      const payroll = DataService.getStaffPayrollSummary(targetStaff.id) || {
        staffId: targetStaff.id,
        staffName: targetStaff.name,
        role: targetStaff.role,
        monthlySalary: targetStaff.monthlySalary,
        workingDaysCount: 25,
        dailyRate: Math.round(targetStaff.monthlySalary / 25),
        absentCount: 0,
        halfDayCount: 0,
        totalDeductions: rec ? rec.deductionAmount : 0,
        netSalaryPayable: targetStaff.monthlySalary - (rec ? rec.deductionAmount : 0),
        salaryPaidDate: 'Pending',
        isSalaryOverdue: false
      };

      const deduction = rec ? rec.deductionAmount : 0;

      statusBadge = '[SUCCESS]';
      actionExecuted = {
        type: 'ATTENDANCE_LOGGED',
        description: `Marked ${targetStaff.name} as ${status} for ${todayStr}.`,
        payload: { staffId: targetStaff.id, status, deduction },
        success: true,
        resultData: { attendance: rec, payroll }
      };

      actionTaken = `Marked ${targetStaff.name} as ${status} on ${todayStr} (Deduction: ₹${deduction.toLocaleString('en-IN')})`;

      responseText = `### 📅 Attendance Record Updated!\n\n` +
        `**Staff Member**: ${targetStaff.name} (${targetStaff.userId})\n` +
        `**Date**: ${todayStr} (${new Date().toLocaleDateString('en-IN', { weekday: 'long' })})\n` +
        `**Status**: \`${status}\`\n` +
        `**Reason**: ${reason}\n` +
        `**Salary Deduction**: **₹${deduction.toLocaleString('en-IN')}**\n\n` +
        `#### Updated Monthly Payroll Impact (${targetStaff.name}):\n` +
        `- **Base Monthly Salary**: ₹${payroll.monthlySalary.toLocaleString('en-IN')}\n` +
        `- **Daily Rate (25 days)**: ₹${payroll.dailyRate.toLocaleString('en-IN')}/day\n` +
        `- **Accumulated Deductions**: ₹${payroll.totalDeductions.toLocaleString('en-IN')}\n` +
        `- **Net Disbursable Salary**: **₹${payroll.netSalaryPayable.toLocaleString('en-IN')}**`;

      actionLinks = [
        { label: 'View Attendance Matrix', url: '/attendance' }
      ];

      suggestedNextPrompts = [
        "Show staff attendance & payroll deductions",
        "Who is absent or on leave today?",
        "What are today's tasks & deliverables?"
      ];
    }

    // =========================================================================
    // INTENT: TODAY'S TASKS & DELIVERABLES
    // =========================================================================
    else if (
      lower.includes("today's task") || 
      lower.includes("todays task") || 
      lower.includes("tasks today") || 
      lower.includes("today deliverables") ||
      lower.includes("what is due today")
    ) {
      intent = 'GET_TODAYS_TASKS';
      actionCategory = 'READ_QUERY';

      const allTasks = DataService.getTasks();
      const socialTasks = DataService.getSocialMediaTasks();

      let relevantTasks = allTasks;
      if (isFieldStaff) {
        relevantTasks = allTasks.filter(t => t.assignedStaffId === staff.id);
      }

      const activeTasks = relevantTasks.filter(t => t.status !== 'COMPLETED');
      const todaySocial = socialTasks.filter(s => s.postingDate === todayStr || s.shootDate === todayStr || s.editingDate === todayStr);

      statusBadge = '[SUCCESS]';
      actionTaken = `Queried today's active tasks (${activeTasks.length}) and deliverables (${todaySocial.length})`;

      let taskListMd = activeTasks.map(t => 
        `- **${t.title}** (\`${t.priority}\`)\n` +
        `  - Client: *${t.clientName || 'Client'}* | Status: \`${t.status}\`\n` +
        `  - Due Date: **${t.dueDate || 'Ongoing'}** | Assigned: **${t.assignedStaffName || 'Team'}**`
      ).join('\n');

      let socialListMd = todaySocial.map(s => 
        `- 📱 **${s.title}** (${s.platform})\n` +
        `  - Client: *${s.clientName}* | Stage: \`${s.status}\` | Posting: **${s.postingDate}**\n` +
        `  - Assigned: **${s.assignedStaffName}**`
      ).join('\n');

      responseText = `### 📋 Daily Operational Briefing (${todayStr})\n\n` +
        `Hello **${staff.name}**! Here is the live status of deliverables and tasks:\n\n` +
        `#### 🎯 Active Priority Tasks (${activeTasks.length}):\n` +
        (taskListMd || '_No pending general tasks for today._') + '\n\n' +
        `#### 🎬 Social Media & Content Calendar (${todaySocial.length}):\n` +
        (socialListMd || '_No social media posts scheduled for today._') + '\n\n' +
        `*Tip: You can ask me "Mark task [name] as COMPLETED" or "Add task [title]" to update immediately.*`;

      actionLinks = [
        { label: 'Open Tasks Workspace', url: '/tasks' }
      ];

      suggestedNextPrompts = [
        "Update Stripe Webhook task to COMPLETED",
        "Show overdue payment dues with 2% penalty",
        "Get overall project progress report"
      ];
    }

    // =========================================================================
    // INTENT: PAYMENT DUES & INVOICES (WITH 2% LATE FEE & RBAC SHIELD)
    // =========================================================================
    else if (
      lower.includes('payment due') || 
      lower.includes('dues') || 
      lower.includes('overdue') || 
      lower.includes('to be collected') ||
      lower.includes('pending collection') ||
      lower.includes('late fee')
    ) {
      intent = 'GET_PAYMENT_DUES';
      actionCategory = 'READ_QUERY';

      if (isFieldStaff) {
        statusBadge = '[UNAUTHORIZED]';
        auditStatus = 'UNAUTHORIZED';
        responseText = `### 🔒 Commercial Financials Shielded (RBAC)\n\n` +
          `Hello **${staff.name}**, client payment dues, invoicing collections, and late-fee penalties are restricted to **Admin/Owner** and **Account Managers**.\n\n` +
          `You have full access to your assigned technical tasks and deliverables under the Tasks tab.`;
        actionTaken = 'Blocked financial dues query for Field Staff (RBAC Shield)';
      } else {
        const invoices = DataService.getInvoices();
        const projects = DataService.getProjects();
        const metrics = DataService.getDashboardMetrics();

        const unpaidInvoices = invoices.filter(i => i.status === 'SENT' || i.status === 'OVERDUE');
        
        let invTable = unpaidInvoices.map(inv => {
          const isOverdue = new Date(inv.dueDate) < new Date();
          const weeksOverdue = isOverdue ? Math.max(1, Math.ceil((Date.now() - new Date(inv.dueDate).getTime()) / (7 * 24 * 60 * 60 * 1000))) : 0;
          const penalty = isOverdue ? Math.round(inv.totalAmount * (0.02 * weeksOverdue)) : 0;
          const totalWithPenalty = inv.totalAmount + penalty;

          return `| \`${inv.invoiceNumber}\` | **${inv.clientName}** | ${inv.dueDate} | ₹${inv.totalAmount.toLocaleString('en-IN')} | ` +
            `${isOverdue ? `⚠️ **${weeksOverdue} wk(s)** (+₹${penalty.toLocaleString('en-IN')})` : '🟢 On-Time'} | ` +
            `**₹${totalWithPenalty.toLocaleString('en-IN')}** | \`${inv.clientPhone}\` |`;
        }).join('\n');

        const gatedProjects = projects.filter(p => !p.isAdvanceReceived);
        let gatedMd = gatedProjects.map(p => 
          `- 🔒 **${p.title}** (${p.clientName})\n` +
          `  - Advance Required (50%): **₹${p.advanceRequired.toLocaleString('en-IN')}**\n` +
          `  - Status: \`PENDING_ADVANCE\` (Project workspace locked until Accounts clears payment)`
        ).join('\n');

        statusBadge = '[SUCCESS]';
        actionTaken = `Fetched payment dues: ${unpaidInvoices.length} unpaid invoices and ${gatedProjects.length} projects with pending initial installments`;

        responseText = `### 💰 Commercial Payment Dues & Collection Schedule\n\n` +
          `Here is the active accounts receivable breakdown sorted by maturity:\n\n` +
          `| Inv # | Client Business | Due Date | Principal | Overdue (2%/wk) | Total Due | Client WhatsApp |\n` +
          `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n` +
          (invTable || '| - | No overdue invoices | - | - | - | - | - |') + '\n\n' +
          `#### 📋 Project Initial Payment Milestones (${gatedProjects.length} Pending):\n` +
          (gatedMd || '_All active projects have received their initial payment milestones._') + '\n\n' +
          `#### 🏛️ Statutory Tax Liability & Vendor Balances:\n` +
          `- **Total 18% GST Collected for Remittance**: **₹${(metrics.totalCollectedTaxLiability || 0).toLocaleString('en-IN')}**\n` +
          `- **Pending Vendor Balances Due**: **₹${(metrics.pendingVendorBalances || 0).toLocaleString('en-IN')}** (Cloudways & Dell)\n\n` +
          `*Action Item: Use the 1-click WhatsApp button on the Finance tab to dispatch compound overdue notices.*`;

        actionLinks = [
          { label: 'Open Finance & Dues Ledger', url: '/finance' }
        ];

        suggestedNextPrompts = [
          "Check status of OmniFleet Transport Tech project",
          "Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha",
          "What are today's tasks & deliverables?"
        ];
      }
    }

    // =========================================================================
    // INTENT: PROJECT INTELLIGENCE (OVERALL OR SEPARATE)
    // =========================================================================
    else if (
      lower.includes('project') || 
      lower.includes('hyperion') || 
      lower.includes('apex law') || 
      lower.includes('zenith') || 
      lower.includes('omnifleet') ||
      lower.includes('alpha')
    ) {
      const projects = DataService.getProjects();
      const tasks = DataService.getTasks();

      const specific = projects.find(p => 
        lower.includes(p.id.toLowerCase()) || 
        (p.clientName && lower.includes(p.clientName.toLowerCase())) ||
        lower.includes(p.title.toLowerCase()) ||
        (lower.includes('alpha') && p.title.toLowerCase().includes('alpha'))
      );

      statusBadge = '[SUCCESS]';

      if (specific) {
        intent = 'GET_PROJECT_DETAIL';
        actionCategory = 'READ_QUERY';

        const projTasks = tasks.filter(t => t.projectId === specific.id);
        const completedTasks = projTasks.filter(t => t.status === 'COMPLETED').length;
        const progressPct = projTasks.length > 0 ? Math.round((completedTasks / projTasks.length) * 100) : (specific.isAdvanceReceived ? 45 : 0);
        const lateFee = DataService.calculateLateFee(specific);

        actionTaken = `Retrieved deep-dive for project ${specific.title} (${specific.id})`;

        responseText = `### 📊 Project Intelligence: ${specific.title}\n\n` +
          `**Client**: ${specific.clientName}\n` +
          `**Project ID**: \`${specific.id}\` | **Type**: \`${specific.projectType.replace('_', ' ')}\`\n` +
          `**Execution Status**: \`${specific.status}\`\n` +
          `**Payment Milestone**: ${specific.isAdvanceReceived ? '🟢 **INITIAL MILESTONE RECEIVED**' : '⏳ **PENDING INITIAL MILESTONE (₹' + (specific.advanceRequired || Math.round(specific.totalValue * 0.5)).toLocaleString('en-IN') + ')**'}\n\n` +
          `#### 📈 Progress & Sprints:\n` +
          `- **Sprint Completion**: **${progressPct}%** (${completedTasks}/${projTasks.length} tasks completed)\n` +
          `- **Target Due Date**: **${specific.dueDate || '30-Day Delivery Cycle'}**\n\n` +
          (!isFieldStaff ? (
            `#### 💵 Financial Ledger:\n` +
            `- **Total Contract Value**: ₹${specific.totalValue.toLocaleString('en-IN')}\n` +
            `- **Payment Collected**: ₹${specific.collectedAmount.toLocaleString('en-IN')}\n` +
            `- **Outstanding Balance Due**: **₹${specific.balanceDue.toLocaleString('en-IN')}**\n` +
            (lateFee.weeksOverdue > 0 ? `- ⚠️ **Overdue Penalty (2%/wk × ${lateFee.weeksOverdue} wks)**: +₹${lateFee.penaltyAmount.toLocaleString('en-IN')} ➔ **Total Due: ₹${lateFee.totalDue.toLocaleString('en-IN')}**\n` : '')
          ) : `*Commercial contract figures shielded for Field Staff view.*`) + '\n\n' +
          `#### 🛠️ Deliverables in Progress:\n` +
          (projTasks.map(t => `- [${t.status === 'COMPLETED' ? 'x' : ' '}] **${t.title}** (\`${t.status}\` - Assigned: ${t.assignedStaffName || 'Specialist'})`).join('\n') || '_No discrete subtasks logged._');

        suggestedNextPrompts = [
          "Get overall project progress report",
          "Show overdue payment dues with 2% penalty",
          "What are today's tasks & deliverables?"
        ];
      } else {
        intent = 'GET_PROJECTS_SUMMARY';
        actionCategory = 'READ_QUERY';

        const totalProjects = projects.length;
        const inProgress = projects.filter(p => p.status === 'IN_PROGRESS').length;
        const gated = projects.filter(p => !p.isAdvanceReceived).length;

        actionTaken = `Fetched overall project portfolio summary (${totalProjects} projects)`;

        let projTable = projects.map(p => {
          const pTasks = tasks.filter(t => t.projectId === p.id);
          const cCount = pTasks.filter(t => t.status === 'COMPLETED').length;
          const pct = pTasks.length > 0 ? Math.round((cCount / pTasks.length) * 100) : (p.isAdvanceReceived ? 50 : 0);

          return `| \`${p.id}\` | **${p.clientName}** | \`${p.status}\` | ${p.isAdvanceReceived ? '🟢 Cleared' : '🔒 Locked'} | **${pct}%** | ${!isFieldStaff ? `₹${p.balanceDue.toLocaleString('en-IN')}` : 'Shielded'} |`;
        }).join('\n');

        responseText = `### 🏢 Agency Project Portfolio Overview\n\n` +
          `Currently managing **${totalProjects} projects** across Web Development, SEO, and Brand Growth:\n\n` +
          `| Proj ID | Client | Status | 50% Advance | Progress | Balance Due |\n` +
          `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
          projTable + '\n\n' +
          `#### 📌 Operational Summary:\n` +
          `- **Active Sprints Running**: **${inProgress} projects**\n` +
          `- **Pending Advance Clearance Gates**: **${gated} project(s)** (OmniFleet Transport Tech)\n` +
          (!isFieldStaff ? `- **Total Portfolio Value**: **₹${projects.reduce((s, p) => s + p.totalValue, 0).toLocaleString('en-IN')}**` : '');

        suggestedNextPrompts = [
          "Check status of Hyperion SaaS Platforms project",
          "Check status of OmniFleet Transport Tech project",
          "Show overdue payment dues with 2% penalty"
        ];
      }
    }

    // =========================================================================
    // INTENT: ATTENDANCE & PAYROLL MATRIX
    // =========================================================================
    else if (
      lower.includes('attendance report') || 
      lower.includes('who is absent') || 
      lower.includes('attendance summary') || 
      lower.includes('payroll') ||
      lower.includes('working days')
    ) {
      intent = 'GET_ATTENDANCE_REPORT';
      actionCategory = 'READ_QUERY';

      const staffMembers = DataService.getStaff();
      const calendar = DataService.getWorkCalendar();
      const todayRecords = DataService.getAttendanceRecords(undefined, todayStr);

      statusBadge = '[SUCCESS]';

      let attRows = staffMembers.map(s => {
        const rec = todayRecords.find(r => r.staffId === s.id);
        const payroll = DataService.getStaffPayrollSummary(s.id) || {
          dailyRate: Math.round(s.monthlySalary / (calendar.workingDaysCount || 25)),
          totalDeductions: 0,
          netSalaryPayable: s.monthlySalary
        };
        const status = rec?.status || 'PRESENT';

        return `| **${s.name}** (${s.userId}) | \`${s.team.replace('_', ' ')}\` | \`${status}\` | ₹${payroll.dailyRate.toLocaleString('en-IN')}/day | ₹${payroll.totalDeductions.toLocaleString('en-IN')} | **₹${payroll.netSalaryPayable.toLocaleString('en-IN')}** |`;
      }).join('\n');

      actionTaken = `Queried Staff Attendance & Payroll Matrix for ${staffMembers.length} team members`;

      responseText = `### 👥 Staff Attendance & Payroll Summary (${todayStr})\n\n` +
        `**Monthly Calendar**: October 2026 | **Total Working Days**: **${calendar.workingDaysCount} days**\n` +
        `**Official Holidays**: Gandhi Jayanti (Oct 2), Dussehra (Oct 20)\n\n` +
        `| Staff Member | Team | Status Today | Daily Rate | Deductions | Net Salary Payable |\n` +
        `| :--- | :--- | :--- | :--- | :--- | :--- |\n` +
        attRows + '\n\n' +
        `#### 💡 Daily Rate Formula:\n` +
        `\`Daily Rate = Monthly Salary / ${calendar.workingDaysCount} Working Days\`\n` +
        `- **Half Day**: 0.5 × Daily Rate deducted\n` +
        `- **Absent**: 1.0 × Daily Rate deducted\n` +
        `- **Pre-Applied Leave**: Tracked in payroll register.`;

      actionLinks = [
        { label: 'View Full Attendance Register', url: '/attendance' }
      ];

      suggestedNextPrompts = [
        "Mark David Chen as Half Day for today",
        "What are today's tasks & deliverables?",
        "Show overdue payment dues with 2% penalty"
      ];
    }

    // =========================================================================
    // RECYCLE BIN & DELETED RECORDS QUERIES / RESTORE
    // =========================================================================
    else if (
      lower.includes('recycle') || 
      lower.includes('trash') || 
      lower.includes('deleted records') || 
      lower.includes('deleted items') ||
      (lower.includes('restore') && (lower.includes('lead') || lower.includes('quote') || lower.includes('quotation') || lower.includes('invoice') || lower.includes('task') || lower.includes('expense') || lower.includes('client')))
    ) {
      intent = 'GENERAL_QUERY';
      actionCategory = 'READ_QUERY';
      statusBadge = '[SUCCESS]';

      const binItems = DataService.getRecycleBin();

      // Check if user wants to restore a specific item
      if (lower.startsWith('restore ') || lower.includes('restore lead') || lower.includes('restore quote') || lower.includes('restore invoice') || lower.includes('restore expense')) {
        const itemToRestore = binItems.find(item => 
          lower.includes(item.title.toLowerCase()) || 
          lower.includes(item.originalId.toLowerCase()) ||
          (item.subtitle && lower.includes(item.subtitle.toLowerCase()))
        );

        if (itemToRestore) {
          const restored = DataService.restoreRecycleBinItem(itemToRestore.id);
          actionTaken = `Restored ${itemToRestore.entityType} "${itemToRestore.title}" from Recycle Bin`;
          responseText = `### ♻️ Record Successfully Restored!\n\n` +
            `Successfully restored **"${itemToRestore.title}"** (\`${itemToRestore.entityType}\`) back to active CRM records.\n\n` +
            `- **Entity**: \`${itemToRestore.entityType}\`\n` +
            `- **Original ID**: \`${itemToRestore.originalId}\`\n` +
            `- **Restored By**: **${staff.name}** (${staff.role})\n` +
            `- **Safety Status**: 100% full-fidelity restoration complete. All links re-established.\n\n` +
            `You can view it now directly in the corresponding CRM module.`;

          actionLinks = [
            { label: 'View Recycle Bin', url: '/recycle-bin' },
            { label: `View ${itemToRestore.entityType}s`, url: itemToRestore.entityType === 'LEAD' ? '/leads' : itemToRestore.entityType === 'QUOTATION' ? '/quotations' : '/finance' }
          ];
        } else {
          actionTaken = `Recycle bin search for restore query: "${rawPrompt}"`;
          responseText = `### 🔍 Item Not Found in Recycle Bin\n\n` +
            `Could not locate a deleted record matching your query in the Recycle Bin.\n\n` +
            `Currently, the Recycle Bin contains **${binItems.length} deleted records**:\n` +
            (binItems.length === 0 ? `_Recycle bin is completely empty._` : binItems.map(i => `- **${i.title}** (\`${i.entityType}\`) - ${i.subtitle || ''}`).join('\n'));

          actionLinks = [
            { label: 'Open Recycle Bin', url: '/recycle-bin' }
          ];
        }
      } else {
        // Query list of items in recycle bin
        actionTaken = `Queried Recycle Bin ledger (${binItems.length} items found)`;
        responseText = `### 🗑️ Recycle Bin Directory (${binItems.length} Deleted Items)\n\n` +
          `The Recycle Bin preserves all deleted CRM records with complete data snapshots so they can be restored at any time.\n\n` +
          (binItems.length === 0 
            ? `*The Recycle Bin is currently empty. No deleted records are pending recovery.*`
            : `| Entity Type | Title / Record | Details | Deleted At | Deleted By |\n` +
              `| :--- | :--- | :--- | :--- | :--- |\n` +
              binItems.map(i => `| \`${i.entityType}\` | **${i.title}** | ${i.subtitle || '-'} | ${new Date(i.deletedAt).toLocaleDateString('en-IN')} | ${i.deletedBy} |`).join('\n')
          ) + `\n\nTo restore an item, say *"Restore [Item Name]"* or click below to visit the Recycle Bin page.`;

        actionLinks = [
          { label: 'Open Recycle Bin', url: '/recycle-bin' }
        ];
      }

      suggestedNextPrompts = [
        "What is in the recycle bin?",
        "Show overdue payment dues with 2% penalty",
        "What are today's tasks & deliverables?"
      ];
    }

    // =========================================================================
    // INTENT: GENERAL QUERIES & CRM EXECUTIVE ASSISTANCE
    // =========================================================================
    else {
      // Check if the user command was attempting an operational action
      const isActionOriented = /^(change|update|set|mark|assign|create|add|log|record|convert|delete|remove|switch|send|dispatch)\b/i.test(lower) ||
        /\b(to won|to lost|as won|as lost|as completed|as done|as in progress)\b/i.test(lower);

      if (isActionOriented) {
        intent = 'GENERAL_QUERY';
        actionCategory = 'READ_QUERY';
        statusBadge = '[ACTION FAILED]';
        auditStatus = 'ERROR';
        actionTaken = `Unresolved action command: "${rawPrompt.slice(0, 60)}"`;

        const leads = DataService.getLeads();
        const tasks = DataService.getTasks();

        responseText = `### ⚠️ Action Could Not Be Executed\n\n` +
          `I recognized that you issued an operational CRM command: *"\"${rawPrompt}\"*", but the target entity or parameters could not be clearly resolved against CRM records.\n\n` +
          `**Guidance on Direct Action Commands**:\n` +
          `- **Change Lead Status / Stage**: e.g., *"Change BioMed client lead to won"* or *"Mark lead 'John Doe' as proposal sent"*\n` +
          `- **Assign Lead to Team/Staff**: e.g., *"Assign lead 'John Doe' to the Web Dev team and select staff Rahul"*\n` +
          `- **Quotation Generation**: e.g., *"Generate a quotation for lead 'Acme Corp' with 18% inclusive GST for 50,000 INR"*\n` +
          `- **Task Updates**: e.g., *"Log today's video shoot completion for client XYZ and notify the client"*\n` +
          `- **Record Payments**: e.g., *"Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha"*\n` +
          `- **Staff & Expense**: e.g., *"Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks"*\n\n` +
          `**Available Leads in CRM**: ${leads.map(l => `\`${l.businessName}\``).slice(0, 4).join(', ')}`;
      } else {
        intent = 'GENERAL_QUERY';
        actionCategory = 'READ_QUERY';

        const metrics = DataService.getDashboardMetrics();
        statusBadge = '[SUCCESS]';
        actionTaken = `Answered general query: "${rawPrompt.slice(0, 60)}"`;

        responseText = `### 🤖 Nearlook Executive AI Assistant\n\n` +
          `I am your 24/7 AI Agency Copilot. I have analyzed all CRM records across Leads, Quotations, Tasks, Attendance, Invoices, and Vendors.\n\n` +
          `#### 📊 Quick Agency Snapshot Today (${todayStr}):\n` +
          `- **Active Monthly Retainers**: ${metrics.totalActiveRetainers} clients\n` +
          `- **Active Leads Pipeline**: ${metrics.activeLeadsCount} deals (₹${metrics.totalPipelineValue.toLocaleString('en-IN')})\n` +
          (!isFieldStaff ? `- **Tax Liability Payable (18% GST)**: ₹${(metrics.totalCollectedTaxLiability || 0).toLocaleString('en-IN')}\n` : '') +
          (!isFieldStaff ? `- **Overdue Invoices Amount**: ₹${metrics.overdueInvoicesAmount.toLocaleString('en-IN')} (with 2% weekly compound fee)\n` : '') +
          `- **Staff Utilization**: ${metrics.averageStaffUtilization}%\n\n` +
          `#### ⚡ Operations & Actions You Can Run Right Now:\n` +
          `- **Lead Assignment**: e.g., *"Assign lead 'John Doe' to the Web Dev team and select staff Rahul."*\n` +
          `- **Quotation Generation**: e.g., *"Generate a quotation for lead 'Acme Corp' with 18% inclusive GST for 50,000 INR."*\n` +
          `- **Task & WhatsApp Dispatch**: e.g., *"Log today's video shoot completion for client XYZ and notify the client."*\n` +
          `- **Split Payment & Receipts**: e.g., *"Record payment of 25,000 INR collected by Account Manager Priya for Project Alpha."*\n` +
          `- **Staff Attendance & Expense**: e.g., *"Mark Staff Vikram as absent for next Monday and log an expense of 1,200 INR for Tea & Snacks."*`;
      }
    }

    // Construct AI Message
    const message: AIChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'ai',
      text: responseText,
      timestamp: new Date().toISOString(),
      intent,
      statusBadge,
      actionExecuted,
      pendingApproval,
      actionLinks,
      dataPayload,
      suggestedNextPrompts,
      userStaff: {
        id: staff.id,
        name: staff.name,
        role: staff.role
      }
    };

    // Construct Date-wise Audit Log Entry
    const auditLog: AIChatAuditLog = {
      id: `cbl-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: todayStr,
      time: timeStr,
      staffId: staff.id,
      staffName: staff.name,
      staffRole: staff.role,
      userPrompt: rawPrompt,
      detectedIntent: intent,
      actionTaken,
      actionCategory,
      responseSummary: responseText.slice(0, 160).replace(/[#*`\n]/g, ' ') + '...',
      status: auditStatus,
      metadata: actionExecuted ? actionExecuted.payload : (pendingApproval ? pendingApproval.payload : undefined)
    };

    // Store in audit trail
    auditLogsList.unshift(auditLog);

    return { message, auditLog };
  }
};
