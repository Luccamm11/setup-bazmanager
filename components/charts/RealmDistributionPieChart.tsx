import React from 'react';
import { Realm } from '../../types';

interface RealmDistributionPieChartProps {
    stats: { [key in Realm]: number };
}

const realmOrder: Realm[] = [
  Realm.Programming, 
  Realm.Engineering, 
  Realm.TechnicalWriting, 
  Realm.Networking, 
  Realm.Planning, 
  Realm.Oratory, 
  Realm.Creativity, 
  Realm.FirstCulture,
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
};

const PieChartSlice: React.FC<{
    color: string;
    percentage: number;
    startAngle: number;
    radius: number;
    center: number;
}> = ({ color, percentage, startAngle, radius, center }) => {
    const endAngle = startAngle + (percentage * 360);
    const largeArcFlag = percentage > 0.5 ? 1 : 0;

    const startX = center + radius * Math.cos((startAngle - 90) * Math.PI / 180);
    const startY = center + radius * Math.sin((startAngle - 90) * Math.PI / 180);
    const endX = center + radius * Math.cos((endAngle - 90) * Math.PI / 180);
    const endY = center + radius * Math.sin((endAngle - 90) * Math.PI / 180);

    const pathData = [
        `M ${center},${center}`,
        `L ${startX},${startY}`,
        `A ${radius},${radius} 0 ${largeArcFlag} 1 ${endX},${endY}`,
        'Z'
    ].join(' ');

    return <path d={pathData} fill={color} />;
};


const RealmDistributionPieChart: React.FC<RealmDistributionPieChartProps> = ({ stats }) => {
    const size = 300;
    const center = size / 2;
    const radius = center - 50;

    const totalStatPoints = (Object.values(stats) as number[]).reduce((sum, val) => sum + val, 0);

    if (totalStatPoints === 0) {
        return (
            <div className="flex items-center justify-center h-full text-text-muted">
                No quest data to display.
            </div>
        );
    }
    
    let cumulativeAngle = 0;
    const slices = realmOrder.map(realm => {
        const value = stats[realm] || 0;
        const percentage = value / totalStatPoints;
        const slice = {
            realm,
            percentage,
            startAngle: cumulativeAngle,
            color: realmColors[realm]
        };
        cumulativeAngle += percentage * 360;
        return slice;
    }).filter(s => s.percentage > 0);

    return (
        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
            <svg viewBox={`0 0 ${size} ${size}`} width={200} height={200} >
                {slices.map(slice => (
                     <PieChartSlice
                        key={slice.realm}
                        color={slice.color}
                        percentage={slice.percentage}
                        startAngle={slice.startAngle}
                        radius={radius}
                        center={center}
                    />
                ))}
            </svg>
            <div className="space-y-2">
                {slices.map(slice => (
                    <div key={slice.realm} className="flex items-center text-sm">
                        <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: slice.color }}></span>
                        <span className="text-text-secondary font-semibold w-24">{slice.realm}</span>
                        <span className="text-text-primary font-mono">{ (slice.percentage * 100).toFixed(1) }%</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RealmDistributionPieChart;