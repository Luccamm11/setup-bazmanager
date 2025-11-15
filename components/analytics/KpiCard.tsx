import React from 'react';

interface KpiCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: string; // e.g., 'text-green-400'
}

const KpiCard: React.FC<KpiCardProps> = ({ icon, title, value, color }) => {
  return (
    <div className="bg-primary p-4 rounded-lg border border-border-color flex items-center space-x-4">
      <div className={`p-3 rounded-full bg-background ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm text-text-secondary">{title}</p>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
      </div>
    </div>
  );
};

export default KpiCard;