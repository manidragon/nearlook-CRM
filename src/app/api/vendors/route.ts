import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const vendors = DataService.getVendors();
    return NextResponse.json({ success: true, data: vendors });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      companyName, 
      contactPerson, 
      phone, 
      email, 
      bankDetails, 
      vendorType, 
      serviceCategory, 
      projectId,
      projectName,
      clientName,
      influencerId,
      influencerName,
      totalPayable, 
      advancePaid, 
      dueDate,
      platform,
      followerCount,
      paymentMode,
      invoiceNumber,
      receiptUrl,
      notes
    } = body;

    if (!companyName) {
      return NextResponse.json({ success: false, error: 'Platform, Vendor or Influencer name is required' }, { status: 400 });
    }

    const total = Number(totalPayable) || 0;
    const advance = Number(advancePaid) || 0;
    const balance = Math.max(0, total - advance);

    const vendor = DataService.addVendor({
      companyName,
      contactPerson,
      phone: phone || '',
      email,
      bankDetails,
      vendorType: vendorType || 'VENDOR',
      serviceCategory: serviceCategory || 'HOSTING_SERVERS',
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      clientName: clientName || undefined,
      influencerId: influencerId || undefined,
      influencerName: influencerName || undefined,
      totalPayable: total,
      advancePaid: advance,
      balanceDue: balance,
      dueDate,
      platform,
      followerCount,
      paymentMode,
      invoiceNumber,
      receiptUrl,
      notes
    });

    return NextResponse.json({ success: true, data: vendor });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });

    const updated = DataService.updateVendor(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Vendor not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Vendor ID required' }, { status: 400 });

    const deleted = DataService.deleteVendor(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Vendor deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
