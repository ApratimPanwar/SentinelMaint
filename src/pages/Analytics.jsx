import {
  BarChart3, TrendingUp, TrendingDown, Clock, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, ComposedChart, Line,
} from 'recharts';
import { mtbfData, downtimeByMachine, failureDistribution } from '../data/mockData';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';

const chartTooltipStyle = {
  background: '#131920',
  border: '1px solid #1e293b',
  borderRadius: 6,
  fontSize: 11,
  fontFamily: "'JetBrains Mono', monospace",
};

export default function Analytics() {
  const latestMtbf = mtbfData[mtbfData.length - 1];
  const prevMtbf = mtbfData[mtbfData.length - 2];
  const mtbfDelta = Math.round(latestMtbf.mtbf - prevMtbf.mtbf);
  const mttrDelta = +(latestMtbf.mttr - prevMtbf.mttr).toFixed(1);

  return (
    <div>
      <PageHeader title="Analytics & MTBF" subtitle="Reliability metrics, failure analysis, and maintenance intelligence" />

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'MTBF (Current)',
            value: `${latestMtbf.mtbf}h`,
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
            label: 'Failures (Month)',
            value: latestMtbf.failures,
            delta: latestMtbf.failures <= prevMtbf.failures ? 'Stable' : 'Increased',
            deltaUp: latestMtbf.failures <= prevMtbf.failures,
            icon: Zap,
            color: '#f59e0b',
          },
          {
            label: 'Availability',
            value: '96.2%',
            delta: '+0.8%',
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
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#e2e8f0' }}>
                  {kpi.value}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                    {kpi.label}
                  </span>
                  <span style={{
                    fontSize: 10, fontFamily: "'JetBrains Mono', monospace",
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
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
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
                <span style={{ fontSize: 9, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>{l.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Failure Distribution */}
        <Card>
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Failure Type Distribution
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {failureDistribution.map(f => (
              <div key={f.type}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{f.type}</span>
                  <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono', monospace", color: '#e2e8f0' }}>{f.count} ({f.pct}%)</span>
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

      {/* Charts row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Downtime by machine */}
        <Card>
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Downtime by Machine (hours)
          </div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimeByMachine} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#475569' }} axisLine={{ stroke: '#1e293b' }} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8', fontFamily: "'JetBrains Mono', monospace" }} axisLine={{ stroke: '#1e293b' }} tickLine={false} width={70} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="hours" radius={[0, 4, 4, 0]} name="Downtime (hrs)" barSize={14}>
                  {downtimeByMachine.map((entry, i) => (
                    <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Maintenance cost / efficiency */}
        <Card>
          <div style={{ fontSize: 11, color: '#64748b', fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14 }}>
            Reliability Insights
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              {
                title: 'Bearing failures account for 28% of all faults',
                desc: 'Recommend: Increase lubrication schedule frequency for CNC fleet. Projected MTBF improvement: +15%.',
                severity: 'critical',
              },
              {
                title: 'Hydraulic Press Charlie — 3x average downtime',
                desc: 'Root cause: deferred maintenance. Recommend: Immediate corrective action and schedule overhaul.',
                severity: 'warning',
              },
              {
                title: 'MTBF trending upward — +28% over 6 months',
                desc: 'Preventive maintenance program showing results. Continue current PM schedule cadence.',
                severity: 'good',
              },
              {
                title: 'MTTR reduced to 6.8h from 12h peak',
                desc: 'Improved parts availability and technician training are primary drivers.',
                severity: 'good',
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
    </div>
  );
}
