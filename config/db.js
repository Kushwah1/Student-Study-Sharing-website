// ============================================
// Database Configuration – MongoDB Connection
// ============================================

const mongoose = require('mongoose');

/**
 * Connect to MongoDB.
 * First tries the MONGODB_URI from .env (external MongoDB).
 * If that fails, falls back to mongodb-memory-server (in-memory DB for development).
 */
const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  try {
    // Attempt connection to configured MongoDB URI
    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log(`⚠️  Could not connect to external MongoDB: ${error.message}`);
    console.log('🔄 Starting in-memory MongoDB for development...');

    try {
      // Fallback: use mongodb-memory-server (in-memory)
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const memoryUri = mongoServer.getUri();

      const conn = await mongoose.connect(memoryUri);
      console.log(`✅ In-Memory MongoDB Connected: ${conn.connection.host}`);
      console.log('⚠️  Data will be lost when the server stops (in-memory mode)');
    } catch (memError) {
      console.error(`❌ MongoDB Connection Error: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
