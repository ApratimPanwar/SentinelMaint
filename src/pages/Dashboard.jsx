import { useState } from 'react';
import {
  Thermometer, Waves, Gauge, Clock, AlertTriangle, CheckCircle2,
  XCircle, Activity, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart,
} from 'recharts';
import { machines, alerts } from '../data/mockData';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import HealthBar from '../components/HealthBar';
import PageHeader from '../components/PageHeader';

const timeLabels = ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h'];

function SensorMini({ data, color, label, value, unit, icon: Icon }) {
  const chartData = data.map((v, i) => ({ t: timeLabels[i], v }));
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={13} color="#64748b" />
        <span style={{ fontSize: 10, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>
        {value}<span style={{ fontSize: 11, color: '#64748b', marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ height: 40, marginTop: 6 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#grad-${label})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function MachineCard({ machine, selected, onSelect }) {
  const isSelected = selected?.id === machine.id;
  return (
    <Card
      glow={isSelected}
      onClick={() => onSelect(machine)}
      style={{
        cursor: 'pointer',
        animation: 'slideIn 0.3s ease',
        border: isSelected ? '1px solid rgba(34,197,94,0.4)' : undefined,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{machine.id}</div>
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{machine.name}</div>
        </div>
        <StatusBadge status={machine.status} />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", minWidth: 28 }}>{machine.health}%</span>
        <div style={{ flex: 1 }}><HealthBar value={machine.health} /></div>
      </div>
      <div style={{ fontSize: 10, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginTop: 6 }}>
        {machine.location} &nbsp;|&nbsp; {machine.runtime}h runtime
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const [selected, setSelected] = useState(machines[0]);

  const statusCounts = {
    healthy: machines.filter(m => m.status === 'healthy').length,
    warning: machines.filter(m => m.status === 'warning').length,
    critical: machines.filter(m => m.status === 'critical').length,
    offline: machines.filter(m => m.status === 'offline').length,
  };

  const critAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  return (
    <div>
      <PageHeader title="Machine Health Dashboard" subtitle="Real-time fleet monitoring &amp; predictive diagnostics" />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Healthy', value: statusCounts.healthy, icon: CheckCircle2, color: '#22c55e' },
          { label: 'Warning', value: statusCounts.warning, icon: AlertTriangle, color: '#f59e0b' },
          { label: 'Critical', value: statusCounts.critical, icon: XCircle, color: '#ef4444' },
          { label: 'Active Alerts', value: critAlerts, icon: Activity, color: '#3b82f6' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: `${kpi.color}15`, border: `1px solid ${kpi.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <kpi.icon size={18} color={kpi.color} />
              </div>
              <div>
                <div style={{ fontSize: 24, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: kpi.color }}>
                  {kpi.value}
                </div>
                <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                  {kpi.label}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Machine grid + detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Machine list */}
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Fleet Status ({machines.length} machines)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 'calc(100vh - 340px)', overflowY: 'auto', paddingRight: 4 }}>
            {machines.map(m => (
              <MachineCard key={m.id} machine={m} selected={selected} onSelect={setSelected} />
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div>
          <div style={{ fontSize: 12, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
            Sensor Detail — {selected.id}
          </div>
          <Card glow style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" }}>{selected.name}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{selected.type} — {selected.location}</div>
              </div>
              <StatusBadge status={selected.status} size="md" />
            </div>

            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              <SensorMini data={selected.sensors.temp} color="#f59e0b" label="Temp" value={selected.temperature} unit="°C" icon={Thermometer} />
              <SensorMini data={selected.sensors.vib} color="#ef4444" label="Vibration" value={selected.vibration} unit="mm/s" icon={Waves} />
              <SensorMini data={selected.sensors.rpm} color="#3b82f6" label="RPM" value={selected.rpm} unit="" icon={Gauge} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              {[
                { label: 'Health Score', val: `${selected.health}%` },
                { label: 'Runtime', val: `${selected.runtime}h` },
                { label: 'Last Service', val: selected.lastService },
              ].map(item => (
                <div key={item.label} style={{
                  background: '#0d1117', borderRadius: 6, padding: '10px 12px',
                  border: '1px solid #1e293b',
                }}>
                  <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: '#e2e8f0' }}>{item.val}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Trend chart */}
          <Card>
            <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
              8-Hour Temperature Trend
            </div>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={selected.sensors.temp.map((v, i) => ({ t: timeLabels[i], temp: v }))}>
                  <defs>
                    <linearGradient id="tempGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} width={35} />
                  <Tooltip
                    contentStyle={{ background: '#131920', border: '1px solid #1e293b', borderRadius: 6, fontSize: 11, fontFamily: "'JetBrains Mono', monospace" }}
                    labelStyle={{ color: '#64748b' }}
                    itemStyle={{ color: '#f59e0b' }}
                  />
                  <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={2} fill="url(#tempGrad)" dot={{ r: 3, fill: '#f59e0b', stroke: '#0a0e14', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
