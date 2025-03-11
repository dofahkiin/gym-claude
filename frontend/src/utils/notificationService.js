// utils/notificationService.js - Modified to handle subscription issues

// Convert base64 string to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  try {
    if (!base64String || base64String.length < 10) {
      console.error('Invalid VAPID key received:', base64String);
      throw new Error('Invalid VAPID key - too short or empty');
    }
    
    console.log('Processing VAPID key:', base64String.substring(0, 10) + '...');
    
    // Add padding if needed
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    // Check that the string is valid base64
    if (!/^[A-Za-z0-9+/=]+$/.test(base64)) {
      throw new Error('Invalid characters in VAPID key');
    }
    
    // Decode the base64 string
    let rawData;
    try {
      rawData = window.atob(base64);
    } catch (e) {
      console.error('Error decoding base64:', e);
      throw new Error('Failed to decode VAPID key');
    }
    
    // Convert to Uint8Array
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    
    console.log('Successfully converted VAPID key, length:', outputArray.length);
    return outputArray;
  } catch (error) {
    console.error('Error processing VAPID key:', error);
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
      const registration = await navigator.serviceWorker.register('/gym/service-worker.js', {
        scope: '/gym/'
      });
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

// Subscribe to push notifications with improved error handling
const subscribeToPushNotifications = async (registration) => {
  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      console.log('Using existing push subscription');
      return subscription;
    }
    
    // Get the server's public key
    const response = await fetch('/api/notifications/vapid-public-key');
    const serverVapidKey = await response.text();
    
    console.log('Received VAPID key from server:', serverVapidKey.substring(0, 10) + '...');
    
    // Create a new subscription
    try {
      const applicationServerKey = urlBase64ToUint8Array(serverVapidKey);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });
      
      console.log('Subscription created successfully:', subscription);
      return subscription;
    } catch (subscribeError) {
      console.error('First subscription attempt failed:', subscribeError);
      
      // Try with a different approach (some browsers need different handling)
      try {
        // Try with just userVisibleOnly (might use gcm_sender_id from manifest)
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true
        });
        console.log('Fallback subscription created successfully');
        return subscription;
      } catch (fallbackError) {
        console.error('Fallback subscription failed:', fallbackError);
        throw new Error('All subscription attempts failed');
      }
    }
  } catch (error) {
    console.error('Error creating push subscription:', error);
    return null;
  }
};

// Send subscription to server with more flexible validation
const saveSubscription = async (subscription) => {
  try {
    const user = JSON.parse(localStorage.getItem('user'));
    
    if (!user || !user.token) {
      console.error('User not authenticated');
      return false;
    }
    
    if (!subscription || !subscription.endpoint) {
      console.error('Invalid subscription - missing endpoint');
      return false;
    }
    
    // Log subscription details for debugging
    console.log('Subscription to save:', {
      endpoint: subscription.endpoint.substring(0, 50) + '...',
      keys: subscription.keys ? 'present' : 'missing'
    });
    
    // Proceed even if keys might be missing - the server will handle it
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

// Initialize notifications with improved error handling and logging
const initializeNotifications = async () => {
  console.group('Notification Initialization');
  console.log('Browser:', navigator.userAgent);
  console.log('Support check:', areNotificationsSupported());
  console.log('Current permission:', getNotificationPermissionStatus());
  
  try {
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
    console.log('Registering service worker...');
    let registration;
    
    // Check for existing registration first
    registration = await navigator.serviceWorker.getRegistration('/gym/');
    
    if (!registration) {
      // Register new service worker if none exists
      try {
        registration = await navigator.serviceWorker.register('/gym/service-worker.js', {
          scope: '/gym/'
        });
        
        console.log('Service Worker registered:', registration);
        
        // Wait for the service worker to be ready
        if (registration.installing) {
          console.log('Service worker is installing, waiting for activation...');
          
          await new Promise((resolve) => {
            registration.installing.addEventListener('statechange', (e) => {
              if (e.target.state === 'activated') {
                console.log('Service worker activated');
                resolve();
              }
            });
            
            // Set a timeout in case activation takes too long
            setTimeout(resolve, 5000);
          });
        }
      } catch (swError) {
        console.error('Service Worker registration failed:', swError);
        
        // Try to get any existing registration as fallback
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          console.log('Using existing service worker registration as fallback');
          registration = registrations[0];
        } else {
          console.groupEnd();
          return {
            success: false,
            status: 'sw_failed',
            message: `Service worker registration failed: ${swError.message}`
          };
        }
      }
    } else {
      console.log('Using existing service worker registration');
    }
    
    // Step 3: Create push subscription
    console.log('Creating push subscription...');
    const subscription = await subscribeToPushNotifications(registration);
    
    if (!subscription) {
      console.groupEnd();
      return {
        success: false,
        status: 'subscription_failed',
        message: 'Failed to create push subscription'
      };
    }
    
    // Modified: More forgiving validation - proceed even with partial subscription
    // We do require at least an endpoint though
    if (!subscription.endpoint) {
      console.error('Subscription missing endpoint');
      console.groupEnd();
      return {
        success: false,
        status: 'invalid_subscription',
        message: 'Push subscription is missing required endpoint'
      };
    }
    
    // Log what we got
    console.log('Subscription details:', {
      endpoint: subscription.endpoint.substring(0, 30) + '...',
      hasKeys: !!subscription.keys,
      hasP256dh: subscription.keys && !!subscription.keys.p256dh,
      hasAuth: subscription.keys && !!subscription.keys.auth
    });
    
    // Modified: Warning but continue if keys are missing - some browsers might handle this differently
    if (!subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
      console.warn('Subscription missing some encryption keys, but continuing anyway');
    }
    
    // Step 4: Save subscription to server
    console.log('Saving subscription to server...');
    const saveResult = await saveSubscription(subscription);
    
    if (saveResult) {
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
    console.error('Notification initialization error:', error);
    console.groupEnd();
    return {
      success: false,
      status: 'error',
      message: `Notification setup error: ${error.message}`
    };
  }
};

// Send notification with improved error handling
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
      // Fall back to showing a local notification if possible
      if ('Notification' in window && Notification.permission === 'granted') {
        return showLocalNotification(title, { body, url });
      }
      return false;
    }
    
    if (Notification.permission !== 'granted') {
      console.error('Notification permission not granted');
      return false;
    }
    
    // Verify service worker is registered - be more flexible with the scope
    let swRegistration = await navigator.serviceWorker.getRegistration('/gym/');
    
    // If not found with that scope, try getting any registration
    if (!swRegistration) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        swRegistration = registrations[0];
        console.log('Using alternative service worker registration:', swRegistration.scope);
      } else {
        console.error('No service worker registrations found');
        return false;
      }
    }
    
    console.log('Service worker status:', swRegistration.active ? 'active' : 'inactive');
    
    // Verify push subscription exists
    const subscription = await swRegistration.pushManager.getSubscription();
    
    if (!subscription || !subscription.endpoint) {
      console.error('No valid push subscription found');
      // Fall back to showing a local notification
      return showLocalNotification(title, { body, url });
    }
    
    console.log('Sending push notification to server');
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
      // Fall back to local notification if server push fails
      return showLocalNotification(title, { body, url });
    }
    
    return responseData.success || false;
  } catch (error) {
    console.error('Error sending notification:', error);
    // Fall back to local notification in case of error
    try {
      return showLocalNotification(title, { body, url });
    } catch (localError) {
      console.error('Local notification fallback also failed:', localError);
      return false;
    }
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

// Create a local notification (not a push notification)
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
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };
    
    return true;
  } catch (error) {
    console.error('Error showing notification:', error);
    return false;
  }
};

// Debug utility
const debugNotificationSystem = async () => {
  console.group('Notification System Diagnostics');
  
  // Check basic support
  console.log('Notification API supported:', 'Notification' in window);
  console.log('Service Worker API supported:', 'serviceWorker' in navigator);
  console.log('Push API supported:', 'PushManager' in window);
  console.log('Current permission:', Notification.permission);
  
  // Check service worker
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log('Service worker registrations:', registrations.length);
    
    registrations.forEach((reg, i) => {
      console.log(`Registration ${i + 1}:`, {
        scope: reg.scope,
        active: !!reg.active,
        installing: !!reg.installing,
        waiting: !!reg.waiting
      });
      
      if (reg.active) {
        console.log(`Registration ${i + 1} state:`, reg.active.state);
      }
    });
    
    // Check for our specific service worker
    const gymSW = registrations.find(r => r.scope.includes('/gym/'));
    if (gymSW) {
      console.log('GymTracker service worker found:', gymSW.scope);
      
      try {
        const subscription = await gymSW.pushManager.getSubscription();
        console.log('Push subscription:', subscription ? 'exists' : 'none');
        
        if (subscription) {
          console.log('Subscription details:', {
            endpoint: subscription.endpoint.substring(0, 30) + '...',
            hasKeys: !!subscription.keys,
            hasP256dh: subscription.keys && !!subscription.keys.p256dh,
            hasAuth: subscription.keys && !!subscription.keys.auth,
            expirationTime: subscription.expirationTime
          });
        }
      } catch (subError) {
        console.error('Error checking subscription:', subError);
      }
    } else {
      console.warn('GymTracker service worker not found');
    }
  } catch (swError) {
    console.error('Error checking service workers:', swError);
  }
  
  // Check VAPID key
  try {
    const response = await fetch('/api/notifications/vapid-public-key');
    if (response.ok) {
      const vapidKey = await response.text();
      console.log('VAPID key retrieved:', vapidKey.substring(0, 10) + '...');
      console.log('VAPID key length:', vapidKey.length);
    } else {
      console.error('Failed to retrieve VAPID key:', response.status, response.statusText);
    }
  } catch (vapidError) {
    console.error('Error retrieving VAPID key:', vapidError);
  }
  
  console.groupEnd();
};

// Add debug utility to window for console access
window.debugNotifications = debugNotificationSystem;

export {
  initializeNotifications,
  sendNotification,
  requestNotificationPermission,
  getNotificationPermissionStatus,
  areNotificationsSupported,
  showLocalNotification,
  debugNotificationSystem
};