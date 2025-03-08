// Updated RestTimer.js with CSS classes
import React, { useState, useEffect } from 'react';

const RestTimer = ({ duration = 90, onComplete, startTime, darkMode }) => {
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);

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
};

export default RestTimer;