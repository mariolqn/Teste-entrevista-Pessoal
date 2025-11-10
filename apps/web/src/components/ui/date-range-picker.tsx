/**
 * Date Range Picker Component
 */

import type { ComponentProps } from 'react';
import { useState } from 'react';
import { DayPicker, type DateRange as DayPickerDateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import type { DateRange } from '@dashboard/types';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DateRangePickerProps extends Omit<ComponentProps<'div'>, 'onChange'> {
  value?: DateRange;
  onChange?: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
}

/**
 * Format date range for display
 */
function formatDateRange(dateRange: DateRange): string {
  const start = new Date(dateRange.start);
  const end = new Date(dateRange.end);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 'Data inválida';
  }
  
  const startStr = format(start, 'dd/MM/yyyy', { locale: ptBR });
  const endStr = format(end, 'dd/MM/yyyy', { locale: ptBR });
  
  return `${startStr} - ${endStr}`;
}

/**
 * Convert DateRange to DayPicker range format
 */
function toPickerRange(dateRange?: DateRange): DayPickerDateRange | undefined {
  if (!dateRange) return undefined;
  
  return {
    from: new Date(dateRange.start),
    to: new Date(dateRange.end),
  };
}

/**
 * Convert DayPicker range to DateRange format
 */
function fromPickerRange(range?: DayPickerDateRange): DateRange | undefined {
  if (!range?.from || !range?.to) return undefined;
  
  return {
    start: range.from.toISOString(),
    end: range.to.toISOString(),
  };
}

/**
 * Date Range Picker Component
 */
export function DateRangePicker({
  value,
  onChange,
  placeholder = 'Selecionar período',
  disabled = false,
  required = false,
  className,
  ...props
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DayPickerDateRange | undefined>(
    toPickerRange(value)
  );

  const handleSelect = (range: DayPickerDateRange | undefined) => {
    setSelectedRange(range);
    
    const dateRange = fromPickerRange(range);
    
    if (dateRange && onChange) {
      onChange(dateRange);
      setIsOpen(false);
    }
  };

  const displayValue = value ? formatDateRange(value) : placeholder;

  return (
    <div className={cn('relative', className)} {...props}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm shadow-sm transition',
          !disabled && 'hover:border-brand-200',
          disabled && 'cursor-not-allowed opacity-50',
          isOpen && 'border-brand-300 ring-2 ring-brand-100',
          value ? 'font-medium text-slate-900' : 'text-slate-500'
        )}
      >
        <Calendar className="h-4 w-4 text-slate-400" />
        <span className="flex-1">{displayValue}</span>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform',
            isOpen && 'rotate-90'
          )}
        />
      </button>

      {required && !value && (
        <span className="mt-1 text-xs text-rose-500">
          * Campo obrigatório
        </span>
      )}

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Picker popup */}
          <Card className="absolute left-0 top-full z-50 mt-2 border border-slate-200 p-3 shadow-xl">
            <DayPicker
              mode="range"
              selected={selectedRange}
              onSelect={handleSelect}
              locale={ptBR}
              weekStartsOn={1} // Monday
              showOutsideDays
              fixedWeeks
              className="text-sm"
              classNames={{
                months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
                month: 'space-y-4',
                caption: 'flex justify-center pt-1 relative items-center',
                caption_label: 'text-sm font-medium text-slate-900',
                nav: 'space-x-1 flex items-center',
                nav_button: cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
                  'h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100',
                  'border border-slate-200 hover:bg-slate-100'
                ),
                nav_button_previous: 'absolute left-1',
                nav_button_next: 'absolute right-1',
                table: 'w-full border-collapse space-y-1',
                head_row: 'flex',
                head_cell: 'text-slate-500 rounded-md w-8 font-normal text-xs',
                row: 'flex w-full mt-2',
                cell: cn(
                  'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
                  'h-8 w-8'
                ),
                day: cn(
                  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium',
                  'h-8 w-8 p-0 font-normal hover:bg-slate-100'
                ),
                day_range_start: 'day-range-start bg-brand-500 text-white hover:bg-brand-600',
                day_range_end: 'day-range-end bg-brand-500 text-white hover:bg-brand-600',
                day_selected: 'bg-brand-500 text-white hover:bg-brand-600 focus:bg-brand-600',
                day_today: 'bg-slate-100 text-slate-900 font-semibold',
                day_outside: 'text-slate-400 opacity-50',
                day_disabled: 'text-slate-400 opacity-50 cursor-not-allowed',
                day_range_middle: 'bg-brand-100 text-brand-900 hover:bg-brand-200',
                day_hidden: 'invisible',
              }}
              components={{
                IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
                IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
              }}
              disabled={{ after: new Date() }} // Disable future dates
            />
            
            {selectedRange?.from && selectedRange?.to && (
              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 text-xs text-slate-600">
                <span>Período selecionado:</span>
                <span className="font-medium">
                  {formatDateRange({
                    start: selectedRange.from.toISOString(),
                    end: selectedRange.to.toISOString(),
                  })}
                </span>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
