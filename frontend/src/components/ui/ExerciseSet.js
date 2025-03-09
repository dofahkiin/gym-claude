// src/components/ui/ExerciseSet.js - Updated with remove button
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
 * @param {Function} props.onRemove - Handler for removing this set
 * @param {boolean} props.canRemove - Whether this set can be removed
 * @param {boolean} props.isWorkoutActive - Whether workout is active
 * @param {boolean} props.editMode - Whether the exercise is in edit mode
 */
const ExerciseSet = ({
  index,
  set,
  onWeightChange,
  onRepsChange,
  onCompletionToggle,
  onRemove,
  canRemove = true, 
  isWorkoutActive = true,
  editMode = false,
  ...rest
}) => {
  return (
    <div 
      className={`exercise-set ${set.completed ? 'exercise-set-completed' : ''}`}
      {...rest}
    >
      <div className="flex items-center justify-between w-full">
        <div className="set-number flex-shrink-0">
          {index + 1}
        </div>
        
        {/* Evenly distributed inputs */}
        <div className="flex items-center justify-center flex-grow mx-6">
          <div className="flex items-center gap-2 w-1/2 justify-center">
            <input
              type="number"
              value={set.weight}
              className="form-input w-16"
              step="0.5"
              onChange={(e) => onWeightChange(index, e.target.value)}
            />
            <span className="text-gray-600 dark:text-gray-300">Kg</span>
          </div>
          
          <div className="flex items-center gap-2 w-1/2 justify-center">
            <input
              type="number"
              value={set.reps}
              className="form-input w-16"
              onChange={(e) => onRepsChange(index, e.target.value)}
            />
            <span className="text-gray-600 dark:text-gray-300">Reps</span>
          </div>
        </div>
        
        <div className="flex-shrink-0 flex items-center">
          {/* Delete button - only visible in edit mode */}
          {editMode && canRemove && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="mr-2 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Remove set"
              type="button"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {/* Completion toggle button */}
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