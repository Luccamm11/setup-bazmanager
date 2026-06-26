import React from 'react';
import { Realm } from '../../types';
import { useTranslation } from 'react-i18next';

interface StatsRadarChartProps {
    stats: { [key in Realm]: number };
    initialStats?: { [key in Realm]?: number };
}

const realmOrder: Realm[] = [
    Realm.Programming,
    Realm.Engineering,
    Realm.TechnicalWriting,
    Realm.Networking,
    Realm.Planning,
    Realm.Oratory,
    Realm.Creativity,
    Realm.FirstCulture
];

const StatsRadarChart: React.FC<StatsRadarChartProps> = ({ stats, initialStats }) => {
    const { t } = useTranslation(['common']);
    const size = 300;
    const center = size / 2;
    const radius = center - 40;
    const numSides = realmOrder.length;
    const angleSlice = (Math.PI * 2) / numSides;
    const maxStatValue = 100;

    const getPoint = (value: number, index: number, customRadius?: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        const r = customRadius !== undefined ? customRadius : (value / maxStatValue) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    // Current stats polygon (red when initialStats present, blue otherwise)
    const currentPoints = realmOrder.map((realm, i) => getPoint(stats[realm] || 0, i));
    const currentPointString = currentPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Initial stats polygon (blue)
    const initialPoints = initialStats
        ? realmOrder.map((realm, i) => getPoint(initialStats[realm] || 0, i))
        : null;
    const initialPointString = initialPoints?.map(p => `${p.x},${p.y}`).join(' ');

    const hasTwo = !!initialStats;

    return (
        <div className="flex flex-col items-center gap-3">
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
                        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#30363D" strokeWidth="1" />;
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
                                fill={hasTwo ? 'rgba(255,255,255,0.6)' : '#8B949E'}
                                style={{ fontSize: '9px', fontWeight: 700 }}
                            >
                                {t(`common:realm.${realm}`)}
                            </text>
                        );
                    })}

                    {/* Initial Stats Polygon — BLUE (rendered first, below) */}
                    {initialPoints && initialPointString && (
                        <>
                            <polygon
                                points={initialPointString}
                                fill="rgba(88, 166, 255, 0.25)"
                                stroke="#58A6FF"
                                strokeWidth="2.5"
                                className="drop-shadow-[0_0_6px_rgba(88,166,255,0.4)]"
                            />
                            {initialPoints.map((p, i) => (
                                <circle key={`init-${i}`} cx={p.x} cy={p.y} r="3" fill="#58A6FF" className="drop-shadow-[0_0_4px_rgba(88,166,255,0.8)]" />
                            ))}
                        </>
                    )}

                    {/* Current Stats Polygon — RED (with initialStats) or BLUE (alone) */}
                    <polygon
                        points={currentPointString}
                        fill={hasTwo ? 'rgba(248, 81, 73, 0.25)' : 'rgba(88, 166, 255, 0.3)'}
                        stroke={hasTwo ? '#f85149' : '#58A6FF'}
                        strokeWidth={hasTwo ? 2.5 : 3}
                        className={hasTwo
                            ? 'drop-shadow-[0_0_6px_rgba(248,81,73,0.5)]'
                            : 'drop-shadow-[0_0_8px_rgba(88,166,255,0.5)]'
                        }
                    />
                    {currentPoints.map((p, i) => (
                        <circle
                            key={`curr-${i}`}
                            cx={p.x} cy={p.y} r="3"
                            fill={hasTwo ? '#f85149' : '#58A6FF'}
                            className={hasTwo
                                ? 'drop-shadow-[0_0_4px_rgba(248,81,73,0.8)]'
                                : 'drop-shadow-[0_0_5px_rgba(88,166,255,0.8)]'
                            }
                        />
                    ))}
                </g>
            </svg>

            {/* Legenda (só aparece quando há dois gráficos) */}
            {hasTwo && (
                <div className="flex items-center gap-5 text-xs font-bold">
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#58A6FF] shadow-[0_0_6px_rgba(88,166,255,0.8)]" />
                        <span className="text-[#58A6FF]">Nível Inicial</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="inline-block w-3 h-3 rounded-full bg-[#f85149] shadow-[0_0_6px_rgba(248,81,73,0.8)]" />
                        <span className="text-[#f85149]">Nível Atual</span>
                    </span>
                </div>
            )}
        </div>
    );
};

export default StatsRadarChart;