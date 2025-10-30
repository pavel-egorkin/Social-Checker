// Content script that runs on LinkedIn job search pages
// This helps extract job information when background script opens pages

console.log('LinkedIn Job Tracker content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'extractJobs') {
    const jobs = extractJobs();
    sendResponse({ jobs });
  }
});

function extractJobs() {
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
        const href = linkElement.href;

        // Extract job ID from data attribute or URL
        const jobId = card.getAttribute('data-occludable-job-id') ||
                      href.match(/\/view\/(\d+)/)?.[1] ||
                      href.match(/currentJobId=(\d+)/)?.[1] ||
                      href;

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
          url: href.split('?')[0],
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
