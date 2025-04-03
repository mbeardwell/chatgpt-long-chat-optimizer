import { CONFIG } from './config.js';
import { ACTIONS } from './actions.js';
import { VERSION } from './constants.js';
import { VirtualChatManager } from './VirtualChatManager.js';
import { ScrollButton } from './ScrollButton.js';
import { ScrollManager } from './ScrollManager.js';
import { OverlayUI } from './OverlayUI.js';
import { MutationWatcher } from './MutationWatcher.js';

console.log(`[ChatGPT Long Chat Optimizer] Loaded v${VERSION}`);

let chatManager, scrollButton, scrollManager, overlay;

/**
 * Waits indefinitely for the conversation container to appear in the DOM.
 * Resolves when an element matching the expected structure is found.
 * @returns {Promise<Element>} A promise that resolves with the container element.
 */
function waitForContainer() {
  return new Promise((resolve) => {
    // Attempt an initial query.
    let container = document.querySelector('article[data-testid^="conversation-turn"]')?.parentElement
      || document.querySelector('main');
    
    if (container && container.querySelectorAll('article[data-testid^="conversation-turn"]').length > 0) {
      resolve(container);
      return;
    }
    
    // If not found, observe the DOM for changes.
    const observer = new MutationObserver((mutations, obs) => {
      container = document.querySelector('article[data-testid^="conversation-turn"]')?.parentElement
        || document.querySelector('main');
      if (container && container.querySelectorAll('article[data-testid^="conversation-turn"]').length > 0) {
        obs.disconnect();
        resolve(container);
      }
    });
    
    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/**
 * Initializes the virtualizer by creating module instances,
 * rebuilding caches, and setting up event listeners.
 */
async function initVirtualization() {
  chatManager = new VirtualChatManager();
  overlay = CONFIG.DEBUG && CONFIG.OVERLAY_ENABLED ? new OverlayUI() : null;
  
  scrollButton = new ScrollButton(chatManager);
  scrollManager = new ScrollManager(chatManager, scrollButton, overlay);
  scrollButton.setScrollManager(scrollManager);

  chatManager.rebuildMessageCache();
  chatManager.updateWindowIndices();
  chatManager.resyncDOM();

  scrollButton.init();
  scrollManager.attach();

  if (CONFIG.DEBUG && CONFIG.OVERLAY_ENABLED) {
    overlay.init();
    overlay.update(chatManager.getLoadedStats());
  }
}

/**
 * Watches for URL changes and reinitializes the virtualizer when needed.
 */
function setupUrlWatcher() {
  let currentUrl = window.location.href;
  setInterval(() => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      console.log('[content-script] URL changed. Reinitializing.');
      
      chatManager = new VirtualChatManager();
      scrollButton = new ScrollButton(chatManager, scrollManager);
      scrollManager = new ScrollManager(chatManager, scrollButton, overlay);
      scrollButton.setScrollManager(scrollManager);
      
      waitForContainer().then(() => initVirtualization()).catch(console.error);
    }
  }, 1000);
}

/**
 * Sets up a message handler to listen for commands from the background.
 */
function setupMessageHandler() {
  chrome.runtime.onMessage.addListener((message) => {
    console.log("[content-script] Message received:", message);
    if (message.action === ACTIONS.TOGGLE_DEBUG_OVERLAY && overlay) {
      overlay.toggle();
    }
  });
}

// Main entry point: wait for the container, then initialize modules.
waitForContainer()
  .then(() => {
    initVirtualization();

    const mutationWatcher = new MutationWatcher(chatManager);
    mutationWatcher.start();

    setupUrlWatcher();
    setupMessageHandler();
  })
  .catch(err => console.error("[content-script] Initialization failed:", err));
