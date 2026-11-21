import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const projects = DataService.getProjects();
    return NextResponse.json({ success: true, data: projects });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, clientId, domain, techStack, totalValue, advanceRequired, dueDate, startDate, description, assignedLeadName, status, milestones, contractType, location, category, budget, gstAmount } = body;

    if (!title || !clientId || !totalValue) {
      return NextResponse.json({ success: false, error: 'Project Title, Client, and Total Contract Value are required' }, { status: 400 });
    }

    const newProject = DataService.addProject({
      title,
      clientId,
      domain: domain || 'SOFTWARE',
      techStack: techStack || 'Next.js 14, Node.js, PostgreSQL',
      totalValue: Number(totalValue),
      advanceRequired: advanceRequired ? Number(advanceRequired) : undefined,
      dueDate,
      startDate,
      description,
      assignedLeadName,
      status: status || 'PLANNING',
      milestones,
      contractType,
      location,
      category,
      budget: budget ? Number(budget) : undefined,
      gstAmount: gstAmount ? Number(gstAmount) : undefined
    });

    return NextResponse.json({ success: true, data: newProject });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
    }

    const updated = DataService.updateProject(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
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
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 });
    }

    const success = DataService.deleteProject(id, deletedBy);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Project moved to Recycle Bin' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
