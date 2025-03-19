// Updated ExerciseHistory.js with offline support
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Alert } from './ui';
import { getExerciseFromLocalStorage } from '../utils/offlineWorkoutStorage';

const ExerciseHistory = ({ darkMode }) => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  const navigate = useNavigate();

  // Track network status
  useEffect(() => {
    const handleOnline = () => {
      console.log('ExerciseHistory is now online');
      setIsOnline(true);
    };
    
    const handleOffline = () => {
      console.log('ExerciseHistory is now offline');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        
        // Try to get from localStorage first for the exercise name
        const localExercise = getExerciseFromLocalStorage(id);
        if (localExercise) {
          setExerciseName(localExercise.name);
        }
        
        if (!isOnline) {
          // Offline mode - check if history is in localStorage
          if (localExercise && localExercise.history) {
            console.log('Using locally stored exercise history (offline mode)');
            setHistory(localExercise.history);
          } else {
            setHistory([]);
            // Don't set an error, just show an empty state
            console.log('No exercise history available offline');
          }
        } else {
          // Online mode - try server first
          try {
            const user = JSON.parse(localStorage.getItem('user'));
            const response = await fetch(`/api/exercises/${id}/history`, {
              headers: {
                'Authorization': `Bearer ${user.token}`,
              },
              credentials: 'include'
            });
            
            if (!response.ok) {
              throw new Error('Failed to fetch history');
            }
            
            const data = await response.json();
            setHistory(data);
            
            // If we have history items and don't have the exercise name yet
            if (data.length > 0 && data[0].exerciseName && !exerciseName) {
              setExerciseName(data[0].exerciseName);
            }
            
            // If we have a local exercise, update its history
            if (localExercise) {
              localExercise.history = data;
              localStorage.setItem(`exercise_${id}`, JSON.stringify(localExercise));
            }
          } catch (serverError) {
            console.error('Server error, falling back to localStorage:', serverError);
            
            // Fall back to localStorage
            if (localExercise && localExercise.history) {
              console.log('Using locally stored exercise history');
              setHistory(localExercise.history);
            } else {
              // If we can't get history from anywhere, show empty state
              setHistory([]);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching history:', error);
        setError('Failed to load exercise history');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, isOnline, exerciseName]);

  if (loading) {
    return <Loading text="Loading history..." />;
  }

  if (error) {
    return <Alert type="error">{error}</Alert>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{exerciseName || 'Exercise'} History</h1>
          <p className="text-gray-600 dark:text-gray-300">Track your progress over time</p>
        </div>
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
      
      {/* Offline Warning - only if we need it */}
      {!isOnline && history.length > 0 && (
        <Alert type="info" className="mb-4">
          You're currently offline. Showing cached exercise history.
        </Alert>
      )}
      
      <div className="space-y-6">
        {history.length === 0 ? (
          <Card className="p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400 mb-2">No history available</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Complete sets of this exercise to see your progress</p>
          </Card>
        ) : (
          history
            .slice()
            .reverse()
            .map((entry, index) => (
            <Card 
              key={index} 
              className={index === 0 ? 'ring-2 ring-indigo-500 dark:ring-indigo-600' : ''}
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 px-6 py-4 border-b dark:border-gray-700">
                <div className="flex flex-wrap justify-between items-center">
                  <h2 className="font-semibold text-gray-800 dark:text-gray-200">
                    {new Date(entry.date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  {index === 0 && (
                    <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                      Most Recent
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {entry.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center space-x-4 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="set-number flex-shrink-0">
                        {setIndex + 1}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Weight</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{set.weight} kg</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Reps</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{set.reps}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ExerciseHistory;