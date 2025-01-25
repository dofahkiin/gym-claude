// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Home from './components/Home';
import WorkoutDay from './components/WorkoutDay';
import Exercise from './components/Exercise';
import { Link } from 'react-router-dom';
import ExerciseHistory from './components/ExerciseHistory'; 

const App = () => {
  const [user, setUser] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <Router basename="/gym">
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg p-4">
          <div className="container mx-auto flex justify-between items-center">
            {user ? (
              <>
                <span className="text-gray-700">{user.email}</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('user');
                    setUser(null);
                  }}
                  className="bg-red-500 text-white px-4 py-2 rounded"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="space-x-4">
                <Link to="/login" className="text-blue-500">Login</Link>
                <Link to="/signup" className="text-blue-500">Sign Up</Link>
              </div>
            )}
          </div>
        </nav>

        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<SignUp setUser={setUser} />} />
          <Route 
            path="/" 
            element={
              user ? (
                <Home 
                  isWorkoutActive={isWorkoutActive} 
                  setIsWorkoutActive={setIsWorkoutActive}
                />
              ) : (
                <Navigate to="/login" />
              )
            } 
          />
          <Route 
            path="/workout/:day" 
            element={
              user ? <WorkoutDay /> : <Navigate to="/login" />
            }
          >
            <Route 
              path="exercise/:id" 
              element={
                <Exercise isWorkoutActive={isWorkoutActive} />
              } 
            />
          </Route>
          <Route 
            path="/exercise/:id/history" 
            element={
              user ? <ExerciseHistory /> : <Navigate to="/login" />
            }
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
