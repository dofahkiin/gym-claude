// frontend/src/components/SettingsPage.js
import React, { useState, useEffect } from 'react';
import { Card, Button } from './ui';
import ThemeToggle from './ThemeToggle';
import NotificationHelper from './NotificationHelper';
import ProgramSelector from './ProgramSelector';
import workoutPrograms from '../data/workoutPrograms';
import { useNavigate } from 'react-router-dom';

const SettingsPage = ({ darkMode, setDarkMode }) => {
  const [activeProgram, setActiveProgram] = useState(null);
  const [showProgramSelector, setShowProgramSelector] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch the user's active program
  useEffect(() => {
    fetchActiveProgram();
  }, []);
  
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
      }
    } catch (error) {
      console.error('Error fetching active program:', error);
    }
  };

  // Toggle program selector visibility
  const toggleProgramSelector = () => {
    setShowProgramSelector(!showProgramSelector);
  };

  // Handle program selection
  const handleSelectProgram = async (programId) => {
    try {
      setActionLoading(true);
      
      // Get the selected program data
      const program = workoutPrograms[programId];
      if (!program) {
        throw new Error('Invalid program selected');
      }
      
      const user = JSON.parse(localStorage.getItem('user'));
      
      // Use the API endpoint to apply the program while preserving history
      const response = await fetch('/api/workouts/apply-program', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          program,
          programId 
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to apply program');
      }
      
      // Update active program
      setActiveProgram(programId);
      
      setShowProgramSelector(false);
    } catch (error) {
      console.error('Error applying program:', error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Settings</h1>
        <Button
          onClick={() => navigate(-1)}
          variant="secondary"
          rounded
          className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 flex items-center space-x-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back</span>
        </Button>
      </div>
      
      {/* Theme Toggle */}
      <Card className="mb-6">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Theme Settings</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-700 dark:text-gray-300">Dark Mode</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Toggle between light and dark theme</p>
            </div>
            <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
          </div>
        </div>
      </Card>
      
      {/* Notification Settings */}
      <Card className="mb-6">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Notifications</h2>
        </div>
        <div className="p-6">
          <NotificationHelper />
        </div>
      </Card>
      
      {/* Active Program */}
      <Card className="mb-6">
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Workout Program</h2>
        </div>
        <div className="p-6">
          {activeProgram && workoutPrograms[activeProgram] ? (
            <div>
              <div className="flex items-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                <h3 className="font-bold text-gray-800 dark:text-gray-100">
                  Active Program: <span className="text-indigo-600 dark:text-indigo-400">{workoutPrograms[activeProgram].name}</span>
                </h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-sm ml-7 mb-4">
                {workoutPrograms[activeProgram].description}
              </p>
              <Button
                onClick={toggleProgramSelector}
                variant="secondary"
                className="flex items-center space-x-1"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                <span>Change Program</span>
              </Button>
            </div>
          ) : (
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">No active program selected. Choose a workout program to get started.</p>
              <Button
                onClick={toggleProgramSelector}
                variant="secondary"
                className="flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
                </svg>
                <span>Choose Workout Program</span>
              </Button>
            </div>
          )}
        </div>
      </Card>
      
      {/* Program Selector */}
      {showProgramSelector && (
        <ProgramSelector 
          onSelectProgram={handleSelectProgram} 
          darkMode={darkMode}
        />
      )}
    </div>
  );
};

export default SettingsPage;