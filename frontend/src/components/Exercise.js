// Exercise.js component updated to use CSS classes
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

  // Fetch exercise data
  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/exercises/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch exercise data');
        }
        
        const data = await response.json();
        setExercise(data);

        // Check for existing timer
        const savedTimer = localStorage.getItem(`timer_${data._id}`);
        if (savedTimer) {
          const startTime = parseInt(savedTimer);
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          
          // Only set the timer if it hasn't expired
          if (elapsedSeconds < 90) {
            setTimerStartTime(startTime);
          } else {
            localStorage.removeItem(`timer_${data._id}`);
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseData();
  }, [id]);

  // Update current index when exercise and exercises list are loaded
  useEffect(() => {
    if (exercises.length > 0 && exercise) {
      const index = exercises.findIndex(ex => ex._id === exercise._id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [exercise, exercises]);

  // Handle navigation
  const handleNavigation = useCallback((direction) => {
    if (!exercises || !day) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < exercises.length) {
      const nextExercise = exercises[newIndex];
      navigate(`/workout/${day}/exercise/${nextExercise._id}`);
    }
  }, [currentIndex, exercises, navigate, day]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    if (!exercise) return;
    setTimerStartTime(null);
    localStorage.removeItem(`timer_${exercise._id}`);
  }, [exercise]);

  // Check timer expiration periodically
  useEffect(() => {
    if (!timerStartTime || !exercise) return;

    const checkTimer = () => {
      const elapsedSeconds = (Date.now() - timerStartTime) / 1000;
      if (elapsedSeconds >= 90) {
        handleTimerComplete();
      }
    };

    const intervalId = setInterval(checkTimer, 1000);
    return () => clearInterval(intervalId);
  }, [timerStartTime, exercise, handleTimerComplete]);

  // Calculate if timer should be shown
  const showTimer = useMemo(() => {
    if (!timerStartTime) return false;
    const elapsedSeconds = (Date.now() - timerStartTime) / 1000;
    return elapsedSeconds < 90;
  }, [timerStartTime]);

  // Update exercise data
  const updateExerciseData = useCallback(async (exerciseId, updatedData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!exerciseId) {
        throw new Error('No exercise ID provided');
      }

      const updateResponse = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sets: updatedData.sets
        }),
        credentials: 'include'
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Failed to update exercise data: ${errorData.message || updateResponse.statusText}`);
      }

      const getResponse = await fetch(`/api/exercises/${exerciseId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });

      if (!getResponse.ok) {
        throw new Error('Failed to fetch updated exercise data');
      }

      const data = await getResponse.json();
      setExercise(data);
      return data;
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Handle set completion
  const handleSetCompletion = useCallback(async (setIndex) => {
    if (!isWorkoutActive || !exercise) return;
    
    try {
      const updatedSets = exercise.sets.map((set, index) => {
        if (index === setIndex) {
          const newCompleted = !set.completed;
          if (newCompleted) {
            const startTime = Date.now();
            setTimerStartTime(startTime);
            localStorage.setItem(`timer_${exercise._id}`, startTime.toString());
          }
          return { ...set, completed: newCompleted };
        }
        return set;
      });

      const updatedExercise = await updateExerciseData(exercise._id, { sets: updatedSets });
      setExercise(updatedExercise);
    } catch (err) {
      console.error('Set completion error:', err);
      setError(err.message);
    }
  }, [exercise, isWorkoutActive, updateExerciseData]);

  // Add debounced update function
  const debouncedUpdate = useCallback(
    debounce(async (exerciseId, updatedSets) => {
      try {
        await updateExerciseData(exerciseId, { sets: updatedSets });
      } catch (err) {
        console.error('Failed to save exercise data:', err);
      }
    }, 500),
    [updateExerciseData]
  );

  // Handle input changes
  const handleInputChange = useCallback(async (index, field, value) => {
    if (!exercise) return;

    const updatedSets = exercise.sets.map((set, i) => 
      i === index 
        ? { 
            ...set, 
            [field]: field === 'weight' ? parseFloat(value) : parseInt(value)
          } 
        : set
    );

    setExercise(prev => ({ ...prev, sets: updatedSets }));
    debouncedUpdate(exercise._id, updatedSets);
  }, [exercise, debouncedUpdate]);

  if (error) return (
    <div className="alert alert-error">
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
      <div className="loading-container">
        <div className="flex items-center">
          <svg className="loading-spinner -ml-1 mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
      <div className="mb-8 card">
        <div className="card-gradient-header">
          <div className="flex items-center mb-1 -ml-2">
            <button
              onClick={() => navigate(`/workout/${day}`)}
              className="hover:bg-white/10 rounded-full p-1 transition-colors flex-shrink-0"
              aria-label="Back to workout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">{exercise.name}</h1>
          </div>
          <div className="flex items-center text-indigo-100 text-sm">
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
                className="btn btn-secondary btn-rounded disabled:opacity-50 text-sm flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Previous</span>
              </button>
              <button
                onClick={() => handleNavigation('next')}
                disabled={currentIndex === (exercises?.length || 0) - 1}
                className="btn btn-secondary btn-rounded disabled:opacity-50 text-sm flex items-center space-x-1"
              >
                <span>Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${((currentIndex + 1) / (exercises?.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Rest Timer - show prominently if active */}
      {showTimer && (
        <div className="mb-6 alert-info">
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
              className={`exercise-set ${set.completed ? 'exercise-set-completed' : ''}`}
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
                    onChange={(e) => handleInputChange(index, 'weight', e.target.value)}
                  />
                  <span className="text-gray-600 dark:text-gray-300">Kg</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={set.reps}
                    className="form-input w-16"
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
          className="btn btn-primary rounded-lg p-4 flex items-center justify-center gap-2"
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