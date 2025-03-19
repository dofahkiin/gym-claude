// src/utils/syncUtils.js
import { 
    getModifiedExerciseIds, 
    getExerciseFromLocalStorage, 
    clearExerciseFromLocalStorage,
    getModifiedWorkoutDays,
    getAllWorkoutsFromLocalStorage,
    saveAllWorkoutsToLocalStorage,
    clearAllModifiedExercises
  } from './offlineWorkoutStorage';
  
  /**
   * Sync all offline changes with the server
   * @param {string} token - User auth token
   * @returns {Promise<Object>} Result of sync operation
   */
  export const syncAllOfflineChanges = async (token) => {
    const results = {
      success: true,
      exercises: { total: 0, success: 0, failed: 0 },
      workoutDays: { total: 0, success: 0, failed: 0 },
      tempExercises: { total: 0, success: 0, failed: 0 },
      deletedItems: { total: 0, success: 0, failed: 0 },
      failedItems: []
    };
    
    if (!navigator.onLine) {
      return { 
        success: false, 
        message: 'Cannot sync while offline' 
      };
    }
    
    try {
      console.log('Starting sync process...');
      
      // 1. First we need to call the workout complete endpoint to record history
      await completeWorkoutOnServer(token, results);
      
      // 2. Sync modified exercises
      await syncModifiedExercises(token, results);
      
      // 3. Sync temp exercises created offline
      await syncTempExercises(token, results);
      
      // 4. Sync deleted items
      await syncDeletedItems(token, results);
      
      // 5. Sync modified workout days
      await syncModifiedWorkoutDays(token, results);
      
      // 6. Refresh all data from server
      await refreshAllDataFromServer(token);
      
      // Clear all modified exercise tracking
      clearAllModifiedExercises();
      
      // Clear modified workout days
      localStorage.removeItem('modified_workout_days');
      
      // Set overall success based on results
      results.success = results.exercises.failed === 0 && 
                        results.workoutDays.failed === 0 && 
                        results.tempExercises.failed === 0 && 
                        results.deletedItems.failed === 0;
      
      console.log('Sync completed with results:', results);
      
      return results;
    } catch (error) {
      console.error('Sync failed:', error);
      return {
        success: false,
        message: error.message,
        details: results
      };
    }
  };

  /**
 * Complete workout on server to record history
 * @param {string} token - User auth token
 * @param {Object} results - Results object to update
 */
const completeWorkoutOnServer = async (token, results) => {
    try {
      console.log('Completing workout on server to record history...');
      
      // Check if there are any exercises with history to sync
      const modifiedIds = getModifiedExerciseIds();
      let hasHistoryToSync = false;
      
      for (const exerciseId of modifiedIds) {
        const exercise = getExerciseFromLocalStorage(exerciseId);
        if (exercise && exercise.history && exercise.history.length > 0) {
          hasHistoryToSync = true;
          break;
        }
      }
      
      if (!hasHistoryToSync) {
        console.log('No history to sync, skipping workout completion');
        return;
      }
      
      // Call the workout complete endpoint
      const response = await fetch('/api/workouts/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to complete workout on server (${response.status})`);
      }
      
      console.log('Workout completed successfully on server');
    } catch (error) {
      console.error('Error completing workout on server:', error);
      // Don't fail the entire sync process if this fails
    }
  };
  
/**
 * Refresh all data from server
 * @param {string} token - User auth token
 */
const refreshAllDataFromServer = async (token) => {
    try {
      console.log('Refreshing all data from server...');
      
      // Refresh workouts
      const workoutsResponse = await fetch('/api/workouts', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      });
      
      if (workoutsResponse.ok) {
        const workoutsData = await workoutsResponse.json();
        saveAllWorkoutsToLocalStorage(workoutsData);
        console.log('Workouts refreshed from server');
      }
      
      // We should also refresh each exercise that we've modified
      const modifiedIds = getModifiedExerciseIds();
      
      for (const exerciseId of modifiedIds) {
        try {
          const response = await fetch(`/api/exercises/${exerciseId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const exerciseData = await response.json();
            // No need to save to localStorage since we're clearing everything
          }
        } catch (exerciseError) {
          console.warn(`Failed to refresh exercise ${exerciseId}:`, exerciseError);
          // Continue with the next exercise
        }
      }
    } catch (error) {
      console.error('Error refreshing data from server:', error);
    }
  };

  /**
 * Sync modified exercises
 * @param {string} token - User auth token
 * @param {Object} results - Results object to update
 */
  const syncModifiedExercises = async (token, results) => {
    const modifiedIds = getModifiedExerciseIds();
    results.exercises.total = modifiedIds.length;
    
    console.log(`Syncing ${modifiedIds.length} modified exercises...`);
    
    for (const exerciseId of modifiedIds) {
      try {
        // Skip temp exercises (they need special handling)
        if (exerciseId.startsWith('temp_')) {
          continue;
        }
        
        const exercise = getExerciseFromLocalStorage(exerciseId);
        if (!exercise) {
          results.exercises.failed++;
          results.failedItems.push({
            type: 'exercise',
            id: exerciseId,
            error: 'Missing exercise data'
          });
          continue;
        }
        
        console.log(`Syncing exercise ${exerciseId}: ${exercise.name}`);
        
        // Sync the exercise data (sets, etc.)
        const response = await fetch(`/api/exercises/${exerciseId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            sets: exercise.sets,
            // Unfortunately, we can't include history here due to API limitations
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }
        
        console.log(`Exercise ${exerciseId} synced successfully`);
        
        // We don't need to remove from localStorage here - we'll do a global cleanup later
        results.exercises.success++;
      } catch (error) {
        console.error(`Failed to sync exercise ${exerciseId}:`, error);
        results.exercises.failed++;
        results.failedItems.push({
          type: 'exercise',
          id: exerciseId,
          error: error.message
        });
      }
    }
  };
  
  /**
   * Sync temp exercises created offline
   * @param {string} token - User auth token
   * @param {Object} results - Results object to update
   */
  const syncTempExercises = async (token, results) => {
    const tempExercises = JSON.parse(localStorage.getItem('temp_exercises') || '[]');
    results.tempExercises.total = tempExercises.length;
    
    for (const tempExercise of tempExercises) {
      try {
        const { id, day, name } = tempExercise;
        
        // Get the exercise data
        const exercise = getExerciseFromLocalStorage(id);
        if (!exercise) {
          results.tempExercises.failed++;
          results.failedItems.push({
            type: 'tempExercise',
            id,
            error: 'Missing exercise data'
          });
          continue;
        }
        
        // Add exercise to the server
        const response = await fetch(`/api/workouts/${day}/exercises`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: exercise.name,
            sets: exercise.sets,
            restTime: exercise.restTime
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }
        
        // We succeeded! Remove the temp exercise
        localStorage.removeItem(`exercise_${id}`);
        
        results.tempExercises.success++;
      } catch (error) {
        console.error(`Failed to sync temp exercise:`, error);
        results.tempExercises.failed++;
        results.failedItems.push({
          type: 'tempExercise',
          error: error.message
        });
      }
    }
    
    // Remove all temp exercises that succeeded
    if (results.tempExercises.success > 0) {
      // Only keep failed ones
      const failedTempExercises = tempExercises.filter((_, index) => {
        const failedItem = results.failedItems.find(item => 
          item.type === 'tempExercise' && item.id === tempExercises[index].id
        );
        return !!failedItem;
      });
      
      localStorage.setItem('temp_exercises', JSON.stringify(failedTempExercises));
    }
  };
  
  /**
   * Sync deleted items
   * @param {string} token - User auth token
   * @param {Object} results - Results object to update
   */
  const syncDeletedItems = async (token, results) => {
    // Handle deleted exercises
    const deletedExercises = JSON.parse(localStorage.getItem('deleted_exercises') || '[]');
    // Handle deleted workout days
    const deletedDays = JSON.parse(localStorage.getItem('deleted_workout_days') || '[]');
    
    results.deletedItems.total = deletedExercises.length + deletedDays.length;
    
    // Sync deleted exercises
    for (const deletedExercise of deletedExercises) {
      try {
        const { id, day } = deletedExercise;
        
        const response = await fetch(`/api/workouts/${day}/exercises/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }
        
        results.deletedItems.success++;
      } catch (error) {
        console.error(`Failed to sync deleted exercise:`, error);
        results.deletedItems.failed++;
        results.failedItems.push({
          type: 'deletedExercise',
          error: error.message
        });
      }
    }
    
    // Sync deleted workout days
    for (const dayToRemove of deletedDays) {
      try {
        const response = await fetch(`/api/workouts/days/${dayToRemove}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }
        
        results.deletedItems.success++;
      } catch (error) {
        console.error(`Failed to sync deleted day:`, error);
        results.deletedItems.failed++;
        results.failedItems.push({
          type: 'deletedDay',
          id: dayToRemove,
          error: error.message
        });
      }
    }
    
    // Remove all deleted items that succeeded
    if (results.deletedItems.success > 0) {
      // Refresh workout data from server after sync
      try {
        const response = await fetch('/api/workouts', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          // Update localStorage with fresh data
          saveAllWorkoutsToLocalStorage(data);
        }
      } catch (error) {
        console.error('Failed to refresh workouts after deletion:', error);
      }
      
      // Clear deleted items lists
      localStorage.removeItem('deleted_exercises');
      localStorage.removeItem('deleted_workout_days');
    }
  };
  
  /**
   * Sync modified workout days
   * @param {string} token - User auth token
   * @param {Object} results - Results object to update
   */
  const syncModifiedWorkoutDays = async (token, results) => {
    const modifiedDays = getModifiedWorkoutDays();
    
    // If we have new workout days that were added offline, handle those separately
    const newDays = JSON.parse(localStorage.getItem('new_workout_days') || '[]');
    results.workoutDays.total = modifiedDays.length;
    
    // We'll just refresh workout data from server after all modifications
    if (modifiedDays.length > 0) {
      try {
        const response = await fetch('/api/workouts', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Create workout day if it doesn't exist on server
          for (const newDay of newDays) {
            const { day } = newDay;
            const existingDay = data.find(w => w.day === parseInt(day));
            
            if (!existingDay) {
              // Create new workout day on server
              try {
                await fetch('/api/workouts/days', {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ day: parseInt(day) }),
                  credentials: 'include'
                });
                
                results.workoutDays.success++;
              } catch (error) {
                console.error(`Failed to create workout day ${day}:`, error);
                results.workoutDays.failed++;
                results.failedItems.push({
                  type: 'newWorkoutDay',
                  day,
                  error: error.message
                });
              }
            }
          }
          
          // Get refreshed workout data
          const refreshResponse = await fetch('/api/workouts', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
            credentials: 'include'
          });
          
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            // Update localStorage with fresh data
            saveAllWorkoutsToLocalStorage(refreshedData);
            
            // Clear modified days
            localStorage.removeItem('modified_workout_days');
            // Clear new days
            localStorage.removeItem('new_workout_days');
          }
        }
      } catch (error) {
        console.error('Failed to sync workout days:', error);
        results.workoutDays.failed += modifiedDays.length;
        results.failedItems.push({
          type: 'workoutDays',
          error: error.message
        });
      }
    }
  };
  
  /**
   * Check if there are any pending offline changes
   * @returns {boolean} True if there are pending changes
   */
  export const hasPendingChanges = () => {
    const modifiedExercises = getModifiedExerciseIds();
    const modifiedDays = getModifiedWorkoutDays();
    const tempExercises = JSON.parse(localStorage.getItem('temp_exercises') || '[]');
    const deletedExercises = JSON.parse(localStorage.getItem('deleted_exercises') || '[]');
    const deletedDays = JSON.parse(localStorage.getItem('deleted_workout_days') || '[]');
    
    const hasChanges = modifiedExercises.length > 0 || 
                      modifiedDays.length > 0 || 
                      tempExercises.length > 0 || 
                      deletedExercises.length > 0 || 
                      deletedDays.length > 0;
    
    console.log('Checking for pending changes:', {
      modifiedExercises: modifiedExercises.length,
      modifiedDays: modifiedDays.length,
      tempExercises: tempExercises.length,
      deletedExercises: deletedExercises.length,
      deletedDays: deletedDays.length,
      hasChanges
    });
    
    return hasChanges;
  };

  /**
 * Sync exercise history with server
 * @param {string} token - User auth token
 * @param {Object} exercise - Exercise data with history
 * @param {string} exerciseId - Exercise ID
 * @returns {Promise<boolean>} Success status
 */
  const syncExerciseHistory = async (token, exercise, exerciseId) => {
    if (!exercise.history || exercise.history.length === 0) {
      return true; // No history to sync
    }
  
    try {
      // First we need to check if this history is already on the server
      const response = await fetch(`/api/exercises/${exerciseId}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch history (${response.status})`);
      }
      
      const serverHistory = await response.json();
      
      // For each local history entry, check if it's on the server
      // We'll use a very simple check - just comparing dates
      // In a real app, you'd want a more robust comparison
      const serverDates = serverHistory.map(entry => 
        new Date(entry.date).toDateString()
      );
      
      // Filter out history entries that are already on the server
      const newHistoryEntries = exercise.history.filter(entry => 
        !serverDates.includes(new Date(entry.date).toDateString())
      );
      
      if (newHistoryEntries.length === 0) {
        return true; // All history already synced
      }
      
      // For each new history entry, we'll use the workout complete endpoint
      // This is not ideal, but it's the API we have available
      
      // In a real app, you'd have a dedicated API endpoint for syncing exercise history
      const completeResponse = await fetch('/api/workouts/complete', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include'
      });
      
      if (!completeResponse.ok) {
        throw new Error(`Failed to sync history (${completeResponse.status})`);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to sync history for exercise ${exerciseId}:`, error);
      return false;
    }
  };