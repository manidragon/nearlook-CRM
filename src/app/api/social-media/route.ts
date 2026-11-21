import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const tasks = DataService.getSocialMediaTasks();
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, clientName, title, platform, contentCreationDate, shootDate, editingDate, postingDate, assignedStaffId, assignedStaffName } = body;

    if (!clientId || !title || !postingDate) {
      return NextResponse.json({ success: false, error: 'Client, title, and posting date are required' }, { status: 400 });
    }

    const newTask = DataService.addSocialMediaTask({
      clientId,
      clientName: clientName || 'Client',
      title,
      platform: platform || 'INSTAGRAM',
      contentCreationDate,
      shootDate,
      editingDate,
      postingDate,
      status: 'PLANNED',
      assignedStaffId,
      assignedStaffName
    });

    return NextResponse.json({ success: true, data: newTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
