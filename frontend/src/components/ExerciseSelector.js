// src/components/ExerciseSelector.js
import React, { useState, useEffect } from 'react';
import { Input, Button } from './ui';

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

const ExerciseSelector = ({ onSelectExercise, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [customExerciseName, setCustomExerciseName] = useState('');
  const [exercises, setExercises] = useState([]);
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddCustom, setShowAddCustom] = useState(false);

  // Initialize with default exercises and fetch custom exercises from API
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        // Start with default exercises
        let exercisesList = [...DEFAULT_EXERCISES];
        
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
            const customExercises = await response.json();
            
            // Merge custom exercises with defaults, removing duplicates
            const customNames = customExercises.map(ex => ex.name);
            exercisesList = [
              ...exercisesList,
              ...customNames.filter(name => !exercisesList.includes(name))
            ];
          }
        } catch (err) {
          console.warn('Could not fetch custom exercises, using defaults only');
        }
        
        // Sort alphabetically
        exercisesList.sort();
        
        setExercises(exercisesList);
        setFilteredExercises(exercisesList);
      } catch (error) {
        console.error('Error initializing exercises:', error);
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

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle exercise selection
  const handleSelectExercise = (exerciseName) => {
    onSelectExercise({ 
      name: exerciseName,
      _id: Date.now().toString() // Temporary ID, will be replaced by backend
    });
  };

  // Handle custom exercise addition
  const handleAddCustomExercise = () => {
    if (!customExerciseName.trim()) return;
    
    // Add to list and select it
    const newExerciseName = customExerciseName.trim();
    
    // Add to exercises list if it doesn't already exist
    if (!exercises.includes(newExerciseName)) {
      const updatedExercises = [...exercises, newExerciseName].sort();
      setExercises(updatedExercises);
      
      // Save custom exercise to backend
      saveCustomExercise(newExerciseName);
    }
    
    // Select the exercise
    handleSelectExercise(newExerciseName);
    
    // Reset form
    setCustomExerciseName('');
    setShowAddCustom(false);
  };

  // Save custom exercise to backend
  const saveCustomExercise = async (exerciseName) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      await fetch('/api/exercises/library', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: exerciseName }),
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error saving custom exercise:', error);
    }
  };

  return (
    <div className="exercise-selector">
      {/* Search Bar */}
      <div className="mb-4">
        <Input
          placeholder="Search exercises..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="mb-2"
        />
        
        {!showAddCustom ? (
          <Button 
            onClick={() => setShowAddCustom(true)} 
            variant="secondary" 
            size="sm"
            className="w-full justify-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
            Add Custom Exercise
          </Button>
        ) : (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Add Custom Exercise</h4>
            <div className="flex space-x-2">
              <Input
                placeholder="Exercise name..."
                value={customExerciseName}
                onChange={(e) => setCustomExerciseName(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={handleAddCustomExercise}
                disabled={!customExerciseName.trim()}
              >
                Add
              </Button>
            </div>
            <button 
              onClick={() => setShowAddCustom(false)}
              className="text-xs text-gray-500 dark:text-gray-400 mt-2 hover:underline"
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Exercise List */}
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-4">
            <svg className="loading-spinner h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            <p>No exercises found</p>
            <p className="text-sm mt-1">Try another search term or add a custom exercise</p>
          </div>
        ) : (
          <div className="grid gap-2">
            {filteredExercises.map((exercise, index) => (
              <button
                key={index}
                onClick={() => handleSelectExercise(exercise)}
                className="text-left px-4 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span className="font-medium text-gray-800 dark:text-gray-200">{exercise}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end">
        <Button onClick={onCancel} variant="secondary" className="mr-2">
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ExerciseSelector;