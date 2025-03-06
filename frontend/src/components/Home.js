// frontend/src/components/Home.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const workouts = [
  { id: 1, name: 'Day 1: Workout A' },
  { id: 2, name: 'Day 2: Workout B' },
  { id: 3, name: 'Day 3: Workout C' },
];

const Home = ({ isWorkoutActive, setIsWorkoutActive }) => {
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
      {/* Welcome Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to GymTracker</h2>
        <p className="text-gray-600">Track your progress and crush your fitness goals</p>
      </div>
      
      {/* Workout Status Card */}
      <div className={`mb-8 rounded-lg p-6 shadow-md ${isWorkoutActive 
        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-emerald-500' 
        : 'bg-white'}`}>
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">
              {isWorkoutActive ? 'Workout in Progress' : 'Ready to Train?'}
            </h3>
            <p className="text-gray-600 text-sm">
              {isWorkoutActive 
                ? 'Keep pushing! You got this!' 
                : 'Start a workout session to track your progress'}
            </p>
          </div>
          <button
            onClick={handleWorkoutToggle}
            className={`px-6 py-3 rounded-full font-medium shadow-md transition-all duration-300 transform hover:scale-105 ${
              isWorkoutActive 
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
            }`}
          >
            {isWorkoutActive ? 'END WORKOUT' : 'START WORKOUT'}
          </button>
        </div>
      </div>
      
      {/* Workout Cards */}
      <h3 className="text-xl font-bold text-gray-800 mb-4">Your Workouts</h3>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {workouts.map((workout) => (
          <Link
            key={workout.id}
            to={`/workout/${workout.id}`}
            className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-gray-800">{workout.name}</h3>
                {/* We could add a status indicator here if workout had a status property */}
              </div>
              
              <div className="flex items-center justify-between mt-4">
                <span className="text-gray-500 text-sm">View exercises</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
          notification.isError ? 'bg-red-500' : 'bg-green-500'
        } text-white transition-opacity duration-300 ease-in-out max-w-md`}>
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