// Options page script
document.addEventListener('DOMContentLoaded', async () => {
  // Load existing settings
  const { telegramToken, telegramChatId } = await chrome.storage.local.get(['telegramToken', 'telegramChatId']);

  if (telegramToken) {
    document.getElementById('telegramToken').value = telegramToken;
  }

  if (telegramChatId) {
    document.getElementById('telegramChatId').value = telegramChatId;
  }

  // Save Telegram settings
  document.getElementById('saveTelegram').addEventListener('click', async () => {
    const token = document.getElementById('telegramToken').value.trim();
    const chatId = document.getElementById('telegramChatId').value.trim();

    await chrome.storage.local.set({
      telegramToken: token,
      telegramChatId: chatId
    });

    // Show success message
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';

    setTimeout(() => {
      successMessage.style.display = 'none';
    }, 3000);
  });

  // Clear history
  document.getElementById('clearHistory').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear the job history? You will receive notifications for all matching jobs again.')) {
      await chrome.storage.local.set({ seenJobs: [], seenJobDetails: [] });
      alert('Job history cleared!');
    }
  });
});
