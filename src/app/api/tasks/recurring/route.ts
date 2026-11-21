import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function POST() {
  try {
    const generated = DataService.generateRecurringTasks();
    return NextResponse.json({ 
      success: true, 
      count: generated.length, 
      data: generated,
      message: `Successfully generated ${generated.length} weekly recurring report tasks.`
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
