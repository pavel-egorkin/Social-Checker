// Popup script
document.addEventListener('DOMContentLoaded', async () => {
  // Load stats
  loadStats();

  // Check now button
  document.getElementById('checkNow').addEventListener('click', async () => {
    const button = document.getElementById('checkNow');
    const status = document.getElementById('checkStatus');

    button.disabled = true;
    button.textContent = 'Checking...';
    status.style.display = 'block';
    status.textContent = 'Checking LinkedIn for new jobs...';

    chrome.runtime.sendMessage({ action: 'checkNow' }, (response) => {
      button.disabled = false;
      button.textContent = 'Check Now';
      status.textContent = 'Check complete!';

      setTimeout(() => {
        status.style.display = 'none';
        loadStats();
      }, 2000);
    });
  });

  // Open options button
  document.getElementById('openOptions').addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  });

  // View all jobs link
  document.getElementById('viewAllJobsLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('jobs.html') });
  });

  // View all hint link
  document.getElementById('viewAllHintLink').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.tabs.create({ url: chrome.runtime.getURL('jobs.html') });
  });
});

async function loadStats() {
  chrome.runtime.sendMessage({ action: 'getStats' }, (response) => {
    document.getElementById('jobCount').textContent = response.jobCount;

    if (response.lastCheck === 'Never') {
      document.getElementById('lastCheck').textContent = 'Never';
    } else {
      const lastCheck = new Date(response.lastCheck);
      const now = new Date();
      const diffMinutes = Math.floor((now - lastCheck) / 60000);

      if (diffMinutes < 1) {
        document.getElementById('lastCheck').textContent = 'Just now';
      } else if (diffMinutes < 60) {
        document.getElementById('lastCheck').textContent = `${diffMinutes}m ago`;
      } else {
        const diffHours = Math.floor(diffMinutes / 60);
        document.getElementById('lastCheck').textContent = `${diffHours}h ago`;
      }
    }

    // Render jobs list
    renderJobsList(response.jobs || []);
  });
}

function renderJobsList(jobs) {
  const jobsList = document.getElementById('jobsList');
  const jobsCount = document.getElementById('jobsCount');

  if (jobs.length === 0) {
    jobsList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">💼</div>
        <div class="empty-state-text">No jobs tracked yet</div>
        <div class="empty-state-hint">Click "Check Now" to find jobs</div>
      </div>
    `;
    jobsCount.textContent = '0 jobs';
    return;
  }

  // Sort jobs by notification time (most recent first)
  const sortedJobs = [...jobs].sort((a, b) => {
    return new Date(b.notifiedAt) - new Date(a.notifiedAt);
  });

  // Show only the 5 most recent jobs in popup
  const recentJobs = sortedJobs.slice(0, 5);

  jobsCount.textContent = `${jobs.length} job${jobs.length === 1 ? '' : 's'}`;

  jobsList.innerHTML = recentJobs.map(job => {
    const notifiedTime = formatTimeAgo(job.notifiedAt);
    const isNew = job.isNew && isRecentlyNotified(job.notifiedAt);

    return `
      <div class="job-card${isNew ? ' new' : ''}" data-url="${job.url}">
        ${isNew ? '<span class="new-badge">New</span>' : ''}
        <div class="job-title">${escapeHtml(job.title)}</div>
        <div class="job-company">${escapeHtml(job.company)}</div>
        <div class="job-meta">
          <div class="job-meta-item">📍 ${escapeHtml(job.location)}</div>
        </div>
        <div class="job-time">Found ${notifiedTime}</div>
      </div>
    `;
  }).join('');

  // Show/hide "view all" hint
  const viewAllHint = document.getElementById('viewAllHint');
  if (jobs.length > 5) {
    viewAllHint.style.display = 'block';
  } else {
    viewAllHint.style.display = 'none';
  }

  // Add click handlers to job cards
  document.querySelectorAll('.job-card').forEach(card => {
    card.addEventListener('click', () => {
      const url = card.getAttribute('data-url');
      chrome.tabs.create({ url });
    });
  });
}

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
  return `${diffWeeks} weeks ago`;
}

function isRecentlyNotified(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffHours = (now - date) / (1000 * 60 * 60);
  return diffHours < 24; // Consider "new" if notified within last 24 hours
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
