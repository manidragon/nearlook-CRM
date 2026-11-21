import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const staff = DataService.getStaff();
    return NextResponse.json({ success: true, data: staff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      name, 
      email, 
      phone, 
      address, 
      monthlySalary, 
      role, 
      team, 
      hourlyRate, 
      documents, 
      shiftTiming, 
      deductionsPerAbsence,
      allowedModules,
      canManageUsers
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json({ success: false, error: 'Name, email, and phone are required' }, { status: 400 });
    }

    const newStaff = DataService.addStaff({
      name,
      email,
      phone,
      address: address || 'Bangalore, India',
      monthlySalary: Number(monthlySalary) || 45000,
      role: role || 'DEVELOPER',
      team: team || 'WEB_DEVELOPMENT',
      hourlyRate: Number(hourlyRate) || undefined,
      documents: documents || [],
      shiftTiming: shiftTiming || '09:30 AM - 07:30 PM (Standard Slot)',
      deductionsPerAbsence: Number(deductionsPerAbsence) || Math.round((Number(monthlySalary) || 45000) / 30),
      allowedModules,
      canManageUsers: Boolean(canManageUsers)
    });

    return NextResponse.json({ success: true, data: newStaff });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Staff ID required' }, { status: 400 });

    const updated = DataService.updateStaff(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Staff not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Staff ID required' }, { status: 400 });

    const deleted = DataService.deleteStaff(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Staff deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
