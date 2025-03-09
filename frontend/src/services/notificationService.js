// Updated src/services/notificationService.js with better error handling and correct paths

// Check if the browser supports notifications
const areNotificationsSupported = () => {
    const supported = 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
    console.log('Notification support check:', {
      notificationAPI: 'Notification' in window,
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window
    });
    return supported;
  };
  
  // Request permission for notifications
  const requestNotificationPermission = async () => {
    if (!areNotificationsSupported()) {
      console.log('Notifications not supported by browser');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission status:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };
  
  // Register service worker
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported by browser');
      return null;
    }
    
    try {
      // Use the /gym/ path prefix to match the router basename
      const registration = await navigator.serviceWorker.register('/gym/service-worker.js');
      console.log('Service Worker registration successful with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  };
  
  // Set a timer in the service worker
  const setBackgroundTimer = async (exerciseId, duration) => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported by browser');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (!registration || !registration.active) {
        console.error('No active service worker found');
        return false;
      }
      
      // Send a message to the service worker to set a timer
      registration.active.postMessage({
        type: 'setTimer',
        exerciseId,
        duration
      });
      
      console.log(`Background timer set for exercise ${exerciseId}, duration: ${duration}s`);
      return true;
    } catch (error) {
      console.error('Error setting background timer:', error);
      return false;
    }
  };
  
  // Clear a timer in the service worker
  const clearBackgroundTimer = async (exerciseId) => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported by browser');
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (!registration || !registration.active) {
        console.error('No active service worker found');
        return false;
      }
      
      // Send a message to the service worker to clear a timer
      registration.active.postMessage({
        type: 'clearTimer',
        exerciseId
      });
      
      console.log(`Background timer cleared for exercise ${exerciseId}`);
      return true;
    } catch (error) {
      console.error('Error clearing background timer:', error);
      return false;
    }
  };
  
  // Directly show a notification (when app is in foreground)
  const showNotification = async (title, body) => {
    if (!areNotificationsSupported()) {
      console.log('Notifications not supported by browser');
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        if (!registration) {
          console.error('No service worker registration found');
          return false;
        }
        
        await registration.showNotification(title, {
          body,
          icon: '/gym/logo192.png',
          badge: '/gym/logo192.png',
          vibrate: [200, 100, 200],
          tag: 'rest-timer',
          renotify: true
        });
        
        console.log('Notification shown:', { title, body });
        return true;
      }
      
      console.log('Notification permission not granted');
      return false;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };
  
  // Test notifications (new function)
  const testNotification = async () => {
    try {
      const permission = await requestNotificationPermission();
      
      if (!permission) {
        console.log('Notification permission not granted');
        return false;
      }
      
      return await showNotification(
        'Test Notification', 
        'This is a test notification from GymTracker'
      );
    } catch (error) {
      console.error('Error testing notification:', error);
      return false;
    }
  };
  
  // Subscribe to push notifications
  const subscribeToPushNotifications = async () => {
    if (!areNotificationsSupported()) {
      console.log('Push notifications not supported by browser');
      return false;
    }
    
    try {
      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      if (!registration) {
        console.error('No service worker registration found');
        return false;
      }
      
      console.log('Fetching VAPID public key from server...');
      
      // Get the VAPID public key from your server
      const response = await fetch('/api/vapid-public-key');
      
      if (!response.ok) {
        console.error('Failed to fetch VAPID key:', response.status, response.statusText);
        return false;
      }
      
      const data = await response.json();
      
      if (!data || !data.publicKey) {
        console.error('No public key received from server');
        return false;
      }
      
      console.log('VAPID public key retrieved successfully');
      
      // Convert the public key to a Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
      
      // Check if we're already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Already subscribed to push notifications');
        // Re-use the existing subscription
        await sendSubscriptionToServer(existingSubscription);
        return true;
      }
      
      console.log('Subscribing to push notifications...');
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      console.log('Push notification subscription created');
      
      // Send the subscription to the server
      await sendSubscriptionToServer(subscription);
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return false;
    }
  };
  
  // Helper function to send subscription to server
  const sendSubscriptionToServer = async (subscription) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('No user authentication found');
        return false;
      }
      
      console.log('Sending subscription to server...');
      
      const response = await fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to save subscription on server:', response.status, response.statusText);
        return false;
      }
      
      console.log('Subscription saved on server successfully');
      return true;
    } catch (error) {
      console.error('Error saving subscription on server:', error);
      return false;
    }
  };
  
  // Helper function to convert base64 to Uint8Array
  const urlBase64ToUint8Array = (base64String) => {
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
  };
  
  // Send a push notification from the server
  const sendServerPushNotification = async (exerciseId, timeRemaining) => {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported by browser');
      return false;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('No user authentication found');
        return false;
      }
      
      console.log(`Sending push notification request to server for exercise ${exerciseId}...`);
      
      const response = await fetch('/api/send-timer-notification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exerciseId,
          timeRemaining
        }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to send push notification:', response.status, response.statusText);
        return false;
      }
      
      console.log('Push notification request sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  };
  
  // Test push notification via the server
  const testServerPushNotification = async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('No user authentication found');
        return false;
      }
      
      console.log('Sending test push notification request...');
      
      const response = await fetch('/api/test-push-notification', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        console.error('Failed to send test push notification:', response.status, response.statusText);
        const errorData = await response.json();
        console.error('Error details:', errorData);
        return false;
      }
      
      console.log('Test push notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending test push notification:', error);
      return false;
    }
  };
  
  export {
    areNotificationsSupported,
    requestNotificationPermission,
    registerServiceWorker,
    setBackgroundTimer,
    clearBackgroundTimer,
    showNotification,
    testNotification,
    subscribeToPushNotifications,
    sendServerPushNotification,
    testServerPushNotification
  };