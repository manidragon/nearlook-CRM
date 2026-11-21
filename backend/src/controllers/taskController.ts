import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { assignedStaff: true, project: true, client: true, subTasks: true },
      orderBy: { order: 'asc' }
    });
    res.json({ success: true, data: tasks });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createTask = async (req: Request, res: Response) => {
  try {
    const { title, description, priority, serviceCategory, assignedStaffId, projectId, clientId, dueDate } = req.body;
    if (!title) return res.status(400).json({ success: false, error: 'Task title is required' });

    const task = await prisma.task.create({
      data: {
        title,
        description: description || '',
        priority: priority || 'MEDIUM',
        serviceCategory: serviceCategory || 'WEB_DEV',
        assignedStaffId: assignedStaffId || null,
        projectId: projectId || null,
        clientId: clientId || null,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: { assignedStaff: true, project: true }
    });
    res.json({ success: true, data: task });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const updated = await prisma.task.update({
      where: { id },
      data: req.body,
      include: { assignedStaff: true }
    });
    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    await prisma.task.delete({ where: { id } });
    res.json({ success: true, message: 'Task deleted' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
