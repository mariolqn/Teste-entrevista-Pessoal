/**
 * Seed Script for Dashboard Database
 * Creates data matching the exact values from the dashboard screenshot
 * 
 * Target values:
 * - Total Revenue: R$ 41,954.26
 * - Total Expense: R$ 67,740.79
 * - Net Profit: -R$ 25,786.53
 * - Overdue Receivable: R$ 7,500.00
 * - Overdue Payable: R$ 34,853.00
 */

import { PrismaClient, TransactionType, PaymentStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { addDays, subDays, startOfMonth, endOfMonth, addMonths, format } from 'date-fns';

const prisma = new PrismaClient();

// Helper to create decimal values
const decimal = (value: number): Decimal => new Decimal(value);

// Helper to generate CPF (for testing only)
function generateCPF(): string {
  const random = () => Math.floor(Math.random() * 9);
  const nums = Array.from({ length: 9 }, random);
  
  // Calculate first digit
  let sum = nums.reduce((acc, num, idx) => acc + num * (10 - idx), 0);
  let digit1 = 11 - (sum % 11);
  if (digit1 >= 10) digit1 = 0;
  nums.push(digit1);
  
  // Calculate second digit
  sum = nums.reduce((acc, num, idx) => acc + num * (11 - idx), 0);
  let digit2 = 11 - (sum % 11);
  if (digit2 >= 10) digit2 = 0;
  nums.push(digit2);
  
  // Format as XXX.XXX.XXX-XX
  const cpf = nums.join('');
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9, 11)}`;
}

// Helper to generate CNPJ (for testing only)
function generateCNPJ(): string {
  const random = () => Math.floor(Math.random() * 9);
  const nums = Array.from({ length: 12 }, random);
  
  // Calculate first digit
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum = nums.reduce((acc, num, idx) => acc + num * weights1[idx], 0);
  let digit1 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  nums.push(digit1);
  
  // Calculate second digit
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  sum = nums.reduce((acc, num, idx) => acc + num * weights2[idx], 0);
  let digit2 = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  nums.push(digit2);
  
  // Format as XX.XXX.XXX/XXXX-XX
  const cnpj = nums.join('');
  return `${cnpj.slice(0, 2)}.${cnpj.slice(2, 5)}.${cnpj.slice(5, 8)}/${cnpj.slice(8, 12)}-${cnpj.slice(12, 14)}`;
}

async function seed() {
  console.log('🌱 Starting seed process...');
  
  // Clean existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.category.deleteMany();
  
  // Create Categories (Cost Centers)
  console.log('📁 Creating categories...');
  const categories = await Promise.all([
    prisma.category.create({
      data: {
        code: 'TRANS001',
        name: 'SUZANO TRANSPORTE FLORESTAL',
        description: 'Transporte de madeira e produtos florestais',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        code: 'TRANS002',
        name: 'TRANSPORTE DE AGREGADOS ITABIRA MG',
        description: 'Transporte de minério e agregados da região de Itabira',
        isActive: true,
      },
    }),
    prisma.category.create({
      data: {
        code: 'ADM001',
        name: 'ADMINISTRATIVO',
        description: 'Despesas administrativas gerais',
        isActive: true,
      },
    }),
  ]);
  
  const [suzanoCategory, itabiraCategory, adminCategory] = categories;
  
  // Create Products/Services
  console.log('📦 Creating products/services...');
  const products = await Promise.all([
    // Transport services
    prisma.product.create({
      data: {
        code: 'SRV001',
        name: 'Frete Florestal - Caminhão Truck',
        categoryId: suzanoCategory.id,
        unitPrice: decimal(850.00),
        unit: 'FRETE',
      },
    }),
    prisma.product.create({
      data: {
        code: 'SRV002',
        name: 'Frete Florestal - Bitrem',
        categoryId: suzanoCategory.id,
        unitPrice: decimal(1200.00),
        unit: 'FRETE',
      },
    }),
    prisma.product.create({
      data: {
        code: 'SRV003',
        name: 'Transporte de Minério - Basculante',
        categoryId: itabiraCategory.id,
        unitPrice: decimal(950.00),
        unit: 'FRETE',
      },
    }),
    // Expense items
    prisma.product.create({
      data: {
        code: 'EXP001',
        name: 'Combustível Diesel S10',
        categoryId: suzanoCategory.id,
        unitPrice: decimal(5.89),
        unit: 'LITRO',
      },
    }),
    prisma.product.create({
      data: {
        code: 'EXP002',
        name: 'Manutenção Preventiva',
        categoryId: itabiraCategory.id,
        unitPrice: decimal(2500.00),
        unit: 'SERVIÇO',
      },
    }),
    prisma.product.create({
      data: {
        code: 'EXP003',
        name: 'Pneus Caminhão',
        categoryId: suzanoCategory.id,
        unitPrice: decimal(1800.00),
        unit: 'UNIDADE',
      },
    }),
  ]);
  
  const [freightTruck, freightBitrem, miningTransport, diesel, maintenance, tires] = products;
  
  // Create Customers
  console.log('👥 Creating customers...');
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'Suzano Papel e Celulose S.A.',
        document: generateCNPJ(),
        email: 'contato@suzano.com.br',
        phone: '(11) 3503-9000',
        address: 'Av. Brigadeiro Faria Lima, 1355',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01452-919',
        region: 'Sudeste',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Vale S.A. - Unidade Itabira',
        document: generateCNPJ(),
        email: 'itabira@vale.com',
        phone: '(31) 3839-2000',
        address: 'Rodovia BR-120, Km 0',
        city: 'Itabira',
        state: 'MG',
        zipCode: '35900-000',
        region: 'Sudeste',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Posto Ipiranga - Rodovia',
        document: generateCNPJ(),
        email: 'posto@ipiranga.com.br',
        phone: '(11) 4444-5555',
        address: 'Rod. Presidente Dutra, Km 145',
        city: 'Guarulhos',
        state: 'SP',
        zipCode: '07000-000',
        region: 'Sudeste',
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Oficina Mecânica Diesel Plus',
        document: generateCNPJ(),
        email: 'contato@dieselplus.com.br',
        phone: '(31) 3333-2222',
        address: 'Rua Industrial, 500',
        city: 'Contagem',
        state: 'MG',
        zipCode: '32000-000',
        region: 'Sudeste',
      },
    }),
  ]);
  
  const [suzanoCustomer, valeCustomer, postoCustomer, oficinaCustomer] = customers;
  
  // Create Transactions
  console.log('💰 Creating transactions...');
  
  const now = new Date();
  const currentMonth = startOfMonth(now);
  const lastMonth = startOfMonth(subDays(currentMonth, 1));
  const twoMonthsAgo = startOfMonth(subDays(lastMonth, 1));
  
  const transactions = [];
  
  // ========================================
  // REVENUE TRANSACTIONS (Total: R$ 41,954.26)
  // ========================================
  
  // All revenue comes from SUZANO category (R$ 41,954.26)
  
  // Revenue Transaction 1: Suzano - Multiple freight services (PAID)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.REVENUE,
        categoryId: suzanoCategory.id,
        productId: freightTruck.id,
        customerId: suzanoCustomer.id,
        amount: decimal(10200.00),
        quantity: 12,
        unitPrice: decimal(850.00),
        occurredAt: subDays(now, 45),
        dueDate: subDays(now, 15),
        paidAt: subDays(now, 20),
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'NF-2024-0001',
        description: 'Frete de madeira - Região de Mucuri',
      },
    })
  );
  
  // Revenue Transaction 2: Suzano - Bitrem services (PAID)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.REVENUE,
        categoryId: suzanoCategory.id,
        productId: freightBitrem.id,
        customerId: suzanoCustomer.id,
        amount: decimal(12000.00),
        quantity: 10,
        unitPrice: decimal(1200.00),
        occurredAt: subDays(now, 38),
        dueDate: subDays(now, 8),
        paidAt: subDays(now, 10),
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'NF-2024-0002',
        description: 'Frete de celulose - Terminal portuário',
      },
    })
  );
  
  // Revenue Transaction 3: Suzano - Regular services (OVERDUE - R$ 7,500.00)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.REVENUE,
        categoryId: suzanoCategory.id,
        productId: freightTruck.id,
        customerId: suzanoCustomer.id,
        amount: decimal(7500.00),
        quantity: 9,
        unitPrice: decimal(833.33),
        occurredAt: subDays(now, 60),
        dueDate: subDays(now, 30),
        paidAt: null,
        paymentStatus: PaymentStatus.OVERDUE,
        invoiceNumber: 'NF-2024-0003',
        description: 'Frete de madeira - Região Sul da Bahia',
      },
    })
  );
  
  // Revenue Transaction 4: Suzano - Recent services (PAID)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.REVENUE,
        categoryId: suzanoCategory.id,
        productId: freightBitrem.id,
        customerId: suzanoCustomer.id,
        amount: decimal(12254.26),
        quantity: 10,
        unitPrice: decimal(1225.43),
        occurredAt: subDays(now, 25),
        dueDate: addDays(now, 5),
        paidAt: subDays(now, 5),
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'NF-2024-0004',
        description: 'Frete especial - Carga projeto',
      },
    })
  );
  
  // ========================================
  // EXPENSE TRANSACTIONS (Total: R$ 67,740.79)
  // ========================================
  
  // SUZANO Category Expenses (R$ 53,549.47)
  
  // Expense 1: Diesel fuel (PAID)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: suzanoCategory.id,
        productId: diesel.id,
        customerId: postoCustomer.id,
        amount: decimal(11780.00), // 2000L x 5.89
        quantity: 2000,
        unitPrice: decimal(5.89),
        occurredAt: subDays(now, 40),
        dueDate: subDays(now, 10),
        paidAt: subDays(now, 12),
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'NF-POSTO-0145',
        description: 'Abastecimento mensal - Frota Suzano',
      },
    })
  );
  
  // Expense 2: Tires (OVERDUE - Part of R$ 34,853.00)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: suzanoCategory.id,
        productId: tires.id,
        customerId: oficinaCustomer.id,
        amount: decimal(21600.00), // 12 pneus x 1800
        quantity: 12,
        unitPrice: decimal(1800.00),
        occurredAt: subDays(now, 75),
        dueDate: subDays(now, 45),
        paidAt: null,
        paymentStatus: PaymentStatus.OVERDUE,
        invoiceNumber: 'OS-2024-089',
        description: 'Troca de pneus - Frota completa',
      },
    })
  );
  
  // Expense 3: More diesel (PAID)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: suzanoCategory.id,
        productId: diesel.id,
        customerId: postoCustomer.id,
        amount: decimal(8835.00), // 1500L x 5.89
        quantity: 1500,
        unitPrice: decimal(5.89),
        occurredAt: subDays(now, 20),
        dueDate: addDays(now, 10),
        paidAt: subDays(now, 2),
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'NF-POSTO-0178',
        description: 'Abastecimento quinzenal',
      },
    })
  );
  
  // Expense 4: Operational costs (PAID)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: suzanoCategory.id,
        productId: null,
        customerId: null,
        amount: decimal(5187.00),
        quantity: 1,
        unitPrice: decimal(5187.00),
        occurredAt: subDays(now, 15),
        dueDate: addDays(now, 15),
        paidAt: subDays(now, 1),
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'DESP-2024-112',
        description: 'Despesas operacionais diversas - Pedágios, taxas',
      },
    })
  );
  
  // Expense 5: More operational (PAID) - adjusted to match exact totals
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: suzanoCategory.id,
        productId: null,
        customerId: null,
        amount: decimal(334.47),
        quantity: 1,
        unitPrice: decimal(334.47),
        occurredAt: subDays(now, 30),
        dueDate: now,
        paidAt: subDays(now, 5),
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'DESP-2024-098',
        description: 'Manutenção corretiva - Caminhão placa XXX-1234',
      },
    })
  );
  
  // ITABIRA Category Expenses (R$ 14,191.32)
  
  // Expense 6: Maintenance (OVERDUE - Part of R$ 34,853.00)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: itabiraCategory.id,
        productId: maintenance.id,
        customerId: oficinaCustomer.id,
        amount: decimal(7500.00), // 3 services x 2500
        quantity: 3,
        unitPrice: decimal(2500.00),
        occurredAt: subDays(now, 90),
        dueDate: subDays(now, 60),
        paidAt: null,
        paymentStatus: PaymentStatus.OVERDUE,
        invoiceNumber: 'OS-2024-045',
        description: 'Manutenção preventiva - Frota Itabira',
      },
    })
  );
  
  // Expense 7: More maintenance (OVERDUE - Completes R$ 34,853.00)
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: itabiraCategory.id,
        productId: maintenance.id,
        customerId: oficinaCustomer.id,
        amount: decimal(5753.00),
        quantity: 2,
        unitPrice: decimal(2876.50),
        occurredAt: subDays(now, 85),
        dueDate: subDays(now, 55),
        paidAt: null,
        paymentStatus: PaymentStatus.OVERDUE,
        invoiceNumber: 'OS-2024-067',
        description: 'Manutenção corretiva emergencial',
      },
    })
  );
  
  // Expense 8: Operational Itabira (PAID) - Completes Itabira expenses
  transactions.push(
    await prisma.transaction.create({
      data: {
        type: TransactionType.EXPENSE,
        categoryId: itabiraCategory.id,
        productId: null,
        customerId: null,
        amount: decimal(938.32),
        quantity: 1,
        unitPrice: decimal(938.32),
        occurredAt: subDays(now, 10),
        dueDate: addDays(now, 20),
        paidAt: now,
        paymentStatus: PaymentStatus.PAID,
        invoiceNumber: 'DESP-2024-145',
        description: 'Despesas administrativas - Documentação veículos',
      },
    })
  );
  
  // ========================================
  // Create transactions for chart visualization (past 12 months)
  // ========================================
  
  // Generate historical data for the line chart with realistic patterns
  const historicalData = [
    // 11 months ago
    { month: 11, revenue: 8500, expense: 17000 },
    // 10 months ago  
    { month: 10, revenue: 0, expense: 9500 },
    // 9 months ago
    { month: 9, revenue: 17000, expense: 8500 },
    // 8 months ago
    { month: 8, revenue: 0, expense: 15000 },
    // 7 months ago
    { month: 7, revenue: 8500, expense: 0 },
    // 6 months ago
    { month: 6, revenue: 0, expense: 7000 },
    // 5 months ago
    { month: 5, revenue: 0, expense: 8500 },
    // 4 months ago
    { month: 4, revenue: 17000, expense: 0 },
    // 3 months ago
    { month: 3, revenue: 0, expense: 8500 },
    // 2 months ago
    { month: 2, revenue: 8500, expense: 0 },
    // 1 month ago
    { month: 1, revenue: 0, expense: 6800 },
  ];
  
  for (const data of historicalData) {
    const monthDate = addMonths(currentMonth, -data.month);
    
    // Historical revenue
    if (data.revenue > 0) {
      transactions.push(
        await prisma.transaction.create({
          data: {
            type: TransactionType.REVENUE,
            categoryId: data.month % 2 === 0 ? suzanoCategory.id : itabiraCategory.id,
            productId: data.month % 3 === 0 ? freightTruck.id : freightBitrem.id,
            customerId: data.month % 2 === 0 ? suzanoCustomer.id : valeCustomer.id,
            amount: decimal(data.revenue),
            quantity: Math.floor(data.revenue / 1000),
            unitPrice: decimal(1000),
            occurredAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 15),
            dueDate: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 15),
            paidAt: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 10),
            paymentStatus: PaymentStatus.PAID,
            invoiceNumber: `NF-${monthDate.getFullYear()}-${String(data.month).padStart(2, '0')}01`,
            description: `Serviços prestados - ${format(monthDate, 'MMMM yyyy')}`,
          },
        })
      );
    }
    
    // Historical expenses
    if (data.expense > 0) {
      transactions.push(
        await prisma.transaction.create({
          data: {
            type: TransactionType.EXPENSE,
            categoryId: data.month % 2 === 0 ? suzanoCategory.id : itabiraCategory.id,
            productId: data.month % 3 === 0 ? diesel.id : maintenance.id,
            customerId: data.month % 2 === 0 ? postoCustomer.id : oficinaCustomer.id,
            amount: decimal(data.expense),
            quantity: Math.floor(data.expense / 100),
            unitPrice: decimal(100),
            occurredAt: new Date(monthDate.getFullYear(), monthDate.getMonth(), 20),
            dueDate: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 20),
            paidAt: new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 18),
            paymentStatus: PaymentStatus.PAID,
            invoiceNumber: `EXP-${monthDate.getFullYear()}-${String(data.month).padStart(2, '0')}01`,
            description: `Despesas operacionais - ${format(monthDate, 'MMMM yyyy')}`,
          },
        })
      );
    }
  }
  
  console.log(`✅ Created ${transactions.length} transactions`);
  
  // Verify the totals
  console.log('\n📊 Verifying totals...');
  
  const totals = await prisma.transaction.aggregate({
    where: {
      occurredAt: {
        gte: subDays(now, 100), // Last ~3 months for current data
      },
    },
    _sum: {
      amount: true,
    },
    _count: true,
  });
  
  const revenueTotal = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.REVENUE,
      occurredAt: {
        gte: subDays(now, 100),
      },
    },
    _sum: {
      amount: true,
    },
  });
  
  const expenseTotal = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.EXPENSE,
      occurredAt: {
        gte: subDays(now, 100),
      },
    },
    _sum: {
      amount: true,
    },
  });
  
  const overdueReceivable = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.REVENUE,
      paymentStatus: PaymentStatus.OVERDUE,
    },
    _sum: {
      amount: true,
    },
  });
  
  const overduePayable = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.EXPENSE,
      paymentStatus: PaymentStatus.OVERDUE,
    },
    _sum: {
      amount: true,
    },
  });
  
  console.log('💰 Total Revenue:', revenueTotal._sum.amount?.toString());
  console.log('💸 Total Expense:', expenseTotal._sum.amount?.toString());
  console.log('📈 Net Profit:', 
    Number(revenueTotal._sum.amount || 0) - Number(expenseTotal._sum.amount || 0)
  );
  console.log('📊 Overdue Receivable:', overdueReceivable._sum.amount?.toString());
  console.log('📊 Overdue Payable:', overduePayable._sum.amount?.toString());
  
  // Category breakdown
  const suzanoRevenue = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.REVENUE,
      categoryId: suzanoCategory.id,
      occurredAt: {
        gte: subDays(now, 100),
      },
    },
    _sum: {
      amount: true,
    },
  });
  
  const suzanoExpense = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.EXPENSE,
      categoryId: suzanoCategory.id,
      occurredAt: {
        gte: subDays(now, 100),
      },
    },
    _sum: {
      amount: true,
    },
  });
  
  const itabiraRevenue = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.REVENUE,
      categoryId: itabiraCategory.id,
      occurredAt: {
        gte: subDays(now, 100),
      },
    },
    _sum: {
      amount: true,
    },
  });
  
  const itabiraExpense = await prisma.transaction.aggregate({
    where: {
      type: TransactionType.EXPENSE,
      categoryId: itabiraCategory.id,
      occurredAt: {
        gte: subDays(now, 100),
      },
    },
    _sum: {
      amount: true,
    },
  });
  
  console.log('\n📂 Category Breakdown:');
  console.log('SUZANO TRANSPORTE FLORESTAL:');
  console.log('  Revenue:', suzanoRevenue._sum.amount?.toString());
  console.log('  Expense:', suzanoExpense._sum.amount?.toString());
  console.log('  Result:', 
    Number(suzanoRevenue._sum.amount || 0) - Number(suzanoExpense._sum.amount || 0)
  );
  
  console.log('TRANSPORTE DE AGREGADOS ITABIRA MG:');
  console.log('  Revenue:', itabiraRevenue._sum.amount?.toString());
  console.log('  Expense:', itabiraExpense._sum.amount?.toString());
  console.log('  Result:', 
    Number(itabiraRevenue._sum.amount || 0) - Number(itabiraExpense._sum.amount || 0)
  );
  
  console.log('\n✅ Seed completed successfully!');
}

// Run the seed
seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
