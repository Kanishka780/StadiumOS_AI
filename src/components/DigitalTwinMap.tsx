import React, { useState, useMemo, useCallback } from 'react';
import type { Zone } from '../models/zone';
import { Users } from 'lucide-react';

interface DigitalTwinMapProps {
  zones: Zone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  blockedRoutes?: string[]; // list of zone IDs that security has blocked
}

interface ZonePathMetadata {
  id: string;
  label: string;
  textX: number;
  textY: number;
  type: 'path' | 'circle';
  d?: string;
  cx?: number;
  cy?: number;
  r?: number;
  textClass?: string;
}

const ZONE_METADATA: ZonePathMetadata[] = [
  {
    id: 'zone_metro',
    label: 'METRO',
    textX: 100,
    textY: 240,
    type: 'path',
    d: 'M 50 250 A 60 60 0 0 1 150 250 L 120 320 A 40 40 0 0 0 80 320 Z',
  },
  {
    id: 'zone_parking',
    label: 'PARKING',
    textX: 700,
    textY: 240,
    type: 'path',
    d: 'M 650 250 A 60 60 0 0 0 750 250 L 720 320 A 40 40 0 0 1 680 320 Z',
  },
  {
    id: 'zone_concourse',
    label: 'CONCOURSE',
    textX: 400,
    textY: 140,
    type: 'path',
    d: 'M 400 110 A 190 190 0 1 1 399.9 110 M 400 150 A 150 150 0 1 0 400.1 150',
    textClass: 'tracking-widest',
  },
  {
    id: 'zone_seating',
    label: 'SEATING BOWL',
    textX: 400,
    textY: 305,
    type: 'circle',
    cx: 400,
    cy: 300,
    r: 135,
    textClass: 'text-xs font-semibold fill-slate-300 tracking-wider',
  },
  {
    id: 'zone_gate_a',
    label: 'GATE A',
    textX: 260,
    textY: 150,
    type: 'path',
    d: 'M 220 180 A 250 250 0 0 1 310 110 L 330 145 A 210 210 0 0 0 250 205 Z',
    textClass: 'font-bold fill-slate-200',
  },
  {
    id: 'zone_gate_b',
    label: 'GATE B',
    textX: 540,
    textY: 150,
    type: 'path',
    d: 'M 490 110 A 250 250 0 0 1 580 180 L 550 205 A 210 210 0 0 0 470 145 Z',
    textClass: 'font-bold fill-slate-200',
  },
  {
    id: 'zone_gate_c',
    label: 'GATE C',
    textX: 540,
    textY: 460,
    type: 'path',
    d: 'M 580 420 A 250 250 0 0 1 490 490 L 470 455 A 210 210 0 0 0 550 395 Z',
    textClass: 'font-bold fill-slate-200',
  },
  {
    id: 'zone_gate_d',
    label: 'GATE D',
    textX: 260,
    textY: 460,
    type: 'path',
    d: 'M 310 490 A 250 250 0 0 1 220 420 L 250 395 A 210 210 0 0 0 330 455 Z',
    textClass: 'font-bold fill-slate-200',
  },
];

// Memoized individual zone path rendering item
const MapZoneItem = React.memo<{
  meta: ZonePathMetadata;
  zone: Zone;
  isBlocked: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}>(({ meta, zone, isBlocked, isSelected, isHovered, onSelect, onHover }) => {
  
  const pathClass = useMemo(() => {
    let baseColor = 'fill-emerald-500/20 stroke-emerald-400';
    let pulseClass = '';

    if (isBlocked || zone.overlayColor === 'crowd-critical') {
      baseColor = 'fill-rose-500/30 stroke-rose-500';
      pulseClass = 'animate-pulse';
    } else if (zone.overlayColor === 'crowd-warning') {
      baseColor = 'fill-amber-500/25 stroke-amber-500';
    }

    const borderStyle = isSelected 
      ? 'stroke-sky-400 stroke-[3px]' 
      : isHovered 
        ? 'stroke-slate-100 stroke-[2px]' 
        : 'stroke-[1.5px]';

    return `${baseColor} ${borderStyle} transition-all duration-300 cursor-pointer outline-none focus-visible:outline-sky-400 focus-visible:outline-offset-2 ${pulseClass}`;
  }, [zone.overlayColor, isBlocked, isSelected, isHovered]);

  const labelText = useMemo(() => {
    const statusText = isBlocked 
      ? 'Blocked' 
      : zone.overlayColor === 'crowd-critical' 
        ? 'Critical Congestion' 
        : zone.overlayColor === 'crowd-warning' 
          ? 'Moderate Congestion' 
          : 'Normal Density';
    return `${zone.name}: ${statusText}. Density ${zone.currentDensity}%. Flow rate ${zone.flowRate} fans per minute.`;
  }, [zone.name, zone.currentDensity, zone.flowRate, zone.overlayColor, isBlocked]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(zone.id);
    }
  };

  return (
    <g>
      {meta.type === 'circle' ? (
        <circle
          cx={meta.cx}
          cy={meta.cy}
          r={meta.r}
          className={pathClass}
          tabIndex={0}
          onMouseEnter={() => onHover(zone.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(zone.id)}
          onKeyDown={handleKeyDown}
          aria-label={labelText}
          role="button"
        />
      ) : (
        <path
          d={meta.d}
          className={pathClass}
          tabIndex={0}
          onMouseEnter={() => onHover(zone.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(zone.id)}
          onKeyDown={handleKeyDown}
          aria-label={labelText}
          role="button"
        />
      )}
      <text
        x={meta.textX}
        y={meta.textY}
        textAnchor="middle"
        className={meta.textClass || "text-[10px] fill-slate-400 font-medium"}
      >
        {meta.label}
      </text>
    </g>
  );
});

MapZoneItem.displayName = 'MapZoneItem';

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  blockedRoutes = [],
}) => {
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Fast indexing lookup map (O(N) vs O(N^2))
  const zoneLookup = useMemo(() => {
    return new Map<string, Zone>(zones.map((z) => [z.id, z]));
  }, [zones]);

  const handleSelect = useCallback((id: string) => {
    onSelectZone(id);
  }, [onSelectZone]);

  const handleHover = useCallback((id: string | null) => {
    setHoveredZoneId(id);
  }, []);

  return (
    <div className="w-full relative bg-slate-950/80 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-sky-400" />
          Interactive Stadium Digital Twin (Schematic Map)
        </h3>
        <div className="flex gap-4 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-400 block"></span>
            Normal
          </span>
          <span className="flex items-center gap-1.5 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/25 border border-amber-400 block"></span>
            Warning
          </span>
          <span className="flex items-center gap-1.5 text-rose-500">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/30 border border-rose-500 block animate-pulse"></span>
            Critical / Blocked
          </span>
        </div>
      </div>

      <div className="w-full aspect-[4/3] max-h-[500px]">
        <svg
          viewBox="0 0 800 600"
          className="w-full h-full select-none"
          aria-label="Stadium interactive layout overview map"
        >
          {/* Background Grid Lines & Aesthetic Elements */}
          <circle cx="400" cy="300" r="280" className="fill-none stroke-slate-900 stroke-1" />
          <circle cx="400" cy="300" r="210" className="fill-none stroke-slate-900 stroke-[0.5]" />
          <line x1="400" y1="20" x2="400" y2="580" className="stroke-slate-900 stroke-[0.5]" />
          <line x1="120" y1="300" x2="680" y2="300" className="stroke-slate-900 stroke-[0.5]" />

          {/* Dynamic Map Zone Items */}
          {ZONE_METADATA.map((meta) => {
            const zone = zoneLookup.get(meta.id);
            if (!zone) return null;

            return (
              <MapZoneItem
                key={meta.id}
                meta={meta}
                zone={zone}
                isBlocked={blockedRoutes.includes(meta.id)}
                isSelected={selectedZoneId === meta.id}
                isHovered={hoveredZoneId === meta.id}
                onSelect={handleSelect}
                onHover={handleHover}
              />
            );
          })}

          {/* Central Pitch Circle (Pure Visual) */}
          <ellipse cx="400" cy="300" rx="35" ry="25" className="fill-slate-900/50 stroke-slate-800 stroke-[1]" />
          <ellipse cx="400" cy="300" rx="15" ry="10" className="fill-none stroke-slate-800 stroke-[0.5]" />
        </svg>
      </div>

      {/* Accessibility overlay routes visual markers */}
      <div className="absolute top-18 left-8 flex flex-col gap-1 bg-slate-900/90 border border-slate-800 p-2 rounded text-[11px] text-slate-400">
        <span className="font-semibold text-slate-300">Accessibility Routes</span>
        <span className="flex items-center gap-1"><span className="w-4 h-1 border-t border-dashed border-sky-400 inline-block"></span>Wheelchair Route</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 border border-sky-400 flex items-center justify-center text-[8px] rounded-full">E</span> Elevator Lift</span>
      </div>
    </div>
  );
};
