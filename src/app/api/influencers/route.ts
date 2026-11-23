import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const influencers = DataService.getInfluencers();
    return NextResponse.json({ success: true, data: influencers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      handle,
      platform,
      phone,
      email,
      category,
      followersCount,
      standardRate,
      bankDetails,
      upiId,
      address,
      notes,
      status
    } = body;

    if (!name || !handle) {
      return NextResponse.json({ success: false, error: 'Influencer Name and Social Handle are required' }, { status: 400 });
    }

    const influencer = DataService.addInfluencer({
      name,
      handle: handle.startsWith('@') ? handle : `@${handle}`,
      platform: platform || 'Instagram',
      phone: phone || '',
      email: email || '',
      category: category || 'Digital Marketing & Lifestyle',
      followersCount: followersCount || '10K',
      standardRate: Number(standardRate) || 0,
      bankDetails: bankDetails || '',
      upiId: upiId || '',
      address: address || '',
      notes: notes || '',
      status: status || 'ACTIVE',
      totalPaidToDate: 0
    });

    return NextResponse.json({ success: true, data: influencer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Influencer ID required' }, { status: 400 });

    if (data.handle && !data.handle.startsWith('@')) {
      data.handle = `@${data.handle}`;
    }

    const updated = DataService.updateInfluencer(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Influencer not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const deletedBy = searchParams.get('deletedBy') || 'Arun (Owner)';
    if (!id) return NextResponse.json({ success: false, error: 'Influencer ID required' }, { status: 400 });

    const deleted = DataService.deleteInfluencer(id, deletedBy);
    return NextResponse.json({ success: deleted, message: deleted ? 'Influencer removed successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
