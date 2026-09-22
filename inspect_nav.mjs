import prismaClient from '@prisma/client';

const { PrismaClient } = prismaClient;
const prisma = new PrismaClient();

const CATEGORY_ORDER = [
  'GIFT_COMBOS',
  'SHOP_BY_OCCASION',
  'FLOWER',
  'BLUSHING_BLOOMS',
];

const CATEGORY_FEATURES = {
  GIFT_COMBOS: { image: false, hoverColor: false, explore: false },
  SHOP_BY_OCCASION: { image: false, hoverColor: false, explore: false },
  FLOWER: { image: true, hoverColor: true, explore: true },
  BLUSHING_BLOOMS: { image: false, hoverColor: false, explore: false },
};

const NAV_FLAG_CATEGORIES = CATEGORY_ORDER.filter((c) => CATEGORY_FEATURES[c].explore);
const NAV_VISIBLE = {
  isActive: true,
  OR: [{ showInNavigation: true }, { category: { name: { notIn: NAV_FLAG_CATEGORIES } } }],
};

async function main() {
  const rows = await prisma.subcategory.findMany({
    where: { ...NAV_VISIBLE, category: { isActive: true } },
    select: {
      id: true,
      name: true,
      hoverImage: true,
      isCatchAll: true,
      category: { select: { name: true } },
    },
  });
  console.log("NAV_VISIBLE rows:", rows);
}

main().catch(console.error).finally(() => prisma.$disconnect());
