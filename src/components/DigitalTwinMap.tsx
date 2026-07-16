import React, { useState } from 'react';
import type { Zone } from '../models/zone';
import { Users } from 'lucide-react';

interface DigitalTwinMapProps {
  zones: Zone[];
  selectedZoneId: string | null;
  onSelectZone: (zoneId: string) => void;
  blockedRoutes?: string[]; // list of zone IDs that security has blocked
}

export const DigitalTwinMap: React.FC<DigitalTwinMapProps> = ({
  zones,
  selectedZoneId,
  onSelectZone,
  blockedRoutes = [],
}) => {
  const [hoveredZoneId, setHoveredZoneId] = useState<string | null>(null);

  // Helper to resolve CSS coloring for zones based on overlayColor or blocked state
  const getZoneStyles = (zone: Zone) => {
    const isBlocked = blockedRoutes.includes(zone.id);
    const isSelected = selectedZoneId === zone.id;
    const isHovered = hoveredZoneId === zone.id;

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

    return {
      pathClass: `${baseColor} ${borderStyle} transition-all duration-300 cursor-pointer outline-none focus-visible:outline-sky-400 focus-visible:outline-offset-2 ${pulseClass}`,
      isSelected
    };
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent, zoneId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectZone(zoneId);
    }
  };

  const getZoneLabel = (zone: Zone) => {
    const isBlocked = blockedRoutes.includes(zone.id);
    const statusText = isBlocked 
      ? 'Blocked' 
      : zone.overlayColor === 'crowd-critical' 
        ? 'Critical Congestion' 
        : zone.overlayColor === 'crowd-warning' 
          ? 'Moderate Congestion' 
          : 'Normal Density';
    return `${zone.name}: ${statusText}. Density ${zone.currentDensity}%. Flow rate ${zone.flowRate} fans per minute.`;
  };

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

          {/* Outer Transit Hubs & Parking Overlay zones */}
          {/* Zone 7: Transit Metro Station */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_metro');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <path
                  d="M 50 250 A 60 60 0 0 1 150 250 L 120 320 A 40 40 0 0 0 80 320 Z"
                  className={pathClass}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="100" y="240" textAnchor="middle" className="text-[10px] fill-slate-400 font-medium">METRO</text>
              </g>
            );
          })()}

          {/* Zone 6: Parking Lot 1 */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_parking');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <path
                  d="M 650 250 A 60 60 0 0 0 750 250 L 720 320 A 40 40 0 0 1 680 320 Z"
                  className={pathClass}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="700" y="240" textAnchor="middle" className="text-[10px] fill-slate-400 font-medium">PARKING</text>
              </g>
            );
          })()}

          {/* Stadium Inner Structure: Concourse Ring */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_concourse');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <path
                  d="M 400 110 A 190 190 0 1 1 399.9 110 M 400 150 A 150 150 0 1 0 400.1 150"
                  className={`${pathClass} fill-rule-evenodd`}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="400" y="140" textAnchor="middle" className="text-[10px] fill-slate-400 font-medium tracking-widest">CONCOURSE</text>
              </g>
            );
          })()}

          {/* Seating Bowl Central Area */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_seating');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <circle
                  cx="400"
                  cy="300"
                  r="135"
                  className={pathClass}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="400" y="305" textAnchor="middle" className="text-xs font-semibold fill-slate-300 tracking-wider">SEATING BOWL</text>
              </g>
            );
          })()}

          {/* Entry Gates overlays */}
          {/* Gate A (Top Left) */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_gate_a');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <path
                  d="M 220 180 A 250 250 0 0 1 310 110 L 330 145 A 210 210 0 0 0 250 205 Z"
                  className={pathClass}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="260" y="150" textAnchor="middle" className="text-[10px] font-bold fill-slate-200">GATE A</text>
              </g>
            );
          })()}

          {/* Gate B (Top Right) */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_gate_b');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <path
                  d="M 490 110 A 250 250 0 0 1 580 180 L 550 205 A 210 210 0 0 0 470 145 Z"
                  className={pathClass}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="540" y="150" textAnchor="middle" className="text-[10px] font-bold fill-slate-200">GATE B</text>
              </g>
            );
          })()}

          {/* Gate C (Bottom Right) */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_gate_c');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <path
                  d="M 580 420 A 250 250 0 0 1 490 490 L 470 455 A 210 210 0 0 0 550 395 Z"
                  className={pathClass}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="540" y="460" textAnchor="middle" className="text-[10px] font-bold fill-slate-200">GATE C</text>
              </g>
            );
          })()}

          {/* Gate D (Bottom Left) */}
          {(() => {
            const z = zones.find(x => x.id === 'zone_gate_d');
            if (!z) return null;
            const { pathClass } = getZoneStyles(z);
            return (
              <g>
                <path
                  d="M 310 490 A 250 250 0 0 1 220 420 L 250 395 A 210 210 0 0 0 330 455 Z"
                  className={pathClass}
                  tabIndex={0}
                  onMouseEnter={() => setHoveredZoneId(z.id)}
                  onMouseLeave={() => setHoveredZoneId(null)}
                  onClick={() => onSelectZone(z.id)}
                  onKeyDown={(e) => handleKeyDown(e, z.id)}
                  aria-label={getZoneLabel(z)}
                  role="button"
                />
                <text x="260" y="460" textAnchor="middle" className="text-[10px] font-bold fill-slate-200">GATE D</text>
              </g>
            );
          })()}

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
