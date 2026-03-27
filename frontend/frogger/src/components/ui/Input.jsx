import React from 'react';

const Input = ({ 
  type = 'text', 
  placeholder = '', 
  value = '', 
  onChange, 
  label = '',
  error = '',
  required = false,
  name = '',
  disabled = false
}) => {
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={name} className="input-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      <input
        type={type}
        id={name}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-field ${error ? 'input-error' : ''}`}
        required={required}
      />
      {error && <span className="input-error-message">{error}</span>}
    </div>
  );
};

export default Input;
