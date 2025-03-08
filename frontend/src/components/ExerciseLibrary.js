// src/components/ExerciseLibrary.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Input, Alert } from './ui';

// Default list of exercises
const DEFAULT_EXERCISES = [
  'Barbell Curl',
  'Barbell Row',
  'Behind The Neck Press',
  'Bench Dips',
  'Bench Press',
  'Bulgarian Split Squat',
  'Chinups',
  'Deadlift',
  'Dips',
  'Dumbbell Bench Press',
  'Dumbbell Alternating Incline Curl',
  'Dumbbell Fly',
  'Dumbbell Lunge',
  'Dumbbell Overhead Press',
  'Dumbbell Preacher Curl',
  'Dumbbell Pullover',
  'Dumbbell Push Press',
  'Dumbbell Reverse Lunge',
  'Dumbbell Romanian Deadlift',
  'Dumbbell Row',
  'Dumbbell Shrug',
  'Dumbbell Split Squat',
  'Dumbbell Stepup',
  'Dumbbell Triceps Extension',
  'Ez-bar Curl',
  'Face Pull',
  'Floor Press',
  'Front Raise',
  'Front Squat',
  'Glute Bridge',
  'Hammer Curl',
  'Hanging Knee Raise',
  'Hanging Leg Raise',
  'High Bar Squat',
  'Hip Thrust',
  'Hyperextension',
  'Incline Bench Press',
  'Incline Dumbbell Bench',
  'Lat Pulldown',
  'Leg Curl',
  'Leg Extension',
  'Leg Press',
  'Lever Row',
  'Lunges',
  'Overhead Press',
  'Overhead Press Seated',
  'Planks',
  'Pullups',
  'Push Press',
  'Pushups',
  'Rear Delt Raise',
  'Reverse Lunges',
  'Roman Chair Situp',
  'Romanian Deadlift',
  'Russian Twist',
  'Seated Calf Raise',
  'Seated Lever Row',
  'Side Lunges',
  'Side Raise',
  'Situp',
  'Skullcrushers',
  'Split Squat',
  'Standing Calf Raise',
  'Stepup',
  'Triceps Extension',
  'Triceps Pushdown',
  'Upright Row',
  'Wrist Curl'
];

const ExerciseLibrary = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [customExercises, setCustomExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  const navigate = useNavigate();

  // Fetch exercises
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        
        // Start with default exercises
        const defaultList = [...DEFAULT_EXERCISES];
        
        // Try to fetch custom exercises from backend
        try {
          const user = JSON.parse(localStorage.getItem('user'));
          const response = await fetch('/api/exercises/library', {
            headers: {
              'Authorization': `Bearer ${user.token}`,
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            setCustomExercises(data);
            
            // Extract names for the combined list
            const customNames = data.map(ex => ex.name);
            
            // Combine lists, removing duplicates
            const combinedExercises = [
              ...defaultList,
              ...customNames.filter(name => !defaultList.includes(name))
            ].sort();
            
            setExercises(combinedExercises);
            setFilteredExercises(combinedExercises);
          } else {
            setExercises(defaultList);
            setFilteredExercises(defaultList);
          }
        } catch (err) {
          console.warn('Could not fetch custom exercises, using defaults only');
          setExercises(defaultList);
          setFilteredExercises(defaultList);
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
        showNotification('Failed to load exercises', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  // Filter exercises based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExercises(exercises);
      return;
    }
    
    const lowercasedSearch = searchTerm.toLowerCase();
    const filtered = exercises.filter(exercise => 
      exercise.toLowerCase().includes(lowercasedSearch)
    );
    
    setFilteredExercises(filtered);
  }, [searchTerm, exercises]);

  // Add custom exercise
  const handleAddCustomExercise = async () => {
    if (!customExerciseName.trim()) {
      showNotification('Please enter a exercise name', 'error');
      return;
    }
    
    // Check if already exists
    if (exercises.includes(customExerciseName.trim())) {
      showNotification('This exercise already exists', 'error');
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch('/api/exercises/library', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: customExerciseName.trim() }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to add custom exercise');
      }
      
      const newExercise = await response.json();
      
      // Update custom exercises list
      setCustomExercises([...customExercises, newExercise]);
      
      // Update combined exercises list
      const updatedExercises = [...exercises, customExerciseName.trim()].sort();
      setExercises(updatedExercises);
      setFilteredExercises(updatedExercises);
      
      setCustomExerciseName('');
      showNotification('Exercise added successfully');
    } catch (error) {
      console.error('Error adding custom exercise:', error);
      showNotification(`Failed to add exercise: ${error.message}`, 'error');
    }
  };

  // Delete custom exercise
  const handleDeleteExercise = async (exerciseName) => {
    // Only custom exercises can be deleted
    const exerciseToDelete = customExercises.find(ex => ex.name === exerciseName);
    
    if (!exerciseToDelete) {
      showNotification('Cannot delete default exercises', 'error');
      return;
    }
    
    if (!window.confirm(`Are you sure you want to delete "${exerciseName}"?`)) {
      return;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      const response = await fetch(`/api/exercises/library/${exerciseToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete exercise');
      }
      
      // Update custom exercises list
      setCustomExercises(customExercises.filter(ex => ex._id !== exerciseToDelete._id));
      
      // Update combined exercises list
      const updatedExercises = exercises.filter(name => name !== exerciseName);
      setExercises(updatedExercises);
      setFilteredExercises(updatedExercises);
      
      showNotification('Exercise deleted successfully');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      showNotification(`Failed to delete exercise: ${error.message}`, 'error');
    }
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    
    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  // Check if exercise is custom
  const isCustomExercise = (exerciseName) => {
    return customExercises.some(ex => ex.name === exerciseName);
  };

  return (
    <div className="exercise-library">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Exercise Library</h1>
          <p className="text-gray-600 dark:text-gray-300">Browse and manage exercises</p>
        </div>
        <Button
          onClick={() => navigate('/')}
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

      {/* Add Custom Exercise */}
      <Card className="mb-6">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Add Custom Exercise</h3>
          <div className="flex space-x-2">
            <Input
              className="flex-1"
              value={customExerciseName}
              onChange={(e) => setCustomExerciseName(e.target.value)}
              placeholder="Enter exercise name"
            />
            <Button
              onClick={handleAddCustomExercise}
              disabled={!customExerciseName.trim()}
            >
              Add
            </Button>
          </div>
        </div>
      </Card>

      {/* Search */}
      <Card className="mb-6">
        <div className="p-6">
          <Input
            placeholder="Search exercises..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </Card>

      {/* Exercises List */}
      <div className="space-y-4 mb-16">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
          Exercises ({filteredExercises.length})
        </h2>
        
        {loading ? (
          <Card className="p-8 text-center">
            <div className="flex justify-center">
              <svg className="loading-spinner h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading exercises...</p>
          </Card>
        ) : filteredExercises.length === 0 ? (
          <Card className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No exercises found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Try different search terms</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {filteredExercises.map((exerciseName, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow duration-200">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-100">{exerciseName}</h3>
                      {isCustomExercise(exerciseName) ? (
                        <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 rounded-full">
                          Custom
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full">
                          Default
                        </span>
                      )}
                    </div>
                    {isCustomExercise(exerciseName) && (
                      <Button
                        onClick={() => handleDeleteExercise(exerciseName)}
                        variant="danger"
                        size="sm"
                        className="flex items-center"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Notification Toast */}
      {notification && (
        <div className={`notification ${notification.type === 'error' ? 'notification-error' : 'notification-success'}`}>
          <div className="flex items-center">
            {notification.type === 'error' ? (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
            )}
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="ml-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg hover:bg-white/10 focus:outline-none"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseLibrary;