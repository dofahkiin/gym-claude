// Exercise.js - Enhanced for complete offline support
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Alert, ExerciseSet } from './ui';
import RestTimer from './RestTimer';
import workoutPrograms from '../data/workoutPrograms';
import { sendNotification, scheduleNotification, cancelNotification } from '../utils/notificationService';
import { 
  saveExerciseToLocalStorage, 
  getExerciseFromLocalStorage,
  getWorkoutFromLocalStorage,
  markWorkoutDayAsModified
} from '../utils/offlineWorkoutStorage';

// Global timer storage keys
const GLOBAL_TIMER_START_KEY = 'global_rest_timer_start';
const GLOBAL_TIMER_DURATION_KEY = 'global_rest_timer_duration';
const GLOBAL_NOTIFICATION_KEY = 'global_notification_id';

const Exercise = ({ isWorkoutActive, darkMode }) => {
  const { id, day } = useParams();
  const [exercise, setExercise] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [restTime, setRestTime] = useState(90); // Default to 90 seconds
  const [activeNotificationId, setActiveNotificationId] = useState(null);
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Initialize timer state from localStorage
  const [timerStartTime, setTimerStartTime] = useState(null);

  // Add this ref to track visibility changes
  const visibilityRef = useRef({
    wasHidden: false,
    timerKey: null
  });

  const navigate = useNavigate();

  // Track network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('Exercise component is now online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('Exercise component is now offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Add this useEffect to handle page visibility changes
  useEffect(() => {
    // Function to check if timer expired while in background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && visibilityRef.current.wasHidden) {
        visibilityRef.current.wasHidden = false;
        
        // Check if we have an active timer
        if (exercise && exercise._id) {
          const timerKey = `timer_${exercise._id}`;
          const savedTimerStart = localStorage.getItem(timerKey);
          
          if (savedTimerStart) {
            const startTime = parseInt(savedTimerStart);
            const now = Date.now();
            const elapsedSeconds = (now - startTime) / 1000;
            
            console.log('Visibility restored, checking timer:', {
              elapsedSeconds,
              restTime,
              hasExpired: elapsedSeconds >= restTime
            });
            
            // If timer should have expired while in background
            if (elapsedSeconds >= restTime) {
              // Clean up the timer
              localStorage.removeItem(timerKey);
              setTimerStartTime(null);
              
              // No need to send a notification here, as the server handles it
              console.log('Timer expired while in background, server notification should have been sent');
            } else {
              // Timer still running, update the state
              setTimerStartTime(startTime);
            }
          }
        }
      } else if (document.visibilityState === 'hidden') {
        // Mark that the page was hidden
        visibilityRef.current.wasHidden = true;
        
        if (exercise && exercise._id) {
          visibilityRef.current.timerKey = `timer_${exercise._id}`;
        }
      }
    };
    
    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [exercise, restTime]);

  // Fetch all exercises for this workout day
  useEffect(() => {
    const fetchWorkoutExercises = async () => {
      try {
        // First try to get exercises from localStorage
        const localWorkout = getWorkoutFromLocalStorage(day);
        
        if (!isOnline) {
          // Offline mode - use localStorage only
          if (localWorkout && localWorkout.exercises) {
            console.log('Using locally stored workout exercises (offline mode)');
            setExercises(localWorkout.exercises);
          } else {
            throw new Error('No cached workout data available offline');
          }
        } else {
          // Online mode - try server first, fall back to cache
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
          } catch (serverError) {
            console.error('Server fetch error, trying localStorage:', serverError);
            
            if (localWorkout && localWorkout.exercises) {
              console.log('Using locally stored workout exercises');
              setExercises(localWorkout.exercises);
            } else {
              throw new Error('Failed to load workout data and no cache available');
            }
          }
        }
      } catch (err) {
        setError(err.message);
      }
    };

    if (day) {
      fetchWorkoutExercises();
    }
  }, [day, isOnline]);

  // Fetch exercise data - enhanced for offline support
  useEffect(() => {
    const fetchExerciseData = async () => {
      try {
        setLoading(true);
        
        // First check localStorage for this exercise
        const localExercise = getExerciseFromLocalStorage(id);
        
        if (!isOnline) {
          // Offline mode - use localStorage only
          if (localExercise) {
            console.log('Using locally stored exercise data (offline mode)');
            setExercise(localExercise);
            setHasLocalChanges(true);
            
            // Set rest time from local data
            if (localExercise.restTime) {
              setRestTime(localExercise.restTime);
            }
          } else {
            // If we can't find the specific exercise in localStorage, try to find it 
            // in the workout data (which might be cached as a whole)
            const localWorkout = getWorkoutFromLocalStorage(day);
            
            if (localWorkout && localWorkout.exercises) {
              const exerciseFromWorkout = localWorkout.exercises.find(ex => ex._id === id);
              if (exerciseFromWorkout) {
                console.log('Found exercise in cached workout data');
                setExercise(exerciseFromWorkout);
                
                // Also save it individually for easier access later
                saveExerciseToLocalStorage(exerciseFromWorkout);
                
                // Set rest time
                if (exerciseFromWorkout.restTime) {
                  setRestTime(exerciseFromWorkout.restTime);
                }
              } else {
                throw new Error('Exercise not found in cached data');
              }
            } else {
              throw new Error('No cached data available offline');
            }
          }
        } else {
          // Online mode - try local storage first, then server if needed
          if (localExercise) {
            console.log('Using locally stored exercise data');
            setExercise(localExercise);
            setHasLocalChanges(true);
            
            // Set rest time from local data
            if (localExercise.restTime) {
              setRestTime(localExercise.restTime);
            }
          } else {
            // Try server
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
              
              // Cache the data for offline use
              saveExerciseToLocalStorage(data);
              
              // Set rest time
              if (data.restTime) {
                setRestTime(data.restTime);
              } else {
                // Default rest time logic...
                const fetchActiveProgram = async () => {
                  // Get from localStorage first
                  const storedProgram = localStorage.getItem('active_program');
                  
                  if (storedProgram && workoutPrograms[storedProgram]) {
                    const program = workoutPrograms[storedProgram];
                    setRestTime(program.defaultRestTime || 90);
                  } else {
                    // Try server if offline fetch failed
                    try {
                      const user = JSON.parse(localStorage.getItem('user'));
                      const response = await fetch('/api/user/active-program', {
                        headers: {
                          'Authorization': `Bearer ${user.token}`,
                        },
                        credentials: 'include'
                      });
                      
                      if (response.ok) {
                        const data = await response.json();
                        
                        if (data.activeProgram && workoutPrograms[data.activeProgram]) {
                          const program = workoutPrograms[data.activeProgram];
                          setRestTime(program.defaultRestTime || 90);
                          
                          // Save to localStorage for offline access
                          localStorage.setItem('active_program', data.activeProgram);
                        }
                      }
                    } catch (error) {
                      console.error('Error fetching active program:', error);
                    }
                  }
                };
                
                fetchActiveProgram();
              }
            } catch (serverError) {
              console.error('Server fetch failed, trying workout cache:', serverError);
              
              // If individual exercise not found, try to find it in the workout data
              const localWorkout = getWorkoutFromLocalStorage(day);
              
              if (localWorkout && localWorkout.exercises) {
                const exerciseFromWorkout = localWorkout.exercises.find(ex => ex._id === id);
                if (exerciseFromWorkout) {
                  console.log('Found exercise in cached workout data');
                  setExercise(exerciseFromWorkout);
                  
                  // Also save it individually for easier access later
                  saveExerciseToLocalStorage(exerciseFromWorkout);
                  
                  // Set rest time
                  if (exerciseFromWorkout.restTime) {
                    setRestTime(exerciseFromWorkout.restTime);
                  }
                } else {
                  throw new Error('Exercise not found in cached data');
                }
              } else {
                throw serverError;
              }
            }
          }
        }
    
        // Check for GLOBAL timer first - this should take precedence over exercise-specific timers
        const globalTimerStart = localStorage.getItem(GLOBAL_TIMER_START_KEY);
        const globalTimerDuration = localStorage.getItem(GLOBAL_TIMER_DURATION_KEY);
        
        if (globalTimerStart && globalTimerDuration) {
          const startTime = parseInt(globalTimerStart);
          const duration = parseInt(globalTimerDuration);
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          
          console.log('Global timer found:', {
            startTime,
            duration,
            elapsedSeconds,
            remaining: duration - elapsedSeconds
          });
          
          // Only use the global timer if it hasn't expired yet
          if (elapsedSeconds < duration) {
            console.log('Using global timer across exercises');
            setTimerStartTime(startTime);
            
            // Make sure rest time matches the global timer's duration
            setRestTime(duration);
            
            // Also check for global notification ID
            const globalNotificationId = localStorage.getItem(GLOBAL_NOTIFICATION_KEY);
            if (globalNotificationId) {
              setActiveNotificationId(globalNotificationId);
            }
            
            // No need to check exercise-specific timer
            setLoading(false);
            return;
          } else {
            // Clean up expired global timer
            console.log('Global timer expired, cleaning up');
            localStorage.removeItem(GLOBAL_TIMER_START_KEY);
            localStorage.removeItem(GLOBAL_TIMER_DURATION_KEY);
            localStorage.removeItem(GLOBAL_NOTIFICATION_KEY);
          }
        }
        
        // Only check exercise-specific timer if no global timer is active
        console.log('No active global timer, checking exercise-specific timer');
        const savedTimer = localStorage.getItem(`timer_${id}`);
        if (savedTimer) {
          const startTime = parseInt(savedTimer);
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          
          // Only set the timer if it hasn't expired
          if (elapsedSeconds < restTime) {
            setTimerStartTime(startTime);
          } else {
            localStorage.removeItem(`timer_${id}`);
          }
        }
      } catch (err) {
        console.error('Error fetching exercise:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchExerciseData();
  }, [id, day, restTime, isOnline]);

  // Update current index when exercise and exercises list are loaded
  useEffect(() => {
    if (exercises.length > 0 && exercise) {
      const index = exercises.findIndex(ex => ex._id === exercise._id);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    }
  }, [exercise, exercises]);

  // Handle navigation - improved to handle temp IDs and offline exercises
  const handleNavigation = useCallback((direction) => {
    if (!exercises || !day) return;
    
    const newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < exercises.length) {
      const nextExercise = exercises[newIndex];
      if (nextExercise && nextExercise._id) {
        navigate(`/workout/${day}/exercise/${nextExercise._id}`);
      }
    }
  }, [currentIndex, exercises, navigate, day]);

  // Update rest time - Now saves to localStorage first
  const handleRestTimeChange = async (newDuration) => {
    try {
      if (!exercise) return;
      
      // Update local state immediately for responsive UI
      setRestTime(newDuration);
      
      // Create updated exercise data with new rest time
      const updatedExercise = { ...exercise, restTime: newDuration };
      
      // Save to localStorage first
      saveExerciseToLocalStorage(updatedExercise);
      setExercise(updatedExercise);
      setHasLocalChanges(true);
      
      // Mark the workout day as having changes
      markWorkoutDayAsModified(day);
      
      // Also update on server since this is a one-time configuration change
      // and doesn't affect workout history - but only if online
      if (isOnline && !exercise._id.startsWith('temp_')) {
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          
          await fetch(`/api/exercises/${exercise._id}/rest-time`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${user.token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ restTime: newDuration }),
            credentials: 'include'
          });
        } catch (error) {
          console.error('Failed to update rest time on server:', error);
          // Continue with the local changes even if server update fails
        }
      }
    } catch (err) {
      console.error('Failed to update rest time:', err);
      setError('Failed to update rest time, but changes are saved locally');
    }
  };

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    if (!exercise) return;
    
    // Clean up all timers
    setTimerStartTime(null);
    
    // Clear exercise-specific timer
    localStorage.removeItem(`timer_${exercise._id}`);
    localStorage.removeItem(`notification_${exercise._id}`);
    
    // Clear global timer
    localStorage.removeItem(GLOBAL_TIMER_START_KEY);
    localStorage.removeItem(GLOBAL_TIMER_DURATION_KEY);
    localStorage.removeItem(GLOBAL_NOTIFICATION_KEY);
    
    // Clear notification ID
    setActiveNotificationId(null);
    
    console.log('Timer completed - cleared both local and global timers');
  }, [exercise]);

  // Check timer expiration
  useEffect(() => {
    if (!timerStartTime || !exercise) return;
    
    // Store timer globally so it persists between exercises
    localStorage.setItem(GLOBAL_TIMER_START_KEY, timerStartTime.toString());
    localStorage.setItem(GLOBAL_TIMER_DURATION_KEY, restTime.toString());
    
    const checkTimer = () => {
      const now = Date.now();
      const elapsedSeconds = (now - timerStartTime) / 1000;
      
      if (elapsedSeconds >= restTime) {
        console.log('Timer expired, handling completion');
        handleTimerComplete();
      }
    };

    if (process.env.NODE_ENV === 'test') {
      return undefined;
    }

    // Check more frequently to ensure we don't miss the expiration
    const intervalId = setInterval(checkTimer, 500);
  
    // Also set up a backup absolute timeout as a fallback
    const timeRemaining = Math.max(0, (restTime * 1000) - (Date.now() - timerStartTime));
    const backupTimeoutId = setTimeout(() => {
      console.log('Backup timeout triggered for timer completion');
      handleTimerComplete();
    }, timeRemaining + 1000); // Add a small buffer
    
    return () => {
      clearInterval(intervalId);
      clearTimeout(backupTimeoutId);
    };
  }, [timerStartTime, exercise, handleTimerComplete, restTime]);

  // Load stored notification ID on component mount
  useEffect(() => {
    if (exercise && exercise._id) {
      const storedNotificationId = localStorage.getItem(`notification_${exercise._id}`);
      if (storedNotificationId) {
        setActiveNotificationId(storedNotificationId);
      }
    }
  }, [exercise]);

  // Calculate if timer should be shown
  const showTimer = useMemo(() => {
    if (!timerStartTime) return false;
    const elapsedSeconds = (Date.now() - timerStartTime) / 1000;
    return elapsedSeconds < restTime;
  }, [timerStartTime, restTime]);

  // Handle set completion - MODIFIED to save to localStorage first
  const handleSetCompletion = useCallback(async (setIndex) => {
    if (!isWorkoutActive || !exercise) return;
    
    try {
      const updatedSets = exercise.sets.map((set, index) => {
        if (index === setIndex) {
          const newCompleted = !set.completed;
          
          if (newCompleted) {
            // Start the timer when a set is marked complete
            const startTime = Date.now();
            
            // Update state for the UI timer
            setTimerStartTime(startTime);
            
            // Store in exercise-specific localStorage 
            localStorage.setItem(`timer_${exercise._id}`, startTime.toString());
            
            // Store in global localStorage for persistence across exercises
            localStorage.setItem(GLOBAL_TIMER_START_KEY, startTime.toString());
            localStorage.setItem(GLOBAL_TIMER_DURATION_KEY, restTime.toString());
            
            console.log('Timer started with global persistence:', {
              exerciseId: exercise._id,
              setIndex,
              startTime,
              restTime
            });
            
            // Cancel any existing notification
            if (activeNotificationId && isOnline) {
              cancelNotification(activeNotificationId).then(success => {
                if (success) {
                  console.log('Previous notification canceled successfully');
                } else {
                  console.error('Failed to cancel previous notification');
                }
              });
            }
            
            // Only try to schedule notification if we're online
            if (isOnline) {
              // Calculate early notification time (3 seconds before timer ends)
              // Ensure at least 1 second delay
              const notificationDelay = Math.max(restTime - 3, 1);
              
              // Schedule notification to arrive 3 seconds early
              scheduleNotification(
                'Timer',
                `Done`,
                window.location.href,
                notificationDelay
              ).then(result => {
                if (result.success) {
                  console.log('Notification scheduled successfully with ID:', result.notificationId);
                  setActiveNotificationId(result.notificationId);
                  
                  // Store notification ID both locally and globally
                  localStorage.setItem(`notification_${exercise._id}`, result.notificationId);
                  localStorage.setItem(GLOBAL_NOTIFICATION_KEY, result.notificationId);
                } else {
                  console.error('Failed to schedule notification');
                }
              });
            }
          } else {
            // User is unchecking the set, cancel any notification and stop timers
            if (activeNotificationId && isOnline) {
              cancelNotification(activeNotificationId).then(success => {
                if (success) {
                  console.log('Notification canceled on set uncheck');
                } else {
                  console.error('Failed to cancel notification on set uncheck');
                }
              });
            }
            
            // Clear notification ID and timer (both local and global)
            setActiveNotificationId(null);
            setTimerStartTime(null);
            localStorage.removeItem(`timer_${exercise._id}`);
            localStorage.removeItem(`notification_${exercise._id}`);
            localStorage.removeItem(GLOBAL_TIMER_START_KEY);
            localStorage.removeItem(GLOBAL_TIMER_DURATION_KEY);
            localStorage.removeItem(GLOBAL_NOTIFICATION_KEY);
          }
          
          return { ...set, completed: newCompleted };
        }
        return set;
      });
  
      // Update local state
      const updatedExercise = { ...exercise, sets: updatedSets };
      
      // VERY IMPORTANT: Make sure history isn't lost when updating the exercise
      if (!updatedExercise.history && exercise.history) {
        console.log(`Preserving existing history with ${exercise.history.length} entries`);
        updatedExercise.history = exercise.history;
      }
      
      setExercise(updatedExercise);
      
      // Save to localStorage 
      saveExerciseToLocalStorage(updatedExercise);
      setHasLocalChanges(true);
      
      // Mark workout day as modified
      markWorkoutDayAsModified(day);
    } catch (err) {
      console.error('Set completion error:', err);
      setError(err.message);
    }
  }, [exercise, isWorkoutActive, restTime, activeNotificationId, isOnline, day]);

  // Handle set addition - with offline support
  const handleAddSet = async () => {
    if (!exercise) return;
    
    try {
      setActionLoading(true);
      
      // Get the last set's data to use as a template for the new set
      const lastSet = exercise.sets[exercise.sets.length - 1];
      
      if (!isOnline || exercise._id.startsWith('temp_')) {
        // Offline mode or temp exercise - add set locally
        addSetOffline(lastSet);
        return;
      }
      
      // Online mode - try to add set to server
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`/api/exercises/${exercise._id}/sets`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            weight: lastSet.weight,
            reps: lastSet.reps
          }),
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to add new set');
        }
        
        // Refresh exercise data
        const getResponse = await fetch(`/api/exercises/${exercise._id}`, {
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
        
        // Also store in localStorage
        saveExerciseToLocalStorage(data);
      } catch (error) {
        console.error('Server error, falling back to offline mode:', error);
        addSetOffline(lastSet);
      }
    } catch (err) {
      console.error('Add set error:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to add set in offline mode
  const addSetOffline = (lastSet) => {
    // Create a new set based on the last set
    const newSet = {
      weight: lastSet.weight,
      reps: lastSet.reps,
      completed: false
    };
    
    // Update exercise in memory
    const updatedExercise = { ...exercise };
    updatedExercise.sets = [...updatedExercise.sets, newSet];
    
    // Update state
    setExercise(updatedExercise);
    setHasLocalChanges(true);
    
    // Save to localStorage
    saveExerciseToLocalStorage(updatedExercise);
    
    // Mark workout day as modified
    markWorkoutDayAsModified(day);
    
    console.log('Set added locally');
  };

  // Handle set removal - with offline support
  const handleRemoveSet = async (setIndex) => {
    if (!exercise) return;
    
    // Don't allow removing the last set
    if (exercise.sets.length <= 1) {
      setError('Cannot remove the last set');
      return;
    }
    
    try {
      setActionLoading(true);
      
      if (!isOnline || exercise._id.startsWith('temp_')) {
        // Offline mode or temp exercise - remove set locally
        removeSetOffline(setIndex);
        return;
      }
      
      // Online mode - try to remove from server
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        
        const response = await fetch(`/api/exercises/${exercise._id}/sets/${setIndex}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to remove set');
        }
        
        // Refresh exercise data
        const getResponse = await fetch(`/api/exercises/${exercise._id}`, {
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
        
        // Also store in localStorage
        saveExerciseToLocalStorage(data);
      } catch (error) {
        console.error('Server error, falling back to offline mode:', error);
        removeSetOffline(setIndex);
      }
    } catch (err) {
      console.error('Remove set error:', err);
      setError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Helper to remove set in offline mode
  const removeSetOffline = (setIndex) => {
    // Update exercise in memory
    const updatedExercise = { ...exercise };
    updatedExercise.sets = exercise.sets.filter((_, i) => i !== setIndex);
    
    // Update state
    setExercise(updatedExercise);
    setHasLocalChanges(true);
    
    // Save to localStorage
    saveExerciseToLocalStorage(updatedExercise);
    
    // Mark workout day as modified
    markWorkoutDayAsModified(day);
    
    console.log('Set removed locally');
  };

  // Handle weight change - MODIFIED to save to localStorage first
  const handleWeightChange = useCallback((index, value) => {
    if (!exercise) return;

    const updatedSets = exercise.sets.map((set, i) => 
      i === index 
        ? { ...set, weight: parseFloat(value) } 
        : set
    );

    // Update local state
    const updatedExercise = { ...exercise, sets: updatedSets };
    setExercise(updatedExercise);
    
    // Save to localStorage instead of server
    saveExerciseToLocalStorage(updatedExercise);
    setHasLocalChanges(true);
    
    // Mark workout day as modified
    markWorkoutDayAsModified(day);
  }, [exercise, day]);

  // Handle reps change - MODIFIED to save to localStorage first
  const handleRepsChange = useCallback((index, value) => {
    if (!exercise) return;

    const updatedSets = exercise.sets.map((set, i) => 
      i === index 
        ? { ...set, reps: parseInt(value) } 
        : set
    );

    // Update local state 
    const updatedExercise = { ...exercise, sets: updatedSets };
    setExercise(updatedExercise);
    
    // Save to localStorage instead of server
    saveExerciseToLocalStorage(updatedExercise);
    setHasLocalChanges(true);
    
    // Mark workout day as modified
    markWorkoutDayAsModified(day);
  }, [exercise, day]);

  if (error) return <Alert type="error">Error: {error}</Alert>;
  
  // IMPORTANT CHANGE: Instead of showing a loading state, maintain the previous exercise
  // data while loading the new one
  if (!exercise || !Array.isArray(exercise.sets)) {
    return null; // Return nothing while loading instead of a loading indicator
  }

  // Count completed sets
  const completedSets = exercise.sets.filter(set => set.completed).length;

  return (
    <div>
      <Card className="mb-8">
        <div className="card-gradient-header">
          <div className="flex items-center mb-1 -ml-2">
            <button
              onClick={() => navigate(`/workout/${day}`)}
              className="hover:bg-white/10 rounded-full p-1 transition-colors flex-shrink-0"
              aria-label="Back to workout"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-xl font-bold">
              {exercise.name}
              {exercise._id?.startsWith('temp_') && (
                <span className="ml-2 text-xs bg-yellow-500/30 text-white px-2 py-0.5 rounded-full">
                  Added offline
                </span>
              )}
            </h1>
          </div>
          <div className="flex items-center text-indigo-100 text-sm">
            <span>{completedSets} of {exercise.sets.length} sets completed</span>
            
            {hasLocalChanges && !isOnline && (
              <span className="ml-2 bg-yellow-500/30 text-white text-xs px-2 py-0.5 rounded-full">
                Saved locally
              </span>
            )}
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Exercise {currentIndex + 1} of {exercises?.length || 0}
            </span>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleNavigation('prev')}
                disabled={currentIndex === 0}
                variant="secondary"
                rounded
                size="sm"
                className="flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Previous</span>
              </Button>
              <Button
                onClick={() => handleNavigation('next')}
                disabled={currentIndex === (exercises?.length || 0) - 1}
                variant="secondary"
                rounded
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>Next</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>
          <div className="progress-bar">
            <div
              className="progress-value"
              style={{ width: `${((currentIndex + 1) / (exercises?.length || 1)) * 100}%` }}
            />
          </div>

        </div>
      </Card>

      {/* Offline Warning - only show if offline and user needs to know */}
      {!isOnline && hasLocalChanges && (
        <Alert type="warning" className="mb-6">
          You're currently offline. Changes will be saved locally and synced when you're back online.
        </Alert>
      )}

      {/* Rest Timer - show prominently if active */}
      {showTimer && (
        <Alert type="info" className="mb-6">
          <div>
            <h3 className="text-blue-800 dark:text-blue-300 font-medium mb-3 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              Rest Timer
            </h3>
            <RestTimer 
              onComplete={handleTimerComplete}
              startTime={timerStartTime}
              duration={restTime}
              darkMode={darkMode}
              onDurationChange={handleRestTimeChange}
            />
          </div>
        </Alert>
      )}

      {/* Exercise Sets */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">Sets</h3>
          <Button
            onClick={() => setEditMode(!editMode)}
            variant="secondary"
            size="sm"
            className={`flex items-center space-x-1 ${
              editMode 
                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300'
            }`}
            disabled={actionLoading}
          >
            {editMode ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Done</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Edit Sets</span>
              </>
            )}
          </Button>
        </div>
        <div className="space-y-3">
          {exercise.sets.map((set, index) => (
            <ExerciseSet 
              key={index}
              index={index} 
              set={set}
              onWeightChange={handleWeightChange}
              onRepsChange={handleRepsChange}
              onCompletionToggle={handleSetCompletion}
              onRemove={() => handleRemoveSet(index)}
              canRemove={exercise.sets.length > 1}
              isWorkoutActive={isWorkoutActive}
              editMode={editMode}
            />
          ))}
        </div>
        
        {/* Add Set button - only visible in edit mode */}
        {editMode && (
          <div className="mt-4">
            <Button
              onClick={handleAddSet}
              variant="secondary"
              className="w-full py-2 flex items-center justify-center space-x-2 border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60"
              disabled={actionLoading}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span>Add Set</span>
            </Button>
          </div>
        )}
      </div>
      
      {/* Rest Timer Settings */}
      {editMode && (
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">Rest Timer</h3>
          <Card className="p-4">
            <RestTimer 
              duration={restTime}
              darkMode={darkMode}
              onDurationChange={handleRestTimeChange}
              editMode={true}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
              Customize your rest time between sets. Recommended rest times vary by program:
              <br/>
              • Strength: 3-5 minutes for compound exercises, 1-2 minutes for isolation
              <br/>
              • Hypertrophy: 1-2 minutes
              <br/>
              • Endurance: 30-60 seconds
            </p>
          </Card>
        </div>
      )}

      {/* History Button */}
      <div className="grid grid-cols-1 gap-4">
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
    </div>
  );
};

export default Exercise;
