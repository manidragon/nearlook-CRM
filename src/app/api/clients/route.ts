import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const clients = DataService.getClients();
    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      businessName, contactName, whatsappNumber, email, website, 
      clientType, status, monthlyRetainerAmount, billingCycleDay, 
      retainerStartDate, retainerRenewalDate, assignedManagerId 
    } = body;

    if (!businessName || !contactName || !whatsappNumber || !email) {
      return NextResponse.json({ success: false, error: 'Business name, contact name, email, and WhatsApp number are required' }, { status: 400 });
    }

    const newClient = DataService.addClient({
      businessName,
      contactName,
      whatsappNumber,
      email,
      website,
      clientType: clientType || 'RECURRING_RETAINER',
      status: status || 'ACTIVE',
      monthlyRetainerAmount: Number(monthlyRetainerAmount) || 0,
      billingCycleDay: Number(billingCycleDay) || 1,
      retainerStartDate: retainerStartDate || undefined,
      retainerRenewalDate: retainerRenewalDate || undefined,
      assignedManagerId: assignedManagerId || undefined
    });

    return NextResponse.json({ success: true, data: newClient });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Client ID required' }, { status: 400 });

    const updated = DataService.updateClient(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Client not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Client ID required' }, { status: 400 });

    const deleted = DataService.deleteClient(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Client deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
