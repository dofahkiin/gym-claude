// components/Home.js
import React from 'react';
import { Link } from 'react-router-dom';

const Home = ({ isWorkoutActive, setIsWorkoutActive }) => {
  const workouts = [
    { id: 1, name: 'Day 1: Workout A' },
    { id: 2, name: 'Day 2: Workout B' },
    { id: 3, name: 'Day 3: Workout C' },
  ];

  return (
    <div className="container mx-auto p-4">
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
        onClick={() => setIsWorkoutActive(!isWorkoutActive)}
        className={`mt-8 w-full p-4 rounded text-white ${
          isWorkoutActive ? 'bg-red-500' : 'bg-green-500'
        }`}
      >
        {isWorkoutActive ? 'END WORKOUT' : 'START WORKOUT'}
      </button>
    </div>
  );
};

export default Home;
