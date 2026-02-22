// ============================================
// Notes Routes – Upload, Browse, Search, Download, Delete
// ============================================

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Note = require('../models/Note');
const { protect } = require('../middleware/auth');

const router = express.Router();

// -----------------------------------------------
// Multer Configuration – File Upload Setup
// -----------------------------------------------

// Storage configuration: save files to /uploads with unique names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomNumber-originalName
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter: allow only specific file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, images, Word, PowerPoint, Excel, Text files'), false);
  }
};

// Initialize multer with config
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB default
  }
});

// -----------------------------------------------
// POST /api/notes/upload – Upload a new note
// -----------------------------------------------
router.post('/upload', protect, (req, res) => {
  // Use multer's single file upload
  upload.single('file')(req, res, async (err) => {
    // Handle multer errors
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File size exceeds 10MB limit'
        });
      }
      return res.status(400).json({ success: false, message: err.message });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }

    try {
      // Validate file was uploaded
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Please upload a file'
        });
      }

      const { title, description, subject } = req.body;

      // Validate required fields
      if (!title || !description || !subject) {
        // Remove uploaded file if validation fails
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Please provide title, description, and subject'
        });
      }

      // Create the note in the database
      const note = await Note.create({
        title,
        description,
        subject,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedBy: req.user._id
      });

      // Populate the uploader info
      await note.populate('uploadedBy', 'name email');

      res.status(201).json({
        success: true,
        message: 'Note uploaded successfully',
        note
      });
    } catch (error) {
      // Clean up file if database operation fails
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error('Upload Error:', error.message);
      res.status(500).json({
        success: false,
        message: 'Server error during upload'
      });
    }
  });
});

// -----------------------------------------------
// GET /api/notes – Get all notes (with optional subject filter)
// -----------------------------------------------
router.get('/', async (req, res) => {
  try {
    const { subject, page = 1, limit = 12 } = req.query;
    const query = {};

    // Filter by subject if provided
    if (subject && subject !== 'All') {
      query.subject = subject;
    }

    const total = await Note.countDocuments(query);
    const notes = await Note.find(query)
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 }) // Newest first
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: notes.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      notes
    });
  } catch (error) {
    console.error('Fetch Notes Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching notes'
    });
  }
});

// -----------------------------------------------
// GET /api/notes/my – Get notes uploaded by current user
// -----------------------------------------------
router.get('/my', protect, async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notes.length,
      notes
    });
  } catch (error) {
    console.error('Fetch My Notes Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error fetching your notes'
    });
  }
});

// -----------------------------------------------
// GET /api/notes/search – Search notes by keyword
// -----------------------------------------------
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Use regex for flexible search across title, description, subject
    const searchRegex = new RegExp(q, 'i');
    const notes = await Note.find({
      $or: [
        { title: searchRegex },
        { description: searchRegex },
        { subject: searchRegex }
      ]
    })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: notes.length,
      query: q,
      notes
    });
  } catch (error) {
    console.error('Search Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during search'
    });
  }
});

// -----------------------------------------------
// GET /api/notes/download/:id – Download a note file
// -----------------------------------------------
router.get('/download/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Check if file exists on disk
    if (!fs.existsSync(note.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Increment download counter
    note.downloads += 1;
    await note.save();

    // Send file for download
    res.download(note.filePath, note.fileName);
  } catch (error) {
    console.error('Download Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during download'
    });
  }
});

// -----------------------------------------------
// DELETE /api/notes/:id – Delete a note (owner only)
// -----------------------------------------------
router.delete('/:id', protect, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    // Only the owner or admin can delete
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this note'
      });
    }

    // Delete the file from disk
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
    console.error('Delete Error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error during deletion'
    });
  }
});

module.exports = router;
