import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { paymentMethod, staffId, staffName, staffPhone } = body;

    const recordedBy = {
      id: staffId || 'staff-acc',
      name: staffName || 'Michael Patel',
      phone: staffPhone || '+919876543208'
    } as any;

    const result = await DataService.markProjectAdvanceReceived(params.id, paymentMethod || 'UPI / Bank Transfer', recordedBy);
    if (!result) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
