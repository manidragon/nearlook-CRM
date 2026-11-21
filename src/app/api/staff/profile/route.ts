import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { staffId, name, email, phone, address, avatar, role, team, shiftTiming } = body;

    if (!staffId) {
      return NextResponse.json({ success: false, error: 'Staff ID is required' }, { status: 400 });
    }

    const updated = DataService.updateStaffProfile(staffId, {
      name,
      email,
      phone,
      address,
      avatar,
      role,
      team,
      shiftTiming
    });

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully!', 
      data: updated 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
