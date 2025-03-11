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
  
// Request notification permission with better error handling and logging
const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return { 
        success: false, 
        status: 'unsupported',
        message: 'This browser does not support notifications'
      };
    }
    
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    console.log('Permission result:', permission);
    
    return { 
      success: permission === 'granted',
      status: permission,
      message: permission === 'granted' 
        ? 'Notification permission granted!' 
        : `Permission ${permission}. ${permission === 'denied' ? 'Please enable notifications in your browser settings.' : 'Please allow notifications when prompted.'}`
    };
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return { 
      success: false, 
      status: 'error',
      message: `Error: ${error.message}`
    };
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
// Updated initialize function with better logging
const initializeNotifications = async () => {
  console.log('Initializing notifications...');
  console.log('Support check:', areNotificationsSupported());
  console.log('Current permission:', getNotificationPermissionStatus());
  
  // Step 1: Request permission
  const permissionResult = await requestNotificationPermission();
  console.log('Permission request result:', permissionResult);
  if (!permissionResult.success) return permissionResult;
  
  // Step 2: Register service worker
  let registration;
  try {
    console.log('Registering service worker...');
    registration = await navigator.serviceWorker.register('/gym/service-worker.js');
    console.log('Service Worker registered:', registration);
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    return { 
      success: false, 
      status: 'sw_failed',
      message: `Service worker registration failed: ${error.message}`
    };
  }
  
  // Step 3: Subscribe to push notifications
  let subscription;
  try {
    console.log('Checking for existing push subscription...');
    subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Found existing push subscription:', subscription);
    } else {
      console.log('No subscription found, creating new one...');
      try {
        // Get the server's public key
        const response = await fetch('/api/notifications/vapid-public-key');
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const vapidPublicKey = await response.text();
        console.log('Received VAPID public key from server');
        
        // Create a new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        });
        
        console.log('Push notification subscription created:', subscription);
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return { 
          success: false, 
          status: 'subscribe_failed',
          message: `Push subscription failed: ${error.message}`
        };
      }
    }
  } catch (error) {
    console.error('Error managing push subscription:', error);
    return { 
      success: false, 
      status: 'subscription_error',
      message: `Subscription error: ${error.message}`
    };
  }
  
  // Step 4: Save subscription to server
  try {
    console.log('Saving subscription to server...');
    const success = await saveSubscription(subscription);
    if (success) {
      console.log('Subscription saved successfully');
      return { 
        success: true, 
        status: 'complete',
        message: 'Notifications set up successfully!'
      };
    } else {
      console.error('Failed to save subscription to server');
      return { 
        success: false, 
        status: 'save_failed',
        message: 'Failed to save subscription to server'
      };
    }
  } catch (error) {
    console.error('Error saving subscription:', error);
    return { 
      success: false, 
      status: 'save_error',
      message: `Error saving subscription: ${error.message}`
    };
  }
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

// Check if notifications are supported
const areNotificationsSupported = () => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};  

// Get current notification permission status
const getNotificationPermissionStatus = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission; // 'default', 'granted', or 'denied'
};

// Create a test notification (local, not a push notification)
const showLocalNotification = (title, options = {}) => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  if (Notification.permission !== 'granted') {
    console.log('Notification permission not granted');
    return false;
  }
  
  try {
    // Basic notification options
    const notificationOptions = {
      body: options.body || 'This is a test notification',
      icon: options.icon || '/gym/logo192.png',
      ...options
    };
    
    // Show a notification directly (without push)
    const notification = new Notification(title, notificationOptions);
    
    // Handle notification click
    notification.onclick = () => {
      console.log('Notification clicked');
      window.focus();
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};
  
export {
  initializeNotifications,
  sendNotification,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  areNotificationsSupported,
  showLocalNotification
};