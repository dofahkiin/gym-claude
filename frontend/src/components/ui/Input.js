// src/components/ui/Input.js
import React from 'react';

/**
 * Input component with label and error handling
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Input id
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, email, password, etc)
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.error - Error message
 * @param {boolean} props.required - Whether the field is required
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.placeholder - Input placeholder
 * @param {boolean} props.disabled - Whether the input is disabled
 */
const Input = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  className = '',
  placeholder,
  disabled = false,
  ...rest
}) => {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`form-input ${error ? 'border-red-500 dark:border-red-500 focus:ring-red-500 focus:border-red-500' : ''}`}
        {...rest}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
};

export default Input;