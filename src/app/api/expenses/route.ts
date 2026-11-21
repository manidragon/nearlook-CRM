import { NextResponse } from 'next/server';
import { DataService } from '@/lib/dataService';

export async function GET() {
  try {
    const expenses = DataService.getExpenses();
    return NextResponse.json({ success: true, data: expenses });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      clientId, 
      clientName, 
      vendorId, 
      vendorName, 
      staffId,
      category, 
      description, 
      amount, 
      date, 
      receiptName, 
      receiptUrl, 
      paymentMode,
      managerOverride
    } = body;

    const numAmount = Number(amount) || 0;
    if (!description || numAmount <= 0) {
      return NextResponse.json({ success: false, error: 'Valid description and amount (> 0) are required' }, { status: 400 });
    }

    // Maker-Checker Rule: Account Managers require Owner/Admin approval
    if (body.staffRole === 'ACCOUNT_MANAGER' && !body.bypassApprovalCheck) {
      const approval = DataService.submitFinancialApproval({
        type: 'EXPENSE',
        title: `Expense Payout (${category || 'General'}) - ₹${numAmount.toLocaleString('en-IN')}`,
        amount: numAmount,
        entityId: `temp-exp-${Date.now()}`,
        description: `Expense logged by Account Manager: ${description}. Mode: ${paymentMode || 'BANK'}. Pending Owner/Admin approval.`,
        submittedByStaffId: body.staffId || 'staff-acc',
        submittedByStaffName: body.staffName || 'Michael Patel (Account Manager)',
        submittedByRole: 'ACCOUNT_MANAGER',
        payload: body
      });
      return NextResponse.json({
        success: true,
        pendingApproval: true,
        message: 'Expense submitted for Owner / Admin approval. Balances remain unchanged until approved.',
        data: approval
      });
    }

    // STRICT VALIDATION FOR STAFF SALARY PAYOUTS
    if (category === 'SALARY') {
      let resolvedStaffId = staffId;
      if (!resolvedStaffId) {
        // Find staff by name in description or staff list
        const staffList = DataService.getStaff();
        const matched = staffList.find(s => description.toLowerCase().includes(s.name.toLowerCase()));
        if (matched) resolvedStaffId = matched.id;
      }

      if (resolvedStaffId) {
        const payroll = DataService.getStaffPayrollSummary(resolvedStaffId);
        if (payroll) {
          const maxAllowed = payroll.netSalaryPayable;
          if (numAmount > maxAllowed && !managerOverride) {
            return NextResponse.json({ 
              success: false, 
              error: `Overpayment blocked: Disbursed salary of ₹${numAmount.toLocaleString('en-IN')} exceeds net calculated monthly salary of ₹${maxAllowed.toLocaleString('en-IN')} (Base: ₹${payroll.monthlySalary.toLocaleString('en-IN')} - Attendance Deductions: ₹${payroll.totalDeductions.toLocaleString('en-IN')}). Overages require explicit managerial override to be logged as a formal Staff Advance Loan.` 
            }, { status: 400 });
          }

          // If managerOverride is true and amount exceeds net salary, split into net salary + staff advance loan
          if (numAmount > maxAllowed && managerOverride) {
            const excessAmount = numAmount - maxAllowed;

            // 1. Regular Salary Expense
            const salaryExp = DataService.addExpense({
              clientId: clientId || undefined,
              clientName: clientName || undefined,
              vendorId: vendorId || undefined,
              vendorName: vendorName || undefined,
              category: 'SALARY',
              description: `${description} [Net Base Salary]`,
              amount: maxAllowed,
              date: date || new Date().toISOString().split('T')[0],
              receiptName: receiptName || undefined,
              receiptUrl: receiptUrl || undefined,
              paymentMode: paymentMode || 'BANK'
            });

            // 2. Staff Advance Loan Expense
            const loanExp = DataService.addExpense({
              clientId: clientId || undefined,
              clientName: clientName || undefined,
              vendorId: vendorId || undefined,
              vendorName: vendorName || undefined,
              category: 'MAINTENANCE' as any,
              description: `Manager Approved Staff Advance Loan to ${payroll.staffName} (Over & above net salary)`,
              amount: excessAmount,
              date: date || new Date().toISOString().split('T')[0],
              receiptName: receiptName || undefined,
              receiptUrl: receiptUrl || undefined,
              paymentMode: paymentMode || 'BANK'
            });

            // Post Double-Entry Journal Vouchers
            const isCash = (paymentMode || '').toUpperCase() === 'CASH';
            const assetCode = isCash ? '1010' : '1020';
            const assetName = isCash ? 'Cash in Hand (Petty Cash)' : 'HDFC Bank - Current A/C (Operating)';

            try {
              DataService.addJournalEntry({
                voucherType: 'PAYMENT',
                date: date || new Date().toISOString().split('T')[0],
                referenceNo: `SLRY-${payroll.staffId.slice(-4)}`,
                narration: `Net salary payout to ${payroll.staffName}`,
                lines: [
                  { accountCode: '6040', accountName: 'Core Engineering & Design Staff Salaries', debit: maxAllowed, credit: 0 },
                  { accountCode: assetCode, accountName: assetName, debit: 0, credit: maxAllowed }
                ]
              });
              DataService.addJournalEntry({
                voucherType: 'PAYMENT',
                date: date || new Date().toISOString().split('T')[0],
                referenceNo: `SLOAN-${payroll.staffId.slice(-4)}`,
                narration: `Staff advance loan disbursed to ${payroll.staffName}`,
                lines: [
                  { accountCode: '2060', accountName: 'Corporate Loans & Staff Advances', debit: excessAmount, credit: 0 },
                  { accountCode: assetCode, accountName: assetName, debit: 0, credit: excessAmount }
                ]
              });
            } catch (jeErr) {
              console.warn('Salary journal entry error:', jeErr);
            }

            return NextResponse.json({ 
              success: true, 
              data: salaryExp,
              message: `Salary of ₹${maxAllowed.toLocaleString('en-IN')} disbursed, and excess ₹${excessAmount.toLocaleString('en-IN')} booked as Staff Advance Loan.` 
            });
          }
        }
      }
    }

    const newExpense = DataService.addExpense({
      clientId: clientId || undefined,
      clientName: clientName || undefined,
      vendorId: vendorId || undefined,
      vendorName: vendorName || undefined,
      category: category || 'RENT',
      description,
      amount: numAmount,
      date: date || new Date().toISOString().split('T')[0],
      receiptName: receiptName || undefined,
      receiptUrl: receiptUrl || undefined,
      paymentMode: paymentMode || 'BANK'
    });

    // Double-Entry Accounting Tally Ledger Post
    const isCash = (paymentMode || '').toUpperCase() === 'CASH';
    const assetAccountCode = isCash ? '1010' : '1020';
    const assetAccountName = isCash ? 'Cash in Hand (Petty Cash)' : 'HDFC Bank - Current A/C (Operating)';

    let expenseAccountCode = '6030';
    let expenseAccountName = 'Team Pantry, Coffee & Working Refreshments';

    if (category === 'SALARY') {
      expenseAccountCode = '6040';
      expenseAccountName = 'Core Engineering & Design Staff Salaries';
    } else if (category === 'RENT') {
      expenseAccountCode = '6010';
      expenseAccountName = 'Office Facility Lease Rent (Tech Hub Tower)';
    } else if (category === 'ELECTRICITY_EB') {
      expenseAccountCode = '6020';
      expenseAccountName = 'Bescom Commercial Power & EB Bill';
    } else if (category === 'HOSTING_DOMAIN') {
      expenseAccountCode = '5010';
      expenseAccountName = 'AWS & Cloudways Dedicated Server Infrastructure';
    } else if (category === 'SAAS_TOOL') {
      expenseAccountCode = '5020';
      expenseAccountName = 'OpenAI & Claude LLM Token Quotas';
    } else if (category === 'FREELANCER') {
      expenseAccountCode = '5030';
      expenseAccountName = 'Freelancer Python & LangChain Developer Payouts';
    } else if (category === 'INFLUENCER') {
      expenseAccountCode = '5040';
      expenseAccountName = 'Social Media Influencer Promotion Campaign Fees';
    }

    try {
      DataService.addJournalEntry({
        voucherType: 'PAYMENT',
        date: date || new Date().toISOString().split('T')[0],
        referenceNo: `EXP-${newExpense.id.slice(-4)}`,
        narration: `Expense payout: ${description}`,
        lines: [
          {
            accountCode: expenseAccountCode,
            accountName: expenseAccountName,
            debit: numAmount,
            credit: 0
          },
          {
            accountCode: assetAccountCode,
            accountName: assetAccountName,
            debit: 0,
            credit: numAmount
          }
        ]
      });
    } catch (jeErr) {
      console.warn('Expense journal entry error:', jeErr);
    }

    return NextResponse.json({ success: true, data: newExpense });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ success: false, error: 'Expense ID required' }, { status: 400 });

    const updated = DataService.updateExpense(id, data);
    if (!updated) return NextResponse.json({ success: false, error: 'Expense not found' }, { status: 404 });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: 'Expense ID required' }, { status: 400 });

    const deleted = DataService.deleteExpense(id);
    return NextResponse.json({ success: deleted, message: deleted ? 'Expense deleted successfully' : 'Not found' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
