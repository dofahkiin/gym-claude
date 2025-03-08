// src/components/ExerciseDetails.js
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert } from './ui';

const ExerciseDetails = ({ isWorkoutActive, darkMode }) => {
  const { id, day } = useParams();
  const [exercise, setExercise] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle, saving, success, error
  
  const navigate = useNavigate();

  // Fetch exercise data
  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Determine if this is from a default workout or custom workout
        let response;
        if (day) {
          // This is from a default workout
          // First, find the exercise in the default workout
          const workoutResponse = await fetch(`/api/workouts/${day}`, {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
            credentials: 'include'
          });
          
          if (!workoutResponse.ok) {
            throw new Error('Failed to fetch workout data');
          }
          
          const workoutData = await workoutResponse.json();
          const foundExercise = workoutData.exercises.find(ex => ex._id.toString() === id);
          
          if (foundExercise) {
            setExercise(foundExercise);
            setLoading(false);
            return;
          }
        }
        
        // If not found in default workout or no day provided, try to get from custom workouts
        response = await fetch(`/api/exercises/${id}`, {
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
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseData();
  }, [id, day]);

  // Update exercise data
  const updateExerciseData = useCallback(async (exerciseId, updatedData) => {
    try {
      setSaveStatus('saving');
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
        body: JSON.stringify(updatedData),
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
      
      showNotification('Exercise updated successfully');
      setSaveStatus('success');
      
      return data;
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
      showNotification(`Failed to update: ${err.message}`, 'error');
      setSaveStatus('error');
      throw err;
    }
  }, []);

  // Handle input changes
  const handleWeightChange = (index, value) => {
    if (!exercise) return;

    const updatedSets = exercise.sets.map((set, i) => 
      i === index 
        ? { ...set, weight: parseFloat(value) || 0 } 
        : set
    );

    setExercise(prev => ({ ...prev, sets: updatedSets }));
  };

  // Handle reps change
  const handleRepsChange = (index, value) => {
    if (!exercise) return;

    const updatedSets = exercise.sets.map((set, i) => 
      i === index 
        ? { ...set, reps: parseInt(value) || 0 } 
        : set
    );

    setExercise(prev => ({ ...prev, sets: updatedSets }));
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!exercise) return;
    
    try {
      await updateExerciseData(exercise._id, { sets: exercise.sets });
    } catch (err) {
      console.error('Failed to save changes:', err);
    }
  };

  // Handle adding a set
  const handleAddSet = () => {
    if (!exercise) return;
    
    // Clone the last set or create a default one
    const lastSet = exercise.sets[exercise.sets.length - 1];
    const newSet = lastSet 
      ? { ...lastSet, completed: false } 
      : { weight: 0, reps: 8, completed: false };
    
    const updatedSets = [...exercise.sets, newSet];
    setExercise(prev => ({ ...prev, sets: updatedSets }));
  };

  // Handle removing a set
  const handleRemoveSet = (index) => {
    if (!exercise || exercise.sets.length <= 1) return;
    
    const updatedSets = exercise.sets.filter((_, i) => i !== index);
    setExercise(prev => ({ ...prev, sets: updatedSets }));
  };

  // Handle set completion toggle
  const handleSetCompletion = (index) => {
    if (!exercise) return;
    
    const updatedSets = exercise.sets.map((set, i) => 
      i === index 
        ? { ...set, completed: !set.completed } 
        : set
    );
    
    setExercise(prev => ({ ...prev, sets: updatedSets }));
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Navigate back
  const handleNavigateBack = () => {
    if (day) {
      navigate(`/workout/${day}`);
    } else {
      navigate(-1);
    }
  };

  if (loading && !exercise) {
    return (
      <div className="flex justify-center items-center h-64">
        <svg className="loading-spinner h-12 w-12" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }
  
  if (error) {
    return <Alert type="error">Error: {error}</Alert>;
  }

  // Calculate completed sets
  const completedSets = exercise?.sets?.filter(set => set.completed).length || 0;

  return (
    <div>
      <Card className="mb-8">
        <div className="card-gradient-header">
          <div className="flex items-center mb-1 -ml-2">
            <button
              onClick={handleNavigateBack}
              className="hover:bg-white/10 rounded-full p-1 transition-colors flex-shrink-0"
              aria-label="Back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">{exercise?.name}</h1>
          </div>
          <div className="flex items-center text-indigo-100 text-sm">
            <span>{completedSets} of {exercise?.sets?.length || 0} sets completed</span>
          </div>
        </div>
      </Card>

      {/* Exercise Sets */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Sets</h3>
          <div className="flex space-x-2">
            <Button
              onClick={handleAddSet}
              variant="secondary"
              size="sm"
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Set
            </Button>
          </div>
        </div>
        
        <div className="space-y-3">
          {exercise?.sets?.map((set, index) => (
            <div key={index} className="relative group">
              {exercise.sets.length > 1 && (
                <button
                  onClick={() => handleRemoveSet(index)}
                  className="absolute -right-2 -top-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove set"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
              <div className={`exercise-set ${set.completed ? 'exercise-set-completed' : ''}`}>
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
                        onChange={(e) => handleWeightChange(index, e.target.value)}
                      />
                      <span className="text-gray-600 dark:text-gray-300">Kg</span>
                    </div>
                    
                    <div className="flex items-center gap-2 w-1/2 justify-center">
                      <input
                        type="number"
                        value={set.reps}
                        className="form-input w-16"
                        onChange={(e) => handleRepsChange(index, e.target.value)}
                      />
                      <span className="text-gray-600 dark:text-gray-300">Reps</span>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
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
            </div>
          ))}
        </div>
      </div>

      {/* History Button */}
      <div className="grid grid-cols-1 gap-4 mb-20">
        <Button
          onClick={() => navigate(`/exercise/${id}/history`)}
          variant="primary"
          className="rounded-lg p-4 flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          View Exercise History
        </Button>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-4 right-4 left-4 md:left-auto">
        <Button
          onClick={handleSaveChanges}
          variant="primary"
          className="w-full md:w-auto shadow-lg"
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <>
              <svg className="loading-spinner -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification ${notification.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <div className="flex items-center">
            {notification.type === 'error' ? (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-white/10 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseDetails;