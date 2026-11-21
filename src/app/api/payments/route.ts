import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const receipts = DataService.getReceipts();
    const projects = DataService.getProjects();
    const clients = DataService.getClients();
    const invoices = DataService.getInvoices();

    // Compute late fees and outstanding summaries for all projects
    const duesSummary = projects.map(p => {
      const lateFee = DataService.calculateLateFee(p);
      const client = clients.find(c => c.id === p.clientId);
      return {
        ...p,
        clientPhone: client?.whatsappNumber,
        clientContact: client?.contactName,
        lateFee
      };
    });

    return NextResponse.json({
      success: true,
      data: receipts,
      receipts,
      duesSummary,
      projects,
      clients,
      invoices
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support toggling 2% late fee per week
    if (body.action === 'TOGGLE_LATE_FEE') {
      const updated = DataService.toggleLateFee(body.id, body.type || 'PROJECT', Boolean(body.assigned));
      return NextResponse.json({ 
        success: true, 
        data: updated,
        message: body.assigned ? 'Assigned 2% per week late fee calculation.' : 'Removed late fee calculation.'
      });
    }

    const { 
      clientId, 
      projectId, 
      invoiceId, 
      amount, 
      milestoneLabel, 
      paymentMethod, 
      referenceId, 
      notes, 
      nextDueDate, 
      paymentDate, 
      staffId, 
      staffName, 
      staffPhone 
    } = body;

    if (!clientId || !amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Client and a valid payment amount (> 0) are required' }, { status: 400 });
    }

    // Maker-Checker Rule: Account Managers require Owner/Admin approval
    if (body.staffRole === 'ACCOUNT_MANAGER' && !body.bypassApprovalCheck) {
      const approval = DataService.submitFinancialApproval({
        type: 'RECEIPT',
        title: `Payment Receipt Collection - ₹${Number(amount).toLocaleString('en-IN')}`,
        amount: Number(amount),
        entityId: `temp-rcp-${Date.now()}`,
        description: `Collection of ${milestoneLabel || 'Milestone Payment'} for Client ${clientId} via ${paymentMethod || 'Bank Transfer'}. Pending Owner approval.`,
        submittedByStaffId: staffId || 'staff-acc',
        submittedByStaffName: staffName || 'Michael Patel (Account Manager)',
        submittedByRole: 'ACCOUNT_MANAGER',
        payload: body
      });
      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'Payment collection submitted for Owner / Admin approval. Balances remain unchanged until approved.',
        data: approval
      });
    }

    const recordedBy = staffName ? {
      id: staffId || 'staff-acc',
      name: staffName,
      phone: staffPhone || '+919876543208'
    } : undefined;

    const result = await DataService.recordClientPayment({
      clientId,
      projectId,
      invoiceId,
      amount: Number(amount),
      milestoneLabel,
      paymentMethod: paymentMethod || 'UPI / Bank Transfer',
      referenceId,
      notes,
      nextDueDate,
      recordedBy,
      paymentDate
    });

    return NextResponse.json({
      success: true,
      data: result,
      message: `Split payment of ₹${Number(amount).toLocaleString('en-IN')} recorded successfully!`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Receipt ID required' }, { status: 400 });

    const updated = DataService.updateReceipt(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Receipt not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Receipt ID required' }, { status: 400 });

    const deleted = DataService.deleteReceipt(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Receipt deleted and balance reverted' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
