// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // Add cookie-parser
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');

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
  activeProgram: { type: String, default: null }, // Store the active program ID
  pushSubscriptions: [{
    endpoint: String,
    keys: {
      p256dh: String,
      auth: String
    },
    createdAt: { type: Date, default: Date.now }
  }],
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
      }],
      restTime: { type: Number, default: 90 } // Add rest time with default 90 seconds
    }]
  }]
});

const User = mongoose.model('User', userSchema);

const createSetArray = (count = 3, reps = 10) => (
  Array.from({ length: count }, () => ({
    weight: 0,
    reps,
    completed: false
  }))
);

const normalizeClientSets = (incomingSets, fallbackCount = 3, fallbackReps = 10) => {
  if (Array.isArray(incomingSets) && incomingSets.length > 0) {
    return incomingSets.map(set => ({
      weight: typeof set.weight === 'number' ? set.weight : parseFloat(set.weight) || 0,
      reps: typeof set.reps === 'number' ? set.reps : parseInt(set.reps, 10) || 0,
      completed: !!set.completed
    }));
  }

  return createSetArray(fallbackCount, fallbackReps);
};

// Default workout data
const defaultWorkouts = [
  {
    day: 1,
    exercises: [
      { name: "Smith Machine Bench Press", sets: createSetArray(3, 8), restTime: 90 },
      { name: "Machine Lat Pulldown", sets: createSetArray(3, 10), restTime: 90 },
      { name: "Machine Leg Curl", sets: createSetArray(3, 10), restTime: 90 },
      { name: "Machine Shoulder Press", sets: createSetArray(2, 8), restTime: 90 },
      { name: "Dumbbell Alternating Incline Curl", sets: createSetArray(2, 10), restTime: 90 },
      { name: "Cable Tricep Pushdown (Rope)", sets: createSetArray(2, 10), restTime: 90 },
      { name: "Barbell Bulgarian Split Squat", sets: createSetArray(3, 10), restTime: 90 }
    ]
  },
  {
    day: 2,
    exercises: [
      { name: "Machine Incline Chest Press", sets: createSetArray(3, 8), restTime: 90 },
      { name: "Cable Seated Row", sets: createSetArray(3, 10), restTime: 90 },
      { name: "Machine Leg Press", sets: createSetArray(3, 10), restTime: 90 },
      { name: "Dumbbell Lateral Raise", sets: createSetArray(2, 15), restTime: 90 },
      { name: "Dumbbell Hammer Curl", sets: createSetArray(2, 10), restTime: 90 },
      { name: "Barbell Seated Tricep Extension", sets: createSetArray(2, 10), restTime: 90 }
    ]
  },
  {
    day: 3,
    exercises: [
      { name: "Machine Leg Extension", sets: createSetArray(3, 15), restTime: 90 },
      { name: "Machine Seated Leg Curl", sets: createSetArray(3, 10), restTime: 90 },
      { name: "Barbell Preacher Curl", sets: createSetArray(2, 10), restTime: 90 },
      { name: "Ez Bar Tricep Extension", sets: createSetArray(2, 10), restTime: 90 },
      { name: "Barbell Bulgarian Split Squat", sets: createSetArray(3, 10), restTime: 90 }
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

// Helper function to ensure proper data format for the history
const createHistoryEntry = (sets, date = new Date()) => {
  // Ensure we get a proper array of sets with weight and reps properties
  const setData = sets.map(set => {
    // Create a clean object with just weight and reps
    return {
      weight: typeof set.weight === 'number' ? set.weight : parseFloat(set.weight) || 0,
      reps: typeof set.reps === 'number' ? set.reps : parseInt(set.reps) || 0
    };
  });
  
  return {
    date: date,
    sets: setData
  };
};

// Add helper function to convert exercise name to ID
const normalizeExerciseName = (name) => {
  return name.toLowerCase().trim().replace(/\s+/g, '_');
};

// Load or generate VAPID keys (store persistently)
let vapidKeys;
const VAPID_KEY_PATH = path.join(__dirname, '.vapid-keys.json');

try {
  // Try to load existing keys
  if (fs.existsSync(VAPID_KEY_PATH)) {
    const keyData = fs.readFileSync(VAPID_KEY_PATH, 'utf8');
    vapidKeys = JSON.parse(keyData);
    console.log('Loaded existing VAPID keys');
  } else if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    // Use environment variables if available
    vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY
    };
    console.log('Using VAPID keys from environment variables');
    // Save for future use
    fs.writeFileSync(VAPID_KEY_PATH, JSON.stringify(vapidKeys), 'utf8');
  } else {
    // Generate new keys
    console.log('Generating new VAPID keys for push notifications...');
    vapidKeys = webpush.generateVAPIDKeys();
    // Save keys to file for persistence
    fs.writeFileSync(VAPID_KEY_PATH, JSON.stringify(vapidKeys), 'utf8');
    console.log('New VAPID keys generated and saved');
  }
  
  // Set the keys in environment for use in the app
  process.env.VAPID_PUBLIC_KEY = vapidKeys.publicKey;
  process.env.VAPID_PRIVATE_KEY = vapidKeys.privateKey;
} catch (error) {
  console.error('Error handling VAPID keys:', error);
  
  // Fallback to generating new keys in memory (not persistent)
  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    console.log('Falling back to in-memory VAPID keys (not persistent)');
    const tempKeys = webpush.generateVAPIDKeys();
    process.env.VAPID_PUBLIC_KEY = tempKeys.publicKey;
    process.env.VAPID_PRIVATE_KEY = tempKeys.privateKey;
  }
}

console.log('VAPID Public Key:', process.env.VAPID_PUBLIC_KEY);

// Configure web-push with VAPID details
webpush.setVapidDetails(
  'mailto:support@gymtracker.example.com', // Contact email for push service
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

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
        email: user.email
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
  if (!workout) {
    return res.status(404).json({ error: 'Workout day not found' });
  }

  res.json(workout);
});

// Add a new exercise to a workout
app.post('/api/workouts/:day/exercises', auth, async (req, res) => {
  try {
    const { name, sets, restTime } = req.body;
    const workoutDay = parseInt(req.params.day);
    
    if (!name) {
      return res.status(400).json({ error: 'Exercise name is required' });
    }
    
    // Find the user's workout for the specified day
    const workoutIndex = req.user.workouts.findIndex(w => w.day === workoutDay);
    
    if (workoutIndex === -1) {
      return res.status(404).json({ error: 'Workout day not found' });
    }
    
    // Get active program to determine default rest time
    let defaultRestTime = 90; // Default to 90 seconds if no program is active
    
    // If user has an active program, use the program's default rest time
    if (req.user.activeProgram) {
      // Here we would ideally fetch from a database of programs, but since that's in your frontend,
      // we'll just have this logic in the frontend when the api is called
    }
    
    // Create the new exercise
    const newExercise = {
      name,
      sets: normalizeClientSets(sets),
      history: [],
      restTime: typeof restTime === 'number' ? restTime : defaultRestTime // Use provided rest time or default
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
    const { sets, history } = req.body; // Now accepting history in the request
    let exerciseUpdated = false;

    // Update the exercise in the user's workouts
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        if (exercise._id.toString() === req.params.exerciseId) {
          exerciseUpdated = true;
          
          // Create updated exercise with the new sets
          const updatedExercise = { ...exercise.toObject(), sets };
          
          // If history is provided, update the history as well
          if (history) {
            updatedExercise.history = history;
            console.log(`Updating history for ${exercise.name}, entries: ${history.length}`);
          }
          
          return updatedExercise;
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
    console.error('Error updating exercise:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to update exercise rest time
app.patch('/api/exercises/:exerciseId/rest-time', auth, async (req, res) => {
  try {
    const user = req.user;
    const { restTime } = req.body;
    
    // Validate rest time
    if (restTime === undefined || restTime < 10 || restTime > 600) {
      return res.status(400).json({ error: 'Invalid rest time. Must be between 10 and 600 seconds.' });
    }
    
    let exerciseUpdated = false;

    // Update the exercise in the user's workouts
    user.workouts = user.workouts.map(workout => {
      workout.exercises = workout.exercises.map(exercise => {
        if (exercise._id.toString() === req.params.exerciseId) {
          exerciseUpdated = true;
          return { ...exercise, restTime };
        }
        return exercise;
      });
      return workout;
    });

    if (!exerciseUpdated) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    await user.save();
    res.json({ message: 'Rest time updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get exercise history
app.get('/api/exercises/:exerciseId/history', auth, async (req, res) => {
  try {
    console.log(`Fetching history for exercise ID: ${req.params.exerciseId}`);
    const user = req.user;
    let exerciseHistory = null;
    let exerciseName = null;
    let exerciseFound = false;

    // Search through all workouts to find the exercise
    for (const workout of user.workouts) {
      const exercise = workout.exercises.find(
        ex => ex._id.toString() === req.params.exerciseId
      );
      
      if (exercise) {
        exerciseFound = true;
        exerciseName = exercise.name;
        console.log(`Found exercise: ${exerciseName}`);
        
        // Initialize history if it doesn't exist
        exerciseHistory = exercise.history || [];
        
        console.log(`Exercise has ${exerciseHistory.length} history entries`);
        break;
      }
    }

    if (!exerciseFound) {
      console.log(`Exercise ${req.params.exerciseId} not found in user's workouts`);
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // Sort history by date in descending order (most recent first)
    exerciseHistory.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB - dateA; // Descending order
    });

    // Format history entries to ensure they have all required properties
    const formattedHistory = exerciseHistory.map(entry => {
      // Create a properly formatted entry object
      const formattedEntry = {
        date: entry.date || new Date(),
        exerciseName: exerciseName
      };
      
      // Ensure sets are properly formatted
      if (Array.isArray(entry.sets)) {
        formattedEntry.sets = entry.sets.map(set => ({
          weight: typeof set.weight === 'number' ? set.weight : parseFloat(set.weight) || 0,
          reps: typeof set.reps === 'number' ? set.reps : parseInt(set.reps) || 0
        }));
      } else {
        formattedEntry.sets = [];
        console.log('Warning: History entry has no sets array');
      }
      
      return formattedEntry;
    });

    console.log(`Returning ${formattedHistory.length} formatted history entries`);
    
    // Return the formatted history
    res.json(formattedHistory);
  } catch (error) {
    console.error('Error fetching exercise history:', error);
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
    console.log('Processing workout completion for user:', req.user.email || 'unknown');
    const user = req.user;
    const currentDate = new Date();

    let historyAdded = 0;
    let exercisesProcessed = 0;

    // Process each workout
    for (const workout of user.workouts) {
      console.log(`Processing workout day ${workout.day}`);
      
      // Process each exercise in the workout
      for (const exercise of workout.exercises) {
        exercisesProcessed++;
        console.log(`- Processing exercise: ${exercise.name || 'unnamed'}`);
        
        // Get completed sets
        const completedSets = exercise.sets.filter(set => set.completed);
        console.log(`  - Found ${completedSets.length} completed sets`);
        
        if (completedSets.length > 0) {
          // Create new history entry using helper function
          const historyEntry = createHistoryEntry(completedSets, currentDate);
          
          // Initialize history array if it doesn't exist
          if (!exercise.history) {
            console.log(`  - Creating new history array for ${exercise.name}`);
            exercise.history = [];
          }
          
          console.log(`  - Adding history entry with ${historyEntry.sets.length} sets`);
          if (historyEntry.sets.length > 0) {
            console.log(`  - First set: weight=${historyEntry.sets[0].weight}, reps=${historyEntry.sets[0].reps}`);
          }
          
          // Add to history
          exercise.history.push(historyEntry);
          historyAdded++;
          
          // Reset sets to uncompleted
          exercise.sets = exercise.sets.map(set => ({
            ...set,
            completed: false
          }));
        }
      }
    }

    // Log a summary of what we did
    console.log(`Completed workout processing: ${historyAdded} history entries added across ${exercisesProcessed} exercises`);

    // Save the user with all updates
    await user.save();
    
    res.json({ 
      message: 'Workout completed and history saved successfully',
      historyAdded,
      exercisesProcessed
    });
  } catch (error) {
    console.error('Error completing workout:', error);
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

// Route to clear all workout days and create new ones from a program template 
app.post('/api/workouts/apply-program', auth, async (req, res) => {
  try {
    const { program, programId } = req.body;
    
    if (!program || !program.workouts || !Array.isArray(program.workouts)) {
      return res.status(400).json({ error: 'Invalid program data' });
    }
    
    // First, collect all exercise history from the user's current workouts
    const exerciseHistory = {};
    
    // Collect all existing exercise histories indexed by exercise name
    for (const workout of req.user.workouts) {
      for (const exercise of workout.exercises) {
        if (exercise.history && exercise.history.length > 0) {
          const normalizedName = normalizeExerciseName(exercise.name);
          exerciseHistory[normalizedName] = exercise.history;
        }
      }
    }
    
    // Clear all existing workouts
    req.user.workouts = [];
    
    // Create new workouts from the program
    for (const workout of program.workouts) {
      const newWorkout = {
        day: workout.day,
        exercises: []
      };
      
      // Add exercises to the workout
      for (const exerciseData of workout.exercises) {
        const newExercise = {
          name: exerciseData.name,
          sets: createSetArray(exerciseData.sets, exerciseData.reps),
          history: [], // Initialize with empty history
          restTime: exerciseData.restTime || program.defaultRestTime || 90 // Use exercise-specific rest time, program default, or fallback to 90s
        };
        
        // Restore history if this exercise existed before
        const normalizedName = normalizeExerciseName(exerciseData.name);
        if (exerciseHistory[normalizedName]) {
          newExercise.history = exerciseHistory[normalizedName];
        }
        
        newWorkout.exercises.push(newExercise);
      }
      
      req.user.workouts.push(newWorkout);
    }
    
    // Save the active program ID
    req.user.activeProgram = programId;
    
    // Save the updated user
    await req.user.save();
    
    res.json({ 
      message: 'Program applied successfully',
      workouts: req.user.workouts,
      activeProgram: programId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get the user's active program
app.get('/api/user/active-program', auth, async (req, res) => {
  try {
    res.json({
      activeProgram: req.user.activeProgram || null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to get VAPID public key
app.get('/api/notifications/vapid-public-key', (req, res) => {
  res.send(process.env.VAPID_PUBLIC_KEY);
});

// Endpoint to store push subscription
app.post('/api/notifications/subscribe', auth, async (req, res) => {
  try {
    const { subscription } = req.body;
    const user = req.user;
    
    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }
    
    // Check if this subscription already exists for this user
    const existingSubscription = user.pushSubscriptions.find(
      sub => sub.endpoint === subscription.endpoint
    );
    
    if (!existingSubscription) {
      // Add the new subscription
      user.pushSubscriptions.push({
        endpoint: subscription.endpoint,
        keys: subscription.keys
      });
      
      await user.save();
    }
    
    res.status(201).json({ message: 'Subscription stored successfully' });
  } catch (error) {
    console.error('Error storing push subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to send a notification
app.post('/api/notifications/send', auth, async (req, res) => {
  try {
    const { title, body, url } = req.body;
    const user = req.user;
    
    console.log('Notification request received:', { title, body, url });
    console.log('User subscriptions count:', user.pushSubscriptions?.length || 0);
    
    if (!title || !body) {
      return res.status(400).json({ error: 'Title and body are required' });
    }
    
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(404).json({ error: 'No push subscriptions found for this user' });
    }
    
    // Create notification payload
    const payload = JSON.stringify({
      title,
      body,
      url: url || '/gym' // Default to your app path
    });
    
    // Send notification to all subscriptions
    const results = [];
    const validSubscriptions = [];
    
    for (const subscription of user.pushSubscriptions) {
      try {
        console.log('Sending notification to endpoint:', subscription.endpoint.substring(0, 50) + '...');
        
        // Validate subscription
        if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
          console.error('Invalid subscription format:', subscription);
          results.push({ 
            success: false, 
            endpoint: subscription.endpoint || 'unknown', 
            error: 'Invalid subscription format' 
          });
          continue;
        }
        
        await webpush.sendNotification({
          endpoint: subscription.endpoint,
          keys: subscription.keys
        }, payload);
        
        console.log('Notification sent successfully');
        validSubscriptions.push(subscription);
        results.push({ success: true, endpoint: subscription.endpoint });
      } catch (error) {
        console.error('Error sending notification:', error);
        
        // Only keep subscriptions that didn't return a 404 or 410 (subscription expired)
        if (error.statusCode !== 404 && error.statusCode !== 410) {
          validSubscriptions.push(subscription);
        } else {
          console.log('Removing expired subscription');
        }
        
        results.push({ 
          success: false, 
          endpoint: subscription.endpoint, 
          error: error.message,
          statusCode: error.statusCode
        });
      }
    }
    
    // Update user subscriptions if any were removed
    if (validSubscriptions.length < user.pushSubscriptions.length) {
      console.log('Updating user subscriptions:', `${user.pushSubscriptions.length} -> ${validSubscriptions.length}`);
      user.pushSubscriptions = validSubscriptions;
      await user.save();
    }
    
    console.log('Notification processing complete:', results);
    
    res.json({ 
      message: 'Notification processing complete',
      results,
      success: results.some(r => r.success)
    });
  } catch (error) {
    console.error('Error sending notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to schedule a notification for a future time
app.post('/api/notifications/schedule', auth, async (req, res) => {
  try {
    const { title, body, url, delaySeconds } = req.body;
    const user = req.user;
    
    console.log('Scheduling notification:', { title, body, url, delaySeconds });
    
    if (!title || !body || !delaySeconds || typeof delaySeconds !== 'number') {
      return res.status(400).json({ error: 'Title, body, and delaySeconds are required' });
    }
    
    if (!user.pushSubscriptions || user.pushSubscriptions.length === 0) {
      return res.status(404).json({ error: 'No push subscriptions found for this user' });
    }
    
    // Schedule the notification to be sent after the specified delay
    const scheduledTime = Date.now() + (delaySeconds * 1000);
    
    // Generate a unique notification ID
    const notificationId = Date.now().toString() + Math.random().toString(36).substring(2, 9);
    
    // Store scheduled notification in memory (in a production app, you would use a database)
    if (!global.scheduledNotifications) {
      global.scheduledNotifications = [];
    }
    
    global.scheduledNotifications.push({
      id: notificationId,
      userId: user._id.toString(),
      subscriptions: user.pushSubscriptions,
      title, 
      body,
      url: url || '/gym',
      scheduledTime
    });
    
    // Set up the notification processor if not already running
    if (!global.notificationInterval) {
      global.notificationInterval = setInterval(processScheduledNotifications, 1000); // Check every second
    }
    
    res.status(201).json({ 
      message: 'Notification scheduled successfully',
      scheduledTime: new Date(scheduledTime).toISOString(),
      notificationId: notificationId  // Return the ID to the client
    });
  } catch (error) {
    console.error('Error scheduling notification:', error);
    res.status(500).json({ error: error.message });
  }
});

// Function to process scheduled notifications (add this anywhere in server.js)
async function processScheduledNotifications() {
  if (!global.scheduledNotifications || global.scheduledNotifications.length === 0) {
    return;
  }
  
  const now = Date.now();
  const toSend = [];
  
  // Find notifications that need to be sent
  global.scheduledNotifications = global.scheduledNotifications.filter(notification => {
    if (notification.scheduledTime <= now) {
      toSend.push(notification);
      return false; // Remove from the list
    }
    return true; // Keep in the list
  });
  
  // Send the notifications
  for (const notification of toSend) {
    try {
      console.log('Sending scheduled notification:', notification.title);
      
      // Create notification payload
      const payload = JSON.stringify({
        title: notification.title,
        body: notification.body,
        url: notification.url
      });
      
      // Send to all subscriptions for this user
      const validSubscriptions = [];
      
      for (const subscription of notification.subscriptions) {
        try {
          if (!subscription.endpoint || !subscription.keys || !subscription.keys.p256dh || !subscription.keys.auth) {
            console.error('Invalid subscription format:', subscription);
            continue;
          }
          
          await webpush.sendNotification({
            endpoint: subscription.endpoint,
            keys: subscription.keys
          }, payload);
          
          validSubscriptions.push(subscription);
        } catch (error) {
          console.error('Error sending scheduled notification:', error);
          
          // Only keep subscriptions that didn't return a 404 or 410 (subscription expired)
          if (error.statusCode !== 404 && error.statusCode !== 410) {
            validSubscriptions.push(subscription);
          }
        }
      }
      
      // Update user's subscriptions if any were removed
      if (validSubscriptions.length < notification.subscriptions.length) {
        const user = await User.findById(notification.userId);
        if (user) {
          user.pushSubscriptions = validSubscriptions;
          await user.save();
        }
      }
    } catch (error) {
      console.error('Error processing scheduled notification:', error);
    }
  }
}

// Add a new endpoint to cancel a scheduled notification
app.post('/api/notifications/cancel', auth, async (req, res) => {
  try {
    const { notificationId } = req.body;
    const user = req.user;
    
    console.log('Canceling notification:', notificationId);
    
    if (!notificationId) {
      return res.status(400).json({ error: 'Notification ID is required' });
    }
    
    if (!global.scheduledNotifications) {
      return res.status(404).json({ error: 'No scheduled notifications found' });
    }
    
    // Find the notification index
    const notificationIndex = global.scheduledNotifications.findIndex(
      notification => notification.id === notificationId && notification.userId === user._id.toString()
    );
    
    if (notificationIndex === -1) {
      return res.status(404).json({ error: 'Notification not found or already sent' });
    }
    
    // Remove the notification from the array
    global.scheduledNotifications.splice(notificationIndex, 1);
    
    res.json({ 
      message: 'Notification canceled successfully',
      notificationId
    });
  } catch (error) {
    console.error('Error canceling notification:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
