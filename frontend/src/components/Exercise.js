// frontend/src/components/Exercise.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RestTimer from './RestTimer';

const Exercise = ({ exercise: initialExercise, isWorkoutActive }) => {
  const { id } = useParams();
  const [exercise, setExercise] = useState(initialExercise);
  const [error, setError] = useState(null);
  
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

      // First, update the exercise
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

      // Then fetch the updated exercise data
      const getResponse = await fetch(`/api/exercises/${exerciseId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!getResponse.ok) {
        throw new Error('Failed to fetch updated exercise data');
      }

      const data = await getResponse.json();
      console.log('Updated exercise data:', data);

      if (!data || !Array.isArray(data.sets)) {
        throw new Error('Invalid exercise data received');
      }

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

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!exercise || !Array.isArray(exercise.sets)) {
    console.log('Current exercise state:', exercise); // Debug log
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">{exercise.name}</h1>
      
      <div className="space-y-4">
        {exercise.sets.map((set, index) => (
          <div key={index} className="flex items-center space-x-4 bg-white p-4 rounded shadow">
            <span className="w-8">{index + 1}.</span>
            <input
              type="number"
              value={set.weight}
              className="w-20 p-2 border rounded"
              step="0.5"
              readOnly
            />
            <span>Kg</span>
            <input
              type="number"
              value={set.reps}
              className="w-20 p-2 border rounded"
              readOnly
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