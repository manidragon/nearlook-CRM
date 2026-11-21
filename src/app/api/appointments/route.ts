import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const appointments = DataService.getAppointments(date || undefined);
    return NextResponse.json({ success: true, data: appointments });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      description,
      appointmentType,
      date,
      startTime,
      endTime,
      clientId,
      clientName,
      leadId,
      leadName,
      projectId,
      projectName,
      assignedStaffId,
      assignedStaffName,
      attendees,
      locationType,
      meetingLink,
      status,
      reminderMinutes,
      color
    } = body;

    if (!title || !date || !startTime) {
      return NextResponse.json({ success: false, error: 'Title, date, and start time are required' }, { status: 400 });
    }

    const newAppointment = DataService.createAppointment({
      title,
      description: description || '',
      appointmentType: appointmentType || 'CLIENT_MEETING',
      date,
      startTime,
      endTime: endTime || startTime,
      clientId: clientId || undefined,
      clientName: clientName || undefined,
      leadId: leadId || undefined,
      leadName: leadName || undefined,
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      assignedStaffId: assignedStaffId || undefined,
      assignedStaffName: assignedStaffName || undefined,
      attendees: attendees || [],
      locationType: locationType || 'GOOGLE_MEET',
      meetingLink: meetingLink || undefined,
      status: status || 'SCHEDULED',
      reminderMinutes: Number(reminderMinutes) || 15,
      color: color || undefined
    });

    return NextResponse.json({ success: true, data: newAppointment });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Appointment ID is required' }, { status: 400 });

    const updated = DataService.updateAppointment(id, updates);
    if (!updated) return NextResponse.json({ success: false, error: 'Appointment not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const deletedBy = searchParams.get('deletedBy') || 'Rachel Adams (ADMIN)';
    if (!id) return NextResponse.json({ success: false, error: 'Appointment ID is required' }, { status: 400 });

    const deleted = DataService.deleteAppointment(id, deletedBy);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'Appointment moved to Recycle Bin' : 'Not found'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
