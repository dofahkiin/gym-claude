// src/components/ui/Card.js
import React from 'react';

/**
 * Card component with optional gradient header
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes for the card
 * @param {string} props.title - Card title (for header)
 * @param {string} props.subtitle - Card subtitle (for header)
 * @param {boolean} props.gradientHeader - Whether to use gradient header
 * @param {React.ReactNode} props.headerContent - Custom header content
 * @param {React.ReactNode} props.headerAction - Action button/content for header
 */
const Card = ({
  children,
  className = '',
  title,
  subtitle,
  gradientHeader = false,
  headerContent,
  headerAction,
  ...rest
}) => {
  // Base card class
  const cardClasses = `card ${className}`;
  
  // Header classes
  const headerClasses = gradientHeader 
    ? 'card-gradient-header'
    : 'bg-gray-50 dark:bg-gray-800 px-6 py-4 border-b dark:border-gray-700';
  
  const hasHeader = title || subtitle || headerContent || headerAction;
  
  return (
    <div className={cardClasses} {...rest}>
      {hasHeader && (
        <div className={headerClasses}>
          {headerContent ? (
            headerContent
          ) : (
            <div className="flex items-center justify-between">
              <div>
                {title && <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>}
                {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
              </div>
              {headerAction && (
                <div>{headerAction}</div>
              )}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;