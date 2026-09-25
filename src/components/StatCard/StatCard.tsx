import React from 'react';
import './StatCard.css';

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  accent?: 'blue' | 'purple' | 'magenta' | 'orange' | 'green';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtitle,
  icon,
  accent = 'blue',
}) => {
  return (
    <div className={`stat-card stat-card--${accent}`}>
      <div className="stat-card__header">
        <span className="stat-card__label">{label}</span>
        {icon && <div className="stat-card__icon">{icon}</div>}
      </div>
      <div className="stat-card__value">{value}</div>
      {subtitle && <div className="stat-card__subtitle">{subtitle}</div>}
    </div>
  );
};
