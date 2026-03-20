import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import Card from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Test content</Card>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies glow border when glow prop is true', () => {
    const { container } = render(<Card glow>Glow card</Card>);
    const div = container.firstChild;
    expect(div.style.border).toMatch(/rgba\(34,?\s*197,?\s*94/);
  });

  it('calls onClick when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Card onClick={handleClick}>Clickable</Card>);
    await user.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('applies custom style', () => {
    const { container } = render(<Card style={{ padding: 32 }}>Styled</Card>);
    expect(container.firstChild.style.padding).toBe('32px');
  });
});
