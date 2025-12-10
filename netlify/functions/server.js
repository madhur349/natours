const serverless = require('serverless-http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Only load config.env in local development (Netlify provides env vars via process.env)
if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: './config.env' });
}

const app = require('../../app');

// Fix views path for Netlify serverless environment
// In Netlify, __dirname in app.js might not resolve correctly, so we set it explicitly
const projectRoot = path.join(__dirname, '../..');
app.set('views', path.join(projectRoot, 'views'));

let isConnected = false;
let connPromise = null;

const connectDB = async () => {
  // If already connected, return immediately
  if (mongoose.connection.readyState === 1) {
    return;
  }

  // If connection is in progress, wait for it
  if (connPromise) {
    return connPromise;
  }

  // Start new connection
  const dbUser = process.env.DB_USERNAME;
  const dbPass = process.env.DATABASE_PASSWORD;
  
  if (!dbUser) {
    throw new Error('DB_USERNAME env var is missing');
  }
  if (!dbPass) {
    throw new Error('DATABASE_PASSWORD env var is missing');
  }
  if (!process.env.DATABASE) {
    throw new Error('DATABASE env var is missing');
  }

  // URL encode username and password to handle special characters
  const encodedUser = encodeURIComponent(dbUser);
  const encodedPass = encodeURIComponent(dbPass);

  const DB = process.env.DATABASE
    .replace('<USERNAME>', encodedUser)
    .replace('<PASSWORD>', encodedPass);

  // Debug logging (remove sensitive info in production)
  console.log('Connecting with username:', dbUser);
  console.log('Connection string (masked):', DB.replace(/:[^:@]+@/, ':****@'));

  connPromise = mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).then(() => {
    isConnected = true;
    console.log('MongoDB connected successfully');
    return;
  }).catch((err) => {
    connPromise = null;
    console.error('MongoDB connection error:', err.message);
    throw err;
  });

  return connPromise;
};

const handler = serverless(app);

// Netlify function format
exports.handler = async (event, context) => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: 'Database connection failed',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
  
  return handler(event, context);
};

