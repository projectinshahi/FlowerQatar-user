import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Usage: ADMIN_PASSWORD='…' npx tsx scripts/seed-admin.ts [email]
async function main() {
  const email = (process.argv[2] ?? 'admin@flowerqatar.com').toLowerCase().trim();
  const plainPassword = process.env.ADMIN_PASSWORD;
  if (!plainPassword || plainPassword.length < 12) {
    throw new Error('Set ADMIN_PASSWORD (at least 12 characters) in the environment.');
  }
  const hashedPassword = await bcrypt.hash(plainPassword, 12);

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`Admin user ${email} already exists. Updating password and role to ADMIN...`);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword, role: 'ADMIN', isActive: true },
    });
    console.log('Admin account successfully reset and upgraded!');
    return;
  }

  console.log('Creating new admin user...');
  await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
    },
  });
  console.log(`Created admin account ${email}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
