import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') as any;
    const approvals = DataService.getFinancialApprovals(status || undefined);
    const pendingCount = approvals.filter(a => a.status === 'PENDING').length;
    return NextResponse.json({ success: true, data: approvals, pendingCount });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, reason, reviewerStaff } = body;

    if (!id || !action) {
      return NextResponse.json({ success: false, error: 'ID and action (APPROVE/REJECT) are required' }, { status: 400 });
    }

    const reviewer = reviewerStaff || {
      id: 'staff-1',
      name: 'Rachel Adams',
      role: 'ADMIN'
    };

    if (action === 'APPROVE') {
      const result = await DataService.approveFinancialApproval(id, reviewer);
      if (!result) return NextResponse.json({ success: false, error: 'Approval item not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Transaction approved and applied to live ledgers!', data: result });
    } else if (action === 'REJECT') {
      const result = DataService.rejectFinancialApproval(id, reason || 'Rejected by Owner/Admin', reviewer);
      if (!result) return NextResponse.json({ success: false, error: 'Approval item not found' }, { status: 404 });
      return NextResponse.json({ success: true, message: 'Transaction marked as Rejected. Financial balances remain unaffected.', data: result });
    }

    return NextResponse.json({ success: false, error: 'Invalid action. Use APPROVE or REJECT.' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
