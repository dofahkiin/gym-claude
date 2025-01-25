import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { debounce } from 'lodash';
import RestTimer from './RestTimer';

const Exercise = ({ exercise: initialExercise, isWorkoutActive }) => {
  const { workoutDay, exercises } = useOutletContext();
  const { id } = useParams();
  const [exercise, setExercise] = useState(initialExercise);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Initialize timer state from localStorage
  const [timerStartTime, setTimerStartTime] = useState(() => {
    if (!exercise) return null;
    const savedTimer = localStorage.getItem(`timer_${exercise._id}`);
    if (!savedTimer) return null;
    
    const startTime = parseInt(savedTimer);
    const elapsedSeconds = (Date.now() - startTime) / 1000;
    
    // If timer hasn't expired yet, return the start time
    return elapsedSeconds < 90 ? startTime : null;
  });

  const navigate = useNavigate();

  // Update current index when exercise changes
  useEffect(() => {
    if (exercises && exercise) {
      const index = exercises.findIndex(ex => ex._id === exercise._id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [exercise, exercises]);

  // Fetch exercise data
  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/exercises/${id}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
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
      }
    };

    fetchExerciseData();
  }, [id]);

  // Handle navigation
  const handleNavigation = useCallback((direction) => {
    if (!exercises || !workoutDay) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < exercises.length) {
      const nextExercise = exercises[newIndex];
      navigate(`/workout/${workoutDay}/exercise/${nextExercise._id}`);
    }
  }, [currentIndex, exercises, navigate, workoutDay]);

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
      });
      
      if (!updateResponse.ok) {
        const errorData = await updateResponse.json();
        throw new Error(`Failed to update exercise data: ${errorData.message || updateResponse.statusText}`);
      }

      const getResponse = await fetch(`/api/exercises/${exerciseId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
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
    []
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

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!exercise || !Array.isArray(exercise.sets)) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">{exercise.name}</h1>
      
      {/* Progress indicator */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">
            Exercise {currentIndex + 1} of {exercises?.length || 0}
          </span>
          <div className="flex space-x-2">
            <button
              onClick={() => handleNavigation('prev')}
              disabled={currentIndex === 0}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              ← Previous
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => handleNavigation('next')}
              disabled={currentIndex === (exercises?.length || 0) - 1}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50 hover:bg-blue-600 transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${((currentIndex + 1) / (exercises?.length || 1)) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-4">
        {exercise.sets.map((set, index) => (
          <div key={index} className="flex items-center space-x-4 bg-white p-4 rounded shadow">
            <span className="w-8">{index + 1}.</span>
            <input
              type="number"
              value={set.weight}
              className="w-20 p-2 border rounded"
              step="0.5"
              onChange={(e) => handleInputChange(index, 'weight', e.target.value)}
            />
            <span>Kg</span>
            <input
              type="number"
              value={set.reps}
              className="w-20 p-2 border rounded"
              onChange={(e) => handleInputChange(index, 'reps', e.target.value)}
            />
            <span>Reps</span>
            <button
              onClick={() => handleSetCompletion(index)}
              className={`w-8 h-8 rounded-full ${
                set.completed ? 'bg-green-300' : 'bg-gray-300'
              }`}
              disabled={!isWorkoutActive}
            />
          </div>
        ))}
      </div>

      {/* Add history button */}
      <button
        onClick={() => navigate(`/exercise/${id}/history`)}
        className="mt-8 w-full bg-blue-500 text-white p-4 rounded hover:bg-blue-600"
      >
        View History
      </button>

      {showTimer && (
        <div className="mt-4">
          <RestTimer 
            onComplete={handleTimerComplete}
            startTime={timerStartTime}
            duration={90}
          />
        </div>
      )}
    </div>
  );
};

export default Exercise;
