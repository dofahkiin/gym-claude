// Helper utility for managing notifications

// Convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  try {
    // Add padding if needed
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    console.log('Processed base64 length:', base64.length);
    
    // Verify the base64 string is valid
    if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
      console.error('Invalid base64 string:', base64);
      throw new Error('Invalid base64 string');
    }
    
    const rawData = window.atob(base64);
    console.log('Decoded raw data length:', rawData.length);
    
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    return outputArray;
  } catch (error) {
    console.error('Error converting VAPID key:', error);
    throw error;
  }
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
  
  // Step 1: Request permission if needed
  if (Notification.permission !== 'granted') {
    const permissionResult = await requestNotificationPermission();
    console.log('Permission request result:', permissionResult);
    if (!permissionResult.success) {
      console.groupEnd();
      return permissionResult;
    }
  }
  
  // Step 2: Register service worker
  let registration;
  try {
    console.log('Registering service worker...');
    // Use proper scope with trailing slash
    registration = await navigator.serviceWorker.register('/gym/service-worker.js', {
      scope: '/gym/'
    });
    
    console.log('Service Worker registered:', registration);
    
    // Wait for the service worker to be activated
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
  
  // Step 3: Create push subscription
  let subscription;
  try {
    // First check for existing subscription
    subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Found existing push subscription');
      
      // Validate existing subscription
      if (subscription.endpoint && subscription.keys && 
          subscription.keys.p256dh && subscription.keys.auth) {
        console.log('Existing subscription is valid');
      } else {
        console.log('Existing subscription is invalid, unsubscribing...');
        await subscription.unsubscribe();
        subscription = null;
      }
    }
    
    // Create new subscription if needed
    if (!subscription) {
      console.log('Creating new push subscription...');
      
      // Get VAPID public key
      const response = await fetch('/api/notifications/vapid-public-key');
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const vapidPublicKey = await response.text();
      console.log('Received VAPID public key, length:', vapidPublicKey.length);
      
      // Convert key to proper format
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      console.log('Converted key length:', applicationServerKey.length);
      
      // Subscribe
      try {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: applicationServerKey
        });
        
        console.log('Push subscription created successfully');
        
        // Verify the subscription has required fields
        if (!subscription.endpoint || !subscription.keys || 
            !subscription.keys.p256dh || !subscription.keys.auth) {
          throw new Error('Created subscription is missing required fields');
        }
      } catch (subscribeError) {
        console.error('Push subscription creation error:', subscribeError);
        
        // If we already have permission but subscription fails, try a more aggressive approach
        if (Notification.permission === 'granted') {
          console.log('Trying alternative subscription approach...');
          
          // First unsubscribe from any existing subscriptions
          const existingSub = await registration.pushManager.getSubscription();
          if (existingSub) {
            await existingSub.unsubscribe();
          }
          
          // Try subscribing without applicationServerKey first
          try {
            const tempSubscription = await registration.pushManager.subscribe({
              userVisibleOnly: true
            });
            
            // If that works, unsubscribe and try with the key
            await tempSubscription.unsubscribe();
            
            // Now try with the key again
            subscription = await registration.pushManager.subscribe({
              userVisibleOnly: true,
              applicationServerKey: applicationServerKey
            });
            
            console.log('Alternative approach succeeded');
          } catch (altError) {
            console.error('Alternative subscription approach failed:', altError);
            throw altError;
          }
        } else {
          throw subscribeError;
        }
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
    // Log the subscription for debugging
    console.log('Subscription to save:', {
      endpoint: subscription.endpoint,
      keys: subscription.keys ? {
        p256dh: !!subscription.keys.p256dh,
        auth: !!subscription.keys.auth
      } : 'missing'
    });
    
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
    const swRegistration = await navigator.serviceWorker.getRegistration('/gym/service-worker.js');
    if (!swRegistration) {
      console.error('No service worker registration found');
      return false;
    }
    console.log('Service worker status:', swRegistration.active ? 'active' : 'inactive');
    
    // Verify push subscription exists
    const subscription = await swRegistration.pushManager.getSubscription();
    
    // Validate subscription
    if (!subscription) {
      console.error('No push subscription found');
      return false;
    }
    
    if (!subscription.endpoint) {
      console.error('Subscription missing endpoint');
      return false;
    }
    
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.error('Subscription missing required encryption keys');
      return false;
    }
    
    console.log('Valid subscription found, sending notification to server');
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${user.token}`
      },
      body: JSON.stringify({ title, body, url }),
      credentials: 'include'
    });
    
    const responseData = await response.json();
    console.log('Server response:', responseData);
    
    if (!response.ok) {
      console.error('Server returned error:', responseData);
      return false;
    }
    
    return responseData.success || false;
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