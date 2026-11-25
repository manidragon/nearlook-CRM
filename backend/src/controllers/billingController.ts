import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getBillingOverview = async (req: Request, res: Response) => {
  try {
    const receipts = await prisma.paymentReceipt.findMany({
      include: { project: true, client: true },
      orderBy: { createdAt: 'desc' }
    });
    const invoices = await prisma.invoice.findMany({
      include: { project: true, client: true },
      orderBy: { createdAt: 'desc' }
    });
    const projects = await prisma.project.findMany({
      include: { client: true },
      orderBy: { createdAt: 'desc' }
    });
    const clients = await prisma.client.findMany({
      orderBy: { businessName: 'asc' }
    });

    const duesSummary = projects.map((p: any) => {
      let lateFee = 0;
      if (p.lateFeeAssigned && p.dueDate && p.balanceDue > 0) {
        const dueTime = new Date(p.dueDate).getTime();
        const now = Date.now();
        if (now > dueTime) {
          const weeksOverdue = Math.max(1, Math.ceil((now - dueTime) / (7 * 24 * 60 * 60 * 1000)));
          lateFee = Math.round(p.balanceDue * 0.02 * weeksOverdue);
        }
      }
      return {
        ...p,
        lateFee
      };
    });

    res.json({
      success: true,
      receipts,
      invoices,
      projects,
      clients,
      duesSummary
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const recordSplitPayment = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      projectId,
      invoiceId,
      amount,
      milestoneLabel,
      paymentMethod,
      referenceId,
      notes,
      nextDueDate,
      recordedByStaffId,
      recordedByStaffName
    } = req.body;

    const numAmount = Number(amount);
    if (!clientId || !projectId || !numAmount || numAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Client, Project and valid amount > 0 are required' });
    }

    const project = await prisma.project.findUnique({ where: { id: projectId } });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

    const newCollected = project.collectedAmount + numAmount;
    const newBalance = Math.max(0, project.totalValue - newCollected);

    // Calculate accrued late fee if assigned
    let lateFeeAccrued = 0;
    if (project.lateFeeAssigned && project.dueDate && project.balanceDue > 0) {
      const dueTime = new Date(project.dueDate).getTime();
      const now = Date.now();
      if (now > dueTime) {
        const weeks = Math.max(1, Math.ceil((now - dueTime) / (7 * 24 * 60 * 60 * 1000)));
        lateFeeAccrued = Math.round(project.balanceDue * 0.02 * weeks);
      }
    }

    const receiptCount = await prisma.paymentReceipt.count();
    const receiptNumber = `RCP-${new Date().getFullYear()}-${String(receiptCount + 1).padStart(3, '0')}`;

    const receipt = await prisma.paymentReceipt.create({
      data: {
        receiptNumber,
        projectId,
        clientId,
        amount: numAmount,
        totalContractValue: project.totalValue,
        totalPaidToDate: newCollected,
        remainingBalanceDue: newBalance,
        lateFeeAccrued,
        nextDueDate: nextDueDate || project.dueDate,
        referenceId: referenceId || '',
        notes: notes || '',
        milestoneLabel: milestoneLabel || 'Split Installment',
        paymentMethod: paymentMethod || 'UPI / Bank Transfer',
        recordedByStaffId: recordedByStaffId || null,
        recordedByStaffName: recordedByStaffName || null,
        autoInvoiceGenerated: false,
        invoiceId: invoiceId || null
      }
    });

    // Update invoice balance and status if linked
    if (invoiceId || projectId) {
      try {
        const inv = invoiceId
          ? await prisma.invoice.findUnique({ where: { id: invoiceId } })
          : await prisma.invoice.findFirst({ where: { projectId } });
        if (inv) {
          const invPaid = (inv.paidAmount || 0) + numAmount;
          const invBal = Math.max(0, inv.totalAmount - invPaid);
          await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              paidAmount: invPaid,
              balanceDue: invBal,
              status: invBal === 0 ? 'PAID' : 'PARTIALLY_PAID',
              paidDate: invBal === 0 ? new Date().toISOString().split('T')[0] : inv.paidDate
            }
          });
        }
      } catch (e) {
        console.warn('Could not update invoice in prisma:', e);
      }
    }

    // Update project balances
    await prisma.project.update({
      where: { id: projectId },
      data: {
        collectedAmount: newCollected,
        balanceDue: newBalance,
        status: newBalance === 0 ? 'COMPLETED' : 'IN_PROGRESS',
        dueDate: nextDueDate || project.dueDate
      }
    });

    res.json({ success: true, data: receipt, message: `Payment receipt ${receiptNumber} recorded successfully` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const toggleLateFee = async (req: Request, res: Response) => {
  try {
    const { id, type, assigned } = req.body;
    if (type === 'INVOICE') {
      const inv = await prisma.invoice.update({
        where: { id },
        data: { lateFeeAssigned: Boolean(assigned) }
      });
      return res.json({ success: true, data: inv, message: `Invoice late fee updated` });
    } else {
      const proj = await prisma.project.update({
        where: { id },
        data: { lateFeeAssigned: Boolean(assigned) }
      });
      return res.json({ success: true, data: proj, message: `Project late fee updated` });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
