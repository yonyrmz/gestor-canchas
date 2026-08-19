import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL!, noPrepare: true } as never);
const prisma = new PrismaClient({ adapter });

async function seed() {
  const existing = await prisma.usuario.findUnique({ where: { email: 'admin@gestor.com' } });
  if (existing) {
    console.log('Superadmin ya existe: admin@gestor.com');
    await prisma.$disconnect();
    process.exit(0);
  }

  const hashed = await bcrypt.hash('admin123', 10);
  await prisma.usuario.create({
    data: {
      nombre: 'Super Admin',
      email: 'admin@gestor.com',
      password: hashed,
      rol: 'superadmin',
    },
  });

  console.log('Superadmin creado exitosamente:');
  console.log('  Email:    admin@gestor.com');
  console.log('  Password: admin123');
  await prisma.$disconnect();
  process.exit(0);
}

seed().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
