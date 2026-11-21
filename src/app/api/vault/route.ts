import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId') || undefined;
    const creds = DataService.getVaultCredentials(clientId);
    return NextResponse.json({ success: true, data: creds });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { clientId, category, label, loginUrl, username, passwordText, notes } = body;

    if (!clientId || !label || !username || !passwordText) {
      return NextResponse.json({ success: false, error: 'Client, label, username, and password are required' }, { status: 400 });
    }

    const newCred = DataService.addVaultCredential({
      clientId,
      category: category || 'WORDPRESS',
      label,
      loginUrl,
      username,
      passwordText,
      notes
    });

    return NextResponse.json({ success: true, data: newCred });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
