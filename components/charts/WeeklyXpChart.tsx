import React from 'react';
import { WeeklyProgress } from '../../types';

interface WeeklyXpChartProps {
    data: WeeklyProgress[];
}

const WeeklyXpChart: React.FC<WeeklyXpChartProps> = ({ data }) => {
    const maxValue = Math.max(...data.map(d => d.xp), 100); // Ensure a minimum height
    const width = 500;
    const height = 300;
    const chartHeight = height - 40; // For labels
    const barWidth = width / data.length;

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="title" role="img">
             <title id="title">Weekly XP Gain Chart</title>
             <style>{`
                .bar { transition: height 0.5s ease-out; }
             `}</style>
             <g>
                {data.map((d, i) => {
                    const barHeight = (d.xp / maxValue) * chartHeight;
                    const x = i * barWidth;
                    const y = chartHeight - barHeight;
                    return (
                        <g key={d.day}>
                            <rect
                                x={x + barWidth * 0.15}
                                y={y}
                                width={barWidth * 0.7}
                                height={barHeight}
                                fill="url(#barGradient)"
                                className="bar"
                                rx="4"
                            />
                             <text x={x + barWidth / 2} y={y - 8} textAnchor="middle" fill="currentColor" className="text-text-primary" fontSize="12" fontWeight="bold">
                                {d.xp}
                            </text>
                            <text x={x + barWidth / 2} y={height - 10} textAnchor="middle" fill="currentColor" className="text-text-secondary" fontSize="12">
                                {d.day}
                            </text>
                        </g>
                    );
                })}
                <line x1="0" y1={chartHeight} x2={width} y2={chartHeight} stroke="currentColor" className="text-border-color" strokeWidth="1" />
            </g>
             <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#A371F7" />
                    <stop offset="100%" stopColor="#58A6FF" />
                </linearGradient>
            </defs>
        </svg>
    );
};

export default WeeklyXpChart;