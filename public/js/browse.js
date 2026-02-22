// ============================================
// Browse Notes Page – JavaScript Logic
// Handles fetching, searching, filtering, and pagination
// ============================================

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
  updateNav();

  // Check for subject filter in URL query params (e.g., ?subject=Physics)
  const urlParams = new URLSearchParams(window.location.search);
  const subjectParam = urlParams.get('subject');

  if (subjectParam) {
    // Set the filter dropdown to the URL parameter
    const subjectFilter = document.getElementById('subjectFilter');
    if (subjectFilter) {
      subjectFilter.value = subjectParam;
    }
    loadNotes(1, subjectParam);
  } else {
    loadAllNotes();
  }

  // Enter key triggers search
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      searchNotes();
    }
  });
});

/**
 * Load all notes with optional subject filter and pagination.
 * @param {number} page - Page number (default: 1)
 * @param {string} subject - Subject filter (default: 'All')
 */
async function loadNotes(page = 1, subject = 'All') {
  const notesGrid = document.getElementById('notesGrid');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('emptyState');
  const resultsInfo = document.getElementById('resultsInfo');
  const pagination = document.getElementById('pagination');

  // Show loading, hide others
  notesGrid.innerHTML = '';
  loading.style.display = 'block';
  emptyState.style.display = 'none';
  pagination.innerHTML = '';

  try {
    // Build API URL with query params
    let url = `/api/notes?page=${page}&limit=12`;
    if (subject && subject !== 'All') {
      url += `&subject=${encodeURIComponent(subject)}`;
    }

    const res = await fetch(url);
    const data = await res.json();

    loading.style.display = 'none';

    if (data.success && data.notes.length > 0) {
      // Show results info
      resultsInfo.textContent = `Showing ${data.notes.length} of ${data.total} notes${subject !== 'All' ? ` in "${subject}"` : ''}`;

      // Render note cards
      data.notes.forEach(note => {
        notesGrid.innerHTML += createNoteCard(note);
      });

      // Render pagination
      renderPagination(data.currentPage, data.totalPages, subject);
    } else {
      // No results
      emptyState.style.display = 'block';
      resultsInfo.textContent = '';
    }
  } catch (error) {
    loading.style.display = 'none';
    emptyState.style.display = 'block';
    console.error('Error loading notes:', error);
  }
}

/**
 * Load all notes (reset filters).
 */
function loadAllNotes() {
  document.getElementById('subjectFilter').value = 'All';
  document.getElementById('searchInput').value = '';
  loadNotes(1, 'All');
}

/**
 * Filter notes by the selected subject from the dropdown.
 */
function filterBySubject() {
  const subject = document.getElementById('subjectFilter').value;
  document.getElementById('searchInput').value = ''; // Clear search
  loadNotes(1, subject);
}

/**
 * Search notes by keyword entered in the search input.
 */
async function searchNotes() {
  const query = document.getElementById('searchInput').value.trim();
  const notesGrid = document.getElementById('notesGrid');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('emptyState');
  const resultsInfo = document.getElementById('resultsInfo');
  const pagination = document.getElementById('pagination');

  if (!query) {
    loadAllNotes();
    return;
  }

  // Reset filter dropdown
  document.getElementById('subjectFilter').value = 'All';

  // Show loading
  notesGrid.innerHTML = '';
  loading.style.display = 'block';
  emptyState.style.display = 'none';
  pagination.innerHTML = '';

  try {
    const res = await fetch(`/api/notes/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();

    loading.style.display = 'none';

    if (data.success && data.notes.length > 0) {
      resultsInfo.textContent = `Found ${data.count} result(s) for "${query}"`;

      data.notes.forEach(note => {
        notesGrid.innerHTML += createNoteCard(note);
      });
    } else {
      emptyState.style.display = 'block';
      resultsInfo.textContent = `No results for "${query}"`;
    }
  } catch (error) {
    loading.style.display = 'none';
    emptyState.style.display = 'block';
    console.error('Search error:', error);
  }
}

/**
 * Render pagination buttons.
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {string} subject - Current subject filter
 */
function renderPagination(currentPage, totalPages, subject) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (totalPages <= 1) return;

  // Previous button
  if (currentPage > 1) {
    pagination.innerHTML += `<button class="page-btn" onclick="loadNotes(${currentPage - 1}, '${subject}')">
      <i class="fas fa-chevron-left"></i> Prev
    </button>`;
  }

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    // Show first page, last page, and pages near current
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pagination.innerHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" 
        onclick="loadNotes(${i}, '${subject}')">${i}</button>`;
    } else if (i === currentPage - 2 || i === currentPage + 2) {
      pagination.innerHTML += `<span class="page-btn" style="border: none; cursor: default;">...</span>`;
    }
  }

  // Next button
  if (currentPage < totalPages) {
    pagination.innerHTML += `<button class="page-btn" onclick="loadNotes(${currentPage + 1}, '${subject}')">
      Next <i class="fas fa-chevron-right"></i>
    </button>`;
  }
}
