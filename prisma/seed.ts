import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const plans = [
    { planType: 'SILVER' as const, featurePoints: 1100, price: '1000.00', validityYears: 1, validityMonths: 0, validityDays: 0, isActive: true },
    { planType: 'GOLD' as const, featurePoints: 2200, price: '2000.00', validityYears: 1, validityMonths: 0, validityDays: 0, isActive: true },
    { planType: 'PLATINUM' as const, featurePoints: 3300, price: '3000.00', validityYears: 1, validityMonths: 0, validityDays: 0, isActive: true },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { planType: plan.planType },
      update: { featurePoints: plan.featurePoints, price: plan.price },
      create: plan,
    });
  }

  console.log('✓ Subscription plans seeded');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
