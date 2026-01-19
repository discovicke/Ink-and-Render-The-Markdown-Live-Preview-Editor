'use strict';

/**
 * =============================================================================
 * RESIZE HANDLE MODULE
 * =============================================================================
 * Handles the resizable split view between editor and preview panels.
 * Allows users to drag to resize panels and double-click to reset.
 * =============================================================================
 */

/**
 * Sets up the resize handle for the split view.
 *
 * @param {HTMLElement} resizeHandle - The resize handle element
 * @param {HTMLElement} markdown - The markdown editor section
 * @param {HTMLElement} preview - The preview section
 * @param {Function} refreshLayout - Callback to refresh layout after resize
 * @returns {{isResizing: boolean, userResized: boolean}} State object
 */
export function setupResizeHandle(resizeHandle, markdown, preview, refreshLayout) {
    const state = {
        isResizing: false,
        userResized: false
    };

    if (!resizeHandle) return state;

    // Start resizing on mousedown
    resizeHandle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        state.isResizing = true;
        state.userResized = true;
        document.body.style.userSelect = 'none';
    });

    // Handle resize on mousemove
    window.addEventListener('mousemove', (e) => {
        if (!state.isResizing) return;

        const mainRect = document.querySelector('main').getBoundingClientRect();
        const minWidth = 150;

        let newMarkdownWidth = e.clientX - mainRect.left;
        let newPreviewWidth = mainRect.right - e.clientX;

        if (newMarkdownWidth < minWidth || newPreviewWidth < minWidth) return;

        markdown.style.flex = '0 0 auto';
        preview.style.flex = '0 0 auto';

        markdown.style.width = newMarkdownWidth + 'px';
        preview.style.width = newPreviewWidth + 'px';

        if (refreshLayout) refreshLayout();
    });

    // Stop resizing on mouseup
    window.addEventListener('mouseup', () => {
        if (!state.isResizing) return;
        state.isResizing = false;
        document.body.style.userSelect = '';
        if (refreshLayout) refreshLayout();
    });

    // Reset on double-click
    resizeHandle.addEventListener('dblclick', (e) => {
        e.preventDefault();

        markdown.style.width = '';
        preview.style.width = '';

        markdown.style.flex = '1 1 0';
        preview.style.flex = '1 1 0';

        state.userResized = false;
        if (refreshLayout) refreshLayout();
    });

    return state;
}
