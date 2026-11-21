import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const appointments = await prisma.appointment.findMany({
      orderBy: { date: 'asc' }
    });
    res.json({ success: true, data: appointments });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createAppointment = async (req: Request, res: Response) => {
  try {
    const { title, clientName, clientPhone, date, startTime, endTime, type, status, notes } = req.body;
    if (!title || !clientName || !date) {
      return res.status(400).json({ success: false, error: 'Title, client name, and date are required' });
    }

    const appointment = await prisma.appointment.create({
      data: {
        title,
        clientName,
        clientPhone: clientPhone || '',
        date,
        startTime: startTime || '10:00 AM',
        endTime: endTime || '11:00 AM',
        type: type || 'CONSULTATION',
        status: status || 'CONFIRMED',
        notes: notes || ''
      }
    });
    res.json({ success: true, data: appointment });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
