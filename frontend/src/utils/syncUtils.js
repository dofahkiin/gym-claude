// utils/syncUtils.js
import { 
    getModifiedExerciseIds, 
    getExerciseFromLocalStorage, 
    clearExerciseFromLocalStorage,
    getModifiedWorkoutDays,
    getAllWorkoutsFromLocalStorage,
    saveAllWorkoutsToLocalStorage
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
      // 1. Sync modified exercises
      await syncModifiedExercises(token, results);
      
      // 2. Sync temp exercises created offline
      await syncTempExercises(token, results);
      
      // 3. Sync deleted items
      await syncDeletedItems(token, results);
      
      // 4. Sync modified workout days
      await syncModifiedWorkoutDays(token, results);
      
      // Set overall success based on results
      results.success = results.exercises.failed === 0 && 
                        results.workoutDays.failed === 0 && 
                        results.tempExercises.failed === 0 && 
                        results.deletedItems.failed === 0;
      
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
   * Sync modified exercises
   * @param {string} token - User auth token
   * @param {Object} results - Results object to update
   */
  const syncModifiedExercises = async (token, results) => {
    const modifiedIds = getModifiedExerciseIds();
    results.exercises.total = modifiedIds.length;
    
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
        
        const response = await fetch(`/api/exercises/${exerciseId}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ sets: exercise.sets }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error(`Failed with status ${response.status}`);
        }
        
        // Success! Remove from local storage
        clearExerciseFromLocalStorage(exerciseId);
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
    
    return modifiedExercises.length > 0 || 
           modifiedDays.length > 0 || 
           tempExercises.length > 0 || 
           deletedExercises.length > 0 || 
           deletedDays.length > 0;
  };