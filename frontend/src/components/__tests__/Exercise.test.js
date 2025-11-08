import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import Exercise from '../Exercise';
import {
  getExerciseFromLocalStorage,
  getWorkoutFromLocalStorage,
  saveExerciseToLocalStorage,
  markWorkoutDayAsModified
} from '../../utils/offlineWorkoutStorage';

jest.mock('../../utils/offlineWorkoutStorage', () => ({
  getExerciseFromLocalStorage: jest.fn(),
  getWorkoutFromLocalStorage: jest.fn(),
  saveExerciseToLocalStorage: jest.fn(),
  markWorkoutDayAsModified: jest.fn()
}));

const setNavigatorOnline = (value) => {
  Object.defineProperty(window.navigator, 'onLine', {
    configurable: true,
    value
  });
};

const baseExercise = {
  _id: 'exercise-1',
  name: 'Bench Press',
  sets: [
    { weight: 50, reps: 8, completed: false },
    { weight: 55, reps: 6, completed: false }
  ],
  history: [],
  restTime: 90
};

const buildExercise = () => JSON.parse(JSON.stringify(baseExercise));

const renderExercise = () =>
  render(
    <MemoryRouter initialEntries={["/workout/1/exercise/exercise-1"]}>
      <Routes>
        <Route
          path="/workout/:day/exercise/:id"
          element={<Exercise isWorkoutActive={true} darkMode={false} />}
        />
      </Routes>
    </MemoryRouter>
  );

beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
  setNavigatorOnline(false);
  global.fetch = jest.fn();

  getExerciseFromLocalStorage.mockImplementation(() => buildExercise());
  getWorkoutFromLocalStorage.mockReturnValue({
    day: 1,
    exercises: [buildExercise()]
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

test('enables edit mode to add and remove sets offline', async () => {
  const user = userEvent.setup();

  renderExercise();

  const editButton = await screen.findByRole('button', { name: /edit sets/i });
  await user.click(editButton);

  const addSetButton = await screen.findByRole('button', { name: /add set/i });

  saveExerciseToLocalStorage.mockClear();
  markWorkoutDayAsModified.mockClear();

  await user.click(addSetButton);

  await waitFor(() => {
    expect(saveExerciseToLocalStorage).toHaveBeenCalled();
  });

  let latest = saveExerciseToLocalStorage.mock.calls.at(-1)[0];
  expect(latest.sets).toHaveLength(3);

  const removeButtons = await screen.findAllByTitle(/remove set/i);
  await user.click(removeButtons.at(-1));

  await waitFor(() => {
    expect(saveExerciseToLocalStorage).toHaveBeenCalled();
  });

  latest = saveExerciseToLocalStorage.mock.calls.at(-1)[0];
  expect(latest.sets).toHaveLength(2);
  expect(markWorkoutDayAsModified).toHaveBeenCalled();
});

test('updates rest time through the editor and persists locally', async () => {
  const user = userEvent.setup();

  renderExercise();

  const editButton = await screen.findByRole('button', { name: /edit sets/i });
  await user.click(editButton);

  const durationInput = await screen.findByLabelText(/Rest Duration/i);

  saveExerciseToLocalStorage.mockClear();
  markWorkoutDayAsModified.mockClear();

  await user.clear(durationInput);
  await user.type(durationInput, '120');
  expect(durationInput).toHaveValue(120);
  await user.click(screen.getByRole('button', { name: /^save$/i }));

  await waitFor(() => {
    expect(saveExerciseToLocalStorage).toHaveBeenCalled();
  });

  await waitFor(() => {
    expect(saveExerciseToLocalStorage).toHaveBeenCalled();
  });

  const savedPayloads = saveExerciseToLocalStorage.mock.calls.map(call => call[0]);
  expect(savedPayloads.some(payload => payload.restTime === 120)).toBe(true);
  expect(markWorkoutDayAsModified).toHaveBeenCalled();
});
