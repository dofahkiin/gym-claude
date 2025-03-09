// RestTimer.js with added notification test button
import React, { useState, useEffect } from 'react';
import { Button, Alert } from './ui';
import { 
  areNotificationsSupported, 
  requestNotificationPermission,
  registerServiceWorker,
  setBackgroundTimer,
  clearBackgroundTimer,
  showNotification,
  subscribeToPushNotifications,
  sendServerPushNotification,
  testNotification,
  testServerPushNotification
} from '../services/notificationService';

const RestTimer = ({ duration = 90, onComplete, startTime, darkMode, onDurationChange, editMode = false, exerciseId = null }) => {
  const [progress, setProgress] = useState(100);
  const [timeLeft, setTimeLeft] = useState(duration);
  const [customDuration, setCustomDuration] = useState(duration);
  const [isEditing, setIsEditing] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [notificationPermissionRequested, setNotificationPermissionRequested] = useState(false);
  const [serviceWorkerRegistered, setServiceWorkerRegistered] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [notificationTestResult, setNotificationTestResult] = useState(null);

  // Initialize service worker and check notification permission
  useEffect(() => {
    const initializeNotifications = async () => {
      if (areNotificationsSupported()) {
        // Register service worker
        const registration = await registerServiceWorker();
        if (registration) {
          setServiceWorkerRegistered(true);
          console.log("Service worker registered successfully");
        } else {
          console.error("Failed to register service worker");
        }
        
        // Check if permission is already granted
        if (Notification.permission === 'granted') {
          setNotificationsEnabled(true);
          setNotificationPermissionRequested(true);
          console.log("Notification permission is already granted");
        } else {
          console.log("Notification permission is not granted:", Notification.permission);
        }
      } else {
        console.log("Notifications are not supported in this browser");
      }
    };
    
    initializeNotifications();
  }, []);

  // Handle background timer when startTime changes or component unmounts
  useEffect(() => {
    if (startTime && exerciseId && notificationsEnabled && serviceWorkerRegistered) {
      // Calculate remaining time
      const remainingTime = Math.max(duration - ((Date.now() - startTime) / 1000), 0);
      
      console.log(`Setting background timer for exercise ${exerciseId}, remainingTime: ${remainingTime}s`);
      
      // Set a background timer
      setBackgroundTimer(exerciseId, remainingTime);
      
      // Also set up server-side push notification as a backup
      sendServerPushNotification(exerciseId, remainingTime);
      
      // Clean up when component unmounts or startTime changes
      return () => {
        console.log(`Clearing background timer for exercise ${exerciseId}`);
        clearBackgroundTimer(exerciseId);
      };
    }
  }, [startTime, exerciseId, duration, notificationsEnabled, serviceWorkerRegistered]);

  // Update timer display
  useEffect(() => {
    // This updates the timer display when duration prop changes
    setTimeLeft(startTime ? Math.max(duration - ((Date.now() - startTime) / 1000), 0) : duration);
  }, [duration, startTime]);

  // Handle foreground timer
  useEffect(() => {
    if (!startTime) return;
    
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
        
        // If the app is in the foreground and notifications are enabled, show a notification
        if (document.visibilityState === 'visible' && notificationsEnabled) {
          showNotification('Rest Timer Completed', 'Time to start your next set!');
        }
        
        if (onComplete) {
          onComplete();
        }
      }
    }, 100);

    return () => clearInterval(timer);
  }, [duration, startTime, onComplete, notificationsEnabled]);

  // Request notification permission and subscribe to push
  const handleRequestPermission = async () => {
    try {
      const granted = await requestNotificationPermission();
      
      if (granted) {
        // Subscribe to push notifications
        const subscribed = await subscribeToPushNotifications();
        setNotificationsEnabled(subscribed);
        
        if (subscribed) {
          console.log("Successfully subscribed to push notifications");
        } else {
          console.error("Failed to subscribe to push notifications");
        }
      } else {
        console.log("Notification permission was denied");
      }
      
      setNotificationPermissionRequested(true);
    } catch (error) {
      console.error("Error requesting permission:", error);
    }
  };

  // Handle notification test
  const handleTestNotification = async () => {
    setTestingNotification(true);
    setNotificationTestResult(null);
    
    try {
      const testResult = await testNotification();
      setNotificationTestResult({
        success: testResult,
        message: testResult 
          ? "Notification test successful! You should see a notification."
          : "Notification test failed. Check console for errors."
      });
    } catch (error) {
      console.error("Error testing notification:", error);
      setNotificationTestResult({
        success: false,
        message: "Error testing notification: " + error.message
      });
    } finally {
      setTimeout(() => {
        setTestingNotification(false);
      }, 2000);
    }
  };

  // Handle server push notification test
  const handleTestServerPush = async () => {
    setTestingNotification(true);
    setNotificationTestResult(null);
    
    try {
      const testResult = await testServerPushNotification();
      setNotificationTestResult({
        success: testResult,
        message: testResult 
          ? "Server push notification test sent successfully!"
          : "Server push test failed. Check console for errors."
      });
    } catch (error) {
      console.error("Error testing server push:", error);
      setNotificationTestResult({
        success: false,
        message: "Error testing server push: " + error.message
      });
    } finally {
      setTimeout(() => {
        setTestingNotification(false);
      }, 2000);
    }
  };

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

  // Notification permission button
  const renderNotificationPermissionButton = () => {
    if (!areNotificationsSupported()) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400 italic">
          Notifications are not supported in this browser.
        </div>
      );
    }

    if (notificationsEnabled) {
      return (
        <div className="mt-2 text-center">
          <div className="inline-flex items-center px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Notifications enabled
          </div>
          
          <div className="mt-2 flex space-x-2 justify-center">
            <Button
              onClick={handleTestNotification}
              variant="secondary"
              size="sm"
              disabled={testingNotification}
            >
              Test Local Notification
            </Button>
            <Button
              onClick={handleTestServerPush}
              variant="secondary"
              size="sm"
              disabled={testingNotification}
            >
              Test Server Push
            </Button>
          </div>
          
          {notificationTestResult && (
            <div className={`mt-2 text-sm ${notificationTestResult.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {notificationTestResult.message}
            </div>
          )}
        </div>
      );
    }

    if (!notificationPermissionRequested) {
      return (
        <div className="mt-2 text-center">
          <Button
            onClick={handleRequestPermission}
            variant="secondary"
            size="sm"
            className="inline-flex items-center space-x-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
            </svg>
            <span>Enable background notifications</span>
          </Button>
        </div>
      );
    }

    return (
      <div className="mt-2 text-center">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          Notification permission denied. Please enable notifications in your browser settings.
        </div>
      </div>
    );
  };

  // Display notification support information
  const renderNotificationDetails = () => {
    // Only show in edit mode for debugging purposes
    if (!editMode) return null;
    
    return (
      <div className="mt-4 p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800/60">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notification Status:</h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• API Supported: {areNotificationsSupported() ? 'Yes' : 'No'}</li>
          <li>• Permission: {Notification.permission}</li>
          <li>• Service Worker: {serviceWorkerRegistered ? 'Registered' : 'Not Registered'}</li>
          <li>• Notifications Enabled: {notificationsEnabled ? 'Yes' : 'No'}</li>
        </ul>
      </div>
    );
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
        {renderNotificationPermissionButton()}
        {renderNotificationDetails()}
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
        {renderNotificationPermissionButton()}
        {renderNotificationDetails()}
      </div>
    );
  }

  // Simple display when no timer is active and not editing
  return (
    <div>
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
      {renderNotificationPermissionButton()}
      {renderNotificationDetails()}
    </div>
  );
};

export default RestTimer;