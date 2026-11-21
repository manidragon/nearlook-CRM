import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';
import { sendWhatsAppNotification } from '@/lib/whatsappService';

export async function GET() {
  try {
    const logs = DataService.getWhatsAppLogs();
    return NextResponse.json({ success: true, data: logs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { to, recipientName, recipientType, eventType, message } = body;

    if (!to || !message) {
      return NextResponse.json({ success: false, error: 'Recipient phone number and message body are required' }, { status: 400 });
    }

    const result = await sendWhatsAppNotification({
      to,
      recipientName: recipientName || 'Agency Contact',
      recipientType: recipientType || 'CLIENT',
      eventType: eventType || 'CUSTOM',
      message
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
