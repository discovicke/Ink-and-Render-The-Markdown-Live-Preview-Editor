'use strict';

/**
 * =============================================================================
 * TOOLBAR MODULE
 * =============================================================================
 * Handles the editor toolbar buttons including copy, clear, reset, and download.
 * =============================================================================
 */

import { copyMarkdownToClipboard } from '../utils/clipboard.js';
import { saveMarkdownText } from '../utils/storage.js';

/**
 * Sets up the copy button functionality.
 *
 * @param {HTMLButtonElement} copyButton - The copy button element
 * @param {HTMLTextAreaElement} textarea - The textarea to copy from
 */
export function setupCopyButton(copyButton, textarea) {
    if (!copyButton) return;

    copyButton.addEventListener('click', (event) => {
        event.preventDefault();
        copyMarkdownToClipboard(textarea);
    });
}

/**
 * Sets up the clear button functionality.
 * Prompts for confirmation before clearing.
 *
 * @param {HTMLButtonElement} clearButton - The clear button element
 * @param {HTMLTextAreaElement} textarea - The textarea to clear
 * @param {HTMLElement} outputText - The preview content element
 * @param {HTMLElement} mirrorHighlight - The mirror highlight element
 * @param {Function} onClear - Callback to run after clearing
 */
export function setupClearButton(clearButton, textarea, outputText, mirrorHighlight, onClear) {
    if (!clearButton) return;

    clearButton.addEventListener('click', (event) => {
        event.preventDefault();

        if (!textarea.value.trim()) return;

        const confirmed = window.confirm('Är du säker på att du vill rensa din markdowntext?');
        if (!confirmed) return;

        textarea.value = '';
        outputText.innerHTML = '';
        mirrorHighlight.innerHTML = '';
        saveMarkdownText('');

        if (onClear) onClear();
    });
}

/**
 * Sets up the reset button functionality.
 * Loads the markdown guide template.
 *
 * @param {HTMLButtonElement} resetButton - The reset button element
 * @param {HTMLTextAreaElement} textarea - The textarea to reset
 * @param {string} template - The template to load
 * @param {Function} parseMarkdown - Function to parse markdown
 * @param {HTMLElement} outputText - The preview content element
 * @param {Function} onReset - Callback to run after reset
 */
export function setupResetButton(resetButton, textarea, template, parseMarkdown, outputText, onReset) {
    if (!resetButton) return;

    resetButton.addEventListener('click', (event) => {
        event.preventDefault();

        textarea.value = template;
        outputText.innerHTML = parseMarkdown(textarea.value);
        saveMarkdownText(template);

        if (onReset) onReset();
    });
}

/**
 * Sets up the download button functionality.
 * Downloads the current markdown as a .md file.
 *
 * @param {HTMLButtonElement} downloadButton - The download button element
 * @param {HTMLTextAreaElement} textarea - The textarea with content to download
 */
export function setupDownloadButton(downloadButton, textarea) {
    if (!downloadButton) return;

    downloadButton.addEventListener('click', (event) => {
        event.preventDefault();

        const content = textarea.value;
        const blob = new Blob([content], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'document.md';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    });
}

/**
 * Updates the clear button disabled state based on content.
 *
 * @param {HTMLButtonElement} clearButton - The clear button element
 * @param {HTMLTextAreaElement} textarea - The textarea to check
 */
export function updateClearButtonState(clearButton, textarea) {
    if (!clearButton) return;
    clearButton.disabled = !textarea.value.trim();
}
