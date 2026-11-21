import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const services = DataService.getServices();
    return NextResponse.json({ success: true, data: services });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { label } = body;
    if (!label || !label.trim()) {
      return NextResponse.json({ success: false, error: 'Service label is required' }, { status: 400 });
    }

    const newService = DataService.addService(label);
    return NextResponse.json({ success: true, data: newService });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
