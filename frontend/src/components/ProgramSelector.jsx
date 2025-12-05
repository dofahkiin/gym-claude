// frontend/src/components/ProgramSelector.js
import React, { useState } from 'react';
import { Card, Button, Alert } from './ui';
import workoutPrograms from '../data/workoutPrograms';

const ProgramSelector = ({ onSelectProgram, darkMode }) => {
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState(null);

  const handleSelectProgram = (programId) => {
    setSelectedProgram(programId);
    setShowConfirmation(true);
  };

  const handleCancelSelection = () => {
    setSelectedProgram(null);
    setShowConfirmation(false);
  };

  const handleConfirmSelection = () => {
    if (!selectedProgram) return;
    
    onSelectProgram(selectedProgram);
    setShowConfirmation(false);
  };

  return (
    <div className="program-selector mb-8">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Workout Programs</h2>
      
      {error && (
        <Alert type="error" className="mb-4">{error}</Alert>
      )}
      
      {showConfirmation && (
        <Alert type="warning" className="mb-4">
          <div>
            <p className="font-medium">Are you sure you want to switch to the {workoutPrograms[selectedProgram].name} program?</p>
            <p className="mt-1">This will replace your current workout days with the new program. Your exercise history will be preserved.</p>
            <div className="mt-3 flex space-x-3">
              <Button
                onClick={handleConfirmSelection}
                variant="primary"
                size="sm"
              >
                Confirm
              </Button>
              <Button
                onClick={handleCancelSelection}
                variant="secondary"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Alert>
      )}
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(workoutPrograms).map(([programId, program]) => (
          <Card key={programId} className="cursor-pointer hover:shadow-lg transition-shadow">
            <div className="p-5 flex flex-col h-full">
              <h3 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">{program.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">{program.description}</p>
              <div className="text-xs text-gray-500 dark:text-gray-500 mb-4">
                {program.workouts.length} workouts
              </div>
              <Button
                onClick={() => handleSelectProgram(programId)}
                variant="secondary"
                className="w-full"
              >
                Select Program
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ProgramSelector;