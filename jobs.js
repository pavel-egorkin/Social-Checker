// Jobs page script
let allJobs = [];
let filteredJobs = [];
let currentView = 'grid';

// Load jobs on page load
document.addEventListener('DOMContentLoaded', () => {
  loadJobs();
  setupEventListeners();
});

// Setup event listeners
function setupEventListeners() {
  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('locationFilter').addEventListener('change', applyFilters);
  document.getElementById('sortFilter').addEventListener('change', applyFilters);
  document.getElementById('newOnlyFilter').addEventListener('change', applyFilters);

  document.getElementById('clearFiltersBtn').addEventListener('click', clearFilters);
  document.getElementById('refreshBtn').addEventListener('click', loadJobs);
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  document.getElementById('gridViewBtn').addEventListener('click', () => {
    setView('grid');
  });

  document.getElementById('listViewBtn').addEventListener('click', () => {
    setView('list');
  });
}

// Load jobs from storage
async function loadJobs() {
  try {
    const data = await chrome.storage.local.get(['seenJobDetails']);
    allJobs = data.seenJobDetails || [];

    // Update total count
    document.getElementById('totalCount').textContent = allJobs.length;
    document.getElementById('totalJobsCount').textContent = allJobs.length;

    // Populate location filter
    populateLocationFilter();

    // Apply filters and render
    applyFilters();
  } catch (error) {
    console.error('Error loading jobs:', error);
    renderEmptyState('Error loading jobs. Please try again.');
  }
}

// Populate location filter dropdown
function populateLocationFilter() {
  const locations = [...new Set(allJobs.map(job => job.location))].sort();
  const locationFilter = document.getElementById('locationFilter');

  // Keep current selection
  const currentValue = locationFilter.value;

  // Clear and rebuild options
  locationFilter.innerHTML = '<option value="">All Locations</option>';
  locations.forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    locationFilter.appendChild(option);
  });

  // Restore selection if it still exists
  if (currentValue && locations.includes(currentValue)) {
    locationFilter.value = currentValue;
  }
}

// Apply all filters
function applyFilters() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const locationFilter = document.getElementById('locationFilter').value;
  const newOnlyFilter = document.getElementById('newOnlyFilter').checked;
  const sortBy = document.getElementById('sortFilter').value;

  // Filter jobs
  filteredJobs = allJobs.filter(job => {
    // Search filter
    const matchesSearch = !searchTerm ||
      job.title.toLowerCase().includes(searchTerm) ||
      job.company.toLowerCase().includes(searchTerm);

    // Location filter
    const matchesLocation = !locationFilter || job.location === locationFilter;

    // New jobs filter
    const matchesNewOnly = !newOnlyFilter || isRecentlyNotified(job.notifiedAt);

    return matchesSearch && matchesLocation && matchesNewOnly;
  });

  // Sort jobs
  sortJobs(filteredJobs, sortBy);

  // Update visible count
  document.getElementById('visibleCount').textContent = filteredJobs.length;

  // Render
  renderJobs();
}

// Sort jobs based on criteria
function sortJobs(jobs, sortBy) {
  switch (sortBy) {
    case 'newest':
      jobs.sort((a, b) => new Date(b.notifiedAt) - new Date(a.notifiedAt));
      break;
    case 'oldest':
      jobs.sort((a, b) => new Date(a.notifiedAt) - new Date(b.notifiedAt));
      break;
    case 'title':
      jobs.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case 'company':
      jobs.sort((a, b) => a.company.localeCompare(b.company));
      break;
  }
}

// Clear all filters
function clearFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('locationFilter').value = '';
  document.getElementById('sortFilter').value = 'newest';
  document.getElementById('newOnlyFilter').checked = false;
  applyFilters();
}

// Set view mode
function setView(view) {
  currentView = view;
  const container = document.getElementById('jobsContainer');
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');

  if (view === 'grid') {
    container.classList.remove('list-view');
    container.classList.add('grid-view');
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
  } else {
    container.classList.remove('grid-view');
    container.classList.add('list-view');
    gridBtn.classList.remove('active');
    listBtn.classList.add('active');
  }
}

// Render jobs
function renderJobs() {
  const container = document.getElementById('jobsContainer');

  if (filteredJobs.length === 0) {
    const hasFilters = document.getElementById('searchInput').value ||
                      document.getElementById('locationFilter').value ||
                      document.getElementById('newOnlyFilter').checked;

    if (hasFilters) {
      renderEmptyState('No jobs match your filters. Try adjusting your search criteria.');
    } else if (allJobs.length === 0) {
      renderEmptyState('No jobs tracked yet. Click "Refresh" or wait for the extension to check LinkedIn.');
    } else {
      renderEmptyState('No jobs found.');
    }
    return;
  }

  container.innerHTML = filteredJobs.map(job => createJobCard(job)).join('');

  // Add click handlers
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      const url = card.getAttribute('data-url');
      chrome.tabs.create({ url });
    });
  });
}

// Create job card HTML
function createJobCard(job) {
  const notifiedTime = formatTimeAgo(job.notifiedAt);
  const postedTime = formatTimeAgo(job.postedDate);
  const isNew = job.isNew && isRecentlyNotified(job.notifiedAt);

  return `
    <div class="job-card${isNew ? ' new' : ''}" data-url="${job.url}">
      <div class="job-header">
        <h3 class="job-title">${escapeHtml(job.title)}</h3>
        ${isNew ? '<span class="new-badge">New</span>' : ''}
      </div>
      <div class="job-company">${escapeHtml(job.company)}</div>
      <div class="job-meta">
        <div class="job-meta-item">
          📍 ${escapeHtml(job.location)}
        </div>
        <div class="job-meta-item">
          📅 Posted ${postedTime}
        </div>
      </div>
      <div class="job-footer">
        <div class="job-time">Found ${notifiedTime}</div>
      </div>
    </div>
  `;
}

// Render empty state
function renderEmptyState(message) {
  const container = document.getElementById('jobsContainer');
  container.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">💼</div>
      <div class="empty-state-title">No Jobs Found</div>
      <div class="empty-state-text">${message}</div>
      ${allJobs.length === 0 ? '<button id="checkNowBtn" class="button">Check for Jobs Now</button>' : ''}
    </div>
  `;

  // Add handler for check now button if present
  const checkNowBtn = document.getElementById('checkNowBtn');
  if (checkNowBtn) {
    checkNowBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'checkNow' }, () => {
        setTimeout(loadJobs, 3000); // Reload after 3 seconds
      });
    });
  }
}

// Format time ago
function formatTimeAgo(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMinutes = Math.floor((now - date) / 60000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks === 1) return '1 week ago';
  if (diffWeeks < 4) return `${diffWeeks} weeks ago`;

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths === 1) return '1 month ago';
  return `${diffMonths} months ago`;
}

// Check if recently notified
function isRecentlyNotified(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);
  return diffHours < 24;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
