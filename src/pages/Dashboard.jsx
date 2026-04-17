import { useState, useEffect } from 'react';
import {
  Thermometer, Waves, Gauge, Clock, AlertTriangle, CheckCircle2,
  XCircle, Activity, Zap, Wind, Droplets, RotateCcw, ArrowRight,
  Cpu,
} from 'lucide-react';
import {
  Area, AreaChart, ResponsiveContainer,
} from 'recharts';
import { machines, alerts } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import HealthBar from '../components/HealthBar';
import WorkshopMap from '../components/WorkshopMap';
import { useAuth } from '../context/AuthContext';

const timeLabels = ['1h', '2h', '3h', '4h', '5h', '6h', '7h', '8h'];

// ── Machine-type sensor configurations (preserved from v1) ──
function getSensorConfig(machine) {
  const t = machine.type;
  const tempSensor = {
    label: 'Temp', unit: '°C', icon: Thermometer, color: '#f59e0b',
    value: machine.temperature, data: machine.sensors.temp,
  };
  if (t === 'CNC Lathe' || t === 'CNC Mill') return [
    tempSensor,
    { label: 'Vibration', unit: 'mm/s', icon: Waves,  color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
    { label: 'RPM',       unit: '',     icon: Gauge,   color: '#3b82f6', value: machine.rpm, data: machine.sensors.rpm },
  ];
  if (t === 'Hydraulic Press') {
    const pressureData = machine.status === 'critical'
      ? [210,205,198,192,185,178,170,162]
      : machine.status === 'offline' ? [0,0,0,0,0,0,0,0]
      : [180,182,184,185,185,186,185,185];
    return [
      tempSensor,
      { label: 'Vibration', unit: 'mm/s', icon: Waves,  color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
      { label: 'Pressure',  unit: 'bar',  icon: Gauge,   color: '#3b82f6', value: pressureData[pressureData.length-1], data: pressureData },
    ];
  }
  if (t === 'Robotic Arm') {
    const maxRpm = 1500;
    const jointData = machine.sensors.rpm.map(v => Math.round((v/maxRpm)*100));
    return [
      tempSensor,
      { label: 'Joint Load',   unit: '%', icon: RotateCcw, color: '#ef4444', value: machine.rpm > 0 ? Math.round((machine.rpm/maxRpm)*100) : 0, data: jointData },
      { label: 'Cycle Count',  unit: '',  icon: Activity,   color: '#3b82f6', value: Math.round(machine.runtime*12), data: machine.sensors.rpm.map((_,i)=>Math.round(machine.runtime*12-(7-i)*40)) },
    ];
  }
  if (t === 'Compressor') {
    const psiData = machine.sensors.rpm.map(v => Math.round(v*0.07));
    return [
      tempSensor,
      { label: 'Vibration', unit: 'mm/s', icon: Waves,  color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
      { label: 'PSI',       unit: '',     icon: Wind,   color: '#3b82f6', value: Math.round(machine.rpm*0.07), data: psiData },
    ];
  }
  if (t === 'Conveyor') {
    const beltData = machine.sensors.rpm.map(v => +(v*0.002).toFixed(1));
    const loadData  = machine.sensors.vib.map(v => Math.round(v*350));
    return [
      tempSensor,
      { label: 'Belt Speed', unit: 'm/s', icon: ArrowRight, color: '#ef4444', value: +(machine.rpm*0.002).toFixed(1), data: beltData },
      { label: 'Load',       unit: 'kg',  icon: Gauge,       color: '#3b82f6', value: Math.round(machine.vibration*350), data: loadData },
    ];
  }
  if (t === 'Welder') {
    const arcData  = machine.sensors.vib.map(v => Math.round(v*50));
    const wireData = machine.sensors.rpm.map(v => +(v===0 ? machine.sensors.vib[machine.sensors.vib.length-1]*3.2 : v*0.004).toFixed(1));
    return [
      tempSensor,
      { label: 'Arc Current', unit: 'A',     icon: Zap,      color: '#ef4444', value: Math.round(machine.vibration*50), data: arcData },
      { label: 'Wire Feed',   unit: 'm/min', icon: Activity, color: '#3b82f6', value: +(machine.vibration*3.2).toFixed(1), data: wireData },
    ];
  }
  if (t === 'Pump') {
    const flowData = machine.sensors.rpm.map(v => Math.round(v*0.05));
    return [
      tempSensor,
      { label: 'Vibration',  unit: 'mm/s',  icon: Waves,    color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
      { label: 'Flow Rate',  unit: 'L/min', icon: Droplets, color: '#3b82f6', value: Math.round(machine.rpm*0.05), data: flowData },
    ];
  }
  return [
    tempSensor,
    { label: 'Vibration', unit: 'mm/s', icon: Waves, color: '#ef4444', value: machine.vibration, data: machine.sensors.vib },
    { label: 'RPM',       unit: '',     icon: Gauge,  color: '#3b82f6', value: machine.rpm, data: machine.sensors.rpm },
  ];
}

function daysUntil(dateStr) {
  const diff = Math.ceil((new Date(dateStr) - new Date()) / (1000*60*60*24));
  return diff;
}
function getTaskEta(m) {
  if (m.status === 'offline')   return 'Awaiting parts';
  if (m.status === 'critical')  return '< 24 hours';
  if (m.status === 'warning')   return '3–5 days';
  return 'On schedule';
}

// ── Live Clock ──
function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const id = setInterval(()=>setTime(new Date()), 1000); return ()=>clearInterval(id); }, []);
  const p = n => String(n).padStart(2,'0');
  return (
    <div style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 28, fontWeight: 700,
      color: 'var(--status-ok)',
      textShadow: '0 0 12px rgba(34,197,94,0.5), 0 0 24px rgba(34,197,94,0.2)',
      letterSpacing: 4,
      userSelect: 'none',
      lineHeight: 1,
    }}>
      {p(time.getHours())}:{p(time.getMinutes())}:{p(time.getSeconds())}
    </div>
  );
}

// ── Sparkline mini chart ──
function Sparkline({ data, stroke = 'var(--status-ok)', fill, w = 180, h = 36 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const rng = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v,i) => `${(i*step).toFixed(1)},${(h - ((v-min)/rng*h)).toFixed(1)}`).join(' ');
  const area = `0,${h} ${pts} ${w},${h}`;
  const f = fill || (stroke + '22');
  return (
    <svg width={w} height={h} style={{ display:'block', overflow:'visible' }}>
      <polygon points={area} fill={f} />
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth="1.4"
        style={{ filter: `drop-shadow(0 0 2px ${stroke})` }} />
    </svg>
  );
}

// ── Sensor row ──
function SensorMini({ data, color, label, value, unit, icon: Icon }) {
  const chartData = data.map((v, i) => ({ t: timeLabels[i], v }));
  const gradId = `dash-grad-${label.replace(/\s+/g,'')}`;
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:4 }}>
        <Icon size={12} color="var(--text-muted)" />
        <span style={{ fontSize:9, color:'var(--text-muted)', fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', letterSpacing:1 }}>{label}</span>
      </div>
      <div style={{ fontSize:18, fontWeight:700, color, fontFamily:"'JetBrains Mono',monospace", lineHeight:1 }}>
        {value}<span style={{ fontSize:10, color:'var(--text-muted)', marginLeft:2 }}>{unit}</span>
      </div>
      <div style={{ height:36, marginTop:5 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.25} />
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

// ── Stat tile ──
function StatTile({ label, value, color }) {
  return (
    <div style={{
      padding: '8px 10px',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)',
      borderRadius: 3,
    }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:3 }}>{label}</div>
      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:14, fontWeight:600, color: color || 'var(--text-primary)' }}>{value}</div>
    </div>
  );
}

// ── KPI card ──
function KpiCard({ label, value, sub, color, icon: Icon, spark }) {
  const c = color || 'var(--status-ok)';
  return (
    <div className="cockpit-panel" style={{ padding:12, display:'flex', flexDirection:'column', gap:6 }}>
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {Icon && (
          <div style={{ width:28, height:28, borderRadius:4, background:`${c}15`, border:`1px solid ${c}30`, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Icon size={14} color={c} />
          </div>
        )}
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)' }}>{label}</div>
      </div>
      <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:26, fontWeight:600, color:c, textShadow:`0 0 8px ${c}55`, lineHeight:1 }}>{value}</div>
        {sub && <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--text-muted)' }}>{sub}</div>}
      </div>
      {spark && <Sparkline data={spark} stroke={c} w={160} h={26} />}
    </div>
  );
}

// ── Dashboard ──
export default function Dashboard() {
  const [selectedId, setSelectedId] = useState(machines[0].id);
  const { user } = useAuth();

  const selected = machines.find(m => m.id === selectedId) || machines[0];
  const sensorConfig  = getSensorConfig(selected);
  const daysToService = daysUntil(selected.nextService);
  const serviceLabel  = daysToService < 0 ? `${Math.abs(daysToService)}d overdue` : daysToService === 0 ? 'Today' : `${daysToService}d`;
  const serviceColor  = daysToService < 0 ? '#ef4444' : daysToService <= 7 ? '#f59e0b' : 'var(--status-ok)';

  const statusCounts = {
    healthy:  machines.filter(m => m.status === 'healthy').length,
    warning:  machines.filter(m => m.status === 'warning').length,
    critical: machines.filter(m => m.status === 'critical').length,
    offline:  machines.filter(m => m.status === 'offline').length,
  };
  const critAlerts = alerts.filter(a => a.severity === 'critical' && !a.acknowledged).length;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:12, height:'calc(100vh - 48px)' }}>

      {/* ── Top bar: breadcrumb + clock + user ── */}
      <div style={{
        display:'flex', alignItems:'center', gap:16,
        padding:'10px 14px',
        background:'var(--bg-card)',
        border:'1px solid var(--border-primary)',
        borderRadius:3,
        flexShrink: 0,
        position: 'relative',
      }}
        className="cockpit-panel"
      >
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, letterSpacing:'0.18em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:2 }}>
            SYS / PLANT-07 / MACHINE HEALTH
          </div>
          <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:13, color:'var(--text-primary)', fontWeight:600 }}>
            Welcome, {user?.name || 'Operator'} —&nbsp;
            <span style={{ color:'var(--text-muted)', fontWeight:400, fontSize:12 }}>Real-time fleet monitoring &amp; predictive diagnostics</span>
          </div>
        </div>

        {/* Pill indicators */}
        <div style={{ display:'flex', gap:8 }}>
          {[
            { label:`${statusCounts.healthy} OK`,    c:'var(--status-ok)' },
            { label:`${statusCounts.warning} WARN`,  c:'var(--status-warn)' },
            { label:`${statusCounts.critical} CRIT`, c:'var(--status-critical)' },
          ].map(p => (
            <div key={p.label} style={{
              display:'flex', alignItems:'center', gap:5,
              padding:'3px 8px', borderRadius:2,
              border:`1px solid ${p.c}40`,
              background:`${p.c}0d`,
            }}>
              <span className="status-dot" style={{ background: p.c, boxShadow:`0 0 4px ${p.c}` }} />
              <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--text-secondary)', letterSpacing:'0.05em' }}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Live clock */}
        <div style={{ borderLeft:'1px solid var(--border-primary)', paddingLeft:16 }}>
          <LiveClock />
        </div>
      </div>

      {/* ── Main grid: left side (flex) + right detail panel ── */}
      <div style={{ flex:1, display:'flex', gap:12, overflow:'hidden', minHeight:0 }}>

        {/* ── Left: KPI row + Map + Fleet/Risk ── */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', gap:12, overflow:'hidden', minWidth:0 }}>

          {/* KPI row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, flexShrink:0 }}>
            <KpiCard label="Healthy"       value={statusCounts.healthy}  color="#22c55e" icon={CheckCircle2} />
            <KpiCard label="Warning"       value={statusCounts.warning}  color="#f59e0b" icon={AlertTriangle} sub={`${statusCounts.warning} units`} />
            <KpiCard label="Critical"      value={statusCounts.critical} color="#ef4444" icon={XCircle}      sub="action required" />
            <KpiCard label="Active Alerts" value={critAlerts}            color="#3b82f6" icon={Activity}     sub="unacknowledged" />
          </div>

          {/* Workshop Map */}
          <div className="cockpit-panel" style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:220 }}>
            <div className="panel-hdr">
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span className="status-dot ok" />
                <span>WORKSHOP MAP · PLANT-07</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--text-muted)', marginLeft:4 }}>Z-7 / FLOOR PLAN</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--text-muted)' }}>VIEW · FLOOR</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--status-ok)', textShadow:'0 0 4px rgba(34,197,94,0.5)' }}>● LIVE</span>
              </div>
            </div>
            <div style={{
              flex:1,
              position:'relative',
              background:'radial-gradient(ellipse at center, rgba(34,197,94,0.03), transparent 65%)',
              minHeight:0,
              padding:4,
            }}>
              <WorkshopMap
                machines={machines}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </div>

          {/* Fleet table + Risk forecast */}
          <div style={{ display:'grid', gridTemplateColumns:'3fr 1fr', gap:12, flexShrink:0, height:192, overflow:'hidden' }}>

            {/* Fleet table */}
            <div className="cockpit-panel" style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div className="panel-hdr">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="status-dot ok" />
                  <span>FLEET · LIVE STATUS</span>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--text-muted)' }}>{machines.length} UNITS</span>
                </div>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:'var(--text-muted)' }}>SORT · RISK</span>
              </div>
              <div style={{ flex:1, overflow:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>
                  <thead>
                    <tr>
                      {['ID','NAME','HEALTH','TEMP','VIB','STATUS'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'6px 10px', borderBottom:'1px solid var(--border-primary)', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:600, fontSize:10, letterSpacing:'0.1em', color:'var(--text-muted)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...machines].sort((a,b)=>a.health-b.health).map(m => {
                      const sel = m.id === selectedId;
                      return (
                        <tr key={m.id}
                          onClick={() => setSelectedId(m.id)}
                          style={{
                            cursor:'pointer',
                            background: sel ? 'rgba(34,197,94,0.06)' : 'transparent',
                            borderLeft: sel ? '2px solid var(--status-ok)' : '2px solid transparent',
                          }}
                        >
                          <td style={{ padding:'6px 10px', color:'var(--text-primary)', fontWeight:600 }}>{m.id}</td>
                          <td style={{ padding:'6px 10px', color:'var(--text-secondary)', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.name}</td>
                          <td style={{ padding:'6px 10px', color: m.health<50?'#ef4444':m.health<80?'#f59e0b':'var(--status-ok)' }}>{m.health}%</td>
                          <td style={{ padding:'6px 10px', color:'var(--text-secondary)' }}>{m.temperature}°</td>
                          <td style={{ padding:'6px 10px', color: m.vibration>5?'#ef4444':m.vibration>3?'#f59e0b':'var(--text-secondary)' }}>{m.vibration.toFixed(1)}</td>
                          <td style={{ padding:'6px 10px' }}><StatusBadge status={m.status} size="sm" /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Risk forecast */}
            <div className="cockpit-panel" style={{ display:'flex', flexDirection:'column', overflow:'hidden' }}>
              <div className="panel-hdr">
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span className="status-dot warn" />
                  <span>RISK · 72H</span>
                </div>
              </div>
              <div style={{ flex:1, overflow:'auto', padding:'10px 12px', display:'flex', flexDirection:'column', gap:8 }}>
                {[...machines]
                  .filter(m => m.status === 'critical' || m.status === 'warning')
                  .sort((a,b) => a.health - b.health)
                  .slice(0,4)
                  .map(m => {
                    const d = daysUntil(m.nextService);
                    const tc = m.status === 'critical' ? '#ef4444' : '#f59e0b';
                    return (
                      <div key={m.id}
                        onClick={() => setSelectedId(m.id)}
                        style={{ cursor:'pointer', padding:'6px 0', borderBottom:'1px solid var(--border-primary)' }}
                      >
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'var(--text-primary)', fontWeight:600 }}>{m.id}</span>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:tc }}>{d<0?`${Math.abs(d)}d OVR`:`${d}d`}</span>
                        </div>
                        <div style={{ height:4, background:'rgba(255,255,255,0.06)', borderRadius:1, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${m.health}%`, background:tc, borderRadius:1, boxShadow:`0 0 4px ${tc}` }} />
                        </div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:'var(--text-muted)', marginTop:3 }}>{m.health}% health</div>
                      </div>
                    );
                  })}
                {machines.filter(m=>m.status==='critical'||m.status==='warning').length === 0 && (
                  <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'var(--status-ok)', textAlign:'center', paddingTop:20 }}>
                    ✓ All clear
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Machine Detail Panel ── */}
        <div className="cockpit-panel" style={{ width:310, flexShrink:0, display:'flex', flexDirection:'column', overflow:'hidden' }}>
          <div className="panel-hdr">
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span className="status-dot" style={{
                background: selected.status==='critical'?'#ef4444':selected.status==='warning'?'#f59e0b':selected.status==='offline'?'#6b7280':'var(--status-ok)',
                boxShadow: `0 0 5px ${selected.status==='critical'?'#ef4444':selected.status==='warning'?'#f59e0b':'var(--status-ok)'}`,
              }} />
              <span>UNIT · {selected.id}</span>
            </div>
            <StatusBadge status={selected.status} size="sm" />
          </div>

          <div style={{ flex:1, overflow:'auto', padding:'12px 14px', display:'flex', flexDirection:'column', gap:12 }}>
            {/* Machine header */}
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:18, letterSpacing:'0.04em', color:'var(--text-primary)', lineHeight:1.2 }}>{selected.name}</div>
              <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{selected.type} · {selected.location}</div>
            </div>

            {/* Sensor mini charts */}
            <div style={{ display:'flex', gap:12 }}>
              {sensorConfig.map(s => (
                <SensorMini key={s.label} data={s.data} color={s.color} label={s.label} value={s.value} unit={s.unit} icon={s.icon} />
              ))}
            </div>

            {/* Vibration sparkline */}
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>
                VIBRATION · 8H ROLLING
              </div>
              <div style={{
                padding:8, background:'rgba(0,0,0,0.2)',
                border:'1px solid var(--border-primary)', borderRadius:3,
              }}>
                <Sparkline
                  data={selected.sensors.vib}
                  stroke={selected.status==='critical'?'#ef4444':selected.status==='warning'?'#f59e0b':'var(--status-ok)'}
                  w={260} h={48}
                />
              </div>
            </div>

            {/* Stat tiles */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <StatTile label="Health Score" value={`${selected.health}%`} color={selected.health<50?'#ef4444':selected.health<80?'#f59e0b':'var(--status-ok)'} />
              <StatTile label="Runtime" value={`${selected.runtime}h`} />
              <StatTile label="Last Service" value={selected.lastService} />
              <StatTile label="Next Service" value={serviceLabel} color={serviceColor} />
            </div>

            {/* MTBF + Task ETA row */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
              <StatTile label="Task ETA" value={getTaskEta(selected)}
                color={selected.status==='critical'?'#ef4444':selected.status==='warning'?'#f59e0b':'var(--text-primary)'} />
              <StatTile label="Temp Peak" value={`${Math.max(...selected.sensors.temp)}°C`}
                color={Math.max(...selected.sensors.temp) > 85 ? '#ef4444' : Math.max(...selected.sensors.temp) > 65 ? '#f59e0b' : 'var(--status-ok)'} />
            </div>

            {/* Actions */}
            <div style={{ marginTop:'auto', display:'flex', flexDirection:'column', gap:8 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', borderTop:'1px dashed var(--border-primary)', paddingTop:10 }}>ACTIONS</div>
              <div style={{ display:'flex', gap:8 }}>
                <button style={{
                  flex:1, padding:'8px 10px',
                  background:'rgba(34,197,94,0.08)', border:'1px solid rgba(34,197,94,0.35)',
                  borderRadius:2, color:'var(--status-ok)',
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, letterSpacing:'0.1em',
                  textTransform:'uppercase', cursor:'pointer',
                }}>
                  ▸ Work Order
                </button>
                <button style={{
                  padding:'8px 10px',
                  background:'transparent', border:'1px solid var(--border-primary)',
                  borderRadius:2, color:'var(--text-secondary)',
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, letterSpacing:'0.1em',
                  textTransform:'uppercase', cursor:'pointer',
                }}>
                  Ack
                </button>
              </div>
            </div>

            {/* Temp trend chart */}
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, letterSpacing:'0.14em', textTransform:'uppercase', color:'var(--text-muted)', marginBottom:6 }}>
                TEMP TREND · 8H
              </div>
              <div style={{ height:100 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selected.sensors.temp.map((v, i) => ({ t: timeLabels[i], temp: v }))}>
                    <defs>
                      <linearGradient id="detailTempGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="temp" stroke="#f59e0b" strokeWidth={1.5} fill="url(#detailTempGrad)" dot={{ r:2, fill:'#f59e0b', stroke:'var(--bg-primary)', strokeWidth:1 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
