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
  
  // Enhance the saveSubscription function
const saveSubscription = async (subscription) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
      console.error('User not authenticated');
      return false;
    }
    
    console.log('Sending subscription to server:', subscription);
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
      const errorData = await response.json();
      console.error('Server error:', errorData);
      throw new Error(`Failed to save subscription: ${errorData.error || response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Server response:', data);
    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
};
  
  // Initialize notifications
// Enhanced initialize function with more detailed logging
const initializeNotifications = async () => {
  console.group('Notification Initialization');
  console.log('Browser:', navigator.userAgent);
  console.log('Support check:', areNotificationsSupported());
  console.log('Current permission:', getNotificationPermissionStatus());
  
  // Step 1: Request permission
  const permissionResult = await requestNotificationPermission();
  console.log('Permission request result:', permissionResult);
  if (!permissionResult.success) {
    console.groupEnd();
    return permissionResult;
  }
  
  // Step 2: Register service worker
  let registration;
  try {
    console.log('Registering service worker...');
    const baseUrl = window.location.pathname.startsWith('/gym') ? '/gym' : '';
registration = await navigator.serviceWorker.register(`${baseUrl}/service-worker.js`, {
  scope: baseUrl || '/'
});
    console.log('Service Worker registered:', registration);
    console.log('Service Worker state:', registration.active ? 'active' : 'inactive');
    
    // Wait for the service worker to be activated if needed
    if (registration.installing) {
      console.log('Service worker is installing, waiting for activation...');
      await new Promise(resolve => {
        registration.installing.addEventListener('statechange', event => {
          if (event.target.state === 'activated') {
            console.log('Service worker activated');
            resolve();
          }
        });
      });
    }
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    console.groupEnd();
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
      console.log('Found existing push subscription');
      await validatePushSubscription(subscription);
    } else {
      console.log('No subscription found, creating new one...');
      try {
        console.log('Fetching VAPID public key...');
        const response = await fetch('/api/notifications/vapid-public-key');
        if (!response.ok) {
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        
        const vapidPublicKey = await response.text();
        console.log('Received VAPID public key from server, first 10 chars:', vapidPublicKey.substring(0, 10) + '...');
        
        const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
        console.log('Converted key length:', convertedKey.length);
        
        // Create a new subscription
        console.log('Creating new push subscription...');
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey
        });
        
        console.log('Push subscription created successfully');
        await validatePushSubscription(subscription);
      } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        console.groupEnd();
        return { 
          success: false, 
          status: 'subscribe_failed',
          message: `Push subscription failed: ${error.message}`
        };
      }
    }
  } catch (error) {
    console.error('Error managing push subscription:', error);
    console.groupEnd();
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
      console.groupEnd();
      return { 
        success: true, 
        status: 'complete',
        message: 'Notifications set up successfully!'
      };
    } else {
      console.error('Failed to save subscription to server');
      console.groupEnd();
      return { 
        success: false, 
        status: 'save_failed',
        message: 'Failed to save subscription to server'
      };
    }
  } catch (error) {
    console.error('Error saving subscription:', error);
    console.groupEnd();
    return { 
      success: false, 
      status: 'save_error',
      message: `Error saving subscription: ${error.message}`
    };
  }
};
  
// Enhance sendNotification function with better debugging
const sendNotification = async (title, body, url) => {
  try {
    console.log('Sending notification:', { title, body, url });
    
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
      console.error('User not authenticated');
      return false;
    }
    
    // Check if notifications are supported and enabled
    if (!areNotificationsSupported()) {
      console.error('Notifications not supported in this browser');
      return false;
    }
    
    if (Notification.permission !== 'granted') {
      console.error('Notification permission not granted');
      return false;
    }
    
    // Verify service worker is registered
    const swRegistration = await navigator.serviceWorker.getRegistration();
    if (!swRegistration) {
      console.error('No service worker registration found');
      return false;
    }
    console.log('Service worker status:', swRegistration.active ? 'active' : 'inactive');
    
    // Verify push subscription exists
    const subscription = await swRegistration.pushManager.getSubscription();
    const isValid = await validatePushSubscription(subscription);
    if (!isValid) {
      console.error('No valid push subscription found');
      return false;
    }
    
    console.log('Making API call to send notification');
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ title, body, url }),
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Server response:', data);
    
    if (!response.ok) {
      console.error('Server returned error:', data);
      return false;
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

// Helper to check if a push subscription is valid and active
const validatePushSubscription = async (subscription) => {
  try {
    if (!subscription) {
      console.error('Subscription is null or undefined');
      return false;
    }
    
    console.log('Validating subscription:', subscription);
    
    // Check if it has the required properties
    if (!subscription.endpoint) {
      console.error('Subscription missing endpoint');
      return false;
    }
    
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error('Subscription missing required encryption keys');
      return false;
    }
    
    // Optionally try to get the subscription state if available
    if (navigator.serviceWorker.controller && subscription.getKey) {
      try {
        const state = await subscription.getState();
        console.log('Subscription state:', state);
      } catch (err) {
        // Not all browsers support getState()
        console.log('getState not supported');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating subscription:', error);
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