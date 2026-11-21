import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { amount, paymentMethod } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ success: false, error: 'Valid payment amount is required' }, { status: 400 });
    }

    // Maker-Checker Rule: Account Managers require Owner/Admin approval
    if (body.staffRole === 'ACCOUNT_MANAGER' && !body.bypassApprovalCheck) {
      const approval = DataService.submitFinancialApproval({
        type: 'VENDOR_PAYOUT',
        title: `Vendor Payment Disbursement - ₹${Number(amount).toLocaleString('en-IN')}`,
        amount: Number(amount),
        entityId: params.id,
        description: `Vendor payout disbursement for Vendor ID ${params.id}. Mode: ${paymentMethod || 'NEFT / UPI'}. Pending Owner approval.`,
        submittedByStaffId: body.staffId || 'staff-acc',
        submittedByStaffName: body.staffName || 'Michael Patel (Account Manager)',
        submittedByRole: 'ACCOUNT_MANAGER',
        payload: { vendorId: params.id, amount: Number(amount), paymentMethod }
      });
      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'Vendor disbursement submitted for Owner / Admin approval. Cash/bank balances remain unaffected until approved.',
        data: approval
      });
    }

    const result = await DataService.logVendorPayment(params.id, Number(amount), paymentMethod || 'NEFT / UPI');
    if (!result) {
      return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
