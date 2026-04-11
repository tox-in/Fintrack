import {
  PrismaClient,
  WalletType,
  TransactionCategory,
  FlowType,
} from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database ... \n");

  const bank = await prisma.wallet.upsert({
    where: { id: "wallet-bank-001" },
    update: {},
    create: {
      id: "wallet-bank-001",
      name: "BK Account",
      type: WalletType.BANK,
      balance: 450000,
      currency: "RWF",
    },
  });

  const cash = await prisma.wallet.upsert({
    where: { id: "wallet-cash-001" },
    update: {},
    create: {
      id: "wallet-cash-001",
      name: "Physical Cash",
      type: WalletType.CASH,
      balance: 25000,
      currency: "RWF",
      description: "Cash in wallet/hand-held",
    },
  });

  const momo = await prisma.wallet.upsert({
    where: { id: "wallet-momo-001" },
    update: {},
    create: {
      id: "wallet-momo-001",
      name: "MTN MoMo",
      type: WalletType.MOMO,
      balance: 80000,
      currency: "RWF",
      description: "MTN Mobile Money",
    },
  });

  const receivable = await prisma.wallet.upsert({
    where: { id: "wallet-recv-001" },
    update: {},
    create: {
      id: "wallet-recv-001",
      name: "Celia owes me",
      type: WalletType.RECEIVABLE,
      balance: 30000,
      currency: "RWF",
      description: "Loan to Celia from last month",
    },
  });



  const card = await prisma.transportCard.upsert({
    where: { id: "card-001" },
    update: {},
    create: {
      id: "card-001",
      name: "Tap & Go Card",
      balance: 1000,
    },
  });

  console.log(`✅ Transport card seeded: ${card.name}`);

  // ── Contract ─────────────────────────────────────────────────
  const contract = await prisma.contract.upsert({
    where: { id: "contract-001" },
    update: {},
    create: {
      id: "contract-001",
      jobTitle: "Software Developer Intern",
      employer: "Intouch Communications Ltd",
      salaryAmount: 15000,
      currency: "RWF",
      startDate: new Date("2025-01-01"),
      endDate: new Date("2025-12-31"),
      isActive: true,
      note: "Paid internship, renewable",
    },
  });

  console.log(`✅ Contract seeded: ${contract.jobTitle} @ ${contract.employer}`);


  const exp1 = await prisma.expense.create({
    data: {
      title: "Biscuits",
      amount: 500,
      category: TransactionCategory.FOOD,
      walletId: cash.id,
      note: "Sharing",
      spentAt: new Date(),
    },
  });

  // Deduct from wallet
  await prisma.wallet.update({
    where: { id: cash.id },
    data: { balance: { decrement: 500 } },
  });

  await prisma.cashFlow.create({
    data: {
      type: FlowType.OUTFLOW,
      amount: 500,
      category: TransactionCategory.FOOD,
      description: exp1.title,
      walletId: cash.id,
      expenseId: exp1.id,
    },
  });

  console.log(`✅ Sample expense seeded: ${exp1.title}`);

  await prisma.transportUsage.create({
    data: {
      cardId: card.id,
      amount: 356,
      route: "Kimironko → Musave",
      note: "Evening commute",
    },
  });

  await prisma.transportCard.update({
    where: { id: card.id },
    data: { balance: { decrement: 500 } },
  });

  console.log(`✅ Sample transport usage seeded`);


  await prisma.wastedMoney.create({
    data: {
      amount: 300,
      reason: "The transport rechargers deducted my money",
      keyTakeaway: "Add less amount on the card at a time",
    },
  });

  console.log(`✅ Sample wasted money entry seeded`);


  const moneyFlow = await prisma.cashFlow.create({
    data: {
      type: FlowType.INFLOW,
      amount: 195,
      category: TransactionCategory.REBATE,
      description: "Kimironko -> Sonatube",
      walletId: bank.id,
      occurredAt: new Date("2025-03-01"),
    },
  });

  await prisma.wallet.update({
    where: { id: bank.id },
    data: { balance: { increment: 600000 } },
  });

  console.log(`✅ Sample Rebate inflow seeded: ${salaryFlow.description}`);

  console.log("\n🎉 Seeding complete!");

}
