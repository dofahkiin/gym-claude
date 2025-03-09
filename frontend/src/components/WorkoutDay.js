// Updated WorkoutDay.js with edit, add, and remove functionality
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, Input } from './ui';
import commonExercises from '../data/commonExercises.json';

const WorkoutDay = ({ darkMode }) => {
  const { day } = useParams();
  const [workout, setWorkout] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const searchInputRef = useRef(null);
  
  const navigate = useNavigate();

  // Fetch workout data
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setLoading(true);
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
        setWorkout(data);
      } catch (error) {
        console.error('Error fetching workout:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [day]);

  // Auto-focus search input when adding exercise
  useEffect(() => {
    if (isAddingExercise && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isAddingExercise]);

  // Handle exercise selection
  const handleExerciseClick = (exerciseId) => {
    if (editMode) return; // Prevent navigation when in edit mode
    navigate(`/workout/${day}/exercise/${exerciseId}`);
  };

  // Handle back/home navigation
  const handleBackClick = () => {
    navigate('/');
  };

  // Toggle edit mode
  const toggleEditMode = () => {
    setEditMode(!editMode);
    setIsAddingExercise(false);
  };

  // Filter exercises for search
  const filteredExercises = commonExercises.filter(exercise => 
    exercise.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add a new exercise
  const handleAddExercise = async (exerciseName) => {
    try {
      setActionLoading(true);
      
      // Create new exercise data
      const newExercise = {
        name: exerciseName,
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      };
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      // In a real implementation you would call the API to add the exercise
      // This is a placeholder for where your actual API call would go
      const response = await fetch(`/api/workouts/${day}/exercises`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExercise),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to add exercise');
      }
      
      // Refresh workout data
      const refreshResponse = await fetch(`/api/workouts/${day}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh workout data');
      }
      
      const data = await refreshResponse.json();
      setWorkout(data);
      
      // Close add exercise mode
      setIsAddingExercise(false);
      setSearchTerm('');
    } catch (error) {
      console.error('Error adding exercise:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Remove an exercise
  const handleRemoveExercise = async (exerciseId) => {
    try {
      setActionLoading(true);
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      // In a real implementation you would call the API to remove the exercise
      // This is a placeholder for where your actual API call would go
      const response = await fetch(`/api/workouts/${day}/exercises/${exerciseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to remove exercise');
      }
      
      // Refresh workout data
      const refreshResponse = await fetch(`/api/workouts/${day}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });
      
      if (!refreshResponse.ok) {
        throw new Error('Failed to refresh workout data');
      }
      
      const data = await refreshResponse.json();
      setWorkout(data);
    } catch (error) {
      console.error('Error removing exercise:', error);
      setError(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Show error only if we have an error and we're not loading
  if (error && !loading) {
    return <Alert type="error">Could not load workout data: {error}</Alert>;
  }
  
  // Instead of showing loading state, return null
  if (!workout || loading) {
    return null;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Day {day}</h1>
          <p className="text-gray-600 dark:text-gray-300">Complete all exercises in this workout</p>
        </div>
        
        <Button
          onClick={toggleEditMode}
          variant="secondary"
          rounded
          className={editMode 
            ? "bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 flex items-center space-x-2" 
            : "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 flex items-center space-x-2"}
        >
          {editMode ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              <span>Done</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span>Edit Workout</span>
            </>
          )}
        </Button>
      </div>

      {/* Exercise List */}
      <div className="grid gap-4 mb-6">
        {workout.exercises.map((exercise, index) => (
          <Card 
            key={exercise._id}
            className={`relative cursor-pointer hover:shadow-md dark:shadow-gray-900/30 transition-shadow duration-200 ${
              editMode ? 'border-l-4 border-indigo-500 dark:border-indigo-400' : ''
            }`}
            onClick={() => !editMode && handleExerciseClick(exercise._id)}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="set-number mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">{exercise.name}</h3>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                    <span>{exercise.sets.length} sets</span>
                    <span className="mx-2">•</span>
                    <span>{exercise.sets[0].reps} reps per set</span>
                  </div>
                </div>
                {editMode ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveExercise(exercise._id);
                    }}
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-2 transition-colors"
                    disabled={actionLoading}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Add Exercise UI */}
      {editMode && (
        <div className="mt-6">
          {isAddingExercise ? (
            <Card className="p-6">
              <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Add Exercise</h3>
              
              <Input
                ref={searchInputRef}
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              
              <div className="max-h-64 overflow-y-auto border dark:border-gray-700 rounded-md">
                {filteredExercises.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    No exercises found. Try a different search term.
                  </div>
                ) : (
                  <div className="divide-y dark:divide-gray-700">
                    {filteredExercises.map((exercise, index) => (
                      <button
                        key={index}
                        className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        onClick={() => handleAddExercise(exercise)}
                        disabled={actionLoading}
                      >
                        {exercise}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end mt-4 space-x-2">
                <Button
                  onClick={() => setIsAddingExercise(false)}
                  variant="secondary"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => handleAddExercise(searchTerm)}
                  variant="primary"
                  disabled={!searchTerm.trim() || actionLoading}
                >
                  {actionLoading ? 'Adding...' : 'Add Custom Exercise'}
                </Button>
              </div>
            </Card>
          ) : (
            <Button
              onClick={() => setIsAddingExercise(true)}
              variant="secondary"
              className="w-full py-3 flex items-center justify-center space-x-2 border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60"
              disabled={actionLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Add Exercise</span>
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkoutDay;