// frontend/src/components/Home.js with Program-specific workout titles
import React, { useState, useEffect } from 'react';
import { Button, Card, Notification } from './ui';
import { Link } from 'react-router-dom';
import ProgramSelector from './ProgramSelector';
import workoutPrograms from '../data/workoutPrograms';

const Home = ({ isWorkoutActive, setIsWorkoutActive, darkMode }) => {
  const [workouts, setWorkouts] = useState([]);
  const [notification, setNotification] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [activeProgram, setActiveProgram] = useState(null);
  const [programWorkoutNames, setProgramWorkoutNames] = useState({});

  // Fetch workouts and active program on component mount
  useEffect(() => {
    fetchWorkouts();
    fetchActiveProgram();
  }, []);
  
  // Fetch the user's active program
  const fetchActiveProgram = async () => {
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
        setActiveProgram(data.activeProgram);
        
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
    } catch (error) {
      console.error('Error fetching active program:', error);
    }
  };

  const fetchWorkouts = async () => {
    try {
      setLoading(true);
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch('/api/workouts', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch workouts');
      }
      
      const data = await response.json();
      // Sort workouts by day number
      data.sort((a, b) => a.day - b.day);
      setWorkouts(data);
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

  const handleWorkoutToggle = async () => {
    if (isWorkoutActive) {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
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

        showNotification('Workout completed successfully');
      } catch (error) {
        showNotification('Failed to save workout data', 'error');
        console.error('Error completing workout:', error);
        return; // Don't set workout to inactive if saving failed
      }
    }
    
    // Update the state and save to localStorage
    const newWorkoutActiveState = !isWorkoutActive;
    setIsWorkoutActive(newWorkoutActiveState);
    localStorage.setItem('isWorkoutActive', newWorkoutActiveState.toString());
  };

  // Toggle edit mode for workouts
  const toggleEditMode = () => {
    setEditMode(!editMode);
  };

  // Toggle program selector visibility
  const toggleProgramSelector = () => {
    setShowProgramSelector(!showProgramSelector);
  };

  // Handle program selection
  const handleSelectProgram = async (programId) => {
    try {
      setActionLoading(true);
      
      // Get the selected program data
      const program = workoutPrograms[programId];
      if (!program) {
        throw new Error('Invalid program selected');
      }
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Use the new API endpoint to apply the program while preserving history
      const response = await fetch('/api/workouts/apply-program', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          program,
          programId 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply program');
      }
      
      // Refresh workouts after changes
      await fetchWorkouts();
      
      // Update active program
      setActiveProgram(programId);
      
      // Update workout names mapping
      const workoutNameMap = {};
      program.workouts.forEach(workout => {
        workoutNameMap[workout.day] = workout.name;
      });
      setProgramWorkoutNames(workoutNameMap);
      
      showNotification(`Successfully switched to ${program.name} program`);
      setShowProgramSelector(false);
    } catch (error) {
      console.error('Error applying program:', error);
      showNotification(`Failed to apply program: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Add a new workout day
  const handleAddWorkoutDay = async () => {
    try {
      setActionLoading(true);
      
      // Find the highest day number to determine the next day number
      const highestDay = workouts.reduce((max, workout) => 
        workout.day > max ? workout.day : max, 0);
      
      const newDayNumber = highestDay + 1;
      
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
      console.error('Error adding workout day:', error);
      showNotification(`Failed to add workout day: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove a workout day
  const handleRemoveWorkoutDay = async (dayToRemove) => {
    try {
      setActionLoading(true);
      
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
      console.error('Error removing workout day:', error);
      showNotification(`Failed to remove workout day: ${error.message}`, 'error');
    } finally {
      setActionLoading(false);
    }
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
        className="block p-6"
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">Day {workout.day}: {getWorkoutName(workout.day)}</h3>
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
      {/* Workout Status Card */}
      <Card 
        className="mb-8"
        headerContent={
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 w-full">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-100 text-lg mb-1">
                {isWorkoutActive ? 'Workout in Progress' : 'Ready to Train?'}
              </h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {isWorkoutActive 
                  ? 'Keep pushing! You got this!' 
                  : 'Start a workout session to track your progress'}
              </p>
            </div>
            <Button
              variant={isWorkoutActive ? 'danger' : 'primary'}
              rounded
              size="lg"
              onClick={handleWorkoutToggle}
              className="transform hover:scale-105"
            >
              {isWorkoutActive ? 'END WORKOUT' : 'START WORKOUT'}
            </Button>
          </div>
        }
      />

      {/* Active Program Card */}
      {activeProgram && workoutPrograms[activeProgram] && (
        <Card className="mb-6">
          <div className="px-6 py-4 flex items-center justify-between">
            <div>
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Active Program: <span className="text-indigo-600 dark:text-indigo-400">{workoutPrograms[activeProgram].name}</span>
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm ml-7">
                {workoutPrograms[activeProgram].description}
              </p>
            </div>
            <Button
              onClick={toggleProgramSelector}
              variant="secondary"
              size="sm"
              className="flex items-center space-x-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span>Change</span>
            </Button>
          </div>
        </Card>
      )}

      {/* Program Selector Toggle Button */}
      {(!activeProgram || !workoutPrograms[activeProgram]) && (
        <div className="mb-6 flex justify-center">
          <Button
            onClick={toggleProgramSelector}
            variant="secondary"
            className="flex items-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
            </svg>
            <span>{showProgramSelector ? 'Hide Programs' : 'Choose Workout Program'}</span>
          </Button>
        </div>
      )}

      {/* Program Selector */}
      {showProgramSelector && (
        <ProgramSelector 
          onSelectProgram={handleSelectProgram} 
          darkMode={darkMode}
        />
      )}
      
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
      {loading ? (
        <div className="flex justify-center py-20">
          <svg className="loading-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
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