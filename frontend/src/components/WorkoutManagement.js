// src/components/WorkoutManagement.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from './ui';

const WorkoutManagement = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newWorkoutName, setNewWorkoutName] = useState('');
  const [isAddingWorkout, setIsAddingWorkout] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const navigate = useNavigate();

  // Fetch workouts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoading(true);
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch('/api/workouts/custom', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch workouts');
        }
        
        const data = await response.json();
        setWorkouts(data);
      } catch (error) {
        console.error('Error fetching workouts:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkouts();
  }, []);

  // Handle adding a new workout
  const handleAddWorkout = async (e) => {
    e.preventDefault();
    
    if (!newWorkoutName.trim()) {
      showNotification('Please enter a workout name', 'error');
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch('/api/workouts/custom', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: newWorkoutName,
          exercises: [] 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to create workout');
      }
      
      const newWorkout = await response.json();
      setWorkouts([...workouts, newWorkout]);
      setNewWorkoutName('');
      setIsAddingWorkout(false);
      showNotification('Workout created successfully');
    } catch (error) {
      console.error('Error creating workout:', error);
      showNotification(`Failed to create workout: ${error.message}`, 'error');
    }
  };

  // Handle deleting a workout
  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('Are you sure you want to delete this workout?')) {
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`/api/workouts/custom/${workoutId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete workout');
      }
      
      setWorkouts(workouts.filter(workout => workout._id !== workoutId));
      showNotification('Workout deleted successfully');
    } catch (error) {
      console.error('Error deleting workout:', error);
      showNotification(`Failed to delete workout: ${error.message}`, 'error');
    }
  };

  // Handle editing a workout
  const handleEditWorkout = (workoutId) => {
    navigate(`/workout/${workoutId}/edit`);
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  return (
    <div className="workout-management">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Manage Workouts</h1>
          <p className="text-gray-600 dark:text-gray-300">Create, edit or delete your workouts</p>
        </div>
        <Button
          onClick={() => navigate('/')}
          variant="secondary"
          rounded
          className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back to Home</span>
        </Button>
      </div>

      {/* Add Workout Button */}
      {!isAddingWorkout ? (
        <Card className="mb-6">
          <div className="p-6">
            <Button
              onClick={() => setIsAddingWorkout(true)}
              variant="primary"
              className="w-full flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add New Workout
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="mb-6">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Create a New Workout</h3>
            <form onSubmit={handleAddWorkout} className="space-y-4">
              <Input
                label="Workout Name"
                value={newWorkoutName}
                onChange={(e) => setNewWorkoutName(e.target.value)}
                placeholder="e.g., Push Day, Pull Day, Leg Day"
                required
              />
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setIsAddingWorkout(false);
                    setNewWorkoutName('');
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Create Workout
                </Button>
              </div>
            </form>
          </div>
        </Card>
      )}

      {/* Workouts List */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Workouts</h2>
        
        {error && <Alert type="error">{error}</Alert>}
        
        {loading ? (
          <Card className="p-8 text-center">
            <div className="flex justify-center">
              <svg className="loading-spinner h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading your workouts...</p>
          </Card>
        ) : workouts.length === 0 ? (
          <Card className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No workouts yet</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Create your first workout to get started</p>
          </Card>
        ) : (
          workouts.map((workout) => (
            <Card key={workout._id} className="hover:shadow-md transition-shadow duration-200">
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-100 text-lg">{workout.name}</h3>
                    <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                      <span>{workout.exercises?.length || 0} exercises</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => handleEditWorkout(workout._id)}
                      variant="secondary"
                      size="sm"
                      className="flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                      Edit
                    </Button>
                    <Button
                      onClick={() => handleDeleteWorkout(workout._id)}
                      variant="danger"
                      size="sm"
                      className="flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Delete
                    </Button>
                  </div>
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

export default WorkoutManagement;