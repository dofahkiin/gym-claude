// frontend/src/components/Home.js with component library - Fixed circular dependency
import React, { useState } from 'react';
// Import from the ui directory explicitly rather than importing a component that might import Home
import { Button, Card, Notification } from '../components/ui';
import { Link } from 'react-router-dom';

const workouts = [
  { id: 1, name: 'Day 1: Workout A', exerciseCount: 5 },
  { id: 2, name: 'Day 2: Workout B', exerciseCount: 4 },
  { id: 3, name: 'Day 3: Workout C', exerciseCount: 6 },
];

const Home = ({ isWorkoutActive, setIsWorkoutActive, darkMode }) => {
  const [notification, setNotification] = useState(null);

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
    setIsWorkoutActive(!isWorkoutActive);
  };

  // Manually create workout cards since we're avoiding the WorkoutCard component to prevent circular dependencies
  const renderWorkoutCard = (workout) => (
    <Link
      key={workout.id}
      to={`/workout/${workout.id}`}
      className="workout-card"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-gray-800 dark:text-gray-100">{workout.name}</h3>
        </div>
        
        {workout.exerciseCount && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {workout.exerciseCount} exercise{workout.exerciseCount !== 1 ? 's' : ''}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-gray-500 dark:text-gray-400 text-sm">View exercises</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Link>
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
      
      {/* Workout Cards */}
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Workouts</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workouts.map(workout => renderWorkoutCard(workout))}
      </div>

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