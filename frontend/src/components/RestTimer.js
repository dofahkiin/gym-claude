// frontend/src/components/RestTimer.js
import React, { useState, useEffect, useCallback } from 'react';

const TOTAL_TIME = 90; // 1 minute and 30 seconds

const RestTimer = ({ onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [audioContext, setAudioContext] = useState(null);

  // Initialize audio context
  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);
    
    return () => {
      if (context) {
        context.close();
      }
    };
  }, []);

  // Function to play beep sound
  const playBeep = useCallback(() => {
    if (audioContext) {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
      
      gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    }
  }, [audioContext]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          playBeep();
          onComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete, playBeep]);

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