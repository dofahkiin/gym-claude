// frontend/src/components/RestTimer.js
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
  const getColorClass = () => {
    const percentRemaining = (timeLeft / duration) * 100;
    if (percentRemaining > 66) return 'bg-green-500 dark:bg-green-600';
    if (percentRemaining > 33) return 'bg-yellow-500 dark:bg-yellow-600';
    return 'bg-red-500 dark:bg-red-600';
  };

  return (
    <div className="relative w-full">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-10 shadow-inner overflow-hidden">
        <div 
          className={`${getColorClass()} h-10 rounded-full transition-all duration-100`}
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