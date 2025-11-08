/**
 * Database-related type definitions
 * These types should match the Prisma schema
 */

/**
 * Transaction type enum
 */
export enum TransactionType {
  REVENUE = 'REVENUE',
  EXPENSE = 'EXPENSE',
}

/**
 * Payment status enum
 */
export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED',
}

/**
 * Category model
 */
export interface Category {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product model
 */
export interface Product {
  id: string;
  name: string;
  code?: string | null;
  categoryId: string;
  unitPrice: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  category?: Category;
}

/**
 * Customer model
 */
export interface Customer {
  id: string;
  name: string;
  document: string;
  email?: string | null;
  phone?: string | null;
  region: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Transaction model
 */
export interface Transaction {
  id: string;
  type: TransactionType;
  productId?: string | null;
  customerId?: string | null;
  categoryId: string;
  amount: number;
  quantity: number;
  unitPrice?: number | null;
  occurredAt: Date;
  dueDate?: Date | null;
  paidAt?: Date | null;
  paymentStatus: PaymentStatus;
  description?: string | null;
  reference?: string | null;
  createdAt: Date;
  updatedAt: Date;
  product?: Product | null;
  customer?: Customer | null;
  category?: Category;
}

/**
 * Create/Update DTOs
 */

export interface CreateCategoryDto {
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  code?: string;
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateProductDto {
  name: string;
  code?: string;
  categoryId: string;
  unitPrice: number;
  isActive?: boolean;
}

export interface UpdateProductDto {
  name?: string;
  code?: string;
  categoryId?: string;
  unitPrice?: number;
  isActive?: boolean;
}

export interface CreateCustomerDto {
  name: string;
  document: string;
  email?: string;
  phone?: string;
  region: string;
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  name?: string;
  document?: string;
  email?: string;
  phone?: string;
  region?: string;
  isActive?: boolean;
}

export interface CreateTransactionDto {
  type: TransactionType;
  productId?: string;
  customerId?: string;
  categoryId: string;
  amount: number;
  quantity?: number;
  unitPrice?: number;
  occurredAt: Date | string;
  dueDate?: Date | string;
  paidAt?: Date | string;
  paymentStatus?: PaymentStatus;
  description?: string;
  reference?: string;
}

export interface UpdateTransactionDto {
  type?: TransactionType;
  productId?: string;
  customerId?: string;
  categoryId?: string;
  amount?: number;
  quantity?: number;
  unitPrice?: number;
  occurredAt?: Date | string;
  dueDate?: Date | string;
  paidAt?: Date | string;
  paymentStatus?: PaymentStatus;
  description?: string;
  reference?: string;
}

/**
 * Query filters
 */

export interface CategoryFilter {
  id?: string;
  code?: string;
  name?: string;
  isActive?: boolean;
}

export interface ProductFilter {
  id?: string;
  name?: string;
  code?: string;
  categoryId?: string;
  isActive?: boolean;
  minPrice?: number;
  maxPrice?: number;
}

export interface CustomerFilter {
  id?: string;
  name?: string;
  document?: string;
  email?: string;
  region?: string;
  isActive?: boolean;
}

export interface TransactionFilter {
  id?: string;
  type?: TransactionType;
  productId?: string;
  customerId?: string;
  categoryId?: string;
  paymentStatus?: PaymentStatus;
  minAmount?: number;
  maxAmount?: number;
  startDate?: Date | string;
  endDate?: Date | string;
  isDue?: boolean;
  isPaid?: boolean;
}

/**
 * Aggregation results
 */

export interface TransactionAggregation {
  period: string;
  type?: TransactionType;
  totalAmount: number;
  totalQuantity: number;
  averageAmount: number;
  count: number;
}

export interface CategoryAggregation {
  categoryId: string;
  categoryName: string;
  totalRevenue: number;
  totalExpense: number;
  netAmount: number;
  transactionCount: number;
}

export interface CustomerAggregation {
  customerId: string;
  customerName: string;
  region: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
  lastTransactionDate: Date;
}

export interface ProductAggregation {
  productId: string;
  productName: string;
  categoryName: string;
  totalQuantity: number;
  totalAmount: number;
  averagePrice: number;
  transactionCount: number;
}
