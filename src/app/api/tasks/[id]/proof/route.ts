import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, url, notes, fileSize } = body;

    if (!name || !url) {
      return NextResponse.json({ success: false, error: 'File name and file URL are required' }, { status: 400 });
    }

    const proof = DataService.addTaskProofFile(id, { name, url, notes, fileSize });
    if (!proof) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: proof });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
