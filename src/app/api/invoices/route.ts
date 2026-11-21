import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const invoices = DataService.getInvoices();
    return NextResponse.json({ success: true, data: invoices });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      clientId, 
      projectId, 
      type, 
      amount, 
      subtotal, 
      gstType, 
      dueDate, 
      lineItems, 
      notes, 
      isFinalInvoice,
      installments,
      initialPaymentAmount,
      initialPaymentLabel,
      initialPaymentDate,
      nextScheduledPaymentAmount,
      nextScheduledDueDate,
      delayReason,
      delayNotes,
      isOnHold
    } = body;

    if (!clientId || (!amount && !subtotal) || !dueDate) {
      return NextResponse.json({ success: false, error: 'Client, amount/subtotal, and due date are required' }, { status: 400 });
    }

    const calculatedSubtotal = Number(subtotal || amount);

    // Maker-Checker Rule: Account Managers require Owner/Admin approval
    if (body.staffRole === 'ACCOUNT_MANAGER' && !body.bypassApprovalCheck) {
      const approval = DataService.submitFinancialApproval({
        type: 'INVOICE',
        title: `Client Invoice (${body.invoiceNumber || 'Master Invoice'}) - ₹${calculatedSubtotal.toLocaleString('en-IN')}`,
        amount: calculatedSubtotal,
        entityId: `temp-inv-${Date.now()}`,
        description: `Invoice creation submitted by Account Manager for Client ID ${clientId}. Pending Owner/Admin approval.`,
        submittedByStaffId: body.staffId || 'staff-acc',
        submittedByStaffName: body.staffName || 'Michael Patel (Account Manager)',
        submittedByRole: 'ACCOUNT_MANAGER',
        payload: body
      });
      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'Invoice submitted for Owner / Admin approval. Balances remain unchanged until approved.',
        data: approval
      });
    }

    const newInvoice = await DataService.createInvoice({
      clientId,
      projectId: projectId || undefined,
      type: type || 'RECURRING_RETAINER',
      subtotal: calculatedSubtotal,
      gstType: gstType || 'NO_GST',
      dueDate,
      lineItems: lineItems || [
        { id: `li-${Date.now()}`, description: 'Monthly Agency Retainer & Development Services', quantity: 1, rate: calculatedSubtotal, amount: calculatedSubtotal }
      ],
      notes: notes || 'Payment via NEFT / RTGS or UPI. Thank you for your partnership.',
      isFinalInvoice: Boolean(isFinalInvoice),
      installments,
      initialPaymentAmount: initialPaymentAmount ? Number(initialPaymentAmount) : undefined,
      initialPaymentLabel,
      initialPaymentDate,
      nextScheduledPaymentAmount: nextScheduledPaymentAmount ? Number(nextScheduledPaymentAmount) : undefined,
      nextScheduledDueDate,
      delayReason,
      delayNotes,
      isOnHold: Boolean(isOnHold)
    });

    return NextResponse.json({ success: true, data: newInvoice });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Invoice ID required' }, { status: 400 });

    const updated = DataService.updateInvoice(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Invoice ID required' }, { status: 400 });

    const deleted = DataService.deleteInvoice(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Invoice deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
