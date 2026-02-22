// ============================================
// Admin Routes – Manage Users and Notes
// ============================================

const express = require('express');
const fs = require('fs');
const User = require('../models/User');
const Note = require('../models/Note');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

// -----------------------------------------------
// GET /api/admin/stats – Get dashboard statistics
// -----------------------------------------------
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalNotes = await Note.countDocuments();
    const totalDownloads = await Note.aggregate([
      { $group: { _id: null, total: { $sum: '$downloads' } } }
    ]);

    // Get notes count per subject
    const subjectStats = await Note.aggregate([
      { $group: { _id: '$subject', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Recent uploads (last 5)
    const recentNotes = await Note.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        totalUsers,
        totalNotes,
        totalDownloads: totalDownloads.length > 0 ? totalDownloads[0].total : 0,
        subjectStats,
        recentNotes
      }
    });
  } catch (error) {
    console.error('Admin Stats Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// GET /api/admin/users – Get all users
// -----------------------------------------------
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });

    // Get note count per user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const noteCount = await Note.countDocuments({ uploadedBy: user._id });
        return {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          noteCount
        };
      })
    );

    res.json({
      success: true,
      count: usersWithStats.length,
      users: usersWithStats
    });
  } catch (error) {
    console.error('Admin Users Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// GET /api/admin/notes – Get all notes
// -----------------------------------------------
router.get('/notes', async (req, res) => {
  try {
    const notes = await Note.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Admin Notes Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// DELETE /api/admin/users/:id – Delete a user
// -----------------------------------------------
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Prevent deleting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    // Delete all notes uploaded by this user (and their files)
    const userNotes = await Note.find({ uploadedBy: user._id });
    for (const note of userNotes) {
      if (fs.existsSync(note.filePath)) {
        fs.unlinkSync(note.filePath);
      }
    }
    await Note.deleteMany({ uploadedBy: user._id });

    // Delete the user
    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: `User "${user.name}" and their ${userNotes.length} note(s) deleted`
    });
  } catch (error) {
    console.error('Admin Delete User Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// -----------------------------------------------
// DELETE /api/admin/notes/:id – Delete any note
// -----------------------------------------------
router.delete('/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    // Delete file from disk
    if (fs.existsSync(note.filePath)) {
      fs.unlinkSync(note.filePath);
    }

    // Delete from database
    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Admin Delete Note Error:', error.message);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
