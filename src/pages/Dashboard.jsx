import { useState, useEffect } from 'react';
import {
  Thermometer, Waves, Gauge, Clock, AlertTriangle, CheckCircle2,
  XCircle, Activity, Zap, Wind, Droplets, RotateCcw, ArrowRight,
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

// ── Machine-type sensor configurations ──
// Each machine type defines 3 sensors with label, unit, icon, color,
// and how to derive current value + chart data from the raw machine data.
function getSensorConfig(machine) {
  const t = machine.type;

  // Sensor 1 is always Temperature for every machine type
  const tempSensor = {
    label: 'Temp',
    unit: '°C',
    icon: Thermometer,
    color: '#f59e0b',
    value: machine.temperature,
    data: machine.sensors.temp,
  };

  if (t === 'CNC Lathe' || t === 'CNC Mill') {
    return [
      tempSensor,
      { label: 'Vibration', unit: 'mm/s', icon: Waves, color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
      { label: 'RPM', unit: '', icon: Gauge, color: '#3b82f6', value: machine.rpm, data: machine.sensors.rpm },
    ];
  }

  if (t === 'Hydraulic Press') {
    // rpm is 0 for hydraulic presses; reinterpret vib as vibration, derive pressure from status
    const pressureData = machine.status === 'critical'
      ? [210, 205, 198, 192, 185, 178, 170, 162]
      : machine.status === 'offline'
        ? [0, 0, 0, 0, 0, 0, 0, 0]
        : [180, 182, 184, 185, 185, 186, 185, 185];
    const pressureVal = pressureData[pressureData.length - 1];
    return [
      tempSensor,
      { label: 'Vibration', unit: 'mm/s', icon: Waves, color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
      { label: 'Pressure', unit: 'bar', icon: Gauge, color: '#3b82f6', value: pressureVal, data: pressureData },
    ];
  }

  if (t === 'Robotic Arm') {
    // Reinterpret rpm as Joint Load % (scale: value/maxRpm*100), vib as Accuracy mm
    const maxRpm = 1500;
    const jointLoadData = machine.sensors.rpm.map(v => Math.round((v / maxRpm) * 100));
    const jointLoadVal = machine.rpm > 0 ? Math.round((machine.rpm / maxRpm) * 100) : 0;
    return [
      tempSensor,
      { label: 'Joint Load', unit: '%', icon: RotateCcw, color: '#ef4444', value: jointLoadVal, data: jointLoadData },
      { label: 'Cycle Count', unit: '', icon: Activity, color: '#3b82f6', value: Math.round(machine.runtime * 12), data: machine.sensors.rpm.map((_, i) => Math.round(machine.runtime * 12 - (7 - i) * 40)) },
    ];
  }

  if (t === 'Compressor') {
    // Reinterpret rpm as PSI
    const psiData = machine.sensors.rpm.map(v => Math.round(v * 0.07));
    const psiVal = Math.round(machine.rpm * 0.07);
    return [
      tempSensor,
      { label: 'Vibration', unit: 'mm/s', icon: Waves, color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
      { label: 'PSI', unit: '', icon: Wind, color: '#3b82f6', value: psiVal, data: psiData },
    ];
  }

  if (t === 'Conveyor') {
    // rpm -> Belt Speed m/s, vib -> Load kg
    const beltData = machine.sensors.rpm.map(v => +(v * 0.002).toFixed(1));
    const beltVal = +(machine.rpm * 0.002).toFixed(1);
    const loadData = machine.sensors.vib.map(v => Math.round(v * 350));
    const loadVal = Math.round(machine.vibration * 350);
    return [
      tempSensor,
      { label: 'Belt Speed', unit: 'm/s', icon: ArrowRight, color: '#ef4444', value: beltVal, data: beltData },
      { label: 'Load', unit: 'kg', icon: Gauge, color: '#3b82f6', value: loadVal, data: loadData },
    ];
  }

  if (t === 'Welder') {
    // vib -> Arc Current A (multiply by 50), rpm -> Wire Feed m/min
    const arcData = machine.sensors.vib.map(v => Math.round(v * 50));
    const arcVal = Math.round(machine.vibration * 50);
    const wireData = machine.sensors.rpm.map(v => +(v === 0 ? machine.sensors.vib[machine.sensors.vib.length - 1] * 3.2 : v * 0.004).toFixed(1));
    const wireVal = +(machine.vibration * 3.2).toFixed(1);
    return [
      tempSensor,
      { label: 'Arc Current', unit: 'A', icon: Zap, color: '#ef4444', value: arcVal, data: arcData },
      { label: 'Wire Feed', unit: 'm/min', icon: Activity, color: '#3b82f6', value: wireVal, data: wireData },
    ];
  }

  if (t === 'Pump') {
    // rpm -> Flow Rate L/min
    const flowData = machine.sensors.rpm.map(v => Math.round(v * 0.05));
    const flowVal = Math.round(machine.rpm * 0.05);
    return [
      tempSensor,
      { label: 'Vibration', unit: 'mm/s', icon: Waves, color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
      { label: 'Flow Rate', unit: 'L/min', icon: Droplets, color: '#3b82f6', value: flowVal, data: flowData },
    ];
  }

  // Fallback: generic 3 sensors
  return [
    tempSensor,
    { label: 'Vibration', unit: 'mm/s', icon: Waves, color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
    { label: 'RPM', unit: '', icon: Gauge, color: '#3b82f6', value: machine.rpm, data: machine.sensors.rpm },
  ];
}

// ── Helper: days until a date from today ──
function daysUntil(dateStr) {
  const now = new Date();
  const target = new Date(dateStr);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff;
}

// ── Estimate task ETA based on status ──
function getTaskEta(machine) {
  if (machine.status === 'offline') return 'Awaiting parts';
  if (machine.status === 'critical') return '< 24 hours';
  if (machine.status === 'warning') return '3-5 days';
  return 'On schedule';
}

// ── Live Clock Component ──
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hh = String(time.getHours()).padStart(2, '0');
  const mm = String(time.getMinutes()).padStart(2, '0');
  const ss = String(time.getSeconds()).padStart(2, '0');
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 48,
      fontWeight: 700,
      color: '#22c55e',
      textShadow: '0 0 20px rgba(34,197,94,0.6), 0 0 40px rgba(34,197,94,0.3), 0 0 80px rgba(34,197,94,0.15)',
      letterSpacing: 6,
      textAlign: 'center',
      padding: '12px 0 4px 0',
      userSelect: 'none',
    }}>
      {hh}:{mm}:{ss}
    </div>
  );
}

// ── Sensor Mini Chart ──
function SensorMini({ data, color, label, value, unit, icon: Icon }) {
  const chartData = data.map((v, i) => ({ t: timeLabels[i], v }));
  // Generate a unique gradient id per label+color to avoid collisions
  const gradId = `grad-${label.replace(/\s+/g, '')}-${color.replace('#', '')}`;
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
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gradId})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Machine Card ──
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

// ── Dashboard ──
export default function Dashboard() {
  const [selected, setSelected] = useState(machines[0]);

  const statusCounts = {
    healthy: machines.filter(m => m.status === 'healthy').length,
    warning: machines.filter(m => m.status === 'warning').length,
    critical: machines.filter(m => m.status === 'critical').length,
    offline: machines.filter(m => m.status === 'offline').length,
  };

  const critAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  const sensorConfig = getSensorConfig(selected);
  const daysToService = daysUntil(selected.nextService);
  const serviceLabel = daysToService < 0
    ? `${Math.abs(daysToService)}d overdue`
    : daysToService === 0
      ? 'Today'
      : `${daysToService}d`;
  const serviceColor = daysToService < 0 ? '#ef4444' : daysToService <= 7 ? '#f59e0b' : '#22c55e';

  return (
    <div>
      <PageHeader title="Machine Health Dashboard" subtitle="Real-time fleet monitoring &amp; predictive diagnostics" />

      {/* Live Clock */}
      <Card style={{ marginBottom: 16, padding: '4px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Clock size={20} color="#22c55e" style={{ opacity: 0.6 }} />
          <LiveClock />
        </div>
      </Card>

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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: 'calc(100vh - 400px)', overflowY: 'auto', paddingRight: 4 }}>
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

            {/* Machine-specific sensors */}
            <div style={{ display: 'flex', gap: 20, marginBottom: 16 }}>
              {sensorConfig.map(sensor => (
                <SensorMini
                  key={sensor.label}
                  data={sensor.data}
                  color={sensor.color}
                  label={sensor.label}
                  value={sensor.value}
                  unit={sensor.unit}
                  icon={sensor.icon}
                />
              ))}
            </div>

            {/* Info tiles: Health, Runtime, Last Service, Time to Next Service, Task ETA */}
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

            {/* Time to Next Service + Task ETA row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div style={{
                background: '#0d1117', borderRadius: 6, padding: '10px 12px',
                border: `1px solid ${serviceColor}30`,
              }}>
                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                  Time to Next Service
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: serviceColor }}>
                  {serviceLabel}
                </div>
                <div style={{ fontSize: 10, color: '#475569', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                  {selected.nextService}
                </div>
              </div>
              <div style={{
                background: '#0d1117', borderRadius: 6, padding: '10px 12px',
                border: '1px solid #1e293b',
              }}>
                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace", marginBottom: 4 }}>
                  Task ETA
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace", color: selected.status === 'critical' ? '#ef4444' : selected.status === 'warning' ? '#f59e0b' : '#e2e8f0' }}>
                  {getTaskEta(selected)}
                </div>
              </div>
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
