// frontend/src/data/workoutPrograms.js
const workoutPrograms = {
    hypertrophy: {
      name: "Hypertrophy",
      description: "Build muscle mass and size with moderate weights and higher repetitions.",
      workouts: [
        {
          day: 1,
          name: "Workout A",
          exercises: [
            { name: "Smith Machine Bench Press", sets: 3, reps: 8 },
            { name: "Machine Lat Pulldown", sets: 3, reps: 10 },
            { name: "Machine Leg Curl", sets: 3, reps: 10 },
            { name: "Machine Shoulder Press", sets: 2, reps: 8 },
            { name: "Dumbbell Alternating Incline Curl", sets: 2, reps: 10 },
            { name: "Cable Tricep Pushdown", sets: 2, reps: 10 },
            { name: "Barbell Bulgarian Split Squat", sets: 3, reps: 10 }
          ]
        },
        {
          day: 2,
          name: "Workout B",
          exercises: [
            { name: "Machine Incline Chest Press", sets: 3, reps: 8 },
            { name: "Cable Seated Row", sets: 3, reps: 10 },
            { name: "Machine Leg Press", sets: 3, reps: 10 },
            { name: "Dumbbell Lateral Raise", sets: 2, reps: 15 },
            { name: "Dumbbell Hammer Curl", sets: 2, reps: 10 },
            { name: "Barbell Seated Tricep Extension", sets: 2, reps: 10 }
          ]
        },
        {
          day: 3,
          name: "Workout C",
          exercises: [
            { name: "Machine Leg Extension", sets: 3, reps: 15 },
            { name: "Machine Seated Leg Curl", sets: 3, reps: 10 },
            { name: "Barbell Preacher Curl", sets: 2, reps: 10 },
            { name: "Ez Bar Tricep Extension", sets: 2, reps: 10 },
            { name: "Barbell Bulgarian Split Squat", sets: 3, reps: 10 }
          ]
        }
      ]
    },
    strength: {
      name: "Strength",
      description: "Develop maximum strength with heavier weights and lower repetitions.",
      workouts: [
        {
          day: 1,
          name: "Upper Body",
          exercises: [
            { name: "Barbell Bench Press", sets: 5, reps: 5 },
            { name: "Barbell Row", sets: 5, reps: 5 },
            { name: "Overhead Press", sets: 3, reps: 6 },
            { name: "Pull-up", sets: 3, reps: 6 },
            { name: "Dumbbell Triceps Extension", sets: 3, reps: 8 },
            { name: "EZ Bar Curl", sets: 3, reps: 8 }
          ]
        },
        {
          day: 2,
          name: "Lower Body",
          exercises: [
            { name: "Deadlift", sets: 5, reps: 5 },
            { name: "Front Squat", sets: 3, reps: 5 },
            { name: "Dumbbell Romanian Deadlift", sets: 3, reps: 8 },
            { name: "Dumbbell Lunge", sets: 3, reps: 8 },
            { name: "Seated Calf Raise", sets: 4, reps: 12 }
          ]
        },
        {
          day: 3,
          name: "Full Body",
          exercises: [
            { name: "Barbell Back Squat", sets: 5, reps: 5 },
            { name: "Incline Bench Press", sets: 4, reps: 6 },
            { name: "Lat Pulldown", sets: 4, reps: 8 },
            { name: "Dumbbell Row", sets: 3, reps: 8 },
            { name: "Dumbbell Lateral Raise", sets: 3, reps: 10 },
            { name: "Leg Press", sets: 3, reps: 10 }
          ]
        }
      ]
    },
    endurance: {
      name: "Endurance",
      description: "Improve muscular endurance with lighter weights and higher repetitions.",
      workouts: [
        {
          day: 1,
          name: "Full Body Endurance A",
          exercises: [
            { name: "Push-up", sets: 3, reps: 20 },
            { name: "Dumbbell Row", sets: 3, reps: 15 },
            { name: "Dumbbell Lunge", sets: 3, reps: 15 },
            { name: "Dumbbell Lateral Raise", sets: 3, reps: 20 },
            { name: "Hammer Curl", sets: 3, reps: 15 },
            { name: "Tricep Extension", sets: 3, reps: 15 }
          ]
        },
        {
          day: 2,
          name: "Full Body Endurance B",
          exercises: [
            { name: "Leg Press", sets: 3, reps: 20 },
            { name: "Chest Fly", sets: 3, reps: 15 },
            { name: "Lat Pulldown", sets: 3, reps: 15 },
            { name: "Leg Extension", sets: 3, reps: 20 },
            { name: "Leg Curl", sets: 3, reps: 15 },
            { name: "Plank", sets: 3, reps: 30 }
          ]
        },
        {
          day: 3,
          name: "Full Body Endurance C",
          exercises: [
            { name: "Dumbbell Bench Press", sets: 3, reps: 15 },
            { name: "Cable Row", sets: 3, reps: 15 },
            { name: "Dumbbell Split Squat", sets: 3, reps: 15 },
            { name: "Face Pull", sets: 3, reps: 20 },
            { name: "Dumbbell Curl", sets: 3, reps: 15 },
            { name: "Cable Tricep Pushdown", sets: 3, reps: 15 }
          ]
        }
      ]
    },
    weightLoss: {
      name: "Weight Loss",
      description: "Burn calories and improve conditioning with moderate weights and shorter rest periods.",
      workouts: [
        {
          day: 1,
          name: "Full Body Circuit A",
          exercises: [
            { name: "Dumbbell Squat", sets: 4, reps: 12 },
            { name: "Dumbbell Press", sets: 4, reps: 12 },
            { name: "Dumbbell Row", sets: 4, reps: 12 },
            { name: "Dumbbell Lunge", sets: 3, reps: 12 },
            { name: "Push-up", sets: 3, reps: 12 },
            { name: "Dumbbell Curl", sets: 3, reps: 12 }
          ]
        },
        {
          day: 2,
          name: "Full Body Circuit B",
          exercises: [
            { name: "Leg Press", sets: 4, reps: 15 },
            { name: "Dumbbell Bench Press", sets: 4, reps: 12 },
            { name: "Lat Pulldown", sets: 4, reps: 12 },
            { name: "Leg Extension", sets: 3, reps: 15 },
            { name: "Cable Tricep Pushdown", sets: 3, reps: 12 },
            { name: "Dumbbell Lateral Raise", sets: 3, reps: 15 }
          ]
        },
        {
          day: 3,
          name: "Core & Conditioning",
          exercises: [
            { name: "Planks", sets: 3, reps: 30 },
            { name: "Hanging Leg Raise", sets: 3, reps: 12 },
            { name: "Russian Twist", sets: 3, reps: 15 },
            { name: "Dumbbell Stepup", sets: 3, reps: 15 },
            { name: "Dumbbell Lunge", sets: 3, reps: 15 },
            { name: "Hyperextension", sets: 3, reps: 15 }
          ]
        }
      ]
    },
    powerLifting: {
      name: "Powerlifting",
      description: "Focus on the three main compound lifts: squat, bench press, and deadlift.",
      workouts: [
        {
          day: 1,
          name: "Squat Day",
          exercises: [
            { name: "Barbell Back Squat", sets: 5, reps: 3 },
            { name: "Front Squat", sets: 3, reps: 5 },
            { name: "Leg Press", sets: 3, reps: 8 },
            { name: "Romanian Deadlift", sets: 3, reps: 8 },
            { name: "Leg Extension", sets: 3, reps: 10 },
            { name: "Leg Curl", sets: 3, reps: 10 }
          ]
        },
        {
          day: 2,
          name: "Bench Day",
          exercises: [
            { name: "Barbell Bench Press", sets: 5, reps: 3 },
            { name: "Incline Bench Press", sets: 3, reps: 5 },
            { name: "Dumbbell Press", sets: 3, reps: 8 },
            { name: "Dumbbell Row", sets: 3, reps: 8 },
            { name: "Tricep Extension", sets: 3, reps: 10 },
            { name: "Dumbbell Lateral Raise", sets: 3, reps: 12 }
          ]
        },
        {
          day: 3,
          name: "Deadlift Day",
          exercises: [
            { name: "Deadlift", sets: 5, reps: 3 },
            { name: "Barbell Row", sets: 3, reps: 5 },
            { name: "Pull-up", sets: 3, reps: 8 },
            { name: "Hyperextension", sets: 3, reps: 10 },
            { name: "Hammer Curl", sets: 3, reps: 10 },
            { name: "Front Raise", sets: 3, reps: 10 }
          ]
        }
      ]
    }
  };
  
  export default workoutPrograms;