import { useState } from 'react';
import { Search, Filter, ArrowUpDown, Wrench, Calendar, Clock } from 'lucide-react';
import { maintenanceHistory } from '../data/mockData';
import Card from '../components/Card';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';

export default function HistoryLog() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateOpened');
  const [sortDir, setSortDir] = useState('desc');

  const filtered = maintenanceHistory
    .filter(wo => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        wo.workOrderId.toLowerCase().includes(q) ||
        wo.machineId.toLowerCase().includes(q) ||
        wo.machineName.toLowerCase().includes(q) ||
        wo.technician.toLowerCase().includes(q) ||
        wo.faultCode.toLowerCase().includes(q);
      const matchType = typeFilter === 'all' || wo.type.toLowerCase() === typeFilter;
      return matchSearch && matchType;
    })
    .sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy];
      if (sortBy === 'downtime') { va = va || 0; vb = vb || 0; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const toggleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('desc'); }
  };

  const totalDowntime = maintenanceHistory.reduce((s, w) => s + (w.downtime || 0), 0);
  const completed = maintenanceHistory.filter(w => w.status === 'completed').length;

  return (
    <div>
      <PageHeader title="Maintenance History" subtitle={`${maintenanceHistory.length} records — ${totalDowntime}h total downtime logged`}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#0d1117', border: '1px solid #1e293b', borderRadius: 6,
          padding: '5px 10px',
        }}>
          <Search size={14} color="#64748b" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: '#e2e8f0', fontSize: 12, fontFamily: "'JetBrains Mono', monospace",
              width: 150,
            }}
          />
        </div>
        {/* Type filter */}
        <div style={{
          display: 'flex', gap: 3, background: '#0d1117', borderRadius: 6,
          border: '1px solid #1e293b', padding: 3,
        }}>
          {['all', 'preventive', 'corrective'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '4px 10px', borderRadius: 4, border: 'none',
                fontSize: 11, fontFamily: "'JetBrains Mono', monospace",
                cursor: 'pointer',
                background: typeFilter === t ? 'rgba(34,197,94,0.15)' : 'transparent',
                color: typeFilter === t ? '#4ade80' : '#64748b',
              }}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </PageHeader>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          { label: 'Total Orders', val: maintenanceHistory.length, icon: Wrench },
          { label: 'Completed', val: completed, icon: Calendar },
          { label: 'Total Downtime', val: `${totalDowntime}h`, icon: Clock },
          { label: 'Avg Downtime', val: `${(totalDowntime / (completed || 1)).toFixed(1)}h`, icon: ArrowUpDown },
        ].map(s => (
          <Card key={s.label}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <s.icon size={16} color="#4ade80" />
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: '#e2e8f0' }}>{s.val}</div>
                <div style={{ fontSize: 9, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, fontFamily: "'JetBrains Mono', monospace" }}>{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#0d1117', position: 'sticky', top: 0, zIndex: 1 }}>
                {[
                  { key: 'workOrderId', label: 'WO #' },
                  { key: 'machineId', label: 'Machine' },
                  { key: 'faultCode', label: 'Fault' },
                  { key: 'type', label: 'Type' },
                  { key: 'technician', label: 'Technician' },
                  { key: 'status', label: 'Status' },
                  { key: 'dateOpened', label: 'Opened' },
                  { key: 'dateClosed', label: 'Closed' },
                  { key: 'downtime', label: 'Downtime' },
                ].map(col => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    style={{
                      padding: '10px 12px',
                      textAlign: 'left',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 10,
                      color: sortBy === col.key ? '#4ade80' : '#64748b',
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      borderBottom: '1px solid #1e293b',
                      cursor: 'pointer',
                      userSelect: 'none',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {col.label}
                    {sortBy === col.key && (
                      <span style={{ marginLeft: 4, fontSize: 8 }}>{sortDir === 'asc' ? '▲' : '▼'}</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((wo, i) => (
                <tr
                  key={wo.workOrderId}
                  style={{
                    background: i % 2 === 0 ? '#111820' : '#0f151d',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#161d27'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#111820' : '#0f151d'}
                >
                  <td style={cellStyle}>
                    <span style={{ color: '#4ade80', fontFamily: "'JetBrains Mono', monospace" }}>{wo.workOrderId}</span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{wo.machineId}</div>
                    <div style={{ fontSize: 10, color: '#64748b' }}>{wo.machineName}</div>
                  </td>
                  <td style={{ ...cellStyle, fontFamily: "'JetBrains Mono', monospace" }}>{wo.faultCode}</td>
                  <td style={cellStyle}>
                    <span style={{
                      padding: '2px 6px', borderRadius: 3, fontSize: 10,
                      background: wo.type === 'Preventive' ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
                      color: wo.type === 'Preventive' ? '#60a5fa' : '#fbbf24',
                      fontFamily: "'JetBrains Mono', monospace",
                    }}>{wo.type}</span>
                  </td>
                  <td style={cellStyle}>{wo.technician}</td>
                  <td style={cellStyle}><StatusBadge status={wo.status} /></td>
                  <td style={{ ...cellStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{wo.dateOpened}</td>
                  <td style={{ ...cellStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{wo.dateClosed || '—'}</td>
                  <td style={{ ...cellStyle, fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>
                    {wo.downtime != null ? `${wo.downtime}h` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

const cellStyle = {
  padding: '10px 12px',
  borderBottom: '1px solid #1a2230',
  fontSize: 12,
  color: '#e2e8f0',
  whiteSpace: 'nowrap',
};
