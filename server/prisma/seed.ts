import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Seeding coin packages...');

  const packages = [
    { name: '5 Koin', coinAmount: 5, price: 50000 },
    { name: '10 Koin', coinAmount: 10, price: 95000 },
    { name: '20 Koin', coinAmount: 20, price: 180000 },
    { name: '50 Koin', coinAmount: 50, price: 450000 },
    { name: '100 Koin', coinAmount: 100, price: 850000 },
  ];

  for (const pkg of packages) {
    await prisma.coinPackage.upsert({
      where: { id: pkg.name }, // This is a placeholder, usually use a unique field or check existence
      update: {},
      create: {
        name: pkg.name,
        coinAmount: pkg.coinAmount,
        price: pkg.price,
      },
    });
  }

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
