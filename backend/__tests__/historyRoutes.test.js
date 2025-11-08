process.env.JWT_SECRET = 'testsecret';
process.env.SKIP_DB_CONNECTION = 'true';
process.env.VAPID_PUBLIC_KEY = 'test_public_key';
process.env.VAPID_PRIVATE_KEY = 'test_private_key';

const app = require('../server');
const {
  getExerciseHistoryHandler,
  deleteExerciseHistoryEntryHandler,
  addExerciseToWorkoutHandler,
  updateExerciseRestTimeHandler,
  resetWorkoutsHandler
} = app.handlers;

const createMockResponse = () => {
  const res = {};
  res.statusCode = 200;
  res.status = jest.fn().mockImplementation(code => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn().mockImplementation(payload => payload);
  return res;
};

const createExercise = (overrides = {}) => ({
  _id: overrides._id || 'exercise-1',
  name: overrides.name || 'Bench Press',
  sets: overrides.sets || [
    { weight: 50, reps: 8, completed: false },
    { weight: 50, reps: 8, completed: false }
  ],
  history: overrides.history || [],
  restTime: overrides.restTime || 90
});

const createUser = (overrides = {}) => ({
  _id: 'user-1',
  email: 'test@example.com',
  workouts: overrides.workouts || [
    {
      day: 1,
      exercises: [createExercise()]
    }
  ],
  save: jest.fn().mockResolvedValue(true),
  activeProgram: overrides.activeProgram || null
});

describe('Exercise history handlers', () => {
  test('returns history entries sorted by newest date', async () => {
    const exercise = createExercise({
      history: [
        { _id: 'h1', date: '2024-01-01T10:00:00Z', sets: [{ weight: 45, reps: 10 }] },
        { _id: 'h2', date: '2024-02-01T10:00:00Z', sets: [{ weight: 50, reps: 8 }] }
      ]
    });
    const user = createUser({ workouts: [{ day: 1, exercises: [exercise] }] });
    const req = { params: { exerciseId: exercise._id }, user };
    const res = createMockResponse();

    await getExerciseHistoryHandler(req, res);

    expect(res.json).toHaveBeenCalled();
    const payload = res.json.mock.calls[0][0];
    expect(payload).toHaveLength(2);
    expect(payload[0]._id).toBe('h2');
  });

  test('returns 404 when exercise is missing', async () => {
    const user = createUser();
    const req = { params: { exerciseId: 'missing' }, user };
    const res = createMockResponse();

    await getExerciseHistoryHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Exercise not found' });
  });

  test('deletes a history entry and persists changes', async () => {
    const exercise = createExercise({
      history: [
        { _id: 'delete-me', date: '2024-01-01T10:00:00Z', sets: [{ weight: 40, reps: 10 }] },
        { _id: 'keep-me', date: '2024-02-01T10:00:00Z', sets: [{ weight: 42, reps: 8 }] }
      ]
    });
    const user = createUser({ workouts: [{ day: 1, exercises: [exercise] }] });
    const req = { params: { exerciseId: exercise._id, historyId: 'delete-me' }, user };
    const res = createMockResponse();

    await deleteExerciseHistoryEntryHandler(req, res);

    expect(user.save).toHaveBeenCalled();
    expect(exercise.history).toHaveLength(1);
    expect(exercise.history[0]._id).toBe('keep-me');
    expect(res.json).toHaveBeenCalledWith({
      message: 'History entry deleted successfully',
      history: expect.any(Array)
    });
  });

  test('fails gracefully when history entry is missing', async () => {
    const exercise = createExercise({ history: [] });
    const user = createUser({ workouts: [{ day: 1, exercises: [exercise] }] });
    const req = { params: { exerciseId: exercise._id, historyId: 'missing' }, user };
    const res = createMockResponse();

    await deleteExerciseHistoryEntryHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'History entry not found' });
  });

  test('deletes history entries when only a date-based identifier is provided', async () => {
    const targetDate = '2024-03-01T10:00:00Z';
    const exercise = createExercise({
      history: [
        { date: targetDate, sets: [{ weight: 60, reps: 6 }] },
        { _id: 'keep', date: '2024-03-05T10:00:00Z', sets: [{ weight: 62, reps: 6 }] }
      ]
    });
    const user = createUser({ workouts: [{ day: 1, exercises: [exercise] }] });
    const req = {
      params: {
        exerciseId: exercise._id,
        historyId: new Date(targetDate).getTime().toString()
      },
      user
    };
    const res = createMockResponse();

    await deleteExerciseHistoryEntryHandler(req, res);

    expect(user.save).toHaveBeenCalled();
    expect(exercise.history).toHaveLength(1);
    expect(exercise.history[0]._id).toBe('keep');
    expect(res.json).toHaveBeenCalledWith({
      message: 'History entry deleted successfully',
      history: expect.any(Array)
    });
  });
});

describe('Workout management handlers', () => {
  test('adds a new exercise to the requested workout day', async () => {
    const user = createUser();
    const req = {
      params: { day: '1' },
      body: {
        name: 'Tempo Squat',
        sets: [{ weight: 60, reps: 6 }],
        restTime: 120
      },
      user
    };
    const res = createMockResponse();

    await addExerciseToWorkoutHandler(req, res);

    expect(user.workouts[0].exercises).toHaveLength(2);
    expect(user.workouts[0].exercises[1].name).toBe('Tempo Squat');
    expect(user.save).toHaveBeenCalled();
    expect(res.statusCode).toBe(201);
  });

  test('validates required exercise name on add', async () => {
    const user = createUser();
    const req = { params: { day: '1' }, body: { sets: [] }, user };
    const res = createMockResponse();

    await addExerciseToWorkoutHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Exercise name is required' });
  });

  test('updates rest time for a specific exercise', async () => {
    const exercise = createExercise();
    const user = createUser({ workouts: [{ day: 1, exercises: [exercise] }] });
    const req = { params: { exerciseId: exercise._id }, body: { restTime: 150 }, user };
    const res = createMockResponse();

    await updateExerciseRestTimeHandler(req, res);

    const updatedExercise = user.workouts[0].exercises.find(ex => ex._id === exercise._id);
    expect(updatedExercise.restTime).toBe(150);
    expect(user.save).toHaveBeenCalled();
  });

  test('resets completed flags across all sets', async () => {
    const exercise = createExercise({
      sets: [
        { weight: 40, reps: 10, completed: true },
        { weight: 45, reps: 8, completed: false }
      ]
    });
    const user = createUser({ workouts: [{ day: 1, exercises: [exercise] }] });
    const req = { user };
    const res = createMockResponse();

    await resetWorkoutsHandler(req, res);

    exercise.sets.forEach(set => {
      expect(set.completed).toBe(false);
    });
    expect(user.save).toHaveBeenCalled();
  });
});
