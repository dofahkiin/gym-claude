// src/components/ui/Loading.js
import React from 'react';

/**
 * Loading spinner component with different sizes and options
 * 
 * @param {Object} props - Component props
 * @param {string} props.size - Spinner size: 'sm', 'md', 'lg'
 * @param {string} props.text - Text to display next to the spinner
 * @param {boolean} props.fullPage - Whether to display in full page mode
 * @param {string} props.color - Color override for the spinner
 * @param {string} props.className - Additional CSS classes
 */
const Loading = ({
  size = 'md',
  text,
  fullPage = false,
  color,
  className = '',
  ...rest
}) => {
  // Size classes
  let sizeClass;
  switch (size) {
    case 'sm':
      sizeClass = 'h-4 w-4';
      break;
    case 'lg':
      sizeClass = 'h-12 w-12';
      break;
    case 'md':
    default:
      sizeClass = 'h-8 w-8';
  }
  
  // Base spinner classes
  const spinnerClasses = `loading-spinner ${sizeClass} ${color ? '' : ''} ${className}`;
  
  // Full page layout
  if (fullPage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className={spinnerClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: color || 'currentColor' }} {...rest}>
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {text && <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">{text}</p>}
        </div>
      </div>
    );
  }
  
  // Normal inline display
  return (
    <div className="flex items-center">
      <svg className={spinnerClasses} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ color: color || 'currentColor' }} {...rest}>
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      {text && <span className="ml-3 text-gray-700 dark:text-gray-200">{text}</span>}
    </div>
  );
};

export default Loading;