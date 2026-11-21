import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const leads = DataService.getLeads();
    return NextResponse.json({ success: true, data: leads });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      clientId, leadName, businessName, businessCategory, address, city, whatsappNumber, email, serviceType, 
      leadStage, estimatedDealValue, notes, assignedTeam, assignedManagerId,
      source, referrerName, leadGeneratedDate, contactedDate, nextFollowUpDate, followUpNotes, convertedDate,
      servicesInterested, isGreetingSent, greetingSentAt
    } = body;

    if (!leadName || !businessName || !whatsappNumber) {
      return NextResponse.json({ success: false, error: 'Lead name, business name, and WhatsApp number are required' }, { status: 400 });
    }

    const multiServices: string[] = Array.isArray(servicesInterested) && servicesInterested.length > 0
      ? servicesInterested
      : [serviceType || 'WEB_DEV'];

    const newLead = await DataService.addLead({
      clientId: clientId || undefined,
      leadName,
      businessName,
      businessCategory: businessCategory || 'Retail & E-Commerce',
      address: address || '',
      city: city || '',
      whatsappNumber,
      email,
      serviceType: (multiServices[0] as any) || serviceType || 'WEB_DEV',
      servicesInterested: multiServices,
      leadStage: leadStage || 'NEW',
      source: source || 'WORD_OF_MOUTH',
      referrerName: referrerName || undefined,
      estimatedDealValue: Number(estimatedDealValue) || 0,
      leadGeneratedDate: leadGeneratedDate || new Date().toISOString().split('T')[0],
      contactedDate: contactedDate || undefined,
      nextFollowUpDate: nextFollowUpDate || undefined,
      followUpNotes: followUpNotes || undefined,
      convertedDate: convertedDate || undefined,
      isGreetingSent: Boolean(isGreetingSent),
      greetingSentAt: greetingSentAt || undefined,
      notes: notes || '',
      assignedTeam: assignedTeam || 'WEB_DEVELOPMENT',
      assignedManagerId: assignedManagerId || undefined
    });

    return NextResponse.json({ success: true, data: newLead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
