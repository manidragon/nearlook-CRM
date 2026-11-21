import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const quotations = DataService.getQuotations();
    return NextResponse.json({ success: true, data: quotations });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { leadId, clientBusiness, clientContact, clientPhone, clientEmail, lineItems, gstType, paymentTerms, lateFeeTerms } = body;

    if (!leadId || !clientBusiness || !clientContact || !clientPhone || !lineItems || lineItems.length === 0) {
      return NextResponse.json({ success: false, error: 'Lead, client details, and at least one item are required.' }, { status: 400 });
    }

    const quotation = await DataService.createQuotation({
      leadId,
      clientBusiness,
      clientContact,
      clientPhone,
      clientEmail,
      lineItems,
      gstType: gstType || 'ADDITIONAL_18',
      paymentTerms,
      lateFeeTerms
    });

    return NextResponse.json({ success: true, data: quotation });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Quotation ID required' }, { status: 400 });

    const updated = DataService.updateQuotation(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Quotation not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Quotation ID required' }, { status: 400 });

    const deleted = DataService.deleteQuotation(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Quotation deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
