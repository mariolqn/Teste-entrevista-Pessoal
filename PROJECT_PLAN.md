# 📊 Dynamic Dashboard Project Plan - Tech Lead Test

## Executive Summary
Build a production-ready financial dashboard with dynamic REST API backend (Node.js/TypeScript/Prisma/MySQL) and modern React frontend featuring real-time data visualization, infinite scroll, and enterprise-grade architecture.

---

# 🎯 LEVEL 1: HIGH-LEVEL ARCHITECTURE & STRATEGY

## 1.1 Project Goals & Success Criteria
- **Primary Goal**: Demonstrate technical leadership through clean architecture, best practices, and production-ready code
- **Success Metrics**:
  - ✅ 100% requirement coverage
  - ✅ >90% test coverage on critical paths
  - ✅ Sub-200ms API response times
  - ✅ Pixel-perfect UI matching the provided design
  - ✅ Enterprise-grade security and error handling

## 1.2 System Architecture Overview
```
┌─────────────────────────────────────────────────────────┐
│                     Frontend (React)                      │
│  Dashboard • Charts • Filters • Infinite Scroll • Cache   │
└────────────────────────┬──────────────────────────────────┘
                         │ REST API
┌────────────────────────▼──────────────────────────────────┐
│                   API Gateway Layer                        │
│     Rate Limiting • CORS • Auth • Validation • Cache       │
└────────────────────────┬──────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────┐
│                  Business Logic Layer                      │
│   Chart Services • Data Aggregation • Business Rules       │
└────────────────────────┬──────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────┐
│                    Data Access Layer                       │
│          Prisma ORM • Query Optimization • Cache           │
└────────────────────────┬──────────────────────────────────┘
                         │
┌────────────────────────▼──────────────────────────────────┐
│                      MySQL Database                        │
│     Transactions • Categories • Products • Customers       │
└─────────────────────────────────────────────────────────────┘
```

## 1.3 Technology Stack Decisions

### Backend Stack
- **Runtime**: Node.js 22 LTS (latest stable)
- **Framework**: Fastify (30% faster than Express, built-in schema validation)
- **Language**: TypeScript 5.x with strict mode
- **ORM**: Prisma 5.x (type-safe, migrations, great DX)
- **Database**: MySQL 8.x with proper indexing
- **Validation**: Zod (runtime + compile-time safety)
- **Testing**: Vitest + Supertest + TestContainers
- **Documentation**: OpenAPI 3.1 with Swagger UI

### Frontend Stack  
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite (fastest HMR and builds)
- **State Management**: TanStack Query v5 (server state)
- **Charts**: Recharts (matches requirement format)
- **UI/Styling**: Tailwind CSS + Radix UI
- **Infinite Scroll**: react-intersection-observer
- **Date Handling**: date-fns
- **Testing**: Vitest + React Testing Library

## 1.4 Key Technical Differentiators
1. **Dynamic Chart Engine**: Single endpoint adapts to any chart type
2. **Smart Caching**: ETag-based HTTP caching + Redis for aggregations
3. **Real Infinite Scroll**: Cursor-based pagination with intersection observer
4. **Type Safety End-to-End**: Shared types between frontend/backend
5. **Performance First**: Indexed queries, connection pooling, React.memo
6. **Production Ready**: Health checks, graceful shutdown, structured logging

---

# 📋 LEVEL 2: COMPONENT BREAKDOWN & SPECIFICATIONS

## 2.1 Database Schema Design

### Core Tables
```sql
-- Categories (Centro de Custo)
categories:
  - id: UUID (PK)
  - code: VARCHAR(20) UNIQUE
  - name: VARCHAR(100)
  - created_at: DATETIME
  - updated_at: DATETIME

-- Products
products:
  - id: UUID (PK)
  - name: VARCHAR(100)
  - category_id: UUID (FK)
  - unit_price: DECIMAL(15,2)
  - created_at: DATETIME
  - updated_at: DATETIME

-- Customers
customers:
  - id: UUID (PK)
  - name: VARCHAR(100)
  - document: VARCHAR(20) UNIQUE
  - email: VARCHAR(100)
  - region: VARCHAR(50)
  - created_at: DATETIME
  - updated_at: DATETIME

-- Transactions (Main fact table)
transactions:
  - id: UUID (PK)
  - type: ENUM('REVENUE', 'EXPENSE')
  - product_id: UUID (FK, nullable)
  - customer_id: UUID (FK, nullable)
  - category_id: UUID (FK)
  - amount: DECIMAL(15,2)
  - quantity: INT
  - occurred_at: DATETIME (indexed)
  - due_date: DATETIME (nullable, for accounts)
  - paid_at: DATETIME (nullable)
  - description: TEXT
  - created_at: DATETIME
  - updated_at: DATETIME

-- Indexes
- transactions(occurred_at, type)
- transactions(category_id, occurred_at)
- transactions(due_date, paid_at)
- compound indexes for common queries
```

## 2.2 API Specification

### 2.2.1 Dynamic Chart Endpoint
```
GET /api/v1/charts/:chartType

Params:
  - chartType: 'pie' | 'line' | 'bar' | 'table' | 'kpi'

Query:
  - start: ISO 8601 date (required)
  - end: ISO 8601 date (required)
  - metric: 'revenue' | 'expense' | 'profit' | 'quantity' | 'count'
  - groupBy: 'day' | 'week' | 'month' | 'quarter' | 'year' | 'category' | 'product'
  - dimension?: string (for filtering by specific dimension)
  - topN?: number (limit results for pie/bar charts)
  - cursor?: string (for pagination in tables)

Response Formats by Chart Type:
  - pie: { series: [{ label, value, percentage }] }
  - line: { series: [{ name, points: [{ x, y }] }] }
  - bar: { categories: [], series: [{ name, data: [] }] }
  - table: { columns: [], rows: [], cursor?: string }
  - kpi: { current: number, previous: number, change: number, trend: 'up'|'down' }
```

### 2.2.2 Options Endpoints (Infinite Scroll)
```
GET /api/v1/options/:entity

Params:
  - entity: 'categories' | 'products' | 'customers' | 'regions'

Query:
  - search?: string (fuzzy search)
  - cursor?: string (for pagination)
  - limit?: number (default: 20, max: 100)

Response:
  {
    items: [{ id, label, value, metadata? }],
    nextCursor?: string,
    hasMore: boolean,
    total: number
  }
```

### 2.2.3 Dashboard Summary Endpoint
```
GET /api/v1/dashboard/summary

Query:
  - start: ISO 8601 date (required)
  - end: ISO 8601 date (required)

Response:
  {
    totalRevenue: number,
    totalExpense: number,
    liquidProfit: number,
    overdueAccounts: { receivable: number, payable: number },
    upcomingAccounts: { receivable: number, payable: number }
  }
```

## 2.3 Frontend Component Architecture

### 2.3.1 Component Hierarchy
```
App
├── Layout
│   ├── Header (with date filter)
│   └── MainContent
├── DashboardPage
│   ├── SummaryCards
│   │   ├── RevenueCard
│   │   ├── ExpenseCard
│   │   ├── ProfitCard
│   │   └── AccountsCard
│   ├── ChartSection
│   │   ├── LineChart (Results by Period)
│   │   └── ChartControls
│   └── TableSection
│       ├── DataTable
│       └── TablePagination
└── SharedComponents
    ├── DateRangePicker
    ├── InfiniteScrollSelect
    ├── LoadingSpinner
    └── ErrorBoundary
```

### 2.3.2 State Management Strategy
```typescript
// Global State (Zustand)
- dateRange: { start, end }
- selectedFilters: { categories, products, regions }

// Server State (TanStack Query)
- dashboardSummary
- chartData (by type)
- tableData (with pagination)
- optionLists (with infinite scroll)

// Local State (useState)
- UI toggles
- Form inputs
- Temporary selections
```

## 2.4 Testing Strategy

### Backend Testing Pyramid
```
Unit Tests (60%)
├── Services: Business logic validation
├── Validators: Schema validation
├── Transformers: Data mapping functions
└── Utils: Helper functions

Integration Tests (30%)
├── API Routes: Request/response contracts
├── Database: Query performance
├── Cache: Redis operations
└── External Services: Mock integrations

E2E Tests (10%)
├── Critical User Flows
├── Chart Data Accuracy
└── Performance Benchmarks
```

### Frontend Testing Pyramid
```
Unit Tests (50%)
├── Components: Isolated behavior
├── Hooks: Custom logic
├── Utils: Data transformations
└── Formatters: Number/date formatting

Integration Tests (35%)
├── User Interactions
├── API Integration
├── State Management
└── Error Scenarios

E2E Tests (15%)
├── Dashboard Load
├── Filter Interactions
├── Infinite Scroll
└── Chart Updates
```

---

# 🔧 LEVEL 3: DETAILED IMPLEMENTATION PLAN

## 3.1 Phase 1: Foundation (Day 1)

### 3.1.1 Project Setup
```bash
# Repository Structure
/
├── apps/
│   ├── api/               # Backend application
│   │   ├── src/
│   │   │   ├── config/    # Configuration files
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── middleware/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── app.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── tests/
│   └── web/               # Frontend application
│       ├── src/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── hooks/
│       │   ├── services/
│       │   ├── types/
│       │   └── utils/
│       └── tests/
├── packages/
│   └── shared/           # Shared types/utils
├── docs/
│   ├── openapi.yaml
│   └── architecture.md
└── docker-compose.yml
```

### 3.1.2 Database Setup & Seed Data
```typescript
// Seed data matching the screenshot
const seedData = {
  categories: [
    { code: 'TRANS001', name: 'SUZANO TRANSPORTE FLORESTAL' },
    { code: 'TRANS002', name: 'TRANSPORTE DE AGREGADOS ITABIRA MG' }
  ],
  transactions: [
    // Generate realistic financial data
    // Ensure totals match: Revenue: 41,954.26, Expense: 67,740.79
  ]
};
```

## 3.2 Phase 2: Backend Core (Day 2-3)

### 3.2.1 Chart Service Implementation
```typescript
class ChartService {
  async getChartData(params: ChartParams): Promise<ChartResponse> {
    // Strategy pattern for chart types
    const strategy = this.getStrategy(params.chartType);
    
    // Query optimization based on chart type
    const query = this.buildOptimizedQuery(params);
    
    // Execute with proper indexing hints
    const rawData = await this.prisma.$queryRaw(query);
    
    // Transform to chart-specific format
    return strategy.transform(rawData);
  }
  
  private getStrategy(type: ChartType): ChartStrategy {
    const strategies = {
      pie: new PieChartStrategy(),
      line: new LineChartStrategy(),
      bar: new BarChartStrategy(),
      table: new TableStrategy(),
      kpi: new KPIStrategy()
    };
    return strategies[type];
  }
}
```

### 3.2.2 Infinite Scroll Implementation
```typescript
class OptionsService {
  async getOptions(params: OptionsParams): Promise<OptionsResponse> {
    // Cursor-based pagination
    const decodedCursor = params.cursor 
      ? Buffer.from(params.cursor, 'base64').toString() 
      : null;
    
    // Efficient query with index usage
    const items = await this.prisma[params.entity].findMany({
      where: {
        ...(params.search && {
          name: { contains: params.search, mode: 'insensitive' }
        }),
        ...(decodedCursor && { id: { gt: decodedCursor } })
      },
      take: params.limit + 1, // Fetch one extra to check hasMore
      orderBy: { id: 'asc' }
    });
    
    const hasMore = items.length > params.limit;
    if (hasMore) items.pop();
    
    return {
      items: items.map(this.mapToOption),
      nextCursor: hasMore 
        ? Buffer.from(items[items.length - 1].id).toString('base64')
        : undefined,
      hasMore,
      total: await this.getTotal(params)
    };
  }
}
```

### 3.2.3 Performance Optimizations
```typescript
// Connection pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  log: ['error', 'warn'],
  // Connection pool settings
  engineType: 'binary',
  pool: {
    min: 2,
    max: 10,
    acquireTimeoutMillis: 30000,
    idleTimeoutMillis: 30000
  }
});

// Query result caching
class CacheService {
  private redis: Redis;
  
  async getOrSet<T>(
    key: string, 
    factory: () => Promise<T>, 
    ttl = 300
  ): Promise<T> {
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const fresh = await factory();
    await this.redis.setex(key, ttl, JSON.stringify(fresh));
    return fresh;
  }
}
```

## 3.3 Phase 3: Frontend Development (Day 3-4)

### 3.3.1 Infinite Scroll Select Component
```typescript
const InfiniteScrollSelect: React.FC<Props> = ({ 
  entity, 
  value, 
  onChange 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver>();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['options', entity],
    queryFn: ({ pageParam }) => 
      fetchOptions(entity, { cursor: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined
  });
  
  useEffect(() => {
    if (!loadMoreRef.current) return;
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.5 }
    );
    
    observerRef.current.observe(loadMoreRef.current);
    
    return () => observerRef.current?.disconnect();
  }, [hasNextPage, fetchNextPage]);
  
  const options = data?.pages.flatMap(page => page.items) ?? [];
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          {value?.label ?? `Select ${entity}`}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={`Search ${entity}...`} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.value}
                  onSelect={() => {
                    onChange(option);
                    setIsOpen(false);
                  }}
                >
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
            {hasNextPage && (
              <div ref={loadMoreRef} className="py-2 text-center">
                {isFetchingNextPage ? (
                  <Spinner size="sm" />
                ) : (
                  <span className="text-sm text-gray-500">
                    Load more...
                  </span>
                )}
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
```

### 3.3.2 Dynamic Chart Component
```typescript
const DynamicChart: React.FC<Props> = ({ type, data }) => {
  const ChartComponents = {
    line: LineChart,
    bar: BarChart,
    pie: PieChart,
    table: DataTable
  };
  
  const Component = ChartComponents[type];
  
  if (!Component) {
    throw new Error(`Unsupported chart type: ${type}`);
  }
  
  // Memoize expensive calculations
  const processedData = useMemo(() => 
    processChartData(data, type), 
    [data, type]
  );
  
  return (
    <ErrorBoundary fallback={<ChartError />}>
      <Suspense fallback={<ChartSkeleton type={type} />}>
        <Component data={processedData} />
      </Suspense>
    </ErrorBoundary>
  );
};
```

### 3.3.3 Dashboard Page Implementation
```typescript
const DashboardPage: React.FC = () => {
  const [dateRange, setDateRange] = useAtom(dateRangeAtom);
  const [filters, setFilters] = useAtom(filtersAtom);
  
  // Parallel data fetching
  const queries = useQueries({
    queries: [
      {
        queryKey: ['summary', dateRange],
        queryFn: () => fetchSummary(dateRange),
        staleTime: 5 * 60 * 1000
      },
      {
        queryKey: ['lineChart', dateRange, filters],
        queryFn: () => fetchChartData('line', { ...dateRange, ...filters }),
        staleTime: 5 * 60 * 1000
      },
      {
        queryKey: ['tableData', dateRange, filters],
        queryFn: () => fetchChartData('table', { ...dateRange, ...filters }),
        staleTime: 5 * 60 * 1000
      }
    ]
  });
  
  const [summary, lineChart, tableData] = queries;
  
  return (
    <div className="dashboard-container">
      {/* Header with Date Range Picker */}
      <DashboardHeader>
        <DateRangePicker
          value={dateRange}
          onChange={setDateRange}
          required
        />
        <FilterControls filters={filters} onChange={setFilters} />
      </DashboardHeader>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <KPICard
          title="TOTAL RECEITA"
          value={summary.data?.totalRevenue}
          color="green"
          icon={<TrendingUp />}
        />
        <KPICard
          title="TOTAL DESPESA"
          value={summary.data?.totalExpense}
          color="red"
          icon={<TrendingDown />}
        />
        <KPICard
          title="LUCRO LÍQUIDO"
          value={summary.data?.liquidProfit}
          color="yellow"
          icon={<DollarSign />}
          highlight
        />
        <AccountsCard
          title="CONTAS VENCIDAS"
          receivable={summary.data?.overdueAccounts.receivable}
          payable={summary.data?.overdueAccounts.payable}
        />
        <AccountsCard
          title="CONTAS A VENCER"
          receivable={summary.data?.upcomingAccounts.receivable}
          payable={summary.data?.upcomingAccounts.payable}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        <ChartPanel title="RESULTADOS POR PERÍODO">
          {lineChart.isLoading ? (
            <ChartSkeleton type="line" />
          ) : (
            <DynamicChart type="line" data={lineChart.data} />
          )}
        </ChartPanel>
        
        <TablePanel>
          {tableData.isLoading ? (
            <TableSkeleton />
          ) : (
            <DataTable
              columns={tableColumns}
              data={tableData.data?.rows}
              pagination
            />
          )}
        </TablePanel>
      </div>
    </div>
  );
};
```

## 3.4 Phase 4: Testing & Documentation (Day 4-5)

### 3.4.1 Backend Testing Suite
```typescript
// Integration test example
describe('Charts API', () => {
  let app: FastifyInstance;
  let container: MySqlContainer;
  
  beforeAll(async () => {
    container = await new MySqlContainer()
      .withDatabase('testdb')
      .start();
    
    app = await buildApp({
      database: container.getConnectionUri()
    });
    
    await seedTestData();
  });
  
  describe('GET /api/v1/charts/:type', () => {
    it('should require date range parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/charts/line'
      });
      
      expect(response.statusCode).toBe(400);
      expect(response.json()).toMatchObject({
        type: 'https://example.com/errors/validation',
        title: 'Validation Error',
        detail: 'start and end dates are required'
      });
    });
    
    it('should return correct line chart format', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/charts/line',
        query: {
          start: '2024-01-01',
          end: '2024-01-31',
          metric: 'revenue',
          groupBy: 'day'
        }
      });
      
      expect(response.statusCode).toBe(200);
      expect(response.json()).toMatchObject({
        series: expect.arrayContaining([
          {
            name: expect.any(String),
            points: expect.arrayContaining([
              { x: expect.any(String), y: expect.any(Number) }
            ])
          }
        ])
      });
    });
    
    it('should handle pagination for table type', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/charts/table',
        query: {
          start: '2024-01-01',
          end: '2024-01-31',
          limit: 10
        }
      });
      
      expect(response.json()).toHaveProperty('cursor');
      expect(response.json().rows).toHaveLength(10);
    });
  });
});
```

### 3.4.2 Frontend Testing Suite
```typescript
// Component test example
describe('InfiniteScrollSelect', () => {
  it('should load more items when scrolling to bottom', async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        items: Array.from({ length: 20 }, (_, i) => ({
          id: i,
          label: `Item ${i}`,
          value: `item-${i}`
        })),
        nextCursor: 'cursor-20',
        hasMore: true
      })
      .mockResolvedValueOnce({
        items: Array.from({ length: 10 }, (_, i) => ({
          id: i + 20,
          label: `Item ${i + 20}`,
          value: `item-${i + 20}`
        })),
        nextCursor: undefined,
        hasMore: false
      });
    
    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <InfiniteScrollSelect
          entity="products"
          onChange={vi.fn()}
          fetchFn={mockFetch}
        />
      </QueryClientProvider>
    );
    
    // Open dropdown
    const trigger = screen.getByRole('button');
    await userEvent.click(trigger);
    
    // Check initial load
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('option')).toHaveLength(20);
    
    // Scroll to bottom
    const list = container.querySelector('[role="listbox"]');
    fireEvent.scroll(list!, { target: { scrollY: 1000 } });
    
    // Wait for next page
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
    
    expect(screen.getAllByRole('option')).toHaveLength(30);
  });
});
```

---

# 💻 LEVEL 4: SPECIFIC IMPLEMENTATION DETAILS

## 4.1 Exact Code Patterns & Implementations

### 4.1.1 Prisma Schema (Complete)
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["fullTextSearch", "fullTextIndex"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Category {
  id          String   @id @default(uuid())
  code        String   @unique @db.VarChar(20)
  name        String   @db.VarChar(100)
  description String?  @db.Text
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  
  products     Product[]
  transactions Transaction[]
  
  @@index([code])
  @@index([name])
  @@map("categories")
}

model Product {
  id         String   @id @default(uuid())
  name       String   @db.VarChar(100)
  code       String?  @unique @db.VarChar(50)
  categoryId String   @map("category_id")
  unitPrice  Decimal  @db.Decimal(15, 2) @map("unit_price")
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  
  category     Category      @relation(fields: [categoryId], references: [id])
  transactions Transaction[]
  
  @@index([categoryId])
  @@index([name])
  @@fulltext([name])
  @@map("products")
}

model Customer {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(100)
  document  String   @unique @db.VarChar(20)
  email     String?  @db.VarChar(100)
  phone     String?  @db.VarChar(20)
  region    String   @db.VarChar(50)
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  
  transactions Transaction[]
  
  @@index([region])
  @@index([document])
  @@fulltext([name])
  @@map("customers")
}

enum TransactionType {
  REVENUE
  EXPENSE
}

enum PaymentStatus {
  PENDING
  PAID
  OVERDUE
  CANCELLED
}

model Transaction {
  id            String          @id @default(uuid())
  type          TransactionType
  productId     String?         @map("product_id")
  customerId    String?         @map("customer_id")
  categoryId    String          @map("category_id")
  amount        Decimal         @db.Decimal(15, 2)
  quantity      Int             @default(1)
  unitPrice     Decimal?        @db.Decimal(15, 2) @map("unit_price")
  occurredAt    DateTime        @map("occurred_at")
  dueDate       DateTime?       @map("due_date")
  paidAt        DateTime?       @map("paid_at")
  paymentStatus PaymentStatus   @default(PENDING) @map("payment_status")
  description   String?         @db.Text
  reference     String?         @db.VarChar(100)
  createdAt     DateTime        @default(now()) @map("created_at")
  updatedAt     DateTime        @updatedAt @map("updated_at")
  
  product  Product?  @relation(fields: [productId], references: [id])
  customer Customer? @relation(fields: [customerId], references: [id])
  category Category  @relation(fields: [categoryId], references: [id])
  
  @@index([occurredAt, type])
  @@index([categoryId, occurredAt])
  @@index([dueDate, paymentStatus])
  @@index([paidAt])
  @@index([customerId])
  @@index([productId])
  @@map("transactions")
}
```

### 4.1.2 API Route Implementation (Complete)
```typescript
// apps/api/src/controllers/chart.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { ChartService } from '../services/chart.service';
import { CacheService } from '../services/cache.service';

const chartParamsSchema = z.object({
  chartType: z.enum(['pie', 'line', 'bar', 'table', 'kpi'])
});

const chartQuerySchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime(),
  metric: z.enum(['revenue', 'expense', 'profit', 'quantity', 'count'])
    .default('revenue'),
  groupBy: z.enum(['day', 'week', 'month', 'quarter', 'year', 'category', 'product'])
    .optional(),
  dimension: z.string().optional(),
  topN: z.coerce.number().min(1).max(100).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20)
}).refine(
  (data) => new Date(data.start) < new Date(data.end),
  { message: 'Start date must be before end date' }
);

export class ChartController {
  constructor(
    private chartService: ChartService,
    private cacheService: CacheService
  ) {}

  async getChartData(
    request: FastifyRequest<{
      Params: z.infer<typeof chartParamsSchema>;
      Querystring: z.infer<typeof chartQuerySchema>;
    }>,
    reply: FastifyReply
  ) {
    try {
      // Validate params and query
      const params = chartParamsSchema.parse(request.params);
      const query = chartQuerySchema.parse(request.query);
      
      // Generate cache key
      const cacheKey = `chart:${params.chartType}:${JSON.stringify(query)}`;
      
      // Try to get from cache
      const cached = await this.cacheService.get(cacheKey);
      if (cached) {
        const etag = this.generateETag(cached);
        
        // Check if client has fresh copy
        if (request.headers['if-none-match'] === etag) {
          return reply.status(304).send();
        }
        
        return reply
          .header('ETag', etag)
          .header('Cache-Control', 'private, max-age=60')
          .send(cached);
      }
      
      // Fetch fresh data
      const data = await this.chartService.getChartData({
        ...params,
        ...query
      });
      
      // Cache the response
      await this.cacheService.set(cacheKey, data, 60);
      
      // Generate ETag
      const etag = this.generateETag(data);
      
      return reply
        .header('ETag', etag)
        .header('Cache-Control', 'private, max-age=60')
        .send(data);
        
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          type: 'https://api.example.com/errors/validation',
          title: 'Validation Error',
          status: 400,
          detail: error.errors.map(e => e.message).join(', '),
          instance: request.url
        });
      }
      
      request.log.error(error, 'Error fetching chart data');
      
      return reply.status(500).send({
        type: 'https://api.example.com/errors/internal',
        title: 'Internal Server Error',
        status: 500,
        detail: 'An unexpected error occurred',
        instance: request.url
      });
    }
  }
  
  private generateETag(data: any): string {
    const crypto = require('crypto');
    return crypto
      .createHash('md5')
      .update(JSON.stringify(data))
      .digest('hex');
  }
}
```

### 4.1.3 Chart Service with Query Optimization
```typescript
// apps/api/src/services/chart.service.ts
import { PrismaClient } from '@prisma/client';
import { ChartParams, ChartResponse } from '../types';

export class ChartService {
  constructor(private prisma: PrismaClient) {}
  
  async getChartData(params: ChartParams): Promise<ChartResponse> {
    const strategy = this.getStrategy(params.chartType);
    return strategy.execute(params, this.prisma);
  }
  
  private getStrategy(type: string): ChartStrategy {
    const strategies: Record<string, ChartStrategy> = {
      line: new LineChartStrategy(),
      pie: new PieChartStrategy(),
      bar: new BarChartStrategy(),
      table: new TableChartStrategy(),
      kpi: new KPIChartStrategy()
    };
    
    const strategy = strategies[type];
    if (!strategy) {
      throw new Error(`Unsupported chart type: ${type}`);
    }
    
    return strategy;
  }
}

// Strategy implementation for line chart
class LineChartStrategy implements ChartStrategy {
  async execute(
    params: ChartParams, 
    prisma: PrismaClient
  ): Promise<LineChartResponse> {
    const { start, end, metric, groupBy = 'day' } = params;
    
    // Build optimized query based on groupBy
    const dateFormat = this.getDateFormat(groupBy);
    
    // Use raw query for performance with proper indexing
    const query = `
      SELECT 
        DATE_FORMAT(occurred_at, '${dateFormat}') as period,
        ${this.getMetricAggregation(metric)} as value,
        type
      FROM transactions
      WHERE occurred_at >= ? AND occurred_at <= ?
      GROUP BY period, type
      ORDER BY period ASC
    `;
    
    const results = await prisma.$queryRawUnsafe<
      { period: string; value: number; type: string }[]
    >(query, new Date(start), new Date(end));
    
    // Transform to chart format
    const series = this.transformToSeries(results, groupBy);
    
    return { series };
  }
  
  private getDateFormat(groupBy: string): string {
    const formats: Record<string, string> = {
      day: '%Y-%m-%d',
      week: '%Y-%u',
      month: '%Y-%m',
      quarter: '%Y-Q%q',
      year: '%Y'
    };
    return formats[groupBy] || formats.day;
  }
  
  private getMetricAggregation(metric: string): string {
    const aggregations: Record<string, string> = {
      revenue: "SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END)",
      expense: "SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END)",
      profit: "SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE -amount END)",
      quantity: "SUM(quantity)",
      count: "COUNT(*)"
    };
    return aggregations[metric] || aggregations.revenue;
  }
  
  private transformToSeries(
    results: any[], 
    groupBy: string
  ): LineChartSeries[] {
    const grouped = results.reduce((acc, row) => {
      if (!acc[row.type]) {
        acc[row.type] = [];
      }
      acc[row.type].push({
        x: this.formatPeriod(row.period, groupBy),
        y: Number(row.value)
      });
      return acc;
    }, {} as Record<string, Point[]>);
    
    return Object.entries(grouped).map(([name, points]) => ({
      name,
      points
    }));
  }
  
  private formatPeriod(period: string, groupBy: string): string {
    // Format period for display
    if (groupBy === 'day') return period;
    if (groupBy === 'month') return `${period}-01`;
    // Add more formatting as needed
    return period;
  }
}
```

### 4.1.4 Frontend API Client with Type Safety
```typescript
// apps/web/src/services/api.client.ts
import { z } from 'zod';

// Shared schemas
const dateRangeSchema = z.object({
  start: z.string().datetime(),
  end: z.string().datetime()
});

const lineChartResponseSchema = z.object({
  series: z.array(
    z.object({
      name: z.string(),
      points: z.array(
        z.object({
          x: z.string(),
          y: z.number()
        })
      )
    })
  )
});

const optionsResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      label: z.string(),
      value: z.string(),
      metadata: z.record(z.any()).optional()
    })
  ),
  nextCursor: z.string().optional(),
  hasMore: z.boolean(),
  total: z.number()
});

// Type-safe API client
export class APIClient {
  private baseURL: string;
  
  constructor(baseURL = import.meta.env.VITE_API_URL) {
    this.baseURL = baseURL;
  }
  
  async fetchChartData<T extends ChartType>(
    type: T,
    params: ChartParams
  ): Promise<ChartDataMap[T]> {
    const url = new URL(`/api/v1/charts/${type}`, this.baseURL);
    
    // Add query params
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error);
    }
    
    const data = await response.json();
    
    // Validate response schema
    const schema = this.getSchemaForType(type);
    return schema.parse(data);
  }
  
  async fetchOptions(
    entity: OptionsEntity,
    params: OptionsParams = {}
  ): Promise<OptionsResponse> {
    const url = new URL(`/api/v1/options/${entity}`, this.baseURL);
    
    if (params.cursor) url.searchParams.append('cursor', params.cursor);
    if (params.search) url.searchParams.append('search', params.search);
    if (params.limit) url.searchParams.append('limit', String(params.limit));
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new APIError(await response.json());
    }
    
    const data = await response.json();
    return optionsResponseSchema.parse(data);
  }
  
  private getSchemaForType(type: ChartType) {
    const schemas = {
      line: lineChartResponseSchema,
      pie: pieChartResponseSchema,
      bar: barChartResponseSchema,
      table: tableChartResponseSchema,
      kpi: kpiChartResponseSchema
    };
    return schemas[type];
  }
}

// Custom error class
export class APIError extends Error {
  constructor(public error: ProblemDetails) {
    super(error.detail || error.title);
    this.name = 'APIError';
  }
}
```

### 4.1.5 Docker Compose for Development
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: dashboard-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD:-root}
      MYSQL_DATABASE: ${MYSQL_DATABASE:-dashboard}
      MYSQL_USER: ${MYSQL_USER:-dashboard}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD:-dashboard}
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/init.sql
    command: 
      - --character-set-server=utf8mb4
      - --collation-server=utf8mb4_unicode_ci
      - --default-authentication-plugin=mysql_native_password
      - --max_connections=1000
      - --innodb_buffer_pool_size=256M
      - --innodb_log_file_size=64M
      - --slow_query_log=1
      - --long_query_time=2
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7-alpine
    container_name: dashboard-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  mysql-data:
  redis-data:

networks:
  default:
    name: dashboard-network
```

## 4.2 Edge Cases & Error Handling

### 4.2.1 Comprehensive Error Scenarios
```typescript
// Error handling middleware
export const errorHandler: ErrorRequestHandler = (
  error,
  request,
  reply,
  next
) => {
  // Log error with context
  request.log.error({
    err: error,
    request: {
      method: request.method,
      url: request.url,
      params: request.params,
      query: request.query,
      headers: {
        ...request.headers,
        authorization: undefined // Redact sensitive data
      }
    }
  });
  
  // Handle specific error types
  if (error instanceof ZodError) {
    return reply.status(400).send({
      type: 'https://api.example.com/errors/validation',
      title: 'Validation Error',
      status: 400,
      detail: error.errors.map(e => 
        `${e.path.join('.')}: ${e.message}`
      ).join(', '),
      instance: request.url,
      errors: error.errors
    });
  }
  
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return reply.status(409).send({
        type: 'https://api.example.com/errors/conflict',
        title: 'Conflict',
        status: 409,
        detail: 'Resource already exists',
        instance: request.url
      });
    }
    
    if (error.code === 'P2025') {
      return reply.status(404).send({
        type: 'https://api.example.com/errors/not-found',
        title: 'Not Found',
        status: 404,
        detail: 'Resource not found',
        instance: request.url
      });
    }
  }
  
  // Rate limiting
  if (error.statusCode === 429) {
    return reply.status(429).send({
      type: 'https://api.example.com/errors/rate-limit',
      title: 'Too Many Requests',
      status: 429,
      detail: 'Rate limit exceeded. Please try again later.',
      instance: request.url,
      retryAfter: error.retryAfter
    });
  }
  
  // Default to 500
  return reply.status(500).send({
    type: 'https://api.example.com/errors/internal',
    title: 'Internal Server Error',
    status: 500,
    detail: 'An unexpected error occurred',
    instance: request.url
  });
};
```

### 4.2.2 Frontend Error Boundaries
```typescript
// Global error boundary
export class GlobalErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to error reporting service
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Send to monitoring service
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        }
      });
    }
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h1>Something went wrong</h1>
          <details style={{ whiteSpace: 'pre-wrap' }}>
            {this.state.error?.toString()}
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Async component error boundary
export const AsyncBoundary: React.FC<{ children: ReactNode }> = ({ 
  children 
}) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Async error:', error, errorInfo);
      }}
      onReset={() => window.location.reload()}
    >
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
};
```

## 4.3 Performance Optimization Techniques

### 4.3.1 Database Query Optimization
```sql
-- Optimized indexes for common queries
CREATE INDEX idx_transactions_date_type 
  ON transactions(occurred_at, type);

CREATE INDEX idx_transactions_category_date 
  ON transactions(category_id, occurred_at);

CREATE INDEX idx_transactions_status_due 
  ON transactions(payment_status, due_date) 
  WHERE payment_status IN ('PENDING', 'OVERDUE');

-- Materialized view for dashboard summary
CREATE VIEW v_dashboard_summary AS
SELECT 
  DATE(occurred_at) as date,
  SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE 0 END) as total_revenue,
  SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_expense,
  SUM(CASE WHEN type = 'REVENUE' THEN amount ELSE -amount END) as profit,
  COUNT(DISTINCT customer_id) as unique_customers,
  COUNT(DISTINCT product_id) as unique_products
FROM transactions
GROUP BY DATE(occurred_at);

-- Query hints for optimizer
SELECT /*+ INDEX(t idx_transactions_date_type) */
  t.* 
FROM transactions t
WHERE t.occurred_at >= ? AND t.occurred_at <= ?;
```

### 4.3.2 React Performance Optimization
```typescript
// Memoized expensive components
const ExpensiveChart = memo(({ data, type }: ChartProps) => {
  // Heavy computation memoized
  const processedData = useMemo(() => {
    return processChartData(data, type);
  }, [data, type]);
  
  // Callback memoization
  const handleClick = useCallback((event: ChartEvent) => {
    // Handle click
  }, []);
  
  return <Chart data={processedData} onClick={handleClick} />;
}, (prevProps, nextProps) => {
  // Custom comparison
  return (
    prevProps.type === nextProps.type &&
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data)
  );
});

// Virtual scrolling for large tables
const VirtualTable: React.FC<{ data: Row[] }> = ({ data }) => {
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
    overscan: 5
  });
  
  return (
    <div ref={parentRef} className="table-container">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.index}
            className="table-row"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          >
            <TableRow data={data[virtualRow.index]} />
          </div>
        ))}
      </div>
    </div>
  );
};
```

## 4.4 CI/CD Pipeline Configuration

### 4.4.1 GitHub Actions Workflow
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '22'
  MYSQL_VERSION: '8.0'

jobs:
  lint-and-type-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Get pnpm store directory
        id: pnpm-cache
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
        
      - name: Setup pnpm cache
        uses: actions/cache@v3
        with:
          path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-
            
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run linters
        run: |
          pnpm run lint
          pnpm run format:check
          
      - name: Type check
        run: pnpm run typecheck

  test-backend:
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    
    services:
      mysql:
        image: mysql:${{ env.MYSQL_VERSION }}
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_db
        ports:
          - 3306:3306
        options: >-
          --health-cmd="mysqladmin ping"
          --health-interval=10s
          --health-timeout=5s
          --health-retries=5
          
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run migrations
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
        run: |
          pnpm --filter @app/api run prisma:migrate
          
      - name: Seed test data
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
        run: |
          pnpm --filter @app/api run seed:test
          
      - name: Run unit tests
        run: pnpm --filter @app/api run test:unit
        
      - name: Run integration tests
        env:
          DATABASE_URL: mysql://root:root@localhost:3306/test_db
          REDIS_URL: redis://localhost:6379
        run: pnpm --filter @app/api run test:integration
        
      - name: Generate coverage report
        run: pnpm --filter @app/api run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/api/coverage/lcov.info
          flags: backend

  test-frontend:
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Run unit tests
        run: pnpm --filter @app/web run test:unit
        
      - name: Run component tests
        run: pnpm --filter @app/web run test:components
        
      - name: Generate coverage report
        run: pnpm --filter @app/web run test:coverage
        
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./apps/web/coverage/lcov.info
          flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [test-backend, test-frontend]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install --frozen-lockfile
        
      - name: Build applications
        run: pnpm run build
        
      - name: Start services
        run: |
          docker-compose up -d
          pnpm run start:test &
          npx wait-on http://localhost:3000/api/v1/healthz
          npx wait-on http://localhost:5173
          
      - name: Run E2E tests
        run: pnpm run test:e2e
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: ./e2e/playwright-report/

  security-scan:
    runs-on: ubuntu-latest
    needs: lint-and-type-check
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy security scan
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
      - name: Run npm audit
        run: |
          pnpm audit --audit-level=high

  build-and-push:
    runs-on: ubuntu-latest
    needs: [e2e-tests, security-scan]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Login to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ vars.REGISTRY_URL }}
          username: ${{ secrets.REGISTRY_USERNAME }}
          password: ${{ secrets.REGISTRY_PASSWORD }}
          
      - name: Build and push API image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/api
          push: true
          tags: |
            ${{ vars.REGISTRY_URL }}/dashboard-api:latest
            ${{ vars.REGISTRY_URL }}/dashboard-api:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          
      - name: Build and push Web image
        uses: docker/build-push-action@v5
        with:
          context: ./apps/web
          push: true
          tags: |
            ${{ vars.REGISTRY_URL }}/dashboard-web:latest
            ${{ vars.REGISTRY_URL }}/dashboard-web:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

---

## 📚 APPENDIX: Quick Reference Commands

```bash
# Development Setup
git clone <repo>
cd dashboard-project
pnpm install
cp .env.example .env
docker-compose up -d
pnpm run db:migrate
pnpm run db:seed
pnpm run dev

# Testing
pnpm run test           # All tests
pnpm run test:unit      # Unit tests only
pnpm run test:e2e       # E2E tests
pnpm run test:coverage  # Coverage report

# Production Build
pnpm run build
pnpm run start:prod

# Database Operations
pnpm run db:migrate     # Run migrations
pnpm run db:seed        # Seed data
pnpm run db:reset       # Reset database
pnpm run prisma:studio  # Open Prisma Studio

# Code Quality
pnpm run lint          # ESLint
pnpm run format        # Prettier
pnpm run typecheck     # TypeScript
pnpm run audit         # Security audit
```

---

## 🎯 Success Checklist

- [ ] All requirements implemented
- [ ] Matches provided UI design exactly
- [ ] Date filters mandatory and working
- [ ] Infinite scroll in selects functional
- [ ] API dynamically adapts to chart types
- [ ] Test coverage >90% on critical paths
- [ ] Full API documentation with examples
- [ ] Production-ready error handling
- [ ] Performance optimized (sub-200ms responses)
- [ ] Security best practices implemented
- [ ] CI/CD pipeline green
- [ ] README with clear setup instructions
- [ ] Code follows enterprise standards
- [ ] Impresses the hiring team! 🚀

---

*This planning document provides comprehensive guidance for building a production-ready dashboard that will showcase your technical leadership capabilities. Follow each level progressively, and you'll create an impressive solution that exceeds expectations.*
