// ============================================
// Server Entry Point – Express Application Setup
// ============================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./config/db');
const User = require('./models/User');

// Import route files
const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const adminRoutes = require('./routes/admin');

// Initialize Express app
const app = express();

// -----------------------------------------------
// Middleware
// -----------------------------------------------

// Enable CORS for all origins
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files from /public
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded files (for previewing images, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// -----------------------------------------------
// API Routes
// -----------------------------------------------

app.use('/api/auth', authRoutes);    // Authentication routes
app.use('/api/notes', notesRoutes);  // Notes CRUD routes
app.use('/api/admin', adminRoutes);  // Admin management routes

// -----------------------------------------------
// Serve Frontend Pages (HTML fallback)
// -----------------------------------------------

// Serve index.html for root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Catch-all: serve index.html for any unmatched route (SPA-like behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// -----------------------------------------------
// Error Handling Middleware
// -----------------------------------------------
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// -----------------------------------------------
// Create Default Admin Account
// -----------------------------------------------

/**
 * Seeds a default admin user if none exists.
 * Default credentials: admin@admin.com / admin123
 */
const seedAdmin = async () => {
  try {
    const adminExists = await User.findOne({ role: 'admin' });
    if (!adminExists) {
      await User.create({
        name: 'Admin',
        email: 'admin@admin.com',
        password: 'admin123',
        role: 'admin'
      });
      console.log('👤 Default admin account created (admin@admin.com / admin123)');
    }
  } catch (error) {
    console.error('Admin Seed Error:', error.message);
  }
};

// -----------------------------------------------
// Ensure Uploads Directory Exists
// -----------------------------------------------
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('📁 Uploads directory created');
}

// -----------------------------------------------
// Start Server
// -----------------------------------------------
const PORT = process.env.PORT || 5000;

// Connect to database, seed admin, then start listening
connectDB().then(() => {
  seedAdmin();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📂 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
