// Updated ThemeToggle.js with status bar color update
import React, { useEffect } from 'react';
import { Button } from './ui';

const ThemeToggle = ({ darkMode, setDarkMode }) => {
  // Apply the dark mode class to the html element when dark mode changes
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      // Update theme-color meta tag for dark mode
      const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#312e81'); // indigo-900
      }
    } else {
      document.documentElement.classList.remove('dark');
      // Update theme-color meta tag for light mode
      const metaThemeColor = document.querySelector('meta[name="theme-color"]:not([media])');
      if (metaThemeColor) {
        metaThemeColor.setAttribute('content', '#4f46e5'); // indigo-600
      }
    }
    // Save preference to localStorage
    localStorage.setItem('darkMode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="relative p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
      aria-pressed={darkMode}
      aria-label="Toggle dark mode"
    >
      {darkMode ? (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-yellow-300" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      ) : (
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-6 w-6 text-gray-500" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      )}
    </button>
  );
};

export default ThemeToggle;