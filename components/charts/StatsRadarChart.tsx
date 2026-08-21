import React, { useRef } from 'react';
import { Realm } from '../../types';
import { useTranslation } from 'react-i18next';

interface StatsRadarChartProps {
    stats: { [key in Realm]: number };
    initialStats?: { [key in Realm]?: number };
    showCurrentLevel?: boolean;
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

const StatsRadarChart: React.FC<StatsRadarChartProps> = ({ stats, initialStats, showCurrentLevel = true }) => {
    const { t } = useTranslation(['common']);
    const size = 300;
    const center = size / 2;
    const radius = center - 40;
    const numSides = realmOrder.length;
    const angleSlice = (Math.PI * 2) / numSides;
    const maxStatValue = 100;

    // Generate a unique mask ID to avoid collision when multiple charts are rendered
    const maskId = useRef(`radar-mask-${Math.random().toString(36).substring(2, 9)}`).current;

    const getPoint = (value: number, index: number, customRadius?: number) => {
        const angle = angleSlice * index - Math.PI / 2;
        const r = customRadius !== undefined ? customRadius : (value / maxStatValue) * radius;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle),
        };
    };

    // Determine if we show two overlapping polygons (requires initialStats with actual non-zero values and filter active)
    const hasInitialValues = !!initialStats && Object.values(initialStats).some(val => typeof val === 'number' && val > 0);
    const hasTwo = hasInitialValues && showCurrentLevel;

    // Initial stats polygon (rendered in BLUE) - falls back to current stats if no initialStats available
    const initialData = hasInitialValues ? initialStats! : stats;
    const initialPoints = realmOrder.map((realm, i) => getPoint(initialData[realm] || 0, i));
    const initialPointString = initialPoints.map(p => `${p.x},${p.y}`).join(' ');

    // Current stats polygon (rendered in RED) — clamped so each axis is >= initialStats,
    // ensuring the red polygon is always at or outside the blue one when both exist.
    const currentPoints = realmOrder.map((realm, i) => {
        const currentVal = stats[realm] || 0;
        const initialVal = hasTwo ? (initialStats![realm] || 0) : 0;
        // Always use the greater of the two so red is never inside blue when initial exists
        const displayVal = hasTwo ? Math.max(currentVal, initialVal) : currentVal;
        return getPoint(displayVal, i);
    });
    const currentPointString = currentPoints.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="flex flex-col items-center gap-3">
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-auto">
                <defs>
                    {hasTwo && (
                        <mask id={maskId}>
                            {/* Make everything visible by default */}
                            <rect x="0" y="0" width={size} height={size} fill="white" />
                            {/* Cut out/exclude the initial stats area (render it as black) */}
                            <polygon points={initialPointString} fill="black" />
                        </mask>
                    )}
                </defs>
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

                    {/* Red Polygon (Current Stats — always at or outside the blue initial polygon) */}
                    {hasTwo && (
                        <>
                            {/* Gained XP area fill */}
                            <polygon
                                points={currentPointString}
                                fill="rgba(248, 81, 73, 0.25)"
                                mask={`url(#${maskId})`}
                            />
                            {/* Current level contour outline */}
                            <polygon
                                points={currentPointString}
                                fill="none"
                                stroke="#f85149"
                                strokeWidth="2"
                                className="drop-shadow-[0_0_4px_rgba(248,81,73,0.3)]"
                            />
                            {/* Current level vertices */}
                            {currentPoints.map((p, i) => (
                                <circle
                                    key={`curr-${i}`}
                                    cx={p.x} cy={p.y} r="3"
                                    fill="#f85149"
                                    className="drop-shadow-[0_0_3px_rgba(248,81,73,0.6)]"
                                />
                            ))}
                        </>
                    )}

                    {/* Blue Polygon (Initial Stats) — rendered AFTER red so it paints on top where they overlap */}
                    <polygon
                        points={initialPointString}
                        fill="rgba(88, 166, 255, 0.25)"
                        stroke="#58A6FF"
                        strokeWidth={hasTwo ? 2.5 : 3}
                        className="drop-shadow-[0_0_6px_rgba(88,166,255,0.4)]"
                    />
                    {initialPoints.map((p, i) => (
                        <circle key={`init-${i}`} cx={p.x} cy={p.y} r="3" fill="#58A6FF" className="drop-shadow-[0_0_4px_rgba(88,166,255,0.8)]" />
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