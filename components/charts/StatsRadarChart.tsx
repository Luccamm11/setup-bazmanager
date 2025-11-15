import React from 'react';
import { Realm } from '../../types';

interface StatsRadarChartProps {
    stats: { [key in Realm]: number };
}

const realmOrder: Realm[] = [Realm.Mind, Realm.Creation, Realm.Spirit, Realm.Body, Realm.Social, Realm.Finance];

const realmColors: { [key in Realm]: string } = {
  [Realm.Mind]: "#58A6FF",       // accent-primary
  [Realm.Body]: "#DA3633",       // accent-red
  [Realm.Creation]: "#E3B341",   // accent-secondary
  [Realm.Spirit]: "#A371F7",     // accent-tertiary
  [Realm.Creativity]: "#58A6FF",
  [Realm.Finance]: "#238636",    // accent-green
  [Realm.Social]: "#58A6FF",
  [Realm.Meta]: "#8B949E",       // text-secondary
};

const StatsRadarChart: React.FC<StatsRadarChartProps> = ({ stats }) => {
    const size = 300;
    const center = size / 2;
    const radius = center - 30;
    const numSides = realmOrder.length;
    const angleSlice = (Math.PI * 2) / numSides;

    const maxStatValue = Math.max(...(Object.values(stats) as number[]), 15);

    const getPoint = (value: number, index: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        const currentRadius = (value / maxStatValue) * radius;
        return {
            x: center + currentRadius * Math.cos(angle),
            y: center + currentRadius * Math.sin(angle),
        };
    };

    const points = realmOrder.map((realm, i) => getPoint(stats[realm], i));
    const pointString = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
         <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
             <g>
                {/* Grid lines */}
                {[0.25, 0.5, 0.75, 1].map(level => (
                    <polygon
                        key={level}
                        points={Array.from({ length: numSides }).map((_, i) => {
                            const p = getPoint(maxStatValue * level, i);
                            return `${p.x},${p.y}`;
                        }).join(' ')}
                        fill="none"
                        stroke="#30363D"
                        strokeWidth="1"
                    />
                ))}
                {/* Spokes */}
                {Array.from({ length: numSides }).map((_, i) => {
                     const p = getPoint(maxStatValue, i);
                     return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#30363D" strokeWidth="1" />
                })}
                {/* Labels */}
                 {realmOrder.map((realm, i) => {
                    const p = getPoint(maxStatValue * 1.15, i);
                     return (
                         <text
                            key={realm}
                            x={p.x}
                            y={p.y}
                            textAnchor="middle"
                            dy="0.3em"
                            fill={realmColors[realm]}
                            fontSize="12"
                            fontWeight="bold"
                        >
                            {realm}
                        </text>
                     );
                 })}
                 {/* Data Polygon */}
                <polygon points={pointString} fill="rgba(88, 166, 255, 0.2)" stroke="#58A6FF" strokeWidth="2" />
                 {/* Data Points */}
                 {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="4" fill="#58A6FF" />
                 ))}
            </g>
        </svg>
    );
};

export default StatsRadarChart;