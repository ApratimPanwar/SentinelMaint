import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import HealthBar from '../HealthBar';

describe('HealthBar', () => {
  it('renders with correct width for health value', () => {
    const { container } = render(<HealthBar value={75} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('75%');
  });

  it('uses green color for healthy values (>=80)', () => {
    const { container } = render(<HealthBar value={90} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.background).toMatch(/rgb\(34,?\s*197,?\s*94\)/);
  });

  it('uses amber color for warning values (50-79)', () => {
    const { container } = render(<HealthBar value={60} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.background).toMatch(/rgb\(245,?\s*158,?\s*11\)/);
  });

  it('uses red color for critical values (<50)', () => {
    const { container } = render(<HealthBar value={30} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.background).toMatch(/rgb\(239,?\s*68,?\s*68\)/);
  });

  it('handles zero value', () => {
    const { container } = render(<HealthBar value={0} />);
    const bar = container.firstChild.firstChild;
    expect(bar.style.width).toBe('0%');
    expect(bar.style.background).toMatch(/rgb\(55,?\s*65,?\s*81\)/);
  });

  it('accepts custom height', () => {
    const { container } = render(<HealthBar value={50} height={10} />);
    const outer = container.firstChild;
    expect(outer.style.height).toBe('10px');
  });
});
