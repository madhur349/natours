const serverless = require('serverless-http');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load env vars for Vercel serverless context
dotenv.config({ path: './config.env' });

const app = require('../app');

// Ensure a single Mongo connection across invocations
let conn;
const getConnection = () => {
  if (!conn) {
    const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
    conn = mongoose.connect(DB, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
    });
  }
  return conn;
};

const handler = serverless(app);

module.exports = async (req, res) => {
  await getConnection();
  return handler(req, res);
};

