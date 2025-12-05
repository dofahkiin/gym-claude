// components/NotificationTester.js
import React, { useState, useEffect } from 'react';
import { Button, Alert, Card } from './ui';
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus,
  areNotificationsSupported,
  showLocalNotification,
  sendNotification,
  initializeNotifications
} from '../utils/notificationService';

const NotificationTester = () => {
  const [testResults, setTestResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [serviceWorkerInfo, setServiceWorkerInfo] = useState(null);
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  
  useEffect(() => {
    checkServiceWorker();
  }, []);
  
  const checkServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      setServiceWorkerInfo({ supported: false });
      return;
    }
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length === 0) {
        setServiceWorkerInfo({ 
          supported: true, 
          registered: false,
          message: 'No service workers registered'
        });
        return;
      }
      
      // Find our service worker
      const gymServiceWorker = registrations.find(r => 
        r.scope.includes('/gym') || 
        r.active?.scriptURL.includes('service-worker.js')
      );
      
      if (!gymServiceWorker) {
        setServiceWorkerInfo({
          supported: true,
          registered: false,
          message: 'GymTracker service worker not found',
          otherWorkers: registrations.length
        });
        return;
      }
      
      setServiceWorkerInfo({
        supported: true,
        registered: true,
        active: !!gymServiceWorker.active,
        state: gymServiceWorker.active?.state || 'unknown',
        scope: gymServiceWorker.scope,
        scriptURL: gymServiceWorker.active?.scriptURL
      });
      
      // Check subscription
      if (gymServiceWorker.pushManager) {
        const subscription = await gymServiceWorker.pushManager.getSubscription();
        if (subscription) {
          setSubscriptionInfo({
            exists: true,
            endpoint: subscription.endpoint.substring(0, 50) + '...',
            expirationTime: subscription.expirationTime,
            hasP256dh: !!subscription.keys?.p256dh,
            hasAuth: !!subscription.keys?.auth
          });
        } else {
          setSubscriptionInfo({
            exists: false,
            message: 'No push subscription found'
          });
        }
      }
    } catch (error) {
      setServiceWorkerInfo({
        supported: true,
        error: error.message
      });
    }
  };
  
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
  
  const handleTestPermission = async () => {
    setStatus('testing');
    const result = await requestNotificationPermission();
    addResult('Permission Test', result.success, {
      status: result.status,
      message: result.message
    });
    setStatus('idle');
    await checkServiceWorker();
  };
  
  const handleTestServiceWorker = async () => {
    setStatus('testing');
    try {
      const registration = await navigator.serviceWorker.register('/gym/service-worker.js');
      addResult('Service Worker Registration', true, {
        state: registration.active ? 'active' : (registration.installing ? 'installing' : 'waiting'),
        scope: registration.scope
      });
    } catch (error) {
      addResult('Service Worker Registration', false, {
        error: error.message
      });
    }
    setStatus('idle');
    await checkServiceWorker();
  };
  
  const handleTestSubscription = async () => {
    setStatus('testing');
    try {
      const registration = await navigator.serviceWorker.getRegistration('/gym/service-worker.js');
      
      if (!registration) {
        addResult('Push Subscription', false, {
          error: 'Service worker not registered'
        });
        setStatus('idle');
        return;
      }
      
      // Get VAPID key
      const response = await fetch('/api/notifications/vapid-public-key');
      if (!response.ok) {
        addResult('Push Subscription', false, {
          error: `Failed to get VAPID key: ${response.status} ${response.statusText}`
        });
        setStatus('idle');
        return;
      }
      
      const vapidPublicKey = await response.text();
      addResult('VAPID Key Fetch', true, {
        keyPreview: vapidPublicKey.substring(0, 20) + '...'
      });
      
      // Convert key
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      
      // Unsubscribe from any existing subscriptions
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        await existingSubscription.unsubscribe();
        addResult('Unsubscribe Existing', true);
      }
      
      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      addResult('Create Subscription', true, {
        endpoint: subscription.endpoint.substring(0, 30) + '...',
        hasKeys: !!subscription.keys
      });
      
      // Save subscription to server
      const user = JSON.parse(localStorage.getItem('user'));
      const saveResponse = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ subscription }),
        credentials: 'include'
      });
      
      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();
        addResult('Save Subscription', false, {
          status: saveResponse.status,
          error: errorData.error || saveResponse.statusText
        });
      } else {
        const data = await saveResponse.json();
        addResult('Save Subscription', true, {
          message: data.message
        });
      }
    } catch (error) {
      addResult('Push Subscription Process', false, {
        error: error.message
      });
    }
    
    setStatus('idle');
    await checkServiceWorker();
  };
  
  const handleTestLocalNotification = () => {
    setStatus('testing');
    const success = showLocalNotification('Local Test', {
      body: 'This is a direct browser notification',
      requireInteraction: true
    });
    
    addResult('Local Notification', success, {
      message: success ? 'Notification shown' : 'Failed to show notification'
    });
    setStatus('idle');
  };
  
  const handleTestPushNotification = async () => {
    setStatus('testing');
    const success = await sendNotification(
      'Push Test', 
      'This is a server push notification test', 
      window.location.href
    );
    
    addResult('Push Notification', success, {
      message: success ? 'Push notification sent' : 'Failed to send push notification'
    });
    setStatus('idle');
  };
  
  const handleFullReset = async () => {
    if (!confirm('This will completely reset notifications. Continue?')) return;
    
    setStatus('resetting');
    setTestResults([]);
    
    try {
      // Unregister all service workers
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      
      addResult('Service Workers Unregistered', true, {
        count: registrations.length
      });
      
      // Clear caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        addResult('Caches Cleared', true, {
          count: cacheNames.length
        });
      }
      
      // Re-initialize
      const result = await initializeNotifications();
      addResult('Re-initialization', result.success, {
        status: result.status,
        message: result.message
      });
    } catch (error) {
      addResult('Reset Process', false, {
        error: error.message
      });
    }
    
    setStatus('idle');
    await checkServiceWorker();
  };
  
  // Helper function for URL Base64 to Uint8Array conversion
  function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  return (
    <div className="notification-tester">
      <Card className="mb-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Notification System Diagnostics</h2>
          
          {/* Status Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 border rounded-lg dark:border-gray-700">
              <h3 className="font-medium mb-2">Browser Support</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Notifications API:</span>
                  <span className={`font-medium ${('Notification' in window) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {('Notification' in window) ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Service Workers:</span>
                  <span className={`font-medium ${('serviceWorker' in navigator) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {('serviceWorker' in navigator) ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Push API:</span>
                  <span className={`font-medium ${('PushManager' in window) ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {('PushManager' in window) ? 'Supported' : 'Not Supported'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Permission:</span>
                  <span className={`font-medium ${
                    Notification.permission === 'granted' 
                      ? 'text-green-600 dark:text-green-400' 
                      : Notification.permission === 'denied'
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                  }`}>
                    {Notification.permission}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border rounded-lg dark:border-gray-700">
              <h3 className="font-medium mb-2">Service Worker Status</h3>
              {serviceWorkerInfo ? (
                <div className="space-y-1 text-sm">
                  {!serviceWorkerInfo.supported ? (
                    <div className="text-red-600 dark:text-red-400">Service Workers not supported</div>
                  ) : serviceWorkerInfo.error ? (
                    <div className="text-red-600 dark:text-red-400">Error: {serviceWorkerInfo.error}</div>
                  ) : !serviceWorkerInfo.registered ? (
                    <div className="text-yellow-600 dark:text-yellow-400">{serviceWorkerInfo.message}</div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`font-medium ${serviceWorkerInfo.active ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400'}`}>
                          {serviceWorkerInfo.active ? `Active (${serviceWorkerInfo.state})` : 'Not Active'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Scope:</span>
                        <span className="font-medium truncate ml-2" style={{maxWidth: "180px"}}>
                          {serviceWorkerInfo.scope}
                        </span>
                      </div>
                      {subscriptionInfo && (
                        <div className="flex justify-between">
                          <span>Push Subscription:</span>
                          <span className={`font-medium ${subscriptionInfo.exists ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {subscriptionInfo.exists ? 'Active' : 'None'}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : (
                <div className="text-gray-500 dark:text-gray-400">Checking status...</div>
              )}
            </div>
          </div>
          
          {/* Test Actions */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            <Button 
              onClick={handleTestPermission} 
              disabled={status === 'testing' || status === 'resetting'}
              variant="secondary" 
              size="sm"
            >
              Test Permission
            </Button>
            <Button 
              onClick={handleTestServiceWorker} 
              disabled={status === 'testing' || status === 'resetting'}
              variant="secondary" 
              size="sm"
            >
              Register SW
            </Button>
            <Button 
              onClick={handleTestSubscription} 
              disabled={status === 'testing' || status === 'resetting' || !serviceWorkerInfo?.registered}
              variant="secondary" 
              size="sm"
            >
              Create Subscription
            </Button>
            <Button 
              onClick={handleTestLocalNotification} 
              disabled={status === 'testing' || status === 'resetting' || Notification.permission !== 'granted'}
              variant="secondary" 
              size="sm"
            >
              Test Local Notification
            </Button>
            <Button 
              onClick={handleTestPushNotification} 
              disabled={status === 'testing' || status === 'resetting' || !subscriptionInfo?.exists}
              variant="secondary" 
              size="sm"
            >
              Test Push Notification
            </Button>
            <Button 
              onClick={handleFullReset} 
              disabled={status === 'testing' || status === 'resetting'}
              variant="danger" 
              size="sm"
            >
              Full Reset
            </Button>
          </div>
          
          {/* Test Results */}
          <div>
            <h3 className="font-medium mb-2">Diagnostic Results</h3>
            <div className="border rounded-lg overflow-hidden dark:border-gray-700">
              {testResults.length === 0 ? (
                <div className="p-4 text-gray-500 dark:text-gray-400 text-center">
                  No tests run yet
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto">
                  {testResults.map(result => (
                    <div key={result.id} className="p-3 border-b last:border-b-0 dark:border-gray-700 text-sm">
                      <div className="flex justify-between items-start">
                        <div className="flex items-start">
                          <span className={`inline-block w-2 h-2 mt-1 mr-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <div>
                            <div className="font-medium">{result.title}</div>
                            {result.details && (
                              <div className="text-xs mt-1 text-gray-600 dark:text-gray-400">
                                {Object.entries(result.details).map(([key, value]) => (
                                  <div key={key}>
                                    <span className="font-medium">{key}:</span> {typeof value === 'object' ? JSON.stringify(value) : value}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">{result.time}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {status === 'testing' && (
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              <svg className="animate-spin h-5 w-5 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Running test...
            </div>
          )}
          
          {status === 'resetting' && (
            <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
              <svg className="animate-spin h-5 w-5 mr-2 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Resetting notification system...
            </div>
          )}
        </div>
      </Card>
      
      <div className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <p className="mb-2"><strong>Troubleshooting Tips:</strong></p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Make sure VAPID keys are consistent across server restarts by setting them in environment variables</li>
          <li>Check that the service worker is registered with the correct path</li>
          <li>iOS Safari has limited support for web push - use "Add to Home Screen" for best results</li>
          <li>Some browsers may block notifications from insecure origins (non-HTTPS)</li>
          <li>Chrome sometimes needs the page to be refreshed after granting notification permission</li>
        </ul>
      </div>
    </div>
  );
};

export default NotificationTester;