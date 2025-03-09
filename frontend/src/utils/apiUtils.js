// src/utils/apiUtils.js - Updated with GET fallback for problematic routes

/**
 * Returns the correct base API URL based on the environment
 */
export const getApiBaseUrl = () => {
    const isProduction = window.location.hostname !== 'localhost';
    return isProduction ? '/gym/api' : '/api';
  };
  
  /**
   * Determines if running in production environment
   */
  export const isProduction = () => {
    return window.location.hostname !== 'localhost';
  };
  
  /**
   * A wrapper for fetch that automatically prepends the correct API base URL
   */
  export const apiFetch = (endpoint, options = {}) => {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    return fetch(url, {
      ...options,
      credentials: 'include',
    });
  };
  
  /**
   * Makes a GET request to the API
   */
  export const apiGet = async (endpoint, token) => {
    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    return apiFetch(endpoint, { headers });
  };
  
  /**
   * Makes a POST request to the API
   */
  export const apiPost = async (endpoint, data, token) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    return apiFetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
  };
  
  /**
   * Special function to update rest time that works around server limitations
   * Uses GET with query parameters in production, PATCH in development
   */
  export const updateRestTime = async (exerciseId, restTime, token) => {
    if (isProduction()) {
      // In production, use GET with query parameters as a workaround
      const headers = {
        'Authorization': token ? `Bearer ${token}` : '',
      };
      
      // Convert the restTime update to a query parameter
      const queryParam = `?restTime=${restTime}`;
      
      return apiFetch(`exercises/${exerciseId}/rest-time${queryParam}`, {
        method: 'GET',
        headers,
      });
    } else {
      // In development, use PATCH as normal
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };
      
      return apiFetch(`exercises/${exerciseId}/rest-time`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ restTime }),
      });
    }
  };