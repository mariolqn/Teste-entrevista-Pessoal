/**
 * Shared formatting functions
 */

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Decimal from 'decimal.js';

import { CURRENCY, DATE_FORMATS } from './constants';
import { parseDate } from './utils';

/**
 * Format currency value
 */
export function formatCurrency(value: number | string | Decimal): string {
  const num = typeof value === 'object' ? value.toNumber() : Number(value);
  
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    style: 'currency',
    currency: CURRENCY.CODE,
    minimumFractionDigits: CURRENCY.DECIMAL_PLACES,
    maximumFractionDigits: CURRENCY.DECIMAL_PLACES,
  }).format(num);
}

/**
 * Format number with locale
 */
export function formatNumber(
  value: number | string,
  options?: Intl.NumberFormatOptions,
): string {
  const num = Number(value);
  
  return new Intl.NumberFormat(CURRENCY.LOCALE, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format date
 */
export function formatDate(
  date: string | Date,
  formatStr: keyof typeof DATE_FORMATS | string = 'DISPLAY',
): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const dateFormat = DATE_FORMATS[formatStr as keyof typeof DATE_FORMATS] || formatStr;
  
  return format(parsedDate, dateFormat, { locale: ptBR });
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const parsedDate = parseDate(date);
  if (!parsedDate) return '';
  
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - parsedDate.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'agora';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h atrás`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d atrás`;
  
  return formatDate(parsedDate);
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  
  return `${size.toFixed(unitIndex === 0 ? 0 : 2)} ${units[unitIndex]}`;
}

/**
 * Truncate text
 */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Format CPF/CNPJ (Brazilian documents)
 */
export function formatDocument(doc: string): string {
  const cleaned = doc.replace(/\D/g, '');
  
  if (cleaned.length === 11) {
    // CPF: 000.000.000-00
    return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  if (cleaned.length === 14) {
    // CNPJ: 00.000.000/0000-00
    return cleaned.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }
  
  return doc;
}

/**
 * Format phone number
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    // (00) 0000-0000
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  if (cleaned.length === 11) {
    // (00) 00000-0000
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Format chart value based on metric type
 */
export function formatChartValue(
  value: number,
  metric: 'revenue' | 'expense' | 'profit' | 'quantity' | 'count',
): string {
  switch (metric) {
    case 'revenue':
    case 'expense':
    case 'profit':
      return formatCurrency(value);
    case 'quantity':
    case 'count':
      return formatNumber(value);
    default:
      return String(value);
  }
}

/**
 * Format duration (milliseconds to human readable)
 */
export function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `${days}d ${hours % 24}h`;
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}
