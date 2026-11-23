import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');
    const docs = DataService.getClientDocuments(clientId || undefined);
    return NextResponse.json({ success: true, data: docs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, clientName, title, category, fileUrl, fileName, fileSize, uploadedByStaffId, uploadedByStaffName, notes } = body;

    if (!clientId || !title) {
      return NextResponse.json({ success: false, error: 'Client and document title are required' }, { status: 400 });
    }

    const doc = DataService.addClientDocument({
      clientId,
      clientName: clientName || 'Client Document',
      title,
      category: category || 'CONTRACT',
      fileUrl: fileUrl || `https://docs.nearlook.com/files/${Date.now()}_${encodeURIComponent(fileName || title)}`,
      fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      fileSize: fileSize || '1.5 MB',
      uploadedByStaffId: uploadedByStaffId || 'staff-1',
      uploadedByStaffName: uploadedByStaffName || 'Arun',
      notes
    });

    return NextResponse.json({ success: true, data: doc });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Document ID required' }, { status: 400 });

    const deleted = DataService.deleteClientDocument(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
