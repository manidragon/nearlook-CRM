import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { text, authorId, authorName, authorRole, isPrivate } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ success: false, error: 'Note text is required' }, { status: 400 });
    }

    const lead = DataService.getLeads().find(l => l.id === params.id);
    if (!lead) {
      return NextResponse.json({ success: false, error: 'Lead not found' }, { status: 404 });
    }

    // Role check: Only Admin, Owner, or the specifically assigned Staff member
    const isAdmin = authorRole === 'ADMIN' || authorRole === 'OWNER';
    const isAssigned = lead.assignedManagerId === authorId;

    if (!isAdmin && !isAssigned) {
      return NextResponse.json({ 
        success: false, 
        error: 'Privacy Violation: Only Admin, Owner, or the assigned team specialist can add consultation notes.' 
      }, { status: 403 });
    }

    const author = {
      id: authorId || 'staff-1',
      name: authorName || 'Staff Member',
      role: authorRole || 'DEVELOPER'
    } as any;

    const note = DataService.addConsultationNote(params.id, author, text, Boolean(isPrivate));

    return NextResponse.json({ success: true, data: note });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
