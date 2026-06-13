const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) { // Check if connection string is configured
      throw new Error('MONGO_URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(process.env.MONGO_URI); // Connect to MongoDB

    console.log(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`); // Log host and database name
  } catch (error) {
    console.error('MongoDB connection error:', error.message); // Log connection failure
    process.exit(1); // Exit process if DB cannot be reached
  }
};

module.exports = connectDB; 