// Updated Home.js with fixed import paths
import React, { useState, useEffect } from 'react';
import { Button, Card, Notification, Alert } from './ui';
import { Link } from 'react-router-dom';
import ProgramSelector from './ProgramSelector';
import workoutPrograms from '../data/workoutPrograms';
import { 
  syncModifiedExercisesWithServer, 
  getModifiedExerciseIds,
  getAllWorkoutsFromLocalStorage,
  saveAllWorkoutsToLocalStorage,
  getModifiedWorkoutDays,
  completeWorkoutLocally
} from '../utils/offlineWorkoutStorage';
import { syncAllOfflineChanges, hasPendingChanges } from '../utils/syncUtils';

const Home = ({ isWorkoutActive, setIsWorkoutActive, darkMode }) => {
  const [workouts, setWorkouts] = useState([]);
  const [notification, setNotification] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [programWorkoutNames, setProgramWorkoutNames] = useState({});
  const [showSyncDialog, setShowSyncDialog] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Track network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Home is now online');
      setIsOnline(true);
      checkForLocalChanges();
    };
    
    const handleOffline = () => {
      console.log('Home is now offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch workouts and active program on component mount
  useEffect(() => {
    fetchWorkouts();
    fetchActiveProgram();
    checkForLocalChanges();
  }, [isOnline]);
  
  // Check if there are pending local changes
  const checkForLocalChanges = () => {
    console.log('Checking for local changes...');
    // First check if we've explicitly set hasLocalChanges to false
    if (hasLocalChanges === false) {
      console.log('Local changes flag already set to false, skipping check');
      return;
    }
    
    const hasChanges = hasPendingChanges();
    console.log('Local changes detected:', hasChanges);
    setHasLocalChanges(hasChanges);
  };
  
  // Fetch the user's active program
  const fetchActiveProgram = async () => {
    try {
      // First check localStorage
      const storedProgram = localStorage.getItem('active_program');
      if (storedProgram && workoutPrograms[storedProgram]) {
        // Create mapping of day numbers to workout names from localStorage
        const program = workoutPrograms[storedProgram];
        const workoutNameMap = {};
        
        program.workouts.forEach(workout => {
          workoutNameMap[workout.day] = workout.name;
        });
        
        setProgramWorkoutNames(workoutNameMap);
      }
      
      // If we're online, also check the server
      if (isOnline) {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch('/api/user/active-program', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Save to localStorage for offline use
          if (data.activeProgram) {
            localStorage.setItem('active_program', data.activeProgram);
          }
          
          // If we have an active program, create a mapping of day numbers to workout names
          if (data.activeProgram && workoutPrograms[data.activeProgram]) {
            const program = workoutPrograms[data.activeProgram];
            const workoutNameMap = {};
            
            program.workouts.forEach(workout => {
              workoutNameMap[workout.day] = workout.name;
            });
            
            setProgramWorkoutNames(workoutNameMap);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching active program:', error);
    }
  };

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      
      // Try to load from localStorage first
      const localWorkouts = getAllWorkoutsFromLocalStorage();
      
      if (!isOnline) {
        // Offline mode - use localStorage only
        if (localWorkouts) {
          console.log('Using locally stored workouts (offline mode)');
          // Sort workouts by day number
          localWorkouts.sort((a, b) => a.day - b.day);
          setWorkouts(localWorkouts);
        } else {
          showNotification('No cached workouts available offline', 'warning');
        }
      } else {
        // Online mode - try server first
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const response = await fetch('/api/workouts', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            throw new Error('Failed to fetch workouts from server');
          }
          
          const data = await response.json();
          
          // Sort workouts by day number
          data.sort((a, b) => a.day - b.day);
          
          // Save to localStorage for offline access
          saveAllWorkoutsToLocalStorage(data);
          
          setWorkouts(data);
        } catch (serverError) {
          console.error('Server fetch error, using localStorage:', serverError);
          
          // Fall back to localStorage if we have it
          if (localWorkouts) {
            console.log('Using locally stored workouts');
            localWorkouts.sort((a, b) => a.day - b.day);
            setWorkouts(localWorkouts);
          } else {
            showNotification('Failed to load workouts and no cache available', 'error');
          }
        }
      }
    } catch (error) {
      console.error('Error fetching workouts:', error);
      showNotification('Failed to load workouts', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({
      message,
      type
    });
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Handle workout toggle with local-first storage
  const handleWorkoutToggle = async () => {
    if (isWorkoutActive) {
      // We're ending the workout - need to sync with server
      try {
        setActionLoading(true);
        
        if (!isOnline) {
          // Offline mode - use local completion
          completeWorkoutLocally(); // This function handles workout completion locally
          setIsWorkoutActive(false);
          localStorage.setItem('isWorkoutActive', 'false');
          showNotification('Workout ended. Changes saved locally and will sync when youre online.', 'success');
          setActionLoading(false);
          
          // Make sure we set hasLocalChanges to true
          setHasLocalChanges(true);
          
          // Force check for local changes
          setTimeout(checkForLocalChanges, 500);
          return;
        }
        
        // Online mode - sync directly with server
        
        // First complete the workout locally to ensure history is recorded
        completeWorkoutLocally();
        
        console.log('Local workout completion done, syncing with server...');
        
        // Then call the server's complete endpoint
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch('/api/workouts/complete', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
  
        if (!response.ok) {
          throw new Error('Failed to complete workout on server');
        }
  
        console.log('Server workout completion successful');
        
        // Check if there are any remaining changes to sync
        const modifiedExerciseIds = getModifiedExerciseIds();
        
        if (modifiedExerciseIds.length > 0) {
          console.log(`Syncing ${modifiedExerciseIds.length} modified exercises after workout completion...`);
          
          // Use our comprehensive sync utility
          const syncResult = await syncAllOfflineChanges(user.token);
          
          if (!syncResult.success) {
            console.error('Sync failed:', syncResult);
            setSyncError(syncResult);
            setShowSyncDialog(true);
            setHasLocalChanges(true);
            setActionLoading(false);
            return; // Don't mark workout as ended if sync failed
          }
          
          console.log('Sync after workout completion successful');
        }
  
        showNotification('Workout completed and saved successfully');
        
        // Ensure we refresh the data after everything is synced
        // This is crucial for history to be properly displayed
        try {
          console.log('Refreshing workout data after completion...');
          const refreshResponse = await fetch('/api/workouts', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
            credentials: 'include'
          });
          
          if (refreshResponse.ok) {
            const refreshedData = await refreshResponse.json();
            saveAllWorkoutsToLocalStorage(refreshedData);
            console.log('Workout data refreshed successfully');
          }
        } catch (refreshError) {
          console.error('Failed to refresh data after workout completion:', refreshError);
        }
        
        // Force check for local changes
        setTimeout(checkForLocalChanges, 500);
      } catch (error) {
        console.error('Error completing workout:', error);
        showNotification('Failed to save workout data. Your changes are still saved locally.', 'error');
        setShowSyncDialog(true);
        setActionLoading(false);
        setHasLocalChanges(true);
        return; // Don't set workout to inactive if saving failed
      }
    }
    
    // Update the state and save to localStorage
    const newWorkoutActiveState = !isWorkoutActive;
    setIsWorkoutActive(newWorkoutActiveState);
    localStorage.setItem('isWorkoutActive', newWorkoutActiveState.toString());
    setActionLoading(false);
  };

// Handle manual sync button click
const handleSyncClick = async () => {
  if (!isOnline) {
    showNotification('You are offline. Please connect to the internet to sync.', 'warning');
    return;
  }
  
  try {
    setSyncLoading(true);
    showNotification('Syncing changes...', 'info');
    
    // Get user token
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
      throw new Error('User not authenticated');
    }
    
    console.log('Starting sync process...');
    
    // Use our comprehensive sync utility
    const syncResult = await syncAllOfflineChanges(user.token);
    
    if (syncResult.success) {
      // Clear tracking data once server confirms sync
      localStorage.removeItem('modified_exercises');
      localStorage.removeItem('modified_workout_days');
      localStorage.removeItem('temp_exercises');
      localStorage.removeItem('deleted_exercises');
      localStorage.removeItem('deleted_workout_days');
      localStorage.removeItem('new_workout_days');
      setHasLocalChanges(false);
    }
    
    if (!syncResult.success) {
      console.error('Sync failed:', syncResult);
      setSyncError(syncResult);
      setShowSyncDialog(true);
      showNotification('Some changes failed to sync. See details for more information.', 'warning');
    } else {
      console.log('Sync completed successfully');
      showNotification('All changes synced successfully!', 'success');
      
      // Refresh workouts
      await fetchWorkouts();
    }
  } catch (error) {
    console.error('Error during sync:', error);
    showNotification('Failed to sync changes. Please try again later.', 'error');
  } finally {
    setSyncLoading(false);
  }
};

  // Retry syncing with server
  const handleRetrySync = async () => {
    try {
      setActionLoading(true);
      
      if (!isOnline) {
        showNotification('You are currently offline. Please try again when connected.', 'warning');
        setActionLoading(false);
        return;
      }
      
      // Get user token
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        throw new Error('User not authenticated');
      }
      
      // Retry syncing
      const syncResult = await syncModifiedExercisesWithServer(user.token);
      
      if (!syncResult.success) {
        console.error('Retry sync failed:', syncResult);
        setSyncError(syncResult);
        showNotification('Sync failed. Please try again later.', 'error');
      } else {
        console.log('Retry sync successful:', syncResult);
        
        // Now complete the workout
        const response = await fetch('/api/workouts/complete', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('Failed to complete workout');
        }

        showNotification('Workout saved successfully');
        setShowSyncDialog(false);
        
        // Update workout state
        setIsWorkoutActive(false);
        localStorage.setItem('isWorkoutActive', 'false');
        
        // Update local changes status
        checkForLocalChanges();
      }
    } catch (error) {
      console.error('Error retrying sync:', error);
      showNotification('Failed to save workout data. Please try again later.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle edit mode for workouts
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Add a new workout day with offline support
  const handleAddWorkoutDay = async () => {
    try {
      setActionLoading(true);
      
      // Find the highest day number to determine the next day number
      const highestDay = workouts.reduce((max, workout) => 
        workout.day > max ? workout.day : max, 0);
      
      const newDayNumber = highestDay + 1;
      
      if (!isOnline) {
        // Offline mode - create locally
        addWorkoutDayOffline(newDayNumber);
        return;
      }
      
      // Online mode - try server first
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        // Call the API to create a new workout day
        const response = await fetch('/api/workouts/days', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ day: newDayNumber }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add workout day');
        }
        
        // Refresh workouts after addition
        await fetchWorkouts();
        
        showNotification(`Day ${newDayNumber} added successfully`);
      } catch (error) {
        console.error('Server error, falling back to offline mode:', error);
        addWorkoutDayOffline(newDayNumber);
      }
    } catch (error) {
      console.error('Error adding workout day:', error);
      showNotification(`Failed to add workout day: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to add workout day in offline mode
  const addWorkoutDayOffline = (dayNumber) => {
    // Create new empty workout day
    const newWorkout = {
      day: dayNumber,
      exercises: [],
      _id: `temp_day_${Date.now()}` // Temporary ID for offline mode
    };
    
    // Update workouts in memory
    const updatedWorkouts = [...workouts, newWorkout];
    updatedWorkouts.sort((a, b) => a.day - b.day);
    
    // Update state
    setWorkouts(updatedWorkouts);
    setHasLocalChanges(true);
    
    // Save to localStorage
    saveAllWorkoutsToLocalStorage(updatedWorkouts);
    
    // Track this new day for syncing
    const modifiedDays = getModifiedWorkoutDays();
    modifiedDays.push(dayNumber.toString());
    localStorage.setItem('modified_workout_days', JSON.stringify(modifiedDays));
    
    // Store new day info
    const newDays = JSON.parse(localStorage.getItem('new_workout_days') || '[]');
    newDays.push({ day: dayNumber, id: newWorkout._id });
    localStorage.setItem('new_workout_days', JSON.stringify(newDays));
    
    showNotification(`Day ${dayNumber} added and saved locally`, 'success');
  };

  // Remove a workout day with offline support
  const handleRemoveWorkoutDay = async (dayToRemove) => {
    try {
      setActionLoading(true);
      
      // Check if this is a temporary day created offline
      const isTemporaryDay = workouts.find(w => w.day === dayToRemove && w._id?.startsWith('temp_day_'));
      
      if (!isOnline) {
        // Offline mode - remove locally
        removeWorkoutDayOffline(dayToRemove);
        return;
      }
      
      // Skip server call for temporary days that only exist locally
      if (!isTemporaryDay) {
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          
          // Call the API to remove the workout day
          const response = await fetch(`/api/workouts/days/${dayToRemove}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
            credentials: 'include'
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to remove workout day');
          }
          
          // Refresh workouts after removal
          await fetchWorkouts();
          
          showNotification(`Day ${dayToRemove} removed successfully`);
        } catch (error) {
          console.error('Server error, falling back to offline mode:', error);
          removeWorkoutDayOffline(dayToRemove);
        }
      } else {
        // For temporary days, just remove locally
        removeWorkoutDayOffline(dayToRemove);
      }
    } catch (error) {
      console.error('Error removing workout day:', error);
      showNotification(`Failed to remove workout day: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to remove workout day in offline mode
  const removeWorkoutDayOffline = (dayToRemove) => {
    // Find the workout to check if it's temporary
    const workoutToRemove = workouts.find(w => w.day === dayToRemove);
    const isTemporaryDay = workoutToRemove?._id?.startsWith('temp_day_');
    
    // Update workouts in memory
    const updatedWorkouts = workouts.filter(w => w.day !== dayToRemove);
    
    // Update state
    setWorkouts(updatedWorkouts);
    setHasLocalChanges(true);
    
    // Save to localStorage
    saveAllWorkoutsToLocalStorage(updatedWorkouts);
    
    if (isTemporaryDay) {
      // For temporary days, remove from new days list
      const newDays = JSON.parse(localStorage.getItem('new_workout_days') || '[]');
      const updatedNewDays = newDays.filter(d => d.day !== dayToRemove);
      localStorage.setItem('new_workout_days', JSON.stringify(updatedNewDays));
    } else {
      // For server days, mark as deleted
      const deletedDays = JSON.parse(localStorage.getItem('deleted_workout_days') || '[]');
      deletedDays.push(dayToRemove);
      localStorage.setItem('deleted_workout_days', JSON.stringify(deletedDays));
    }
    
    showNotification(`Day ${dayToRemove} removed and saved locally`, 'success');
  };

  // Get workout name from program or use default
  const getWorkoutName = (day) => {
    // If we have a program-specific name for this day, use it
    if (programWorkoutNames[day]) {
      return programWorkoutNames[day];
    }
    // Otherwise, return a generic name
    return "Workout";
  };

  // Render workout card
  const renderWorkoutCard = (workout) => (
    <div
      key={workout.day}
      className="workout-card relative"
    >
      {editMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRemoveWorkoutDay(workout.day);
          }}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full p-2 transition-colors z-10"
          disabled={actionLoading}
          aria-label="Remove workout day"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </button>
      )}
      
      <Link
        to={`/workout/${workout.day}`}
        className={`block p-6 ${workout._id?.startsWith('temp_day_') ? 'border-l-4 border-yellow-500 dark:border-yellow-400' : ''}`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-gray-800 dark:text-gray-100">
              Day {workout.day}: {getWorkoutName(workout.day)}
            </h3>
            {workout._id?.startsWith('temp_day_') && (
              <span className="text-xs text-yellow-600 dark:text-yellow-400">Added offline (not synced)</span>
            )}
          </div>
        </div>
        
        {workout.exercises && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {workout.exercises.length > 0 
              ? `${workout.exercises.length} exercise${workout.exercises.length !== 1 ? 's' : ''}` 
              : 'No exercises - click to add'}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-gray-500 dark:text-gray-400 text-sm">View exercises</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </Link>
    </div>
  );

  return (
    <div>
      {/* Sync Dialog */}
      {showSyncDialog && (
        <Alert type="warning" className="mb-6">
          <div>
            <h3 className="font-bold text-lg">Workout Data Not Saved</h3>
            <p className="mt-2">
              {syncError 
                ? `Failed to save ${syncError.failedCount} of ${syncError.totalCount} exercises.` 
                : "Your workout data couldn't be saved to the server."}
              <br/> 
              Your changes are still saved on this device.
            </p>
            
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleRetrySync}
                variant="primary"
                loading={actionLoading}
                disabled={!isOnline}
              >
                Retry Saving
              </Button>
              <Button
                onClick={() => setShowSyncDialog(false)}
                variant="secondary"
                disabled={actionLoading}
              >
                Close
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Sync Changes Banner (Only show when online with pending changes) */}
      {hasLocalChanges && isOnline && !isWorkoutActive && (
        <Alert type="info" className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">You have unsaved changes</h3>
              <p className="text-sm mt-1">Changes made while offline need to be synced</p>
            </div>
            <Button
              onClick={handleSyncClick}
              variant="primary"
              loading={syncLoading}
              className="flex items-center space-x-2"
              size="sm"
            >
              {syncLoading ? (
                "Syncing..."
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>Sync Now</span>
                </>
              )}
            </Button>
          </div>
        </Alert>
      )}

      {/* Workout Status Card with local changes indicator */}
      <Card 
        className="mb-8"
        headerContent={
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 w-full">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1 flex items-center">
                {isWorkoutActive ? 'Workout in Progress' : 'Ready to Train?'}
                {hasLocalChanges && isWorkoutActive && (
                  <span className="ml-2 text-xs bg-yellow-500/30 text-white px-2 py-0.5 rounded-full">
                    Unsaved changes
                  </span>
                )}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {isWorkoutActive 
                  ? hasLocalChanges 
                    ? 'All changes are saved locally and will be synchronized when you end your workout'
                    : 'Keep pushing! You got this!' 
                  : 'Start a workout session to track your progress'}
              </p>
            </div>
            <Button
              variant={isWorkoutActive ? 'danger' : 'primary'}
              rounded
              size="lg"
              onClick={handleWorkoutToggle}
              loading={actionLoading}
              className="transform hover:scale-105"
            >
              {isWorkoutActive ? 'END WORKOUT' : 'START WORKOUT'}
            </Button>
          </div>
        }
      />
      
      {/* Workouts Header with Edit Button */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Your Workouts</h3>
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
              <span>Edit Workouts</span>
            </>
          )}
        </Button>
      </div>
      
      {/* Workout Cards */}
      {!loading && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {workouts.map(workout => renderWorkoutCard(workout))}
          
          {/* No workout message if empty */}
          {workouts.length === 0 && !editMode && (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-lg mb-2">No workouts yet</p>
              <p>Click "Edit Workouts" to add your first workout day</p>
            </div>
          )}
          
          {/* Add Workout Button - Only visible in edit mode */}
          {editMode && (
            <Button
              onClick={handleAddWorkoutDay}
              variant="secondary"
              className="h-full min-h-[180px] flex items-center justify-center space-x-2 border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 rounded-lg"
              disabled={actionLoading}
            >
              {actionLoading ? (
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Add Workout Day</span>
                </>
              )}
            </Button>
          )}
        </div>
      )}

      {/* Notifications */}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onDismiss={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default Home;
