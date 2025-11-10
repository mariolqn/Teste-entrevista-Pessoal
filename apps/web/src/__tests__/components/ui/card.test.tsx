/**
 * Tests for Card components
 */

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

describe('Card', () => {
  it('should render children correctly', () => {
    render(
      <Card>
        <div>Test Content</div>
      </Card>
    );

    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<Card>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveClass(
      'rounded-3xl',
      'border',
      'border-slate-200',
      'bg-white/90',
      'shadow-card',
      'backdrop-blur-sm',
      'transition-shadow'
    );
  });

  it('should apply hover classes', () => {
    const { container } = render(<Card>Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveClass('hover:shadow-lg');
  });

  it('should merge custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    const cardElement = container.firstChild as HTMLElement;

    expect(cardElement).toHaveClass('custom-class');
    expect(cardElement).toHaveClass('rounded-3xl'); // Should keep default classes
  });

  it('should render as a div element', () => {
    const { container } = render(<Card>Content</Card>);
    
    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});

describe('CardHeader', () => {
  it('should render children correctly', () => {
    render(
      <CardHeader>
        <span>Header Content</span>
      </CardHeader>
    );

    expect(screen.getByText('Header Content')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardHeader>Content</CardHeader>);
    const headerElement = container.firstChild as HTMLElement;

    expect(headerElement).toHaveClass(
      'flex',
      'flex-col',
      'gap-2',
      'px-6',
      'pt-6'
    );
  });

  it('should merge custom className', () => {
    const { container } = render(<CardHeader className="custom-header">Content</CardHeader>);
    const headerElement = container.firstChild as HTMLElement;

    expect(headerElement).toHaveClass('custom-header');
    expect(headerElement).toHaveClass('flex'); // Should keep default classes
  });
});

describe('CardTitle', () => {
  it('should render children correctly', () => {
    render(<CardTitle>Test Title</CardTitle>);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    const titleElement = container.firstChild as HTMLElement;

    expect(titleElement).toHaveClass(
      'text-sm',
      'font-semibold',
      'uppercase',
      'tracking-wide',
      'text-slate-500'
    );
  });

  it('should render as h3 element', () => {
    const { container } = render(<CardTitle>Title</CardTitle>);
    
    expect(container.firstChild?.nodeName).toBe('H3');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardTitle className="custom-title">Title</CardTitle>);
    const titleElement = container.firstChild as HTMLElement;

    expect(titleElement).toHaveClass('custom-title');
    expect(titleElement).toHaveClass('text-sm'); // Should keep default classes
  });
});

describe('CardDescription', () => {
  it('should render children correctly', () => {
    render(<CardDescription>Test Description</CardDescription>);

    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    const descElement = container.firstChild as HTMLElement;

    expect(descElement).toHaveClass('text-sm', 'text-slate-500');
  });

  it('should render as p element', () => {
    const { container } = render(<CardDescription>Description</CardDescription>);
    
    expect(container.firstChild?.nodeName).toBe('P');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardDescription className="custom-desc">Description</CardDescription>);
    const descElement = container.firstChild as HTMLElement;

    expect(descElement).toHaveClass('custom-desc');
    expect(descElement).toHaveClass('text-sm'); // Should keep default classes
  });
});

describe('CardContent', () => {
  it('should render children correctly', () => {
    render(
      <CardContent>
        <p>Content text</p>
      </CardContent>
    );

    expect(screen.getByText('Content text')).toBeInTheDocument();
  });

  it('should apply default classes', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    const contentElement = container.firstChild as HTMLElement;

    expect(contentElement).toHaveClass('px-6', 'pb-6');
  });

  it('should merge custom className', () => {
    const { container } = render(<CardContent className="custom-content">Content</CardContent>);
    const contentElement = container.firstChild as HTMLElement;

    expect(contentElement).toHaveClass('custom-content');
    expect(contentElement).toHaveClass('px-6'); // Should keep default classes
  });

  it('should render as div element', () => {
    const { container } = render(<CardContent>Content</CardContent>);
    
    expect(container.firstChild?.nodeName).toBe('DIV');
  });
});

describe('Card composition', () => {
  it('should work well when composed together', () => {
    render(
      <Card className="test-card">
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>Overview of your data</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Chart content goes here</p>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your data')).toBeInTheDocument();
    expect(screen.getByText('Chart content goes here')).toBeInTheDocument();

    // Check that all components have their proper classes
    const cardElement = screen.getByText('Chart content goes here').closest('.test-card');
    expect(cardElement).toHaveClass('rounded-3xl');
    
    const titleElement = screen.getByText('Dashboard');
    expect(titleElement).toHaveClass('uppercase');
    
    const descElement = screen.getByText('Overview of your data');
    expect(descElement).toHaveClass('text-slate-500');
  });

  it('should support nested content structures', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Complex Card</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>Column 1</div>
            <div>Column 2</div>
          </div>
        </CardContent>
      </Card>
    );

    expect(screen.getByText('Column 1')).toBeInTheDocument();
    expect(screen.getByText('Column 2')).toBeInTheDocument();
  });
});
