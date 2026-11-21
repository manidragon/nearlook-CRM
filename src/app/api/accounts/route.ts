import { NextRequest, NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const exportFormat = searchParams.get('export');

    if (exportFormat === 'tally-xml') {
      const xml = DataService.generateTallyXML();
      return new NextResponse(xml, {
        status: 200,
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="tally_export_${new Date().toISOString().split('T')[0]}.xml"`
        }
      });
    }

    const coa = DataService.getCOA();
    const journals = DataService.getJournalEntries();
    const trialBalance = DataService.getTrialBalance();
    const pnl = DataService.getProfitAndLoss();

    return NextResponse.json({
      success: true,
      coa,
      journals,
      trialBalance,
      pnl
    });
  } catch (error: any) {
    console.error('Error fetching accounting data:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch accounting data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.lines || !Array.isArray(body.lines) || body.lines.length < 2) {
      return NextResponse.json(
        { success: false, error: 'A journal voucher must contain at least 2 ledger lines (Debit and Credit).' },
        { status: 400 }
      );
    }

    if (!body.narration) {
      return NextResponse.json(
        { success: false, error: 'Narration is required for audit and statutory tracking.' },
        { status: 400 }
      );
    }

    const voucher = DataService.addJournalEntry({
      voucherType: body.voucherType || 'JOURNAL',
      date: body.date || new Date().toISOString().split('T')[0],
      narration: body.narration,
      referenceNo: body.referenceNo,
      lines: body.lines
    });

    return NextResponse.json({
      success: true,
      voucher,
      message: `Voucher ${voucher.voucherNumber} posted successfully into general ledger.`
    });
  } catch (error: any) {
    console.error('Error posting journal voucher:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to post voucher' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Voucher ID is required for deletion' },
        { status: 400 }
      );
    }

    const deleted = DataService.deleteJournalEntry(id, 'Finance Lead');

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Voucher not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Voucher moved to Recycle Bin. Financial aggregates updated.'
    });
  } catch (error: any) {
    console.error('Error deleting voucher:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete voucher' },
      { status: 500 }
    );
  }
}

