import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Seeding coin packages...');

  // Clear existing packages first
  await prisma.coinPackage.deleteMany({});

  const packages = [
    { name: 'Paket Starter', coinAmount: 5, price: 50000 },
    { name: 'Paket Basic', coinAmount: 10, price: 95000 },
    { name: 'Paket Pro', coinAmount: 20, price: 180000 },
    { name: 'Paket Business', coinAmount: 50, price: 450000 },
    { name: 'Paket Enterprise', coinAmount: 100, price: 850000 },
  ];

  await prisma.coinPackage.createMany({
    data: packages.map((pkg) => ({
      name: pkg.name,
      coinAmount: pkg.coinAmount,
      price: pkg.price,
      isActive: true,
    })),
  });

  const created = await prisma.coinPackage.findMany();
  console.log('Coin packages created:', created.length);
  created.forEach((p) =>
    console.log(`  - ${p.name}: ${p.coinAmount} koin @ Rp${p.price.toLocaleString('id-ID')}`)
  );

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
