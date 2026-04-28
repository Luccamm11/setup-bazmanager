import React from 'react';
import { Realm } from '../../types';
import { useTranslation } from 'react-i18next';

interface StatsRadarChartProps {
    stats: { [key in Realm]: number };
}

const realmOrder: Realm[] = [
  Realm.Mind,
  Realm.Body,
  Realm.Creation,
  Realm.Spirit,
  Realm.Creativity,
  Realm.Finance,
  Realm.Social,
  Realm.Meta
];

const realmColors: { [key in Realm]: string } = {
  [Realm.Programming]: "#58A6FF",
  [Realm.Engineering]: "#F85149",
  [Realm.TechnicalWriting]: "#8B949E",
  [Realm.Networking]: "#3FB950",
  [Realm.Planning]: "#E3B341",
  [Realm.Oratory]: "#F85149",
  [Realm.Creativity]: "#BC8CFF",
  [Realm.FirstCulture]: "#38D39F",
  [Realm.Meta]: "#8B949E",
  [Realm.Mind]: "#58A6FF",
  [Realm.Body]: "#F85149",
  [Realm.Creation]: "#E3B341",
  [Realm.Spirit]: "#BC8CFF",
  [Realm.Finance]: "#3FB950",
  [Realm.Social]: "#38D39F",
};

const StatsRadarChart: React.FC<StatsRadarChartProps> = ({ stats }) => {
    const { t } = useTranslation(['common']);
    const size = 300;
    const center = size / 2;
    const radius = center - 40; // Aumentado o recuo para não cortar os nomes traduzidos
    const numSides = realmOrder.length;
    const angleSlice = (Math.PI * 2) / numSides;

    const maxStatValue = 100; // Normalizado para 100% já que os dados vêm em porcentagem no dashboard

    const getPoint = (value: number, index: number, customRadius?: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        const r = customRadius !== undefined ? customRadius : (value / maxStatValue) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    const points = realmOrder.map((realm, i) => getPoint(stats[realm] || 0, i));
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
                    const p = getPoint(maxStatValue, i, radius + 20);
                     return (
                         <text
                            key={realm}
                            x={p.x}
                            y={p.y}
                            textAnchor="middle"
                            dy="0.3em"
                            fill={realmColors[realm]}
                            className="text-[9px] font-black uppercase tracking-tighter"
                            style={{ fontSize: '9px' }}
                        >
                            {t(`common:realm.${realm}`)}
                        </text>
                     );
                 })}
                 {/* Data Polygon */}
                <polygon 
                    points={pointString} 
                    fill="rgba(88, 166, 255, 0.3)" 
                    stroke="#58A6FF" 
                    strokeWidth="3"
                    className="drop-shadow-[0_0_8px_rgba(88,166,255,0.5)]"
                />
                 {/* Data Points */}
                 {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3" fill="#58A6FF" className="drop-shadow-[0_0_5px_rgba(88,166,255,0.8)]" />
                 ))}
            </g>
        </svg>
    );
};

export default StatsRadarChart;