import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const characters = [
    { name: "Grom", role: "tank", hp: 10000, baseDamage: 1500, level: 1 },
    { name: "Lyra", role: "mago", hp: 8000, baseDamage: 2300, level: 1 },
    { name: "Kael", role: "adc", hp: 7000, baseDamage: 2500, level: 1 },
    { name: "Mira", role: "suporte", hp: 7500, baseDamage: 1200, level: 1 },
    { name: "Ryn", role: "assassino", hp: 6000, baseDamage: 2800, level: 1 },
    { name: "Shen", role: "tank", hp: 11000, baseDamage: 1400, level: 1 },
    { name: "Vex", role: "evasivo", hp: 6500, baseDamage: 2200, level: 1 }
  ];

  for (const c of characters) {
    await prisma.character.create({ data: c });
  }

  console.log("✅ 7 personagens criados com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
