import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import HistoryLog from '../HistoryLog';

describe('HistoryLog', () => {
  it('renders the page header', () => {
    renderWithRouter(<HistoryLog />);
    expect(screen.getByText('Maintenance History')).toBeInTheDocument();
  });

  it('displays summary cards', () => {
    renderWithRouter(<HistoryLog />);
    expect(screen.getByText('Total Orders')).toBeInTheDocument();
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText('Total Downtime')).toBeInTheDocument();
    expect(screen.getByText('Avg Downtime')).toBeInTheDocument();
  });

  it('renders the history table with work orders', () => {
    renderWithRouter(<HistoryLog />);
    expect(screen.getByText('WO-2026-0041')).toBeInTheDocument();
    expect(screen.getByText('WO-2026-0038')).toBeInTheDocument();
  });

  it('filters by search query', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HistoryLog />);

    const searchInput = screen.getByPlaceholderText('Search orders...');
    await user.type(searchInput, 'Kowalski');

    expect(screen.getByText('WO-2026-0041')).toBeInTheDocument();
    expect(screen.getByText('WO-2026-0038')).toBeInTheDocument();
    expect(screen.queryByText('WO-2026-0035')).not.toBeInTheDocument();
  });

  it('filters by maintenance type', async () => {
    const user = userEvent.setup();
    renderWithRouter(<HistoryLog />);

    // The type filter renders Corrective as a button
    const correctiveBtn = screen.getByRole('button', { name: 'Corrective' });
    await user.click(correctiveBtn);

    // Corrective orders should remain
    expect(screen.getByText('WO-2026-0038')).toBeInTheDocument();
    // Preventive orders should be hidden
    expect(screen.queryByText('WO-2026-0041')).not.toBeInTheDocument();
  });
});
