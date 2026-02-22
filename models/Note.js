// ============================================
// Note Model – Mongoose Schema
// ============================================

const mongoose = require('mongoose');

/**
 * Note Schema
 * - title: Title of the note
 * - description: Brief description of the note content
 * - subject: Category/subject the note belongs to
 * - fileName: Original file name uploaded by the user
 * - filePath: Server path where file is stored
 * - fileType: MIME type of the uploaded file
 * - fileSize: Size of the file in bytes
 * - uploadedBy: Reference to the User who uploaded the note
 * - downloads: Counter for number of downloads
 * - createdAt: Auto-generated timestamp
 */
const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    enum: {
      values: [
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Computer Science',
        'English',
        'History',
        'Geography',
        'Economics',
        'Business Studies',
        'Accounting',
        'Psychology',
        'Sociology',
        'Political Science',
        'Engineering',
        'Medical',
        'Law',
        'Arts',
        'Other'
      ],
      message: '{VALUE} is not a valid subject'
    }
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  downloads: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Text index for search functionality (search by title, description, subject)
noteSchema.index({ title: 'text', description: 'text', subject: 'text' });

module.exports = mongoose.model('Note', noteSchema);
