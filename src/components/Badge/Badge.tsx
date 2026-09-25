import React from 'react';
import './Badge.css';

interface BadgeProps {
  variant?: 'confirmed' | 'pending' | 'checked-in' | 'waitlisted' | 'sold' | 'unsold' | 'available' | 'live' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'info',
  children,
  size = 'sm',
  dot = false,
}) => {
  return (
    <span className={`badge badge--${variant} badge--${size}`}>
      {dot && <span className="badge__dot" />}
      {children}
    </span>
  );
};
