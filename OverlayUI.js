import { CONFIG } from './config.js';

/**
 * Manages the debug overlay that displays runtime statistics.
 */
export class OverlayUI {
  constructor() {
    this.overlay = null;
    this.visible = false;
    this.key = 'overlayVisible';
  }

  /**
   * Initializes the overlay element and appends it to the document.
   */
  init() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'tm-debug-overlay';
    Object.assign(this.overlay.style, {
      position: 'fixed',
      top: '10px',
      left: '10px',
      zIndex: '2147483647',
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      color: '#fff',
      padding: '8px 12px',
      fontSize: '14px',
      fontFamily: 'monospace',
      borderRadius: '4px',
      pointerEvents: 'none',
      whiteSpace: 'pre-line',
    });

    document.body.appendChild(this.overlay);

    // Set initial visibility based on localStorage value.
    const storedState = localStorage.getItem(this.key);
    if (storedState === 'true') {
      this.show();
    } else {
      this.hide();
    }

    if (CONFIG.DEBUG) console.log('[OverlayUI] Debug overlay initialised.');
  }

  /**
   * Updates the overlay content with the provided statistics.
   * @param {Object} stats - Contains visible, total, scrollTop, clientHeight, and scrollHeight.
   */
  update(stats) {
    if (!this.overlay || !this.visible) return;

    const { visible = 0, total = 0, scrollTop = 0, clientHeight = 0, scrollHeight = 0 } = stats;
    this.overlay.innerText =
      `Messages: ${visible} / ${total}\n` +
      `scrollTop: ${scrollTop.toFixed(0)}\n` +
      `clientHeight: ${clientHeight.toFixed(0)}\n` +
      `scrollHeight: ${scrollHeight.toFixed(0)}`;
  }

  /**
   * Shows the overlay.
   */
  show() {
    if (this.overlay) this.overlay.style.display = 'block';
    this.visible = true;
    localStorage.setItem(this.key, 'true');
  }

  /**
   * Hides the overlay.
   */
  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
    this.visible = false;
    localStorage.setItem(this.key, 'false');
  }

  /**
   * Toggles the overlay's visibility.
   */
  toggle() {
    this.visible ? this.hide() : this.show();
    if (CONFIG.DEBUG) console.log(`[OverlayUI] Visibility toggled: ${this.visible}`);
  }
}
