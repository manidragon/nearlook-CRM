import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const items = DataService.getInventory();
    return NextResponse.json({ success: true, data: items });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      itemCode, 
      name, 
      category, 
      serialOrLicenseKey, 
      totalQuantity, 
      availableQuantity, 
      assignedStaffId, 
      assignedStaffName, 
      vendorName, 
      purchaseValue, 
      purchaseDate, 
      warrantyExpiry, 
      status, 
      notes 
    } = body;

    if (!name || !category) {
      return NextResponse.json({ success: false, error: 'Item Name and Category are required' }, { status: 400 });
    }

    const totalQty = Number(totalQuantity) || 1;
    const availQty = availableQuantity !== undefined ? Number(availableQuantity) : totalQty;

    const item = DataService.addInventoryItem({
      itemCode: itemCode || `AST-${Date.now().toString().slice(-4)}`,
      name,
      category,
      serialOrLicenseKey,
      totalQuantity: totalQty,
      availableQuantity: availQty,
      assignedStaffId,
      assignedStaffName,
      vendorName,
      purchaseValue: Number(purchaseValue) || 0,
      purchaseDate,
      warrantyExpiry,
      status: status || 'AVAILABLE_IN_STORE',
      notes
    });

    return NextResponse.json({ success: true, data: item });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const updated = DataService.updateInventoryItem(id, updates);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Inventory Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const deletedBy = searchParams.get('deletedBy') || 'Owner / Admin';

    if (!id) {
      return NextResponse.json({ success: false, error: 'Item ID is required' }, { status: 400 });
    }

    const success = DataService.deleteInventoryItem(id, deletedBy);
    if (!success) {
      return NextResponse.json({ success: false, error: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Inventory item moved to Recycle Bin' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

