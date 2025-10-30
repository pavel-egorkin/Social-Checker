// Configuration
const CHECK_INTERVAL = 10; // minutes
const ALARM_NAME = 'jobCheck';

// Job search configuration
const CONFIG = {
  keywords: [
    'Senior Product Manager',
    'Product Ops',
    'Head of Staff'
  ],
  locations: ['Berlin', 'Germany'],
  experienceLevels: ['Senior level', 'Executive', 'Director'],
  remoteOptions: ['Remote', 'Hybrid']
};

// Initialize extension
chrome.runtime.onInstalled.addListener(async () => {
  console.log('LinkedIn Job Tracker installed');

  // Initialize storage
  const stored = await chrome.storage.local.get(['seenJobs', 'seenJobDetails', 'telegramToken', 'telegramChatId']);
  if (!stored.seenJobs) {
    await chrome.storage.local.set({ seenJobs: [], seenJobDetails: [] });
  }

  // Set up alarm for periodic checks
  chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: CHECK_INTERVAL
  });

  // Request notification permission
  if (Notification.permission !== 'granted') {
    console.log('Please enable notifications for this extension');
  }

  console.log(`Job checker will run every ${CHECK_INTERVAL} minutes`);
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    console.log('Running scheduled job check...');
    checkLinkedInJobs();
  }
});

// Manual check trigger from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'checkNow') {
    checkLinkedInJobs().then(() => {
      sendResponse({ success: true });
    });
    return true; // Keep channel open for async response
  } else if (request.action === 'getStats') {
    chrome.storage.local.get(['seenJobs', 'seenJobDetails', 'lastCheck']).then((data) => {
      sendResponse({
        jobCount: data.seenJobs?.length || 0,
        lastCheck: data.lastCheck || 'Never',
        jobs: data.seenJobDetails || []
      });
    });
    return true;
  }
});

// Main function to check LinkedIn jobs
async function checkLinkedInJobs() {
  try {
    console.log('Checking LinkedIn jobs...');

    // Build LinkedIn search URL
    const searchUrl = buildSearchUrl();
    console.log('Search URL:', searchUrl);

    // Open LinkedIn in a new tab (hidden approach)
    const tab = await chrome.tabs.create({ url: searchUrl, active: false });

    // Wait for page to load and extract jobs
    setTimeout(async () => {
      try {
        // Inject content script to extract job data
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: extractJobsFromPage
        });

        if (results && results[0] && results[0].result) {
          const jobs = results[0].result;
          await processJobs(jobs);
        }

        // Close the tab
        chrome.tabs.remove(tab.id);

        // Update last check time
        await chrome.storage.local.set({ lastCheck: new Date().toISOString() });
      } catch (error) {
        console.error('Error extracting jobs:', error);
        chrome.tabs.remove(tab.id);
      }
    }, 5000); // Wait 5 seconds for page to load

  } catch (error) {
    console.error('Error checking jobs:', error);
  }
}

// Build LinkedIn search URL
function buildSearchUrl() {
  const baseUrl = 'https://www.linkedin.com/jobs/search/';
  const params = new URLSearchParams({
    keywords: CONFIG.keywords.join(' OR '),
    location: 'Germany',
    f_WT: '2,3', // Remote and Hybrid
    f_TPR: 'r86400', // Posted in last 24 hours
    sortBy: 'DD' // Sort by date (most recent first)
  });

  return `${baseUrl}?${params.toString()}`;
}

// Function that runs in the page context to extract jobs
function extractJobsFromPage() {
  const jobs = [];
  const seenJobIds = new Set();

  // LinkedIn job card selectors - updated for current LinkedIn UI (2025)
  // Try multiple selectors as LinkedIn UI changes frequently
  const jobCards = document.querySelectorAll('li[data-occludable-job-id], .job-card-container, .job-card-list__entity-lockup, .jobs-search-results__list-item, .scaffold-layout__list-item');

  jobCards.forEach((card) => {
    try {
      // Try multiple title selectors
      const titleElement = card.querySelector('a.job-card-list__title, a[aria-label*="Product"], .job-card-container__link, .base-search-card__title, .job-card-list__title--link');

      // Try multiple company selectors
      const companyElement = card.querySelector('.job-card-container__primary-description, .job-card-container__company-name, .base-search-card__subtitle, .artdeco-entity-lockup__subtitle');

      // Try multiple location selectors
      const locationElement = card.querySelector('.job-card-container__metadata-item, .artdeco-entity-lockup__caption, .job-card-container__metadata-wrapper');

      // Link element - could be the title itself or a separate link
      const linkElement = titleElement || card.querySelector('a[href*="/jobs/view/"], a.job-card-container__link');

      const timeElement = card.querySelector('time');

      if (linkElement && linkElement.href) {
        // Extract job ID from data attribute or URL
        const jobId = card.getAttribute('data-occludable-job-id') ||
                      linkElement.href.match(/\/view\/(\d+)/)?.[1] ||
                      linkElement.href.match(/currentJobId=(\d+)/)?.[1] ||
                      linkElement.href;

        // Skip if we've already seen this job ID in this extraction
        if (seenJobIds.has(jobId)) {
          return;
        }
        seenJobIds.add(jobId);

        const job = {
          id: jobId,
          title: (titleElement?.textContent || linkElement.textContent || 'Unknown').trim(),
          company: companyElement?.textContent.trim() || 'Unknown',
          location: locationElement?.textContent.trim() || 'Unknown',
          url: linkElement.href.split('?')[0],
          postedDate: timeElement?.getAttribute('datetime') || new Date().toISOString(),
          extractedAt: new Date().toISOString()
        };

        jobs.push(job);
      }
    } catch (error) {
      console.error('Error parsing job card:', error);
    }
  });

  return jobs;
}

// Process extracted jobs
async function processJobs(jobs) {
  console.log(`Found ${jobs.length} jobs`);

  if (jobs.length === 0) {
    return;
  }

  // Get seen jobs from storage
  const { seenJobs = [], seenJobDetails = [] } = await chrome.storage.local.get(['seenJobs', 'seenJobDetails']);

  // Filter new jobs
  const newJobs = jobs.filter(job => !seenJobs.includes(job.id));

  console.log(`${newJobs.length} new jobs found`);

  // Notify about new jobs
  for (const job of newJobs) {
    await notifyJob(job);
    seenJobs.push(job.id);
    seenJobDetails.push({
      ...job,
      notifiedAt: new Date().toISOString(),
      isNew: true
    });
  }

  // Update storage (keep last 100 jobs to avoid storage bloat)
  await chrome.storage.local.set({
    seenJobs: seenJobs.slice(-100),
    seenJobDetails: seenJobDetails.slice(-100)
  });
}

// Send notification
async function notifyJob(job) {
  // Desktop notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'New LinkedIn Job!',
    message: `${job.title}\n${job.company}\n${job.location}`,
    buttons: [
      { title: 'View Job' }
    ],
    requireInteraction: true
  }, (notificationId) => {
    // Store job URL for the notification
    chrome.storage.local.set({ [`notification_${notificationId}`]: job.url });
  });

  // Telegram notification
  await sendTelegramNotification(job);
}

// Send Telegram notification
async function sendTelegramNotification(job) {
  try {
    const { telegramToken, telegramChatId } = await chrome.storage.local.get(['telegramToken', 'telegramChatId']);

    if (!telegramToken || !telegramChatId) {
      console.log('Telegram not configured');
      return;
    }

    const message = `🎯 *New LinkedIn Job*\n\n*${job.title}*\n${job.company}\n📍 ${job.location}\n\n[View Job](${job.url})`;

    const response = await fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: message,
        parse_mode: 'Markdown',
        disable_web_page_preview: false
      })
    });

    if (response.ok) {
      console.log('Telegram notification sent');
    } else {
      console.error('Telegram error:', await response.text());
    }
  } catch (error) {
    console.error('Error sending Telegram notification:', error);
  }
}

// Handle notification clicks
chrome.notifications.onClicked.addListener(async (notificationId) => {
  const key = `notification_${notificationId}`;
  const data = await chrome.storage.local.get(key);
  const url = data[key];

  if (url) {
    chrome.tabs.create({ url });
    chrome.notifications.clear(notificationId);
    chrome.storage.local.remove(key);
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // View Job button
    const key = `notification_${notificationId}`;
    const data = await chrome.storage.local.get(key);
    const url = data[key];

    if (url) {
      chrome.tabs.create({ url });
      chrome.notifications.clear(notificationId);
      chrome.storage.local.remove(key);
    }
  }
});
