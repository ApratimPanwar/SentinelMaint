import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatusBadge from '../StatusBadge';

describe('StatusBadge', () => {
  it('renders the status text', () => {
    render(<StatusBadge status="healthy" />);
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('renders with green color for healthy status', () => {
    const { container } = render(<StatusBadge status="healthy" />);
    const badge = container.firstChild;
    expect(badge.style.color).toMatch(/rgb\(74,?\s*222,?\s*128\)/);
  });

  it('renders with red color for critical status', () => {
    const { container } = render(<StatusBadge status="critical" />);
    const badge = container.firstChild;
    expect(badge.style.color).toMatch(/rgb\(248,?\s*113,?\s*113\)/);
  });

  it('renders with warning color for warning status', () => {
    const { container } = render(<StatusBadge status="warning" />);
    const badge = container.firstChild;
    expect(badge.style.color).toMatch(/rgb\(251,?\s*191,?\s*36\)/);
  });

  it('renders with blue color for info status', () => {
    const { container } = render(<StatusBadge status="info" />);
    const badge = container.firstChild;
    expect(badge.style.color).toMatch(/rgb\(96,?\s*165,?\s*250\)/);
  });

  it('falls back to info style for unknown status', () => {
    const { container } = render(<StatusBadge status="unknown" />);
    const badge = container.firstChild;
    expect(badge.style.color).toMatch(/rgb\(96,?\s*165,?\s*250\)/);
  });

  it('renders with md size when specified', () => {
    const { container } = render(<StatusBadge status="healthy" size="md" />);
    const badge = container.firstChild;
    expect(badge.style.padding).toBe('4px 12px');
  });
});
