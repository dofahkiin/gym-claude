import React from 'react';
import { render, screen } from '@testing-library/react';
import { beforeEach, expect, test, vi } from 'vitest';
import App from './App';
import {
  getAllWorkoutsFromLocalStorage,
  getModifiedExerciseIds
} from './utils/offlineWorkoutStorage';

vi.mock('./utils/offlineWorkoutStorage', async () => {
  const actual = await vi.importActual('./utils/offlineWorkoutStorage');
  return {
    ...actual,
    getModifiedExerciseIds: vi.fn(() => []),
    getAllWorkoutsFromLocalStorage: vi.fn(() => []),
    saveAllWorkoutsToLocalStorage: vi.fn(),
    getModifiedWorkoutDays: vi.fn(() => []),
    syncModifiedExercisesWithServer: vi.fn(),
    completeWorkoutLocally: vi.fn(),
    markWorkoutDayAsModified: vi.fn(),
    getExerciseFromLocalStorage: vi.fn(),
    getWorkoutFromLocalStorage: vi.fn(),
    saveExerciseToLocalStorage: vi.fn()
  };
});

const setNavigatorOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  window.history.pushState({}, 'Test', '/gym/');
  setNavigatorOnline(true);
  global.fetch = vi.fn();
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
