import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getLeads = async (req: Request, res: Response) => {
  try {
    const leads = await prisma.lead.findMany({
      include: { assignedManager: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: leads });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getLeadById = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const lead = await prisma.lead.findUnique({
      where: { id },
      include: { assignedManager: true, quotations: true }
    });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createLead = async (req: Request, res: Response) => {
  try {
    const {
      leadName,
      businessName,
      businessCategory,
      address,
      city,
      whatsappNumber,
      email,
      serviceType,
      servicesInterested,
      leadStage,
      source,
      referrerName,
      estimatedDealValue,
      leadGeneratedDate,
      contactedDate,
      nextFollowUpDate,
      followUpNotes,
      notes,
      assignedTeam,
      assignedManagerId
    } = req.body;

    if (!leadName || !businessName || !whatsappNumber) {
      return res.status(400).json({ success: false, error: 'Lead name, business name and WhatsApp number are required' });
    }

    const svcs = Array.isArray(servicesInterested) && servicesInterested.length > 0
      ? servicesInterested
      : [serviceType || 'WEB_DEV'];

    const newLead = await prisma.lead.create({
      data: {
        leadName,
        businessName,
        businessCategory: businessCategory || 'Retail & E-Commerce',
        address: address || '',
        city: city || '',
        whatsappNumber,
        email: email || '',
        serviceType: serviceType || svcs[0],
        servicesInterestedJson: JSON.stringify(svcs),
        leadStage: leadStage || 'NEW',
        source: source || 'WORD_OF_MOUTH',
        referrerName: referrerName || '',
        estimatedDealValue: Number(estimatedDealValue) || 0,
        leadGeneratedDate: leadGeneratedDate || new Date().toISOString().split('T')[0],
        contactedDate: contactedDate || '',
        nextFollowUpDate: nextFollowUpDate || '',
        followUpNotes: followUpNotes || '',
        notes: notes || '',
        assignedTeam: assignedTeam || 'WEB_DEVELOPMENT',
        assignedManagerId: assignedManagerId || null
      },
      include: { assignedManager: true }
    });

    res.json({ success: true, data: newLead });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateLead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const body = req.body;

    const data: any = { ...body };
    if (body.servicesInterested) {
      data.servicesInterestedJson = JSON.stringify(body.servicesInterested);
      delete data.servicesInterested;
    }
    if (body.estimatedDealValue !== undefined) {
      data.estimatedDealValue = Number(body.estimatedDealValue) || 0;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data,
      include: { assignedManager: true }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteLead = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) return res.status(404).json({ success: false, error: 'Lead not found' });

    // Move to Recycle Bin before deleting
    await prisma.recycleBinItem.create({
      data: {
        originalId: lead.id,
        entityType: 'LEAD',
        title: `${lead.businessName} (${lead.leadName})`,
        subtitle: `${lead.serviceType} • Value: ₹${lead.estimatedDealValue}`,
        dataJson: JSON.stringify(lead)
      }
    });

    await prisma.lead.delete({ where: { id } });
    res.json({ success: true, message: 'Lead moved to recycle bin' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
