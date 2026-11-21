import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const items = DataService.getRecycleBin();

    const counts = {
      total: items.length,
      leads: items.filter(i => i.entityType === 'LEAD').length,
      quotations: items.filter(i => i.entityType === 'QUOTATION').length,
      invoices: items.filter(i => i.entityType === 'INVOICE' || i.entityType === 'RECEIPT').length,
      expenses: items.filter(i => i.entityType === 'EXPENSE').length,
      tasks: items.filter(i => i.entityType === 'TASK').length,
      appointments: items.filter(i => i.entityType === 'APPOINTMENT').length,
      clients: items.filter(i => i.entityType === 'CLIENT' || i.entityType === 'VENDOR').length,
      staff: items.filter(i => i.entityType === 'STAFF' || i.entityType === 'ATTENDANCE').length
    };

    return NextResponse.json({
      success: true,
      data: items,
      counts
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, entityType } = body;

    if (action === 'RESTORE') {
      if (!id) {
        return NextResponse.json({ success: false, error: 'Recycle bin item ID is required to restore' }, { status: 400 });
      }
      const restored = DataService.restoreRecycleBinItem(id);
      if (!restored) {
        return NextResponse.json({ success: false, error: 'Item not found in Recycle Bin' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: `Successfully restored ${restored.title} back to active CRM records!`,
        data: restored
      });
    }

    if (action === 'RESTORE_ALL') {
      const result = DataService.restoreAllRecycleBinItems(entityType);
      return NextResponse.json({
        success: true,
        message: `Restored ${result.count} items from Recycle Bin!`,
        count: result.count
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    const actionParam = searchParams.get('action');
    const entityTypeParam = searchParams.get('entityType') || undefined;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional when query params are provided
    }

    const id = idParam || body.id;
    const action = actionParam || body.action;
    const entityType = entityTypeParam || body.entityType;

    if (action === 'EMPTY') {
      const result = DataService.emptyRecycleBin(entityType);
      return NextResponse.json({
        success: true,
        message: `Permanently removed ${result.clearedCount} items from Recycle Bin.`,
        clearedCount: result.clearedCount
      });
    }

    if (id) {
      const deleted = DataService.permanentlyDeleteRecycleBinItem(id);
      if (!deleted) {
        return NextResponse.json({ success: false, error: 'Item not found in Recycle Bin' }, { status: 404 });
      }
      return NextResponse.json({
        success: true,
        message: 'Item permanently deleted from system.'
      });
    }

    return NextResponse.json({ success: false, error: 'Specify item id or action=EMPTY' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
