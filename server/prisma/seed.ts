import prisma from '../src/config/prisma.js';

async function main() {
  console.log('Seeding coin packages...');

  // Clear existing packages first
  await prisma.coinPackage.deleteMany({});

  const packages = [
    { name: 'Paket 1 Koin', coinAmount: 1, price: 10000 },
    { name: 'Paket 5 Koin', coinAmount: 5, price: 50000 },
    { name: 'Paket 10 Koin', coinAmount: 10, price: 100000 },
    { name: 'Paket 20 Koin', coinAmount: 20, price: 200000 },
    { name: 'Paket 50 Koin', coinAmount: 50, price: 500000 },
    { name: 'Paket 100 Koin', coinAmount: 100, price: 1000000 },
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
