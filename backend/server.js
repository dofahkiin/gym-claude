// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Add cookie-parser

if (!process.env.JWT_SECRET || !process.env.MONGODB_URI) {
  throw new Error('Missing required environment variables');
}

const app = express();
app.use(cors({
  origin: true, // Allow request origin
  credentials: true // Allow cookies to be sent with requests
}));
app.use(express.json());
app.use(cookieParser()); // Parse cookies

mongoose.connect(process.env.MONGODB_URI);

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
      }],
      history: [{
        date: Date,
        sets: [{
          weight: Number,
          reps: Number
        }]
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
      {
        name: "Machine Leg Curl",
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Machine Shoulder Press",
        sets: Array(2).fill({ weight: 0, reps: 8, completed: false })
      },
      {
        name: "Dumbbell Alternating Incline Curl",
        sets: Array(2).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Cable Tricep Pushdown (Rope)",
        sets: Array(2).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Barbell Bulgarian Split Squat",
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      }
    ]
  },
  {
    day: 2,
    exercises: [
      {
        name: "Machine Incline Chest Press",
        sets: Array(3).fill({ weight: 0, reps: 8, completed: false })
      },
      {
        name: "Cable Seated Row",
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Machine Leg Press",
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Dumbbell Lateral Raise",
        sets: Array(2).fill({ weight: 0, reps: 15, completed: false })
      },
      {
        name: "Dumbbell Hammer Curl",
        sets: Array(2).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Barbell Seated Tricep Extension",
        sets: Array(2).fill({ weight: 0, reps: 10, completed: false })
      }
    ]
  },
  {
    day: 3,
    exercises: [
      {
        name: "Machine Leg Extension",
        sets: Array(3).fill({ weight: 0, reps: 15, completed: false })
      },
      {
        name: "Machine Seated Leg Curl",
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Barbell Preacher Curl",
        sets: Array(2).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Ez Bar Tricep Extension",
        sets: Array(2).fill({ weight: 0, reps: 10, completed: false })
      },
      {
        name: "Barbell Bulgarian Split Squat",
        sets: Array(3).fill({ weight: 0, reps: 10, completed: false })
      }
    ]
  }
];

// Set cookie options
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production', // Set to true in production
  sameSite: 'Lax',
  maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
};

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
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    // Set token in HTTP-only cookie
    res.cookie('auth_token', token, cookieOptions);
    
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
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    // Set token in HTTP-only cookie
    res.cookie('auth_token', token, cookieOptions);
    
    res.json({ token, email: user.email });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/logout', (req, res) => {
  // Clear the authentication cookie
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out successfully' });
});

// Endpoint to check if user is authenticated
app.get('/api/auth/check', async (req, res) => {
  try {
    // Check if token exists in cookie
    const token = req.cookies.auth_token;
    
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    
    res.json({ 
      authenticated: true, 
      user: { 
        email: user.email,
        token // Include token in response for client-side storage
      } 
    });
  } catch (error) {
    res.status(401).json({ authenticated: false });
  }
});

// Middleware to verify JWT from cookie or header
const auth = async (req, res, next) => {
  try {
    let token;
    
    // Try to get token from cookie first
    if (req.cookies.auth_token) {
      token = req.cookies.auth_token;
    } 
    // Fallback to Authorization header
    else if (req.header('Authorization')) {
      token = req.header('Authorization').replace('Bearer ', '');
    }
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findOne({ _id: decoded.userId });
    
    if (!user) {
      throw new Error('User not found');
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

// Add a new exercise to a workout
app.post('/api/workouts/:day/exercises', auth, async (req, res) => {
  try {
    const { name, sets } = req.body;
    const workoutDay = parseInt(req.params.day);
    
    if (!name) {
      return res.status(400).json({ error: 'Exercise name is required' });
    }
    
    // Find the user's workout for the specified day
    const workoutIndex = req.user.workouts.findIndex(w => w.day === workoutDay);
    
    if (workoutIndex === -1) {
      return res.status(404).json({ error: 'Workout day not found' });
    }
    
    // Create the new exercise
    const newExercise = {
      name,
      sets: sets || Array(3).fill({ weight: 0, reps: 10, completed: false }),
      history: []
    };
    
    // Add the exercise to the workout
    req.user.workouts[workoutIndex].exercises.push(newExercise);
    
    // Save the updated user
    await req.user.save();
    
    res.status(201).json({ 
      message: 'Exercise added successfully',
      exercise: newExercise
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove an exercise from a workout
app.delete('/api/workouts/:day/exercises/:exerciseId', auth, async (req, res) => {
  try {
    const workoutDay = parseInt(req.params.day);
    const exerciseId = req.params.exerciseId;
    
    // Find the user's workout for the specified day
    const workoutIndex = req.user.workouts.findIndex(w => w.day === workoutDay);
    
    if (workoutIndex === -1) {
      return res.status(404).json({ error: 'Workout day not found' });
    }
    
    // Find the exercise in the workout
    const exerciseIndex = req.user.workouts[workoutIndex].exercises.findIndex(
      ex => ex._id.toString() === exerciseId
    );
    
    if (exerciseIndex === -1) {
      return res.status(404).json({ error: 'Exercise not found' });
    }
    
    // Remove the exercise from the workout
    req.user.workouts[workoutIndex].exercises.splice(exerciseIndex, 1);
    
    // Save the updated user
    await req.user.save();
    
    res.json({ message: 'Exercise removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get a single exercise
app.get('/api/exercises/:exerciseId', auth, async (req, res) => {
  try {
    const user = req.user;
    let exerciseFound = null;

    // Search through all workouts to find the exercise
    for (const workout of user.workouts) {
      const exercise = workout.exercises.find(
        ex => ex._id.toString() === req.params.exerciseId
      );
      if (exercise) {
        exerciseFound = exercise;
        break;
      }
    }

    if (!exerciseFound) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exerciseFound);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a single exercise
app.patch('/api/exercises/:exerciseId', auth, async (req, res) => {
  try {
    const user = req.user;
    const { sets } = req.body;
    let exerciseUpdated = false;

    // Update the exercise in the user's workouts
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        if (exercise._id.toString() === req.params.exerciseId) {
          exerciseUpdated = true;
          return { ...exercise, sets };
        }
        return exercise;
      });
      return workout;
    });

    if (!exerciseUpdated) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    await user.save();
    res.json({ message: 'Exercise updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get exercise history
app.get('/api/exercises/:exerciseId/history', auth, async (req, res) => {
  try {
    const user = req.user;
    let exerciseHistory = null;

    for (const workout of user.workouts) {
      const exercise = workout.exercises.find(
        ex => ex._id.toString() === req.params.exerciseId
      );
      if (exercise) {
        exerciseHistory = exercise.history || [];
        break;
      }
    }

    if (exerciseHistory === null) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exerciseHistory);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new set to an exercise
app.post('/api/exercises/:exerciseId/sets', auth, async (req, res) => {
  try {
    const user = req.user;
    const { weight = 0, reps = 8 } = req.body;
    let exerciseUpdated = false;

    // Find and update the exercise in the user's workouts
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        if (exercise._id.toString() === req.params.exerciseId) {
          exerciseUpdated = true;
          // Create a new set with default values
          const newSet = {
            weight: parseFloat(weight),
            reps: parseInt(reps),
            completed: false
          };
          // Add the new set to the exercise
          return { 
            ...exercise, 
            sets: [...exercise.sets, newSet]
          };
        }
        return exercise;
      });
      return workout;
    });

    if (!exerciseUpdated) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    await user.save();
    res.status(201).json({ message: 'Set added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Remove a set from an exercise
app.delete('/api/exercises/:exerciseId/sets/:setIndex', auth, async (req, res) => {
  try {
    const user = req.user;
    const setIndex = parseInt(req.params.setIndex);
    let exerciseUpdated = false;

    // Find and update the exercise in the user's workouts
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        if (exercise._id.toString() === req.params.exerciseId) {
          // Ensure we have more than one set (prevent removing all sets)
          if (exercise.sets.length <= 1) {
            throw new Error('Cannot remove the last set');
          }
          
          exerciseUpdated = true;
          // Remove the set at the specified index
          const updatedSets = [...exercise.sets];
          updatedSets.splice(setIndex, 1);
          
          return { 
            ...exercise, 
            sets: updatedSets 
          };
        }
        return exercise;
      });
      return workout;
    });

    if (!exerciseUpdated) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    await user.save();
    res.json({ message: 'Set removed successfully' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Reset checkboxes
app.post('/api/workouts/reset', auth, async (req, res) => {
  try {
    const user = req.user;
    
    // Reset all exercise sets' completed status to false
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        exercise.sets = exercise.sets.map(set => ({
          ...set,
          completed: false
        }));
        return exercise;
      });
      return workout;
    });

    await user.save();
    res.json({ message: 'All workouts reset successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to save workout history
app.post('/api/workouts/complete', auth, async (req, res) => {
  try {
    const user = req.user;
    const currentDate = new Date();
    
    // Save history for completed sets before resetting
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        const completedSets = exercise.sets.filter(set => set.completed);
        if (completedSets.length > 0) {
          if (!exercise.history) {
            exercise.history = [];
          }
          exercise.history.push({
            date: currentDate,
            sets: completedSets.map(set => ({
              weight: set.weight,
              reps: set.reps
            }))
          });
        }
        
        // Reset all sets to uncompleted
        exercise.sets = exercise.sets.map(set => ({
          ...set,
          completed: false
        }));
        
        return exercise;
      });
      return workout;
    });

    await user.save();
    res.json({ message: 'Workout completed and history saved successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Create a new workout day
app.post('/api/workouts/days', auth, async (req, res) => {
  try {
    const { day } = req.body;
    
    if (!day || !Number.isInteger(day) || day <= 0) {
      return res.status(400).json({ error: 'Valid day number is required' });
    }
    
    // Check if day already exists
    const existingDay = req.user.workouts.find(w => w.day === day);
    if (existingDay) {
      return res.status(400).json({ error: `Day ${day} already exists` });
    }
    
    // Create a new workout day with empty exercises array
    const newWorkout = {
      day,
      exercises: [] // No default exercises, user will add their own
    };
    
    // Add the new workout to the user's workouts
    req.user.workouts.push(newWorkout);
    
    // Save the user
    await req.user.save();
    
    res.status(201).json({ 
      message: `Day ${day} created successfully`,
      workout: newWorkout
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a workout day
app.delete('/api/workouts/days/:day', auth, async (req, res) => {
  try {
    const dayToRemove = parseInt(req.params.day);
    
    // Find the workout for the specified day
    const workoutIndex = req.user.workouts.findIndex(w => w.day === dayToRemove);
    
    if (workoutIndex === -1) {
      return res.status(404).json({ error: 'Workout day not found' });
    }
    
    // Remove the workout day
    req.user.workouts.splice(workoutIndex, 1);
    
    // Save the user
    await req.user.save();
    
    res.json({ message: `Day ${dayToRemove} removed successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});