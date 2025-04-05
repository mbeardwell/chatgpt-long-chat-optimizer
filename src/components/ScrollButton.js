import { CONFIG } from '@config/config';
import { SELECTORS, IDS } from '@config/constants';
import { Logger } from '@utils/utils';

/**
 * Provides a custom scroll-to-bottom button for improved UX.
 */
export class ScrollButton {
  /**
   * @param {Object} chatManager - Instance of VirtualChatManager.
   * @param {Object} scrollManager - Instance of ScrollManager.
   */
  constructor(chatManager, scrollManager) {
    this.chatManager = chatManager;
    this.scrollManager = scrollManager;
    this.button = null;
    this.container = null;
    this.nativeButtonRetryCount = 0;
  }

  /**
   * Initializes the custom scroll button by cloning the native button.
   * Retries if the conversation container or native button is not found.
   */
  init() {
    this.container = this.chatManager.getContainer();
    if (!this.container) {
      Logger.warn('ScrollButton', 'Container not found. Retrying...');
      setTimeout(() => this.init(), 1000);
      return;
    }

    const nativeBtn = document.querySelector(SELECTORS.SCROLL_BUTTON);

    if (!nativeBtn) {
      if (this.nativeButtonRetryCount < 3) {  // Only log up to 3 times
        Logger.warn('ScrollButton', 'Native scroll button not found. Retrying...');
      }
      this.nativeButtonRetryCount++;
      setTimeout(() => this.init(), 1000);
      return;
    }


    nativeBtn.style.display = 'none';

    this.button = nativeBtn.cloneNode(true);
    this.button.id = IDS.CUSTOM_SCROLL_BUTTON;
    this.button.style.display = '';
    this.button.addEventListener('click', this.handleClick.bind(this));
    nativeBtn.parentElement.appendChild(this.button);

    Logger.debug('ScrollButton', 'Custom scroll button injected.');
  }

  /**
   * Handles the click event on the custom scroll button.
   * Rebuilds the message cache and forces scrolling to the bottom.
   * @param {Event} e - The click event.
   */
  handleClick(e) {
    e.preventDefault();
    e.stopPropagation();

    Logger.debug('ScrollButton', 'Button clicked.');

    if (!this.container) return;

    window.disableAutoScroll = true;

    this.chatManager.rebuildMessageCache();
    this.chatManager.updateWindowIndices();
    this.chatManager.resyncDOM(this.container);

    this.scrollManager.forceScrollToBottom(this.container);

    setTimeout(() => {
      window.disableAutoScroll = false;
    }, 1500);
  }

  /**
   * Updates the button's visibility based on the scroll position.
   */
  updateVisibility() {
    if (!this.button || !this.container) return;

    const scrollTop = this.container.scrollTop;
    const clientHeight = this.container.clientHeight;
    const scrollHeight = this.container.scrollHeight;
    const dynamicBottomThreshold = clientHeight * CONFIG.DYNAMIC_BOTTOM_RATIO;
    const nearBottom = (scrollTop + clientHeight) >= (scrollHeight - dynamicBottomThreshold);

    this.button.style.display = nearBottom ? 'none' : '';

    Logger.debug('ScrollButton', `Visibility updated. Near bottom: ${nearBottom}`);
  }

  /**
   * Sets or updates the scrollManager instance.
   * @param {Object} scrollManager - The ScrollManager instance.
   */
  setScrollManager(scrollManager) {
    this.scrollManager = scrollManager;
  }
}
