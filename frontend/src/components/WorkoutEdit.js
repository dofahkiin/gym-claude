// src/components/WorkoutEdit.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from './ui';
import ExerciseSelector from './ExerciseSelector';

const WorkoutEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [workout, setWorkout] = useState(null);
  const [workoutName, setWorkoutName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  
  // Fetch workout data
  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/workouts/custom/${id}`, {
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
        setWorkoutName(data.name);
        setExercises(data.exercises || []);
      } catch (error) {
        console.error('Error fetching workout:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [id]);

  // Save workout name
  const handleSaveWorkoutName = async () => {
    if (!workoutName.trim()) {
      showNotification('Workout name cannot be empty', 'error');
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`/api/workouts/custom/${id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: workoutName }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update workout name');
      }
      
      showNotification('Workout name updated successfully');
    } catch (error) {
      console.error('Error updating workout name:', error);
      showNotification(`Failed to update workout name: ${error.message}`, 'error');
    }
  };

  // Add exercise to workout
  const handleAddExercise = (exercise) => {
    setIsAddingExercise(false);
    
    // Clone to avoid direct state mutation
    const updatedExercises = [...exercises];
    
    // Add default sets to the exercise
    const exerciseWithSets = {
      ...exercise,
      sets: [
        { weight: 0, reps: 8, completed: false },
        { weight: 0, reps: 8, completed: false },
        { weight: 0, reps: 8, completed: false }
      ]
    };
    
    updatedExercises.push(exerciseWithSets);
    
    // Update state and save to backend
    setExercises(updatedExercises);
    saveExercisesToWorkout(updatedExercises);
  };

  // Remove exercise from workout
  const handleRemoveExercise = (exerciseIndex) => {
    if (!window.confirm('Are you sure you want to remove this exercise?')) {
      return;
    }
    
    const updatedExercises = exercises.filter((_, index) => index !== exerciseIndex);
    setExercises(updatedExercises);
    saveExercisesToWorkout(updatedExercises);
  };

  // Reorder exercise (move up/down)
  const handleReorderExercise = (index, direction) => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === exercises.length - 1)
    ) {
      return; // Can't move first item up or last item down
    }
    
    const updatedExercises = [...exercises];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap positions
    [updatedExercises[index], updatedExercises[newIndex]] = 
    [updatedExercises[newIndex], updatedExercises[index]];
    
    setExercises(updatedExercises);
    saveExercisesToWorkout(updatedExercises);
  };

  // Save exercises to workout
  const saveExercisesToWorkout = async (updatedExercises) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`/api/workouts/custom/${id}/exercises`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ exercises: updatedExercises }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to update exercises');
      }
      
      showNotification('Workout exercises updated successfully');
    } catch (error) {
      console.error('Error updating exercises:', error);
      showNotification(`Failed to update exercises: ${error.message}`, 'error');
    }
  };

  // Add or remove sets from an exercise
  const handleSetChange = (exerciseIndex, action) => {
    const updatedExercises = [...exercises];
    const exercise = { ...updatedExercises[exerciseIndex] };
    
    if (action === 'add') {
      // Add a new set with default values
      exercise.sets = [
        ...exercise.sets, 
        { weight: exercise.sets[exercise.sets.length - 1]?.weight || 0, reps: 8, completed: false }
      ];
    } else if (action === 'remove' && exercise.sets.length > 1) {
      // Remove the last set (only if there's more than one)
      exercise.sets = exercise.sets.slice(0, -1);
    }
    
    updatedExercises[exerciseIndex] = exercise;
    setExercises(updatedExercises);
    saveExercisesToWorkout(updatedExercises);
  };

  // Handle weight and reps changes
  const handleSetWeightChange = (exerciseIndex, setIndex, value) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex].weight = parseFloat(value) || 0;
    setExercises(updatedExercises);
  };

  const handleSetRepsChange = (exerciseIndex, setIndex, value) => {
    const updatedExercises = [...exercises];
    updatedExercises[exerciseIndex].sets[setIndex].reps = parseInt(value) || 0;
    setExercises(updatedExercises);
  };

  // Save all set changes (weights and reps)
  const handleSaveSetChanges = (exerciseIndex) => {
    saveExercisesToWorkout(exercises);
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  if (loading && !workout) {
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

  return (
    <div className="workout-edit">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Edit Workout</h1>
          <p className="text-gray-600 dark:text-gray-300">Customize exercises and sets</p>
        </div>
        <Button
          onClick={() => navigate('/workouts/manage')}
          variant="secondary"
          rounded
          className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back to Workouts</span>
        </Button>
      </div>

      {/* Workout Name */}
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Workout Name</h3>
          <div className="flex space-x-2">
            <Input
              className="flex-1"
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
              placeholder="Enter workout name"
            />
            <Button 
              onClick={handleSaveWorkoutName}
              disabled={!workoutName.trim()}
            >
              Save
            </Button>
          </div>
        </div>
      </Card>

      {/* Add Exercise Button */}
      {!isAddingExercise ? (
        <Card className="mb-6">
          <div className="p-6">
            <Button
              onClick={() => setIsAddingExercise(true)}
              variant="primary"
              className="w-full flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Exercise
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-6">
          <div className="card-gradient-header">
            <h3 className="text-lg font-semibold">Add Exercise</h3>
          </div>
          <div className="p-6">
            <ExerciseSelector onSelectExercise={handleAddExercise} onCancel={() => setIsAddingExercise(false)} />
          </div>
        </Card>
      )}

      {/* Exercises List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Exercises</h2>
        
        {exercises.length === 0 ? (
          <Card className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No exercises in this workout</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Click "Add Exercise" above to get started</p>
          </Card>
        ) : (
          exercises.map((exercise, index) => (
            <Card key={index} className="hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-100 text-lg">{exercise.name}</h3>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                      <span>{exercise.sets?.length || 0} sets</span>
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => handleReorderExercise(index, 'up')}
                      variant="secondary"
                      size="sm"
                      disabled={index === 0}
                      className="w-8 h-8 flex items-center justify-center p-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    <Button
                      onClick={() => handleReorderExercise(index, 'down')}
                      variant="secondary"
                      size="sm"
                      disabled={index === exercises.length - 1}
                      className="w-8 h-8 flex items-center justify-center p-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </Button>
                    <Button
                      onClick={() => handleRemoveExercise(index)}
                      variant="danger"
                      size="sm"
                      className="w-8 h-8 flex items-center justify-center p-0"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </Button>
                  </div>
                </div>
                
                {/* Sets Management */}
                <div className="mt-4 px-3">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-600 dark:text-gray-300">Sets</h4>
                    <div className="flex space-x-1">
                      <Button
                        onClick={() => handleSetChange(index, 'add')}
                        variant="secondary"
                        size="sm"
                        className="flex items-center px-2 py-1 text-xs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Add Set
                      </Button>
                      <Button
                        onClick={() => handleSetChange(index, 'remove')}
                        variant="secondary"
                        size="sm"
                        disabled={exercise.sets.length <= 1}
                        className="flex items-center px-2 py-1 text-xs"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        Remove Set
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium mb-1 px-2">
                    <div>Set</div>
                    <div>Weight (kg)</div>
                    <div>Reps</div>
                  </div>
                  
                  {exercise.sets.map((set, setIndex) => (
                    <div key={setIndex} className="grid grid-cols-3 gap-1 py-1 text-sm">
                      <div className="flex items-center">
                        <div className="set-number w-6 h-6 text-xs">
                          {setIndex + 1}
                        </div>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="number"
                          className="w-16 p-1 text-center border rounded"
                          value={set.weight}
                          onChange={(e) => handleSetWeightChange(index, setIndex, e.target.value)}
                          onBlur={() => handleSaveSetChanges(index)}
                          min="0"
                          step="0.5"
                        />
                      </div>
                      <div className="flex items-center">
                        <input
                          type="number"
                          className="w-12 p-1 text-center border rounded"
                          value={set.reps}
                          onChange={(e) => handleSetRepsChange(index, setIndex, e.target.value)}
                          onBlur={() => handleSaveSetChanges(index)}
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
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

export default WorkoutEdit;