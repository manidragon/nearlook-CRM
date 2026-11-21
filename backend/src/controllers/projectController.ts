import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getProjects = async (req: Request, res: Response) => {
  try {
    const projects = await prisma.project.findMany({
      include: { client: true, tasks: true, receipts: true, invoices: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, data: projects });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createProject = async (req: Request, res: Response) => {
  try {
    const {
      clientId,
      title,
      description,
      projectType,
      totalValue,
      advanceRequired,
      dueDate,
      budget
    } = req.body;

    if (!clientId || !title) {
      return res.status(400).json({ success: false, error: 'Client and project title are required' });
    }

    const val = Number(totalValue) || 0;
    const adv = Number(advanceRequired) || Math.round(val * 0.5);

    const project = await prisma.project.create({
      data: {
        clientId,
        title,
        description: description || '',
        projectType: projectType || 'ONE_TIME_PROJECT',
        status: 'PENDING_ADVANCE',
        isAdvanceReceived: false,
        advanceRequired: adv,
        totalValue: val,
        billedAmount: adv,
        collectedAmount: 0,
        balanceDue: val,
        dueDate: dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        budget: Number(budget) || val
      },
      include: { client: true }
    });

    res.json({ success: true, data: project });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const body = req.body;
    const updated = await prisma.project.update({
      where: { id },
      data: body,
      include: { client: true }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) return res.status(404).json({ success: false, error: 'Project not found' });

    await prisma.recycleBinItem.create({
      data: {
        originalId: project.id,
        entityType: 'PROJECT',
        title: project.title,
        subtitle: `Contract Value: ₹${project.totalValue}`,
        dataJson: JSON.stringify(project)
      }
    });

    await prisma.project.delete({ where: { id } });
    res.json({ success: true, message: 'Project moved to recycle bin' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
