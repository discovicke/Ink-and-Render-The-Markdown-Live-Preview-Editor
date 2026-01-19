'use strict';

/**
 * =============================================================================
 * VIEW MODE MODULE
 * =============================================================================
 * Manages the editor/preview view modes (markdown only, both, preview only).
 * Handles layout switching and persistence.
 * =============================================================================
 */

import { saveViewMode } from '../utils/storage.js';

/**
 * Sets the current view mode and updates the UI accordingly.
 *
 * @param {string} mode - The view mode ('markdown', 'both', or 'preview')
 * @param {HTMLElement} markdown - The markdown editor section
 * @param {HTMLElement} preview - The preview section
 * @param {boolean} userResized - Whether the user has manually resized panels
 * @param {Function} refreshLayout - Callback to refresh the layout
 * @param {Function} updateViewIcons - Callback to update view icons
 */
export function setViewMode(mode, markdown, preview, userResized, refreshLayout, updateViewIcons) {
    document.body.classList.remove('view-markdown', 'view-both', 'view-preview');
    document.body.classList.add(`view-${mode}`);
    saveViewMode(mode);

    if (updateViewIcons) {
        updateViewIcons(mode);
    }

    if (mode === 'both') {
        if (!userResized) {
            markdown.style.width = '';
            preview.style.width = '';
            markdown.style.flex = '1 1 0';
            preview.style.flex = '1 1 0';
        } else {
            markdown.style.flex = '0 0 auto';
            preview.style.flex = '0 0 auto';
        }
    } else if (mode === 'markdown') {
        markdown.style.width = '';
        markdown.style.flex = '1 1 0';
        preview.style.width = '';
        preview.style.flex = '';
    } else if (mode === 'preview') {
        preview.style.width = '';
        preview.style.flex = '1 1 0';
        markdown.style.width = '';
        markdown.style.flex = '';
    }

    // Allow the DOM to settle then refresh layout
    if (refreshLayout) {
        setTimeout(refreshLayout, 0);
    }
}

/**
 * Updates view mode button icons to reflect the current mode.
 *
 * @param {string} activeMode - The currently active view mode
 * @param {Array<HTMLElement>} viewButtons - Array of view mode buttons
 */
export function updateViewIcons(activeMode, viewButtons) {
    if (!viewButtons || !viewButtons.length) return;

    viewButtons.forEach((btn) => {
        const mode = btn.getAttribute('data-view');
        const iconBase = btn.getAttribute('data-icon');
        const img = btn.querySelector('svg');
        if (!img || !iconBase) return;

        const isActive = mode === activeMode;
        const fileName = isActive
            ? `${iconBase}(select).svg`
            : `${iconBase}.svg`;
        img.src = `./icons/${fileName}`;
    });
}

/**
 * Sets up view switch button event listeners.
 *
 * @param {HTMLElement} viewSwitch - The view switch container element
 * @param {HTMLElement} markdown - The markdown editor section
 * @param {HTMLElement} preview - The preview section
 * @param {boolean} userResized - Whether user has resized panels
 * @param {Function} refreshLayout - Layout refresh callback
 * @param {Array<HTMLElement>} viewButtons - View mode buttons
 */
export function setupViewSwitch(viewSwitch, markdown, preview, userResized, refreshLayout, viewButtons) {
    if (!viewSwitch) return;

    viewSwitch.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-view]');
        if (!btn) return;
        const mode = btn.getAttribute('data-view');
        setViewMode(mode, markdown, preview, userResized, refreshLayout,
            (m) => updateViewIcons(m, viewButtons));
    });
}
