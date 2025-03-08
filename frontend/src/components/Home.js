// frontend/src/components/Home.js with design moved to CSS
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const workouts = [
  { id: 1, name: 'Day 1: Workout A' },
  { id: 2, name: 'Day 2: Workout B' },
  { id: 3, name: 'Day 3: Workout C' },
];

const Home = ({ isWorkoutActive, setIsWorkoutActive, darkMode }) => {
  const [notification, setNotification] = useState(null);

  const showNotification = (message, isError = false) => {
    setNotification({
      message,
      isError
    });
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
        showNotification('Failed to save workout data', true);
        console.error('Error completing workout:', error);
        return; // Don't set workout to inactive if saving failed
      }
    }
    setIsWorkoutActive(!isWorkoutActive);
  };

  return (
    <div>
      {/* Workout Status Card */}
      <div className={isWorkoutActive ? 'workout-active-card' : 'workout-inactive-card'}>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
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
          <button
            onClick={handleWorkoutToggle}
            className={`btn ${isWorkoutActive ? 'btn-danger' : 'btn-primary'} btn-rounded px-6 py-3 shadow-md transition-all duration-300 transform hover:scale-105`}
          >
            {isWorkoutActive ? 'END WORKOUT' : 'START WORKOUT'}
          </button>
        </div>
      </div>
      
      {/* Workout Cards */}
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Workouts</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workouts.map((workout) => (
          <Link
            key={workout.id}
            to={`/workout/${workout.id}`}
            className="workout-card"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800 dark:text-gray-100">{workout.name}</h3>
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-500 dark:text-gray-400 text-sm">View exercises</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {notification && (
        <div className={`notification ${notification.isError ? 'notification-error' : 'notification-success'}`}>
          <div className="flex items-center">
            {notification.isError ? (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            {notification.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;