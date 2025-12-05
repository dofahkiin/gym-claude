// frontend/src/components/WorkoutDayProgramInfo.js
import React, { useState, useEffect } from 'react';
import workoutPrograms from '../data/workoutPrograms';

const WorkoutDayProgramInfo = ({ day }) => {
  const [activeProgram, setActiveProgram] = useState(null);
  const [workoutInfo, setWorkoutInfo] = useState(null);

  useEffect(() => {
    // Fetch the active program
    const fetchActiveProgram = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch('/api/user/active-program', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          setActiveProgram(data.activeProgram);
          
          // If we have an active program, find the workout for this day
          if (data.activeProgram && workoutPrograms[data.activeProgram]) {
            const program = workoutPrograms[data.activeProgram];
            const workout = program.workouts.find(w => w.day === parseInt(day));
            if (workout) {
              setWorkoutInfo({
                programName: program.name,
                workoutName: workout.name
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching active program:', error);
      }
    };

    fetchActiveProgram();
  }, [day]);

  if (!workoutInfo) {
    return null;
  }

  return (
    <div className="workout-program-info mb-3">
      <div className="flex items-center text-sm text-indigo-600 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
        </svg>
        {workoutInfo.programName} Program: {workoutInfo.workoutName}
      </div>
    </div>
  );
};

export default WorkoutDayProgramInfo;