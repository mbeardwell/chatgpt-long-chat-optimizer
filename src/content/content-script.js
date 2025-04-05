import { CONFIG } from '@config/config';
import { ACTIONS } from '@config/actions';
import { VERSION, SELECTORS } from '@config/constants';

import { VirtualChatManager } from '@managers/VirtualChatManager';
import { ScrollManager } from '@managers/ScrollManager';
import { LifeCycleManager } from '@managers/LifeCycleManager';

import { ScrollButton } from '@components/ScrollButton';
import { OverlayUI } from '@components/OverlayUI';

import { MutationWatcher } from '@content/MutationWatcher';

import { Logger } from '@utils/utils';

Logger.debug('ChatGPT Long Chat Optimizer', `Loaded v${VERSION}`);

let lifeCycleManager, chatManager, scrollButton, scrollManager, overlay;

/**
 * Waits for the chat container to appear in the DOM.
 * Resolves as soon as the container element exists — even if no messages are loaded yet.
 * This supports "new chat" pages where no conversation-turn nodes are present initially.
 *
 * @returns {Promise<Element>} Resolves with the container element.
 */
function waitForContainer() {
  return new Promise((resolve) => {
    /**
     * Tries to locate the chat container using known selectors.
     * If found, resolves immediately.
     */
    const tryFind = () => {
      const container =
        document.querySelector(SELECTORS.CONVERSATION_TURN)?.parentElement ||
        document.querySelector(SELECTORS.CHAT_CONTAINER);

      if (container) {
        resolve(container);
        return true;
      }

      return false;
    };

    // Try immediately before falling back to mutation-based detection
    if (tryFind()) return;

    // Use a MutationObserver to watch for container appearance
    const observer = new MutationObserver(() => {
      if (tryFind()) observer.disconnect();
    });

    observer.observe(document.body, { childList: true, subtree: true });
  });
}

/**
 * Initializes the virtualizer by creating module instances,
 * rebuilding caches, and setting up event listeners.
 */
async function initVirtualization() {
  Logger.debug('content-script', 'initVirtualization called');

  chatManager = new VirtualChatManager();

  if (CONFIG.DEBUG && CONFIG.OVERLAY_ENABLED) {
    overlay = new OverlayUI();
    lifeCycleManager.register(() => overlay.destory());
  } else {
    overlay = null;
  }

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
function setupURLWatcher() {
  lifeCycleManager.cleanupAll();

  let currentUrl = window.location.href;
  const checkURL = () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      Logger.debug('content-script', 'URL changed. Reinitializing.');
      setupChatVirtualization();
    }
  }

  // Periodically check - catches pushstate and replacestate
  const timerID = setInterval(checkURL, 1000);

  // Also listen to popstate (back/forward buttons)
  window.addEventListener('popstate', checkURL);

  return () => {
    clearInterval(timerID);
    window.removeEventListener('popstate', checkURL);
  }
}

/**
 * Sets up a message handler to listen for commands from the background.
 */
function setupMessageHandler() {
  const handleMessages = (message) => {
    Logger.debug('content-script', 'Message received:', message);
    if (message.action === ACTIONS.TOGGLE_DEBUG_OVERLAY && overlay) {
      overlay.toggle();
      overlay.update(chatManager.getLoadedStats());
    }
  }
  chrome.runtime.onMessage.addListener(handleMessages);

  return () => {
    chrome.runtime.onMessage.removeListener(handleMessages);
  }
}

function setupChatVirtualization() {
  waitForContainer()
    .then(() => {
      Logger.debug('content-script', 'waitForContainer resolved');
      initVirtualization();

      const mutationWatcher = new MutationWatcher(chatManager, overlay);
      mutationWatcher.start();
      lifeCycleManager.register(() => mutationWatcher.stop());

      const stopMessageHandler = setupMessageHandler();
      lifeCycleManager.register(stopMessageHandler);
    })
    .catch(err => Logger.error('content-script', 'Initialization failed:', err));
}

lifeCycleManager = new LifeCycleManager();

setupURLWatcher();
setupChatVirtualization();
