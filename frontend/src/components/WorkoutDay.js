// frontend/src/components/WorkoutDay.js - updated
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const WorkoutDay = () => {
  const { day } = useParams();
  const [workout, setWorkout] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchWorkout = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/workouts/${day}`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
        const data = await response.json();
        setWorkout(data);
      } catch (error) {
        console.error('Error fetching workout:', error);
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

  if (!workout) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Day {day}</h1>
        <button
          onClick={handleBackClick}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Back to Home
        </button>
      </div>
      <div className="space-y-4">
        {workout.exercises.map((exercise) => (
          <div
            key={exercise._id}
            onClick={() => handleExerciseClick(exercise._id)}
            className="block bg-white p-4 rounded shadow hover:shadow-lg transition cursor-pointer"
          >
            <div className="flex justify-between items-center">
              <span>{exercise.name}</span>
              <span className="text-gray-500">
                {exercise.sets.length}x{exercise.sets[0].reps} Reps
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutDay;