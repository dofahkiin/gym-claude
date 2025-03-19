// utils/offlineWorkoutStorage.js
// This file handles storing workout data locally first and syncing with server later

/**
 * Save exercise data to localStorage
 * @param {Object} exercise - The exercise object to save
 */
export const saveExerciseToLocalStorage = (exercise) => {
  if (!exercise || !exercise._id) return;
  
  // Save the exercise data
  localStorage.setItem(`exercise_${exercise._id}`, JSON.stringify(exercise));
  
  // Add this exercise to the list of modified exercises
  const modifiedExercises = JSON.parse(localStorage.getItem('modified_exercises') || '[]');
  if (!modifiedExercises.includes(exercise._id)) {
    modifiedExercises.push(exercise._id);
    localStorage.setItem('modified_exercises', JSON.stringify(modifiedExercises));
  }
};

/**
 * Mark workout as completed locally
 * This will reset all set completion flags and save workout history
 */
export const completeWorkoutLocally = () => {
  // Get active workout flag
  const isWorkoutActive = localStorage.getItem('isWorkoutActive') === 'true';
  if (!isWorkoutActive) return; // Nothing to do
  
  // Get all modified exercise IDs
  const modifiedExerciseIds = getModifiedExerciseIds();
  const currentDate = new Date();
  
  // For each modified exercise, record history and reset completion
  for (const exerciseId of modifiedExerciseIds) {
    const exercise = getExerciseFromLocalStorage(exerciseId);
    if (!exercise) continue;
    
    // Check if any sets are completed
    const completedSets = exercise.sets.filter(set => set.completed);
    if (completedSets.length > 0) {
      // Add to history
      if (!exercise.history) {
        exercise.history = [];
      }
      
      exercise.history.push({
        date: currentDate,
        sets: completedSets.map(set => ({
          weight: set.weight,
          reps: set.reps
        }))
      });
      
      // Reset completion status
      exercise.sets = exercise.sets.map(set => ({
        ...set,
        completed: false
      }));
      
      // Save updated exercise
      saveExerciseToLocalStorage(exercise);
    }
  }
  
  // Mark workout as inactive
  localStorage.setItem('isWorkoutActive', 'false');
};

/**
 * Get exercise data from localStorage
 * @param {string} exerciseId - The exercise ID to retrieve
 * @returns {Object|null} - The exercise data or null if not found
 */
export const getExerciseFromLocalStorage = (exerciseId) => {
  const data = localStorage.getItem(`exercise_${exerciseId}`);
  if (!data) return null;
  
  // Check if workout is actually active
  const isWorkoutActive = localStorage.getItem('isWorkoutActive') === 'true';
  
  // Parse the exercise data
  const exercise = JSON.parse(data);
  
  // If workout is not active, make sure no sets are marked as completed
  if (!isWorkoutActive && exercise && exercise.sets) {
    // Create a deep copy with all sets marked as not completed
    const updatedExercise = {
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        completed: false
      }))
    };
    
    // Don't save back to localStorage, just return the updated object
    return updatedExercise;
  }
  
  return exercise;
};

/**
 * Clear an exercise from localStorage after successful server sync
 * @param {string} exerciseId - The exercise ID to clear
 */
export const clearExerciseFromLocalStorage = (exerciseId) => {
  localStorage.removeItem(`exercise_${exerciseId}`);
  
  // Remove from modified exercises list
  const modifiedExercises = JSON.parse(localStorage.getItem('modified_exercises') || '[]');
  const updatedList = modifiedExercises.filter(id => id !== exerciseId);
  localStorage.setItem('modified_exercises', JSON.stringify(updatedList));
};

/**
 * Get all modified exercise IDs
 * @returns {Array} - List of exercise IDs that have been modified
 */
export const getModifiedExerciseIds = () => {
  return JSON.parse(localStorage.getItem('modified_exercises') || '[]');
};

/**
 * Clear all modified exercises tracking
 */
export const clearAllModifiedExercises = () => {
  const modifiedExercises = getModifiedExerciseIds();
  
  // Clear each exercise storage
  modifiedExercises.forEach(id => {
    localStorage.removeItem(`exercise_${id}`);
  });
  
  // Clear the modified list
  localStorage.removeItem('modified_exercises');
};

/**
 * Sync modified exercises with the server
 * @param {string} token - User's auth token
 * @returns {Promise} - Promise resolving with success/failure and details
 */
export const syncModifiedExercisesWithServer = async (token) => {
  const modifiedExerciseIds = getModifiedExerciseIds();
  
  if (modifiedExerciseIds.length === 0) {
    return { success: true, message: 'No modified exercises to sync' };
  }
  
  const results = {
    success: true,
    totalCount: modifiedExerciseIds.length,
    successCount: 0,
    failedCount: 0,
    failedExercises: []
  };
  
  // For each modified exercise, send the data to the server
  for (const exerciseId of modifiedExerciseIds) {
    const exerciseData = getExerciseFromLocalStorage(exerciseId);
    
    if (!exerciseData) {
      results.failedCount++;
      results.failedExercises.push({ id: exerciseId, error: 'Missing exercise data' });
      continue;
    }
    
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sets: exerciseData.sets
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed with status ${response.status}`);
      }
      
      // Successfully saved to server, remove from local storage
      clearExerciseFromLocalStorage(exerciseId);
      results.successCount++;
    } catch (error) {
      console.error(`Failed to sync exercise ${exerciseId}:`, error);
      results.failedCount++;
      results.failedExercises.push({ 
        id: exerciseId, 
        name: exerciseData.name,
        error: error.message 
      });
      results.success = false;
    }
  }
  
  return results;
};

/**
 * Save workout day data to localStorage
 * @param {string} day - The workout day number
 * @param {Object} workout - The workout data to save
 */
export const saveWorkoutToLocalStorage = (day, workout) => {
  if (!day || !workout) return;
  
  // Save the workout data
  localStorage.setItem(`workout_day_${day}`, JSON.stringify(workout));
};

/**
 * Get workout day data from localStorage
 * @param {string} day - The workout day number to retrieve
 * @returns {Object|null} - The workout data or null if not found
 */
export const getWorkoutFromLocalStorage = (day) => {
  const data = localStorage.getItem(`workout_day_${day}`);
  return data ? JSON.parse(data) : null;
};

/**
 * Save all workouts list to localStorage
 * @param {Array} workouts - Array of all workout days
 */
export const saveAllWorkoutsToLocalStorage = (workouts) => {
  if (!workouts || !Array.isArray(workouts)) return;
  localStorage.setItem('all_workouts', JSON.stringify(workouts));
};

/**
 * Get all workouts list from localStorage
 * @returns {Array|null} - Array of all workout days or null if not found
 */
export const getAllWorkoutsFromLocalStorage = () => {
  const data = localStorage.getItem('all_workouts');
  return data ? JSON.parse(data) : null;
};

/**
 * Mark a workout day as having local changes
 * @param {string} day - The workout day number
 */
export const markWorkoutDayAsModified = (day) => {
  const modifiedDays = JSON.parse(localStorage.getItem('modified_workout_days') || '[]');
  if (!modifiedDays.includes(day)) {
    modifiedDays.push(day);
    localStorage.setItem('modified_workout_days', JSON.stringify(modifiedDays));
  }
};

/**
 * Get all workout days with local changes
 * @returns {Array} - List of day numbers with local changes
 */
export const getModifiedWorkoutDays = () => {
  return JSON.parse(localStorage.getItem('modified_workout_days') || '[]');
};