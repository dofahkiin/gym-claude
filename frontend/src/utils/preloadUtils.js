// utils/preloadUtils.js
// Intelligently preload common data

// Cache for storing preloaded data
const dataCache = new Map();

/**
 * Preload common data that will be needed across the app
 * to avoid fetching it multiple times
 */
export const preloadCommonData = async () => {
  // Only run if online
  if (!navigator.onLine) return;
  
  try {
    // Get user token
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || !user.token) return;
    
    // Start preloading common data in parallel
    const preloadPromises = [
      preloadWorkouts(user.token),
      preloadActiveProgram(user.token)
    ];
    
    // Wait for all preloads to complete
    await Promise.allSettled(preloadPromises);
    console.log('Preloading common data complete');
  } catch (error) {
    console.warn('Error preloading common data:', error);
  }
};

/**
 * Preload workouts data
 */
const preloadWorkouts = async (token) => {
  try {
    // Check if recently cached
    if (dataCache.has('workouts')) {
      const cachedData = dataCache.get('workouts');
      if (Date.now() - cachedData.timestamp < 60000) { // Less than 1 minute old
        return cachedData.data;
      }
    }
    
    // Fetch workouts
    const response = await fetch('/api/workouts', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      // Store data in localStorage for offline use
      localStorage.setItem('all_workouts', JSON.stringify(data));
      
      // Cache data with timestamp
      dataCache.set('workouts', {
        data,
        timestamp: Date.now()
      });
      
      return data;
    }
  } catch (error) {
    console.warn('Error preloading workouts:', error);
  }
  
  return null;
};

/**
 * Preload active program data
 */
const preloadActiveProgram = async (token) => {
  try {
    // Check if recently cached
    if (dataCache.has('activeProgram')) {
      const cachedData = dataCache.get('activeProgram');
      if (Date.now() - cachedData.timestamp < 60000) { // Less than 1 minute old
        return cachedData.data;
      }
    }
    
    // Fetch active program
    const response = await fetch('/api/user/active-program', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include'
    });
    
    if (response.ok) {
      const data = await response.json();
      // Store program ID in localStorage for offline use
      if (data.activeProgram) {
        localStorage.setItem('active_program', data.activeProgram);
      }
      
      // Cache data with timestamp
      dataCache.set('activeProgram', {
        data,
        timestamp: Date.now()
      });
      
      return data;
    }
  } catch (error) {
    console.warn('Error preloading active program:', error);
  }
  
  return null;
};

/**
 * Get data from cache or fetch it if not available
 * @param {string} key - Cache key
 * @param {Function} fetchFn - Function to fetch data if not in cache
 * @param {number} maxAge - Maximum age of cached data in milliseconds
 * @returns {Promise<any>} - The data
 */
export const getOrFetchData = async (key, fetchFn, maxAge = 60000) => {
  // Check if data is in cache and fresh
  if (dataCache.has(key)) {
    const cachedData = dataCache.get(key);
    if (Date.now() - cachedData.timestamp < maxAge) {
      return cachedData.data;
    }
  }
  
  // Not in cache or stale, fetch fresh data
  try {
    const data = await fetchFn();
    if (data) {
      // Update cache
      dataCache.set(key, {
        data,
        timestamp: Date.now()
      });
    }
    return data;
  } catch (error) {
    console.warn(`Error fetching data for key ${key}:`, error);
    throw error;
  }
};

/**
 * Invalidate specific cache entries
 * @param {Array<string>} keys - Cache keys to invalidate
 */
export const invalidateCache = (keys) => {
  if (!keys || keys.length === 0) {
    dataCache.clear();
  } else {
    keys.forEach(key => dataCache.delete(key));
  }
};

/**
 * Prefetch a component for smoother transitions
 * @param {string} path - The path to navigate to
 */
export const prefetchComponent = (path) => {
  // This is a placeholder for more sophisticated code splitting
  // In a real implementation, you would use dynamic imports 
  // to prefetch components
  console.log(`Prefetching component for path: ${path}`);
  
  // Example implementation:
  /*
  if (path.startsWith('/workout/')) {
    import('./components/WorkoutDay').catch(err => console.warn('Error prefetching WorkoutDay:', err));
  } else if (path.includes('/exercise/')) {
    import('./components/Exercise').catch(err => console.warn('Error prefetching Exercise:', err));
  }
  */
};