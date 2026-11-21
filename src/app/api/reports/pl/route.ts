import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const plData = DataService.getClientProfitLoss();
    const totalRevenue = plData.reduce((acc, c) => acc + c.totalRevenue, 0);
    const totalExpenses = plData.reduce((acc, c) => acc + c.totalExpenses, 0);
    const netProfit = totalRevenue - totalExpenses;
    const overallMargin = totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0;

    return NextResponse.json({ 
      success: true, 
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        overallMargin
      },
      clients: plData 
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
