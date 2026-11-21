import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { credId } = body;

    if (!credId) {
      return NextResponse.json({ success: false, error: 'Credential ID is required' }, { status: 400 });
    }

    const decryptedPassword = DataService.revealVaultPassword(credId);
    
    return NextResponse.json({ 
      success: true, 
      decryptedPassword,
      revealedAt: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
