import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import ExerciseHistory from '../ExerciseHistory';
import {
  getExerciseFromLocalStorage,
  removeHistoryEntryFromLocalExercise
} from '../../utils/offlineWorkoutStorage';

vi.mock('../../utils/offlineWorkoutStorage', () => ({
  getExerciseFromLocalStorage: vi.fn(),
  removeHistoryEntryFromLocalExercise: vi.fn()
}));

const setNavigatorOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value
  });
};

const mockHistory = [
  {
    _id: 'history-1',
    date: '2024-02-12T10:00:00Z',
    sets: [{ weight: 55, reps: 8 }]
  },
  {
    _id: 'history-2',
    date: '2024-02-10T10:00:00Z',
    sets: [{ weight: 50, reps: 10 }]
  }
];

const renderComponent = () =>
  render(
    <MemoryRouter initialEntries={["/exercise/exercise-1/history"]}>
      <Routes>
        <Route path="/exercise/:id/history" element={<ExerciseHistory />} />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  setNavigatorOnline(true);
  window.confirm = vi.fn(() => true);
  const fetchSpy = vi.fn();
  global.fetch = fetchSpy;
  window.fetch = fetchSpy;
});

afterEach(() => {
  vi.clearAllMocks();
});

test('enters edit mode and deletes a history entry via the API', async () => {
  getExerciseFromLocalStorage.mockReturnValue({
    _id: 'exercise-1',
    name: 'Bench Press',
    history: mockHistory
  });

  localStorage.setItem('user', JSON.stringify({ token: 'test-token' }));

  const user = userEvent.setup();

  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce({
      ok: true,
      json: async () => mockHistory
    })
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        message: 'History entry deleted successfully',
        history: [mockHistory[1]]
      })
    });
  global.fetch = window.fetch = fetchMock;

  renderComponent();

  await screen.findByText(/Bench Press History/i);

  await user.click(screen.getByRole('button', { name: /edit/i }));

  const deleteButtons = await screen.findAllByRole('button', { name: /delete/i });
  await user.click(deleteButtons[0]);

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalled();
  });

  const deleteCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'DELETE');
  expect(deleteCall).toBeDefined();
  expect(deleteCall[0]).toContain('/api/exercises/exercise-1/history/history-1');

  expect(window.confirm).toHaveBeenCalled();
});

test('shows cached data with an offline reminder when navigator is offline', async () => {
  setNavigatorOnline(false);

  getExerciseFromLocalStorage.mockReturnValue({
    _id: 'exercise-2',
    name: 'Deadlift',
    history: mockHistory
  });

  localStorage.setItem('user', JSON.stringify({ token: 'test-token' }));

  renderComponent();

  expect(await screen.findByText(/Deadlift History/i)).toBeInTheDocument();
  expect(await screen.findByText(/You're currently offline/i)).toBeInTheDocument();
  expect(global.fetch).not.toHaveBeenCalled();
});
