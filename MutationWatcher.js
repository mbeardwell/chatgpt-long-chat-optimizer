import { CONFIG } from './config.js';

/**
 * Observes DOM mutations to detect new chat message nodes.
 */
export class MutationWatcher {
  constructor(chatManager) {
    this.chatManager = chatManager;  // Instance of VirtualChatManager
    this.observer = null;            // Will hold the MutationObserver instance
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
    if (CONFIG.DEBUG) console.log('[MutationWatcher] Observer started.');
  }

  /**
   * Handles DOM mutations by checking for new message nodes.
   * If new nodes are detected, the message cache is rebuilt.
   * @param {MutationRecord[]} mutations - Array of mutation records.
   */
  handleMutations(mutations) {
    let added = false;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        // Check if the node itself is a message
        if (node.matches?.('article[data-testid^="conversation-turn"]')) {
          added ||= this.chatManager.addNewNode(node);
        }

        // Check for message nodes in the subtree of the added node
        const articles = node.querySelectorAll?.('article[data-testid^="conversation-turn"]') || [];
        for (const article of articles) {
          added ||= this.chatManager.addNewNode(article);
        }
      }
    }
    if (added) {
      if (CONFIG.DEBUG) console.log('[MutationWatcher] New messages detected. Rebuilding cache.');
      this.chatManager.rebuildMessageCache();
      this.chatManager.updateWindowIndices();
      this.chatManager.resyncDOM();
    }
  }

  /**
   * Stops observing DOM mutations.
   */
  stop() {
    this.observer?.disconnect();
    if (CONFIG.DEBUG) console.log('[MutationWatcher] Observer stopped.');
  }
}
