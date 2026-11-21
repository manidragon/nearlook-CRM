import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json({ success: false, error: 'Invoice ID is required' }, { status: 400 });
    }

    const result = await DataService.sendPaymentReminder(invoiceId);

    return NextResponse.json({ 
      success: true, 
      data: result,
      message: 'WhatsApp payment reminder triggered successfully!'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
