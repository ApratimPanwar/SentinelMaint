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

  it('displays Fleet MTBF KPI', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText('801h')).toBeInTheDocument();
  });

  it('displays MTTR KPI', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText('MTTR (Current)')).toBeInTheDocument();
  });

  it('displays failure distribution from actual fault codes', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText('General Inspection')).toBeInTheDocument();
    expect(screen.getByText('Bearing Failure')).toBeInTheDocument();
    expect(screen.getByText('Electrical Fault')).toBeInTheDocument();
  });

  it('displays reliability insights', () => {
    renderWithRouter(<Analytics />);
    expect(screen.getByText(/failures account for/)).toBeInTheDocument();
    expect(screen.getByText(/average downtime/)).toBeInTheDocument();
  });
});
