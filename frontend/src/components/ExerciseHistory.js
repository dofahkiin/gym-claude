// frontend/src/components/ExerciseHistory.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ExerciseHistory = () => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
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
        
        // If we have history items, set the exercise name from the first one
        if (data.length > 0 && data[0].exerciseName) {
          setExerciseName(data[0].exerciseName);
        }
      } catch (error) {
        console.error('Error fetching history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center">
          <svg className="animate-spin -ml-1 mr-3 h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-lg font-medium text-gray-700">Loading history...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{exerciseName || 'Exercise'} History</h1>
          <p className="text-gray-600">Track your progress over time</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full hover:bg-indigo-200 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          <span>Back</span>
        </button>
      </div>
      
      <div className="space-y-6">
        {history.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-500 mb-2">No history available</p>
            <p className="text-gray-400 text-sm">Complete sets of this exercise to see your progress</p>
          </div>
        ) : (
          history
            .slice()
            .reverse()
            .map((entry, index) => (
            <div 
              key={index} 
              className={`bg-white rounded-lg shadow overflow-hidden ${index === 0 ? 'ring-2 ring-indigo-500' : ''}`}
            >
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b">
                <div className="flex flex-wrap justify-between items-center">
                  <h2 className="font-semibold text-gray-800">
                    {new Date(entry.date).toLocaleDateString(undefined, { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h2>
                  {index === 0 && (
                    <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                      Most Recent
                    </span>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {entry.sets.map((set, setIndex) => (
                    <div key={setIndex} className="flex items-center space-x-4 p-2 rounded hover:bg-gray-50">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-800 font-medium flex-shrink-0">
                        {setIndex + 1}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs">Weight</span>
                          <span className="font-medium">{set.weight} kg</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-gray-500 text-xs">Reps</span>
                          <span className="font-medium">{set.reps}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExerciseHistory;