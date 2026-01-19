'use strict';

/**
 * =============================================================================
 * CLIPBOARD MODULE
 * =============================================================================
 * Handles clipboard operations for copying markdown and code content.
 * =============================================================================
 */

/**
 * Copies text to the clipboard using the modern Clipboard API.
 * Falls back gracefully if the API is not available.
 *
 * @param {string} text - The text to copy to clipboard
 * @returns {Promise<boolean>} True if copy was successful
 */
export async function copyToClipboard(text) {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
        console.warn('Clipboard API not available');
        return false;
    }

    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        console.error('Failed to copy to clipboard:', err);
        return false;
    }
}

/**
 * Copies markdown content from a textarea to clipboard.
 *
 * @param {HTMLTextAreaElement} textarea - The textarea element
 * @returns {Promise<boolean>} True if copy was successful
 */
export async function copyMarkdownToClipboard(textarea) {
    if (!textarea) return false;
    const text = textarea.value || '';
    return copyToClipboard(text);
}

/**
 * Sets up code copy button functionality in the preview pane.
 * Handles the copy button click, decodes HTML entities, and provides
 * visual feedback.
 *
 * @param {HTMLElement} previewPane - The preview pane element
 */
export function setupCodeCopyButtons(previewPane) {
    previewPane.addEventListener('click', async (e) => {
        const btn = e.target.closest('.code-copy-btn');
        if (!btn) return;

        const code = btn.getAttribute('data-code')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");

        const success = await copyToClipboard(code);

        if (success) {
            btn.textContent = 'COPIED';
            setTimeout(() => { btn.textContent = 'COPY'; }, 1000);
        }
    });
}
