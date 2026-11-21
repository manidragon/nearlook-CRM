import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const leads = DataService.getLeads();
    const lead = leads.find(l => l.id === id);
    if (!lead) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: lead });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (body.leadStage) {
      const updated = await DataService.updateLeadStatus(id, body.leadStage);
      if (!updated) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: updated });
    }

    const updated = DataService.updateLead(id, body);
    if (!updated) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const updated = DataService.updateLead(id, body);
    if (!updated) return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(req.url);
    const deletedBy = searchParams.get('deletedBy') || 'Rachel Adams (ADMIN)';
    const deleted = DataService.deleteLead(id, deletedBy);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Lead moved to Recycle Bin' : 'Not found'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
