// src/components/ui/Notification.js
import React, { useEffect, useState } from 'react';

/**
 * Toast notification component
 * 
 * @param {Object} props - Component props
 * @param {string} props.message - Notification message
 * @param {string} props.type - Notification type: 'success', 'error', 'info', 'warning'
 * @param {number} props.duration - Auto-dismiss duration in milliseconds
 * @param {Function} props.onDismiss - Handler for dismissing the notification
 * @param {boolean} props.show - Whether to show the notification
 */
const Notification = ({
  message,
  type = 'success',
  duration = 3000,
  onDismiss,
  show = true
}) => {
  const [isVisible, setIsVisible] = useState(show);
  
  useEffect(() => {
    setIsVisible(show);
    
    if (show && duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onDismiss) {
          onDismiss();
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onDismiss]);
  
  if (!isVisible) return null;
  
  // Type-based classes
  let typeClass;
  let icon;
  
  switch (type) {
    case 'error':
      typeClass = 'notification-error';
      icon = (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
      break;
    case 'warning':
      typeClass = 'bg-yellow-500 dark:bg-yellow-600';
      icon = (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
      );
      break;
    case 'info':
      typeClass = 'bg-blue-500 dark:bg-blue-600';
      icon = (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
      );
      break;
    case 'success':
    default:
      typeClass = 'notification-success';
      icon = (
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
        </svg>
      );
  }
  
  return (
    <div className={`notification ${typeClass}`}>
      <div className="flex items-center">
        {icon}
        <span>{message}</span>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-white/10 focus:outline-none"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default Notification;