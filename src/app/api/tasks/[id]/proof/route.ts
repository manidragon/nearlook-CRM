import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    const { name, url, dataUrl, notes, fileSize } = body;

    if (!name || (!url && !dataUrl)) {
      return NextResponse.json({ success: false, error: 'File name and file URL or photo upload are required' }, { status: 400 });
    }

    const proof = DataService.addTaskProofFile(id, { name, url: url || dataUrl, dataUrl, notes, fileSize });
    if (!proof) return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: proof });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
