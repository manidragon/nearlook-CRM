import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();

    if (body.toggleChecklist !== undefined) {
      const task = DataService.toggleTaskChecklist(id, body.isCompleted);
      if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: task });
    }

    if (body.newSubTaskTitle) {
      const task = DataService.addSubTaskToChecklist(id, body.newSubTaskTitle);
      if (!task) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: task });
    }

    if (body.subTaskId) {
      const task = DataService.toggleSubTask(id, body.subTaskId, body.isCompleted);
      if (!task) return NextResponse.json({ success: false, error: 'Task or Subtask not found' }, { status: 404 });
      return NextResponse.json({ success: true, data: task });
    }

    if (body.status) {
      const staffList = DataService.getStaff();
      const staff = staffList.find(s => s.id === body.staffId) || {
        id: 'staff-3',
        name: body.staffName || 'David Chen',
        role: body.staffRole || 'DEVELOPER',
        phone: body.staffPhone || '+919876543203'
      } as any;

      const task = await DataService.updateTaskStatus(id, body.status, staff);
      return NextResponse.json({ success: true, data: task });
    }

    const updated = DataService.updateTask(id, body);
    if (!updated) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  return PATCH(req, { params });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const deleted = DataService.deleteTask(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Task deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
