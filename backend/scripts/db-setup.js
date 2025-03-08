// scripts/db-setup.js
require('dotenv').config();
const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// Change this to your MongoDB URI from .env
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set!');
  process.exit(1);
}

async function setupDatabase() {
  console.log('Setting up database for GymTracker...');
  
  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db();
    
    // Check if collections exist, create them if they don't
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    // Check for users collection
    if (!collectionNames.includes('users')) {
      console.log('Creating users collection...');
      await db.createCollection('users');
    }
    
    // Check for workouts collection
    if (!collectionNames.includes('workouts')) {
      console.log('Creating workouts collection...');
      await db.createCollection('workouts');
      
      // Create indexes
      console.log('Creating indexes for workouts collection...');
      await db.collection('workouts').createIndex({ user: 1 });
    }
    
    // Check for exerciselibraries collection
    if (!collectionNames.includes('exerciselibraries')) {
      console.log('Creating exerciselibraries collection...');
      await db.createCollection('exerciselibraries');
      
      // Create indexes
      console.log('Creating indexes for exerciselibraries collection...');
      await db.collection('exerciselibraries').createIndex({ user: 1 });
      await db.collection('exerciselibraries').createIndex({ name: 1, user: 1 }, { unique: true });
    }
    
    console.log('Database setup complete!');
    
    // Close the connection
    await client.close();
    console.log('MongoDB connection closed');
    
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();