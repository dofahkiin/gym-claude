// src/components/ui/ExerciseSet.js
import React from 'react';

/**
 * ExerciseSet component for displaying and editing exercise sets
 * 
 * @param {Object} props - Component props
 * @param {number} props.index - Set index
 * @param {Object} props.set - Set data {weight, reps, completed}
 * @param {Function} props.onWeightChange - Handler for weight changes
 * @param {Function} props.onRepsChange - Handler for reps changes
 * @param {Function} props.onCompletionToggle - Handler for completion toggle
 * @param {boolean} props.isWorkoutActive - Whether workout is active
 */
const ExerciseSet = ({
  index,
  set,
  onWeightChange,
  onRepsChange,
  onCompletionToggle,
  isWorkoutActive = true,
  ...rest
}) => {
  return (
    <div 
      className={`exercise-set ${set.completed ? 'exercise-set-completed' : ''}`}
      {...rest}
    >
      <div className="flex flex-wrap items-center gap-4">
        <div className="set-number">
          {index + 1}
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={set.weight}
            className="form-input w-16"
            step="0.5"
            onChange={(e) => onWeightChange(index, e.target.value)}
          />
          <span className="text-gray-600 dark:text-gray-300">Kg</span>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={set.reps}
            className="form-input w-16"
            onChange={(e) => onRepsChange(index, e.target.value)}
          />
          <span className="text-gray-600 dark:text-gray-300">Reps</span>
        </div>
        
        <div className="ml-auto">
          <button
            onClick={() => onCompletionToggle(index)}
            disabled={!isWorkoutActive}
            className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all ${
              !isWorkoutActive 
                ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' 
                : set.completed 
                  ? 'bg-green-100 dark:bg-green-900/40 hover:bg-green-200 dark:hover:bg-green-900/60' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isWorkoutActive ? 'Mark as completed' : 'Start workout to track sets'}
          >
            {set.completed && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseSet;