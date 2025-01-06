// frontend/src/components/ExerciseHistory.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ExerciseHistory = () => {
  const { id } = useParams();
  const [history, setHistory] = useState([]);
  const [exerciseName, setExerciseName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user'));
        const response = await fetch(`/api/exercises/${id}/history`, {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch history');
        }
        
        const data = await response.json();
        setHistory(data);
      } catch (error) {
        console.error('Error fetching history:', error);
      }
    };

    fetchHistory();
  }, [id]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-bold">{exerciseName} History</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Back
        </button>
      </div>
      
      <div className="space-y-6">
        {history.map((entry, index) => (
          <div key={index} className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-3">
              Date: {new Date(entry.date).toLocaleDateString()}
            </h2>
            <div className="space-y-2">
              {entry.sets.map((set, setIndex) => (
                <div key={setIndex} className="flex items-center space-x-4">
                  <span className="w-8">{setIndex + 1}.</span>
                  <span>{set.weight} Kg</span>
                  <span>{set.reps} Reps</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        
        {history.length === 0 && (
          <p className="text-gray-500 text-center">No history available</p>
        )}
      </div>
    </div>
  );
};

export default ExerciseHistory;