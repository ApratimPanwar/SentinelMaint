/**
 * WorkshopMap — SVG factory floor plan with live machine status.
 * Inspired by Sentinel-T design: dark cockpit grid, zone outlines,
 * pulsing alert rings, flow arrows, and interactive machine nodes.
 */

// x/y positions for each machine ID on the factory floor map
// Viewbox: 900 × 460
const MACHINE_POSITIONS = {
  'CNC-4501': { x: 130, y: 120 },  // Machining Bay A, Line 1
  'CNC-4502': { x: 280, y: 120 },  // Machining Bay A, Line 2
  'PMP-8801': { x: 200, y: 195 },  // Machining Bay A, Support
  'HYD-2201': { x: 130, y: 305 },  // Press Bay B
  'ROB-3301': { x: 530, y: 120 },  // Robotics Cell C
  'WLD-7701': { x: 640, y: 305 },  // Welding Station D
  'CON-5501': { x: 420, y: 415 },  // Conveyor E
  'CMP-1101': { x: 120, y: 415 },  // Utility F
};

const ZONES = [
  { k: 'A', x: 60,  y: 55,  w: 380, h: 190, label: 'MACHINING BAY A' },
  { k: 'B', x: 60,  y: 255, w: 240, h: 130, label: 'PRESS BAY B'     },
  { k: 'C', x: 460, y: 55,  w: 260, h: 190, label: 'ROBOTICS CELL C' },
  { k: 'D', x: 460, y: 255, w: 260, h: 130, label: 'WELD STATION D'  },
  { k: 'E', x: 320, y: 390, w: 250, h: 75,  label: 'CONVEYOR LINE E' },
  { k: 'F', x: 60,  y: 390, w: 240, h: 75,  label: 'UTIL / HVAC F'  },
];

const STATUS_META = {
  healthy:  { c: '#22c55e', ring: false, lbl: 'RUNNING' },
  warning:  { c: '#f59e0b', ring: true,  lbl: 'WARN'    },
  critical: { c: '#ef4444', ring: true,  lbl: 'CRIT'    },
  offline:  { c: '#6b7280', ring: false, lbl: 'OFFLINE'  },
};

const W = 900, H = 470;

export default function WorkshopMap({ machines, selectedId, onSelect }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="100%"
      style={{ display: 'block', cursor: 'default' }}
    >
      <defs>
        {/* Minor grid */}
        <pattern id="wm-grid-minor" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 H0 V20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        </pattern>
        {/* Major grid */}
        <pattern id="wm-grid-major" width="100" height="100" patternUnits="userSpaceOnUse">
          <path d="M100 0 H0 V100" fill="none" stroke="rgba(34,197,94,0.06)" strokeWidth="1" />
        </pattern>
        {/* Flow arrow marker */}
        <marker id="wm-arrow" viewBox="0 0 10 10" refX="8" refY="5"
          markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="rgba(34,197,94,0.45)" />
        </marker>
      </defs>

      {/* Grid background */}
      <rect width={W} height={H} fill="url(#wm-grid-minor)" />
      <rect width={W} height={H} fill="url(#wm-grid-major)" />

      {/* Plant outline */}
      <rect x="20" y="20" width={W - 40} height={H - 40}
        fill="none" stroke="rgba(100,116,139,0.4)" strokeDasharray="5 5" strokeWidth="1" />

      {/* Axis labels */}
      {['A','B','C','D','E','F','G','H'].map((l, i) => (
        <text key={l} x={20 + i * 104} y={14}
          fontFamily="JetBrains Mono, monospace" fontSize="8"
          fill="rgba(100,116,139,0.6)">{l}</text>
      ))}
      {[1, 2, 3, 4].map((n, i) => (
        <text key={n} x={7} y={40 + i * 105}
          fontFamily="JetBrains Mono, monospace" fontSize="8"
          fill="rgba(100,116,139,0.6)">{n}</text>
      ))}

      {/* Zones */}
      {ZONES.map(z => (
        <g key={z.k}>
          <rect x={z.x} y={z.y} width={z.w} height={z.h}
            fill="rgba(255,255,255,0.012)"
            stroke="rgba(100,116,139,0.25)"
            strokeWidth="1" />
          <text x={z.x + 8} y={z.y + 14}
            fontFamily="Barlow Condensed, sans-serif"
            fontSize="10" letterSpacing="2"
            fill="rgba(100,116,139,0.55)">{z.label}</text>
        </g>
      ))}

      {/* Flow arrows between zones */}
      <g stroke="rgba(34,197,94,0.2)" strokeWidth="1" fill="none">
        <path d="M445 150 L460 150" markerEnd="url(#wm-arrow)" />
        <path d="M445 305 L460 305" markerEnd="url(#wm-arrow)" />
        <path d="M575 390 L730 390" markerEnd="url(#wm-arrow)" />
        <path d="M310 390 L320 390" markerEnd="url(#wm-arrow)" />
      </g>

      {/* Machines */}
      {machines.map(m => {
        const pos = MACHINE_POSITIONS[m.id];
        if (!pos) return null;
        const meta = STATUS_META[m.status] || STATUS_META.offline;
        const sel = selectedId === m.id;
        return (
          <g key={m.id}
            transform={`translate(${pos.x} ${pos.y})`}
            style={{ cursor: 'pointer' }}
            onClick={() => onSelect(m.id)}
            role="button"
            aria-label={`${m.id} — ${meta.lbl}`}
          >
            {/* Pulsing ring for warn/crit */}
            {meta.ring && (
              <>
                <circle r="20" fill="none" stroke={meta.c} strokeWidth="1" opacity="0">
                  <animate attributeName="r" values="14;28" dur="1.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="1.6s" repeatCount="indefinite" />
                </circle>
                <circle r="20" fill="none" stroke={meta.c} strokeWidth="0.8" opacity="0">
                  <animate attributeName="r" values="14;28" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0" dur="1.6s" begin="0.5s" repeatCount="indefinite" />
                </circle>
              </>
            )}

            {/* Selection halo */}
            {sel && (
              <rect x="-24" y="-20" width="48" height="40"
                fill="none" stroke="var(--green-400, #22c55e)"
                strokeWidth="1" strokeDasharray="3 3"
                opacity="0.8" />
            )}

            {/* Machine body */}
            <rect x="-18" y="-14" width="36" height="28"
              fill="rgba(0,0,0,0.55)"
              stroke={meta.c}
              strokeWidth={sel ? 1.8 : 1.2}
              style={{ filter: `drop-shadow(0 0 4px ${meta.c}66)` }} />

            {/* Interior detail lines (CNC-style faceplate) */}
            <rect x="-14" y="-10" width="8" height="4"
              fill={meta.c} opacity="0.85" />
            <rect x="-4" y="-10" width="18" height="1.8"
              fill="rgba(255,255,255,0.18)" />
            <rect x="-4" y="-6" width="12" height="1.4"
              fill="rgba(255,255,255,0.12)" />
            <rect x="-14" y="-4" width="28" height="1"
              fill="rgba(255,255,255,0.06)" />

            {/* Status light */}
            <circle cx="12" cy="10" r="2.5" fill={meta.c}
              style={{ filter: `drop-shadow(0 0 3px ${meta.c})` }}>
              {m.status === 'critical' && (
                <animate attributeName="opacity" values="1;0.2;1" dur="0.8s" repeatCount="indefinite" />
              )}
            </circle>

            {/* ID label */}
            <text y="26" textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontWeight="600"
              fontSize="9"
              fill={sel ? 'var(--green-400, #22c55e)' : 'rgba(226,232,240,0.9)'}
              style={{ textShadow: sel ? `0 0 6px ${meta.c}` : 'none' }}>
              {m.id}
            </text>

            {/* Health % */}
            <text y="36" textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="8"
              fill={m.health < 50 ? '#ef4444' : m.health < 80 ? '#f59e0b' : 'rgba(100,116,139,0.7)'}>
              {m.status === 'offline' ? 'OFF' : `${m.health}%`}
            </text>
          </g>
        );
      })}

      {/* Legend */}
      <g transform={`translate(28 ${H - 22})`}>
        {Object.entries(STATUS_META).map(([k, v], i) => (
          <g key={k} transform={`translate(${i * 95} 0)`}>
            <rect x="0" y="-6" width="8" height="8"
              fill={v.c}
              style={{ filter: `drop-shadow(0 0 2px ${v.c})` }} />
            <text x="14" y="2"
              fontFamily="Barlow Condensed, sans-serif"
              fontSize="10" letterSpacing="1.5"
              fill="rgba(148,163,184,0.8)">{v.lbl}</text>
          </g>
        ))}
      </g>
    </svg>
  );
}
