// server.js
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost/gym-tracker');

// Models
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  workouts: [{
    day: Number,
    exercises: [{
      name: String,
      sets: [{
        weight: Number,
        reps: Number,
        completed: Boolean
      }]
    }]
  }]
});

const User = mongoose.model('User', userSchema);

// Default workout data
const defaultWorkouts = [
  {
    day: 1,
    exercises: [
      {
        name: "Smith Machine Bench Press",
        sets: Array(3).fill({ weight: 0, reps: 8, completed: false })
      },
      {
        name: "Machine Lat Pulldown",
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      },
      // Add other Day 1 exercises...
    ]
  },
  // Add Day 2 and 3 workouts...
];

// Auth routes
app.post('/api/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({
      email,
      password: hashedPassword,
      workouts: defaultWorkouts
    });
    
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key');
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !await bcrypt.compare(password, user.password)) {
      throw new Error('Invalid credentials');
    }
    
    const token = jwt.sign({ userId: user._id }, 'your-secret-key');
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Middleware to verify JWT
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization').replace('Bearer ', '');
    const decoded = jwt.verify(token, 'your-secret-key');
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      throw new Error();
    }
    
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Workout routes
app.get('/api/workouts', auth, async (req, res) => {
  res.json(req.user.workouts);
});

app.get('/api/workouts/:day', auth, async (req, res) => {
  const workout = req.user.workouts.find(w => w.day === parseInt(req.params.day));
  res.json(workout);
});

app.patch('/api/exercises/:exerciseId', auth, async (req, res) => {
  try {
    const { sets } = req.body;
    const user = req.user;
    
    // Find and update the specific exercise
    let exerciseFound = false;
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        if (exercise._id.toString() === req.params.exerciseId) {
          exerciseFound = true;
          return { ...exercise, sets };
        }
        return exercise;
      });
      return workout;
    });
    
    if (!exerciseFound) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    await user.save();
    res.json({ message: 'Exercise updated successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

