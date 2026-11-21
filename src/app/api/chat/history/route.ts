import { NextResponse } from 'next/server';
import { AIChatEngine } from '@/lib/aiChatEngine';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || undefined;
    const staffId = searchParams.get('staffId') || undefined;
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;

    const result = AIChatEngine.getAuditLogs({ date, staffId, category, search });

    return NextResponse.json({
      success: true,
      data: result.logs,
      dates: result.dates,
      totalCount: result.totalCount
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    AIChatEngine.clearAuditLogs();
    return NextResponse.json({ success: true, message: 'Audit logs cleared' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
