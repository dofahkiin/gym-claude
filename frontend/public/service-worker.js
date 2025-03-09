// First, let's create a service worker file
// Create a new file: frontend/public/service-worker.js

// service-worker.js
self.addEventListener('install', (event) => {
    self.skipWaiting();
  });
  
  self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
  });
  
  // Listen for push notifications
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/logo192.png',
      badge: '/logo192.png',
      vibrate: [200, 100, 200],
      tag: 'rest-timer',
      renotify: true
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  });
  
  // Handle notification clicks
  self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientsList) => {
        // If we have an open window, focus it
        for (const client of clientsList) {
          if (client.url.includes('/gym') && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no open window, open a new one
        if (clients.openWindow) {
          return clients.openWindow('/gym');
        }
      })
    );
  });
  
  // Handle messages from the app
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'setTimer') {
      const { exerciseId, duration } = event.data;
      
      // Clear any existing timeout for this exercise
      if (self.timers && self.timers[exerciseId]) {
        clearTimeout(self.timers[exerciseId]);
      }
      
      // Initialize timers object if it doesn't exist
      if (!self.timers) {
        self.timers = {};
      }
      
      // Calculate when the timer should end
      const endTime = Date.now() + duration * 1000;
      
      // Store the timer
      self.timers[exerciseId] = setTimeout(() => {
        // Send a notification when the timer completes
        self.registration.showNotification('Rest Timer Completed', {
          body: 'Time to start your next set!',
          icon: '/logo192.png',
          badge: '/logo192.png',
          vibrate: [200, 100, 200],
          tag: 'rest-timer',
          renotify: true
        });
        
        // Clean up the timer
        delete self.timers[exerciseId];
      }, duration * 1000);
      
      // Store the end time so we can resume the timer if the service worker restarts
      self.timerEndTimes = self.timerEndTimes || {};
      self.timerEndTimes[exerciseId] = endTime;
    }
    
    if (event.data && event.data.type === 'clearTimer') {
      const { exerciseId } = event.data;
      
      // Clear the timer
      if (self.timers && self.timers[exerciseId]) {
        clearTimeout(self.timers[exerciseId]);
        delete self.timers[exerciseId];
      }
      
      // Remove the end time
      if (self.timerEndTimes && self.timerEndTimes[exerciseId]) {
        delete self.timerEndTimes[exerciseId];
      }
    }
  });