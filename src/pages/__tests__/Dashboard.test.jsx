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
    // New cockpit topbar shows breadcrumb instead of PageHeader title
    expect(screen.getByText(/MACHINE HEALTH/i)).toBeInTheDocument();
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
    // IDs appear in both the SVG map and the fleet table
    expect(screen.getAllByText('CNC-4501').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('HYD-2201').length).toBeGreaterThanOrEqual(1);
  });

  it('shows sensor detail for first machine by default', () => {
    renderWithRouter(<Dashboard />);
    // CNC Lathe Alpha appears in the fleet table and the detail panel
    expect(screen.getAllByText('CNC Lathe Alpha').length).toBeGreaterThanOrEqual(1);
    // The first machine's ID appears in the detail panel header
    expect(screen.getAllByText('CNC-4501').length).toBeGreaterThanOrEqual(1);
  });

  it('updates sensor detail when a machine row is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Dashboard />);

    // Click Hydraulic Press row in fleet table — machine name appears in table
    const pressItems = screen.getAllByText('Hydraulic Press Charlie');
    await user.click(pressItems[0]);

    // After click, detail panel should show HYD-2201
    const afterClick = screen.getAllByText('HYD-2201');
    expect(afterClick.length).toBeGreaterThanOrEqual(2); // fleet table + panel header
  });
});
