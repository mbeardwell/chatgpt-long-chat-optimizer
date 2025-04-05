import { SELECTORS } from '@config/constants';
import { Logger } from '@utils/utils';

/**
 * Observes DOM mutations to detect new chat message nodes.
 */
export class MutationWatcher {
  constructor(chatManager, overlayUI) {
    this.chatManager = chatManager;   // Instance of VirtualChatManager
    this.overlay = overlayUI;         // Instance of OverlayUI
    this.observer = null;             // Will hold the MutationObserver instance
  }
  
  /**
   * Starts observing the document for new message nodes.
   * Throws an error if no chatManager is provided.
   */
  start() {
    if (!this.chatManager) {
      throw new Error("MutationWatcher: chatManager is required.");
    }
    
    this.observer = new MutationObserver(this.handleMutations.bind(this));
    this.observer.observe(document.body, { childList: true, subtree: true });
    Logger.debug('MutationWatcher', 'Observer started.');
  }

  #rebuildCacheAndDOM() {
    this.chatManager.rebuildMessageCache();
    this.chatManager.updateWindowIndices();
    this.chatManager.resyncDOM();
  }
  
  #updateOverlay() {
    if (this.overlay?.visible) {
      this.overlay.update(this.chatManager.getLoadedStats());
    }
  }

  /**
   * Handles DOM mutations by checking for new message nodes.
   * If new nodes are detected, the message cache is rebuilt.
   * @param {MutationRecord[]} mutations - Array of mutation records.
   */
  handleMutations(mutations) {
    let newMessagesFound = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        
        if (node.matches?.(SELECTORS.CONVERSATION_TURN)) {
          // If node is a message -> add it
          newMessagesFound ||= this.chatManager.addNewNode(node);
        } else {
          // If node contains messages -> add them
          const articles = node.querySelectorAll?.(SELECTORS.CONVERSATION_TURN) || [];
          articles.forEach(
            article => newMessagesFound ||= this.chatManager.addNewNode(article)
          );
        }
      }
    }
    
    if (newMessagesFound) {
      Logger.debug('MutationWatcher', 'New messages detected. Rebuilding cache.');
      this.#rebuildCacheAndDOM();
      this.#updateOverlay();
    }
  }

  /**
   * Stops observing DOM mutations.
   */
  stop() {
    this.observer?.disconnect();
    Logger.debug('MutationWatcher', 'Observer stopped.');
  }
}
