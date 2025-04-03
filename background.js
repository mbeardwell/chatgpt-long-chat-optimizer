import { ACTIONS } from './actions.js';

/**
 * Command handlers for the background service worker.
 */
const commandHandlers = {
  [ACTIONS.TOGGLE_DEBUG_OVERLAY]: () => {
    // Query the active tab in the current window.
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        console.warn('[Background] No active tab found to send debug overlay toggle.');
        return;
      }
      // Send a message to toggle the debug overlay.
      chrome.tabs.sendMessage(tabId, { action: ACTIONS.TOGGLE_DEBUG_OVERLAY }, (res) => {
        if (chrome.runtime.lastError) {
          console.error('[Background] Failed to send message:', chrome.runtime.lastError.message);
        } else {
          console.log('[Background] Toggled debug overlay via message.');
        }
      });
    });
  },
};

console.log('[Background] Service worker loaded');

// Listen for commands and dispatch to the appropriate handler.
chrome.commands.onCommand.addListener((command) => {
  if (command in commandHandlers) {
    commandHandlers[command]();
  } else {
    console.warn(`[Background] Unknown command: ${command}`);
  }
});
