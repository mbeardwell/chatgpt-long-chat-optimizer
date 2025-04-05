import { CONFIG } from '@config/config';

/**
 * Retrieves a unique identifier for a DOM node.
 * If the node does not have a data-testid attribute, a fallback ID is generated,
 * logged (if debugging is enabled), and assigned to the node.
 *
 * @param {Element} node - The DOM element for which to obtain an ID.
 * @returns {string} The node's unique identifier.
 */
export function getNodeId(node) {
  let id = node.dataset.testid;
  if (!id) {
    id = `fallback-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    Logger.warn('utils', 'Missing testid for node. Generated fallback ID:', id);
    node.dataset.testid = id;
  }
  return id;
}

/**
 * Debug-only logger that outputs a message to the console.
 */
export class Logger {
  static debug(tag, ...args) {
    if (CONFIG.DEBUG) console.log(`[${tag}]`, ...args);
  }
  
  static error(tag, ...args) {
    if (CONFIG.DEBUG) console.error(`[${tag}]`, ...args);
  }
  
  static warn(tag, ...args) {
    if (CONFIG.DEBUG) console.warn(`[${tag}]`, ...args);
  }
}
