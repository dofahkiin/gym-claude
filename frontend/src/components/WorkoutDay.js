// frontend/src/components/WorkoutDay.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const WorkoutDay = () => {
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
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-gray-700">Loading workout...</span>
        </div>
      </div>
    );
  }

  if (!workout) return <div className="p-4 text-red-500">Could not load workout data</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Day {day}</h1>
          <p className="text-gray-600">Complete all exercises in this workout</p>
        </div>
        <button
          onClick={handleBackClick}
          className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full hover:bg-indigo-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back to Home</span>
        </button>
      </div>

      <div className="grid gap-4">
        {workout.exercises.map((exercise, index) => (
          <div
            key={exercise._id}
            onClick={() => handleExerciseClick(exercise._id)}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="bg-indigo-100 text-indigo-800 w-10 h-10 rounded-full flex items-center justify-center mr-4 font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{exercise.name}</h3>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <span>{exercise.sets.length} sets</span>
                    <span className="mx-2">•</span>
                    <span>{exercise.sets[0].reps} reps per set</span>
                  </div>
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutDay;