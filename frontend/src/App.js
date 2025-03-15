// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Home from './components/Home';
import WorkoutDay from './components/WorkoutDay';
import Exercise from './components/Exercise';
import ThemeToggle from './components/ThemeToggle';
import { Link } from 'react-router-dom';
import ExerciseHistory from './components/ExerciseHistory'; 
import { initializeNotifications } from './utils/notificationService';
import SettingsPage from './components/SettingsPage';

const App = () => {
  const [user, setUser] = useState(null);
  const [isWorkoutActive, setIsWorkoutActive] = useState(() => {
    // Initialize from localStorage or default to false
    const savedWorkoutState = localStorage.getItem('isWorkoutActive');
    return savedWorkoutState === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    // Initialize dark mode preference from localStorage
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      setDarkMode(true);
    }

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

            // Add this: Initialize notifications after authentication
            initializeNotifications().then(success => {
            if (success) {
              console.log('Push notifications initialized successfully');
            }
          });
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
      <div className="app-container flex items-center justify-center">
        <div className="text-xl font-semibold text-gray-700 dark:text-gray-200">
          <svg className="loading-spinner -ml-1 mr-3 h-8 w-8 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <Router basename="/gym">
      <div className="app-container">
        <header className="main-header">
          <div className="container mx-auto px-4 py-4">
            <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
                <Link to="/" className="flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
                    <path d="M5 8h1a4 4 0 0 1 0 8H5"></path>
                    <path d="M2 8h2v8H2z"></path>
                    <path d="M20 8h2v8h-2z"></path>
                    <path d="M7 12h10"></path>
                  </svg>
                  <span className="text-xl font-bold tracking-tight">GymTracker</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                {/* Replace ThemeToggle with Settings button */}
                <Link
                  to="/settings"
                  className="text-white p-1 rounded-full hover:bg-white/10 transition-colors"
                  aria-label="Settings"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </Link>
                {user ? (
                  <>
                    <span className="font-medium hidden md:inline">{user.email}</span>
                    <button
                      onClick={handleLogout}
                      className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-full text-sm transition-all duration-200 border border-white border-opacity-20"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <div className="space-x-4">
                    <Link to="/login" className="text-white hover:text-indigo-100 transition-colors">Login</Link>
                    <Link to="/signup" className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded-full text-sm transition-all duration-200 border border-white border-opacity-20">Sign Up</Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="main-content">
          <Routes>
            <Route path="/login" element={<Login setUser={setUser} darkMode={darkMode} />} />
            <Route path="/signup" element={<SignUp setUser={setUser} darkMode={darkMode} />} />
            <Route 
              path="/" 
              element={
                user ? (
                  <Home 
                    isWorkoutActive={isWorkoutActive} 
                    setIsWorkoutActive={setIsWorkoutActive}
                    darkMode={darkMode}
                  />
                ) : (
                  <Navigate to="/login" />
                )
              } 
            />
            <Route 
              path="/workout/:day" 
              element={
                user ? <WorkoutDay darkMode={darkMode} /> : <Navigate to="/login" />
              }
            />
            <Route 
              path="/workout/:day/exercise/:id" 
              element={
                user ? <Exercise isWorkoutActive={isWorkoutActive} darkMode={darkMode} /> : <Navigate to="/login" />
              } 
            />
            <Route 
              path="/exercise/:id/history" 
              element={
                user ? <ExerciseHistory darkMode={darkMode} /> : <Navigate to="/login" />
              }
            />
            {/* Add Settings route */}
            <Route
              path="/settings"
              element={
                user ? <SettingsPage darkMode={darkMode} setDarkMode={setDarkMode} /> : <Navigate to="/login" />
              }
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;