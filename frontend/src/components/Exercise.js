// frontend/src/components/Exercise.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import RestTimer from './RestTimer';

const Exercise = ({ isWorkoutActive }) => {
  const { id } = useParams();
  const [exercise, setExercise] = useState(null);
  const [error, setError] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const navigate = useNavigate();
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

  const fetchExerciseData = async (exerciseId) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch exercise data');
      }
      
      const data = await response.json();
      setExercise(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const updateExerciseData = async (exerciseId, updatedData) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update exercise data');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchExerciseData(id);
  }, [id]);

  const handleSetCompletion = async (setIndex) => {
    if (!isWorkoutActive) return;
    
    const updatedSets = exercise.sets.map((set, index) => {
      if (index === setIndex) {
        const newCompleted = !set.completed;
        if (newCompleted) {
          setShowTimer(true);
        }
        return { ...set, completed: newCompleted };
      }
      return set;
    });

    await updateExerciseData(id, { sets: updatedSets });
    setExercise({ ...exercise, sets: updatedSets });
  };

  const handleTimerComplete = () => {
    setShowTimer(false);
  };

  const handleWeightChange = async (setIndex, weight) => {
    const updatedSets = exercise.sets.map((set, index) => {
      if (index === setIndex) {
        return { ...set, weight: parseFloat(weight) };
      }
      return set;
    });

    await updateExerciseData(id, { sets: updatedSets });
    setExercise({ ...exercise, sets: updatedSets });
  };

  const handleRepsChange = async (setIndex, reps) => {
    const updatedSets = exercise.sets.map((set, index) => {
      if (index === setIndex) {
        return { ...set, reps: parseInt(reps) };
      }
      return set;
    });

    await updateExerciseData(id, { sets: updatedSets });
    setExercise({ ...exercise, sets: updatedSets });
  };

  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;
  if (!exercise) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">{exercise.name}</h1>
      {showTimer && (
        <RestTimer onComplete={handleTimerComplete} />
      )}
      <div className="space-y-4">
        {exercise.sets.map((set, index) => (
          <div key={index} className="flex items-center space-x-4 bg-white p-4 rounded shadow">
            <span className="w-8">{index + 1}.</span>
            <input
              type="number"
              value={set.weight}
              onChange={(e) => handleWeightChange(index, e.target.value)}
              className="w-20 p-2 border rounded"
              step="0.5"
            />
            <span>Kg</span>
            <input
              type="number"
              value={set.reps}
              onChange={(e) => handleRepsChange(index, e.target.value)}
              className="w-20 p-2 border rounded"
            />
            <span>Reps</span>
            <button
              onClick={() => handleSetCompletion(index)}
              className={`w-8 h-8 rounded-full ${
                set.completed ? 'bg-green-300' : 'bg-gray-300'
              }`}
              disabled={!isWorkoutActive}
            />
          </div>
        ))}
      </div>
      
      {/* Add notification */}
      {notification && (
        <div className={`fixed top-4 right-4 p-4 rounded shadow-lg ${
          notification.isError ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Add history button */}
      <button
        onClick={() => navigate(`/exercise/${id}/history`)}
        className="mt-8 w-full bg-blue-500 text-white p-4 rounded hover:bg-blue-600"
      >
        View History
      </button>
      
    </div>
  );
};

export default Exercise;