import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import {
  getAllWorkoutsFromLocalStorage,
  getModifiedExerciseIds
} from './utils/offlineWorkoutStorage';

jest.mock('./utils/offlineWorkoutStorage', () => {
  const actual = jest.requireActual('./utils/offlineWorkoutStorage');
  return {
    ...actual,
    getModifiedExerciseIds: jest.fn(() => []),
    getAllWorkoutsFromLocalStorage: jest.fn(() => []),
    saveAllWorkoutsToLocalStorage: jest.fn(),
    getModifiedWorkoutDays: jest.fn(() => []),
    syncModifiedExercisesWithServer: jest.fn(),
    completeWorkoutLocally: jest.fn(),
    markWorkoutDayAsModified: jest.fn(),
    getExerciseFromLocalStorage: jest.fn(),
    getWorkoutFromLocalStorage: jest.fn(),
    saveExerciseToLocalStorage: jest.fn()
  };
});

const setNavigatorOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value
  });
};

beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  window.history.pushState({}, 'Test', '/gym/');
  setNavigatorOnline(true);
  global.fetch = jest.fn();
});

test('routes unauthenticated visitors to the login experience', async () => {
  global.fetch.mockResolvedValue({ ok: false });

  render(<App />);

  expect(await screen.findByText(/Welcome to GymTracker/i)).toBeInTheDocument();
});

test('renders the dashboard when cached workouts exist for an authenticated user', async () => {
  setNavigatorOnline(false);
  localStorage.setItem('user', JSON.stringify({ email: 'test@example.com', token: 'token-123' }));

  getAllWorkoutsFromLocalStorage.mockReturnValue([
    {
      day: 1,
      exercises: [
        { _id: 'ex-1', name: 'Bench Press', sets: [{ weight: 50, reps: 8, completed: false }] }
      ]
    }
  ]);

  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ authenticated: true, user: { email: 'test@example.com' } })
  });

  render(<App />);

  expect(await screen.findByText(/Your Workouts/i)).toBeInTheDocument();
  expect(getModifiedExerciseIds).toHaveBeenCalled();
});
