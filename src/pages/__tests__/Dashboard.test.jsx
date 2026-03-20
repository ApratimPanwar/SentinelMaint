import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import Dashboard from '../Dashboard';

// Mock recharts to avoid SVG rendering issues in jsdom
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
}));

describe('Dashboard', () => {
  it('renders the page header', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('Machine Health Dashboard')).toBeInTheDocument();
  });

  it('displays all KPI cards', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('Healthy')).toBeInTheDocument();
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('Critical')).toBeInTheDocument();
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
  });

  it('renders machine cards with IDs', () => {
    renderWithRouter(<Dashboard />);
    expect(screen.getByText('CNC-4501')).toBeInTheDocument();
    expect(screen.getByText('HYD-2201')).toBeInTheDocument();
  });

  it('shows sensor detail for first machine by default', () => {
    renderWithRouter(<Dashboard />);
    // CNC Lathe Alpha appears in both the card and detail panel
    const matches = screen.getAllByText('CNC Lathe Alpha');
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it('updates sensor detail when a machine card is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Dashboard />);

    // Click on the Hydraulic Press card — it appears once in the grid
    const pressCards = screen.getAllByText('Hydraulic Press Charlie');
    await user.click(pressCards[0]);

    // After click, Hydraulic Press Charlie should appear in both grid card + detail panel
    const afterClick = screen.getAllByText('Hydraulic Press Charlie');
    expect(afterClick.length).toBeGreaterThanOrEqual(2);
  });
});
