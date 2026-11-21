import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { staff, completionNotes } = body;

    const staffMember = staff || {
      id: 'staff-1',
      name: 'Staff Member',
      role: 'DEVELOPER'
    };

    const result = await DataService.completeTaskWithClientShare(id, staffMember, completionNotes);
    if (!result) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      message: 'Task marked as completed! WhatsApp client share and Owner notification ready.', 
      data: result 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
