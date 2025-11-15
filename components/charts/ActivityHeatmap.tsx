import React from 'react';
import { ActivityData } from '../../types';

interface ActivityHeatmapProps {
    activityData: ActivityData[];
    currentDate: Date;
}

const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ activityData, currentDate }) => {
    const today = currentDate;
    const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dataByDate = activityData.reduce((acc, curr) => {
        acc[curr.date] = (acc[curr.date] || 0) + curr.xp;
        return acc;
    }, {} as Record<string, number>);

    const maxXP = Math.max(...(Object.values(dataByDate) as number[]), 0);

    const getColor = (xp: number) => {
        if (xp <= 0) return 'fill-border-color';
        return `fill-accent-primary`;
    };

     const getOpacity = (xp: number) => {
        if (xp <= 0) return 0.5;
        return Math.min(Math.max(xp / (maxXP * 0.75), 0.2), 1);
    }

    const getStartDate = () => {
        const startDate = new Date(today);
        startDate.setDate(today.getDate() - 182);
        // Align to the previous Sunday
        startDate.setDate(startDate.getDate() - startDate.getDay());
        return startDate;
    };
    
    const startDate = getStartDate();
    const dates = [];
    let currentDateIterator = new Date(startDate);
    
    // Ensure the grid fills up to the Saturday of the current week for a complete look
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + (6 - today.getDay()));

    while (currentDateIterator <= endDate) {
        dates.push(new Date(currentDateIterator));
        currentDateIterator.setDate(currentDateIterator.getDate() + 1);
    }
    
    const monthChanges = dates.reduce((acc, date, index) => {
        if (index > 0 && date.getMonth() !== dates[index-1].getMonth()) {
            acc.push({ index: Math.floor(index / 7), month: date.getMonth() });
        } else if (index === 0) {
            acc.push({ index: 0, month: date.getMonth() });
        }
        return acc;
    }, [] as {index: number, month: number}[]);

    return (
        <div className="flex items-start">
            <div className="flex flex-col text-xs text-text-secondary mr-2" style={{ paddingTop: '28px' }}>
                <div className="h-4"></div>
                <div className="h-4">Mon</div>
                <div className="h-4"></div>
                <div className="h-4">Wed</div>
                <div className="h-4"></div>
                <div className="h-4">Fri</div>
                <div className="h-4"></div>
            </div>
            <div className="overflow-x-auto pb-2">
                <svg width={dates.length / 7 * 16} height="128">
                    <g transform="translate(0, 20)">
                        {monthChanges.map(({ index, month }) => (
                            <text key={month} x={index * 16} y="-8" className="text-xs fill-current text-text-secondary">
                                {monthLabels[month]}
                            </text>
                        ))}
                        {dates.map((date, index) => {
                            const dateString = date.toISOString().split('T')[0];
                            const xp = dataByDate[dateString] || 0;
                            const color = getColor(xp);
                            const opacity = getOpacity(xp);
                            const x = Math.floor(index / 7) * 16;
                            const y = (index % 7) * 16;
                            
                            return (
                                <rect
                                    key={dateString}
                                    x={x}
                                    y={y}
                                    width="12"
                                    height="12"
                                    rx="2"
                                    ry="2"
                                    className={color}
                                    style={{opacity: opacity}}
                                >
                                    <title>{`${dateString}: ${xp} XP`}</title>
                                </rect>
                            );
                        })}
                    </g>
                </svg>
            </div>
        </div>
    );
};

export default ActivityHeatmap;