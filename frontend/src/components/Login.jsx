// Updated Login.js with component library
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Input, Button, Alert } from './ui';

const Login = ({ setUser, darkMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save user data to localStorage as a fallback
      localStorage.setItem('user', JSON.stringify(data));
      setUser(data);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto">
      <Card>
        <div className="card-gradient-header px-6 py-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8h1a4 4 0 0 1 0 8h-1"></path>
            <path d="M5 8h1a4 4 0 0 1 0 8H5"></path>
            <path d="M2 8h2v8H2z"></path>
            <path d="M20 8h2v8h-2z"></path>
            <path d="M7 12h10"></path>
          </svg>
          <h2 className="text-2xl font-bold">Welcome to GymTracker</h2>
          <p className="mt-2 text-indigo-200">Sign in to continue your fitness journey</p>
        </div>
        
        <div className="p-6">
          {error && (
            <Alert type="error" className="mb-4">{error}</Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              id="email"
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            
            <Input
              id="password"
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              fullWidth
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-gray-600 dark:text-gray-400">
            <p>Don't have an account? <Link to="/signup" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium">Sign up</Link></p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Login;