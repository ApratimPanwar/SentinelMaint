import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { renderWithRouter } from '../../test/renderWithRouter';
import Alerts from '../Alerts';

describe('Alerts', () => {
  it('renders the page header', () => {
    renderWithRouter(<Alerts />);
    expect(screen.getByText('Active Alerts')).toBeInTheDocument();
  });

  it('renders all alert items', () => {
    renderWithRouter(<Alerts />);
    expect(screen.getByText('Bearing Failure Imminent')).toBeInTheDocument();
    expect(screen.getByText('Overtemperature')).toBeInTheDocument();
    expect(screen.getByText('Vibration Anomaly')).toBeInTheDocument();
  });

  it('shows ACKNOWLEDGE button for unacknowledged alerts', () => {
    renderWithRouter(<Alerts />);
    const ackButtons = screen.getAllByText('ACKNOWLEDGE');
    expect(ackButtons.length).toBeGreaterThan(0);
  });

  it('acknowledges an alert when ACKNOWLEDGE button is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Alerts />);

    const ackButtons = screen.getAllByText('ACKNOWLEDGE');
    const initialCount = ackButtons.length;
    await user.click(ackButtons[0]);

    const remaining = screen.queryAllByText('ACKNOWLEDGE');
    expect(remaining.length).toBe(initialCount - 1);
  });

  it('filters by critical severity', async () => {
    const user = userEvent.setup();
    renderWithRouter(<Alerts />);

    await user.click(screen.getByText(/^Critical/));
    expect(screen.getByText('Bearing Failure Imminent')).toBeInTheDocument();
    expect(screen.getByText('Overtemperature')).toBeInTheDocument();
    expect(screen.queryByText('Vibration Anomaly')).not.toBeInTheDocument();
  });
});
