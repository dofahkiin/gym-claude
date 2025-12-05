// components/NotificationHelper.js
import React, { useState, useEffect } from 'react';
import { Button, Alert } from './ui'; // Only using Button and Alert which were in the original
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus,
  areNotificationsSupported,
  showLocalNotification,
  initializeNotifications,
  sendNotification
} from '../utils/notificationService';

const NotificationHelper = () => {
  const [permissionStatus, setPermissionStatus] = useState('checking');
  const [isExpanded, setIsExpanded] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState([]);
  
  useEffect(() => {
    setPermissionStatus(getNotificationPermissionStatus());
  }, []);
  
  const addResult = (title, success, details = null) => {
    setTestResults(prev => [
      { 
        id: Date.now(), 
        title, 
        success, 
        details,
        time: new Date().toLocaleTimeString()
      },
      ...prev
    ]);
  };
  
  const handleRequestPermission = async () => {
    setLoading(true);
    setMessage('');
    
    const result = await requestNotificationPermission();
    setPermissionStatus(result.status);
    setMessage(result.message);
    addResult('Permission Request', result.success, result);
    
    if (result.success) {
      // If permission was granted, initialize the rest of the notification system
      const initResult = await initializeNotifications();
      setMessage(initResult.message);
      addResult('Notification Setup', initResult.success, initResult);
    }
    
    setLoading(false);
  };
  
  const handleTestLocalNotification = () => {
    const success = showLocalNotification('Test Local Notification', {
      body: 'This is a direct browser notification (not a push notification)',
      requireInteraction: true
    });
    
    addResult('Local Notification', success);
    
    if (!success) {
      setMessage('Could not show local notification. Make sure notifications are enabled in your browser settings.');
    } else {
      setMessage('Local notification sent! If you don\'t see it, check your system notification settings.');
    }
  };
  
  const handleTestPushNotification = async () => {
    setLoading(true);
    const success = await sendNotification(
      'Test Push Notification', 
      'This is a server push notification test',
      window.location.href
    );
    
    addResult('Push Notification', success);
    
    if (success) {
      setMessage('Push notification sent! Check your notifications.');
    } else {
      setMessage('Failed to send push notification. Check console for details.');
    }
    setLoading(false);
  };
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSupported = areNotificationsSupported();
  
  return (
    <div className="notification-helper mb-6 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-600 dark:text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          Notification Settings
        </h3>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
      
      {isExpanded && (
        <div className="mt-4">
          <div className="mb-3">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Status:</div>
            <div className="flex items-center">
              <span className={`inline-block w-3 h-3 rounded-full mr-2 ${
                permissionStatus === 'granted' 
                  ? 'bg-green-500' 
                  : permissionStatus === 'denied' 
                    ? 'bg-red-500' 
                    : 'bg-yellow-500'
              }`}></span>
              <span className="font-medium">
                {permissionStatus === 'granted' 
                  ? 'Allowed' 
                  : permissionStatus === 'denied' 
                    ? 'Blocked'
                    : permissionStatus === 'unsupported'
                      ? 'Unsupported'
                      : 'Not set'}
              </span>
            </div>
          </div>
          
          {!isSupported && (
            <Alert type="warning" className="mb-3">
              Your browser doesn't fully support web push notifications.
              {isIOS && ' On iOS, add this site to your home screen for the best notification experience.'}
            </Alert>
          )}
          
          {message && (
            <Alert 
              type={
                message.includes('success') || permissionStatus === 'granted' 
                  ? 'success' 
                  : permissionStatus === 'denied' 
                    ? 'error' 
                    : 'info'
              } 
              className="mb-3"
            >
              {message}
            </Alert>
          )}
          
          <div className="flex flex-wrap gap-2 mb-4">
            <Button
              onClick={handleRequestPermission}
              variant="primary"
              disabled={loading || permissionStatus === 'denied'}
              loading={loading}
            >
              {permissionStatus === 'granted' 
                ? 'Notifications Enabled' 
                : permissionStatus === 'denied' 
                  ? 'Notifications Blocked' 
                  : 'Enable Notifications'}
            </Button>
            
            {permissionStatus === 'granted' && (
              <>
                <Button
                  onClick={handleTestLocalNotification}
                  variant="secondary"
                  disabled={loading}
                >
                  Test Local Notification
                </Button>
                
                <Button
                  onClick={handleTestPushNotification}
                  variant="secondary"
                  disabled={loading}
                >
                  Test Push Notification
                </Button>
              </>
            )}
          </div>
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-2">Test Results:</h4>
              <div className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-sm">
                {testResults.map(result => (
                  <div key={result.id} className="p-2 border-b last:border-b-0 border-gray-200 dark:border-gray-600 flex items-center">
                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="flex-1">{result.title}: {result.success ? 'Success' : 'Failed'}</span>
                    <span className="text-gray-500 text-xs">{result.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {permissionStatus === 'denied' && (
            <div className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              You've blocked notifications for this site. To enable them, you'll need to change your browser settings.
              <ul className="list-disc ml-5 mt-2">
                <li>In Chrome: Click the lock icon in the address bar → Site settings → Allow notifications</li>
                <li>In Safari: Preferences → Websites → Notifications → Find this site and allow</li>
                <li>In Firefox: Click the lock icon → Connection secure → More Information → Permissions → Notifications → Allow</li>
              </ul>
            </div>
          )}
          
          {isIOS && (
            <div className="mt-3 border-t pt-3 border-gray-200 dark:border-gray-700">
              <strong className="text-sm">iOS Instructions:</strong>
              <ol className="list-decimal ml-5 mt-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Tap the share button at the bottom of your screen</li>
                <li>Scroll down and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right corner</li>
                <li>Open the app from your home screen</li>
                <li>Then enable notifications when prompted</li>
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationHelper;