import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getStaff = async (req: Request, res: Response) => {
  try {
    const staff = await prisma.staff.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: staff });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createStaff = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, role, team, monthlySalary, hourlyRate, address } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ success: false, error: 'Name, email and phone are required' });
    }

    const count = await prisma.staff.count();
    const userId = `STF-${100 + count + 1}`;

    const staffMember = await prisma.staff.create({
      data: {
        userId,
        name,
        email,
        phone,
        role: role || 'DEVELOPER',
        team: team || 'WEB_DEVELOPMENT',
        monthlySalary: Number(monthlySalary) || 45000,
        hourlyRate: Number(hourlyRate) || 1500,
        address: address || ''
      }
    });
    res.json({ success: true, data: staffMember });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
