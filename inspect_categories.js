const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const categories = await prisma.category.findMany();
  console.log("Categories:", categories);
  
  const subcategories = await prisma.subcategory.findMany({
    where: { category: { name: 'SHOP_BY_OCCASION' } }
  });
  console.log("Subcategories for SHOP_BY_OCCASION:", subcategories);
}

main().catch(console.error).finally(() => prisma.$disconnect());
