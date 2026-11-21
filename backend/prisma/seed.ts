import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('> Seeding Nearlook Agency CRM SQLite database...');

  // 1. Seed Company Profile
  const company = await prisma.company.upsert({
    where: { id: 'company-primary' },
    update: {},
    create: {
      id: 'company-primary',
      name: 'Nearlook Mart Pvt Ltd',
      brandName: 'Nearlook Agency',
      email: 'contact@nearlook.com',
      phone: '+91 98765 43210',
      address: '#142 MG Road, Bengaluru, Karnataka, India',
      gstin: '29AAAAA0000A1Z5',
      currencySymbol: '₹',
      lateFeePercent: 2.0
    }
  });

  // 2. Seed Default Staff
  const adminStaff = await prisma.staff.upsert({
    where: { email: 'rachel@nearlook.com' },
    update: {},
    create: {
      userId: 'STF-101',
      name: 'Rachel Adams',
      email: 'rachel@nearlook.com',
      phone: '+919876543201',
      role: 'ADMIN',
      team: 'MANAGEMENT',
      monthlySalary: 120000,
      hourlyRate: 3500,
      address: 'Nearlook Tower, MG Road, Bengaluru'
    }
  });

  const devStaff = await prisma.staff.upsert({
    where: { email: 'alex@nearlook.com' },
    update: {},
    create: {
      userId: 'STF-102',
      name: 'Alex Rivera',
      email: 'alex@nearlook.com',
      phone: '+919876543202',
      role: 'PROJECT_MANAGER',
      team: 'MANAGEMENT',
      monthlySalary: 85000,
      hourlyRate: 2200,
      address: 'Indiranagar 100ft Rd, Bengaluru'
    }
  });

  console.log(`> Seeded company: ${company.name}`);
  console.log(`> Seeded staff: ${adminStaff.name}, ${devStaff.name}`);
  console.log('> Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
