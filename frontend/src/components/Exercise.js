// In Exercise.js
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { debounce } from 'lodash';
import RestTimer from './RestTimer';

const Exercise = ({ isWorkoutActive }) => {
  const { id, day } = useParams();
  const [exercise, setExercise] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  
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

  // Update current index when exercise and exercises list are loaded
  useEffect(() => {
    if (exercises.length > 0 && exercise) {
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
      }
    };

    fetchExerciseData();
  }, [id]);

  // Handle navigation
  const handleNavigation = useCallback((direction) => {
    if (!exercises || !day) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < exercises.length) {
      const nextExercise = exercises[newIndex];
      navigate(`/workout/${day}/exercise/${nextExercise._id}`);
    }
  }, [currentIndex, exercises, navigate, day]);

  // Rest of your existing Exercise component code remains the same...

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">{exercise?.name}</h1>
      
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
              onClick={() => navigate(`/workout/${day}`)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Back to Workout
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

      {/* Rest of your existing UI code... */}

    </div>
  );
};

export default Exercise;