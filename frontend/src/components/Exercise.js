// components/Exercise.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const Exercise = ({ isWorkoutActive }) => {
  const { id } = useParams();
  const [exercise, setExercise] = useState(null);

  useEffect(() => {
    // Fetch exercise data from API
    fetchExerciseData(id);
  }, [id]);

  const handleSetCompletion = async (setIndex) => {
    // Update set completion status
    const updatedSets = exercise.sets.map((set, index) => {
      if (index === setIndex) {
        return { ...set, completed: !set.completed };
      }
      return set;
    });

    // Update exercise data
    await updateExerciseData(id, { ...exercise, sets: updatedSets });
    setExercise({ ...exercise, sets: updatedSets });
  };

  const handleWeightChange = async (setIndex, weight) => {
    const updatedSets = exercise.sets.map((set, index) => {
      if (index === setIndex) {
        return { ...set, weight: parseFloat(weight) };
      }
      return set;
    });

    await updateExerciseData(id, { ...exercise, sets: updatedSets });
    setExercise({ ...exercise, sets: updatedSets });
  };

  const handleRepsChange = async (setIndex, reps) => {
    const updatedSets = exercise.sets.map((set, index) => {
      if (index === setIndex) {
        return { ...set, reps: parseInt(reps) };
      }
      return set;
    });

    await updateExerciseData(id, { ...exercise, sets: updatedSets });
    setExercise({ ...exercise, sets: updatedSets });
  };

  if (!exercise) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">{exercise.name}</h1>
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
    </div>
  );
};

export default Exercise;
