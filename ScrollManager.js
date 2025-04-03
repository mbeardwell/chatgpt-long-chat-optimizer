import { CONFIG } from './config.js';

/**
 * Manages scroll events and related UI updates for the chat conversation.
 */
export class ScrollManager {
  /**
   * @param {VirtualChatManager} chatManager - Manages message caching and DOM updates.
   * @param {ScrollButton} scrollButton - Custom scroll button instance.
   * @param {OverlayUI} [overlayUI=null] - Optional overlay UI for debug stats.
   */
  constructor(chatManager, scrollButton, overlayUI = null) {
    this.chatManager = chatManager;
    this.scrollButton = scrollButton;
    this.overlayUI = overlayUI;

    this.container = null;       // The conversation container element
    this.lastScrollTop = 0;      // Stores the last known scroll position
    this.scrollHandler = this.onScroll.bind(this);
  }

  /**
   * Attaches the scroll event listener to the conversation container.
   * Retries every second if the container is not found.
   */
  attach() {
    this.container = this.chatManager.getContainer();
    if (!this.container) {
      console.warn('[ScrollManager] Container not found. Retrying...');
      setTimeout(() => this.attach(), 1000);
      return;
    }

    this.container.addEventListener('scroll', this.scrollHandler);
    if (CONFIG.DEBUG) console.log('[ScrollManager] Scroll event attached.');
  }

  /**
   * Handles scroll events by extending the visible window if needed,
   * updating the scroll button visibility, and updating the overlay stats.
   */
  onScroll() {
    if (!this.container || window.disableAutoScroll) return;

    const scrollTop = this.container.scrollTop;
    const clientHeight = this.container.clientHeight;
    const scrollHeight = this.container.scrollHeight;
    const scrollingUp = scrollTop < this.lastScrollTop;
    this.lastScrollTop = scrollTop;

    const topTrigger = scrollTop < CONFIG.TOP_THRESHOLD;
    const dynamicBottomThreshold = clientHeight * CONFIG.DYNAMIC_BOTTOM_RATIO;

    if (CONFIG.DEBUG) {
      console.log(`[ScrollManager] ScrollTop: ${scrollTop}, Up: ${scrollingUp}, TopTrigger: ${topTrigger}`);
    }

    if (scrollingUp && topTrigger) {
      const extended = this.chatManager.extendWindowBackward();
      if (extended) {
        this.chatManager.resyncDOM(this.container);
      }
    }

    this.scrollButton.updateVisibility();

    if (this.overlayUI) {
      this.overlayUI.update({
        ...this.chatManager.getLoadedStats(),
        scrollTop,
        clientHeight,
        scrollHeight,
      });
    }
  }

  /**
   * Forces the container to scroll to the bottom by incrementally adjusting scrollTop.
   * Uses an interval that clears after reaching the bottom or after a maximum number of attempts.
   * @param {Element} container - The container element (defaults to the one from chatManager).
   */
  forceScrollToBottom(container = this.chatManager.getContainer()) {
    if (!container) return;

    window.disableAutoScroll = true;
    let attempts = 0;
    const maxAttempts = 10;

    if (this.scrollIntervalId) clearInterval(this.scrollIntervalId);
    this.scrollIntervalId = setInterval(() => {
      attempts++;
      const lastChild = container.lastElementChild;
      if (!lastChild || attempts >= maxAttempts) {
        clearInterval(this.scrollIntervalId);
        this.scrollIntervalId = null;
        window.disableAutoScroll = false;
        return;
      }

      const containerRect = container.getBoundingClientRect();
      const childRect = lastChild.getBoundingClientRect();
      const offset = childRect.bottom - containerRect.bottom;

      if (CONFIG.DEBUG) {
        console.log(`[ScrollManager] Scroll attempt ${attempts}: offset=${offset.toFixed(2)}`);
      }

      if (offset > 5) {
        container.scrollTop += offset;
      } else {
        clearInterval(this.scrollIntervalId);
        this.scrollIntervalId = null;
        window.disableAutoScroll = false;
      }
    }, 100);
  }
}
