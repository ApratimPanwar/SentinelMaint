import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import WorkOrders from '../WorkOrders';

describe('WorkOrders', () => {
  it('renders the page header', () => {
    renderWithRouter(<WorkOrders />);
    expect(screen.getByText('Work Order Entry')).toBeInTheDocument();
  });

  it('shows validation errors when submitting empty form', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WorkOrders />);

    await user.click(screen.getByText('Submit Work Order'));

    expect(screen.getByText('Machine ID is required')).toBeInTheDocument();
    expect(screen.getByText('Fault code is required')).toBeInTheDocument();
    expect(screen.getByText('Technician must be assigned')).toBeInTheDocument();
    expect(screen.getByText('Estimated downtime is required')).toBeInTheDocument();
    expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
  });

  it('validates estimated downtime must be a positive number', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WorkOrders />);

    const downtimeInput = screen.getByPlaceholderText('e.g. 4');
    await user.type(downtimeInput, '-5');
    await user.click(screen.getByText('Submit Work Order'));

    expect(screen.getByText('Must be a positive number (hours)')).toBeInTheDocument();
  });

  it('validates description minimum length', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WorkOrders />);

    const descInput = screen.getByPlaceholderText(/Describe the issue/);
    await user.type(descInput, 'Short');
    await user.click(screen.getByText('Submit Work Order'));

    expect(screen.getByText('Description must be at least 10 characters')).toBeInTheDocument();
  });

  it('clears error on field change', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WorkOrders />);

    await user.click(screen.getByText('Submit Work Order'));
    expect(screen.getByText('Estimated downtime is required')).toBeInTheDocument();

    const downtimeInput = screen.getByPlaceholderText('e.g. 4');
    await user.type(downtimeInput, '4');
    expect(screen.queryByText('Estimated downtime is required')).not.toBeInTheDocument();
  });

  it('resets form when Reset is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<WorkOrders />);

    const downtimeInput = screen.getByPlaceholderText('e.g. 4');
    await user.type(downtimeInput, '10');
    expect(downtimeInput).toHaveValue(10);

    await user.click(screen.getByText('Reset'));
    expect(downtimeInput).toHaveValue(null);
  });

  it('shows empty state for submitted orders', () => {
    renderWithRouter(<WorkOrders />);
    expect(screen.getByText('No work orders submitted this session.')).toBeInTheDocument();
  });
});
