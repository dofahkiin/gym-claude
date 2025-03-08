// src/components/ui/Button.js
import React from 'react';

/**
 * Button component with various style variations
 * 
 * @param {Object} props - Component props
 * @param {string} props.variant - Button style variant: 'primary', 'secondary', 'danger'
 * @param {boolean} props.rounded - Whether to use rounded style
 * @param {boolean} props.loading - Whether to show loading state
 * @param {boolean} props.disabled - Whether button is disabled
 * @param {boolean} props.fullWidth - Whether button should take full width
 * @param {string} props.size - Button size: 'sm', 'md', 'lg'
 * @param {React.ReactNode} props.children - Button content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Click handler
 */
const Button = ({ 
  variant = 'primary',
  rounded = false,
  loading = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  children,
  className = '',
  onClick,
  ...rest
}) => {
  // Base classes
  let classes = 'btn transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ';
  
  // Variant classes
  switch (variant) {
    case 'primary':
      classes += 'btn-primary ';
      break;
    case 'secondary':
      classes += 'btn-secondary ';
      break;
    case 'danger':
      classes += 'btn-danger ';
      break;
    default:
      classes += 'btn-primary ';
  }
  
  // Size classes
  switch (size) {
    case 'sm':
      classes += 'px-3 py-1 text-sm ';
      break;
    case 'lg':
      classes += 'px-6 py-3 text-lg ';
      break;
    default:
      classes += 'px-4 py-2 ';
  }
  
  // Rounded
  if (rounded) {
    classes += 'btn-rounded ';
  }
  
  // Full width
  if (fullWidth) {
    classes += 'w-full ';
  }
  
  // Disabled state
  if (disabled) {
    classes += 'opacity-50 cursor-not-allowed ';
  }
  
  // Add any custom classes
  classes += className;
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      onClick={onClick}
      {...rest}
    >
      {loading ? (
        <div className="flex items-center justify-center">
          <svg className="loading-spinner h-5 w-5 -ml-1 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      ) : children}
    </button>
  );
};

export default Button;