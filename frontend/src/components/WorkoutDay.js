// Updated WorkoutDay.js with component library
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Alert } from './ui';

const WorkoutDay = ({ darkMode }) => {
  const { day } = useParams();
  const [workout, setWorkout] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        setLoading(true);
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
        setWorkout(data);
      } catch (error) {
        console.error('Error fetching workout:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkout();
  }, [day]);

  const handleExerciseClick = (exerciseId) => {
    navigate(`/workout/${day}/exercise/${exerciseId}`);
  };

  const handleBackClick = () => {
    navigate('/');
  };

  if (loading) {
    return <Loading text="Loading workout..." />;
  }

  if (!workout) {
    return <Alert type="error">Could not load workout data</Alert>;
  }

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Day {day}</h1>
          <p className="text-gray-600 dark:text-gray-300">Complete all exercises in this workout</p>
        </div>
        <Button
          onClick={handleBackClick}
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

      <div className="grid gap-4">
        {workout.exercises.map((exercise, index) => (
          <Card 
            key={exercise._id}
            className="cursor-pointer hover:shadow-md dark:shadow-gray-900/30 transition-shadow duration-200"
            onClick={() => handleExerciseClick(exercise._id)}
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="set-number mr-4">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800 dark:text-gray-100">{exercise.name}</h3>
                  <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                    <span>{exercise.sets.length} sets</span>
                    <span className="mx-2">•</span>
                    <span>{exercise.sets[0].reps} reps per set</span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 dark:text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default WorkoutDay;