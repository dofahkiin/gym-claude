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
   * Get exercise data from localStorage
   * @param {string} exerciseId - The exercise ID to retrieve
   * @returns {Object|null} - The exercise data or null if not found
   */
  export const getExerciseFromLocalStorage = (exerciseId) => {
    const data = localStorage.getItem(`exercise_${exerciseId}`);
    return data ? JSON.parse(data) : null;
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