// frontend/src/components/ProgramBadge.js
import React from 'react';
import workoutPrograms from '../data/workoutPrograms';

const ProgramBadge = ({ programId }) => {
  if (!programId || !workoutPrograms[programId]) {
    return null;
  }
  
  const program = workoutPrograms[programId];
  
  return (
    <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
        <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
      </svg>
      {program.name} Program
    </div>
  );
};

export default ProgramBadge;