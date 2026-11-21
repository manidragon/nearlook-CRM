import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const staffId = searchParams.get('staffId');
    const leaves = DataService.getLeaveApplications(staffId || undefined);
    return NextResponse.json({ success: true, data: leaves });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { staffId, staffName, staffRole, staffEmail, startDate, endDate, daysCount, leaveType, reason } = body;

    if (!staffId || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: 'Staff ID, start date, end date, and reason are required' }, { status: 400 });
    }

    const newLeave = DataService.applyForLeave({
      staffId,
      staffName: staffName || 'Staff Member',
      staffRole: staffRole || 'DEVELOPER',
      staffEmail,
      startDate,
      endDate,
      daysCount: Number(daysCount) || 1,
      leaveType: leaveType || 'CASUAL',
      reason
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Leave application submitted successfully. Routed to Owner/Admin for approval.', 
      data: newLeave 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, status, reviewerStaff, reviewNotes } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Leave ID and status (APPROVED/REJECTED) are required' }, { status: 400 });
    }

    const reviewer = reviewerStaff || {
      id: 'staff-1',
      name: 'Rachel Adams',
      role: 'ADMIN'
    };

    const updated = DataService.reviewLeaveApplication(id, status, reviewer, reviewNotes);
    if (!updated) return NextResponse.json({ success: false, error: 'Leave application not found' }, { status: 404 });

    return NextResponse.json({ 
      success: true, 
      message: `Leave application ${status.toLowerCase()} successfully!`, 
      data: updated 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
