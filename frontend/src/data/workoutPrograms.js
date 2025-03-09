// frontend/src/data/workoutPrograms.js with added rest times
const workoutPrograms = {
  hypertrophy: {
    name: "Hypertrophy",
    description: "Build muscle mass and size with moderate weights and higher repetitions.",
    defaultRestTime: 90, // 90 seconds default rest for hypertrophy
    workouts: [
      {
        day: 1,
        name: "Workout A",
        exercises: [
          { name: "Smith Machine Bench Press", sets: 3, reps: 8, restTime: 90 },
          { name: "Machine Lat Pulldown", sets: 3, reps: 10, restTime: 90 },
          { name: "Machine Leg Curl", sets: 3, reps: 10, restTime: 90 },
          { name: "Machine Shoulder Press", sets: 2, reps: 8, restTime: 90 },
          { name: "Dumbbell Alternating Incline Curl", sets: 2, reps: 10, restTime: 90 },
          { name: "Cable Tricep Pushdown", sets: 2, reps: 10, restTime: 90 },
          { name: "Barbell Bulgarian Split Squat", sets: 3, reps: 10, restTime: 90 }
        ]
      },
      {
        day: 2,
        name: "Workout B",
        exercises: [
          { name: "Machine Incline Chest Press", sets: 3, reps: 8, restTime: 90 },
          { name: "Cable Seated Row", sets: 3, reps: 10, restTime: 90 },
          { name: "Machine Leg Press", sets: 3, reps: 10, restTime: 90 },
          { name: "Dumbbell Lateral Raise", sets: 2, reps: 15, restTime: 90 },
          { name: "Dumbbell Hammer Curl", sets: 2, reps: 10, restTime: 90 },
          { name: "Barbell Seated Tricep Extension", sets: 2, reps: 10, restTime: 90 }
        ]
      },
      {
        day: 3,
        name: "Workout C",
        exercises: [
          { name: "Machine Leg Extension", sets: 3, reps: 15, restTime: 90 },
          { name: "Machine Seated Leg Curl", sets: 3, reps: 10, restTime: 90 },
          { name: "Barbell Preacher Curl", sets: 2, reps: 10, restTime: 90 },
          { name: "Ez Bar Tricep Extension", sets: 2, reps: 10, restTime: 90 },
          { name: "Barbell Bulgarian Split Squat", sets: 3, reps: 10, restTime: 90 }
        ]
      }
    ]
  },
  strength: {
    name: "Strength",
    description: "Develop maximum strength with heavier weights and lower repetitions.",
    defaultRestTime: 180, // 3 minutes default rest for strength
    workouts: [
      {
        day: 1,
        name: "Upper Body",
        exercises: [
          { name: "Barbell Bench Press", sets: 5, reps: 5, restTime: 180 }, // 3 mins for compound
          { name: "Barbell Row", sets: 5, reps: 5, restTime: 180 }, // 3 mins for compound
          { name: "Overhead Press", sets: 3, reps: 6, restTime: 180 }, // 3 mins for compound
          { name: "Pull-up", sets: 3, reps: 6, restTime: 180 }, // 3 mins for compound
          { name: "Dumbbell Triceps Extension", sets: 3, reps: 8, restTime: 120 }, // 2 mins for accessory
          { name: "EZ Bar Curl", sets: 3, reps: 8, restTime: 120 } // 2 mins for accessory
        ]
      },
      {
        day: 2,
        name: "Lower Body",
        exercises: [
          { name: "Deadlift", sets: 5, reps: 5, restTime: 300 }, // 5 mins for deadlift
          { name: "Front Squat", sets: 3, reps: 5, restTime: 240 }, // 4 mins for squat
          { name: "Dumbbell Romanian Deadlift", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Dumbbell Lunge", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Seated Calf Raise", sets: 4, reps: 12, restTime: 120 } // 2 mins for accessory
        ]
      },
      {
        day: 3,
        name: "Full Body",
        exercises: [
          { name: "Barbell Back Squat", sets: 5, reps: 5, restTime: 240 }, // 4 mins for squat
          { name: "Incline Bench Press", sets: 4, reps: 6, restTime: 180 }, // 3 mins
          { name: "Lat Pulldown", sets: 4, reps: 8, restTime: 180 }, // 3 mins
          { name: "Dumbbell Row", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Dumbbell Lateral Raise", sets: 3, reps: 10, restTime: 120 }, // 2 mins for accessory
          { name: "Leg Press", sets: 3, reps: 10, restTime: 180 } // 3 mins
        ]
      }
    ]
  },
  endurance: {
    name: "Endurance",
    description: "Improve muscular endurance with lighter weights and higher repetitions.",
    defaultRestTime: 60, // 60 seconds default rest for endurance
    workouts: [
      {
        day: 1,
        name: "Full Body Endurance A",
        exercises: [
          { name: "Push-up", sets: 3, reps: 20, restTime: 60 },
          { name: "Dumbbell Row", sets: 3, reps: 15, restTime: 60 },
          { name: "Dumbbell Lunge", sets: 3, reps: 15, restTime: 60 },
          { name: "Dumbbell Lateral Raise", sets: 3, reps: 20, restTime: 60 },
          { name: "Hammer Curl", sets: 3, reps: 15, restTime: 60 },
          { name: "Tricep Extension", sets: 3, reps: 15, restTime: 60 }
        ]
      },
      {
        day: 2,
        name: "Full Body Endurance B",
        exercises: [
          { name: "Leg Press", sets: 3, reps: 20, restTime: 60 },
          { name: "Chest Fly", sets: 3, reps: 15, restTime: 60 },
          { name: "Lat Pulldown", sets: 3, reps: 15, restTime: 60 },
          { name: "Leg Extension", sets: 3, reps: 20, restTime: 60 },
          { name: "Leg Curl", sets: 3, reps: 15, restTime: 60 },
          { name: "Plank", sets: 3, reps: 30, restTime: 60 }
        ]
      },
      {
        day: 3,
        name: "Full Body Endurance C",
        exercises: [
          { name: "Dumbbell Bench Press", sets: 3, reps: 15, restTime: 60 },
          { name: "Cable Row", sets: 3, reps: 15, restTime: 60 },
          { name: "Dumbbell Split Squat", sets: 3, reps: 15, restTime: 60 },
          { name: "Face Pull", sets: 3, reps: 20, restTime: 60 },
          { name: "Dumbbell Curl", sets: 3, reps: 15, restTime: 60 },
          { name: "Cable Tricep Pushdown", sets: 3, reps: 15, restTime: 60 }
        ]
      }
    ]
  },
  weightLoss: {
    name: "Weight Loss",
    description: "Burn calories and improve conditioning with moderate weights and shorter rest periods.",
    defaultRestTime: 45, // 45 seconds default rest for weight loss
    workouts: [
      {
        day: 1,
        name: "Full Body Circuit A",
        exercises: [
          { name: "Dumbbell Squat", sets: 4, reps: 12, restTime: 45 },
          { name: "Dumbbell Press", sets: 4, reps: 12, restTime: 45 },
          { name: "Dumbbell Row", sets: 4, reps: 12, restTime: 45 },
          { name: "Dumbbell Lunge", sets: 3, reps: 12, restTime: 45 },
          { name: "Push-up", sets: 3, reps: 12, restTime: 45 },
          { name: "Dumbbell Curl", sets: 3, reps: 12, restTime: 45 }
        ]
      },
      {
        day: 2,
        name: "Full Body Circuit B",
        exercises: [
          { name: "Leg Press", sets: 4, reps: 15, restTime: 45 },
          { name: "Dumbbell Bench Press", sets: 4, reps: 12, restTime: 45 },
          { name: "Lat Pulldown", sets: 4, reps: 12, restTime: 45 },
          { name: "Leg Extension", sets: 3, reps: 15, restTime: 45 },
          { name: "Cable Tricep Pushdown", sets: 3, reps: 12, restTime: 45 },
          { name: "Dumbbell Lateral Raise", sets: 3, reps: 15, restTime: 45 }
        ]
      },
      {
        day: 3,
        name: "Core & Conditioning",
        exercises: [
          { name: "Planks", sets: 3, reps: 30, restTime: 45 },
          { name: "Hanging Leg Raise", sets: 3, reps: 12, restTime: 45 },
          { name: "Russian Twist", sets: 3, reps: 15, restTime: 45 },
          { name: "Dumbbell Stepup", sets: 3, reps: 15, restTime: 45 },
          { name: "Dumbbell Lunge", sets: 3, reps: 15, restTime: 45 },
          { name: "Hyperextension", sets: 3, reps: 15, restTime: 45 }
        ]
      }
    ]
  },
  powerLifting: {
    name: "Powerlifting",
    description: "Focus on the three main compound lifts: squat, bench press, and deadlift.",
    defaultRestTime: 240, // 4 minutes default rest for powerlifting
    workouts: [
      {
        day: 1,
        name: "Squat Day",
        exercises: [
          { name: "Barbell Back Squat", sets: 5, reps: 3, restTime: 300 }, // 5 mins for main lift
          { name: "Front Squat", sets: 3, reps: 5, restTime: 240 }, // 4 mins
          { name: "Leg Press", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Romanian Deadlift", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Leg Extension", sets: 3, reps: 10, restTime: 120 }, // 2 mins for accessory
          { name: "Leg Curl", sets: 3, reps: 10, restTime: 120 } // 2 mins for accessory
        ]
      },
      {
        day: 2,
        name: "Bench Day",
        exercises: [
          { name: "Barbell Bench Press", sets: 5, reps: 3, restTime: 300 }, // 5 mins for main lift
          { name: "Incline Bench Press", sets: 3, reps: 5, restTime: 240 }, // 4 mins
          { name: "Dumbbell Press", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Dumbbell Row", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Tricep Extension", sets: 3, reps: 10, restTime: 120 }, // 2 mins for accessory
          { name: "Dumbbell Lateral Raise", sets: 3, reps: 12, restTime: 120 } // 2 mins for accessory
        ]
      },
      {
        day: 3,
        name: "Deadlift Day",
        exercises: [
          { name: "Deadlift", sets: 5, reps: 3, restTime: 360 }, // 6 mins for main lift
          { name: "Barbell Row", sets: 3, reps: 5, restTime: 240 }, // 4 mins
          { name: "Pull-up", sets: 3, reps: 8, restTime: 180 }, // 3 mins
          { name: "Hyperextension", sets: 3, reps: 10, restTime: 120 }, // 2 mins for accessory
          { name: "Hammer Curl", sets: 3, reps: 10, restTime: 120 }, // 2 mins for accessory
          { name: "Front Raise", sets: 3, reps: 10, restTime: 120 } // 2 mins for accessory
        ]
      }
    ]
  }
};

export default workoutPrograms;