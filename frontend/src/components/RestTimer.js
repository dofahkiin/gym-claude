// Updated RestTimer.js
import React, { useState, useEffect } from 'react';
import { Button } from './ui';

const RestTimer = ({ duration = 90, onComplete, startTime, darkMode, onDurationChange, editMode = false }) => {
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [customDuration, setCustomDuration] = useState(duration);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // This updates the timer display when duration prop changes
    setTimeLeft(Math.max(duration - ((Date.now() - startTime) / 1000), 0));
  }, [duration, startTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000;
      const remaining = Math.max(duration - elapsedTime, 0);
      const newProgress = Math.max(100 - (elapsedTime / duration) * 100, 0);
      
      setTimeLeft(remaining);
      setProgress(newProgress);

      if (elapsedTime >= duration) {
        clearInterval(timer);
        setProgress(0);
        setTimeLeft(0);
        onComplete();
      }
    }, 100);

    return () => clearInterval(timer);
  }, [duration, startTime, onComplete]);

  // Format time as M:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get color based on time remaining
  const getTimerColorClass = () => {
    const percentRemaining = (timeLeft / duration) * 100;
    if (percentRemaining > 66) return 'timer-green';
    if (percentRemaining > 33) return 'timer-yellow';
    return 'timer-red';
  };

  // Handle duration change
  const handleDurationChange = (newDuration) => {
    // Only allow values between 10 seconds and 10 minutes
    newDuration = Math.max(10, Math.min(600, newDuration));
    
    if (onDurationChange) {
      onDurationChange(newDuration);
    }
    
    setCustomDuration(newDuration);
    setIsEditing(false);
  };

  // Use the running timer if active, otherwise show the duration editor
  if (startTime && !isEditing) {
    return (
      <div className="relative w-full">
        <div className="timer-bar">
          <div 
            className={getTimerColorClass()}
            style={{ width: `${progress}%` }}
          />
          <div className="absolute top-0 left-0 right-0 h-10 flex items-center justify-center text-base font-bold text-white drop-shadow-md">
            {formatTime(timeLeft)}
          </div>
        </div>
        <p className="text-center mt-2 text-gray-600 dark:text-gray-300 text-sm">Rest between sets</p>
      </div>
    );
  }

  // Show the duration editor when no timer is active or when editing
  if (editMode || isEditing) {
    return (
      <div className="rest-timer-editor">
        <div className="mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rest Duration (seconds)
          </label>
          <div className="flex items-center">
            <input
              type="number" 
              value={customDuration}
              onChange={(e) => setCustomDuration(parseInt(e.target.value) || 10)}
              className="form-input w-20 text-center"
              min="10"
              max="600"
            />
            <span className="ml-2 text-gray-600 dark:text-gray-300">seconds</span>
            
            <div className="ml-auto space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleDurationChange(customDuration)}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
        <div className="flex space-x-2 justify-center">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDurationChange(30)}
            className={customDuration === 30 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' : ''}
          >
            30s
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDurationChange(60)}
            className={customDuration === 60 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' : ''}
          >
            1min
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDurationChange(90)}
            className={customDuration === 90 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' : ''}
          >
            1:30
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDurationChange(120)}
            className={customDuration === 120 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' : ''}
          >
            2min
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleDurationChange(180)}
            className={customDuration === 180 ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-300' : ''}
          >
            3min
          </Button>
        </div>
      </div>
    );
  }

  // Simple display when no timer is active and not editing
  return (
    <div className="flex items-center justify-between">
      <p className="text-gray-600 dark:text-gray-300">Rest between sets: <span className="font-medium">{formatTime(duration)}</span></p>
      {!startTime && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Change
        </Button>
      )}
    </div>
  );
};

export default RestTimer;