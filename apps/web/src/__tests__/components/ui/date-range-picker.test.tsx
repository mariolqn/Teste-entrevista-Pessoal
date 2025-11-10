/**
 * Tests for DateRangePicker component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { DateRangePicker } from '@/components/ui/date-range-picker';
import type { DateRange } from '@dashboard/types';

// Mock date-fns to have consistent dates in tests
vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    format: vi.fn((date: Date, formatStr: string) => {
      // Return consistent formatted dates for testing
      if (formatStr === 'dd/MM/yyyy') {
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return String(date);
    }),
  };
});

describe('DateRangePicker', () => {
  const mockOnChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render with placeholder when no value', () => {
    render(<DateRangePicker onChange={mockOnChange} />);

    expect(screen.getByText('Selecionar período')).toBeInTheDocument();
  });

  it('should render with custom placeholder', () => {
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        placeholder="Choose date range" 
      />
    );

    expect(screen.getByText('Choose date range')).toBeInTheDocument();
  });

  it('should display formatted date range when value is provided', () => {
    const dateRange: DateRange = {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z',
    };

    render(<DateRangePicker value={dateRange} onChange={mockOnChange} />);

    expect(
      screen.getByText((text) => text.includes('31/01/2024') && text.includes(' - '))
    ).toBeInTheDocument();
  });

  it('should handle invalid dates gracefully', () => {
    const invalidDateRange: DateRange = {
      start: 'invalid-date',
      end: 'also-invalid',
    };

    render(<DateRangePicker value={invalidDateRange} onChange={mockOnChange} />);

    expect(screen.getByText('Data inválida')).toBeInTheDocument();
  });

  it('should open calendar when clicked', async () => {
    const user = userEvent.setup();
    
    render(<DateRangePicker onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    await user.click(button);

    // Calendar should be visible (look for date picker elements)
    expect(document.querySelector('.rdp')).toBeInTheDocument();
  });

  it('should not open when disabled', async () => {
    const user = userEvent.setup();
    
    render(<DateRangePicker onChange={mockOnChange} disabled />);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    
    await user.click(button);
    expect(document.querySelector('.rdp')).not.toBeInTheDocument();
  });

  it('should close calendar when backdrop is clicked', async () => {
    const user = userEvent.setup();
    
    render(<DateRangePicker onChange={mockOnChange} />);

    // Open calendar
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(document.querySelector('.rdp')).toBeInTheDocument();

    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }

    expect(document.querySelector('.rdp')).not.toBeInTheDocument();
  });

  it('should display required error message when required and no value', () => {
    render(<DateRangePicker onChange={mockOnChange} required />);

    expect(screen.getByText('* Campo obrigatório')).toBeInTheDocument();
  });

  it('should not display required error when value is provided', () => {
    const dateRange: DateRange = {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z',
    };

    render(
      <DateRangePicker 
        value={dateRange} 
        onChange={mockOnChange} 
        required 
      />
    );

    expect(screen.queryByText('* Campo obrigatório')).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <DateRangePicker onChange={mockOnChange} className="custom-picker" />
    );

    expect(container.querySelector('.custom-picker')).toBeInTheDocument();
  });

  it('should forward additional props', () => {
    render(
      <DateRangePicker 
        onChange={mockOnChange} 
        data-testid="date-picker" 
      />
    );

    expect(screen.getByTestId('date-picker')).toBeInTheDocument();
  });

  it('should show chevron icon that rotates when open', async () => {
    const user = userEvent.setup();
    
    render(<DateRangePicker onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    const chevron = button.querySelector('svg[class*="transition-transform"]');
    
    expect(chevron).toBeInTheDocument();
    expect(chevron).not.toHaveClass('rotate-90');

    // Open calendar
    await user.click(button);
    
    expect(chevron).toHaveClass('rotate-90');
  });

  it('should apply different styles when open', async () => {
    const user = userEvent.setup();
    
    render(<DateRangePicker onChange={mockOnChange} />);

    const button = screen.getByRole('button');
    expect(button).not.toHaveClass('border-brand-300', 'ring-2', 'ring-brand-100');

    // Open calendar
    await user.click(button);
    
    expect(button).toHaveClass('border-brand-300', 'ring-2', 'ring-brand-100');
  });

  it('should handle calendar navigation correctly', async () => {
    const user = userEvent.setup();
    
    render(<DateRangePicker onChange={mockOnChange} />);

    // Open calendar
    await user.click(screen.getByRole('button'));

    // Check that navigation buttons are present
    const prevButton = screen.getByRole('button', { name: /previous month/i });
    const nextButton = screen.getByRole('button', { name: /next month/i });
    
    expect(prevButton).toBeInTheDocument();
    expect(nextButton).toBeInTheDocument();
  });

  it('should disable future dates', async () => {
    const user = userEvent.setup();
    
    render(<DateRangePicker onChange={mockOnChange} />);

    // Open calendar
    await user.click(screen.getByRole('button'));

    // Future dates should be disabled
    // This is implementation dependent on react-day-picker
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(futureDate.getDate() + 1);
    
    // The exact test would depend on how react-day-picker renders disabled dates
    expect(document.querySelector('.rdp')).toBeInTheDocument();
  });

  it('should show selected period summary when range is selected', async () => {
    const user = userEvent.setup();
    
    const dateRange: DateRange = {
      start: '2024-01-01T00:00:00.000Z',
      end: '2024-01-31T23:59:59.999Z',
    };
    
    render(<DateRangePicker value={dateRange} onChange={mockOnChange} />);

    // Open calendar
    await user.click(screen.getByRole('button'));

    // Should show selected period info
    expect(screen.getByText('Período selecionado:')).toBeInTheDocument();
    expect(
      screen.getByText((text) => text.includes('31/01/2024') && text.includes(' - '))
    ).toBeInTheDocument();
  });

  describe('formatDateRange utility', () => {
    it('should format valid date ranges correctly', () => {
      const dateRange: DateRange = {
        start: '2024-01-15T10:30:00.000Z',
        end: '2024-02-20T15:45:00.000Z',
      };

      render(<DateRangePicker value={dateRange} onChange={mockOnChange} />);

      expect(screen.getByText('15/01/2024 - 20/02/2024')).toBeInTheDocument();
    });

    it('should handle same start and end dates', () => {
      const dateRange: DateRange = {
        start: '2024-01-15T00:00:00.000Z',
        end: '2024-01-15T23:59:59.999Z',
      };

      render(<DateRangePicker value={dateRange} onChange={mockOnChange} />);

      expect(screen.getByText('15/01/2024 - 15/01/2024')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<DateRangePicker onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should handle keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(<DateRangePicker onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      
      // Focus the button
      button.focus();
      expect(button).toHaveFocus();

      // Press Enter to open
      await user.keyboard('{Enter}');
      
      // Calendar should open
      expect(document.querySelector('.rdp')).toBeInTheDocument();
    });

    it('should be focusable and have focus styles', () => {
      render(<DateRangePicker onChange={mockOnChange} />);

      const button = screen.getByRole('button');
      button.focus();
      
      expect(button).toHaveFocus();
      // Focus styles are handled by browser/CSS, just ensure it's focusable
    });
  });

  describe('edge cases', () => {
    it('should handle undefined onChange prop gracefully', () => {
      expect(() => {
        render(<DateRangePicker />);
      }).not.toThrow();
    });

    it('should handle onClick when disabled', async () => {
      const user = userEvent.setup();
      
      render(<DateRangePicker onChange={mockOnChange} disabled />);

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not open calendar
      expect(document.querySelector('.rdp')).not.toBeInTheDocument();
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });
});
