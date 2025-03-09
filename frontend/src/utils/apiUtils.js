// src/utils/apiUtils.js

/**
 * Returns the correct base API URL based on the environment
 * This ensures API calls work in both development and production
 */
export const getApiBaseUrl = () => {
    // Check if we're in production by looking at the current URL
    const isProduction = window.location.hostname !== 'localhost';
    
    // In production, include the base path, in dev just use the direct API path
    return isProduction ? '/gym/api' : '/api';
  };
  
  /**
   * A wrapper for fetch that automatically prepends the correct API base URL
   * @param {string} endpoint - The API endpoint (without the base URL)
   * @param {object} options - Fetch options
   * @returns {Promise} - Fetch Promise
   */
  export const apiFetch = (endpoint, options = {}) => {
    const apiBaseUrl = getApiBaseUrl();
    const url = `${apiBaseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    
    return fetch(url, {
      ...options,
      credentials: 'include', // Always include credentials
    });
  };
  
  /**
   * Makes a GET request to the API
   * @param {string} endpoint - The API endpoint
   * @param {string} token - Auth token
   * @returns {Promise} - Response Promise
   */
  export const apiGet = async (endpoint, token) => {
    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    return apiFetch(endpoint, { headers });
  };
  
  /**
   * Makes a POST request to the API
   * @param {string} endpoint - The API endpoint
   * @param {object} data - The payload
   * @param {string} token - Auth token
   * @returns {Promise} - Response Promise
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
   * Makes a PATCH request to the API
   * @param {string} endpoint - The API endpoint
   * @param {object} data - The payload
   * @param {string} token - Auth token
   * @returns {Promise} - Response Promise
   */
  export const apiPatch = async (endpoint, data, token) => {
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    return apiFetch(endpoint, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
  };
  
  /**
   * Makes a DELETE request to the API
   * @param {string} endpoint - The API endpoint
   * @param {string} token - Auth token
   * @returns {Promise} - Response Promise
   */
  export const apiDelete = async (endpoint, token) => {
    const headers = {
      'Authorization': token ? `Bearer ${token}` : '',
    };
    
    return apiFetch(endpoint, {
      method: 'DELETE',
      headers,
    });
  };