import React from 'react';
import './ProgressBar.css';

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  showLabel?: boolean;
  color?: 'blue' | 'purple' | 'green' | 'orange';
  size?: 'sm' | 'md';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max,
  label,
  showLabel = true,
  color = 'blue',
  size = 'md',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className="progress-bar-wrapper">
      {(label || showLabel) && (
        <div className="progress-bar__header">
          {label && <span className="progress-bar__label">{label}</span>}
          {showLabel && (
            <span className="progress-bar__count">{value} / {max}</span>
          )}
        </div>
      )}
      <div className={`progress-bar progress-bar--${size}`}>
        <div
          className={`progress-bar__fill progress-bar__fill--${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
