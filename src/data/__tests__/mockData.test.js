import { describe, it, expect } from 'vitest';
import {
  machines, alerts, faultCodes, technicians,
  maintenanceHistory, mtbfData, downtimeByMachine, failureDistribution,
} from '../mockData';

describe('mockData', () => {
  it('has 8 machines', () => {
    expect(machines).toHaveLength(8);
  });

  it('all machines have required fields', () => {
    machines.forEach(m => {
      expect(m).toHaveProperty('id');
      expect(m).toHaveProperty('name');
      expect(m).toHaveProperty('status');
      expect(m).toHaveProperty('health');
      expect(m).toHaveProperty('sensors');
      expect(m.sensors).toHaveProperty('temp');
      expect(m.sensors).toHaveProperty('vib');
      expect(m.sensors).toHaveProperty('rpm');
    });
  });

  it('machines have valid status values', () => {
    const validStatuses = ['healthy', 'warning', 'critical', 'offline'];
    machines.forEach(m => {
      expect(validStatuses).toContain(m.status);
    });
  });

  it('has alerts with severity levels', () => {
    expect(alerts.length).toBeGreaterThan(0);
    alerts.forEach(a => {
      expect(['critical', 'warning', 'info']).toContain(a.severity);
    });
  });

  it('has fault codes', () => {
    expect(faultCodes.length).toBeGreaterThan(0);
    faultCodes.forEach(f => {
      expect(f).toHaveProperty('code');
      expect(f).toHaveProperty('description');
    });
  });

  it('has technicians', () => {
    expect(technicians.length).toBeGreaterThan(0);
    technicians.forEach(t => {
      expect(t).toHaveProperty('id');
      expect(t).toHaveProperty('name');
      expect(t).toHaveProperty('specialty');
    });
  });

  it('has maintenance history records', () => {
    expect(maintenanceHistory.length).toBeGreaterThan(0);
  });

  it('has MTBF analytics data', () => {
    expect(mtbfData.length).toBe(7);
    mtbfData.forEach(d => {
      expect(d).toHaveProperty('month');
      expect(d).toHaveProperty('mtbf');
      expect(d).toHaveProperty('mttr');
      expect(d).toHaveProperty('failures');
    });
  });

  it('failure distribution percentages sum close to 100', () => {
    const sum = failureDistribution.reduce((s, f) => s + f.pct, 0);
    expect(sum).toBe(100);
  });
});
