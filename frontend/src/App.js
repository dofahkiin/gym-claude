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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check for auth status via cookie
        const response = await fetch('/api/auth/check', {
          credentials: 'include' // Important to include cookies
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setUser(data.user);
            // Also update localStorage for backward compatibility
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            // Fallback to localStorage if cookie auth fails
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              setUser(JSON.parse(storedUser));
            }
          }
        } else {
          // If endpoint fails, try localStorage as fallback
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            setUser(JSON.parse(storedUser));
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Try localStorage as fallback
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear local storage as well
      localStorage.removeItem('user');
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-xl font-semibold">Loading...</div>
      </div>
    );
  }

  return (
    <Router basename="/gym">
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-lg p-4">
          <div className="container mx-auto flex justify-between items-center">
            {user ? (
              <>
                <span className="text-gray-700">{user.email}</span>
                <button
                  onClick={handleLogout}
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
          />
          {/* Change this from a nested route to a separate route */}
          <Route 
            path="/workout/:day/exercise/:id" 
            element={
              user ? <Exercise isWorkoutActive={isWorkoutActive} /> : <Navigate to="/login" />
            } 
          />
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