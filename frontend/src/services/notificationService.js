// frontend/src/services/notificationService.js

// Check if the browser supports notifications
const areNotificationsSupported = () => {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  };
  
  // Request permission for notifications
  const requestNotificationPermission = async () => {
    if (!areNotificationsSupported()) {
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };
  
  // Register service worker
  const registerServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) {
      return null;
    }
    
    try {
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      return registration;
    } catch (error) {
      console.error('Service worker registration failed:', error);
      return null;
    }
  };
  
  // Set a timer in the service worker
  const setBackgroundTimer = async (exerciseId, duration) => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send a message to the service worker to set a timer
      registration.active.postMessage({
        type: 'setTimer',
        exerciseId,
        duration
      });
      
      return true;
    } catch (error) {
      console.error('Error setting background timer:', error);
      return false;
    }
  };
  
  // Clear a timer in the service worker
  const clearBackgroundTimer = async (exerciseId) => {
    if (!('serviceWorker' in navigator)) {
      return false;
    }
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Send a message to the service worker to clear a timer
      registration.active.postMessage({
        type: 'clearTimer',
        exerciseId
      });
      
      return true;
    } catch (error) {
      console.error('Error clearing background timer:', error);
      return false;
    }
  };
  
  // Directly show a notification (when app is in foreground)
  const showNotification = async (title, body) => {
    if (!areNotificationsSupported()) {
      return false;
    }
    
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(title, {
          body,
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          tag: 'rest-timer',
          renotify: true
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  };

  // Subscribe to push notifications
const subscribeToPushNotifications = async () => {
    if (!areNotificationsSupported()) {
      return false;
    }
    
    try {
      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get the VAPID public key from your server
      const response = await fetch('/api/vapid-public-key');
      const data = await response.json();
      
      // Convert the public key to a Uint8Array
      const convertedVapidKey = urlBase64ToUint8Array(data.publicKey);
      
      // Subscribe to push notifications
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey
      });
      
      // Send the subscription to your server
      const user = JSON.parse(localStorage.getItem('user'));
      
      await fetch('/api/push-subscription', {
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
      
      return true;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
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
      return false;
    }
    
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      await fetch('/api/send-timer-notification', {
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
      
      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
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
    subscribeToPushNotifications,
    sendServerPushNotification
  };