import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany({
      include: { projects: true, invoices: true, receipts: true },
      orderBy: { businessName: 'asc' }
    });
    res.json({ success: true, data: clients });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createClient = async (req: Request, res: Response) => {
  try {
    const { businessName, contactName, whatsappNumber, email, website, clientType, monthlyRetainerAmount } = req.body;
    if (!businessName || !contactName || !whatsappNumber) {
      return res.status(400).json({ success: false, error: 'Business name, contact name and phone are required' });
    }

    const client = await prisma.client.create({
      data: {
        businessName,
        contactName,
        whatsappNumber,
        email: email || '',
        website: website || '',
        clientType: clientType || 'ONE_TIME_PROJECT',
        monthlyRetainerAmount: Number(monthlyRetainerAmount) || 0
      }
    });
    res.json({ success: true, data: client });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.client.update({
      where: { id },
      data: req.body
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client) return res.status(404).json({ success: false, error: 'Client not found' });

    await prisma.recycleBinItem.create({
      data: {
        originalId: client.id,
        entityType: 'CLIENT',
        title: `${client.businessName} (${client.contactName})`,
        subtitle: `Phone: ${client.whatsappNumber}`,
        dataJson: JSON.stringify(client)
      }
    });

    await prisma.client.delete({ where: { id } });
    res.json({ success: true, message: 'Client moved to recycle bin' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
