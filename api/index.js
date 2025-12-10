const serverless = require('serverless-http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars (Vercel envs are available via process.env; config.env is for local fallback)
dotenv.config({ path: './config.env' });

const app = require('../app');

let connPromise;
const connectDB = () => {
  if (!connPromise) {
    const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
    connPromise = mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
  }
  return connPromise;
};

const handler = serverless(app);

module.exports = async (req, res) => {
  await connectDB();
  return handler(req, res);
};

