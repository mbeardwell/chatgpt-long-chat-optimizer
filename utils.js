import { CONFIG } from './config.js';

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
    if (CONFIG.DEBUG) {
      console.warn('[Utils] Missing testid for node. Generated fallback ID:', id);
    }
    node.dataset.testid = id;
  }
  return id;
}
