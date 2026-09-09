import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@flowerqatar.com';
  const plainPassword = 'admin123';

  // Check if admin already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log(`Admin user ${email} already exists. Updating password and role to ADMIN...`);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);
    
    await prisma.user.update({
      where: { email },
      data: { 
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      }
    });
    console.log('Admin account successfully reset and upgraded!');
    return;
  }

  // Create new admin
  console.log('Creating new admin user...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(plainPassword, salt);

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

  console.log(`\n✅ Successfully created Admin Account!`);
  console.log(`Email: ${email}`);
  console.log(`Password: ${plainPassword}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
