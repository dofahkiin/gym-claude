// src/components/ui/WorkoutCard.js - Fixed circular dependency
import React from 'react';
import { Link } from 'react-router-dom';
// Don't import Card from './Card' as it might create circular dependency
// Just use the CSS classes directly

/**
 * WorkoutCard component for displaying workout summary
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Workout ID
 * @param {string} props.name - Workout name
 * @param {string} props.exerciseCount - Number of exercises in workout
 * @param {string} props.completionStatus - Status of workout completion
 */
const WorkoutCard = ({
  id,
  name,
  exerciseCount,
  completionStatus,
  ...rest
}) => {
  return (
    <Link
      to={`/workout/${id}`}
      className="workout-card"
      {...rest}
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">{name}</h3>
          {completionStatus && (
            <span className={`text-xs px-2 py-1 rounded-full ${
              completionStatus === 'Completed'
                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300'
                : 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300'
            }`}>
              {completionStatus}
            </span>
          )}
        </div>
        
        {exerciseCount && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-gray-500 dark:text-gray-400 text-sm">View exercises</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Link>
  );
};

export default WorkoutCard;