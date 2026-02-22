// ============================================
// Auth Utilities – Shared Authentication Logic
// Used across all pages for login state management
// ============================================

/**
 * Get the JWT token from localStorage.
 * @returns {string|null} The token or null
 */
function getToken() {
  return localStorage.getItem('token');
}

/**
 * Get the current user object from localStorage.
 * @returns {object|null} The user object or null
 */
function getUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

/**
 * Build the Authorization header with the JWT token.
 * @returns {object} Headers object with Bearer token
 */
function authHeaders() {
  return {
    'Authorization': `Bearer ${getToken()}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Log the user out – clear localStorage and redirect to login page.
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

/**
 * Update the navigation bar based on the user's login state and role.
 * Shows/hides nav items: Dashboard, Admin, Login, Signup, Logout.
 */
function updateNav() {
  const user = getUser();
  const token = getToken();

  const navDashboard = document.getElementById('navDashboard');
  const navAdmin = document.getElementById('navAdmin');
  const navLogin = document.getElementById('navLogin');
  const navSignup = document.getElementById('navSignup');
  const navLogout = document.getElementById('navLogout');
  const heroSignup = document.getElementById('heroSignup');
  const ctaSignup = document.getElementById('ctaSignup');

  if (token && user) {
    // User is logged in
    if (navDashboard) navDashboard.style.display = 'block';
    if (navLogin) navLogin.style.display = 'none';
    if (navSignup) navSignup.style.display = 'none';
    if (navLogout) navLogout.style.display = 'block';

    // Show admin link only for admin users
    if (navAdmin) {
      navAdmin.style.display = user.role === 'admin' ? 'block' : 'none';
    }

    // Hide signup CTAs for logged-in users
    if (heroSignup) heroSignup.style.display = 'none';
    if (ctaSignup) ctaSignup.style.display = 'none';
  } else {
    // User is not logged in
    if (navDashboard) navDashboard.style.display = 'none';
    if (navAdmin) navAdmin.style.display = 'none';
    if (navLogin) navLogin.style.display = 'block';
    if (navSignup) navSignup.style.display = 'block';
    if (navLogout) navLogout.style.display = 'none';
  }

  // Mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }
}

/**
 * Show an alert message (success or error) in the specified container.
 * @param {HTMLElement} alertBox - The alert container element
 * @param {string} message - Message text
 * @param {string} type - 'success' or 'error'
 */
function showAlert(alertBox, message, type) {
  alertBox.textContent = message;
  alertBox.className = `alert alert-${type}`;
  alertBox.style.display = 'block';

  // Auto-hide after 5 seconds
  setTimeout(() => {
    alertBox.style.display = 'none';
  }, 5000);
}

/**
 * Toggle password visibility for a given input field.
 * @param {string} inputId - The id of the password input
 */
function togglePassword(inputId) {
  const input = document.getElementById(inputId);
  const icon = document.getElementById(inputId + 'ToggleIcon');

  if (input.type === 'password') {
    input.type = 'text';
    if (icon) icon.className = 'fas fa-eye-slash';
  } else {
    input.type = 'password';
    if (icon) icon.className = 'fas fa-eye';
  }
}

/**
 * Format file size from bytes to a human-readable string.
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "2.5 MB")
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format a date string to a readable format.
 * @param {string} dateStr - ISO date string
 * @returns {string} Formatted date (e.g., "Jan 15, 2026")
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * Get the icon class and CSS class for a given file type (MIME type).
 * @param {string} fileType - MIME type of the file
 * @returns {object} { icon, className } for the file type
 */
function getFileTypeInfo(fileType) {
  if (fileType.includes('pdf')) {
    return { icon: 'fas fa-file-pdf', className: 'note-type-pdf' };
  } else if (fileType.includes('word') || fileType.includes('document')) {
    return { icon: 'fas fa-file-word', className: 'note-type-doc' };
  } else if (fileType.includes('image')) {
    return { icon: 'fas fa-file-image', className: 'note-type-image' };
  } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
    return { icon: 'fas fa-file-powerpoint', className: 'note-type-ppt' };
  } else if (fileType.includes('sheet') || fileType.includes('excel')) {
    return { icon: 'fas fa-file-excel', className: 'note-type-xls' };
  } else {
    return { icon: 'fas fa-file-alt', className: 'note-type-txt' };
  }
}

/**
 * Create an HTML note card element.
 * @param {object} note - Note data object from API
 * @param {boolean} showDelete - Whether to show delete button
 * @returns {string} HTML string for the note card
 */
function createNoteCard(note, showDelete = false) {
  const typeInfo = getFileTypeInfo(note.fileType);
  const uploaderName = note.uploadedBy ? (note.uploadedBy.name || 'Unknown') : 'Unknown';

  return `
    <div class="note-card">
      <div class="note-card-header">
        <div class="note-type-icon ${typeInfo.className}">
          <i class="${typeInfo.icon}"></i>
        </div>
        <div>
          <h3 class="note-card-title">${escapeHtml(note.title)}</h3>
          <span class="note-card-subject">${escapeHtml(note.subject)}</span>
        </div>
      </div>
      <div class="note-card-body">
        <p class="note-card-desc">${escapeHtml(note.description)}</p>
      </div>
      <div class="note-card-meta">
        <span><i class="fas fa-user"></i> ${escapeHtml(uploaderName)}</span>
        <span><i class="fas fa-file"></i> ${formatFileSize(note.fileSize)}</span>
        <span><i class="fas fa-download"></i> ${note.downloads || 0}</span>
        <span><i class="fas fa-calendar"></i> ${formatDate(note.createdAt)}</span>
      </div>
      <div class="note-card-actions">
        <a href="/api/notes/download/${note._id}" class="btn btn-primary btn-sm">
          <i class="fas fa-download"></i> Download
        </a>
        ${showDelete ? `
          <button class="btn btn-danger btn-sm" onclick="deleteNote('${note._id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        ` : ''}
      </div>
    </div>
  `;
}

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}
