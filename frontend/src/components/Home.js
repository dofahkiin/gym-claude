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
    <div className="container mx-auto p-4">
      {/* Keep existing workout list UI */}
      <div className="space-y-4">
        {workouts.map((workout) => (
          <Link
            key={workout.id}
            to={`/workout/${workout.id}`}
            className="block bg-white p-4 rounded shadow hover:shadow-lg transition"
          >
            {workout.name}
          </Link>
        ))}
      </div>
      
      <button
        onClick={handleWorkoutToggle}
        className={`mt-8 w-full p-4 rounded text-white ${
          isWorkoutActive ? 'bg-red-500' : 'bg-green-500'
        }`}
      >
        {isWorkoutActive ? 'END WORKOUT' : 'START WORKOUT'}
      </button>

      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded shadow-lg ${
          notification.isError ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default Home;