import { NextResponse } from 'next/server';
import { AIChatEngine } from '@/lib/aiChatEngine';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, staff, staffId, confirmAction, cancelAction, pendingApproval } = body;

    // Default to Admin or provided staff / staffId
    const staffMembers = DataService.getStaff();
    const activeStaff = staff || (staffId ? staffMembers.find(s => s.id === staffId) : undefined) || staffMembers[0];

    // Handle Approval Gate confirmation
    if (confirmAction && pendingApproval) {
      const result = await AIChatEngine.executeApprovedAction(pendingApproval, activeStaff);
      return NextResponse.json({
        success: true,
        message: result.message,
        auditLog: result.auditLog
      });
    }

    // Handle Approval Gate cancellation
    if (cancelAction && pendingApproval) {
      const result = await AIChatEngine.cancelPendingAction(pendingApproval.id, activeStaff);
      return NextResponse.json({
        success: true,
        message: result.message,
        auditLog: result.auditLog
      });
    }

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ success: false, error: 'Prompt string is required' }, { status: 400 });
    }

    const result = await AIChatEngine.processQuery(prompt, activeStaff);

    return NextResponse.json({
      success: true,
      message: result.message,
      auditLog: result.auditLog
    });
  } catch (error: any) {
    console.error('AI Chatbot API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
