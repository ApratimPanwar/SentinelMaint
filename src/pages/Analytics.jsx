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
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';

const mono = "'JetBrains Mono', monospace";

const chartTooltipStyle = {
  background: '#131920',
  border: '1px solid #1e293b',
  borderRadius: 6,
  fontSize: 11,
  fontFamily: mono,
};

const labelStyle = {
  fontSize: 11,
  color: '#64748b',
  fontFamily: mono,
  textTransform: 'uppercase',
  letterSpacing: 1,
  marginBottom: 14,
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
  if (h >= 80) return '#22c55e';
  if (h >= 50) return '#f59e0b';
  return '#ef4444';
}

export default function Analytics() {
  const computed = useMemo(() => {
    const fcMap = buildFaultCodeMap();

    // Merge mock maintenance history with localStorage records
    const lsWorkOrders = loadLocalStorageJSON('sentinel_work_orders');
    const lsRecords = loadLocalStorageJSON('sentinel_maintenance_records');
    const allHistory = [...maintenanceHistory, ...lsWorkOrders, ...lsRecords];

    // -- Downtime by machine (from actual maintenance records) --
    const downtimeMap = {};
    allHistory.forEach(r => {
      if (r.downtime != null && r.machineId) {
        downtimeMap[r.machineId] = (downtimeMap[r.machineId] || 0) + r.downtime;
      }
    });
    // Also incorporate any machines in the mock downtimeByMachine that aren't covered
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

    // -- Total runtime and downtime for availability --
    const totalRuntime = machines.reduce((s, m) => s + m.runtime, 0);
    const totalDowntime = computedDowntime.reduce((s, d) => s + d.hours, 0);
    const availability = totalRuntime > 0
      ? ((totalRuntime - totalDowntime) / totalRuntime * 100).toFixed(1)
      : 0;

    // -- Failure distribution from actual fault codes --
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

    // If no records produced any distribution, fall back to static mock
    const finalFailureDist = computedFailureDist.length > 0 ? computedFailureDist : failureDistribution;

    // -- MTBF calculation from fleet data --
    // MTBF = total operating hours / total failures
    const totalFailures = mtbfData.reduce((s, m) => s + m.failures, 0);
    const fleetMtbf = totalFailures > 0
      ? Math.round(totalRuntime / totalFailures)
      : totalRuntime;

    // -- Highest-downtime machine --
    const worstMachine = computedDowntime[0] || { name: 'N/A', hours: 0 };
    const avgDowntime = computedDowntime.length > 0
      ? (totalDowntime / computedDowntime.length).toFixed(1)
      : 0;
    const worstVsAvg = avgDowntime > 0
      ? (worstMachine.hours / avgDowntime).toFixed(1)
      : 0;

    // Top failure type
    const topFailure = finalFailureDist[0] || { type: 'N/A', pct: 0 };

    // MTBF trend
    const firstMtbf = mtbfData[0]?.mtbf || 0;
    const lastMtbf = mtbfData[mtbfData.length - 1]?.mtbf || 0;
    const mtbfTrendPct = firstMtbf > 0
      ? Math.round((lastMtbf - firstMtbf) / firstMtbf * 100)
      : 0;

    // MTTR trend
    const peakMttr = Math.max(...mtbfData.map(m => m.mttr));
    const currentMttr = mtbfData[mtbfData.length - 1]?.mttr || 0;

    return {
      computedDowntime,
      totalRuntime,
      totalDowntime,
      availability,
      finalFailureDist,
      totalFaults,
      fleetMtbf,
      worstMachine,
      avgDowntime,
      worstVsAvg,
      topFailure,
      mtbfTrendPct,
      peakMttr,
      currentMttr,
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

  // Machine health data for the overview chart
  const healthData = machines
    .map(m => ({ name: m.id, health: m.health, fullName: m.name }))
    .sort((a, b) => a.health - b.health);

  return (
    <div>
      <PageHeader title="Analytics & MTBF" subtitle="Reliability metrics, failure analysis, and maintenance intelligence" />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Fleet MTBF',
            value: `${computed.fleetMtbf}h`,
            delta: mtbfDelta > 0 ? `+${mtbfDelta}h` : `${mtbfDelta}h`,
            deltaUp: mtbfDelta > 0,
            icon: TrendingUp,
            color: '#22c55e',
          },
          {
            label: 'MTTR (Current)',
            value: `${latestMtbf.mttr}h`,
            delta: mttrDelta < 0 ? `${mttrDelta}h` : `+${mttrDelta}h`,
            deltaUp: mttrDelta < 0,
            icon: Clock,
            color: '#3b82f6',
          },
          {
            label: `Failures (${computed.totalFaults} total)`,
            value: latestMtbf.failures,
            delta: latestMtbf.failures <= prevMtbf.failures ? 'Stable' : 'Increased',
            deltaUp: latestMtbf.failures <= prevMtbf.failures,
            icon: Zap,
            color: '#f59e0b',
          },
          {
            label: 'Availability',
            value: `${computed.availability}%`,
            delta: `+${availDelta}%`,
            deltaUp: true,
            icon: BarChart3,
            color: '#22c55e',
          },
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
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono, color: '#e2e8f0' }}>
                  {kpi.value}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: mono }}>
                    {kpi.label}
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: mono,
                    color: kpi.deltaUp ? '#4ade80' : '#f87171',
                  }}>
                    {kpi.deltaUp ? <TrendingUp size={10} style={{ verticalAlign: -1 }} /> : <TrendingDown size={10} style={{ verticalAlign: -1 }} />}
                    {' '}{kpi.delta}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* MTBF & MTTR Trend */}
        <Card>
          <div style={labelStyle}>
            MTBF vs MTTR — 7-Month Trend
          </div>
          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={mtbfData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} width={40} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} width={40} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <defs>
                  <linearGradient id="mtbfGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area yAxisId="left" type="monotone" dataKey="mtbf" stroke="#22c55e" strokeWidth={2} fill="url(#mtbfGrad)" dot={{ r: 3, fill: '#22c55e', stroke: '#0a0e14', strokeWidth: 2 }} name="MTBF (hrs)" />
                <Line yAxisId="right" type="monotone" dataKey="mttr" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', stroke: '#0a0e14', strokeWidth: 2 }} name="MTTR (hrs)" />
                <Bar yAxisId="right" dataKey="failures" fill="rgba(239,68,68,0.3)" radius={[3, 3, 0, 0]} name="Failures" barSize={20} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10, justifyContent: 'center' }}>
            {[
              { color: '#22c55e', label: 'MTBF (higher = better)' },
              { color: '#3b82f6', label: 'MTTR (lower = better)' },
              { color: 'rgba(239,68,68,0.5)', label: 'Failure count' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 10, height: 3, background: l.color, borderRadius: 2 }} />
                <span style={{ fontSize: 9, color: '#64748b', fontFamily: mono }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Failure Distribution */}
        <Card>
          <div style={labelStyle}>
            Failure Type Distribution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {computed.finalFailureDist.map(f => (
              <div key={f.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{f.type}</span>
                  <span style={{ fontSize: 11, fontFamily: mono, color: '#e2e8f0' }}>{f.count} ({f.pct}%)</span>
                </div>
                <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    width: `${f.pct}%`,
                    height: '100%',
                    background: f.pct >= 20 ? '#ef4444' : f.pct >= 14 ? '#f59e0b' : '#22c55e',
                    borderRadius: 3,
                    boxShadow: `0 0 6px ${f.pct >= 20 ? 'rgba(239,68,68,0.3)' : f.pct >= 14 ? 'rgba(245,158,11,0.3)' : 'rgba(34,197,94,0.3)'}`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Charts row 2 — Machine Health + Downtime */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Machine Health Overview */}
        <Card>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...labelStyle }}>
            <Activity size={13} color="#64748b" />
            Machine Health Overview
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: mono }} axisLine={{ stroke: '#1e293b' }} tickLine={false} width={70} />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, name, props) => [`${value}%`, props.payload.fullName]}
                />
                <Bar dataKey="health" radius={[0, 4, 4, 0]} name="Health" barSize={14}>
                  {healthData.map((entry, i) => (
                    <Cell key={i} fill={healthColor(entry.health)} fillOpacity={0.75} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: 14, marginTop: 8, justifyContent: 'center' }}>
            {[
              { color: '#22c55e', label: 'Good (80+)' },
              { color: '#f59e0b', label: 'Warning (50-79)' },
              { color: '#ef4444', label: 'Critical (<50)' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, opacity: 0.75 }} />
                <span style={{ fontSize: 9, color: '#64748b', fontFamily: mono }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Downtime by machine */}
        <Card>
          <div style={labelStyle}>
            Downtime by Machine (hours)
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={computed.computedDowntime} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: mono }} axisLine={{ stroke: '#1e293b' }} tickLine={false} width={70} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} name="Downtime (hrs)" barSize={14}>
                  {computed.computedDowntime.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <div style={labelStyle}>
          Reliability Insights
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            {
              title: `${computed.topFailure.type} failures account for ${computed.topFailure.pct}% of all faults`,
              desc: `${computed.topFailure.count} of ${computed.totalFaults} recorded incidents. Review maintenance intervals for affected machines to reduce recurrence.`,
              severity: computed.topFailure.pct >= 25 ? 'critical' : 'warning',
            },
            {
              title: `${computed.worstMachine.name} — ${computed.worstVsAvg}x average downtime`,
              desc: `${computed.worstMachine.hours}h total downtime vs fleet avg of ${computed.avgDowntime}h. Recommend immediate corrective action and schedule overhaul.`,
              severity: computed.worstVsAvg >= 3 ? 'critical' : 'warning',
            },
            {
              title: `MTBF trending ${computed.mtbfTrendPct >= 0 ? 'upward' : 'downward'} — ${computed.mtbfTrendPct >= 0 ? '+' : ''}${computed.mtbfTrendPct}% over 6 months`,
              desc: `Fleet MTBF at ${computed.fleetMtbf}h (${computed.totalRuntime.toLocaleString()}h total runtime / ${mtbfData.reduce((s, m) => s + m.failures, 0)} failures). ${computed.mtbfTrendPct >= 0 ? 'Preventive maintenance program showing results.' : 'Investigate root causes of increased failure rate.'}`,
              severity: computed.mtbfTrendPct >= 0 ? 'good' : 'critical',
            },
            {
              title: `MTTR at ${computed.currentMttr}h — down from ${computed.peakMttr}h peak`,
              desc: `Fleet availability at ${computed.availability}% (${computed.totalRuntime.toLocaleString()}h runtime, ${computed.totalDowntime.toFixed(1)}h total downtime). Improved parts availability and technician training are primary drivers.`,
              severity: computed.currentMttr <= 7 ? 'good' : 'warning',
            },
          ].map((insight, i) => (
            <div key={i} style={{
              padding: '10px 12px', borderRadius: 6,
              background: '#0d1117', border: '1px solid #1e293b',
              borderLeft: `3px solid ${insight.severity === 'critical' ? '#ef4444' : insight.severity === 'warning' ? '#f59e0b' : '#22c55e'}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', marginBottom: 3 }}>{insight.title}</div>
              <div style={{ fontSize: 11, color: '#94a3b8', lineHeight: 1.5 }}>{insight.desc}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
