// ============================================
// Dashboard Page – JavaScript Logic
// Handles file upload, user's notes display, and deletion
// ============================================

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  updateNav();

  // Redirect to login if not authenticated
  if (!getToken()) {
    window.location.href = 'login.html';
    return;
  }

  // Display user name in welcome message
  const user = getUser();
  if (user) {
    document.getElementById('userName').textContent = user.name;
  }

  // Load user's notes
  loadMyNotes();

  // File input change handler – show selected file name
  const fileInput = document.getElementById('noteFile');
  const fileName = document.getElementById('fileName');
  const uploadArea = document.getElementById('fileUploadArea');

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      fileName.textContent = fileInput.files[0].name;
      fileName.style.color = 'var(--primary)';
      fileName.style.fontWeight = '600';
    } else {
      fileName.textContent = 'No file selected';
      fileName.style.color = '';
      fileName.style.fontWeight = '';
    }
  });

  // Drag and drop visual feedback
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
  });

  uploadArea.addEventListener('drop', () => {
    uploadArea.classList.remove('dragover');
  });

  // Handle upload form submission
  document.getElementById('uploadForm').addEventListener('submit', handleUpload);
});

/**
 * Handle the note upload form submission.
 * Sends file and metadata to the server using FormData.
 */
async function handleUpload(e) {
  e.preventDefault();

  const title = document.getElementById('noteTitle').value.trim();
  const subject = document.getElementById('noteSubject').value;
  const description = document.getElementById('noteDescription').value.trim();
  const file = document.getElementById('noteFile').files[0];
  const btn = document.getElementById('uploadBtn');
  const alertBox = document.getElementById('uploadAlert');

  alertBox.style.display = 'none';

  // Validate all fields
  if (!title || !subject || !description || !file) {
    showAlert(alertBox, 'Please fill in all fields and select a file.', 'error');
    return;
  }

  // Check file size (10MB limit)
  if (file.size > 10 * 1024 * 1024) {
    showAlert(alertBox, 'File size exceeds 10MB limit.', 'error');
    return;
  }

  // Build FormData for multipart upload
  const formData = new FormData();
  formData.append('title', title);
  formData.append('subject', subject);
  formData.append('description', description);
  formData.append('file', file);

  // Disable button during upload
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';

  try {
    const res = await fetch('/api/notes/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getToken()}`
        // Don't set Content-Type – browser sets it with boundary for FormData
      },
      body: formData
    });

    const data = await res.json();

    if (data.success) {
      showAlert(alertBox, 'Note uploaded successfully!', 'success');

      // Reset form
      document.getElementById('uploadForm').reset();
      document.getElementById('fileName').textContent = 'No file selected';
      document.getElementById('fileName').style.color = '';

      // Reload notes list
      loadMyNotes();
    } else {
      showAlert(alertBox, data.message || 'Upload failed.', 'error');
    }
  } catch (error) {
    showAlert(alertBox, 'Connection error. Please try again.', 'error');
    console.error('Upload error:', error);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-upload"></i> Upload Note';
  }
}

/**
 * Load the current user's uploaded notes.
 * Shows notes count, total downloads, and the notes grid.
 */
async function loadMyNotes() {
  const notesGrid = document.getElementById('myNotesGrid');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('emptyState');

  notesGrid.innerHTML = '';
  loading.style.display = 'block';
  emptyState.style.display = 'none';

  try {
    const res = await fetch('/api/notes/my', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();
    loading.style.display = 'none';

    if (data.success && data.notes.length > 0) {
      // Update stats
      document.getElementById('myNotesCount').textContent = data.count;

      // Calculate total downloads across all user's notes
      const totalDownloads = data.notes.reduce((sum, note) => sum + (note.downloads || 0), 0);
      document.getElementById('myDownloads').textContent = totalDownloads;

      // Render notes with delete buttons
      data.notes.forEach(note => {
        notesGrid.innerHTML += createNoteCard(note, true);
      });
    } else {
      emptyState.style.display = 'block';
      document.getElementById('myNotesCount').textContent = '0';
      document.getElementById('myDownloads').textContent = '0';
    }
  } catch (error) {
    loading.style.display = 'none';
    emptyState.style.display = 'block';
    console.error('Error loading notes:', error);
  }
}

/**
 * Delete a note by ID. Shows a confirmation dialog first.
 * @param {string} noteId - MongoDB _id of the note to delete
 */
async function deleteNote(noteId) {
  // Confirm deletion using a styled modal
  const confirmed = confirm('Are you sure you want to delete this note? This action cannot be undone.');

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();

    if (data.success) {
      // Reload notes after successful delete
      loadMyNotes();
    } else {
      alert(data.message || 'Failed to delete note.');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
    console.error('Delete error:', error);
  }
}
