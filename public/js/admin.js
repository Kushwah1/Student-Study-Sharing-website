// ============================================
// Admin Panel – JavaScript Logic
// Handles stats, user management, and notes management
// ============================================

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  updateNav();

  // Redirect non-admin users
  const user = getUser();
  if (!getToken() || !user || user.role !== 'admin') {
    window.location.href = 'login.html';
    return;
  }

  // Load admin dashboard data
  loadAdminStats();
  loadAdminUsers();
  loadAdminNotes();
});

/**
 * Switch between Users and Notes tab panels.
 * @param {string} tab - 'users' or 'notes'
 */
function switchTab(tab) {
  const usersPanel = document.getElementById('usersPanel');
  const notesPanel = document.getElementById('notesPanel');
  const tabBtns = document.querySelectorAll('.tab-btn');

  // Update active tab button
  tabBtns.forEach(btn => btn.classList.remove('active'));
  event.target.closest('.tab-btn').classList.add('active');

  // Show/hide panels
  if (tab === 'users') {
    usersPanel.style.display = 'block';
    notesPanel.style.display = 'none';
  } else {
    usersPanel.style.display = 'none';
    notesPanel.style.display = 'block';
  }
}

/**
 * Load admin dashboard statistics (total users, notes, downloads).
 */
async function loadAdminStats() {
  try {
    const res = await fetch('/api/admin/stats', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();

    if (data.success) {
      document.getElementById('totalUsers').textContent = data.stats.totalUsers;
      document.getElementById('totalNotes').textContent = data.stats.totalNotes;
      document.getElementById('totalDownloads').textContent = data.stats.totalDownloads;
    }
  } catch (error) {
    console.error('Error loading admin stats:', error);
  }
}

/**
 * Load all users into the admin users table.
 */
async function loadAdminUsers() {
  const tbody = document.getElementById('usersTableBody');
  const loading = document.getElementById('usersLoading');

  tbody.innerHTML = '';
  loading.style.display = 'block';

  try {
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();
    loading.style.display = 'none';

    if (data.success && data.users.length > 0) {
      data.users.forEach(user => {
        const roleClass = user.role === 'admin' ? 'role-admin' : 'role-user';
        const currentUser = getUser();
        const isCurrentUser = currentUser && currentUser.id === user.id;

        tbody.innerHTML += `
          <tr>
            <td><strong>${escapeHtml(user.name)}</strong></td>
            <td>${escapeHtml(user.email)}</td>
            <td><span class="role-badge ${roleClass}">${user.role}</span></td>
            <td>${user.noteCount}</td>
            <td>${formatDate(user.createdAt)}</td>
            <td>
              ${isCurrentUser ? 
                '<span class="text-muted" style="font-size: 0.8rem;">You</span>' : 
                `<button class="btn btn-danger btn-sm" onclick="deleteUser('${user.id}', '${escapeHtml(user.name)}')">
                  <i class="fas fa-trash"></i> Delete
                </button>`
              }
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found</td></tr>';
    }
  } catch (error) {
    loading.style.display = 'none';
    console.error('Error loading users:', error);
  }
}

/**
 * Load all notes into the admin notes table.
 */
async function loadAdminNotes() {
  const tbody = document.getElementById('notesTableBody');
  const loading = document.getElementById('notesLoading');

  tbody.innerHTML = '';
  loading.style.display = 'block';

  try {
    const res = await fetch('/api/admin/notes', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();
    loading.style.display = 'none';

    if (data.success && data.notes.length > 0) {
      data.notes.forEach(note => {
        const uploaderName = note.uploadedBy ? note.uploadedBy.name : 'Deleted User';

        tbody.innerHTML += `
          <tr>
            <td><strong>${escapeHtml(note.title)}</strong></td>
            <td><span class="note-card-subject">${escapeHtml(note.subject)}</span></td>
            <td>${escapeHtml(uploaderName)}</td>
            <td>${formatFileSize(note.fileSize)}</td>
            <td>${note.downloads || 0}</td>
            <td>${formatDate(note.createdAt)}</td>
            <td>
              <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                <a href="/api/notes/download/${note._id}" class="btn btn-primary btn-sm">
                  <i class="fas fa-download"></i>
                </a>
                <button class="btn btn-danger btn-sm" onclick="deleteAdminNote('${note._id}', '${escapeHtml(note.title)}')">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      });
    } else {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No notes found</td></tr>';
    }
  } catch (error) {
    loading.style.display = 'none';
    console.error('Error loading notes:', error);
  }
}

/**
 * Delete a user by ID (admin action). Also deletes their notes.
 * @param {string} userId - The user's MongoDB _id
 * @param {string} userName - The user's name (for confirmation message)
 */
async function deleteUser(userId, userName) {
  const confirmed = confirm(`Are you sure you want to delete user "${userName}"?\nThis will also delete all their uploaded notes.`);

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/users/${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();

    if (data.success) {
      alert(data.message);
      // Reload all data
      loadAdminStats();
      loadAdminUsers();
      loadAdminNotes();
    } else {
      alert(data.message || 'Failed to delete user.');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
    console.error('Delete user error:', error);
  }
}

/**
 * Delete a note by ID (admin action).
 * @param {string} noteId - The note's MongoDB _id
 * @param {string} noteTitle - The note's title (for confirmation message)
 */
async function deleteAdminNote(noteId, noteTitle) {
  const confirmed = confirm(`Are you sure you want to delete the note "${noteTitle}"?`);

  if (!confirmed) return;

  try {
    const res = await fetch(`/api/admin/notes/${noteId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });

    const data = await res.json();

    if (data.success) {
      alert('Note deleted successfully.');
      // Reload data
      loadAdminStats();
      loadAdminNotes();
    } else {
      alert(data.message || 'Failed to delete note.');
    }
  } catch (error) {
    alert('Connection error. Please try again.');
    console.error('Delete note error:', error);
  }
}
