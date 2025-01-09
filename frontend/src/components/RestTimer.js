// frontend/src/components/RestTimer.js
import React, { useState, useEffect } from 'react';

const RestTimer = ({ duration = 90, onComplete }) => {
  const [startTime] = useState(Date.now());
  const [progress, setProgress] = useState(100); // Start at 100%
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
      const remaining = Math.max(duration - elapsedTime, 0);
      const newProgress = Math.max(100 - (elapsedTime / duration) * 100, 0); // Reverse progress
      
      setTimeLeft(remaining);
      setProgress(newProgress);

      if (elapsedTime >= duration) {
        clearInterval(timer);
        setProgress(0); // Fully empty at end
        setTimeLeft(0);
        onComplete();
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(timer);
  }, [duration, startTime, onComplete]);

  // Format time as M:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="relative w-full">
      <div className="w-full bg-gray-200 rounded-full h-8">
        <div 
          className="bg-blue-600 h-8 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center text-sm font-bold text-white">
          {formatTime(timeLeft)}
        </div>
      </div>
    </div>
  );
};

export default RestTimer;