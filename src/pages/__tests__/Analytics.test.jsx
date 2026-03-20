import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import Analytics from '../Analytics';

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  AreaChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  ComposedChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  Tooltip: () => null,
  CartesianGrid: () => null,
  Cell: () => null,
}));

describe('Analytics', () => {
  it('renders the page header', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText('Analytics & MTBF')).toBeInTheDocument();
  });

  it('displays MTBF KPI', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText('395h')).toBeInTheDocument();
    expect(screen.getByText('MTBF (Current)')).toBeInTheDocument();
  });

  it('displays MTTR KPI', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText('6.8h')).toBeInTheDocument();
    expect(screen.getByText('MTTR (Current)')).toBeInTheDocument();
  });

  it('displays failure distribution', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText('Bearing')).toBeInTheDocument();
    expect(screen.getByText('Electrical')).toBeInTheDocument();
    expect(screen.getByText('Hydraulic')).toBeInTheDocument();
  });

  it('displays reliability insights', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText(/Bearing failures account for 28%/)).toBeInTheDocument();
    expect(screen.getByText(/MTBF trending upward/)).toBeInTheDocument();
  });
});
