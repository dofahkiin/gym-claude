// Exercise.js component with dark mode support
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import RestTimer from './RestTimer';

const Exercise = ({ isWorkoutActive, darkMode }) => {
  const { id, day } = useParams();
  const [exercise, setExercise] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Initialize timer state from localStorage
  const [timerStartTime, setTimerStartTime] = useState(null);

  const navigate = useNavigate();

  // Fetch all exercises for this workout day
  useEffect(() => {
    const fetchWorkoutExercises = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/workouts/${day}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch workout data');
        }
        
        const data = await response.json();
        setExercises(data.exercises);
      } catch (err) {
        setError(err.message);
      }
    };

    if (day) {
      fetchWorkoutExercises();
    }
  }, [day]);

  // Rest of your useEffect hooks and functions remain the same
  // ...

  if (error) return (
    <div className="p-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 text-red-700 dark:text-red-300 rounded">
      <div className="flex items-center">
        <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>Error: {error}</p>
      </div>
    </div>
  );
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-gray-700 dark:text-gray-200">Loading exercise...</span>
        </div>
      </div>
    );
  }

  if (!exercise || !Array.isArray(exercise.sets)) {
    return <div className="p-4 text-red-500 dark:text-red-400">Failed to load exercise data</div>;
  }

  // Count completed sets
  const completedSets = exercise.sets.filter(set => set.completed).length;

  return (
    <div>
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-800 dark:to-purple-800 px-6 py-4 text-white">
          <h1 className="text-xl font-bold">{exercise.name}</h1>
          <div className="flex items-center mt-1 text-indigo-100 text-sm">
            <span>{completedSets} of {exercise.sets.length} sets completed</span>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Exercise {currentIndex + 1} of {exercises?.length || 0}
            </span>
            <div className="flex space-x-2">
              <button
                onClick={() => handleNavigation('prev')}
                disabled={currentIndex === 0}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Previous</span>
              </button>
              <button
                onClick={() => navigate(`/workout/${day}`)}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm"
              >
                Back to Workout
              </button>
              <button
                onClick={() => handleNavigation('next')}
                disabled={currentIndex === (exercises?.length || 0) - 1}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full disabled:opacity-50 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm flex items-center space-x-1"
              >
                <span>Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-indigo-600 dark:bg-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / (exercises?.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rest Timer - show prominently if active */}
      {showTimer && (
        <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 shadow-md">
          <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-3 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Rest Timer
          </h3>
          <RestTimer 
            onComplete={handleTimerComplete}
            startTime={timerStartTime}
            duration={90}
            darkMode={darkMode}
          />
        </div>
      )}

      {/* Exercise Sets */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Sets</h3>
        <div className="space-y-3">
          {exercise.sets.map((set, index) => (
            <div 
              key={index} 
              className={`bg-white dark:bg-gray-800 rounded-lg p-4 shadow transition-all duration-300 ${
                set.completed ? 'border-l-4 border-green-500' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex-none w-8 h-8 bg-indigo-100 dark:bg-indigo-900/60 rounded-full flex items-center justify-center text-indigo-800 dark:text-indigo-300 font-medium">
                  {index + 1}
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={set.weight}
                    className="w-16 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    step="0.5"
                    onChange={(e) => handleInputChange(index, 'weight', e.target.value)}
                  />
                  <span className="text-gray-600 dark:text-gray-300">Kg</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={set.reps}
                    className="w-16 p-2 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    onChange={(e) => handleInputChange(index, 'reps', e.target.value)}
                  />
                  <span className="text-gray-600 dark:text-gray-300">Reps</span>
                </div>
                
                <div className="ml-auto">
                  <button
                    onClick={() => handleSetCompletion(index)}
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
          ))}
        </div>
      </div>

      {/* History Button */}
      <div className="grid grid-cols-1 gap-4">
        <button
          onClick={() => navigate(`/exercise/${id}/history`)}
          className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-600 dark:to-purple-700 text-white p-4 rounded-lg hover:from-indigo-600 hover:to-purple-700 dark:hover:from-indigo-700 dark:hover:to-purple-800 shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          View Exercise History
        </button>
      </div>
    </div>
  );
};

export default Exercise;