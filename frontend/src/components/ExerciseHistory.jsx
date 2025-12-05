// Complete rewrite of ExerciseHistory.js with robust error handling and logging
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Loading, Alert } from './ui';
import { getExerciseFromLocalStorage, removeHistoryEntryFromLocalExercise } from '../utils/offlineWorkoutStorage';

const ExerciseHistory = ({ darkMode }) => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [debugInfo, setDebugInfo] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState(null);
  
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

  const processHistoryEntries = useCallback((entries = []) => {
    return entries
      .map((entry, index) => {
        if (!entry) {
          return null;
        }

        let parsedDate = new Date();
        try {
          parsedDate = entry.date ? new Date(entry.date) : new Date();
        } catch (dateError) {
          console.error('Invalid date in history entry:', dateError);
        }

        const sets = Array.isArray(entry.sets)
          ? entry.sets.map(set => {
              const weight = set && typeof set.weight !== 'undefined' ? set.weight : 0;
              const reps = set && typeof set.reps !== 'undefined' ? set.reps : 0;
              return { weight, reps };
            })
          : [];

        let fallbackId;
        try {
          fallbackId = entry.date ? new Date(entry.date).getTime().toString() : `entry-${index}`;
        } catch (idError) {
          console.error('Failed to generate fallback history id:', idError);
          fallbackId = `entry-${index}`;
        }

        const entryId = entry._id || entry.id || fallbackId;

        return {
          ...entry,
          _id: entryId,
          id: entryId,
          date: parsedDate,
          sets
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateB - dateA;
      });
  }, []);

  useEffect(() => {
    const fetchHistory = async () => {
      let serverData = null;
      let localData = null;
      let errorMessage = null;
      
      try {
        console.log(`Starting history fetch for exercise ID: ${id}`);
        setLoading(true);
        
        // Step 1: Get data from localStorage for exercise info and as fallback
        try {
          const localExercise = getExerciseFromLocalStorage(id);
          if (localExercise) {
            console.log(`Found local exercise: ${localExercise.name}`);
            setExerciseName(localExercise.name);
            
            if (localExercise.history && Array.isArray(localExercise.history)) {
              console.log(`Local history has ${localExercise.history.length} entries`);
              localData = [...localExercise.history]; // Create a copy to avoid reference issues
              
              // Log the first entry to check its format
              if (localExercise.history.length > 0) {
                console.log('Sample local history entry:', JSON.stringify(localExercise.history[0], null, 2));
              }
            } else {
              console.log('No local history found or history is not an array');
            }
          } else {
            console.log('No local exercise data found');
          }
        } catch (localError) {
          console.error('Error accessing local storage:', localError);
        }
        
        // Step 2: If online, try to get data from server
        if (isOnline) {
          try {
            console.log('Attempting to fetch history from server...');
            const user = JSON.parse(localStorage.getItem('user'));
            
            if (!user || !user.token) {
              throw new Error('User not authenticated');
            }
            
            const response = await fetch(`/api/exercises/${id}/history`, {
              headers: {
                'Authorization': `Bearer ${user.token}`,
              },
              credentials: 'include'
            });
            
            console.log('Server response status:', response.status);
            
            if (!response.ok) {
              throw new Error(`Server returned ${response.status}: ${response.statusText}`);
            }
            
            serverData = await response.json();
            console.log(`Server returned ${serverData.length} history entries`);
            
            // Log the first entry to check its format
            if (serverData.length > 0) {
              console.log('Sample server history entry:', JSON.stringify(serverData[0], null, 2));
              
              // If we don't have the exercise name yet, try to get it from history
              if (!exerciseName && serverData[0].exerciseName) {
                setExerciseName(serverData[0].exerciseName);
              }
            }
          } catch (serverError) {
            console.error('Error fetching from server:', serverError);
            errorMessage = `Server error: ${serverError.message}`;
            // We'll fall back to local data below
          }
        }
        
        // Step 3: Decide which data to use and process it
        let historyToUse = [];
        
        if (serverData && serverData.length > 0) {
          console.log('Using server data for history');
          historyToUse = serverData;
          
          // Clear any error since server data loaded successfully
          setError(null);
        } else if (localData && localData.length > 0) {
          console.log('Using local data for history');
          historyToUse = localData;
          
          // If there was a server error but we have local data, show a less alarming message
          if (errorMessage) {
            console.log('Using cached data due to server error:', errorMessage);
            // Don't set error state - this prevents the warning from showing to the user
            // since we have valid data to display
          }
        } else {
          console.log('No history data available');
          
          // Only show error if we have no data at all
          if (errorMessage) {
            setError(errorMessage);
          }
        }
        
        const processedHistory = processHistoryEntries(historyToUse);
        console.log(`Processed ${processedHistory.length} history entries`);
        setHistory(processedHistory);
        
        // Debug info for troubleshooting
        setDebugInfo({
          serverEntries: serverData ? serverData.length : 0,
          localEntries: localData ? localData.length : 0,
          processedEntries: processedHistory.length,
          useServerData: !!serverData && serverData.length > 0,
          isOnline
        });
      } catch (error) {
        console.error('Error in history fetching process:', error);
        setError(`Failed to load exercise history: ${error.message}`);
        setHistory([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id, isOnline, exerciseName, processHistoryEntries]);

  const handleDeleteEntry = async (entry) => {
    if (!entry) return;

    const entryId = entry._id || entry.id;
    if (!entryId) {
      setError('Unable to delete this history entry because it is missing an identifier.');
      return;
    }

    if (!isOnline) {
      setError('Reconnect to the internet to delete history entries.');
      return;
    }

    const confirmDelete = window.confirm('Delete this session permanently? This cannot be undone.');
    if (!confirmDelete) {
      return;
    }

    try {
      setDeletingEntryId(entryId);
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.token) {
        throw new Error('User not authenticated');
      }

      const response = await fetch(`/api/exercises/${id}/history/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to delete history entry');
      }

      const data = await response.json();
      const updatedHistory = processHistoryEntries(data.history || []);
      setHistory(updatedHistory);
      removeHistoryEntryFromLocalExercise(id, entryId);
      setError(null);

      if (updatedHistory.length === 0) {
        setEditMode(false);
      }
    } catch (deleteError) {
      console.error('Error deleting history entry:', deleteError);
      setError(`Failed to delete history entry: ${deleteError.message}`);
    } finally {
      setDeletingEntryId(null);
    }
  };

  // History entry rendering helper
  const renderHistoryEntry = (entry, index) => {
    try {
      // Check if entry exists
      if (!entry) {
        console.error('Null or undefined history entry at index', index);
        return (
          <Card key={`error-${index}`} className="p-3 border-red-300">
            <p className="text-red-500">Invalid history entry: missing data</p>
          </Card>
        );
      }
      
      // Debug log the entry
      console.log(`Rendering history entry ${index}:`, entry);
      
      // Intentionally log in a way that exposes the full structure
      console.log(`Entry date: ${entry.date}`);
      console.log(`Entry sets: ${JSON.stringify(entry.sets)}`);
      const entryId = entry._id || entry.id || index;
      const deleteDisabled = deletingEntryId === entryId || !isOnline || !entryId;
      const deleteLabel = deletingEntryId === entryId ? 'Deleting...' : 'Delete';
      
      // Check if sets array exists and has elements
      const setsArray = entry.sets;
      const hasSets = Array.isArray(setsArray) && setsArray.length > 0;
      
      if (!hasSets) {
        console.warn(`History entry at index ${index} has no sets or sets is not an array:`, entry);
      }
      
      // Format date properly
      let formattedDate = 'Unknown Date';
      try {
        formattedDate = new Date(entry.date).toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      } catch (dateError) {
        console.error('Error formatting date:', dateError);
      }
      
      return (
        <Card 
          key={entryId} 
          className={index === 0 ? 'ring-2 ring-indigo-500 dark:ring-indigo-600' : ''}
        >
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-750 px-6 py-4 border-b dark:border-gray-700">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <h2 className="font-semibold text-gray-800 dark:text-gray-200">
                {formattedDate}
              </h2>
              <div className="flex items-center gap-3">
                {index === 0 && (
                  <span className="bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 text-xs px-2 py-1 rounded-full">
                    Most Recent
                  </span>
                )}
                {editMode && (
                  <button
                    onClick={() => handleDeleteEntry(entry)}
                    disabled={deleteDisabled}
                    className={`text-sm font-medium px-3 py-1 rounded-full border transition-colors ${deleteDisabled ? 'text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed' : 'text-red-600 border-red-300 hover:bg-red-50 dark:text-red-300 dark:border-red-300/60 dark:hover:bg-red-900/20'}`}
                    title={!isOnline ? 'Reconnect to delete history entries' : ''}
                  >
                    {deleteLabel}
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            {!hasSets ? (
              <div className="text-center p-4 text-yellow-600 dark:text-yellow-400">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>No set data available for this entry</p>
                <p className="mt-2 text-xs">Debug: {JSON.stringify(entry)}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {setsArray.map((set, setIndex) => {
                  // Check if this set has valid data
                  if (!set) {
                    console.warn(`Invalid set data at index ${setIndex}:`, set);
                    return (
                      <div key={setIndex} className="flex items-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-yellow-700 dark:text-yellow-300">
                        <div className="set-number flex-shrink-0">{setIndex + 1}</div>
                        <div className="ml-4">Invalid set data</div>
                      </div>
                    );
                  }
                  
                  // Get weight and reps, using defaults if needed
                  const hasWeight = typeof set.weight !== 'undefined';
                  const hasReps = typeof set.reps !== 'undefined';
                  const weight = hasWeight ? set.weight : 0;
                  const reps = hasReps ? set.reps : 0;
                  
                  console.log(`Set ${setIndex}: weight=${weight}, reps=${reps}, hasWeight=${hasWeight}, hasReps=${hasReps}`);
                  
                  return (
                    <div key={setIndex} className="flex items-center space-x-4 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="set-number flex-shrink-0">
                        {setIndex + 1}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Weight</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{weight} kg</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 dark:text-gray-400 text-xs">Reps</span>
                          <span className="font-medium text-gray-800 dark:text-gray-200">{reps}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>
      );
    } catch (renderError) {
      console.error('Error rendering history entry:', renderError);
      return (
        <Card key={`error-${index}`} className="p-3 border-red-300">
          <p className="text-red-500">Error rendering entry: {renderError.message}</p>
          <pre className="mt-2 text-xs overflow-auto max-h-32 bg-gray-50 dark:bg-gray-800 p-2 rounded">
            {JSON.stringify(entry, null, 2)}
          </pre>
        </Card>
      );
    }
  };

  // We'll add a debug panel that only shows in development
  const renderDebugPanel = () => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <Card className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 border border-yellow-300">
        <h3 className="font-bold text-yellow-700 dark:text-yellow-400 mb-2">Debug Info</h3>
        <div className="text-xs font-mono">
          <p>ID: {id}</p>
          <p>Is Online: {isOnline ? 'Yes' : 'No'}</p>
          <p>Exercise Name: {exerciseName || 'Unknown'}</p>
          <p>History Entries: {history.length}</p>
          <p>Server Entries: {debugInfo.serverEntries}</p>
          <p>Local Entries: {debugInfo.localEntries}</p>
          <p>Data Source: {debugInfo.useServerData ? 'Server' : 'Local'}</p>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Loading text="Loading exercise history..." />
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Retrieving your workout data...
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            {exerciseName || 'Exercise'} History
          </h1>
          <p className="text-gray-600 dark:text-gray-300">Track your progress over time</p>
        </div>
        <div className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {history.length > 0 && (
            <Button
              onClick={() => setEditMode(prev => !prev)}
              variant="secondary"
              rounded
              className={`flex items-center justify-center space-x-2 ${editMode ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-200' : 'bg-white/20 text-gray-800 dark:text-gray-200'}`}
            >
              {editMode ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Done</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <span>Edit</span>
                </>
              )}
            </Button>
          )}
          <Button
            onClick={() => navigate(-1)}
            variant="secondary"
            rounded
            className="bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300 flex items-center justify-center space-x-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            <span>Back</span>
          </Button>
        </div>
      </div>
      
      {/* Debug panel (only in development) */}
      {renderDebugPanel()}

      {/* Error message if any */}
      {error && (
        <Alert type="error" className="mb-4">
          {error}
        </Alert>
      )}

      {editMode && (
        <Alert type="warning" className="mb-4">
          Delete mode enabled. Removing a session is permanent and cannot be undone.
        </Alert>
      )}
      
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
          <div className="space-y-4">
            {history.map((entry, index) => renderHistoryEntry(entry, index))}
          </div>
        )}
      </div>
    </div>
  );
};

// History data inspector for debugging
const HistoryDataInspector = ({ history }) => {
  // Only show in development
  if (process.env.NODE_ENV !== 'development') return null;
  
  const [expanded, setExpanded] = useState(false);
  
  if (history.length === 0) return null;
  
  return (
    <div className="mt-8 border border-yellow-300 rounded-lg overflow-hidden">
      <div 
        className="bg-yellow-50 dark:bg-yellow-900/20 p-2 flex justify-between items-center cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="font-bold text-yellow-700 dark:text-yellow-400">
          Debug: History Data Inspector
        </span>
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${expanded ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </div>
      
      {expanded && (
        <div className="bg-white dark:bg-gray-800 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="p-2">Index</th>
                  <th className="p-2">Date</th>
                  <th className="p-2">Sets</th>
                  <th className="p-2">Data Structure</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry, index) => (
                  <tr key={index} className="border-b dark:border-gray-700">
                    <td className="p-2">{index}</td>
                    <td className="p-2">{new Date(entry.date).toLocaleDateString()}</td>
                    <td className="p-2">{Array.isArray(entry.sets) ? entry.sets.length : 'Not an array'}</td>
                    <td className="p-2 font-mono">
                      {Array.isArray(entry.sets) && entry.sets.length > 0 ? (
                        <pre className="whitespace-pre-wrap">
                          {JSON.stringify(entry.sets[0], null, 2)}
                        </pre>
                      ) : (
                        <span className="text-red-500">No sets or invalid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Full Raw Data:</p>
            <pre className="text-xs bg-gray-50 dark:bg-gray-700 p-2 rounded overflow-x-auto max-h-64">
              {JSON.stringify(history, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseHistory;
