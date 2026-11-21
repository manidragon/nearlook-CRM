import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getQuotations = async (req: Request, res: Response) => {
  try {
    const quotations = await prisma.quotation.findMany({
      include: { lead: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: quotations });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createQuotation = async (req: Request, res: Response) => {
  try {
    const {
      leadId,
      clientBusiness,
      clientContact,
      clientPhone,
      clientEmail,
      lineItems,
      gstType,
      paymentTerms,
      lateFeeTerms
    } = req.body;

    const count = await prisma.quotation.count();
    const quotationNumber = `Quotation - ${String(count + 1).padStart(2, '0')}`;

    const items = Array.isArray(lineItems) ? lineItems : [];
    const subtotal = items.reduce((sum: number, item: any) => {
      const q = Number(item.quantity) || 1;
      const u = Number(item.unitPrice) || 0;
      return sum + (q * u);
    }, 0);

    const isAdditional = gstType === 'ADDITIONAL_18';
    const isInclusive = gstType === 'INCLUSIVE_18';
    let taxAmount = 0;
    let totalAmount = subtotal;

    if (isAdditional) {
      taxAmount = Math.round(subtotal * 0.18);
      totalAmount = subtotal + taxAmount;
    } else if (isInclusive) {
      taxAmount = Math.round(subtotal - (subtotal / 1.18));
      totalAmount = subtotal;
    }

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        leadId: leadId || null,
        clientBusiness: clientBusiness || 'Client Enterprise',
        clientContact: clientContact || 'Authorized Representative',
        clientPhone: clientPhone || '+91',
        clientEmail: clientEmail || '',
        lineItemsJson: JSON.stringify(items),
        subtotal,
        gstType: gstType || 'ADDITIONAL_18',
        taxAmount,
        totalAmount,
        internalTaxCalculated: taxAmount,
        paymentTerms: paymentTerms || '50% Advance / 30% Review / 20% Completion',
        lateFeeTerms: lateFeeTerms || 'Payments delayed beyond the due date will incur a 2% late penalty fee per week.',
        status: 'SENT',
        sentViaWhatsApp: true
      }
    });

    res.json({ success: true, data: quotation });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteQuotation = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const q = await prisma.quotation.findUnique({ where: { id } });
    if (!q) return res.status(404).json({ success: false, error: 'Quotation not found' });

    await prisma.recycleBinItem.create({
      data: {
        originalId: q.id,
        entityType: 'QUOTATION',
        title: `${q.quotationNumber} (${q.clientBusiness})`,
        subtitle: `Total: ₹${q.totalAmount}`,
        dataJson: JSON.stringify(q)
      }
    });

    await prisma.quotation.delete({ where: { id } });
    res.json({ success: true, message: 'Quotation moved to recycle bin' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
