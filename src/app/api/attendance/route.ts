import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');

    const calendar = DataService.getWorkCalendar();
    const attendance = DataService.getAttendance();

    if (staffId) {
      const payroll = DataService.getStaffPayrollSummary(staffId);
      return NextResponse.json({
        success: true,
        calendar,
        attendance: attendance.filter(a => a.staffId === staffId),
        payroll
      });
    }

    return NextResponse.json({
      success: true,
      calendar,
      attendance
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { staffId, date, status, reason, updateCalendar, workingDaysCount, holidays } = body;

    if (updateCalendar) {
      const updated = DataService.updateWorkCalendar(workingDaysCount || 25, holidays || []);
      return NextResponse.json({ success: true, calendar: updated });
    }

    if (!staffId || !date || !status) {
      return NextResponse.json({ success: false, error: 'Staff ID, date, and status are required' }, { status: 400 });
    }

    const record = DataService.logAttendance(staffId, date, status, reason);
    const payroll = DataService.getStaffPayrollSummary(staffId);

    return NextResponse.json({ success: true, record, payroll });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 });

    const updated = DataService.updateAttendance(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Record not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Record ID required' }, { status: 400 });

    const deleted = DataService.deleteAttendance(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Attendance deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
