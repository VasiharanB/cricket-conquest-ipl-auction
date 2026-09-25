import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helpText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helpText,
  id,
  required,
  className = '',
  ...props
}) => {
  const inputId = id || label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`input-group ${error ? 'input-group--error' : ''} ${className}`}>
      <label htmlFor={inputId} className="input-group__label">
        {label}
        {required && <span className="input-group__required">*</span>}
      </label>
      <input
        id={inputId}
        className="input-group__input"
        required={required}
        {...props}
      />
      {error && <span className="input-group__error">{error}</span>}
      {helpText && !error && <span className="input-group__help">{helpText}</span>}
    </div>
  );
};
