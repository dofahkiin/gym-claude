// frontend/src/components/RestTimer.js
import React, { useState, useEffect } from 'react';

const RestTimer = ({ duration = 90, onComplete }) => {
  const [startTime] = useState(Date.now());
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      const currentTime = Date.now();
      const elapsedTime = (currentTime - startTime) / 1000; // Convert to seconds
      const newProgress = Math.min((elapsedTime / duration) * 100, 100);
      
      if (elapsedTime >= duration) {
        clearInterval(timer);
        setProgress(100);
        onComplete();
      } else {
        setProgress(newProgress);
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(timer);
  }, [duration, startTime, onComplete]);

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5">
      <div 
        className="bg-blue-600 h-2.5 rounded-full transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

export default RestTimer;