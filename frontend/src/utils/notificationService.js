// Helper utility for managing notifications

// Convert base64 string to Uint8Array for VAPID key
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
  
  // Request notification permission
  const requestNotificationPermission = async () => {
    try {
      if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
      }
      
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };
  
  // Register the service worker
  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Update the path to include /gym
        const registration = await navigator.serviceWorker.register('/gym/service-worker.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    console.log('Service Workers are not supported in this browser');
    return null;
  };
  
  // Subscribe to push notifications
  const subscribeToPushNotifications = async (registration) => {
    try {
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        return subscription;
      }
      
      // Get the server's public key
      const response = await fetch('/api/notifications/vapid-public-key');
      const vapidPublicKey = await response.text();
      
      // Create a new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      });
      
      console.log('Push notification subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  };
  
  // Send subscription to server
  const saveSubscription = async (subscription) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('User not authenticated');
        return false;
      }
      
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ subscription }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to save subscription to server');
      }
      
      return true;
    } catch (error) {
      console.error('Error saving subscription:', error);
      return false;
    }
  };
  
  // Initialize notifications
  const initializeNotifications = async () => {
    // Step 1: Request permission
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) return false;
    
    // Step 2: Register service worker
    const registration = await registerServiceWorker();
    if (!registration) return false;
    
    // Step 3: Subscribe to push notifications
    const subscription = await subscribeToPushNotifications(registration);
    if (!subscription) return false;
    
    // Step 4: Save subscription to server
    return await saveSubscription(subscription);
  };
  
  // Send notification when app is in background
  const sendNotification = async (title, body, url) => {
    try {
      const user = JSON.parse(localStorage.getItem('user'));
      
      if (!user || !user.token) {
        console.error('User not authenticated');
        return false;
      }
      
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({ title, body, url }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send notification');
      }
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };
  
  export {
    initializeNotifications,
    sendNotification
  };