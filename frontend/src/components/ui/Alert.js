// src/components/ui/Alert.js
import React from 'react';

/**
 * Alert component for notifications and messages
 * 
 * @param {Object} props - Component props
 * @param {string} props.type - Alert type: 'error', 'success', 'info', 'warning'
 * @param {React.ReactNode} props.children - Alert content
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onDismiss - Handler for dismissing the alert
 * @param {boolean} props.dismissible - Whether the alert can be dismissed
 */
const Alert = ({
  type = 'info',
  children,
  className = '',
  onDismiss,
  dismissible = false,
  ...rest
}) => {
  // Base alert class
  let classes = 'alert ';
  
  // Icon to show based on type
  let icon;
  
  // Type-specific classes and icon
  switch (type) {
    case 'error':
      classes += 'alert-error ';
      icon = (
        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
    case 'success':
      classes += 'alert-success ';
      icon = (
        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      );
      break;
    case 'warning':
      classes += 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300 border-l-4 border-yellow-500 ';
      icon = (
        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      break;
    case 'info':
    default:
      classes += 'alert-info ';
      icon = (
        <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      break;
  }
  
  // Add custom classes
  classes += className;
  
  return (
    <div className={classes} {...rest}>
      <div className="flex items-center">
        {icon}
        <div className="flex-1">{children}</div>
        {dismissible && (
          <button
            type="button"
            className="ml-auto -mx-1.5 -my-1.5 rounded-lg focus:ring-2 p-1.5 inline-flex h-8 w-8 hover:bg-black/10"
            aria-label="Close"
            onClick={onDismiss}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Alert;