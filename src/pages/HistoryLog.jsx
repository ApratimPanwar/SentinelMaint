import { useState, useEffect, useMemo } from 'react';
import { Search, ArrowUpDown, Wrench, Calendar, Clock, Plus, X } from 'lucide-react';
import { maintenanceHistory, machines, faultCodes, technicians } from '../data/mockData';
import StatusBadge from '../components/StatusBadge';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';

const STORAGE_KEY = 'sentinelmaint_custom_records';

function loadCustomRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomRecords(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function nextWorkOrderId(allRecords) {
  let max = 0;
  for (const r of allRecords) {
    const m = r.workOrderId.match(/WO-\d+-(\d+)/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `WO-2026-${String(max + 1).padStart(4, '0')}`;
}

const emptyForm = {
  machineId: '',
  faultCode: '',
  type: 'Preventive',
  technician: '',
  dateOpened: '',
  dateClosed: '',
  downtime: '',
  notes: '',
};

const inputStyle = {
  width: '100%',
  padding: '7px 10px',
  background: 'var(--bg-secondary)',
  border: '1px solid var(--border-primary)',
  borderRadius: 4,
  color: 'var(--text-primary)',
  fontSize: 12,
  fontFamily: "'JetBrains Mono', monospace",
  outline: 'none',
  boxSizing: 'border-box',
};

const labelStyle = {
  fontSize: 10,
  color: 'var(--text-muted)',
  fontFamily: "'Barlow Condensed', sans-serif",
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  marginBottom: 4,
  display: 'block',
};

const cellStyle = {
  padding: '9px 12px',
  borderBottom: '1px solid var(--border-primary)',
  fontSize: 12,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
};

export default function HistoryLog() {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateOpened');
  const [sortDir, setSortDir] = useState('desc');
  const [customRecords, setCustomRecords] = useState(loadCustomRecords);
  const [showForm, setShowForm] = useState(false);

  const defaultTechnician = user?.role === 'technician' ? user.name : '';
  const [form, setForm] = useState({ ...emptyForm, technician: defaultTechnician });

  useEffect(() => {
    saveCustomRecords(customRecords);
  }, [customRecords]);

  const allRecords = useMemo(() => {
    const customIds = new Set(customRecords.map(r => r.workOrderId));
    const base = maintenanceHistory.filter(r => !customIds.has(r.workOrderId));
    return [...base, ...customRecords];
  }, [customRecords]);

  const filtered = allRecords
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

  const totalDowntime = allRecords.reduce((s, w) => s + (w.downtime || 0), 0);
  const completed = allRecords.filter(w => w.status === 'completed').length;

  const updateField = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const handleSubmit = () => {
    if (!form.machineId || !form.faultCode || !form.technician || !form.dateOpened) return;
    const machine = machines.find(m => m.id === form.machineId);
    const record = {
      workOrderId: nextWorkOrderId(allRecords),
      machineId: form.machineId,
      machineName: machine ? machine.name : form.machineId,
      faultCode: form.faultCode,
      type: form.type,
      technician: form.technician,
      status: form.dateClosed ? 'completed' : 'open',
      dateOpened: form.dateOpened,
      dateClosed: form.dateClosed || null,
      downtime: form.downtime !== '' ? parseFloat(form.downtime) : null,
      notes: form.notes || '',
      addedBy: user?.name || 'Unknown',
    };
    setCustomRecords(prev => [...prev, record]);
    setForm({ ...emptyForm, technician: defaultTechnician });
    setShowForm(false);
  };

  const handleCancel = () => {
    setForm({ ...emptyForm, technician: defaultTechnician });
    setShowForm(false);
  };

  return (
    <div>
      <PageHeader title="Maintenance History" breadcrumb="HISTORY" subtitle={`${allRecords.length} records · ${totalDowntime}h downtime`}>
        {/* Search */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', borderRadius: 4,
          padding: '5px 10px',
        }}>
          <Search size={13} color="var(--text-muted)" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search orders..."
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'var(--text-primary)', fontSize: 12, fontFamily: "'JetBrains Mono', monospace", width: 130,
            }}
          />
        </div>
        {/* Type filter */}
        <div style={{ display: 'flex', gap: 3, background: 'var(--bg-secondary)', borderRadius: 4, border: '1px solid var(--border-primary)', padding: 3 }}>
          {['all', 'preventive', 'corrective'].map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              style={{
                padding: '4px 10px', borderRadius: 3, border: 'none', fontSize: 11,
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600,
                letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer',
                background: typeFilter === t ? 'rgba(34,197,94,0.15)' : 'transparent',
                color: typeFilter === t ? 'var(--green-500)' : 'var(--text-muted)',
              }}
            >
              {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        {/* New Record button */}
        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 12px', borderRadius: 4,
            border: '1px solid var(--border-green)',
            background: 'var(--green-glow)',
            color: 'var(--green-500)', fontSize: 11,
            fontFamily: "'Barlow Condensed', sans-serif",
            fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', cursor: 'pointer',
          }}
        >
          <Plus size={13} /> New Record
        </button>
      </PageHeader>

      {/* Inline form */}
      {showForm && (
        <div className="cockpit-panel" style={{ padding: 16, marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{
              fontFamily: "'Barlow Condensed', sans-serif", fontSize: 14, fontWeight: 700,
              color: 'var(--green-500)', textTransform: 'uppercase', letterSpacing: '0.1em',
            }}>
              Add Maintenance Record
            </div>
            <button onClick={handleCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 2 }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div>
              <label style={labelStyle}>Machine *</label>
              <select value={form.machineId} onChange={e => updateField('machineId', e.target.value)} style={inputStyle}>
                <option value="">Select machine...</option>
                {machines.map(m => <option key={m.id} value={m.id}>{m.id} — {m.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Fault Code *</label>
              <select value={form.faultCode} onChange={e => updateField('faultCode', e.target.value)} style={inputStyle}>
                <option value="">Select fault...</option>
                {faultCodes.map(f => <option key={f.code} value={f.code}>{f.code} — {f.description}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.type} onChange={e => updateField('type', e.target.value)} style={inputStyle}>
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Technician *</label>
              <select value={form.technician} onChange={e => updateField('technician', e.target.value)} style={inputStyle}>
                <option value="">Select technician...</option>
                {technicians.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Date Opened *</label>
              <input type="date" value={form.dateOpened} onChange={e => updateField('dateOpened', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date Closed</label>
              <input type="date" value={form.dateClosed} onChange={e => updateField('dateClosed', e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Downtime (hours)</label>
              <input type="number" step="0.5" min="0" value={form.downtime} onChange={e => updateField('downtime', e.target.value)} placeholder="0" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Notes</label>
              <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} placeholder="Optional notes..." rows={1} style={{ ...inputStyle, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'flex-end' }}>
            <button onClick={handleCancel} style={{
              padding: '6px 14px', borderRadius: 4, border: '1px solid var(--border-primary)',
              background: 'transparent', color: 'var(--text-muted)', fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button onClick={handleSubmit} style={{
              padding: '6px 14px', borderRadius: 4,
              border: '1px solid var(--border-green)',
              background: 'var(--green-glow)',
              color: 'var(--green-500)', fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace", cursor: 'pointer', fontWeight: 600,
            }}>
              Submit
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total Orders', val: allRecords.length, icon: Wrench },
          { label: 'Completed', val: completed, icon: Calendar },
          { label: 'Total Downtime', val: `${totalDowntime}h`, icon: Clock },
          { label: 'Avg Downtime', val: `${(totalDowntime / (completed || 1)).toFixed(1)}h`, icon: ArrowUpDown },
        ].map(s => (
          <div key={s.label} className="cockpit-panel" style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <s.icon size={15} color="var(--green-500)" />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace", color: 'var(--text-primary)', lineHeight: 1 }}>{s.val}</div>
              <div style={{
                fontFamily: "'Barlow Condensed', sans-serif", fontSize: 10, fontWeight: 600,
                color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2,
              }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="cockpit-panel" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto', maxHeight: 'calc(100vh - 310px)', overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--bg-secondary)', position: 'sticky', top: 0, zIndex: 1 }}>
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
                      padding: '9px 12px', textAlign: 'left',
                      fontFamily: "'Barlow Condensed', sans-serif",
                      fontSize: 11, fontWeight: 600,
                      color: sortBy === col.key ? 'var(--green-500)' : 'var(--text-muted)',
                      textTransform: 'uppercase', letterSpacing: '0.1em',
                      borderBottom: '1px solid var(--border-primary)',
                      cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
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
                  style={{ background: i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-secondary)'}
                >
                  <td style={cellStyle}>
                    <span style={{ color: 'var(--green-500)', fontFamily: "'JetBrains Mono', monospace" }}>{wo.workOrderId}</span>
                  </td>
                  <td style={cellStyle}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>{wo.machineId}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{wo.machineName}</div>
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
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                    No records match the current filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
