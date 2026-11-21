import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const tasks = DataService.getTasks();
    return NextResponse.json({ success: true, data: tasks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      clientId, title, description, status, priority, 
      serviceCategory, assignedStaffId, dueDate, estimatedHours, 
      isRecurring, recurringRule, subTasks 
    } = body;

    if (!title) {
      return NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 });
    }

    const clientsList = DataService.getClients();
    const resolvedClientId = clientId || (clientsList.length > 0 ? clientsList[0].id : 'internal-ops');

    const newTask = await DataService.createTask({
      clientId: resolvedClientId,
      title,
      description: description || '',
      status: status || 'TO_DO',
      priority: priority || 'MEDIUM',
      serviceCategory: serviceCategory || 'SOFTWARE_DEV',
      assignedStaffId: assignedStaffId || undefined,
      dueDate: dueDate || undefined,
      estimatedHours: Number(estimatedHours) || 2,
      isRecurring: Boolean(isRecurring),
      recurringRule: recurringRule || 'NONE',
      subTasks: subTasks || []
    });

    return NextResponse.json({ success: true, data: newTask });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
