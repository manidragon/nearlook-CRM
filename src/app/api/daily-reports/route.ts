import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const reports = DataService.getDailyReports();
    return NextResponse.json({ success: true, data: reports });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      reportDate, 
      staffId, 
      staffName, 
      staffRole, 
      projectId, 
      projectName, 
      domain, 
      tasksCompleted, 
      hoursWorked, 
      blockers, 
      nextDayPlan, 
      repoOrAssetUrl, 
      status 
    } = body;

    if (!reportDate || !staffId || !tasksCompleted) {
      return NextResponse.json({ success: false, error: 'Report Date, Staff Member, and Tasks Completed are required' }, { status: 400 });
    }

    const report = DataService.addDailyReport({
      reportDate,
      staffId,
      staffName: staffName || 'Team Member',
      staffRole: staffRole || 'DEVELOPER',
      projectId: projectId || undefined,
      projectName: projectName || undefined,
      domain: domain || 'SOFTWARE',
      tasksCompleted,
      hoursWorked: Number(hoursWorked) || 8,
      blockers: blockers || 'None reported',
      nextDayPlan: nextDayPlan || '',
      repoOrAssetUrl: repoOrAssetUrl || '',
      completedTasksCount: Number(body.completedTasksCount) || 0,
      pendingTasksCount: Number(body.pendingTasksCount) || 0,
      overdueTasksCount: Number(body.overdueTasksCount) || 0,
      status: status || 'SUBMITTED'
    });

    return NextResponse.json({ success: true, data: report });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Report ID is required' }, { status: 400 });
    }

    const updated = DataService.updateDailyReport(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const deletedBy = searchParams.get('deletedBy') || 'Owner / Admin';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Report ID is required' }, { status: 400 });
    }

    const success = DataService.deleteDailyReport(id, deletedBy);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Daily Task Report moved to Recycle Bin' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

