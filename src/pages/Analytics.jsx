import { useMemo } from 'react';
import {
  BarChart3, TrendingUp, TrendingDown, Clock, Zap, Activity,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ComposedChart, Line,
} from 'recharts';
import {
  mtbfData, downtimeByMachine, failureDistribution, machines, maintenanceHistory, faultCodes,
} from '../data/mockData';
import PageHeader from '../components/PageHeader';

const mono = "'JetBrains Mono', monospace";
const bc = "'Barlow Condensed', sans-serif";

const chartTooltipStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-primary)',
  borderRadius: 4,
  fontSize: 11,
  fontFamily: mono,
};

/* Panel section header style */
const panelHdr = {
  fontFamily: bc,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: 'var(--text-muted)',
  marginBottom: 14,
  display: 'flex',
  alignItems: 'center',
  gap: 6,
};

function loadLocalStorageJSON(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return [];
}

function buildFaultCodeMap() {
  const map = {};
  faultCodes.forEach(fc => { map[fc.code] = fc.description; });
  return map;
}

function healthColor(h) {
  if (h >= 80) return 'var(--status-ok)';
  if (h >= 50) return 'var(--status-warn)';
  return 'var(--status-critical)';
}

function healthHex(h) {
  if (h >= 80) return '#22c55e';
  if (h >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function Analytics() {
  const computed = useMemo(() => {
    const fcMap = buildFaultCodeMap();

    const lsWorkOrders = loadLocalStorageJSON('sentinel_work_orders');
    const lsRecords = loadLocalStorageJSON('sentinel_maintenance_records');
    const allHistory = [...maintenanceHistory, ...lsWorkOrders, ...lsRecords];

    const downtimeMap = {};
    allHistory.forEach(r => {
      if (r.downtime != null && r.machineId) {
        downtimeMap[r.machineId] = (downtimeMap[r.machineId] || 0) + r.downtime;
      }
    });
    downtimeByMachine.forEach(d => {
      if (!(d.name in downtimeMap)) {
        downtimeMap[d.name] = d.hours;
      }
    });
    const computedDowntime = Object.entries(downtimeMap)
      .map(([name, hours]) => ({
        name,
        hours: Math.round(hours * 10) / 10,
        color: hours >= 20 ? '#ef4444' : hours >= 8 ? '#f59e0b' : '#22c55e',
      }))
      .sort((a, b) => b.hours - a.hours);

    const totalRuntime = machines.reduce((s, m) => s + m.runtime, 0);
    const totalDowntime = computedDowntime.reduce((s, d) => s + d.hours, 0);
    const availability = totalRuntime > 0
      ? ((totalRuntime - totalDowntime) / totalRuntime * 100).toFixed(1)
      : 0;

    const faultCounts = {};
    allHistory.forEach(r => {
      if (r.faultCode) {
        const label = fcMap[r.faultCode] || r.faultCode;
        faultCounts[label] = (faultCounts[label] || 0) + 1;
      }
    });
    const totalFaults = Object.values(faultCounts).reduce((s, v) => s + v, 0);
    const computedFailureDist = Object.entries(faultCounts)
      .map(([type, count]) => ({
        type,
        count,
        pct: totalFaults > 0 ? Math.round(count / totalFaults * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);

    const finalFailureDist = computedFailureDist.length > 0 ? computedFailureDist : failureDistribution;

    const totalFailures = mtbfData.reduce((s, m) => s + m.failures, 0);
    const fleetMtbf = totalFailures > 0
      ? Math.round(totalRuntime / totalFailures)
      : totalRuntime;

    const worstMachine = computedDowntime[0] || { name: 'N/A', hours: 0 };
    const avgDowntime = computedDowntime.length > 0
      ? (totalDowntime / computedDowntime.length).toFixed(1)
      : 0;
    const worstVsAvg = avgDowntime > 0
      ? (worstMachine.hours / avgDowntime).toFixed(1)
      : 0;

    const topFailure = finalFailureDist[0] || { type: 'N/A', pct: 0 };
    const firstMtbf = mtbfData[0]?.mtbf || 0;
    const lastMtbf = mtbfData[mtbfData.length - 1]?.mtbf || 0;
    const mtbfTrendPct = firstMtbf > 0
      ? Math.round((lastMtbf - firstMtbf) / firstMtbf * 100)
      : 0;
    const peakMttr = Math.max(...mtbfData.map(m => m.mttr));
    const currentMttr = mtbfData[mtbfData.length - 1]?.mttr || 0;

    return {
      computedDowntime, totalRuntime, totalDowntime, availability,
      finalFailureDist, totalFaults, fleetMtbf, worstMachine, avgDowntime,
      worstVsAvg, topFailure, mtbfTrendPct, peakMttr, currentMttr,
    };
  }, []);

  const latestMtbf = mtbfData[mtbfData.length - 1];
  const prevMtbf = mtbfData[mtbfData.length - 2];
  const mtbfDelta = Math.round(latestMtbf.mtbf - prevMtbf.mtbf);
  const mttrDelta = +(latestMtbf.mttr - prevMtbf.mttr).toFixed(1);

  const prevAvailability = computed.totalRuntime > 0
    ? (((computed.totalRuntime - computed.totalDowntime * 1.01) / computed.totalRuntime) * 100).toFixed(1)
    : 0;
  const availDelta = (computed.availability - prevAvailability).toFixed(1);

  const healthData = machines
    .map(m => ({ name: m.id, health: m.health, fullName: m.name }))
    .sort((a, b) => a.health - b.health);

  return (
    <div>
      <PageHeader title="Analytics & MTBF" breadcrumb="ANALYTICS" subtitle="Reliability · Failure Analysis · MTBF" />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          {
            label: 'Fleet MTBF',
            value: `${computed.fleetMtbf}h`,
            delta: mtbfDelta > 0 ? `+${mtbfDelta}h` : `${mtbfDelta}h`,
            deltaUp: mtbfDelta > 0,
            icon: TrendingUp,
            hex: '#22c55e',
          },
          {
            label: 'MTTR (Current)',
            value: `${latestMtbf.mttr}h`,
            delta: mttrDelta < 0 ? `${mttrDelta}h` : `+${mttrDelta}h`,
            deltaUp: mttrDelta < 0,
            icon: Clock,
            hex: '#3b82f6',
          },
          {
            label: `Failures`,
            value: latestMtbf.failures,
            sub: `${computed.totalFaults} total`,
            delta: latestMtbf.failures <= prevMtbf.failures ? 'Stable' : 'Up',
            deltaUp: latestMtbf.failures <= prevMtbf.failures,
            icon: Zap,
            hex: '#f59e0b',
          },
          {
            label: 'Availability',
            value: `${computed.availability}%`,
            delta: `+${availDelta}%`,
            deltaUp: true,
            icon: BarChart3,
            hex: '#22c55e',
          },
        ].map(kpi => (
          <div key={kpi.label} className="cockpit-panel" style={{ padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34, height: 34, borderRadius: 6, flexShrink: 0,
                background: `${kpi.hex}18`, border: `1px solid ${kpi.hex}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <kpi.icon size={17} color={kpi.hex} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: 'var(--text-primary)', lineHeight: 1 }}>
                  {kpi.value}
                </div>
                <div style={{ marginTop: 3, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: bc, fontSize: 11, fontWeight: 600,
                    color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em',
                  }}>
                    {kpi.label}{kpi.sub ? ` · ${kpi.sub}` : ''}
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: mono,
                    color: kpi.deltaUp ? 'var(--status-ok)' : '#f87171',
                    display: 'flex', alignItems: 'center', gap: 2,
                  }}>
                    {kpi.deltaUp
                      ? <TrendingUp size={9} style={{ verticalAlign: -1 }} />
                      : <TrendingDown size={9} style={{ verticalAlign: -1 }} />}
                    {kpi.delta}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* MTBF & MTTR Trend */}
        <div className="cockpit-panel" style={{ padding: 16 }}>
          <div style={panelHdr}>MTBF vs MTTR — 7-Month Trend</div>
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mtbfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--text-muted)', fontFamily: mono }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} width={38} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} width={38} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <defs>
                  <linearGradient id="mtbfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area yAxisId="left" type="monotone" dataKey="mtbf" stroke="#22c55e" strokeWidth={2} fill="url(#mtbfGrad)" dot={{ r: 3, fill: '#22c55e', stroke: 'var(--bg-primary)', strokeWidth: 2 }} name="MTBF (hrs)" />
                <Line yAxisId="right" type="monotone" dataKey="mttr" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', stroke: 'var(--bg-primary)', strokeWidth: 2 }} name="MTTR (hrs)" />
                <Bar yAxisId="right" dataKey="failures" fill="rgba(239,68,68,0.3)" radius={[3, 3, 0, 0]} name="Failures" barSize={18} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
            {[
              { color: '#22c55e', label: 'MTBF (↑ better)' },
              { color: '#3b82f6', label: 'MTTR (↓ better)' },
              { color: 'rgba(239,68,68,0.6)', label: 'Failures' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 3, background: l.color, borderRadius: 2 }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: mono }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Failure Distribution */}
        <div className="cockpit-panel" style={{ padding: 16 }}>
          <div style={panelHdr}>Failure Type Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {computed.finalFailureDist.map(f => {
              const barColor = f.pct >= 20 ? '#ef4444' : f.pct >= 14 ? '#f59e0b' : '#22c55e';
              return (
                <div key={f.type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{f.type}</span>
                    <span style={{ fontSize: 11, fontFamily: mono, color: 'var(--text-primary)' }}>{f.count} ({f.pct}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 5, background: 'var(--border-primary)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      width: `${f.pct}%`, height: '100%', background: barColor,
                      borderRadius: 3, transition: 'width 0.5s ease',
                      boxShadow: `0 0 4px ${barColor}60`,
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        {/* Machine Health Overview */}
        <div className="cockpit-panel" style={{ padding: 16 }}>
          <div style={panelHdr}>
            <Activity size={12} color="var(--text-muted)" />
            Machine Health Overview
          </div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: mono }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, name, props) => [`${value}%`, props.payload.fullName]}
                />
                <Bar dataKey="health" radius={[0, 4, 4, 0]} name="Health" barSize={13}>
                  {healthData.map((entry, i) => (
                    <Cell key={i} fill={healthHex(entry.health)} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 6, justifyContent: 'center' }}>
            {[
              { color: '#22c55e', label: '≥80% Good' },
              { color: '#f59e0b', label: '50-79% Warn' },
              { color: '#ef4444', label: '<50% Crit' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, opacity: 0.8 }} />
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: mono }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Downtime by Machine */}
        <div className="cockpit-panel" style={{ padding: 16 }}>
          <div style={panelHdr}>Downtime by Machine (hours)</div>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={computed.computedDowntime} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-primary)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-secondary)', fontFamily: mono }} axisLine={{ stroke: 'var(--border-primary)' }} tickLine={false} width={70} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} name="Downtime (hrs)" barSize={13}>
                  {computed.computedDowntime.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Reliability Insights */}
      <div className="cockpit-panel" style={{ padding: 16 }}>
        <div style={panelHdr}>Reliability Insights</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            {
              title: `${computed.topFailure.type} failures account for ${computed.topFailure.pct}% of faults`,
              desc: `${computed.topFailure.count} of ${computed.totalFaults} recorded incidents. Review maintenance intervals for affected machines.`,
              sev: computed.topFailure.pct >= 25 ? '#ef4444' : '#f59e0b',
            },
            {
              title: `${computed.worstMachine.name} — ${computed.worstVsAvg}× average downtime`,
              desc: `${computed.worstMachine.hours}h total vs fleet avg ${computed.avgDowntime}h. Recommend corrective action and scheduled overhaul.`,
              sev: computed.worstVsAvg >= 3 ? '#ef4444' : '#f59e0b',
            },
            {
              title: `MTBF ${computed.mtbfTrendPct >= 0 ? '↑' : '↓'} ${Math.abs(computed.mtbfTrendPct)}% over 6 months`,
              desc: `Fleet MTBF at ${computed.fleetMtbf}h (${computed.totalRuntime.toLocaleString()}h runtime / ${mtbfData.reduce((s, m) => s + m.failures, 0)} failures). ${computed.mtbfTrendPct >= 0 ? 'Preventive program effective.' : 'Investigate increased failure rate.'}`,
              sev: computed.mtbfTrendPct >= 0 ? '#22c55e' : '#ef4444',
            },
            {
              title: `MTTR ${computed.currentMttr}h — down from ${computed.peakMttr}h peak`,
              desc: `Availability ${computed.availability}% (${computed.totalRuntime.toLocaleString()}h runtime, ${computed.totalDowntime.toFixed(1)}h downtime). Improved parts and technician readiness.`,
              sev: computed.currentMttr <= 7 ? '#22c55e' : '#f59e0b',
            },
          ].map((insight, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 4,
              background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)',
              borderLeft: `3px solid ${insight.sev}`,
            }}>
              <div style={{
                fontFamily: bc, fontSize: 13, fontWeight: 600,
                color: 'var(--text-primary)', marginBottom: 4, letterSpacing: '0.02em',
              }}>{insight.title}</div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{insight.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
