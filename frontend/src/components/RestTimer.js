// frontend/src/components/RestTimer.js
import React, { useState, useEffect } from 'react';

const TOTAL_TIME = 90; // 3 seconds (for testing)

const RestTimer = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  
  // Create beep sound function
  const playBeep = () => {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // frequency in hertz
    
    // Configure gain (volume)
    gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Play sound
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    // Cleanup
    setTimeout(() => {
      audioContext.close();
    }, 1000);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          playBeep(); // Play beep when timer ends
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = (timeLeft / TOTAL_TIME) * 100;

  return (
    <div className="w-full max-w-md mx-auto p-4">
      <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-1000"
          style={{ width: `${progress}%` }}
        />
        <div className="absolute w-full h-full flex items-center justify-center text-white font-bold">
          {`${minutes}:${seconds.toString().padStart(2, '0')}`}
        </div>
      </div>
    </div>
  );
};

export default RestTimer;