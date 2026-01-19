'use strict';

/**
 * =============================================================================
 * SYNC SCROLL MODULE
 * =============================================================================
 * Handles synchronized scrolling between the markdown editor and preview pane.
 * Uses percentage-based scrolling for proportional synchronization.
 * =============================================================================
 */

/**
 * Synchronizes scroll position between two elements.
 * Uses flags to prevent infinite scroll loops.
 *
 * @param {HTMLElement} from - The element being scrolled
 * @param {HTMLElement} to - The element to sync scroll to
 * @param {{value: boolean}} fromFlag - Flag to track if this element initiated scroll
 * @param {{value: boolean}} toFlag - Flag to track if the other element initiated scroll
 * @param {boolean} isEnabled - Whether sync scroll is enabled
 */
export function syncScroll(from, to, fromFlag, toFlag, isEnabled) {
    if (!isEnabled) return;
    if (toFlag.value) return;

    fromFlag.value = true;

    const fromScrollHeight = from.scrollHeight - from.clientHeight;
    const toScrollHeight = to.scrollHeight - to.clientHeight;

    const ratio = fromScrollHeight > 0
        ? from.scrollTop / fromScrollHeight
        : 0;

    to.scrollTop = ratio * toScrollHeight;

    requestAnimationFrame(() => {
        fromFlag.value = false;
    });
}

/**
 * Creates scroll sync flags for tracking scroll state.
 *
 * @returns {{markdown: {value: boolean}, preview: {value: boolean}}}
 */
export function createScrollFlags() {
    return {
        markdown: { value: false },
        preview: { value: false }
    };
}
